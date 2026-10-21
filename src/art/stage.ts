// Theatre stage (STYLE_GUIDE §4, portrait): curtains with tapered light beams,
// stage edge, wooden floor. Baked into one 180 × 360 texture.
import type Phaser from 'phaser'
import { GAME_HEIGHT, GAME_WIDTH } from '../display'
import { palette } from '../palette'

/** y of the action line: characters stand here. */
export const STAGE_FLOOR_Y = 200

/**
 * `floorY` moves the action line (screens with controls on the floor use a higher
 * stage); `open: false` draws closed curtains without light beams (title screen).
 */
export function ensureStageTexture(
  scene: Phaser.Scene,
  { floorY = STAGE_FLOOR_Y, open = true }: { floorY?: number; open?: boolean } = {},
): string {
  const key = `stage-${floorY}-${open ? 'open' : 'closed'}`
  if (scene.textures.exists(key)) return key
  const STAGE_FLOOR_Y = floorY
  const W = GAME_WIDTH
  const H = GAME_HEIGHT
  const texture = scene.textures.createCanvas(key, W, H)!
  const ctx = texture.getContext()
  const rect = (x: number, y: number, w: number, h: number, c: number) => {
    ctx.fillStyle = `#${c.toString(16).padStart(6, '0')}`
    ctx.fillRect(x, y, w, h)
  }

  // Curtains: alternating vertical bands with a highlight line on the lighter ones
  for (let x = 0, i = 0; x < W; x += 8, i++) {
    rect(x, 0, 8, STAGE_FLOOR_Y, i % 2 ? palette.curtainMid : palette.curtainDark)
    if (i % 2) rect(x + 2, 0, 1, STAGE_FLOOR_Y, palette.curtainLight)
  }
  // Valance at the top
  rect(0, 0, W, 10, palette.curtainLight)
  for (let x = 0; x < W; x += 12) rect(x + 4, 10, 4, 2, palette.curtainLight)
  rect(0, 9, W, 1, palette.curtainMid)

  // Light beams: pointed at the top, wide at the floor, drawn in 4 px steps
  for (const cx of open ? [40, 90, 140] : []) {
    for (let y = 14; y < STAGE_FLOOR_Y; y += 4) {
      const half = Math.floor(((y - 14) / (STAGE_FLOOR_Y - 14)) * 14) + 1
      rect(cx - half, y, half * 2, 4, palette.beam)
    }
  }

  // Closed: the two curtain halves meet in the middle
  if (!open) rect(W / 2 - 1, 10, 2, STAGE_FLOOR_Y - 10, palette.curtainDark)

  // Stage edge and floor planks: 1 px light top line, wood-mid body, 1 px dark seam
  rect(0, STAGE_FLOOR_Y, W, 2, palette.woodEdge)
  for (let y = STAGE_FLOOR_Y + 2, row = 0; y < H; y += 6, row++) {
    rect(0, y, W, 6, palette.woodMid)
    rect(0, y, W, 1, palette.woodLight)
    rect(0, y + 5, W, 1, palette.woodDark)
    for (let x = (row % 2) * 24 + 10; x < W; x += 48) rect(x, y + 1, 1, 4, palette.woodDark)
  }
  texture.refresh()
  return key
}
