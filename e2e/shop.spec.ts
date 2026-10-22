import { expect, test, type Page } from '@playwright/test'

async function tapWorld(page: Page, x: number, y: number) {
  const p = await page.evaluate(([x, y]) => (window as any).__debug.toPage(x, y), [x, y])
  await page.mouse.click(p.x, p.y)
}

async function waitForScene(page: Page, key: string, timeout = 25_000) {
  await expect
    .poll(() => page.evaluate(() => (window as any).__debug.activeScene()), { timeout })
    .toBe(key)
  await page.waitForTimeout(800)
}

const save = (page: Page) =>
  page.evaluate(() => {
    const s = JSON.parse(localStorage.getItem('mathe-buehne')!)
    const sum = (c: Record<string, number>) => Object.values(c).reduce((a, n) => a + n, 0)
    return { ...s, balance: sum(s.coins.earned) - sum(s.coins.spent) }
  })

const shot = (page: Page, name: string) =>
  page.screenshot({ path: `test-results/${name}-${test.info().project.name}.png` })

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
  coins: { earned: {}, spent: {} },
  owned: [],
  wish: null,
  settings: { muted: true },
}

// Card grid (RoomScene): 54 × 60 cards, 3 per row, first row at y 150
const card = (i: number, rowY = 150) => [5 + (i % 3) * 58 + 27, rowY + 30] as const
const HOME = [32, 10] as const

test('shop, Tierheim and wardrobe: buy, wish, adopt, take along, change hair', async ({ page }) => {
  test.setTimeout(180_000)
  await page.addInitScript((s) => {
    if (!sessionStorage.getItem('seeded')) {
      localStorage.setItem('mathe-buehne', s)
      sessionStorage.setItem('seeded', '1')
    }
  }, JSON.stringify(START))
  await page.goto('/')
  await waitForScene(page, 'Title')
  await tapWorld(page, 90, 277) // SPIELEN
  await waitForScene(page, 'Village')

  // Laden: test coins, buy the football kit (puts it on), wish for the ball gown
  await tapWorld(page, 36, 266)
  await waitForScene(page, 'Shop')
  for (let i = 0; i < 6; i++) await tapWorld(page, 109, 10) // temporary +100
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
  await tapWorld(page, 144, 266)
  await waitForScene(page, 'Shelter')
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
  await tapWorld(page, 36, 336)
  await waitForScene(page, 'Wardrobe')
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
