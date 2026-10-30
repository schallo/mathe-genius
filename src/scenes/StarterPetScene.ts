// Starter pet choice (GAME_DESIGN §4 "Getting pets"): Hündchen, Kätzchen or Hamster.
import { Character } from '../art/character/Character'
import { DEFAULT_LOOK } from '../art/character/look'
import { Pet } from '../art/pets/Pet'
import { ensureStageTexture } from '../art/stage'
import { traitLabel } from '../battle/battle'
import { SPECIES, STARTERS, traitOf, type SpeciesId } from '../data/creatures'
import { texts } from '../data/texts'
import { GAME_WIDTH } from '../display'
import { getSave } from '../state/store'
import { Key } from '../ui/Key'
import { addText } from '../ui/text'
import { PixelScene } from './PixelScene'

const FLOOR_Y = 150
const CARD_W = 54
const CARD_H = 76
const CARD_Y = 172

export class StarterPetScene extends PixelScene {
  private hero!: Character
  private choice: SpeciesId | null = null
  private cards: { species: SpeciesId; key: Key; pet: Pet }[] = []
  private companion?: Pet
  private next!: Key

  constructor() {
    super('StarterPet')
  }

  init() {
    this.choice = null
    this.cards = []
    this.companion = undefined
  }

  create() {
    this.setupCamera()
    this.add.image(0, 0, ensureStageTexture(this, { floorY: FLOOR_Y })).setOrigin(0)
    addText(this, GAME_WIDTH / 2, 26, texts.starter.heading, 'title', 16, 'cream')
      .setWordWrapWidth(170)
      .setAlign('center')

    const character = getSave().character
    this.hero = new Character(this, 76, FLOOR_Y, character?.look ?? DEFAULT_LOOK).setScale(2)
    if (character) this.hero.setName(character.name, 6)

    STARTERS.forEach((species, i) => {
      const x = 6 + i * (CARD_W + 4)
      const key = new Key(this, x, CARD_Y, CARD_W, CARD_H, '', () => this.choose(species))
      const pet = new Pet(this, CARD_W / 2, 44, species).setScale(3)
      key.add(pet)
      key.add(addText(this, CARD_W / 2, 56, SPECIES[species].name, 'label', 5))
      const trait = traitLabel(traitOf(species), 1)
      if (trait) key.add(addText(this, CARD_W / 2, 66, trait, 'label', 4))
      this.cards.push({ species, key, pet })
    })

    this.next = new Key(
      this,
      GAME_WIDTH / 2 - 40,
      300,
      80,
      28,
      texts.starter.next,
      () => {
        if (this.choice) this.goTo('NameEntry', { mode: 'pet', species: this.choice })
      },
      { fill: 'gold', label: true, fontSize: 9 },
    )
    this.next.setVisible(false)
  }

  private choose(species: SpeciesId) {
    this.choice = species
    for (const card of this.cards) card.key.setSelected(card.species === species)
    this.cards.find((c) => c.species === species)?.pet.hop()
    this.companion?.destroy()
    this.companion = new Pet(this, 112, FLOOR_Y, species).setScale(2)
    this.companion.hop()
    this.next.setVisible(true)
  }

  update(_time: number, delta: number) {
    this.hero.tick(delta)
    this.companion?.tick(delta)
    for (const card of this.cards) card.pet.tick(delta)
  }
}
