// Daily welcome from her pet (GAME_DESIGN §7): the first time she comes to the village on a
// day, her active pet greets her. Once a day, never a reminder or a nag. Pure logic.
import { texts } from '../data/texts'
import { dayKey } from './calendar'
import { activePet, type SaveData } from './save'

/** The greeting for today, or null when she was welcomed today already (or has no pet). */
export function welcomeFor(save: SaveData, date: Date): string | null {
  const pet = activePet(save)
  if (!pet || !save.character || save.welcomed === dayKey(date)) return null
  // A different greeting each day, the same one all day long
  const day = Math.floor(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / 86_400_000)
  const lines = texts.village.welcome
  return lines[day % lines.length](pet.name, save.character.name)
}

export const markWelcomed = (save: SaveData, date: Date): SaveData => ({
  ...save,
  welcomed: dayKey(date),
})
