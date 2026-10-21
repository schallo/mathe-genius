// Palm tree (STYLE_GUIDE §9a): fronds in grass greens, curved trunk, coconuts. 12 × 16 px.
import { palette } from '../palette'
import { rasterize, type PixelMap } from './pixels'

export const PALM: PixelMap = [
  '............',
  '...aa..aa...',
  '..aaaaaaaa..',
  '.aaabaabaaa.',
  '.aa..cc..aa.',
  '.a...tc...a.',
  '.....t......',
  '.....tt.....',
  '......t.....',
  '......t.....',
  '......tt....',
  '.......t....',
  '.......t....',
  '......ttt...',
  '............',
  '............',
]

export const palmPixels = () =>
  rasterize(
    PALM,
    { a: palette.grassMid, b: palette.grassDark, c: palette.woodDark, t: palette.woodMid },
    palette.woodEdge,
  )
