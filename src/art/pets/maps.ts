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
  // Step 12 – the animals of the other islands, all round and friendly (STYLE_GUIDE §11)
  // Big round eyes and ear tufts
  eule: {
    map: [
      '..b........b..',
      '..bb......bb..',
      '..aaaaaaaaaa..',
      '.aaccaaaaccaa.',
      '.acceaaaaecca.',
      '.aaccabbaccaa.',
      '..aaaaaaaaaa..',
      '..aaccccccaa..',
      '..aaccccccaa..',
      '...aaaaaaaa...',
      '....bb..bb....',
      '..............',
    ],
    colors: { a: 'woodMid', b: 'woodDark', c: 'cream' },
    outline: 'woodEdge',
  },
  // Grey with a dark mask
  waschbaer: {
    map: [
      '..b........b..',
      '..ba......ab..',
      '..aaaaaaaaaa..',
      '.aaaaaaaaaaaa.',
      '.abbebaabebba.',
      '.aaaacppcaaaa.',
      '..aaaaaaaaaa..',
      '...aaaaaaaa...',
      '..aaaccccaaa..',
      '..aaaccccaaa..',
      '..bbb....bbb..',
      '..............',
    ],
    colors: { a: 'stone', b: 'hairBlack', c: 'cream' },
    outline: 'stoneDark',
  },
  // A fawn with white spots
  reh: {
    map: [
      '...b......b...',
      '..bba....abb..',
      '...aaaaaaaa...',
      '..aaaaaaaaaa..',
      '..aaeaaaaeaa..',
      '..aaaacpcaaa..',
      '...aaaaaaaa...',
      '..aacaaaacaa..',
      '..aaaaacaaaa..',
      '..acaaaaaaca..',
      '..b..b..b..b..',
      '..............',
    ],
    colors: { a: 'woodLight', b: 'woodDark', c: 'cream' },
    outline: 'woodDark',
  },
  // Stripes and a short mane
  zebra: {
    map: [
      '...b......b...',
      '..bbbbbbbbbb..',
      '..abababbaba..',
      '.aaaaaaaaaaaa.',
      '.aaeaaaaaaeaa.',
      '.baaaaccaaaab.',
      '..aaaccccaaa..',
      '..babaaaabab..',
      '..abaaaaaaba..',
      '..babaaaabab..',
      '..b..b..b..b..',
      '..............',
    ],
    colors: { a: 'paperWhite', b: 'hairBlack', c: 'stone' },
    outline: 'stoneDark',
  },
  // Little horns and brown patches
  giraffe: {
    map: [
      '...c......c...',
      '...a......a...',
      '..aaaaaaaaaa..',
      '.baaaaaaaaaab.',
      '..aaeaaaaeaa..',
      '..aaaaccaaaa..',
      '...aaaaaaaa...',
      '...abaaaaba...',
      '..aaaabaaaaa..',
      '..abaaaaabaa..',
      '..b..b..b..b..',
      '..............',
    ],
    colors: { a: 'hairBlond', b: 'woodMid', c: 'cream' },
    outline: 'woodDark',
  },
  // Big ears, a trunk and two tusks
  elefant: {
    map: [
      '..............',
      '.bb..aaaa..bb.',
      '.bbbaaaaaabbb.',
      '.bbbaeaaeabbb.',
      '.bbbaaaaaabbb.',
      '..bbaaaaaabb..',
      '...caaaaaac...',
      '..aaaaaaaaaa..',
      '..aaaaabaaaa..',
      '..aaaaabaaaa..',
      '..bbb....bbb..',
      '..............',
    ],
    colors: { a: 'stone', b: 'stoneDark', c: 'cream' },
    outline: 'stoneDark',
  },
  // A fluffy mane, never scary
  loewe: {
    map: [
      '...bbbbbbbb...',
      '..bbaaaaaabb..',
      '.bbaaaaaaaabb.',
      '.bbaeaaaaeabb.',
      '.bbaaacpcaabb.',
      '..bbaacccabb..',
      '...bbbbbbbb...',
      '..aaaaaaaaaa..',
      '..aaaccccaaa..',
      '..aaaccccaaa..',
      '..aa......aa..',
      '..............',
    ],
    colors: { a: 'gold', b: 'goldDark', c: 'cream' },
    outline: 'woodDark',
  },
  // Wings spread out and a crest
  flugsaurier: {
    map: [
      '......b.......',
      '.....aab......',
      '....aaaaac....',
      '....aeaaa.....',
      '.b..aaaaaa..b.',
      '.bbaaaaaaaabb.',
      '.bbbacccccabb.',
      '..bbaccccabb..',
      '...baaaaaab...',
      '.....a..a.....',
      '....bb..bb....',
      '..............',
    ],
    colors: { a: 'lilac', b: 'curtainLight', c: 'cream' },
    outline: 'curtainLight',
  },
  // A frill and three little horns
  triceratops: {
    map: [
      '.b..........b.',
      '.bbbbbbbbbbbb.',
      '.bbaaaaaaaabb.',
      '..bacaaaacab..',
      '...aeaaaaea...',
      '...aaacaaaa...',
      '....aaaaaa....',
      '..aaaaaaaaaa..',
      '..aaaccccaaa..',
      '..aaaccccaaa..',
      '..bbb....bbb..',
      '..............',
    ],
    colors: { a: 'hero', b: 'heroDark', c: 'cream' },
    outline: 'heroDark',
  },
  // A long neck up high
  brachiosaurus: {
    map: [
      '........aaa...',
      '.......aaeaa..',
      '.......aaaa...',
      '.......aaa....',
      '......aaa.....',
      '......aaa.....',
      '..aaaaaaaa....',
      '.aaaaaaaaaaa..',
      '.aaccccccaaaa.',
      '.aaaaaaaaaaa..',
      '..bb.bb.bb.bb.',
      '..............',
    ],
    colors: { a: 'grassLight', b: 'grassDark', c: 'cream' },
    outline: 'grassDark',
  },
  // Tiny arms and a toothy smile
  trex: {
    map: [
      '..............',
      '....aaaaaaa...',
      '...aaaaaaaaa..',
      '...aaaeaaaea..',
      '...aaaaaaaaa..',
      '...acacacaca..',
      '....aaaaaaa...',
      '...aaaccaaab..',
      '..aaaaccccaa..',
      '.aaaaaccccaa..',
      '...bb....bb...',
      '..............',
    ],
    colors: { a: 'grassMid', b: 'grassDark', c: 'cream' },
    outline: 'grassDark',
  },
  // White wings
  pegasus: {
    map: [
      '..............',
      '...aaaaaaaa...',
      '..aaaaaaaaaa..',
      '.caaeaaaaeaac.',
      '.ccaaappaaacc.',
      '.cccaaaaaaccc.',
      '..ccaaaaaacc..',
      '...aaaaaaaa...',
      '..aaabbbbaaa..',
      '..aaaaaaaaaa..',
      '..bb......bb..',
      '..............',
    ],
    colors: { a: 'sky', b: 'accentBlue', c: 'paperWhite' },
    outline: 'accentBlue',
  },
  // A golden horn and a lilac mane
  einhorn: {
    map: [
      '.......c......',
      '......cc......',
      '...aaaaaaaa...',
      '..baaaaaaaab..',
      '.bbaeaaaaeabb.',
      '.bbaaappaaabb.',
      '..baaaaaaaab..',
      '...aaaaaaaa...',
      '..aaaaaaaaaa..',
      '..aaaaaaaaaa..',
      '..cc......cc..',
      '..............',
    ],
    colors: { a: 'paperWhite', b: 'lilac', c: 'gold' },
    outline: 'stone',
  },
  // A little dragon with small wings and a golden belly
  drache: {
    map: [
      '..c........c..',
      '..ca......ac..',
      '..aaaaaaaaaa..',
      '.aaaaaaaaaaaa.',
      '.aaeaaaaaaeaa.',
      '.aaaaappaaaaa.',
      '.baaaaaaaaaab.',
      '.bbaaccccaabb.',
      '.bbaaccccaabb.',
      '..aaaaaaaaaa..',
      '..bbb....bbb..',
      '..............',
    ],
    colors: { a: 'mint', b: 'mintDark', c: 'gold' },
    outline: 'mintDark',
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
