// Sammelalbum (GAME_DESIGN §4): every item and every kind of pet, collected or not.
// A full category gives one bonus star (once). Pure logic.
import { SPECIES, type SpeciesId } from '../data/creatures'
import { ITEMS, type Item } from '../data/items'
import { isOwned } from './shop'
import { earnStars, type SaveData } from './save'

export type AlbumCategory = 'kleider' | 'frisuren' | 'accessoires' | 'spielzeug' | 'tiere'

export const ALBUM_CATEGORIES: AlbumCategory[] = [
  'kleider',
  'frisuren',
  'accessoires',
  'spielzeug',
  'tiere',
]

export type AlbumEntry =
  | { kind: 'item'; item: Item; collected: boolean }
  | { kind: 'pet'; species: SpeciesId; name: string; collected: boolean }

export function albumEntries(save: SaveData, category: AlbumCategory): AlbumEntry[] {
  if (category === 'tiere') {
    return (Object.keys(SPECIES) as SpeciesId[]).map((species) => ({
      kind: 'pet',
      species,
      name: SPECIES[species].name,
      collected: save.pets.some((p) => p.species === species),
    }))
  }
  return ITEMS.filter((i) => i.category === category && !i.species).map((item) => ({
    kind: 'item',
    item,
    collected: isOwned(save, item),
  }))
}

export function albumCount(save: SaveData, category: AlbumCategory) {
  const entries = albumEntries(save, category)
  return { collected: entries.filter((e) => e.collected).length, total: entries.length }
}

export const categoryComplete = (save: SaveData, category: AlbumCategory) => {
  const { collected, total } = albumCount(save, category)
  return total > 0 && collected === total
}

/** Gives the bonus star for every full category that hasn't had one yet. */
export function claimAlbumStars(
  save: SaveData,
  device: string,
): { save: SaveData; categories: AlbumCategory[] } {
  const categories = ALBUM_CATEGORIES.filter(
    (c) => categoryComplete(save, c) && !save.album.claimed.includes(c),
  )
  if (!categories.length) return { save, categories }
  let next = earnStars(save, categories.length, device)
  next = { ...next, album: { claimed: [...next.album.claimed, ...categories] } }
  return { save: next, categories }
}
