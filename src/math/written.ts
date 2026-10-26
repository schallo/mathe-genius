// Layout of the written calculation grid (GAME_DESIGN §6 "Task formats"): which digit goes
// into which square, the order she fills them in, carries and a short method hint per
// square. Pure logic; src/ui/WrittenCalcGrid.ts draws it.
//
// - Plus: operands right-aligned, carries in a small row above the line; result from the
//   right. A carry is asked right after the digit that makes it.
// - Minus (Abziehverfahren mit Entbündeln, see NOTES.md): only the result digits.
// - Mal with a one-digit factor: result under the task, carries like plus.
// - Mal with a two-digit factor: one partial row per digit of the second factor (tens
//   first, carries in her head), then the sum with carries.
// - Geteilt: quotient digits from the left. After each digit the grid writes the product
//   and the rest with the next digit brought down, so she sees the method. With remainder
//   levels she fills in the last rest herself.
import { PLACE_NAMES } from './format'
import type { Op, TaskFormat } from './types'

export type GridCell = { row: number; col: number; digit: number }

export type InputCell = GridCell & {
  /** Small carry square above the line */
  carry: boolean
  /** The last rest of a division with remainder */
  remainder: boolean
  /** Method hint after a wrong digit (never the digit itself) */
  hint: string
  /** Squares the grid writes by itself once this one is right (division steps) */
  reveals: GridCell[]
}

export type WrittenLayout = {
  cols: number
  rows: number
  given: GridCell[]
  symbols: { row: number; col: number; text: string }[]
  /**
   * Ink rule along the top edge of `row`, from column `from` to `to` (inclusive). With
   * `after`, it appears once input number `after` is right (the steps of a division).
   */
  lines: { row: number; from: number; to: number; after?: number }[]
  /** Squares to fill, in the order she fills them */
  inputs: InputCell[]
}

type WrittenFormat = Extract<TaskFormat, { kind: 'written' }>

/** Digits from the right: 4573 → [3, 7, 5, 4] */
const digitsOf = (n: number) => [...String(n)].map(Number).reverse()

/** Cells for n, right-aligned at column `right`. */
function cellsOf(n: number, row: number, right: number): GridCell[] {
  return digitsOf(n).map((digit, i) => ({ row, col: right - i, digit }))
}

const input = (
  cell: GridCell,
  hint: string,
  extra: Partial<Pick<InputCell, 'carry' | 'remainder' | 'reveals'>> = {},
): InputCell => ({ carry: false, remainder: false, reveals: [], ...cell, hint, ...extra })

const LAST_CARRY = 'Der letzte Übertrag kommt vorne hin.'
const carryHint = (sum: number) => `Die Zehner von ${sum} schreibst du klein in die nächste Spalte.`

/**
 * Adds rows of digits (each value shifted left by `shift` columns) into the result row,
 * with carry squares in the row above the line. Used by plus and by the partial rows of mal.
 */
function sumInputs(
  addends: { value: number; shift: number }[],
  total: number,
  carryRow: number,
  resultRow: number,
  right: number,
): InputCell[] {
  const columns = digitsOf(total).length
  const digitAt = (i: number) =>
    addends
      .map(({ value, shift }) => (i >= shift ? digitsOf(value)[i - shift] : undefined))
      .filter((d): d is number => d !== undefined)
  const hasDigits = (i: number) => digitAt(i).length > 0
  const inputs: InputCell[] = []
  let carry = 0
  for (let i = 0; i < columns; i++) {
    const ds = digitAt(i)
    const sum = ds.reduce((s, d) => s + d, 0) + carry
    const cell = { row: resultRow, col: right - i, digit: sum % 10 }
    if (ds.length === 0) inputs.push(input(cell, LAST_CARRY))
    else if (ds.length === 1 && carry === 0)
      inputs.push(input(cell, `Schreib die ${ds[0]} herunter.`))
    else {
      const parts = carry ? [...ds, carry] : ds
      inputs.push(input(cell, `${PLACE_NAMES[i]}: ${parts.join(' + ')}`))
    }
    carry = Math.floor(sum / 10)
    if (carry > 0 && hasDigits(i + 1)) {
      inputs.push(
        input({ row: carryRow, col: right - i - 1, digit: carry }, carryHint(sum), { carry: true }),
      )
    }
  }
  return inputs
}

function plus(operands: number[]): WrittenLayout {
  const total = operands.reduce((s, o) => s + o, 0)
  const cols = Math.max(String(total).length, ...operands.map((o) => String(o).length)) + 1
  const right = cols - 1
  const n = operands.length
  return {
    cols,
    rows: n + 2,
    given: operands.flatMap((o, row) => cellsOf(o, row, right)),
    symbols: [{ row: n - 1, col: 0, text: '+' }],
    lines: [{ row: n + 1, from: 0, to: right }],
    inputs: sumInputs(
      operands.map((value) => ({ value, shift: 0 })),
      total,
      n,
      n + 1,
      right,
    ),
  }
}

function minus(a: number, b: number): WrittenLayout {
  const cols = String(a).length + 1
  const right = cols - 1
  const result = a - b
  const inputs: InputCell[] = []
  let borrow = 0
  digitsOf(result).forEach((digit, i) => {
    const top = (digitsOf(a)[i] ?? 0) - borrow
    const bottom = digitsOf(b)[i] ?? 0
    const hint =
      top < bottom
        ? `${PLACE_NAMES[i]}: ${top + 10} − ${bottom} (entbündelt)`
        : `${PLACE_NAMES[i]}: ${top} − ${bottom}`
    borrow = top < bottom ? 1 : 0
    inputs.push(input({ row: 2, col: right - i, digit }, hint))
  })
  return {
    cols,
    rows: 3,
    given: [...cellsOf(a, 0, right), ...cellsOf(b, 1, right)],
    symbols: [{ row: 1, col: 0, text: '−' }],
    lines: [{ row: 2, from: 0, to: right }],
    inputs,
  }
}

/** a · d (d = one digit) with the carries in her head; for the partial rows. */
function partialInputs(a: number, d: number, row: number, right: number): InputCell[] {
  if (d === 0) return [input({ row, col: right, digit: 0 }, 'Mal 0 ergibt 0.')]
  const inputs: InputCell[] = []
  let carry = 0
  digitsOf(a * d).forEach((digit, i) => {
    const ad = digitsOf(a)[i]
    const hint =
      ad === undefined
        ? LAST_CARRY
        : `${d} · ${ad}` + (carry ? ` + ${carry} (Übertrag im Kopf)` : '')
    if (ad !== undefined) carry = Math.floor((ad * d + carry) / 10)
    inputs.push(input({ row, col: right - i, digit }, hint))
  })
  return inputs
}

function times(a: number, b: number): WrittenLayout {
  const la = String(a).length
  const product = a * b
  const task = {
    given: [...cellsOf(a, 0, la - 1), ...cellsOf(b, 0, la + String(b).length)],
    symbols: [{ row: 0, col: la, text: '·' }],
  }
  if (b < 10) {
    // Result under the task, carries in the row above the line
    const right = la + 1
    const inputs: InputCell[] = []
    let carry = 0
    digitsOf(product).forEach((digit, i) => {
      const ad = digitsOf(a)[i]
      if (ad === undefined) {
        inputs.push(input({ row: 2, col: right - i, digit }, LAST_CARRY))
        return
      }
      const p = ad * b + carry
      inputs.push(
        input({ row: 2, col: right - i, digit }, `${b} · ${ad}` + (carry ? ` + ${carry}` : '')),
      )
      carry = Math.floor(p / 10)
      if (carry > 0 && i + 1 < la) {
        inputs.push(
          input({ row: 1, col: right - i - 1, digit: carry }, carryHint(p), { carry: true }),
        )
      }
    })
    return {
      cols: la + 2,
      rows: 3,
      ...task,
      lines: [{ row: 2, from: 0, to: right }],
      inputs,
    }
  }
  // Two-digit factor: tens row under the tens digit, ones row under the ones digit, then the sum
  const right = la + 2
  const [b0, b1] = digitsOf(b)
  return {
    cols: la + 3,
    rows: 5,
    ...task,
    lines: [
      { row: 1, from: 0, to: right },
      { row: 4, from: 0, to: right },
    ],
    inputs: [
      ...partialInputs(a, b1, 1, right - 1),
      ...partialInputs(a, b0, 2, right),
      ...sumInputs(
        [
          { value: a * b1, shift: 1 },
          { value: a * b0, shift: 0 },
        ],
        product,
        3,
        4,
        right,
      ),
    ],
  }
}

function divide(n: number, d: number, withRemainder: boolean): WrittenLayout {
  const ns = [...String(n)].map(Number)
  const ln = ns.length
  const q = Math.floor(n / d)
  const lq = String(q).length
  const given = [...cellsOf(n, 0, ln - 1), { row: 0, col: ln + 1, digit: d }]
  const symbols = [
    { row: 0, col: ln, text: ':' },
    { row: 0, col: ln + 2, text: '=' },
  ]
  const lines: WrittenLayout['lines'] = []
  const inputs: InputCell[] = []
  let rest = 0
  let started = false
  let k = 0
  ns.forEach((digit, j) => {
    const current = rest * 10 + digit
    const qd = Math.floor(current / d)
    if (!started && qd === 0) {
      rest = current
      return
    }
    started = true
    const product = qd * d
    rest = current - product
    const productRow = 1 + 2 * k
    const restRow = productRow + 1
    const last = k === lq - 1
    const width = Math.max(String(current).length, String(product).length)
    lines.push({ row: restRow, from: j - width + 1, to: j, after: inputs.length })
    const reveals = [...cellsOf(product, productRow, j)]
    // The rest, with the next digit brought down; the last rest she types herself (with remainder)
    if (!last)
      reveals.push(...cellsOf(rest, restRow, j), { row: restRow, col: j + 1, digit: ns[j + 1] })
    else if (!withRemainder) reveals.push(...cellsOf(rest, restRow, j))
    inputs.push(
      input({ row: 0, col: ln + 3 + k, digit: qd }, `Wie oft passt ${d} in ${current}?`, {
        reveals,
      }),
    )
    if (last && withRemainder) {
      for (const cell of cellsOf(rest, restRow, j)) {
        inputs.push(
          input(cell, `${current} − ${product}: Was bleibt übrig? Das ist der Rest.`, {
            remainder: true,
          }),
        )
      }
    }
    k++
  })
  return { cols: ln + 3 + lq, rows: 1 + 2 * lq, given, symbols, lines, inputs }
}

export function layoutWritten(format: WrittenFormat): WrittenLayout {
  const [a, b] = format.operands
  const layouts: Record<Op, () => WrittenLayout> = {
    '+': () => plus(format.operands),
    '-': () => minus(a, b),
    '·': () => times(a, b),
    ':': () => divide(a, b, format.remainder),
  }
  return layouts[format.op]()
}

/** The value written in one row of input squares (left to right), e.g. the result row. */
export function rowValue(cells: GridCell[]): number {
  return Number(
    [...cells]
      .sort((x, y) => x.col - y.col)
      .map((c) => c.digit)
      .join(''),
  )
}
