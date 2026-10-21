// Colour tokens from docs/STYLE_GUIDE.md §3 and §9. The only place with hex values.

export const palette = {
  curtainDark: 0x2e2442,
  curtainMid: 0x3f3159,
  curtainLight: 0x5a4a7a,
  beam: 0x7a68a0,
  woodLight: 0xe0a86c,
  woodMid: 0xc98d55,
  woodDark: 0x8f5a32,
  woodEdge: 0x5e3a20,
  gold: 0xf2c14e,
  goldDark: 0xc8922a,
  hero: 0xe07a5f,
  heroDark: 0xb5543e,
  cream: 0xf6efe0,
  paperWhite: 0xffffff,
  ink: 0x2a2230,
  accentBlue: 0x8aa6c8,
  pageBg: 0xecebe8,
  pageGrid: 0xdcdad6,

  // Extra item colours (§9)
  rose: 0xf2a0a8,
  roseDark: 0xc86f7e,
  mint: 0x9fd8c0,
  mintDark: 0x5fa88e,
  sky: 0xa8cdf0,
  lilac: 0xc9a8e8,
  hairBrown: 0x6b4226,
  hairBlond: 0xe8c46a,
  hairBlack: 0x2b2228,
  hairRed: 0xc4552e,
  skin1: 0xf6d3b8,
  skin2: 0xe8b48f,
  skin3: 0xc68a5e,
  skin4: 0x8d5a3b,

  // World colours (§9a)
  grassLight: 0xa8d68a,
  grassMid: 0x7fb86a,
  grassDark: 0x5a8f4e,
  pathLight: 0xecd9a8,
  pathDark: 0xc9ac72,
  stone: 0xb8b2a8,
  stoneDark: 0x8a837a,
} as const

export type PaletteToken = keyof typeof palette

/** Colours with alpha, for Phaser calls that take colour and alpha separately. */
export const shadow = { color: 0x000000, alpha: 0.25 } as const
export const overlay = { color: palette.ink, alpha: 0.9 } as const

/** CSS string for a token, e.g. for text styles: css('ink') → '#2a2230'. */
export function css(token: PaletteToken): string {
  return `#${palette[token].toString(16).padStart(6, '0')}`
}
