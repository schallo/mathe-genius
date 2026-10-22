# Notes – Open Questions & Decisions

## Decisions (2026-10-21)

- **Name:** **Mathe-Genie** ("Rechnen mit Freunden"); earlier names: Lenis Mathe-Insel, Zahlenhausen, working title Mathe-Bühne. The localStorage key stays `mathe-buehne`. Island theme: island village with beach, jetty and palms; wild areas are neighbouring islands reached via the jetty.
- **Portrait on all devices**, native resolution **180 × 360**. On the PC the tall frame sits centred.
- **Look:** 2D pixel, classic handheld monster-RPG (top-down village + battle screen), cozy palette from the style guide. Genre inspiration only, all content original.
- **Village hub** with huts: Theater (shows), learning huts per math field, Laden, Mein Haus (Garderobe), Tierheim, Bibliothek; path to the wild area. The stage/show concept lives on inside the Theater hut.
- **Movement:** tap to walk; arrow keys/WASD on the PC.
- **Battles:** her **pets** fight. Topics: Einmaleins + Division, Kopfrechnen Plus/Minus. **Adaptive timer** (≈ 1.5 × median response time, 3–12 s). **Gentle defeat:** pet naps, nothing lost.
- **Pets:** starter pet (choice of 3) at character creation, adopt more in the Tierheim, befriend a wild species after defeating it 3 times (deterministic, no random chance).
- **Character height:** about 22 px.
- **Pets:** she loves cats and dogs (most variety there). Everyday pets (hamster, mouse, turtle, …) are bought; wildlife (lion, …), dinosaurs (T-Rex, Brachiosaurus) and fantasy animals (unicorn) are befriended in later wild areas. Roster in `GAME_DESIGN.md` §4. Traits by **family**: Katzen & Hunde none, Kleintiere +time, Wildtiere Rechentipp, Urzeittiere stronger hits, Fabeltiere Joker (§4 "Pet traits").
- **Math focus:** all main topics; priority order in `GAME_DESIGN.md` §11. Sachaufgaben: money (€/ct) for now.
- **Offline PWA**, fonts bundled via `@fontsource`; no runtime network requests except the optional cloud sync.
- **Cloud sync** (decided 2026-10-21): Firebase Auth (**email + password** of the parent, once per device – Google login fails in the iPhone home-screen app) + Firestore, built in step 5 together with the save system. Project `mathe-genie` (Firestore europe-west3, production rules: `saves/{uid}` only for that uid), no Analytics. One parent user created in the console; the game only signs in, no sign-up. API key restricted to `https://schallo.github.io/*` and `http://localhost:5173/*`, so the dev server is pinned to port 5173 (`strictPort`). **Sync does not work via the LAN address** (`http://192.168.x.x:5173` from the iPhone): the key and the authorized domains don't allow it. Test sync on the iPhone with the GitHub Pages version.
- **Hosting:** GitHub Pages (`.github/workflows/deploy.yml`). **Git:** one commit per finished build step.
- The first React prototype was removed. Its tested generators in `src/math/aufgaben.ts` are ported into `src/math/generators/` in step 3, then the old file is deleted.

## My assumptions (change if you disagree)

- Defeated pets nap for 2 minutes or until she finishes a calm practice round – this nudges towards learning huts without punishing.
- Wild creatures wander visibly; no random encounters in tall grass.
- Einmaleins-Dojo keeps Blitzrunde and Turbo-Duell even though battles also drill the Einmaleins. Revisit after step 8 if it feels redundant.
- Added world colours (grass, path, stone) to the style guide §9a – the original palette had no greens.

## Open questions

- GitHub repo: needs to be created and pushed by you (the `gh` CLI isn't installed). Then enable _Settings → Pages → Source: GitHub Actions_.

## Math engine assumptions (step 3) – please check with Leni's school

- **Schriftliche Subtraktion:** worked solutions use the _Abziehverfahren mit Entbündeln_ ("hol dir 1 von der nächsten Stelle"). If her class uses the _Ergänzungsverfahren_, only `writtenSub` in `src/math/hints.ts` needs to change.
- **Schriftliche Multiplikation with a two-digit factor:** partial products per place (254 · 20 + 254 · 3), then added.
- **Rounding:** half up (…5 rounds up), as in German primary schools.
- **Halbschriftlich division:** splitting into parts the divisor fits into (846 : 3 → 600 + 240 + 6).
- **Money:** whole cents/euros only; Kommaschreibweise appears in questions (4,50 €), answers are typed as ct or €.
- Levels 1–5 per topic and their number ranges are in `src/math/topics.ts`; each level has a short German title for the level picker.

## Technical notes

- **Crisp rendering** (`src/display.ts`): the canvas is rendered at an integer multiple of 180 × 360 so that one canvas pixel = one device pixel (×6 on the iPhone home-screen app, ×2 on a 1080p PC). Scenes extend `PixelScene`, which zooms the camera by that factor, so all game code works in art pixels and text is sharp. After a window resize the frame is refit (slightly less crisp until reload).
- Movement uses the real frame time (`game.loop.rawDelta`), not Phaser's smoothed delta, so walking speed stays right on slow frames.
- **Starting look** is modelled on her (from a photo, not stored in the repo): fair skin (`skin1`), ginger hair (`hair-ginger`, new palette colour) pulled back into a ponytail, mint dress, pink bow.

## Next tasks (as of 2026-10-22)

Done: steps 1–7 incl. the live Firebase connection (config in `src/firebaseConfig.ts`). Live: https://schallo.github.io/mathe-genius/ (up to step 6 until the step 7 push).

- **Temporary test button:** the shop shows a gold `+100` button only in `npm run dev` or with `?test` in the URL (`src/testMode.ts`). Remove it once shopping is tested.

1. ~~Firebase setup~~ done. **Test sync (you):** sign in in the parent area on the PC and on the iPhone (GitHub Pages version), earn coins on one, check they arrive on the other.
2. ~~Push step 5~~ done.
3. **Playtest the shows with Leni** (number pad, hints, coins): too easy/hard? Which topic should be the focus (currently Einmaleins level 2)?
4. **Check with school** the open assumptions in "Math engine assumptions" below (subtraction method etc.).
5. ~~Step 6~~ done – ⏸ **checkpoint: please test the shop, Mein Haus and Tierheim** (locally with `npm run dev`, or online with `?test` after the push).
6. ~~Step 7 – Battles~~ done – ⏸ **checkpoint: please test the jetty → Blumenwiese, battles against Igel, Eichhörnchen and Fuchs, a defeat (nap) and befriending (3 wins against one species).**
7. **Step 8 – Einmaleins-Dojo:** 200 facts, Leitner boxes, Üben, Blitzrunde, 10 × 10 grid, Turbo-Duell, Reihen-Meister. ⏸ checkpoint.
8. **Step 9 – Learning huts** (Rechenwerkstatt with the written calculation grid, Zahlenturm, Marktstand); written tasks join the shows.
9. **Step 10 – Adaptive difficulty**, mistakes coming back, stars per level.
10. **Step 11 – Album, daily calendar, full parent area** (settings, progress overview, bonus coins, shows per day).
11. **Step 12 – More areas and animals**, 60–80 items.

Smaller follow-ups:

- Village: parent mailbox (currently only the lock on the title screen).
- iPhone: real-device test of the home-screen app (sizes, sounds, safe areas).
- Sound: check the "−" glyph and sounds on the real iPhone.

## Battle decisions (step 7, 2026-10-22)

- **Wild island = hide and seek** (her wish, 2026-10-22): the Blumenwiese is 300 × 600 px and scrolls both ways. Trees, palms, rocks and a pond block the way (A* on a 6 px grid). The three animals hide in 3 of 12 bushes/tall-grass patches, picked at random on every boat trip; a hiding place with an animal in it rustles every ~2.6 s, and coming within 22 px makes the animal hop out. Who was found is kept while she battles; a new boat trip hides everybody again. A beaten animal runs off for a minute and then hides again. Layout in `src/world/wild.ts` (tests check that every hiding place is reachable and nothing overlaps).
- **Blumenwiese:** Igel (Einmaleins L2, Lv2, 10 coins), Eichhörnchen (Kopfrechnen L1, Lv3, 15 coins), Fuchs (Einmaleins L3 = division, Lv5, 25 coins, 10 % less time). Stats in `src/data/creatures.ts`.
- **Numbers:** pet HP 20 + 3/level, attack 4 + level. A hit does 0.7–1.0 × attack depending on speed; answers in the first 40 % of the time are a Volltreffer (1.6 ×). A new pet needs about 6–8 tasks against the Igel and survives 4–5 mistakes. XP: 3 per right answer (4 for a Volltreffer) + 10 + 2 × creature level for a win; level 2 at 20 XP, 3 at 60, 4 at 120 (`xpForLevel`).
- **Adaptive timer:** last 10 times per topic and level; until there are 3 times it is 10 s. A timeout counts as a time of the full limit, so the timer gets longer again when she is too slow. Times taken after a Rechentipp are not counted; trait bonuses are never counted.
- **Befriending:** once per species. On the third win the animal joins at once (named after its species) and she names it right after – so a reload during naming loses nothing.
- **Defeat:** the pet naps for 2 minutes or until a show ends; on the wild island another awake pet comes along automatically ("Bello kommt jetzt mit!"). With all pets asleep, creatures can't be challenged (friendly message). Leaving a battle with the house button is free and keeps the XP of right answers.
- **Wrong answers in battles** are not yet queued for review – the review queue comes with step 10.
- **Area unlock** by pet level (`Area.unlockLevel`) is in the data; with only the Blumenwiese there is nothing to unlock yet (step 12).
- Pet XP, wins and befriended animals merge by maximum/union between devices; naps and answer times take the newer save.

## Playtest feedback (2026-10-21)

- Step 1: she recognises herself, understands tap-to-walk on her own, opened the only open hut first, picks the **puppy** as her starter.

## Deviations from the style guide

- Name keyboard keys are 15 × 22 art px (≈ 30 × 44 screen px on the iPhone), below the 48 × 48 guideline: 11 keys per QWERTZ row don't fit otherwise in 180 px. Word keys (Zufall, Leertaste, Fertig) are wide.
