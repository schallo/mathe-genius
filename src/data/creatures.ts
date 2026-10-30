// Animal species: pets and their wild forms (GAME_DESIGN §4 "Pet roster", §6b).
// Adding an animal = one entry here + a sprite in src/art/pets/.
import type { Level } from '../math/types'

export type Family = 'katzenHunde' | 'kleintiere' | 'wildtiere' | 'urzeittiere' | 'fabeltiere'

export type SpeciesId =
  | 'hund'
  | 'katze'
  | 'hamster'
  | 'kaninchen'
  | 'schildkroete'
  | 'wellensittich'
  | 'meerschweinchen'
  | 'maus'
  | 'dalmatiner'
  | 'rotekatze'
  | 'mrwriggles'
  | 'pfoetchen'
  | 'sirbello'
  | 'sternenkatze'
  | 'kapitaen'
  | 'regenbogenhase'
  | 'goldi'
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
  /** Its own trait; without one the animal has its family's trait */
  trait?: Trait
  /** Special animals: only one of them, arriving with this name */
  uniqueName?: string
}

/**
 * What a pet does for her (GAME_DESIGN §4 "Pet traits"). Traits never solve a task: in shows
 * and huts they only protect coins and streaks, in battles they help her pet. Her levels,
 * dojo times and the mistake queue always count her real answers.
 */
export type TraitEffects = {
  /** Battles: extra time per task (ms) */
  extraMs: number
  /** Battles: method tips per battle */
  tips: number
  /** Battles: wrong answers that become a second try */
  jokers: number
  /** Battles: Volltreffer damage multiplier */
  fullHitFactor: number
  /** Mistakes per round that cost nothing: coins and streak as on the first try, no hit in battles */
  freeMistakes: number
  /** The streak bonus comes after this many first tries in a row (instead of 5) */
  streakLength: number
  /** Extra coins for each task right on the first try (shows and huts) */
  bonusCoins: number
  /** Extra stars for each new level (shows and huts) */
  bonusStars: number
}

export type Trait = { name: string; effects: Partial<TraitEffects> } | null

export const SPECIES: Record<SpeciesId, Species> = {
  hund: {
    id: 'hund',
    family: 'katzenHunde',
    name: 'Hündchen',
    trait: { name: 'Treuer Freund', effects: { freeMistakes: 1 } },
  },
  katze: {
    id: 'katze',
    family: 'katzenHunde',
    name: 'Kätzchen',
    trait: { name: 'Glückspfote', effects: { streakLength: 4 } },
  },
  hamster: {
    id: 'hamster',
    family: 'kleintiere',
    name: 'Hamster',
    trait: { name: 'Mehr Zeit', effects: { extraMs: 2000 } },
  },
  // Everyday pets from the Tierheim, each with its own trait
  kaninchen: {
    id: 'kaninchen',
    family: 'kleintiere',
    name: 'Kaninchen',
    trait: { name: 'Hoppel-Hilfe', effects: { freeMistakes: 1 } },
  },
  schildkroete: {
    id: 'schildkroete',
    family: 'kleintiere',
    name: 'Schildkröte',
    trait: { name: 'Ruhige Pfote', effects: { extraMs: 3000 } },
  },
  wellensittich: {
    id: 'wellensittich',
    family: 'kleintiere',
    name: 'Wellensittich',
    trait: { name: 'Sternenvogel', effects: { bonusStars: 1 } },
  },
  meerschweinchen: {
    id: 'meerschweinchen',
    family: 'kleintiere',
    name: 'Meerschweinchen',
    trait: { name: 'Münzschatz', effects: { bonusCoins: 1 } },
  },
  maus: {
    id: 'maus',
    family: 'kleintiere',
    name: 'Maus',
    trait: { name: 'Flinke Maus', effects: { streakLength: 4 } },
  },
  dalmatiner: {
    id: 'dalmatiner',
    family: 'katzenHunde',
    name: 'Dalmatiner',
    trait: { name: 'Treuer Freund', effects: { freeMistakes: 1 } },
  },
  rotekatze: {
    id: 'rotekatze',
    family: 'katzenHunde',
    name: 'Rote Katze',
    trait: { name: 'Glückspfote', effects: { streakLength: 4 } },
  },
  // Special animals: one of each, arriving with their own name, for stars + coins
  mrwriggles: {
    id: 'mrwriggles',
    family: 'kleintiere',
    name: 'Goldhamster',
    uniqueName: 'Mr Wriggles',
    trait: { name: 'Goldglück', effects: { bonusCoins: 1, extraMs: 2000 } },
  },
  pfoetchen: {
    id: 'pfoetchen',
    family: 'katzenHunde',
    name: 'Kronen-Katze',
    uniqueName: 'Prinzessin Pfötchen',
    trait: { name: 'Königspfote', effects: { streakLength: 3 } },
  },
  sirbello: {
    id: 'sirbello',
    family: 'katzenHunde',
    name: 'Feiner Hund',
    uniqueName: 'Sir Bello',
    trait: { name: 'Ritterschutz', effects: { freeMistakes: 2 } },
  },
  sternenkatze: {
    id: 'sternenkatze',
    family: 'katzenHunde',
    name: 'Sternen-Katze',
    uniqueName: 'Sternen-Katze',
    trait: { name: 'Sternenstaub', effects: { bonusStars: 1 } },
  },
  kapitaen: {
    id: 'kapitaen',
    family: 'kleintiere',
    name: 'Matrosen-Kröte',
    uniqueName: 'Kapitän Panzer',
    trait: { name: 'Ruhe an Bord', effects: { extraMs: 4000 } },
  },
  regenbogenhase: {
    id: 'regenbogenhase',
    family: 'kleintiere',
    name: 'Regenbogen-Hase',
    uniqueName: 'Regenbogen-Hase',
    trait: { name: 'Regenbogen', effects: { freeMistakes: 1, bonusCoins: 1, bonusStars: 1 } },
  },
  // Caught at the village pond with the Angel (never sold)
  goldi: {
    id: 'goldi',
    family: 'kleintiere',
    name: 'Goldfisch',
    uniqueName: 'Goldi',
    trait: { name: 'Glücksblase', effects: { bonusCoins: 1 } },
  },
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

/** Family traits, for animals without their own (the befriended wild animals). */
export const FAMILY_TRAITS: Record<Family, Trait> = {
  katzenHunde: null,
  kleintiere: { name: 'Mehr Zeit', effects: { extraMs: 2000 } },
  wildtiere: { name: 'Rechentipp', effects: { tips: 1 } },
  urzeittiere: { name: 'Urzeitkraft', effects: { fullHitFactor: 2 } },
  fabeltiere: { name: 'Zauber-Joker', effects: { jokers: 1 } },
}

export const traitOf = (species: SpeciesId): Trait =>
  SPECIES[species].trait ?? FAMILY_TRAITS[SPECIES[species].family]

export const wildSpecies = (area: AreaId): Species[] =>
  Object.values(SPECIES).filter((s) => s.wild?.area === area)
