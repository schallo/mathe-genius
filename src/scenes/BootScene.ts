import Phaser from 'phaser'

/** Waits for the bundled fonts so the first text renders in the right font. */
export class BootScene extends Phaser.Scene {
  constructor() {
    super('Boot')
  }

  async create() {
    await Promise.all([
      document.fonts.load('16px "VT323"'),
      document.fonts.load('500 8px "IBM Plex Mono"'),
    ])
    this.scene.start('Title')
  }
}
