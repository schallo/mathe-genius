// What a finished task changes in the save (GAME_DESIGN §6): her level per topic, stars for
// new levels, and the queue of mistakes that come back in later Theater shows. Pure logic.
import { recordTask, startProgress, type TaskOutcome } from '../math/adaptive'
import { addMistake, answerReview, countShow } from '../math/review'
import type { Level, Task, TopicId } from '../math/types'
import { earnStars, type SaveData } from './save'

export type AnswerResult = {
  save: SaveData
  change: TaskOutcome['change']
  stars: number
}

/**
 * A task she has solved (`attempt` 1 = first try, 2 = after the hint, 3+ = after the
 * worked solution). `review` = it was an old mistake coming back.
 */
export function recordShowTask(
  save: SaveData,
  task: Task,
  attempt: number,
  review: boolean,
  device: string,
): AnswerResult {
  const firstTry = attempt <= 1
  const outcome = recordTask(save.mastery[task.topic], task.topic, task.level, firstTry)
  let next: SaveData = { ...save, mastery: { ...save.mastery, [task.topic]: outcome.progress } }
  if (outcome.stars) next = earnStars(next, outcome.stars, device)
  if (review) next = { ...next, review: answerReview(next.review, task, firstTry) }
  else if (!firstTry) next = recordMistake(next, task)
  return { save: next, change: outcome.change, stars: outcome.stars }
}

/** A task she got wrong (e.g. in a battle) comes back in a later show. */
export function recordMistake(save: SaveData, task: Task): SaveData {
  return { ...save, review: addMistake(save.review, task) }
}

/** End of a Theater show: the clock of the mistake queue moves on. */
export function finishTheaterShow(save: SaveData): SaveData {
  return { ...save, review: countShow(save.review) }
}

/**
 * Parent area: sets her level for a topic by hand (e.g. the level from school). Her best
 * level never goes down and no stars are given for it.
 */
export function setTopicLevel(save: SaveData, topic: TopicId, level: Level): SaveData {
  const current = save.mastery[topic] ?? startProgress(topic)
  const progress = {
    ...current,
    level,
    best: Math.max(current.best, level) as Level,
    streak: 0,
    misses: 0,
  }
  return { ...save, mastery: { ...save.mastery, [topic]: progress } }
}
