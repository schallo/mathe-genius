// Naming rules for her character and pets (GAME_DESIGN §5 "Naming"). Pure logic.

export const MAX_NAME_LENGTH = 12

const ALLOWED = /^[A-Za-zÄÖÜäöüß -]$/

/** Cute suggestions for the "Zufall" button. */
export const NAME_SUGGESTIONS = [
  'Flocke',
  'Krümel',
  'Sternchen',
  'Mimi',
  'Pünktchen',
  'Keks',
  'Wuschel',
  'Momo',
  'Tapsi',
  'Bello',
  'Lucky',
  'Fleckchen',
  'Lotti',
  'Funkel',
  'Muffin',
  'Socke',
]

/** Letters, space and hyphen only; max. 12 characters; first letter capitalised. */
export function normalizeName(input: string): string {
  const kept = [...input].filter((ch) => ALLOWED.test(ch)).join('')
  const trimmed = kept.replace(/^[ -]+/, '').replace(/ {2,}/g, ' ')
  const limited = [...trimmed].slice(0, MAX_NAME_LENGTH).join('')
  if (!limited) return ''
  const [first, ...rest] = limited
  // ß has no single-letter uppercase form; keep it as it is
  return (first === 'ß' ? first : first.toUpperCase()) + rest.join('').toLowerCase()
}

/** Appends one typed key (letter, space or hyphen) and applies the rules. */
export function typeKey(name: string, key: string): string {
  if (!ALLOWED.test(key)) return name
  return normalizeName(name + key)
}

export function backspace(name: string): string {
  return [...name].slice(0, -1).join('')
}

/** A finished name has at least one letter and no trailing space or hyphen. */
export function finishName(name: string): string {
  return normalizeName(name).replace(/[ -]+$/, '')
}

export function randomName(rng: () => number = Math.random, avoid?: string): string {
  const choices = NAME_SUGGESTIONS.filter((n) => n !== avoid)
  return choices[Math.floor(rng() * choices.length)]
}
