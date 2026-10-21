// Topics and levels (GAME_DESIGN §6). Each topic has levels 1–5; reaching a level gives a star.
import { einmaleins } from './generators/einmaleins'
import { geld } from './generators/geld'
import { halbschriftlich } from './generators/halbschriftlich'
import { kopfrechnen } from './generators/kopfrechnen'
import {
  schriftlichAddition,
  schriftlichDivision,
  schriftlichMultiplikation,
  schriftlichSubtraktion,
} from './generators/schriftlich'
import { zahlenraum } from './generators/zahlenraum'
import type { Answer, Generator, Level, Rng, Task, TopicId } from './types'

export type LevelInfo = {
  /** Short German description for the level picker */
  title: string
  /** Largest number that may appear in the task or answer */
  max: number
  /** Division tasks of this level have a remainder */
  remainder?: boolean
}

export type Topic = {
  id: TopicId
  title: string
  /** Learning hut where it is practised (GAME_DESIGN §3a) */
  hut: 'dojo' | 'werkstatt' | 'zahlenturm' | 'marktstand'
  /** Available in timed battles (GAME_DESIGN §6b) */
  battle: boolean
  generator: Generator
  levels: Record<Level, LevelInfo>
}

/** In build priority order (GAME_DESIGN §11, step 3). */
export const TOPICS: Topic[] = [
  {
    id: 'einmaleins',
    title: 'Einmaleins',
    hut: 'dojo',
    battle: true,
    generator: einmaleins,
    levels: {
      1: { title: 'Leichte Reihen: 1, 2, 5, 10', max: 100 },
      2: { title: 'Alle Malaufgaben', max: 100 },
      3: { title: 'Geteilt', max: 100 },
      4: { title: 'Gemischt mit Lücke', max: 100 },
      5: { title: 'Geteilt mit Rest', max: 100, remainder: true },
    },
  },
  {
    id: 'kopfrechnen',
    title: 'Kopfrechnen Plus/Minus',
    hut: 'zahlenturm',
    battle: true,
    generator: kopfrechnen,
    levels: {
      1: { title: 'Zehnerzahlen bis 1 000', max: 1000 },
      2: { title: 'Bis 1 000 mit Zehnern', max: 1000 },
      3: { title: 'Bis 1 000 mit Übergang', max: 1000 },
      4: { title: 'Tausender bis 1 Million', max: 1_000_000 },
      5: { title: 'Hunderter bis 100 000', max: 100_000 },
    },
  },
  {
    id: 'halbschriftlich',
    title: 'Halbschriftlich mal und geteilt',
    hut: 'werkstatt',
    battle: false,
    generator: halbschriftlich,
    levels: {
      1: { title: 'Mal mit Zehnern und Hundertern', max: 1000 },
      2: { title: 'Einer mal Zweistellige', max: 1000 },
      3: { title: 'Mal Zehnerzahl', max: 10_000 },
      4: { title: 'Zehnerzahlen geteilt', max: 1000 },
      5: { title: 'Geteilt mit Zerlegen', max: 1000 },
    },
  },
  {
    id: 'zahlenraum',
    title: 'Zahlenraum bis 1 Million',
    hut: 'zahlenturm',
    battle: false,
    generator: zahlenraum,
    levels: {
      1: { title: 'Welche Zahl ist größer?', max: 10_000 },
      2: { title: 'Vorgänger und Nachfolger', max: 100_000 },
      3: { title: 'Runden auf Zehner und Hunderter', max: 10_000 },
      4: { title: 'Runden auf Tausender', max: 1_000_000 },
      5: { title: 'Stellenwerte', max: 1_000_000 },
    },
  },
  {
    id: 'schriftlichAddition',
    title: 'Schriftlich plus',
    hut: 'werkstatt',
    battle: false,
    generator: schriftlichAddition,
    levels: {
      1: { title: 'Ohne Übertrag', max: 10_000 },
      2: { title: 'Mit Übertrag', max: 10_000 },
      3: { title: 'Vierstellig', max: 100_000 },
      4: { title: 'Drei Zahlen', max: 100_000 },
      5: { title: 'Große Zahlen', max: 1_000_000 },
    },
  },
  {
    id: 'schriftlichSubtraktion',
    title: 'Schriftlich minus',
    hut: 'werkstatt',
    battle: false,
    generator: schriftlichSubtraktion,
    levels: {
      1: { title: 'Ohne Entbündeln', max: 1000 },
      2: { title: 'Mit Entbündeln', max: 1000 },
      3: { title: 'Vierstellig', max: 10_000 },
      4: { title: 'Mit Nullen', max: 10_000 },
      5: { title: 'Große Zahlen', max: 1_000_000 },
    },
  },
  {
    id: 'schriftlichMultiplikation',
    title: 'Schriftlich mal',
    hut: 'werkstatt',
    battle: false,
    generator: schriftlichMultiplikation,
    levels: {
      1: { title: 'Zweistellig mal Einer', max: 1000 },
      2: { title: 'Dreistellig mal Einer', max: 10_000 },
      3: { title: 'Vierstellig mal Einer', max: 100_000 },
      4: { title: 'Zweistellig mal zweistellig', max: 10_000 },
      5: { title: 'Dreistellig mal zweistellig', max: 100_000 },
    },
  },
  {
    id: 'schriftlichDivision',
    title: 'Schriftlich geteilt',
    hut: 'werkstatt',
    battle: false,
    generator: schriftlichDivision,
    levels: {
      1: { title: 'Zweistellig', max: 100 },
      2: { title: 'Dreistellig', max: 1000 },
      3: { title: 'Dreistellig mit Rest', max: 1000, remainder: true },
      4: { title: 'Vierstellig', max: 10_000 },
      5: { title: 'Vierstellig mit Rest', max: 10_000, remainder: true },
    },
  },
  {
    id: 'geld',
    title: 'Geld und Sachaufgaben',
    hut: 'marktstand',
    battle: false,
    generator: geld,
    levels: {
      1: { title: 'Euro und Cent', max: 1000 },
      2: { title: 'Kommaschreibweise', max: 2000 },
      3: { title: 'Wie viel fehlt noch?', max: 1000 },
      4: { title: 'Preis mal Anzahl', max: 100 },
      5: { title: 'Rückgeld', max: 100 },
    },
  },
]

export function topic(id: TopicId): Topic {
  return TOPICS.find((t) => t.id === id)!
}

export function generateTask(id: TopicId, level: Level, rng: Rng = Math.random): Task {
  return topic(id).generator(rng, level)
}

/** Correct when the value and (if any) the remainder match. */
export function checkAnswer(task: Task, given: Answer): boolean {
  return (
    given.value === task.answer.value && (given.remainder ?? 0) === (task.answer.remainder ?? 0)
  )
}
