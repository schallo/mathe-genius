// All shop items (GAME_DESIGN §4). Adding a dress, haircut or pet = one entry here
// (plus its sprite). Starter items are owned by everyone from the start.
import type { CharacterLook } from '../art/character/look'
import type { DojoOp } from '../math/einmaleins'
import type { PetTrick } from '../art/pets/Pet'
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
  /** Picture for things that aren't worn (toys): an icon name from art/icons.ts */
  icon?: string
  /** Toys: the trick the pet does when she taps it in the village */
  trick?: PetTrick
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
    id: 'kurz',
    category: 'frisuren',
    name: 'Kurz',
    price: 0,
    starter: true,
    wear: { hair: 'kurz' },
  },
  {
    id: 'shirt',
    category: 'kleider',
    name: 'T-Shirt & Hose',
    price: 0,
    starter: true,
    wear: { outfit: 'shirt', outfitColor: 'himmel', outfitColor2: 'jeans' },
  },
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

  // Two colours: top and trousers/skirt can be coloured separately in Mein Haus
  {
    id: 'schlafanzug',
    category: 'kleider',
    name: 'Schlafanzug',
    price: 70,
    wear: { outfit: 'schlafanzug', outfitColor: 'flieder', outfitColor2: 'flieder' },
  },
  {
    id: 'pulli',
    category: 'kleider',
    name: 'Pulli & Rock',
    price: 90,
    wear: { outfit: 'pulli', outfitColor: 'gelb', outfitColor2: 'jeans' },
  },
  {
    id: 'latzhose',
    category: 'kleider',
    name: 'Latzhose',
    price: 120,
    wear: { outfit: 'latzhose', outfitColor: 'rosa', outfitColor2: 'jeans' },
  },
  {
    id: 'hoodie',
    category: 'kleider',
    name: 'Kapuzenpulli',
    price: 140,
    wear: { outfit: 'hoodie', outfitColor: 'mint', outfitColor2: 'grau' },
  },

  // Step 12 – more outfits (two-tone ones can be coloured top and bottom)
  {
    id: 'tutu',
    category: 'kleider',
    name: 'Tutu',
    price: 80,
    wear: { outfit: 'tutu', outfitColor: 'rosa', outfitColor2: 'flieder' },
  },
  {
    id: 'matrose',
    category: 'kleider',
    name: 'Matrosenkleid',
    price: 100,
    wear: { outfit: 'matrose', outfitColor: 'himmel' },
  },
  {
    id: 'trainingsanzug',
    category: 'kleider',
    name: 'Trainingsanzug',
    price: 110,
    wear: { outfit: 'trainingsanzug', outfitColor: 'terrakotta', outfitColor2: 'grau' },
  },
  {
    id: 'lederhose',
    category: 'kleider',
    name: 'Lederhose',
    price: 150,
    wear: { outfit: 'lederhose', outfitColor: 'himmel', outfitColor2: 'braun' },
  },
  {
    id: 'dirndl',
    category: 'kleider',
    name: 'Dirndl',
    price: 160,
    wear: { outfit: 'dirndl', outfitColor: 'mint', outfitColor2: 'rosa' },
  },
  {
    id: 'prinzessin',
    category: 'kleider',
    name: 'Prinzessin',
    price: 220,
    wear: { outfit: 'prinzessin', outfitColor: 'flieder', outfitColor2: 'rosa' },
  },
  {
    id: 'astronaut',
    category: 'kleider',
    name: 'Astronaut',
    price: 240,
    wear: { outfit: 'astronaut', outfitColor: 'grau' },
  },

  // Frisuren
  { id: 'zoepfe', category: 'frisuren', name: 'Zöpfe', price: 60, wear: { hair: 'zoepfe' } },
  { id: 'dutts', category: 'frisuren', name: 'Dutts', price: 90, wear: { hair: 'dutts' } },
  { id: 'locken', category: 'frisuren', name: 'Locken', price: 120, wear: { hair: 'locken' } },
  {
    id: 'stachelig',
    category: 'frisuren',
    name: 'Stachelig',
    price: 60,
    wear: { hair: 'stachelig' },
  },
  { id: 'lang', category: 'frisuren', name: 'Lange Haare', price: 120, wear: { hair: 'lang' } },
  {
    id: 'wuschel',
    category: 'frisuren',
    name: 'Wuschelkopf',
    price: 50,
    wear: { hair: 'wuschel' },
  },
  {
    id: 'seitenzopf',
    category: 'frisuren',
    name: 'Seitenzopf',
    price: 70,
    wear: { hair: 'seitenzopf' },
  },
  { id: 'zopf', category: 'frisuren', name: 'Zopf', price: 80, wear: { hair: 'zopf' } },
  { id: 'iro', category: 'frisuren', name: 'Irokese', price: 100, wear: { hair: 'iro' } },
  { id: 'afro', category: 'frisuren', name: 'Afro', price: 130, wear: { hair: 'afro' } },

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
  {
    id: 'muetze',
    category: 'accessoires',
    name: 'Mütze',
    price: 35,
    wear: { accessory: 'muetze' },
  },
  { id: 'cap', category: 'accessoires', name: 'Basecap', price: 40, wear: { accessory: 'cap' } },
  { id: 'schal', category: 'accessoires', name: 'Schal', price: 45, wear: { accessory: 'schal' } },
  {
    id: 'rucksack',
    category: 'accessoires',
    name: 'Rucksack',
    price: 70,
    wear: { accessory: 'rucksack' },
  },
  {
    id: 'stirnband',
    category: 'accessoires',
    name: 'Stirnband',
    price: 25,
    wear: { accessory: 'stirnband' },
  },
  {
    id: 'fliege',
    category: 'accessoires',
    name: 'Fliege',
    price: 30,
    wear: { accessory: 'fliege' },
  },
  {
    id: 'haarblume',
    category: 'accessoires',
    name: 'Haarblume',
    price: 35,
    wear: { accessory: 'haarblume' },
  },
  {
    id: 'sonnenbrille',
    category: 'accessoires',
    name: 'Sonnenbrille',
    price: 45,
    wear: { accessory: 'sonnenbrille' },
  },
  { id: 'kette', category: 'accessoires', name: 'Kette', price: 60, wear: { accessory: 'kette' } },
  {
    id: 'piratenhut',
    category: 'accessoires',
    name: 'Piratenhut',
    price: 75,
    wear: { accessory: 'piratenhut' },
  },
  {
    id: 'zauberhut',
    category: 'accessoires',
    name: 'Zauberhut',
    price: 90,
    wear: { accessory: 'zauberhut' },
  },

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

  // Opens the fishing game at the village pond (NOTES "Fishing mini game"). First in the tab so
  // she finds it without paging.
  { id: 'angel', category: 'spielzeug', name: 'Angel', price: 120, icon: 'angel' },
  // Futter & Spielzeug: pets do a trick
  { id: 'ball', category: 'spielzeug', name: 'Ball', price: 15, icon: 'ball', trick: 'doubleHop' },
  {
    id: 'leckerli',
    category: 'spielzeug',
    name: 'Leckerli',
    price: 5,
    icon: 'leckerli',
    trick: 'hearts',
  },
  {
    id: 'gloeckchen',
    category: 'spielzeug',
    name: 'Glöckchen',
    price: 8,
    icon: 'gloeckchen',
    trick: 'hop',
  },
  {
    id: 'ente',
    category: 'spielzeug',
    name: 'Quietsche-Ente',
    price: 10,
    icon: 'ente',
    trick: 'hop',
  },
  {
    id: 'wolle',
    category: 'spielzeug',
    name: 'Wollknäuel',
    price: 12,
    icon: 'wolle',
    trick: 'spin',
  },
  { id: 'seil', category: 'spielzeug', name: 'Seil', price: 14, icon: 'seil', trick: 'spin' },
  {
    id: 'frisbee',
    category: 'spielzeug',
    name: 'Frisbee',
    price: 16,
    icon: 'frisbee',
    trick: 'doubleHop',
  },
  { id: 'kissen', category: 'spielzeug', name: 'Kissen', price: 18, icon: 'kissen', trick: 'nap' },
  {
    id: 'teddy',
    category: 'spielzeug',
    name: 'Kuscheltier',
    price: 20,
    icon: 'teddy',
    trick: 'hearts',
  },

  // Haustiere (Tierheim): everyday pets for coins …
  { id: 'hund', category: 'haustiere', name: 'Hündchen', price: 300, species: 'hund' },
  { id: 'katze', category: 'haustiere', name: 'Kätzchen', price: 400, species: 'katze' },
  { id: 'hamster', category: 'haustiere', name: 'Hamster', price: 300, species: 'hamster' },
  { id: 'maus', category: 'haustiere', name: 'Maus', price: 250, species: 'maus' },
  {
    id: 'schildkroete',
    category: 'haustiere',
    name: 'Schildkröte',
    price: 300,
    species: 'schildkroete',
  },
  { id: 'kaninchen', category: 'haustiere', name: 'Kaninchen', price: 350, species: 'kaninchen' },
  {
    id: 'meerschweinchen',
    category: 'haustiere',
    name: 'Meerschweinchen',
    price: 350,
    species: 'meerschweinchen',
  },
  {
    id: 'wellensittich',
    category: 'haustiere',
    name: 'Wellensittich',
    price: 450,
    species: 'wellensittich',
  },
  {
    id: 'dalmatiner',
    category: 'haustiere',
    name: 'Dalmatiner',
    price: 500,
    species: 'dalmatiner',
  },
  { id: 'rotekatze', category: 'haustiere', name: 'Rote Katze', price: 500, species: 'rotekatze' },
  // … and special animals (one of each, with their own name) for stars + coins
  {
    id: 'mrwriggles',
    category: 'haustiere',
    name: 'Mr Wriggles',
    price: 300,
    starCost: 3,
    species: 'mrwriggles',
  },
  {
    id: 'kapitaen',
    category: 'haustiere',
    name: 'Kapitän Panzer',
    price: 350,
    starCost: 4,
    species: 'kapitaen',
  },
  {
    id: 'pfoetchen',
    category: 'haustiere',
    name: 'Prinzessin Pfötchen',
    price: 500,
    starCost: 5,
    species: 'pfoetchen',
  },
  {
    id: 'sirbello',
    category: 'haustiere',
    name: 'Sir Bello',
    price: 500,
    starCost: 5,
    species: 'sirbello',
  },
  {
    id: 'sternenkatze',
    category: 'haustiere',
    name: 'Sternen-Katze',
    price: 400,
    starCost: 6,
    species: 'sternenkatze',
  },
  {
    id: 'regenbogenhase',
    category: 'haustiere',
    name: 'Regenbogen-Hase',
    price: 600,
    starCost: 8,
    species: 'regenbogenhase',
  },
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
