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
import { SAVE_KEY, activePet, addPet, emptySave, loadSave, writeSave } from './save'

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

  it('round-trips character and pets', () => {
    const storage = memory()
    let data = emptySave()
    data = { ...data, character: { name: 'Lotti', look: DEFAULT_LOOK } }
    data = addPet(data, 'hund', 'Bello')
    expect(writeSave(storage, data)).toBe(true)

    const loaded = loadSave(storage)
    expect(loaded.character?.name).toBe('Lotti')
    expect(activePet(loaded)).toEqual({ id: 'hund-1', species: 'hund', name: 'Bello' })
  })

  it('gives an empty save for missing, corrupt or foreign data', () => {
    const storage = memory()
    expect(loadSave(storage)).toEqual(emptySave())
    storage.setItem(SAVE_KEY, '{not json')
    expect(loadSave(storage)).toEqual(emptySave())
    storage.setItem(SAVE_KEY, JSON.stringify({ version: 99 }))
    expect(loadSave(storage)).toEqual(emptySave())
    expect(loadSave(undefined)).toEqual(emptySave())
  })

  it('drops unknown pets and survives a throwing storage', () => {
    const storage = memory()
    storage.setItem(
      SAVE_KEY,
      JSON.stringify({
        ...emptySave(),
        pets: [{ id: 'x', species: 'drache', name: 'X' }],
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

  it('reads saves from before coins and settings existed', () => {
    const storage = memory()
    const old = { version: 1, character: null, pets: [], activePetId: null }
    storage.setItem(SAVE_KEY, JSON.stringify(old))
    expect(loadSave(storage)).toEqual(emptySave())
    storage.setItem(SAVE_KEY, JSON.stringify({ ...old, coins: -5, settings: { muted: true } }))
    expect(loadSave(storage).coins).toBe(0)
    expect(loadSave(storage).settings.muted).toBe(true)
  })

  it('keeps the first pet active when more are added', () => {
    const data = addPet(addPet(emptySave(), 'hund', 'Bello'), 'katze', 'Mimi')
    expect(data.activePetId).toBe('hund-1')
    expect(data.pets.map((p) => p.id)).toEqual(['hund-1', 'katze-2'])
  })
})
