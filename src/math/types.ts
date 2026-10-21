// Shared types of the math engine. Pure TypeScript, no Phaser.

/** Random source returning [0, 1). Seeded in tests (see random.ts). */
export type Rng = () => number

export type Level = 1 | 2 | 3 | 4 | 5
export const LEVELS: Level[] = [1, 2, 3, 4, 5]

export type TopicId =
  | 'einmaleins'
  | 'kopfrechnen'
  | 'halbschriftlich'
  | 'zahlenraum'
  | 'schriftlichAddition'
  | 'schriftlichSubtraktion'
  | 'schriftlichMultiplikation'
  | 'schriftlichDivision'
  | 'geld'

export type Op = '+' | '-' | '·' | ':'

/** Machine-readable description of what the task asks; tests recompute answers from it. */
export type MathSpec =
  | { kind: 'calc'; op: Op; operands: number[] }
  | { kind: 'missingFactor'; factor: number; product: number }
  /** Two-step word problem: c op2 (a op1 b), e.g. paid − (count · price) */
  | { kind: 'twoStep'; a: number; op1: Op; b: number; op2: Op; c: number }
  | { kind: 'compare'; numbers: number[] }
  | { kind: 'round'; n: number; to: number }
  | { kind: 'neighbour'; n: number; dir: -1 | 1 }
  | { kind: 'digit'; n: number; place: number }
  | { kind: 'convert'; value: number; factor: number; inverse: boolean }

export type Answer = { value: number; remainder?: number }

export type Option = { label: string; value: number }

export type TaskFormat =
  /** Big number pad; `remainder` adds a second field; `unit` is shown after the field */
  | { kind: 'numpad'; remainder: boolean; unit?: string }
  /** 2–4 options to tap */
  | { kind: 'choice'; options: Option[] }
  /** Written calculation grid (schriftlich): column layout filled from right to left */
  | { kind: 'written'; op: Op; operands: number[]; remainder: boolean }

export type Task = {
  question: string
  answer: Answer
  format: TaskFormat
  /** Shown after the first wrong answer: teaches the method, not the result */
  hintSteps: string[]
  /** Shown after the second wrong answer: the full worked solution */
  solutionSteps: string[]
  topic: TopicId
  level: Level
  math: MathSpec
}

export type Generator = (rng: Rng, level: Level) => Task
