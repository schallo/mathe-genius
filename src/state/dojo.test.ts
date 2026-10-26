import { describe, expect, it } from 'vitest'
import { item } from '../data/items'
import { allFacts, factId, type DojoOp } from '../math/einmaleins'
import { finishBlitz, finishDuel, finishRowMaster, gridReward, recordFact } from './dojo'
import { DOJO_REWARD, practiceCoins } from './economy'
import { coinBalance, emptySave, mergeSaves, parseSave, starBalance, type SaveData } from './save'
import { shopItems } from './shop'

const dev = 'pc'

function allKnown(save: SaveData, op: DojoOp): SaveData {
  let s = save
  for (const f of allFacts(op)) for (let i = 0; i < 3; i++) s = recordFact(s, f, true, 1000)
  return s
}

describe('dojo rewards', () => {
  it('pays 2 coins in Üben, 1 when a missed fact comes back', () => {
    expect(practiceCoins(true)).toBe(2)
    expect(practiceCoins(false)).toBe(1)
  })

  it('records fact answers with the parent threshold', () => {
    let s: SaveData = { ...emptySave(), settings: { muted: false, knownMs: 1500, roundsPerDay: 2 } }
    const fact = { op: 'mul' as const, k: 7, row: 8 }
    for (let i = 0; i < 3; i++) s = recordFact(s, fact, true, 2000)
    expect(s.dojo.facts['mul-7-8'].known).toBe(false)
    for (let i = 0; i < 3; i++) s = recordFact(s, fact, true, 1000)
    expect(s.dojo.facts['mul-7-8'].known).toBe(true)
  })

  it('Blitzrunde: bonus only for a new personal best, never takes anything', () => {
    const first = finishBlitz(emptySave(), 'mul', 12, dev)
    expect(first).toMatchObject({ record: true, previous: 0, bonus: DOJO_REWARD.record })
    expect(coinBalance(first.save)).toBe(DOJO_REWARD.record)
    expect(first.save.dojo.records.mul.blitz).toBe(12)
    expect(first.save.dojo.records.div.blitz).toBe(0)

    const worse = finishBlitz(first.save, 'mul', 8, dev)
    expect(worse).toMatchObject({ record: false, previous: 12, bonus: 0 })
    expect(worse.save).toBe(first.save)
    expect(finishBlitz(emptySave(), 'div', 0, dev).record).toBe(false)
  })

  it('Turbo-Duell: first run sets the ghost, beating it gives a star', () => {
    const first = finishDuel(emptySave(), 'div', 48_300, dev)
    expect(first).toMatchObject({ record: true, beatGhost: false, stars: 0, ghostMs: null })
    expect(first.save.dojo.records.div.duelMs).toBe(48_300)

    const slower = finishDuel(first.save, 'div', 50_000, dev)
    expect(slower).toMatchObject({ record: false, beatGhost: false, bonus: 0, ghostMs: 48_300 })

    const faster = finishDuel(first.save, 'div', 41_000, dev)
    expect(faster).toMatchObject({ record: true, beatGhost: true, stars: 1 })
    expect(starBalance(faster.save)).toBe(1)
    expect(faster.save.dojo.records.div.duelMs).toBe(41_000)
    expect(coinBalance(faster.save)).toBe(2 * DOJO_REWARD.record)
  })

  it('Reihen-Meister: a medal for a row without mistakes in under 30 s, once', () => {
    expect(finishRowMaster(emptySave(), 'mul', 7, 1, 20_000, dev)).toMatchObject({
      passed: false,
      newBadge: false,
    })
    expect(finishRowMaster(emptySave(), 'mul', 7, 0, 31_000, dev).passed).toBe(false)
    const won = finishRowMaster(emptySave(), 'mul', 7, 0, 25_000, dev)
    expect(won).toMatchObject({ passed: true, newBadge: true, bonus: DOJO_REWARD.badge })
    expect(won.save.dojo.records.mul.badges).toEqual([7])
    expect(won.save.dojo.records.div.badges).toEqual([])
    const again = finishRowMaster(won.save, 'mul', 7, 0, 20_000, dev)
    expect(again).toMatchObject({ passed: true, newBadge: false, bonus: 0 })
  })

  it('a fully gold grid gives its reward item once; rewards are never sold', () => {
    const almost = allKnown(emptySave(), 'mul')
    const facts = { ...almost.dojo.facts }
    delete facts[factId({ op: 'mul', k: 3, row: 3 })]
    const missing = { ...almost, dojo: { ...almost.dojo, facts } }
    expect(gridReward(missing, 'mul').item).toBeUndefined()

    const reward = gridReward(almost, 'mul')
    expect(reward.item?.id).toBe('einmaleins-krone')
    expect(reward.save.owned).toContain('einmaleins-krone')
    expect(gridReward(reward.save, 'mul').item).toBeUndefined()
    expect(gridReward(almost, 'div').item).toBeUndefined()
    expect(item('geteilt-diadem')?.reward).toBe('div')
    expect(shopItems('accessoires').some((i) => i.reward)).toBe(false)
  })
})

describe('dojo save data', () => {
  it('migrates a v3 save and keeps old progress', () => {
    const v3 = {
      version: 3,
      updatedAt: 5,
      character: null,
      pets: [],
      activePetId: null,
      coins: { earned: { pc: 40 }, spent: {} },
      owned: [],
      wish: null,
      battle: { wins: {}, befriended: [], naps: {}, times: {} },
      settings: { muted: true },
    }
    const s = parseSave(v3)!
    expect(s.version).toBe(4)
    expect(coinBalance(s)).toBe(40)
    expect(s.dojo.records.mul).toEqual({ blitz: 0, duelMs: null, badges: [] })
    expect(s.settings).toEqual({ muted: true, knownMs: 3000, roundsPerDay: 2 })
    expect(starBalance(s)).toBe(0)
  })

  it('round-trips facts and records and drops broken entries', () => {
    let s = recordFact(emptySave(), { op: 'div', k: 4, row: 6 }, true, 1800)
    s = finishRowMaster(s, 'div', 6, 0, 20_000, dev).save
    const raw = JSON.parse(JSON.stringify(s))
    raw.dojo.facts['mul-99-1'] = raw.dojo.facts['div-4-6']
    raw.dojo.records.div.badges.push(11, 'x')
    const back = parseSave(raw)!
    expect(back.dojo.facts['div-4-6']).toEqual(s.dojo.facts['div-4-6'])
    expect(back.dojo.facts['mul-99-1']).toBeUndefined()
    expect(back.dojo.records.div.badges).toEqual([6])
  })

  it('merges two devices: best records, all medals, stars never go down', () => {
    let pc = finishBlitz(emptySave(), 'mul', 20, 'pc').save
    pc = finishRowMaster(pc, 'mul', 2, 0, 9000, 'pc').save
    pc = finishDuel(pc, 'mul', 50_000, 'pc').save
    pc = { ...pc, updatedAt: 100 }
    let phone = finishBlitz(emptySave(), 'mul', 15, 'phone').save
    phone = finishRowMaster(phone, 'mul', 5, 0, 9000, 'phone').save
    phone = finishDuel(phone, 'mul', 60_000, 'phone').save
    phone = finishDuel(phone, 'mul', 45_000, 'phone').save
    phone = { ...phone, updatedAt: 200 }
    const merged = mergeSaves(pc, phone)
    expect(merged.dojo.records.mul).toEqual({ blitz: 20, duelMs: 45_000, badges: [2, 5] })
    expect(starBalance(merged)).toBe(1)
  })
})

describe('learning hut picks', () => {
  it('keeps valid picks per hut, drops broken ones, the newer device wins', () => {
    const raw = {
      ...JSON.parse(JSON.stringify(emptySave())),
      learn: {
        werkstatt: { topic: 'schriftlichDivision', level: 3 },
        zahlenturm: { topic: 'nope', level: 2 },
        marktstand: { topic: 'geld', level: 9 },
      },
    }
    const s = parseSave(raw)!
    expect(s.learn).toEqual({ werkstatt: { topic: 'schriftlichDivision', level: 3 } })
    const older = { ...s, updatedAt: 1 }
    const newer = {
      ...s,
      updatedAt: 2,
      learn: { werkstatt: { topic: 'halbschriftlich' as const, level: 1 as const } },
    }
    expect(mergeSaves(older, newer).learn.werkstatt.topic).toBe('halbschriftlich')
  })
})
