import Phaser from 'phaser'
import './style.css'
import { palette } from './palette'
import { BootScene } from './scenes/BootScene'

/** Native resolution in portrait (see NOTES.md). Everything is drawn at this size. */
export const GAME_WIDTH = 180
export const GAME_HEIGHT = 360

const game = new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  backgroundColor: palette.curtainDark,
  pixelArt: true,
  roundPixels: true,
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  scene: [BootScene],
})

// Debug hook for Playwright tests (canvas has no DOM to query)
declare global {
  interface Window {
    __game?: Phaser.Game
  }
}
window.__game = game
