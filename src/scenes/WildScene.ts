// Wild island (GAME_DESIGN §6b): a big meadow with trees, rocks and a pond. Wild creatures
// hide in bushes and tall grass – a rustling bush gives them away. When she comes close,
// the creature hops out; tap it (or walk into it) to start a battle. No random encounters.
// The boat at the jetty goes back to the village.
import Phaser from 'phaser'
import { Character } from '../art/character/Character'
import { DEFAULT_LOOK } from '../art/character/look'
import { Pet } from '../art/pets/Pet'
import { ensureObstacleTexture, ensureSpotTexture, ensureWildTexture } from '../art/wild'
import { sfx } from '../audio/sfx'
import { awakePets, ensureAwakeActive } from '../battle/progress'
import { SPECIES, type SpeciesId } from '../data/creatures'
import { texts } from '../data/texts'
import { GAME_HEIGHT, GAME_WIDTH } from '../display'
import { zufall } from '../math/random'
import { activePet } from '../state/save'
import { getSave, replaceSave } from '../state/store'
import { Caption } from '../ui/Caption'
import { Hud } from '../ui/Hud'
import { LabelPill } from '../ui/LabelPill'
import type { Grid } from '../world/path'
import {
  ARRIVAL,
  AREAS,
  BOAT,
  FIND_RADIUS,
  OBSTACLE_SIZE,
  SPOT_SIZE,
  WANDER_RADIUS,
  WILD_HEIGHT,
  WILD_WIDTH,
  buildWildGrid,
  hideCreatures,
  rehide,
  isWalkable,
  route,
  type Area,
  type HidingSpot,
} from '../world/wild'
import { PixelScene } from './PixelScene'

const SPEED = 48 // art px per second, like in the village
const CREATURE_SPEED = 10
const TOUCH = 9
const PET_DISTANCE = 12
const RUSTLE_EVERY_MS = 2600

type Creature = {
  species: SpeciesId
  spot: HidingSpot
  found: boolean
  pos: { x: number; y: number }
  goal: { x: number; y: number }
  waitUntil: number
  sprite: Pet
  pill: LabelPill
  /** Within touching distance last frame: only walking *into* a creature starts a battle */
  near: boolean
}

type Target =
  | { kind: 'creature'; creature: Creature }
  | { kind: 'hiding'; spot: HidingSpot }
  | { kind: 'boat' }
  | { kind: 'spot' }

/**
 * One visit to the island, kept while she battles: where everybody hides, who was found,
 * where she stood. A new boat trip starts a new game of hide-and-seek.
 */
type Visit = {
  spots: Map<SpeciesId, HidingSpot>
  found: Set<SpeciesId>
  returnPos: { x: number; y: number } | null
}
let visit: Visit | null = null

export class WildScene extends PixelScene {
  private area!: Area
  private grid!: Grid
  private hero!: Character
  private pet?: Pet
  private pos = { ...ARRIVAL }
  private view = { x: 0, y: 0 }
  private waypoints: { x: number; y: number }[] = []
  private target: Target | null = null
  private creatures: Creature[] = []
  private spotSprites = new Map<HidingSpot, Phaser.GameObjects.Image>()
  private hud!: Hud
  private caption!: Caption
  private areaPill!: LabelPill
  private keys!: Record<'up' | 'down' | 'left' | 'right', Phaser.Input.Keyboard.Key[]>
  /** No battles right after arriving, so she isn't pulled into one by accident */
  private calmUntil = 0
  private leaving = false
  private fromBattle = false

  constructor() {
    super('Wild')
  }

  init(data: { from?: string; beaten?: SpeciesId }) {
    this.fromBattle = data.from === 'battle' && visit !== null
    // A beaten creature runs off and hides again at once, somewhere else
    if (data.beaten && visit) {
      const from = visit.returnPos ?? ARRIVAL
      visit.spots = rehide(AREAS[0], visit.spots, data.beaten, from, Math.random)
      visit.found.delete(data.beaten)
    }
    this.waypoints = []
    this.target = null
    this.creatures = []
    this.spotSprites = new Map()
    this.leaving = false
  }

  create() {
    this.area = AREAS[0]
    this.setupCamera(WILD_WIDTH, WILD_HEIGHT)
    this.grid = buildWildGrid(this.area)
    if (!this.fromBattle) {
      visit = { spots: hideCreatures(this.area, Math.random), found: new Set(), returnPos: null }
    }
    this.pos = this.fromBattle && visit?.returnPos ? { ...visit.returnPos } : { ...ARRIVAL }
    this.add.image(0, 0, ensureWildTexture(this, this.area.id)).setOrigin(0)
    this.calmUntil = this.time.now + 1200

    for (const o of this.area.obstacles) {
      this.add
        .image(o.x, o.y, ensureObstacleTexture(this, o.kind), 'idle')
        .setOrigin(0)
        .setDepth(o.y + OBSTACLE_SIZE[o.kind].h - 2)
    }
    for (const spot of this.area.spots) {
      const image = this.add
        .image(spot.x, spot.y, ensureSpotTexture(this, spot.kind), 'idle')
        .setOrigin(0.5, 1)
        .setDepth(spot.y + 1)
      this.spotSprites.set(spot, image)
    }

    // A napping pet stays in the Tierheim; another awake pet comes along
    const { save, switchedTo } = ensureAwakeActive(getSave(), Date.now())
    if (switchedTo) replaceSave(save)

    this.hero = new Character(this, this.pos.x, this.pos.y, save.character?.look ?? DEFAULT_LOOK)
    this.hero.face('up').setName(save.character?.name ?? null)
    const pet = activePet(save)
    if (pet && awakePets(save, Date.now()).some((p) => p.id === pet.id)) {
      this.pet = new Pet(this, this.pos.x - PET_DISTANCE, this.pos.y, pet.species, pet.name)
      this.pet.showName(false)
    }

    for (const [species, spot] of visit!.spots) {
      const found = visit!.found.has(species)
      const pos = found ? this.besideSpot(spot) : { x: spot.x, y: spot.y - 2 }
      const sprite = new Pet(this, pos.x, pos.y, species)
      const level = SPECIES[species].wild!.level
      const pill = new LabelPill(this, pos.x, pos.y - 20, texts.wild.level(level), { size: 5 })
      this.creatures.push({
        species,
        spot,
        found,
        pos,
        goal: { ...pos },
        waitUntil: this.time.now + zufall(Math.random, 0, 2000),
        sprite,
        pill,
        near: Math.hypot(pos.x - this.pos.x, pos.y - this.pos.y) < TOUCH,
      })
    }

    this.areaPill = new LabelPill(this, 40, 46, this.area.name, { size: 6 }).setDepth(800)
    this.hud = new Hud(this, { onHome: () => this.leave() })
    this.caption = new Caption(this)
    this.followCamera()
    if (switchedTo) this.caption.show(texts.wild.nowAlong(switchedTo.name))
    else if (!this.fromBattle) this.caption.show(texts.wild.search, 3500)

    this.time.addEvent({ delay: RUSTLE_EVERY_MS, loop: true, callback: () => this.rustleOne() })
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

  // ---------- Input ----------

  private onTap(x: number, y: number) {
    if (this.leaving) return
    // Taps on the top bar buttons (mute, home, coins) are not walking targets
    const local = { x: x - this.view.x, y: y - this.view.y }
    if (local.y >= 0 && local.y < 20 && (local.x < 44 || local.x > GAME_WIDTH - 54)) return

    const creature = this.creatures.find(
      (c) => this.isVisible(c) && Math.abs(x - c.pos.x) < 10 && y < c.pos.y + 4 && y > c.pos.y - 18,
    )
    if (creature) return this.walk({ kind: 'creature', creature }, creature.pos)
    if (x >= BOAT.x - 4 && x < BOAT.x + BOAT.width + 4 && y >= BOAT.y - 6 && y < BOAT.y + 16) {
      return this.walk({ kind: 'boat' }, ARRIVAL)
    }
    if (this.pet && Math.abs(x - this.pet.x) < 10 && y < this.pet.y + 3 && y > this.pet.y - 16) {
      this.pet.hop()
      return
    }
    const spot = this.area.spots.find((s) => {
      const size = SPOT_SIZE[s.kind]
      return Math.abs(x - s.x) <= size.w / 2 + 2 && y <= s.y + 2 && y >= s.y - size.h - 2
    })
    if (spot) return this.walk({ kind: 'hiding', spot }, { x: spot.x, y: spot.y + 4 })
    this.walk({ kind: 'spot' }, { x, y })
  }

  private walk(target: Target, to: { x: number; y: number }) {
    const path = route(this.grid, this.pos, to)
    if (!path) return
    this.target = target
    this.waypoints = path
  }

  // ---------- Update ----------

  update(time: number) {
    const delta = Math.min(this.game.loop.rawDelta, 100)
    if (this.leaving) return
    const step = (SPEED * delta) / 1000
    const held = (dir: keyof typeof this.keys) => this.keys[dir].some((k) => k.isDown)
    const kx = Number(held('right')) - Number(held('left'))
    const ky = Number(held('down')) - Number(held('up'))
    let moving = false

    if (kx || ky) {
      this.waypoints = []
      this.target = null
      const len = Math.hypot(kx, ky)
      this.tryMove((kx / len) * step, 0)
      this.tryMove(0, (ky / len) * step)
      this.faceTowards(kx, ky)
      moving = true
    } else if (this.waypoints.length > 0) {
      // Follow a creature that keeps strolling around
      const t = this.target
      if (t?.kind === 'creature' && this.waypoints.length === 1) {
        if (isWalkable(this.grid, t.creature.pos.x, t.creature.pos.y)) {
          this.waypoints[0] = { ...t.creature.pos }
        }
      }
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

    this.hero.setPosition(Math.round(this.pos.x), Math.round(this.pos.y)).setDepth(this.pos.y)
    this.hero.setWalking(moving)
    this.hero.tick(delta)
    this.followWithPet(delta)
    this.searchAround()
    this.wander(time, delta)
    if (moving) this.checkTouch(time)
    else for (const c of this.creatures) c.near ||= this.touches(c)
    this.followCamera()
  }

  /** Camera centred on her; top bar, captions and the area name stay pinned to the view. */
  private followCamera() {
    this.view = this.scrollViewToXY(
      this.pos.x - GAME_WIDTH / 2,
      this.pos.y - GAME_HEIGHT / 2,
      WILD_WIDTH,
      WILD_HEIGHT,
    )
    this.hud.setView(this.view.x, this.view.y)
    this.caption.setView(this.view.x, this.view.y)
    this.areaPill.setPosition(this.view.x + 40, this.view.y + 46)
  }

  private tryMove(dx: number, dy: number) {
    if (isWalkable(this.grid, this.pos.x + dx, this.pos.y + dy)) {
      this.pos.x += dx
      this.pos.y += dy
    }
  }

  private faceTowards(dx: number, dy: number) {
    if (Math.abs(dx) > Math.abs(dy)) this.hero.face(dx > 0 ? 'right' : 'left')
    else if (dy !== 0) this.hero.face(dy > 0 ? 'down' : 'up')
  }

  private arrive() {
    const target = this.target
    this.target = null
    if (target?.kind === 'boat') this.leave()
    else if (target?.kind === 'creature') this.startBattle(target.creature)
    else if (target?.kind === 'hiding') {
      // Nobody here: the bush only rustles
      const hidden = this.creatures.some(
        (c) => c.spot === target.spot && !c.found,
      )
      if (!hidden) {
        this.rustle(target.spot)
        this.caption.show(texts.wild.nobody, 1500)
      }
    }
  }

  // ---------- Hide and seek ----------

  private isVisible(c: Creature) {
    return c.found
  }

  private touches(c: Creature) {
    return this.isVisible(c) && Math.hypot(c.pos.x - this.pos.x, c.pos.y - this.pos.y) < TOUCH
  }

  /**
   * Where a found creature stands: next to its hiding place, on the side away from her
   * (`away`), so finding it never bumps her straight into a battle.
   */
  private besideSpot(spot: HidingSpot, away?: { x: number; y: number }) {
    const candidates = [
      { x: spot.x, y: spot.y + 8 },
      { x: spot.x - 16, y: spot.y + 2 },
      { x: spot.x + 16, y: spot.y + 2 },
      { x: spot.x, y: spot.y - 16 },
    ].filter((p) => isWalkable(this.grid, p.x, p.y))
    if (away) {
      const dist = (p: { x: number; y: number }) => Math.hypot(p.x - away.x, p.y - away.y)
      candidates.sort((a, b) => dist(b) - dist(a))
    }
    return candidates[0] ?? { x: spot.x, y: spot.y }
  }

  /** Coming close to a hiding creature makes it hop out. */
  private searchAround() {
    for (const c of this.creatures) {
      if (c.found) continue
      const d = Math.hypot(c.spot.x - this.pos.x, c.spot.y - 4 - this.pos.y)
      if (d >= FIND_RADIUS) continue
      c.found = true
      visit?.found.add(c.species)
      c.pos = this.besideSpot(c.spot, this.pos)
      c.goal = { ...c.pos }
      c.waitUntil = this.time.now + 1500
      // She stops to look; a battle only starts when she taps it or walks into it
      c.near = true
      if (this.target?.kind !== 'creature') {
        this.waypoints = []
        this.target = null
      }
      this.rustle(c.spot)
      c.sprite.setVisible(true).hop()
      sfx.pling()
      this.caption.show(texts.wild.found(SPECIES[c.species].name), 1800)
    }
  }

  /** Every few seconds one hiding place with a creature inside rustles gently. */
  private rustleOne() {
    const hiding = this.creatures.filter((c) => !c.found)
    if (hiding.length === 0) return
    this.rustle(hiding[Math.floor(Math.random() * hiding.length)].spot)
  }

  private rustle(spot: HidingSpot) {
    const image = this.spotSprites.get(spot)
    if (!image) return
    ;[1, -1, 1, -1, 0].forEach((dx, i) =>
      this.time.delayedCall(i * 90, () => image.setX(spot.x + dx)),
    )
  }

  /** A battle starts when she walks into a creature – never when she walks away from one. */
  private checkTouch(time: number) {
    let touched: Creature | undefined
    for (const c of this.creatures) {
      const near = this.touches(c)
      if (near && !c.near) touched ??= c
      c.near = near
    }
    if (touched && time >= this.calmUntil) this.startBattle(touched)
  }

  private startBattle(creature: Creature) {
    const save = getSave()
    this.waypoints = []
    this.target = null
    if (save.pets.length === 0) return this.bounceBack(texts.wild.noPet)
    const pet = activePet(save)
    if (!pet || !awakePets(save, Date.now()).some((p) => p.id === pet.id)) {
      return this.bounceBack(texts.wild.allAsleep)
    }
    if (visit) visit.returnPos = { ...this.pos }
    this.leaving = true
    this.hero.setWalking(false)
    this.goTo('Battle', { foe: creature.species })
  }

  /** No battle possible: a friendly message. */
  private bounceBack(message: string) {
    this.caption.show(message, 3000)
    this.calmUntil = this.time.now + 3000
  }

  private leave() {
    if (this.leaving) return
    this.leaving = true
    visit = null
    this.goTo('Village', { from: 'steg' })
  }

  private followWithPet(delta: number) {
    if (!this.pet) return
    const dx = this.pos.x - this.pet.x
    const dy = this.pos.y - this.pet.y
    const dist = Math.hypot(dx, dy)
    if (dist > PET_DISTANCE) {
      const k = (dist - PET_DISTANCE) / dist
      const x = Math.round(this.pet.x + dx * k)
      if (x !== this.pet.x) this.pet.setFlip(x < this.pet.x)
      this.pet.setPosition(x, Math.round(this.pet.y + dy * k))
    }
    this.pet.setDepth(this.pet.y)
    this.pet.tick(delta)
  }

  /** Found creatures stroll slowly around their hiding place and pause now and then. */
  private wander(time: number, delta: number) {
    for (const c of this.creatures) {
      const visible = this.isVisible(c)
      c.sprite.setVisible(visible)
      c.pill.setVisible(visible)
      if (!visible) continue
      if (time >= c.waitUntil) {
        const dx = c.goal.x - c.pos.x
        const dy = c.goal.y - c.pos.y
        const dist = Math.hypot(dx, dy)
        const step = (CREATURE_SPEED * delta) / 1000
        if (dist <= step) {
          c.pos = { ...c.goal }
          c.goal = this.strollGoal(c)
          c.waitUntil = time + zufall(Math.random, 1000, 3000)
        } else {
          c.pos.x += (dx / dist) * step
          c.pos.y += (dy / dist) * step
          if (Math.abs(dx) > 0.5) c.sprite.setFlip(dx < 0)
        }
      }
      const x = Math.round(c.pos.x)
      const y = Math.round(c.pos.y)
      c.sprite.setPosition(x, y).setDepth(y)
      c.pill.setPosition(x, y - 20).setDepth(y + 1)
      c.sprite.tick(delta)
    }
  }

  /** A free point near the hiding place (short straight lines, so no path needed). */
  private strollGoal(c: Creature) {
    const home = this.besideSpot(c.spot)
    for (let i = 0; i < 6; i++) {
      const angle = Math.random() * Math.PI * 2
      const r = Math.random() * WANDER_RADIUS
      const p = { x: home.x + Math.cos(angle) * r, y: home.y + Math.sin(angle) * r * 0.6 }
      if (isWalkable(this.grid, p.x, p.y)) return p
    }
    return home
  }

  // ---------- End-to-end test hooks ----------

  debugState() {
    return {
      hero: { ...this.pos },
      creatures: this.creatures
        .map((c) => ({
          species: c.species,
          found: c.found,
          x: c.pos.x,
          y: c.pos.y,
          spot: { x: c.spot.x, y: c.spot.y },
        })),
    }
  }

  /** Taps a world point, even one outside the view. */
  debugTap(x: number, y: number) {
    this.onTap(x, y)
  }
}
