// Written calculation grid (STYLE_GUIDE §9): a cream card with a faint squared-paper
// pattern, digits in squares, small carry digits above the line, 1 px ink result rules.
// The active square has a slowly blinking gold outline (~1 s cycle). She fills in one
// digit at a time; each digit is checked at once (layout from math/written.ts).
// Squares are as big as the space allows: 16 px for short tasks, 11 px for the widest.
import Phaser from 'phaser'
import type { InputCell, WrittenLayout } from '../math/written'
import { palette } from '../palette'
import { addText } from './text'

const PAD = 4
/** Space for the squares, next to her character and above the hint card */
const MAX_W = 128
const MAX_H = 112
const MAX_CELL = 16

export class WrittenCalcGrid extends Phaser.GameObjects.Container {
  /** Number of squares already filled in */
  private filled = 0
  private cursor: Phaser.GameObjects.Graphics
  private shown?: Phaser.GameObjects.Graphics
  private blink: Phaser.Time.TimerEvent
  private readonly baseX: number
  private readonly layout: WrittenLayout
  private readonly cell: number
  private rules: Phaser.GameObjects.Graphics

  constructor(scene: Phaser.Scene, x: number, y: number, layout: WrittenLayout) {
    super(scene, x, y)
    this.baseX = x
    this.layout = layout
    const CELL = (this.cell = Math.min(
      MAX_CELL,
      Math.floor(MAX_W / layout.cols),
      Math.floor(MAX_H / layout.rows),
    ))
    const w = layout.cols * CELL + PAD * 2
    const h = layout.rows * CELL + PAD * 2
    const g = scene.add.graphics()
    g.fillStyle(palette.cream).fillRoundedRect(0, 0, w, h, 3)
    g.lineStyle(2, palette.ink).strokeRoundedRect(0, 0, w, h, 3)
    // Squared paper: 1 px page-grid lines
    g.fillStyle(palette.pageGrid)
    for (let c = 0; c <= layout.cols; c++) g.fillRect(PAD + c * CELL, PAD, 1, layout.rows * CELL)
    for (let r = 0; r <= layout.rows; r++) g.fillRect(PAD, PAD + r * CELL, layout.cols * CELL, 1)
    this.add(g)
    // Result rules (division rules appear with their step)
    this.rules = scene.add.graphics()
    this.add(this.rules)
    this.drawRules(undefined)
    for (const cell of layout.given) this.write(cell.row, cell.col, String(cell.digit))
    for (const s of layout.symbols) this.write(s.row, s.col, s.text)

    this.cursor = scene.add.graphics()
    this.add(this.cursor)
    this.blink = scene.time.addEvent({
      delay: 500,
      loop: true,
      callback: () => this.cursor.setVisible(!this.cursor.visible),
    })
    this.once(Phaser.GameObjects.Events.DESTROY, () => this.blink.remove())
    this.moveCursor()
    scene.add.existing(this)
  }

  /** Height of the card in art pixels (the hint card goes below it). */
  get cardHeight(): number {
    return this.layout.rows * this.cell + PAD * 2
  }

  /** The square she fills in next. */
  get current(): InputCell | undefined {
    return this.layout.inputs[this.filled]
  }

  get done(): boolean {
    return this.filled >= this.layout.inputs.length
  }

  /** Checks one digit: right → it is written and the next square becomes active. */
  enter(digit: number): boolean {
    const cell = this.current
    if (!cell) return false
    if (digit !== cell.digit) {
      this.wiggle()
      return false
    }
    this.shown?.destroy()
    this.shown = undefined
    this.write(cell.row, cell.col, String(digit), cell.carry)
    for (const r of cell.reveals) this.write(r.row, r.col, String(r.digit))
    this.drawRules(this.filled)
    this.filled++
    this.moveCursor()
    return true
  }

  /** Worked solution for one square: the right digit appears in accent-blue to type it. */
  showDigit(): void {
    const cell = this.current
    if (!cell || this.shown) return
    const g = this.scene.add.graphics()
    g.fillStyle(palette.accentBlue).fillRect(
      PAD + cell.col * this.cell + 1,
      PAD + cell.row * this.cell + 1,
      this.cell - 1,
      this.cell - 1,
    )
    const text = this.text(cell.row, cell.col, String(cell.digit), cell.carry)
    this.shown = g
    this.addAt(g, 1)
    this.add(text)
    g.once(Phaser.GameObjects.Events.DESTROY, () => text.destroy())
  }

  private drawRules(after: number | undefined) {
    this.rules.fillStyle(palette.ink)
    for (const line of this.layout.lines.filter((l) => l.after === after)) {
      this.rules.fillRect(
        PAD + line.from * this.cell,
        PAD + line.row * this.cell,
        (line.to - line.from + 1) * this.cell + 1,
        1,
      )
    }
  }

  private moveCursor() {
    this.cursor.clear().setVisible(true)
    const cell = this.current
    if (!cell) return
    this.cursor.lineStyle(1, palette.gold)
    this.cursor.strokeRect(
      PAD + cell.col * this.cell + 0.5,
      PAD + cell.row * this.cell + 0.5,
      this.cell,
      this.cell,
    )
  }

  private text(row: number, col: number, text: string, small = false) {
    return addText(
      this.scene,
      PAD + col * this.cell + this.cell / 2 + 0.5,
      PAD + row * this.cell + this.cell / 2 - 0.5 + (small ? 1 : 0),
      text,
      'title',
      small ? Math.round(this.cell * 0.7) : this.cell + 1,
    )
  }

  private write(row: number, col: number, text: string, small = false) {
    this.add(this.text(row, col, text, small))
  }

  /** Gentle wiggle (STYLE_GUIDE §9): 2 px left/right, 2 times. */
  private wiggle() {
    ;[-2, 2, -2, 2, 0].forEach((dx, i) =>
      this.scene.time.delayedCall(i * 50, () => this.setX(this.baseX + dx)),
    )
  }
}
