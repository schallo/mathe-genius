// Wild islands (GAME_DESIGN §6b) as data. Pure logic, no Phaser.
// One screen (180 × 360): an oval meadow island, a jetty with the boat at the bottom.
import type { AreaId, SpeciesId } from '../data/creatures'

export const WILD_WIDTH = 180
export const WILD_HEIGHT = 360

/** The island (grass + beach rim) and the walkable meadow inside it. */
export const ISLAND = { cx: 90, cy: 172, rx: 84, ry: 150 }
export const MEADOW = { cx: 90, cy: 172, rx: 70, ry: 136 }

/** Jetty from the island down to the boat; she arrives and leaves here. */
export const JETTY = { x: 82, y: 296, width: 16, height: 50 }
export const BOAT = { x: 98, y: 330, width: 22, height: 10 }
export const ARRIVAL = { x: 90, y: 334 }
/** Where the jetty meets the meadow; walks between jetty and meadow pass this point. */
export const JETTY_TOP = { x: 90, y: 300 }

export type Area = {
  id: AreaId
  name: string
  /** Level her strongest pet needs (GAME_DESIGN §6b) */
  unlockLevel: number
  creatures: { species: SpeciesId; home: { x: number; y: number } }[]
  palms: { x: number; y: number }[]
}

export const AREAS: Area[] = [
  {
    id: 'blumenwiese',
    name: 'Blumenwiese',
    unlockLevel: 1,
    creatures: [
      { species: 'fuchs', home: { x: 90, y: 96 } },
      { species: 'eichhoernchen', home: { x: 128, y: 190 } },
      { species: 'igel', home: { x: 54, y: 236 } },
    ],
    palms: [
      { x: 8, y: 120 },
      { x: 160, y: 96 },
      { x: 10, y: 200 },
      { x: 158, y: 250 },
      { x: 30, y: 280 },
    ],
  },
]

/** How far wild creatures wander from their home. */
export const WANDER_RADIUS = 20

export const area = (id: AreaId): Area => AREAS.find((a) => a.id === id)!

const inEllipse = (e: typeof MEADOW, x: number, y: number) =>
  ((x - e.cx) / e.rx) ** 2 + ((y - e.cy) / e.ry) ** 2 <= 1

export const onJetty = (x: number, y: number) =>
  x >= JETTY.x && x < JETTY.x + JETTY.width && y >= JETTY.y && y < JETTY.y + JETTY.height

export const isWalkable = (x: number, y: number) => inEllipse(MEADOW, x, y) || onJetty(x, y)

/** The nearest walkable point: on the jetty as is, otherwise pulled into the meadow. */
export function clampToWalkable(x: number, y: number): { x: number; y: number } {
  if (isWalkable(x, y)) return { x, y }
  const dx = x - MEADOW.cx
  const dy = y - MEADOW.cy
  const k = 1 / Math.sqrt((dx / MEADOW.rx) ** 2 + (dy / MEADOW.ry) ** 2)
  // A hair inside the edge so rounding keeps it walkable
  return { x: MEADOW.cx + dx * k * 0.98, y: MEADOW.cy + dy * k * 0.98 }
}

/**
 * Waypoints from `from` to `to`. The meadow is convex, so a straight line works inside
 * it; between the meadow and the jetty she walks via the top of the jetty.
 */
export function route(
  from: { x: number; y: number },
  to: { x: number; y: number },
): { x: number; y: number }[] {
  const goal = clampToWalkable(to.x, to.y)
  if (onJetty(from.x, from.y) === onJetty(goal.x, goal.y)) return [goal]
  return [JETTY_TOP, goal]
}
