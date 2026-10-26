// Buying, wearing, adopting and the wish goal (GAME_DESIGN §4). Pure logic.
import type { CharacterLook } from '../art/character/look'
import { ITEMS, item as findItem, type Item } from '../data/items'
import { addPet, coinBalance, spendCoins, spendStars, starBalance, type SaveData } from './save'

export function isOwned(save: SaveData, item: Item): boolean {
  return !!item.starter || save.owned.includes(item.id)
}

export function canAfford(save: SaveData, item: Item): boolean {
  return coinBalance(save) >= item.price && missingStars(save, item) === 0
}

/** Stars still missing for a star item (0 when she has enough or it needs none). */
export function missingStars(save: SaveData, item: Item): number {
  return Math.max(0, (item.starCost ?? 0) - starBalance(save))
}

/** Coins still missing for an item (0 when she can buy it). */
export function missingCoins(save: SaveData, item: Item): number {
  return Math.max(0, item.price - coinBalance(save))
}

/** The look with the item put on, for trying on before buying. */
export function tryOn(look: CharacterLook, item: Item): CharacterLook {
  return item.wear ? { ...look, ...item.wear } : look
}

/** Wearing the garment, hairstyle or accessory – whatever colour she picked for it. */
export function isWearing(look: CharacterLook, item: Item): boolean {
  if (!item.wear) return false
  return Object.entries(item.wear)
    .filter(([k]) => !k.endsWith('Color'))
    .every(([k, v]) => look[k as keyof CharacterLook] === v)
}

export type BuyResult =
  { ok: true; save: SaveData } | { ok: false; reason: 'owned' | 'coins' | 'pet' }

/** Buys an item and puts it on right away. Pets are adopted with `adopt` instead. */
export function buy(save: SaveData, item: Item, device: string): BuyResult {
  if (item.species) return { ok: false, reason: 'pet' }
  if (isOwned(save, item)) return { ok: false, reason: 'owned' }
  if (!canAfford(save, item)) return { ok: false, reason: 'coins' }
  let next = spendCoins(save, item.price, device)
  if (item.starCost) next = spendStars(next, item.starCost, device)
  next = {
    ...next,
    owned: [...next.owned, item.id],
    wish: next.wish === item.id ? null : next.wish,
  }
  if (item.wear && next.character) {
    next = { ...next, character: { ...next.character, look: tryOn(next.character.look, item) } }
  }
  return { ok: true, save: next }
}

/** Adopts a pet from the Tierheim and gives it its name. */
export function adopt(save: SaveData, item: Item, name: string, device: string): BuyResult {
  if (!item.species) return { ok: false, reason: 'pet' }
  if (!canAfford(save, item)) return { ok: false, reason: 'coins' }
  const next = addPet(spendCoins(save, item.price, device), item.species, name)
  return { ok: true, save: { ...next, wish: next.wish === item.id ? null : next.wish } }
}

export function setWish(save: SaveData, item: Item | null): SaveData {
  return { ...save, wish: item?.id ?? null }
}

export type WishProgress = { item: Item; missing: number; ratio: number }

export function wishProgress(save: SaveData): WishProgress | null {
  const wished = save.wish ? findItem(save.wish) : undefined
  if (!wished) return null
  const missing = missingCoins(save, wished)
  return { item: wished, missing, ratio: wished.price ? 1 - missing / wished.price : 1 }
}

/** Items she can still buy in the shop (pets are in the Tierheim, rewards are earned). */
export function shopItems(category: Item['category']): Item[] {
  return ITEMS.filter((i) => i.category === category && !i.starter && !i.species && !i.reward)
}

export function ownedItems(save: SaveData, category: Item['category']): Item[] {
  return ITEMS.filter((i) => i.category === category && !i.species && isOwned(save, i))
}

export const adoptablePets = (): Item[] => ITEMS.filter((i) => i.species)
