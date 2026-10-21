import { describe, expect, it } from 'vitest'
import { SHOW_LENGTH, SHOW_TOPICS, planShow } from '../math/show'
import { seededRng } from '../math/random'
import { REWARD, answerReward, streakBonus, summarizeShow } from './economy'

describe('rewards', () => {
  it('pays 5 / 3 / 1 coins by attempt, double for challenges', () => {
    expect(answerReward(1)).toBe(5)
    expect(answerReward(2)).toBe(3)
    expect(answerReward(3)).toBe(1)
    expect(answerReward(7)).toBe(1)
    expect(answerReward(1, true)).toBe(10)
  })

  it('gives a streak bonus after every 5 first tries in a row', () => {
    expect([1, 2, 3, 4, 5, 6, 10].map(streakBonus)).toEqual([0, 0, 0, 0, 5, 0, 5])
  })

  it('sums up a show with streak and show bonus', () => {
    const perfect = Array.from({ length: 10 }, () => ({ attempts: 1, challenge: false }))
    // 10 × 5 + 2 streak bonuses + show bonus
    expect(summarizeShow(perfect)).toEqual({ solved: 10, total: 10, coins: 50 + 10 + 10 })

    const mixed = [
      { attempts: 1, challenge: false },
      { attempts: 2, challenge: false },
      { attempts: 3, challenge: false },
      { attempts: 1, challenge: true },
    ]
    expect(summarizeShow(mixed)).toEqual({
      solved: 3,
      total: 4,
      coins: 5 + 3 + 1 + 10 + REWARD.showBonus,
    })
  })

  it('never ends a show with fewer coins than the show bonus', () => {
    const slow = Array.from({ length: 10 }, () => ({ attempts: 5, challenge: false }))
    expect(summarizeShow(slow).coins).toBe(10 + REWARD.showBonus)
  })
})

describe('planShow', () => {
  it('has 10 tasks: 6 focus, 3 revision, 1 challenge at the end', () => {
    for (let seed = 0; seed < 200; seed++) {
      const show = planShow(seededRng(seed))
      expect(show).toHaveLength(SHOW_LENGTH)
      expect(show.filter((s) => s.topic === 'einmaleins' && !s.challenge)).toHaveLength(6)
      expect(show.filter((s) => s.challenge)).toEqual([
        { topic: 'einmaleins', level: 3, challenge: true },
      ])
      expect(show.at(-1)!.challenge).toBe(true)
      for (const s of show) expect(SHOW_TOPICS).toContain(s.topic)
    }
  })

  it('keeps written tasks out of shows until the grid exists', () => {
    expect(SHOW_TOPICS.some((t) => t.startsWith('schriftlich'))).toBe(false)
  })

  it('caps the challenge at level 5', () => {
    const show = planShow(seededRng(1), { focus: 'geld', levels: { geld: 5 } })
    expect(show.at(-1)).toEqual({ topic: 'geld', level: 5, challenge: true })
    expect(show.every((s) => s.topic === 'geld')).toBe(true)
  })
})
