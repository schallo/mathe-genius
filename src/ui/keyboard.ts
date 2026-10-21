// Physical keyboard input for a scene. Phaser sometimes delivers the same keydown event
// twice when keys come in quickly (seen with fast typing), so every event is handled once.
import type Phaser from 'phaser'

export function onKeyDown(scene: Phaser.Scene, handler: (event: KeyboardEvent) => void): void {
  const seen = new WeakSet<KeyboardEvent>()
  scene.input.keyboard?.on('keydown', (event: KeyboardEvent) => {
    if (seen.has(event)) return
    seen.add(event)
    handler(event)
  })
}
