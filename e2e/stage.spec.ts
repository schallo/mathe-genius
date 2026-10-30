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
  pets: [{ id: 'hamster-a', species: 'hamster', name: 'Krümel', xp: 0 }],
  activePetId: 'hamster-a',
  coins: { earned: { test: 1000 }, spent: {} },
  owned: [],
  wish: null,
  settings: { muted: true },
}

// Card grid (RoomScene): 54 × 60 cards, 3 per row, rows at y 150 and 214
const card = (i: number) => [5 + (i % 3) * 58 + 27, [150, 214][Math.floor(i / 3)] + 30] as const
const NEXT_PAGE = [159, 331] as const
const BUY = [51, 298] as const
const SHOP_TAB_BUEHNE = [156, 138] as const
const WARDROBE_TAB_BUEHNE = [153, 138] as const

test('Bühne: try decor on the stage, buy it, see it in the show, take it down', async ({
  page,
}) => {
  test.setTimeout(150_000)
  await seedSave(page, { ...START, welcomed: '2000-01-01' })
  await toVillage(page)
  await openScene(page, 'Shop', { from: 'laden' })
  await tapWorld(page, ...SHOP_TAB_BUEHNE)
  await page.waitForTimeout(300)
  await shot(page, 'stage-shop')

  // Rosa Vorhang: tried on behind her, then bought → it is up at once
  await tapWorld(page, ...card(0))
  await page.waitForTimeout(300)
  await shot(page, 'stage-try-curtain')
  await tapWorld(page, ...BUY)
  await expect.poll(async () => (await save(page)).stage).toEqual({ vorhang: 'vorhang-rosa' })

  // Page 2: Laternen (5th card) and Roter Teppich (2nd card)
  await tapWorld(page, ...NEXT_PAGE)
  await page.waitForTimeout(300)
  await tapWorld(page, ...card(4)) // Laternen
  await page.waitForTimeout(200)
  await tapWorld(page, ...BUY)
  await tapWorld(page, ...card(1)) // Roter Teppich
  await page.waitForTimeout(200)
  await tapWorld(page, ...BUY)
  // Page 3: Publikum
  await tapWorld(page, ...NEXT_PAGE)
  await page.waitForTimeout(300)
  await tapWorld(page, ...card(0))
  await page.waitForTimeout(200)
  await tapWorld(page, ...BUY)
  await expect
    .poll(async () => (await save(page)).stage)
    .toEqual({
      vorhang: 'vorhang-rosa',
      deko: 'laternen',
      teppich: 'teppich-rot',
      publikum: 'publikum',
    })
  expect((await save(page)).balance).toBe(1000 - 120 - 100 - 80 - 300)
  await page.waitForTimeout(1200)
  await shot(page, 'stage-shop-decorated')

  // Her decorated stage in a learning-hut round
  await openScene(page, 'LearnHut', { hut: 'zahlenturm' })
  await tapWorld(page, 90, 298) // Los!
  await waitForScene(page, 'Show')
  await page.waitForTimeout(800)
  await shot(page, 'stage-show')

  // Mein Haus → Bühne: tapping the curtain takes it down again
  await openScene(page, 'Wardrobe', { from: 'haus' })
  await tapWorld(page, ...WARDROBE_TAB_BUEHNE)
  await page.waitForTimeout(300)
  await shot(page, 'stage-wardrobe')
  await tapWorld(page, ...card(0)) // Rosa Vorhang (first owned decor)
  await expect.poll(async () => (await save(page)).stage.vorhang).toBeUndefined()
})

test('her pet welcomes her once a day in the village', async ({ page }) => {
  test.setTimeout(90_000)
  await seedSave(page, START)
  await toVillage(page)
  const today = await page.evaluate(() => {
    const d = new Date()
    const pad = (n: number) => String(n).padStart(2, '0')
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
  })
  await expect.poll(async () => (await save(page)).welcomed).toBe(today)
  await page.waitForTimeout(500)
  await shot(page, 'stage-welcome')
})
