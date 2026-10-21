# Project Instructions for the Coding Agent

You are building a small **browser game that motivates my daughter (4th grade, Bavaria) to practise math**. The game is called **Mathe-Genie**. She walks through a cozy pixel village on an island in classic 2D monster-RPG style, practises math in huts and a theatre, lets her pets battle wild creatures in timed mental-math fights, earns coins and spends them on pets, dresses, haircuts and accessories for her character.

Read these files before writing code:

1. @docs/GAME_DESIGN.md – what the game is: loop, rewards, shop, math topics, learning logic. **Source of truth for features.**
2. @docs/STYLE_GUIDE.md – how everything looks and feels. **Binding for all visuals.**

## Goals

1. Real math practice at 4th-grade level (LehrplanPLUS Bayern) with correct tasks and helpful hints.
2. Cute and rewarding enough that she _wants_ to play: collecting, dressing up, pets, saving for a wish.
3. Healthy motivation: no punishments, no real money, natural stopping points.
4. Clean, readable code I can extend (new items, new topics) without touching game logic.

## Tech Stack

- **Vite + TypeScript** (strict mode)
- **Phaser 3** with `pixelArt: true`, `roundPixels: true`
- Native resolution **180 × 360, portrait on all devices** (`GAME_WIDTH`/`GAME_HEIGHT` in `src/main.ts`), scaled with `Phaser.Scale.FIT`, `autoCenter: CENTER_BOTH`. On the PC the tall frame sits centred; wasted space is fine.
- **Vitest** for unit tests of the math engine and economy
- No backend. Save progress in `localStorage` (wrapped in try/catch) with JSON export/import in the parent area.
- Fonts: "VT323" and "IBM Plex Mono" (Google Fonts), **bundled locally** via `@fontsource/*` so the game works offline.
- **PWA** (`vite-plugin-pwa`): installable on the iPhone home screen, fully offline after the first visit.

## Architecture

```
src/
├── main.ts                 # Phaser config, boot
├── palette.ts              # colour tokens from STYLE_GUIDE.md (only place with hex values)
├── data/
│   ├── items.ts            # all shop items (id, category, name, price, starCost, sprite ref)
│   ├── creatures.ts        # animal species: pets + wild forms (id, name, family → trait, area, topic, HP, sprite ref)
│   └── texts.ts            # all German UI texts and praise/hint phrases
├── world/                  # village + wild area maps (tile data), hut/door definitions
├── battle/                 # pure battle logic: HP, damage from response time, adaptive timer, XP, befriending, pet traits
├── math/
│   ├── topics.ts           # topic + level definitions
│   ├── generators/         # one task generator per topic (pure functions, seeded RNG)
│   ├── hints.ts            # method hints + worked solutions per task type
│   ├── adaptive.ts         # mastery score, level up/down, show composition (60/30/10)
│   ├── review.ts           # queue of wrongly answered tasks (spaced repetition)
│   └── einmaleins.ts       # 200 times-table facts, Leitner boxes, response times, "auswendig" status
├── state/
│   ├── save.ts             # load/save/versioned migration, export/import
│   └── economy.ts          # coin/star rewards, purchases, wish goal
├── art/                    # code-generated pixel sprites (character layers, pets, items, stage)
├── scenes/
│   ├── BootScene.ts
│   ├── TitleScene.ts
│   ├── CharacterCreateScene.ts
│   ├── NameEntryScene.ts   # on-screen keyboard for character + pet names
│   ├── VillageScene.ts     # hub, tap to walk, hut doors
│   ├── WildScene.ts        # wild area with wandering creatures
│   ├── BattleScene.ts      # timed battle screen
│   ├── ShelterScene.ts     # Tierheim
│   ├── LearnHutScene.ts    # topic/level picker + calm practice
│   ├── ShowScene.ts        # math gameplay on stage (Theater hut)
│   ├── EinmaleinsMenuScene.ts   # sub-modes + 10×10 progress grid
│   ├── EinmaleinsDrillScene.ts  # Üben, Blitzrunde, Turbo-Duell, Reihen-Meister
│   ├── ShowEndScene.ts
│   ├── ShopScene.ts
│   ├── WardrobeScene.ts
│   ├── AlbumScene.ts
│   └── ParentScene.ts
├── ui/                     # LabelPill, SpeechCard, Button, NumberPad, WrittenCalcGrid, CoinCounter, WishBar
└── audio/                  # WebAudio sound effects (soft, short)
```

Rules:

- **Math logic, battle logic and economy are pure TypeScript** with no Phaser imports, so they can be unit tested.
- Every task generator returns `{ question, answer, format, hintSteps, solutionSteps, topic, level }`.
- Generators must produce **only valid, age-appropriate tasks**: whole numbers, no negative results, division exact unless the level is "with remainder", numbers within the level's range.
- **Content is data:** adding a new dress, pet or wild creature must only need a new data entry (`items.ts`, `data/creatures.ts`) plus its sprite.
- Character sprites are **layered** (body → outfit → hair → accessory) so any combination works.

## Art

- Generate sprites in code (pixel maps or `Graphics` → `generateTexture`) using only the palette tokens. Keep each sprite in its own file in `src/art/` so I can later replace them with drawn PNG spritesheets.
- All characters, pets, creatures and items are **original designs**. Don't copy existing mascots, brand characters or franchise creatures. The monster-RPG look is genre inspiration only: no Pokémon names, creatures, sprites, sounds or UI copies.

## Child-Friendly Must-Haves

- Tap/click controls everywhere; keyboard number input as an extra on laptop.
- Touch targets ≥ 48 × 48 screen pixels; number pad buttons bigger.
- Wrong answers: soft sound + hint, never a harsh buzzer, never losing coins or items.
- No real-money purchases, no ads, no external links, no tracking, no network requests at runtime (fonts are bundled) – except the parent-enabled cloud sync to Firebase (`docs/GAME_DESIGN.md` §8). The game must work fully offline without it.
- No flashing or strobing effects. Mute button always visible.
- All UI text in German (see `docs/GAME_DESIGN.md` section 10).

## Working Mode

1. Follow the **build order in `docs/GAME_DESIGN.md` section 11**. Keep the game runnable after every step.
2. At every step marked ⏸ in the build order (1 village prototype, 6 first shop + Tierheim, 7 battles, 8 Einmaleins-Dojo), **stop and show me** before continuing.
3. Write unit tests for every task generator (e.g. 1 000 random tasks per level: answer correct, numbers in range, no negatives, divisions exact where required) and for the economy (rewards, purchases, wish progress).
4. Run `npm run build` and `npm test` after every step and fix all errors.
5. If something is unclear, pick the simplest child-friendly option and note it in `NOTES.md`.

## Definition of Done

- `npm run dev` starts the game; `npm run build` produces a static `dist/` I can host anywhere.
- Pixel-sharp at any window size, matching `docs/STYLE_GUIDE.md`.
- She can create and name a character, play a show, earn coins, buy and wear items, adopt and name a pet and set a wish – using only a finger or a mouse.
- The Einmaleins-Training tracks all 200 facts with response times; Blitzrunde, Turbo-Duell and Reihen-Meister work and the progress grid fills in.
- Speed modes measure response time accurately (use `performance.now()`), and input feels instant (no animation delays between facts).
- Progress survives a page reload and can be exported/imported.
- All tests pass.

## Workspace Setup

- Devices: Windows PC (mouse + keyboard) and iPhone (touch, Safari, installed as PWA from the home screen). Respect iPhone safe areas.
- Commands: `npm run dev` (also reachable in the home Wi-Fi for the iPhone), `npm test`, `npm run typecheck`, `npm run lint`, `npm run build`, `npm run e2e` (Playwright, projects `pc` and `iphone`).
- For visual checks, take Playwright screenshots on both projects and look at them before reporting a step as done (skill `playtest`).
- Hosting: GitHub Pages via `.github/workflows/deploy.yml` (runs tests + build on every push to `main`). Vite `base` is `./`.
- Git: **one commit per finished build step**, only when `npm test`, `npm run build` and `npm run e2e` are green. Every push to `main` deploys to GitHub Pages.
  - **Local session** (VS Code on the PC): commit directly on `main`.
  - **Web session** (claude.ai/code): work on a branch and open **one pull request per build step**; the user reviews and merges. Include screenshots and test results in the PR description.
- Commit author email is the GitHub noreply address; never commit with a private email (pushes would be rejected).
- Setup and deployment details for humans: `docs/SETUP_GITHUB.md`.
- Topic priority for step 3: see `docs/GAME_DESIGN.md` §11. Sachaufgaben: money (€/ct) only for now.
- Open questions and decisions go in `NOTES.md`.
