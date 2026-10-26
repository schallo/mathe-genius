import { describe, expect, it } from 'vitest'
import { seededRng } from './random'
import { REVIEW_MAX, addMistake, answerReview, countShow, dueReviews, emptyReview } from './review'
import { DEFAULT_LEVELS, SHOW_LENGTH, planRound } from './show'
import { generateTask } from './topics'

const task = (seed: number) => generateTask('kopfrechnen', 2, seededRng(seed))

describe('mistakes come back', () => {
  it('a mistake comes back in the next show, not in the same one', () => {
    let q = addMistake(emptyReview(), task(1))
    expect(dueReviews(q)).toHaveLength(0)
    q = countShow(q)
    expect(dueReviews(q).map((i) => i.task.question)).toEqual([task(1).question])
  })

  it('right on the first try: gone; wrong again: back two shows later', () => {
    let q = countShow(addMistake(emptyReview(), task(1)))
    expect(answerReview(q, task(1), true).items).toHaveLength(0)
    q = answerReview(q, task(1), false)
    expect(q.items[0]).toMatchObject({ misses: 2, due: q.shows + 2 })
    expect(dueReviews(countShow(q))).toHaveLength(0)
    expect(dueReviews(countShow(countShow(q)))).toHaveLength(1)
  })

  it('keeps each task once, at most 20, oldest go first; 2 per show', () => {
    let q = emptyReview()
    for (let i = 0; i < 30; i++) q = addMistake(q, task(i))
    q = addMistake(q, task(29))
    expect(q.items).toHaveLength(REVIEW_MAX)
    expect(q.items.filter((i) => i.task.question === task(29).question)).toHaveLength(1)
    expect(dueReviews(countShow(q))).toHaveLength(2)
  })

  it('a Theater show puts the old mistakes in at random places', () => {
    const reviews = [task(1), task(2)]
    const slots = planRound(
      { kind: 'theater', hut: 'marktstand' },
      seededRng(3),
      DEFAULT_LEVELS,
      reviews,
    )
    expect(slots).toHaveLength(SHOW_LENGTH)
    expect(
      slots
        .filter((s) => s.review)
        .map((s) => s.review!.question)
        .sort(),
    ).toEqual(reviews.map((t) => t.question).sort())
    // Hut rounds never bring old mistakes
    const hut = planRound(
      { kind: 'hut', hut: 'zahlenturm', topic: 'kopfrechnen', level: 1 },
      seededRng(3),
      DEFAULT_LEVELS,
      reviews,
    )
    expect(hut.some((s) => s.review)).toBe(false)
  })

  it('the Theater uses her current level + 1', () => {
    const levels = { ...DEFAULT_LEVELS, geld: 3 as const }
    const slots = planRound({ kind: 'theater', hut: 'marktstand' }, seededRng(1), levels)
    expect(slots.every((s) => s.level === 4)).toBe(true)
  })
})
