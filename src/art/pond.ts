// Fishing at the village pond (STYLE_GUIDE §9a colours): sky with clouds, the far bank with
// bushes, the pond (accent-blue with sky ripples), the grass bank where she stands.
// Plus the float and the fish on the line.
import type Phaser from 'phaser'
import { GAME_HEIGHT, GAME_WIDTH } from '../display'
import { seededRng, zufall } from '../math/random'
import { palette } from '../palette'
import { addFrames, rasterize } from './pixels'

/** Top and bottom of the water; she stands on the bank below. */
export const WATER_TOP = 92
export const BANK_Y = 236

export function ensurePondTexture(scene: Phaser.Scene): string {
  const key = 'pond-scene'
  if (scene.textures.exists(key)) return key
  const W = GAME_WIDTH
  const H = GAME_HEIGHT
  const texture = scene.textures.createCanvas(key, W, H)!
  const ctx = texture.getContext()
  const rect = (x: number, y: number, w: number, h: number, c: number) => {
    ctx.fillStyle = `#${c.toString(16).padStart(6, '0')}`
    ctx.fillRect(x, y, w, h)
  }
  const rng = seededRng(11)

  // Sky with two chunky clouds
  rect(0, 0, W, WATER_TOP, palette.sky)
  for (const [cx, cy] of [
    [46, 34],
    [132, 50],
  ]) {
    rect(cx - 14, cy, 28, 6, palette.paperWhite)
    rect(cx - 8, cy - 4, 14, 4, palette.paperWhite)
    rect(cx - 14, cy + 6, 28, 1, palette.cream)
  }

  // Far bank: a grass strip with round bushes (some with flowers)
  rect(0, WATER_TOP - 10, W, 10, palette.grassMid)
  rect(0, WATER_TOP - 2, W, 2, palette.grassDark)
  for (let x = 4; x < W; x += zufall(rng, 16, 26)) {
    const r = zufall(rng, 5, 8)
    for (let dy = -r; dy <= 0; dy++) {
      const half = Math.round(Math.sqrt(r * r - dy * dy))
      rect(
        x - half,
        WATER_TOP - 8 + dy,
        half * 2,
        1,
        dy < -r / 2 ? palette.grassLight : palette.grassMid,
      )
    }
    rect(x - r, WATER_TOP - 8, r * 2, 1, palette.grassDark)
    if (rng() < 0.5)
      rect(x - 1, WATER_TOP - 8 - r + 2, 2, 2, rng() < 0.5 ? palette.rose : palette.cream)
  }

  // The pond: accent-blue with lighter ripples, a cream shine line under the far bank
  rect(0, WATER_TOP, W, BANK_Y - WATER_TOP, palette.accentBlue)
  for (let x = 0; x < W; x += 5) rect(x, WATER_TOP + ((x / 5) % 2), 3, 1, palette.sky)
  for (let i = 0; i < 70; i++) {
    rect(
      zufall(rng, 0, W - 5),
      zufall(rng, WATER_TOP + 4, BANK_Y - 4),
      zufall(rng, 2, 4),
      1,
      palette.sky,
    )
  }

  // Near bank: grass with tufts and a few flowers, a sandy edge at the water
  rect(0, BANK_Y, W, H - BANK_Y, palette.grassMid)
  rect(0, BANK_Y, W, 2, palette.pathDark)
  rect(0, BANK_Y + 2, W, 2, palette.pathLight)
  for (let i = 0; i < 60; i++) {
    const x = zufall(rng, 0, W - 3)
    const y = zufall(rng, BANK_Y + 6, H - 2)
    rect(x, y, 1, 2, palette.grassLight)
    rect(x + 2, y, 1, 2, palette.grassLight)
    rect(x + 1, y + 1, 1, 1, palette.grassDark)
  }
  for (let i = 0; i < 10; i++) {
    const c = [palette.rose, palette.cream, palette.gold][i % 3]
    rect(zufall(rng, 0, W - 2), zufall(rng, BANK_Y + 8, H - 2), 2, 2, c)
  }

  texture.refresh()
  return key
}

/** Float: rose top, white bottom; frame 'bite' sits deeper in the water. */
export function ensureFloatTexture(scene: Phaser.Scene): string {
  const key = 'pond-float'
  if (scene.textures.exists(key)) return key
  const legend = { a: palette.rose, b: palette.paperWhite, c: palette.sky }
  addFrames(scene, key, [
    {
      name: 'float',
      pixels: rasterize(['.a.', 'aaa', 'bbb', '.b.', 'ccc'], legend, palette.roseDark),
    },
    {
      name: 'bite',
      pixels: rasterize(['...', '.a.', 'aaa', 'ccc', 'ccc'], legend, palette.roseDark),
    },
  ])
  return key
}

/** A fish on the line (seen from the side, facing left). */
export function ensureFishTexture(scene: Phaser.Scene): string {
  const key = 'pond-fish'
  if (scene.textures.exists(key)) return key
  const map = ['...aaaa..b', '.aaaaaaabb', 'aeaaaaaab.', '.aaccaaabb', '...aaaa..b']
  addFrames(scene, key, [
    {
      name: 'fish',
      pixels: rasterize(
        map,
        { a: palette.gold, b: palette.goldDark, c: palette.cream, e: palette.ink },
        palette.goldDark,
      ),
    },
  ])
  return key
}
