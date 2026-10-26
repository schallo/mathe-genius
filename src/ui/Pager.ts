// Page arrows for card grids with more than one page (Laden, Mein Haus): ◀ and ▶ keys,
// hidden when everything fits on one page.
import type Phaser from 'phaser'
import { Key } from './Key'

export const PAGE_SIZE = 6

export class Pager {
  private prev: Key
  private next: Key
  private page = 0
  private pages = 1

  constructor(scene: Phaser.Scene, y: number, onChange: (page: number) => void) {
    const go = (dir: number) => {
      this.page = (this.page + dir + this.pages) % this.pages
      onChange(this.page)
    }
    this.prev = new Key(scene, 6, y, 30, 26, '◀', () => go(-1), { fontSize: 14 })
    this.next = new Key(scene, 144, y, 30, 26, '▶', () => go(1), { fontSize: 14 })
  }

  /** Number of items to page through; returns the current page (clamped). */
  setCount(count: number): number {
    this.pages = Math.max(1, Math.ceil(count / PAGE_SIZE))
    this.page = Math.min(this.page, this.pages - 1)
    this.prev.setVisible(this.pages > 1)
    this.next.setVisible(this.pages > 1)
    return this.page
  }

  reset(): void {
    this.page = 0
  }

  /** The items of the current page. */
  slice<T>(items: T[]): T[] {
    const page = this.setCount(items.length)
    return items.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)
  }
}
