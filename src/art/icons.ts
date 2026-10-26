// Small UI icons as pixel maps (palette colours only).
import type Phaser from 'phaser'
import { palette } from '../palette'
import { HEART } from './pets/maps'
import { addFrames, rasterize, type PixelMap } from './pixels'

type Icon = { map: PixelMap; legend: Record<string, number>; outline?: number }

/** Round medal, 11 × 11 (row badges, STYLE_GUIDE §9 "Einmaleins-Training") */
const MEDAL = [
  '...aaaaa...',
  '..abbbbba..',
  '.abbbbbbba.',
  'abbbbbbbbba',
  'abbbbbbbbba',
  'abbbbbbbbba',
  'abbbbbbbbba',
  'abbbbbbbbba',
  '.abbbbbbba.',
  '..abbbbba..',
  '...aaaaa...',
]

const ICONS: Record<string, Icon> = {
  medal: { map: MEDAL, legend: { a: palette.goldDark, b: palette.gold } },
  /** Empty place on the trophy shelf */
  medalSlot: { map: MEDAL, legend: { a: palette.woodEdge, b: palette.woodDark } },
  heart: { map: HEART, legend: { a: palette.rose }, outline: palette.roseDark },
  // Round gold coin (9 × 9 with the rim): light from the top left, shading bottom right
  coin: {
    map: ['..aaa..', '.acaaa.', 'acaaaba', 'aaaaaba', 'aaaaaba', '.abbba.', '..aaa..'],
    legend: { a: palette.gold, b: palette.goldDark, c: palette.paperWhite },
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
  lock: {
    map: ['..aaa..', '.a...a.', '.a...a.', 'aaaaaaa', 'aaabaaa', 'aaabaaa', 'aaaaaaa'],
    legend: { a: palette.woodDark, b: palette.cream },
  },
  ball: {
    map: ['..aaa..', '.aabaa.', 'aabbbaa', 'abbabba', 'aabbbaa', '.aabaa.', '..aaa..'],
    legend: { a: palette.rose, b: palette.cream },
    outline: palette.roseDark,
  },
  /** Correct answers counter in the Einmaleins drills */
  check: {
    map: ['......a', '.....aa', 'a...aa.', 'aa.aa..', '.aaa...', '..a....'],
    legend: { a: palette.mintDark },
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
