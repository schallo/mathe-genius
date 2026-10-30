import { describe, expect, it } from 'vitest'
import { plantMap } from '../art/plants'
import { mapSize } from '../art/pixels'
import { findPath, isBlocked } from './path'
import {
  HUTS,
  HUT_HEIGHT,
  HUT_WIDTH,
  MAIN_PATH,
  FISHING_SPOT,
  POND,
  isPondTap,
  PLANTS,
  PLANT_KINDS,
  SEA,
  plantKeepOut,
  plantRect,
  SPAWN,
  VILLAGE_HEIGHT,
  VILLAGE_WIDTH,
  buildWalkGrid,
  doorEntry,
  SIGN_HEIGHT,
  hutAt,
  toCell,
} from './village'

const overlaps = (
  a: { x: number; y: number; w: number; h: number },
  b: { x: number; y: number; w: number; h: number },
) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h

const hutRect = (h: (typeof HUTS)[number]) => ({ x: h.x, y: h.y, w: HUT_WIDTH, h: HUT_HEIGHT })

describe('village layout', () => {
  it('keeps every hut inside the map and off the main path', () => {
    const path = { x: MAIN_PATH.x, y: 0, w: MAIN_PATH.width, h: VILLAGE_HEIGHT }
    for (const hut of HUTS) {
      expect(hut.x).toBeGreaterThanOrEqual(0)
      expect(hut.x + HUT_WIDTH).toBeLessThanOrEqual(VILLAGE_WIDTH)
      expect(overlaps(hutRect(hut), path), hut.id).toBe(false)
    }
  })

  it('has no overlapping huts and keeps the pond free', () => {
    const pond = { x: POND.x, y: POND.y, w: POND.width, h: POND.height }
    HUTS.forEach((a, i) => {
      expect(overlaps(hutRect(a), pond), a.id).toBe(false)
      HUTS.slice(i + 1).forEach((b) => expect(overlaps(hutRect(a), hutRect(b))).toBe(false))
    })
  })

  it('scatters many kinds of plants, off huts, name boards, paths and the pond', () => {
    expect(PLANTS.length).toBeGreaterThanOrEqual(20)
    expect(new Set(PLANTS.map((p) => p.kind)).size).toBe(Object.keys(PLANT_KINDS).length)
    const keepOut = plantKeepOut()
    PLANTS.forEach((p, i) => {
      const r = plantRect(p)
      expect(r.x).toBeGreaterThanOrEqual(0)
      expect(r.x + r.w).toBeLessThanOrEqual(VILLAGE_WIDTH)
      expect(r.y).toBeGreaterThan(SEA.top)
      expect(r.y + r.h).toBeLessThan(SEA.bottom)
      for (const k of keepOut) expect(overlaps(r, k), `${p.kind} ${p.x},${p.y}`).toBe(false)
      for (const q of PLANTS.slice(i + 1)) expect(overlaps(r, plantRect(q))).toBe(false)
    })
    // Same layout every time (fixed seed): drawn back to front
    const bottoms = PLANTS.map((p) => p.y + PLANT_KINDS[p.kind].h)
    expect(bottoms).toEqual([...bottoms].sort((a, b) => a - b))
  })

  it('has a sprite of the right size for every kind of plant, feet inside', () => {
    for (const [kind, size] of Object.entries(PLANT_KINDS)) {
      const map = plantMap(kind as keyof typeof PLANT_KINDS)
      expect(mapSize(map), kind).toEqual({ width: size.w, height: size.h })
      expect(size.foot.x + size.foot.w).toBeLessThanOrEqual(size.w)
      expect(size.foot.y + size.foot.h).toBeLessThanOrEqual(size.h)
    }
  })

  it('has unique hut ids and finds huts by position', () => {
    expect(new Set(HUTS.map((h) => h.id)).size).toBe(HUTS.length)
    for (const hut of HUTS) expect(hutAt(hut.x + 5, hut.y + 5)).toBe(hut)
    // The name board on the roof counts as the hut too
    for (const hut of HUTS) expect(hutAt(hut.x + 16, hut.y - SIGN_HEIGHT + 2)).toBe(hut)
    expect(hutAt(SPAWN.x, SPAWN.y)).toBeUndefined()
  })

  it('has short names for the boards on the roofs', () => {
    for (const hut of HUTS) expect(hut.sign.length).toBeLessThanOrEqual(10)
  })

  it('can reach every hut door from the spawn point', () => {
    const grid = buildWalkGrid()
    const start = toCell(SPAWN.x, SPAWN.y)
    expect(isBlocked(grid, start.cx, start.cy)).toBe(false)
    for (const hut of HUTS) {
      const door = doorEntry(hut)
      expect(findPath(grid, start, toCell(door.x, door.y)), hut.id).not.toBeNull()
    }
  })

  it('has a free fishing spot below the pond that a pond tap leads to', () => {
    const grid = buildWalkGrid()
    const spot = toCell(FISHING_SPOT.x, FISHING_SPOT.y)
    expect(isBlocked(grid, spot.cx, spot.cy)).toBe(false)
    expect(findPath(grid, toCell(SPAWN.x, SPAWN.y), spot)).not.toBeNull()
    expect(isPondTap(POND.x + 10, POND.y + 5)).toBe(true)
    expect(isPondTap(POND.x + 10, POND.y + 40)).toBe(false)
    expect(hutAt(POND.x + 10, POND.y + 5)).toBeUndefined()
  })
})

describe('findPath', () => {
  const grid = { cols: 5, rows: 3, blocked: Array.from({ length: 15 }, () => false) }
  // Wall in the middle column with a gap at the bottom
  grid.blocked[2] = true
  grid.blocked[7] = true

  it('walks around obstacles', () => {
    const path = findPath(grid, { cx: 0, cy: 0 }, { cx: 4, cy: 0 })!
    expect(path.at(-1)).toEqual({ cx: 4, cy: 0 })
    expect(path.some((c) => c.cx === 2 && c.cy === 2)).toBe(true)
    for (const c of path) expect(isBlocked(grid, c.cx, c.cy)).toBe(false)
  })

  it('returns null for a blocked goal', () => {
    expect(findPath(grid, { cx: 0, cy: 0 }, { cx: 2, cy: 0 })).toBeNull()
  })
})
