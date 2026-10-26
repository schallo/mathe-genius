import { expect, test, type Page } from '@playwright/test'
import {
  activeScene,
  openScene,
  readSave as save,
  seedSave,
  shot,
  tapWorld,
  toVillage,
  waitForScene,
} from './helpers.ts'

const pad = (n: number) => String(n).padStart(2, '0')
const key = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`

/** The days of this week (Monday first) other than today. */
function otherDaysThisWeek(): string[] {
  const today = new Date()
  const monday = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7))
  const days = Array.from({ length: 7 }, (_, i) =>
    key(new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + i)),
  )
  return days.filter((d) => d !== key(today))
}

function start(extra: object = {}) {
  return {
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
    coins: { earned: { test: 100 }, spent: {} },
    owned: ['ball'],
    wish: null,
    settings: { muted: true, knownMs: 3000, roundsPerDay: 2 },
    ...extra,
  }
}

type ShowState = { index: number; busy: boolean; answer: { value: number } }
const show = (page: Page): Promise<ShowState | undefined> =>
  page.evaluate(() => (window as any).__debug.show())

/** A whole Zahlenturm round of Kopfrechnen level 1, all right on the first try. */
async function playRound(page: Page) {
  await openScene(page, 'LearnHut', { hut: 'zahlenturm' })
  await tapWorld(page, 72, 72) // Kopfrechnen
  await tapWorld(page, 90, 298) // Los!
  await waitForScene(page, 'Show')
  for (let i = 0; i < 10; i++) {
    await expect.poll(async () => (await show(page))?.index, { timeout: 8000 }).toBe(i)
    await expect.poll(async () => (await show(page))?.busy).toBe(false)
    await page.keyboard.type(String((await show(page))!.answer.value))
    await page.keyboard.press('Enter')
  }
  await waitForScene(page, 'ShowEnd')
}

test('a round gives the day sticker; the 5th sticker of the week opens the box', async ({
  page,
}) => {
  test.setTimeout(150_000)
  const days = Object.fromEntries(
    otherDaysThisWeek()
      .slice(0, 4)
      .map((d) => [d, 1]),
  )
  await seedSave(page, start({ calendar: { days, boxes: [] } }))
  await toVillage(page)
  await playRound(page)
  // The message comes 0.9 s after the end card (game time) and stays 4.5 s
  await page.waitForTimeout(250)
  await shot(page, 'library-show-end')
  const s = await save(page)
  expect(Object.values(s.calendar.days).filter((n) => (n as number) > 0)).toHaveLength(5)
  expect(s.calendar.boxes).toHaveLength(1)
  // The cheapest Schmuck she lacks (the ball was owned already): the Brille
  expect(s.owned).toContain('brille')

  // Kalender in the Bibliothek
  await openScene(page, 'Library', { from: 'bibliothek' })
  await tapWorld(page, 133, 48) // tab Kalender
  await page.waitForTimeout(400)
  await shot(page, 'library-calendar')
})

test('album: silhouettes, a full page gives a star; the Bibliothek door opens', async ({
  page,
}) => {
  test.setTimeout(120_000)
  await seedSave(page, start())
  await toVillage(page)
  // Walk to the Bibliothek at the top of the island (no longer a construction site)
  await page.evaluate(() => (window as any).__debug.villageTap(36, 50))
  await waitForScene(page, 'Library', 30_000)
  // The ball was the only toy: Spielzeug is full → one bonus star
  await expect.poll(async () => (await save(page)).album?.claimed).toEqual(['spielzeug'])
  expect((await save(page)).stars).toBe(1)
  await page.waitForTimeout(300)
  await shot(page, 'library-album')
  await tapWorld(page, 4 + 2 * 34 + 16, 68) // Schmuck
  await page.waitForTimeout(300)
  await shot(page, 'library-album-schmuck')
  await tapWorld(page, 4 + 4 * 34 + 16, 68) // Tiere
  await page.waitForTimeout(300)
  await shot(page, 'library-album-tiere')
  expect(await activeScene(page)).toBe('Library')
})

test('mailbox → parent area: settings, bonus coins; then a friendly break', async ({ page }) => {
  test.setTimeout(150_000)
  await seedSave(page, start())
  await toVillage(page)
  await page.evaluate(() => (window as any).__debug.villageTap(122, 452)) // mailbox
  await waitForScene(page, 'Parent')
  const question = await page.locator('.zh-panel h2').textContent()
  const [a, b] = question!.match(/\d+/g)!.map(Number)
  await page.locator('input[name="answer"]').fill(String(a * b))
  await page.getByRole('button', { name: 'OK' }).click()
  await expect(page.getByRole('heading', { name: 'Fortschritt' })).toBeVisible()
  await page.screenshot({
    path: `test-results/parent-progress-${test.info().project.name}.png`,
    fullPage: true,
  })

  await page.getByRole('button', { name: '+25' }).click()
  await expect(page.getByText('+25 Münzen für Leni!')).toBeVisible()
  await page.locator('select[name="roundsPerDay"]').selectOption('1')
  await page.locator('select[name="level-kopfrechnen"]').selectOption('3')
  await page.getByRole('button', { name: 'Speichern' }).click()
  await expect(page.getByText('Einstellungen gespeichert.')).toBeVisible()
  let s = await save(page)
  expect(s.balance).toBe(125)
  expect(s.settings.roundsPerDay).toBe(1)
  expect(s.mastery.kopfrechnen.level).toBe(3)

  // Back to the village (where she came from), one round → sticker and the break message
  await page.getByRole('button', { name: 'Zurück zum Spiel' }).click()
  await waitForScene(page, 'Village')
  await playRound(page)
  await page.waitForTimeout(250)
  await shot(page, 'library-break')
  s = await save(page)
  expect(Object.keys(s.calendar.days)).toHaveLength(1)
})
