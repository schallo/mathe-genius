// Base scene: camera zoomed to the render scale so all game code works in art pixels.
import Phaser from 'phaser'
import { GAME_HEIGHT, GAME_WIDTH, renderScale } from '../display'
import { palette } from '../palette'

const INK = Phaser.Display.Color.IntegerToRGB(palette.ink)
const FADE_MS = 200

export abstract class PixelScene extends Phaser.Scene {
  protected setupCamera(
    worldWidth = GAME_WIDTH,
    worldHeight = GAME_HEIGHT,
  ): Phaser.Cameras.Scene2D.Camera {
    // goTo() disables input while fading out, and Phaser keeps that when a scene restarts
    this.input.enabled = true
    const cam = this.cameras.main
    // Zoom pivots around the camera centre; the bounds keep the view inside the world
    cam.setZoom(renderScale()).setBounds(0, 0, worldWidth, worldHeight)
    cam.centerOn(GAME_WIDTH / 2, GAME_HEIGHT / 2)
    cam.fadeIn(FADE_MS, INK.r, INK.g, INK.b)
    return cam
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
