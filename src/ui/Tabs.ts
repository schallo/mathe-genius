// Category tabs (STYLE_GUIDE §9): label pills along the top, the active tab is gold.
import Phaser from 'phaser'
import { GAME_WIDTH } from '../display'
import { Key } from './Key'

export class Tabs<T extends string> extends Phaser.GameObjects.Container {
  private keys: { id: T; key: Key }[] = []

  constructor(
    scene: Phaser.Scene,
    y: number,
    tabs: { id: T; label: string }[],
    onSelect: (id: T) => void,
  ) {
    super(scene, 0, 0)
    const gap = 2
    const w = Math.floor((GAME_WIDTH - 8 - gap * (tabs.length - 1)) / tabs.length)
    tabs.forEach((tab, i) => {
      const key = new Key(
        scene,
        4 + i * (w + gap),
        y,
        w,
        16,
        tab.label,
        () => {
          this.select(tab.id)
          onSelect(tab.id)
        },
        { label: true, fontSize: 5 },
      )
      this.keys.push({ id: tab.id, key })
      this.add(key)
    })
    scene.add.existing(this)
  }

  select(id: T): this {
    for (const { id: tabId, key } of this.keys) key.setFill(tabId === id ? 'gold' : 'paperWhite')
    return this
  }
}
