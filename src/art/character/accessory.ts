// Character layer 4: accessories. 16 × 20 px per direction, aligned with body.ts.
// Roles: a = main colour, b = shade. Outline = shade.
import type { PixelMap } from '../pixels'

export const ACCESSORY_ROLES = 'ab'

export type AccessoryStyle = 'schleife'

const bowRight = ['..........aa.aa.', '...........aba..', '..........aa.aa.']
const bowLeft = ['.aa.aa..........', '..aba...........', '.aa.aa..........']
const rest = Array.from({ length: 16 }, () => '................')

export const accessories: Record<AccessoryStyle, Record<'down' | 'up' | 'side', PixelMap>> = {
  schleife: {
    down: ['................', ...bowRight, ...rest],
    up: ['................', ...bowLeft, ...rest],
    side: ['................', ...bowLeft, ...rest],
  },
}
