// Einmaleins-Dojo progress in the save (GAME_DESIGN §6a): fact answers, records, row
// medals and the grid reward. Pure logic; the scenes pay per-answer coins themselves.
import { ITEMS, type Item } from '../data/items'
import {
  ROW_MASTER_MS,
  factId,
  gridComplete,
  recordAnswer,
  type DojoOp,
  type Fact,
} from '../math/einmaleins'
import { DOJO_REWARD } from './economy'
import { earnCoins, earnStars, type DojoRecords, type SaveData } from './save'

export function recordFact(save: SaveData, fact: Fact, ok: boolean, ms: number): SaveData {
  const id = factId(fact)
  const stats = recordAnswer(save.dojo.facts[id], ok, ms, save.settings.knownMs)
  return { ...save, dojo: { ...save.dojo, facts: { ...save.dojo.facts, [id]: stats } } }
}

function setRecords(save: SaveData, op: DojoOp, change: Partial<DojoRecords>): SaveData {
  const records = { ...save.dojo.records, [op]: { ...save.dojo.records[op], ...change } }
  return { ...save, dojo: { ...save.dojo, records } }
}

export type BlitzResult = { save: SaveData; record: boolean; previous: number; bonus: number }

/** End of a Blitzrunde: a new personal best gives bonus coins. */
export function finishBlitz(
  save: SaveData,
  op: DojoOp,
  score: number,
  device: string,
): BlitzResult {
  const previous = save.dojo.records[op].blitz
  if (score <= previous) return { save, record: false, previous, bonus: 0 }
  const next = earnCoins(setRecords(save, op, { blitz: score }), DOJO_REWARD.record, device)
  return { save: next, record: true, previous, bonus: DOJO_REWARD.record }
}

export type DuelResult = {
  save: SaveData
  /** Faster than the ghost (needs an earlier record) */
  beatGhost: boolean
  /** First finished duel or faster than the ghost */
  record: boolean
  ghostMs: number | null
  bonus: number
  stars: number
}

/** End of a Turbo-Duell (all 20 facts solved). */
export function finishDuel(save: SaveData, op: DojoOp, ms: number, device: string): DuelResult {
  const ghostMs = save.dojo.records[op].duelMs
  const beatGhost = ghostMs !== null && ms < ghostMs
  const record = ghostMs === null || beatGhost
  if (!record) return { save, beatGhost, record, ghostMs, bonus: 0, stars: 0 }
  let next = setRecords(save, op, { duelMs: Math.round(ms) })
  next = earnCoins(next, DOJO_REWARD.record, device)
  const stars = beatGhost ? DOJO_REWARD.duelStar : 0
  if (stars) next = earnStars(next, stars, device)
  return { save: next, beatGhost, record, ghostMs, bonus: DOJO_REWARD.record, stars }
}

export type RowResult = {
  save: SaveData
  /** No mistake and in time */
  passed: boolean
  /** First medal for this row */
  newBadge: boolean
  bonus: number
}

/** End of Reihen-Meister: all 10 facts of a row without a mistake in under 30 s. */
export function finishRowMaster(
  save: SaveData,
  op: DojoOp,
  row: number,
  mistakes: number,
  ms: number,
  device: string,
): RowResult {
  const passed = mistakes === 0 && ms <= ROW_MASTER_MS
  const badges = save.dojo.records[op].badges
  if (!passed || badges.includes(row)) return { save, passed, newBadge: false, bonus: 0 }
  let next = setRecords(save, op, { badges: [...badges, row].sort((a, b) => a - b) })
  next = earnCoins(next, DOJO_REWARD.badge, device)
  return { save: next, passed, newBadge: true, bonus: DOJO_REWARD.badge }
}

/** The special item for a fully gold grid, if she has just earned it. */
export function gridReward(save: SaveData, op: DojoOp): { save: SaveData; item?: Item } {
  const item = ITEMS.find((i) => i.reward === op)
  if (!item || save.owned.includes(item.id) || !gridComplete(save.dojo.facts, op)) return { save }
  return { save: { ...save, owned: [...save.owned, item.id] }, item }
}
