// Character layer 2: outfits. 16 × 20 px per direction, aligned with body.ts.
// Roles: a = cloth, b = cloth shade. Outline = cloth shade.
import type { PixelMap } from '../pixels'

export const OUTFIT_ROLES = 'ab'

export type OutfitStyle = 'kleid' | 'ballkleid' | 'fussball' | 'regenmantel'

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

const top13 = kleid.slice(0, 13)

// Wide gown down to the feet
const ballkleid: PixelMap = [
  ...top13,
  '.....aaaaaa.....',
  '....aaaaaaaa....',
  '....aaaaaaaa....',
  '......aaaa......',
  '.....aaaaaa.....',
  '...aaaaaaaaaa...',
  '.bbbbbbbbbbbbbb.',
]

// Jersey (a) with shorts (b) – she plays football
const fussball: PixelMap = [
  ...top13,
  '.....aaaaaa.....',
  '....aaaaaaaa....',
  '....aaaaaaaa....',
  '......aaaa......',
  '.....bbbbbb.....',
  '.....bb..bb.....',
  '................',
]

// Long coat with buttons
const regenmantel: PixelMap = [
  ...top13,
  '.....aaaaaa.....',
  '....aaaaaaaa....',
  '....aaaabaaa....',
  '......aaaa......',
  '.....aaabaa.....',
  '.....aaaaaa.....',
  '.....bbbbbb.....',
]

const same = (map: PixelMap) => ({ down: map, up: map, side: map })

export const outfits: Record<OutfitStyle, Record<'down' | 'up' | 'side', PixelMap>> = {
  kleid: { down: kleid, up: kleid, side: kleidSide },
  ballkleid: same(ballkleid),
  fussball: same(fussball),
  regenmantel: same(regenmantel),
}
