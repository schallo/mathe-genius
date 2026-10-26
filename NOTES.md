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
- **Hut signs** (2026-10-22): the 5 px icons were too small to remember. Four prototypes were compared (name board, big icon badge, badge + name, themed huts); the user chose a **big name board on the roof** (`addHutSign` in `src/art/hut.ts`, names in `Hut.sign`, max. 10 letters). Tapping the board enters the hut.
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

## Next tasks (as of 2026-10-26)

Done: steps 1–8, v0.8.1 (no +100 button, no door plates, faster e2e tests). Live: https://schallo.github.io/mathe-genius/. Firebase sync, the iPhone home-screen app and the step 6–8 checkpoints are tested.

1. ~~Step 9 – Learning huts~~ done (v0.9.0).
2. ~~Theater with a weekly hut~~ done (v0.9.1).
3. **Step 10 – Adaptive difficulty**, mistakes coming back, stars per level (spending stars).
4. **Step 11 – Album, daily calendar, full parent area** (settings incl. "auswendig" time, progress overview, bonus coins, shows per day).
5. **Step 12 – More areas and animals**, 60–80 items.
6. ~~Coin icon~~ done (v0.9.2): round 9 × 9 coin with rim, shading and shine.
7. ~~Village plants~~ done (v0.9.2): palms along both shores, then leafy trees, firs, bushes and flower bushes at random (fixed seed, `placePlants` in `src/world/village.ts`), never on huts, name boards, paths or the pond; only trunks/bases block walking.
8. **Avatar options** (wish 2026-10-26): a male version of the avatar (boy body/face, boy hair styles), more clothes, hair styles and accessories, and multi-colour outfits (e.g. trousers and shirt in different colours – outfit layer with separate top/bottom colours).
9. **Check with school** the open assumptions in "Math engine assumptions" below (subtraction method etc.).

Smaller follow-ups:

- Village: parent mailbox (currently only the lock on the title screen).
- ~~iPhone: real-device test of the home-screen app~~ done 2026-10-25: screens work on PC and iPhone.
- Sound: check the "−" glyph and sounds on the real iPhone.

## Theater with a weekly hut (v0.9.1, 2026-10-26)

- Replaces the 60/30/10 mix (GAME_DESIGN §6 updated). The week counts from Monday (local time) and the rotation runs on across new year: Mal-Dojo → Teil-Dojo → Zahlenturm → Rechenwerkstatt → Marktstand (`weekHut` in `src/math/show.ts`).
- **One level harder:** for the huts every topic runs one level above her level (the fixed defaults until step 10: Kopfrechnen, Zahlenraum, Halbschriftlich, the four written topics and Geld at level 1 → the Theater uses level 2), topics of the hut take turns. The dojos have no levels, so their harder form is: **Mal-Dojo week** = 5 plain facts + 5 missing factors (`? · 8 = 56`), **Teil-Dojo week** = division with remainder (Einmaleins level 5).
- **Double coins for every task** (10 / 6 / 2), the five-in-a-row bonus (10) and the show bonus (20). The old single "Extra" star task is gone.
- A label on the stage edge: "Diese Woche: Mal-Dojo · Münzen ×2"; the end card says "Doppelte Münzen!".
- Theater answers in the Mal-/Teil-Dojo weeks are not counted into the dojo fact tracking (no timer in shows).

## Learning huts and written calculation (step 9, 2026-10-26)

- **Rechenwerkstatt** (Halbschriftlich, Schriftlich plus/minus/mal/geteilt), **Zahlenturm** (Kopfrechnen, Zahlenraum) and **Marktstand** (Geld) are open. Each hut: pick a topic and a level 1–5 (the level's title is shown), then 10 calm tasks in the same flow as a show (no timer, hints, worked solution, 5/3/1 coins, streak bonus, +10 for the round). The last pick per hut is remembered (`save.learn`). After the round: "Nochmal" or "Zurück" to the picker. A finished round wakes napping pets, like a show.
- **Written grid** (`src/math/written.ts` → `src/ui/WrittenCalcGrid.ts`): squared paper, squares 11–16 px depending on the task, every digit checked at once.
  - Plus: result from the right; a carry square (small digit above the line) comes right after the digit that makes it; the last carry is written as the front digit.
  - Minus (Abziehverfahren mit Entbündeln, still to confirm with the school): only the result digits; the hint names the Entbündeln ("Einer: 14 − 8 (entbündelt)").
  - Mal with a one-digit factor: result under the task, carries like plus. With a two-digit factor: tens row first (under the tens digit), then the ones row, carries in her head, then the sum with carry squares.
  - Geteilt: she types the quotient digits from the left; after each one the grid writes the product and the rest with the next digit brought down (and its rule), so the method stays visible without typing every line. With remainder levels she types the last rest herself.
  - First wrong digit in a square: a hint for that square (never the digit). Second wrong digit: the digit appears in accent-blue and she types it. Coins: no mistake 5, hints only 3, a shown digit 1.
- **Written tasks join the Theater shows** (revision slots, level 1 for now; adaptive levels come with step 10).
- Only the Bibliothek is still a construction site.

## Faster end-to-end tests (2026-10-26)

- The tests open the game with `?speed=4`: all game time (Phaser timers and tweens, walking, battle timers, Einmaleins speed modes) runs 4× faster through one clock (`src/clock.ts`). Only active with that URL parameter, never for Leni. Real-world times (pet naps) stay real.
- Tests jump straight into a hut with `__debug.start(scene, data)` (helper `openScene` in `e2e/helpers.ts`) instead of walking through the village.
- `smoke.spec.ts` stays at real speed and still walks into the Theater; `dojo.spec.ts` checks that game time runs 1× without and 4× with the parameter.
- Full run: 10.9 min → 5.0 min.

## Version label (2026-10-25)

- Every screen shows `v0.8.0 · <commit>` in a small pill in the bottom-right corner (HTML over the canvas, `src/version.ts`, values from `vite.config.ts`). The commit hash shows whether the iPhone app already has the newest deploy. Minor version = build step, patch = fixes in between.

## Einmaleins-Dojo decisions (step 8, 2026-10-23)

- **Two huts instead of one** (your wish): the **Mal-Dojo** (·) and the **Teil-Dojo** (:) stand where the Einmaleins-Dojo was. Both have the same four sub-modes, each with only its own operation, and each has its own 10 × 10 grid, Blitz record, Turbo ghost and medal shelf. So the Blitzrunde is not "· and : mixed" as in GAME_DESIGN §6a, and the "second grid or toggle" became the second hut. The Rechenwerkstatt construction site moved to a new hut row at the bottom; the island is 70 px taller (beach, spawn and sea moved down with it).
- **Facts:** a cell is row r (Reihe = second factor or divisor) × k: `k · r` and `k·r : r`. 7 · 8 and 8 · 7 are separate facts (100 multiplications as in the design). Row 7 = 1 · 7 … 10 · 7 and 7 : 7 … 70 : 7.
- **Auswendig** = 3 correct answers in a row, each faster than the threshold (3 s, `settings.knownMs`; the slider in the parent area comes with step 11). A slow or wrong answer resets the streak. **Gold stays gold** once reached, so the grid never loses cells; a later mistake only puts the fact back into Leitner box 1, so it comes up more often. Practised (sky) = answered at least once.
- **Leitner:** fast and correct → one box up; correct but slow → stays; wrong → box 1. Facts are drawn with weights 16/8/4/2/1 for boxes 1–5 (never seen: 12), never the last 3 again.
- **Üben:** row = its 10 facts shuffled; Mix = 10 weak facts. OK confirms (no timer, no auto-confirm). A wrong answer shows the fact with a helper (e.g. 7 · 8 = 7 · 10 − 7 · 2), she types the result once (not counted), and the fact comes back 3 facts later. 2 coins for right the first time, 1 coin when a missed fact comes back.
- **Blitzrunde:** 60 s, 1 coin per right answer, +10 for a new personal best (the first round counts as one). Missed facts come back 3 facts later.
- **Turbo-Duell:** 20 facts must be solved; a missed one is shown for 1 s and added at the end, so mistakes only cost time. The first finished duel sets the ghost (+10 coins); beating the ghost gives +10 coins and **1 star**. Stars are now counted in the save (per device, like coins); spending them comes with step 10.
- **Reihen-Meister:** the 10 facts of one row of that hut (not 20, because the · and : of a row live in different huts), no mistake, in under **30 s** (same pace as 20 in 60 s). She always finishes the row; a medal gives +15 coins the first time. 1 coin per right answer.
- **Grid reward:** a fully gold grid gives the **Einmaleins-Krone** (Mal-Dojo) or the **Geteilt-Diadem** (Teil-Dojo), new accessories that are never sold in the shop.
- Finishing a dojo round wakes napping pets, like a show. Leaving a round with the house button keeps all coins earned so far.
- Response times are measured with `performance.now()` from the moment the fact appears; in speed modes the answer is confirmed as soon as enough digits are typed.
- Sync merge: per fact the copy with more answers wins (gold stays gold), best records and all medals are kept, stars never go down.
- Not done yet: the title-screen "EINMALEINS" button from §6a (the dojos are in the village instead), the slowest/most-missed facts in the parent area (step 11).

## Battle decisions (step 7, 2026-10-22)

- **Wild island = hide and seek** (her wish, 2026-10-22): the Blumenwiese is 300 × 600 px and scrolls both ways. Trees, palms, rocks and a pond block the way (A* on a 6 px grid). The three animals hide in 3 of 12 bushes/tall-grass patches, picked at random on every boat trip; a hiding place with an animal in it rustles every ~2.6 s, and coming within 22 px makes the animal hop out. Who was found is kept while she battles; a new boat trip hides everybody again. A beaten animal runs off and **hides again right away in another free hiding place at least 80 px away from her** (`rehide`), so there are always three animals to find (playtest 2026-10-22: after 3 wins the island felt empty). Layout in `src/world/wild.ts` (tests check that every hiding place is reachable and nothing overlaps).
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
