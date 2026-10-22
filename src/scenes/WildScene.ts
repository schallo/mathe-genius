// Wild island (GAME_DESIGN §6b): wild creatures wander visibly – no random encounters.
// Tap one (or walk into it) to start a battle; the boat at the jetty goes back to the village.
import Phaser from 'phaser'
import { Character } from '../art/character/Character'
import { DEFAULT_LOOK } from '../art/character/look'
import { Pet } from '../art/pets/Pet'
import { ensureWildTexture } from '../art/wild'
import { awakePets, ensureAwakeActive } from '../battle/progress'
import { SPECIES, type SpeciesId } from '../data/creatures'
import { texts } from '../data/texts'
import { zufall } from '../math/random'
import { activePet } from '../state/save'
import { getSave, replaceSave } from '../state/store'
import { Caption } from '../ui/Caption'
import { Hud } from '../ui/Hud'
import { LabelPill } from '../ui/LabelPill'
import {
  ARRIVAL,
  AREAS,
  BOAT,
  WANDER_RADIUS,
  WILD_HEIGHT,
  WILD_WIDTH,
  clampToWalkable,
  isWalkable,
  route,
  type Area,
} from '../world/wild'
import { PixelScene } from './PixelScene'

const SPEED = 48 // art px per second, like in the village
const CREATURE_SPEED = 10
const TOUCH = 9
const PET_DISTANCE = 12

type Creature = {
  species: SpeciesId
  home: { x: number; y: number }
  pos: { x: number; y: number }
  goal: { x: number; y: number }
  waitUntil: number
  sprite: Pet
  pill: LabelPill
}

type Target = { kind: 'creature'; creature: Creature } | { kind: 'boat' } | { kind: 'spot' }

/** Where she was when a battle started, so she comes back to the same spot. */
let returnPos: { x: number; y: number } | null = null

export class WildScene extends PixelScene {
  private area!: Area
  private hero!: Character
  private pet?: Pet
  private pos = { ...ARRIVAL }
  private waypoints: { x: number; y: number }[] = []
  private target: Target | null = null
  private creatures: Creature[] = []
  private caption!: Caption
  private keys!: Record<'up' | 'down' | 'left' | 'right', Phaser.Input.Keyboard.Key[]>
  /** No battles right after arriving, so she isn't pulled into one by accident */
  private calmUntil = 0
  private leaving = false
  private fromBattle = false

  constructor() {
    super('Wild')
  }

  init(data: { from?: string }) {
    this.fromBattle = data.from === 'battle'
    this.pos = this.fromBattle && returnPos ? { ...returnPos } : { ...ARRIVAL }
    this.waypoints = []
    this.target = null
    this.creatures = []
    this.leaving = false
  }

  create() {
    this.setupCamera(WILD_WIDTH, WILD_HEIGHT)
    this.area = AREAS[0]
    this.add.image(0, 0, ensureWildTexture(this, this.area.id)).setOrigin(0)
    this.calmUntil = this.time.now + 1200

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

    for (const c of this.area.creatures) {
      const sprite = new Pet(this, c.home.x, c.home.y, c.species)
      const pill = new LabelPill(
        this,
        c.home.x,
        c.home.y - 20,
        texts.wild.level(SPECIES[c.species].wild!.level),
        {
          size: 5,
        },
      )
      this.creatures.push({
        species: c.species,
        home: c.home,
        pos: { ...c.home },
        goal: { ...c.home },
        waitUntil: this.time.now + zufall(Math.random, 0, 2000),
        sprite,
        pill,
      })
    }

    new LabelPill(this, 40, 46, this.area.name, { size: 6 }).setDepth(800)
    new Hud(this, { onHome: () => this.leave() })
    this.caption = new Caption(this)
    if (switchedTo) this.caption.show(texts.wild.nowAlong(switchedTo.name))
    else if (!this.fromBattle) this.caption.show(this.area.name, 1500)

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
    if (y < 20 || this.leaving) return
    const creature = this.creatures.find(
      (c) => Math.abs(x - c.pos.x) < 10 && y < c.pos.y + 4 && y > c.pos.y - 18,
    )
    if (creature) {
      this.target = { kind: 'creature', creature }
      this.waypoints = route(this.pos, creature.pos)
      return
    }
    if (x >= BOAT.x - 4 && x < BOAT.x + BOAT.width + 4 && y >= BOAT.y - 6 && y < BOAT.y + 16) {
      this.target = { kind: 'boat' }
      this.waypoints = route(this.pos, ARRIVAL)
      return
    }
    if (this.pet && Math.abs(x - this.pet.x) < 10 && y < this.pet.y + 3 && y > this.pet.y - 16) {
      this.pet.hop()
      return
    }
    this.target = { kind: 'spot' }
    this.waypoints = route(this.pos, { x, y })
  }

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
      // Follow a creature that keeps wandering
      if (this.target?.kind === 'creature' && this.waypoints.length === 1) {
        this.waypoints[0] = clampToWalkable(this.target.creature.pos.x, this.target.creature.pos.y)
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
    this.wander(time, delta)
    if (moving) this.checkTouch(time)
  }

  private tryMove(dx: number, dy: number) {
    if (isWalkable(this.pos.x + dx, this.pos.y + dy)) {
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
  }

  private checkTouch(time: number) {
    if (time < this.calmUntil) return
    const touched = this.creatures.find(
      (c) => Math.hypot(c.pos.x - this.pos.x, c.pos.y - this.pos.y) < TOUCH,
    )
    if (touched) this.startBattle(touched)
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
    returnPos = { ...this.pos }
    this.leaving = true
    this.hero.setWalking(false)
    this.goTo('Battle', { foe: creature.species })
  }

  /** No battle possible: a friendly message, and she steps back so it doesn't repeat. */
  private bounceBack(message: string) {
    this.caption.show(message, 3000)
    this.calmUntil = this.time.now + 3000
  }

  private leave() {
    if (this.leaving) return
    this.leaving = true
    returnPos = null
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

  /** Creatures stroll slowly around their home and pause now and then. */
  private wander(time: number, delta: number) {
    for (const c of this.creatures) {
      if (time >= c.waitUntil) {
        const dx = c.goal.x - c.pos.x
        const dy = c.goal.y - c.pos.y
        const dist = Math.hypot(dx, dy)
        const step = (CREATURE_SPEED * delta) / 1000
        if (dist <= step) {
          c.pos = { ...c.goal }
          const angle = Math.random() * Math.PI * 2
          const r = Math.random() * WANDER_RADIUS
          c.goal = clampToWalkable(
            c.home.x + Math.cos(angle) * r,
            c.home.y + Math.sin(angle) * r * 0.6,
          )
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

  /** For end-to-end tests: where the creatures are. */
  debugState() {
    return {
      hero: { ...this.pos },
      creatures: this.creatures.map((c) => ({ species: c.species, x: c.pos.x, y: c.pos.y })),
    }
  }
}
