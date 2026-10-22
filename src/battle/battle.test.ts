import { describe, expect, it } from 'vitest'
import { FAMILY_TRAITS, SPECIES, wildSpecies } from '../data/creatures'
import { generateTask } from '../math/topics'
import { seededRng } from '../math/random'
import { DEFAULT_LOOK } from '../art/character/look'
import { addPet, emptySave, mergeSaves, parseSave, type SaveData } from '../state/save'
import { coinBalance } from '../state/save'
import {
  TIMER,
  answerCorrect,
  answerWrong,
  hitDamage,
  levelFromXp,
  median,
  recordTime,
  startBattle,
  timeLimitMs,
  traitLabel,
  traitPower,
  useTip,
  winXp,
  xpForLevel,
} from './battle'
import {
  BEFRIEND_WINS,
  NAP_MS,
  addAnswerTime,
  ensureAwakeActive,
  finishBattle,
  isNapping,
  petLevel,
  wakeAll,
} from './progress'

const igel = SPECIES.igel.wild!
const fuchs = SPECIES.fuchs.wild!

describe('wild creatures', () => {
  it('Blumenwiese has Igel, Eichhörnchen and Fuchs with sane stats', () => {
    expect(wildSpecies('blumenwiese').map((s) => s.id)).toEqual(['igel', 'eichhoernchen', 'fuchs'])
    for (const s of wildSpecies('blumenwiese')) {
      const w = s.wild!
      expect(w.coins).toBeGreaterThanOrEqual(10)
      expect(w.coins).toBeLessThanOrEqual(30)
      expect(['einmaleins', 'kopfrechnen']).toContain(w.topic)
    }
  })

  it('battle tasks are plain number answers (auto-confirm by digit count)', () => {
    const rng = seededRng(3)
    for (const s of wildSpecies('blumenwiese')) {
      for (let i = 0; i < 500; i++) {
        const task = generateTask(s.wild!.topic, s.wild!.taskLevel, rng)
        expect(task.format).toEqual({ kind: 'numpad', remainder: false })
        expect(task.answer.remainder).toBeUndefined()
        expect(task.question).toContain('?')
      }
    }
  })
})

describe('pet levels', () => {
  it('levels up with XP', () => {
    expect(levelFromXp(0)).toBe(1)
    expect(levelFromXp(xpForLevel(2) - 1)).toBe(1)
    expect(levelFromXp(xpForLevel(2))).toBe(2)
    expect(levelFromXp(xpForLevel(5))).toBe(5)
    expect(levelFromXp(10 ** 9)).toBe(30)
  })
})

describe('adaptive timer', () => {
  it('starts at 10 s until there are enough answer times', () => {
    expect(timeLimitMs([])).toBe(10_000)
    expect(timeLimitMs([2000, 2000])).toBe(10_000)
  })

  it('is 1.5 × her median, between 3 s and 12 s', () => {
    expect(timeLimitMs([4000, 6000, 5000])).toBe(7500)
    expect(timeLimitMs([500, 600, 700])).toBe(TIMER.minMs)
    expect(timeLimitMs([20_000, 20_000, 20_000])).toBe(TIMER.maxMs)
  })

  it('stronger creatures shorten it, trait bonuses come on top', () => {
    expect(timeLimitMs([], fuchs.timeFactor)).toBe(9000)
    expect(timeLimitMs([500, 500, 500], 0.9, 2000)).toBe(5000)
  })

  it('keeps the last 10 times', () => {
    let times: number[] = []
    for (let i = 1; i <= 15; i++) times = recordTime(times, i * 1000)
    expect(times).toHaveLength(10)
    expect(times[0]).toBe(6000)
    expect(median([1, 3, 2])).toBe(2)
    expect(median([1, 2, 3, 4])).toBe(2.5)
  })
})

describe('damage', () => {
  it('fast answers hit harder, very fast ones are a Volltreffer', () => {
    const fast = hitDamage(5, 1000, 10_000)
    const mid = hitDamage(5, 5000, 10_000)
    const slow = hitDamage(5, 9900, 10_000)
    expect(fast).toEqual({ damage: 8, full: true })
    expect(mid.full).toBe(false)
    expect(mid.damage).toBeGreaterThanOrEqual(slow.damage)
    expect(slow.damage).toBeGreaterThanOrEqual(1)
  })

  it('Urzeitkraft doubles Volltreffer damage only', () => {
    expect(hitDamage(5, 1000, 10_000, 2).damage).toBe(16)
    expect(hitDamage(5, 9000, 10_000, 2).damage).toBe(hitDamage(5, 9000, 10_000).damage)
  })
})

describe('battle flow', () => {
  it('takes about 6–10 tasks against the Igel for a new pet', () => {
    let state = startBattle('hund', 1, igel)
    let tasks = 0
    // Mixed answers: fast, medium, slow, one wrong
    const pattern = ['fast', 'mid', 'wrong', 'slow', 'mid', 'fast', 'mid', 'slow', 'mid', 'mid']
    while (!state.outcome && tasks < 20) {
      const kind = pattern[tasks % pattern.length]
      state =
        kind === 'wrong'
          ? answerWrong(state, false).state
          : answerCorrect(state, { fast: 2000, mid: 5000, slow: 9000 }[kind]!, 10_000).state
      tasks++
    }
    expect(state.outcome).toBe('win')
    expect(tasks).toBeGreaterThanOrEqual(5)
    expect(tasks).toBeLessThanOrEqual(10)
  })

  it('a new pet survives a few mistakes before it gets tired', () => {
    let state = startBattle('katze', 1, fuchs)
    let wrong = 0
    while (!state.outcome) {
      state = answerWrong(state, true).state
      wrong++
    }
    expect(state.outcome).toBe('lose')
    expect(wrong).toBeGreaterThanOrEqual(4)
    expect(state.pet.hp).toBe(0)
  })

  it('counts XP for every correct answer', () => {
    let state = startBattle('hund', 1, igel)
    state = answerCorrect(state, 1000, 10_000).state
    state = answerCorrect(state, 8000, 10_000).state
    expect(state.xp).toBe(4 + 3)
    expect(state.correct).toBe(2)
  })
})

describe('traits', () => {
  it('cats and dogs have none', () => {
    const state = startBattle('hund', 9, igel)
    expect(state).toMatchObject({ tipsLeft: 0, jokersLeft: 0, extraMs: 0, fullHitFactor: 1 })
    expect(traitLabel(FAMILY_TRAITS.katzenHunde, 9)).toBeNull()
  })

  it('Kleintiere get more time, growing at level 5', () => {
    expect(startBattle('hamster', 1, igel).extraMs).toBe(2000)
    expect(startBattle('hamster', 5, igel).extraMs).toBe(3000)
    expect(traitLabel(FAMILY_TRAITS.kleintiere, 1)).toBe('+2 Sekunden')
    expect(traitLabel(FAMILY_TRAITS.kleintiere, 5)).toBe('+3 Sekunden')
  })

  it('Wildtiere get one tip per battle, two from level 5', () => {
    const state = startBattle('igel', 1, igel)
    const used = useTip(state)!
    expect(used.tipsLeft).toBe(0)
    expect(useTip(used)).toBeNull()
    expect(startBattle('fuchs', 5, igel).tipsLeft).toBe(2)
  })

  it('Fabeltiere turn a wrong answer (not a timeout) into a second try', () => {
    const power = traitPower(FAMILY_TRAITS.fabeltiere, 1)
    const state = { ...startBattle('hund', 1, igel), jokersLeft: power.jokers }
    const joker = answerWrong(state, false)
    expect(joker).toMatchObject({ joker: true, damage: 0 })
    expect(joker.state.pet.hp).toBe(state.pet.hp)
    expect(answerWrong(joker.state, false).joker).toBe(false)
    expect(answerWrong(state, true).joker).toBe(false)
  })
})

describe('battle progress in the save', () => {
  const NOW = 1_000_000
  const withPet = (): SaveData =>
    addPet({ ...emptySave(), character: { name: 'Leni', look: DEFAULT_LOOK } }, 'hund', 'Bello')

  it('a win pays coins and XP and counts the win', () => {
    const save = withPet()
    const petId = save.pets[0].id
    const r = finishBattle(save, { petId, foe: 'igel', won: true, answerXp: 15 }, 'pc', NOW)
    expect(r.coins).toBe(igel.coins)
    expect(coinBalance(r.save)).toBe(igel.coins)
    expect(r.xp).toBe(15 + winXp(igel.level))
    expect(r.save.pets[0].xp).toBe(r.xp)
    expect(r.levelAfter).toBe(petLevel(r.save.pets[0]))
    expect(r.save.battle.wins.igel).toBe(1)
    expect(isNapping(r.save, petId, NOW)).toBe(false)
  })

  it('a defeat keeps XP and coins and sends the pet for a 2-minute nap', () => {
    const save = withPet()
    const petId = save.pets[0].id
    const r = finishBattle(save, { petId, foe: 'fuchs', won: false, answerXp: 6 }, 'pc', NOW)
    expect(r.coins).toBe(0)
    expect(r.save.pets[0].xp).toBe(6)
    expect(isNapping(r.save, petId, NOW + NAP_MS - 1)).toBe(true)
    expect(isNapping(r.save, petId, NOW + NAP_MS)).toBe(false)
    expect(isNapping(wakeAll(r.save), petId, NOW)).toBe(false)
  })

  it('the third win befriends the species exactly once – deterministic', () => {
    let save = withPet()
    const petId = save.pets[0].id
    const outcome = { petId, foe: 'eichhoernchen' as const, won: true, answerXp: 0 }
    for (let i = 1; i < BEFRIEND_WINS; i++) {
      const r = finishBattle(save, outcome, 'pc', NOW)
      expect(r.newPet).toBeUndefined()
      save = r.save
    }
    const third = finishBattle(save, outcome, 'pc', NOW)
    expect(third.newPet).toMatchObject({ species: 'eichhoernchen', name: 'Eichhörnchen', xp: 0 })
    expect(third.save.pets).toHaveLength(2)
    expect(third.save.activePetId).toBe(petId)
    expect(finishBattle(third.save, outcome, 'pc', NOW).newPet).toBeUndefined()
  })

  it('another awake pet comes along when the active one naps', () => {
    let save = addPet(withPet(), 'katze', 'Mimi')
    const [bello, mimi] = save.pets
    save = finishBattle(
      save,
      { petId: bello.id, foe: 'igel', won: false, answerXp: 0 },
      'pc',
      NOW,
    ).save
    const r = ensureAwakeActive(save, NOW)
    expect(r.switchedTo?.id).toBe(mimi.id)
    expect(r.save.activePetId).toBe(mimi.id)
    expect(ensureAwakeActive(r.save, NOW).switchedTo).toBeUndefined()
  })

  it('remembers answer times per topic and level', () => {
    const save = addAnswerTime(
      addAnswerTime(withPet(), 'einmaleins-2', 3200.4),
      'einmaleins-2',
      2800,
    )
    expect(save.battle.times['einmaleins-2']).toEqual([3200, 2800])
  })
})

describe('save v3', () => {
  it('migrates v2 saves: pets get 0 XP, empty battle progress', () => {
    const v2 = {
      version: 2,
      updatedAt: 5,
      character: { name: 'Leni', look: DEFAULT_LOOK },
      pets: [{ id: 'hund-1', species: 'hund', name: 'Bello' }],
      activePetId: 'hund-1',
      coins: { earned: { pc: 40 }, spent: {} },
      owned: [],
      wish: null,
      settings: { muted: false },
    }
    const save = parseSave(v2)!
    expect(save.version).toBe(3)
    expect(save.pets[0].xp).toBe(0)
    expect(save.battle).toEqual({ wins: {}, befriended: [], naps: {}, times: {} })
  })

  it('merging keeps the higher XP, wins and every befriended animal', () => {
    const base = addPet(emptySave(), 'hund', 'Bello')
    const id = base.pets[0].id
    const pc: SaveData = {
      ...base,
      updatedAt: 10,
      pets: [{ ...base.pets[0], xp: 50 }],
      battle: { wins: { igel: 3 }, befriended: ['igel'], naps: {}, times: {} },
    }
    const phone: SaveData = {
      ...base,
      updatedAt: 20,
      pets: [{ ...base.pets[0], xp: 30 }],
      battle: { wins: { igel: 1, fuchs: 2 }, befriended: [], naps: { [id]: 99 }, times: {} },
    }
    const merged = mergeSaves(pc, phone)
    expect(merged.pets[0].xp).toBe(50)
    expect(merged.battle.wins).toEqual({ igel: 3, fuchs: 2 })
    expect(merged.battle.befriended).toEqual(['igel'])
    expect(merged.battle.naps).toEqual({ [id]: 99 })
  })
})
