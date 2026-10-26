// Einmaleins + Division (GAME_DESIGN §6): 7 · 8, 54 : 6, missing factor ? · 9 = 63.
// L1 Kernaufgaben (· 1, 2, 5, 10) · L2 all 1×1 · L3 division · L4 mixed + missing factor · L5 with remainder
import { einmaleinsDiv, einmaleinsMul, missingFactor } from '../hints'
import { pick, zufall } from '../random'
import type { Generator, Level, Rng, Task } from '../types'

const base = { topic: 'einmaleins' as const }

export function multiplication(rng: Rng, level: Level, core = false): Task {
  const a = core ? pick(rng, [1, 2, 5, 10]) : zufall(rng, 2, 10)
  const b = zufall(rng, core ? 1 : 2, 10)
  const [x, y] = rng() < 0.5 ? [a, b] : [b, a]
  return {
    ...base,
    level,
    question: `${x} · ${y} = ?`,
    answer: { value: x * y },
    format: { kind: 'numpad', remainder: false },
    ...einmaleinsMul(x, y),
    math: { kind: 'calc', op: '·', operands: [x, y] },
  }
}

export function division(rng: Rng, level: Level, remainder: boolean): Task {
  const d = zufall(rng, 2, remainder ? 9 : 10)
  const q = zufall(rng, remainder ? 1 : 2, 10)
  const r = remainder ? zufall(rng, 1, d - 1) : 0
  const n = d * q + r
  return {
    ...base,
    level,
    question: `${n} : ${d} = ?`,
    answer: remainder ? { value: q, remainder: r } : { value: q },
    format: { kind: 'numpad', remainder },
    ...einmaleinsDiv(n, d),
    math: { kind: 'calc', op: ':', operands: [n, d] },
  }
}

/** Missing factor: ? · 9 = 63 */
export function missingFactorTask(rng: Rng, level: Level): Task {
  const factor = zufall(rng, 2, 10)
  const q = zufall(rng, 2, 10)
  return {
    ...base,
    level,
    question: `? · ${factor} = ${factor * q}`,
    answer: { value: q },
    format: { kind: 'numpad', remainder: false },
    ...missingFactor(factor, factor * q),
    math: { kind: 'missingFactor', factor, product: factor * q },
  }
}

export const einmaleins: Generator = (rng, level) => {
  switch (level) {
    case 1:
      return multiplication(rng, level, true)
    case 2:
      return multiplication(rng, level)
    case 3:
      return division(rng, level, false)
    case 4:
      return pick(rng, [
        () => multiplication(rng, level),
        () => division(rng, level, false),
        () => missingFactorTask(rng, level),
      ])()
    case 5:
      return division(rng, level, true)
  }
}
