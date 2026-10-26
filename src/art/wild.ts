// Wild island (STYLE_GUIDE §9a): sea with wave pixels, a sandy rim, a meadow full of
// flowers, a pond, the jetty and the boat are baked into one ground texture. Trees, palms,
// rocks, bushes and tall grass are separate sprites so she can walk behind them and
// creatures can hide in the bushes. Each island theme draws them in its own way.
import type Phaser from 'phaser'
import type { AreaId } from '../data/creatures'
import { seededRng, zufall } from '../math/random'
import { palette } from '../palette'
import {
  BOAT,
  ISLAND,
  JETTY,
  MEADOW,
  OBSTACLE_SIZE,
  SPOT_SIZE,
  WILD_HEIGHT,
  WILD_WIDTH,
  area,
  type ObstacleKind,
  type SpotKind,
  type Theme,
} from '../world/wild'
import { PALM, palmPixels } from './palm'

const palmMap = () => PALM
import { addFrames, rasterize, type PixelMap } from './pixels'

const GREEN = { a: palette.grassMid, b: palette.grassDark, c: palette.grassLight }

/** Pixel map from a function (x, y) → role, '.' = transparent. */
function draw(w: number, h: number, pixel: (x: number, y: number) => string): PixelMap {
  return Array.from({ length: h }, (_, y) =>
    Array.from({ length: w }, (_, x) => pixel(x, y)).join(''),
  )
}

/** Round canopy (light top-left, dark bottom-right) on a short trunk. */
export const TREE: PixelMap = draw(20, 24, (x, y) => {
  const dx = x + 0.5 - 10
  const dy = y + 0.5 - 9
  if ((dx / 8.5) ** 2 + (dy / 7.5) ** 2 <= 1) {
    if (dx + dy < -6) return 'c'
    if (dx + dy > 4) return 'b'
    return 'a'
  }
  if (y >= 16 && y <= 22 && (x === 9 || x === 10)) return x === 10 ? 'd' : 't'
  return '.'
})

/** Grey boulder with a light top edge. */
export const ROCK: PixelMap = draw(14, 10, (x, y) => {
  const dx = x + 0.5 - 7
  const dy = y + 0.5 - 5.5
  if ((dx / 6) ** 2 + (dy / 4) ** 2 > 1) return '.'
  if (dy < -2 && dx < 2) return 'c'
  return dx + dy > 2.5 ? 'b' : 'a'
})

/** Bumpy bush from three round clumps, with a few berries. */
export const BUSH: PixelMap = draw(18, 14, (x, y) => {
  const clumps = [
    [5.5, 8.5, 5],
    [12.5, 8.5, 5],
    [9, 5.5, 5],
  ]
  const inside = clumps.some(([cx, cy, r]) => (x + 0.5 - cx) ** 2 + (y + 0.5 - cy) ** 2 <= r * r)
  if (!inside || y > 12) return '.'
  if ((x === 6 && y === 7) || (x === 11 && y === 5) || (x === 13 && y === 10)) return 'p'
  if (y < 5 || (y < 7 && x < 5)) return 'c'
  return y > 10 || x > 14 ? 'b' : 'a'
})

/** Tall grass: blades of different heights with light tips. */
export function grassPatch(): PixelMap {
  const rng = seededRng(17)
  const heights = Array.from({ length: 26 }, (_, x) =>
    x === 0 || x === 25 ? 0 : x === 1 || x === 24 ? 5 : zufall(rng, 7, 12),
  )
  return draw(26, 12, (x, y) => {
    const top = 12 - heights[x]
    if (y < top) return '.'
    if (y === top) return 'c'
    return x % 3 === 0 ? 'b' : 'a'
  })
}

/** Fir for the forest (in the 12 × 16 palm slot): three tiers on a short trunk. */
export const FIR: PixelMap = draw(12, 16, (x, y) => {
  const tiers = [
    [1, 5, 2],
    [4, 9, 4],
    [7, 13, 5],
  ]
  for (const [top, bottom, half] of tiers) {
    if (y >= top && y <= bottom) {
      const w = Math.round(((y - top + 1) / (bottom - top + 1)) * half)
      if (Math.abs(x + 0.5 - 6) <= w) return x < 6 ? 'c' : y === bottom ? 'b' : 'a'
    }
  }
  if (y === 0 && (x === 5 || x === 6)) return 'a'
  if (y >= 14 && (x === 5 || x === 6)) return x === 6 ? 'd' : 't'
  return '.'
})

/** Acacia for the savanna (in the 20 × 24 tree slot): a flat, wide crown on a thin trunk. */
export const ACACIA: PixelMap = draw(20, 24, (x, y) => {
  const dx = x + 0.5 - 10
  const dy = y + 0.5 - 6
  if ((dx / 9.5) ** 2 + (dy / 3.6) ** 2 <= 1) return dy < -1.5 ? 'c' : dy > 1.5 ? 'b' : 'a'
  if (y >= 9 && y <= 22) {
    if (x === 9 || x === 10) return x === 10 ? 'd' : 't'
    if (y === 10 && (x === 7 || x === 12)) return 't'
    if (y === 9 && (x === 6 || x === 13)) return 't'
  }
  return '.'
})

/** Stone pillar for the Wolkenberg (in the 12 × 16 palm slot). */
export const PILLAR: PixelMap = draw(12, 16, (x, y) => {
  if (y < 1 || y > 14 || x < 3 || x > 8) return '.'
  if (y === 1 || y === 14) return 'b'
  return x <= 4 ? 'c' : x >= 7 ? 'b' : 'a'
})

/** A puffy cloud for hiding on the Wolkenberg (in the 26 × 12 grass slot). */
export const CLOUD_PATCH: PixelMap = draw(26, 12, (x, y) => {
  const puffs = [
    [6, 8, 5],
    [13, 6, 6],
    [20, 8, 5],
  ]
  const inside = puffs.some(([cx, cy, r]) => (x + 0.5 - cx) ** 2 + (y + 0.5 - cy) ** 2 <= r * r)
  if (!inside || y > 11) return '.'
  return y < 5 ? 'c' : y > 9 ? 'b' : 'a'
})

const C = palette

/** How each island draws its ground and plants (STYLE_GUIDE §9a, palette only). */
type ThemeLook = {
  ground: number
  tufts: [number, number]
  flowers: number[]
  flowerCount: number
  rim: number
  rimGrain: number
  /** Sea around the island: water with waves, or open sky with little clouds */
  sea: 'water' | 'sky'
  /** Steam puffs above the pond (Urzeittal) */
  steam?: boolean
  obstacles: Record<ObstacleKind, () => (number | null)[][]>
  spots: Record<SpotKind, () => (number | null)[][]>
}

const outlined = (map: PixelMap, legend: Record<string, number>, outline: number = C.woodEdge) =>
  rasterize(map, legend, outline)

const grass = (a: number, b: number, c: number) => () => rasterize(grassPatch(), { a, b, c })

const THEMES: Record<Theme, ThemeLook> = {
  wiese: {
    ground: C.grassMid,
    tufts: [C.grassLight, C.grassDark],
    flowers: [C.rose, C.cream, C.gold, C.lilac],
    flowerCount: 520,
    rim: C.pathLight,
    rimGrain: C.pathDark,
    sea: 'water',
    obstacles: {
      palm: palmPixels,
      tree: () => outlined(TREE, { ...GREEN, t: C.woodMid, d: C.woodDark }),
      rock: () => outlined(ROCK, { a: C.stone, b: C.stoneDark, c: C.cream }),
    },
    spots: {
      bush: () => outlined(BUSH, { ...GREEN, p: C.rose }),
      grass: grass(C.grassLight, C.grassDark, C.cream),
    },
  },
  // Flüsterwald: dark forest floor with fallen leaves and little mushrooms, firs, ferns
  wald: {
    ground: C.grassDark,
    tufts: [C.grassMid, C.woodDark],
    flowers: [C.cream, C.rose],
    flowerCount: 140,
    rim: C.pathLight,
    rimGrain: C.pathDark,
    sea: 'water',
    obstacles: {
      palm: () =>
        outlined(FIR, {
          a: C.grassDark,
          b: C.mintDark,
          c: C.grassMid,
          t: C.woodMid,
          d: C.woodDark,
        }),
      tree: () =>
        outlined(TREE, {
          a: C.grassDark,
          b: C.mintDark,
          c: C.grassMid,
          t: C.woodDark,
          d: C.woodEdge,
        }),
      rock: () => outlined(ROCK, { a: C.stone, b: C.stoneDark, c: C.grassMid }),
    },
    spots: {
      bush: () => outlined(BUSH, { a: C.grassMid, b: C.grassDark, c: C.grassLight, p: C.cream }),
      grass: grass(C.mint, C.mintDark, C.grassLight),
    },
  },
  // Sonnensavanne: dry grass, acacias, sandy rocks
  savanne: {
    ground: C.pathLight,
    tufts: [C.hairBlond, C.pathDark],
    flowers: [C.gold, C.hero],
    flowerCount: 160,
    rim: C.pathDark,
    rimGrain: C.woodMid,
    sea: 'water',
    obstacles: {
      palm: palmPixels,
      tree: () =>
        outlined(ACACIA, {
          a: C.grassMid,
          b: C.grassDark,
          c: C.grassLight,
          t: C.woodMid,
          d: C.woodDark,
        }),
      rock: () => outlined(ROCK, { a: C.pathDark, b: C.woodMid, c: C.cream }),
    },
    spots: {
      bush: () => outlined(BUSH, { a: C.grassLight, b: C.grassMid, c: C.cream, p: C.gold }),
      grass: grass(C.hairBlond, C.goldDark, C.cream),
    },
  },
  // Urzeittal: ferns, dark volcanic rocks, a steaming pond
  urzeit: {
    ground: C.mintDark,
    tufts: [C.mint, C.grassDark],
    flowers: [C.gold, C.heroDark],
    flowerCount: 120,
    rim: C.stoneDark,
    rimGrain: C.stone,
    sea: 'water',
    steam: true,
    obstacles: {
      palm: () =>
        outlined(
          palmMap(),
          { a: C.mintDark, b: C.grassDark, c: C.woodDark, t: C.woodMid },
          C.woodEdge,
        ),
      tree: () =>
        outlined(TREE, { a: C.mint, b: C.mintDark, c: C.grassLight, t: C.woodMid, d: C.woodDark }),
      rock: () => outlined(ROCK, { a: C.stoneDark, b: C.ink, c: C.heroDark }),
    },
    spots: {
      bush: () => outlined(BUSH, { a: C.grassLight, b: C.grassMid, c: C.cream, p: C.gold }),
      grass: grass(C.grassLight, C.grassDark, C.cream),
    },
  },
  // Wolkenberg: a floor of clouds with stone pillars, cloud trees, the sky all around
  wolken: {
    ground: C.cream,
    tufts: [C.paperWhite, C.sky],
    flowers: [C.sky, C.lilac, C.gold],
    flowerCount: 220,
    rim: C.paperWhite,
    rimGrain: C.sky,
    sea: 'sky',
    obstacles: {
      palm: () => outlined(PILLAR, { a: C.stone, b: C.stoneDark, c: C.cream }, C.stoneDark),
      tree: () =>
        outlined(
          TREE,
          { a: C.paperWhite, b: C.sky, c: C.paperWhite, t: C.stone, d: C.stoneDark },
          C.accentBlue,
        ),
      rock: () => outlined(ROCK, { a: C.stone, b: C.stoneDark, c: C.paperWhite }, C.stoneDark),
    },
    spots: {
      bush: () =>
        outlined(BUSH, { a: C.paperWhite, b: C.sky, c: C.paperWhite, p: C.lilac }, C.accentBlue),
      grass: () =>
        rasterize(CLOUD_PATCH, { a: C.paperWhite, b: C.sky, c: C.paperWhite }, C.accentBlue),
    },
  },
}

export function ensureObstacleTexture(
  scene: Phaser.Scene,
  kind: ObstacleKind,
  theme: Theme = 'wiese',
): string {
  const key = `wild-${theme}-${kind}`
  if (!scene.textures.exists(key))
    addFrames(scene, key, [{ name: 'idle', pixels: THEMES[theme].obstacles[kind]() }])
  return key
}

export function ensureSpotTexture(
  scene: Phaser.Scene,
  kind: SpotKind,
  theme: Theme = 'wiese',
): string {
  const key = `wild-${theme}-${kind}`
  if (!scene.textures.exists(key))
    addFrames(scene, key, [{ name: 'idle', pixels: THEMES[theme].spots[kind]() }])
  return key
}

export function ensureWildTexture(scene: Phaser.Scene, id: AreaId): string {
  const key = `wild-ground-${id}`
  if (scene.textures.exists(key)) return key
  const a = area(id)
  const look = THEMES[a.theme]
  const W = WILD_WIDTH
  const H = WILD_HEIGHT
  const px = new Uint32Array(W * H)
  const shade = new Uint8Array(W * H)
  const set = (x: number, y: number, c: number) => {
    if (x >= 0 && y >= 0 && x < W && y < H) px[y * W + x] = c
  }
  const ellipse = (e: { cx: number; cy: number; rx: number; ry: number }, x: number, y: number) =>
    ((x + 0.5 - e.cx) / e.rx) ** 2 + ((y + 0.5 - e.cy) / e.ry) ** 2
  const rng = seededRng(11)

  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const d = ellipse(ISLAND, x, y)
      if (d > 1) {
        // Water with wave pixels – or, around the Wolkenberg, sky with little cloud specks
        const wave = (x + y * 3) % 11 === 0 && y % 4 === 1
        const sky = look.sea === 'sky'
        set(x, y, wave ? (sky ? palette.paperWhite : palette.accentBlue) : palette.sky)
      } else if (d > 0.985) {
        set(x, y, look.sea === 'sky' ? palette.paperWhite : palette.cream) // surf line
      } else if (ellipse(MEADOW, x, y) > 1.06) {
        set(x, y, look.rim)
      } else {
        set(x, y, look.ground)
      }
    }
  }
  const is = (x: number, y: number, c: number) => px[y * W + x] === c

  // Pond: water with a stone rim and two ripples
  const pond = a.pond
  const rim = { ...pond, rx: pond.rx + 2, ry: pond.ry + 2 }
  for (let y = rim.cy - rim.ry; y <= rim.cy + rim.ry; y++) {
    for (let x = rim.cx - rim.rx; x <= rim.cx + rim.rx; x++) {
      if (ellipse(pond, x, y) <= 1) set(x, y, palette.sky)
      else if (ellipse(rim, x, y) <= 1) set(x, y, palette.stone)
    }
  }
  for (const [x, y] of [
    [pond.cx - 9, pond.cy - 3],
    [pond.cx + 3, pond.cy + 4],
  ]) {
    for (let i = 0; i < 5; i++) set(x + i, y, palette.accentBlue)
  }
  // Urzeittal: little puffs of steam over the warm pond
  if (look.steam) {
    for (const [x, y] of [
      [pond.cx - 12, pond.cy - pond.ry - 5],
      [pond.cx + 2, pond.cy - pond.ry - 8],
      [pond.cx + 12, pond.cy - pond.ry - 4],
    ]) {
      for (const [dx, dy] of [
        [0, 0],
        [1, 0],
        [0, -1],
        [1, -1],
        [2, -2],
        [1, -3],
      ]) {
        set(x + dx, y + dy, palette.cream)
      }
    }
  }

  // Sand grains, grass tufts and lots of flowers (a Blumenwiese)
  for (let i = 0; i < 300; i++) {
    const x = zufall(rng, 0, W - 1)
    const y = zufall(rng, 0, H - 1)
    if (is(x, y, look.rim)) set(x, y, look.rimGrain)
  }
  for (let i = 0; i < 1500; i++) {
    const x = zufall(rng, 1, W - 2)
    const y = zufall(rng, 1, H - 1)
    if (!is(x, y, look.ground) || !is(x + 1, y - 1, look.ground)) continue
    const c = rng() < 0.6 ? look.tufts[0] : look.tufts[1]
    set(x, y, c)
    set(x + 1, y - 1, c)
  }
  const flowers = look.flowers
  for (let i = 0; i < look.flowerCount; i++) {
    const x = zufall(rng, 2, W - 3)
    const y = zufall(rng, 2, H - 3)
    if (!is(x, y, look.ground) && !is(x, y, look.tufts[0])) continue
    if (ellipse(MEADOW, x, y) > 0.95 || ellipse(rim, x, y) < 1.4) continue
    const c = flowers[i % flowers.length]
    set(x - 1, y, c)
    set(x + 1, y, c)
    set(x, y - 1, c)
    set(x, y + 1, c)
    set(x, y, palette.gold)
  }

  // Jetty: planks with dark gaps and posts
  for (let y = JETTY.y; y < JETTY.y + JETTY.height; y++) {
    for (let x = JETTY.x; x < JETTY.x + JETTY.width; x++) {
      set(x, y, y % 3 === 2 ? palette.woodDark : palette.woodMid)
    }
  }
  for (const x of [JETTY.x - 1, JETTY.x + JETTY.width]) {
    for (let y = JETTY.y + 16; y < JETTY.y + JETTY.height; y++) set(x, y, palette.woodEdge)
  }

  // Boat: rounded hull with a lighter rim and a little shadow on the water
  const hull = [
    '.cccccccccccccccccccc.',
    'cbbbbbbbbbbbbbbbbbbbbc',
    'caaaaaaaaaaaaaaaaaaaac',
    '.caaaaaaaaaaaaaaaaaac.',
    '..caaaaaaaaaaaaaaaac..',
    '...cccccccccccccccc...',
  ]
  const hullColors: Record<string, number> = {
    a: palette.woodMid,
    b: palette.woodLight,
    c: palette.woodEdge,
  }
  hull.forEach((row, y) =>
    [...row].forEach((ch, x) => ch !== '.' && set(BOAT.x + x, BOAT.y + 2 + y, hullColors[ch])),
  )
  for (let x = 3; x < BOAT.width - 3; x++) shade[(BOAT.y + 8) * W + BOAT.x + x] = 1

  // Soft oval ground shadows under trees, palms and rocks (the sprites are drawn on top)
  for (const o of a.obstacles) {
    const s = OBSTACLE_SIZE[o.kind]
    const cx = o.x + s.w / 2
    const cy = o.y + s.h - 1
    const rx = s.w * 0.35
    for (let y = cy - 1; y <= cy + 1; y++) {
      for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
        if (((x + 0.5 - cx) / rx) ** 2 + ((y + 0.5 - cy) / 1.6) ** 2 <= 1) shade[y * W + x] = 1
      }
    }
  }

  const texture = scene.textures.createCanvas(key, W, H)!
  const ctx = texture.getContext()
  const image = ctx.createImageData(W, H)
  for (let i = 0; i < W * H; i++) {
    const c = px[i]
    const k = shade[i] ? 0.75 : 1 // 25 % black ground shadow
    image.data[i * 4] = ((c >> 16) & 0xff) * k
    image.data[i * 4 + 1] = ((c >> 8) & 0xff) * k
    image.data[i * 4 + 2] = (c & 0xff) * k
    image.data[i * 4 + 3] = 255
  }
  ctx.putImageData(image, 0, 0)
  texture.refresh()
  return key
}

/** Sizes are part of the layout data; the sprites must match them. */
export const ART_SIZES = {
  tree: { w: TREE[0].length, h: TREE.length, expected: OBSTACLE_SIZE.tree },
  acacia: { w: ACACIA[0].length, h: ACACIA.length, expected: OBSTACLE_SIZE.tree },
  fir: { w: FIR[0].length, h: FIR.length, expected: OBSTACLE_SIZE.palm },
  pillar: { w: PILLAR[0].length, h: PILLAR.length, expected: OBSTACLE_SIZE.palm },
  cloud: { w: CLOUD_PATCH[0].length, h: CLOUD_PATCH.length, expected: SPOT_SIZE.grass },
  rock: { w: ROCK[0].length, h: ROCK.length, expected: OBSTACLE_SIZE.rock },
  bush: { w: BUSH[0].length, h: BUSH.length, expected: SPOT_SIZE.bush },
  grass: { w: 26, h: 12, expected: SPOT_SIZE.grass },
}
