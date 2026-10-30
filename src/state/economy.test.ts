import { describe, expect, it } from 'vitest'
import {
  DEFAULT_LEVELS,
  SHOW_LENGTH,
  WEEK_HUTS,
  coinFactor,
  planRound,
  planTheater,
  roundHut,
  slotTask,
  weekHut,
} from '../math/show'
import { topic } from '../math/topics'
import { seededRng } from '../math/random'
import {
  NO_BOOST,
  REWARD,
  answerReward,
  coinAttempt,
  streakBonus,
  summarizeShow,
  taskCoins,
} from './economy'

describe('pet traits in rounds', () => {
  it('a forgiven mistake counts as one try earlier for coins and the streak', () => {
    expect(coinAttempt({ attempts: 2, free: true })).toBe(1)
    expect(coinAttempt({ attempts: 3, free: true })).toBe(2)
    expect(coinAttempt({ attempts: 2 })).toBe(2)
    const results = [1, 1, 2, 1, 1].map((attempts, i) => ({ attempts, free: i === 2 }))
    // 5 × 5 coins + the streak bonus + the round bonus
    expect(summarizeShow(results).coins).toBe(25 + 5 + 10)
    // Her real answers still count as solved after the hint
    expect(summarizeShow(results).solved).toBe(5)
  })

  it('an earlier streak bonus and extra coins for first tries', () => {
    const four = { streakLength: 4, bonusCoins: 0 }
    expect([3, 4, 5, 8].map((n) => streakBonus(n, 1, 4))).toEqual([0, 5, 0, 5])
    const perfect = Array.from({ length: 10 }, () => ({ attempts: 1 }))
    expect(summarizeShow(perfect, 1, four).coins).toBe(50 + 2 * 5 + 10)
    const coins = { streakLength: 5, bonusCoins: 1 }
    expect(taskCoins(1, 1, coins)).toBe(6)
    expect(taskCoins(2, 1, coins)).toBe(3)
    expect(taskCoins(1, 2, coins)).toBe(12)
    expect(summarizeShow(perfect, 1, coins).coins).toBe(60 + 10 + 10)
    expect(summarizeShow(perfect, 1, NO_BOOST)).toEqual(summarizeShow(perfect))
  })
})

describe('rewards', () => {
  it('pays 5 / 3 / 1 coins by attempt, double in the Theater', () => {
    expect(answerReward(1)).toBe(5)
    expect(answerReward(2)).toBe(3)
    expect(answerReward(3)).toBe(1)
    expect(answerReward(7)).toBe(1)
    expect(answerReward(1, 2)).toBe(10)
    expect(answerReward(3, 2)).toBe(2)
  })

  it('gives a streak bonus after every 5 first tries in a row', () => {
    expect([1, 2, 3, 4, 5, 6, 10].map((n) => streakBonus(n))).toEqual([0, 0, 0, 0, 5, 0, 5])
  })

  it('sums up a show with streak and show bonus', () => {
    const perfect = Array.from({ length: 10 }, () => ({ attempts: 1 }))
    // 10 × 5 + 2 streak bonuses + show bonus
    expect(summarizeShow(perfect)).toEqual({ solved: 10, total: 10, coins: 50 + 10 + 10 })

    const mixed = [{ attempts: 1 }, { attempts: 2 }, { attempts: 3 }, { attempts: 1 }]
    expect(summarizeShow(mixed)).toEqual({
      solved: 3,
      total: 4,
      coins: 5 + 3 + 1 + 5 + REWARD.showBonus,
    })
  })

  it('doubles everything in a Theater show, bonuses too', () => {
    const perfect = Array.from({ length: 10 }, () => ({ attempts: 1 }))
    expect(summarizeShow(perfect, 2).coins).toBe(2 * (50 + 10 + 10))
    expect(streakBonus(5, 2)).toBe(10)
  })

  it('never ends a show with fewer coins than the show bonus', () => {
    const slow = Array.from({ length: 10 }, () => ({ attempts: 5 }))
    expect(summarizeShow(slow).coins).toBe(10 + REWARD.showBonus)
  })
})

describe('Theater with a weekly hut', () => {
  it('changes the hut every Monday and goes round all five', () => {
    // Monday 26 October 2026 … Sunday 1 November 2026: one hut
    const week = weekHut(new Date(2026, 9, 26))
    for (let d = 26; d <= 31; d++) expect(weekHut(new Date(2026, 9, d, 18))).toBe(week)
    expect(weekHut(new Date(2026, 10, 1, 23, 59))).toBe(week)
    // The next five Mondays bring the other huts in order, then it starts again
    const mondays = Array.from({ length: 6 }, (_, i) => weekHut(new Date(2026, 9, 26 + 7 * i)))
    expect(new Set(mondays.slice(0, 5)).size).toBe(5)
    expect(mondays[5]).toBe(mondays[0])
    const at = WEEK_HUTS.indexOf(week)
    expect(mondays[1]).toBe(WEEK_HUTS[(at + 1) % WEEK_HUTS.length])
    // Across new year the rotation just continues
    const dec28 = WEEK_HUTS.indexOf(weekHut(new Date(2026, 11, 28)))
    expect(weekHut(new Date(2027, 0, 4))).toBe(WEEK_HUTS[(dec28 + 1) % WEEK_HUTS.length])
  })

  it('hut weeks: the hut topics, one level above her level, max. level 5', () => {
    for (const hut of ['zahlenturm', 'werkstatt', 'marktstand'] as const) {
      for (let seed = 0; seed < 50; seed++) {
        const slots = planTheater(hut, seededRng(seed))
        expect(slots).toHaveLength(SHOW_LENGTH)
        for (const s of slots) {
          expect(topic(s.topic).hut).toBe(hut)
          expect(s.level).toBe(Math.min(5, DEFAULT_LEVELS[s.topic] + 1))
        }
      }
    }
    // Werkstatt: all five topics take turns
    expect(new Set(planTheater('werkstatt', seededRng(1)).map((s) => s.topic)).size).toBe(5)
    const top = { ...DEFAULT_LEVELS, geld: 5 as const }
    expect(planTheater('marktstand', seededRng(1), top).every((s) => s.level === 5)).toBe(true)
  })

  it('Mal-Dojo week: facts and missing factors; Teil-Dojo week: division with remainder', () => {
    const mal = planTheater('maldojo', seededRng(2)).map((s) => slotTask(s, seededRng(3)))
    expect(mal.filter((t) => t.math.kind === 'missingFactor')).toHaveLength(5)
    expect(mal.filter((t) => t.math.kind === 'calc' && t.math.op === '·')).toHaveLength(5)
    const teil = planTheater('teildojo', seededRng(2)).map((s, i) => slotTask(s, seededRng(i)))
    expect(teil.every((t) => t.format.kind === 'numpad' && t.format.remainder)).toBe(true)
  })

  it('a learning-hut round is 10 tasks of the picked topic and level, normal coins', () => {
    const round = {
      kind: 'hut' as const,
      hut: 'werkstatt',
      topic: 'schriftlichDivision' as const,
      level: 3 as const,
    }
    const slots = planRound(round, seededRng(1))
    expect(slots).toHaveLength(SHOW_LENGTH)
    expect(slots.every((s) => s.topic === 'schriftlichDivision' && s.level === 3)).toBe(true)
    expect(roundHut(round)).toBe('werkstatt')
    expect(coinFactor(round)).toBe(1)
    const theater = { kind: 'theater' as const, hut: 'werkstatt' as const }
    expect(roundHut(theater)).toBe('theater')
    expect(coinFactor(theater)).toBe(2)
  })
})
