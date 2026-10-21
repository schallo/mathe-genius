// Small UI icons as pixel maps (palette colours only).
import type Phaser from 'phaser'
import { palette } from '../palette'
import { HEART } from './pets/maps'
import { addFrames, rasterize, type PixelMap } from './pixels'

type Icon = { map: PixelMap; legend: Record<string, number>; outline?: number }

const ICONS: Record<string, Icon> = {
  heart: { map: HEART, legend: { a: palette.rose }, outline: palette.roseDark },
  // Gold coin with horizontal stripes (STYLE_GUIDE §6)
  coin: {
    map: ['.aaaaa.', 'abbbbba', 'aaaaaaa', 'abbbbba', 'aaaaaaa', 'abbbbba', '.aaaaa.'],
    legend: { a: palette.gold, b: palette.goldDark },
    outline: palette.goldDark,
  },
  soundOn: {
    map: [
      '...a.....',
      '..aa..b..',
      'aaaa...b.',
      'aaaa.b.b.',
      'aaaa...b.',
      '..aa..b..',
      '...a.....',
    ],
    legend: { a: palette.ink, b: palette.ink },
  },
  soundOff: {
    map: [
      '...a.....',
      '..aa.....',
      'aaaa.b.b.',
      'aaaa..b..',
      'aaaa.b.b.',
      '..aa.....',
      '...a.....',
    ],
    legend: { a: palette.ink, b: palette.ink },
  },
  house: {
    map: [
      '....a....',
      '...aaa...',
      '..aaaaa..',
      '.aaaaaaa.',
      '..abbba..',
      '..abbba..',
      '..abbba..',
    ],
    legend: { a: palette.ink, b: palette.paperWhite },
  },
  star: {
    map: ['...a...', '...a...', 'aaaaaaa', '.aaaaa.', '..aaa..', '.aa.aa.', 'aa...aa'],
    legend: { a: palette.gold },
    outline: palette.goldDark,
  },
}

export type IconName = keyof typeof ICONS

/** Texture key for an icon, created on first use. */
export function icon(scene: Phaser.Scene, name: IconName): string {
  const key = `icon-${name}`
  if (!scene.textures.exists(key)) {
    const { map, legend, outline } = ICONS[name]
    addFrames(scene, key, [{ name: 'icon', pixels: rasterize(map, legend, outline) }])
  }
  return key
}
