import Phaser from 'phaser'
import { css } from '../palette'

/** Waits for the bundled fonts, then starts the game. Placeholder until build step 1. */
export class BootScene extends Phaser.Scene {
  constructor() {
    super('Boot')
  }

  async create() {
    await Promise.all([
      document.fonts.load('16px "VT323"'),
      document.fonts.load('500 8px "IBM Plex Mono"'),
    ])
    this.add
      .text(90, 180, 'Mathe-Bühne', { fontFamily: 'VT323', fontSize: '24px', color: css('cream') })
      .setOrigin(0.5)
  }
}
