// Character layer 2: outfits. 16 × 20 px per direction, aligned with body.ts.
// Roles: a = top, b = top shade, c = bottom (trousers, skirt), d = bottom shade.
// Top and bottom have their own colour (`outfitColor`, `outfitColor2`) and outline.
// Outfits with `longLegs` also colour the walking legs (trousers, see textures.ts).
import type { PixelMap } from '../pixels'

export const OUTFIT_ROLES = 'abcd'

export type OutfitStyle =
  | 'kleid'
  | 'ballkleid'
  | 'fussball'
  | 'regenmantel'
  | 'shirt'
  | 'pulli'
  | 'schlafanzug'
  | 'latzhose'
  | 'hoodie'

type Maps = Record<'down' | 'up' | 'side', PixelMap>

export type OutfitDef = {
  maps: Maps
  /** Has a bottom part (c, d) with its own colour */
  twoTone: boolean
  /** Long trousers: the walking legs get the bottom colour */
  longLegs: boolean
}

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

const top12 = kleid.slice(0, 12)
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

// T-shirt (top colour) and long trousers (bottom colour)
const shirt: PixelMap = [
  ...top13,
  '.....aaaaaa.....',
  '....aaaaaaaa....',
  '....baaaaaab....',
  '.....aaaaaa.....',
  '.....cccccc.....',
  '.....cccccc.....',
  '.....cc..cc.....',
]

// Jumper with cuffs and a skirt
const pulli: PixelMap = [
  ...top13,
  '.....aaaaaa.....',
  '....aaaaaaaa....',
  '....aaaaaaaa....',
  '....baaaaaab....',
  '.....bbbbbb.....',
  '....cccccccc....',
  '...dddddddddd...',
]

// Pyjamas: striped top, long trousers
const schlafanzug: PixelMap = [
  ...top13,
  '.....aaaaaa.....',
  '....bbbbbbbb....',
  '....aaaaaaaa....',
  '.....bbbbbb.....',
  '.....cccccc.....',
  '.....cccccc.....',
  '.....cc..cc.....',
]

// Dungarees (bottom colour) over a shirt (top colour)
const latzhose: PixelMap = [
  ...top13,
  '.....aaaaaa.....',
  '....acaaaaca....',
  '....acccccca....',
  '.....cccdcc.....',
  '.....cccccc.....',
  '.....cccccc.....',
  '.....cc..cc.....',
]

// Hoodie with a pocket (top colour) and jeans; the hood shows from behind
const hoodieDown: PixelMap = [
  ...top13,
  '....baaaaaab....',
  '....aaaaaaaa....',
  '....aabbbbaa....',
  '.....aaaaaa.....',
  '.....cccccc.....',
  '.....cccccc.....',
  '.....cc..cc.....',
]
const hoodieUp: PixelMap = [
  ...top12,
  '....aaaaaaaa....',
  '....abbbbbba....',
  '....aaaaaaaa....',
  '....aaaaaaaa....',
  '.....aaaaaa.....',
  '.....cccccc.....',
  '.....cccccc.....',
  '.....cc..cc.....',
]

const same = (map: PixelMap): Maps => ({ down: map, up: map, side: map })

export const outfits: Record<OutfitStyle, OutfitDef> = {
  kleid: { maps: { down: kleid, up: kleid, side: kleidSide }, twoTone: false, longLegs: false },
  ballkleid: { maps: same(ballkleid), twoTone: false, longLegs: false },
  fussball: { maps: same(fussball), twoTone: false, longLegs: false },
  regenmantel: { maps: same(regenmantel), twoTone: false, longLegs: false },
  shirt: { maps: same(shirt), twoTone: true, longLegs: true },
  pulli: { maps: same(pulli), twoTone: true, longLegs: false },
  schlafanzug: { maps: same(schlafanzug), twoTone: true, longLegs: true },
  latzhose: { maps: same(latzhose), twoTone: true, longLegs: true },
  hoodie: {
    maps: { down: hoodieDown, up: hoodieUp, side: hoodieDown },
    twoTone: true,
    longLegs: true,
  },
}
