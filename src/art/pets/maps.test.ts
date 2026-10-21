import { describe, expect, it } from 'vitest'
import { STARTERS } from '../../data/creatures'
import { mapSize, validateMap } from '../pixels'
import { HEART, PET_HEIGHT, PET_ROLES, PET_WIDTH, petArt } from './maps'

describe('pet sprites', () => {
  for (const species of STARTERS) {
    it(`${species} is ${PET_WIDTH} × ${PET_HEIGHT} with known pixels and room for the outline`, () => {
      const { map } = petArt[species]
      expect(() => validateMap(map, PET_ROLES)).not.toThrow()
      expect(mapSize(map)).toEqual({ width: PET_WIDTH, height: PET_HEIGHT })
      for (const row of map) expect(row[0] + row.at(-1)).toBe('..')
    })
  }

  it('has a 5 px heart', () => {
    expect(mapSize(HEART)).toEqual({ width: 5, height: 5 })
  })
})
