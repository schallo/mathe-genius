import { describe, expect, it } from 'vitest'
import { DEFAULT_LOOK } from '../art/character/look'
import { KNOWN_LOOKS, curtainLook, decorKey, PLAIN_CURTAIN } from '../art/stageDecor'
import { ITEMS, SHOP_CATEGORIES, item } from '../data/items'
import { palette } from '../palette'
import { earnCoins, emptySave, mergeSaves, parseSave, type SaveData } from './save'
import { buy, shopItems } from './shop'
import { isUp, parseStage, stageDecor, toggleDecor, tryDecor } from './stage'
import { markWelcomed, welcomeFor } from './welcome'

const decorItems = ITEMS.filter((i) => i.decor)

function start(coins = 1000): SaveData {
  return earnCoins(
    {
      ...emptySave(),
      character: { name: 'Leni', look: DEFAULT_LOOK },
      pets: [{ id: 'p1', species: 'hund', name: 'Bello', xp: 0 }],
      activePetId: 'p1',
    },
    coins,
    'test',
  )
}

describe('stage decor (Bühne)', () => {
  it('is sold in its own Laden tab, every item with a drawing', () => {
    expect(SHOP_CATEGORIES).toContain('buehne')
    expect(shopItems('buehne').length).toBeGreaterThanOrEqual(10)
    for (const i of decorItems) {
      expect(i.category).toBe('buehne')
      expect(KNOWN_LOOKS[i.decor!.slot], i.id).toContain(i.decor!.look)
      expect(i.price, i.id).toBeGreaterThanOrEqual(50)
      expect(i.price, i.id).toBeLessThanOrEqual(300)
    }
  })

  it('buying puts it up right away, one item per slot', () => {
    let s = buy(start(), item('vorhang-rosa')!, 'test')
    if (!s.ok) throw new Error('not bought')
    expect(stageDecor(s.save)).toEqual({ vorhang: 'vorhang-rosa' })
    const next = buy(s.save, item('vorhang-mint')!, 'test')
    if (!next.ok) throw new Error('not bought')
    s = next
    expect(stageDecor(s.save)).toEqual({ vorhang: 'vorhang-mint' })
    expect(isUp(s.save, item('vorhang-rosa')!)).toBe(false)
  })

  it('taking it down brings back the plain stage; putting it up again works', () => {
    const r = buy(start(), item('laternen')!, 'test')
    if (!r.ok) throw new Error('not bought')
    const down = toggleDecor(r.save, item('laternen')!)
    expect(stageDecor(down)).toEqual({})
    expect(stageDecor(toggleDecor(down, item('laternen')!))).toEqual({ deko: 'laternen' })
  })

  it('never puts up what she does not own', () => {
    const s = start()
    expect(toggleDecor(s, item('publikum')!)).toBe(s)
    expect(stageDecor({ ...s, stage: { publikum: 'publikum' } })).toEqual({})
  })

  it('tries decor on without buying it', () => {
    expect(tryDecor({ vorhang: 'vorhang-gold' }, item('licht-rosa')!)).toEqual({
      vorhang: 'vorhang-gold',
      licht: 'licht-rosa',
    })
    expect(tryDecor({}, item('ball')!)).toEqual({})
  })

  it('keeps only real decor in its own slot when loading a save', () => {
    expect(
      parseStage({ vorhang: 'vorhang-mint', licht: 'vorhang-gold', deko: 'ball', publikum: 7 }),
    ).toEqual({ vorhang: 'vorhang-mint' })
    expect(parseStage(null)).toEqual({})
    const saved = parseSave(JSON.parse(JSON.stringify({ ...start(), stage: { deko: 'pflanzen' } })))
    expect(saved?.stage).toEqual({ deko: 'pflanzen' })
  })

  it('the newer save decides what is up', () => {
    const a = { ...start(), owned: ['pflanzen'], stage: { deko: 'pflanzen' }, updatedAt: 1 }
    const b = { ...start(), owned: ['laternen'], stage: { deko: 'laternen' }, updatedAt: 2 }
    expect(mergeSaves(a, b).stage).toEqual({ deko: 'laternen' })
    expect(mergeSaves(b, a).stage).toEqual({ deko: 'laternen' })
  })

  it('colours the curtains and beams; the light item wins over the curtain beam', () => {
    expect(curtainLook({})).toEqual(PLAIN_CURTAIN)
    expect(curtainLook({ vorhang: 'vorhang-rosa' }).mid).toBe(palette.rose)
    expect(curtainLook({ vorhang: 'vorhang-rosa', licht: 'licht-gold' }).beam).toBe(palette.gold)
    expect(curtainLook({ licht: 'licht-lila' })).toEqual({ ...PLAIN_CURTAIN, beam: palette.lilac })
  })

  it('bakes each combination once, whatever the order', () => {
    expect(decorKey({ vorhang: 'vorhang-mint', deko: 'laternen' })).toBe(
      decorKey({ deko: 'laternen', vorhang: 'vorhang-mint' }),
    )
    expect(decorKey({})).toBe('')
  })
})

describe('daily welcome from her pet', () => {
  const day = new Date(2026, 9, 30, 9, 0)

  it('greets her once a day by name', () => {
    const s = start()
    const line = welcomeFor(s, day)
    expect(line).toContain('Bello')
    const welcomed = markWelcomed(s, day)
    expect(welcomeFor(welcomed, new Date(2026, 9, 30, 18, 0))).toBeNull()
    expect(welcomeFor(welcomed, new Date(2026, 9, 31, 8, 0))).not.toBeNull()
  })

  it('says the same thing all day and changes from day to day', () => {
    const s = start()
    expect(welcomeFor(s, new Date(2026, 9, 30, 7))).toBe(welcomeFor(s, new Date(2026, 9, 30, 22)))
    const week = new Set([0, 1, 2, 3, 4].map((d) => welcomeFor(s, new Date(2026, 10, 1 + d, 12))))
    expect(week.size).toBe(5)
  })

  it('needs a pet; a merged save is not welcomed twice', () => {
    expect(welcomeFor({ ...start(), activePetId: null }, day)).toBeNull()
    const a = { ...markWelcomed(start(), day), updatedAt: 1 }
    const b = { ...start(), updatedAt: 2 }
    expect(mergeSaves(a, b).welcomed).toBe('2026-10-30')
    expect(parseSave(JSON.parse(JSON.stringify(a)))?.welcomed).toBe('2026-10-30')
  })
})
