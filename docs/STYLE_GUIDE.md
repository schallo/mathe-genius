# Visual Style Guide – "Cozy Pixel Stage"

This document defines the visual style for the game. Follow it for every scene, sprite, UI element and animation. If something isn't covered here, choose the option that is **simpler, softer and more readable**.

## 1. Core Idea

A cozy, side-view **2D pixel-art puppet theatre**. The game world is a small stage: purple curtains at the back, a warm wooden floor in front, tiny cute characters and a few chunky props. Calm, friendly, never flashy. Target audience: a young child – everything must be instantly readable.

The stage lives inside a small **pixel village** (top-down, classic 2D monster-RPG look); timed battles use a separate **battle screen**. Both follow this guide (see section 9a).

**Keywords:** cozy · chunky pixels · limited palette · stage/theatre · playful terminal typography · gentle

## 2. Rendering Rules

- Native resolution: **180 × 360 px** (portrait, 1:2) on all devices. Everything is drawn at this size and scaled up (×2 on the iPhone) to fit the screen.
- **No anti-aliasing, no smoothing, no sub-pixel positions.** Round every position to whole pixels.
  - Canvas: `ctx.imageSmoothingEnabled = false`
  - CSS: `image-rendering: pixelated;`
- **No gradients.** Shading uses 2–3 hard colour steps.
- Outlines: 1 px, darker shade of the fill colour (not pure black). Exception: UI elements use a dark ink outline (`ink`).
- Light comes from the top. Highlights on top edges, shadows on bottom and right.
- The game canvas sits inside a **rounded frame** (border-radius ~16 px at screen scale) with a soft drop shadow, on a light page background with a faint grid pattern.

## 3. Colour Palette

Use **only** these colours. New colours need a good reason and must fit the mood.

| Token           | Hex         | Use                                           |
| --------------- | ----------- | --------------------------------------------- |
| `curtain-dark`  | `#2e2442`   | deepest curtain folds, back wall shadows      |
| `curtain-mid`   | `#3f3159`   | main curtain colour                           |
| `curtain-light` | `#5a4a7a`   | curtain highlights                            |
| `beam`          | `#7a68a0`   | tapered light beams / curtain gaps            |
| `wood-light`    | `#e0a86c`   | floor planks, top highlight                   |
| `wood-mid`      | `#c98d55`   | main floor plank colour                       |
| `wood-dark`     | `#8f5a32`   | plank seams, stage edge                       |
| `wood-edge`     | `#5e3a20`   | line where wall meets floor                   |
| `gold`          | `#f2c14e`   | collectibles, coins, rewards                  |
| `gold-dark`     | `#c8922a`   | gold shading and stripes                      |
| `hero`          | `#e07a5f`   | main character body (warm terracotta)         |
| `hero-dark`     | `#b5543e`   | main character shading                        |
| `cream`         | `#f6efe0`   | speech cards, paper, signs                    |
| `paper-white`   | `#ffffff`   | label pills                                   |
| `ink`           | `#2a2230`   | text, UI outlines, eyes                       |
| `shadow`        | `#00000040` | soft oval ground shadows (25 % black)         |
| `accent-blue`   | `#8aa6c8`   | small accents (bubbles, sparkles) – sparingly |
| `page-bg`       | `#ecebe8`   | website background around the game frame      |
| `page-grid`     | `#dcdad6`   | faint grid lines on the page background       |

## 4. Scene Composition

```
 180 px wide
┌────────────────────────┐  y 0
│ [wish bar]   [coins ●] │  slim HUD, ~16 px
│  CURTAINS (purple,     │
│  vertical folds,       │  ~55% of height
│  3 light beams)        │
│                        │
│   [sign/card]          │
│ [pet] (hero)           │  ← action line sits on floor edge
├═══════ stage edge ═════┤  y ≈ 200
│  WOODEN FLOOR          │  ~45% of height
│  ┌───┬───┬───┐         │
│  │ 7 │ 8 │ 9 │ …       │  number pad / keyboard / buttons
│  └───┴───┴───┘         │  live on the floor (thumb zone)
│ [LABEL]       [LABEL]  │
└────────────────────────┘  y 360
```

- **Curtains:** Vertical bands of alternating `curtain-dark` / `curtain-mid`, each 6–10 px wide. Light beams are tall triangles (wide at the floor, pointed at the top) in `beam`, drawn with pixel steps.
- **Floor:** Horizontal planks 5–7 px high, `wood-mid` with a 1 px `wood-light` top line and a 1 px `wood-dark` seam. A 2 px `wood-edge` line separates wall and floor.
- **Action line:** Characters and props stand on the top edge of the floor.
- Keep the stage uncluttered: at most **5–7 interactive objects** on screen at once.

## 5. Characters

- **Size:** small and cute – about 14–20 px tall at native resolution. The world should feel big around them.
- **Shape:** round or blocky body, **no visible neck**, stubby 2-pixel legs, tiny arms optional.
- **Face:** two 1–2 px `ink` dot eyes, optional tiny mouth. Expressions use eye shape only (dots, closed lines `– –`, happy arcs `^ ^`).
- **Accessories:** one small, simple accessory per character (hat, bow, scarf) in a contrasting palette colour.
- **Ground shadow:** every character and floating object has a soft oval `shadow` underneath (about 70 % of its width, 2–3 px high).
- **Original designs only.** Do not copy existing mascots or brand characters.

### Animation

- **Idle:** 2–4 frames, gentle bob of 1 px up/down, ~4 fps. Shadow shrinks slightly when the body rises.
- **Walk:** 4 frames, legs alternate, ~8 fps.
- **Happy/jump:** squash (wider, 1 px lower) → stretch (taller) → land with a little squash. Short and bouncy.
- Movement is snappy but never fast. No screen shake, no flashing.

## 6. Props & Collectibles

- Chunky, max. 3–4 colours each, 1 px darker outline.
- **Gold items** use horizontal stripes of `gold` / `gold-dark` (like stacked coins or a striped bar).
- Collectibles gently float (1–2 px up/down, slow) and have a ground shadow.
- On collect: tiny pop (scale up 1 frame), 3–5 sparkle pixels in `gold` / `paper-white`, then disappear.

## 7. Typography

Two monospace fonts, both from Google Fonts (bundled locally, no runtime download):

| Role                            | Font                             | Notes                              |
| ------------------------------- | -------------------------------- | ---------------------------------- |
| Speech cards, titles, big words | **"VT323"** (or "Courier Prime") | typewriter feel, large, mixed case |
| Labels, buttons, small UI       | **"IBM Plex Mono"**, 500 weight  | UPPERCASE, letter-spacing `0.08em` |

- Text colour is always `ink` on `cream`/`paper-white`, or `cream` on dark overlays.
- **Typewriter effect:** speech text appears letter by letter (~30 ms per character) with a soft click sound.
- Keep words short and large – the player is a child. Use icons next to words where possible.

## 8. UI Elements

- **Label pill:** `paper-white` background, 1 px `ink` outline, rounded corners (4 px at screen scale), uppercase IBM Plex Mono, small padding. Sits on the floor area.
- **Speech card:** `cream` rectangle with 2 px `ink` outline, a folded corner (top right) and a small `cream` stand/base underneath, like a sign on a little pedestal.
- **Caption/overlay box:** dark semi-transparent (`#2a2230e6`), rounded corners, `cream` monospace text, centred at the bottom of the frame.
- **Buttons:** look like label pills, but bigger. Hover: lift 1 px and darken outline. Press: move down 1 px. Minimum touch target **48 × 48 px** at screen scale.
- No HUD clutter: show only what the child needs (e.g. collected gold count with an icon).

## 9. Math, Shop & Wardrobe Screens

### Math tasks on stage

- The task appears on the **speech card** (typewriter effect), large VT323 text, e.g. `7 · 8 = ?`. Use `·` for multiply and `:` for divide (German school notation).
- The **number pad** sits on the wooden floor area: 3 × 4 grid of `cream` keys with `ink` outline, digits in VT323, plus `⌫` and a wider `OK` key in `gold`.
- The typed answer shows in a white box on the speech card base.
- **Written calculation grid:** a `cream` card with a faint squared-paper pattern (`page-grid` lines, 1 px). Digits sit in squares, carry boxes are smaller and above the line, the result line is a 1 px `ink` rule. Active square has a blinking `gold` outline (slow, ~1 s cycle).
- **Correct:** coins arc from the card into the coin counter (top right), small hearts rise from below the stage, pet jumps.
- **Wrong:** the card wiggles gently (2 px left/right, 2 times), then a hint card slides in. Never red flashes – use `accent-blue` for hint highlights.

### Einmaleins-Training

- Speed modes use a calmer, cleaner stage: curtains open, only the character, pet and the task card. **No extra decoration that distracts.**
- Timer: a small pixel **sand-timer** next to the counter, sand in `gold`. No numbers counting down in big red, no ticking sound.
- Turbo-Duell: a slim wooden track at the top; her character and a semi-transparent "ghost" pet run along it.
- Progress grid: 10 × 10 squares on a `cream` card, cell colours `cream` (not yet) → `sky` (practised) → `gold` (auswendig). Row/column headers 1–10 in VT323.
- Row badges: round pixel medals (`gold` with `gold-dark` rim) with the row number, displayed on a wooden trophy shelf.

### Name entry

- On-screen keyboard as `cream` keys with `ink` outline in German QWERTZ layout incl. Ä Ö Ü ß; wide `LEERTASTE`, `⌫` and a `gold` `FERTIG` key.
- The name being typed appears on a big label pill above the character's (or pet's) head while typing.
- Name tag on stage: small `paper-white` label pill with IBM Plex Mono, floating 3 px above the head.

### Character

- Original pixel girl, **18–24 px tall** at native resolution, slightly larger head than body (cute proportions).
- Built in layers: body/face → outfit → hair → accessory. Each layer must line up on the same pixel grid.
- Hair styles must be clearly distinguishable in silhouette (ponytail, braids, bob, curls, buns).

### Pets

- **10–16 px**, round and simple, 2–3 colours plus outline, dot eyes, blush pixels (`hero` at low opacity or a soft pink `#f2a0a8`) optional.
- Idle: small breathing bob. Happy: hop + a 5 px pixel heart above the head.

### Shop & wardrobe

- Same stage, but the curtains are partly open and a **wooden shelf / clothes rack** stands on the floor.
- Items are shown on **cream cards with a 1 px ink outline**: pixel preview on top, name (IBM Plex Mono, uppercase) and price with a coin icon below.
- Category tabs are label pills along the top; the active tab is `gold`.
- Not affordable yet: card stays fully visible (no greying out), the price shows "Noch 40" in `ink` – it should look like a goal, not a locked door.
- **Wish bar:** a slim bar at the top of the stage, `wood-dark` frame, `gold` fill, small pixel picture of the wished item at the right end.
- Purchase: pixel confetti in `gold`, `cream`, `accent-blue`, `#f2a0a8`, falling slowly for ~1 s.

### Extra colours for items

Items (dresses, hair, pets) may use these extra colours in addition to section 3, always with hard shading:

| Token        | Hex                                        | Use                     |
| ------------ | ------------------------------------------ | ----------------------- |
| `rose`       | `#f2a0a8`                                  | dresses, blush, bows    |
| `rose-dark`  | `#c86f7e`                                  | shading                 |
| `mint`       | `#9fd8c0`                                  | dresses, pets           |
| `mint-dark`  | `#5fa88e`                                  | shading                 |
| `sky`        | `#a8cdf0`                                  | dresses, unicorn, water |
| `lilac`      | `#c9a8e8`                                  | dresses, magical items  |
| `hair-brown` | `#6b4226`                                  | hair                    |
| `hair-blond` | `#e8c46a`                                  | hair                    |
| `hair-black` | `#2b2228`                                  | hair                    |
| `hair-red`   | `#c4552e`                                  | hair                    |
| `skin-1…4`   | `#f6d3b8`, `#e8b48f`, `#c68a5e`, `#8d5a3b` | character skin tones    |

## 9a. Village, Wild Area & Battles

Look and feel of a classic **2D handheld monster-RPG** (top-down village, separate battle screen) – but with this guide's cozy palette and calm animations. Genre inspiration only: no copied sprites, UI frames, fonts or sounds.

### Village & wild area

- **Top-down 3/4 view** on a **16 × 16 px tile grid** (180 px = 11¼ tiles wide; the map may scroll vertically).
- Huts: chunky, 2–3 tiles wide, with a clearly visible door, a roof colour per hut and a **hanging sign with an icon** (coin = Laden, paw = Tierheim, 1×1 = Dojo, mask = Theater, book = Bibliothek). Kids recognise the icon before the word.
- Paths in `path-light` with a `path-dark` edge, grass in 2–3 green steps with a few flower pixels (`rose`, `cream`, `gold`).
- Her character and active pet walk on the grid; a tap target shows a small `gold` sparkle where she walks to.
- Wild creatures wander slowly in their area and bob idle like pets. A small `paper-white` pill with their level floats above them.
- Doors: a 1-tile `wood-dark` doorway; entering fades through `ink` for ~200 ms (a fade, not a flash).

### Battle screen (portrait, 180 × 360)

```
┌────────────────────────┐
│ ┌ FLAUSCHI  Lv4 ┐      │  creature info box (top left)
│ │ ███████░░  HP │ (o)  │  wild creature on a grass platform (top right)
│ └───────────────┘ ═══  │
│  ═══                   │
│  (pet)  ┌ MIMI  Lv3 ┐  │  her pet on a platform (bottom left)
│         │ █████░ HP │  │  pet info box (bottom right)
│         └───────────┘  │
├────────────────────────┤  y ≈ 180
│   7 · 8 = [ 5_ ]       │  task box: cream card, VT323
│ ▓▓▓▓▓▓▓▓▓▓░░░░░        │  time bar
├────────────────────────┤
│   number pad (3 × 4)   │  same position as everywhere else
└────────────────────────┘
```

- Background: soft sky (`sky`) above, grass area below; platforms are flat `grass-dark` ovals with a 1 px darker rim.
- **Info boxes:** `cream` with 2 px `ink` outline and a small notch, name uppercase IBM Plex Mono, level in VT323.
- **HP bars:** `wood-dark` frame, fill `mint` → `gold` (under 50 %) → `rose` (under 20 %). Never red. HP drains smoothly in whole pixels.
- **Time bar:** below the task, `wood-dark` frame, `gold` fill shrinking from right to left. No numbers, no ticking, no colour change to red – the last 25 % may gently pulse the bar outline (slow, ~1 s cycle).
- **Attacks:** short and bouncy (≤ 400 ms total): the attacker hops forward 4 px, a pixel effect flies across (stars, leaves, bubbles in palette colours), the target wiggles 2 px. No screen shake, no flashing.
- "Volltreffer!": a bigger pixel star burst in `gold` and `paper-white`.
- Defeat: the pet curls up with closed eyes (`– –`) and a small "z" floats up; the caption box shows the nap message. Nothing dramatic.
- Battle intro: the creature slides in from the right, her pet from the left (~300 ms). No flashing transition.

### Extra colours for the world

| Token         | Hex       | Use                        |
| ------------- | --------- | -------------------------- |
| `grass-light` | `#a8d68a` | grass highlights           |
| `grass-mid`   | `#7fb86a` | main grass                 |
| `grass-dark`  | `#5a8f4e` | grass shading, platforms   |
| `path-light`  | `#ecd9a8` | paths, sand                |
| `path-dark`   | `#c9ac72` | path edges                 |
| `stone`       | `#b8b2a8` | walls, rocks, Kristallberg |
| `stone-dark`  | `#8a837a` | stone shading              |

Water uses `sky` with `accent-blue` ripples. Roofs use existing tokens (`rose-dark`, `curtain-mid`, `wood-dark`, `mint-dark`, `lilac`).

## 10. Sound (Style)

- Soft, short, friendly sounds: plucks, little chimes, wooden "tock" sounds. 8-bit is OK if it's gentle.
- No harsh buzzers for mistakes. Use a soft "boop" and let the child try again.
- Optional quiet background music loop. Always provide a mute button.

## 11. Do / Don't

| ✅ Do                             | ❌ Don't                                                                                 |
| --------------------------------- | ---------------------------------------------------------------------------------------- |
| Hard pixel edges, integer scaling | Blurry scaling, gradients, glow effects                                                  |
| Limited palette from section 3    | Neon or highly saturated colours                                                         |
| Small cute characters, big world  | Large, detailed or scary characters                                                      |
| Calm, gentle animations           | Screen shake, flashing, fast strobing                                                    |
| Short words, big text, icons      | Long sentences, small text                                                               |
| Positive feedback for everything  | Punishing failure, timers that stress (battle timers: adaptive and calm-looking, see 9a) |
