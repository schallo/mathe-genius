---
name: new-topic
description: Add a new math topic or level, or a new task type, to the math engine (e.g. "Schriftliche Division", "Größen: Geld").
---

1. Check `docs/GAME_DESIGN.md` §6 for the topic's examples and levels 1–5. If the school expectation is unclear,
   pick the simplest option and note it in `NOTES.md`.
2. Add the topic and its levels to `src/math/topics.ts`.
3. Write the generator in `src/math/generators/<topic>.ts`: a pure function taking a seeded RNG and a level,
   returning `{ question, answer, format, hintSteps, solutionSteps, topic, level }`. No Phaser imports.
4. Add method hints and worked solutions in `src/math/hints.ts` (German, short, school notation `·` and `:`).
5. Tests next to the generator: 1 000 seeded tasks per level; recompute the answer independently, check the
   number range, no negatives, divisions exact unless the level is "with remainder", hint steps lead to the answer.
6. If the topic needs a new input format, add or extend the component in `src/ui/`.
7. `npm test` and `npm run build` must pass; then run the `playtest` skill.
