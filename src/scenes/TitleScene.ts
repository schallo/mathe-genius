// Title (GAME_DESIGN §9): closed curtains, her character on stage, "SPIELEN".
import { Character } from '../art/character/Character'
import { DEFAULT_LOOK } from '../art/character/look'
import { Pet } from '../art/pets/Pet'
import { STAGE_FLOOR_Y, ensureStageTexture } from '../art/stage'
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
    this.add.image(0, 0, ensureStageTexture(this, { open: false })).setOrigin(0)
    addText(this, GAME_WIDTH / 2, 64, texts.title.name, 'title', 32, 'cream')

    const save = getSave()
    this.hero = new Character(this, 90, STAGE_FLOOR_Y, save.character?.look ?? DEFAULT_LOOK)
    this.hero.setScale(2)
    const pet = activePet(save)
    if (pet) this.pet = new Pet(this, 122, STAGE_FLOOR_Y, pet.species).setScale(2)
    if (save.character) {
      new LabelPill(this, GAME_WIDTH / 2, 120, texts.title.hello(save.character.name), { size: 8 })
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
  }

  update(_time: number, delta: number) {
    this.hero.tick(delta)
    this.pet?.tick(delta)
  }
}
