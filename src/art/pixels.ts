// Pixel maps → textures. Maps are colour-agnostic: each character is a role
// ('a' fill, 'b' shade, …) that gets a palette colour when the texture is built.

import type Phaser from 'phaser'

/** Rows of equal length; '.' is transparent. */
export type PixelMap = readonly string[]
/** Role character → colour (0xRRGGBB). */
export type Legend = Record<string, number>

export function mapSize(map: PixelMap) {
  return { width: map[0]?.length ?? 0, height: map.length }
}

/** Throws if rows differ in length or use characters without a colour. */
export function validateMap(map: PixelMap, roles: string): void {
  const { width } = mapSize(map)
  map.forEach((row, y) => {
    if (row.length !== width) throw new Error(`row ${y} has ${row.length} px, expected ${width}`)
    for (const ch of row) {
      if (ch !== '.' && !roles.includes(ch)) throw new Error(`row ${y}: unknown pixel '${ch}'`)
    }
  })
}

/**
 * Returns the colour of every pixel (null = transparent). With `outline`, every
 * transparent pixel next to a filled one gets that colour (STYLE_GUIDE §2:
 * 1 px outline in a darker shade of the fill).
 */
export function rasterize(map: PixelMap, legend: Legend, outline?: number): (number | null)[][] {
  const { width, height } = mapSize(map)
  const px = map.map((row) => [...row].map((ch) => (ch === '.' ? null : legend[ch])))
  if (outline === undefined) return px
  const filled = (x: number, y: number) =>
    y >= 0 && y < height && x >= 0 && x < width && px[y][x] !== null
  return px.map((row, y) =>
    row.map((c, x) => {
      if (c !== null) return c
      const touches = filled(x - 1, y) || filled(x + 1, y) || filled(x, y - 1) || filled(x, y + 1)
      return touches ? outline : null
    }),
  )
}

export type Frame = { name: string; pixels: (number | null)[][] }

/** Creates a canvas texture with all frames side by side and registers each frame by name. */
export function addFrames(scene: Phaser.Scene, key: string, frames: Frame[]): void {
  if (scene.textures.exists(key)) scene.textures.remove(key)
  const height = frames[0].pixels.length
  const width = frames[0].pixels[0].length
  const texture = scene.textures.createCanvas(key, width * frames.length, height)!
  const ctx = texture.getContext()
  frames.forEach((frame, i) => {
    frame.pixels.forEach((row, y) =>
      row.forEach((color, x) => {
        if (color === null) return
        ctx.fillStyle = `#${color.toString(16).padStart(6, '0')}`
        ctx.fillRect(i * width + x, y, 1, 1)
      }),
    )
    texture.add(frame.name, 0, i * width, 0, width, height)
  })
  texture.refresh()
}
