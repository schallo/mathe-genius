// Theater hut: the stage where shows will take place (build step 4).
import { Character } from '../art/character/Character'
import { DEFAULT_LOOK } from '../art/character/look'
import { Pet } from '../art/pets/Pet'
import { STAGE_FLOOR_Y, ensureStageTexture } from '../art/stage'
import { texts } from '../data/texts'
import { GAME_HEIGHT, GAME_WIDTH } from '../display'
import { activePet } from '../state/save'
import { getSave } from '../state/store'
import { LabelPill } from '../ui/LabelPill'
import { SpeechCard } from '../ui/SpeechCard'
import { PixelScene } from './PixelScene'

export class ShowScene extends PixelScene {
  private hero!: Character
  private pet?: Pet

  constructor() {
    super('Show')
  }

  create() {
    this.setupCamera()
    this.add.image(0, 0, ensureStageTexture(this)).setOrigin(0)
    new SpeechCard(this, 16, STAGE_FLOOR_Y - 70, 84, 44, texts.show.soon)
    const save = getSave()
    this.hero = new Character(this, 128, STAGE_FLOOR_Y, save.character?.look ?? DEFAULT_LOOK)
    this.hero.face('down').setName(save.character?.name ?? null)
    const pet = activePet(save)
    if (pet) this.pet = new Pet(this, 152, STAGE_FLOOR_Y, pet.species)
    new LabelPill(this, GAME_WIDTH / 2, GAME_HEIGHT - 30, `← ${texts.show.back}`, {
      size: 8,
      onClick: () => this.goTo('Village', { from: 'theater' }),
    })
  }

  update(_time: number, delta: number) {
    this.hero.tick(delta)
    this.pet?.tick(delta)
  }
}
