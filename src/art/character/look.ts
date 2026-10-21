// Which colour each layer option uses. Pure data; colours come from palette tokens only.
import { palette, type PaletteToken } from '../../palette'
import type { AccessoryStyle } from './accessory'
import type { HairStyle } from './hair'
import type { OutfitStyle } from './outfit'

export type Direction = 'down' | 'up' | 'side'
export const DIRECTIONS: Direction[] = ['down', 'up', 'side']

/** Frame size of every character layer: 16 × 22 px (20 px body + 2 px legs). */
export const CHAR_WIDTH = 16
export const CHAR_HEIGHT = 22

export type SkinTone = 'skin1' | 'skin2' | 'skin3' | 'skin4'
export type HairColor = 'rotblond' | 'braun' | 'blond' | 'schwarz' | 'rot'
export type OutfitColor = 'rosa' | 'mint' | 'himmel' | 'flieder'
export type AccessoryColor = 'gold' | 'rosa'

export type CharacterLook = {
  skin: SkinTone
  hair: HairStyle
  hairColor: HairColor
  outfit: OutfitStyle
  outfitColor: OutfitColor
  accessory: AccessoryStyle | null
  accessoryColor: AccessoryColor
}

/** Starting look, modelled on her: fair skin, ginger hair pulled back into a ponytail. */
export const DEFAULT_LOOK: CharacterLook = {
  skin: 'skin1',
  hair: 'pferdeschwanz',
  hairColor: 'rotblond',
  outfit: 'kleid',
  outfitColor: 'mint',
  accessory: 'schleife',
  accessoryColor: 'rosa',
}

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
}

export const accessoryShades: Record<AccessoryColor, Shades> = {
  gold: { fill: 'gold', shade: 'goldDark' },
  rosa: { fill: 'rose', shade: 'roseDark' },
}

export const color = (token: PaletteToken) => palette[token]
