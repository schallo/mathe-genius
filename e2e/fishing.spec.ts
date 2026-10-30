import { expect, test, type Page } from '@playwright/test'
import { readSave as save, seedSave, shot, toVillage, waitForScene } from './helpers.ts'

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
  coins: { earned: { test: 100 }, spent: {} },
  owned: [],
  wish: null,
  settings: { muted: true },
}

type Fishing = {
  phase: string
  pull: string
  power: number
  holding: boolean
  reward: string
  goldiJumping: boolean
  goldiJumps: number
}
const fishing = (page: Page): Promise<Fishing | undefined> =>
  page.evaluate(() => (window as any).__debug.fishing())

const pond = (page: Page) => page.evaluate(() => (window as any).__debug.villageTap(36, 56))

/** Cast, hook and reel in a fish, resting whenever the fish pulls hard. */
async function reelOnce(page: Page, shots: boolean): Promise<string> {
  await expect.poll(async () => (await fishing(page))?.phase).toBe('ready')
  await page.keyboard.down('Space')
  await page.waitForTimeout(200)
  await page.keyboard.up('Space')
  await expect.poll(async () => (await fishing(page))?.phase).toBe('waiting')
  if (shots) await shot(page, 'fishing-waiting')
  // Hook the fish. Phaser reads the key on its next frame, so wait until it has; a bite
  // missed on a busy machine just means waiting for the next one
  for (;;) {
    await expect.poll(async () => (await fishing(page))?.phase, { timeout: 15_000 }).toBe('bite')
    if (shots) await shot(page, 'fishing-bite')
    await page.keyboard.down('Space')
    await expect.poll(async () => (await fishing(page))?.phase).not.toBe('bite')
    if ((await fishing(page))!.phase === 'reeling') break
    await page.keyboard.up('Space')
  }
  let holding = true
  let pictured = false
  for (let i = 0; i < 2000; i++) {
    const s = (await fishing(page))!
    if (s.phase !== 'reeling') break
    if (shots && !pictured && s.pull === 'strong') {
      await shot(page, 'fishing-reeling')
      pictured = true
    }
    // Rest early: on a busy machine each look at the game arrives a little late
    const hold = s.pull !== 'strong' && s.power > 40
    if (hold !== holding) {
      await (hold ? page.keyboard.down('Space') : page.keyboard.up('Space'))
      holding = hold
    }
  }
  if (holding) await page.keyboard.up('Space')
  await expect
    .poll(async () => ['caught', 'lost'].includes((await fishing(page))!.phase))
    .toBe(true)
  return (await fishing(page))!.phase
}

/**
 * Catches one fish. If one gets away (allowed: nothing is lost), cast again like she
 * would – a lost fish doesn't count as a catch, so the rewards stay the same.
 */
async function catchFish(page: Page, shots = false) {
  for (let attempt = 0; attempt < 5; attempt++) {
    if ((await reelOnce(page, shots && attempt === 0)) === 'caught') return
    await page.keyboard.press('Space') // Nochmal
  }
  throw new Error('no fish caught in 5 tries')
}

test('without an Angel the pond only gives a hint', async ({ page }) => {
  test.setTimeout(90_000)
  await seedSave(page, START)
  await toVillage(page)
  await pond(page)
  await page.waitForTimeout(6000)
  await shot(page, 'fishing-no-rod')
  expect(await page.evaluate(() => (window as any).__debug.activeScene())).toBe('Village')
})

test('fishing at the pond: Goldi jumps until she bites, then a star per fish', async ({ page }) => {
  test.setTimeout(150_000)
  // 49 fish caught before: the 50th is Goldi for sure (growing chance, see state/fishing.ts)
  await seedSave(page, { ...START, owned: ['angel'], fishing: { catches: 49, days: {} } })
  await toVillage(page)
  await pond(page)
  await waitForScene(page, 'Fishing', 30_000)
  await shot(page, 'fishing-start')
  // Count the jumps: a single jump is in the air for only ~0.2 s at test speed, so polling
  // for the sprite alone can miss it on a busy machine
  await expect
    .poll(async () => (await fishing(page))?.goldiJumps, { timeout: 15_000 })
    .toBeGreaterThan(0)
  // Picture of a jump if we catch one in the air (best effort)
  await expect
    .poll(async () => (await fishing(page))?.goldiJumping, { timeout: 12_000 })
    .toBe(true)
    .then(() => shot(page, 'fishing-goldi-jumps'))
    .catch(() => {})

  await catchFish(page, true)
  expect((await fishing(page))!.reward).toBe('goldi')
  await page.waitForTimeout(500)
  await shot(page, 'fishing-goldi')
  let s = await save(page)
  expect(s.pets.map((p: { name: string }) => p.name)).toEqual(['Bello', 'Goldi'])
  expect(s.stars).toBe(0)

  await page.keyboard.press('Space') // Nochmal
  await catchFish(page)
  expect((await fishing(page))!.reward).toBe('star')
  await page.waitForTimeout(300)
  await shot(page, 'fishing-star')
  s = await save(page)
  expect(s.stars).toBe(1)
  expect(s.fishing.catches).toBe(51)
  // No coins from fishing
  expect(s.balance).toBe(100)
})
