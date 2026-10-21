// The one in-memory copy of the save data, written through to localStorage.
import { loadSave, writeSave, type SaveData } from './save'

function storage(): Storage | undefined {
  try {
    return window.localStorage
  } catch {
    return undefined
  }
}

let current: SaveData | null = null

export function getSave(): SaveData {
  current ??= loadSave(storage())
  return current
}

export function updateSave(change: (data: SaveData) => SaveData): SaveData {
  current = change(getSave())
  writeSave(storage(), current)
  return current
}
