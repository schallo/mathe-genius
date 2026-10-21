import { describe, expect, it } from 'vitest'
import { THEMEN, istRichtig, neueAufgabe } from './aufgaben'
import { seededRng } from './random'
import type { Aufgabe } from './types'

/** Rechnet den Anzeigetext unabhängig vom Generator nach. */
function nachrechnen(aufgabe: Aufgabe) {
  const [a, op, b] = aufgabe.text.split(' ')
  const x = Number(a)
  const y = Number(b)
  return op === '·' ? { ergebnis: x * y } : { ergebnis: Math.floor(x / y), rest: x % y }
}

describe.each(THEMEN.map((t) => t.id))('%s', (thema) => {
  const aufgaben = Array.from({ length: 2000 }, (_, i) => neueAufgabe(thema, seededRng(i)))

  it('hat immer die richtige Lösung', () => {
    for (const aufgabe of aufgaben) {
      expect(istRichtig(aufgabe, nachrechnen(aufgabe)), aufgabe.text).toBe(true)
    }
  })

  it('bleibt im Zahlenraum bis 1000', () => {
    for (const aufgabe of aufgaben) {
      for (const zahl of aufgabe.text.split(' ').filter((s) => /\d/.test(s))) {
        expect(Number(zahl)).toBeLessThanOrEqual(1000)
      }
      expect(aufgabe.loesung.ergebnis).toBeLessThanOrEqual(1000)
    }
  })
})

describe('geteilt-mit-rest', () => {
  it('hat immer einen Rest, der kleiner als der Teiler ist', () => {
    for (let i = 0; i < 2000; i++) {
      const aufgabe = neueAufgabe('geteilt-mit-rest', seededRng(i))
      const teiler = Number(aufgabe.text.split(' ')[2])
      expect(aufgabe.loesung.rest).toBeGreaterThan(0)
      expect(aufgabe.loesung.rest).toBeLessThan(teiler)
    }
  })
})

describe('istRichtig', () => {
  const aufgabe = neueAufgabe('geteilt-mit-rest', seededRng(1))

  it('verlangt auch den richtigen Rest', () => {
    expect(istRichtig(aufgabe, aufgabe.loesung)).toBe(true)
    expect(istRichtig(aufgabe, { ergebnis: aufgabe.loesung.ergebnis })).toBe(false)
  })
})
