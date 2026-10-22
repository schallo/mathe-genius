// Wild island (STYLE_GUIDE §9a): sea with wave pixels, a sandy rim, a meadow full of
// flowers, a pond, the jetty and the boat are baked into one ground texture. Trees, palms,
// rocks, bushes and tall grass are separate sprites so she can walk behind them and
// creatures can hide in the bushes.
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
} from '../world/wild'
import { palmPixels } from './palm'
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

const OBSTACLE_ART: Record<ObstacleKind, () => (number | null)[][]> = {
  palm: palmPixels,
  tree: () =>
    rasterize(TREE, { ...GREEN, t: palette.woodMid, d: palette.woodDark }, palette.woodEdge),
  rock: () =>
    rasterize(ROCK, { a: palette.stone, b: palette.stoneDark, c: palette.cream }, palette.woodEdge),
}

export function ensureObstacleTexture(scene: Phaser.Scene, kind: ObstacleKind): string {
  const key = `wild-${kind}`
  if (!scene.textures.exists(key))
    addFrames(scene, key, [{ name: 'idle', pixels: OBSTACLE_ART[kind]() }])
  return key
}

export function ensureSpotTexture(scene: Phaser.Scene, kind: SpotKind): string {
  const key = `wild-${kind}`
  if (scene.textures.exists(key)) return key
  const pixels =
    kind === 'bush'
      ? rasterize(BUSH, { ...GREEN, p: palette.rose }, palette.woodEdge)
      : rasterize(grassPatch(), { a: palette.grassLight, b: palette.grassDark, c: palette.cream })
  addFrames(scene, key, [{ name: 'idle', pixels }])
  return key
}

export function ensureWildTexture(scene: Phaser.Scene, id: AreaId): string {
  const key = `wild-ground-${id}`
  if (scene.textures.exists(key)) return key
  const a = area(id)
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
        const wave = (x + y * 3) % 11 === 0 && y % 4 === 1
        set(x, y, wave ? palette.accentBlue : palette.sky)
      } else if (d > 0.985) {
        set(x, y, palette.cream) // surf line
      } else if (ellipse(MEADOW, x, y) > 1.06) {
        set(x, y, palette.pathLight)
      } else {
        set(x, y, palette.grassMid)
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

  // Sand grains, grass tufts and lots of flowers (a Blumenwiese)
  for (let i = 0; i < 300; i++) {
    const x = zufall(rng, 0, W - 1)
    const y = zufall(rng, 0, H - 1)
    if (is(x, y, palette.pathLight)) set(x, y, palette.pathDark)
  }
  for (let i = 0; i < 1500; i++) {
    const x = zufall(rng, 1, W - 2)
    const y = zufall(rng, 1, H - 1)
    if (!is(x, y, palette.grassMid) || !is(x + 1, y - 1, palette.grassMid)) continue
    const c = rng() < 0.6 ? palette.grassLight : palette.grassDark
    set(x, y, c)
    set(x + 1, y - 1, c)
  }
  const flowers = [palette.rose, palette.cream, palette.gold, palette.lilac]
  for (let i = 0; i < 520; i++) {
    const x = zufall(rng, 2, W - 3)
    const y = zufall(rng, 2, H - 3)
    if (!is(x, y, palette.grassMid) && !is(x, y, palette.grassLight)) continue
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
  rock: { w: ROCK[0].length, h: ROCK.length, expected: OBSTACLE_SIZE.rock },
  bush: { w: BUSH[0].length, h: BUSH.length, expected: SPOT_SIZE.bush },
  grass: { w: 26, h: 12, expected: SPOT_SIZE.grass },
}
