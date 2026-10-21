// Village layout as data (GAME_DESIGN §3a). Pure logic, no Phaser.
import type { PaletteToken } from '../palette'
import type { Grid } from './path'

export const VILLAGE_WIDTH = 180
export const VILLAGE_HEIGHT = 432
/** Walk grid resolution in pixels. */
export const CELL = 4

export const HUT_WIDTH = 32
export const HUT_HEIGHT = 34

export type HutIcon =
  'mask' | 'coin' | 'paw' | 'times' | 'book' | 'heart' | 'hammer' | 'plus' | 'apple'

export type Hut = {
  id: string
  /** German name on the sign / caption */
  name: string
  x: number
  y: number
  roof: PaletteToken
  icon: HutIcon
  /** Scene key to open, or null while the hut is still a construction site */
  scene: string | null
}

/** Main path: a vertical strip through the middle of the village. */
export const MAIN_PATH = { x: 80, width: 20 }

export const HUTS: Hut[] = [
  {
    id: 'bibliothek',
    name: 'Bibliothek',
    x: 20,
    y: 40,
    roof: 'curtainLight',
    icon: 'book',
    scene: null,
  },
  {
    id: 'zahlenturm',
    name: 'Zahlenturm',
    x: 128,
    y: 40,
    roof: 'stoneDark',
    icon: 'plus',
    scene: null,
  },
  {
    id: 'dojo',
    name: 'Einmaleins-Dojo',
    x: 20,
    y: 110,
    roof: 'heroDark',
    icon: 'times',
    scene: null,
  },
  {
    id: 'werkstatt',
    name: 'Rechenwerkstatt',
    x: 128,
    y: 110,
    roof: 'woodDark',
    icon: 'hammer',
    scene: null,
  },
  {
    id: 'theater',
    name: 'Theater',
    x: 20,
    y: 180,
    roof: 'curtainMid',
    icon: 'mask',
    scene: 'Show',
  },
  {
    id: 'marktstand',
    name: 'Marktstand',
    x: 128,
    y: 180,
    roof: 'mintDark',
    icon: 'apple',
    scene: null,
  },
  { id: 'laden', name: 'Laden', x: 20, y: 250, roof: 'goldDark', icon: 'coin', scene: 'Shop' },
  {
    id: 'tierheim',
    name: 'Tierheim',
    x: 128,
    y: 250,
    roof: 'roseDark',
    icon: 'paw',
    scene: 'Shelter',
  },
  {
    id: 'haus',
    name: 'Mein Haus',
    x: 20,
    y: 320,
    roof: 'heroDark',
    icon: 'heart',
    scene: 'Wardrobe',
  },
]

export const POND = { x: 132, y: 326, width: 28, height: 18 }

export const TREE_WIDTH = 12
export const TREE_HEIGHT = 16
/** Decorative trees along the left and right edge, between the hut rows. */
export const TREES = [4, 164].flatMap((x) => [16, 84, 154, 224, 294, 366].map((y) => ({ x, y })))

/** The village is an island: sea above `top` and below `bottom`, beach above the lower sea. */
export const SEA = { top: 12, bottom: 414 }
export const BEACH_Y = 396

/** Where she starts and where she reappears after leaving the village scene. */
export const SPAWN = { x: 90, y: 400 }

/** Top end of the main path: exit to the wild area (not built yet). */
export const WILD_EXIT = { x: MAIN_PATH.x, y: 0, width: MAIN_PATH.width, height: 10 }

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

export function hutAt(x: number, y: number): Hut | undefined {
  return HUTS.find((h) => x >= h.x && x < h.x + HUT_WIDTH && y >= h.y && y < h.y + HUT_HEIGHT)
}

/** Walk grid: huts, pond, palms, the sea and the side borders are blocked. Feet may touch the door row. */
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
  for (const t of TREES) block(t.x, t.y + 6, TREE_WIDTH, TREE_HEIGHT - 6)
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
