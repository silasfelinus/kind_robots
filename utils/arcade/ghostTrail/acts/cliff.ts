// /utils/arcade/ghostTrail/acts/cliff.ts
//
// THE CLIFF ROAD, Stage 4's vertical act (between THE CANOPY and THE AERIE): the trail runs out
// against the canyon wall, and the only way on to the crags is straight up it, in the storm. The
// view climbs with Zuzu (the game's vertical camera), close to four screens from the canyon floor
// to the rim, over the drop: crumbling rock stairs, stone landings where the wind's creatures wait,
// rope lifts, and the pass's signature, columns of rising air that carry him up the sheer faces.
// Lightning keeps time on the open landings: the sky darkens over a column before it strikes.
//
// Like THE BELL STAIR (acts/tower.ts), the canyon floor is only at the start; everything above is
// floating rock (Block with `y`), whose tops are walkable and whose faces are solid. Stair treads
// rise 36 px with 16 px gaps, no gap to or from a landing is wider than 30 px, and each rope lift
// tops out a few px above its landing. The wind columns (lift 0.26, under gravity's 0.3) run up the
// faces of walls about 110 px tall: jump into the column at the wall's foot and it carries him up
// the face and over the top. A fall is a fall, so every landing is a checkpoint, and no lightning
// column stands where a jump, a lift or the wind sets him down.

import type { Act, Block } from '../world'

/** A floating slab of the canyon wall: x is its left edge, top its walkable top. */
const slab = (
  x: number,
  top: number,
  w: number,
  h = 14,
  look: Block['look'] = 'stone',
): Block => ({ x, y: top, w, h, look })

/** A flight of crumbling rock treads rising to the right: `n` from (x, top), each 36 up and 64 on. */
const stair = (x: number, top: number, n: number, w = 48): Block[] =>
  Array.from({ length: n }, (_, i) =>
    slab(x + i * 64, top - i * 36, w, 12, 'rock'),
  )

export const CLIFF_ROAD: Act = {
  id: 's4cliff',
  stage: 4,
  act: 3,
  stageName: 'STORM CROW PASS',
  actName: 'THE CLIFF ROAD',
  theme: 'stormpass',
  vertical: true,
  length: 3060,
  // Only the canyon floor is solid ground; above it is the drop.
  ground: [[0, 400]],
  ledges: [],
  blocks: [
    // Up off the canyon floor to the first landing.
    ...stair(424, 172, 3),
    slab(616, 64, 180, 16),
    // The first wall: its wind runs up the face from the first landing; its top is the second.
    slab(796, -46, 244, 110),
    // The third landing, at the top of the first rope lift.
    slab(1084, -152, 220, 16),
    // The fourth, across the windy gulf.
    slab(1450, -282, 210, 16),
    ...stair(1684, -318, 3),
    // The fifth landing, at the foot of the second wall, and the wall (the sixth landing on top).
    slab(1876, -426, 156, 16),
    slab(2032, -536, 268, 110),
    // The crow's ledge over the sixth landing: a standing jump up, off the road.
    slab(2150, -580, 44, 12, 'rock'),
    // The seventh landing, at the top of the second rope lift, and the last stair to the rim.
    slab(2344, -642, 220, 16),
    ...stair(2588, -678, 2),
    slab(2716, -750, 420, 24),
  ],
  movers: [
    // The first rope lift, off the end of the wall.
    { x: 1044, y: -46, w: 36, dx: 0, dy: -112, period: 300, look: 'lift' },
    // The second, off the end of the second wall.
    {
      x: 2304,
      y: -536,
      w: 36,
      dx: 0,
      dy: -112,
      period: 300,
      phase: 0.5,
      look: 'lift',
    },
  ],
  updrafts: [
    // Up the face of the first wall.
    { x: 736, w: 60, top: -62, lift: 0.26 },
    // Across the gulf between the third landing and the fourth.
    { x: 1304, w: 146, top: -300, lift: 0.26 },
    // Up the face of the second wall.
    { x: 1972, w: 60, top: -552, lift: 0.26 },
  ],
  hazards: [
    // On the open landings, never where a jump, a lift or the wind sets him down.
    { x: 950, w: 40, kind: 'lightning', period: 210, on: 16 },
    { x: 1566, w: 40, kind: 'lightning', period: 240, on: 16 },
    { x: 2214, w: 40, kind: 'lightning', period: 190, on: 16 },
    { x: 2470, w: 40, kind: 'lightning', period: 230, on: 16 },
    { x: 2880, w: 44, kind: 'lightning', period: 200, on: 18 },
  ],
  crates: [
    { x: 220, holds: 'poncho' },
    { x: 330, holds: 'gear' },
  ],
  encounters: [
    {
      id: 'canyon-floor',
      at: 120,
      squad: [
        { kind: 'crow', x: 440, y: 120 },
        { kind: 'crow', x: 520, y: 90, delay: 50 },
      ],
    },
    {
      id: 'first-landing',
      at: 600,
      squad: [{ kind: 'wraith', x: 900, y: 20 }],
    },
    {
      id: 'wall-top',
      at: 820,
      title: 'THE STORM BREAKS',
      squad: [
        { kind: 'crow', x: 1080, y: -90 },
        { kind: 'crow', x: 1120, y: -120, delay: 60, drops: 'gear' },
      ],
    },
    {
      id: 'lift-harpy',
      at: 1090,
      squad: [{ kind: 'harpy', x: 1260, y: -230 }],
    },
    {
      id: 'gulf-wind',
      at: 1240,
      squad: [
        { kind: 'wraith', x: 1500, y: -250 },
        { kind: 'crow', x: 1560, y: -320, delay: 70 },
      ],
    },
    {
      id: 'fourth-landing',
      at: 1470,
      squad: [
        { kind: 'gunslinger', x: 1640, y: -282 },
        { kind: 'harpy', x: 1600, y: -360, delay: 40, drops: 'heart' },
      ],
    },
    {
      id: 'stair-crows',
      at: 1690,
      squad: [
        { kind: 'crow', x: 1940, y: -420 },
        { kind: 'crow', x: 1990, y: -460, delay: 50 },
      ],
    },
    {
      id: 'second-wall',
      at: 2060,
      title: 'THE HARPY ROOST',
      squad: [
        { kind: 'harpy', x: 2230, y: -620 },
        { kind: 'harpy', x: 2290, y: -600, delay: 60 },
        { kind: 'wraith', x: 2340, y: -580, delay: 120 },
      ],
    },
    {
      id: 'seventh-landing',
      at: 2350,
      squad: [
        { kind: 'gunslinger', x: 2530, y: -642 },
        { kind: 'crow', x: 2580, y: -720, delay: 40, drops: 'gear' },
      ],
    },
    {
      id: 'the-rim',
      at: 2740,
      lock: { from: 2700, to: 3060 },
      title: 'THE RIM',
      squad: [
        { kind: 'harpy', x: 2960, y: -830 },
        { kind: 'crow', x: 2990, y: -800, delay: 40 },
        { kind: 'gunslinger', x: 3010, y: -750, delay: 60 },
        { kind: 'harpy', x: 3020, y: -840, delay: 140, drops: 'poncho' },
      ],
    },
  ],
  checkpoints: [660, 860, 1130, 1480, 1900, 2096, 2384, 2760],
  secrets: [
    { id: 's4cliff-thunder-egg', x: 2172, y: -594, name: 'THE THUNDER EGG' },
  ],
  ambient: ['crow'],
  seconds: 300,
  intro: [
    'THE TRAIL RUNS OUT AT A CLIFF.',
    'RIDE THE WIND UP ITS FACE,',
    'AND WHERE THE SKY GOES DARK,',
    'STAND CLEAR: THE LIGHTNING FALLS.',
  ],
}
