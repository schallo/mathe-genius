// Her stage decor (GAME_DESIGN §4 "Bühne"): one bought item per slot is put up. Pure logic.
import { DECOR_SLOTS, item as findItem, type DecorSlot, type Item } from '../data/items'
import type { SaveData } from './save'

/** Slot → item id of what is put up */
export type StageDecor = Partial<Record<DecorSlot, string>>

/** Only real decor items in their own slot survive loading or importing a save. */
export function parseStage(input: unknown): StageDecor {
  const stage: StageDecor = {}
  if (!input || typeof input !== 'object') return stage
  for (const slot of DECOR_SLOTS) {
    const id = (input as Record<string, unknown>)[slot]
    if (typeof id === 'string' && findItem(id)?.decor?.slot === slot) stage[slot] = id
  }
  return stage
}

/** What is up on her stage: only items she owns. */
export function stageDecor(save: SaveData): StageDecor {
  const stage: StageDecor = {}
  for (const slot of DECOR_SLOTS) {
    const id = save.stage[slot]
    if (id && save.owned.includes(id)) stage[slot] = id
  }
  return stage
}

/** The stage with the item tried on (shop preview); other items change nothing. */
export function tryDecor(stage: StageDecor, item: Item): StageDecor {
  return item.decor ? { ...stage, [item.decor.slot]: item.id } : stage
}

export const isUp = (save: SaveData, item: Item): boolean =>
  !!item.decor && stageDecor(save)[item.decor.slot] === item.id

/** Puts the item up, or takes it down when it is up already (her plain stage comes back). */
export function toggleDecor(save: SaveData, item: Item): SaveData {
  if (!item.decor || !save.owned.includes(item.id)) return save
  const slot = item.decor.slot
  const stage = { ...save.stage }
  if (stage[slot] === item.id) delete stage[slot]
  else stage[slot] = item.id
  return { ...save, stage }
}
