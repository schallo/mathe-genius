import { describe, expect, it } from 'vitest'
import { findPath, isBlocked } from './path'
import {
  HUTS,
  HUT_HEIGHT,
  HUT_WIDTH,
  MAIN_PATH,
  POND,
  TREES,
  TREE_HEIGHT,
  TREE_WIDTH,
  branchPath,
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

  it('keeps trees off huts and paths', () => {
    const rects = [
      ...HUTS.map(hutRect),
      ...HUTS.map(branchPath).map((p) => ({ x: p.x, y: p.y, w: p.width, h: p.height })),
      { x: MAIN_PATH.x, y: 0, w: MAIN_PATH.width, h: VILLAGE_HEIGHT },
    ]
    for (const t of TREES) {
      const tree = { x: t.x, y: t.y, w: TREE_WIDTH, h: TREE_HEIGHT }
      expect(tree.x + tree.w).toBeLessThanOrEqual(VILLAGE_WIDTH)
      for (const r of rects) expect(overlaps(tree, r), `${t.x},${t.y}`).toBe(false)
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
