// Größen (money) + Sachaufgaben with the game world (GAME_DESIGN §6). Max. 2 short sentences.
// L1 € und ct → ct · L2 Kommaschreibweise ↔ ct/€ · L3 "Wie viele fehlen noch?"
// L4 Preis · Anzahl · L5 Rückgeld (two steps)
import { euro, zahl } from '../format'
import { convertMoney, wordProblem } from '../hints'
import { pick, zufall } from '../random'
import type { Generator, Level, Rng, Task } from '../types'

const base = { topic: 'geld' as const }
const numpad = (unit: string) => ({ kind: 'numpad' as const, remainder: false, unit })

/** Things from the shop, with grammar for the sentences. */
const SHOP_ITEMS = [
  { one: 'Ein Kätzchen', name: 'Kätzchen' },
  { one: 'Ein Hündchen', name: 'Hündchen' },
  { one: 'Ein Ballkleid', name: 'Ballkleid' },
  { one: 'Eine Krone', name: 'Krone' },
  { one: 'Ein Hamster', name: 'Hamster' },
]
const SMALL_ITEMS = [
  { one: 'Eine Schleife', many: 'Schleifen' },
  { one: 'Ein Ball', many: 'Bälle' },
  { one: 'Ein Hut', many: 'Hüte' },
  { one: 'Ein Leckerli', many: 'Leckerlis' },
  { one: 'Ein Kissen', many: 'Kissen' },
]

function toCent(rng: Rng, level: Level, decimal: boolean): Task {
  const cent = zufall(rng, 1, 9) * 100 + zufall(rng, 1, 19) * 5
  const e = Math.floor(cent / 100)
  const c = cent % 100
  return {
    ...base,
    level,
    question: decimal ? `Wie viel Cent sind ${euro(cent)}?` : `Wie viel Cent sind ${e} € ${c} ct?`,
    answer: { value: cent },
    format: numpad('ct'),
    ...convertMoney('toCent', cent),
    math: { kind: 'convert', value: cent / 100, factor: 100, inverse: false },
  }
}

function toEuro(rng: Rng, level: Level): Task {
  const e = zufall(rng, 2, 20)
  return {
    ...base,
    level,
    question: `Wie viel Euro sind ${zahl(e * 100)} ct?`,
    answer: { value: e },
    format: numpad('€'),
    ...convertMoney('toEuro', e * 100),
    math: { kind: 'convert', value: e * 100, factor: 100, inverse: true },
  }
}

function missingCoins(rng: Rng, level: Level): Task {
  const item = pick(rng, SHOP_ITEMS)
  const price = zufall(rng, 20, 120) * 5
  const have = zufall(rng, 1, price / 5 - 1) * 5
  return {
    ...base,
    level,
    question: `${item.one} kostet ${zahl(price)} Münzen, du hast ${zahl(have)}. Wie viele fehlen noch?`,
    answer: { value: price - have },
    format: numpad('Münzen'),
    ...wordProblem(
      [`${zahl(price)} − ${zahl(have)} = ${zahl(price - have)}`],
      'Wie viel fehlt vom Geld, das du hast, bis zum Preis? Rechne minus.',
      price - have,
    ),
    math: { kind: 'calc', op: '-', operands: [price, have] },
  }
}

function priceTimesCount(rng: Rng, level: Level): Task {
  const item = pick(rng, SMALL_ITEMS)
  const price = zufall(rng, 2, 9)
  const count = zufall(rng, 2, 9)
  return {
    ...base,
    level,
    question: `${item.one} kostet ${price} €. Wie viel kosten ${count} ${item.many}?`,
    answer: { value: price * count },
    format: numpad('€'),
    ...wordProblem(
      [`${count} · ${price} € = ${price * count} €`],
      'Gleich viel, mehrmals: Rechne mal.',
      price * count,
    ),
    math: { kind: 'calc', op: '·', operands: [count, price] },
  }
}

function change(rng: Rng, level: Level): Task {
  const item = pick(rng, SMALL_ITEMS)
  const paid = pick(rng, [10, 20, 50])
  // At least 2 items and always some change left
  const price = zufall(rng, 2, Math.min(9, Math.floor((paid - 1) / 2)))
  const count = zufall(rng, 2, Math.min(9, Math.floor((paid - 1) / price)))
  const cost = price * count
  return {
    ...base,
    level,
    question: `Du kaufst ${count} ${item.many} zu je ${price} € und zahlst mit ${paid} €. Wie viel Rückgeld bekommst du?`,
    answer: { value: paid - cost },
    format: numpad('€'),
    ...wordProblem(
      [`${count} · ${price} € = ${cost} €`, `${paid} € − ${cost} € = ${paid - cost} €`],
      'Rechne zuerst, was alles zusammen kostet. Dann: Wie viel bleibt vom Geld übrig?',
      paid - cost,
    ),
    math: { kind: 'twoStep', a: count, op1: '·', b: price, op2: '-', c: paid },
  }
}

export const geld: Generator = (rng, level) => {
  switch (level) {
    case 1:
      return toCent(rng, level, false)
    case 2:
      return rng() < 0.5 ? toCent(rng, level, true) : toEuro(rng, level)
    case 3:
      return missingCoins(rng, level)
    case 4:
      return priceTimesCount(rng, level)
    case 5:
      return change(rng, level)
  }
}
