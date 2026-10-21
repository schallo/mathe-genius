import { zufall } from './random'
import type { Antwort, Aufgabe, Rng, Thema } from './types'

export const THEMEN: { id: Thema; titel: string; emoji: string }[] = [
  { id: 'kleines-einmaleins', titel: 'Kleines 1×1', emoji: '✖️' },
  { id: 'mal-bis-1000', titel: 'Mal bis 1000', emoji: '🚀' },
  { id: 'geteilt-ohne-rest', titel: 'Geteilt', emoji: '🍕' },
  { id: 'geteilt-mit-rest', titel: 'Geteilt mit Rest', emoji: '🧩' },
]

const generatoren: Record<Thema, (rng: Rng) => Aufgabe> = {
  'kleines-einmaleins': (rng) => {
    const a = zufall(rng, 2, 10)
    const b = zufall(rng, 2, 10)
    return { thema: 'kleines-einmaleins', text: `${a} · ${b}`, loesung: { ergebnis: a * b } }
  },

  // Zehnerzahl mal Einer (30 · 7) oder zweistellig mal Einer (23 · 4), Ergebnis ≤ 1000
  'mal-bis-1000': (rng) => {
    const b = zufall(rng, 2, 9)
    const max = Math.floor(1000 / b)
    const a =
      rng() < 0.5 ? zufall(rng, 1, Math.floor(max / 10)) * 10 : zufall(rng, 11, Math.min(99, max))
    return { thema: 'mal-bis-1000', text: `${a} · ${b}`, loesung: { ergebnis: a * b } }
  },

  // Umkehraufgabe zum kleinen 1×1: (a · b) : b = a
  'geteilt-ohne-rest': (rng) => {
    const b = zufall(rng, 2, 10)
    const a = zufall(rng, 2, 10)
    return { thema: 'geteilt-ohne-rest', text: `${a * b} : ${b}`, loesung: { ergebnis: a } }
  },

  'geteilt-mit-rest': (rng) => {
    const b = zufall(rng, 2, 9)
    const a = zufall(rng, 1, 10)
    const rest = zufall(rng, 1, b - 1)
    return {
      thema: 'geteilt-mit-rest',
      text: `${a * b + rest} : ${b}`,
      loesung: { ergebnis: a, rest },
    }
  },
}

export function neueAufgabe(thema: Thema, rng: Rng = Math.random): Aufgabe {
  return generatoren[thema](rng)
}

export function istRichtig(aufgabe: Aufgabe, antwort: Antwort): boolean {
  return (
    antwort.ergebnis === aufgabe.loesung.ergebnis &&
    (antwort.rest ?? 0) === (aufgabe.loesung.rest ?? 0)
  )
}
