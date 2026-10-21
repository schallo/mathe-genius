import { describe, expect, it } from 'vitest'
import { DEFAULT_LOOK } from '../art/character/look'
import { accessories } from '../art/character/accessory'
import { hairstyles } from '../art/character/hair'
import { outfits } from '../art/character/outfit'
import { ITEMS, SHOP_CATEGORIES, item } from '../data/items'
import { SPECIES } from '../data/creatures'
import { coinBalance, earnCoins, emptySave, mergeSaves, parseSave, type SaveData } from './save'
import {
  adopt,
  adoptablePets,
  buy,
  isOwned,
  isWearing,
  ownedItems,
  setWish,
  shopItems,
  tryOn,
  wishProgress,
} from './shop'

const withCoins = (coins: number): SaveData =>
  earnCoins({ ...emptySave(), character: { name: 'Leni', look: DEFAULT_LOOK } }, coins, 'pc')

const get = (id: string) => item(id)!

describe('item data', () => {
  it('has unique ids and only sprites that exist', () => {
    expect(new Set(ITEMS.map((i) => i.id)).size).toBe(ITEMS.length)
    for (const i of ITEMS) {
      if (i.wear?.outfit) expect(outfits).toHaveProperty(i.wear.outfit)
      if (i.wear?.hair) expect(hairstyles).toHaveProperty(i.wear.hair)
      if (i.wear?.accessory) expect(accessories).toHaveProperty(i.wear.accessory)
      if (i.species) expect(SPECIES).toHaveProperty(i.species)
      expect(i.price >= 0 && Number.isInteger(i.price)).toBe(true)
    }
  })

  it('has the first ~15 items: 3 dresses, 3 haircuts, 2 pets', () => {
    expect(shopItems('kleider')).toHaveLength(3)
    expect(shopItems('frisuren')).toHaveLength(3)
    expect(adoptablePets()).toHaveLength(2)
    const forSale = ITEMS.filter((i) => !i.starter)
    expect(forSale.length).toBeGreaterThanOrEqual(12)
    for (const c of SHOP_CATEGORIES) expect(shopItems(c).length).toBeGreaterThan(0)
  })

  it('starts with her starter look owned', () => {
    const save = emptySave()
    for (const value of [DEFAULT_LOOK.hair, DEFAULT_LOOK.outfit, DEFAULT_LOOK.accessory]) {
      expect(ITEMS.some((i) => i.starter && Object.values(i.wear ?? {}).includes(value))).toBe(true)
    }
    expect(ownedItems(save, 'frisuren').map((i) => i.id)).toEqual(['pferdeschwanz', 'bob'])
  })
})

describe('buying', () => {
  it('spends coins, owns and wears the item', () => {
    const result = buy(withCoins(200), get('fussball'), 'pc')
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(coinBalance(result.save)).toBe(20)
    expect(isOwned(result.save, get('fussball'))).toBe(true)
    expect(result.save.character?.look.outfit).toBe('fussball')
  })

  it('refuses when coins are missing – nothing changes', () => {
    const save = withCoins(100)
    expect(buy(save, get('ballkleid'), 'pc')).toEqual({ ok: false, reason: 'coins' })
  })

  it('does not sell the same item twice or starter items', () => {
    const first = buy(withCoins(500), get('hut'), 'pc')
    if (!first.ok) throw new Error('buy failed')
    expect(buy(first.save, get('hut'), 'pc')).toEqual({ ok: false, reason: 'owned' })
    expect(buy(withCoins(500), get('schleife'), 'pc')).toEqual({ ok: false, reason: 'owned' })
  })

  it('clears the wish when the wished item is bought', () => {
    const save = setWish(withCoins(300), get('ballkleid'))
    const result = buy(save, get('ballkleid'), 'pc')
    expect(result.ok && result.save.wish).toBeNull()
  })

  it('keeps purchases from two devices after merging', () => {
    const base = withCoins(300)
    const pc = buy({ ...base, updatedAt: 10 }, get('hut'), 'pc')
    const phone = buy({ ...base, updatedAt: 20 }, get('brille'), 'phone')
    if (!pc.ok || !phone.ok) throw new Error('buy failed')
    const merged = mergeSaves(pc.save, phone.save)
    expect(merged.owned.sort()).toEqual(['brille', 'hut'])
    expect(coinBalance(merged)).toBe(300 - 40 - 30)
  })
})

describe('adopting', () => {
  it('spends coins and adds the named pet', () => {
    const result = adopt(withCoins(450), get('katze'), 'Mimi', 'pc')
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(coinBalance(result.save)).toBe(50)
    expect(result.save.pets).toMatchObject([{ species: 'katze', name: 'Mimi' }])
  })

  it('needs enough coins and is only for pets', () => {
    expect(adopt(withCoins(100), get('katze'), 'Mimi', 'pc')).toEqual({
      ok: false,
      reason: 'coins',
    })
    expect(adopt(withCoins(999), get('hut'), 'X', 'pc')).toEqual({ ok: false, reason: 'pet' })
    expect(buy(withCoins(999), get('katze'), 'pc')).toEqual({ ok: false, reason: 'pet' })
  })
})

describe('wish and try-on', () => {
  it('shows how many coins are missing', () => {
    const save = setWish(withCoins(315), get('katze'))
    expect(wishProgress(save)).toMatchObject({ missing: 85, ratio: 315 / 400 })
    expect(wishProgress(setWish(withCoins(500), get('katze')))?.missing).toBe(0)
    expect(wishProgress(emptySave())).toBeNull()
  })

  it('tries items on without changing anything else', () => {
    const look = tryOn(DEFAULT_LOOK, get('krone'))
    expect(look).toEqual({ ...DEFAULT_LOOK, accessory: 'krone' })
    expect(isWearing(look, get('krone'))).toBe(true)
    expect(tryOn(DEFAULT_LOOK, get('ball'))).toBe(DEFAULT_LOOK)
    const kit = tryOn(DEFAULT_LOOK, get('fussball'))
    expect(kit.outfitColor).toBe('himmel')
    expect(isWearing({ ...kit, outfitColor: 'rosa' }, get('fussball'))).toBe(true)
  })

  it('reads saves from before owned items and wishes existed', () => {
    const old = { ...emptySave() } as Partial<SaveData>
    delete old.owned
    delete old.wish
    expect(parseSave(old)).toEqual(emptySave())
  })
})
