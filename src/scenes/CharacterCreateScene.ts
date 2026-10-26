// Character creation (GAME_DESIGN §5): girl or boy, skin, hairstyle, hair colour, outfit
// colours, bow. Her own look is preselected. Tapping the preview turns the character around.
// Girl or boy only picks the starting look – every item fits everyone later.
import { Character } from '../art/character/Character'
import type { HairStyle } from '../art/character/hair'
import {
  DEFAULT_BOY_LOOK,
  DEFAULT_LOOK,
  accessoryShades,
  hairShades,
  outfitShades,
  skinShades,
  type CharacterLook,
} from '../art/character/look'
import { ensureCharacterTextures, textureKeys } from '../art/character/textures'
import { ensureStageTexture } from '../art/stage'
import { ITEMS } from '../data/items'
import { texts } from '../data/texts'
import { GAME_WIDTH } from '../display'
import type { PaletteToken } from '../palette'
import { getSave } from '../state/store'
import { Key } from '../ui/Key'
import { LabelPill } from '../ui/LabelPill'
import { addText } from '../ui/text'
import { PixelScene } from './PixelScene'

const FLOOR_Y = 118
const ROW_Y = [124, 152, 180, 208, 236, 264]
/** Colours offered here (more are in Mein Haus) */
const CREATE_COLORS = 5
const SWATCH = 22
const FIRST_X = 52
const TURN: ('down' | 'right' | 'up' | 'left')[] = ['down', 'right', 'up', 'left']

type Option = {
  fill: PaletteToken
  apply: (look: CharacterLook) => CharacterLook
  icon?: string
  /** Word key (Mädchen / Junge) instead of a swatch */
  caption?: string
}
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

  init(data: { editing?: boolean; look?: CharacterLook }) {
    this.editing = data.editing ?? false
    this.look = data.look ?? getSave().character?.look ?? DEFAULT_LOOK
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
      only = Object.keys(shades) as K[],
    ): Row['options'] =>
      only.map((value) => ({
        fill: shades[value].fill,
        apply: (look) => ({ ...look, [key]: value }),
      }))
    const first = <K extends string>(shades: Record<K, unknown>) =>
      (Object.keys(shades) as K[]).slice(0, CREATE_COLORS)
    const boy = this.look.figure === 'junge'
    // Girl or boy: a fresh starting look, keeping skin and hair colour
    const figure = (start: CharacterLook) => (look: CharacterLook) =>
      look.figure === start.figure ? look : { ...start, skin: look.skin, hairColor: look.hairColor }
    // Only the starter hairstyles; more are in the Laden
    const styles = ITEMS.filter((i) => i.starter && i.wear?.hair).map((i) => i.wear!.hair!)
    const outfitColors = first(outfitShades)
    const trouserColors = ['jeans', 'braun', 'grau', 'terrakotta', 'himmel'] as const
    const bowColors = first(accessoryShades).slice(0, 4)
    return [
      {
        label: texts.create.figure,
        options: [
          { fill: 'cream', apply: figure(DEFAULT_LOOK), caption: texts.create.girl },
          { fill: 'cream', apply: figure(DEFAULT_BOY_LOOK), caption: texts.create.boy },
        ],
        selected: (l) => (l.figure === 'junge' ? 1 : 0),
      },
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
        label: boy ? texts.create.shirt : texts.create.dress,
        options: swatches(outfitShades, 'outfitColor', outfitColors),
        selected: (l) => outfitColors.indexOf(l.outfitColor),
      },
      boy
        ? {
            label: texts.create.trousers,
            options: swatches(outfitShades, 'outfitColor2', [...trouserColors]),
            selected: (l) => (trouserColors as readonly string[]).indexOf(l.outfitColor2),
          }
        : {
            label: texts.create.bow,
            options: [
              ...swatches(accessoryShades, 'accessoryColor', bowColors).map((o) => ({
                ...o,
                apply: (look: CharacterLook) => ({
                  ...o.apply(look),
                  accessory: 'schleife' as const,
                }),
              })),
              { fill: 'cream', apply: (look) => ({ ...look, accessory: null }) },
            ],
            selected: (l) =>
              l.accessory === null ? bowColors.length : bowColors.indexOf(l.accessoryColor),
          },
    ]
  }

  private addRow(row: Row, y: number) {
    new LabelPill(this, 26, y + SWATCH / 2, row.label, { size: 5 })
    const keys = row.options.map((option, i) => {
      const w = option.caption ? 56 : SWATCH
      const key = new Key(this, FIRST_X + i * (w + 3), y, w, SWATCH, '', () => {
        const before = this.look.figure
        this.look = option.apply(this.look)
        // Girl ↔ boy changes the rows (Kleid/Schleife or Shirt/Hose): build them again
        if (this.look.figure !== before) {
          this.scene.restart({ editing: this.editing, look: this.look })
          return
        }
        this.preview.setLook(this.look)
        this.refresh()
      })
      key.setFill(option.fill)
      if (option.caption) key.setCaption(option.caption)
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
