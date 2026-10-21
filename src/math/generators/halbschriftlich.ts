// Halbschriftlich multiplizieren/dividieren (GAME_DESIGN §6): 6 · 47, 23 · 30, 840 : 4.
// L1 Zehner-/Hunderterzahl · E · L2 E · ZE · L3 ZE · Zehnerzahl
// L4 Zehnerzahl : E (840 : 4) · L5 ZE/HZE : E with splitting (96 : 4, 846 : 3)
import { term } from '../format'
import { halbDiv, halbMul, halbMulTens } from '../hints'
import { zufall } from '../random'
import type { Generator, Level, Op, Task } from '../types'

function task(
  level: Level,
  op: Op,
  a: number,
  b: number,
  help: Pick<Task, 'hintSteps' | 'solutionSteps'>,
): Task {
  return {
    topic: 'halbschriftlich',
    level,
    question: `${term(op, [a, b])} = ?`,
    answer: { value: op === '·' ? a * b : a / b },
    format: { kind: 'numpad', remainder: false },
    ...help,
    math: { kind: 'calc', op, operands: [a, b] },
  }
}

export const halbschriftlich: Generator = (rng, level) => {
  switch (level) {
    case 1: {
      const e = zufall(rng, 2, 9)
      const unit = e <= 5 && rng() < 0.4 ? 100 : 10
      const lead = zufall(rng, 2, Math.min(9, Math.floor(1000 / (e * unit))))
      return task(level, '·', lead * unit, e, halbMul(e, lead * unit))
    }
    case 2: {
      const e = zufall(rng, 2, 9)
      let ze = zufall(rng, 11, Math.min(99, Math.floor(1000 / e)))
      if (ze % 10 === 0) ze += 1
      return task(level, '·', e, ze, halbMul(e, ze))
    }
    case 3: {
      let ze = zufall(rng, 11, 99)
      if (ze % 10 === 0) ze += 1
      const tens = zufall(rng, 2, 9) * 10
      return task(level, '·', ze, tens, halbMulTens(ze, tens))
    }
    case 4: {
      const d = zufall(rng, 2, 9)
      const q = zufall(rng, 2, Math.floor(100 / d)) * 10
      return task(level, ':', d * q, d, halbDiv(d * q, d))
    }
    case 5: {
      const d = zufall(rng, 2, 9)
      let q = zufall(rng, 11, Math.floor(999 / d))
      if (q % 10 === 0) q += 1
      return task(level, ':', d * q, d, halbDiv(d * q, d))
    }
  }
}
