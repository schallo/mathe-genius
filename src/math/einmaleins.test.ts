import { describe, expect, it } from 'vitest'
import {
  DEFAULT_KNOWN_MS,
  allFacts,
  answerLength,
  averageMs,
  drawFact,
  drawFacts,
  factAnswer,
  factHelp,
  factId,
  factStatus,
  factText,
  gridComplete,
  knownCount,
  mergeFacts,
  parseFactId,
  planPractice,
  recordAnswer,
  requeue,
  rowFacts,
  type FactMap,
  type FactStats,
} from './einmaleins'
import { seededRng } from './random'

const answers = (results: [boolean, number][], start?: FactStats) =>
  results.reduce<FactStats | undefined>((s, [ok, ms]) => recordAnswer(s, ok, ms), start)!

describe('Einmaleins facts', () => {
  it('has 100 multiplications and 100 divisions of the small times tables', () => {
    const all = [...allFacts('mul'), ...allFacts('div')]
    expect(new Set(all.map(factId)).size).toBe(200)
    for (const f of allFacts('mul')) {
      expect(factAnswer(f)).toBe(f.k * f.row)
      expect(factText(f)).toBe(`${f.k} · ${f.row}`)
    }
    for (const f of allFacts('div')) {
      const n = f.k * f.row
      // Exact division, whole result 1–10, dividend at most 100
      expect(n % f.row).toBe(0)
      expect(factAnswer(f)).toBe(n / f.row)
      expect(n).toBeLessThanOrEqual(100)
      expect(factText(f)).toBe(`${n} : ${f.row}`)
    }
  })

  it('turns ids back into facts and rejects others', () => {
    for (const f of allFacts('div')) expect(parseFactId(factId(f))).toEqual(f)
    expect(parseFactId('mul-11-3')).toBeNull()
    expect(parseFactId('add-1-1')).toBeNull()
  })

  it('a row is 1 · r … 10 · r and r : r … 10r : r', () => {
    expect(rowFacts('mul', 7).map(factText)).toEqual(
      [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((k) => `${k} · 7`),
    )
    expect(rowFacts('div', 7).map(factAnswer)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10])
  })

  it('knows how many digits to wait for', () => {
    expect(answerLength({ op: 'mul', k: 7, row: 8 })).toBe(2)
    expect(answerLength({ op: 'mul', k: 10, row: 10 })).toBe(3)
    expect(answerLength({ op: 'div', k: 10, row: 3 })).toBe(2)
  })

  it('helpers show the fact and a correct way to get there', () => {
    for (const f of [...allFacts('mul'), ...allFacts('div')]) {
      const [fact, helper] = factHelp(f)
      expect(fact).toContain(`= ${factAnswer(f)}`)
      // A helper ending in "x + y" or "x − y" must give the product
      const m = /(\d+) ([+−]) (\d+)$/.exec(helper)
      if (m) {
        const v = m[2] === '+' ? +m[1] + +m[3] : +m[1] - +m[3]
        expect(v, helper).toBe(f.k * f.row)
      }
    }
    expect(factHelp({ op: 'mul', k: 7, row: 8 })[1]).toBe('7 · 10 − 7 · 2 = 70 − 14')
    expect(factHelp({ op: 'mul', k: 2, row: 8 })[1]).toBe('Verdoppeln: 8 + 8 = 16')
    expect(factHelp({ op: 'div', k: 7, row: 8 })).toEqual(['56 : 8 = 7', 'Denn 7 · 8 = 56'])
  })
})

describe('fact tracking (Leitner boxes)', () => {
  it('counts as auswendig after 3 correct answers in a row under 3 s', () => {
    const s = answers([
      [true, 2000],
      [true, 2500],
    ])
    expect(s.known).toBe(false)
    expect(factStatus(s)).toBe('practised')
    const known = recordAnswer(s, true, 2999)
    expect(known.known).toBe(true)
    expect(factStatus(known)).toBe('known')
    expect(factStatus(undefined)).toBe('new')
    expect(DEFAULT_KNOWN_MS).toBe(3000)
  })

  it('a slow or wrong answer breaks the streak', () => {
    const slow = answers([
      [true, 1000],
      [true, 1000],
      [true, 3500],
      [true, 1000],
    ])
    expect(slow.known).toBe(false)
    const wrong = answers([
      [true, 1000],
      [false, 1000],
      [true, 1000],
      [true, 1000],
    ])
    expect(wrong.known).toBe(false)
  })

  it('uses the threshold from the parent area', () => {
    let s: FactStats | undefined
    for (let i = 0; i < 3; i++) s = recordAnswer(s, true, 4000, 5000)
    expect(s!.known).toBe(true)
  })

  it('moves up when fast and correct, back to box 1 when wrong, stays when slow', () => {
    let s = answers([
      [true, 1000],
      [true, 1000],
    ])
    expect(s.box).toBe(3)
    s = recordAnswer(s, true, 5000)
    expect(s.box).toBe(3)
    for (let i = 0; i < 5; i++) s = recordAnswer(s, true, 500)
    expect(s.box).toBe(5)
    s = recordAnswer(s, false, 500)
    expect(s.box).toBe(1)
    // Gold stays gold, the fact just comes up more often again
    expect(s.known).toBe(true)
  })

  it('keeps the last 5 answers with their times', () => {
    const s = answers([1, 2, 3, 4, 5, 6].map((i) => [i % 2 === 0, i * 100] as [boolean, number]))
    expect(s.recent).toHaveLength(5)
    expect(s.recent.at(-1)).toEqual({ ok: true, ms: 600 })
    expect(s.seen).toBe(6)
    expect(s.correct).toBe(3)
  })

  it('averages the correct answer times of one dojo', () => {
    const facts: FactMap = {
      'mul-2-3': answers([
        [true, 1000],
        [false, 9000],
      ]),
      'mul-4-3': answers([[true, 3000]]),
      'div-2-3': answers([[true, 9000]]),
    }
    expect(averageMs(facts, 'mul')).toBe(2000)
    expect(averageMs({}, 'mul')).toBeNull()
  })

  it('counts known facts and a complete grid', () => {
    const facts: FactMap = {}
    for (const f of allFacts('div')) facts[factId(f)] = { ...answers([[true, 1]]), known: true }
    expect(knownCount(facts, 'div')).toBe(100)
    expect(gridComplete(facts, 'div')).toBe(true)
    expect(gridComplete(facts, 'mul')).toBe(false)
  })
})

describe('choosing facts', () => {
  it('draws weak facts more often than known ones', () => {
    const pool = rowFacts('mul', 7)
    const facts: FactMap = {}
    for (const f of pool) facts[factId(f)] = { ...answers([[true, 1]]), box: 5 }
    facts['mul-8-7'] = { ...facts['mul-8-7'], box: 1 }
    const rng = seededRng(1)
    let weak = 0
    for (let i = 0; i < 1000; i++) if (factId(drawFact(facts, pool, rng)) === 'mul-8-7') weak++
    // weight 16 against 9 × 1 → about 64 %
    expect(weak).toBeGreaterThan(550)
    expect(weak).toBeLessThan(730)
  })

  it('avoids the facts that were just shown', () => {
    const pool = rowFacts('div', 2)
    const rng = seededRng(2)
    const avoid = pool.slice(0, 9).map(factId)
    for (let i = 0; i < 50; i++) expect(factId(drawFact({}, pool, rng, avoid))).toBe('div-10-2')
  })

  it('plans 10 different facts for Üben (one row or mixed)', () => {
    for (let seed = 0; seed < 200; seed++) {
      const rng = seededRng(seed)
      const row = planPractice({}, 'mul', 6, rng)
      expect(new Set(row.map(factId)).size).toBe(10)
      expect(row.every((f) => f.row === 6 && f.op === 'mul')).toBe(true)
      const mix = planPractice({}, 'div', 'mix', rng)
      expect(new Set(mix.map(factId)).size).toBe(10)
      expect(mix.every((f) => f.op === 'div')).toBe(true)
    }
    expect(drawFacts({}, allFacts('mul'), 20, seededRng(3))).toHaveLength(20)
  })

  it('brings a missed fact back a few facts later', () => {
    const queue = rowFacts('mul', 3)
    const missed = queue[2]
    const next = requeue(queue, 2, missed)
    expect(next).toHaveLength(11)
    expect(next.indexOf(missed, 3)).toBe(6)
    // Near the end it goes last
    expect(requeue(queue, 9, queue[9]).at(-1)).toBe(queue[9])
  })
})

describe('merging facts between devices', () => {
  it('keeps the copy with more answers, gold stays gold', () => {
    const pc: FactMap = { 'mul-7-8': { ...answers([[true, 1]]), known: true } }
    const phone: FactMap = {
      'mul-7-8': answers([
        [false, 1],
        [true, 1],
      ]),
      'div-3-3': answers([[true, 1]]),
    }
    const merged = mergeFacts(pc, phone)
    expect(merged['mul-7-8'].seen).toBe(2)
    expect(merged['mul-7-8'].known).toBe(true)
    expect(merged['div-3-3'].seen).toBe(1)
  })
})
