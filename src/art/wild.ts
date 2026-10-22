// Wild island ground (STYLE_GUIDE §9a): sea with wave pixels, a sandy rim, a meadow full
// of flowers (Blumenwiese), palms, the jetty and the boat. Baked into one texture.
import type Phaser from 'phaser'
import type { AreaId } from '../data/creatures'
import { seededRng, zufall } from '../math/random'
import { palette } from '../palette'
import { BOAT, ISLAND, JETTY, MEADOW, WILD_HEIGHT, WILD_WIDTH, area } from '../world/wild'
import { palmPixels } from './palm'

export function ensureWildTexture(scene: Phaser.Scene, id: AreaId): string {
  const key = `wild-${id}`
  if (scene.textures.exists(key)) return key

  const W = WILD_WIDTH
  const H = WILD_HEIGHT
  const px = new Uint32Array(W * H)
  const shade = new Uint8Array(W * H)
  const set = (x: number, y: number, c: number) => {
    if (x >= 0 && y >= 0 && x < W && y < H) px[y * W + x] = c
  }
  const ellipse = (e: typeof ISLAND, x: number, y: number) =>
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

  // Sand grains, grass tufts and lots of flowers
  for (let i = 0; i < 120; i++) {
    const x = zufall(rng, 0, W - 1)
    const y = zufall(rng, 0, H - 1)
    if (is(x, y, palette.pathLight)) set(x, y, palette.pathDark)
  }
  for (let i = 0; i < 420; i++) {
    const x = zufall(rng, 1, W - 2)
    const y = zufall(rng, 1, H - 1)
    if (!is(x, y, palette.grassMid) || !is(x + 1, y - 1, palette.grassMid)) continue
    const c = rng() < 0.6 ? palette.grassLight : palette.grassDark
    set(x, y, c)
    set(x + 1, y - 1, c)
  }
  const flowers = [palette.rose, palette.cream, palette.gold, palette.lilac]
  for (let i = 0; i < 160; i++) {
    const x = zufall(rng, 2, W - 3)
    const y = zufall(rng, 2, H - 3)
    if (!is(x, y, palette.grassMid) && !is(x, y, palette.grassLight)) continue
    if (ellipse(MEADOW, x, y) > 0.95) continue
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
    for (let y = JETTY.y + 12; y < JETTY.y + JETTY.height; y++) set(x, y, palette.woodEdge)
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

  // Palms with a soft ground shadow
  const tree = palmPixels()
  for (const t of area(id).palms) {
    for (let x = 2; x < 10; x++) shade[(t.y + 14) * W + t.x + x] = 1
    for (let x = 3; x < 9; x++) shade[(t.y + 15) * W + t.x + x] = 1
    tree.forEach((row, y) => row.forEach((c, x) => c !== null && set(t.x + x, t.y + y, c)))
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
