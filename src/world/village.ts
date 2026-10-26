// Village layout as data (GAME_DESIGN §3a). Pure logic, no Phaser.
import { seededRng, zufall } from '../math/random'
import type { PaletteToken } from '../palette'
import type { Grid } from './path'

export const VILLAGE_WIDTH = 180
export const VILLAGE_HEIGHT = 502
/** Walk grid resolution in pixels. */
export const CELL = 4

export const HUT_WIDTH = 32
export const HUT_HEIGHT = 34

export type Hut = {
  id: string
  /** German name in captions */
  name: string
  /** Short name on the big name board on the roof (max. 10 letters) */
  sign: string
  x: number
  y: number
  roof: PaletteToken
  /** Scene key to open, or null while the hut is still a construction site */
  scene: string | null
  /** Passed to the scene, e.g. which dojo it is */
  data?: Record<string, unknown>
}

/** Main path: a vertical strip through the middle of the village. */
export const MAIN_PATH = { x: 80, width: 20 }

export const HUTS: Hut[] = [
  {
    id: 'bibliothek',
    name: 'Bibliothek',
    sign: 'Bibliothek',
    x: 20,
    y: 40,
    roof: 'curtainLight',
    scene: 'Library',
  },
  {
    id: 'zahlenturm',
    name: 'Zahlenturm',
    sign: 'Zahlenturm',
    x: 128,
    y: 40,
    roof: 'stoneDark',
    scene: 'LearnHut',
    data: { hut: 'zahlenturm' },
  },
  // Einmaleins-Dojos (GAME_DESIGN §6a), one for · and one for : (decided 2026-10-23)
  {
    id: 'maldojo',
    name: 'Mal-Dojo',
    sign: 'Mal-Dojo',
    x: 20,
    y: 110,
    roof: 'heroDark',
    scene: 'EinmaleinsMenu',
    data: { op: 'mul' },
  },
  {
    id: 'teildojo',
    name: 'Teil-Dojo',
    sign: 'Teil-Dojo',
    x: 128,
    y: 110,
    roof: 'lilac',
    scene: 'EinmaleinsMenu',
    data: { op: 'div' },
  },
  {
    id: 'theater',
    // The stage hut: tasks from the hut of the week, double coins (renamed 2026-10-27)
    name: 'Bonuswoche',
    sign: 'Bonuswoche',
    x: 20,
    y: 180,
    roof: 'curtainMid',
    scene: 'Show',
  },
  {
    id: 'marktstand',
    name: 'Marktstand',
    sign: 'Marktstand',
    x: 128,
    y: 180,
    roof: 'mintDark',
    scene: 'LearnHut',
    data: { hut: 'marktstand' },
  },
  {
    id: 'laden',
    name: 'Laden',
    sign: 'Laden',
    x: 20,
    y: 250,
    roof: 'goldDark',
    scene: 'Shop',
  },
  {
    id: 'tierheim',
    name: 'Tierheim',
    sign: 'Tierheim',
    x: 128,
    y: 250,
    roof: 'roseDark',
    scene: 'Shelter',
  },
  {
    id: 'haus',
    name: 'Mein Haus',
    sign: 'Mein Haus',
    x: 20,
    y: 320,
    roof: 'heroDark',
    scene: 'Wardrobe',
  },
  {
    id: 'werkstatt',
    name: 'Rechenwerkstatt',
    sign: 'Werkstatt',
    x: 20,
    y: 390,
    roof: 'woodDark',
    scene: 'LearnHut',
    data: { hut: 'werkstatt' },
  },
]

export const POND = { x: 132, y: 326, width: 28, height: 18 }

/** The village is an island: sea above `top` and below `bottom`, beach above the lower sea. */
export const SEA = { top: 12, bottom: 484 }
export const BEACH_Y = 466

/** Where she starts and where she reappears after leaving the village scene. */
export const SPAWN = { x: 90, y: 470 }

/** The parents' mailbox (opens the parent area), right of the beach square. */
export const MAILBOX = { x: 118, y: 448, width: 10, height: 11 }

/** Top end of the main path: the jetty with the boat to the wild islands. */
export const WILD_EXIT = { x: MAIN_PATH.x, y: 0, width: MAIN_PATH.width, height: 10 }

// ---------- Plants ----------

export type PlantKind = 'palm' | 'smallPalm' | 'tree' | 'fir' | 'bush' | 'flowerBush'

type Rect = { x: number; y: number; w: number; h: number }

/** Size of each plant sprite and its foot (the part that blocks walking), relative to x/y. */
export const PLANT_KINDS: Record<PlantKind, { w: number; h: number; foot: Rect }> = {
  palm: { w: 12, h: 16, foot: { x: 4, y: 11, w: 5, h: 4 } },
  smallPalm: { w: 10, h: 12, foot: { x: 3, y: 8, w: 4, h: 3 } },
  tree: { w: 14, h: 16, foot: { x: 4, y: 10, w: 6, h: 5 } },
  fir: { w: 10, h: 16, foot: { x: 3, y: 10, w: 4, h: 4 } },
  bush: { w: 10, h: 8, foot: { x: 1, y: 2, w: 8, h: 4 } },
  flowerBush: { w: 10, h: 8, foot: { x: 1, y: 2, w: 8, h: 4 } },
}

/** How often each kind is picked in the open spots (the shores get palms first) */
const PLANT_MIX: PlantKind[] = [
  'palm',
  'smallPalm',
  'tree',
  'tree',
  'tree',
  'fir',
  'fir',
  'bush',
  'bush',
  'flowerBush',
  'flowerBush',
]

export type Plant = { kind: PlantKind; x: number; y: number }

const PLANT_COUNT = 40
/** Half the width of the widest name board ("Marktstand") plus a margin */
const SIGN_HALF_WIDTH = 32
const PLANT_SEED = 11

const overlaps = (a: Rect, b: Rect) =>
  a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h

const grow = (r: Rect, m: number): Rect => ({
  x: r.x - m,
  y: r.y - m,
  w: r.w + 2 * m,
  h: r.h + 2 * m,
})

export const plantRect = (p: Plant): Rect => ({
  x: p.x,
  y: p.y,
  w: PLANT_KINDS[p.kind].w,
  h: PLANT_KINDS[p.kind].h,
})

/** Places that stay free of plants: huts with their name boards, paths, pond, spawn, jetty. */
export function plantKeepOut(): Rect[] {
  return [
    ...HUTS.map((h) => grow({ x: h.x, y: h.y, w: HUT_WIDTH, h: HUT_HEIGHT }, 2)),
    // Name boards are wider than the huts (up to 10 letters)
    ...HUTS.map((h) => ({
      x: h.x + HUT_WIDTH / 2 - SIGN_HALF_WIDTH,
      y: h.y - SIGN_HEIGHT - 2,
      w: 2 * SIGN_HALF_WIDTH,
      h: SIGN_HEIGHT + 4,
    })),
    ...HUTS.map(branchPath).map((r) => grow({ x: r.x, y: r.y, w: r.width, h: r.height }, 2)),
    { x: MAIN_PATH.x - 3, y: 0, w: MAIN_PATH.width + 6, h: VILLAGE_HEIGHT },
    grow({ x: POND.x, y: POND.y, w: POND.width, h: POND.height }, 4),
    grow({ x: MAILBOX.x, y: MAILBOX.y, w: MAILBOX.width, h: MAILBOX.height }, 3),
    { x: SPAWN.x - 22, y: SPAWN.y - 14, w: 44, h: 30 },
  ]
}

/**
 * Plants scattered at random, but always the same (fixed seed): no plant on a hut, its
 * name board, a path, the pond or another plant. Palms may stand on the beach.
 */
function placePlants(): Plant[] {
  const rng = seededRng(PLANT_SEED)
  const keepOut = plantKeepOut()
  const plants: Plant[] = []
  /** Only the shore palms may stand on the beach */
  const tryPlace = (plant: Plant, beach = false) => {
    const rect = plantRect(plant)
    const bottom = beach ? SEA.bottom - 3 : BEACH_Y - 1
    if (rect.x < 1 || rect.x + rect.w > VILLAGE_WIDTH - 1) return
    if (rect.y < SEA.top + 2 || rect.y + rect.h > bottom) return
    if (keepOut.some((r) => overlaps(rect, r))) return
    if (plants.some((p) => overlaps(rect, grow(plantRect(p), 2)))) return
    plants.push(plant)
  }
  // First a loose row of palms along both shores (jittered, so it doesn't look planted)
  for (let y = SEA.top + 4; y < SEA.bottom - 16; y += 44) {
    for (const side of [0, 1]) {
      if (rng() < 0.25) continue
      const kind: PlantKind = rng() < 0.7 ? 'palm' : 'smallPalm'
      const x =
        side === 0 ? zufall(rng, 1, 4) : VILLAGE_WIDTH - PLANT_KINDS[kind].w - zufall(rng, 1, 4)
      tryPlace({ kind, x, y: y + zufall(rng, -6, 6) }, true)
    }
  }
  // Then all kinds at random in the free spots
  for (let tries = 0; tries < 6000 && plants.length < PLANT_COUNT; tries++) {
    const kind = PLANT_MIX[Math.floor(rng() * PLANT_MIX.length)]
    const { w, h } = PLANT_KINDS[kind]
    tryPlace({
      kind,
      x: zufall(rng, 1, VILLAGE_WIDTH - w - 1),
      y: zufall(rng, SEA.top + 2, BEACH_Y - h),
    })
  }
  // Drawn back to front
  return plants.sort((a, b) => a.y + PLANT_KINDS[a.kind].h - (b.y + PLANT_KINDS[b.kind].h))
}

/** Point just below the door where the character stands to enter. */
export function doorEntry(hut: Hut) {
  return { x: hut.x + HUT_WIDTH / 2, y: hut.y + HUT_HEIGHT + 3 }
}

/** Horizontal path strip from a hut's door to the main path. */
export function branchPath(hut: Hut) {
  const y = hut.y + HUT_HEIGHT
  const fromX = hut.x + HUT_WIDTH / 2 - 5
  const toX = hut.x + HUT_WIDTH / 2 + 5
  const x = Math.min(fromX, MAIN_PATH.x)
  const right = Math.max(toX, MAIN_PATH.x + MAIN_PATH.width)
  return { x, y, width: right - x, height: 10 }
}

/** Height of the name board above the roof (tapping it also enters the hut). */
export const SIGN_HEIGHT = 10

export function hutAt(x: number, y: number): Hut | undefined {
  return HUTS.find(
    (h) => x >= h.x && x < h.x + HUT_WIDTH && y >= h.y - SIGN_HEIGHT && y < h.y + HUT_HEIGHT,
  )
}

export const PLANTS: Plant[] = placePlants()

/** Walk grid: huts, pond, plants, the sea and the side borders are blocked. Feet may touch the door row. */
export function buildWalkGrid(): Grid {
  const cols = VILLAGE_WIDTH / CELL
  const rows = VILLAGE_HEIGHT / CELL
  const blocked = Array.from({ length: cols * rows }, () => false)
  const block = (x: number, y: number, w: number, h: number) => {
    for (let cy = Math.floor(y / CELL); cy < Math.ceil((y + h) / CELL); cy++) {
      for (let cx = Math.floor(x / CELL); cx < Math.ceil((x + w) / CELL); cx++) {
        if (cx >= 0 && cy >= 0 && cx < cols && cy < rows) blocked[cy * cols + cx] = true
      }
    }
  }
  for (const hut of HUTS) block(hut.x - 2, hut.y + 6, HUT_WIDTH + 4, HUT_HEIGHT - 6)
  block(POND.x - 2, POND.y - 2, POND.width + 4, POND.height + 4)
  block(MAILBOX.x + 2, MAILBOX.y + 6, 4, 5)
  for (const p of PLANTS) {
    const f = PLANT_KINDS[p.kind].foot
    block(p.x + f.x, p.y + f.y, f.w, f.h)
  }
  // Keep a 4 px margin at the map edges, except where the main path leaves the village
  block(0, 0, VILLAGE_WIDTH, SEA.top)
  block(0, SEA.bottom - 2, VILLAGE_WIDTH, VILLAGE_HEIGHT - SEA.bottom + 2)
  block(0, 0, 4, VILLAGE_HEIGHT)
  block(VILLAGE_WIDTH - 4, 0, 4, VILLAGE_HEIGHT)
  // The jetty crosses the upper sea along the main path
  for (let cy = 0; cy < SEA.top / CELL; cy++) {
    for (let cx = MAIN_PATH.x / CELL; cx < (MAIN_PATH.x + MAIN_PATH.width) / CELL; cx++) {
      blocked[cy * cols + cx] = false
    }
  }
  return { cols, rows, blocked }
}

export const toCell = (x: number, y: number) => ({
  cx: Math.floor(x / CELL),
  cy: Math.floor(y / CELL),
})

export const cellCenter = (cx: number, cy: number) => ({
  x: cx * CELL + CELL / 2,
  y: cy * CELL + CELL / 2,
})
