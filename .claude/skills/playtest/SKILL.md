---
name: playtest
description: Play through the game on PC and iPhone viewports, look at screenshots and report issues against the style guide. Use after visual changes, before a "stop and show me" checkpoint, or when the user says "playtest".
---

1. Run `npm test` and `npm run build`; fix errors first.
2. Run `npm run e2e` (Playwright projects `pc` and `iphone`).
3. For the screens touched by the change, write a temporary Playwright script in the scratchpad (or extend
   a test in `e2e/`) that drives the game and saves screenshots to `test-results/` for both projects.
   The game is a canvas: navigate by clicking coordinates or via a debug hook on `window`, not DOM selectors.
4. Look at every screenshot with the Read tool and check it against `docs/STYLE_GUIDE.md`:
   pixel-sharp integer scaling, palette only, touch targets ≥ 48 × 48 screen px, readable German text,
   no clutter, iPhone safe areas.
5. Report briefly: what looks good, what is off (with the screenshot path), suggested fixes.
