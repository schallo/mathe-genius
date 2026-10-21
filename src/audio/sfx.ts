// Soft, short sound effects synthesised with WebAudio (STYLE_GUIDE §10): plucks, chimes,
// a gentle "boop" for mistakes – never a buzzer. No audio files, works offline.
import { getSave, updateSave } from '../state/store'

let ctx: AudioContext | null = null

function audio(): AudioContext | null {
  if (getSave().settings.muted) return null
  try {
    ctx ??= new AudioContext()
    if (ctx.state === 'suspended') void ctx.resume()
    return ctx
  } catch {
    return null
  }
}

/** One soft tone with a quick attack and gentle fade. */
function tone(
  freq: number,
  start: number,
  duration: number,
  volume = 0.12,
  type: OscillatorType = 'triangle',
) {
  const ac = audio()
  if (!ac) return
  const t = ac.currentTime + start
  const osc = ac.createOscillator()
  const gain = ac.createGain()
  osc.type = type
  osc.frequency.setValueAtTime(freq, t)
  gain.gain.setValueAtTime(0, t)
  gain.gain.linearRampToValueAtTime(volume, t + 0.01)
  gain.gain.exponentialRampToValueAtTime(0.001, t + duration)
  osc.connect(gain).connect(ac.destination)
  osc.start(t)
  osc.stop(t + duration + 0.02)
}

export const sfx = {
  /** Correct answer: two rising chime notes */
  pling: () => {
    tone(880, 0, 0.18)
    tone(1320, 0.08, 0.25)
  },
  /** Wrong answer: soft low boop */
  boop: () => tone(220, 0, 0.22, 0.1, 'sine'),
  /** Coin landing in the counter */
  coin: () => tone(1568, 0, 0.08, 0.06, 'square'),
  /** Typewriter / key click, very quiet */
  tick: () => tone(1200, 0, 0.025, 0.03, 'square'),
  /** Little fanfare for a streak or the end of a show */
  fanfare: () => [523, 659, 784, 1047].forEach((f, i) => tone(f, i * 0.09, 0.22, 0.1)),
}

export function isMuted(): boolean {
  return getSave().settings.muted
}

export function setMuted(muted: boolean): void {
  updateSave((save) => ({ ...save, settings: { ...save.settings, muted } }))
}
