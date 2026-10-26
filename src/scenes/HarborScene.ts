// Harbour at the jetty (GAME_DESIGN §6b): the boat goes to the wild islands. One card per
// island with its animals (befriended ones in colour); an island opens when her strongest
// pet reaches its level – until then the card shows the level as a goal, not a locked door.
import Phaser from 'phaser'
import { icon } from '../art/icons'
import { Pet } from '../art/pets/Pet'
import { sfx } from '../audio/sfx'
import { strongestPetLevel } from '../battle/progress'
import { texts } from '../data/texts'
import { GAME_HEIGHT, GAME_WIDTH } from '../display'
import { palette } from '../palette'
import { getSave } from '../state/store'
import { Caption } from '../ui/Caption'
import { Hud } from '../ui/Hud'
import { Key } from '../ui/Key'
import { addText } from '../ui/text'
import { AREAS, isUnlocked, type Area } from '../world/wild'
import { PixelScene } from './PixelScene'

const CARD = { x: 6, y: 50, w: 168, h: 56, gap: 4 }

export class HarborScene extends PixelScene {
  private caption!: Caption

  constructor() {
    super('Harbor')
  }

  create() {
    this.setupCamera()
    // Sky, sea with wave pixels and the wooden jetty at the bottom
    const g = this.add.graphics()
    g.fillStyle(palette.sky).fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT)
    g.fillStyle(palette.accentBlue)
    for (let y = 40; y < GAME_HEIGHT; y += 8) {
      for (let x = (y / 8) % 2 ? 4 : 10; x < GAME_WIDTH; x += 13) g.fillRect(x, y, 3, 1)
    }
    g.fillStyle(palette.woodMid).fillRect(70, GAME_HEIGHT - 26, 40, 26)
    g.fillStyle(palette.woodDark)
    for (let y = GAME_HEIGHT - 26; y < GAME_HEIGHT; y += 3) g.fillRect(70, y, 40, 1)

    new Hud(this, { onHome: () => this.goTo('Village', { from: 'steg' }) })
    this.caption = new Caption(this)
    addText(this, GAME_WIDTH / 2, 38, texts.harbor.title, 'title', 16, 'ink')

    const save = getSave()
    const strongest = strongestPetLevel(save)
    AREAS.forEach((a, i) => this.card(a, CARD.y + i * (CARD.h + CARD.gap), strongest, save.pets))
  }

  private card(a: Area, y: number, strongest: number, pets: { species: string }[]) {
    const open = isUnlocked(a, strongest)
    const g = this.add.graphics()
    g.fillStyle(palette.cream).fillRoundedRect(CARD.x, y, CARD.w, CARD.h, 3)
    g.lineStyle(2, palette.ink).strokeRoundedRect(CARD.x, y, CARD.w, CARD.h, 3)
    addText(this, CARD.x + 8, y + 10, a.name, 'title', 15).setOrigin(0, 0.5)

    // Its animals: befriended ones in colour, the others as a dark shape to discover
    a.species.forEach((species, i) => {
      const pet = new Pet(this, CARD.x + 16 + i * 22, y + 42, species)
      if (!pets.some((p) => p.species === species)) {
        for (const child of pet.list) {
          if (child instanceof Phaser.GameObjects.Image)
            child.setTintFill(palette.ink).setAlpha(0.35)
        }
      }
    })

    if (open) {
      new Key(this, CARD.x + CARD.w - 58, y + 18, 50, 30, texts.harbor.go, () => this.sail(a), {
        fill: 'gold',
        label: true,
        fontSize: 7,
      })
    } else {
      this.add.image(CARD.x + CARD.w - 46, y + 33, icon(this, 'star'), 'icon')
      addText(this, CARD.x + CARD.w - 26, y + 27, texts.harbor.locked, 'label', 4)
      addText(this, CARD.x + CARD.w - 26, y + 38, texts.wild.level(a.unlockLevel), 'title', 14)
      const zone = this.add.zone(CARD.x, y, CARD.w, CARD.h).setOrigin(0).setInteractive()
      zone.on('pointerdown', () => {
        sfx.tick()
        this.caption.show(texts.harbor.lockedHint(a.name, a.unlockLevel), 2500)
      })
    }
  }

  private sail(a: Area) {
    sfx.tick()
    this.goTo('Wild', { area: a.id })
  }
}
