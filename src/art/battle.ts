// Battle screen background (STYLE_GUIDE §9a): soft sky, the ground of the island with two
// flat platforms, and the wooden floor below for the task box and the number pad. Every
// island has its own look: meadow, forest, savanna, prehistoric valley, cloud mountain.
import type Phaser from 'phaser'
import { seededRng, zufall } from '../math/random'
import { palette } from '../palette'
import type { Theme } from '../world/wild'

export const BATTLE_FLOOR_Y = 172
const HORIZON_Y = 60

/** Platform centres: wild creature top right, her pet bottom left. */
export const FOE_SPOT = { x: 130, y: 100 }
export const PET_SPOT = { x: 46, y: 160 }

const C = palette

type BattleLook = {
  sky: number
  ground: number
  /** Light band at the horizon */
  horizon: number
  tufts: [number, number]
  platform: number
  platformRim: number
  clouds: number
}

const LOOKS: Record<Theme, BattleLook> = {
  wiese: {
    sky: C.sky,
    ground: C.grassMid,
    horizon: C.grassLight,
    tufts: [C.grassLight, C.grassDark],
    platform: C.grassDark,
    platformRim: C.woodDark,
    clouds: 2,
  },
  wald: {
    sky: C.sky,
    ground: C.grassDark,
    horizon: C.grassMid,
    tufts: [C.grassMid, C.woodDark],
    platform: C.mintDark,
    platformRim: C.woodEdge,
    clouds: 1,
  },
  savanne: {
    sky: C.sky,
    ground: C.pathLight,
    horizon: C.hairBlond,
    tufts: [C.hairBlond, C.pathDark],
    platform: C.pathDark,
    platformRim: C.woodMid,
    clouds: 0,
  },
  urzeit: {
    sky: C.sky,
    ground: C.mintDark,
    horizon: C.mint,
    tufts: [C.mint, C.grassDark],
    platform: C.stoneDark,
    platformRim: C.ink,
    clouds: 1,
  },
  wolken: {
    sky: C.sky,
    ground: C.cream,
    horizon: C.paperWhite,
    tufts: [C.paperWhite, C.sky],
    platform: C.paperWhite,
    platformRim: C.accentBlue,
    clouds: 3,
  },
}

type G = Phaser.GameObjects.Graphics

const CLOUD_SPOTS = [
  [22, 26],
  [118, 44],
  [70, 16],
]

function cloud(g: G, x: number, y: number) {
  g.fillStyle(C.cream)
  g.fillRect(x, y, 22, 4)
    .fillRect(x + 4, y - 3, 12, 3)
    .fillRect(x + 8, y - 5, 6, 2)
}

/** A small fir, standing with its foot on y (forest horizon) */
function fir(g: G, x: number, y: number, h: number) {
  g.fillStyle(C.woodDark).fillRect(x, y - 2, 2, 2)
  for (let row = 0; row < h; row++) {
    const half = Math.floor((row * 5) / h) + 1
    g.fillStyle(row % 3 === 0 ? C.grassDark : C.mintDark)
    g.fillRect(x + 1 - half, y - 2 - h + row, half * 2, 1)
  }
}

/** Things on the horizon that tell the islands apart */
function backdrop(g: G, theme: Theme, rng: () => number) {
  const H = HORIZON_Y
  switch (theme) {
    case 'wiese':
      // Soft hills
      g.fillStyle(C.grassLight)
      for (let x = 0; x < 180; x++) {
        const h = Math.round(4 + 3 * Math.sin(x / 14) + 2 * Math.sin(x / 5.3))
        g.fillRect(x, H - h, 1, h)
      }
      break
    case 'wald':
      // A row of firs along the horizon
      for (let x = -2; x < 184; x += 9) fir(g, x + zufall(rng, 0, 3), H, zufall(rng, 12, 20))
      break
    case 'savanne': {
      // The sun and a flat-topped acacia, right of the info box and below the coins
      g.fillStyle(C.gold).fillRect(104, 26, 14, 10).fillRect(106, 24, 10, 14)
      g.fillStyle(C.paperWhite).fillRect(107, 27, 3, 2)
      const ax = 160
      g.fillStyle(C.woodMid).fillRect(ax, H - 16, 2, 16)
      g.fillRect(ax - 5, H - 18, 2, 4).fillRect(ax + 5, H - 18, 2, 4)
      g.fillStyle(C.grassMid).fillRect(ax - 16, H - 22, 34, 4)
      g.fillStyle(C.grassDark).fillRect(ax - 14, H - 18, 30, 1)
      g.fillStyle(C.grassLight).fillRect(ax - 10, H - 23, 22, 1)
      break
    }
    case 'urzeit': {
      // A friendly volcano with a little puff of steam
      for (let row = 0; row < 26; row++) {
        const half = 6 + row
        g.fillStyle(row < 3 ? C.heroDark : C.stoneDark).fillRect(
          130 - half,
          H - 26 + row,
          half * 2,
          1,
        )
      }
      g.fillStyle(C.stone)
        .fillRect(118, H - 18, 3, 10)
        .fillRect(136, H - 14, 2, 8)
      g.fillStyle(C.cream)
      g.fillRect(126, H - 34, 8, 4)
        .fillRect(130, H - 40, 8, 4)
        .fillRect(126, H - 45, 6, 3)
      break
    }
    case 'wolken':
      // Snowy mountain peaks far away, clouds at their feet
      for (const [cx, h] of [
        [40, 30],
        [90, 40],
        [150, 26],
      ]) {
        for (let row = 0; row < h; row++) {
          const half = Math.round((row * 26) / h)
          g.fillStyle(row < h / 4 ? C.paperWhite : C.stone).fillRect(
            cx - half,
            H - h + row,
            half * 2 + 1,
            1,
          )
        }
      }
      g.fillStyle(C.paperWhite)
      for (let x = 0; x < 180; x += 16) g.fillRect(x, H - 5, 14, 5).fillRect(x + 3, H - 8, 8, 3)
      break
  }
}

export function ensureBattleTexture(scene: Phaser.Scene, theme: Theme = 'wiese'): string {
  const key = `battle-bg-${theme}`
  if (scene.textures.exists(key)) return key
  const look = LOOKS[theme]
  const W = 180
  const H = 360
  const g = scene.make.graphics({}, false)
  const rng = seededRng(5)

  // Sky with a few small clouds
  g.fillStyle(look.sky).fillRect(0, 0, W, HORIZON_Y)
  for (const [x, y] of CLOUD_SPOTS.slice(0, look.clouds)) cloud(g, x, y)
  backdrop(g, theme, rng)

  // Ground: light band at the horizon, tufts
  g.fillStyle(look.ground).fillRect(0, HORIZON_Y, W, BATTLE_FLOOR_Y - HORIZON_Y)
  g.fillStyle(look.horizon).fillRect(0, HORIZON_Y, W, 2)
  for (let i = 0; i < 160; i++) {
    const x = zufall(rng, 0, W - 2)
    const y = zufall(rng, HORIZON_Y + 4, BATTLE_FLOOR_Y - 3)
    g.fillStyle(rng() < 0.6 ? look.tufts[0] : look.tufts[1])
    g.fillRect(x, y, 1, 1).fillRect(x + 1, y - 1, 1, 1)
  }

  // Platforms: flat ovals with a 1 px darker rim, drawn row by row
  const platform = (cx: number, cy: number, rx: number, ry: number) => {
    for (let y = -ry; y <= ry; y++) {
      const half = Math.round(rx * Math.sqrt(1 - (y / (ry + 0.5)) ** 2))
      g.fillStyle(look.platformRim).fillRect(cx - half, cy + y, half * 2, 1)
      g.fillStyle(look.platform).fillRect(cx - half + 1, cy + y, half * 2 - 2, 1)
    }
    g.fillStyle(look.platformRim).fillRect(cx - rx + 4, cy + ry, rx * 2 - 8, 1)
  }
  platform(FOE_SPOT.x, FOE_SPOT.y, 28, 6)
  platform(PET_SPOT.x, PET_SPOT.y, 30, 6)

  // Wooden floor: 2 px edge, then planks with a light top line and a dark seam
  g.fillStyle(C.woodEdge).fillRect(0, BATTLE_FLOOR_Y, W, 2)
  for (let y = BATTLE_FLOOR_Y + 2; y < H; y += 6) {
    g.fillStyle(C.woodMid).fillRect(0, y, W, 6)
    g.fillStyle(C.woodLight).fillRect(0, y, W, 1)
    g.fillStyle(C.woodDark).fillRect(0, y + 5, W, 1)
  }

  g.generateTexture(key, W, H)
  g.destroy()
  return key
}
