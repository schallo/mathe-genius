// Character layer 4: accessories. 16 × 20 px per direction, aligned with body.ts.
// Roles: a = main colour, b = second colour, c = third colour.
// The bow takes the chosen accessory colour; the others have fixed palette colours.
import type { PaletteToken } from '../../palette'
import type { PixelMap } from '../pixels'

export const ACCESSORY_ROLES = 'abc'

export type AccessoryStyle =
  | 'schleife'
  | 'hut'
  | 'brille'
  | 'krone'
  | 'blumenkranz'
  | 'malkrone'
  | 'diadem'
  | 'sternspange'
  | 'glitzerkrone'
  | 'cap'
  | 'muetze'
  | 'schal'
  | 'rucksack'

type Maps = Record<'down' | 'up' | 'side', PixelMap>

const empty = (rows: number) => Array.from({ length: rows }, () => '................')
const same = (map: PixelMap): Maps => ({ down: map, up: map, side: map })

const bowRight = ['..........aa.aa.', '...........aba..', '..........aa.aa.']
const bowLeft = ['.aa.aa..........', '..aba...........', '.aa.aa..........']

export const accessories: Record<AccessoryStyle, Maps> = {
  schleife: {
    down: ['................', ...bowRight, ...empty(16)],
    up: ['................', ...bowLeft, ...empty(16)],
    side: ['................', ...bowLeft, ...empty(16)],
  },
  // Straw hat with a band
  hut: same([
    '................',
    '.....aaaaaa.....',
    '.....aaaaaa.....',
    '.....bbbbbb.....',
    '..aaaaaaaaaaaa..',
    ...empty(15),
  ]),
  // Round glasses around the eyes (no outline – thin frames)
  brille: {
    down: [
      ...empty(7),
      '....aaa..aaa....',
      '....a.aaaa.a....',
      '....a.a..a.a....',
      '....aaa..aaa....',
      ...empty(9),
    ],
    up: empty(20),
    side: [
      ...empty(7),
      '.........aaa....',
      '....aaaaaa.a....',
      '.........a.a....',
      '.........aaa....',
      ...empty(9),
    ],
  },
  // Golden crown with pink gems
  krone: same([
    '................',
    '.....a.aa.a.....',
    '.....aaaaaa.....',
    '.....abaaba.....',
    ...empty(16),
  ]),
  // Einmaleins-Krone: wider crown with three points and mint gems
  malkrone: same([
    '................',
    '....a..aa..a....',
    '....aaaaaaaa....',
    '....abaaaaba....',
    ...empty(16),
  ]),
  // Geteilt-Diadem: thin lilac band with a gold point and two dots (like ":")
  diadem: same([
    '................',
    '.......a........',
    '......aba.......',
    '....cccaccc.....',
    ...empty(16),
  ]),
  // Star items: a gold star clip at the side, a crown with sky and white sparkles
  sternspange: {
    down: [
      '................',
      '...........a....',
      '..........aaa...',
      '...........a....',
      ...empty(16),
    ],
    up: [
      '................',
      '....a...........',
      '...aaa..........',
      '....a...........',
      ...empty(16),
    ],
    side: [
      '................',
      '....a...........',
      '...aaa..........',
      '....a...........',
      ...empty(16),
    ],
  },
  glitzerkrone: same([
    '................',
    '....a..c..a.....',
    '....aaaaaaaa....',
    '....abacabaa....',
    ...empty(16),
  ]),
  // Cap with a brim (front: over the forehead, side: sticking out in front)
  cap: {
    down: [
      '................',
      '.....aaaaaa.....',
      '....aaaaaaaa....',
      '...aaaaaaaaaa...',
      '..bbbbbbbbbbbb..',
      ...empty(15),
    ],
    up: [
      '................',
      '.....aaaaaa.....',
      '....aaaaaaaa....',
      '...aaaaaaaaaa...',
      '...abbbbbbbba...',
      ...empty(15),
    ],
    side: [
      '................',
      '.....aaaaaa.....',
      '....aaaaaaaa....',
      '...aaaaaaaaaa...',
      '...aaaaaaaabbbb.',
      ...empty(15),
    ],
  },
  // Beanie with a pompom
  muetze: same([
    '................',
    '.......bb.......',
    '.....aaaaaa.....',
    '....aaaaaaaa....',
    '...aaaaaaaaaa...',
    '..bbbbbbbbbbbb..',
    ...empty(14),
  ]),
  // Striped scarf round the neck with a hanging end
  schal: {
    down: [
      ...empty(12),
      '....aaaaaaaa....',
      '....abababab....',
      '.....ab.........',
      '.....aa.........',
      ...empty(4),
    ],
    up: [...empty(12), '....aaaaaaaa....', '....abababab....', ...empty(6)],
    side: [
      ...empty(12),
      '....aaaaaaaa....',
      '....abababab....',
      '....aa..........',
      '....ab..........',
      ...empty(4),
    ],
  },
  // Backpack: straps in front, the bag on her back
  rucksack: {
    down: [...empty(14), '....b......b....', '....b......b....', '....b......b....', ...empty(3)],
    up: [
      ...empty(13),
      '.....aaaaaa.....',
      '....aaaaaaaa....',
      '....abbbbbba....',
      '....aaaaaaaa....',
      '....aaaaaaaa....',
      '.....bbbbbb.....',
      '................',
    ],
    side: [
      ...empty(14),
      '..aaa...........',
      '..aba...........',
      '..aaa...........',
      '..bbb...........',
      ...empty(2),
    ],
  },
  // Wreath of leaves with pink and cream flowers
  blumenkranz: same([
    '................',
    '................',
    '..bacabacabac...',
    '..aaaaaaaaaaaa..',
    ...empty(16),
  ]),
}

export type AccessoryColors = {
  a: PaletteToken
  b: PaletteToken
  c?: PaletteToken
  outline?: PaletteToken
}

/** Fixed colours; the bow is coloured by `accessoryColor` instead. */
export const ACCESSORY_COLORS: Partial<Record<AccessoryStyle, AccessoryColors>> = {
  hut: { a: 'hairBlond', b: 'rose', outline: 'goldDark' },
  brille: { a: 'ink', b: 'ink' },
  krone: { a: 'gold', b: 'rose', outline: 'goldDark' },
  blumenkranz: { a: 'mintDark', b: 'rose', c: 'cream' },
  malkrone: { a: 'gold', b: 'mint', outline: 'goldDark' },
  diadem: { a: 'gold', b: 'sky', c: 'lilac', outline: 'goldDark' },
  sternspange: { a: 'gold', b: 'gold', outline: 'goldDark' },
  glitzerkrone: { a: 'gold', b: 'sky', c: 'paperWhite', outline: 'goldDark' },
}
