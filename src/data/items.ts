// All shop items (GAME_DESIGN §4). Adding a dress, haircut or pet = one entry here
// (plus its sprite). Starter items are owned by everyone from the start.
import type { CharacterLook } from '../art/character/look'
import type { DojoOp } from '../math/einmaleins'
import type { SpeciesId } from './creatures'

export type ItemCategory = 'kleider' | 'frisuren' | 'accessoires' | 'spielzeug' | 'haustiere'

export type Item = {
  id: string
  category: ItemCategory
  name: string
  price: number
  /** Stars needed in addition to coins (star items, build step 10) */
  starCost?: number
  /** Owned from the start, never sold */
  starter?: boolean
  /** What wearing it changes on the character */
  wear?: Partial<CharacterLook>
  /** Pets: adopted in the Tierheim and named */
  species?: SpeciesId
  /** Not sold: earned when every cell of that dojo's grid is gold (GAME_DESIGN §6a) */
  reward?: DojoOp
}

export const ITEMS: Item[] = [
  // Starter wardrobe
  {
    id: 'kleid',
    category: 'kleider',
    name: 'Sommerkleid',
    price: 0,
    starter: true,
    wear: { outfit: 'kleid' },
  },
  {
    id: 'pferdeschwanz',
    category: 'frisuren',
    name: 'Pferdeschwanz',
    price: 0,
    starter: true,
    wear: { hair: 'pferdeschwanz' },
  },
  { id: 'bob', category: 'frisuren', name: 'Bob', price: 0, starter: true, wear: { hair: 'bob' } },
  {
    id: 'schleife',
    category: 'accessoires',
    name: 'Schleife',
    price: 0,
    starter: true,
    wear: { accessory: 'schleife' },
  },

  // Kleider (3–5 shows each)
  {
    id: 'regenmantel',
    category: 'kleider',
    name: 'Regenmantel',
    price: 150,
    wear: { outfit: 'regenmantel', outfitColor: 'gelb' },
  },
  {
    id: 'fussball',
    category: 'kleider',
    name: 'Fußballtrikot',
    price: 180,
    wear: { outfit: 'fussball', outfitColor: 'himmel' },
  },
  {
    id: 'ballkleid',
    category: 'kleider',
    name: 'Ballkleid',
    price: 250,
    wear: { outfit: 'ballkleid', outfitColor: 'rosa' },
  },

  // Frisuren
  { id: 'zoepfe', category: 'frisuren', name: 'Zöpfe', price: 60, wear: { hair: 'zoepfe' } },
  { id: 'dutts', category: 'frisuren', name: 'Dutts', price: 90, wear: { hair: 'dutts' } },
  { id: 'locken', category: 'frisuren', name: 'Locken', price: 120, wear: { hair: 'locken' } },

  // Accessoires (about one show each)
  {
    id: 'brille',
    category: 'accessoires',
    name: 'Brille',
    price: 30,
    wear: { accessory: 'brille' },
  },
  { id: 'hut', category: 'accessoires', name: 'Strohhut', price: 40, wear: { accessory: 'hut' } },
  {
    id: 'blumenkranz',
    category: 'accessoires',
    name: 'Blumenkranz',
    price: 50,
    wear: { accessory: 'blumenkranz' },
  },
  { id: 'krone', category: 'accessoires', name: 'Krone', price: 100, wear: { accessory: 'krone' } },

  // Star items: stars (for new levels) plus coins (GAME_DESIGN §4)
  {
    id: 'sternspange',
    category: 'accessoires',
    name: 'Sternspange',
    price: 30,
    starCost: 2,
    wear: { accessory: 'sternspange' },
  },
  {
    id: 'glitzerkrone',
    category: 'accessoires',
    name: 'Glitzerkrone',
    price: 80,
    starCost: 5,
    wear: { accessory: 'glitzerkrone' },
  },

  // Rewards for a fully gold Einmaleins grid
  {
    id: 'einmaleins-krone',
    category: 'accessoires',
    name: 'Einmaleins-Krone',
    price: 0,
    reward: 'mul',
    wear: { accessory: 'malkrone' },
  },
  {
    id: 'geteilt-diadem',
    category: 'accessoires',
    name: 'Geteilt-Diadem',
    price: 0,
    reward: 'div',
    wear: { accessory: 'diadem' },
  },

  // Futter & Spielzeug: pets do a trick
  { id: 'ball', category: 'spielzeug', name: 'Ball', price: 15 },

  // Haustiere (Tierheim)
  { id: 'katze', category: 'haustiere', name: 'Kätzchen', price: 400, species: 'katze' },
  { id: 'hamster', category: 'haustiere', name: 'Hamster', price: 300, species: 'hamster' },
]

export function item(id: string): Item | undefined {
  return ITEMS.find((i) => i.id === id)
}

export const SHOP_CATEGORIES: ItemCategory[] = ['kleider', 'frisuren', 'accessoires', 'spielzeug']

export const CATEGORY_NAMES: Record<ItemCategory, string> = {
  kleider: 'Kleider',
  frisuren: 'Frisuren',
  accessoires: 'Schmuck',
  spielzeug: 'Spielzeug',
  haustiere: 'Tiere',
}
