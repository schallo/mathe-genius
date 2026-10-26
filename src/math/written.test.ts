import { describe, expect, it } from 'vitest'
import { seededRng } from './random'
import { generateTask } from './topics'
import { LEVELS, type TopicId } from './types'
import { layoutWritten, rowValue, type WrittenLayout } from './written'

const WRITTEN: TopicId[] = [
  'schriftlichAddition',
  'schriftlichSubtraktion',
  'schriftlichMultiplikation',
  'schriftlichDivision',
]

/** The most columns that fit on the card next to her character (see WrittenCalcGrid). */
const MAX_COLS = 11

function layoutOf(topic: TopicId, level: (typeof LEVELS)[number], seed: number) {
  const task = generateTask(topic, level, seededRng(seed))
  if (task.format.kind !== 'written') throw new Error('not a written task')
  return { task, layout: layoutWritten(task.format) }
}

function allCells(layout: WrittenLayout) {
  return [
    ...layout.given,
    ...layout.symbols,
    ...layout.inputs,
    ...layout.inputs.flatMap((i) => i.reveals),
  ]
}

describe('written calculation grid', () => {
  for (const topic of WRITTEN) {
    for (const level of LEVELS) {
      it(`${topic} level ${level}: result squares give the answer, nothing overlaps`, () => {
        for (let seed = 0; seed < 1000; seed++) {
          const { task, layout } = layoutOf(topic, level, seed * 7919 + level)
          const cells = allCells(layout)
          expect(layout.cols).toBeLessThanOrEqual(MAX_COLS)
          const seen = new Set<string>()
          for (const c of cells) {
            expect(c.col).toBeGreaterThanOrEqual(0)
            expect(c.col).toBeLessThan(layout.cols)
            expect(c.row).toBeGreaterThanOrEqual(0)
            expect(c.row).toBeLessThan(layout.rows)
            const key = `${c.row},${c.col}`
            expect(seen.has(key), `${task.question} ${key}`).toBe(false)
            seen.add(key)
          }
          for (const i of layout.inputs) {
            expect(Number.isInteger(i.digit) && i.digit >= 0 && i.digit <= 9).toBe(true)
            expect(i.hint.length).toBeGreaterThan(0)
            if (i.carry) expect(i.digit).toBeGreaterThan(0)
          }

          const answerRow =
            task.format.kind === 'written' && task.format.op === ':' ? 0 : layout.rows - 1
          const result = layout.inputs.filter((i) => i.row === answerRow && !i.carry)
          expect(rowValue(result), task.question).toBe(task.answer.value)
          const rest = layout.inputs.filter((i) => i.remainder)
          expect(rest.length ? rowValue(rest) : 0).toBe(task.answer.remainder ?? 0)
        }
      })
    }
  }

  it('plus: carries come right after the digit that makes them', () => {
    const layout = layoutWritten({
      kind: 'written',
      op: '+',
      operands: [4573, 2869],
      remainder: false,
    })
    expect(layout.inputs.map((i) => (i.carry ? `(${i.digit})` : String(i.digit))).join(' ')).toBe(
      '2 (1) 4 (1) 4 (1) 7',
    )
    expect(layout.inputs[0].hint).toBe('Einer: 3 + 9')
    expect(layout.inputs[2].hint).toBe('Zehner: 7 + 6 + 1')
  })

  it('plus: a last carry becomes the front digit', () => {
    const layout = layoutWritten({
      kind: 'written',
      op: '+',
      operands: [955, 87],
      remainder: false,
    })
    const result = layout.inputs.filter((i) => !i.carry)
    expect(rowValue(result)).toBe(1042)
    expect(result.at(-1)?.hint).toBe('Der letzte Übertrag kommt vorne hin.')
  })

  it('minus: hints show the Entbündeln, also across a zero', () => {
    const layout = layoutWritten({
      kind: 'written',
      op: '-',
      operands: [7204, 3568],
      remainder: false,
    })
    expect(rowValue(layout.inputs)).toBe(3636)
    expect(layout.inputs.map((i) => i.hint)).toEqual([
      'Einer: 14 − 8 (entbündelt)',
      'Zehner: 9 − 6 (entbündelt)',
      'Hunderter: 11 − 5 (entbündelt)',
      'Tausender: 6 − 3',
    ])
  })

  it('mal with two digits: partial rows under each digit, then the sum', () => {
    const layout = layoutWritten({
      kind: 'written',
      op: '·',
      operands: [254, 23],
      remainder: false,
    })
    expect(rowValue(layout.inputs.filter((i) => i.row === 1))).toBe(508)
    expect(rowValue(layout.inputs.filter((i) => i.row === 2))).toBe(762)
    expect(rowValue(layout.inputs.filter((i) => i.row === 4))).toBe(5842)
    // The tens row ends under the tens digit of 23
    expect(Math.max(...layout.inputs.filter((i) => i.row === 1).map((i) => i.col))).toBe(4)
  })

  it('geteilt: quotient from the left, the grid writes the steps', () => {
    const layout = layoutWritten({ kind: 'written', op: ':', operands: [846, 3], remainder: false })
    expect(layout.inputs.map((i) => i.digit)).toEqual([2, 8, 2])
    expect(layout.inputs[0].hint).toBe('Wie oft passt 3 in 8?')
    expect(layout.inputs[1].hint).toBe('Wie oft passt 3 in 24?')
    // After the first digit: 6 under the 8, then rest 2 with the 4 brought down
    expect(layout.inputs[0].reveals).toEqual([
      { row: 1, col: 0, digit: 6 },
      { row: 2, col: 0, digit: 2 },
      { row: 2, col: 1, digit: 4 },
    ])
  })

  it('geteilt with remainder: she types the last rest', () => {
    const layout = layoutWritten({ kind: 'written', op: ':', operands: [2345, 7], remainder: true })
    const rest = layout.inputs.filter((i) => i.remainder)
    expect(rest.map((i) => i.digit)).toEqual([0])
    const layout2 = layoutWritten({ kind: 'written', op: ':', operands: [157, 4], remainder: true })
    expect(layout2.inputs.map((i) => i.digit)).toEqual([3, 9, 1])
    expect(layout2.inputs.at(-1)?.remainder).toBe(true)
  })
})
