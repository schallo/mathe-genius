// Einmaleins-Training (GAME_DESIGN §6a): the 200 facts of the small times tables, each
// tracked on its own with Leitner boxes, recent answers and response times. Pure logic.
//
// A fact is one cell of a 10 × 10 grid: `row` is the Reihe (second factor or divisor),
// `k` the multiplier. Multiplication: k · row. Division: (k · row) : row = k.
// So the 7er-Reihe is 1 · 7 … 10 · 7 and 7 : 7 … 70 : 7.
import type { Rng } from './types'

export type DojoOp = 'mul' | 'div'
export const DOJO_OPS: DojoOp[] = ['mul', 'div']

export type Fact = { op: DojoOp; k: number; row: number }

export const ROWS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] as const

export type FactAnswer = { ok: boolean; ms: number }

export type FactStats = {
  /** Leitner box 1–5: up when fast and correct, back to 1 when wrong */
  box: number
  seen: number
  correct: number
  /** Correct answers in a row under the "auswendig" threshold */
  fastStreak: number
  /** Answered correctly 3 times in a row under the threshold (stays gold once reached) */
  known: boolean
  /** Last answers, newest last */
  recent: FactAnswer[]
}

export type FactMap = Record<string, FactStats>

export const BOXES = 5
export const KNOWN_STREAK = 3
export const DEFAULT_KNOWN_MS = 3000
const RECENT = 5

export const factId = (f: Fact) => `${f.op}-${f.k}-${f.row}`

export function parseFactId(id: string): Fact | null {
  const m = /^(mul|div)-(\d+)-(\d+)$/.exec(id)
  if (!m) return null
  const [k, row] = [Number(m[2]), Number(m[3])]
  if (k < 1 || k > 10 || row < 1 || row > 10) return null
  return { op: m[1] as DojoOp, k, row }
}

export function allFacts(op: DojoOp): Fact[] {
  return ROWS.flatMap((row) => ROWS.map((k) => ({ op, k, row })))
}

export const rowFacts = (op: DojoOp, row: number): Fact[] => ROWS.map((k) => ({ op, k, row }))

/** "7 · 8" or "56 : 8" (German school notation) */
export function factText(f: Fact): string {
  return f.op === 'mul' ? `${f.k} · ${f.row}` : `${f.k * f.row} : ${f.row}`
}

export const factAnswer = (f: Fact) => (f.op === 'mul' ? f.k * f.row : f.k)

/** Number of digits to type before a speed mode confirms on its own. */
export const answerLength = (f: Fact) => String(factAnswer(f)).length

const EASY = [1, 2, 5, 10]

/** How to get from an easy fact to this one, e.g. 7 · 8 = 7 · 10 − 7 · 2. */
function mulHelper(a: number, b: number): string {
  // Split the harder factor; keep the easy one as the multiplier
  if (EASY.includes(a) && !EASY.includes(b)) [a, b] = [b, a]
  const p = a * b
  switch (b) {
    case 1:
      return `Mal 1 bleibt gleich: ${a} · 1 = ${a}`
    case 2:
      return `Verdoppeln: ${a} + ${a} = ${p}`
    case 5:
      return `Die Hälfte von ${a} · 10 = ${a * 10}`
    case 10:
      return `Eine Null dran: ${a} · 10 = ${p}`
    case 3:
    case 4:
      return `${a} · 2 + ${a} · ${b - 2} = ${a * 2} + ${a * (b - 2)}`
    case 6:
    case 7:
      return `${a} · 5 + ${a} · ${b - 5} = ${a * 5} + ${a * (b - 5)}`
    default:
      return `${a} · 10 − ${a} · ${10 - b} = ${a * 10} − ${a * (10 - b)}`
  }
}

/** Shown after a wrong answer in Üben: the fact and a small helper. */
export function factHelp(f: Fact): string[] {
  const p = f.k * f.row
  if (f.op === 'mul') return [`${f.k} · ${f.row} = ${p}`, mulHelper(f.k, f.row)]
  return [`${p} : ${f.row} = ${f.k}`, `Denn ${f.k} · ${f.row} = ${p}`]
}

const newStats = (): FactStats => ({
  box: 1,
  seen: 0,
  correct: 0,
  fastStreak: 0,
  known: false,
  recent: [],
})

/** One answer to a fact. `knownMs` is the "auswendig" threshold (parent setting). */
export function recordAnswer(
  stats: FactStats | undefined,
  ok: boolean,
  ms: number,
  knownMs = DEFAULT_KNOWN_MS,
): FactStats {
  const s = stats ?? newStats()
  const fast = ok && ms < knownMs
  const fastStreak = fast ? s.fastStreak + 1 : 0
  return {
    box: !ok ? 1 : fast ? Math.min(BOXES, s.box + 1) : s.box,
    seen: s.seen + 1,
    correct: s.correct + (ok ? 1 : 0),
    fastStreak,
    known: s.known || fastStreak >= KNOWN_STREAK,
    recent: [...s.recent, { ok, ms: Math.round(ms) }].slice(-RECENT),
  }
}

export type FactStatus = 'new' | 'practised' | 'known'

/** Grid colour: cream → sky → gold */
export function factStatus(stats: FactStats | undefined): FactStatus {
  if (!stats || stats.seen === 0) return 'new'
  return stats.known ? 'known' : 'practised'
}

export const knownCount = (facts: FactMap, op: DojoOp) =>
  allFacts(op).filter((f) => facts[factId(f)]?.known).length

export const gridComplete = (facts: FactMap, op: DojoOp) => knownCount(facts, op) === 100

/** Average time of her recent correct answers in ms, or null before the first one. */
export function averageMs(facts: FactMap, op: DojoOp): number | null {
  const times = allFacts(op).flatMap((f) =>
    (facts[factId(f)]?.recent ?? []).filter((a) => a.ok).map((a) => a.ms),
  )
  return times.length ? times.reduce((s, t) => s + t, 0) / times.length : null
}

/** Weak boxes come up more often; a fact never seen counts nearly like box 1. */
const BOX_WEIGHT = [0, 16, 8, 4, 2, 1]
const NEW_WEIGHT = 12

export function factWeight(stats: FactStats | undefined): number {
  return !stats || stats.seen === 0 ? NEW_WEIGHT : BOX_WEIGHT[stats.box]
}

/** Weighted random fact from `pool`, skipping the ids in `avoid` if possible. */
export function drawFact(facts: FactMap, pool: Fact[], rng: Rng, avoid: string[] = []): Fact {
  const candidates = pool.filter((f) => !avoid.includes(factId(f)))
  const list = candidates.length ? candidates : pool
  const weights = list.map((f) => factWeight(facts[factId(f)]))
  let r = rng() * weights.reduce((s, w) => s + w, 0)
  for (let i = 0; i < list.length; i++) {
    r -= weights[i]
    if (r < 0) return list[i]
  }
  return list[list.length - 1]
}

/** `count` different facts, weak ones first in probability. */
export function drawFacts(facts: FactMap, pool: Fact[], count: number, rng: Rng): Fact[] {
  const out: Fact[] = []
  while (out.length < Math.min(count, pool.length)) {
    out.push(drawFact(facts, pool, rng, out.map(factId)))
  }
  return out
}

export function shuffle<T>(items: readonly T[], rng: Rng): T[] {
  const out = [...items]
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

export const PRACTICE_LENGTH = 10
export const DUEL_LENGTH = 20
export const BLITZ_MS = 60_000
export const ROW_MASTER_MS = 30_000
/** A missed fact comes back after this many other facts. */
export const REVIEW_GAP = 3

/** Üben: all 10 facts of one row in random order, or 10 weak facts across all rows ("Mix"). */
export function planPractice(facts: FactMap, op: DojoOp, row: number | 'mix', rng: Rng): Fact[] {
  return row === 'mix'
    ? drawFacts(facts, allFacts(op), PRACTICE_LENGTH, rng)
    : shuffle(rowFacts(op, row), rng)
}

/** Puts a missed fact back into the queue REVIEW_GAP places after the current one. */
export function requeue(queue: Fact[], index: number, fact: Fact): Fact[] {
  const at = Math.min(queue.length, index + 1 + REVIEW_GAP)
  return [...queue.slice(0, at), fact, ...queue.slice(at)]
}

/** Merge for the cloud sync: per fact the copy with more answers wins (b on a tie); gold stays gold. */
export function mergeFacts(a: FactMap, b: FactMap): FactMap {
  const out: FactMap = { ...a }
  for (const [id, s] of Object.entries(b)) {
    const mine = out[id]
    const winner = !mine || s.seen >= mine.seen ? s : mine
    out[id] = { ...winner, known: winner.known || !!mine?.known || s.known }
  }
  return out
}
