// Stage decor drawings (GAME_DESIGN §4 "Bühne", STYLE_GUIDE §9 "Shop & wardrobe"):
// curtain and light colours, and the props baked into the stage texture. Palette only,
// hard pixel steps. A new decor item = an entry in data/items.ts plus its look here.
import { item as findItem, type DecorSlot } from '../data/items'
import { palette } from '../palette'
import type { StageDecor } from '../state/stage'

const C = palette

export type CurtainLook = { dark: number; mid: number; light: number; beam: number }

/** The plain stage: purple curtains with tapered beams (STYLE_GUIDE §4) */
export const PLAIN_CURTAIN: CurtainLook = {
  dark: C.curtainDark,
  mid: C.curtainMid,
  light: C.curtainLight,
  beam: C.beam,
}

export const CURTAINS: Record<string, CurtainLook> = {
  rosa: { dark: C.roseDark, mid: C.rose, light: C.cream, beam: C.cream },
  mint: { dark: C.mintDark, mid: C.mint, light: C.cream, beam: C.cream },
  himmel: { dark: C.accentBlue, mid: C.sky, light: C.paperWhite, beam: C.paperWhite },
  gold: { dark: C.goldDark, mid: C.gold, light: C.cream, beam: C.cream },
}

export const BEAMS: Record<string, number> = {
  gold: C.gold,
  rosa: C.rose,
  lila: C.lilac,
}

/** Slot → look name of what is up (unknown ids are skipped) */
export function decorLooks(stage: StageDecor): Partial<Record<DecorSlot, string>> {
  const looks: Partial<Record<DecorSlot, string>> = {}
  for (const id of Object.values(stage)) {
    const decor = id ? findItem(id)?.decor : undefined
    if (decor) looks[decor.slot] = decor.look
  }
  return looks
}

/** Texture key part, so every combination is baked once */
export const decorKey = (stage: StageDecor): string =>
  Object.entries(decorLooks(stage))
    .map(([slot, look]) => `${slot}:${look}`)
    .sort()
    .join(',')

export function curtainLook(stage: StageDecor): CurtainLook {
  const looks = decorLooks(stage)
  const curtain = CURTAINS[looks.vorhang ?? ''] ?? PLAIN_CURTAIN
  return { ...curtain, beam: BEAMS[looks.licht ?? ''] ?? curtain.beam }
}

type Rect = (x: number, y: number, w: number, h: number, c: number) => void

const RUGS: Record<string, { body: number; rim: number; dots: number }> = {
  rot: { body: C.rose, rim: C.roseDark, dots: C.gold },
  blau: { body: C.sky, rim: C.accentBlue, dots: C.cream },
}

/** Every look the drawings know, per slot (the tests check each decor item has one) */
export const KNOWN_LOOKS: Record<DecorSlot, string[]> = {
  vorhang: Object.keys(CURTAINS),
  licht: Object.keys(BEAMS),
  teppich: Object.keys(RUGS),
  deko: ['pflanzen', 'laternen', 'sterne'],
  publikum: ['publikum'],
}

const HAIR = [C.hairBrown, C.hairBlond, C.hairBlack, C.hairGinger, C.hairRed, C.hairBrown]
const SHIRTS = [C.rose, C.mint, C.sky, C.lilac, C.gold, C.accentBlue]
const SKIN = C.skin1

/** Props on the stage: rug on the floor, plants or lanterns or stars, a front-row audience. */
export function drawDecorProps(rect: Rect, stage: StageDecor, W: number, floorY: number): void {
  const looks = decorLooks(stage)

  // Rug: lies on the floor right in front of the action line, with a dotted pattern
  const rug = RUGS[looks.teppich ?? '']
  if (rug) {
    const x = 34
    const w = W - 68
    const y = floorY + 3
    rect(x, y, w, 7, rug.rim)
    rect(x + 1, y + 1, w - 2, 5, rug.body)
    for (let dx = 4; dx < w - 4; dx += 6) rect(x + dx, y + 3, 2, 1, rug.dots)
    for (let dy = 0; dy < 7; dy += 2) {
      rect(x - 2, y + dy, 2, 1, rug.dots)
      rect(x + w, y + dy, 2, 1, rug.dots)
    }
  }

  // Potted plants at both sides of the stage
  if (looks.deko === 'pflanzen') {
    for (const x of [4, W - 16]) {
      const y = floorY
      rect(x + 2, y - 7, 8, 1, C.heroDark)
      rect(x + 3, y - 6, 6, 6, C.hero)
      rect(x + 8, y - 6, 1, 6, C.heroDark)
      rect(x + 5, y - 17, 2, 10, C.grassDark)
      rect(x + 2, y - 15, 3, 2, C.grassMid)
      rect(x + 7, y - 16, 3, 2, C.grassMid)
      rect(x + 1, y - 12, 4, 2, C.grassMid)
      rect(x + 7, y - 12, 4, 2, C.grassMid)
      rect(x + 3, y - 9, 6, 2, C.grassLight)
    }
  }

  // Two lanterns hanging from the valance
  if (looks.deko === 'laternen') {
    for (const cx of [22, W - 23]) {
      rect(cx, 12, 1, 8, C.woodDark)
      rect(cx - 3, 20, 7, 1, C.woodDark)
      rect(cx - 3, 21, 7, 7, C.gold)
      rect(cx - 3, 21, 1, 7, C.goldDark)
      rect(cx + 3, 21, 1, 7, C.goldDark)
      rect(cx - 1, 23, 3, 3, C.cream)
      rect(cx - 2, 28, 5, 1, C.woodDark)
    }
  }

  // A garland of little gold stars under the valance
  if (looks.deko === 'sterne') {
    for (let x = 0; x < W; x += 2) {
      const sag = Math.round(Math.sin(((x % 30) / 30) * Math.PI) * 4)
      rect(x, 13 + sag, 1, 1, C.goldDark)
    }
    for (let cx = 15; cx < W; cx += 30) {
      const cy = 18
      rect(cx - 2, cy, 5, 1, C.gold)
      rect(cx, cy - 2, 1, 5, C.gold)
      rect(cx - 1, cy - 1, 3, 3, C.gold)
      rect(cx, cy, 1, 1, C.paperWhite)
    }
  }

  // Front-row audience: the backs of little heads at both front corners
  if (looks.publikum) {
    const xs = [2, 12, 22, W - 9, W - 19, W - 29]
    xs.forEach((x, i) => {
      const by = floorY + 9 + (i % 2)
      const hair = HAIR[i % HAIR.length]
      rect(x - 1, by, 9, 4, SHIRTS[i % SHIRTS.length])
      rect(x + 1, by - 7, 5, 1, hair)
      rect(x, by - 6, 7, 5, hair)
      rect(x + 1, by - 1, 5, 1, hair)
      rect(x - 1, by - 4, 1, 2, SKIN)
      rect(x + 7, by - 4, 1, 2, SKIN)
    })
  }
}
