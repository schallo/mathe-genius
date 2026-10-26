// Laden (GAME_DESIGN §4): category tabs, try on by tapping, buy, set a wish.
import { sfx } from '../audio/sfx'
import { CATEGORY_NAMES, SHOP_CATEGORIES, type Item, type ItemCategory } from '../data/items'
import { texts } from '../data/texts'
import { coinBalance } from '../state/save'
import {
  buy,
  canAfford,
  isOwned,
  missingCoins,
  missingStars,
  setWish,
  shopItems,
  tryOn,
} from '../state/shop'
import { deviceId, getSave, replaceSave, updateSave } from '../state/store'
import { confetti } from '../ui/confetti'
import { ItemCard } from '../ui/ItemCard'
import { Key } from '../ui/Key'
import { Pager } from '../ui/Pager'
import { Tabs } from '../ui/Tabs'
import { RoomScene, cardPosition } from './RoomScene'

export class ShopScene extends RoomScene {
  protected readonly hutId = 'laden'
  private category: ItemCategory = 'kleider'
  private selected?: Item
  private cards: ItemCard[] = []
  private buyKey!: Key
  private wishKey!: Key
  private pager!: Pager

  constructor() {
    super('Shop')
  }

  init() {
    this.category = 'kleider'
    this.selected = undefined
    this.cards = []
  }

  create() {
    this.createRoom()
    new Tabs(
      this,
      130,
      SHOP_CATEGORIES.map((id) => ({ id, label: CATEGORY_NAMES[id] })),
      (id) => {
        this.category = id
        this.pager.reset()
        this.select(undefined)
      },
    ).select(this.category)
    this.pager = new Pager(this, 318, () => this.refresh())

    this.buyKey = new Key(this, 14, 284, 74, 28, texts.shop.buy, () => this.buySelected(), {
      fill: 'gold',
      label: true,
      fontSize: 7,
    })
    this.wishKey = new Key(
      this,
      92,
      284,
      74,
      28,
      `★ ${texts.shop.wish}`,
      () => this.wishSelected(),
      {
        label: true,
        fontSize: 7,
      },
    )

    this.select(undefined)
  }

  private select(item: Item | undefined) {
    this.selected = item
    this.preview.setLook(item ? tryOn(this.savedLook(), item) : this.savedLook())
    if (item && !item.wear) this.pet?.hop()
    this.refresh()
  }

  /** Cards, buttons and coin counter from the current save. */
  private refresh() {
    const save = getSave()
    for (const card of this.cards) card.destroy()
    this.cards = this.pager.slice(shopItems(this.category)).map((item, i) => {
      const { x, y } = cardPosition(i)
      const card = new ItemCard(this, x, y, item, this.savedLook(), () => this.select(item))
      card.setPrice(
        isOwned(save, item)
          ? { kind: 'owned' }
          : canAfford(save, item)
            ? { kind: 'price', coins: item.price, stars: item.starCost }
            : missingStars(save, item) > 0
              ? { kind: 'text', text: texts.shop.missingStarsShort(missingStars(save, item)) }
              : { kind: 'missing', coins: missingCoins(save, item) },
      )
      card.setSelected(item.id === this.selected?.id)
      return card
    })
    const owned = this.selected && isOwned(save, this.selected)
    this.buyKey.setCaption(owned && this.selected?.wear ? texts.shop.wear : texts.shop.buy)
    this.buyKey.setVisible(!!this.selected && !(owned && !this.selected.wear))
    this.wishKey.setVisible(!!this.selected && !owned)
    this.hud.setCoins(coinBalance(save))
  }

  private buySelected() {
    const item = this.selected
    if (!item) return this.caption.show(texts.shop.pick)
    const save = getSave()
    if (isOwned(save, item)) {
      // Already hers: just put it on
      updateSave((s) =>
        s.character
          ? { ...s, character: { ...s.character, look: tryOn(s.character.look, item) } }
          : s,
      )
      return this.refresh()
    }
    const result = buy(save, item, deviceId())
    if (!result.ok) {
      const stars = missingStars(save, item)
      this.caption.show(
        stars > 0 ? texts.shop.missingStars(stars) : texts.shop.missing(missingCoins(save, item)),
      )
      return
    }
    replaceSave({ ...result.save, updatedAt: Date.now() })
    sfx.fanfare()
    confetti(this)
    this.preview.jump()
    this.pet?.hop()
    this.caption.show(texts.shop.bought, 1500)
    this.refresh()
  }

  private wishSelected() {
    const item = this.selected
    if (!item) return
    updateSave((s) => setWish(s, item))
    sfx.pling()
    this.caption.show(texts.shop.wishSet(item.name), 1500)
    this.refresh()
  }
}
