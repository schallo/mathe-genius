// Top bar: mute button (always visible), optional home button, coin counter and – when
// she has one – the wish bar (GAME_DESIGN §4 "Wunschliste").
// Stays at the top of the view (scrolling scenes call setViewY). Only what the child
// needs (STYLE_GUIDE §8 "No HUD clutter").
import Phaser from 'phaser'
import { icon } from '../art/icons'
import { isMuted, setMuted } from '../audio/sfx'
import { GAME_WIDTH } from '../display'
import { palette } from '../palette'
import { coinBalance } from '../state/save'
import { wishProgress } from '../state/shop'
import { getSave } from '../state/store'
import { addText } from './text'

const BUTTON = 24 // touch target, art px

function pillButton(scene: Phaser.Scene, x: number, texture: string, onPress: () => void) {
  const g = scene.add.graphics()
  g.fillStyle(palette.paperWhite).fillRoundedRect(x, 3, 16, 14, 3)
  g.lineStyle(1, palette.ink).strokeRoundedRect(x, 3, 16, 14, 3)
  const image = scene.add.image(x + 8, 10, texture, 'icon')
  const zone = scene.add.zone(x + 8, 10, BUTTON, BUTTON).setInteractive({ useHandCursor: true })
  zone.on('pointerdown', onPress)
  return { parts: [g, image, zone], image }
}

export class Hud extends Phaser.GameObjects.Container {
  private coinText: Phaser.GameObjects.Text
  private coins: number
  private wishBar: Phaser.GameObjects.Container

  constructor(scene: Phaser.Scene, options: { onHome?: () => void } = {}) {
    super(scene, 0, 0)
    const mute = pillButton(scene, 4, icon(scene, isMuted() ? 'soundOff' : 'soundOn'), () => {
      setMuted(!isMuted())
      mute.image.setTexture(icon(scene, isMuted() ? 'soundOff' : 'soundOn'), 'icon')
    })
    this.add(mute.parts)
    if (options.onHome) this.add(pillButton(scene, 24, icon(scene, 'house'), options.onHome).parts)

    this.coins = coinBalance(getSave())
    const g = scene.add.graphics()
    g.fillStyle(palette.paperWhite).fillRoundedRect(GAME_WIDTH - 50, 3, 46, 14, 3)
    g.lineStyle(1, palette.ink).strokeRoundedRect(GAME_WIDTH - 50, 3, 46, 14, 3)
    const coin = scene.add.image(GAME_WIDTH - 42, 10, icon(scene, 'coin'), 'icon')
    this.coinText = addText(scene, GAME_WIDTH - 21, 9, String(this.coins), 'title', 14)
    this.add([g, coin, this.coinText])

    this.wishBar = scene.add.container(0, 0)
    this.add(this.wishBar)
    this.refreshWish()

    this.setDepth(900)
    scene.add.existing(this)
  }

  /**
   * Keeps the bar at the top of the visible area. (Phaser's scrollFactor 0 is off-screen
   * with our zoomed camera, see PixelScene.)
   */
  setViewY(viewY: number): this {
    return this.setY(viewY)
  }

  /** Where flying coins should land. */
  get coinTarget() {
    return { x: GAME_WIDTH - 42, y: this.y + 10 }
  }

  addCoins(amount: number): void {
    this.setCoins(this.coins + amount)
  }

  setCoins(coins: number): void {
    this.coins = coins
    this.coinText.setText(String(coins))
    this.refreshWish()
  }

  /**
   * Wish bar (STYLE_GUIDE §9): slim bar under the top row, wood-dark frame, gold fill,
   * "Kätzchen: noch 85 Münzen". Uses the displayed coin count so it fills up with the
   * flying coins.
   */
  refreshWish(): void {
    this.wishBar.removeAll(true)
    const wish = wishProgress(getSave())
    if (!wish) return
    const price = wish.item.price
    const missing = Math.max(0, price - this.coins)
    const ratio = price ? 1 - missing / price : 1
    const x = 4
    const w = GAME_WIDTH - 8
    const g = this.scene.add.graphics()
    g.fillStyle(palette.paperWhite).fillRoundedRect(x, 20, w, 15, 3)
    g.lineStyle(1, palette.ink).strokeRoundedRect(x, 20, w, 15, 3)
    g.fillStyle(palette.woodDark).fillRect(x + 4, 30, w - 8, 3)
    g.fillStyle(palette.gold).fillRect(x + 4, 30, Math.round((w - 8) * ratio), 3)
    const text =
      missing > 0
        ? `${wish.item.name}: noch ${missing} Münzen`
        : `${wish.item.name}: Du kannst es kaufen!`
    const label = addText(this.scene, GAME_WIDTH / 2, 25, text, 'label', 5)
    const star = this.scene.add.image(x + 7, 25, icon(this.scene, 'star'), 'icon')
    this.wishBar.add([g, star, label])
  }
}
