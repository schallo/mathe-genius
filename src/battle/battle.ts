// Battle rules (GAME_DESIGN §6b, §4 "Pet traits"). Pure logic, no Phaser.
// Correct in time → her pet attacks (faster = stronger, very fast = Volltreffer);
// wrong or too slow → the wild creature attacks. The battle ends when one side's HP is empty.
import {
  traitOf,
  type SpeciesId,
  type Trait,
  type TraitEffects,
  type WildForm,
} from '../data/creatures'
import { REWARD } from '../state/economy'

// ---------- Pet levels ----------

export const MAX_PET_LEVEL = 30

/** XP needed to reach a level: 20 for level 2, 60 for 3, 120 for 4 … */
export const xpForLevel = (level: number): number => 10 * level * (level - 1)

export function levelFromXp(xp: number): number {
  let level = 1
  while (level < MAX_PET_LEVEL && xp >= xpForLevel(level + 1)) level++
  return level
}

export const petMaxHp = (level: number): number => 20 + 3 * (level - 1)
export const petAttack = (level: number): number => 4 + level

export const XP = { correct: 3, volltreffer: 4, winBase: 10, winPerLevel: 2 } as const

/** XP for winning against a creature of this level, on top of the XP per answer. */
export const winXp = (creatureLevel: number): number => XP.winBase + XP.winPerLevel * creatureLevel

// ---------- Traits ----------

/** What a pet's trait does at its level. */
export type TraitPower = TraitEffects

/** From this pet level on, traits grow a little (one more second, tip, joker or free mistake). */
export const STRONG_TRAIT_LEVEL = 5

export function traitPower(trait: Trait, level: number): TraitPower {
  const e = trait?.effects ?? {}
  const grow = (n = 0, step = 1) => (n > 0 && level >= STRONG_TRAIT_LEVEL ? n + step : n)
  return {
    extraMs: grow(e.extraMs, 1000),
    tips: grow(e.tips),
    jokers: grow(e.jokers),
    fullHitFactor: e.fullHitFactor ?? 1,
    freeMistakes: grow(e.freeMistakes),
    streakLength: e.streakLength ?? REWARD.streakLength,
    bonusCoins: e.bonusCoins ?? 0,
    bonusStars: e.bonusStars ?? 0,
  }
}

/** Two or three words per effect, for the Tierheim card, the starter card and the battle info box. */
export function traitLabel(trait: Trait, level: number): string | null {
  if (!trait) return null
  const p = traitPower(trait, level)
  const times = (n: number, word: string) => (n > 1 ? `${n}× ${word}` : word)
  const parts = [
    p.extraMs && `+${p.extraMs / 1000} Sekunden`,
    p.tips && times(p.tips, 'Rechentipp'),
    p.jokers && times(p.jokers, 'Zauber-Joker'),
    p.fullHitFactor > 1 && `Volltreffer ×${p.fullHitFactor}`,
    p.freeMistakes && `${p.freeMistakes} Fehler frei`,
    p.streakLength !== REWARD.streakLength && `Serie ab ${p.streakLength}`,
    p.bonusCoins && `+${p.bonusCoins} Münze`,
    p.bonusStars && `+${p.bonusStars} Stern`,
  ].filter((x): x is string => !!x)
  return parts.join(' · ')
}

// ---------- Adaptive timer ----------

export const TIMER = {
  startMs: 10_000,
  minMs: 3000,
  maxMs: 12_000,
  factor: 1.5,
  /** Answer times remembered per topic and level */
  keep: 10,
  /** Samples needed before the timer adapts */
  minSamples: 3,
} as const

export function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2
}

/**
 * Time per task: about 1.5 × her median time for this topic and level, starting at 10 s,
 * never below 3 s or above 12 s. Stronger creatures shorten it a little (`creatureFactor`).
 * Trait bonuses are added on top and never enter her statistics.
 */
export function timeLimitMs(times: number[], creatureFactor = 1, extraMs = 0): number {
  const base = times.length < TIMER.minSamples ? TIMER.startMs : TIMER.factor * median(times)
  const clamped = Math.min(TIMER.maxMs, Math.max(TIMER.minMs, base * creatureFactor))
  return Math.round(clamped) + extraMs
}

/** Remembers an answer time (only her own time, without trait bonuses). */
export function recordTime(times: number[], ms: number): number[] {
  return [...times, Math.round(ms)].slice(-TIMER.keep)
}

export const timeKey = (topic: string, level: number): string => `${topic}-${level}`

// ---------- Damage ----------

/** Answers in the first 40 % of the time are a Volltreffer. */
export const VOLLTREFFER_SHARE = 0.4

export function hitDamage(
  attack: number,
  elapsedMs: number,
  limitMs: number,
  fullHitFactor = 1,
): { damage: number; full: boolean } {
  const share = Math.min(1, Math.max(0, elapsedMs / limitMs))
  if (share <= VOLLTREFFER_SHARE) {
    return { damage: Math.round(attack * 1.6) * fullHitFactor, full: true }
  }
  // 1.0 × attack just after the Volltreffer zone, down to 0.7 × at the very end
  return { damage: Math.max(1, Math.round(attack * (1.2 - 0.5 * share))), full: false }
}

// ---------- Battle state ----------

export type Side = { hp: number; maxHp: number; attack: number }

export type BattleState = {
  pet: Side
  foe: Side
  tipsLeft: number
  jokersLeft: number
  /** Mistakes that cost nothing (no hit, the next task comes) */
  shieldsLeft: number
  fullHitFactor: number
  extraMs: number
  /** XP earned so far (kept even after a defeat) */
  xp: number
  correct: number
  outcome: 'win' | 'lose' | null
}

export function startBattle(species: SpeciesId, petLevel: number, foe: WildForm): BattleState {
  const power = traitPower(traitOf(species), petLevel)
  const maxHp = petMaxHp(petLevel)
  return {
    pet: { hp: maxHp, maxHp, attack: petAttack(petLevel) },
    foe: { hp: foe.hp, maxHp: foe.hp, attack: foe.attack },
    tipsLeft: power.tips,
    jokersLeft: power.jokers,
    shieldsLeft: power.freeMistakes,
    fullHitFactor: power.fullHitFactor,
    extraMs: power.extraMs,
    xp: 0,
    correct: 0,
    outcome: null,
  }
}

export function answerCorrect(
  state: BattleState,
  elapsedMs: number,
  limitMs: number,
): { state: BattleState; damage: number; full: boolean } {
  const { damage, full } = hitDamage(state.pet.attack, elapsedMs, limitMs, state.fullHitFactor)
  const hp = Math.max(0, state.foe.hp - damage)
  return {
    damage,
    full,
    state: {
      ...state,
      foe: { ...state.foe, hp },
      xp: state.xp + (full ? XP.volltreffer : XP.correct),
      correct: state.correct + 1,
      outcome: hp === 0 ? 'win' : null,
    },
  }
}

/**
 * Wrong answer or time over. A Zauber-Joker turns a wrong answer (not a timeout) into a
 * second try; a free mistake (shield) keeps the creature from attacking; otherwise it attacks.
 */
export function answerWrong(
  state: BattleState,
  timeout: boolean,
): { state: BattleState; damage: number; joker: boolean; shield: boolean } {
  if (!timeout && state.jokersLeft > 0) {
    const next = { ...state, jokersLeft: state.jokersLeft - 1 }
    return { state: next, damage: 0, joker: true, shield: false }
  }
  if (state.shieldsLeft > 0) {
    const next = { ...state, shieldsLeft: state.shieldsLeft - 1 }
    return { state: next, damage: 0, joker: false, shield: true }
  }
  const damage = state.foe.attack
  const hp = Math.max(0, state.pet.hp - damage)
  return {
    damage,
    joker: false,
    shield: false,
    state: { ...state, pet: { ...state.pet, hp }, outcome: hp === 0 ? 'lose' : null },
  }
}

export function useTip(state: BattleState): BattleState | null {
  return state.tipsLeft > 0 ? { ...state, tipsLeft: state.tipsLeft - 1 } : null
}
