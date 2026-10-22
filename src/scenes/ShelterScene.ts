// Tierheim (GAME_DESIGN §3a, §4): her pets (choose who comes along, rename) and pets
// looking for a home (adopt with coins, then name them).
import { Pet } from '../art/pets/Pet'
import { sfx } from '../audio/sfx'
import { traitLabel } from '../battle/battle'
import { isNapping, petLevel } from '../battle/progress'
import { SPECIES, traitOf } from '../data/creatures'
import type { Item } from '../data/items'
import { texts } from '../data/texts'
import { adoptablePets, canAfford, missingCoins, setWish } from '../state/shop'
import type { PetSave } from '../state/save'
import { getSave, updateSave } from '../state/store'
import { CARD_H, CARD_W, ItemCard } from '../ui/ItemCard'
import { Key } from '../ui/Key'
import { LabelPill } from '../ui/LabelPill'
import { addText } from '../ui/text'
import { RoomScene, cardPosition } from './RoomScene'

const OWN_ROW_Y = 142
const ADOPT_ROW_Y = 222

type Selection = { kind: 'own'; pet: PetSave } | { kind: 'adopt'; item: Item } | null

export class ShelterScene extends RoomScene {
  protected readonly hutId = 'tierheim'
  private selection: Selection = null
  private cards: Key[] = []
  private mainKey!: Key
  private sideKey!: Key

  constructor() {
    super('Shelter')
  }

  init() {
    this.selection = null
    this.cards = []
  }

  create() {
    this.createRoom()
    new LabelPill(this, 90, 134, texts.shelter.yourPets, { size: 5 })
    new LabelPill(this, 90, 214, texts.shelter.lookingForHome, { size: 5 })
    this.mainKey = new Key(this, 14, 290, 74, 28, '', () => this.main(), {
      fill: 'gold',
      label: true,
      fontSize: 6,
    })
    this.sideKey = new Key(this, 92, 290, 74, 28, '', () => this.side(), {
      label: true,
      fontSize: 6,
    })
    this.refresh()
  }

  private refresh() {
    for (const card of this.cards) card.destroy()
    const save = getSave()
    const sel = this.selection

    // Her pets (first three for now; more rows come with more pets)
    const own = save.pets.slice(0, 3).map((pet, i) => {
      const { x } = cardPosition(i)
      const card = new Key(this, x, OWN_ROW_Y, CARD_W, CARD_H, '', () =>
        this.select({ kind: 'own', pet }),
      )
      const napping = isNapping(save, pet.id, Date.now())
      card.add(new Pet(this, CARD_W / 2, 36, pet.species).setScale(2).setSleeping(napping))
      card.add(addText(this, 5, 6, texts.wild.level(petLevel(pet)), 'title', 9).setOrigin(0, 0.5))
      if (napping) card.add(addText(this, CARD_W - 6, 7, 'z', 'title', 10).setOrigin(1, 0.5))
      card.add(addText(this, CARD_W / 2, 44, pet.name, 'label', 4.5))
      if (pet.id === save.activePetId)
        card.add(addText(this, CARD_W / 2, 53, `★ ${texts.shelter.along}`, 'label', 4.5))
      card.setSelected(sel?.kind === 'own' && sel.pet.id === pet.id)
      return card
    })

    const adoptable = adoptablePets().map((item, i) => {
      const { x } = cardPosition(i)
      const card = new ItemCard(this, x, ADOPT_ROW_Y, item, this.savedLook(), () =>
        this.select({ kind: 'adopt', item }),
      )
      card.setPrice(
        canAfford(save, item)
          ? { kind: 'price', coins: item.price }
          : { kind: 'missing', coins: missingCoins(save, item) },
      )
      card.setSelected(sel?.kind === 'adopt' && sel.item.id === item.id)
      return card
    })
    this.cards = [...own, ...adoptable]

    this.mainKey.setVisible(!!sel)
    this.sideKey.setVisible(!!sel)
    if (sel?.kind === 'own') {
      this.mainKey.setCaption(texts.shelter.takeAlong)
      this.sideKey.setCaption(texts.shelter.rename)
    } else if (sel?.kind === 'adopt') {
      this.mainKey.setCaption(texts.shelter.adopt)
      this.sideKey.setCaption(`★ ${texts.shop.wish}`)
    }
  }

  private select(selection: Selection) {
    this.selection = selection
    if (selection?.kind === 'own') {
      sfx.tick()
      // Level, family trait and nap on the pet's card (GAME_DESIGN §4 "Pet traits")
      const { pet } = selection
      const level = petLevel(pet)
      const trait = traitLabel(traitOf(pet.species), level) ?? texts.shelter.noTrait
      const nap = isNapping(getSave(), pet.id, Date.now()) ? ` · ${texts.shelter.napping}` : ''
      this.caption.show(`${pet.name} · ${texts.wild.level(level)} · ${trait}${nap}`, 2500)
    }
    this.refresh()
  }

  private main() {
    const sel = this.selection
    if (sel?.kind === 'own') {
      updateSave((s) => ({ ...s, activePetId: sel.pet.id }))
      this.caption.show(texts.shelter.nowAlong(sel.pet.name), 1500)
      sfx.pling()
      this.pet?.destroy()
      this.pet = new Pet(this, 106, this.preview.y, sel.pet.species).setScale(2)
      this.pet.hop()
      this.refresh()
    } else if (sel?.kind === 'adopt') {
      const save = getSave()
      if (!canAfford(save, sel.item)) {
        this.caption.show(texts.shop.missing(missingCoins(save, sel.item)))
        return
      }
      this.goTo('NameEntry', {
        mode: 'pet',
        species: sel.item.species!,
        itemId: sel.item.id,
        returnTo: 'Shelter',
      })
    }
  }

  private side() {
    const sel = this.selection
    if (sel?.kind === 'own') {
      this.goTo('NameEntry', {
        mode: 'pet',
        species: sel.pet.species,
        petId: sel.pet.id,
        returnTo: 'Shelter',
      })
    } else if (sel?.kind === 'adopt') {
      updateSave((s) => setWish(s, sel.item))
      sfx.pling()
      this.caption.show(texts.shop.wishSet(SPECIES[sel.item.species!].name), 1500)
      this.hud.refreshWish()
    }
  }
}
