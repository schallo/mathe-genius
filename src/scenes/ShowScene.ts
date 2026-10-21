// Theater hut: the stage where shows will take place (build step 4).
import { Character } from '../art/character/Character'
import { DEFAULT_LOOK } from '../art/character/look'
import { STAGE_FLOOR_Y, ensureStageTexture } from '../art/stage'
import { texts } from '../data/texts'
import { GAME_HEIGHT, GAME_WIDTH } from '../display'
import { LabelPill } from '../ui/LabelPill'
import { SpeechCard } from '../ui/SpeechCard'
import { PixelScene } from './PixelScene'

export class ShowScene extends PixelScene {
  private hero!: Character

  constructor() {
    super('Show')
  }

  create() {
    this.setupCamera()
    this.add.image(0, 0, ensureStageTexture(this)).setOrigin(0)
    new SpeechCard(this, 16, STAGE_FLOOR_Y - 70, 84, 44, texts.show.soon)
    this.hero = new Character(this, 132, STAGE_FLOOR_Y, DEFAULT_LOOK).face('down')
    new LabelPill(this, GAME_WIDTH / 2, GAME_HEIGHT - 30, `← ${texts.show.back}`, {
      size: 8,
      onClick: () => this.goTo('Village', { from: 'theater' }),
    })
  }

  update(_time: number, delta: number) {
    this.hero.tick(delta)
  }
}
