import { describe, expect, it } from 'vitest'
import { ART_SIZES } from './wild'

describe('wild island sprites', () => {
  for (const [name, size] of Object.entries(ART_SIZES)) {
    it(`${name} matches its size in the layout data`, () => {
      expect({ w: size.w, h: size.h }).toEqual({ w: size.expected.w, h: size.expected.h })
    })
  }
})
