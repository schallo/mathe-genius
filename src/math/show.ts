// Rounds of 10 tasks. Pure logic.
// - Theater (decided 2026-10-25, replaces the 60/30/10 mix of GAME_DESIGN §6): every
//   calendar week the shows take all tasks from another hut, one level harder than her
//   level there, and every task pays double coins.
// - Learning huts: 10 calm tasks of the topic and level she picked.
// Theater shows also bring back up to 2 old mistakes (math/review.ts); her levels come
// from math/adaptive.ts.
import { shuffle } from './einmaleins'
import { missingFactorTask, multiplication } from './generators/einmaleins'
import { generateTask, TOPICS } from './topics'
import type { Level, Rng, Task, TopicId } from './types'

export const SHOW_LENGTH = 10

/**
 * One task of a round. `variant` picks a special Einmaleins task (Mal-Dojo week);
 * `review` is an old mistake that comes back as it was.
 */
export type ShowSlot = {
  topic: TopicId
  level: Level
  variant?: 'multiply' | 'missingFactor'
  review?: Task
}

/** Her starting level per topic (math/adaptive.ts moves it up and down). */
export const DEFAULT_LEVELS: Record<TopicId, Level> = {
  einmaleins: 2,
  kopfrechnen: 1,
  halbschriftlich: 1,
  zahlenraum: 1,
  schriftlichAddition: 1,
  schriftlichSubtraktion: 1,
  schriftlichMultiplikation: 1,
  schriftlichDivision: 1,
  geld: 1,
}

/** The weekly order of the Theater (hut ids from world/village.ts). */
export const WEEK_HUTS = ['maldojo', 'teildojo', 'zahlenturm', 'werkstatt', 'marktstand'] as const
export type WeekHut = (typeof WEEK_HUTS)[number]

const DAY_MS = 24 * 60 * 60 * 1000

/**
 * Hut of the week for a date (local time). Weeks start on Monday and are counted from
 * 1970, so the rotation simply continues across new year.
 */
export function weekHut(date: Date): WeekHut {
  // Local calendar day number; 1 January 1970 was a Thursday, so +3 makes weeks start on Monday
  const day = Math.floor(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / DAY_MS)
  const week = Math.floor((day + 3) / 7)
  return WEEK_HUTS[week % WEEK_HUTS.length]
}

const harder = (level: Level): Level => Math.min(5, level + 1) as Level

/**
 * The Theater show of a week. The dojos have no levels, so their harder form is:
 * Mal-Dojo = plain facts mixed with missing factors (? · 8 = 56),
 * Teil-Dojo = division with remainder (Einmaleins level 5).
 */
export function planTheater(
  hut: WeekHut,
  rng: Rng,
  levels: Record<TopicId, Level> = DEFAULT_LEVELS,
): ShowSlot[] {
  if (hut === 'maldojo') {
    const half = SHOW_LENGTH / 2
    return shuffle(
      Array.from({ length: SHOW_LENGTH }, (_, i) => ({
        topic: 'einmaleins' as const,
        level: 4 as const,
        variant: i < half ? ('multiply' as const) : ('missingFactor' as const),
      })),
      rng,
    )
  }
  if (hut === 'teildojo') {
    return Array.from({ length: SHOW_LENGTH }, () => ({ topic: 'einmaleins' as const, level: 5 }))
  }
  // A hut's topics take turns, each one level above her level
  const topics = shuffle(
    TOPICS.filter((t) => t.hut === hut).map((t) => t.id),
    rng,
  )
  return shuffle(
    Array.from({ length: SHOW_LENGTH }, (_, i) => {
      const topic = topics[i % topics.length]
      return { topic, level: harder(levels[topic]) }
    }),
    rng,
  )
}

export function slotTask(slot: ShowSlot, rng: Rng): Task {
  if (slot.review) return slot.review
  if (slot.variant === 'multiply') return multiplication(rng, slot.level)
  if (slot.variant === 'missingFactor') return missingFactorTask(rng, slot.level)
  return generateTask(slot.topic, slot.level, rng)
}

/** A round of 10 tasks: a show in the Theater, or calm practice of one topic in a learning hut. */
export type Round =
  { kind: 'theater'; hut: WeekHut } | { kind: 'hut'; hut: string; topic: TopicId; level: Level }

/** The Theater round of today's week. */
export const theaterRound = (date = new Date()): Round => ({ kind: 'theater', hut: weekHut(date) })

/** Hut id of the door she comes back out of. */
export const roundHut = (round: Round) => (round.kind === 'hut' ? round.hut : 'theater')

/** Theater shows pay double coins for every task (and for the bonuses). */
export const coinFactor = (round: Round) => (round.kind === 'theater' ? 2 : 1)

/**
 * The 10 tasks of a round. A Theater show uses her current `levels` and replaces tasks
 * at random places with the old mistakes in `reviews`.
 */
export function planRound(
  round: Round,
  rng: Rng,
  levels: Record<TopicId, Level> = DEFAULT_LEVELS,
  reviews: Task[] = [],
): ShowSlot[] {
  if (round.kind === 'hut') {
    return Array.from({ length: SHOW_LENGTH }, () => ({ topic: round.topic, level: round.level }))
  }
  const slots = planTheater(round.hut, rng, levels)
  const places = shuffle(
    slots.map((_, i) => i),
    rng,
  )
  reviews.slice(0, SHOW_LENGTH).forEach((task, i) => {
    slots[places[i]] = { topic: task.topic, level: task.level, review: task }
  })
  return slots
}
