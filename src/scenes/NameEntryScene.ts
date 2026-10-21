// Name entry (GAME_DESIGN §5 "Naming", STYLE_GUIDE §9 "Name entry"): German QWERTZ
// on-screen keyboard with Ä Ö Ü ß, LEERTASTE, ⌫, ZUFALL and a gold FERTIG key.
// The physical keyboard works too. The name grows on a big pill above the head.
import { Character } from '../art/character/Character'
import type { CharacterLook } from '../art/character/look'
import { Pet } from '../art/pets/Pet'
import { ensureStageTexture } from '../art/stage'
import { SPECIES, type SpeciesId } from '../data/creatures'
import { texts } from '../data/texts'
import { GAME_WIDTH } from '../display'
import { backspace, finishName, randomName, typeKey } from '../state/names'
import { addPet } from '../state/save'
import { updateSave } from '../state/store'
import { Caption } from '../ui/Caption'
import { Key } from '../ui/Key'
import { LabelPill } from '../ui/LabelPill'
import { addText } from '../ui/text'
import { PixelScene } from './PixelScene'

type Data =
  | { mode: 'character'; look: CharacterLook }
  | { mode: 'pet'; species: SpeciesId; look?: CharacterLook }

const FLOOR_Y = 200
const KEY_W = 15
const KEY_H = 22
const ROWS_Y = [238, 263, 288, 313]
const LETTER_ROWS = ['QWERTZUIOPÜ', 'ASDFGHJKLÖÄ', 'YXCVBNMß-']

export class NameEntryScene extends PixelScene {
  private entry!: Data
  private name = ''
  private pill?: LabelPill
  private pillY = 0
  private cursorOn = true
  private hero?: Character
  private pet?: Pet
  private caption!: Caption

  constructor() {
    super('NameEntry')
  }

  init(data: Data) {
    this.entry = data
    this.name = ''
  }

  create() {
    this.setupCamera()
    this.add.image(0, 0, ensureStageTexture(this, { floorY: FLOOR_Y })).setOrigin(0)
    const species = this.entry.mode === 'pet' ? SPECIES[this.entry.species].name : ''
    const question =
      this.entry.mode === 'pet' ? texts.names.askPet(species) : texts.names.askCharacter
    addText(this, GAME_WIDTH / 2, 24, question, 'title', 18, 'cream')
      .setWordWrapWidth(170)
      .setAlign('center')

    if (this.entry.mode === 'pet') {
      this.pet = new Pet(this, 90, FLOOR_Y, this.entry.species).setScale(3)
      this.pillY = FLOOR_Y - 36 - 14
      this.time.addEvent({ delay: 1200, loop: true, callback: () => this.pet?.hop() })
    } else {
      this.hero = new Character(this, 90, FLOOR_Y, this.entry.look).setScale(3)
      this.pillY = FLOOR_Y - 66 - 14
    }
    this.renderName()
    this.time.addEvent({
      delay: 500,
      loop: true,
      callback: () => {
        this.cursorOn = !this.cursorOn
        this.renderName()
      },
    })

    this.buildKeyboard()
    this.caption = new Caption(this)
    this.input.keyboard!.on('keydown', (e: KeyboardEvent) => {
      if (e.key === 'Backspace') this.setName(backspace(this.name))
      else if (e.key === 'Enter') this.done()
      else if (e.key.length === 1) this.setName(typeKey(this.name, e.key))
    })
  }

  private buildKeyboard() {
    LETTER_ROWS.forEach((letters, row) => {
      ;[...letters].forEach((letter, i) => {
        new Key(this, 2 + i * (KEY_W + 1), ROWS_Y[row], KEY_W, KEY_H, letter, () =>
          this.setName(typeKey(this.name, letter.toLowerCase())),
        )
      })
    })
    const backX = 2 + 9 * (KEY_W + 1)
    new Key(this, backX, ROWS_Y[2], 176 - backX + 2, KEY_H, '⌫', () =>
      this.setName(backspace(this.name)),
    )
    const y = ROWS_Y[3]
    new Key(
      this,
      2,
      y,
      54,
      KEY_H,
      texts.names.random,
      () => this.setName(randomName(Math.random, this.name)),
      {
        label: true,
      },
    )
    new Key(
      this,
      57,
      y,
      66,
      KEY_H,
      texts.names.space,
      () => this.setName(typeKey(this.name, ' ')),
      {
        label: true,
      },
    )
    new Key(this, 124, y, 54, KEY_H, texts.names.done, () => this.done(), {
      label: true,
      fill: 'gold',
    })
  }

  private setName(name: string) {
    this.name = name
    this.cursorOn = true
    this.renderName()
  }

  private renderName() {
    this.pill?.destroy()
    const text = this.name + (this.cursorOn ? '_' : ' ')
    this.pill = new LabelPill(this, GAME_WIDTH / 2, this.pillY, text, { size: 9 })
  }

  private done() {
    const name = finishName(this.name)
    if (!name) {
      this.caption.show(texts.names.empty)
      return
    }
    if (this.entry.mode === 'character') {
      const look = this.entry.look
      updateSave((save) => ({ ...save, character: { name, look } }))
      this.goTo('StarterPet')
    } else {
      const species = this.entry.species
      updateSave((save) => addPet(save, species, name))
      this.goTo('Village')
    }
  }

  update(_time: number, delta: number) {
    this.hero?.tick(delta)
    this.pet?.tick(delta)
  }
}
