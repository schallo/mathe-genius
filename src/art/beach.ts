// Beach backdrop for the title screen (STYLE_GUIDE §9a): sky with a sun and clouds,
// a band of sea, sand where her character stands, palms at the sides.
import type Phaser from 'phaser'
import { GAME_HEIGHT, GAME_WIDTH } from '../display'
import { seededRng, zufall } from '../math/random'
import { palette } from '../palette'
import { palmPixels } from './palm'

/** y where the sand begins: characters stand here. */
export const BEACH_FLOOR_Y = 200
const SEA_Y = 150

export function ensureBeachTexture(scene: Phaser.Scene): string {
  const key = 'beach'
  if (scene.textures.exists(key)) return key
  const W = GAME_WIDTH
  const H = GAME_HEIGHT
  const texture = scene.textures.createCanvas(key, W, H)!
  const ctx = texture.getContext()
  const rect = (x: number, y: number, w: number, h: number, c: number) => {
    ctx.fillStyle = `#${c.toString(16).padStart(6, '0')}`
    ctx.fillRect(x, y, w, h)
  }
  const rng = seededRng(3)

  // Sky with a stepped sun (no gradients) and two chunky clouds
  rect(0, 0, W, SEA_Y, palette.sky)
  for (let r = 0; r < 9; r++) {
    const half = Math.round(Math.sqrt(81 - r * r))
    rect(150 - half, 128 - r, half * 2, 1, palette.gold)
  }
  for (const [cx, cy] of [
    [40, 30],
    [120, 52],
  ]) {
    rect(cx - 14, cy, 28, 6, palette.paperWhite)
    rect(cx - 8, cy - 4, 14, 4, palette.paperWhite)
    rect(cx - 14, cy + 6, 28, 1, palette.cream)
  }

  // Sea with wave pixels and a cream surf line
  rect(0, SEA_Y, W, BEACH_FLOOR_Y - SEA_Y, palette.accentBlue)
  for (let i = 0; i < 60; i++) {
    rect(zufall(rng, 0, W - 4), zufall(rng, SEA_Y + 2, BEACH_FLOOR_Y - 4), 3, 1, palette.sky)
  }
  for (let x = 0; x < W; x += 6) rect(x, BEACH_FLOOR_Y - 2 + ((x / 6) % 2), 6, 2, palette.cream)

  // Sand with a few darker grains
  rect(0, BEACH_FLOOR_Y, W, H - BEACH_FLOOR_Y, palette.pathLight)
  for (let i = 0; i < 120; i++) {
    rect(zufall(rng, 0, W - 1), zufall(rng, BEACH_FLOOR_Y + 2, H - 1), 1, 1, palette.pathDark)
  }

  // Palms on both sides, standing on the sand
  const palm = palmPixels()
  for (const [px, py] of [
    [4, BEACH_FLOOR_Y - 12],
    [162, BEACH_FLOOR_Y - 6],
  ]) {
    palm.forEach((row, y) =>
      row.forEach((c, x) => {
        if (c !== null) rect(px + x, py + y, 1, 1, c)
      }),
    )
  }

  texture.refresh()
  return key
}
