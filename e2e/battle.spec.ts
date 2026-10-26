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

const battle = (page: Page) => page.evaluate(() => (window as any).__debug.battle())

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

/** Title → village, then straight onto the wild island (the boat trip is tested in the village). */
async function toWild(page: Page, seed: object) {
  await seedSave(page, seed)
  await toVillage(page)
  await openScene(page, 'Wild', { from: 'steg' })
}

const wildTap = (page: Page, x: number, y: number) =>
  page.evaluate(([x, y]) => (window as any).__debug.wildTap(x, y), [x, y])

const creature = async (page: Page, species: string) => {
  // Walking into an animal that already hopped out starts a battle on the way: leave it
  // with the house button (free) and search on
  if ((await activeScene(page)) === 'Battle') {
    await tapWorld(page, 32, 10)
    await waitForScene(page, 'Wild')
  }
  const wild = await page.evaluate(() => (window as any).__debug.wild())
  return wild.creatures.find((c: { species: string }) => c.species === species)
}

/** Searches the creature's hiding place until it hops out, then taps it. */
async function find(page: Page, species: string) {
  // Finding another animal on the way stops her, so tap the hiding place again
  for (let i = 0; i < 12 && !(await creature(page, species)).found; i++) {
    const c = await creature(page, species)
    await wildTap(page, c.spot.x, c.spot.y - 4)
    await page.waitForTimeout(1200)
  }
  expect((await creature(page, species)).found).toBe(true)
  await page.waitForTimeout(300)
}

async function fight(page: Page, species: string) {
  await find(page, species)
  const c = await creature(page, species)
  await wildTap(page, Math.round(c.x), Math.round(c.y) - 6)
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
  await find(page, 'igel')
  await shot(page, 'wild-found')
  const oldSpot = (await creature(page, 'igel')).spot
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

  // Back on the island: the beaten Igel ran off and hid again somewhere else, far from her;
  // walking around starts no new battle
  const wild = await page.evaluate(() => (window as any).__debug.wild())
  const igel = wild.creatures.find((c: { species: string }) => c.species === 'igel')
  expect(igel.found).toBe(false)
  expect(igel.spot).not.toEqual(oldSpot)
  expect(Math.hypot(igel.spot.x - wild.hero.x, igel.spot.y - wild.hero.y)).toBeGreaterThan(60)
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
  await find(page, 'igel')
  const igel = await creature(page, 'igel')
  await wildTap(page, Math.round(igel.x), Math.round(igel.y) - 6)
  await page.waitForTimeout(2500)
  expect(await page.evaluate(() => (window as any).__debug.activeScene())).toBe('Wild')
})
