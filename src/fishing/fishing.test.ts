import { describe, expect, it } from 'vitest'
import { seededRng } from '../math/random'
import { addPet, emptySave, mergeSaves, parseSave, starBalance } from '../state/save'
import {
  FISHING_STARS_PER_DAY,
  GOLDI_BY_CATCH,
  fishingStarsToday,
  goldiChance,
  goldiInPond,
  recordCatch,
} from '../state/fishing'
import {
  FISHING,
  meter,
  press,
  release,
  startFishing,
  step,
  type FishingState,
  type Rng,
} from './fishing'

const DT = 50

/** Casts, waits for the bite and hooks the fish. */
function hook(rng: Rng, chargeMs = 600): FishingState {
  let s = press(startFishing(), rng)
  for (let t = 0; t < chargeMs; t += DT) s = step(s, DT, true, rng)
  s = release(s, rng)
  while (s.phase === 'waiting') s = step(s, DT, false, rng)
  expect(s.phase).toBe('bite')
  return press(s, rng)
}

/** Plays one fish to the end with a strategy; true = caught. */
function reel(rng: Rng, hold: (s: FishingState) => boolean): boolean {
  let s = hook(rng)
  for (let t = 0; t < 120_000 && s.phase === 'reeling'; t += DT) s = step(s, DT, hold(s), rng)
  expect(['caught', 'lost']).toContain(s.phase)
  return s.phase === 'caught'
}

function catchRate(hold: (s: FishingState) => boolean, seed = 1): number {
  const rng = seededRng(seed)
  let caught = 0
  for (let i = 0; i < 300; i++) if (reel(rng, hold)) caught++
  return caught / 300
}

describe('fishing', () => {
  it('casts with a ping-pong meter; a far throw makes the fish bite sooner', () => {
    expect([0, 600, 1200, 1800, 2400].map(meter)).toEqual([0, 0.5, 1, 0.5, 0])
    const rng = seededRng(3)
    let s = press(startFishing(), rng)
    expect(s.phase).toBe('charging')
    for (let t = 0; t < 1200; t += DT) s = step(s, DT, true, rng)
    expect(s.charge).toBeCloseTo(1)
    const far = release(s, () => 0.5)
    const near = release({ ...s, charge: 0.2 }, () => 0.5)
    expect(far.phase).toBe('waiting')
    expect(far.timer).toBeLessThan(near.timer)
  })

  it('a missed bite costs nothing: the fish swims on and another one bites later', () => {
    const rng = seededRng(4)
    let s = press(startFishing(), rng)
    s = release(step(s, 500, true, rng), rng)
    while (s.phase === 'waiting') s = step(s, DT, false, rng)
    for (let t = 0; t <= FISHING.hookMs; t += DT) s = step(s, DT, false, rng)
    expect(s.phase).toBe('waiting')
    while (s.phase === 'waiting') s = step(s, DT, false, rng)
    expect(s.phase).toBe('bite')
  })

  it('reeling uses more power the stronger the fish pulls; resting recovers it', () => {
    const base: FishingState = { ...startFishing(), phase: 'reeling', pullTimer: 99_999 }
    const used = (pull: FishingState['pull']) =>
      FISHING.maxPower - step({ ...base, pull }, 1000, true, Math.random).power
    expect(used('weak')).toBeLessThan(used('mid'))
    expect(used('mid')).toBeLessThan(used('strong'))
    const tired = { ...base, power: 40, line: 50 }
    const rested = step(tired, 1000, false, Math.random)
    expect(rested.power).toBe(40 + FISHING.recover)
    expect(rested.line).toBeGreaterThan(50)
    expect(step({ ...base, power: 1 }, 1000, true, Math.random).phase).toBe('lost')
    expect(step({ ...base, line: 1 }, 1000, true, Math.random).phase).toBe('caught')
  })

  it('is a challenge: holding all the time mostly fails, resting in strong pulls works', () => {
    const always = catchRate(() => true)
    const careful = catchRate((s) => s.pull !== 'strong' && s.power > 15)
    expect(always).toBeLessThan(0.35)
    expect(careful).toBeGreaterThan(0.95)
  })

  it('after a catch or a lost fish she simply casts again', () => {
    const lost: FishingState = { ...startFishing(), phase: 'lost', power: 0 }
    expect(press(lost, Math.random)).toEqual(startFishing())
  })
})

describe('fishing rewards', () => {
  const day = (d: number, h = 15) => new Date(2026, 9, d, h)

  const lucky = () => 0
  const unlucky = () => 0.999

  it('Goldi bites by chance, more likely with every fish, at the 50th catch for sure', () => {
    expect([1, 10, 25, 50, 60].map(goldiChance)).toEqual([0.02, 0.2, 0.5, 1, 1])
    let s = emptySave()
    for (let i = 1; i < GOLDI_BY_CATCH; i++) {
      const r = recordCatch(s, day(1 + (i % 28)), 'pc', unlucky)
      expect(r.reward).not.toBe('goldi')
      s = r.save
    }
    expect(goldiInPond(s)).toBe(true)
    const last = recordCatch(s, day(1), 'pc', unlucky)
    expect(last.reward).toBe('goldi')
    expect(goldiInPond(last.save)).toBe(false)
    // Without luck she still collects stars while Goldi swims around
    expect(starBalance(s)).toBeGreaterThan(0)
  })

  it('Goldi joins as a pet, then one star per catch, three a day', () => {
    let s = addPet(emptySave(), 'hund', 'Bello')
    const first = recordCatch(s, day(28), 'pc', lucky)
    expect(first.reward).toBe('goldi')
    expect(first.save.pets.map((p) => [p.species, p.name])).toContainEqual(['goldi', 'Goldi'])
    expect(first.save.activePetId).toBe(s.activePetId)
    s = first.save
    const rewards = []
    for (let i = 0; i < 5; i++) {
      const r = recordCatch(s, day(28), 'pc')
      rewards.push(r.reward)
      s = r.save
    }
    expect(rewards).toEqual(['star', 'star', 'star', 'none', 'none'])
    expect(starBalance(s)).toBe(FISHING_STARS_PER_DAY)
    expect(fishingStarsToday(s, day(28, 20))).toBe(3)
    expect(s.fishing.catches).toBe(6)
    // A new day, new stars
    expect(recordCatch(s, day(29), 'pc').reward).toBe('star')
  })

  it('is saved, cleaned on load and merged between devices', () => {
    const goldi = recordCatch(emptySave(), day(28), 'pc', () => 0).save
    const pc = { ...recordCatch(goldi, day(28), 'pc').save, updatedAt: 1 }
    const phone = {
      ...recordCatch(recordCatch(goldi, day(28), 'phone').save, day(28), 'phone').save,
      updatedAt: 2,
    }
    const merged = mergeSaves(pc, phone)
    expect(merged.fishing).toEqual({ catches: 3, days: { '2026-10-28': 2 } })
    expect(merged.pets.filter((p) => p.species === 'goldi')).toHaveLength(1)
    const raw = JSON.parse(JSON.stringify(merged))
    raw.fishing.days.nope = 2
    raw.fishing.days['2026-10-29'] = 9
    expect(parseSave(raw)!.fishing.days).toEqual({ '2026-10-28': 2, '2026-10-29': 3 })
    delete raw.fishing
    expect(parseSave(raw)!.fishing).toEqual({ catches: 0, days: {} })
  })
})
