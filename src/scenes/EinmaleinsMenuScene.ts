// Einmaleins-Dojo menu (GAME_DESIGN §6a): the 10 × 10 progress grid, best Blitzrunde and
// average time, the trophy shelf and the four sub-modes. There are two dojos with the
// same layout – one for multiplication, one for division (`op`).
import Phaser from 'phaser'
import { ensureStageTexture } from '../art/stage'
import { sfx } from '../audio/sfx'
import { texts } from '../data/texts'
import { GAME_WIDTH } from '../display'
import { ROWS, averageMs, type DojoOp } from '../math/einmaleins'
import { overlay, palette } from '../palette'
import { getSave } from '../state/store'
import { FactGrid, GRID_WIDTH } from '../ui/FactGrid'
import { Hud } from '../ui/Hud'
import { Key } from '../ui/Key'
import { SHELF_WIDTH, TrophyShelf } from '../ui/TrophyShelf'
import { addText } from '../ui/text'
import type { DrillMode } from './EinmaleinsDrillScene'
import { PixelScene } from './PixelScene'

const FLOOR_Y = 220
const GRID_Y = 38
const PANEL = { x: 8, y: GRID_Y, w: 164, h: 172 }

/** "2,4" – seconds with one decimal, German comma */
export const formatSeconds = (ms: number) => (ms / 1000).toFixed(1).replace('.', ',')

export class EinmaleinsMenuScene extends PixelScene {
  private op: DojoOp = 'mul'
  private picker?: Phaser.GameObjects.Container

  constructor() {
    super('EinmaleinsMenu')
  }

  init(data: { op?: DojoOp }) {
    this.op = data.op ?? 'mul'
    this.picker = undefined
  }

  private get hutId() {
    return this.op === 'mul' ? 'maldojo' : 'teildojo'
  }

  create() {
    this.setupCamera()
    this.add.image(0, 0, ensureStageTexture(this, { floorY: FLOOR_Y })).setOrigin(0)
    new Hud(this, { onHome: () => this.goTo('Village', { from: this.hutId }) })

    const save = getSave()
    const { facts, records } = save.dojo
    new FactGrid(
      this,
      Math.round((GAME_WIDTH - GRID_WIDTH) / 2),
      GRID_Y,
      this.op,
      facts,
      texts.dojo.title[this.op],
    )
    // Best Blitzrunde and average time on a small dark caption box over the curtains
    const avg = averageMs(facts, this.op)
    const stats = addText(
      this,
      GAME_WIDTH / 2,
      FLOOR_Y - 7,
      texts.dojo.stats(records[this.op].blitz, avg === null ? null : formatSeconds(avg)),
      'title',
      12,
      'cream',
    ).setDepth(1)
    const w = Math.ceil(stats.width) + 12
    this.add
      .graphics()
      .fillStyle(overlay.color, overlay.alpha)
      .fillRoundedRect(Math.round((GAME_WIDTH - w) / 2), FLOOR_Y - 14, w, 13, 3)
    new TrophyShelf(
      this,
      Math.round((GAME_WIDTH - SHELF_WIDTH) / 2),
      FLOOR_Y + 4,
      records[this.op].badges,
    )

    const modes: [string, () => void][] = [
      [texts.dojo.practice, () => this.pickRow('practice')],
      [texts.dojo.blitz, () => this.start('blitz')],
      [texts.dojo.duel, () => this.start('duel')],
      [texts.dojo.rowMaster, () => this.pickRow('row')],
    ]
    modes.forEach(([caption, onPress], i) => {
      const x = 8 + (i % 2) * 84
      const y = 254 + Math.floor(i / 2) * 46
      new Key(this, x, y, 80, 40, caption, onPress, {
        label: true,
        fontSize: 6,
        fill: i === 0 ? 'gold' : 'cream',
      })
    })
  }

  private start(mode: DrillMode, row?: number | 'mix') {
    sfx.tick()
    this.goTo('EinmaleinsDrill', { op: this.op, mode, row })
  }

  /** Overlay over the grid: rows 1–10 (plus "Mix" for Üben). Medal rows are gold. */
  private pickRow(mode: 'practice' | 'row') {
    sfx.tick()
    this.picker?.destroy()
    const badges = getSave().dojo.records[this.op].badges
    const panel = this.add.container(PANEL.x, PANEL.y).setDepth(50)
    const g = this.add.graphics()
    g.fillStyle(palette.cream).fillRoundedRect(0, 0, PANEL.w, PANEL.h, 3)
    g.lineStyle(2, palette.ink).strokeRoundedRect(0, 0, PANEL.w, PANEL.h, 3)
    panel.add(g)
    const heading = mode === 'practice' ? texts.dojo.practice : texts.dojo.rowMaster
    panel.add(addText(this, PANEL.w / 2, 10, heading, 'label', 6))
    panel.add(addText(this, PANEL.w / 2, 24, texts.dojo.whichRow, 'title', 16))
    ROWS.forEach((row, i) => {
      const x = 4 + (i % 5) * 32
      const y = 38 + Math.floor(i / 5) * 34
      const medal = mode === 'row' && badges.includes(row)
      panel.add(
        new Key(this, x, y, 28, 28, String(row), () => this.start(mode, row), {
          fontSize: 18,
          fill: medal ? 'gold' : 'cream',
        }),
      )
    })
    if (mode === 'practice') {
      panel.add(
        new Key(this, 44, 108, 76, 26, texts.dojo.mix, () => this.start('practice', 'mix'), {
          label: true,
          fontSize: 6,
          fill: 'gold',
        }),
      )
    }
    panel.add(
      new Key(this, 44, 140, 76, 26, texts.dojo.back, () => this.closePicker(), {
        label: true,
        fontSize: 6,
      }),
    )
    this.picker = panel
  }

  private closePicker() {
    sfx.tick()
    this.picker?.destroy()
    this.picker = undefined
  }
}
