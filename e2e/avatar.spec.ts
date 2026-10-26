import { expect, test } from '@playwright/test'
import { openScene, readSave as save, seedSave, shot, tapWorld, toVillage } from './helpers.ts'

const START = {
  version: 4,
  updatedAt: 1,
  character: {
    name: 'Leni',
    // An older look without figure and second outfit colour: filled in on load
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
  pets: [{ id: 'hund-a', species: 'hund', name: 'Bello', xp: 0 }],
  activePetId: 'hund-a',
  coins: { earned: { test: 1000 }, spent: {} },
  owned: [],
  wish: null,
  settings: { muted: true },
}

// Card grid (RoomScene): 54 × 60 cards, 3 per row, rows at y 150 and 214
const card = (i: number) => [5 + (i % 3) * 58 + 27, [150, 214][Math.floor(i / 3)] + 30] as const
const NEXT_PAGE = [159, 331] as const
const BUY = [51, 298] as const
const tab = (i: number) => [4 + i * 43 + 20, 138] as const

test('new clothes on page 2, a two-tone hoodie, cap and hair in the wardrobe', async ({ page }) => {
  test.setTimeout(150_000)
  await seedSave(page, START)
  await toVillage(page)

  // Laden → Kleider, page 2: the Kapuzenpulli
  await openScene(page, 'Shop', { from: 'laden' })
  await tapWorld(page, ...NEXT_PAGE)
  await page.waitForTimeout(300)
  await shot(page, 'avatar-shop-page2')
  await tapWorld(page, ...card(0)) // Kapuzenpulli
  await page.waitForTimeout(300)
  await tapWorld(page, ...BUY)
  await expect.poll(async () => (await save(page)).owned).toContain('hoodie')
  expect((await save(page)).character.look).toMatchObject({
    outfit: 'hoodie',
    outfitColor: 'mint',
    outfitColor2: 'grau',
  })

  // Frisuren: long hair; Schmuck: the cap
  await tapWorld(page, ...tab(1))
  await page.waitForTimeout(300)
  await shot(page, 'avatar-shop-hair')
  await tapWorld(page, ...card(4)) // Lange Haare
  await page.waitForTimeout(300)
  await tapWorld(page, ...BUY)
  await expect.poll(async () => (await save(page)).owned).toContain('lang')
  await tapWorld(page, ...tab(2))
  await page.waitForTimeout(300)
  await tapWorld(page, ...card(5)) // Basecap
  await page.waitForTimeout(300)
  await tapWorld(page, ...BUY)
  await expect.poll(async () => (await save(page)).owned).toContain('cap')
  await shot(page, 'avatar-shop-cap')

  // Mein Haus: the hoodie has two colour rows; the second one colours the trousers
  await openScene(page, 'Wardrobe', { from: 'haus' })
  await page.waitForTimeout(300)
  await shot(page, 'avatar-wardrobe-two-tone')
  await tapWorld(page, 124, 302) // second row: braun
  await expect.poll(async () => (await save(page)).character.look.outfitColor2).toBe('braun')
  await page.waitForTimeout(300)
  await shot(page, 'avatar-wardrobe-trousers')
  const look = (await save(page)).character.look
  // The older look got its new fields when it was saved again
  expect(look).toMatchObject({
    figure: 'maedchen',
    hair: 'lang',
    accessory: 'cap',
    outfit: 'hoodie',
  })
})
