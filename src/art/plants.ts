// Village plants (STYLE_GUIDE §9a): palms, a round leafy tree, a fir and bushes, in grass
// greens with a 1 px wood-edge outline. Sizes and walk-blocking feet are in world/village.ts.
import { palette } from '../palette'
import type { PlantKind } from '../world/village'
import { PALM } from './palm'
import { rasterize, type PixelMap } from './pixels'

const SMALL_PALM: PixelMap = [
  '..........',
  '..aa..aa..',
  '.aaaaaaaa.',
  '.aabaabaa.',
  '.a..cc..a.',
  '....tc....',
  '....t.....',
  '....tt....',
  '.....t....',
  '.....t....',
  '....ttt...',
  '..........',
]

/** Round leafy tree: light from the top left, shade bottom right */
const TREE: PixelMap = [
  '..............',
  '....aaaaa.....',
  '..aallaaaaa...',
  '.aallaaaaaab..',
  '.alaaaaaaaab..',
  'aaaaaaaaaaabb.',
  'aaaaaaaaaabbb.',
  '.aaaaaaaabbb..',
  '.abaaaabbbbb..',
  '..bbbbbbbbb...',
  '....bbtbb.....',
  '......t.......',
  '......td......',
  '......td......',
  '.....tttd.....',
  '..............',
]

const FIR: PixelMap = [
  '....aa....',
  '....aa....',
  '...aaab...',
  '...aabb...',
  '..aaaabb..',
  '...aabb...',
  '..aaaabb..',
  '.aaaaabbb.',
  '..aaaabb..',
  '.aaaaabbb.',
  'aaaaaabbbb',
  '....td....',
  '....td....',
  '....td....',
  '..........',
  '..........',
]

const BUSH: PixelMap = [
  '..........',
  '...aaaa...',
  '.aallaaab.',
  'aalaaaaabb',
  'aaaaaaabbb',
  '.abbbbbbb.',
  '..........',
  '..........',
]

const FLOWER_BUSH: PixelMap = [
  '..........',
  '...aara...',
  '.aalcaarb.',
  'aaraaacabb',
  'aaaaraabbb',
  '.abbbbbbb.',
  '..........',
  '..........',
]

const MAPS: Record<PlantKind, PixelMap> = {
  palm: PALM,
  smallPalm: SMALL_PALM,
  tree: TREE,
  fir: FIR,
  bush: BUSH,
  flowerBush: FLOWER_BUSH,
}

const LEGEND = {
  a: palette.grassMid,
  b: palette.grassDark,
  l: palette.grassLight,
  c: palette.cream,
  r: palette.rose,
  t: palette.woodMid,
  d: palette.woodDark,
}

export const plantPixels = (kind: PlantKind) => {
  // Palms have coconuts (c) in wood-dark instead of cream flowers
  const legend =
    kind === 'palm' || kind === 'smallPalm' ? { ...LEGEND, c: palette.woodDark } : LEGEND
  return rasterize(MAPS[kind], legend, palette.woodEdge)
}

export const plantMap = (kind: PlantKind) => MAPS[kind]
