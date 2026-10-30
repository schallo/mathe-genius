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
  /** Treat (a little bone) (Spielzeug) */
  leckerli: {
    map: ['.......', 'aa...aa', 'aaaaaaa', '.aaaaa.', 'aaaaaaa', 'aa...aa', '.......'],
    legend: { a: palette.woodLight },
    outline: palette.woodDark,
  },
  /** Cushion (Spielzeug) */
  kissen: {
    map: ['.......', 'aaaaaaa', 'abbbbba', 'abbabba', 'abbbbba', 'aaaaaaa', '.......'],
    legend: { a: palette.rose, b: palette.cream },
    outline: palette.roseDark,
  },
  /** Squeaky duck (Spielzeug) */
  ente: {
    map: ['..aa...', '.aeab..', '..aa...', 'aaaaaa.', 'aaaaaa.', '.aaaa..', '.......'],
    legend: { a: palette.gold, b: palette.hero, e: palette.ink },
    outline: palette.goldDark,
  },
  /** Ball of wool (Spielzeug) */
  wolle: {
    map: ['..aaa..', '.ababa.', 'aabaaba', 'abaabaa', 'aabaaba', '.ababa.', '..aaa..'],
    legend: { a: palette.lilac, b: palette.curtainLight },
    outline: palette.curtainLight,
  },
  /** Frisbee (Spielzeug) */
  frisbee: {
    map: ['.......', '..aaa..', '.abbba.', 'aabbbaa', '.aaaaa.', '.......', '.......'],
    legend: { a: palette.sky, b: palette.paperWhite },
    outline: palette.accentBlue,
  },
  /** Tug rope (Spielzeug) */
  seil: {
    map: ['aa.....', '.ab....', '..ba...', '...ab..', '....ba.', '.....aa', '.......'],
    legend: { a: palette.hero, b: palette.cream },
    outline: palette.heroDark,
  },
  /** Little bell (Spielzeug) */
  gloeckchen: {
    map: ['...a...', '..aaa..', '.aaaaa.', '.aaaaa.', 'aaaaaaa', '...b...', '.......'],
    legend: { a: palette.gold, b: palette.goldDark },
    outline: palette.goldDark,
  },
  /** Cuddly bear (Spielzeug) */
  teddy: {
    map: ['a.....a', 'aaaaaaa', 'aeaaaea', 'aabbbaa', '.aaaaa.', 'aa...aa', '.......'],
    legend: { a: palette.woodMid, b: palette.cream, e: palette.ink },
    outline: palette.woodDark,
  },
  /** Angel (fishing rod): rod, line and a rose float */
  angel: {
    map: ['.....aa', '....a.c', '...a..c', '..a...c', '.b....d', 'bb....d', '.......'],
    legend: { a: palette.woodMid, b: palette.woodDark, c: palette.stone, d: palette.rose },
    outline: palette.woodEdge,
  },
  /** Week box of the calendar (closed / opened) */
  box: {
    map: ['aaaaaaa', 'abbcbba', 'aaacaaa', 'abbcbba', 'abbcbba', 'aaaaaaa'],
    legend: { a: palette.woodDark, b: palette.woodMid, c: palette.gold },
    outline: palette.woodEdge,
  },
  boxOpen: {
    map: ['a.....a', '.a...a.', 'aaaaaaa', 'abbcbba', 'abbcbba', 'aaaaaaa'],
    legend: { a: palette.woodDark, b: palette.woodMid, c: palette.gold },
    outline: palette.woodEdge,
  },
  /** Parent mailbox in the village */
  mailbox: {
    map: [
      '.aaaaa..',
      'abbbbbac',
      'abdddbac',
      'abbbbba.',
      'aaaaaaa.',
      '...e....',
      '...e....',
      '...e....',
      '..eee...',
    ],
    legend: {
      a: palette.accentBlue,
      b: palette.sky,
      c: palette.gold,
      d: palette.ink,
      e: palette.woodDark,
    },
    outline: palette.woodEdge,
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
