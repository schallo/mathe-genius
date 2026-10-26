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

const drill = (page: Page) => page.evaluate(() => (window as any).__debug.drill())

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

/** Title → village, then straight into a dojo (walking there is tested in the village tests). */
async function toDojo(page: Page, op: 'mul' | 'div') {
  await seedSave(page, START)
  await toVillage(page)
  await openScene(page, 'EinmaleinsMenu', { op, from: op === 'mul' ? 'maldojo' : 'teildojo' })
}

/** Waits for a new fact, then types `value` (the right answer unless given). */
async function answer(page: Page, enter: boolean, value?: number) {
  await expect.poll(async () => (await drill(page))?.phase, { timeout: 5000 }).toMatch(/task|end/)
  const state = await drill(page)
  if (state.phase === 'end') return state
  await page.keyboard.type(String(value ?? state.answer))
  if (enter) await page.keyboard.press('Enter')
  await expect
    .poll(async () => {
      const s = await drill(page)
      return s.phase !== 'task' || s.index !== state.index
    })
    .toBe(true)
  return drill(page)
}

const MODE = { practice: [48, 274], blitz: [132, 274], duel: [48, 320], row: [132, 320] } as const
/** Row key in the picker overlay (panel at 8, 38; keys 28 px, 32/34 px apart). */
const rowKey = (row: number): [number, number] => [
  8 + 4 + ((row - 1) % 5) * 32 + 14,
  38 + 38 + Math.floor((row - 1) / 5) * 34 + 14,
]
const BACK = [90, 283] as const

test('Mal-Dojo: Üben the 7s with a hint, coins and the grid fills in', async ({ page }) => {
  test.setTimeout(180_000)
  await toDojo(page, 'mul')
  await shot(page, 'dojo-mul-menu')

  await tapWorld(page, ...MODE.practice)
  await page.waitForTimeout(300)
  await shot(page, 'dojo-mul-rows')
  await tapWorld(page, ...rowKey(7))
  await waitForScene(page, 'EinmaleinsDrill')
  let state = await drill(page)
  expect(state).toMatchObject({ mode: 'practice', op: 'mul', queue: 10 })
  expect(state.fact).toMatch(/ · 7$/)
  await shot(page, 'dojo-mul-practice')

  // A wrong answer shows the fact with a helper; she retypes it, the fact comes back later
  await page.keyboard.type(String(state.answer + 1))
  await page.keyboard.press('Enter')
  await expect.poll(async () => (await drill(page)).phase).toBe('retype')
  await page.waitForTimeout(400)
  await shot(page, 'dojo-mul-hint')
  await page.keyboard.type(String(state.answer))
  await page.keyboard.press('Enter')
  await expect.poll(async () => (await drill(page)).index).toBe(1)
  state = await drill(page)
  expect(state.queue).toBe(11)

  for (let i = 0; i < 15 && state.phase !== 'end'; i++) state = await answer(page, true)
  expect(state.phase).toBe('end')
  // 9 facts right the first time (2 coins) + the missed one when it came back (1 coin)
  expect(state.coins).toBe(19)
  await page.waitForTimeout(800)
  await shot(page, 'dojo-mul-practice-end')

  const s = await save(page)
  expect(s.balance).toBe(19)
  const sevens = Object.keys(s.dojo.facts).filter(
    (id) => id.startsWith('mul-') && id.endsWith('-7'),
  )
  expect(sevens).toHaveLength(10)

  await tapWorld(page, ...BACK)
  await waitForScene(page, 'EinmaleinsMenu')
  await shot(page, 'dojo-mul-menu-after')

  // Back out of the door: both dojos stand side by side in the village
  await tapWorld(page, 32, 10) // house button
  await waitForScene(page, 'Village')
  await shot(page, 'village-dojos')
})

test('Teil-Dojo: Reihen-Meister medal, Turbo-Duell record, Blitzrunde', async ({ page }) => {
  test.setTimeout(300_000)
  await toDojo(page, 'div')

  // Reihen-Meister: the 3s without a mistake, quickly → medal
  await tapWorld(page, ...MODE.row)
  await page.waitForTimeout(300)
  await tapWorld(page, ...rowKey(3))
  await waitForScene(page, 'EinmaleinsDrill')
  let state = await drill(page)
  expect(state).toMatchObject({ mode: 'row', op: 'div' })
  expect(state.fact).toMatch(/ : 3$/)
  await shot(page, 'dojo-div-row')
  for (let i = 0; i < 12 && state.phase !== 'end'; i++) state = await answer(page, false)
  expect(state.phase).toBe('end')
  await page.waitForTimeout(800)
  await shot(page, 'dojo-div-row-end')
  let s = await save(page)
  expect(s.dojo.records.div.badges).toEqual([3])
  expect(s.balance).toBe(10 + 15)

  // Turbo-Duell: one mistake (the fact is shown, then comes again), 20 facts solved
  await tapWorld(page, ...BACK)
  await waitForScene(page, 'EinmaleinsMenu')
  await shot(page, 'dojo-div-menu-medal')
  await tapWorld(page, ...MODE.duel)
  await waitForScene(page, 'EinmaleinsDrill')
  state = await drill(page)
  const wrong = state.answer === 9 ? 8 : state.answer + 1
  const typed = String(wrong).length === String(state.answer).length ? wrong : state.answer - 1
  state = await answer(page, false, typed)
  expect(state.phase).toBe('wrong')
  await shot(page, 'dojo-div-duel-wrong')
  for (let i = 0; i < 30 && state.phase !== 'end'; i++) {
    state = await answer(page, false)
    if (i === 8) await shot(page, 'dojo-div-duel')
  }
  expect(state).toMatchObject({ phase: 'end', correct: 20, queue: 21 })
  await page.waitForTimeout(800)
  await shot(page, 'dojo-div-duel-end')
  s = await save(page)
  expect(s.dojo.records.div.duelMs).toBeGreaterThan(0)

  // Blitzrunde: 60 seconds, as many as she can; the first round is a new record
  await tapWorld(page, ...BACK)
  await waitForScene(page, 'EinmaleinsMenu')
  await tapWorld(page, ...MODE.blitz)
  await waitForScene(page, 'EinmaleinsDrill')
  const started = Date.now()
  state = await drill(page)
  while (state.phase !== 'end' && Date.now() - started < 40_000) {
    state = await answer(page, false)
    if (state.correct === 10) await shot(page, 'dojo-div-blitz')
    await page.waitForTimeout(150)
  }
  expect(state.phase).toBe('end')
  await page.waitForTimeout(800)
  await shot(page, 'dojo-div-blitz-end')
  s = await save(page)
  expect(s.dojo.records.div.blitz).toBe(state.correct)
  expect(s.dojo.records.mul.blitz).toBe(0)
})

test('the test speed factor runs game time faster, real speed stays real', async ({ page }) => {
  await seedSave(page, START)
  for (const speed of [1, 4]) {
    await page.goto(`/?speed=${speed}`)
    await waitForScene(page, 'Title')
    await openScene(page, 'EinmaleinsDrill', { op: 'mul', mode: 'blitz' })
    const before = (await drill(page)).elapsedMs
    await page.waitForTimeout(1000)
    const passed = (await drill(page)).elapsedMs - before
    // About 1 s of game time per real second at speed 1, about 4 s at speed 4
    expect(passed).toBeGreaterThan(speed * 900)
    expect(passed).toBeLessThan(speed * 1000 + 600)
  }
})
