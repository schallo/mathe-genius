// Character layer 2: outfits. 16 × 20 px per direction, aligned with body.ts.
// Roles: a = cloth, b = cloth shade. Outline = cloth shade.
import type { PixelMap } from '../pixels'

export const OUTFIT_ROLES = 'ab'

export type OutfitStyle = 'kleid'

const kleid: PixelMap = [
  '................',
  '................',
  '................',
  '................',
  '................',
  '................',
  '................',
  '................',
  '................',
  '................',
  '................',
  '................',
  '................',
  '.....aaaaaa.....',
  '....aaaaaaaa....',
  '....aaaaaaaa....',
  '......aaaa......',
  '......aaaa......',
  '....aaaaaaaa....',
  '...bbbbbbbbbb...',
]

const kleidSide: PixelMap = [
  ...kleid.slice(0, 13),
  '.....aaaaaa.....',
  '.....aaaaaa.....',
  '......aaaa......',
  '......aaaa......',
  '.....aaaaaa.....',
  '....aaaaaaaa....',
  '...bbbbbbbbbb...',
]

export const outfits: Record<OutfitStyle, Record<'down' | 'up' | 'side', PixelMap>> = {
  kleid: { down: kleid, up: kleid, side: kleidSide },
}
