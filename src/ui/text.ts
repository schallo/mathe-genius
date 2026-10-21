// Text in the two style-guide fonts, rendered at device resolution.
import type Phaser from 'phaser'
import { renderScale } from '../display'
import { css, type PaletteToken } from '../palette'

export type TextKind = 'title' | 'label'

/**
 * 'title' = VT323 (speech cards, big words), 'label' = IBM Plex Mono 500, uppercase
 * with 0.08em letter spacing (buttons, pills). Sizes are in art pixels.
 */
export function addText(
  scene: Phaser.Scene,
  x: number,
  y: number,
  text: string,
  kind: TextKind,
  size: number,
  color: PaletteToken = 'ink',
): Phaser.GameObjects.Text {
  const isLabel = kind === 'label'
  return scene.add
    .text(x, y, isLabel ? text.toUpperCase() : text, {
      fontFamily: isLabel ? '"IBM Plex Mono"' : 'VT323',
      fontStyle: isLabel ? '500' : 'normal',
      fontSize: `${size}px`,
      color: css(color),
      letterSpacing: isLabel ? size * 0.08 : 0,
      resolution: renderScale(),
    })
    .setOrigin(0.5)
}
