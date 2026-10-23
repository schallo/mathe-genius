// Trophy shelf for the Reihen-Meister medals (STYLE_GUIDE §9): round gold medals with a
// gold-dark rim and the row number, standing on a wooden shelf. Empty places stay dark.
import Phaser from 'phaser'
import { icon } from '../art/icons'
import { ROWS } from '../math/einmaleins'
import { palette } from '../palette'
import { addText } from './text'

export const SHELF_WIDTH = 164
const PITCH = 16

export class TrophyShelf extends Phaser.GameObjects.Container {
  constructor(scene: Phaser.Scene, x: number, y: number, badges: number[]) {
    super(scene, x, y)
    const g = scene.add.graphics()
    g.fillStyle(palette.woodLight).fillRect(0, 14, SHELF_WIDTH, 1)
    g.fillStyle(palette.woodDark).fillRect(0, 15, SHELF_WIDTH, 3)
    g.fillStyle(palette.woodEdge).fillRect(0, 18, SHELF_WIDTH, 1)
    g.fillRect(6, 19, 2, 3).fillRect(SHELF_WIDTH - 8, 19, 2, 3)
    this.add(g)
    for (const row of ROWS) {
      const earned = badges.includes(row)
      const cx = 10 + (row - 1) * PITCH
      this.add(scene.add.image(cx, 8, icon(scene, earned ? 'medal' : 'medalSlot'), 'icon'))
      this.add(addText(scene, cx, 7, String(row), 'title', 9, earned ? 'ink' : 'woodLight'))
    }
    scene.add.existing(this)
  }
}
