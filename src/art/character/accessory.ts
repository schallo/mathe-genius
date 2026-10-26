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
