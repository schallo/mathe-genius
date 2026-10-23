import Phaser from 'phaser'
import './style.css'
import { GAME_HEIGHT, GAME_WIDTH, computeRenderSize, setRenderScale } from './display'
import { palette } from './palette'
import { startSync } from './state/sync'
import { BattleScene } from './scenes/BattleScene'
import { BootScene } from './scenes/BootScene'
import { CharacterCreateScene } from './scenes/CharacterCreateScene'
import { EinmaleinsDrillScene } from './scenes/EinmaleinsDrillScene'
import { EinmaleinsMenuScene } from './scenes/EinmaleinsMenuScene'
import { NameEntryScene } from './scenes/NameEntryScene'
import { ParentScene } from './scenes/ParentScene'
import { ShelterScene } from './scenes/ShelterScene'
import { ShopScene } from './scenes/ShopScene'
import { ShowEndScene } from './scenes/ShowEndScene'
import { ShowScene } from './scenes/ShowScene'
import { StarterPetScene } from './scenes/StarterPetScene'
import { TitleScene } from './scenes/TitleScene'
import { VillageScene } from './scenes/VillageScene'
import { WardrobeScene } from './scenes/WardrobeScene'
import { WildScene } from './scenes/WildScene'

const frame = document.getElementById('frame')!
const container = document.getElementById('game')!

/** Space inside the frame, without the iPhone safe-area padding. */
function availableSize() {
  const style = getComputedStyle(frame)
  return {
    width: frame.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight),
    height: frame.clientHeight - parseFloat(style.paddingTop) - parseFloat(style.paddingBottom),
  }
}

// Pick the render scale once, so one canvas pixel = one device pixel (see display.ts)
const available = availableSize()
const size = computeRenderSize(available.width, available.height, window.devicePixelRatio || 1)
setRenderScale(size.scale)
container.style.width = `${size.cssWidth}px`
container.style.height = `${size.cssHeight}px`

// After a window resize, keep the aspect ratio and fit the new space (may be slightly less crisp)
window.addEventListener('resize', () => {
  const { width, height } = availableSize()
  const fit = Math.min(width / GAME_WIDTH, height / GAME_HEIGHT)
  container.style.width = `${GAME_WIDTH * fit}px`
  container.style.height = `${GAME_HEIGHT * fit}px`
})

startSync()

const game = new Phaser.Game({
  type: Phaser.AUTO,
  parent: container,
  width: GAME_WIDTH * size.scale,
  height: GAME_HEIGHT * size.scale,
  backgroundColor: palette.curtainDark,
  pixelArt: true,
  roundPixels: true,
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  scene: [
    BootScene,
    TitleScene,
    CharacterCreateScene,
    NameEntryScene,
    StarterPetScene,
    VillageScene,
    ShowScene,
    ShowEndScene,
    ParentScene,
    ShopScene,
    WardrobeScene,
    ShelterScene,
    WildScene,
    BattleScene,
    EinmaleinsMenuScene,
    EinmaleinsDrillScene,
  ],
})

// Debug hooks for Playwright tests (the game is a canvas without DOM to query)
declare global {
  interface Window {
    __game?: Phaser.Game
    __debug?: {
      activeScene(): string | undefined
      /** Page coordinates of a world point in the active scene. */
      toPage(x: number, y: number): { x: number; y: number }
      /** State of the running show (answer, format, attempt) */
      show(): ReturnType<ShowScene['debugState']> | undefined
      battle(): ReturnType<BattleScene['debugState']> | undefined
      drill(): ReturnType<EinmaleinsDrillScene['debugState']> | undefined
      wild(): ReturnType<WildScene['debugState']> | undefined
      /** Taps a world point on the wild island, even outside the view */
      wildTap(x: number, y: number): void
      /** Taps a world point in the village, even outside the view */
      villageTap(x: number, y: number): void
    }
  }
}
window.__game = game
window.__debug = {
  activeScene: () => game.scene.getScenes(true)[0]?.scene.key,
  show: () => {
    const scene = game.scene.getScene('Show') as ShowScene
    return game.scene.isActive('Show') ? scene.debugState() : undefined
  },
  battle: () =>
    game.scene.isActive('Battle')
      ? (game.scene.getScene('Battle') as BattleScene).debugState()
      : undefined,
  drill: () =>
    game.scene.isActive('EinmaleinsDrill')
      ? (game.scene.getScene('EinmaleinsDrill') as EinmaleinsDrillScene).debugState()
      : undefined,
  wild: () =>
    game.scene.isActive('Wild')
      ? (game.scene.getScene('Wild') as WildScene).debugState()
      : undefined,
  wildTap: (x, y) => (game.scene.getScene('Wild') as WildScene).debugTap(x, y),
  villageTap: (x, y) => (game.scene.getScene('Village') as VillageScene).debugTap(x, y),
  toPage(x, y) {
    const scene = game.scene.getScenes(true)[0]
    const cam = scene.cameras.main
    const rect = game.canvas.getBoundingClientRect()
    const cssPerCanvasPx = rect.width / game.canvas.width
    return {
      x: rect.left + (x - cam.worldView.x) * cam.zoom * cssPerCanvasPx,
      y: rect.top + (y - cam.worldView.y) * cam.zoom * cssPerCanvasPx,
    }
  },
}
