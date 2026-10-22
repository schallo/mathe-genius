// Wild islands (GAME_DESIGN §6b) as data. Pure logic, no Phaser.
// A big oval island (scrolls in both directions) with trees, palms, rocks and a pond.
// Wild creatures hide in bushes and tall grass – she has to search for them.
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

export type Area = {
  id: AreaId
  name: string
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

export const AREAS: Area[] = [
  {
    id: 'blumenwiese',
    name: 'Blumenwiese',
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
  },
]

/** She finds a hiding creature when she comes this close to its spot. */
export const FIND_RADIUS = 22
/** How far a found creature strolls around its spot. */
export const WANDER_RADIUS = 16

export const area = (id: AreaId): Area => AREAS.find((a) => a.id === id)!

const inEllipse = (e: typeof MEADOW, x: number, y: number) =>
  ((x - e.cx) / e.rx) ** 2 + ((y - e.cy) / e.ry) ** 2 <= 1

const onJetty = (x: number, y: number) =>
  x >= JETTY.x && x < JETTY.x + JETTY.width && y >= JETTY.y && y < JETTY.y + JETTY.height

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
