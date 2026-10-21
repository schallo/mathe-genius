// Village ground (STYLE_GUIDE §9a): grass in 3 green steps with flowers, paths with a
// darker edge, pond, trees. Baked into one texture; huts are separate sprites.
import type Phaser from 'phaser'
import { seededRng, zufall } from '../math/random'
import { palette } from '../palette'
import {
  HUTS,
  MAIN_PATH,
  POND,
  SPAWN,
  TREES,
  VILLAGE_HEIGHT,
  VILLAGE_WIDTH,
  WILD_EXIT,
  branchPath,
} from '../world/village'
import { rasterize } from './pixels'

const TREE = [
  '............',
  '....aaaa....',
  '..aaccaaaa..',
  '.aacccaaaaa.',
  '.acccaaaaaa.',
  '.aacaaaaaaa.',
  '.aaaaaaaabb.',
  '.aaaaaabbbb.',
  '..abbbbbbb..',
  '...bbbbbb...',
  '.....tt.....',
  '.....tt.....',
  '.....tt.....',
  '....tttt....',
  '............',
  '............',
]

type Rect = { x: number; y: number; width: number; height: number }

export function ensureVillageTexture(scene: Phaser.Scene): string {
  const key = 'village-ground'
  if (scene.textures.exists(key)) return key

  const W = VILLAGE_WIDTH
  const H = VILLAGE_HEIGHT
  const px = new Uint32Array(W * H).fill(palette.grassMid)
  const shadeMask = new Uint8Array(W * H)
  const set = (x: number, y: number, c: number) => {
    if (x >= 0 && y >= 0 && x < W && y < H) px[y * W + x] = c
  }
  const rng = seededRng(7)

  // Grass tufts
  for (let i = 0; i < 500; i++) {
    const x = zufall(rng, 0, W - 2)
    const y = zufall(rng, 1, H - 1)
    const light = rng() < 0.6
    set(x, y, light ? palette.grassLight : palette.grassDark)
    set(x + 1, y - 1, light ? palette.grassLight : palette.grassDark)
  }

  // Paths: fill, then a darker 1 px edge where the path meets grass
  const pathRects: Rect[] = [
    { x: MAIN_PATH.x, y: 0, width: MAIN_PATH.width, height: H },
    ...HUTS.map(branchPath),
    { x: SPAWN.x - 18, y: SPAWN.y - 10, width: 36, height: 22 },
    WILD_EXIT,
  ]
  const onPath = new Uint8Array(W * H)
  for (const r of pathRects) {
    for (let y = r.y; y < r.y + r.height; y++)
      for (let x = r.x; x < r.x + r.width; x++) if (x < W && y < H) onPath[y * W + x] = 1
  }
  const isPath = (x: number, y: number) =>
    x < 0 || y < 0 || x >= W || y >= H || onPath[y * W + x] === 1
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      if (!onPath[y * W + x]) continue
      const edge = !isPath(x - 1, y) || !isPath(x + 1, y) || !isPath(x, y - 1) || !isPath(x, y + 1)
      px[y * W + x] = edge ? palette.pathDark : palette.pathLight
    }
  }
  for (let i = 0; i < 160; i++) {
    const x = zufall(rng, 0, W - 1)
    const y = zufall(rng, 0, H - 1)
    if (onPath[y * W + x]) set(x, y, palette.pathDark)
  }

  // Flowers on the grass (small plus shapes)
  const flowerColors = [palette.rose, palette.cream, palette.gold]
  for (let i = 0; i < 70; i++) {
    const x = zufall(rng, 2, W - 3)
    const y = zufall(rng, 2, H - 3)
    if (isPath(x, y) || isPath(x - 2, y) || isPath(x + 2, y) || isPath(x, y + 2)) continue
    const c = flowerColors[i % flowerColors.length]
    set(x - 1, y, c)
    set(x + 1, y, c)
    set(x, y - 1, c)
    set(x, y + 1, c)
    set(x, y, palette.gold)
  }

  // Pond: rounded water with a stone rim and a few ripples
  const cx = POND.x + POND.width / 2
  const cy = POND.y + POND.height / 2
  for (let y = POND.y - 2; y < POND.y + POND.height + 2; y++) {
    for (let x = POND.x - 2; x < POND.x + POND.width + 2; x++) {
      const d = ((x + 0.5 - cx) / (POND.width / 2)) ** 2 + ((y + 0.5 - cy) / (POND.height / 2)) ** 2
      if (d <= 1) set(x, y, palette.sky)
      else if (d <= 1.35) set(x, y, palette.stone)
    }
  }
  for (const [x, y] of [
    [cx - 6, cy - 2],
    [cx + 3, cy + 3],
  ]) {
    for (let i = 0; i < 4; i++) set(Math.round(x + i), Math.round(y), palette.accentBlue)
  }

  // Trees with a soft oval ground shadow
  const tree = rasterize(
    TREE,
    { a: palette.grassMid, b: palette.grassDark, c: palette.grassLight, t: palette.woodDark },
    palette.woodEdge,
  )
  for (const t of TREES) {
    for (let x = 2; x < 10; x++) shadeMask[(t.y + 14) * W + t.x + x] = 1
    for (let x = 3; x < 9; x++) shadeMask[(t.y + 15) * W + t.x + x] = 1
    tree.forEach((row, y) => row.forEach((c, x) => c !== null && set(t.x + x, t.y + y, c)))
  }

  const texture = scene.textures.createCanvas(key, W, H)!
  const ctx = texture.getContext()
  const image = ctx.createImageData(W, H)
  for (let i = 0; i < W * H; i++) {
    const c = px[i]
    const k = shadeMask[i] ? 0.75 : 1 // 25 % black ground shadow
    image.data[i * 4] = ((c >> 16) & 0xff) * k
    image.data[i * 4 + 1] = ((c >> 8) & 0xff) * k
    image.data[i * 4 + 2] = (c & 0xff) * k
    image.data[i * 4 + 3] = 255
  }
  ctx.putImageData(image, 0, 0)
  texture.refresh()
  return key
}
