// Which colour each layer option uses. Pure data; colours come from palette tokens only.
import { palette, type PaletteToken } from '../../palette'
import type { AccessoryStyle } from './accessory'
import type { HairStyle } from './hair'
import { outfits, type OutfitStyle } from './outfit'

export type Direction = 'down' | 'up' | 'side'
export const DIRECTIONS: Direction[] = ['down', 'up', 'side']

/** Frame size of every character layer: 16 × 22 px (20 px body + 2 px legs). */
export const CHAR_WIDTH = 16
export const CHAR_HEIGHT = 22

export type SkinTone = 'skin1' | 'skin2' | 'skin3' | 'skin4'
export type HairColor = 'rotblond' | 'braun' | 'blond' | 'schwarz' | 'rot'
export type OutfitColor =
  'rosa' | 'mint' | 'himmel' | 'flieder' | 'gelb' | 'jeans' | 'braun' | 'grau' | 'terrakotta'
export type AccessoryColor = 'gold' | 'rosa' | 'himmel' | 'mint' | 'flieder' | 'terrakotta'
/** Only used to pick the starting look in character creation; every item fits everyone */
export type Figure = 'maedchen' | 'junge'

export type CharacterLook = {
  figure: Figure
  skin: SkinTone
  hair: HairStyle
  hairColor: HairColor
  outfit: OutfitStyle
  outfitColor: OutfitColor
  /** Colour of the bottom part (trousers, skirt) of two-tone outfits */
  outfitColor2: OutfitColor
  accessory: AccessoryStyle | null
  accessoryColor: AccessoryColor
}

/** Starting look, modelled on her: fair skin, ginger hair pulled back into a ponytail. */
export const DEFAULT_LOOK: CharacterLook = {
  figure: 'maedchen',
  skin: 'skin1',
  hair: 'pferdeschwanz',
  hairColor: 'rotblond',
  outfit: 'kleid',
  outfitColor: 'mint',
  outfitColor2: 'jeans',
  accessory: 'schleife',
  accessoryColor: 'rosa',
}

/** Starting look of the boy: short hair, T-shirt and jeans, no accessory. */
export const DEFAULT_BOY_LOOK: CharacterLook = {
  ...DEFAULT_LOOK,
  figure: 'junge',
  hair: 'kurz',
  hairColor: 'braun',
  outfit: 'shirt',
  outfitColor: 'himmel',
  outfitColor2: 'jeans',
  accessory: null,
}

/** Fills in fields that older saves don't have yet (figure, second outfit colour). */
export function normalizeLook(look: Partial<CharacterLook>): CharacterLook {
  return {
    ...DEFAULT_LOOK,
    ...look,
    figure: look.figure === 'junge' ? 'junge' : 'maedchen',
    outfitColor2:
      look.outfitColor2 && look.outfitColor2 in outfitShades ? look.outfitColor2 : 'jeans',
  }
}

export const isTwoTone = (look: CharacterLook) => outfits[look.outfit].twoTone

type Shades = { fill: PaletteToken; shade: PaletteToken }

export const skinShades: Record<SkinTone, Shades> = {
  skin1: { fill: 'skin1', shade: 'skin3' },
  skin2: { fill: 'skin2', shade: 'skin3' },
  skin3: { fill: 'skin3', shade: 'skin4' },
  skin4: { fill: 'skin4', shade: 'hairBrown' },
}

export const hairShades: Record<HairColor, Shades> = {
  rotblond: { fill: 'hairGinger', shade: 'hairRed' },
  braun: { fill: 'hairBrown', shade: 'woodEdge' },
  blond: { fill: 'hairBlond', shade: 'goldDark' },
  schwarz: { fill: 'hairBlack', shade: 'ink' },
  rot: { fill: 'hairRed', shade: 'heroDark' },
}

export const outfitShades: Record<OutfitColor, Shades> = {
  rosa: { fill: 'rose', shade: 'roseDark' },
  mint: { fill: 'mint', shade: 'mintDark' },
  himmel: { fill: 'sky', shade: 'accentBlue' },
  flieder: { fill: 'lilac', shade: 'curtainLight' },
  gelb: { fill: 'gold', shade: 'goldDark' },
  jeans: { fill: 'accentBlue', shade: 'curtainLight' },
  braun: { fill: 'woodMid', shade: 'woodDark' },
  grau: { fill: 'stone', shade: 'stoneDark' },
  terrakotta: { fill: 'hero', shade: 'heroDark' },
}

export const accessoryShades: Record<AccessoryColor, Shades> = {
  gold: { fill: 'gold', shade: 'goldDark' },
  rosa: { fill: 'rose', shade: 'roseDark' },
  himmel: { fill: 'sky', shade: 'accentBlue' },
  mint: { fill: 'mint', shade: 'mintDark' },
  flieder: { fill: 'lilac', shade: 'curtainLight' },
  terrakotta: { fill: 'hero', shade: 'heroDark' },
}

export const color = (token: PaletteToken) => palette[token]
