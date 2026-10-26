// Shared helpers for the end-to-end tests. The game is a canvas, so the tests drive it
// through the debug hooks in src/main.ts (window.__debug).
import { expect, test, type Page } from '@playwright/test'

/**
 * Game time runs this many times faster in the tests (`?speed=N`, see src/clock.ts).
 * smoke.spec.ts keeps real speed and real walking; dojo.spec.ts checks the factor itself.
 */
export const SPEED = 4

/** Start URL with the test speed. */
export const fastUrl = (speed = SPEED) => `/?speed=${speed}`

export async function tapWorld(page: Page, x: number, y: number) {
  const p = await page.evaluate(([x, y]) => (window as any).__debug.toPage(x, y), [x, y])
  await page.mouse.click(p.x, p.y)
}

export const activeScene = (page: Page): Promise<string | undefined> =>
  page.evaluate(() => (window as any).__debug.activeScene())

/** Waits until a scene is active and its (shortened) fade-in has settled. */
export async function waitForScene(page: Page, key: string, timeout = 25_000) {
  await expect.poll(() => activeScene(page), { timeout }).toBe(key)
  await page.waitForTimeout(300)
}

/** Jumps straight into a scene (skips walking through the village). */
export async function openScene(page: Page, key: string, data: object = {}) {
  await page.evaluate(([key, data]) => (window as any).__debug.start(key, data), [key, data])
  await waitForScene(page, key)
}

/** Stores a save before the game loads – only once per tab, so reloads keep progress. */
export async function seedSave(page: Page, save: object) {
  await page.addInitScript((s) => {
    if (!sessionStorage.getItem('seeded')) {
      localStorage.setItem('mathe-buehne', s)
      sessionStorage.setItem('seeded', '1')
    }
  }, JSON.stringify(save))
}

/** Title → SPIELEN → village, at test speed. */
export async function toVillage(page: Page) {
  await page.goto(fastUrl())
  await waitForScene(page, 'Title')
  await tapWorld(page, 90, 277) // SPIELEN
  await waitForScene(page, 'Village')
}

export const shot = (page: Page, name: string) =>
  page.screenshot({ path: `test-results/${name}-${test.info().project.name}.png` })

/** The stored save with the coin balance and the star count added. */
export const readSave = (page: Page) =>
  page.evaluate(() => {
    const s = JSON.parse(localStorage.getItem('mathe-buehne')!)
    const sum = (c: Record<string, number> = {}) => Object.values(c).reduce((a, n) => a + n, 0)
    return { ...s, balance: sum(s.coins.earned) - sum(s.coins.spent), stars: sum(s.stars) }
  })
