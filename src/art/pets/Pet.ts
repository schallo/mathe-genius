// A pet as one Phaser object: sprite, ground shadow, breathing bob, hop with a heart,
// optional name pill. Position = point between its feet.
import Phaser from 'phaser'
import type { SpeciesId } from '../../data/creatures'
import { palette, shadow } from '../../palette'
import { LabelPill } from '../../ui/LabelPill'
import { addFrames, rasterize } from '../pixels'
import { HEART, PET_HEIGHT, petArt, sleepingMap } from './maps'

const BOB_MS = 400

export type PetTrick = 'hop' | 'doubleHop' | 'spin' | 'hearts' | 'nap'

export function ensurePetTexture(scene: Phaser.Scene, species: SpeciesId): string {
  const key = `pet-${species}`
  if (scene.textures.exists(key)) return key
  const art = petArt[species]
  const extra = (['d', 'f', 'g'] as const).flatMap((role) => {
    const token = art.colors[role]
    return token ? [[role, palette[token]] as const] : []
  })
  const legend = {
    a: palette[art.colors.a],
    b: palette[art.colors.b],
    c: palette[art.colors.c],
    e: palette.ink,
    p: palette.rose,
    ...Object.fromEntries(extra),
  }
  addFrames(scene, key, [
    { name: 'idle', pixels: rasterize(art.map, legend, palette[art.outline]) },
    { name: 'sleep', pixels: rasterize(sleepingMap(art.map), legend, palette[art.outline]) },
  ])
  if (!scene.textures.exists('pet-heart')) {
    addFrames(scene, 'pet-heart', [
      { name: 'heart', pixels: rasterize(HEART, { a: palette.rose }, palette.roseDark) },
    ])
    addFrames(scene, 'pet-shadow', [
      { name: 'shadow', pixels: rasterize(['.aaaaaaaa.', 'aaaaaaaaaa'], { a: 0x000000 }) },
    ])
  }
  return key
}

export class Pet extends Phaser.GameObjects.Container {
  readonly species: SpeciesId
  private sprite: Phaser.GameObjects.Image
  private namePill?: LabelPill
  private clock = Math.random() * BOB_MS * 2
  private hopping = false
  private sleeping = false

  constructor(scene: Phaser.Scene, x: number, y: number, species: SpeciesId, name?: string) {
    super(scene, x, y)
    this.species = species
    const key = ensurePetTexture(scene, species)
    const shadowImage = scene.add.image(0, 0, 'pet-shadow', 'shadow').setAlpha(shadow.alpha)
    this.sprite = scene.add.image(0, 0, key, 'idle').setOrigin(0.5, 1)
    this.add([shadowImage, this.sprite])
    if (name) this.setPetName(name)
    scene.add.existing(this)
  }

  setPetName(name: string): this {
    this.namePill?.destroy()
    this.namePill = new LabelPill(this.scene, 0, -PET_HEIGHT - 6, name, { size: 5 })
    this.add(this.namePill)
    return this
  }

  showName(visible: boolean): this {
    this.namePill?.setVisible(visible)
    return this
  }

  setFlip(flip: boolean): this {
    this.sprite.setFlipX(flip)
    return this
  }

  /** Closed eyes, no bobbing (a tired pet after a lost battle). */
  setSleeping(sleeping: boolean): this {
    this.sleeping = sleeping
    this.sprite.setFrame(sleeping ? 'sleep' : 'idle').setY(0)
    return this
  }

  /** Happy hop with a heart above the head (STYLE_GUIDE §9 "Pets"). */
  hop(): void {
    if (this.hopping) return
    this.hopping = true
    const heart = this.scene.add.image(0, -PET_HEIGHT - 4, 'pet-heart', 'heart').setOrigin(0.5, 1)
    this.add(heart)
    const steps = [-2, -4, -5, -4, -2, 0]
    steps.forEach((dy, i) => {
      this.scene.time.delayedCall(i * 50, () => this.sprite.setY(dy))
    })
    this.scene.time.delayedCall(700, () => {
      heart.destroy()
      this.hopping = false
    })
  }

  /** A trick learned from a toy (GAME_DESIGN §4 "Futter & Spielzeug"). */
  trick(kind: PetTrick): void {
    if (this.hopping) return
    const t = this.scene.time
    switch (kind) {
      case 'hop':
        return this.hop()
      case 'doubleHop':
        this.hop()
        t.delayedCall(450, () => this.hop())
        return
      case 'spin':
        // Turns around twice (whole-pixel flips, no blur)
        ;[0, 1, 2, 3, 4].forEach((i) =>
          t.delayedCall(i * 110, () => this.sprite.setFlipX(i % 2 === 0)),
        )
        t.delayedCall(560, () => this.hop())
        return
      case 'hearts':
        this.hop()
        ;[-6, 6].forEach((dx, i) =>
          t.delayedCall(120 + i * 120, () => {
            const heart = this.scene.add.image(dx, -PET_HEIGHT - 2, 'pet-heart', 'heart')
            heart.setOrigin(0.5, 1)
            this.add(heart)
            t.delayedCall(600, () => heart.destroy())
          }),
        )
        return
      case 'nap':
        this.setSleeping(true)
        t.delayedCall(1200, () => {
          this.setSleeping(false)
          this.hop()
        })
        return
    }
  }

  tick(delta: number): void {
    if (this.hopping || this.sleeping) return
    this.clock += delta
    this.sprite.setY(Math.floor(this.clock / BOB_MS) % 2 ? -1 : 0)
  }
}
