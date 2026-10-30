// Battle results in the save (GAME_DESIGN §4 "Pets", §6b "Win and defeat"). Pure logic.
// Nothing is ever lost: a defeat only sends the pet for a short nap.
import { SPECIES, traitOf, type SpeciesId } from '../data/creatures'
import type { RoundBoost } from '../state/economy'
import { activePet, addPet, earnCoins, type PetSave, type SaveData } from '../state/save'
import { levelFromXp, recordTime, traitPower, winXp, type TraitPower } from './battle'

/** A tired pet naps for 2 minutes – or until she finishes a show. */
export const NAP_MS = 2 * 60 * 1000
/** The third win against a species befriends it. */
export const BEFRIEND_WINS = 3

export const petLevel = (pet: PetSave): number => levelFromXp(pet.xp)

/** Her active pet's trait at its level; shows and huts use it too (GAME_DESIGN §4). */
export function activePower(save: SaveData): TraitPower {
  const pet = activePet(save)
  return traitPower(pet ? traitOf(pet.species) : null, pet ? petLevel(pet) : 1)
}

export const roundBoost = (power: TraitPower): RoundBoost => ({
  streakLength: power.streakLength,
  bonusCoins: power.bonusCoins,
})

export function isNapping(save: SaveData, petId: string, now: number): boolean {
  return (save.battle.naps[petId] ?? 0) > now
}

export function awakePets(save: SaveData, now: number): PetSave[] {
  return save.pets.filter((p) => !isNapping(save, p.id, now))
}

/** After a show (or learning-hut round) every pet is rested. */
export function wakeAll(save: SaveData): SaveData {
  return { ...save, battle: { ...save.battle, naps: {} } }
}

/**
 * If her active pet is napping, another awake pet comes along so she can fight on
 * right away. Returns the pet that switched in, if any.
 */
export function ensureAwakeActive(
  save: SaveData,
  now: number,
): { save: SaveData; switchedTo?: PetSave } {
  if (!save.activePetId || !isNapping(save, save.activePetId, now)) return { save }
  const awake = awakePets(save, now)[0]
  if (!awake) return { save }
  return { save: { ...save, activePetId: awake.id }, switchedTo: awake }
}

export function strongestPetLevel(save: SaveData): number {
  return Math.max(1, ...save.pets.map(petLevel))
}

/** XP for right answers when she leaves a battle early (nothing else changes). */
export function addPetXp(save: SaveData, petId: string, xp: number): SaveData {
  return { ...save, pets: save.pets.map((p) => (p.id === petId ? { ...p, xp: p.xp + xp } : p)) }
}

/** Remembers her answer time for the adaptive timer. */
export function addAnswerTime(save: SaveData, key: string, ms: number): SaveData {
  const times = { ...save.battle.times, [key]: recordTime(save.battle.times[key] ?? [], ms) }
  return { ...save, battle: { ...save.battle, times } }
}

export type BattleOutcome = {
  petId: string
  foe: SpeciesId
  won: boolean
  /** XP from her correct answers (kept after a defeat too) */
  answerXp: number
}

export type BattleReward = {
  save: SaveData
  coins: number
  xp: number
  levelBefore: number
  levelAfter: number
  /** The befriended animal, added as a new pet (named after its species until she names it) */
  newPet?: PetSave
}

export function finishBattle(
  save: SaveData,
  outcome: BattleOutcome,
  device: string,
  now: number,
): BattleReward {
  const pet = save.pets.find((p) => p.id === outcome.petId)
  const wild = SPECIES[outcome.foe].wild
  if (!pet || !wild) return { save, coins: 0, xp: 0, levelBefore: 1, levelAfter: 1 }

  const xp = outcome.answerXp + (outcome.won ? winXp(wild.level) : 0)
  const levelBefore = petLevel(pet)
  let next: SaveData = {
    ...save,
    pets: save.pets.map((p) => (p.id === pet.id ? { ...p, xp: p.xp + xp } : p)),
  }
  const levelAfter = levelFromXp(pet.xp + xp)

  if (!outcome.won) {
    const naps = { ...next.battle.naps, [pet.id]: now + NAP_MS }
    next = { ...next, battle: { ...next.battle, naps } }
    return { save: next, coins: 0, xp, levelBefore, levelAfter }
  }

  next = earnCoins(next, wild.coins, device)
  const wins = (next.battle.wins[outcome.foe] ?? 0) + 1
  next = { ...next, battle: { ...next.battle, wins: { ...next.battle.wins, [outcome.foe]: wins } } }

  let newPet: PetSave | undefined
  if (wins >= BEFRIEND_WINS && !next.battle.befriended.includes(outcome.foe)) {
    const ids = new Set(next.pets.map((p) => p.id))
    next = addPet(next, outcome.foe, SPECIES[outcome.foe].name)
    newPet = next.pets.find((p) => !ids.has(p.id))
    next = {
      ...next,
      battle: { ...next.battle, befriended: [...next.battle.befriended, outcome.foe] },
    }
  }
  return { save: next, coins: wild.coins, xp, levelBefore, levelAfter, newPet }
}
