// Animal species: pets and their wild forms (GAME_DESIGN §4 "Pet roster", §6b).
// Adding an animal = one entry here + a sprite in src/art/pets/.
import type { Level } from '../math/types'

export type Family = 'katzenHunde' | 'kleintiere' | 'wildtiere' | 'urzeittiere' | 'fabeltiere'

export type SpeciesId =
  | 'hund'
  | 'katze'
  | 'hamster'
  | 'igel'
  | 'eichhoernchen'
  | 'fuchs'
  | 'eule'
  | 'waschbaer'
  | 'reh'
  | 'zebra'
  | 'giraffe'
  | 'elefant'
  | 'loewe'
  | 'flugsaurier'
  | 'triceratops'
  | 'brachiosaurus'
  | 'trex'
  | 'pegasus'
  | 'einhorn'
  | 'drache'

export type AreaId = 'blumenwiese' | 'fluesterwald' | 'sonnensavanne' | 'urzeittal' | 'wolkenberg'

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
  // Step 12: one island after the other, each a little harder (GAME_DESIGN §6b).
  // Battles ask Einmaleins (level 3–4: division, mixed) or Kopfrechnen (level 2–5).
  eule: {
    id: 'eule',
    family: 'wildtiere',
    name: 'Eule',
    wild: {
      area: 'fluesterwald',
      topic: 'einmaleins',
      taskLevel: 3,
      level: 5,
      hp: 40,
      attack: 6,
      timeFactor: 0.95,
      coins: 18,
    },
  },
  waschbaer: {
    id: 'waschbaer',
    family: 'wildtiere',
    name: 'Waschbär',
    wild: {
      area: 'fluesterwald',
      topic: 'kopfrechnen',
      taskLevel: 2,
      level: 6,
      hp: 44,
      attack: 6,
      timeFactor: 0.95,
      coins: 20,
    },
  },
  reh: {
    id: 'reh',
    family: 'wildtiere',
    name: 'Reh',
    wild: {
      area: 'fluesterwald',
      topic: 'einmaleins',
      taskLevel: 4,
      level: 7,
      hp: 48,
      attack: 7,
      timeFactor: 0.9,
      coins: 22,
    },
  },
  zebra: {
    id: 'zebra',
    family: 'wildtiere',
    name: 'Zebra',
    wild: {
      area: 'sonnensavanne',
      topic: 'kopfrechnen',
      taskLevel: 3,
      level: 8,
      hp: 52,
      attack: 7,
      timeFactor: 0.9,
      coins: 22,
    },
  },
  giraffe: {
    id: 'giraffe',
    family: 'wildtiere',
    name: 'Giraffe',
    wild: {
      area: 'sonnensavanne',
      topic: 'einmaleins',
      taskLevel: 4,
      level: 9,
      hp: 56,
      attack: 8,
      timeFactor: 0.9,
      coins: 24,
    },
  },
  elefant: {
    id: 'elefant',
    family: 'wildtiere',
    name: 'Elefant',
    wild: {
      area: 'sonnensavanne',
      topic: 'kopfrechnen',
      taskLevel: 4,
      level: 10,
      hp: 62,
      attack: 8,
      timeFactor: 0.85,
      coins: 26,
    },
  },
  loewe: {
    id: 'loewe',
    family: 'wildtiere',
    name: 'Löwe',
    wild: {
      area: 'sonnensavanne',
      topic: 'einmaleins',
      taskLevel: 4,
      level: 11,
      hp: 66,
      attack: 9,
      timeFactor: 0.85,
      coins: 28,
    },
  },
  flugsaurier: {
    id: 'flugsaurier',
    family: 'urzeittiere',
    name: 'Flugsaurier',
    wild: {
      area: 'urzeittal',
      topic: 'kopfrechnen',
      taskLevel: 4,
      level: 12,
      hp: 70,
      attack: 9,
      timeFactor: 0.85,
      coins: 26,
    },
  },
  triceratops: {
    id: 'triceratops',
    family: 'urzeittiere',
    name: 'Triceratops',
    wild: {
      area: 'urzeittal',
      topic: 'einmaleins',
      taskLevel: 4,
      level: 13,
      hp: 74,
      attack: 10,
      timeFactor: 0.8,
      coins: 28,
    },
  },
  brachiosaurus: {
    id: 'brachiosaurus',
    family: 'urzeittiere',
    name: 'Brachiosaurus',
    wild: {
      area: 'urzeittal',
      topic: 'kopfrechnen',
      taskLevel: 5,
      level: 14,
      hp: 80,
      attack: 10,
      timeFactor: 0.8,
      coins: 28,
    },
  },
  trex: {
    id: 'trex',
    family: 'urzeittiere',
    name: 'T-Rex',
    wild: {
      area: 'urzeittal',
      topic: 'einmaleins',
      taskLevel: 4,
      level: 15,
      hp: 86,
      attack: 11,
      timeFactor: 0.75,
      coins: 30,
    },
  },
  pegasus: {
    id: 'pegasus',
    family: 'fabeltiere',
    name: 'Pegasus',
    wild: {
      area: 'wolkenberg',
      topic: 'kopfrechnen',
      taskLevel: 5,
      level: 16,
      hp: 90,
      attack: 11,
      timeFactor: 0.75,
      coins: 30,
    },
  },
  einhorn: {
    id: 'einhorn',
    family: 'fabeltiere',
    name: 'Einhorn',
    wild: {
      area: 'wolkenberg',
      topic: 'einmaleins',
      taskLevel: 4,
      level: 17,
      hp: 94,
      attack: 12,
      timeFactor: 0.75,
      coins: 30,
    },
  },
  drache: {
    id: 'drache',
    family: 'fabeltiere',
    name: 'Drache',
    wild: {
      area: 'wolkenberg',
      topic: 'kopfrechnen',
      taskLevel: 5,
      level: 18,
      hp: 100,
      attack: 12,
      timeFactor: 0.7,
      coins: 30,
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
