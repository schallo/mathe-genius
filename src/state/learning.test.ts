import { describe, expect, it } from 'vitest'
import { item } from '../data/items'
import { seededRng } from '../math/random'
import { generateTask } from '../math/topics'
import { finishTheaterShow, recordMistake, recordShowTask } from './learning'
import {
  coinBalance,
  earnCoins,
  earnStars,
  emptySave,
  mergeSaves,
  parseSave,
  starBalance,
  type SaveData,
} from './save'
import { buy, canAfford, missingStars } from './shop'

const dev = 'pc'
const task = (seed: number, level: 1 | 2 = 1) => generateTask('kopfrechnen', level, seededRng(seed))

function solve(save: SaveData, attempts: number[], review = false): SaveData {
  return attempts.reduce((s, a, i) => recordShowTask(s, task(i), a, review, dev).save, save)
}

describe('learning progress in the save', () => {
  it('3 first tries: next level and a star', () => {
    const s = solve(emptySave(), [1, 1, 1])
    expect(s.mastery.kopfrechnen).toMatchObject({ level: 2, best: 2, solved: 3, firstTry: 3 })
    expect(starBalance(s)).toBe(1)
  })

  it('a task solved only with help comes back in a later show', () => {
    let s = solve(emptySave(), [1, 2, 3])
    expect(s.review.items.map((i) => i.task.question)).toEqual([task(1).question, task(2).question])
    s = finishTheaterShow(s)
    // The old mistake right on the first try: gone
    s = recordShowTask(s, task(1), 1, true, dev).save
    expect(s.review.items.map((i) => i.task.question)).toEqual([task(2).question])
  })

  it('battle mistakes go into the same queue', () => {
    expect(recordMistake(emptySave(), task(5)).review.items).toHaveLength(1)
  })

  it('star items need stars plus coins and spend both', () => {
    const spange = item('sternspange')!
    let s = earnCoins(emptySave(), 100, dev)
    expect(canAfford(s, spange)).toBe(false)
    expect(missingStars(s, spange)).toBe(2)
    expect(buy(s, spange, dev)).toEqual({ ok: false, reason: 'coins' })
    s = earnStars(s, 3, 'phone')
    const bought = buy(s, spange, dev)
    expect(bought.ok).toBe(true)
    if (!bought.ok) return
    expect(starBalance(bought.save)).toBe(1)
    expect(coinBalance(bought.save)).toBe(100 - spange.price)
    expect(bought.save.owned).toContain('sternspange')
  })

  it('round-trips mastery, review queue and spent stars; drops broken entries', () => {
    let s = solve(emptySave(), [1, 1, 1, 2])
    s = { ...s, starsSpent: { pc: 1 } }
    const raw = JSON.parse(JSON.stringify(s))
    raw.mastery.nope = { level: 2 }
    raw.mastery.geld = { level: 9 }
    raw.review.items.push({ task: { question: 'x' }, due: 1, misses: 1 })
    const back = parseSave(raw)!
    expect(back.mastery).toEqual(s.mastery)
    expect(back.review).toEqual(s.review)
    expect(back.starsSpent).toEqual({ pc: 1 })
    // An old save without these fields
    expect(
      parseSave({ ...JSON.parse(JSON.stringify(emptySave())), mastery: undefined })?.mastery,
    ).toEqual({})
  })

  it('merges two devices: levels by more answers, stars and spent stars never go down', () => {
    const pc = { ...solve(emptySave(), [1, 1, 1]), starsSpent: { pc: 1 }, updatedAt: 1 }
    const phone = { ...solve(emptySave(), [1, 2]), updatedAt: 2 }
    const merged = mergeSaves(pc, phone)
    expect(merged.mastery.kopfrechnen?.level).toBe(2)
    expect(merged.starsSpent).toEqual({ pc: 1 })
    expect(starBalance(merged)).toBe(0)
  })
})
