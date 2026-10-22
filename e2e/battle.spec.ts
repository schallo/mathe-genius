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

const battle = (page: Page) => page.evaluate(() => (window as any).__debug.battle())

const shot = (page: Page, name: string) =>
  page.screenshot({ path: `test-results/${name}-${test.info().project.name}.png` })

function start(wins: Record<string, number> = {}) {
  return {
    version: 3,
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
    battle: { wins, befriended: [], naps: {}, times: {} },
    settings: { muted: true },
  }
}

/** Title → village → jetty → wild island. */
async function toWild(page: Page, seed: object) {
  await page.addInitScript((s) => {
    if (!sessionStorage.getItem('seeded')) {
      localStorage.setItem('mathe-buehne', s)
      sessionStorage.setItem('seeded', '1')
    }
  }, JSON.stringify(seed))
  await page.goto('/')
  await waitForScene(page, 'Title')
  await tapWorld(page, 90, 277) // SPIELEN
  await waitForScene(page, 'Village')
  // The village scrolls: walk up the main path, then tap the jetty once it is in view
  await tapWorld(page, 90, 90)
  const scene = () => page.evaluate(() => (window as any).__debug.activeScene())
  for (let i = 0; i < 15 && (await scene()) === 'Village'; i++) {
    await page.waitForTimeout(1500)
    if ((await scene()) === 'Village') await tapWorld(page, 90, 6)
  }
  await waitForScene(page, 'Wild', 30_000)
}

async function fight(page: Page, species: string) {
  const wild = await page.evaluate(() => (window as any).__debug.wild())
  const c = wild.creatures.find((x: { species: string }) => x.species === species)
  await tapWorld(page, Math.round(c.x), Math.round(c.y) - 6)
  await waitForScene(page, 'Battle', 30_000)
}

/** Types the answer (or a wrong one with the same number of digits) once a task is shown. */
async function answer(page: Page, correct: boolean) {
  await expect.poll(async () => (await battle(page))?.phase, { timeout: 5000 }).toMatch(/task|end/)
  const state = await battle(page)
  if (state.phase === 'end') return state
  const value = correct ? state.answer : state.answer === 9 ? 8 : state.answer + 1
  const typed = String(value).length === String(state.answer).length ? value : state.answer - 1
  await page.keyboard.type(String(typed))
  await expect.poll(async () => (await battle(page)).phase, { timeout: 5000 }).not.toBe('task')
  return battle(page)
}

test('win against the Igel: coins, XP, the third win befriends it', async ({ page }) => {
  test.setTimeout(180_000)
  await toWild(page, start({ igel: 2 }))
  await shot(page, 'wild')
  await fight(page, 'igel')

  await expect.poll(async () => (await battle(page))?.phase).toBe('task')
  await shot(page, 'battle')
  let state = await battle(page)
  expect(state.limitMs).toBe(10_000)
  for (let i = 0; i < 20 && state.outcome !== 'win'; i++) state = await answer(page, true)
  expect(state.outcome).toBe('win')
  await page.waitForTimeout(1000)
  await shot(page, 'battle-win')

  const s = await save(page)
  expect(s.balance).toBe(10)
  expect(s.battle.wins.igel).toBe(3)
  expect(s.battle.befriended).toEqual(['igel'])
  expect(s.pets).toHaveLength(2)
  expect(s.pets[0].xp).toBeGreaterThan(20)
  expect(s.battle.times['einmaleins-2'].length).toBeGreaterThan(0)

  // Name the new friend, then back on the island
  await tapWorld(page, 90, 317) // WEITER
  await waitForScene(page, 'NameEntry')
  await tapWorld(page, 151, 324) // FERTIG keeps the suggested name
  await waitForScene(page, 'Wild')
  expect((await save(page)).pets[1]).toMatchObject({ species: 'igel', name: 'Igel' })

  // Back on the island: the beaten Igel has run off, walking around starts no new battle
  const wild = await page.evaluate(() => (window as any).__debug.wild())
  expect(wild.creatures.map((c: { species: string }) => c.species)).not.toContain('igel')
  await tapWorld(page, Math.round(wild.hero.x) + 20, Math.round(wild.hero.y))
  await page.waitForTimeout(2000)
  expect(await page.evaluate(() => (window as any).__debug.activeScene())).toBe('Wild')
})

test('gentle defeat: the pet naps, nothing is lost', async ({ page }) => {
  test.setTimeout(180_000)
  await toWild(page, start())
  await fight(page, 'fuchs')

  // One timeout first: the bar runs out and counts as a slow answer
  await expect.poll(async () => (await battle(page))?.phase).toBe('task')
  const limit = (await battle(page)).limitMs
  expect(limit).toBe(9000)
  await expect
    .poll(async () => (await battle(page)).petHp, { timeout: limit + 3000 })
    .toBeLessThan(20)

  let state = await battle(page)
  for (let i = 0; i < 20 && state.outcome !== 'lose'; i++) state = await answer(page, false)
  expect(state.outcome).toBe('lose')
  await page.waitForTimeout(1200)
  await shot(page, 'battle-lose')

  const s = await save(page)
  expect(s.balance).toBe(0)
  expect(s.battle.naps['hund-a']).toBeGreaterThan(Date.now())
  expect(s.battle.times['einmaleins-3']).toEqual([9000])

  await tapWorld(page, 90, 317) // WEITER
  await waitForScene(page, 'Wild')
  // Her only pet sleeps: tapping a creature starts no battle
  const wild = await page.evaluate(() => (window as any).__debug.wild())
  const igel = wild.creatures.find((x: { species: string }) => x.species === 'igel')
  await tapWorld(page, Math.round(igel.x), Math.round(igel.y) - 6)
  await page.waitForTimeout(6000)
  expect(await page.evaluate(() => (window as any).__debug.activeScene())).toBe('Wild')
})
