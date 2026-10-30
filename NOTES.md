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

## Stage decor, battle backgrounds, pet welcome (v0.12.6, 2026-10-30)

- **Bühne** (GAME_DESIGN §4): new Laden tab with 13 items, one per slot is put up: curtain colours (Rosa, Minz, Himmel, Gold – each brings matching light beams), light colours (Gold, Rosa, Lila – win over the curtain's beams), rugs (rot, blau), props (Pflanzen, Laternen, Sternenkette – one at a time) and a front-row Publikum. 50–300 coins.
  - Tapping a card tries it on the stage behind her; buying puts it up at once; an owned item's button says Aufbauen/Abbauen. Mein Haus has a Bühne tab: tap to put up, tap again to take down (the plain purple stage comes back).
  - Shown on her stages: Bonuswoche shows, learning-hut rounds, the show end, Laden, Mein Haus, Tierheim. **Not** in the Einmaleins speed modes (STYLE_GUIDE §9: no distracting decoration) and not on the title or parent screens.
  - Laden tabs got short labels so five fit: Kleider, Haare, Schmuck, Spiel, Bühne.
  - Not in the Sammelalbum yet (its categories are fixed); can be added as a sixth album page later.
- **Battle backgrounds per island**: Blumenwiese soft hills, Flüsterwald a row of firs on a dark forest floor, Sonnensavanne sand with the sun and an acacia, Urzeittal a friendly volcano with a steam puff, Wolkenberg snowy peaks over a cloud floor. Platforms in the island's colours.
- **Daily welcome** (GAME_DESIGN §7): the first village visit of a day, her active pet hops and greets her by name (5 phrases, one per day, the same all day). Once a day, never again that day, also after a sync (the later day wins). No pet (e.g. napping or none) → no greeting.

## Pets with their own traits, fishing (v0.12.2, 2026-10-30)

- **Traits per pet** (GAME_DESIGN §4 updated): every Tierheim pet has its own trait, befriended wild animals keep their family trait. Effects: free mistakes, earlier streak, +1 coin per first try, +1 star per new star level, more battle time (plus tips, Volltreffer ×2, Zauber-Joker for wild families). They grow at pet level 5.
  - In shows and huts a **forgiven mistake** still shows the hint; coins and the streak count as one try earlier, her level, the mistake queue and "solved" count the real try. The pet hops at the mistake, the message "Bello hilft: Der Fehler zählt nicht!" comes with the right answer (so the hint card stays readable).
  - In battles a free mistake stops one attack (also after a timeout); the Zauber-Joker goes first when both apply.
  - Hündchen _Treuer Freund_ (1 Fehler frei), Kätzchen _Glückspfote_ (Serie ab 4), Hamster _Mehr Zeit_ – so the starters got traits too (cats and dogs had none before).
- **Tierheim**: tabs "Deine Tiere" / "Suchen ein Zuhause" with pages of 6. New pets: Hündchen 300, Maus 250, Schildkröte 300, Kaninchen 350, Meerschweinchen 350, Wellensittich 450, Dalmatiner 500, Rote Katze 500. **Special animals** (stars + coins, one each, arrive with their name, no naming screen; renaming later is possible): Mr Wriggles 3 ★ + 300, Kapitän Panzer 4 ★ + 350, Prinzessin Pfötchen 5 ★ + 500, Sir Bello 5 ★ + 500, Sternen-Katze 6 ★ + 400, Regenbogen-Hase 8 ★ + 600. If the same special animal gets adopted on two devices before a sync, the merge keeps one (the stars/coins of the second stay spent).
- **Fishing** at the pond (top left): the **Angel** (Spielzeug, 120 coins). Tapping the pond walks her to the shore; with the Angel the fishing screen opens, without it a hint. One big button (space bar on the PC): hold + let go to cast (throw meter; far = quicker bite), press when the float dips (missed → the next fish comes), hold to reel in. Pull switches weak/medium/strong every 0.7–1.8 s; reeling uses 8/20/45 power per second, resting recovers 15/s while the fish pulls line back. At 0 power the fish swims away, nothing is lost. Tuning check in the tests: holding all the time catches about 1 in 3, resting during strong pulls catches every fish.
  - **Goldi** (your change 2026-10-30): not the first catch but random with a growing chance – catch n is Goldi with chance n/50 (so at the 50th catch for sure, on average after about 8). Until she bites she jumps out of the pond every 4–9 s. Note: GAME_DESIGN otherwise avoids random rewards; this one is capped and always reached, so it never becomes a lottery.
  - Every other catch: 1 star, max. 3 per day (also before Goldi); more fish are just for fun. No coins.
- **Album** now has pages (16 per page): Tiere has 34 kinds.

## Next tasks (as of 2026-10-27)

Done: steps 1–8, v0.8.1 (no +100 button, no door plates, faster e2e tests). Live: https://schallo.github.io/mathe-genius/. Firebase sync, the iPhone home-screen app and the step 6–8 checkpoints are tested.

1. ~~Step 9 – Learning huts~~ done (v0.9.0).
2. ~~Theater with a weekly hut~~ done (v0.9.1).
3. ~~Step 10 – Adaptive difficulty, mistakes coming back, stars~~ done (v0.10.0).
4. ~~Step 11 – Album, daily calendar, full parent area~~ done (v0.11.0).
5. ~~Step 12 – More open-world areas (wild islands) and animals, 60 items~~ done (v0.12.0). Everyday pets and cat/dog variants come with item 10.
6. ~~Coin icon~~ done (v0.9.2): round 9 × 9 coin with rim, shading and shine.
7. ~~Village plants~~ done (v0.9.2): palms along both shores, then leafy trees, firs, bushes and flower bushes at random (fixed seed, `placePlants` in `src/world/village.ts`), never on huts, name boards, paths or the pond; only trunks/bases block walking.
8. ~~Avatar options~~ done (v0.10.1).
9. ~~Rename the Theater to "Bonuswoche"~~ done (v0.11.0): only the visible name (hut name and roof board, docs); ids, scene keys and saves stay `theater`/`Show`.
10. ~~More pets with their own traits~~ done (v0.12.2), see above. Original plan: Traits move from the family to each pet and work wherever the active pet is along (shows, huts, battles). They never solve a task: they only protect coins and streaks; adaptive levels, dojo times and the mistake queue still count her real answers. Trait strength grows a little with the pet's level. Wild animals keep their family traits.
    - Regular pets (Tierheim): Hündchen (starter) _Treuer Freund_ – first wrong answer per round costs nothing; Kätzchen 400 _Glückspfote_ – streak bonus after 4; Hamster (starter) _Mehr Zeit_ +2 s in battles; Kaninchen 350 _Hoppel-Hilfe_ – 1 free mistake, 2 from level 5; Schildkröte 300 _Ruhige Pfote_ +3 s in battles; Wellensittich 450 _Sternenvogel_ +1 star per level-up; Meerschweinchen 350 _Münzschatz_ +1 coin per first-try answer; Maus 250 _Flinke Maus_ – streak after 4; Dalmatiner 500 (like Hündchen); Rote Katze 500 (like Kätzchen).
    - Special animals (unique, arrive with their own name, stars + coins in the Tierheim, "Noch 2 ★" as a goal): **Mr Wriggles** – golden hamster with a top hat, 3 ★ + 300, +1 coin per right answer and +2 s in battles; **Prinzessin Pfötchen** – white cat with a crown, 5 ★ + 500, streak after 3; **Sir Bello** – dog with bow tie and monocle, 5 ★ + 500, 2 free mistakes; **Sternen-Katze** – lilac cat with stars in the fur, 6 ★ + 400, +1 star per level-up; **Kapitän Panzer** – turtle with a sailor hat, 4 ★ + 350, +4 s in battles; **Regenbogen-Hase** – rainbow bunny, 8 ★ + 600, 1 free mistake, +1 coin per right answer, +1 star per level-up.
    - Needs: sprites, data entries, trait logic + tests, trait display in the Tierheim and on stage, GAME_DESIGN §4 update.
11. ~~Fishing mini game~~ done (v0.12.2), Goldi by growing chance instead of the first catch. Original plan: the Laden sells an **Angel** (fishing rod). With it, walking up to the village pond (top left) opens a fishing game:
    1. **Cast:** throw the line (tap/hold for distance).
    2. **Wait** until a fish bites (random short wait, a bobbing float shows the bite).
    3. **Reel in** by holding/tapping – without tearing the line: the fish's pull switches at random between **strong, medium and weak**.
    4. **Power:** she starts with 100 power that recovers over time (recover rate to tune so it stays a challenge). Reeling in uses power, more the stronger the fish pulls; at 0 power the fish gets away and she starts again (nothing is lost).
    - **Reward** (decided 2026-10-27): the first fish she catches is a special pet – **Goldi**, a goldfish in a water bubble (it joins her like a befriended animal, named Goldi). After that, every catch gives **1 star, at most 3 stars per day**; further catches that day are just for fun. No coins (math stays the only way to earn coins).
    - **Place** (decided 2026-10-27): the village pond at the top left (it moved there in v0.12.1).
12. **Check with school** the open assumptions in "Math engine assumptions" below (subtraction method etc.).

Smaller follow-ups:

- ~~Village: parent mailbox~~ done in step 11.
- ~~iPhone: real-device test of the home-screen app~~ done 2026-10-25: screens work on PC and iPhone.
- Sound: check the "−" glyph and sounds on the real iPhone.

## Reset and village layout (v0.12.1, 2026-10-27)

- **Neu anfangen** in the parent area: resets the whole progress (character, coins, stars, items, pets, dojo, levels, calendar, album) to a fresh start with character creation; the parents' settings and the cloud login stay. Protection: a second page lists what gets deleted, offers "Erst exportieren", and the final button only works with the character's name typed in exactly.
- Sync-proof: the save carries `resetAt`; when two saves meet, the one with the newer reset wins as a whole (nothing from before the reset merges back), so the cloud copy and the other devices take over the fresh start at their next sync.
- **Bibliothek moved opposite Mein Haus** (right column, bottom row); the pond took its old place at the top left. Plants keep clear of the name boards down to the end of their posts.

## More islands, animals and items (step 12, v0.12.0, 2026-10-27)

- **Harbour** at the jetty (new scene): one card per island with its animals (befriended ones in colour, the others as dark shapes); an island opens when her strongest pet reaches its level, until then the card shows "Ab Lv N" as a goal.
- **Islands** (each its own theme – ground, plants, sea – drawn from the same layout kinds): Blumenwiese (Lv 1: Igel, Eichhörnchen, Fuchs), **Flüsterwald** (Lv 3: Eule, Waschbär, Reh – firs, ferns, dark forest floor), **Sonnensavanne** (Lv 5: Zebra, Giraffe, Elefant, Löwe – dry grass, acacias), **Urzeittal** (Lv 7: Flugsaurier, Triceratops, Brachiosaurus, T-Rex – teal fern floor, volcanic rocks, steaming pond), **Wolkenberg** (Lv 9: Pegasus, Einhorn, Drache – cloud floor, stone pillars, cloud trees, sky instead of sea).
- The new islands reuse the proven Blumenwiese layout, mirrored on every second island (the island, meadow and jetty are symmetric), so every hiding place stays reachable – the island tests run for all five.
- The **Fuchs stays on the Blumenwiese** (first "big" opponent since step 7); the Flüsterwald gets a **Reh** as third animal instead (GAME_DESIGN lists Fuchs there).
- Stronger islands: higher creature levels (5 → 18), more HP, a little less time, 18–30 coins. Battles ask Einmaleins up to level 4 and Kopfrechnen up to level 5 – never remainder tasks (the battle screen has no remainder field). Befriending (3 wins) works everywhere; dinosaurs bring the Urzeitkraft, fantasy animals the Zauber-Joker.
- **Items 33 → 60**: Kleider Tutu, Matrosenkleid, Trainingsanzug, Lederhose, Dirndl, Prinzessin, Astronaut; Frisuren Wuschelkopf, Seitenzopf, Zopf, Irokese, Afro; Schmuck Stirnband, Fliege, Haarblume, Sonnenbrille, Kette, Piratenhut, Zauberhut; Spielzeug Leckerli, Glöckchen, Quietsche-Ente, Wollknäuel, Seil, Frisbee, Kissen, Kuscheltier. Each toy teaches the pet a trick (double hop, spin, hearts, nap); tapping the pet in the village shows one of her toys' tricks.
- Idea for later: a battle background per island (now always the meadow).

## Album, calendar, parent area (step 11, v0.11.0, 2026-10-27)

- **Bibliothek** is open (no construction sites left): tab **Album** with pages Kleider, Haare, Schmuck, Spiel, Tiere – owned items in colour, missing ones as a grey silhouette of just that piece (outfit, hair or accessory layer, or the pet); tapping shows the name. A full page gives **one bonus star** (claimed when she opens the Bibliothek; `save.album.claimed`). Tiere = every kind of animal, collected when she has a pet of that kind.
- Tab **Kalender**: this month with a sticker on each day she finished a round (Theater show or learning-hut round), today outlined; "Diese Woche" with 5 sticker slots and the box.
- **Wochen-Kiste** (5 stickers Monday–Sunday): never random – it holds the cheapest Schmuck/Spielzeug item she doesn't own yet (no star or reward items), shown in advance in the calendar; 40 coins once she has them all. One per week; missed days cost nothing.
- **Break**: after `settings.roundsPerDay` rounds (default 2) the end card says once "Super gespielt! Deine Tiere machen jetzt ein Nickerchen." She can go on playing; nothing is taken away. (GAME_DESIGN's "daily bonus" is the sticker, which counts once per day anyway.)
- **Parent area** (title lock or the new **mailbox** right of the beach square, both behind the grown-up question; "Zurück" returns where she came from): progress per topic (level, tasks, first-try rate), Mal-/Teil-Dojo with "auswendig" count, slowest and most-missed facts, open mistakes, days played this month; settings rounds per day, "auswendig" time (2–5 s), her level per topic (best level stays, no stars for it); bonus coins +10/+25/+50.
- Not done: sound volume (there is only mute) and "active topics" (the Theater's weekly huts cover all topics).

## Avatar options (v0.10.1, 2026-10-26)

- **Girl or boy** at character creation (new first row "Figur"). It only picks the starting look – boy: short hair, T-Shirt & Hose (jeans), no bow; the rows "Kleid/Schleife" become "Shirt/Hose". Skin and hair colour are kept when switching. Every item fits everyone afterwards (`look.figure` is only remembered for the creation screen).
- **Two-tone outfits**: outfit maps have top roles (a, b) and bottom roles (c, d) with their own colour (`outfitColor`, `outfitColor2`) and outline. Long trousers (`longLegs`) also colour the walking legs. In Mein Haus a two-tone outfit shows two rows of colour swatches (top, then trousers/skirt).
- **New items**: Kleider T-Shirt & Hose (starter), Schlafanzug 70, Pulli & Rock 90, Latzhose 120, Kapuzenpulli 140; Frisuren Kurz (starter), Stachelig 60, Lange Haare 120; Schmuck Mütze 35, Basecap 40, Schal 45, Rucksack 70. New clothes colours jeans, braun, grau, terrakotta; accessories also in himmel, mint, flieder, terrakotta.
- **Pages**: Laden and Mein Haus show 6 cards per page with ◀ ▶ keys when there are more.
- Older saves get the new look fields on load (`normalizeLook`).
- Deviation: the colour swatches in Mein Haus are 18 art px (one row) or 15 art px (two rows), below 48 screen px on the iPhone, to fit 9 colours in 180 px.

## Adaptive levels, mistakes, stars (step 10, v0.10.0, 2026-10-26)

- **Her level per topic** (`src/math/adaptive.ts`, `save.mastery`): 3 tasks right on the first try in a row → one level up; 2 misses in a row (needed the hint or the solution) → one level down, never below 1. Only tasks at or above her level count up, and only tasks at or below her level count down – so the harder Theater tasks (level + 1) can lift her but never pull her down, and easier tasks she picks in a hut don't lift her.
- Counted in the Theater and the learning huts (Rechenwerkstatt, Zahlenturm, Marktstand). Battles and the dojos don't change topic levels (the dojos have their own fact tracking).
- The Theater plays her current level + 1. The hut picker marks her level with a small star and starts there if she has no saved pick yet.
- **Stars:** one for each level reached for the first time (2–5) and one for mastering level 5 (3 in a row there): up to 5 per topic. Stars and the best level never go down. A star counter appears in the top bar once she has stars (not in shows and drills, where the progress dots sit there). A level-up shows "Kopfrechnen: Stufe 2! +1 Stern" with a little fanfare.
- **Star items** (GAME_DESIGN §4): Sternspange (2 ★ + 30 coins) and Glitzerkrone (5 ★ + 80 coins) under Schmuck. The card shows "★ 2 ● 30", or "Noch 3 ★" while stars are missing. Spending is counted per device (`save.starsSpent`) so syncing never loses or doubles stars.
- **Mistakes come back** (`src/math/review.ts`, `save.review`): tasks solved only with a hint or the worked solution (Theater, huts) and wrong battle answers are kept (each task once, max. 20). Up to 2 come back in the next Theater show at random places, marked "Nochmal". Right on the first try → gone; wrong again → back two shows later. Old mistakes in the Theater pay double coins like every Theater task.
- Sync: per topic the copy with more answers wins (best level and mastery only grow); the newer device's mistake queue wins.

## Theater with a weekly hut (v0.9.1, 2026-10-26)

- Replaces the 60/30/10 mix (GAME_DESIGN §6 updated). The week counts from Monday (local time) and the rotation runs on across new year: Mal-Dojo → Teil-Dojo → Zahlenturm → Rechenwerkstatt → Marktstand (`weekHut` in `src/math/show.ts`).
- **One level harder:** for the huts every topic runs one level above her level (adaptive since step 10; starting defaults: Kopfrechnen, Zahlenraum, Halbschriftlich, the four written topics and Geld at level 1 → the Theater uses level 2), topics of the hut take turns. The dojos have no levels, so their harder form is: **Mal-Dojo week** = 5 plain facts + 5 missing factors (`? · 8 = 56`), **Teil-Dojo week** = division with remainder (Einmaleins level 5).
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
