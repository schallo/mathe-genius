// Gentle sand-timer (STYLE_GUIDE §9 "Einmaleins-Training"): wooden caps, glass, gold sand
// running from the top bulb into the bottom one. No numbers, no ticking, no red.
import Phaser from 'phaser'
import { palette } from '../palette'

/** Half-width of the glass per row (rows 0–10 between the caps). */
const GLASS = [4, 4, 3, 2, 1, 0, 1, 2, 3, 4, 4]
const BULB = 5
/** Size of one timer pixel in art pixels. */
const PX = 2
export const SAND_TIMER_SIZE = { width: 11 * PX, height: 15 * PX }

export class SandTimer extends Phaser.GameObjects.Graphics {
  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, { x, y })
    scene.add.existing(this)
    this.draw(1)
  }

  /** `remaining`: 1 = full top bulb, 0 = all sand at the bottom. */
  draw(remaining: number): this {
    const share = Phaser.Math.Clamp(remaining, 0, 1)
    const dot = (x: number, y: number, c: number) =>
      this.fillStyle(c).fillRect(x * PX, y * PX, PX, PX)
    this.clear()
    for (let x = 0; x < 11; x++) {
      dot(x, 0, palette.woodDark)
      dot(x, 1, palette.woodEdge)
      dot(x, 13, palette.woodEdge)
      dot(x, 14, palette.woodDark)
    }
    const topSand = Math.ceil(BULB * share)
    const bottomSand = Math.ceil(BULB * (1 - share))
    GLASS.forEach((half, i) => {
      const y = i + 2
      // Sand sits at the bottom of each bulb
      const sand =
        i < BULB ? i >= BULB - topSand : i > BULB ? i > 10 - bottomSand : share > 0 && share < 1
      for (let x = 5 - half; x <= 5 + half; x++) dot(x, y, sand ? palette.gold : palette.cream)
      dot(4 - half, y, palette.stoneDark)
      dot(6 + half, y, palette.stoneDark)
    })
    return this
  }
}
