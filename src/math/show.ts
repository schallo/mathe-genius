// Composition of a show (GAME_DESIGN §6): 10 tasks, about 60 % focus topic,
// 30 % revision of other topics, 10 % challenge (one level above, double coins).
// Adaptive levels and mistake repetition follow in build step 10.
import { pick } from './random'
import { TOPICS } from './topics'
import type { Level, Rng, TopicId } from './types'

export const SHOW_LENGTH = 10

export type ShowSlot = { topic: TopicId; level: Level; challenge: boolean }

export type ShowSettings = {
  focus: TopicId
  /** Current level per topic */
  levels: Partial<Record<TopicId, Level>>
}

export const DEFAULT_SHOW_SETTINGS: ShowSettings = {
  focus: 'einmaleins',
  levels: {
    einmaleins: 2,
    kopfrechnen: 1,
    halbschriftlich: 1,
    zahlenraum: 1,
    schriftlichAddition: 1,
    schriftlichSubtraktion: 1,
    schriftlichMultiplikation: 1,
    schriftlichDivision: 1,
    geld: 1,
  },
}

export const SHOW_TOPICS: TopicId[] = TOPICS.map((t) => t.id)

/** A round of 10 tasks: a show in the Theater, or calm practice of one topic in a learning hut. */
export type Round = { kind: 'theater' } | { kind: 'hut'; hut: string; topic: TopicId; level: Level }

/** Hut id of the door she comes back out of. */
export const roundHut = (round: Round) => (round.kind === 'hut' ? round.hut : 'theater')

export function planRound(round: Round, rng: Rng): ShowSlot[] {
  if (round.kind === 'theater') return planShow(rng)
  return Array.from({ length: SHOW_LENGTH }, () => ({
    topic: round.topic,
    level: round.level,
    challenge: false,
  }))
}

const levelOf = (settings: ShowSettings, topic: TopicId): Level => settings.levels[topic] ?? 1

export function planShow(rng: Rng, settings: ShowSettings = DEFAULT_SHOW_SETTINGS): ShowSlot[] {
  const revision = SHOW_TOPICS.filter((t) => t !== settings.focus && settings.levels[t])
  const focusLevel = levelOf(settings, settings.focus)
  const slots: ShowSlot[] = []
  for (let i = 0; i < 6; i++)
    slots.push({ topic: settings.focus, level: focusLevel, challenge: false })
  for (let i = 0; i < 3; i++) {
    const topic = revision.length > 0 ? pick(rng, revision) : settings.focus
    slots.push({ topic, level: levelOf(settings, topic), challenge: false })
  }
  slots.sort(() => rng() - 0.5)
  // The challenge comes last, as the show's finale; at level 5 it stays at level 5
  slots.push({
    topic: settings.focus,
    level: Math.min(5, focusLevel + 1) as Level,
    challenge: true,
  })
  return slots
}
