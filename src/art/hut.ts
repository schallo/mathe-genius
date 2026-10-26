// Hut sprites (STYLE_GUIDE §9a): chunky 32 × 34 px, roof colour per hut, visible door and
// a big name board on the roof (chosen 2026-10-22: names are easier to remember than icons;
// the small icon plates above the doors were removed 2026-10-26). Unbuilt huts get a
// construction barrier.
import type Phaser from 'phaser'
import { palette, type PaletteToken } from '../palette'
import { addText } from '../ui/text'
import { HUT_HEIGHT, HUT_WIDTH, SIGN_HEIGHT, type Hut } from '../world/village'
import { addFrames, rasterize } from './pixels'

export function hutTextureKey(roof: PaletteToken) {
  return `hut-${roof}`
}

export function ensureHutTexture(scene: Phaser.Scene, roof: PaletteToken): string {
  const key = hutTextureKey(roof)
  if (scene.textures.exists(key)) return key

  const px: (number | null)[][] = Array.from({ length: HUT_HEIGHT }, () =>
    Array.from({ length: HUT_WIDTH }, () => null),
  )
  const rect = (x: number, y: number, w: number, h: number, c: number) => {
    for (let yy = y; yy < y + h; yy++) for (let xx = x; xx < x + w; xx++) px[yy][xx] = c
  }

  // Walls with a darker line under the eaves
  rect(2, 12, 28, 22, palette.cream)
  rect(2, 12, 28, 2, palette.stone)
  rect(2, 12, 1, 22, palette.woodDark)
  rect(29, 12, 1, 22, palette.woodDark)
  rect(2, 33, 28, 1, palette.woodDark)

  // Roof: widening towards the bottom, shingle line every third row
  for (let y = 0; y < 12; y++) {
    const inset = Math.max(0, 6 - Math.floor(y / 2))
    rect(inset, y, HUT_WIDTH - inset * 2, 1, y % 3 === 2 ? palette.woodEdge : palette[roof])
    px[y][inset] = px[y][HUT_WIDTH - 1 - inset] = palette.woodEdge
  }
  rect(6, 0, 20, 1, palette.woodEdge)

  // Windows
  for (const x of [5, 22]) {
    rect(x, 17, 5, 5, palette.woodDark)
    rect(x + 1, 18, 3, 3, palette.sky)
  }

  // Door with a gold knob
  rect(12, 22, 8, 12, palette.woodDark)
  rect(13, 23, 6, 11, palette.woodMid)
  px[28][17] = palette.gold

  addFrames(scene, key, [{ name: 'hut', pixels: px }])
  return key
}

/** Big name board on the roof: cream board with a dark wooden frame on two posts, VT323. */
export function addHutSign(scene: Phaser.Scene, hut: Hut, depth: number): void {
  const cx = hut.x + HUT_WIDTH / 2
  const top = hut.y - SIGN_HEIGHT + 1
  const text = addText(scene, cx, top + 6, hut.sign, 'title', 11).setDepth(depth + 1)
  const w = Math.ceil(text.width) + 8
  const x = Math.round(cx - w / 2)
  const g = scene.add.graphics().setDepth(depth)
  g.fillStyle(palette.woodDark)
    .fillRect(x + 4, top + 12, 2, 4)
    .fillRect(x + w - 6, top + 12, 2, 4)
  g.fillStyle(palette.woodEdge).fillRect(x, top, w, 13)
  g.fillStyle(palette.cream).fillRect(x + 1, top + 1, w - 2, 11)
}

/** Striped construction barrier (gold / wood) to place in front of an unbuilt hut's door. */
export function ensureBarrierTexture(scene: Phaser.Scene): string {
  const key = 'hut-barrier'
  if (scene.textures.exists(key)) return key
  const map = [
    '.b..........b.',
    'aabbaabbaabbaa',
    'bbaabbaabbaabb',
    '.b..........b.',
    '.b..........b.',
  ]
  addFrames(scene, key, [
    { name: 'barrier', pixels: rasterize(map, { a: palette.gold, b: palette.woodDark }) },
  ])
  return key
}
