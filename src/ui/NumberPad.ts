// Number pad (STYLE_GUIDE §9): 3 × 4 cream keys with ink outline, digits in VT323,
// ⌫ and a gold OK key. Same place on every screen so fingers learn the positions.
// Keyboard digits, Backspace and Enter work on the PC.
import Phaser from 'phaser'
import { sfx } from '../audio/sfx'
import { Key } from './Key'
import { onKeyDown } from './keyboard'

export const PAD = { x: 24, y: 210, keyW: 40, keyH: 30, gap: 4 } as const

const LAYOUT = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '⌫', '0', 'OK']

export type PadHandlers = {
  digit: (d: string) => void
  back: () => void
  ok: () => void
}

export class NumberPad extends Phaser.GameObjects.Container {
  private keys: Key[] = []
  private enabled = true

  constructor(scene: Phaser.Scene, handlers: PadHandlers) {
    super(scene, 0, 0)
    const press = (key: string) => {
      if (!this.enabled || !this.visible) return
      sfx.tick()
      if (key === '⌫') handlers.back()
      else if (key === 'OK') handlers.ok()
      else handlers.digit(key)
    }
    LAYOUT.forEach((caption, i) => {
      const col = i % 3
      const row = Math.floor(i / 3)
      const key = new Key(
        scene,
        PAD.x + col * (PAD.keyW + PAD.gap),
        PAD.y + row * (PAD.keyH + PAD.gap),
        PAD.keyW,
        PAD.keyH,
        caption,
        () => press(caption),
        caption === 'OK' ? { fill: 'gold', label: true, fontSize: 9 } : { fontSize: 20 },
      )
      this.keys.push(key)
      this.add(key)
    })
    scene.add.existing(this)

    onKeyDown(scene, (e) => {
      if (/^\d$/.test(e.key)) press(e.key)
      else if (e.key === 'Backspace') press('⌫')
      else if (e.key === 'Enter') press('OK')
    })
  }

  setEnabled(enabled: boolean): this {
    this.enabled = enabled
    this.setAlpha(enabled ? 1 : 0.6)
    return this
  }
}
