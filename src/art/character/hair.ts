// Character layer 3: hairstyles. 16 × 20 px per direction, aligned with body.ts.
// Roles: a = hair, b = hair shade. Outline = hair shade.
// Styles must differ clearly in silhouette (STYLE_GUIDE §9).
import type { PixelMap } from '../pixels'

export const HAIR_ROLES = 'ab'

export type HairStyle = 'pferdeschwanz' | 'bob' | 'zoepfe'

const top = [
  '................',
  '.....aaaaaa.....',
  '...aaaaaaaaaa...',
  '..aaaaaaaaaaaa..',
  '..aaaaaaaaaaaa..',
  '..aaaaaaaaaaaa..',
]

const backHead = [
  ...top,
  '..aaaaaaaaaaaa..',
  '..aaaaaaaaaaaa..',
  '..aaaaaaaaaaaa..',
  '..aaaaaaaaaaaa..',
  '..aaaaaaaaaaaa..',
]

const sideHead = [
  ...top.slice(0, 5),
  '..aaaaaaaaaaab..',
  '..aaaaaaa.......',
  '..aaaaaa........',
  '..aaaaa.........',
  '..aaaaa.........',
  '..aaaa..........',
]

const empty = (rows: number) => Array.from({ length: rows }, () => '................')

const bob: Record<'down' | 'up' | 'side', PixelMap> = {
  down: [
    ...top,
    '..aab......baa..',
    '..aa........aa..',
    '..aa........aa..',
    '..aa........aa..',
    '..ab........ba..',
    '..bb........bb..',
    ...empty(8),
  ],
  up: [...backHead, '..bbbbbbbbbbbb..', ...empty(8)],
  side: [...sideHead, '..bbb...........', ...empty(8)],
}

const braids = ['.aa..........aa.', '.ab..........ba.', '.aa..........aa.', '.bb..........bb.']

const zoepfe: Record<'down' | 'up' | 'side', PixelMap> = {
  down: [
    ...top,
    '..aab......baa..',
    '..aa........aa..',
    '.aa..........aa.',
    '.aa..........aa.',
    '.ba..........ab.',
    ...braids,
    ...empty(5),
  ],
  up: [...backHead, ...braids, ...empty(5)],
  side: [
    ...sideHead,
    '.aaa............',
    '.ab.............',
    '.aa.............',
    '.bb.............',
    ...empty(5),
  ],
}

// Hair pulled back: forehead visible from the front, tail visible from behind and the side
const pferdeschwanz: Record<'down' | 'up' | 'side', PixelMap> = {
  down: [
    ...top.slice(0, 5),
    '..aa........aa..',
    '..a..........a..',
    '..b..........b..',
    ...empty(12),
  ],
  up: [
    ...backHead,
    '......aaaa......',
    '......aaaa......',
    '.......aa.......',
    '.......bb.......',
    ...empty(5),
  ],
  side: [
    '................',
    '.....aaaaaa.....',
    '...aaaaaaaaaa...',
    '..aaaaaaaaaaaa..',
    '.aaaaaaaaaaaaa..',
    '.aaaaaaaaaab....',
    '.aaaaaaa........',
    '.aaaaa..........',
    '.aa.............',
    '.ab.............',
    '.b..............',
    ...empty(9),
  ],
}

export const hairstyles: Record<HairStyle, Record<'down' | 'up' | 'side', PixelMap>> = {
  pferdeschwanz,
  bob,
  zoepfe,
}
