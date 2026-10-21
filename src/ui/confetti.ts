// Purchase celebration (STYLE_GUIDE §9): pixel confetti in gold, cream, accent-blue and
// rose, falling slowly for about a second. No flashing.
import type Phaser from 'phaser'
import { GAME_WIDTH } from '../display'
import { palette } from '../palette'

const COLORS = [palette.gold, palette.cream, palette.accentBlue, palette.rose]

export function confetti(scene: Phaser.Scene, top = 30): void {
  for (let i = 0; i < 40; i++) {
    const x = Math.floor(Math.random() * GAME_WIDTH)
    const piece = scene.add.rectangle(x, top, 2, 2, COLORS[i % COLORS.length]).setDepth(1100)
    const fall = 60 + Math.random() * 60
    const drift = (Math.random() - 0.5) * 20
    scene.tweens.addCounter({
      from: 0,
      to: 1,
      duration: 900 + Math.random() * 400,
      delay: Math.random() * 200,
      onUpdate: (tween) => {
        const t = tween.getValue() ?? 0
        piece.setPosition(Math.round(x + drift * t), Math.round(top + fall * t)).setAlpha(1 - t * t)
      },
      onComplete: () => piece.destroy(),
    })
  }
}
