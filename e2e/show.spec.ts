import { expect, test, type Page } from '@playwright/test'

type ShowState = {
  index: number
  answer: { value: number; remainder?: number }
  format: { kind: string; remainder?: boolean; options?: { value: number }[] }
  attempt: number
  hintVisible: boolean
  busy: boolean
}
type Debug = {
  activeScene(): string | undefined
  toPage(x: number, y: number): { x: number; y: number }
  show(): ShowState | undefined
}
const debug = <T>(page: Page, fn: (d: Debug) => T) =>
  page.evaluate(
    (src) => new Function('d', `return (${src})(d)`)((window as any).__debug),
    fn.toString(),
  ) as Promise<T>

async function tapWorld(page: Page, x: number, y: number) {
  const p = await page.evaluate(([x, y]) => (window as any).__debug.toPage(x, y), [x, y])
  await page.mouse.click(p.x, p.y)
}

async function waitForScene(page: Page, key: string, timeout = 25_000) {
  await expect.poll(() => debug(page, (d) => d.activeScene()), { timeout }).toBe(key)
  await page.waitForTimeout(800)
}

const SAVED = {
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
  coins: 0,
  settings: { muted: true },
}

// Number pad (src/ui/NumberPad.ts): keys 40 × 30, gap 4, from (24, 210); layout 1–9, ⌫, 0, OK
const PAD_KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '⌫', '0', 'OK']
const padKey = (page: Page, key: string) => {
  const i = PAD_KEYS.indexOf(key)
  return tapWorld(page, 24 + (i % 3) * 44 + 20, 210 + Math.floor(i / 3) * 34 + 15)
}
async function typeNumber(page: Page, n: number) {
  for (const digit of String(n)) await padKey(page, digit)
  await padKey(page, 'OK')
}

/** Answer the current task, correctly or with a wrong value. */
async function answer(page: Page, state: ShowState, correct = true) {
  const value = correct ? state.answer.value : state.answer.value + 1
  if (state.format.kind === 'choice') {
    const options = state.format.options!
    const target = correct ? value : options.find((o) => o.value !== state.answer.value)!.value
    const i = options.findIndex((o) => o.value === target)
    const centered = options.length % 2 === 1 && i === options.length - 1
    const x = centered ? 90 : 22 + (i % 2) * 72 + 32
    await tapWorld(page, x, 216 + Math.floor(i / 2) * 46 + 18)
    return
  }
  await typeNumber(page, value)
  if (state.format.remainder) await typeNumber(page, state.answer.remainder ?? 0)
}

const showState = (page: Page) => debug(page, (d) => d.show())

async function startShow(page: Page) {
  await page.addInitScript(
    (save) => localStorage.setItem('mathe-buehne', save),
    JSON.stringify(SAVED),
  )
  await page.goto('/')
  await waitForScene(page, 'Title')
  await tapWorld(page, 90, 277) // SPIELEN
  await waitForScene(page, 'Village')
  await tapWorld(page, 36, 196) // Theater
  await waitForScene(page, 'Show')
}

test('play a whole show: hint, worked solution, coins, show end', async ({ page }) => {
  test.setTimeout(120_000)
  await startShow(page)
  await page.screenshot({ path: `test-results/show-task-${test.info().project.name}.png` })

  // Task 1: wrong twice (hint, then worked solution), then correct → 1 coin
  let state = (await showState(page))!
  await answer(page, state, false)
  await expect.poll(async () => (await showState(page))?.hintVisible).toBe(true)
  await page.screenshot({ path: `test-results/show-hint-${test.info().project.name}.png` })
  state = (await showState(page))!
  await answer(page, state, false)
  await expect.poll(async () => (await showState(page))?.attempt).toBe(3)
  await page.waitForTimeout(300)
  await page.screenshot({ path: `test-results/show-solution-${test.info().project.name}.png` })
  await answer(page, (await showState(page))!)

  // Tasks 2–10 correct on the first try
  for (let i = 1; i < 10; i++) {
    await expect.poll(async () => (await showState(page))?.index, { timeout: 5000 }).toBe(i)
    await expect.poll(async () => (await showState(page))?.busy).toBe(false)
    await answer(page, (await showState(page))!)
  }

  await waitForScene(page, 'ShowEnd')
  await page.waitForTimeout(2500)
  await page.screenshot({ path: `test-results/show-end-${test.info().project.name}.png` })

  // 1 (after solution) + 8 × 5 + 1 × 10 (challenge) + 1 streak bonus (tasks 2–6) + 10 show bonus
  const coins = await page.evaluate(() => {
    const { earned, spent } = JSON.parse(localStorage.getItem('mathe-buehne')!).coins
    const sum = (c: Record<string, number>) => Object.values(c).reduce((s, n) => s + n, 0)
    return sum(earned) - sum(spent)
  })
  expect(coins).toBe(1 + 8 * 5 + 10 + 5 + 10)

  await tapWorld(page, 127, 275) // Ins Dorf
  await waitForScene(page, 'Village')
})
