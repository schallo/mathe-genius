// Adaptive difficulty and stars (GAME_DESIGN §6 "Difficulty & learning logic"). Pure logic.
// Each topic has her current level 1–5:
// - 3 tasks right on the first try in a row (at or above her level) → one level up.
// - 2 misses in a row (at or below her level) → one level down. Misses at a harder level
//   (the Theater plays one level above) never pull her down: those are the challenge.
// - The first time she reaches a level she gets a star, and one more for mastering level 5.
//   Stars and her best level are never taken away.
import { DEFAULT_LEVELS } from './show'
import { LEVELS, type Level, type TopicId } from './types'

export const LEVEL_UP_STREAK = 3
export const LEVEL_DOWN_MISSES = 2

export type TopicProgress = {
  level: Level
  /** Highest level ever reached */
  best: Level
  /** First-try answers in a row (at or above her level) */
  streak: number
  /** Misses in a row (at or below her level) */
  misses: number
  /** Level 5 mastered (3 in a row there) */
  mastered: boolean
  /** Tasks answered and answered on the first try */
  solved: number
  firstTry: number
}

export type Mastery = Partial<Record<TopicId, TopicProgress>>

export function startProgress(topic: TopicId): TopicProgress {
  const level = DEFAULT_LEVELS[topic]
  return { level, best: level, streak: 0, misses: 0, mastered: false, solved: 0, firstTry: 0 }
}

export type TaskOutcome = {
  progress: TopicProgress
  change: 'up' | 'down' | null
  /** Stars earned with this answer */
  stars: number
}

/** One answered task of `topic` at `taskLevel`; `firstTry` = right without a hint. */
export function recordTask(
  current: TopicProgress | undefined,
  topic: TopicId,
  taskLevel: Level,
  firstTry: boolean,
): TaskOutcome {
  const p = { ...(current ?? startProgress(topic)) }
  p.solved++
  let change: TaskOutcome['change'] = null
  let stars = 0
  if (firstTry) {
    p.firstTry++
    p.misses = 0
    if (taskLevel >= p.level) p.streak++
    if (p.streak >= LEVEL_UP_STREAK) {
      p.streak = 0
      if (p.level < 5) {
        p.level = (p.level + 1) as Level
        change = 'up'
        if (p.level > p.best) {
          p.best = p.level
          stars++
        }
      } else if (!p.mastered) {
        p.mastered = true
        stars++
      }
    }
  } else {
    p.streak = 0
    if (taskLevel <= p.level) p.misses++
    if (p.misses >= LEVEL_DOWN_MISSES) {
      p.misses = 0
      if (p.level > 1) {
        p.level = (p.level - 1) as Level
        change = 'down'
      }
    }
  }
  return { progress: p, change, stars }
}

/** Her current level for every topic (defaults where she hasn't played yet). */
export function currentLevels(mastery: Mastery): Record<TopicId, Level> {
  const out = { ...DEFAULT_LEVELS }
  for (const [topic, p] of Object.entries(mastery)) {
    if (p && LEVELS.includes(p.level)) out[topic as TopicId] = p.level
  }
  return out
}

/** Cloud sync: per topic the copy with more answers wins; best level and mastery only grow. */
export function mergeMastery(a: Mastery, b: Mastery): Mastery {
  const out: Mastery = { ...a }
  for (const [topic, p] of Object.entries(b) as [TopicId, TopicProgress][]) {
    const mine = out[topic]
    const winner = !mine || p.solved >= mine.solved ? p : mine
    out[topic] = {
      ...winner,
      best: Math.max(winner.best, mine?.best ?? 1, p.best) as Level,
      mastered: winner.mastered || !!mine?.mastered || p.mastered,
    }
  }
  return out
}
