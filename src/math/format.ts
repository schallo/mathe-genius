// German school notation for numbers, money and operators.
import type { Op } from './types'

const NBSP = ' '

/** 4573 → "4 573", 45000 → "45 000" (non-breaking space as in German schoolbooks). */
export function zahl(n: number): string {
  const s = String(n)
  return n < 1000 ? s : s.replace(/\B(?=(\d{3})+(?!\d))/g, NBSP)
}

/** Cent → "4,50 €" (or "7 €" for whole euros). */
export function euro(cent: number): string {
  const e = Math.floor(cent / 100)
  const c = cent % 100
  return c === 0 ? `${zahl(e)} €` : `${zahl(e)},${String(c).padStart(2, '0')} €`
}

export const OP_SYMBOL: Record<Op, string> = { '+': '+', '-': '−', '·': '·', ':': ':' }

/** "47 · 6" */
export function term(op: Op, operands: number[]): string {
  return operands.map(zahl).join(` ${OP_SYMBOL[op]} `)
}

export function withRemainder(value: number, remainder?: number): string {
  return remainder ? `${zahl(value)} Rest ${zahl(remainder)}` : zahl(value)
}

export const PLACE_NAMES = [
  'Einer',
  'Zehner',
  'Hunderter',
  'Tausender',
  'Zehntausender',
  'Hunderttausender',
]

/** 100 → "Hunderter" */
export function placeName(place: number): string {
  return PLACE_NAMES[Math.round(Math.log10(place))]
}
