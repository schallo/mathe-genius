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
- **Cloud sync** (decided 2026-10-21): Firebase Auth (**email + password** of the parent, once per device – Google login fails in the iPhone home-screen app) + Firestore, built in step 5 together with the save system. Setup guide for the Firebase project follows in step 5.
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

## Next tasks (as of 2026-10-21)

Done: steps 1–4 and step 5 except the live Firebase connection. Live: https://schallo.github.io/mathe-genius/ (steps 1–4).

1. **Firebase setup (you):** follow `docs/SETUP_FIREBASE.md`, paste the config into the chat. Then: fill `src/firebaseConfig.ts`, test login + sync PC ↔ iPhone, push. Finishes step 5.
2. **Push** the step 5 commit (parent area, export/import) so it is live.
3. **Playtest the shows with Leni** (number pad, hints, coins): too easy/hard? Which topic should be the focus (currently Einmaleins level 2)?
4. **Check with school** the open assumptions in "Math engine assumptions" below (subtraction method etc.).
5. **Step 6 – Laden, Mein Haus, Tierheim, wish goal** with the first ~15 items (2 adoptable pets with naming, 3 haircuts, 3 dresses). ⏸ checkpoint.
6. **Step 7 – Battles:** Blumenwiese, first wild creatures (Igel, Eichhörnchen, Fuchs), battle screen, adaptive timer, pet XP, family traits, befriending. ⏸ checkpoint.
7. **Step 8 – Einmaleins-Dojo:** 200 facts, Leitner boxes, Üben, Blitzrunde, 10 × 10 grid, Turbo-Duell, Reihen-Meister. ⏸ checkpoint.
8. **Step 9 – Learning huts** (Rechenwerkstatt with the written calculation grid, Zahlenturm, Marktstand); written tasks join the shows.
9. **Step 10 – Adaptive difficulty**, mistakes coming back, stars per level.
10. **Step 11 – Album, daily calendar, full parent area** (settings, progress overview, bonus coins, shows per day).
11. **Step 12 – More areas and animals**, 60–80 items.

Smaller follow-ups:

- Village: parent mailbox (currently only the lock on the title screen).
- iPhone: real-device test of the home-screen app (sizes, sounds, safe areas).
- Sound: check the "−" glyph and sounds on the real iPhone.

## Playtest feedback (2026-10-21)

- Step 1: she recognises herself, understands tap-to-walk on her own, opened the only open hut first, picks the **puppy** as her starter.

## Deviations from the style guide

- Name keyboard keys are 15 × 22 art px (≈ 30 × 44 screen px on the iPhone), below the 48 × 48 guideline: 11 keys per QWERTZ row don't fit otherwise in 180 px. Word keys (Zufall, Leertaste, Fertig) are wide.
