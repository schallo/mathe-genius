import { describe, expect, it } from 'vitest'
import { SPECIES, type SpeciesId } from '../../data/creatures'
import { mapSize, validateMap } from '../pixels'
import { HEART, PET_HEIGHT, PET_ROLES, PET_WIDTH, petArt, sleepingMap } from './maps'

describe('pet sprites', () => {
  for (const species of Object.keys(SPECIES) as SpeciesId[]) {
    it(`${species} is ${PET_WIDTH} × ${PET_HEIGHT} with known pixels and room for the outline`, () => {
      const { map } = petArt[species]
      expect(() => validateMap(map, PET_ROLES)).not.toThrow()
      expect(mapSize(map)).toEqual({ width: PET_WIDTH, height: PET_HEIGHT })
      for (const row of map) expect(row[0] + row.at(-1)).toBe('..')
    })
  }

  it('closes the eyes for sleeping without touching the outline column', () => {
    const asleep = sleepingMap(petArt.hund.map)
    expect(asleep[3]).toBe('.bbeeaaaaeebb.')
    expect(asleep.filter((r, y) => r !== petArt.hund.map[y])).toHaveLength(1)
  })

  it('has a 5 px heart', () => {
    expect(mapSize(HEART)).toEqual({ width: 5, height: 5 })
  })
})
