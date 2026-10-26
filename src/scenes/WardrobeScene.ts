// Mein Haus / Garderobe (GAME_DESIGN §4, §5): wear what she owns, change colours for
// free, rename her character.
import {
  accessoryShades,
  hairShades,
  isTwoTone,
  outfitShades,
  type CharacterLook,
} from '../art/character/look'
import { sfx } from '../audio/sfx'
import { CATEGORY_NAMES, type Item, type ItemCategory } from '../data/items'
import { texts } from '../data/texts'
import type { PaletteToken } from '../palette'
import { isWearing, ownedItems, tryOn } from '../state/shop'
import { getSave, updateSave } from '../state/store'
import { ItemCard } from '../ui/ItemCard'
import { Key } from '../ui/Key'
import { Pager } from '../ui/Pager'
import { Tabs } from '../ui/Tabs'
import { RoomScene, cardPosition } from './RoomScene'

type Tab = Extract<ItemCategory, 'kleider' | 'frisuren' | 'accessoires'>

/** Free colour choices per tab (applied to what she is wearing). */
const COLORS: Record<
  Tab,
  { key: keyof CharacterLook; options: Record<string, { fill: PaletteToken }> }
> = {
  kleider: { key: 'outfitColor', options: outfitShades },
  frisuren: { key: 'hairColor', options: hairShades },
  accessoires: { key: 'accessoryColor', options: accessoryShades },
}

const NONE: Item = {
  id: 'ohne',
  category: 'accessoires',
  name: texts.wardrobe.none,
  price: 0,
  wear: { accessory: null },
}

export class WardrobeScene extends RoomScene {
  protected readonly hutId = 'haus'
  private tab: Tab = 'kleider'
  private cards: ItemCard[] = []
  private swatches: Key[] = []
  private pager!: Pager

  constructor() {
    super('Wardrobe')
  }

  init() {
    this.tab = 'kleider'
    this.cards = []
    this.swatches = []
  }

  create() {
    this.createRoom()
    const tabs: Tab[] = ['kleider', 'frisuren', 'accessoires']
    new Tabs(
      this,
      130,
      tabs.map((id) => ({ id, label: CATEGORY_NAMES[id] })),
      (id) => {
        this.tab = id
        this.pager.reset()
        this.refresh()
      },
    ).select(this.tab)
    this.pager = new Pager(this, 316, () => this.refresh())
    new Key(
      this,
      45,
      316,
      90,
      26,
      texts.wardrobe.rename,
      () => {
        this.goTo('NameEntry', { mode: 'character', look: this.savedLook(), returnTo: 'Wardrobe' })
      },
      { label: true, fontSize: 6 },
    )
    this.refresh()
  }

  private wear(change: (look: CharacterLook) => CharacterLook) {
    updateSave((s) =>
      s.character ? { ...s, character: { ...s.character, look: change(s.character.look) } } : s,
    )
    sfx.tick()
    this.preview.setLook(this.savedLook())
    this.refresh()
  }

  private refresh() {
    for (const o of [...this.cards, ...this.swatches]) o.destroy()
    const look = this.savedLook()
    const items = [
      ...ownedItems(getSave(), this.tab),
      ...(this.tab === 'accessoires' ? [NONE] : []),
    ]
    this.cards = this.pager.slice(items).map((item, i) => {
      const { x, y } = cardPosition(i)
      const card = new ItemCard(this, x, y, item, look, () => this.wear((l) => tryOn(l, item)))
      const wearing = isWearing(look, item)
      card.setPrice({ kind: 'text', text: wearing ? texts.wardrobe.wearing : texts.wardrobe.putOn })
      card.setSelected(wearing)
      return card
    })

    // Colour swatches; a two-tone outfit gets a second row for trousers or skirt
    const { key, options } = COLORS[this.tab]
    const rows: (keyof CharacterLook)[] =
      this.tab === 'kleider' && isTwoTone(look) ? [key, 'outfitColor2'] : [key]
    const values = Object.keys(options)
    const size = rows.length > 1 ? 15 : 18
    const gap = 2
    const x0 = Math.round((180 - values.length * (size + gap) + gap) / 2)
    this.swatches = rows.flatMap((rowKey, r) =>
      values.map((value, i) => {
        const y = rows.length > 1 ? 278 + r * (size + 2) : 284
        const swatch = new Key(this, x0 + i * (size + gap), y, size, size, '', () =>
          this.wear((l) => ({ ...l, [rowKey]: value })),
        )
        swatch.setFill(options[value].fill).setSelected(look[rowKey] === value)
        return swatch
      }),
    )
  }
}
