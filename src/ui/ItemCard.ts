// Item card (STYLE_GUIDE §9 "Shop & wardrobe"): cream card with ink outline, pixel
// preview on top, uppercase name, price with a coin – or "Noch 40" when she can't
// afford it yet (it should look like a goal, not a locked door).
import type Phaser from 'phaser'
import { Character } from '../art/character/Character'
import type { CharacterLook } from '../art/character/look'
import { icon, type IconName } from '../art/icons'
import { Pet } from '../art/pets/Pet'
import type { Item } from '../data/items'
import { tryOn } from '../state/shop'
import { Key } from './Key'
import { addText } from './text'

export const CARD_W = 54
export const CARD_H = 60

export type CardPrice =
  | { kind: 'price'; coins: number; stars?: number }
  | { kind: 'missing'; coins: number }
  | { kind: 'owned' }
  | { kind: 'text'; text: string }

export class ItemCard extends Key {
  readonly item: Item
  private priceRow: Phaser.GameObjects.GameObject[] = []

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    item: Item,
    look: CharacterLook,
    onPress: () => void,
  ) {
    super(scene, x, y, CARD_W, CARD_H, '', onPress)
    this.item = item
    this.add(itemPreview(scene, item, look))
    this.add(addText(scene, CARD_W / 2, 41, item.name, 'label', 4.5))
  }

  setPrice(price: CardPrice): this {
    for (const o of this.priceRow) o.destroy()
    const y = 51
    if (price.kind === 'price' && price.stars) {
      // Star item: stars and coins side by side
      const star = this.scene.add.image(CARD_W / 2 - 21, y, icon(this.scene, 'star'), 'icon')
      const stars = addText(this.scene, CARD_W / 2 - 12, y, String(price.stars), 'title', 12)
      const coin = this.scene.add.image(CARD_W / 2 + 1, y, icon(this.scene, 'coin'), 'icon')
      const text = addText(this.scene, CARD_W / 2 + 14, y, String(price.coins), 'title', 12)
      this.priceRow = [star, stars, coin, text]
    } else if (price.kind === 'price') {
      const coin = this.scene.add.image(CARD_W / 2 - 8, y, icon(this.scene, 'coin'), 'icon')
      const text = addText(this.scene, CARD_W / 2 + 4, y, String(price.coins), 'title', 12)
      this.priceRow = [coin, text]
    } else {
      const label =
        price.kind === 'missing'
          ? `Noch ${price.coins}`
          : price.kind === 'owned'
            ? '✓ Deins'
            : price.text
      this.priceRow = [addText(this.scene, CARD_W / 2, y, label, 'label', 4.5)]
    }
    this.add(this.priceRow)
    return this
  }
}

/** Small picture of an item: her mini character wearing it, the pet, or an icon. */
export function itemPreview(
  scene: Phaser.Scene,
  item: Item,
  look: CharacterLook,
): Phaser.GameObjects.GameObject {
  if (item.species) return new Pet(scene, CARD_W / 2, 32, item.species).setScale(2)
  if (item.wear) return new Character(scene, CARD_W / 2, 33, tryOn(look, item))
  return scene.add
    .image(CARD_W / 2, 20, icon(scene, (item.icon ?? 'star') as IconName), 'icon')
    .setScale(2)
}
