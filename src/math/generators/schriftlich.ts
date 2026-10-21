// Schriftliche Addition, Subtraktion, Multiplikation, Division (GAME_DESIGN §6).
// Tasks use the written calculation grid format; the grid UI follows in build step 9.
import { term } from '../format'
import { writtenAdd, writtenDiv, writtenMul, writtenSub } from '../hints'
import { zufall } from '../random'
import type { Generator, Level, Op, Rng, Task, TopicId } from '../types'

const digits = (n: number) => [...String(n)].map(Number).reverse()

const hasCarry = (operands: number[]) => {
  let carry = 0
  for (let i = 0; i < 7; i++) {
    const sum = operands.reduce((s, o) => s + (Math.floor(o / 10 ** i) % 10), carry)
    if (sum >= 10) return true
    carry = 0
  }
  return false
}

const needsBorrow = (a: number, b: number) => digits(b).some((d, i) => d > (digits(a)[i] ?? 0))

function task(
  topic: TopicId,
  level: Level,
  op: Op,
  operands: number[],
  value: number,
  help: Pick<Task, 'hintSteps' | 'solutionSteps'>,
  remainder?: number,
): Task {
  return {
    topic,
    level,
    question: `${term(op, operands)} = ?`,
    answer: remainder === undefined ? { value } : { value, remainder },
    format: { kind: 'written', op, operands, remainder: remainder !== undefined },
    ...help,
    math: { kind: 'calc', op, operands },
  }
}

/** Draw numbers until `ok` holds (all conditions here are met within a few tries). */
function draw<T>(make: () => T, ok: (x: T) => boolean): T {
  for (;;) {
    const x = make()
    if (ok(x)) return x
  }
}

export const schriftlichAddition: Generator = (rng, level) => {
  const two = (min: number, max: number) => [zufall(rng, min, max), zufall(rng, min, max)]
  const operands = {
    1: () =>
      draw(
        () => two(100, 899),
        (o) => !hasCarry(o),
      ),
    2: () => draw(() => two(100, 899), hasCarry),
    3: () => draw(() => two(1000, 8999), hasCarry),
    4: () => [zufall(rng, 100, 9999), zufall(rng, 100, 9999), zufall(rng, 100, 999)],
    5: () => draw(() => [zufall(rng, 10_000, 599_999), zufall(rng, 10_000, 399_999)], hasCarry),
  }[level]()
  const sum = operands.reduce((s, x) => s + x, 0)
  return task('schriftlichAddition', level, '+', operands, sum, writtenAdd(operands))
}

export const schriftlichSubtraktion: Generator = (rng, level) => {
  const pair = (min: number, max: number) => {
    const a = zufall(rng, min, max)
    return [a, zufall(rng, Math.floor(min / 2), a - 1)]
  }
  const withZero = () => {
    // Minuend with a 0 in the middle, like 7 204
    const a = zufall(rng, 1, 9) * 1000 + zufall(rng, 1, 9) * 100 + zufall(rng, 1, 9)
    const b = zufall(rng, 1000, a - 1)
    return [a, b]
  }
  const [a, b] = {
    1: () =>
      draw(
        () => pair(200, 999),
        ([x, y]) => !needsBorrow(x, y) && y >= 100,
      ),
    2: () =>
      draw(
        () => pair(200, 999),
        ([x, y]) => needsBorrow(x, y) && y >= 100,
      ),
    3: () =>
      draw(
        () => pair(2000, 9999),
        ([x, y]) => needsBorrow(x, y) && y >= 1000,
      ),
    4: () => draw(withZero, ([x, y]) => needsBorrow(x, y)),
    5: () =>
      draw(
        () => pair(20_000, 999_999),
        ([x, y]) => needsBorrow(x, y) && y >= 10_000,
      ),
  }[level]()
  return task('schriftlichSubtraktion', level, '-', [a, b], a - b, writtenSub(a, b))
}

export const schriftlichMultiplikation: Generator = (rng, level) => {
  const [a, b] = {
    1: () => [zufall(rng, 12, 99), zufall(rng, 3, 9)],
    2: () => [zufall(rng, 102, 999), zufall(rng, 3, 9)],
    3: () => [zufall(rng, 1002, 9999), zufall(rng, 3, 9)],
    4: () => [zufall(rng, 12, 99), zufall(rng, 12, 99)],
    5: () => [zufall(rng, 102, 999), zufall(rng, 12, 99)],
  }[level]()
  return task('schriftlichMultiplikation', level, '·', [a, b], a * b, writtenMul(a, b))
}

/** Dividend n with minN <= n <= maxN, divisor 2–9. */
function divide(rng: Rng, level: Level, minN: number, maxN: number, remainder: boolean): Task {
  const d = zufall(rng, 2, 9)
  const q = zufall(rng, Math.ceil(minN / d), Math.floor((maxN - (remainder ? d - 1 : 0)) / d))
  const r = remainder ? zufall(rng, 1, d - 1) : 0
  const n = d * q + r
  return task(
    'schriftlichDivision',
    level,
    ':',
    [n, d],
    q,
    writtenDiv(n, d),
    remainder ? r : undefined,
  )
}

export const schriftlichDivision: Generator = (rng, level) => {
  switch (level) {
    case 1:
      return divide(rng, level, 20, 99, false)
    case 2:
      return divide(rng, level, 100, 999, false)
    case 3:
      return divide(rng, level, 100, 999, true)
    case 4:
      return divide(rng, level, 1000, 9999, false)
    case 5:
      return divide(rng, level, 1000, 9999, true)
  }
}
