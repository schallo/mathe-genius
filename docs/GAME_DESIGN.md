# Game Design – "Mathe-Bühne" (working title)

## 1. Purpose

The game exists to **motivate my daughter to practise math** regularly and enjoy it. She earns coins by solving math problems on a cozy pixel stage and spends them on things she cares about: **pets, dresses, haircuts, accessories and stage decorations** for her character. Math is the only way to earn coins.

The learning content must be real practice at her school level. The cute rewards make her want to come back to it.

The game world is a small **pixel village** in the style of classic 2D monster-RPGs: she walks between **huts with different purposes** (learning, theatre shows, shop, wardrobe, pet shelter) and into a **wild area** where her pets take on wild creatures in **timed math battles**. The genre conventions (village, battle screen with HP bars) are the inspiration; every name, creature, sprite and sound is original – no Pokémon content.

## 2. Player

- Girl, **4th grade (4. Klasse) at a primary school in Bavaria** (curriculum: LehrplanPLUS Grundschule Bayern, Jahrgangsstufe 3/4).
- Plays on a **Windows PC** (mouse/keyboard) and her **iPhone** (touch), in **portrait** on both.
- Reads well, but keep texts short. UI language: **German**.
- Typical session: **10–15 minutes**.

## 3. Core Loop

```
            ┌──────────── VILLAGE (hub) ────────────┐
            │                                       │
  Learning huts / Theatre ──► coins + stars ──► Shop / Wardrobe / Pet shelter
  (calm practice, hints)                         (dress up, adopt pets)
            ▲                                       │
            │                                       ▼
  stronger pets, new areas ◄── coins + pet XP ◄── Wild area: timed battles
                                                    (her pets fight)
```

Calm practice (huts, theatre) teaches; battles test speed. Both earn coins. Pets connect everything: she adopts them, names them, they fight for her and grow with her math.

1. **Vorstellung (the show, in the theatre hut):** Her character stands on the stage. A speech card shows a task. She answers. Correct → coins fly into her purse, the audience applauds (little pixel hearts rise from below the stage).
2. A show has **10 tasks**. At the end: curtain falls, summary screen ("Du hast 8 von 10 geschafft! +45 Münzen"), curtain rises again.
3. **Laden (shop):** spend coins on items.
4. **Garderobe (wardrobe):** combine owned items, try things on, play with pets.
5. Her dressed-up character and her pets appear on stage during the next show.

## 3a. The Village (hub)

A small top-down pixel village that fits on **one or two screens** (portrait). Her character walks around with **tap to walk** (tap a spot or a hut; arrow keys/WASD on the PC). Her active pet follows her. Entering a hut door opens that hut's scene.

| Hut                                           | Purpose                                                                                                                            |
| --------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| **Theater**                                   | The shows from section 3: 10 mixed tasks, no timer, hints, coins.                                                                  |
| **Lernhütten** (learning huts, one per field) | Focus training of one math field, she picks the topic and level. Calm, no timer, hints and worked solutions, same coins as a show. |
| – **Einmaleins-Dojo**                         | The Einmaleins-Training from section 6a incl. progress grid and row badges.                                                        |
| – **Rechenwerkstatt**                         | Halbschriftlich and schriftlich ·, :, +, − (written calculation grid).                                                             |
| – **Zahlenturm**                              | Zahlenraum bis 1 Million, Kopfrechnen Plus/Minus, rounding.                                                                        |
| – **Marktstand**                              | Größen and Sachaufgaben (money first).                                                                                             |
| **Laden**                                     | Shop (section 4).                                                                                                                  |
| **Mein Haus**                                 | Garderobe: wardrobe, hairstyles, renaming.                                                                                         |
| **Tierheim** (pet shelter)                    | Adopt pets, name them, play with them, see their level, choose the active battle pet. Tired pets nap here.                         |
| **Bibliothek**                                | Sammelalbum and daily calendar.                                                                                                    |
| **Wild area** (path at the village edge)      | Leads to the battle areas (section 6b).                                                                                            |

- Huts that aren't built yet are shown as a cute construction site ("Hier wird gebaut!"), so the village feels alive from the start.
- The parent area is opened from a small locked mailbox, not a hut.

## 4. Rewards & Shop

### Currency

- **Münzen (gold coins)**: main currency.
  - Correct on first try: **5 coins**
  - Correct on second try (after hint): **3 coins**
  - Correct after the solution was shown and she retyped it: **1 coin** (effort always counts)
  - **Serie-Bonus**: 5 correct in a row → +5 extra coins and a little fanfare.
  - Finishing a whole show: +10 coins.
- **Sterne (stars)**: earned by mastering a topic level (see section 6). Stars unlock special, rarer items. Stars can't be bought.

### Shop categories

| Category                                   | Examples                                                                                | Price range (coins) |
| ------------------------------------------ | --------------------------------------------------------------------------------------- | ------------------- |
| **Haustiere (pets)**                       | kitten, puppy, hamster, mouse, turtle, bunny, guinea pig, budgie (see Pet roster)       | 150–600             |
| **Kleider (dresses & outfits)**            | summer dress, ballgown, football kit, raincoat, pyjamas, princess dress, astronaut suit | 40–250              |
| **Frisuren (haircuts)**                    | ponytail, braids, bob, curls, space buns, long wavy hair; plus hair colours             | 30–150              |
| **Accessoires**                            | bows, hats, crowns, glasses, scarves, backpacks                                         | 20–100              |
| **Bühne (stage decor)**                    | curtain colours, light-beam colours, floor rugs, plants, lanterns, a little audience    | 50–300              |
| **Futter & Spielzeug (pet treats & toys)** | ball, treat, cushion → pets do a trick                                                  | 5–20                |

- Around **60–80 items** in total at launch, so there is always something to save for.
- Each item has a small pixel preview, a name and a price.
- **Try before buying:** tapping an item shows it on her character immediately.
- **Star items:** a few special items (e.g. golden crown, rainbow unicorn, sparkle dress) need stars plus coins.
- Prices should mean roughly **1 show ≈ 1 small item**, **3–5 shows ≈ 1 dress**, **1–2 weeks ≈ 1 pet**.

### Wunschliste (wish goal)

She can mark **one item as her wish**. A progress bar on the stage shows "Noch 85 Münzen bis zum Kätzchen!". Saving towards a chosen goal is the strongest motivator, so make this prominent.

### Pets

- Pets follow her character across the stage, sit next to her during shows and cheer (jump, heart above the head) when she answers correctly.
- She gives each pet a **name** (simple on-screen keyboard).
- Tapping a pet: it does a small trick. Treats/toys unlock extra tricks.
- Pets never get sick, hungry or sad. **No neglect mechanics.**
- **Getting pets:** a **starter pet** of her choice (one of 3) at character creation; more pets are adopted with coins in the **Tierheim**; and a wild creature she has defeated **3 times** wants to join her ("Flocki möchte mit dir kommen!") – deterministic, never a random chance.
- **Battle pets:** every pet can fight. Pets earn **XP** in battles and level up (more HP, stronger attacks, a new attack animation every few levels). The pet chosen in the Tierheim is her **active pet**: it follows her in the village and fights for her.

### Pet roster

Her favourites are **cats and dogs**; they get the most variety (several fur colours/breeds as separate pets). All animals are cute, round and friendly – also the dinosaurs and lions, never scary (`STYLE_GUIDE.md` §11).

| Group                         | Animals                                                                                                   | How she gets them                                                                           |
| ----------------------------- | --------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| **Haustiere** (everyday pets) | Katze, Hund (several colours each), Hamster, Maus, Schildkröte, Kaninchen, Meerschweinchen, Wellensittich | **Starter** (choice of Kätzchen, Hündchen, Hamster) or **adopt with coins** in the Tierheim |
| **Wildtiere** (wildlife)      | Igel, Eichhörnchen, Fuchs, Eule, Waschbär · Löwe, Elefant, Giraffe, Zebra                                 | **Befriend** in the wild area (3 wins against the species)                                  |
| **Urzeittiere** (dinosaurs)   | T-Rex, Brachiosaurus, Triceratops, Flugsaurier                                                            | **Befriend** in a later area                                                                |
| **Fabeltiere** (fantasy)      | Einhorn, Pegasus, Drache                                                                                  | **Befriend** in the last area                                                               |
| **Besondere Varianten**       | e.g. Regenbogen-Einhorn, Goldener T-Rex, Sternen-Katze                                                    | **Stars + coins** in the Tierheim (star items)                                              |

- Rule of thumb: everyday pets are bought, wild and fancy pets are **earned in battles** – that's the reason to keep going into the wild area.
- Wild creatures in battle are these animals in their wild form (e.g. a wild fox); once befriended, the same animal becomes her pet and can be named.
- New animals only need a data entry in `data/creatures.ts` (and `items.ts` for shop pets) plus a sprite.

### Sammelalbum (collection book)

A book that shows all items as silhouettes. Owned items are coloured in. Completing a category gives a bonus star.

## 5. Character Creation

On first start she creates her character:

- Skin tone (several options), hair style, hair colour, eye style, starting outfit
- **A name for the character** (required step, see "Naming" below)
- She can change everything later in the Garderobe (hair changes free once owned), including renaming the character.

### Naming (character and pets)

- She types the name herself on a **big pixel on-screen keyboard** (German layout, includes Ä, Ö, Ü, ß, space, delete); physical keyboard works on laptop.
- Max. **12 characters**, letters, space and hyphen only. First letter is capitalised automatically.
- A **"Zufall"** button suggests cute names (e.g. Flocke, Krümel, Sternchen, Mimi, Pünktchen) for when she can't decide.
- The name is used everywhere: the character's name appears on a little label pill above her head on stage and in praise ("Super, Lotti!"); pet names appear when the pet is tapped and in the album.
- Every pet gets named right after it's bought (naming screen with the pet hopping next to the keyboard). Pets can be renamed in the Garderobe at any time.

The character is an **original, cute pixel girl** about 18–24 px tall at native resolution, built from layers (body, outfit, hair, accessory) so items can be swapped. Pets are 10–16 px.

## 6. Math Content (4. Klasse, Bayern)

### Topics

Each topic has **levels 1–5**. Reaching a level gives a star.

| Topic                                           | Examples (rising difficulty)                                                                                       |
| ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| **Einmaleins** (times tables, revision & speed) | 7 · 8, 54 : 6, missing factor `_ · 9 = 63`                                                                         |
| **Kopfrechnen Plus/Minus**                      | 340 + 270, 1000 − 365, 45 000 + 8 000                                                                              |
| **Zahlenraum bis 1 Million**                    | place value, which number is bigger, number before/after, rounding to tens/hundreds/thousands                      |
| **Halbschriftlich multiplizieren/dividieren**   | 6 · 47, 23 · 30, 840 : 4                                                                                           |
| **Schriftliche Addition**                       | 4 573 + 2 869, three numbers                                                                                       |
| **Schriftliche Subtraktion**                    | 7 204 − 3 568 (with borrowing)                                                                                     |
| **Schriftliche Multiplikation**                 | 347 · 6, 254 · 23                                                                                                  |
| **Schriftliche Division**                       | 846 : 3, 2 345 : 5 (with and without remainder)                                                                    |
| **Größen**                                      | money (€/ct), lengths (km/m/cm/mm), weights (t/kg/g), time (h/min/s), converting                                   |
| **Sachaufgaben**                                | short word problems using the **game world**: "Ein Kätzchen kostet 240 Münzen. Du hast 95. Wie viele fehlen noch?" |

### Task formats

- **Number pad input** (main format): big pixel number buttons 0–9, delete, OK.
- **Multiple choice** (3–4 options) for comparison, rounding and estimating.
- **Written calculation grid** (schriftlich): a column layout with squared-paper look. She fills in the digits from right to left, with small boxes for the carry (Übertrag). Validate each digit as she goes; a wrong digit gets a gentle wiggle.
- **Word problems:** max. 2 short sentences, with a pixel picture of the items involved.

### Difficulty & learning logic

- **Adaptive:** each topic tracks a mastery score. 3 correct in a row → slightly harder; 2 mistakes in a row → slightly easier.
- A show mixes topics: about **60 % current focus topic, 30 % revision, 10 % "challenge"** (one level above, worth double coins, marked with a star).
- **Mistakes come back:** wrongly answered tasks are stored and appear again in a later show (simple spaced repetition).
- **Hints instead of failure:** after a wrong answer, show a hint that teaches the method (e.g. split 6 · 47 into 6 · 40 + 6 · 7). After a second wrong answer, show the full worked solution and let her type the result.
- Speed pressure belongs only in the dedicated **Einmaleins-Training** mode (section 6a) and in **battles** (section 6b). Shows and learning huts have no timers.

## 6a. Einmaleins-Training (times tables by heart + speed)

A separate mode next to the regular shows, reachable from the title screen via its own button ("EINMALEINS"). Goal: she knows all **multiplications and divisions of the small times tables (1·1 to 10·10 and the matching divisions)** _auswendig_ and answers fast.

### Fact tracking

- Track each of the **200 facts** separately (100 multiplications, 100 divisions, e.g. `7 · 8` and `56 : 8`).
- Per fact store: last answers, correctness and **response time**.
- A fact counts as **"auswendig"** when it was answered correctly **3 times in a row in under 3 seconds** each (threshold adjustable in the parent area).
- Facts she doesn't know yet or answers slowly appear more often (Leitner-box style: 5 boxes, a fact moves up when fast & correct, back to box 1 when wrong).

### Sub-modes

| Sub-mode                           | How it works                                                                                                                                                                             | Reward                                                             |
| ---------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| **Üben (Learn)**                   | Pick one row (e.g. the 7s) or "Mix". No timer. Wrong answers show the fact with a small helper (e.g. `7 · 8 = 7 · 10 − 7 · 2`), then ask again later in the round.                       | 2 coins per correct fact                                           |
| **Blitzrunde (Speed round)**       | 60 seconds, as many facts as possible, multiplication and division mixed. Facts are drawn from her weaker boxes. A running counter and a gentle sand-timer graphic (no ticking, no red). | 1 coin per correct answer + bonus for a new personal best          |
| **Turbo-Duell (Beat your record)** | 20 facts against her own **ghost** (her previous best time shown as a little pixel pet running along a track at the top).                                                                | Bonus coins + star when she beats the ghost                        |
| **Reihen-Meister (Row master)**    | Clear all 20 facts of one row (10 multiplications + 10 divisions) without a mistake in under 60 s.                                                                                       | One **badge per row** (1–10), shown on a trophy shelf on the stage |

### Einmaleins progress screen

- A **10 × 10 grid** (squared-paper look). Each cell is one fact and gets coloured as she learns it: empty → `cream`, practised → `sky`, auswendig → `gold`. Divisions get a second grid (or a toggle).
- Shows her **best Blitzrunde score** and **average answer time**.
- When all 100 cells of one grid are gold: big celebration and a special shop item (e.g. "Einmaleins-Krone").

### Input & feedback

- Number pad stays at the same place every time so her fingers learn the positions; keyboard digits work on laptop. Enter or tapping OK confirms; for speed modes, the answer is **auto-confirmed** once the number of typed digits matches the answer length.
- Correct: short "pling" and +1 on the counter, next fact appears immediately (no long animations in speed modes).
- Wrong in speed modes: the correct fact flashes briefly in `accent-blue` (no flashing effect, just shown for 1 s) and the fact is queued for review.
- Speed modes are always **optional**. A Blitzrunde never reduces coins or stars.

## 6b. Battles (wild area)

Timed mental-math battles in the style of classic 2D monster-RPG battle screens. They challenge her to answer **fast**, otherwise her pet loses the battle.

### Wild area

- A path at the village edge leads to **areas** with rising difficulty: **Blumenwiese** (Igel, Eichhörnchen) → **Flüsterwald** (Fuchs, Eule, Waschbär) → **Sonnensavanne** (Löwe, Elefant, Giraffe, Zebra) → **Urzeittal** (dinosaurs) → **Wolkenberg** (Einhorn, Pegasus, Drache). An area unlocks when her strongest pet reaches a certain level.
- Wild creatures (animals from the Pet roster in their wild form, original designs, 10–16 px like pets) **wander visibly** – no random encounters. She taps one or walks into it to start a battle.
- Each creature species has a **math topic**: Einmaleins + Division or Kopfrechnen Plus/Minus. Stronger areas use higher levels of that topic.

### Battle flow

1. Battle screen: wild creature top right on a grass platform with name, level and HP bar; her active pet bottom left with name, level and HP bar. Task box and number pad below.
2. A task appears and the **time bar** starts.
3. **Correct in time** → her pet attacks. The faster the answer, the stronger the hit; very fast answers are a "Volltreffer!".
4. **Wrong or too slow** → the creature attacks her pet. A wrong answer shows the correct fact for 1 s and queues it for review (section 6). No hint during a battle.
5. The battle ends when one side's HP is empty. A battle takes about **6–10 tasks**.

### Adaptive timer

- Each topic tracks her recent response times. The time per task is about **1.5 × her median time** for that topic and level, starting at **10 s**, never below **3 s** and never above **12 s**.
- Stronger areas and creatures shorten the time a little and have more HP.
- Measure with `performance.now()`; answers are auto-confirmed once the number of typed digits matches the answer length (like section 6a).

### Win and defeat

- **Win:** coins (10–30 depending on area and creature level), pet XP, a cheer from her pet. Third win against a species → it wants to join her (section 4, Pets).
- **Defeat (gentle):** "Flocki ist erschöpft und macht ein Nickerchen im Tierheim." The pet naps for **2 minutes** (or until she finishes a show or learning-hut round, whichever comes first). She can fight on immediately with another pet or retry later. **Nothing is ever lost** – no coins, no XP, no items. Answers she got right still earn their XP.
- Battles are always optional; no daily battle quota.

## 7. Motivation Design (healthy)

- **Do:** visible progress (wish bar, stars, album), small surprises (a random "Glücksmünze" sometimes falls from the curtains), praise that names the effort ("Du bist drangeblieben!"), daily welcome message from her pet.
- **Daily show calendar:** a sticker for each day she plays one show. 5 stickers in a week → bonus item box. Missing a day **never removes anything**.
- **Don't:** no real-money purchases, no ads, no loot boxes with rare odds, no FOMO timers ("only today!"), no losing coins or items, no punishments for breaks.
- **Natural stopping point:** after 2 shows a friendly message suggests a break ("Super gespielt! Deine Tiere machen jetzt ein Nickerchen."). Shop and wardrobe stay open, new shows are possible but give no "daily" bonus. Parents can set the limit.

## 8. Eltern-Bereich (parent area)

- Opened via a small icon, protected by a grown-up question (e.g. "Wie viel ist 17 · 23?").
- Settings: active topics, starting level per topic, shows per day with daily bonus, sound volume, "auswendig" time threshold for the Einmaleins (default 3 s).
- Progress overview: tasks solved per topic, accuracy, mastery level, frequent mistakes, Einmaleins grid with the slowest/most-missed facts.
- Option to give bonus coins (e.g. for homework done outside the game).
- Reset / export / import progress (JSON file) so progress can move between devices.

## 9. Screens

0. **Dorf (village)** – the hub with huts and the path to the wild area (section 3a). Shown after the title screen.
   0a. **Wildnis** – wild area with wandering creatures. 0b. **Kampf** – battle screen (section 6b).
   0c. **Tierheim** – pet shelter. 0d. **Lernhütte** – topic/level picker and calm practice (same flow as a show).
1. **Titel** – stage with closed curtains, her character peeking out, button "SPIELEN".
2. **Bühne (Show)** – main math gameplay, inside the Theater hut.
   2a. **Einmaleins** – sub-mode menu (Üben, Blitzrunde, Turbo-Duell, Reihen-Meister) and the 10 × 10 progress grid.
   2b. **Name eingeben** – on-screen keyboard for the character and pet names.
3. **Show-Ende** – summary, coins counted up one by one with sound.
4. **Laden** – shop with category tabs, try-on, wish button.
5. **Garderobe** – change outfit, hair, accessories, pets.
6. **Sammelalbum** – collection book.
7. **Charakter erstellen** – first start only.
8. **Eltern** – parent area.

## 10. German UI Texts (examples)

- Buttons: "SPIELEN", "LADEN", "GARDEROBE", "ALBUM", "KAUFEN", "ANPROBIEREN", "WUNSCH", "OK", "WEITER"
- Correct: "Richtig!", "Super!", "Klasse!", "Genau!", "Stark gerechnet!"
- Wrong: "Fast! Schau mal:", "Probier's nochmal!", "Kein Problem – so geht's:"
- Shop: "Noch 40 Münzen, dann gehört es dir!", "Gekauft! 🎉" (pixel confetti instead of emoji)

## 11. Build Order

1. **Village prototype:** pixel village with hut placeholders, character with layered sprites, tap to walk, entering the Theater hut shows the stage. ⏸ checkpoint
2. Character creation incl. naming screen with on-screen keyboard and starter pet choice.
3. Math engine: task generators per topic + answer checking + unit tests (priority: Einmaleins + Division → Kopfrechnen Plus/Minus → Halbschriftlich → Zahlenraum → Schriftlich → Geld).
4. Show flow in the Theater hut with number pad, hints, coin rewards.
5. Save system (localStorage + JSON export).
6. Shop + wardrobe + wish goal + Tierheim with first ~15 items (incl. 2 adoptable pets with naming, 3 haircuts, 3 dresses). ⏸ checkpoint
7. Battles: wild area (Blumenwiese with Igel + Eichhörnchen, plus a wild Fuchs as first "big" opponent), battle screen, adaptive timer, pet XP/levels, gentle defeat, befriending. ⏸ checkpoint
8. Einmaleins-Dojo: fact tracking, Üben, Blitzrunde, progress grid; then Turbo-Duell and Reihen-Meister. ⏸ checkpoint
9. Learning huts (Rechenwerkstatt, Zahlenturm, Marktstand) incl. written calculation grid.
10. Adaptive difficulty, mistake repetition, stars.
11. Collection album, daily calendar, parent area.
12. Further areas one by one (Flüsterwald, Sonnensavanne, Urzeittal, Wolkenberg) with their animals; more everyday pets and cat/dog variants; expand items to 60–80.

## 12. Out of Scope

- Accounts, online sync, multiplayer, chat
- Real-money purchases or ads
- Geometry tasks (maybe later)
- Pokémon names, creatures, sprites, sounds or UI copies (genre inspiration only)
