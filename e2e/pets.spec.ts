import { expect, test, type Page } from '@playwright/test'
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
  version: 4,
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
  pets: [{ id: 'hund-a', species: 'hund', name: 'Bello', xp: 0 }],
  activePetId: 'hund-a',
  coins: { earned: { test: 1000 }, spent: {} },
  stars: { test: 10 },
  owned: [],
  wish: null,
  settings: { muted: true },
}

// Card grid (RoomScene): 54 × 60 cards, 3 per row, rows at y 150 and 214
const card = (i: number) => [5 + (i % 3) * 58 + 27, [150, 214][Math.floor(i / 3)] + 30] as const
const NEXT_PAGE = [159, 331] as const
const MAIN_KEY = [51, 298] as const
const TAB_ADOPT = [133, 138] as const

test('Tierheim: pages of pets, a special animal for stars moves in with its name', async ({
  page,
}) => {
  test.setTimeout(120_000)
  await seedSave(page, START)
  await toVillage(page)
  await openScene(page, 'Shelter', { from: 'tierheim' })
  await shot(page, 'pets-own')

  await tapWorld(page, ...TAB_ADOPT)
  await page.waitForTimeout(300)
  await shot(page, 'pets-adopt-1')
  await tapWorld(page, ...NEXT_PAGE)
  await page.waitForTimeout(300)
  await tapWorld(page, ...card(4)) // Mr Wriggles (11th pet)
  await page.waitForTimeout(400)
  await shot(page, 'pets-adopt-2')
  await tapWorld(page, ...NEXT_PAGE)
  await page.waitForTimeout(300)
  await shot(page, 'pets-adopt-3')
  await tapWorld(page, ...NEXT_PAGE) // back to page 1
  await page.waitForTimeout(300)
  await tapWorld(page, ...NEXT_PAGE) // page 2
  await page.waitForTimeout(300)
  await tapWorld(page, ...card(4))
  await page.waitForTimeout(300)
  await tapWorld(page, ...MAIN_KEY) // Adoptieren

  await expect
    .poll(async () => (await save(page)).pets.map((p: { name: string }) => p.name))
    .toEqual(['Bello', 'Mr Wriggles'])
  const s = await save(page)
  expect(s.balance).toBe(700)
  const spent = Object.values(s.starsSpent as Record<string, number>).reduce((a, n) => a + n, 0)
  expect(s.stars - spent).toBe(7)
  await page.waitForTimeout(400)
  await shot(page, 'pets-moved-in')
  // He is no longer looking for a home
  await tapWorld(page, ...TAB_ADOPT)
  await page.waitForTimeout(300)
  await tapWorld(page, ...NEXT_PAGE)
  await page.waitForTimeout(300)
  await shot(page, 'pets-adopt-after')
})

type ShowState = { index: number; busy: boolean; answer: { value: number } }
const show = (page: Page): Promise<ShowState | undefined> =>
  page.evaluate(() => (window as any).__debug.show())

test('Treuer Freund: the first mistake of a round still pays like a first try', async ({
  page,
}) => {
  test.setTimeout(120_000)
  await seedSave(page, { ...START, coins: { earned: { test: 100 }, spent: {} } })
  await toVillage(page)
  await openScene(page, 'LearnHut', { hut: 'zahlenturm' })
  await tapWorld(page, 90, 298) // Los!
  await waitForScene(page, 'Show')

  const answer = async (index: number, wrongFirst: boolean) => {
    await expect.poll(async () => (await show(page))?.index, { timeout: 8000 }).toBe(index)
    await expect.poll(async () => (await show(page))?.busy).toBe(false)
    const value = (await show(page))!.answer.value
    if (wrongFirst) {
      await page.keyboard.type(String(value + 1))
      await page.keyboard.press('Enter')
      await page.waitForTimeout(300)
      if (index === 0) await shot(page, 'pets-free-mistake')
    }
    await page.keyboard.type(String(value))
    await page.keyboard.press('Enter')
  }
  // Task 1: wrong, then right → forgiven, 5 coins
  await answer(0, true)
  await expect.poll(async () => (await save(page)).balance).toBe(105)
  // Task 2: wrong again → no free mistake left, 3 coins
  await answer(1, true)
  await expect.poll(async () => (await save(page)).balance).toBe(108)
  // Her level still counts the real tries: no streak there
  expect((await save(page)).mastery.kopfrechnen.firstTry).toBe(0)
})
