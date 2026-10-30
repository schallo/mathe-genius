// Fishing at the village pond (NOTES "Fishing mini game"): opens when she walks up to the
// pond with the Angel from the Laden. One big button (or the space bar): hold and let go to
// cast, press when the float dips, hold to reel in – and let go when the fish pulls hard.
// The first fish is Goldi; after that a star per catch, at most three a day.
import Phaser from 'phaser'
import { Character } from '../art/character/Character'
import { DEFAULT_LOOK } from '../art/character/look'
import { Pet, ensurePetTexture } from '../art/pets/Pet'
import { BANK_Y, ensureFishTexture, ensureFloatTexture, ensurePondTexture } from '../art/pond'
import { sfx } from '../audio/sfx'
import { GAME_SPEED } from '../clock'
import { texts } from '../data/texts'
import { GAME_HEIGHT, GAME_WIDTH } from '../display'
import {
  FISHING,
  press,
  release,
  startFishing,
  step,
  type FishingState,
  type Pull,
} from '../fishing/fishing'
import { palette, type PaletteToken } from '../palette'
import { fishingStarsToday, goldiInPond, recordCatch, type CatchReward } from '../state/fishing'
import { activePet } from '../state/save'
import { deviceId, getSave, updateSave } from '../state/store'
import { Caption } from '../ui/Caption'
import { Hud } from '../ui/Hud'
import { Key } from '../ui/Key'
import { addText } from '../ui/text'
import { PixelScene } from './PixelScene'

/** Rod tip and where the float lands (near … far) */
const TIP = { x: 58, y: BANK_Y - 30 }
const FLOAT_Y = 160
const NEAR_X = 74
const FAR_X = 168
const PANEL = { x: 8, y: 256, w: 164, h: 40 }
const BAR = { x: 50, y: 264, w: 114, h: 8 }
const BUTTON = { x: 20, y: 304, w: 140, h: 40 }

const GOLDI_JUMP_MS = 900

const PULL_FILL: Record<Pull, PaletteToken> = { weak: 'mint', mid: 'gold', strong: 'rose' }

export class FishingScene extends PixelScene {
  private state: FishingState = startFishing()
  private holding = false
  private reward: CatchReward | null = null
  private hero!: Character
  private pet?: Pet
  private catchPet?: Pet
  private line!: Phaser.GameObjects.Graphics
  private float!: Phaser.GameObjects.Image
  private fish!: Phaser.GameObjects.Image
  private bars!: Phaser.GameObjects.Graphics
  private barLabel!: Phaser.GameObjects.Text
  private pullPill!: Key
  private button!: Key
  private caption!: Caption
  private bite!: Phaser.GameObjects.Text
  private clock = 0
  /** Goldi leaps out of the pond now and then until she is caught */
  private goldi!: Phaser.GameObjects.Image
  private splash!: Phaser.GameObjects.Graphics
  private jump: { x: number; y: number; t: number } | null = null
  private nextJump = 0
  private goldiSeen = false

  constructor() {
    super('Fishing')
  }

  init() {
    this.state = startFishing()
    this.holding = false
    this.reward = null
    this.catchPet = undefined
    this.clock = 0
    this.jump = null
    this.nextJump = 2500
    this.goldiSeen = false
  }

  create() {
    this.setupCamera()
    this.add.image(0, 0, ensurePondTexture(this)).setOrigin(0)
    ensureFloatTexture(this)
    ensureFishTexture(this)
    this.splash = this.add.graphics().setDepth(3)
    this.goldi = this.add
      .image(0, 0, ensurePetTexture(this, 'goldi'), 'idle')
      .setOrigin(0.5, 1)
      .setScale(2)
      .setDepth(3)
      .setVisible(false)

    const save = getSave()
    this.hero = new Character(this, 34, BANK_Y + 14, save.character?.look ?? DEFAULT_LOOK)
    this.hero.setScale(2).face('right')
    const pet = activePet(save)
    if (pet) this.pet = new Pet(this, 12, BANK_Y + 16, pet.species).setScale(2)

    this.line = this.add.graphics().setDepth(5)
    this.float = this.add
      .image(0, FLOAT_Y, 'pond-float', 'float')
      .setOrigin(0.5, 1)
      .setScale(2)
      .setVisible(false)
    this.fish = this.add.image(0, FLOAT_Y, 'pond-fish', 'fish').setScale(2).setVisible(false)
    this.fish.setDepth(4)
    this.bite = addText(this, 0, FLOAT_Y - 20, '!', 'title', 16)
      .setVisible(false)
      .setDepth(6)

    // Panel on the bank: power (or throw distance) and the fish's pull
    const panel = this.add.graphics()
    panel.fillStyle(palette.cream).fillRoundedRect(PANEL.x, PANEL.y, PANEL.w, PANEL.h, 3)
    panel.lineStyle(2, palette.ink).strokeRoundedRect(PANEL.x, PANEL.y, PANEL.w, PANEL.h, 3)
    this.barLabel = addText(this, PANEL.x + 6, BAR.y + BAR.h / 2, '', 'label', 5).setOrigin(0, 0.5)
    this.bars = this.add.graphics()
    this.pullPill = new Key(this, BAR.x, 278, BAR.w, 13, '', () => {}, { label: true, fontSize: 5 })
    this.pullPill.disableInteractive()

    this.button = new Key(this, BUTTON.x, BUTTON.y, BUTTON.w, BUTTON.h, '', () => this.down(), {
      fill: 'gold',
      label: true,
      fontSize: 9,
    })
    this.input.on('pointerup', () => this.up())
    const space = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE)
    space.on('down', () => this.down())
    space.on('up', () => this.up())

    new Hud(this, { onHome: () => this.goTo('Village', { from: 'teich' }) })
    // Messages over the sky, never over the button
    this.caption = new Caption(this).setViewY(58 - (GAME_HEIGHT - 24))
    this.caption.show(texts.fishing.cast, 3000)
    this.render()
  }

  private down() {
    if (this.holding) return
    this.holding = true
    const before = this.state.phase
    this.state = press(this.state, Math.random)
    if (before === 'bite') {
      sfx.pling()
      this.caption.show(texts.fishing.reel, 2500)
    } else if (before === 'caught' || before === 'lost') {
      this.reward = null
      this.catchPet?.destroy()
      this.catchPet = undefined
      this.caption.show(texts.fishing.cast, 2000)
    }
    this.render()
  }

  private up() {
    if (!this.holding) return
    this.holding = false
    if (this.state.phase === 'charging') {
      this.state = release(this.state, Math.random)
      sfx.tick()
      this.caption.show(texts.fishing.wait, 2000)
    }
    this.render()
  }

  update(_time: number, delta: number) {
    const dt = Math.min(this.game.loop.rawDelta || delta, 100) * GAME_SPEED
    this.clock += dt
    const before = this.state.phase
    this.state = step(this.state, dt, this.holding, Math.random)
    const phase = this.state.phase
    if (phase !== before) {
      if (phase === 'bite') {
        sfx.tick()
        this.caption.show(texts.fishing.bite, 2000)
      } else if (before === 'bite' && phase === 'waiting') {
        this.caption.show(texts.fishing.missed, 1600)
      } else if (phase === 'caught') {
        this.onCatch()
      } else if (phase === 'lost') {
        sfx.boop()
        this.caption.show(texts.fishing.lost, 2500)
      }
    }
    this.hero.tick(dt)
    this.pet?.tick(dt)
    this.catchPet?.tick(dt)
    this.goldiJumps(dt)
    this.render()
  }

  /**
   * While Goldi isn't hers yet, she leaps out of the water every few seconds somewhere in
   * the pond – a hint that she might bite (gentle arc, whole pixels, small ripples).
   */
  private goldiJumps(dt: number) {
    if (!this.jump) {
      this.goldi.setVisible(false)
      this.splash.clear()
      if (this.clock < this.nextJump || !goldiInPond(getSave())) return
      this.jump = {
        x: 24 + Math.floor(Math.random() * 132),
        y: 120 + Math.floor(Math.random() * 90),
        t: 0,
      }
      if (!this.goldiSeen) {
        this.goldiSeen = true
        if (this.state.phase === 'ready' || this.state.phase === 'waiting') {
          this.caption.show(texts.fishing.goldiJumps, 2500)
        }
      }
    }
    const jump = this.jump
    jump.t += dt / GOLDI_JUMP_MS
    if (jump.t >= 1.3) {
      this.jump = null
      this.nextJump = this.clock + 4000 + Math.random() * 5000
      return
    }
    const t = Math.min(1, jump.t)
    const height = Math.round(Math.sin(Math.PI * t) * 22)
    this.goldi.setVisible(jump.t < 1).setPosition(jump.x, jump.y - height)
    this.goldi.setFlipX(t > 0.5)
    // Ripples where she jumps out and back in
    this.splash.clear()
    if (t < 0.25 || jump.t > 0.9) {
      const r = jump.t > 0.9 ? 4 + Math.round((jump.t - 0.9) * 20) : 6
      this.splash.fillStyle(palette.paperWhite)
      for (const dx of [-r, -r + 2, r - 2, r]) this.splash.fillRect(jump.x + dx, jump.y, 2, 1)
      this.splash.fillRect(jump.x - 1, jump.y - 3, 1, 2).fillRect(jump.x + 1, jump.y - 4, 1, 2)
    }
  }

  private onCatch() {
    this.holding = false
    let result: { reward: CatchReward } | undefined
    updateSave((s) => {
      const r = recordCatch(s, new Date(), deviceId())
      result = r
      return r.save
    })
    this.reward = result?.reward ?? 'none'
    sfx.fanfare()
    this.hero.jump()
    this.pet?.hop()
    if (this.reward === 'goldi') {
      this.jump = null
      // Goldi hops out of the pond onto the bank
      this.catchPet = new Pet(this, 96, BANK_Y + 14, 'goldi', 'Goldi').setScale(2)
      this.catchPet.hop()
      this.caption.show(texts.fishing.goldi, 4000)
    } else if (this.reward === 'star') {
      this.caption.show(texts.fishing.star(fishingStarsToday(getSave(), new Date())), 3000)
    } else {
      this.caption.show(texts.fishing.none, 3500)
    }
  }

  // ---------- Drawing (whole pixels only) ----------

  private floatX(): number {
    const { phase, charge, line } = this.state
    const cast = NEAR_X + (FAR_X - NEAR_X) * charge
    if (phase !== 'reeling') return Math.round(cast)
    // The fish comes closer as she reels in
    const far = NEAR_X + (FAR_X - NEAR_X) * Math.max(charge, 0.5)
    return Math.round(NEAR_X - 8 + (far - NEAR_X + 8) * (line / FISHING.line))
  }

  private render() {
    const { phase, power, pull, charge } = this.state
    const out = phase === 'waiting' || phase === 'bite' || phase === 'reeling'
    const x = this.floatX()

    // Float bobs gently while waiting and dips when a fish bites
    const bob = Math.floor(this.clock / 500) % 2
    this.float.setVisible(out && phase !== 'reeling')
    this.float.setFrame(phase === 'bite' ? 'bite' : 'float').setPosition(x, FLOAT_Y + bob * 2)
    this.bite.setVisible(phase === 'bite').setPosition(x, FLOAT_Y - 20)

    // The fish wiggles harder the stronger it pulls
    const speed = { weak: 400, mid: 200, strong: 90 }[pull]
    const amp = { weak: 1, mid: 1, strong: 2 }[pull]
    const wiggle = Math.floor(this.clock / speed) % 2 ? amp : -amp
    this.fish.setVisible(phase === 'reeling').setPosition(x + wiggle, FLOAT_Y + 2)

    // Rod and line, drawn pixel by pixel
    this.line.clear()
    this.line.fillStyle(palette.woodDark)
    const hand = { x: 42, y: BANK_Y - 2 }
    this.pixelLine(hand.x, hand.y, TIP.x, TIP.y)
    if (out) {
      this.line.fillStyle(palette.paperWhite)
      const end =
        phase === 'reeling' ? { x: x + wiggle - 9, y: FLOAT_Y } : { x, y: FLOAT_Y - 9 + bob * 2 }
      this.pixelLine(TIP.x, TIP.y, end.x, end.y)
    }

    // Power bar (mint → gold → rose like the HP bars) or the throw meter
    const charging = phase === 'charging' || phase === 'ready'
    const value = charging ? charge : power / FISHING.maxPower
    this.barLabel.setText((charging ? texts.fishing.distance : texts.fishing.power).toUpperCase())
    const fill: PaletteToken = charging
      ? 'gold'
      : value > 0.5
        ? 'mint'
        : value > 0.2
          ? 'gold'
          : 'rose'
    this.bars.clear()
    this.bars.fillStyle(palette.woodDark).fillRect(BAR.x, BAR.y, BAR.w, BAR.h)
    this.bars.fillStyle(palette.paperWhite).fillRect(BAR.x + 1, BAR.y + 1, BAR.w - 2, BAR.h - 2)
    const w = Math.round((BAR.w - 2) * Math.max(0, Math.min(1, value)))
    this.bars.fillStyle(palette[fill]).fillRect(BAR.x + 1, BAR.y + 1, w, BAR.h - 2)

    this.pullPill.setVisible(phase === 'reeling')
    this.pullPill.setCaption(texts.fishing.pull[pull]).setFill(PULL_FILL[pull])

    this.button.setCaption(texts.fishing.button[phase])
    this.button.setFill(phase === 'waiting' ? 'cream' : 'gold')
  }

  private pixelLine(x0: number, y0: number, x1: number, y1: number) {
    const steps = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1)
    for (let i = 0; i <= steps; i++) {
      const px = Math.round(x0 + ((x1 - x0) * i) / steps)
      const py = Math.round(y0 + ((y1 - y0) * i) / steps)
      this.line.fillRect(px, py, 1, 1)
    }
  }

  /** For end-to-end tests (window.__debug.fishing()). */
  debugState() {
    return {
      ...this.state,
      holding: this.holding,
      reward: this.reward,
      goldiJumping: this.goldi.visible,
      width: GAME_WIDTH,
    }
  }
}
