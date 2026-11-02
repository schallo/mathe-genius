import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: 'e2e',
  // Test files run side by side; the emulated iPhone (WebKit, software rendering) is the
  // slow part, so keep a few cores free for it
  workers: 4,
  timeout: 120_000,
  retries: 1,
  use: { baseURL: 'http://localhost:5173', locale: 'de-DE' },
  projects: [
    {
      name: 'pc',
      use: {
        ...devices['Desktop Chrome'],
        // WebGL on the graphics card instead of the software renderer (falls back without one)
        launchOptions: { args: ['--use-angle=d3d11', '--enable-gpu', '--ignore-gpu-blocklist'] },
      },
    },
    { name: 'iphone', use: { ...devices['iPhone 15'] } },
  ],
  webServer: { command: 'npm run dev', url: 'http://localhost:5173', reuseExistingServer: true },
})
