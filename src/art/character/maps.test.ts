import { describe, expect, it } from 'vitest'
import { mapSize, rasterize, validateMap } from '../pixels'
import { ACCESSORY_ROLES, accessories } from './accessory'
import { BODY_ROLES, body, legs } from './body'
import { HAIR_ROLES, hairstyles } from './hair'
import { CHAR_WIDTH, DIRECTIONS } from './look'
import { OUTFIT_ROLES, outfits } from './outfit'

const layers = [
  { name: 'body', roles: BODY_ROLES, variants: { body } },
  {
    name: 'outfit',
    roles: OUTFIT_ROLES,
    variants: Object.fromEntries(Object.entries(outfits).map(([k, o]) => [k, o.maps])),
  },
  { name: 'hair', roles: HAIR_ROLES, variants: hairstyles },
  { name: 'accessory', roles: ACCESSORY_ROLES, variants: accessories },
]

describe('character layer maps', () => {
  for (const { name, roles, variants } of layers) {
    for (const [variant, dirs] of Object.entries(variants)) {
      for (const dir of DIRECTIONS) {
        it(`${name}/${variant}/${dir} is 16 × 20 with known pixels`, () => {
          const map = dirs[dir]
          expect(() => validateMap(map, roles)).not.toThrow()
          expect(mapSize(map)).toEqual({ width: CHAR_WIDTH, height: 20 })
        })
      }
    }
  }

  it('keeps legs inside the frame', () => {
    for (const dir of DIRECTIONS) {
      for (const [full, lifted] of legs[dir]) {
        for (const x of [...full, ...lifted]) expect(x).toBeLessThan(CHAR_WIDTH)
      }
    }
  })

  it('keeps every outline inside the frame (no fill on the outer border)', () => {
    for (const { variants } of layers) {
      for (const dirs of Object.values(variants)) {
        for (const dir of DIRECTIONS) {
          const map = dirs[dir]
          for (const row of map) {
            expect(row[0]).toBe('.')
            expect(row.at(-1)).toBe('.')
          }
          expect(map[0]).toBe('.'.repeat(CHAR_WIDTH))
        }
      }
    }
  })
})

describe('rasterize', () => {
  it('adds a 1 px outline around filled pixels only', () => {
    const px = rasterize(['...', '.a.', '...'], { a: 1 }, 2)
    expect(px).toEqual([
      [null, 2, null],
      [2, 1, 2],
      [null, 2, null],
    ])
  })

  it('rejects ragged rows and unknown pixels', () => {
    expect(() => validateMap(['..', '...'], 'a')).toThrow()
    expect(() => validateMap(['.x'], 'a')).toThrow()
  })
})
