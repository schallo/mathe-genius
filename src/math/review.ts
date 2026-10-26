// Mistakes come back (GAME_DESIGN §6): tasks she got wrong – in a show, a learning hut or
// a battle – are kept and come back in a later Theater show (simple spaced repetition).
// Right on the first try → gone; wrong again → it comes back two shows later. Pure logic.
import type { Task } from './types'

export type ReviewItem = {
  task: Task
  /** Theater show number from which on it may come back */
  due: number
  misses: number
}

export type ReviewQueue = {
  items: ReviewItem[]
  /** Finished Theater shows (the clock of the queue) */
  shows: number
}

/** At most this many old mistakes are kept (the oldest go first). */
export const REVIEW_MAX = 20
/** Old mistakes per Theater show */
export const REVIEW_PER_SHOW = 2

export const emptyReview = (): ReviewQueue => ({ items: [], shows: 0 })

const sameTask = (a: Task, b: Task) => a.question === b.question && a.topic === b.topic

/** A task she got wrong: it comes back in the next show (once, even if missed twice). */
export function addMistake(queue: ReviewQueue, task: Task): ReviewQueue {
  const others = queue.items.filter((i) => !sameTask(i.task, task))
  const old = queue.items.find((i) => sameTask(i.task, task))
  const item = { task, due: queue.shows + 1, misses: (old?.misses ?? 0) + 1 }
  return { ...queue, items: [...others, item].slice(-REVIEW_MAX) }
}

/** The mistakes due in this show, oldest first. */
export function dueReviews(queue: ReviewQueue, count = REVIEW_PER_SHOW): ReviewItem[] {
  return queue.items.filter((i) => i.due <= queue.shows).slice(0, count)
}

/** A mistake came back: right on the first try removes it, otherwise it waits two shows. */
export function answerReview(queue: ReviewQueue, task: Task, firstTry: boolean): ReviewQueue {
  const items = queue.items.flatMap((i) => {
    if (!sameTask(i.task, task)) return [i]
    return firstTry ? [] : [{ ...i, due: queue.shows + 2, misses: i.misses + 1 }]
  })
  return { ...queue, items }
}

/** A Theater show is over. */
export const countShow = (queue: ReviewQueue): ReviewQueue => ({ ...queue, shows: queue.shows + 1 })
