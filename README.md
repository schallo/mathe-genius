# Mathe-Genie – Rechnen mit Freunden

A small, cozy pixel-art browser game that makes math practice fun for a 4th grader
(Bavarian curriculum, LehrplanPLUS). She walks through an island village, solves tasks
in huts and a little theatre, earns coins, and spends them on dresses, haircuts,
accessories and pets. Her pets battle wild creatures in timed mental-math fights.

**Play:** https://schallo.github.io/mathe-genius/ (works offline once loaded; can be
installed to the iPhone home screen)

- All UI text is German, portrait format (180 × 360 px, pixel-perfect scaling)
- Healthy motivation: no real money, no ads, no tracking, no punishments – wrong answers
  get a hint, coins and items are never lost
- Progress lives in `localStorage`; JSON export/import and an optional cloud sync
  (Firebase, parent login) are in the parent area

## Run it locally

Requires Node.js 20+.

```sh
npm install
npm run dev        # http://localhost:5173 (also reachable from other devices in the Wi-Fi)
```

| Command             | What it does                                       |
| ------------------- | -------------------------------------------------- |
| `npm run dev`       | Dev server on port 5173                            |
| `npm test`          | Unit tests (math engine, economy, save, battles)   |
| `npm run typecheck` | TypeScript strict check                            |
| `npm run lint`      | oxlint                                             |
| `npm run e2e`       | Playwright tests on a PC and an iPhone viewport    |
| `npm run build`     | Static build in `dist/` (host anywhere, base `./`) |

Add `?test` to the URL to show a temporary +100 coins button in the shop.

## Tech

Vite · TypeScript (strict) · Phaser 3 · Vitest · Playwright · vite-plugin-pwa ·
fonts VT323 and IBM Plex Mono bundled via `@fontsource`. All sprites are generated in
code from pixel maps (`src/art/`), using only the palette in `src/palette.ts`.

```
src/
├── data/      shop items, animals (pets + wild creatures), German texts
├── math/      task generators per topic and level, hints, show composition
├── battle/    pure battle logic: damage, adaptive timer, XP, befriending
├── state/     save format + migrations, economy, shop, cloud sync
├── world/     village and wild-island layouts
├── art/       code-generated pixel sprites
├── scenes/    Phaser scenes (village, theatre show, shop, Tierheim, battles …)
└── ui/        number pad, keys, label pills, speech card, HUD
```

Math, battle and economy logic are plain TypeScript without Phaser, so they are unit
tested (every generator is checked on thousands of random tasks per level).

**Adding content is data:** a new dress, haircut or pet is an entry in
`src/data/items.ts` or `src/data/creatures.ts` plus its sprite.

## Docs

- [docs/GAME_DESIGN.md](docs/GAME_DESIGN.md) – features, rewards, math topics, build order
- [docs/STYLE_GUIDE.md](docs/STYLE_GUIDE.md) – palette, pixel rules, UI elements
- [docs/SETUP_GITHUB.md](docs/SETUP_GITHUB.md) – GitHub Pages deployment
- [docs/SETUP_FIREBASE.md](docs/SETUP_FIREBASE.md) – optional cloud sync
- [NOTES.md](NOTES.md) – decisions, open questions, next tasks

Every push to `main` runs the tests and deploys to GitHub Pages
(`.github/workflows/deploy.yml`).

## Note on the Firebase key

`src/firebaseConfig.ts` contains a Firebase web API key. It is public by design (it
ships in every Firebase web app); the data is protected by Firestore security rules,
the parent's sign-in and an HTTP-referrer restriction on the key.

## Originality

All characters, animals, sprites and sounds are original. The village and battle
screens are inspired by classic 2D monster-RPGs as a genre – no names, creatures,
sprites, sounds or UI from any existing franchise are used.
