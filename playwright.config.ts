import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: 'e2e',
  // The emulated iPhone renders a 900 × 1800 canvas in software and gets very slow
  // when tests run in parallel: run one at a time, with generous time limits
  workers: 1,
  timeout: 120_000,
  retries: 1,
  use: { baseURL: 'http://localhost:5173', locale: 'de-DE' },
  projects: [
    { name: 'pc', use: { ...devices['Desktop Chrome'] } },
    { name: 'iphone', use: { ...devices['iPhone 15'] } },
  ],
  webServer: { command: 'npm run dev', url: 'http://localhost:5173', reuseExistingServer: true },
})
