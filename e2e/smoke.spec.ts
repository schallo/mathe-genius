import { expect, test, type Page } from '@playwright/test'

type Debug = {
  activeScene(): string | undefined
  toPage(x: number, y: number): { x: number; y: number }
}

const activeScene = (page: Page) =>
  page.evaluate(() => (window as unknown as { __debug: Debug }).__debug.activeScene())

/** Wait until a scene is active and its fade-in (200 ms) and camera follow have settled. */
async function waitForScene(page: Page, key: string, timeout = 5_000) {
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

test('game boots into the village in portrait, without network requests', async ({ page }) => {
  const requests: string[] = []
  page.on('request', (r) => requests.push(r.url()))

  await page.goto('/')
  const canvas = page.locator('#game canvas')
  await expect(canvas).toBeVisible()
  await waitForScene(page, 'Village')

  const box = (await canvas.boundingBox())!
  expect(box.height / box.width).toBeCloseTo(2, 1)

  const origin = new URL(page.url()).origin
  expect(requests.filter((url) => !url.startsWith(origin))).toEqual([])

  await page.screenshot({ path: `test-results/village-${test.info().project.name}.png` })
})

test('tap the Theater, walk in, see the stage and come back', async ({ page }) => {
  await page.goto('/')
  await waitForScene(page, 'Village')

  // Theater hut is at (20, 180), 32 × 34 px
  await tapWorld(page, 36, 196)
  await waitForScene(page, 'Show', 10_000)
  await page.screenshot({ path: `test-results/stage-${test.info().project.name}.png` })

  // "Zurück" pill at the bottom of the stage
  await tapWorld(page, 90, 330)
  await expect.poll(() => activeScene(page)).toBe('Village')
})

test('a hut under construction keeps her in the village', async ({ page }) => {
  await page.goto('/')
  await waitForScene(page, 'Village')

  // Laden at (20, 250)
  await tapWorld(page, 36, 266)
  await page.waitForTimeout(3500)
  expect(await activeScene(page)).toBe('Village')
  await page.screenshot({ path: `test-results/construction-${test.info().project.name}.png` })
})
