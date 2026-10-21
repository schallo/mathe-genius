// The one in-memory copy of the save data, written through to localStorage.
import { earnCoins, loadSave, writeSave, type SaveData } from './save'

const DEVICE_KEY = 'mathe-buehne-device'

function storage(): Storage | undefined {
  try {
    return window.localStorage
  } catch {
    return undefined
  }
}

let current: SaveData | null = null
const listeners = new Set<(save: SaveData) => void>()

export function getSave(): SaveData {
  current ??= loadSave(storage())
  return current
}

function commit(data: SaveData) {
  current = data
  writeSave(storage(), current)
  for (const listener of listeners) listener(current)
}

export function updateSave(change: (data: SaveData) => SaveData): SaveData {
  commit({ ...change(getSave()), updatedAt: Date.now() })
  return current!
}

/** Replaces the whole save, e.g. after merging with the cloud copy or an import. */
export function replaceSave(data: SaveData): void {
  commit(data)
}

/** Called after every change (the cloud sync uses this). Returns an unsubscribe function. */
export function onSaveChange(listener: (save: SaveData) => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

let device: string | null = null

/** Random id of this browser, kept outside the save (it must not be synced). */
export function deviceId(): string {
  if (device) return device
  try {
    device = window.localStorage.getItem(DEVICE_KEY)
    if (!device) {
      device = Math.random().toString(36).slice(2, 10)
      window.localStorage.setItem(DEVICE_KEY, device)
    }
  } catch {
    device = 'local'
  }
  return device
}

export function addCoins(amount: number): void {
  updateSave((save) => earnCoins(save, amount, deviceId()))
}
