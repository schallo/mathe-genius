// Kopfrechnen Plus/Minus (GAME_DESIGN §6): 340 + 270, 1000 − 365, 45 000 + 8 000.
// L1 Zehnerzahlen bis 1000 · L2 HZE ± Zehnerzahl, 1000 − x · L3 HZE ± ZE mit Übergang
// L4 Tausenderzahlen bis 1 Million · L5 Hunderterzahlen bis 100 000
import { term } from '../format'
import { splitAddSub } from '../hints'
import { zufall } from '../random'
import type { Generator, Level, Rng, Task } from '../types'

function task(level: Level, a: number, b: number, op: '+' | '-'): Task {
  return {
    topic: 'kopfrechnen',
    level,
    question: `${term(op, [a, b])} = ?`,
    answer: { value: op === '+' ? a + b : a - b },
    format: { kind: 'numpad', remainder: false },
    ...splitAddSub(a, b, op),
    math: { kind: 'calc', op, operands: [a, b] },
  }
}

/** a ± b with both numbers multiples of `unit`, result in [0, max]. */
function multiples(rng: Rng, level: Level, unit: number, maxA: number, maxB: number, max: number) {
  if (rng() < 0.5) {
    const a = zufall(rng, 1, maxA - 1) * unit
    const b = zufall(rng, 1, Math.min(maxB, (max - a) / unit)) * unit
    return task(level, a, b, '+')
  }
  const a = zufall(rng, 2, maxA) * unit
  const b = zufall(rng, 1, Math.min(maxB, a / unit - 1)) * unit
  return task(level, a, b, '-')
}

export const kopfrechnen: Generator = (rng, level) => {
  switch (level) {
    case 1:
      return multiples(rng, level, 10, 99, 90, 1000)
    case 2: {
      if (rng() < 0.3) return task(level, 1000, zufall(rng, 101, 999), '-')
      const a = zufall(rng, 101, 899)
      const b = zufall(rng, 1, 9) * 10
      return rng() < 0.5 ? task(level, a, b, '+') : task(level, a, b, '-')
    }
    case 3: {
      // With a ten crossing in the ones place: ones of a and b add up to 10 or more,
      // or (minus) the ones of b are bigger than the ones of a
      const tensA = zufall(rng, 10, 88)
      const tensB = zufall(rng, 1, 9)
      if (rng() < 0.5) {
        const onesA = zufall(rng, 1, 9)
        const onesB = zufall(rng, 10 - onesA, 9)
        return task(level, tensA * 10 + onesA, tensB * 10 + onesB, '+')
      }
      const onesA = zufall(rng, 0, 8)
      const onesB = zufall(rng, onesA + 1, 9)
      return task(level, tensA * 10 + onesA, tensB * 10 + onesB, '-')
    }
    case 4:
      return multiples(rng, level, 1000, 999, 99, 1_000_000)
    case 5:
      if (rng() < 0.3) return task(level, 10_000, zufall(rng, 11, 99) * 100, '-')
      return multiples(rng, level, 100, 999, 99, 100_000)
  }
}
