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
}

/** 5 px pixel heart shown above a happy pet. */
export const HEART: PixelMap = ['.a.a.', 'aaaaa', 'aaaaa', '.aaa.', '..a..']
