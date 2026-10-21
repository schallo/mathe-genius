// Animal species: pets and (later) their wild forms (GAME_DESIGN §4 "Pet roster").
// Adding an animal = one entry here + a sprite in src/art/pets/.

export type Family = 'katzenHunde' | 'kleintiere' | 'wildtiere' | 'urzeittiere' | 'fabeltiere'

export type SpeciesId = 'hund' | 'katze' | 'hamster'

export type Species = {
  id: SpeciesId
  family: Family
  /** German name as a pet, e.g. on the starter card */
  name: string
}

export const SPECIES: Record<SpeciesId, Species> = {
  hund: { id: 'hund', family: 'katzenHunde', name: 'Hündchen' },
  katze: { id: 'katze', family: 'katzenHunde', name: 'Kätzchen' },
  hamster: { id: 'hamster', family: 'kleintiere', name: 'Hamster' },
}

/** Starter choice at character creation, in the order shown. */
export const STARTERS: SpeciesId[] = ['hund', 'katze', 'hamster']

export type Trait = { id: string; label: string } | null

/** Traits belong to the family (GAME_DESIGN §4 "Pet traits"); cats and dogs have none. */
export const FAMILY_TRAITS: Record<Family, Trait> = {
  katzenHunde: null,
  kleintiere: { id: 'mehrZeit', label: '+2 Sekunden' },
  wildtiere: { id: 'rechentipp', label: 'Rechentipp' },
  urzeittiere: { id: 'urzeitkraft', label: 'Volltreffer ×2' },
  fabeltiere: { id: 'zauberJoker', label: 'Zauber-Joker' },
}

export const traitOf = (species: SpeciesId): Trait => FAMILY_TRAITS[SPECIES[species].family]
