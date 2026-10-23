// Einmaleins progress grid (GAME_DESIGN §6a, STYLE_GUIDE §9): 10 × 10 squares on a cream
// card with a squared-paper look. Row = Reihe, column = multiplier. Cells: cream (not
// yet) → sky (practised) → gold (auswendig). Headers 1–10 in VT323.
import Phaser from 'phaser'
import { ROWS, factId, factStatus, knownCount, type DojoOp, type FactMap } from '../math/einmaleins'
import { palette } from '../palette'
import { addText } from './text'

export const GRID = { pitch: 14, head: 10, title: 12, pad: 4 } as const
export const GRID_WIDTH = GRID.pad * 2 + GRID.head + 10 * GRID.pitch
export const GRID_HEIGHT = GRID.pad * 2 + GRID.title + GRID.head + 10 * GRID.pitch

const FILL = { new: palette.cream, practised: palette.sky, known: palette.gold } as const

export class FactGrid extends Phaser.GameObjects.Container {
  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    op: DojoOp,
    facts: FactMap,
    title: string,
  ) {
    super(scene, x, y)
    const g = scene.add.graphics()
    g.fillStyle(palette.cream).fillRoundedRect(0, 0, GRID_WIDTH, GRID_HEIGHT, 3)
    g.lineStyle(2, palette.ink).strokeRoundedRect(0, 0, GRID_WIDTH, GRID_HEIGHT, 3)
    this.add(g)

    this.add(addText(scene, GRID.pad + 2, GRID.pad + 5, title, 'label', 6).setOrigin(0, 0.5))
    const known = `${knownCount(facts, op)}/100`
    this.add(
      addText(scene, GRID_WIDTH - GRID.pad - 2, GRID.pad + 5, known, 'title', 12).setOrigin(1, 0.5),
    )

    const x0 = GRID.pad + GRID.head
    const y0 = GRID.pad + GRID.title + GRID.head
    const symbol = op === 'mul' ? '·' : ':'
    this.add(addText(scene, GRID.pad + GRID.head / 2, y0 - GRID.head / 2, symbol, 'title', 12))
    for (const n of ROWS) {
      const c = (n - 1) * GRID.pitch + GRID.pitch / 2
      // Top: multiplier (·) or result (:); left: the Reihe
      this.add(addText(scene, x0 + c, y0 - GRID.head / 2, String(n), 'title', 9))
      this.add(addText(scene, GRID.pad + GRID.head / 2, y0 + c, String(n), 'title', 9))
    }

    const cells = scene.add.graphics()
    for (const row of ROWS) {
      for (const k of ROWS) {
        const status = factStatus(facts[factId({ op, k, row })])
        const cx = x0 + (k - 1) * GRID.pitch
        const cy = y0 + (row - 1) * GRID.pitch
        cells.fillStyle(FILL[status]).fillRect(cx + 1, cy + 1, GRID.pitch - 1, GRID.pitch - 1)
      }
    }
    // Squared-paper lines (1 px page-grid), outer edge in ink
    cells.fillStyle(palette.pageGrid)
    for (let i = 0; i <= 10; i++) {
      cells.fillRect(x0 + i * GRID.pitch, y0, 1, 10 * GRID.pitch + 1)
      cells.fillRect(x0, y0 + i * GRID.pitch, 10 * GRID.pitch + 1, 1)
    }
    this.add(cells)
    scene.add.existing(this)
  }
}
