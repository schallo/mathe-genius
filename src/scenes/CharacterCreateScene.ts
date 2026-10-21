// Character creation (GAME_DESIGN §5): skin, hairstyle, hair colour, dress, bow.
// Her own look is preselected. Tapping the preview turns her around.
import { Character } from '../art/character/Character'
import { hairstyles, type HairStyle } from '../art/character/hair'
import {
  DEFAULT_LOOK,
  accessoryShades,
  hairShades,
  outfitShades,
  skinShades,
  type CharacterLook,
} from '../art/character/look'
import { ensureCharacterTextures, textureKeys } from '../art/character/textures'
import { ensureStageTexture } from '../art/stage'
import { texts } from '../data/texts'
import { GAME_WIDTH } from '../display'
import type { PaletteToken } from '../palette'
import { getSave } from '../state/store'
import { Key } from '../ui/Key'
import { LabelPill } from '../ui/LabelPill'
import { addText } from '../ui/text'
import { PixelScene } from './PixelScene'

const FLOOR_Y = 118
const ROW_Y = [128, 160, 192, 224, 256]
const SWATCH = 22
const FIRST_X = 52
const TURN: ('down' | 'right' | 'up' | 'left')[] = ['down', 'right', 'up', 'left']

type Option = { fill: PaletteToken; apply: (look: CharacterLook) => CharacterLook; icon?: string }
type Row = { label: string; options: Option[]; selected: (look: CharacterLook) => number }

export class CharacterCreateScene extends PixelScene {
  private look: CharacterLook = DEFAULT_LOOK
  private preview!: Character
  private turn = 0
  private rows: { row: Row; keys: Key[] }[] = []
  private editing = false

  constructor() {
    super('CharacterCreate')
  }

  init(data: { editing?: boolean }) {
    this.editing = data.editing ?? false
    this.look = getSave().character?.look ?? DEFAULT_LOOK
    this.turn = 0
    this.rows = []
  }

  create() {
    this.setupCamera()
    this.add.image(0, 0, ensureStageTexture(this, { floorY: FLOOR_Y })).setOrigin(0)
    addText(this, GAME_WIDTH / 2, 20, texts.create.heading, 'title', 18, 'cream')
    addText(this, GAME_WIDTH / 2, 34, texts.create.hint, 'label', 5, 'cream')

    this.preview = new Character(this, 90, FLOOR_Y, this.look).setScale(3)
    const turnZone = this.add.zone(90 - 24, FLOOR_Y - 66, 48, 66).setOrigin(0)
    turnZone.setInteractive({ useHandCursor: true })
    turnZone.on('pointerdown', () => {
      this.turn = (this.turn + 1) % TURN.length
      this.preview.face(TURN[this.turn])
    })

    for (const [i, row] of this.buildRows().entries()) this.addRow(row, ROW_Y[i])

    new Key(this, GAME_WIDTH / 2 - 40, 300, 80, 28, texts.create.next, () => this.next(), {
      fill: 'gold',
      label: true,
      fontSize: 9,
    })
  }

  private buildRows(): Row[] {
    const swatches = <K extends string>(
      shades: Record<K, { fill: PaletteToken }>,
      key: keyof CharacterLook,
    ): Row['options'] =>
      (Object.keys(shades) as K[]).map((value) => ({
        fill: shades[value].fill,
        apply: (look) => ({ ...look, [key]: value }),
      }))
    const styles = Object.keys(hairstyles) as HairStyle[]
    return [
      {
        label: texts.create.skin,
        options: swatches(skinShades, 'skin'),
        selected: (l) => Object.keys(skinShades).indexOf(l.skin),
      },
      {
        label: texts.create.hair,
        options: styles.map((hair) => ({
          fill: 'cream',
          apply: (look) => ({ ...look, hair }),
          icon: hair,
        })),
        selected: (l) => styles.indexOf(l.hair),
      },
      {
        label: texts.create.hairColor,
        options: swatches(hairShades, 'hairColor'),
        selected: (l) => Object.keys(hairShades).indexOf(l.hairColor),
      },
      {
        label: texts.create.dress,
        options: swatches(outfitShades, 'outfitColor'),
        selected: (l) => Object.keys(outfitShades).indexOf(l.outfitColor),
      },
      {
        label: texts.create.bow,
        options: [
          ...swatches(accessoryShades, 'accessoryColor').map((o) => ({
            ...o,
            apply: (look: CharacterLook) => ({ ...o.apply(look), accessory: 'schleife' as const }),
          })),
          { fill: 'cream', apply: (look) => ({ ...look, accessory: null }) },
        ],
        selected: (l) =>
          l.accessory === null ? 2 : Object.keys(accessoryShades).indexOf(l.accessoryColor),
      },
    ]
  }

  private addRow(row: Row, y: number) {
    new LabelPill(this, 26, y + SWATCH / 2, row.label, { size: 5 })
    const keys = row.options.map((option, i) => {
      const key = new Key(this, FIRST_X + i * (SWATCH + 3), y, SWATCH, SWATCH, '', () => {
        this.look = option.apply(this.look)
        this.preview.setLook(this.look)
        this.refresh()
      })
      key.setFill(option.fill)
      if (option.icon) key.setName(option.icon)
      if (row.label === texts.create.bow && i === row.options.length - 1) key.setCaption('–')
      return key
    })
    this.rows.push({ row, keys })
    this.refresh()
  }

  /** Selection outlines and hairstyle icons in the current hair colour. */
  private refresh() {
    for (const { row, keys } of this.rows) {
      const selected = row.selected(this.look)
      keys.forEach((key, i) => {
        key.setSelected(i === selected)
        if (row.label !== texts.create.hair) return
        const look = { ...this.look, hair: key.name as HairStyle }
        ensureCharacterTextures(this, look)
        key.getByName('icon')?.destroy()
        const icon = this.add.image(SWATCH / 2, 2, textureKeys(look).hair, 'down-0')
        icon.setOrigin(0.5, 0).setName('icon')
        key.add(icon)
      })
    }
  }

  private next() {
    if (this.editing) return this.goTo('Village')
    this.goTo('NameEntry', { mode: 'character', look: this.look })
  }

  update(_time: number, delta: number) {
    this.preview.tick(delta)
  }
}
