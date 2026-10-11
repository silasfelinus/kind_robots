// /utils/arcade/ghostTrail/acts/tower.ts
//
// THE BELL STAIR, Stage 5's vertical act (Silas, 2026-10-11: "do we have a vertical level yet?"): the
// climb up the inside of the mission bell tower to the belfry where the Bell Heretic waits. The view
// climbs with Zuzu (the game's vertical camera), about three and a half screens from the tower floor
// to the bell walk, over a black void: stone stairs, landings where the bell's servants wait, bell
// lifts and a wind shaft. A fall is a fall, so every landing is a checkpoint.
//
// The tower floor is only at the door; everything above is floating stone (Block with `y`), whose
// tops are walkable and whose faces are solid. Stair treads rise 36 px with 16 px gaps, and no gap
// to or from a landing is wider than 30 px: an easy
// running jump; lifts top out a few px above their landing.

import type { Act, Block } from '../world'

/** A floating stone slab: x is its left edge, top its walkable top. */
const slab = (x: number, top: number, w: number, h = 14): Block => ({
  x,
  y: top,
  w,
  h,
  look: 'stone',
})

/** A flight of treads rising to the right: `n` treads from (x, top), each 36 up and 64 on. */
const stair = (x: number, top: number, n: number, w = 48): Block[] =>
  Array.from({ length: n }, (_, i) => slab(x + i * 64, top - i * 36, w, 12))

export const BELL_STAIR: Act = {
  id: 's5stair',
  stage: 5,
  act: 3,
  stageName: 'MISSION BELL TOWER',
  actName: 'THE BELL STAIR',
  theme: 'belltower',
  vertical: true,
  length: 3400,
  // Only the tower door is solid ground; above it is the void.
  ground: [[0, 380]],
  ledges: [],
  blocks: [
    // Up from the door to the first landing.
    ...stair(420, 172, 4),
    slab(690, 28, 200, 16),
    // The second landing, reached by the first bell lift.
    slab(932, -76, 200, 16),
    // A long flight to the gunslingers' landing.
    ...stair(1156, -112, 4),
    slab(1440, -256, 240, 16),
    // Above the wind shaft.
    slab(1780, -336, 200, 16),
    ...stair(2004, -372, 3),
    slab(2200, -480, 270, 18),
    // The bell walk at the top, and the bell's hidden ledge over it.
    slab(2530, -574, 980, 24),
    slab(3300, -612, 48, 12),
  ],
  movers: [
    // The first bell lift, from the first landing to the second.
    { x: 892, y: 28, w: 36, dx: 0, dy: -110, period: 260, look: 'lift' },
    // The last lift, up to the bell walk.
    {
      x: 2474,
      y: -480,
      w: 40,
      dx: 0,
      dy: -100,
      period: 240,
      phase: 0.5,
      look: 'bell',
    },
  ],
  updrafts: [
    // The wind shaft between the gunslingers' landing and the landing above it.
    { x: 1690, w: 80, top: -470, lift: 0.23 },
  ],
  crates: [{ x: 300, holds: 'poncho' }],
  encounters: [
    {
      id: 'first-landing',
      at: 640,
      title: 'THE TOWER WAKES',
      squad: [
        { kind: 'imp', x: 840, y: 28 },
        { kind: 'acolyte', x: 870, y: 28, delay: 40 },
      ],
    },
    {
      id: 'lift-crows',
      at: 900,
      squad: [
        { kind: 'crow', x: 1180, y: -40, delay: 20 },
        { kind: 'crow', x: 1240, y: -120, delay: 80, drops: 'gear' },
      ],
    },
    {
      id: 'second-landing',
      at: 980,
      squad: [{ kind: 'monk', x: 1120, y: -110 }],
    },
    {
      id: 'stair-imps',
      at: 1200,
      squad: [
        { kind: 'imp', x: 1308, y: -184 },
        { kind: 'imp', x: 1372, y: -220, delay: 30 },
      ],
    },
    {
      id: 'gunslingers',
      at: 1450,
      lock: { from: 1360, to: 1760 },
      title: 'THE BELL RINGERS',
      squad: [
        { kind: 'gunslinger', x: 1620, y: -256 },
        { kind: 'gunslinger', x: 1660, y: -256, delay: 60 },
        { kind: 'imp', x: 1560, y: -256, delay: 120, drops: 'heart' },
      ],
    },
    {
      id: 'shaft-wraith',
      at: 1700,
      squad: [{ kind: 'wraith', x: 2020, y: -400 }],
    },
    {
      id: 'upper-flight',
      at: 1850,
      // (Crows that cross, not a floater: a homing orb on a narrow tread is a trap, not a test.)
      squad: [
        { kind: 'crow', x: 2160, y: -430 },
        { kind: 'crow', x: 2240, y: -470, delay: 70 },
      ],
    },
    {
      id: 'belfry-door',
      at: 2260,
      lock: { from: 2190, to: 2590 },
      title: 'THE LAST LANDING',
      squad: [
        { kind: 'acolyte', x: 2440, y: -480 },
        { kind: 'imp', x: 2400, y: -480, delay: 30 },
        { kind: 'monk', x: 2380, y: -560, delay: 90 },
        { kind: 'imp', x: 2460, y: -480, delay: 150 },
      ],
    },
    {
      id: 'bell-walk',
      at: 2620,
      squad: [
        { kind: 'gunslinger', x: 2900, y: -574 },
        { kind: 'ghoul', x: 3060, y: -574, delay: 40 },
        { kind: 'crow', x: 3140, y: -650, delay: 90 },
      ],
    },
  ],
  checkpoints: [40, 760, 1040, 1560, 2350, 2700],
  secrets: [
    {
      id: 's5stair-bell-rope',
      x: 3324,
      y: -626,
      name: 'THE BELL ROPE',
    },
  ],
  ambient: ['crow'],
  seconds: 300,
  intro: [
    'THE STAIR WINDS UP INTO THE DARK.',
    'SOMEWHERE ABOVE, THE BELL TOLLS',
    'FOR NO ONE LIVING.',
  ],
}
