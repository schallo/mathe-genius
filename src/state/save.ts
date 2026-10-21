// Save data in localStorage, versioned (CLAUDE.md: wrapped in try/catch).
// Step 2 stores character and pets; step 5 adds coins, progress and export/import.
import type { CharacterLook } from '../art/character/look'
import { SPECIES, type SpeciesId } from '../data/creatures'

export const SAVE_KEY = 'mathe-buehne'
export const SAVE_VERSION = 1

export type PetSave = { id: string; species: SpeciesId; name: string }

export type SaveData = {
  version: typeof SAVE_VERSION
  character: { name: string; look: CharacterLook } | null
  pets: PetSave[]
  activePetId: string | null
  coins: number
  settings: { muted: boolean }
}

export function emptySave(): SaveData {
  return {
    version: SAVE_VERSION,
    character: null,
    pets: [],
    activePetId: null,
    coins: 0,
    settings: { muted: false },
  }
}

type Reader = Pick<Storage, 'getItem'>
type Writer = Pick<Storage, 'setItem'>

/** Never throws: missing, corrupt or unknown data gives an empty save. */
export function loadSave(storage: Reader | undefined): SaveData {
  try {
    const raw = storage?.getItem(SAVE_KEY)
    if (!raw) return emptySave()
    const data = JSON.parse(raw) as Partial<SaveData>
    if (data.version !== SAVE_VERSION) return emptySave()
    const pets = Array.isArray(data.pets)
      ? data.pets.filter((p) => p && typeof p.name === 'string' && p.species in SPECIES)
      : []
    const activePetId = pets.some((p) => p.id === data.activePetId) ? data.activePetId! : null
    const character =
      data.character && typeof data.character.name === 'string' && data.character.look
        ? data.character
        : null
    // Fields added after the first release default to their empty values
    const coins = Number.isInteger(data.coins) && data.coins! >= 0 ? data.coins! : 0
    const settings = { muted: data.settings?.muted === true }
    return { version: SAVE_VERSION, character, pets, activePetId, coins, settings }
  } catch {
    return emptySave()
  }
}

/** Returns false if the browser refused (private mode, storage full). */
export function writeSave(storage: Writer | undefined, data: SaveData): boolean {
  try {
    storage?.setItem(SAVE_KEY, JSON.stringify(data))
    return storage !== undefined
  } catch {
    return false
  }
}

export function addPet(data: SaveData, species: SpeciesId, name: string): SaveData {
  const id = `${species}-${data.pets.length + 1}`
  return {
    ...data,
    pets: [...data.pets, { id, species, name }],
    activePetId: data.activePetId ?? id,
  }
}

export function activePet(data: SaveData): PetSave | undefined {
  return data.pets.find((p) => p.id === data.activePetId)
}
