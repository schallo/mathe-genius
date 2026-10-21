// Zahlenraum bis 1 Million (GAME_DESIGN §6): compare, neighbours, rounding, place value.
// L1 Welche Zahl ist größer? (bis 10 000) · L2 Vorgänger/Nachfolger (bis 100 000)
// L3 Runden auf Zehner/Hunderter · L4 Runden auf Tausender/Zehntausender · L5 Ziffer an einer Stelle
import { placeName, zahl } from '../format'
import { compare, digit, neighbour, round as roundHelp } from '../hints'
import { pick, zufall } from '../random'
import type { Generator, Level, Option, Rng, Task } from '../types'

const base = { topic: 'zahlenraum' as const }

const shuffle = <T>(rng: Rng, items: T[]): T[] =>
  items
    .map((item) => ({ item, key: rng() }))
    .sort((x, y) => x.key - y.key)
    .map((x) => x.item)

/** Half-up rounding as taught in school. */
export const roundTo = (n: number, to: number) => Math.floor(n / to + 0.5) * to

function compareTask(rng: Rng, level: Level): Task {
  // Two 4-digit numbers that differ in exactly one place, so she has to look carefully
  const a = zufall(rng, 1000, 9999)
  const place = pick(rng, [1, 10, 100, 1000])
  const d = Math.floor(a / place) % 10
  let other = zufall(rng, place === 1000 ? 1 : 0, 9)
  while (other === d) other = zufall(rng, place === 1000 ? 1 : 0, 9)
  const b = a + (other - d) * place
  const numbers = shuffle(rng, [a, b])
  return {
    ...base,
    level,
    question: 'Welche Zahl ist größer?',
    answer: { value: Math.max(a, b) },
    format: { kind: 'choice', options: numbers.map((n) => ({ label: zahl(n), value: n })) },
    ...compare(numbers),
    math: { kind: 'compare', numbers },
  }
}

function neighbourTask(rng: Rng, level: Level): Task {
  const dir = rng() < 0.5 ? 1 : -1
  // Often right at a crossing like 45 999 → 46 000
  const n =
    rng() < 0.5 ? zufall(rng, 1, 99) * 1000 - (dir === 1 ? 1 : 0) : zufall(rng, 1001, 99_998)
  return {
    ...base,
    level,
    question:
      dir === 1 ? `Welche Zahl kommt nach ${zahl(n)}?` : `Welche Zahl kommt vor ${zahl(n)}?`,
    answer: { value: n + dir },
    format: { kind: 'numpad', remainder: false },
    ...neighbour(n, dir),
    math: { kind: 'neighbour', n, dir },
  }
}

function roundTask(rng: Rng, level: Level, places: number[], max: number): Task {
  const to = pick(rng, places)
  let n = zufall(rng, to * 10, max)
  if (n % to === 0) n += 1
  const result = roundTo(n, to)
  const down = Math.floor(n / to) * to
  const candidates = [result, result === down ? down + to : down, roundTo(n, to * 10)]
  const options: Option[] = [...new Set(candidates)]
    .filter((v) => v > 0)
    .map((v) => ({ label: zahl(v), value: v }))
  return {
    ...base,
    level,
    question: `Runde ${zahl(n)} auf ${placeName(to)}.`,
    answer: { value: result },
    format: { kind: 'choice', options: shuffle(rng, options) },
    ...roundHelp(n, to, result),
    math: { kind: 'round', n, to },
  }
}

function digitTask(rng: Rng, level: Level): Task {
  const n = zufall(rng, 100_000, 999_999)
  const place = pick(rng, [1, 10, 100, 1000, 10_000, 100_000])
  return {
    ...base,
    level,
    question: `Welche Ziffer steht in ${zahl(n)} an der ${placeName(place)}stelle?`,
    answer: { value: Math.floor(n / place) % 10 },
    format: { kind: 'numpad', remainder: false },
    ...digit(n, place),
    math: { kind: 'digit', n, place },
  }
}

export const zahlenraum: Generator = (rng, level) => {
  switch (level) {
    case 1:
      return compareTask(rng, level)
    case 2:
      return neighbourTask(rng, level)
    case 3:
      return roundTask(rng, level, [10, 100], 9_999)
    case 4:
      return roundTask(rng, level, [1000, 10_000], 999_999)
    case 5:
      return digitTask(rng, level)
  }
}
