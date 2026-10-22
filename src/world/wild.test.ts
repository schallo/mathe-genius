import { describe, expect, it } from 'vitest'
import { SPECIES } from '../data/creatures'
import { seededRng } from '../math/random'
import { isBlocked } from './path'
import {
  ARRIVAL,
  AREAS,
  FIND_RADIUS,
  ISLAND,
  OBSTACLE_SIZE,
  SPOT_SIZE,
  buildWildGrid,
  RESPAWN_DISTANCE,
  hideCreatures,
  rehide,
  isWalkable,
  route,
  toWildCell,
} from './wild'

const overlaps = (
  a: { x: number; y: number; w: number; h: number },
  b: { x: number; y: number; w: number; h: number },
) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h

const inIsland = (x: number, y: number) =>
  ((x - ISLAND.cx) / ISLAND.rx) ** 2 + ((y - ISLAND.cy) / ISLAND.ry) ** 2 <= 1

for (const a of AREAS) {
  describe(`wild island ${a.name}`, () => {
    const grid = buildWildGrid(a)

    it('has only wild creatures of this area', () => {
      for (const s of a.species) expect(SPECIES[s].wild?.area).toBe(a.id)
    })

    it('has more hiding spots than creatures, all walkable and reachable from the boat', () => {
      expect(a.spots.length).toBeGreaterThanOrEqual(a.species.length * 3)
      for (const spot of a.spots) {
        expect(isWalkable(grid, spot.x, spot.y), `${spot.x},${spot.y}`).toBe(true)
        const path = route(grid, ARRIVAL, spot)
        expect(path, `${spot.x},${spot.y}`).not.toBeNull()
      }
    })

    it('keeps hiding spots apart, so finding one creature never reveals another', () => {
      for (const s of a.spots) {
        for (const t of a.spots) {
          if (s !== t) expect(Math.hypot(s.x - t.x, s.y - t.y)).toBeGreaterThan(FIND_RADIUS * 2)
        }
      }
    })

    it('puts bushes and grass on free ground, not on trees, rocks or the pond', () => {
      for (const spot of a.spots) {
        const size = SPOT_SIZE[spot.kind]
        const rect = { x: spot.x - size.w / 2, y: spot.y - size.h, w: size.w, h: size.h }
        for (const o of a.obstacles) {
          const s = OBSTACLE_SIZE[o.kind]
          expect(overlaps(rect, { x: o.x, y: o.y, w: s.w, h: s.h }), `${spot.x},${spot.y}`).toBe(
            false,
          )
        }
      }
    })

    it('keeps trees and rocks on the island and the arrival on the jetty free', () => {
      for (const o of a.obstacles) {
        const s = OBSTACLE_SIZE[o.kind]
        expect(inIsland(o.x + s.w / 2, o.y + s.h), `${o.kind} ${o.x},${o.y}`).toBe(true)
      }
      const c = toWildCell(ARRIVAL.x, ARRIVAL.y)
      expect(isBlocked(grid, c.cx, c.cy)).toBe(false)
    })

    it('a beaten creature hides again at once in another free spot, away from her', () => {
      const rng = seededRng(4)
      for (let i = 0; i < 200; i++) {
        const hidden = hideCreatures(a, rng)
        const species = a.species[i % a.species.length]
        const old = hidden.get(species)!
        const her = { x: old.x, y: old.y + 8 }
        const next = rehide(a, hidden, species, her, rng)
        const spot = next.get(species)!
        expect(spot).not.toBe(old)
        expect(new Set(next.values()).size).toBe(a.species.length)
        expect(Math.hypot(spot.x - her.x, spot.y - her.y)).toBeGreaterThanOrEqual(RESPAWN_DISTANCE)
      }
    })

    it('hides every creature in a different spot', () => {
      for (let seed = 1; seed < 50; seed++) {
        const hidden = hideCreatures(a, seededRng(seed))
        expect([...hidden.keys()]).toEqual(a.species)
        expect(new Set(hidden.values()).size).toBe(a.species.length)
      }
    })
  })
}
