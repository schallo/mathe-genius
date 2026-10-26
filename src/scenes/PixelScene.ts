// Base scene: camera zoomed to the render scale so all game code works in art pixels.
import Phaser from 'phaser'
import { GAME_HEIGHT, GAME_WIDTH, renderScale } from '../display'
import { palette } from '../palette'
import { GAME_SPEED } from '../clock'

const INK = Phaser.Display.Color.IntegerToRGB(palette.ink)
const FADE_MS = 200 / GAME_SPEED

export abstract class PixelScene extends Phaser.Scene {
  protected setupCamera(
    worldWidth = GAME_WIDTH,
    worldHeight = GAME_HEIGHT,
  ): Phaser.Cameras.Scene2D.Camera {
    // goTo() disables input while fading out, and Phaser keeps that when a scene restarts
    this.input.enabled = true
    // Faster game time in end-to-end tests (?speed=N, see clock.ts)
    this.time.timeScale = GAME_SPEED
    this.tweens.timeScale = GAME_SPEED
    const cam = this.cameras.main
    // Zoom pivots around the camera centre; the bounds keep the view inside the world
    cam.setZoom(renderScale()).setBounds(0, 0, worldWidth, worldHeight)
    cam.centerOn(GAME_WIDTH / 2, GAME_HEIGHT / 2)
    cam.fadeIn(FADE_MS, INK.r, INK.g, INK.b)
    return cam
  }

  /**
   * Scrolls the camera so the view starts at `top` (whole pixels, clamped to the world).
   * Scrolling scenes use this instead of startFollow, so objects pinned to the view
   * (top bar, captions) can be placed at exactly the same position in the same frame.
   * Returns the view's top edge.
   */
  protected scrollViewTo(top: number, worldHeight: number): number {
    const y = Math.round(Phaser.Math.Clamp(top, 0, worldHeight - GAME_HEIGHT))
    this.cameras.main.centerOn(GAME_WIDTH / 2, y + GAME_HEIGHT / 2)
    return y
  }

  /**
   * Like scrollViewTo, for worlds wider than the view: the view's top-left corner goes to
   * (left, top), clamped to the world. Returns that corner in whole pixels.
   */
  protected scrollViewToXY(
    left: number,
    top: number,
    worldWidth: number,
    worldHeight: number,
  ): { x: number; y: number } {
    const x = Math.round(Phaser.Math.Clamp(left, 0, worldWidth - GAME_WIDTH))
    const y = Math.round(Phaser.Math.Clamp(top, 0, worldHeight - GAME_HEIGHT))
    this.cameras.main.centerOn(x + GAME_WIDTH / 2, y + GAME_HEIGHT / 2)
    return { x, y }
  }

  /** Fade through ink (no flash, STYLE_GUIDE §9a) and start another scene. */
  protected goTo(scene: string, data?: object): void {
    this.input.enabled = false
    this.cameras.main.fadeOut(FADE_MS, INK.r, INK.g, INK.b)
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () =>
      this.scene.start(scene, data),
    )
  }
}
