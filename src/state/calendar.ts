// Daily calendar (GAME_DESIGN §7): a sticker for each day she finishes a round (a Theater
// show or a learning-hut round). 5 stickers in one week (Monday–Sunday) open the week's box.
// The box is never random: it holds the cheapest Schmuck or Spielzeug item she doesn't own
// yet (or coins when she has them all). Missing a day never removes anything. Pure logic.
import { ITEMS, type Item } from '../data/items'
import { earnCoins, type SaveData } from './save'

export type CalendarSave = {
  /** Local day "YYYY-MM-DD" → rounds finished that day */
  days: Record<string, number>
  /** Weeks (their Monday) whose box was opened */
  boxes: string[]
}

export const emptyCalendar = (): CalendarSave => ({ days: {}, boxes: [] })

export const STICKERS_FOR_BOX = 5
export const BOX_COINS = 40
/** Rounds per day before a friendly break message (parent setting) */
export const DEFAULT_ROUNDS_PER_DAY = 2

const pad = (n: number) => String(n).padStart(2, '0')

/** Local calendar day, e.g. "2026-10-26". */
export const dayKey = (date: Date) =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`

/** The Monday of the date's week (local time). */
export function weekStart(date: Date): Date {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7))
  return d
}

/** The seven days of the date's week, Monday first. */
export function weekDays(date: Date): string[] {
  const monday = weekStart(date)
  return Array.from({ length: 7 }, (_, i) =>
    dayKey(new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + i)),
  )
}

export const stickersThisWeek = (save: SaveData, date: Date) =>
  weekDays(date).filter((d) => (save.calendar.days[d] ?? 0) > 0).length

export const roundsToday = (save: SaveData, date: Date) => save.calendar.days[dayKey(date)] ?? 0

/** What the week's box holds right now (shown before she opens it, too). */
export function boxPrize(save: SaveData): Item | null {
  const candidates = ITEMS.filter(
    (i) =>
      (i.category === 'accessoires' || i.category === 'spielzeug') &&
      !i.starter &&
      !i.reward &&
      !i.starCost &&
      !i.species &&
      !save.owned.includes(i.id),
  )
  return candidates.sort((a, b) => a.price - b.price || a.id.localeCompare(b.id))[0] ?? null
}

export type RoundResult = {
  save: SaveData
  /** First round today: a new sticker */
  sticker: boolean
  rounds: number
  /** The week's box was opened: its item, or coins when there was none left */
  box?: { item: Item | null; coins: number }
  /** She reached the daily number of rounds: suggest a break (once) */
  suggestBreak: boolean
}

/** A finished round (Theater show or learning hut). */
export function recordRound(save: SaveData, date: Date, device: string): RoundResult {
  const key = dayKey(date)
  const rounds = (save.calendar.days[key] ?? 0) + 1
  let next: SaveData = {
    ...save,
    calendar: { ...save.calendar, days: { ...save.calendar.days, [key]: rounds } },
  }
  const sticker = rounds === 1
  let box: RoundResult['box']
  const week = weekDays(date)[0]
  if (
    sticker &&
    stickersThisWeek(next, date) >= STICKERS_FOR_BOX &&
    !next.calendar.boxes.includes(week)
  ) {
    const item = boxPrize(next)
    next = { ...next, calendar: { ...next.calendar, boxes: [...next.calendar.boxes, week] } }
    if (item) next = { ...next, owned: [...next.owned, item.id] }
    else next = earnCoins(next, BOX_COINS, device)
    box = { item, coins: item ? 0 : BOX_COINS }
  }
  const limit = save.settings.roundsPerDay
  return { save: next, sticker, rounds, box, suggestBreak: rounds === limit }
}

export function parseCalendar(input: unknown): CalendarSave {
  if (!input || typeof input !== 'object') return emptyCalendar()
  const raw = input as { days?: unknown; boxes?: unknown }
  const days: Record<string, number> = {}
  if (raw.days && typeof raw.days === 'object') {
    for (const [k, v] of Object.entries(raw.days)) {
      if (/^\d{4}-\d{2}-\d{2}$/.test(k) && Number.isInteger(v) && (v as number) > 0)
        days[k] = v as number
    }
  }
  const boxes = Array.isArray(raw.boxes)
    ? raw.boxes.filter((b): b is string => typeof b === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(b))
    : []
  return { days, boxes }
}

/** Sync: per day the higher count, all opened boxes. */
export function mergeCalendar(a: CalendarSave, b: CalendarSave): CalendarSave {
  const days = { ...a.days }
  for (const [k, v] of Object.entries(b.days)) days[k] = Math.max(days[k] ?? 0, v)
  return { days, boxes: [...new Set([...a.boxes, ...b.boxes])] }
}
