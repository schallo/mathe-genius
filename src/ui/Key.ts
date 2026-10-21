// A pressable key (STYLE_GUIDE §8–9): cream (or gold) rectangle with an ink outline,
// label in VT323. Lifts 1 px on hover, moves down 1 px while pressed.
// Used by the name keyboard and later the number pad.
import Phaser from 'phaser'
import { palette, type PaletteToken } from '../palette'
import { addText } from './text'

export type KeyOptions = {
  fill?: PaletteToken
  fontSize?: number
  /** Plex Mono uppercase instead of VT323, for word keys like LEERTASTE */
  label?: boolean
}

export class Key extends Phaser.GameObjects.Container {
  private bg: Phaser.GameObjects.Graphics
  private text: Phaser.GameObjects.Text
  private fill: PaletteToken
  private selected = false
  readonly keyWidth: number
  readonly keyHeight: number

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    keyWidth: number,
    keyHeight: number,
    caption: string,
    onPress: () => void,
    options: KeyOptions = {},
  ) {
    super(scene, x, y)
    this.keyWidth = keyWidth
    this.keyHeight = keyHeight
    this.fill = options.fill ?? 'cream'
    this.bg = scene.add.graphics()
    this.text = addText(
      scene,
      keyWidth / 2,
      keyHeight / 2,
      caption,
      options.label ? 'label' : 'title',
      options.fontSize ?? (options.label ? 6 : 14),
    )
    this.add([this.bg, this.text])
    this.draw(false)
    this.setSize(keyWidth, keyHeight)
    // Phaser offsets a container's hit area by half its size (display origin 0.5),
    // so shift the rectangle to cover the key drawn from its top-left corner
    this.setInteractive({
      hitArea: new Phaser.Geom.Rectangle(keyWidth / 2, keyHeight / 2, keyWidth, keyHeight),
      hitAreaCallback: Phaser.Geom.Rectangle.Contains,
      useHandCursor: true,
    })
    this.on('pointerover', () => this.draw(true))
    this.on('pointerout', () => this.draw(false))
    this.on('pointerdown', () => {
      this.draw(false, 1)
      onPress()
    })
    this.on('pointerup', () => this.draw(false))
    scene.add.existing(this)
  }

  setCaption(caption: string): this {
    this.text.setText(caption)
    return this
  }

  setFill(fill: PaletteToken): this {
    this.fill = fill
    return this.draw(false)
  }

  /** Selected keys get a gold 2 px outline (swatches, tabs). */
  setSelected(selected: boolean): this {
    this.selected = selected
    return this.draw(false)
  }

  private draw(hover: boolean, pressed = 0): this {
    const lift = hover ? -1 : pressed
    this.bg.clear()
    this.bg.fillStyle(palette[this.fill])
    this.bg.fillRoundedRect(0, lift, this.keyWidth, this.keyHeight, 2)
    this.bg.lineStyle(this.selected ? 2 : 1, this.selected ? palette.gold : palette.ink)
    this.bg.strokeRoundedRect(0, lift, this.keyWidth, this.keyHeight, 2)
    if (this.selected) {
      this.bg.lineStyle(1, palette.ink)
      this.bg.strokeRoundedRect(-1.5, lift - 1.5, this.keyWidth + 3, this.keyHeight + 3, 3)
    }
    this.text.setY(this.keyHeight / 2 + lift)
    return this
  }
}
