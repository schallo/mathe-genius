// Crisp rendering: the game world is 180 × 360 "art pixels". The canvas is
// rendered at an integer multiple of that (the render scale), chosen so one
// canvas pixel = one device pixel. Pixel art stays sharp and text is rendered
// at full device resolution.

export const GAME_WIDTH = 180
export const GAME_HEIGHT = 360

export type RenderSize = {
  /** Canvas pixels per art pixel */
  scale: number
  /** CSS size of the canvas element */
  cssWidth: number
  cssHeight: number
}

export function computeRenderSize(
  availableWidth: number,
  availableHeight: number,
  devicePixelRatio: number,
): RenderSize {
  const fit = Math.min(availableWidth / GAME_WIDTH, availableHeight / GAME_HEIGHT)
  const scale = Math.max(1, Math.min(8, Math.floor(fit * devicePixelRatio)))
  return {
    scale,
    cssWidth: (GAME_WIDTH * scale) / devicePixelRatio,
    cssHeight: (GAME_HEIGHT * scale) / devicePixelRatio,
  }
}

let current = 1

/** Render scale chosen at startup; scenes use it for camera zoom and text resolution. */
export function renderScale(): number {
  return current
}

export function setRenderScale(scale: number): void {
  current = scale
}
