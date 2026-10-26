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
  coins: { earned: {}, spent: {} },
  owned: [],
  wish: null,
  battle: { wins: {}, befriended: [], naps: {}, times: {} },
  dojo: { facts: {}, records: {} },
  stars: {},
  settings: { muted: true, knownMs: 3000 },
}

type ShowState = {
  index: number
  answer: { value: number; remainder?: number }
  format: { kind: string; remainder?: boolean }
  attempt: number
  hintVisible: boolean
  busy: boolean
  written?: { digit: number; carry: boolean }
}

const show = (page: Page): Promise<ShowState | undefined> =>
  page.evaluate(() => (window as any).__debug.show())

// LearnHutScene: topic keys 116 × 20 from (14, 62), 23 px apart; level keys 28 × 28 at y 214
const topicKey = (i: number): [number, number] => [72, 62 + i * 23 + 10]
const levelKey = (level: number): [number, number] => [12 + (level - 1) * 32 + 14, 228]
const START_KEY = [90, 298] as const

/** Waits for task `index`, then solves it (grid digit by digit, or number + Enter). */
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

test('Rechenwerkstatt: written plus with hint and shown digit, then division', async ({ page }) => {
  test.setTimeout(180_000)
  await seedSave(page, START)
  await toVillage(page)
  await openScene(page, 'LearnHut', { hut: 'werkstatt' })
  await shot(page, 'learn-werkstatt')

  // Schriftlich plus, level 2 (with carries)
  await tapWorld(page, ...topicKey(1))
  await tapWorld(page, ...levelKey(2))
  await page.waitForTimeout(200)
  await shot(page, 'learn-werkstatt-picked')
  await tapWorld(page, ...START_KEY)
  await waitForScene(page, 'Show')
  let state = (await show(page))!
  expect(state.format.kind).toBe('written')
  await shot(page, 'learn-grid')

  // A wrong digit: hint for that square; a second one: the digit appears in blue
  await page.keyboard.type(String((state.written!.digit + 1) % 10))
  await expect.poll(async () => (await show(page))?.hintVisible).toBe(true)
  await page.waitForTimeout(300)
  await shot(page, 'learn-grid-hint')
  state = (await show(page))!
  await page.keyboard.type(String((state.written!.digit + 1) % 10))
  await expect.poll(async () => (await show(page))?.attempt).toBe(3)
  await page.waitForTimeout(300)
  await shot(page, 'learn-grid-solution')

  for (let i = 0; i < 10; i++) await solve(page, i)
  await waitForScene(page, 'ShowEnd')
  await page.waitForTimeout(800)
  await shot(page, 'learn-end')
  // 1 (shown digit) + 9 × 5 + streak bonus (tasks 2–6) + 10 for the round
  const s = await save(page)
  expect(s.balance).toBe(1 + 9 * 5 + 5 + 10)
  expect(s.learn.werkstatt).toEqual({ topic: 'schriftlichAddition', level: 2 })

  // Zurück → the picker remembers the topic; now written division with remainder
  await tapWorld(page, 127, 275)
  await waitForScene(page, 'LearnHut')
  await tapWorld(page, ...topicKey(4))
  await tapWorld(page, ...levelKey(3))
  await tapWorld(page, ...START_KEY)
  await waitForScene(page, 'Show')
  state = (await show(page))!
  expect(state.format).toMatchObject({ kind: 'written', remainder: true })
  await page.keyboard.type(String(state.written!.digit))
  await page.keyboard.type(String((await show(page))!.written!.digit))
  await page.waitForTimeout(300)
  await shot(page, 'learn-grid-division')
  await solve(page, 0)
  await expect.poll(async () => (await show(page))?.index).toBe(1)
})

test('Zahlenturm and Marktstand: pick a topic and play', async ({ page }) => {
  test.setTimeout(180_000)
  await seedSave(page, START)
  await toVillage(page)

  // Zahlenturm: a whole round of Kopfrechnen level 1
  await openScene(page, 'LearnHut', { hut: 'zahlenturm' })
  await shot(page, 'learn-zahlenturm')
  await tapWorld(page, ...topicKey(0))
  await tapWorld(page, ...START_KEY)
  await waitForScene(page, 'Show')
  for (let i = 0; i < 10; i++) await solve(page, i)
  await waitForScene(page, 'ShowEnd')
  // 10 × 5 + two streak bonuses + 10 for the round
  expect((await save(page)).balance).toBe(10 * 5 + 2 * 5 + 10)

  // Marktstand: money, one task; the house button leads out of its door
  await tapWorld(page, 127, 275) // Zurück
  await waitForScene(page, 'LearnHut')
  await openScene(page, 'LearnHut', { hut: 'marktstand' })
  await shot(page, 'learn-marktstand')
  await tapWorld(page, ...START_KEY)
  await waitForScene(page, 'Show')
  await page.waitForTimeout(500)
  await shot(page, 'learn-marktstand-task')
  await solve(page, 0)
  await expect.poll(async () => (await show(page))?.index).toBe(1)
  await tapWorld(page, 32, 10) // house button
  await waitForScene(page, 'Village')
  await shot(page, 'learn-village')
})
