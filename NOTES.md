# Notes – Open Questions & Decisions

## Decisions (2026-10-21)

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
- **Cloud sync** (decided 2026-10-21): Firebase Auth (Google login by the parent, once per device) + Firestore, built in step 5 together with the save system. Setup guide for the Firebase project follows in step 5.
- **Hosting:** GitHub Pages (`.github/workflows/deploy.yml`). **Git:** one commit per finished build step.
- The first React prototype was removed. Its tested generators in `src/math/aufgaben.ts` are ported into `src/math/generators/` in step 3, then the old file is deleted.

## My assumptions (change if you disagree)

- Defeated pets nap for 2 minutes or until she finishes a calm practice round – this nudges towards learning huts without punishing.
- Wild creatures wander visibly; no random encounters in tall grass.
- Einmaleins-Dojo keeps Blitzrunde and Turbo-Duell even though battles also drill the Einmaleins. Revisit after step 8 if it feels redundant.
- Added world colours (grass, path, stone) to the style guide §9a – the original palette had no greens.

## Open questions

- GitHub repo: needs to be created and pushed by you (the `gh` CLI isn't installed). Then enable _Settings → Pages → Source: GitHub Actions_.

## Technical notes

- **Crisp rendering** (`src/display.ts`): the canvas is rendered at an integer multiple of 180 × 360 so that one canvas pixel = one device pixel (×6 on the iPhone home-screen app, ×2 on a 1080p PC). Scenes extend `PixelScene`, which zooms the camera by that factor, so all game code works in art pixels and text is sharp. After a window resize the frame is refit (slightly less crisp until reload).
- Movement uses the real frame time (`game.loop.rawDelta`), not Phaser's smoothed delta, so walking speed stays right on slow frames.
- **Starting look** is modelled on her (from a photo, not stored in the repo): fair skin (`skin1`), ginger hair (`hair-ginger`, new palette colour) pulled back into a ponytail, mint dress, pink bow.

## Left for later steps

- Mute button ("always visible") → added together with the first sounds.
- Save: step 2 already stores character and pets (`src/state/save.ts`, version 1); step 5 adds coins, progress and JSON export/import.

## Playtest feedback (2026-10-21)

- Step 1: she recognises herself, understands tap-to-walk on her own, opened the only open hut first, picks the **puppy** as her starter.

## Deviations from the style guide

- Name keyboard keys are 15 × 22 art px (≈ 30 × 44 screen px on the iPhone), below the 48 × 48 guideline: 11 keys per QWERTZ row don't fit otherwise in 180 px. Word keys (Zufall, Leertaste, Fertig) are wide.
