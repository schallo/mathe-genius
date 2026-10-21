/** Zufallsquelle: liefert eine Zahl in [0, 1). In Tests mit festem Seed ersetzbar. */
export type Rng = () => number

export type Thema = 'kleines-einmaleins' | 'mal-bis-1000' | 'geteilt-ohne-rest' | 'geteilt-mit-rest'

export type Antwort = { ergebnis: number; rest?: number }

export type Aufgabe = {
  thema: Thema
  /** Anzeigetext, z. B. "7 · 8" oder "47 : 5" */
  text: string
  loesung: Antwort
}
