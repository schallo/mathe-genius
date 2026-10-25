import { execSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { VitePWA } from 'vite-plugin-pwa'
import { defineConfig } from 'vitest/config'

// Version label in the bottom-right corner of every screen: package.json version + commit
const version = JSON.parse(readFileSync('package.json', 'utf-8')).version as string
let commit = 'dev'
try {
  commit = execSync('git rev-parse --short HEAD').toString().trim()
} catch {
  // No git (e.g. a downloaded zip): keep "dev"
}

export default defineConfig({
  // Relative paths so the build works on GitHub Pages under any repo name
  base: './',
  define: {
    __APP_VERSION__: JSON.stringify(version),
    __APP_COMMIT__: JSON.stringify(commit),
  },
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      workbox: { globPatterns: ['**/*.{js,css,html,svg,png,woff2}'] },
      manifest: {
        name: 'Mathe-Genie',
        short_name: 'Mathe-Genie',
        lang: 'de',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#ecebe8',
        theme_color: '#8aa6c8',
        icons: [{ src: 'favicon.svg', sizes: 'any', type: 'image/svg+xml' }],
      },
    }),
  ],
  build: { chunkSizeWarningLimit: 1600 }, // Phaser alone is ~1.2 MB
  server: { host: true, port: 5173, strictPort: true },
  test: { include: ['src/**/*.test.ts'] },
})
