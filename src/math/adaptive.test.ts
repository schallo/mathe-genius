import { describe, expect, it } from 'vitest'
import {
  currentLevels,
  mergeMastery,
  recordTask,
  startProgress,
  type TopicProgress,
} from './adaptive'
import { DEFAULT_LEVELS } from './show'
import type { Level } from './types'

/** Plays answers at the given level (true = first try) and sums the stars. */
function play(answers: boolean[], level: (p: TopicProgress) => Level = (p) => p.level) {
  let p: TopicProgress | undefined
  let stars = 0
  const changes: (string | null)[] = []
  for (const firstTry of answers) {
    const out = recordTask(p, 'kopfrechnen', level(p ?? startProgress('kopfrechnen')), firstTry)
    p = out.progress
    stars += out.stars
    changes.push(out.change)
  }
  return { p: p!, stars, changes }
}

describe('adaptive levels', () => {
  it('starts at the default level of the topic', () => {
    expect(startProgress('einmaleins').level).toBe(DEFAULT_LEVELS.einmaleins)
    expect(currentLevels({})).toEqual(DEFAULT_LEVELS)
  })

  it('3 first tries in a row: one level up and a star for a new level', () => {
    const { p, stars, changes } = play([true, true, true])
    expect(p.level).toBe(2)
    expect(p.best).toBe(2)
    expect(stars).toBe(1)
    expect(changes).toEqual([null, null, 'up'])
  })

  it('a hint in between starts the streak again', () => {
    expect(play([true, true, false, true, true]).p.level).toBe(1)
  })

  it('2 misses in a row: one level down, stars and best level stay', () => {
    const { p, stars } = play([true, true, true, true, true, true, false, false])
    expect(p.level).toBe(2)
    expect(p.best).toBe(3)
    expect(stars).toBe(2)
  })

  it('never goes below level 1', () => {
    expect(play([false, false, false, false]).p.level).toBe(1)
  })

  it('reaching a level again gives no second star', () => {
    // up to 2 (star), down to 1, up to 2 again (no star)
    const { stars, p } = play([true, true, true, false, false, true, true, true])
    expect(p.level).toBe(2)
    expect(stars).toBe(1)
  })

  it('level 5: one more star for mastering it, then no more', () => {
    const { p, stars } = play(Array(4 * 3 + 6).fill(true))
    expect(p.level).toBe(5)
    expect(p.mastered).toBe(true)
    expect(stars).toBe(4 + 1)
  })

  it('harder tasks (Theater, level + 1) count up, but misses there do not pull down', () => {
    const harder = (p: TopicProgress) => Math.min(5, p.level + 1) as Level
    expect(play([true, true, true], harder).p.level).toBe(2)
    expect(play([false, false, false, false], harder).p.level).toBe(1)
    const start = play([true, true, true]).p // level 2
    let p = start
    for (let i = 0; i < 4; i++) p = recordTask(p, 'kopfrechnen', 3, false).progress
    expect(p.level).toBe(2)
  })

  it('easier tasks (picked lower in a hut) do not count up', () => {
    let p = play([true, true, true]).p // level 2
    for (let i = 0; i < 6; i++) p = recordTask(p, 'kopfrechnen', 1, true).progress
    expect(p.level).toBe(2)
    expect(p.firstTry).toBe(9)
  })

  it('merges two devices: more answers wins, best and mastery only grow', () => {
    const pc = { kopfrechnen: { ...play([true, true, true]).p, best: 4 as Level } }
    const phone = {
      kopfrechnen: play([true, true, true, true, true]).p,
      geld: startProgress('geld'),
    }
    const merged = mergeMastery(pc, phone)
    expect(merged.kopfrechnen?.solved).toBe(5)
    expect(merged.kopfrechnen?.best).toBe(4)
    expect(merged.geld?.level).toBe(1)
  })
})
