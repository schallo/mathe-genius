// Wild islands (GAME_DESIGN §6b) as data. Pure logic, no Phaser.
// A big oval island (scrolls in both directions) with trees, palms, rocks and a pond.
// Wild creatures hide in bushes and tall grass – she has to search for them.
// Every island has its own theme (art/wild.ts draws the same layout kinds differently:
// a "tree" is a fir in the forest, an acacia in the savanna, a cloud on the Wolkenberg).
import type { AreaId, SpeciesId } from '../data/creatures'
import { findPath, isBlocked, nearestFree, type Cell, type Grid } from './path'

export const WILD_WIDTH = 300
export const WILD_HEIGHT = 600
/** Walk grid resolution in pixels. */
export const WILD_CELL = 6

/** The island (grass + sandy rim) and the walkable meadow inside it. */
export const ISLAND = { cx: 150, cy: 286, rx: 144, ry: 272 }
export const MEADOW = { cx: 150, cy: 286, rx: 130, ry: 256 }

/** Jetty from the island down to the boat; she arrives and leaves here. */
export const JETTY = { x: 142, y: 536, width: 16, height: 54 }
export const BOAT = { x: 158, y: 572, width: 22, height: 10 }
export const ARRIVAL = { x: 150, y: 580 }

/** She finds a hiding creature when she comes this close to its spot. */
export const FIND_RADIUS = 22

export type ObstacleKind = 'palm' | 'tree' | 'rock'

/** Sprite size and the part of it that blocks walking (feet can pass behind the top). */
export const OBSTACLE_SIZE: Record<ObstacleKind, { w: number; h: number; blockTop: number }> = {
  palm: { w: 12, h: 16, blockTop: 8 },
  tree: { w: 20, h: 24, blockTop: 12 },
  rock: { w: 14, h: 10, blockTop: 3 },
}

/** Top-left corner of the sprite. */
export type Obstacle = { kind: ObstacleKind; x: number; y: number }

export type SpotKind = 'bush' | 'grass'

/** Bushes and tall grass are walkable and drawn above everything – good hiding places. */
export const SPOT_SIZE: Record<SpotKind, { w: number; h: number }> = {
  bush: { w: 18, h: 14 },
  grass: { w: 26, h: 12 },
}

/** Bottom centre of the bush or grass patch (where a hiding creature stands). */
export type HidingSpot = { kind: SpotKind; x: number; y: number }

/** Look of an island: ground, plants and sea (see art/wild.ts) */
export type Theme = 'wiese' | 'wald' | 'savanne' | 'urzeit' | 'wolken'

export type Area = {
  id: AreaId
  name: string
  theme: Theme
  /** Level her strongest pet needs (GAME_DESIGN §6b) */
  unlockLevel: number
  species: SpeciesId[]
  obstacles: Obstacle[]
  spots: HidingSpot[]
  pond: { cx: number; cy: number; rx: number; ry: number }
}

/** Palms along the sandy rim, every `step` degrees (skipping the jetty at the bottom). */
function rimPalms(step: number): Obstacle[] {
  const palms: Obstacle[] = []
  for (let deg = 0; deg < 360; deg += step) {
    if (deg > 70 && deg < 110) continue // the jetty
    const a = (deg * Math.PI) / 180
    const x = Math.round(ISLAND.cx + (ISLAND.rx - 9) * Math.cos(a) - 6)
    const y = Math.round(ISLAND.cy + (ISLAND.ry - 9) * Math.sin(a) - 14)
    palms.push({ kind: 'palm', x, y })
  }
  return palms
}

const BLUMENWIESE: Area = {
  id: 'blumenwiese',
  name: 'Blumenwiese',
  theme: 'wiese',
  unlockLevel: 1,
  species: ['igel', 'eichhoernchen', 'fuchs'],
  obstacles: [
    ...rimPalms(24),
    { kind: 'tree', x: 44, y: 116 },
    { kind: 'tree', x: 62, y: 128 },
    { kind: 'tree', x: 226, y: 136 },
    { kind: 'tree', x: 176, y: 236 },
    { kind: 'tree', x: 30, y: 362 },
    { kind: 'tree', x: 118, y: 374 },
    { kind: 'tree', x: 136, y: 386 },
    { kind: 'tree', x: 250, y: 330 },
    { kind: 'tree', x: 204, y: 408 },
    { kind: 'tree', x: 64, y: 462 },
    { kind: 'rock', x: 128, y: 108 },
    { kind: 'rock', x: 98, y: 170 },
    { kind: 'rock', x: 256, y: 250 },
    { kind: 'rock', x: 150, y: 296 },
    { kind: 'rock', x: 222, y: 478 },
  ],
  spots: [
    { kind: 'bush', x: 96, y: 88 },
    { kind: 'grass', x: 206, y: 96 },
    { kind: 'bush', x: 160, y: 162 },
    { kind: 'grass', x: 60, y: 206 },
    { kind: 'bush', x: 246, y: 206 },
    { kind: 'bush', x: 104, y: 262 },
    { kind: 'grass', x: 58, y: 322 },
    { kind: 'bush', x: 160, y: 344 },
    { kind: 'grass', x: 244, y: 386 },
    { kind: 'bush', x: 96, y: 432 },
    { kind: 'grass', x: 176, y: 462 },
    { kind: 'bush', x: 112, y: 504 },
  ],
  pond: { cx: 206, cy: 300, rx: 24, ry: 13 },
}

/**
 * The same proven layout mirrored left ↔ right (the island, the meadow and the jetty are
 * symmetric, so every hiding place stays reachable – the tests check it for every island).
 */
function mirrored(a: Area): Pick<Area, 'obstacles' | 'spots' | 'pond'> {
  return {
    obstacles: a.obstacles.map((o) => ({ ...o, x: WILD_WIDTH - o.x - OBSTACLE_SIZE[o.kind].w })),
    spots: a.spots.map((s) => ({ ...s, x: WILD_WIDTH - s.x })),
    pond: { ...a.pond, cx: WILD_WIDTH - a.pond.cx },
  }
}

const layout = (mirror: boolean) =>
  mirror
    ? mirrored(BLUMENWIESE)
    : { obstacles: BLUMENWIESE.obstacles, spots: BLUMENWIESE.spots, pond: BLUMENWIESE.pond }

/** Islands she may visit: her strongest pet has reached the island's level. */
export const isUnlocked = (a: Area, strongestLevel: number) => strongestLevel >= a.unlockLevel

/** How far a found creature strolls around its spot. */
export const WANDER_RADIUS = 16

export const area = (id: AreaId): Area => AREAS.find((a) => a.id === id)!

function inEllipse(e: typeof MEADOW, x: number, y: number): boolean {
  return ((x - e.cx) / e.rx) ** 2 + ((y - e.cy) / e.ry) ** 2 <= 1
}

function onJetty(x: number, y: number): boolean {
  return x >= JETTY.x && x < JETTY.x + JETTY.width && y >= JETTY.y && y < JETTY.y + JETTY.height
}

/** Walk grid: the meadow and the jetty are free; trees, palms, rocks and the pond block. */
export function buildWildGrid(a: Area): Grid {
  const cols = WILD_WIDTH / WILD_CELL
  const rows = WILD_HEIGHT / WILD_CELL
  const blocked = Array.from({ length: cols * rows }, (_, i) => {
    const x = (i % cols) * WILD_CELL + WILD_CELL / 2
    const y = Math.floor(i / cols) * WILD_CELL + WILD_CELL / 2
    return !inEllipse(MEADOW, x, y) && !onJetty(x, y)
  })
  const block = (x: number, y: number, w: number, h: number) => {
    for (let cy = Math.floor(y / WILD_CELL); cy < Math.ceil((y + h) / WILD_CELL); cy++) {
      for (let cx = Math.floor(x / WILD_CELL); cx < Math.ceil((x + w) / WILD_CELL); cx++) {
        if (cx >= 0 && cy >= 0 && cx < cols && cy < rows) blocked[cy * cols + cx] = true
      }
    }
  }
  for (const o of a.obstacles) {
    const s = OBSTACLE_SIZE[o.kind]
    block(o.x + 1, o.y + s.blockTop, s.w - 2, s.h - s.blockTop)
  }
  const p = a.pond
  block(p.cx - p.rx + 3, p.cy - p.ry + 2, p.rx * 2 - 6, p.ry * 2 - 4)
  return { cols, rows, blocked }
}

export const toWildCell = (x: number, y: number): Cell => ({
  cx: Math.floor(x / WILD_CELL),
  cy: Math.floor(y / WILD_CELL),
})

export const wildCellCenter = (c: Cell) => ({
  x: c.cx * WILD_CELL + WILD_CELL / 2,
  y: c.cy * WILD_CELL + WILD_CELL / 2,
})

export const isWalkable = (grid: Grid, x: number, y: number) => {
  const c = toWildCell(x, y)
  return !isBlocked(grid, c.cx, c.cy)
}

/** Waypoints around obstacles to the nearest free point at `to`, or null if unreachable. */
export function route(
  grid: Grid,
  from: { x: number; y: number },
  to: { x: number; y: number },
): { x: number; y: number }[] | null {
  let goal = { ...to }
  let end = toWildCell(to.x, to.y)
  if (isBlocked(grid, end.cx, end.cy)) {
    const free = nearestFree(grid, end.cx, end.cy)
    if (!free) return null
    end = free
    goal = wildCellCenter(free)
  }
  const cells = findPath(grid, toWildCell(from.x, from.y), end)
  if (!cells) return null
  return [...cells.slice(0, -1).map(wildCellCenter), goal]
}

/** A respawned creature hides at least this far away from her. */
export const RESPAWN_DISTANCE = 80

/**
 * After a win the beaten creature runs off and hides again right away – in another free
 * hiding place, away from her – so there is always something to find.
 */
export function rehide(
  a: Area,
  hidden: Map<SpeciesId, HidingSpot>,
  species: SpeciesId,
  from: { x: number; y: number },
  rng: () => number,
): Map<SpeciesId, HidingSpot> {
  const old = hidden.get(species)
  const taken = new Set([...hidden.values()])
  const free = a.spots.filter((s) => !taken.has(s) && s !== old)
  const far = free.filter((s) => Math.hypot(s.x - from.x, s.y - from.y) >= RESPAWN_DISTANCE)
  const choices = far.length > 0 ? far : free
  if (choices.length === 0) return hidden
  const next = new Map(hidden)
  next.set(species, choices[Math.floor(rng() * choices.length)])
  return next
}

/** Each creature hides in a different spot, picked at random on every visit. */
export function hideCreatures(a: Area, rng: () => number): Map<SpeciesId, HidingSpot> {
  const free = [...a.spots]
  const hidden = new Map<SpeciesId, HidingSpot>()
  for (const species of a.species) {
    const [spot] = free.splice(Math.floor(rng() * free.length), 1)
    hidden.set(species, spot)
  }
  return hidden
}

// The islands come last: the forest layout needs the walk grid and routes defined above.
/**
 * A denser forest on top of a layout: extra trees on a fixed, staggered grid, wherever they
 * leave room – away from other plants, rocks, the pond, the hiding places (and the space
 * creatures stroll in) and the jetty. A tree that would cut a hiding place off from the boat
 * is left out, so every creature stays reachable.
 */
function withForest(
  base: Pick<Area, 'obstacles' | 'spots' | 'pond'>,
): Pick<Area, 'obstacles' | 'spots' | 'pond'> {
  const T = OBSTACLE_SIZE.tree
  const obstacles = [...base.obstacles]
  const free = (x: number, y: number) => {
    const cx = x + T.w / 2
    const foot = y + T.h
    if (!inEllipse({ ...MEADOW, rx: MEADOW.rx - 14, ry: MEADOW.ry - 14 }, cx, foot)) return false
    if (cx > JETTY.x - 30 && cx < JETTY.x + JETTY.width + 30 && foot > 470) return false
    const p = base.pond
    if (Math.abs(cx - p.cx) < p.rx + 16 && Math.abs(foot - 6 - p.cy) < p.ry + 20) return false
    if (base.spots.some((s) => Math.hypot(cx - s.x, foot - 6 - s.y) < FIND_RADIUS + 14)) {
      return false
    }
    return obstacles.every((o) => {
      const s = OBSTACLE_SIZE[o.kind]
      return Math.abs(cx - (o.x + s.w / 2)) >= 26 || Math.abs(foot - (o.y + s.h)) >= 22
    })
  }
  const reachable = (a: Pick<Area, 'obstacles' | 'spots' | 'pond'>) => {
    const grid = buildWildGrid(a as Area)
    return a.spots.every((s) => route(grid, ARRIVAL, s) !== null)
  }
  for (let row = 0, y = 40; y < WILD_HEIGHT - 80; row++, y += 26) {
    for (let x = 12 + (row % 2) * 14; x < WILD_WIDTH - 30; x += 28) {
      if (!free(x, y)) continue
      const tree: Obstacle = { kind: 'tree', x, y }
      if (reachable({ ...base, obstacles: [...obstacles, tree] })) obstacles.push(tree)
    }
  }
  return { ...base, obstacles }
}

/** In order of difficulty; an island opens when her strongest pet reaches its level. */
export const AREAS: Area[] = [
  BLUMENWIESE,
  {
    id: 'fluesterwald',
    name: 'Flüsterwald',
    theme: 'wald',
    unlockLevel: 3,
    species: ['eule', 'waschbaer', 'reh'],
    // A real forest: the mirrored meadow layout plus many more firs
    ...withForest(layout(true)),
  },
  {
    id: 'sonnensavanne',
    name: 'Sonnensavanne',
    theme: 'savanne',
    unlockLevel: 5,
    species: ['zebra', 'giraffe', 'elefant', 'loewe'],
    ...layout(false),
  },
  {
    id: 'urzeittal',
    name: 'Urzeittal',
    theme: 'urzeit',
    unlockLevel: 7,
    species: ['flugsaurier', 'triceratops', 'brachiosaurus', 'trex'],
    ...layout(true),
  },
  {
    id: 'wolkenberg',
    name: 'Wolkenberg',
    theme: 'wolken',
    unlockLevel: 9,
    species: ['pegasus', 'einhorn', 'drache'],
    ...layout(false),
  },
]
