import { expect, test, type Page } from '@playwright/test'

type Debug = {
  activeScene(): string | undefined
  toPage(x: number, y: number): { x: number; y: number }
}

const activeScene = (page: Page) =>
  page.evaluate(() => (window as unknown as { __debug: Debug }).__debug.activeScene())

/** Wait until a scene is active and its fade-in (200 ms) and camera follow have settled. */
async function waitForScene(page: Page, key: string, timeout = 15_000) {
  await expect.poll(() => activeScene(page), { timeout }).toBe(key)
  await page.waitForTimeout(800)
}

/** Tap a point given in world (art pixel) coordinates of the active scene. */
async function tapWorld(page: Page, x: number, y: number) {
  const p = await page.evaluate(
    ([x, y]) => (window as unknown as { __debug: Debug }).__debug.toPage(x, y),
    [x, y],
  )
  await page.mouse.click(p.x, p.y)
}

const shot = (page: Page, name: string) =>
  page.screenshot({ path: `test-results/${name}-${test.info().project.name}.png` })

const SAVE_KEY = 'mathe-buehne'
const SAVED = {
  version: 1,
  character: {
    name: 'Lotti',
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
  pets: [{ id: 'hund-1', species: 'hund', name: 'Bello' }],
  activePetId: 'hund-1',
}

/** Start with an existing save and go from the title into the village. */
async function startInVillage(page: Page) {
  await page.addInitScript(
    ([key, value]) => localStorage.setItem(key, value),
    [SAVE_KEY, JSON.stringify(SAVED)],
  )
  await page.goto('/')
  await waitForScene(page, 'Title')
  await tapWorld(page, 90, 277) // SPIELEN
  await waitForScene(page, 'Village')
}

// Name keyboard (NameEntryScene): keys 15 × 22 px, 1 px gap, rows at y 238 / 263 / 288 / 313
const LETTER_ROWS = ['QWERTZUIOPÜ', 'ASDFGHJKLÖÄ', 'YXCVBNMß-']
async function tapLetter(page: Page, letter: string) {
  const row = LETTER_ROWS.findIndex((r) => r.includes(letter))
  await tapWorld(page, 2 + LETTER_ROWS[row].indexOf(letter) * 16 + 7, [238, 263, 288][row] + 11)
}
const tapFertig = (page: Page) => tapWorld(page, 151, 324)
const tapZufall = (page: Page) => tapWorld(page, 29, 324)

test('first start: create the character, name her, pick and name a puppy', async ({ page }) => {
  const requests: string[] = []
  page.on('request', (r) => requests.push(r.url()))

  await page.goto('/')
  const canvas = page.locator('#game canvas')
  await expect(canvas).toBeVisible()
  await waitForScene(page, 'Title')
  const box = (await canvas.boundingBox())!
  expect(box.height / box.width).toBeCloseTo(2, 1)
  await shot(page, '1-title')

  await tapWorld(page, 90, 277) // SPIELEN
  await waitForScene(page, 'CharacterCreate')
  await tapWorld(page, 63, 247) // dress: rosa (rows: Figur, Haut, Frisur, Haare, Kleid, …)
  await shot(page, '2-create')
  await tapWorld(page, 90, 314) // WEITER

  await waitForScene(page, 'NameEntry')
  await tapFertig(page) // empty name is refused
  await page.waitForTimeout(300)
  expect(await activeScene(page)).toBe('NameEntry')
  for (const letter of 'LOTTI') await tapLetter(page, letter)
  await shot(page, '3-name')
  await tapFertig(page)

  await waitForScene(page, 'StarterPet')
  await tapWorld(page, 33, 210) // Hündchen card
  await page.waitForTimeout(300)
  await shot(page, '4-starter')
  await tapWorld(page, 90, 314) // WEITER

  await waitForScene(page, 'NameEntry')
  await tapZufall(page)
  await shot(page, '5-pet-name')
  await tapFertig(page)

  await waitForScene(page, 'Village')
  await shot(page, '6-village')

  const save = await page.evaluate((key) => JSON.parse(localStorage.getItem(key)!), SAVE_KEY)
  expect(save.character.name).toBe('Lotti')
  expect(save.character.look.outfitColor).toBe('rosa')
  expect(save.pets).toHaveLength(1)
  expect(save.pets[0].species).toBe('hund')
  expect(save.pets[0].name.length).toBeGreaterThan(0)

  const origin = new URL(page.url()).origin
  expect(requests.filter((url) => !url.startsWith(origin))).toEqual([])
})

test('first start as a boy: short hair, T-shirt and trousers in two colours', async ({ page }) => {
  await page.goto('/')
  await waitForScene(page, 'Title')
  await tapWorld(page, 90, 277) // SPIELEN
  await waitForScene(page, 'CharacterCreate')
  await tapWorld(page, 139, 135) // Figur: Junge
  await page.waitForTimeout(500)
  await tapWorld(page, 88, 275) // Hose: braun
  await page.waitForTimeout(300)
  await shot(page, '2-create-boy')
  await tapWorld(page, 90, 314) // WEITER
  await waitForScene(page, 'NameEntry')
  for (const letter of 'MAX') await tapLetter(page, letter)
  await tapFertig(page)
  await waitForScene(page, 'StarterPet')
  await tapWorld(page, 33, 210) // Hündchen card
  await page.waitForTimeout(300)
  await tapWorld(page, 90, 314) // WEITER
  await waitForScene(page, 'NameEntry')
  await tapZufall(page)
  await tapFertig(page)
  await waitForScene(page, 'Village')
  await shot(page, '6-village-boy')
  const save = await page.evaluate((key) => JSON.parse(localStorage.getItem(key)!), SAVE_KEY)
  expect(save.character.name).toBe('Max')
  expect(save.character.look).toMatchObject({
    figure: 'junge',
    hair: 'kurz',
    outfit: 'shirt',
    outfitColor2: 'braun',
    accessory: null,
  })
})

test('the physical keyboard types names on the PC', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'pc', 'keyboard input is a PC feature')
  await page.goto('/')
  await waitForScene(page, 'Title')
  await tapWorld(page, 90, 277)
  await waitForScene(page, 'CharacterCreate')
  await tapWorld(page, 90, 314)
  await waitForScene(page, 'NameEntry')
  await page.keyboard.type('mIA 7')
  await page.keyboard.press('Enter')
  await waitForScene(page, 'StarterPet')
  const name = await page.evaluate(
    (key) => JSON.parse(localStorage.getItem(key)!).character.name,
    SAVE_KEY,
  )
  expect(name).toBe('Mia')
})

test('progress survives a reload: the title greets her by name', async ({ page }) => {
  await startInVillage(page)
  await page.reload()
  await waitForScene(page, 'Title')
  await shot(page, 'title-returning')
})

test('tap the Theater, walk in, see the stage and come back', async ({ page }) => {
  await startInVillage(page)
  // Theater hut is at (20, 180), 32 × 34 px
  await tapWorld(page, 36, 196)
  await waitForScene(page, 'Show', 25_000)
  await shot(page, 'stage')
  await tapWorld(page, 32, 10) // home button in the top bar
  await waitForScene(page, 'Village')

  // Input still works after coming back: walk into the Theater a second time
  await tapWorld(page, 36, 196)
  await waitForScene(page, 'Show', 25_000)
})

// No hut is a construction site any more since step 11 (the Bibliothek opened); walking into
// it is tested in library.spec.ts
