// Builds one texture per layer option, with frames `${direction}-${0|1|2}`.
import type Phaser from 'phaser'
import { palette } from '../../palette'
import { addFrames, rasterize, type Frame, type PixelMap } from '../pixels'
import { ACCESSORY_COLORS, accessories } from './accessory'
import { body, legs } from './body'
import { hairstyles } from './hair'
import {
  CHAR_HEIGHT,
  CHAR_WIDTH,
  DIRECTIONS,
  accessoryShades,
  color,
  hairShades,
  outfitShades,
  skinShades,
  type CharacterLook,
} from './look'
import { outfits } from './outfit'

const pad = (map: PixelMap): PixelMap => [
  ...map,
  ...Array.from({ length: CHAR_HEIGHT - map.length }, () => '.'.repeat(CHAR_WIDTH)),
]

/** Same pixels for all three walk frames (only the body's legs move). */
function staticFrames(maps: Record<string, PixelMap>, fill: number, shade: number): Frame[] {
  return DIRECTIONS.flatMap((dir) => {
    const pixels = rasterize(pad(maps[dir]), { a: fill, b: shade }, shade)
    return [0, 1, 2].map((n) => ({ name: `${dir}-${n}`, pixels }))
  })
}

/**
 * Two-tone outfit: the top (a, b) and the bottom (c, d) each get their own colours and
 * outline; where they meet, fill wins over outline.
 */
function outfitPixels(map: PixelMap, top: [number, number], bottom: [number, number]) {
  const only = (keep: string) => map.map((row) => row.replace(new RegExp(`[^${keep}.]`, 'g'), '.'))
  const topMap = pad(only('ab'))
  const bottomMap = pad(only('cd')).map((row) => row.replace(/c/g, 'a').replace(/d/g, 'b'))
  const legendTop = { a: top[0], b: top[1] }
  const legendBottom = { a: bottom[0], b: bottom[1] }
  const topFill = rasterize(topMap, legendTop)
  const bottomFill = rasterize(bottomMap, legendBottom)
  const topAll = rasterize(topMap, legendTop, top[1])
  const bottomAll = rasterize(bottomMap, legendBottom, bottom[1])
  return topAll.map((row, y) =>
    row.map((_, x) => topFill[y][x] ?? bottomFill[y][x] ?? topAll[y][x] ?? bottomAll[y][x]),
  )
}

export const textureKeys = (look: CharacterLook) => ({
  body: `char-body-${look.skin}`,
  outfit: outfits[look.outfit].twoTone
    ? `char-outfit-${look.outfit}-${look.outfitColor}-${look.outfitColor2}`
    : `char-outfit-${look.outfit}-${look.outfitColor}`,
  hair: `char-hair-${look.hair}-${look.hairColor}`,
  accessory: look.accessory
    ? `char-acc-${look.accessory}-${ACCESSORY_COLORS[look.accessory] ? 'fixed' : look.accessoryColor}`
    : null,
})

/** Creates any missing layer textures for this look. */
export function ensureCharacterTextures(scene: Phaser.Scene, look: CharacterLook): void {
  const keys = textureKeys(look)

  if (!scene.textures.exists(keys.body)) {
    const { fill, shade } = skinShades[look.skin]
    const legend = { a: color(fill), e: palette.ink, p: palette.rose }
    const frames = DIRECTIONS.flatMap((dir) =>
      legs[dir].map(([full, lifted], n) => {
        const pixels = rasterize(pad(body[dir]), legend, color(shade))
        for (const x of full) pixels[20][x] = pixels[21][x] = color(shade)
        for (const x of lifted) pixels[20][x] = color(shade)
        return { name: `${dir}-${n}`, pixels }
      }),
    )
    addFrames(scene, keys.body, frames)
  }

  if (!scene.textures.exists(keys.outfit)) {
    const def = outfits[look.outfit]
    const top = outfitShades[look.outfitColor]
    const bottom = outfitShades[def.twoTone ? look.outfitColor2 : look.outfitColor]
    const topColors: [number, number] = [color(top.fill), color(top.shade)]
    const bottomColors: [number, number] = [color(bottom.fill), color(bottom.shade)]
    const frames = DIRECTIONS.flatMap((dir) =>
      legs[dir].map(([full, lifted], n) => {
        const pixels = outfitPixels(def.maps[dir], topColors, bottomColors)
        // Long trousers: the legs of each walk frame in the trouser colour
        if (def.longLegs) {
          for (const x of full) pixels[20][x] = pixels[21][x] = bottomColors[1]
          for (const x of lifted) pixels[20][x] = bottomColors[1]
        }
        return { name: `${dir}-${n}`, pixels }
      }),
    )
    addFrames(scene, keys.outfit, frames)
  }

  if (!scene.textures.exists(keys.hair)) {
    const { fill, shade } = hairShades[look.hairColor]
    addFrames(scene, keys.hair, staticFrames(hairstyles[look.hair], color(fill), color(shade)))
  }

  if (keys.accessory && look.accessory && !scene.textures.exists(keys.accessory)) {
    const style = look.accessory
    const fixed = ACCESSORY_COLORS[style]
    const { fill, shade } = accessoryShades[look.accessoryColor]
    const legend = fixed
      ? { a: color(fixed.a), b: color(fixed.b), c: color(fixed.c ?? fixed.a) }
      : { a: color(fill), b: color(shade), c: color(shade) }
    const outline = fixed ? (fixed.outline ? color(fixed.outline) : undefined) : color(shade)
    const frames = DIRECTIONS.flatMap((dir) => {
      const pixels = rasterize(pad(accessories[style][dir]), legend, outline)
      return [0, 1, 2].map((n) => ({ name: `${dir}-${n}`, pixels }))
    })
    addFrames(scene, keys.accessory, frames)
  }

  if (!scene.textures.exists('char-shadow')) {
    const map = ['.aaaaaaaaaa.', 'aaaaaaaaaaaa', '.aaaaaaaaaa.']
    const small = ['..aaaaaaaa..', '.aaaaaaaaaa.', '..aaaaaaaa..']
    addFrames(scene, 'char-shadow', [
      { name: 'big', pixels: rasterize(map, { a: 0x000000 }) },
      { name: 'small', pixels: rasterize(small, { a: 0x000000 }) },
    ])
  }
}
