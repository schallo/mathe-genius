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
  coins: { earned: { test: 200 }, spent: {} },
  owned: [],
  wish: null,
  battle: { wins: {}, befriended: [], naps: {}, times: {} },
  dojo: { facts: {}, records: {} },
  // One star from before, so the level-up star makes two (enough for the Sternspange)
  stars: { test: 1 },
  settings: { muted: true, knownMs: 3000 },
}

/** An old mistake, due in the next Theater show */
const MISTAKE = {
  question: '340 + 270 = ?',
  answer: { value: 610 },
  format: { kind: 'numpad', remainder: false },
  hintSteps: ['Rechne erst die Hunderter, dann die Zehner.'],
  solutionSteps: ['300 + 200 = 500', '40 + 70 = 110', '= 610'],
  topic: 'kopfrechnen',
  level: 1,
  math: { kind: 'calc', op: '+', operands: [340, 270] },
}

type ShowState = {
  index: number
  answer: { value: number; remainder?: number }
  format: { kind: string; remainder?: boolean }
  busy: boolean
  review: boolean
  written?: { digit: number }
}

const show = (page: Page): Promise<ShowState | undefined> =>
  page.evaluate(() => (window as any).__debug.show())

/** Solves task `index` on the first try (number + Enter, remainder, or the grid). */
async function solve(page: Page, index: number) {
  await expect.poll(async () => (await show(page))?.index, { timeout: 8000 }).toBe(index)
  await expect.poll(async () => (await show(page))?.busy).toBe(false)
  const state = (await show(page))!
  if (state.format.kind === 'written') {
    for (let i = 0; i < 40; i++) {
      const now = await show(page)
      if (!now?.written || now.index !== index) return
      await page.keyboard.type(String(now.written.digit))
    }
    return
  }
  await page.keyboard.type(String(state.answer.value))
  await page.keyboard.press('Enter')
  if (state.format.remainder) {
    await page.keyboard.type(String(state.answer.remainder ?? 0))
    await page.keyboard.press('Enter')
  }
}

test('3 right in a row: next level and a star, then a star item in the shop', async ({ page }) => {
  test.setTimeout(150_000)
  await seedSave(page, START)
  await toVillage(page)

  // Zahlenturm, Kopfrechnen at her level 1: three first tries → level 2 and a star
  await openScene(page, 'LearnHut', { hut: 'zahlenturm' })
  await tapWorld(page, 90, 298) // Los!
  await waitForScene(page, 'Show')
  for (let i = 0; i < 3; i++) await solve(page, i)
  await expect.poll(async () => (await save(page)).mastery?.kopfrechnen?.level).toBe(2)
  expect((await save(page)).stars).toBe(2)
  await page.waitForTimeout(400)
  await shot(page, 'progress-level-up')

  // The picker now marks level 2 as hers
  await tapWorld(page, 32, 10) // house button → village
  await waitForScene(page, 'Village')
  await openScene(page, 'LearnHut', { hut: 'zahlenturm' })
  await shot(page, 'progress-picker-level')

  // Laden → Schmuck: the Sternspange costs 2 stars and 30 coins
  await openScene(page, 'Shop', { from: 'laden' })
  await tapWorld(page, 88, 138) // tab Schmuck
  await page.waitForTimeout(300)
  // Schmuck has three pages; the Sternspange is the 4th card on page 3
  await tapWorld(page, 159, 331) // ▶
  await page.waitForTimeout(300)
  await tapWorld(page, 159, 331) // ▶
  await page.waitForTimeout(300)
  await tapWorld(page, 32, 244) // Sternspange
  await page.waitForTimeout(300)
  await shot(page, 'progress-star-item')
  await tapWorld(page, 51, 298) // Kaufen
  await expect.poll(async () => (await save(page)).owned).toContain('sternspange')
  const s = await save(page)
  expect(s.balance).toBe(200 + 3 * 5 - 30)
  expect(
    s.stars - Object.values(s.starsSpent as Record<string, number>).reduce((a, n) => a + n, 0),
  ).toBe(0)
  await page.waitForTimeout(500)
  await shot(page, 'progress-star-bought')
})

test('an old mistake comes back in the Theater, marked "Nochmal"', async ({ page }) => {
  test.setTimeout(120_000)
  await seedSave(page, {
    ...START,
    review: { items: [{ task: MISTAKE, due: 0, misses: 1 }], shows: 0 },
  })
  await toVillage(page)
  await openScene(page, 'Show', { round: { kind: 'theater', hut: 'zahlenturm' } })

  let found = false
  for (let i = 0; i < 10; i++) {
    await expect.poll(async () => (await show(page))?.index, { timeout: 8000 }).toBe(i)
    const state = (await show(page))!
    if (state.review) {
      found = true
      expect(state.answer.value).toBe(610)
      await page.waitForTimeout(700)
      await shot(page, 'progress-review')
    }
    await solve(page, i)
  }
  expect(found).toBe(true)
  await waitForScene(page, 'ShowEnd')
  const s = await save(page)
  expect(s.review.items).toEqual([])
  expect(s.review.shows).toBe(1)
})
