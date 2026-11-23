# Hopeful Hues world packs

Each world is one self-contained file, `worlds/<id>.js`, that calls
`HopefulHuesWorlds.register({...})`. The game derives regions, levels, story,
jewels, blockers, effects, music, map styling, quests, achievements, endings and
painted-art requests from these packs. `paradise.js` is the reference pack.

Worlds must feel genuinely different from each other: palette, jewel designs,
blocker metaphors, particle style, music, map and story voice. Keep everything
original (no existing franchise names, characters, logos or recognizable
designs) and all-ages: the players include kids aged 11 and 14. Hopeful,
queer-positive, kind. Gentle stakes. No lives, timers or purchases.

## File shape

```js
;(function (root) {
  'use strict'
  root.HopefulHuesWorlds.register({/* fields below */})
})(typeof globalThis !== 'undefined' ? globalThis : this)
```

Plain ES2019, no imports, no DOM access, no template literals that run code at
load beyond building strings. Strings only (no functions) except where noted.

## Fields

| field          | type       | notes                                                                                                                                                 |
| -------------- | ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`           | `[a-z]+`   | unique world id                                                                                                                                       |
| `order`        | number     | 1-9, card order                                                                                                                                       |
| `name`         | string     | world title                                                                                                                                           |
| `tagline`      | string     | one short line for the world card                                                                                                                     |
| `blurb`        | string     | 2-3 sentences for the world card                                                                                                                      |
| `hero`         | object     | see Hero                                                                                                                                              |
| `ui`           | object     | see UI                                                                                                                                                |
| `music`        | object     | `{ root: 48-67 (MIDI), mode, tempo: 70-130, timbre, meter: 3 or 4 }`                                                                                  |
| `effects`      | object     | `{ glyphs: [3-5 short unicode symbols], colors: [3-5 hex], label: 'petals' }` particles burst from cleared tiles                                      |
| `jewels`       | array of 6 | see Jewels                                                                                                                                            |
| `specials`     | object     | `{ comb: {name, text}, bomb: {name, text}, rainbow: {name, text} }` themed names for the 4-in-a-line sweeper, L/T blast and 5-in-a-line color clearer |
| `blockers`     | object     | see Blockers                                                                                                                                          |
| `regions`      | array of 3 | see Regions; region 3 is the finale region                                                                                                            |
| `ending`       | object     | `{ id: '[a-z]+' unique, title, text }` 2-4 sentences, warm, earned                                                                                    |
| `map`          | object     | `{ path: hex, dash: hex, node: 'circle'                                                                                                               | 'star' | 'heart' | 'diamond' | 'hex' | 'shell' }` |
| `quests`       | object     | `{ daily: [3], weekly: [2] }` see Quests                                                                                                              |
| `achievements` | array of 5 | see Achievements                                                                                                                                      |
| `prompts`      | object     | painted-art prompts, see Prompts                                                                                                                      |

`mode`: `major`, `minor`, `dorian`, `lydian`, `mixolydian`, `harmonic`.
`timbre`: `bell`, `chip`, `organ`, `lounge`, `musicbox`, `harp`, `accordion`, `synth`, `choir`.

### Hero

```js
hero: {
  id: '[a-z]+',            // unique; painted portrait lives at heroes/<id>.webp
  name, title,             // 'Superkate', 'Rainbow Hair Hero'
  pronouns,                // 'she/her', 'they/them', ...
  perk,                    // one of: rainbow-start, extra-moves, big-bombs, bloom,
                           // comb-start, bomb-start, gentle-gloom, score-boost, buddy-rescue
  perkName, perkText,      // themed name, one-sentence plain explanation
  cheer: [5 short exclamations in the hero's voice],
  epilogue,                // one sentence after the ending
  look,                    // one sentence physical description used for painted art
  portrait,                // inline SVG markup, viewBox 0 0 120 120, round-friendly bust
}
```

Perk meanings: rainbow-start (begins each level with a color-clearer), extra-moves
(+2 moves), big-bombs (5x5 blasts), bloom (big cascades give a move, twice per
level), comb-start (begins with two sweepers), bomb-start (begins with one blast
special), gentle-gloom (two-layer blockers start as one layer), score-boost
(+25% points), buddy-rescue (buddies are saved from the bottom two rows).
Each of the nine worlds uses a different perk.

### UI

```js
ui: { dark: false, bg: [3 hex for a vertical gradient], ink: hex, inkSoft: hex,
      card: 'rgba(...)' or hex with alpha, accent: hex, accent2: hex, cell: 'rgba(...)' }
```

Dark worlds set `dark: true` with light ink and translucent dark cards. Contrast
must stay readable (body text at least 4.5:1 on `card`).

### Jewels

Six objects, indexes 0-5 are the six match colors. They must be instantly
distinct by both color and silhouette at 40px.

```js
{ name: 'Rose Heart', glyph: '♥', main: hex, light: hex, dark: hex,
  art: '<path d="..." fill="url(#J)" stroke="{D}" stroke-width="3"/>...' }
```

`art` is SVG markup inside a `viewBox="0 0 100 100"` drawn roughly within 10..90.
Use `url(#J)` for the main glossy gradient fill, `{D}` for the dark color, `{L}`
for the light color, `{M}` for the main color. The renderer adds the gradient,
a white shine, special-tile overlays and the optional colorblind glyph. Keep each
`art` under ~600 characters and use simple, bold shapes.

### Blockers

```js
blockers: {
  gloom:  { name, text, color: hex, color2: hex },        // cell overlay cleared by matching on top (1-2 layers)
  tangle: { name, text, art: '<svg inner markup 0..100>' }, // fixed knot cleared by adjacent matches; use {D}/{L} if wanted
  buddy:  { name, text, art: '<svg inner markup 0..100>' }, // friendly character that must reach the bottom row
}
```

`text` is a one-sentence tutorial tip in the world's voice explaining the rule.

### Regions

```js
{ id: '[a-z]+' globally unique, name, blurb (2 sentences), sky: [2 hex], palette: [3 hex],
  motif: '<svg inner markup 0..100 using currentColor>',
  beats: [ { at: 1, title, text }, { at: 9, title, text }, { at: 18, title, text } ] }
```

Regions 1 and 2 have 18 levels (beats at 1, 9, 18). Region 3 is the finale with
19 levels (beats at 1, 10, 19). Beat text is 1-3 sentences; the last beat of
region 3 sets up the ending. The three regions together tell one arc.

### Quests

`{ id: '[a-z0-9-]+' unique, text, stat, target, reward }`. Daily rewards 25-45,
weekly 150-180. `stat` is one of `cleared`, `combs`, `bombs`, `rainbows`, `combos`,
`gloomCleared`, `tanglesCleared`, `buddiesRescued`, `bigCascades`, `wins`, `stars`,
`threeStars`, `color0`..`color5`. Quest progress only counts while playing this
world. Name the things in the world's own words.

### Achievements

Five objects `{ key, name, text }` with keys exactly `start` (first win in this
world), `middle` (finish region 2), `ending` (reach the ending), `stars` (3 stars
on 10 levels of this world) and `signature` (plus `stat` and `target`, for
example `{ key: 'signature', stat: 'tanglesCleared', target: 80, ... }`).

### Prompts

Painted art is rendered by the Kind Robots art queue (krea2). Write literal,
affirmative visual descriptions with no negations, no readable text, and describe
the hero exactly the same way each time (reuse `hero.look`). End each with the
world's style phrase.

```js
prompts: {
  style: 'world style phrase, e.g. lush tropical cutecore 2D hand-painted storybook illustration, unlettered surfaces',
  hero: 'character select portrait ...',
  key: 'wide world key art ...',
  map: 'wide top-down storybook map background with a winding path ...',
  regions: { '<regionId>': '...' },          // 3
  beats: { '<regionId>-<at>': '...' },        // 6, for the non-first beats (at 9/18 and 10/19)
  ending: '...',
}
```
