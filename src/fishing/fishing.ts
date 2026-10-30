// Fishing at the village pond (NOTES "Fishing mini game"). Pure logic, no Phaser.
// 1. Cast: hold to charge the throw, let go to cast (farther = the fish bites sooner).
// 2. Wait until a fish bites, then tap quickly (if she misses it, the fish just swims on).
// 3. Reel in by holding. The fish pulls weakly, medium or strongly, switching at random.
//    Reeling uses power – the stronger the pull, the more; letting go recovers power while
//    the fish pulls some line back out. At 0 power the fish gets away: nothing is lost,
//    she simply casts again.

export type Pull = 'weak' | 'mid' | 'strong'
export const PULLS: Pull[] = ['weak', 'mid', 'strong']

export const FISHING = {
  /** One sweep of the throw meter from 0 to full */
  chargeMs: 1200,
  /** Wait before a bite (shorter for a far throw) */
  biteMinMs: 1500,
  biteMaxMs: 4000,
  /** Time to react after a bite */
  hookMs: 2500,
  /** Line to reel in */
  line: 100,
  maxPower: 100,
  /** Line reeled in per second while holding */
  reel: { weak: 26, mid: 18, strong: 10 } as Record<Pull, number>,
  /** Power used per second while reeling: grows with the pull */
  drain: { weak: 8, mid: 20, strong: 45 } as Record<Pull, number>,
  /** Line the fish pulls back out per second while she rests */
  pullBack: { weak: 3, mid: 6, strong: 10 } as Record<Pull, number>,
  /** Power recovered per second while she rests */
  recover: 15,
  /** How long one pull lasts before the fish changes it */
  pullMinMs: 700,
  pullMaxMs: 1800,
} as const

export type Phase = 'ready' | 'charging' | 'waiting' | 'bite' | 'reeling' | 'caught' | 'lost'

export type FishingState = {
  phase: Phase
  /** Throw meter 0–1 while charging; the throw distance afterwards */
  charge: number
  /** ms in the charging phase (drives the meter) */
  chargeClock: number
  /** ms left until the bite, or to react to it */
  timer: number
  /** Line still out (0 = caught) */
  line: number
  power: number
  pull: Pull
  /** ms until the fish changes its pull */
  pullTimer: number
}

export type Rng = () => number

export const startFishing = (): FishingState => ({
  phase: 'ready',
  charge: 0,
  chargeClock: 0,
  timer: 0,
  line: FISHING.line,
  power: FISHING.maxPower,
  pull: 'weak',
  pullTimer: 0,
})

const between = (rng: Rng, min: number, max: number) => min + rng() * (max - min)

/** Ping-pong meter: 0 → 1 → 0 … */
export function meter(clockMs: number): number {
  const t = (clockMs / FISHING.chargeMs) % 2
  return t <= 1 ? t : 2 - t
}

function biteWait(distance: number, rng: Rng): number {
  // A far throw (distance 1) waits about half as long as a short one
  return between(rng, FISHING.biteMinMs, FISHING.biteMaxMs) * (1.25 - 0.6 * distance)
}

function newPull(rng: Rng): { pull: Pull; pullTimer: number } {
  return {
    pull: PULLS[Math.min(2, Math.floor(rng() * 3))],
    pullTimer: between(rng, FISHING.pullMinMs, FISHING.pullMaxMs),
  }
}

/** She presses (button, tap or space bar). */
export function press(state: FishingState, rng: Rng): FishingState {
  switch (state.phase) {
    case 'ready':
      return { ...state, phase: 'charging', chargeClock: 0, charge: 0 }
    case 'bite':
      return { ...state, phase: 'reeling', line: FISHING.line, ...newPull(rng) }
    case 'caught':
    case 'lost':
      return startFishing()
    default:
      return state
  }
}

/** She lets go: a charged throw is cast. */
export function release(state: FishingState, rng: Rng): FishingState {
  if (state.phase !== 'charging') return state
  const charge = Math.max(0.15, state.charge)
  return { ...state, phase: 'waiting', charge, timer: biteWait(charge, rng) }
}

/** Advances the game by `dtMs`; `holding` = she keeps the button pressed. */
export function step(state: FishingState, dtMs: number, holding: boolean, rng: Rng): FishingState {
  const s = dtMs / 1000
  switch (state.phase) {
    case 'charging': {
      const chargeClock = state.chargeClock + dtMs
      return { ...state, chargeClock, charge: meter(chargeClock) }
    }
    case 'waiting': {
      const timer = state.timer - dtMs
      return timer > 0 ? { ...state, timer } : { ...state, phase: 'bite', timer: FISHING.hookMs }
    }
    case 'bite': {
      const timer = state.timer - dtMs
      // Too late: the fish swims on and another one comes later
      return timer > 0
        ? { ...state, timer }
        : { ...state, phase: 'waiting', timer: biteWait(state.charge, rng) }
    }
    case 'reeling': {
      let next = { ...state, pullTimer: state.pullTimer - dtMs }
      if (next.pullTimer <= 0) next = { ...next, ...newPull(rng) }
      const pull = next.pull
      if (holding) {
        next.line = Math.max(0, next.line - FISHING.reel[pull] * s)
        next.power = Math.max(0, next.power - FISHING.drain[pull] * s)
        if (next.line === 0) return { ...next, phase: 'caught' }
        if (next.power === 0) return { ...next, phase: 'lost' }
      } else {
        next.line = Math.min(FISHING.line, next.line + FISHING.pullBack[pull] * s)
        next.power = Math.min(FISHING.maxPower, next.power + FISHING.recover * s)
      }
      return next
    }
    default:
      return state
  }
}
