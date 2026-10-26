import { describe, expect, it } from 'vitest'
import { DEFAULT_LOOK } from '../art/character/look'
import { FAMILY_TRAITS, SPECIES, STARTERS, traitOf } from '../data/creatures'
import {
  MAX_NAME_LENGTH,
  NAME_SUGGESTIONS,
  backspace,
  finishName,
  normalizeName,
  randomName,
  typeKey,
} from './names'
import {
  SAVE_KEY,
  SAVE_VERSION,
  activePet,
  addPet,
  coinBalance,
  earnCoins,
  emptySave,
  loadSave,
  mergeSaves,
  parseSave,
  writeSave,
} from './save'
import { reconcile } from './reconcile'

describe('names', () => {
  it('capitalises the first letter and lowercases the rest', () => {
    expect(normalizeName('lOTTI')).toBe('Lotti')
    expect(normalizeName('änne')).toBe('Änne')
  })

  it('keeps only letters, space and hyphen, max. 12 characters', () => {
    expect(normalizeName('Mia3!')).toBe('Mia')
    expect(normalizeName('Anna-lena maria')).toBe('Anna-lena ma')
    expect(normalizeName('x'.repeat(20))).toHaveLength(MAX_NAME_LENGTH)
  })

  it('handles typing, backspace and finishing', () => {
    let name = ''
    for (const key of ['m', 'i', '7', 'm', 'i', ' ']) name = typeKey(name, key)
    expect(name).toBe('Mimi ')
    expect(finishName(name)).toBe('Mimi')
    expect(backspace('Mimi')).toBe('Mim')
    expect(typeKey('', ' ')).toBe('')
    expect(typeKey('', '-')).toBe('')
  })

  it('suggests valid names that differ from the current one', () => {
    for (const n of NAME_SUGGESTIONS) expect(normalizeName(n)).toBe(n)
    expect(randomName(() => 0, NAME_SUGGESTIONS[0])).not.toBe(NAME_SUGGESTIONS[0])
  })
})

describe('creatures', () => {
  it('offers the three starters, cats and dogs without a trait', () => {
    expect(STARTERS).toEqual(['hund', 'katze', 'hamster'])
    expect(traitOf('hund')).toBeNull()
    expect(traitOf('katze')).toBeNull()
    expect(traitOf('hamster')).toEqual(FAMILY_TRAITS.kleintiere)
    for (const id of STARTERS) expect(SPECIES[id].id).toBe(id)
  })
})

describe('save', () => {
  const memory = () => {
    const items = new Map<string, string>()
    return {
      getItem: (k: string) => items.get(k) ?? null,
      setItem: (k: string, v: string) => void items.set(k, v),
    }
  }

  it('round-trips character, pets and coins', () => {
    const storage = memory()
    let data = emptySave()
    data = { ...data, character: { name: 'Leni', look: DEFAULT_LOOK } }
    data = addPet(data, 'hund', 'Bello')
    data = earnCoins(data, 45, 'pc')
    expect(writeSave(storage, data)).toBe(true)

    const loaded = loadSave(storage)
    expect(loaded.character?.name).toBe('Leni')
    expect(activePet(loaded)).toMatchObject({ species: 'hund', name: 'Bello' })
    expect(coinBalance(loaded)).toBe(45)
  })

  it('gives an empty save for missing, corrupt or foreign data', () => {
    const storage = memory()
    expect(loadSave(storage)).toEqual(emptySave())
    storage.setItem(SAVE_KEY, '{not json')
    expect(loadSave(storage)).toEqual(emptySave())
    storage.setItem(SAVE_KEY, JSON.stringify({ version: 99 }))
    expect(loadSave(storage)).toEqual(emptySave())
    expect(loadSave(undefined)).toEqual(emptySave())
    expect(parseSave('hello')).toBeNull()
  })

  it('drops unknown pets and survives a throwing storage', () => {
    const storage = memory()
    storage.setItem(
      SAVE_KEY,
      JSON.stringify({
        ...emptySave(),
        pets: [{ id: 'x', species: 'gespenst', name: 'X' }],
        activePetId: 'x',
      }),
    )
    expect(loadSave(storage).pets).toEqual([])
    expect(loadSave(storage).activePetId).toBeNull()

    const broken = {
      getItem: () => {
        throw new Error('denied')
      },
      setItem: () => {
        throw new Error('full')
      },
    }
    expect(loadSave(broken)).toEqual(emptySave())
    expect(writeSave(broken, emptySave())).toBe(false)
  })

  it('migrates version 1 saves (coins as one number)', () => {
    const v1 = {
      version: 1,
      character: { name: 'Leni', look: DEFAULT_LOOK },
      pets: [{ id: 'hund-1', species: 'hund', name: 'Bello' }],
      activePetId: 'hund-1',
      coins: 53,
      settings: { muted: true },
    }
    const save = parseSave(v1)!
    expect(save.version).toBe(SAVE_VERSION)
    expect(coinBalance(save)).toBe(53)
    expect(save.pets).toHaveLength(1)
    expect(save.settings.muted).toBe(true)
    expect(coinBalance(parseSave({ ...v1, coins: -5 })!)).toBe(0)
    expect(parseSave({ version: 1 })).toEqual(emptySave())
  })

  it('gives pets ids that differ across devices', () => {
    const a = addPet(emptySave(), 'hund', 'Bello')
    const b = addPet(emptySave(), 'hund', 'Bello')
    expect(a.pets[0].id).not.toBe(b.pets[0].id)
  })

  it('keeps the first pet active when more are added', () => {
    const data = addPet(addPet(emptySave(), 'hund', 'Bello'), 'katze', 'Mimi')
    expect(data.activePetId).toBe(data.pets[0].id)
    expect(data.pets.map((p) => p.species)).toEqual(['hund', 'katze'])
  })
})

describe('mergeSaves', () => {
  const base = earnCoins(
    addPet(
      { ...emptySave(), character: { name: 'Leni', look: DEFAULT_LOOK }, updatedAt: 100 },
      'hund',
      'Bello',
    ),
    100,
    'pc',
  )

  it('keeps coins earned on both devices and purchases made on either', () => {
    // PC earns 50 more; the iPhone earns 30 and spends 40 at the same time
    const pc = { ...earnCoins(base, 50, 'pc'), updatedAt: 200 }
    const phone = {
      ...earnCoins(base, 30, 'phone'),
      coins: { earned: { pc: 100, phone: 30 }, spent: { phone: 40 } },
      updatedAt: 300,
    }
    const merged = mergeSaves(pc, phone)
    expect(coinBalance(merged)).toBe(100 + 50 + 30 - 40)
    expect(mergeSaves(phone, pc)).toEqual(merged)
  })

  it('is safe to repeat (merging the same save again changes nothing)', () => {
    const other = { ...earnCoins(base, 7, 'phone'), updatedAt: 150 }
    const once = mergeSaves(base, other)
    expect(mergeSaves(once, other)).toEqual(once)
    expect(mergeSaves(once, once)).toEqual(once)
  })

  it('takes look and settings from the newer save and combines pets', () => {
    const older = { ...addPet(base, 'katze', 'Mimi'), updatedAt: 200 }
    const newer = {
      ...addPet(base, 'hamster', 'Krümel'),
      character: { name: 'Leni', look: { ...DEFAULT_LOOK, outfitColor: 'flieder' as const } },
      settings: { muted: true, knownMs: 3000, roundsPerDay: 2 },
      updatedAt: 300,
    }
    const merged = mergeSaves(older, newer)
    expect(merged.character?.look.outfitColor).toBe('flieder')
    expect(merged.settings.muted).toBe(true)
    expect(merged.pets.map((p) => p.name).sort()).toEqual(['Bello', 'Krümel', 'Mimi'])
    expect(merged.activePetId).toBe(base.activePetId)
    expect(merged.updatedAt).toBe(300)
  })

  it('keeps a character that exists on only one device', () => {
    const fresh = { ...emptySave(), updatedAt: 500 }
    expect(mergeSaves(base, fresh).character?.name).toBe('Leni')
  })
})

describe('reconcile', () => {
  const local = earnCoins({ ...emptySave(), updatedAt: 200 }, 10, 'pc')

  it('pushes when the cloud has no save yet', () => {
    expect(reconcile(local, null)).toEqual({ merged: local, push: true, replaceLocal: false })
  })

  it('does nothing when both are the same', () => {
    expect(reconcile(local, local)).toMatchObject({ push: false, replaceLocal: false })
  })

  it('pulls coins from the other device and pushes the merged save', () => {
    const remote = earnCoins({ ...emptySave(), updatedAt: 100 }, 20, 'phone')
    const r = reconcile(local, remote)
    expect(coinBalance(r.merged)).toBe(30)
    expect(r).toMatchObject({ push: true, replaceLocal: true })
  })
})
