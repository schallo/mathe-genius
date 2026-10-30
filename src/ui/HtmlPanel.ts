// A plain HTML panel on top of the game canvas, for the parent area: real text fields
// (email, password with the device's password manager), file pickers and native
// keyboards. Styled with the palette; removed when the scene shuts down.
import type Phaser from 'phaser'
import { css } from '../palette'

const STYLE = `
.zh-panel { position: fixed; box-sizing: border-box; padding: 16px; overflow: auto; z-index: 10;
  font: 500 14px/1.4 "IBM Plex Mono", monospace; color: ${css('ink')}; }
.zh-card { background: ${css('cream')}; border: 2px solid ${css('ink')}; border-radius: 8px;
  padding: 12px; margin-bottom: 12px; }
.zh-panel h1 { font: 32px/1 VT323, monospace; color: ${css('cream')}; text-align: center; margin: 8px 0 16px; }
.zh-panel h2 { font: 22px/1 VT323, monospace; margin: 0 0 8px; }
.zh-panel p { margin: 0 0 8px; }
.zh-panel input { box-sizing: border-box; width: 100%; font: inherit; font-size: 16px; padding: 8px;
  margin: 0 0 8px; border: 1px solid ${css('ink')}; border-radius: 4px; background: ${css('paperWhite')}; }
.zh-panel button { font: inherit; text-transform: uppercase; letter-spacing: 0.08em; min-height: 44px;
  padding: 8px 12px; margin: 0 8px 8px 0; border: 1px solid ${css('ink')}; border-radius: 6px;
  background: ${css('paperWhite')}; color: ${css('ink')}; cursor: pointer; }
.zh-panel button.zh-gold { background: ${css('gold')}; }
.zh-panel button.zh-danger { background: ${css('rose')}; border-color: ${css('roseDark')}; }
.zh-panel .zh-note { font-size: 12px; opacity: 0.8; }
.zh-panel .zh-error { color: ${css('heroDark')}; }
.zh-panel label { display: block; margin: 0 0 8px; }
.zh-panel select { font: inherit; font-size: 16px; padding: 4px; margin-left: 4px;
  border: 1px solid ${css('ink')}; border-radius: 4px; background: ${css('paperWhite')}; }
.zh-panel .zh-table { width: 100%; border-collapse: collapse; margin: 0 0 8px; font-size: 12px; }
.zh-panel .zh-table th, .zh-panel .zh-table td { text-align: left; padding: 2px 4px;
  border-bottom: 1px solid ${css('pageGrid')}; }
`

export class HtmlPanel {
  readonly root: HTMLDivElement
  private scene: Phaser.Scene
  private onResize = () => this.place()
  /**
   * Follows the canvas itself: on a window resize (rotating the phone, a full-page
   * screenshot) Phaser resizes the canvas a moment later, and measuring only on the window
   * event could leave the panel at the canvas's in-between size (seen: 0.5 × 1 px).
   */
  private observer = new ResizeObserver(() => this.place())

  constructor(scene: Phaser.Scene) {
    this.scene = scene
    if (!document.getElementById('zh-panel-style')) {
      const style = document.createElement('style')
      style.id = 'zh-panel-style'
      style.textContent = STYLE
      document.head.append(style)
    }
    this.root = document.createElement('div')
    this.root.className = 'zh-panel'
    document.body.append(this.root)
    this.place()
    window.addEventListener('resize', this.onResize)
    scene.scale.on('resize', this.onResize)
    this.observer.observe(scene.game.canvas)
    scene.events.once('shutdown', () => this.destroy())
  }

  /** Cover exactly the game canvas. */
  private place() {
    const rect = this.scene.game.canvas.getBoundingClientRect()
    Object.assign(this.root.style, {
      left: `${rect.left}px`,
      top: `${rect.top}px`,
      width: `${rect.width}px`,
      height: `${rect.height}px`,
    })
  }

  /** Replaces the content. Use data-action attributes on buttons and `on()` to handle them. */
  render(html: string): this {
    this.root.innerHTML = html
    return this
  }

  on(action: string, handler: (el: HTMLElement) => void): this {
    this.root.querySelectorAll<HTMLElement>(`[data-action="${action}"]`).forEach((el) =>
      el.addEventListener('click', (e) => {
        e.preventDefault()
        handler(el)
      }),
    )
    return this
  }

  field(name: string): HTMLInputElement {
    return this.root.querySelector<HTMLInputElement>(`[name="${name}"]`)!
  }

  destroy() {
    window.removeEventListener('resize', this.onResize)
    this.scene.scale.off('resize', this.onResize)
    this.observer.disconnect()
    this.root.remove()
  }
}

/** Escapes text for use inside the panel's HTML. */
export function esc(text: string): string {
  return text.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`)
}
