// Tierheim (GAME_DESIGN §3a, §4): her pets (choose who comes along, rename) and pets
// looking for a home (adopt with coins, then name them; special animals cost stars too and
// arrive with their own name). Two tabs with pages of six cards, like the Laden.
import { Pet } from '../art/pets/Pet'
import { sfx } from '../audio/sfx'
import { traitLabel } from '../battle/battle'
import { isNapping, petLevel } from '../battle/progress'
import { SPECIES, traitOf, type SpeciesId } from '../data/creatures'
import type { Item } from '../data/items'
import { texts } from '../data/texts'
import { coinBalance, type PetSave } from '../state/save'
import { adopt, adoptablePets, canAfford, missingCoins, missingStars, setWish } from '../state/shop'
import { deviceId, getSave, replaceSave, updateSave } from '../state/store'
import { confetti } from '../ui/confetti'
import { CARD_H, CARD_W, ItemCard } from '../ui/ItemCard'
import { Key } from '../ui/Key'
import { Pager } from '../ui/Pager'
import { Tabs } from '../ui/Tabs'
import { addText } from '../ui/text'
import { RoomScene, cardPosition } from './RoomScene'

type Tab = 'own' | 'adopt'
type Selection = { kind: 'own'; pet: PetSave } | { kind: 'adopt'; item: Item } | null

/** "Hoppel-Hilfe: 1 Fehler frei" – the trait's name and what it does at this level. */
export function traitInfo(species: SpeciesId, level: number): string {
  const trait = traitOf(species)
  return trait ? `${trait.name}: ${traitLabel(trait, level)}` : texts.shelter.noTrait
}

export class ShelterScene extends RoomScene {
  protected readonly hutId = 'tierheim'
  private tab: Tab = 'own'
  private selection: Selection = null
  private cards: Phaser.GameObjects.Container[] = []
  private tabs!: Tabs<Tab>
  private pager!: Pager
  private mainKey!: Key
  private sideKey!: Key

  constructor() {
    super('Shelter')
  }

  init(data: { tab?: Tab }) {
    this.tab = data.tab ?? 'own'
    this.selection = null
    this.cards = []
  }

  create() {
    this.createRoom()
    this.tabs = new Tabs<Tab>(
      this,
      130,
      [
        { id: 'own', label: texts.shelter.yourPets },
        { id: 'adopt', label: texts.shelter.lookingForHome },
      ],
      (id) => this.showTab(id),
    ).select(this.tab)
    this.pager = new Pager(this, 318, () => this.refresh())
    this.mainKey = new Key(this, 14, 284, 74, 28, '', () => this.main(), {
      fill: 'gold',
      label: true,
      fontSize: 6,
    })
    this.sideKey = new Key(this, 92, 284, 74, 28, '', () => this.side(), {
      label: true,
      fontSize: 6,
    })
    this.refresh()
  }

  private showTab(tab: Tab) {
    this.tab = tab
    this.tabs.select(tab)
    this.selection = null
    this.pager.reset()
    this.refresh()
  }

  private refresh() {
    for (const card of this.cards) card.destroy()
    const save = getSave()
    const sel = this.selection

    if (this.tab === 'own') {
      this.cards = this.pager.slice(save.pets).map((pet, i) => {
        const { x, y } = cardPosition(i)
        const card = new Key(this, x, y, CARD_W, CARD_H, '', () =>
          this.select({ kind: 'own', pet }),
        )
        const napping = isNapping(save, pet.id, Date.now())
        card.add(new Pet(this, CARD_W / 2, 36, pet.species).setScale(2).setSleeping(napping))
        card.add(addText(this, 5, 6, texts.wild.level(petLevel(pet)), 'title', 9).setOrigin(0, 0.5))
        if (napping) card.add(addText(this, CARD_W - 6, 7, 'z', 'title', 10).setOrigin(1, 0.5))
        const long = pet.name.length > 12
        card.add(addText(this, CARD_W / 2, 44, pet.name, 'label', long ? 3.5 : 4.5))
        if (pet.id === save.activePetId)
          card.add(addText(this, CARD_W / 2, 53, `★ ${texts.shelter.along}`, 'label', 4.5))
        card.setSelected(sel?.kind === 'own' && sel.pet.id === pet.id)
        return card
      })
    } else {
      this.cards = this.pager.slice(adoptablePets(save)).map((item, i) => {
        const { x, y } = cardPosition(i)
        const card = new ItemCard(this, x, y, item, this.savedLook(), () =>
          this.select({ kind: 'adopt', item }),
        )
        card.setPrice(
          canAfford(save, item)
            ? { kind: 'price', coins: item.price, stars: item.starCost }
            : missingStars(save, item) > 0
              ? { kind: 'text', text: texts.shop.missingStarsShort(missingStars(save, item)) }
              : { kind: 'missing', coins: missingCoins(save, item) },
        )
        card.setSelected(sel?.kind === 'adopt' && sel.item.id === item.id)
        return card
      })
    }

    this.mainKey.setVisible(!!sel)
    this.sideKey.setVisible(!!sel)
    if (sel?.kind === 'own') {
      this.mainKey.setCaption(texts.shelter.takeAlong)
      this.sideKey.setCaption(texts.shelter.rename)
    } else if (sel?.kind === 'adopt') {
      this.mainKey.setCaption(texts.shelter.adopt)
      this.sideKey.setCaption(`★ ${texts.shop.wish}`)
    }
    this.hud.setCoins(coinBalance(save))
  }

  private select(selection: Selection) {
    this.selection = selection
    sfx.tick()
    // Level, trait and nap on the pet's card (GAME_DESIGN §4 "Pet traits")
    if (selection?.kind === 'own') {
      const { pet } = selection
      const level = petLevel(pet)
      const nap = isNapping(getSave(), pet.id, Date.now()) ? ` · ${texts.shelter.napping}` : ''
      this.caption.show(
        `${pet.name} · ${texts.wild.level(level)} · ${traitInfo(pet.species, level)}${nap}`,
        3000,
      )
    } else if (selection?.kind === 'adopt') {
      this.caption.show(traitInfo(selection.item.species!, 1), 3000)
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
      const species = sel.item.species!
      if (!canAfford(save, sel.item)) {
        const stars = missingStars(save, sel.item)
        this.caption.show(
          stars > 0
            ? texts.shop.missingStars(stars)
            : texts.shop.missing(missingCoins(save, sel.item)),
        )
        return
      }
      const uniqueName = SPECIES[species].uniqueName
      if (uniqueName) {
        // Special animals come with their own name: they move in right away
        const result = adopt(save, sel.item, uniqueName, deviceId())
        if (!result.ok) return
        replaceSave({ ...result.save, updatedAt: Date.now() })
        sfx.fanfare()
        confetti(this)
        this.caption.show(texts.shelter.movesIn(uniqueName), 2500)
        this.showTab('own')
        return
      }
      this.goTo('NameEntry', {
        mode: 'pet',
        species,
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
      this.caption.show(texts.shop.wishSet(sel.item.name), 1500)
      this.hud.refreshWish()
    }
  }
}
