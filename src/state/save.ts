// Save data in localStorage, versioned with migrations (CLAUDE.md: wrapped in try/catch).
// The same format is used for JSON export/import and the cloud copy (GAME_DESIGN §8).
import type { CharacterLook } from '../art/character/look'
import { SPECIES, type SpeciesId } from '../data/creatures'

// Kept from the working title "Mathe-Bühne" so existing progress stays readable
export const SAVE_KEY = 'mathe-buehne'
export const SAVE_VERSION = 2

export type PetSave = { id: string; species: SpeciesId; name: string }

/** Device id → count */
export type Counter = Record<string, number>

export type SaveData = {
  version: typeof SAVE_VERSION
  /** Time of the last change (ms since 1970), used to pick the newer save when merging */
  updatedAt: number
  character: { name: string; look: CharacterLook } | null
  pets: PetSave[]
  activePetId: string | null
  /**
   * Coins earned and spent, counted per device. Each device only ever increases its own
   * counters, so saves from the PC and the iPhone merge without losing coins earned on
   * one or purchases made on the other (balance = all earned − all spent).
   */
  coins: { earned: Counter; spent: Counter }
  settings: { muted: boolean }
}

export function emptySave(): SaveData {
  return {
    version: SAVE_VERSION,
    updatedAt: 0,
    character: null,
    pets: [],
    activePetId: null,
    coins: { earned: {}, spent: {} },
    settings: { muted: false },
  }
}

const total = (c: Counter) => Object.values(c).reduce((s, n) => s + n, 0)

export const coinBalance = (save: SaveData) => total(save.coins.earned) - total(save.coins.spent)

export function earnCoins(save: SaveData, amount: number, device: string): SaveData {
  const earned = { ...save.coins.earned, [device]: (save.coins.earned[device] ?? 0) + amount }
  return { ...save, coins: { ...save.coins, earned } }
}

const count = (n: unknown) => (Number.isInteger(n) && (n as number) >= 0 ? (n as number) : 0)

function counter(input: unknown): Counter {
  if (!input || typeof input !== 'object') return {}
  return Object.fromEntries(Object.entries(input).map(([k, v]) => [k, count(v)]))
}

function mergeCounters(a: Counter, b: Counter): Counter {
  const out: Counter = { ...a }
  for (const [k, v] of Object.entries(b)) out[k] = Math.max(out[k] ?? 0, v)
  return out
}

type Raw = Record<string, unknown> & { version?: number }

/** Older versions → current version. Each step only handles its own change. */
const MIGRATIONS: Record<number, (data: Raw) => Raw> = {
  // v1 stored the coin balance as one number
  1: (data) => ({
    ...data,
    version: 2,
    updatedAt: 0,
    coins: { earned: count(data.coins) > 0 ? { legacy: count(data.coins) } : {}, spent: {} },
  }),
}

/** Validates and migrates any stored or imported save. Returns null if it isn't one. */
export function parseSave(input: unknown): SaveData | null {
  if (!input || typeof input !== 'object') return null
  let data = input as Raw
  while (
    typeof data.version === 'number' &&
    data.version < SAVE_VERSION &&
    MIGRATIONS[data.version]
  ) {
    data = MIGRATIONS[data.version](data)
  }
  if (data.version !== SAVE_VERSION) return null

  const pets = (Array.isArray(data.pets) ? data.pets : []).filter(
    (p): p is PetSave =>
      !!p && typeof p.id === 'string' && typeof p.name === 'string' && p.species in SPECIES,
  )
  const character = data.character as SaveData['character'] | undefined
  const coins = data.coins as Partial<Record<'earned' | 'spent', unknown>> | undefined
  const settings = data.settings as Partial<SaveData['settings']> | undefined
  return {
    version: SAVE_VERSION,
    updatedAt: count(data.updatedAt),
    character: character && typeof character.name === 'string' && character.look ? character : null,
    pets,
    activePetId: pets.some((p) => p.id === data.activePetId) ? (data.activePetId as string) : null,
    coins: { earned: counter(coins?.earned), spent: counter(coins?.spent) },
    settings: { muted: settings?.muted === true },
  }
}

type Reader = Pick<Storage, 'getItem'>
type Writer = Pick<Storage, 'setItem'>

/** Never throws: missing, corrupt or unknown data gives an empty save. */
export function loadSave(storage: Reader | undefined): SaveData {
  try {
    const raw = storage?.getItem(SAVE_KEY)
    return (raw && parseSave(JSON.parse(raw))) || emptySave()
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

/** Ids stay unique across devices, so pets adopted on the PC and the iPhone never collide. */
function newId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`
}

export function addPet(data: SaveData, species: SpeciesId, name: string): SaveData {
  const id = newId(species)
  return {
    ...data,
    pets: [...data.pets, { id, species, name }],
    activePetId: data.activePetId ?? id,
  }
}

export function activePet(data: SaveData): PetSave | undefined {
  return data.pets.find((p) => p.id === data.activePetId)
}

/**
 * Merges two saves of the same player (GAME_DESIGN §8): the newer save wins for
 * character, settings and the active pet; pets are combined; each device's coin
 * counters are merged by their maximum, so no coins get lost.
 */
export function mergeSaves(a: SaveData, b: SaveData): SaveData {
  const [older, newer] = a.updatedAt <= b.updatedAt ? [a, b] : [b, a]
  const byId = new Map<string, PetSave>()
  for (const pet of [...older.pets, ...newer.pets]) byId.set(pet.id, pet)
  const pets = [...byId.values()]
  const activePetId =
    [newer.activePetId, older.activePetId].find((id) => pets.some((p) => p.id === id)) ?? null
  return {
    version: SAVE_VERSION,
    updatedAt: newer.updatedAt,
    character: newer.character ?? older.character,
    pets,
    activePetId,
    coins: {
      earned: mergeCounters(a.coins.earned, b.coins.earned),
      spent: mergeCounters(a.coins.spent, b.coins.spent),
    },
    settings: newer.settings,
  }
}
