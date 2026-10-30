// Shared layout of the Laden, Mein Haus and Tierheim (STYLE_GUIDE §9 "Shop & wardrobe"):
// top bar with wish bar, a small stage with her character (and pet) in front of
// half-open curtains, cards on the wooden floor, action buttons below.
import { Character } from '../art/character/Character'
import { DEFAULT_LOOK, type CharacterLook } from '../art/character/look'
import { Pet } from '../art/pets/Pet'
import { ensureStageTexture } from '../art/stage'
import { activePet } from '../state/save'
import { stageDecor, type StageDecor } from '../state/stage'
import { getSave } from '../state/store'
import { Caption } from '../ui/Caption'
import { CARD_H, CARD_W } from '../ui/ItemCard'
import { Hud } from '../ui/Hud'
import { PixelScene } from './PixelScene'

export const ROOM_FLOOR_Y = 124
export const CARD_ROWS_Y = [150, 214]
const CARD_GAP = 4

/** Top-left position of card number `i` in a 3-column grid. */
export function cardPosition(i: number, rowsY = CARD_ROWS_Y) {
  const col = i % 3
  return {
    x: 4 + col * (CARD_W + CARD_GAP) + (180 - 8 - 3 * CARD_W - 2 * CARD_GAP) / 2,
    y: rowsY[Math.floor(i / 3)] ?? rowsY[rowsY.length - 1] + CARD_H + CARD_GAP,
  }
}

export abstract class RoomScene extends PixelScene {
  protected hud!: Hud
  protected caption!: Caption
  protected preview!: Character
  protected pet?: Pet
  private stage!: Phaser.GameObjects.Image

  /** Hut id for returning to the right door in the village. */
  protected abstract readonly hutId: string

  protected createRoom(): void {
    this.setupCamera()
    // Her own stage with the decor she put up (GAME_DESIGN §4 "Bühne")
    this.stage = this.add.image(0, 0, this.stageTexture(stageDecor(getSave()))).setOrigin(0)
    this.hud = new Hud(this, { onHome: () => this.goTo('Village', { from: this.hutId }) })
    this.caption = new Caption(this)

    const save = getSave()
    this.preview = new Character(this, 70, ROOM_FLOOR_Y, this.savedLook()).setScale(2)
    const pet = activePet(save)
    if (pet) this.pet = new Pet(this, 106, ROOM_FLOOR_Y, pet.species).setScale(2)
  }

  private stageTexture(decor: StageDecor): string {
    return ensureStageTexture(this, { floorY: ROOM_FLOOR_Y, decor })
  }

  /** Shows the stage with this decor (trying on in the Laden, after a change). */
  protected showStage(decor: StageDecor = stageDecor(getSave())): void {
    this.stage.setTexture(this.stageTexture(decor))
  }

  protected savedLook(): CharacterLook {
    return getSave().character?.look ?? DEFAULT_LOOK
  }

  update(_time: number, delta: number) {
    this.preview.tick(delta)
    this.pet?.tick(delta)
  }
}
