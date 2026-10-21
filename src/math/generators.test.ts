import { describe, expect, it } from 'vitest'
import { term, zahl } from './format'
import { divisionParts, placeParts } from './hints'
import { seededRng } from './random'
import { TOPICS, checkAnswer, generateTask } from './topics'
import { LEVELS, type Answer, type MathSpec, type Op, type Task } from './types'

const TASKS_PER_LEVEL = 1000

/** Recomputes the answer from the task's math description – independent of the generators. */
function evaluate(math: MathSpec): Answer {
  const calc = (op: Op, [a, ...rest]: number[]): Answer => {
    switch (op) {
      case '+':
        return { value: rest.reduce((s, x) => s + x, a) }
      case '-':
        return { value: rest.reduce((s, x) => s - x, a) }
      case '·':
        return { value: rest.reduce((s, x) => s * x, a) }
      case ':': {
        const r = a % rest[0]
        return r ? { value: (a - r) / rest[0], remainder: r } : { value: a / rest[0] }
      }
    }
  }
  switch (math.kind) {
    case 'calc':
      return calc(math.op, math.operands)
    case 'missingFactor':
      return { value: math.product / math.factor }
    case 'twoStep':
      return calc(math.op2, [math.c, calc(math.op1, [math.a, math.b]).value])
    case 'compare':
      return { value: Math.max(...math.numbers) }
    case 'round': {
      const below = math.n - (math.n % math.to)
      return { value: math.n % math.to >= math.to / 2 ? below + math.to : below }
    }
    case 'neighbour':
      return { value: math.n + math.dir }
    case 'digit':
      return { value: Number(String(math.n).at(-1 - Math.log10(math.place))) }
    case 'convert':
      return {
        value: Math.round(math.inverse ? math.value / math.factor : math.value * math.factor),
      }
  }
}

/** All numbers a task shows or asks for. */
function numbersOf(task: Task): number[] {
  const m = task.math
  const fromMath =
    m.kind === 'calc'
      ? m.operands
      : m.kind === 'missingFactor'
        ? [m.factor, m.product]
        : m.kind === 'twoStep'
          ? [m.a, m.b, m.c]
          : m.kind === 'compare'
            ? m.numbers
            : m.kind === 'convert'
              ? [m.value]
              : [m.n]
  return [...fromMath, task.answer.value, task.answer.remainder ?? 0]
}

describe.each(TOPICS.map((t) => [t.id, t] as const))('%s', (_id, topic) => {
  describe.each(LEVELS)('level %i', (level) => {
    const info = topic.levels[level]
    const tasks = Array.from({ length: TASKS_PER_LEVEL }, (_, i) =>
      generateTask(topic.id, level, seededRng(i * 7919 + level)),
    )

    it('has the correct answer (recomputed independently)', () => {
      for (const task of tasks) {
        expect(task.topic).toBe(topic.id)
        expect(task.level).toBe(level)
        expect(evaluate(task.math), task.question).toEqual(task.answer)
        expect(checkAnswer(task, task.answer)).toBe(true)
        expect(checkAnswer(task, { ...task.answer, value: task.answer.value + 1 })).toBe(false)
      }
    })

    it(`uses whole, non-negative numbers up to ${zahl(info.max)}`, () => {
      for (const task of tasks) {
        for (const n of numbersOf(task)) {
          expect(
            Number.isInteger(n) || task.math.kind === 'convert',
            `${task.question}: ${n}`,
          ).toBe(true)
          expect(n, task.question).toBeGreaterThanOrEqual(0)
          expect(n, task.question).toBeLessThanOrEqual(info.max)
        }
      }
    })

    it(info.remainder ? 'divides with a remainder' : 'divides exactly', () => {
      for (const task of tasks) {
        const isDivision = task.math.kind === 'calc' && task.math.op === ':'
        if (!isDivision) continue
        if (info.remainder) expect(task.answer.remainder, task.question).toBeGreaterThan(0)
        else expect(task.answer.remainder, task.question).toBeUndefined()
      }
    })

    it('has a consistent input format', () => {
      for (const task of tasks) {
        const f = task.format
        if (f.kind === 'choice') {
          const values = f.options.map((o) => o.value)
          expect(values.length).toBeGreaterThanOrEqual(2)
          expect(values.length).toBeLessThanOrEqual(4)
          expect(new Set(values).size, task.question).toBe(values.length)
          expect(values).toContain(task.answer.value)
        } else {
          expect(f.remainder).toBe(task.answer.remainder !== undefined)
        }
        if (f.kind === 'written' && task.math.kind === 'calc') {
          expect(f.operands).toEqual(task.math.operands)
          expect(f.op).toBe(task.math.op)
        }
      }
    })

    it('shows the numbers it asks about', () => {
      for (const task of tasks) {
        if (task.math.kind === 'calc' && task.topic !== 'geld') {
          expect(task.question).toContain(term(task.math.op, task.math.operands))
        }
        if (task.topic === 'geld') {
          expect(
            task.question.match(/[.?!](\s|$)/g)?.length ?? 0,
            task.question,
          ).toBeLessThanOrEqual(2)
        }
      }
    })

    it('teaches with hints and ends the worked solution with the result', () => {
      for (const task of tasks) {
        expect(task.hintSteps.length).toBeGreaterThan(0)
        expect(task.solutionSteps.length).toBeGreaterThan(0)
        const last = task.solutionSteps.at(-1)!
        expect(last, task.question).toContain(zahl(task.answer.value))
        if (task.answer.remainder) expect(last).toContain(`Rest ${task.answer.remainder}`)

        // The hint must not give away the result ("… = 56")
        const giveaway = new RegExp(`=\\s*${zahl(task.answer.value)}($|[^\\d ])`)
        for (const hint of task.hintSteps) expect(hint, task.question).not.toMatch(giveaway)
      }
    })
  })
})

describe('generators', () => {
  it('are deterministic for a seed', () => {
    for (const topic of TOPICS) {
      for (const level of LEVELS) {
        expect(generateTask(topic.id, level, seededRng(42))).toEqual(
          generateTask(topic.id, level, seededRng(42)),
        )
      }
    }
  })

  it('vary their tasks', () => {
    for (const topic of TOPICS) {
      for (const level of LEVELS) {
        const questions = new Set(
          Array.from({ length: 50 }, (_, i) => {
            // Same question text with different numbers (e.g. "Welche Zahl ist größer?") counts as different
            const task = generateTask(topic.id, level, seededRng(i))
            return task.question + JSON.stringify(task.format)
          }),
        )
        expect(questions.size, `${topic.id} L${level}`).toBeGreaterThan(10)
      }
    }
  })
})

describe('hint helpers', () => {
  it('splits numbers into place values', () => {
    expect(placeParts(47)).toEqual([40, 7])
    expect(placeParts(305)).toEqual([300, 5])
  })

  it('splits a dividend into parts the divisor fits into', () => {
    expect(divisionParts(846, 3)).toEqual([600, 240, 6])
    expect(divisionParts(96, 4)).toEqual([80, 16])
    for (let n = 2; n < 1000; n++) {
      for (let d = 2; d <= 9; d++) {
        if (n % d) continue
        const parts = divisionParts(n, d)
        expect(parts.reduce((s, p) => s + p, 0)).toBe(n)
        for (const p of parts) expect(p % d).toBe(0)
      }
    }
  })

  it('formats numbers like German schoolbooks', () => {
    expect(zahl(4573)).toBe('4 573')
    expect(zahl(999)).toBe('999')
    expect(zahl(1_000_000)).toBe('1 000 000')
  })
})
