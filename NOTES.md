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
- **Offline PWA**, fonts bundled via `@fontsource`; no runtime network requests.
- **Hosting:** GitHub Pages (`.github/workflows/deploy.yml`). **Git:** one commit per finished build step.
- The first React prototype was removed. Its tested generators in `src/math/aufgaben.ts` are ported into `src/math/generators/` in step 3, then the old file is deleted.

## My assumptions (change if you disagree)

- Defeated pets nap for 2 minutes or until she finishes a calm practice round – this nudges towards learning huts without punishing.
- Wild creatures wander visibly; no random encounters in tall grass.
- Einmaleins-Dojo keeps Blitzrunde and Turbo-Duell even though battles also drill the Einmaleins. Revisit after step 8 if it feels redundant.
- Added world colours (grass, path, stone) to the style guide §9a – the original palette had no greens.

## Open questions

- GitHub repo: needs to be created and pushed by you (the `gh` CLI isn't installed). Then enable _Settings → Pages → Source: GitHub Actions_.

## Technical notes for step 1

- Phaser `Scale.FIT` scales by non-integer factors (e.g. ×2.18), which makes pixel text slightly uneven. In step 1: prefer the largest integer zoom that fits and only fall back to FIT when even ×2 doesn't fit; render text at a higher resolution or as bitmap text.
