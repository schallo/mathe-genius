// Pet sprites (STYLE_GUIDE §9 "Pets"): 14 × 12 px, round, front-facing, dot eyes.
// Roles: a = fur, b = darker fur (ears, paws), c = light fur (muzzle, belly),
// e = ink (eyes, nose), p = rose (nose, blush). Outline = darker shade.
import type { PaletteToken } from '../../palette'
import type { SpeciesId } from '../../data/creatures'
import type { PixelMap } from '../pixels'

export const PET_ROLES = 'abcep'
export const PET_WIDTH = 14
export const PET_HEIGHT = 12

export type PetArt = {
  map: PixelMap
  colors: { a: PaletteToken; b: PaletteToken; c: PaletteToken }
  outline: PaletteToken
}

export const petArt: Record<SpeciesId, PetArt> = {
  // Floppy ears hanging at the sides
  hund: {
    map: [
      '....aaaaaa....',
      '..baaaaaaaab..',
      '.bbaaaaaaaabb.',
      '.bbaeaaaaeabb.',
      '.bbaaaccaaabb.',
      '..baaceecaab..',
      '...aaaccaaa...',
      '..aaaaaaaaaa..',
      '..aaaccccaaa..',
      '..aaaccccaaa..',
      '..bbb....bbb..',
      '..............',
    ],
    colors: { a: 'woodMid', b: 'woodDark', c: 'cream' },
    outline: 'woodEdge',
  },
  // Pointy ears, pink nose and blush
  katze: {
    map: [
      '..a........a..',
      '..aa......aa..',
      '..aaaaaaaaaa..',
      '.aaaaaaaaaaaa.',
      '.aaaeaaaaeaaa.',
      '.apaaappaaapa.',
      '..aaaaaaaaaa..',
      '...aaaaaaaa...',
      '..aaaccccaaa..',
      '..aaaccccaaa..',
      '..bbb....bbb..',
      '..............',
    ],
    colors: { a: 'stone', b: 'stoneDark', c: 'cream' },
    outline: 'stoneDark',
  },
  // Round body with chubby cream cheeks
  hamster: {
    map: [
      '..............',
      '...b......b...',
      '..baaaaaaaab..',
      '.aaaaaaaaaaaa.',
      '.aaeaaaaaaeaa.',
      '.apaaappaaapa.',
      '.acccccccccca.',
      '.acccccccccca.',
      '..aaccccccaa..',
      '...aaaaaaaa...',
      '...bb....bb...',
      '..............',
    ],
    colors: { a: 'woodLight', b: 'woodMid', c: 'cream' },
    outline: 'woodDark',
  },
  // Wildtiere (GAME_DESIGN §6b): round and friendly, also in their wild form.
  // Spiky crown around a cream face
  igel: {
    map: [
      '...b.b..b.b...',
      '..bbbbbbbbbb..',
      '.bbbbbbbbbbbb.',
      '.bbbccccccbbb.',
      '.bbceccccecbb.',
      '.bbccceecccbb.',
      '.bbpccccccpbb.',
      '..bbccccccbb..',
      '..bbbccccbbb..',
      '...bbbbbbbb...',
      '...aa....aa...',
      '..............',
    ],
    colors: { a: 'woodDark', b: 'hairBrown', c: 'cream' },
    outline: 'woodEdge',
  },
  // Tufted ears and a big bushy tail on the side
  eichhoernchen: {
    map: [
      '..a....a......',
      '..aa..aa..bb..',
      '..aaaaaa.bbbb.',
      '.aaaaaaaabbbb.',
      '.aaeaaeaa.bbb.',
      '.apaeeapa.bbb.',
      '..aaccaa..bbb.',
      '..acccca.bbbb.',
      '..acccca.bbb..',
      '..aaaaaabbb...',
      '..bb..bb......',
      '..............',
    ],
    colors: { a: 'hairGinger', b: 'hairRed', c: 'cream' },
    outline: 'woodDark',
  },
  // Pointy dark-tipped ears, cream cheeks and chest
  fuchs: {
    map: [
      '.b..........b.',
      '.bb........bb.',
      '.abaaaaaaaaba.',
      '.aaaaaaaaaaaa.',
      '.aaeaaaaaaeaa.',
      '.apccceecccpa.',
      '..aaccccccaa..',
      '...aaccccaa...',
      '..aaaccccaaa..',
      '..aaaccccaaa..',
      '..bbb....bbb..',
      '..............',
    ],
    colors: { a: 'hero', b: 'heroDark', c: 'cream' },
    outline: 'woodEdge',
  },
}

/**
 * Sleeping face (STYLE_GUIDE §9a "Defeat"): the eye dots in the first row with eyes
 * become short closed lines "– –", drawn outwards.
 */
export function sleepingMap(map: PixelMap): PixelMap {
  const row = map.findIndex((r) => r.includes('e'))
  if (row < 0) return map
  const chars = [...map[row]]
  const eyes = chars.flatMap((ch, x) => (ch === 'e' ? [x] : []))
  const middle = (eyes[0] + eyes[eyes.length - 1]) / 2
  eyes.forEach((x) => {
    const side = x < middle ? x - 1 : x + 1
    if (chars[side] !== '.') chars[side] = 'e'
  })
  return map.map((r, y) => (y === row ? chars.join('') : r))
}

/** 5 px pixel heart shown above a happy pet. */
export const HEART: PixelMap = ['.a.a.', 'aaaaa', 'aaaaa', '.aaa.', '..a..']
