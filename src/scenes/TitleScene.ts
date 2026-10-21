// Title (GAME_DESIGN §9): beach of her island, her character and pet on the sand, "SPIELEN".
import { Character } from '../art/character/Character'
import { DEFAULT_LOOK } from '../art/character/look'
import { icon } from '../art/icons'
import { Pet } from '../art/pets/Pet'
import { BEACH_FLOOR_Y, ensureBeachTexture } from '../art/beach'
import { texts } from '../data/texts'
import { GAME_WIDTH } from '../display'
import { activePet } from '../state/save'
import { getSave } from '../state/store'
import { Key } from '../ui/Key'
import { LabelPill } from '../ui/LabelPill'
import { addText } from '../ui/text'
import { PixelScene } from './PixelScene'

export class TitleScene extends PixelScene {
  private hero!: Character
  private pet?: Pet

  constructor() {
    super('Title')
  }

  create() {
    this.setupCamera()
    this.add.image(0, 0, ensureBeachTexture(this)).setOrigin(0)
    addText(this, GAME_WIDTH / 2, 80, texts.title.name, 'title', 34)
    addText(this, GAME_WIDTH / 2, 102, texts.title.subtitle, 'label', 6)

    const save = getSave()
    this.hero = new Character(this, 90, BEACH_FLOOR_Y, save.character?.look ?? DEFAULT_LOOK)
    this.hero.setScale(2)
    const pet = activePet(save)
    if (pet) this.pet = new Pet(this, 122, BEACH_FLOOR_Y, pet.species).setScale(2)
    if (save.character) {
      new LabelPill(this, GAME_WIDTH / 2, 136, texts.title.hello(save.character.name), { size: 8 })
    }

    const play = new Key(
      this,
      GAME_WIDTH / 2 - 45,
      262,
      90,
      30,
      texts.title.play,
      () => this.goTo(save.character ? 'Village' : 'CharacterCreate'),
      { fill: 'gold', label: true, fontSize: 10 },
    )
    play.setName('play')

    // Parent area: small lock in the corner, behind a grown-up question
    const lock = this.add.image(14, 346, icon(this, 'lock'), 'icon').setAlpha(0.7)
    this.add
      .zone(lock.x, lock.y, 24, 24)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this.goTo('Parent'))
  }

  update(_time: number, delta: number) {
    this.hero.tick(delta)
    this.pet?.tick(delta)
  }
}
