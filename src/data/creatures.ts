// Animal species: pets and their wild forms (GAME_DESIGN §4 "Pet roster", §6b).
// Adding an animal = one entry here + a sprite in src/art/pets/.
import type { Level } from '../math/types'

export type Family = 'katzenHunde' | 'kleintiere' | 'wildtiere' | 'urzeittiere' | 'fabeltiere'

export type SpeciesId = 'hund' | 'katze' | 'hamster' | 'igel' | 'eichhoernchen' | 'fuchs'

export type AreaId = 'blumenwiese'

/** How the animal appears in the wild area (GAME_DESIGN §6b). */
export type WildForm = {
  area: AreaId
  /** Battle topic: Einmaleins + Division or Kopfrechnen Plus/Minus */
  topic: 'einmaleins' | 'kopfrechnen'
  /** Level of the tasks it asks */
  taskLevel: Level
  /** Shown on the pill above it; stronger creatures have more HP and attack */
  level: number
  hp: number
  attack: number
  /** Multiplies the time per task (stronger creatures give a little less time) */
  timeFactor: number
  /** Coins for a win (10–30) */
  coins: number
}

export type Species = {
  id: SpeciesId
  family: Family
  /** German name, e.g. on the starter card and in battles */
  name: string
  wild?: WildForm
}

export const SPECIES: Record<SpeciesId, Species> = {
  hund: { id: 'hund', family: 'katzenHunde', name: 'Hündchen' },
  katze: { id: 'katze', family: 'katzenHunde', name: 'Kätzchen' },
  hamster: { id: 'hamster', family: 'kleintiere', name: 'Hamster' },
  igel: {
    id: 'igel',
    family: 'wildtiere',
    name: 'Igel',
    wild: {
      area: 'blumenwiese',
      topic: 'einmaleins',
      taskLevel: 2,
      level: 2,
      hp: 26,
      attack: 4,
      timeFactor: 1,
      coins: 10,
    },
  },
  eichhoernchen: {
    id: 'eichhoernchen',
    family: 'wildtiere',
    name: 'Eichhörnchen',
    wild: {
      area: 'blumenwiese',
      topic: 'kopfrechnen',
      taskLevel: 1,
      level: 3,
      hp: 30,
      attack: 5,
      timeFactor: 1,
      coins: 15,
    },
  },
  // The first "big" opponent: divisions, more HP, a little less time
  fuchs: {
    id: 'fuchs',
    family: 'wildtiere',
    name: 'Fuchs',
    wild: {
      area: 'blumenwiese',
      topic: 'einmaleins',
      taskLevel: 3,
      level: 5,
      hp: 40,
      attack: 6,
      timeFactor: 0.9,
      coins: 25,
    },
  },
}

/** Starter choice at character creation, in the order shown. */
export const STARTERS: SpeciesId[] = ['hund', 'katze', 'hamster']

export type Trait = {
  id: 'mehrZeit' | 'rechentipp' | 'urzeitkraft' | 'zauberJoker'
  label: string
} | null

/** Traits belong to the family (GAME_DESIGN §4 "Pet traits"); cats and dogs have none. */
export const FAMILY_TRAITS: Record<Family, Trait> = {
  katzenHunde: null,
  kleintiere: { id: 'mehrZeit', label: '+2 Sekunden' },
  wildtiere: { id: 'rechentipp', label: 'Rechentipp' },
  urzeittiere: { id: 'urzeitkraft', label: 'Volltreffer ×2' },
  fabeltiere: { id: 'zauberJoker', label: 'Zauber-Joker' },
}

export const traitOf = (species: SpeciesId): Trait => FAMILY_TRAITS[SPECIES[species].family]

export const wildSpecies = (area: AreaId): Species[] =>
  Object.values(SPECIES).filter((s) => s.wild?.area === area)
