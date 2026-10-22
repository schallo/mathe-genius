// Save data in localStorage, versioned with migrations (CLAUDE.md: wrapped in try/catch).
// The same format is used for JSON export/import and the cloud copy (GAME_DESIGN §8).
import type { CharacterLook } from '../art/character/look'
import { SPECIES, type SpeciesId } from '../data/creatures'

// Kept from the working title "Mathe-Bühne" so existing progress stays readable
export const SAVE_KEY = 'mathe-buehne'
export const SAVE_VERSION = 3

export type PetSave = { id: string; species: SpeciesId; name: string; xp: number }

/** Battles (GAME_DESIGN §6b) */
export type BattleSave = {
  /** Wins per wild species; the third win befriends it */
  wins: Partial<Record<SpeciesId, number>>
  /** Species that already joined her (each joins once) */
  befriended: SpeciesId[]
  /** Pet id → time (ms since 1970) when its nap ends */
  naps: Record<string, number>
  /** Her own answer times in ms per "topic-level" (adaptive timer) */
  times: Record<string, number[]>
}

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
  /** Bought items (ids from data/items.ts); starter items are always owned */
  owned: string[]
  /** Item she is saving for (wish bar) */
  wish: string | null
  battle: BattleSave
  settings: { muted: boolean }
}

export const emptyBattle = (): BattleSave => ({ wins: {}, befriended: [], naps: {}, times: {} })

export function emptySave(): SaveData {
  return {
    version: SAVE_VERSION,
    updatedAt: 0,
    character: null,
    pets: [],
    activePetId: null,
    coins: { earned: {}, spent: {} },
    owned: [],
    wish: null,
    battle: emptyBattle(),
    settings: { muted: false },
  }
}

const total = (c: Counter) => Object.values(c).reduce((s, n) => s + n, 0)

export const coinBalance = (save: SaveData) => total(save.coins.earned) - total(save.coins.spent)

export function earnCoins(save: SaveData, amount: number, device: string): SaveData {
  const earned = { ...save.coins.earned, [device]: (save.coins.earned[device] ?? 0) + amount }
  return { ...save, coins: { ...save.coins, earned } }
}

export function spendCoins(save: SaveData, amount: number, device: string): SaveData {
  const spent = { ...save.coins.spent, [device]: (save.coins.spent[device] ?? 0) + amount }
  return { ...save, coins: { ...save.coins, spent } }
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
  // v3 adds pet XP and battle progress
  2: (data) => ({
    ...data,
    version: 3,
    pets: (Array.isArray(data.pets) ? data.pets : []).map((p) => ({ ...p, xp: 0 })),
    battle: emptyBattle(),
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

  const pets: PetSave[] = (Array.isArray(data.pets) ? data.pets : [])
    .filter(
      (p): p is PetSave =>
        !!p && typeof p.id === 'string' && typeof p.name === 'string' && p.species in SPECIES,
    )
    .map((p) => ({ id: p.id, species: p.species, name: p.name, xp: count(p.xp) }))
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
    owned: Array.isArray(data.owned) ? data.owned.filter((id) => typeof id === 'string') : [],
    wish: typeof data.wish === 'string' ? data.wish : null,
    battle: parseBattle(data.battle),
    settings: { muted: settings?.muted === true },
  }
}

const isSpecies = (id: unknown): id is SpeciesId => typeof id === 'string' && id in SPECIES

function parseBattle(input: unknown): BattleSave {
  if (!input || typeof input !== 'object') return emptyBattle()
  const raw = input as Record<string, unknown>
  const record = (v: unknown) => (v && typeof v === 'object' ? Object.entries(v) : [])
  return {
    wins: Object.fromEntries(record(raw.wins).filter(([k]) => isSpecies(k)).map(([k, v]) => [k, count(v)])),
    befriended: Array.isArray(raw.befriended) ? raw.befriended.filter(isSpecies) : [],
    naps: Object.fromEntries(record(raw.naps).map(([k, v]) => [k, count(v)])),
    times: Object.fromEntries(
      record(raw.times).map(([k, v]) => [
        k,
        Array.isArray(v) ? v.filter((n) => typeof n === 'number' && n > 0) : [],
      ]),
    ),
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
    pets: [...data.pets, { id, species, name, xp: 0 }],
    activePetId: data.activePetId ?? id,
  }
}

export function activePet(data: SaveData): PetSave | undefined {
  return data.pets.find((p) => p.id === data.activePetId)
}

/**
 * Merges two saves of the same player (GAME_DESIGN §8): the newer save wins for
 * character, settings, wish, the active pet, naps and answer times; pets, bought items and
 * befriended animals are combined; coin counters, pet XP and wins are merged by their
 * maximum, so nothing earned gets lost.
 */
export function mergeSaves(a: SaveData, b: SaveData): SaveData {
  const [older, newer] = a.updatedAt <= b.updatedAt ? [a, b] : [b, a]
  const byId = new Map<string, PetSave>()
  for (const pet of [...older.pets, ...newer.pets]) {
    // XP only grows, so the bigger value is the newer one
    byId.set(pet.id, { ...pet, xp: Math.max(pet.xp, byId.get(pet.id)?.xp ?? 0) })
  }
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
    owned: [...new Set([...older.owned, ...newer.owned])],
    wish: newer.wish,
    battle: {
      wins: mergeCounters(a.battle.wins, b.battle.wins),
      befriended: [...new Set([...older.battle.befriended, ...newer.battle.befriended])],
      naps: newer.battle.naps,
      times: { ...older.battle.times, ...newer.battle.times },
    },
    settings: newer.settings,
  }
}
