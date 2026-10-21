// Grid pathfinding for tap-to-walk. Pure logic, no Phaser.

export type Cell = { cx: number; cy: number }

export type Grid = {
  cols: number
  rows: number
  /** true = blocked */
  blocked: boolean[]
}

export function isBlocked(grid: Grid, cx: number, cy: number): boolean {
  if (cx < 0 || cy < 0 || cx >= grid.cols || cy >= grid.rows) return true
  return grid.blocked[cy * grid.cols + cx]
}

const STEPS = [
  [1, 0, 1],
  [-1, 0, 1],
  [0, 1, 1],
  [0, -1, 1],
  [1, 1, Math.SQRT2],
  [1, -1, Math.SQRT2],
  [-1, 1, Math.SQRT2],
  [-1, -1, Math.SQRT2],
] as const

/**
 * A* with 8 directions. Diagonal steps are only allowed when both neighbouring
 * straight cells are free, so the character never cuts a hut corner.
 * Returns the cells from start (exclusive) to goal (inclusive), or null.
 */
export function findPath(grid: Grid, start: Cell, goal: Cell): Cell[] | null {
  if (isBlocked(grid, goal.cx, goal.cy)) return null
  const key = (cx: number, cy: number) => cy * grid.cols + cx
  const h = (cx: number, cy: number) => Math.hypot(goal.cx - cx, goal.cy - cy)

  const startKey = key(start.cx, start.cy)
  const goalKey = key(goal.cx, goal.cy)
  const g = new Map<number, number>([[startKey, 0]])
  const cameFrom = new Map<number, number>()
  const open = new Map<number, number>([[startKey, h(start.cx, start.cy)]])

  while (open.size > 0) {
    let current = -1
    let best = Infinity
    for (const [k, f] of open) {
      if (f < best) {
        best = f
        current = k
      }
    }
    if (current === goalKey) return reconstruct(cameFrom, current, startKey, grid.cols)
    open.delete(current)

    const cx = current % grid.cols
    const cy = Math.floor(current / grid.cols)
    for (const [dx, dy, cost] of STEPS) {
      const nx = cx + dx
      const ny = cy + dy
      if (isBlocked(grid, nx, ny)) continue
      if (dx !== 0 && dy !== 0 && (isBlocked(grid, cx + dx, cy) || isBlocked(grid, cx, cy + dy)))
        continue
      const nk = key(nx, ny)
      const tentative = g.get(current)! + cost
      if (tentative < (g.get(nk) ?? Infinity)) {
        cameFrom.set(nk, current)
        g.set(nk, tentative)
        open.set(nk, tentative + h(nx, ny))
      }
    }
  }
  return null
}

function reconstruct(cameFrom: Map<number, number>, end: number, start: number, cols: number) {
  const path: Cell[] = []
  for (let k = end; k !== start; k = cameFrom.get(k)!) {
    path.push({ cx: k % cols, cy: Math.floor(k / cols) })
  }
  return path.reverse()
}

/** Nearest free cell to (cx, cy), searching in growing rings. */
export function nearestFree(grid: Grid, cx: number, cy: number): Cell | null {
  for (let r = 0; r < Math.max(grid.cols, grid.rows); r++) {
    for (let dy = -r; dy <= r; dy++) {
      for (let dx = -r; dx <= r; dx++) {
        if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue
        if (!isBlocked(grid, cx + dx, cy + dy)) return { cx: cx + dx, cy: cy + dy }
      }
    }
  }
  return null
}
