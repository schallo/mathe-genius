// Speech card (STYLE_GUIDE §8): cream sign with 2 px ink outline, folded top-right
// corner and a small stand underneath. Text in VT323.
import Phaser from 'phaser'
import { palette } from '../palette'
import { addText } from './text'

const FOLD = 6

export class SpeechCard extends Phaser.GameObjects.Container {
  private label: Phaser.GameObjects.Text
  private typing?: Phaser.Time.TimerEvent

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    width: number,
    height: number,
    text: string,
  ) {
    super(scene, x, y)
    const g = scene.add.graphics()
    const w = width
    const h = height

    // Stand: post and base below the card
    g.fillStyle(palette.cream).lineStyle(2, palette.ink)
    g.fillRect(w / 2 - 3, h, 6, 10).strokeRect(w / 2 - 3, h, 6, 10)
    g.fillRect(w / 2 - 10, h + 10, 20, 4).strokeRect(w / 2 - 10, h + 10, 20, 4)

    // Card with a folded corner
    const outline = [
      new Phaser.Math.Vector2(0, 0),
      new Phaser.Math.Vector2(w - FOLD, 0),
      new Phaser.Math.Vector2(w, FOLD),
      new Phaser.Math.Vector2(w, h),
      new Phaser.Math.Vector2(0, h),
    ]
    g.fillPoints(outline, true).strokePoints(outline, true)
    g.fillStyle(palette.stone).fillTriangle(w - FOLD, 0, w - FOLD, FOLD, w, FOLD)
    g.strokeTriangle(w - FOLD, 0, w - FOLD, FOLD, w, FOLD)

    this.label = addText(scene, w / 2, h / 2, text, 'title', 16)
    this.label.setWordWrapWidth(w - 8).setAlign('center')
    this.add([g, this.label])
    scene.add.existing(this)
  }

  setText(text: string, size?: number): this {
    this.typing?.remove()
    if (size) this.label.setFontSize(size)
    this.label.setText(text)
    return this
  }

  /** Typewriter effect (STYLE_GUIDE §7): letter by letter, ~30 ms each, with a soft click. */
  typeText(text: string, size: number, onTick?: () => void): this {
    this.setText('', size)
    let shown = 0
    this.typing = this.scene.time.addEvent({
      delay: 30,
      repeat: text.length - 1,
      callback: () => {
        shown++
        this.label.setText(text.slice(0, shown))
        if (shown % 2 === 1) onTick?.()
      },
    })
    return this
  }

  /** Moves the text block, e.g. up to leave room for the answer box. */
  setTextY(y: number): this {
    this.label.setY(y)
    return this
  }
}
