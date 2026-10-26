import { expect, test, type Page } from '@playwright/test'
import { openScene, seedSave, shot, tapWorld, toVillage, waitForScene } from './helpers.ts'

function start(xp: number) {
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
    pets: [{ id: 'hund-a', species: 'hund', name: 'Bello', xp }],
    activePetId: 'hund-a',
    coins: { earned: {}, spent: {} },
    owned: [],
    wish: null,
    settings: { muted: true },
  }
}

const wild = (page: Page) => page.evaluate(() => (window as any).__debug.wild())

// HarborScene: island cards 168 × 56 from y 50, 60 apart; "Los!" key at the right
const goKey = (i: number) => [141, 50 + i * 60 + 33] as const

test('the jetty leads to the harbour; a new pet only reaches the Blumenwiese', async ({ page }) => {
  await seedSave(page, start(0))
  await toVillage(page)
  await page.evaluate(() => (window as any).__debug.villageTap(90, 6)) // up the path to the jetty
  await waitForScene(page, 'Harbor', 30_000)
  await shot(page, 'harbor-locked')
  await tapWorld(page, 90, 50 + 60 + 20) // Flüsterwald: still closed
  await page.waitForTimeout(300)
  expect(await page.evaluate(() => (window as any).__debug.activeScene())).toBe('Harbor')
  await tapWorld(page, ...goKey(0)) // Blumenwiese
  await waitForScene(page, 'Wild')
  expect((await wild(page)).area).toBe('blumenwiese')
})

test('a level 9 pet sails to every island', async ({ page }) => {
  test.setTimeout(120_000)
  await seedSave(page, start(720)) // level 9
  await toVillage(page)
  await openScene(page, 'Harbor', {})
  await shot(page, 'harbor-open')
  await tapWorld(page, ...goKey(1)) // Flüsterwald
  await waitForScene(page, 'Wild')
  expect((await wild(page)).area).toBe('fluesterwald')
  expect((await wild(page)).creatures.map((c: { species: string }) => c.species).sort()).toEqual([
    'eule',
    'reh',
    'waschbaer',
  ])
  for (const area of ['fluesterwald', 'sonnensavanne', 'urzeittal', 'wolkenberg']) {
    await openScene(page, 'Wild', { area })
    expect((await wild(page)).area).toBe(area)
    await page.waitForTimeout(400)
    await shot(page, `island-${area}`)
  }
})

test('the new animals in battle (look check)', async ({ page }) => {
  test.setTimeout(120_000)
  await seedSave(page, start(720))
  await toVillage(page)
  for (const foe of [
    'eule',
    'waschbaer',
    'reh',
    'zebra',
    'giraffe',
    'elefant',
    'loewe',
    'flugsaurier',
    'triceratops',
    'brachiosaurus',
    'trex',
    'pegasus',
    'einhorn',
    'drache',
  ]) {
    await openScene(page, 'Battle', { foe })
    await page.waitForTimeout(500)
    await shot(page, `battle-${foe}`)
  }
})
