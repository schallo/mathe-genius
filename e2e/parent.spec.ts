import { expect, test, type Page } from '@playwright/test'

async function tapWorld(page: Page, x: number, y: number) {
  const p = await page.evaluate(([x, y]) => (window as any).__debug.toPage(x, y), [x, y])
  await page.mouse.click(p.x, p.y)
}

async function waitForScene(page: Page, key: string) {
  await expect
    .poll(() => page.evaluate(() => (window as any).__debug.activeScene()), { timeout: 15_000 })
    .toBe(key)
  await page.waitForTimeout(800)
}

const V1_SAVE = {
  version: 1,
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
  pets: [{ id: 'hund-1', species: 'hund', name: 'Bello' }],
  activePetId: 'hund-1',
  coins: 40,
  settings: { muted: true },
}

test('parent area: grown-up question, export and import', async ({ page }, testInfo) => {
  await page.addInitScript((save) => {
    if (!sessionStorage.getItem('seeded')) {
      localStorage.setItem('mathe-buehne', save)
      sessionStorage.setItem('seeded', '1')
    }
  }, JSON.stringify(V1_SAVE))
  await page.goto('/')
  await waitForScene(page, 'Title')
  await tapWorld(page, 14, 346) // lock
  await waitForScene(page, 'Parent')

  // Wrong answer keeps the gate closed
  const question = await page.locator('.zh-panel h2').textContent()
  const [a, b] = question!.match(/\d+/g)!.map(Number)
  await page.locator('input[name="answer"]').fill(String(a * b + 1))
  await page.getByRole('button', { name: 'OK' }).click()
  await expect(page.getByText('Das stimmt leider nicht.')).toBeVisible()

  const question2 = await page.locator('.zh-panel h2').textContent()
  const [c, d] = question2!.match(/\d+/g)!.map(Number)
  await page.locator('input[name="answer"]').fill(String(c * d))
  await page.getByRole('button', { name: 'OK' }).click()

  // Migrated v1 save: 40 coins
  await expect(page.getByText('Leni · 40 Münzen · 1 Tier(e)')).toBeVisible()
  await expect(page.getByText('Noch nicht eingerichtet.')).toBeVisible()
  await page.screenshot({ path: `test-results/parent-${testInfo.project.name}.png` })

  // Export downloads a readable save
  if (testInfo.project.name === 'pc') {
    const download = page.waitForEvent('download')
    await page.getByRole('button', { name: 'Exportieren' }).click()
    const file = await download
    expect(file.suggestedFilename()).toMatch(/^mathe-genie-\d{4}-\d{2}-\d{2}\.json$/)
  }

  // Import merges coins earned on another device
  const other = {
    ...V1_SAVE,
    version: 2,
    updatedAt: 1,
    coins: { earned: { phone: 25 }, spent: {} },
    pets: [{ id: 'katze-x', species: 'katze', name: 'Mimi' }],
    activePetId: 'katze-x',
  }
  await page.locator('input[name="file"]').setInputFiles({
    name: 'zahlenhausen.json',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify(other)),
  })
  await expect(page.getByText('Spielstand importiert.')).toBeVisible()
  await expect(page.getByText('Leni · 65 Münzen · 2 Tier(e)')).toBeVisible()

  await page.locator('input[name="file"]').setInputFiles({
    name: 'kaputt.json',
    mimeType: 'application/json',
    buffer: Buffer.from('{"hallo":1}'),
  })
  await expect(page.getByText('Diese Datei ist kein Mathe-Genie-Spielstand.')).toBeVisible()

  await page.getByRole('button', { name: 'Zurück zum Spiel' }).click()
  await waitForScene(page, 'Title')
  await expect(page.locator('.zh-panel')).toHaveCount(0)
})
