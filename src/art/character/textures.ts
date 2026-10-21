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

export const textureKeys = (look: CharacterLook) => ({
  body: `char-body-${look.skin}`,
  outfit: `char-outfit-${look.outfit}-${look.outfitColor}`,
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
    const { fill, shade } = outfitShades[look.outfitColor]
    addFrames(scene, keys.outfit, staticFrames(outfits[look.outfit], color(fill), color(shade)))
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
