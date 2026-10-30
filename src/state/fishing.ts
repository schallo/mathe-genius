// Rewards for fishing at the pond (NOTES "Fishing mini game"). Pure logic.
// Goldi, a goldfish in a water bubble, jumps in the pond until she catches her: every catch
// has a growing chance to be Goldi (1/50 for the first fish, 2/50 for the second …), so
// she comes at the 50th catch at the latest. Every other catch gives one star, at most
// three a day; more catches are just for fun. Never coins: math stays the only way to earn
// coins.
import { SPECIES } from '../data/creatures'
import { dayKey } from './calendar'
import { hasUnique } from './shop'
import { addPet, earnStars, type SaveData } from './save'

export const FISHING_STARS_PER_DAY = 3
/** Goldi bites at the latest with this catch */
export const GOLDI_BY_CATCH = 50

/** Chance that catch number `n` (1, 2, …) is Goldi, while she isn't caught yet. */
export const goldiChance = (n: number): number => Math.min(1, n / GOLDI_BY_CATCH)

/** Goldi still swims in the pond (and jumps out of the water now and then). */
export const goldiInPond = (save: SaveData): boolean => !hasUnique(save, 'goldi')
/** The Angel from the Laden opens the fishing game at the pond */
export const ROD_ITEM = 'angel'

export type FishingSave = {
  /** Fish caught in all */
  catches: number
  /** Local day → stars from fishing that day */
  days: Record<string, number>
}

export const emptyFishing = (): FishingSave => ({ catches: 0, days: {} })

export type CatchReward = 'goldi' | 'star' | 'none'

export const fishingStarsToday = (save: SaveData, date: Date): number =>
  save.fishing.days[dayKey(date)] ?? 0

export function recordCatch(
  save: SaveData,
  date: Date,
  device: string,
  rng: () => number = Math.random,
): { save: SaveData; reward: CatchReward } {
  const catches = save.fishing.catches + 1
  let next = { ...save, fishing: { ...save.fishing, catches } }
  if (goldiInPond(save) && rng() < goldiChance(catches)) {
    next = addPet(next, 'goldi', SPECIES.goldi.uniqueName!)
    return { save: next, reward: 'goldi' }
  }
  const today = dayKey(date)
  const stars = save.fishing.days[today] ?? 0
  if (stars >= FISHING_STARS_PER_DAY) return { save: next, reward: 'none' }
  next = earnStars(next, 1, device)
  next = {
    ...next,
    fishing: { ...next.fishing, days: { ...next.fishing.days, [today]: stars + 1 } },
  }
  return { save: next, reward: 'star' }
}

const count = (n: unknown) => (Number.isInteger(n) && (n as number) >= 0 ? (n as number) : 0)

export function parseFishing(input: unknown): FishingSave {
  if (!input || typeof input !== 'object') return emptyFishing()
  const raw = input as { catches?: unknown; days?: unknown }
  const days: Record<string, number> = {}
  if (raw.days && typeof raw.days === 'object') {
    for (const [k, v] of Object.entries(raw.days)) {
      if (/^\d{4}-\d{2}-\d{2}$/.test(k) && count(v) > 0) {
        days[k] = Math.min(FISHING_STARS_PER_DAY, count(v))
      }
    }
  }
  return { catches: count(raw.catches), days }
}

/** Both devices' catches and stars per day only grow, so the bigger value wins. */
export function mergeFishing(a: FishingSave, b: FishingSave): FishingSave {
  const days = { ...a.days }
  for (const [k, v] of Object.entries(b.days)) days[k] = Math.max(days[k] ?? 0, v)
  return { catches: Math.max(a.catches, b.catches), days }
}
