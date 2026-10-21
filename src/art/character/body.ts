// Character layer 1: body + face. 16 × 20 px per direction; legs are added in code.
// Roles: a = skin, e = eye (ink), p = blush (rose). Outline = darker skin tone.
import type { PixelMap } from '../pixels'

export const BODY_ROLES = 'aep'

export const body: Record<'down' | 'up' | 'side', PixelMap> = {
  down: [
    '................',
    '................',
    '....aaaaaaaa....',
    '...aaaaaaaaaa...',
    '..aaaaaaaaaaaa..',
    '..aaaaaaaaaaaa..',
    '..aaaaaaaaaaaa..',
    '..aaaaaaaaaaaa..',
    '..aaaeaaaaeaaa..',
    '..aaaeaaaaeaaa..',
    '..aapaaaaaapaa..',
    '...aaaaaaaaaa...',
    '....aaaaaaaa....',
    '.....aaaaaa.....',
    '....aaaaaaaa....',
    '....aaaaaaaa....',
    '....aaaaaaaa....',
    '....aaaaaaaa....',
    '.....aaaaaa.....',
    '.....aaaaaa.....',
  ],
  up: [
    '................',
    '................',
    '....aaaaaaaa....',
    '...aaaaaaaaaa...',
    '..aaaaaaaaaaaa..',
    '..aaaaaaaaaaaa..',
    '..aaaaaaaaaaaa..',
    '..aaaaaaaaaaaa..',
    '..aaaaaaaaaaaa..',
    '..aaaaaaaaaaaa..',
    '..aaaaaaaaaaaa..',
    '...aaaaaaaaaa...',
    '....aaaaaaaa....',
    '.....aaaaaa.....',
    '....aaaaaaaa....',
    '....aaaaaaaa....',
    '....aaaaaaaa....',
    '....aaaaaaaa....',
    '.....aaaaaa.....',
    '.....aaaaaa.....',
  ],
  side: [
    '................',
    '................',
    '....aaaaaaaa....',
    '...aaaaaaaaaa...',
    '..aaaaaaaaaaaa..',
    '..aaaaaaaaaaaa..',
    '..aaaaaaaaaaaa..',
    '..aaaaaaaaaaaa..',
    '..aaaaaaaaeaaa..',
    '..aaaaaaaaeaaa..',
    '..aaaaaaaaaapa..',
    '...aaaaaaaaaa...',
    '....aaaaaaaa....',
    '.....aaaaaa.....',
    '.....aaaaaa.....',
    '.....aaaaaaa....',
    '.....aaaaaaa....',
    '.....aaaaaa.....',
    '.....aaaaaa.....',
    '.....aaaaaa.....',
  ],
}

/** Leg columns per walk frame (0 = standing, 1 and 2 = steps). Rows 20–21 below the body. */
export const legs: Record<'down' | 'up' | 'side', [number[], number[]][]> = {
  // [columns of the full-length legs, columns of the lifted legs]
  down: [
    [[5, 6, 9, 10], []],
    [
      [9, 10],
      [5, 6],
    ],
    [
      [5, 6],
      [9, 10],
    ],
  ],
  up: [
    [[5, 6, 9, 10], []],
    [
      [5, 6],
      [9, 10],
    ],
    [
      [9, 10],
      [5, 6],
    ],
  ],
  side: [
    [[6, 7, 9, 10], []],
    [[5, 6, 10, 11], []],
    [[7, 8], []],
  ],
}
