import { expect, test } from '@playwright/test'

test('game boots and fills the portrait viewport', async ({ page }) => {
  const requests: string[] = []
  page.on('request', (r) => requests.push(r.url()))

  await page.goto('/')
  const canvas = page.locator('#game canvas')
  await expect(canvas).toBeVisible()
  await page.waitForFunction(() =>
    (
      window as unknown as { __game?: { scene: { isActive(k: string): boolean } } }
    ).__game?.scene.isActive('Boot'),
  )

  const box = (await canvas.boundingBox())!
  expect(box.height / box.width).toBeCloseTo(2, 1)

  // No runtime requests outside our own origin (fonts are bundled)
  const origin = new URL(page.url()).origin
  expect(requests.filter((url) => !url.startsWith(origin))).toEqual([])

  await page.screenshot({ path: `test-results/boot-${test.info().project.name}.png` })
})
