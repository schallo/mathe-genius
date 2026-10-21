import { VitePWA } from 'vite-plugin-pwa'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  // Relative paths so the build works on GitHub Pages under any repo name
  base: './',
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      workbox: { globPatterns: ['**/*.{js,css,html,svg,png,woff2}'] },
      manifest: {
        name: 'Zahlenhausen',
        short_name: 'Zahlenhausen',
        lang: 'de',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#ecebe8',
        theme_color: '#3f3159',
        icons: [{ src: 'favicon.svg', sizes: 'any', type: 'image/svg+xml' }],
      },
    }),
  ],
  build: { chunkSizeWarningLimit: 1600 }, // Phaser alone is ~1.2 MB
  server: { host: true },
  test: { include: ['src/**/*.test.ts'] },
})
