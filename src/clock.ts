// Game clock. The end-to-end tests open the game with `?speed=N` to run all game time
// N× faster: Phaser timers and tweens (PixelScene), walking, battle timers and the
// Einmaleins speed modes. Never active for Leni – only through that URL parameter.
// Real-world times (pet naps, save timestamps) keep using Date.now().

function parseSpeed(search: string): number {
  const n = Number(new URLSearchParams(search).get('speed'))
  return Number.isFinite(n) && n >= 1 ? Math.min(n, 20) : 1
}

export const GAME_SPEED = typeof window === 'undefined' ? 1 : parseSpeed(window.location.search)

/** Game time in ms (performance.now() scaled by the test speed), for measuring answers. */
export const gameNow = (): number => performance.now() * GAME_SPEED
