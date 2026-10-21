// The layered character as one Phaser object. Position = point between her feet.
import Phaser from 'phaser'
import { shadow } from '../../palette'
import { CHAR_HEIGHT, type CharacterLook, type Direction } from './look'
import { ensureCharacterTextures, textureKeys } from './textures'

const LAYERS = ['body', 'outfit', 'hair', 'accessory'] as const
const IDLE_MS = 250 // ~4 fps bob (STYLE_GUIDE §5)
const WALK_MS = 125 // ~8 fps
const WALK_CYCLE = [1, 0, 2, 0]

export class Character extends Phaser.GameObjects.Container {
  private shadowImage: Phaser.GameObjects.Image
  private parts: Phaser.GameObjects.Image[] = []
  private look: CharacterLook
  private dir: Direction = 'down'
  private flip = false
  private walking = false
  private clock = 0

  constructor(scene: Phaser.Scene, x: number, y: number, look: CharacterLook) {
    super(scene, x, y)
    this.look = look
    ensureCharacterTextures(scene, look)
    this.shadowImage = scene.add.image(0, 1, 'char-shadow', 'big').setAlpha(shadow.alpha)
    this.add(this.shadowImage)
    this.setLook(look)
    scene.add.existing(this)
  }

  setLook(look: CharacterLook): this {
    this.look = look
    ensureCharacterTextures(this.scene, look)
    for (const part of this.parts) part.destroy()
    const keys = textureKeys(look)
    this.parts = LAYERS.flatMap((layer) => {
      const key = keys[layer]
      return key ? [this.scene.add.image(0, 0, key, 'down-0').setOrigin(0.5, 1)] : []
    })
    this.add(this.parts)
    this.render()
    return this
  }

  getLook(): CharacterLook {
    return this.look
  }

  /** Face a direction; 'left' uses the mirrored side view. */
  face(dir: Direction | 'left' | 'right'): this {
    this.flip = dir === 'left'
    this.dir = dir === 'left' || dir === 'right' ? 'side' : dir
    this.render()
    return this
  }

  setWalking(walking: boolean): this {
    if (walking !== this.walking) {
      this.walking = walking
      this.clock = 0
      this.render()
    }
    return this
  }

  /** Call from the scene's update with the frame delta. */
  tick(delta: number): void {
    this.clock += delta
    this.render()
  }

  private render() {
    let frame = 0
    let bob = 0
    if (this.walking) {
      frame = WALK_CYCLE[Math.floor(this.clock / WALK_MS) % WALK_CYCLE.length]
    } else {
      bob = Math.floor(this.clock / IDLE_MS) % 2
    }
    for (const part of this.parts) {
      part.setFrame(`${this.dir}-${frame}`)
      part.setFlipX(this.flip)
      part.setY(1 - bob)
    }
    this.shadowImage.setFrame(bob ? 'small' : 'big')
  }

  /** Height in pixels, e.g. for placing a name tag above her head. */
  static readonly HEIGHT = CHAR_HEIGHT
}
