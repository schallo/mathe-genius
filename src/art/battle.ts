// Battle screen background (STYLE_GUIDE §9a): soft sky, a grass field with two flat
// platforms, and the wooden floor below for the task box and the number pad.
import type Phaser from 'phaser'
import { seededRng, zufall } from '../math/random'
import { palette } from '../palette'

export const BATTLE_FLOOR_Y = 172
const HORIZON_Y = 60

/** Platform centres: wild creature top right, her pet bottom left. */
export const FOE_SPOT = { x: 130, y: 100 }
export const PET_SPOT = { x: 46, y: 160 }

export function ensureBattleTexture(scene: Phaser.Scene): string {
  const key = 'battle-bg'
  if (scene.textures.exists(key)) return key
  const W = 180
  const H = 360
  const g = scene.make.graphics({}, false)
  const rng = seededRng(5)

  // Sky with two small clouds
  g.fillStyle(palette.sky).fillRect(0, 0, W, HORIZON_Y)
  g.fillStyle(palette.cream)
  for (const [x, y] of [
    [22, 26],
    [118, 44],
  ]) {
    g.fillRect(x, y, 22, 4)
      .fillRect(x + 4, y - 3, 12, 3)
      .fillRect(x + 8, y - 5, 6, 2)
  }

  // Grass field: light band at the horizon, tufts
  g.fillStyle(palette.grassMid).fillRect(0, HORIZON_Y, W, BATTLE_FLOOR_Y - HORIZON_Y)
  g.fillStyle(palette.grassLight).fillRect(0, HORIZON_Y, W, 2)
  for (let i = 0; i < 160; i++) {
    const x = zufall(rng, 0, W - 2)
    const y = zufall(rng, HORIZON_Y + 4, BATTLE_FLOOR_Y - 3)
    g.fillStyle(rng() < 0.6 ? palette.grassLight : palette.grassDark)
    g.fillRect(x, y, 1, 1).fillRect(x + 1, y - 1, 1, 1)
  }

  // Platforms: flat grass-dark ovals with a 1 px darker rim, drawn row by row
  const platform = (cx: number, cy: number, rx: number, ry: number) => {
    for (let y = -ry; y <= ry; y++) {
      const half = Math.round(rx * Math.sqrt(1 - (y / (ry + 0.5)) ** 2))
      g.fillStyle(palette.woodDark).fillRect(cx - half, cy + y, half * 2, 1)
      g.fillStyle(palette.grassDark).fillRect(cx - half + 1, cy + y, half * 2 - 2, 1)
    }
    g.fillStyle(palette.woodDark).fillRect(cx - rx + 4, cy + ry, rx * 2 - 8, 1)
  }
  platform(FOE_SPOT.x, FOE_SPOT.y, 28, 6)
  platform(PET_SPOT.x, PET_SPOT.y, 30, 6)

  // Wooden floor: 2 px edge, then planks with a light top line and a dark seam
  g.fillStyle(palette.woodEdge).fillRect(0, BATTLE_FLOOR_Y, W, 2)
  for (let y = BATTLE_FLOOR_Y + 2; y < H; y += 6) {
    g.fillStyle(palette.woodMid).fillRect(0, y, W, 6)
    g.fillStyle(palette.woodLight).fillRect(0, y, W, 1)
    g.fillStyle(palette.woodDark).fillRect(0, y + 5, W, 1)
  }

  g.generateTexture(key, W, H)
  g.destroy()
  return key
}
