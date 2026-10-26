import { describe, expect, it } from 'vitest'
import { item } from '../data/items'
import { allFacts, factId, missedFacts, recordAnswer, slowestFacts } from '../math/einmaleins'
import { claimAlbumStars, albumCount, albumEntries, categoryComplete } from './album'
import {
  BOX_COINS,
  boxPrize,
  dayKey,
  recordRound,
  roundsToday,
  stickersThisWeek,
  weekDays,
} from './calendar'
import { setTopicLevel } from './learning'
import { addPet, coinBalance, emptySave, mergeSaves, parseSave, starBalance } from './save'

const dev = 'pc'
// Monday 26 October 2026 … Sunday 1 November 2026
const day = (d: number, hour = 17) => new Date(2026, 9, d, hour)

describe('daily calendar', () => {
  it('knows local days and weeks (Monday first)', () => {
    expect(dayKey(day(26))).toBe('2026-10-26')
    expect(weekDays(day(29))).toEqual([
      '2026-10-26',
      '2026-10-27',
      '2026-10-28',
      '2026-10-29',
      '2026-10-30',
      '2026-10-31',
      '2026-11-01',
    ])
    expect(weekDays(new Date(2026, 10, 1, 23))[0]).toBe('2026-10-26')
  })

  it('one sticker per day, however many rounds she plays', () => {
    let s = emptySave()
    let r = recordRound(s, day(26, 10), dev)
    expect(r.sticker).toBe(true)
    s = r.save
    r = recordRound(s, day(26, 18), dev)
    expect(r.sticker).toBe(false)
    expect(roundsToday(r.save, day(26))).toBe(2)
    expect(stickersThisWeek(r.save, day(26))).toBe(1)
  })

  it('suggests a break once when the rounds of the day are reached (parent setting)', () => {
    let s = { ...emptySave(), settings: { ...emptySave().settings, roundsPerDay: 2 } }
    const results = [1, 2, 3].map(() => {
      const r = recordRound(s, day(27), dev)
      s = r.save
      return r.suggestBreak
    })
    expect(results).toEqual([false, true, false])
  })

  it('the 5th sticker of a week opens the box: the cheapest Schmuck/Spielzeug she lacks', () => {
    let s = emptySave()
    const prize = boxPrize(s)!
    expect(prize.id).toBe('ball')
    for (const d of [26, 27, 28, 29]) s = recordRound(s, day(d), dev).save
    const r = recordRound(s, day(31), dev)
    expect(r.box).toEqual({ item: prize, coins: 0 })
    expect(r.save.owned).toContain('ball')
    // Only one box per week; skipped days cost nothing
    expect(recordRound(r.save, day(31, 19), dev).box).toBeUndefined()
    const next = recordRound(
      recordRound(r.save, new Date(2026, 10, 1), dev).save,
      new Date(2026, 10, 2),
      dev,
    )
    expect(next.box).toBeUndefined()
  })

  it('with everything owned the box holds coins', () => {
    let s = {
      ...emptySave(),
      owned: [
        'ball',
        'brille',
        'hut',
        'blumenkranz',
        'krone',
        'muetze',
        'cap',
        'schal',
        'rucksack',
      ],
    }
    expect(boxPrize(s)).toBeNull()
    for (const d of [26, 27, 28, 29, 30]) s = recordRound(s, day(d), dev).save
    expect(coinBalance(s)).toBe(BOX_COINS)
  })

  it('saves, drops broken days and merges two devices', () => {
    const pc = { ...recordRound(emptySave(), day(26), dev).save, updatedAt: 1 }
    const phone = {
      ...recordRound(recordRound(emptySave(), day(26), 'phone').save, day(27), 'phone').save,
      updatedAt: 2,
    }
    const merged = mergeSaves(pc, phone)
    expect(merged.calendar.days).toEqual({ '2026-10-26': 1, '2026-10-27': 1 })
    const raw = JSON.parse(JSON.stringify(merged))
    raw.calendar.days.nope = 3
    raw.calendar.boxes.push(5)
    expect(parseSave(raw)!.calendar).toEqual(merged.calendar)
  })
})

describe('album', () => {
  it('lists all items of a category and all kinds of pets', () => {
    const s = emptySave()
    expect(albumCount(s, 'kleider').collected).toBe(2) // the starter outfits
    const pets = albumEntries(addPet(s, 'hund', 'Bello'), 'tiere')
    expect(pets.filter((p) => p.collected)).toHaveLength(1)
    expect(pets.length).toBeGreaterThanOrEqual(6)
  })

  it('a full category gives one bonus star, only once', () => {
    const toys = albumEntries(emptySave(), 'spielzeug').map((e) =>
      e.kind === 'item' ? e.item.id : '',
    )
    const s = { ...emptySave(), owned: toys }
    expect(categoryComplete(s, 'spielzeug')).toBe(true)
    const first = claimAlbumStars(s, dev)
    expect(first.categories).toEqual(['spielzeug'])
    expect(starBalance(first.save)).toBe(1)
    expect(claimAlbumStars(first.save, dev).categories).toEqual([])
    expect(item('ball')).toBeDefined()
  })
})

describe('parent area helpers', () => {
  it('finds the slowest and the most missed facts', () => {
    const facts: Record<string, ReturnType<typeof recordAnswer>> = {}
    const [a, b, c] = allFacts('mul')
    facts[factId(a)] = recordAnswer(undefined, true, 5000)
    facts[factId(b)] = recordAnswer(recordAnswer(undefined, false, 900), false, 900)
    facts[factId(c)] = recordAnswer(undefined, true, 1500)
    expect(slowestFacts(facts, 'mul').map((r) => r.fact)).toEqual([a, c])
    expect(missedFacts(facts, 'mul')).toEqual([{ fact: b, value: 2 }])
    expect(slowestFacts(facts, 'div')).toEqual([])
  })

  it('sets her level for a topic; best level stays, no stars', () => {
    let s = setTopicLevel(emptySave(), 'kopfrechnen', 4)
    expect(s.mastery.kopfrechnen).toMatchObject({ level: 4, best: 4 })
    s = setTopicLevel(s, 'kopfrechnen', 2)
    expect(s.mastery.kopfrechnen).toMatchObject({ level: 2, best: 4 })
    expect(starBalance(s)).toBe(0)
  })
})
