// Caption/overlay box (STYLE_GUIDE §8): dark semi-transparent, rounded, cream text,
// centred at the bottom of the frame. Fixed to the camera.
import Phaser from 'phaser'
import { GAME_HEIGHT, GAME_WIDTH } from '../display'
import { overlay } from '../palette'
import { addText } from './text'

export class Caption extends Phaser.GameObjects.Container {
  private bg: Phaser.GameObjects.Graphics
  private label: Phaser.GameObjects.Text
  private hideTimer?: Phaser.Time.TimerEvent

  constructor(scene: Phaser.Scene) {
    super(scene, GAME_WIDTH / 2, GAME_HEIGHT - 24)
    this.bg = scene.add.graphics()
    this.label = addText(scene, 0, 0, '', 'title', 14, 'cream')
    this.add([this.bg, this.label])
    this.setScrollFactor(0).setDepth(1000).setVisible(false)
    scene.add.existing(this)
  }

  show(text: string, ms = 2200): void {
    this.label.setText(text).setWordWrapWidth(GAME_WIDTH - 32)
    const w = Math.min(GAME_WIDTH - 16, Math.ceil(this.label.width) + 16)
    const h = Math.ceil(this.label.height) + 8
    this.bg.clear()
    this.bg.fillStyle(overlay.color, overlay.alpha)
    this.bg.fillRoundedRect(-w / 2, -h / 2, w, h, 4)
    this.setVisible(true)
    this.hideTimer?.remove()
    this.hideTimer = this.scene.time.delayedCall(ms, () => this.setVisible(false))
  }
}
