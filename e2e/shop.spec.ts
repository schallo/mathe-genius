import { expect, test } from '@playwright/test'
import {
  openScene,
  readSave as save,
  seedSave,
  shot,
  tapWorld,
  toVillage,
  waitForScene,
} from './helpers.ts'

const START = {
  version: 2,
  updatedAt: 1,
  character: {
    name: 'Leni',
    look: {
      skin: 'skin1',
      hair: 'pferdeschwanz',
      hairColor: 'rotblond',
      outfit: 'kleid',
      outfitColor: 'mint',
      accessory: 'schleife',
      accessoryColor: 'rosa',
    },
  },
  pets: [{ id: 'hund-a', species: 'hund', name: 'Bello' }],
  activePetId: 'hund-a',
  coins: { earned: { test: 600 }, spent: {} },
  owned: [],
  wish: null,
  settings: { muted: true },
}

// Card grid (RoomScene): 54 × 60 cards, 3 per row, first row at y 150
const card = (i: number, rowY = 150) => [5 + (i % 3) * 58 + 27, rowY + 30] as const
const HOME = [32, 10] as const

test('shop, Tierheim and wardrobe: buy, wish, adopt, take along, change hair', async ({ page }) => {
  test.setTimeout(180_000)
  await seedSave(page, START)
  await toVillage(page)

  // Laden: test coins, buy the football kit (puts it on), wish for the ball gown
  await openScene(page, 'Shop', { from: 'laden' })
  expect((await save(page)).balance).toBe(600)
  await tapWorld(page, ...card(1)) // Fußballtrikot
  await page.waitForTimeout(300) // the buttons appear after selecting
  await tapWorld(page, 51, 298) // Kaufen
  await expect.poll(async () => (await save(page)).owned).toContain('fussball')
  let s = await save(page)
  expect(s.balance).toBe(420)
  expect(s.character.look.outfit).toBe('fussball')
  await tapWorld(page, ...card(2)) // Ballkleid
  await tapWorld(page, 129, 298) // Wunsch
  await expect.poll(async () => (await save(page)).wish).toBe('ballkleid')
  await page.waitForTimeout(500)
  await shot(page, 'shop')

  // Tierheim: adopt and name a hamster, then take it along
  await tapWorld(page, ...HOME)
  await waitForScene(page, 'Village')
  await openScene(page, 'Shelter', { from: 'tierheim' })
  await tapWorld(page, ...card(1, 222)) // Hamster
  await page.waitForTimeout(300) // the buttons appear after selecting
  await tapWorld(page, 51, 304) // Adoptieren
  await waitForScene(page, 'NameEntry')
  await tapWorld(page, 29, 324) // Zufall
  await tapWorld(page, 151, 324) // Fertig
  await waitForScene(page, 'Shelter')
  s = await save(page)
  expect(s.balance).toBe(120)
  expect(s.pets.map((p: { species: string }) => p.species)).toEqual(['hund', 'hamster'])
  await tapWorld(page, ...card(1, 142)) // her hamster
  await page.waitForTimeout(300) // the buttons appear after selecting
  await tapWorld(page, 51, 304) // Mitnehmen
  await expect.poll(async () => (await save(page)).activePetId).toBe(s.pets[1].id)
  await page.waitForTimeout(500)
  await shot(page, 'shelter')

  // Mein Haus: switch to the Bob haircut
  await tapWorld(page, ...HOME)
  await waitForScene(page, 'Village')
  await openScene(page, 'Wardrobe', { from: 'haus' })
  await tapWorld(page, 90, 138) // tab Frisuren
  await page.waitForTimeout(300) // let the tab redraw its cards
  await tapWorld(page, ...card(1)) // Bob
  await expect.poll(async () => (await save(page)).character.look.hair).toBe('bob')
  await page.waitForTimeout(300)
  await shot(page, 'wardrobe')

  // The wish bar shows in the village
  await tapWorld(page, ...HOME)
  await waitForScene(page, 'Village')
  await shot(page, 'village-wish')
})
