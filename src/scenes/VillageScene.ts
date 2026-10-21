// The village hub (GAME_DESIGN §3a): tap to walk, arrow keys/WASD on the PC, hut doors.
import Phaser from 'phaser'
import { Character } from '../art/character/Character'
import { DEFAULT_LOOK } from '../art/character/look'
import { Pet } from '../art/pets/Pet'
import { ensureBarrierTexture, ensureHutTexture } from '../art/hut'
import { addFrames, rasterize } from '../art/pixels'
import { ensureVillageTexture } from '../art/village'
import { texts } from '../data/texts'
import { GAME_HEIGHT } from '../display'
import { palette } from '../palette'
import { activePet } from '../state/save'
import { getSave } from '../state/store'
import { Caption } from '../ui/Caption'
import { Hud } from '../ui/Hud'
import { LabelPill } from '../ui/LabelPill'
import { findPath, isBlocked, nearestFree, type Grid } from '../world/path'
import {
  CELL,
  HUTS,
  HUT_HEIGHT,
  MAIN_PATH,
  SPAWN,
  VILLAGE_HEIGHT,
  VILLAGE_WIDTH,
  buildWalkGrid,
  cellCenter,
  doorEntry,
  hutAt,
  toCell,
  type Hut,
} from '../world/village'
import { PixelScene } from './PixelScene'

const SPEED = 48 // art px per second
const DOOR_RADIUS = 5
const WILD_Y = 12
/** How far the pet walks behind her, along her trail. */
const PET_DISTANCE = 14

type Target = { kind: 'hut'; hut: Hut } | { kind: 'wild' } | { kind: 'spot' }

export class VillageScene extends PixelScene {
  private hero!: Character
  private pet?: Pet
  private trail: { x: number; y: number }[] = []
  private grid!: Grid
  private caption!: Caption
  private hud!: Hud
  private tapMark!: Phaser.GameObjects.Image
  private pos = { x: SPAWN.x, y: SPAWN.y }
  private waypoints: { x: number; y: number }[] = []
  private target: Target | null = null
  private keys!: Record<'up' | 'down' | 'left' | 'right', Phaser.Input.Keyboard.Key[]>
  private from?: string
  private wildNoticeAt = -Infinity

  constructor() {
    super('Village')
  }

  init(data: { from?: string }) {
    this.from = data.from
    this.waypoints = []
    this.target = null
    this.trail = []
  }

  create() {
    this.setupCamera(VILLAGE_WIDTH, VILLAGE_HEIGHT)
    this.grid = buildWalkGrid()
    this.add.image(0, 0, ensureVillageTexture(this)).setOrigin(0)

    for (const hut of HUTS) {
      this.add
        .image(hut.x, hut.y, ensureHutTexture(this, hut.roof, hut.icon))
        .setOrigin(0)
        .setDepth(hut.y + HUT_HEIGHT)
      if (!hut.scene) {
        this.add
          .image(hut.x + 9, hut.y + 28, ensureBarrierTexture(this))
          .setOrigin(0)
          .setDepth(hut.y + HUT_HEIGHT + 1)
      }
    }
    new LabelPill(this, MAIN_PATH.x + MAIN_PATH.width + 22, 10, `↑ ${texts.village.wildSign}`, {
      size: 6,
    }).setDepth(10)

    const fromHut = HUTS.find((h) => h.id === this.from)
    this.pos = fromHut ? doorEntry(fromHut) : { ...SPAWN }
    const save = getSave()
    this.hero = new Character(this, this.pos.x, this.pos.y, save.character?.look ?? DEFAULT_LOOK)
    this.hero.face('down').setName(save.character?.name ?? null)
    const pet = activePet(save)
    if (pet) {
      this.pet = new Pet(this, this.pos.x - PET_DISTANCE, this.pos.y, pet.species, pet.name)
      this.pet.showName(false)
    }
    this.trail = [{ x: this.pos.x - PET_DISTANCE, y: this.pos.y }, { ...this.pos }]

    if (!this.textures.exists('tap-mark')) {
      const map = ['.a.', 'aba', '.a.']
      addFrames(this, 'tap-mark', [
        { name: 'mark', pixels: rasterize(map, { a: palette.gold, b: palette.paperWhite }) },
      ])
    }
    this.tapMark = this.add.image(0, 0, 'tap-mark', 'mark').setVisible(false).setDepth(1)
    this.caption = new Caption(this)
    this.hud = new Hud(this)
    this.followCamera()

    this.input.on('pointerup', (p: Phaser.Input.Pointer) => this.onTap(p.worldX, p.worldY))
    const kb = this.input.keyboard!
    const K = Phaser.Input.Keyboard.KeyCodes
    this.keys = {
      up: [kb.addKey(K.UP), kb.addKey(K.W)],
      down: [kb.addKey(K.DOWN), kb.addKey(K.S)],
      left: [kb.addKey(K.LEFT), kb.addKey(K.A)],
      right: [kb.addKey(K.RIGHT), kb.addKey(K.D)],
    }
  }

  private onTap(x: number, y: number) {
    // Taps on the top bar (mute, coins) are not walking targets
    if (y - this.cameras.main.worldView.y < 20) return
    if (this.pet && Math.abs(x - this.pet.x) < 10 && y < this.pet.y + 3 && y > this.pet.y - 16) {
      this.pet.hop()
      this.pet.showName(true)
      this.time.delayedCall(2000, () => this.pet?.showName(false))
      return
    }
    const hut = hutAt(x, y)
    let goal: { x: number; y: number }
    if (hut) {
      this.target = { kind: 'hut', hut }
      goal = doorEntry(hut)
    } else if (y < WILD_Y + 8 && Math.abs(x - (MAIN_PATH.x + MAIN_PATH.width / 2)) < 30) {
      this.target = { kind: 'wild' }
      goal = { x: MAIN_PATH.x + MAIN_PATH.width / 2, y: CELL / 2 }
    } else {
      this.target = { kind: 'spot' }
      goal = { x, y }
    }

    const start = toCell(this.pos.x, this.pos.y)
    let end = toCell(goal.x, goal.y)
    if (isBlocked(this.grid, end.cx, end.cy)) {
      const free = nearestFree(this.grid, end.cx, end.cy)
      if (!free) return
      end = free
      goal = cellCenter(free.cx, free.cy)
    }
    const cells = findPath(this.grid, start, end)
    if (!cells) return
    this.waypoints = [...cells.slice(0, -1).map((c) => cellCenter(c.cx, c.cy)), goal]
    this.tapMark.setPosition(Math.round(goal.x), Math.round(goal.y)).setVisible(true)
  }

  update() {
    // Real elapsed time (Phaser's smoothed delta lags behind on slow frames), capped after tab switches
    const delta = Math.min(this.game.loop.rawDelta, 100)
    const step = (SPEED * delta) / 1000
    const held = (dir: keyof typeof this.keys) => this.keys[dir].some((k) => k.isDown)
    const kx = Number(held('right')) - Number(held('left'))
    const ky = Number(held('down')) - Number(held('up'))
    let moving = false

    if (kx || ky) {
      // Keyboard walking cancels any tap route
      this.waypoints = []
      this.target = null
      this.tapMark.setVisible(false)
      const len = Math.hypot(kx, ky)
      this.tryMove((kx / len) * step, 0)
      this.tryMove(0, (ky / len) * step)
      this.faceTowards(kx, ky)
      moving = true
      if (ky < 0) this.checkKeyboardDoor()
    } else if (this.waypoints.length > 0) {
      const next = this.waypoints[0]
      const dx = next.x - this.pos.x
      const dy = next.y - this.pos.y
      const dist = Math.hypot(dx, dy)
      if (dist <= step) {
        this.pos = { ...next }
        this.waypoints.shift()
      } else {
        this.pos.x += (dx / dist) * step
        this.pos.y += (dy / dist) * step
      }
      this.faceTowards(dx, dy)
      moving = true
      if (this.waypoints.length === 0) this.arrive()
    }

    if (this.pos.y < WILD_Y) this.showWildNotice()

    this.hero.setPosition(Math.round(this.pos.x), Math.round(this.pos.y))
    this.hero.setDepth(this.hero.y)
    this.hero.setWalking(moving)
    this.hero.tick(delta)
    this.followWithPet(delta)
    this.followCamera()
  }

  /** Camera centred on her; top bar and captions stay pinned to the view. */
  private followCamera() {
    const top = this.scrollViewTo(this.hero.y - GAME_HEIGHT / 2, VILLAGE_HEIGHT)
    this.hud.setViewY(top)
    this.caption.setViewY(top)
  }

  /** The pet walks PET_DISTANCE px behind her along the path she took. */
  private followWithPet(delta: number) {
    if (!this.pet) return
    const last = this.trail[this.trail.length - 1]
    if (Math.hypot(this.pos.x - last.x, this.pos.y - last.y) >= 1) {
      this.trail.push({ ...this.pos })
      if (this.trail.length > 64) this.trail.shift()
    }
    let remaining = PET_DISTANCE
    let point = this.trail[this.trail.length - 1]
    for (let i = this.trail.length - 1; i > 0 && remaining > 0; i--) {
      const a = this.trail[i]
      const b = this.trail[i - 1]
      const d = Math.hypot(a.x - b.x, a.y - b.y)
      if (d >= remaining) {
        point = { x: a.x + ((b.x - a.x) * remaining) / d, y: a.y + ((b.y - a.y) * remaining) / d }
        remaining = 0
      } else {
        remaining -= d
        point = b
      }
    }
    const x = Math.round(point.x)
    if (x !== this.pet.x) this.pet.setFlip(x < this.pet.x)
    this.pet.setPosition(x, Math.round(point.y)).setDepth(this.pet.y)
    this.pet.tick(delta)
  }

  private tryMove(dx: number, dy: number) {
    const nx = this.pos.x + dx
    const ny = this.pos.y + dy
    const c = toCell(nx, ny)
    if (!isBlocked(this.grid, c.cx, c.cy)) {
      this.pos.x = nx
      this.pos.y = ny
    }
  }

  private faceTowards(dx: number, dy: number) {
    if (Math.abs(dx) > Math.abs(dy)) this.hero.face(dx > 0 ? 'right' : 'left')
    else if (dy !== 0) this.hero.face(dy > 0 ? 'down' : 'up')
  }

  private arrive() {
    this.tapMark.setVisible(false)
    const target = this.target
    this.target = null
    if (target?.kind === 'hut') this.enter(target.hut)
  }

  private checkKeyboardDoor() {
    for (const hut of HUTS) {
      const door = doorEntry(hut)
      if (Math.hypot(door.x - this.pos.x, door.y - this.pos.y) < DOOR_RADIUS) return this.enter(hut)
    }
  }

  private enter(hut: Hut) {
    if (hut.scene) {
      this.hero.face('up')
      this.goTo(hut.scene, { from: hut.id })
    } else {
      this.hero.face('down')
      this.caption.show(texts.village.underConstruction(hut.name))
      // Step back from the door so the keyboard doesn't re-trigger it
      this.pos.y += DOOR_RADIUS
    }
  }

  private showWildNotice() {
    if (this.time.now - this.wildNoticeAt < 3000) return
    this.wildNoticeAt = this.time.now
    this.caption.show(texts.village.wildSoon)
  }
}
