// Label pill / button (STYLE_GUIDE §8): paper-white, 1 px ink outline, rounded,
// uppercase IBM Plex Mono. As a button: lifts 1 px on hover, moves down 1 px on press.
import Phaser from 'phaser'
import { palette, type PaletteToken } from '../palette'
import { addText } from './text'

/** 48 × 48 screen px at the iPhone's ×2 zoom. */
const MIN_TOUCH = 24

export class LabelPill extends Phaser.GameObjects.Container {
  private bg: Phaser.GameObjects.Graphics
  private label: Phaser.GameObjects.Text
  private fill: PaletteToken

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    text: string,
    options: { size?: number; fill?: PaletteToken; onClick?: () => void } = {},
  ) {
    super(scene, x, y)
    this.fill = options.fill ?? 'paperWhite'
    this.label = addText(scene, 0, 0, text, 'label', options.size ?? 7)
    this.bg = scene.add.graphics()
    this.add([this.bg, this.label])
    this.draw(false)
    scene.add.existing(this)

    if (options.onClick) {
      const w = Math.max(MIN_TOUCH, this.width)
      const h = Math.max(MIN_TOUCH, this.height)
      this.setSize(w, h)
      this.setInteractive({ useHandCursor: true })
      this.on('pointerover', () => this.draw(true))
      this.on('pointerout', () => this.draw(false).setY(Math.round(this.y)))
      this.on('pointerdown', () => this.setY(this.y + 1))
      this.on('pointerup', () => {
        this.setY(this.y - 1)
        options.onClick?.()
      })
    }
  }

  private draw(hover: boolean): this {
    const w = Math.ceil(this.label.width) + 8
    const h = Math.ceil(this.label.height) + 2
    this.bg.clear()
    this.bg.fillStyle(palette[this.fill])
    this.bg.fillRoundedRect(-w / 2, -h / 2, w, h, 2)
    this.bg.lineStyle(hover ? 1.5 : 1, palette.ink)
    this.bg.strokeRoundedRect(-w / 2, -h / 2, w, h, 2)
    this.label.setY(hover ? -1 : 0)
    this.bg.setY(hover ? -1 : 0)
    this.width = w
    this.height = h
    return this
  }
}
