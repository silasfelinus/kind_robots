// /utils/arcade/ghostTrail/acts/stage5.ts
//
// Stage 5: Mission Bell Tower (conductor kr-arcade t-015..t-020, CAMPAIGN-BLUEPRINT.md). Three acts
// climbing the old mission toward the bell that wakes the dead: stairways of stepped stone, braziers
// whose coals burn on a beat, bell lifts and swinging bell beams on the high routes, and masonry
// ambushes that drop in from the broken tower. The Bell Heretic is felt before he is met: his crimson
// acolytes tend every brazier, and the bell tolls in every title card. The Belfry ends at his arena.
//
// The hidden relic of the stage, THE BELL ORDER, waits up the hardest optional climb in the Belfry.

import type { Act, Stage } from '../world'
import { fire, groundWith, room, steps } from './build56'

const NAME = 'MISSION BELL TOWER'

export const STAGE_5: Stage = {
  stage: 5,
  name: NAME,
  outro: [
    'THE HERETIC FALLS, BUT THE BELL',
    'TOLLS ON, NOT FROM ABOVE NOW',
    'BUT FROM BELOW. SOMETHING UNDER',
    'THE MISSION IS RINGING BACK.',
    'ZUZU FINDS THE HIDDEN STAIR.',
  ],
}

// --- Act 1: the mission steps -------------------------------------------------------------
// Teaches the stage: steps up and down, the first braziers (hop them on any beat), a lift to a
// cloister roof that skips the low braziers and pays for the detour, and a first falling-masonry
// ambush on the high plateau.
const missionSteps: Act = {
  id: 's5a1',
  stage: 5,
  act: 1,
  stageName: NAME,
  actName: 'THE MISSION STEPS',
  theme: 'belltower',
  length: 6600,
  ground: groundWith(6700, [
    [1420, 48],
    [4700, 50],
    [4880, 44],
  ]),
  ledges: [
    // The cloister roof, reached by the lift at 2900.
    { x: 2936, y: 140, w: 104 },
    { x: 3080, y: 132, w: 80 },
    { x: 3200, y: 140, w: 96 },
    { x: 3336, y: 128, w: 84 },
    { x: 3460, y: 140, w: 110 },
    // A perch above the high plateau: the relic.
    { x: 3962, y: 60, w: 40 },
  ],
  blocks: [
    ...steps(760, [16, 32, 48, 64], 40),
    { x: 920, w: 160, h: 80 },
    ...steps(1080, [56, 32, 16], 36),
    { x: 1300, w: 12, h: 16, look: 'grave' },
    { x: 2390, w: 24, h: 24 },
    ...steps(3700, [24, 48, 72, 96], 40),
    { x: 3860, w: 240, h: 112 },
    ...steps(4100, [80, 48, 16], 40),
    ...steps(5450, [20, 40], 40),
    { x: 5530, w: 70, h: 40, look: 'pillar' },
    { x: 6020, w: 12, h: 16, look: 'grave' },
  ],
  movers: [
    { x: 2900, y: 192, w: 40, dx: 0, dy: -58, period: 220, look: 'lift' },
  ],
  hazards: [
    fire(600, 28, 180, 90),
    fire(1560, 32, 200, 100),
    fire(1720, 32, 160, 80),
    fire(3060, 36, 220, 110),
    fire(3260, 36, 180, 90),
    fire(3460, 36, 240, 120),
    fire(5240, 30, 200, 100),
  ],
  crates: [
    { x: 300, holds: 'gear' },
    { x: 1840, holds: 'poncho' },
    { x: 2690, holds: 'gear' },
    { x: 3620, holds: 'nugget' },
    { x: 4480, holds: 'poncho' },
    { x: 5330, holds: 'gear' },
    { x: 6200, holds: 'nugget' },
  ],
  encounters: [
    {
      id: 'imps',
      at: 200,
      title: 'BELL IMPS',
      squad: [
        { kind: 'imp', x: 440 },
        { kind: 'imp', x: 530, delay: 40 },
      ],
    },
    {
      id: 'steps',
      at: 760,
      squad: [
        { kind: 'imp', x: 1000 },
        { kind: 'ghoul', x: 1060, delay: 30 },
      ],
    },
    {
      id: 'stair-foot',
      at: 1040,
      squad: [
        { kind: 'imp', x: 1250 },
        { kind: 'ghoul', x: 1370, delay: 40 },
      ],
    },
    {
      id: 'pit-crows',
      at: 1300,
      squad: [
        { kind: 'crow', x: 1540, y: 140 },
        { kind: 'crow', x: 1600, y: 120, delay: 30 },
      ],
    },
    {
      id: 'acolytes',
      at: 1600,
      title: 'CRIMSON ACOLYTES',
      squad: [
        { kind: 'acolyte', x: 1900 },
        { kind: 'acolyte', x: 2000, delay: 60 },
        { kind: 'crow', x: 1940, y: 120, delay: 90 },
      ],
    },
    {
      id: 'landing',
      at: 2300,
      lock: room(2240, 360),
      title: 'AMBUSH ON THE STAIR',
      squad: [
        { kind: 'imp', x: 2460 },
        { kind: 'imp', x: 2520, delay: 30 },
        { kind: 'gunslinger', x: 2560, delay: 60 },
        { kind: 'crow', x: 2580, y: 140, delay: 120, drops: 'gear' },
      ],
    },
    {
      id: 'cloister-roof',
      at: 2900,
      squad: [
        { kind: 'ghoul', x: 3240, drops: 'nugget' },
        { kind: 'imp', x: 3380, drops: 'gear' },
      ],
    },
    {
      id: 'cloister',
      at: 3000,
      title: 'THE CLOISTER',
      squad: [
        { kind: 'gunslinger', x: 3300, y: 208 },
        { kind: 'gunslinger', x: 3520, y: 208, delay: 80 },
      ],
    },
    {
      id: 'cloister-monk',
      at: 3320,
      squad: [{ kind: 'monk', x: 3600, y: 198 }],
    },
    {
      id: 'stair-acolyte',
      at: 3480,
      squad: [{ kind: 'acolyte', x: 3660, y: 208 }],
    },
    {
      id: 'masonry',
      at: 3760,
      title: 'FALLING MASONRY',
      squad: [
        { kind: 'crow', x: 3960, y: 50 },
        { kind: 'crow', x: 4030, y: 70, delay: 40 },
        { kind: 'imp', x: 4070, delay: 20 },
        { kind: 'monk', x: 4160, y: 150, delay: 90 },
      ],
    },
    {
      id: 'descent',
      at: 4160,
      squad: [
        { kind: 'ghoul', x: 4400 },
        { kind: 'crow', x: 4440, y: 120, delay: 30 },
      ],
    },
    {
      id: 'pit-run',
      at: 4600,
      title: 'GUNSMOKE',
      squad: [
        { kind: 'gunslinger', x: 4960 },
        { kind: 'ghoul', x: 5060, delay: 20 },
        { kind: 'gunslinger', x: 5160, delay: 60 },
      ],
    },
    {
      id: 'gate-crows',
      at: 5300,
      squad: [
        { kind: 'crow', x: 5540, y: 110 },
        { kind: 'crow', x: 5580, y: 140, delay: 24, drops: 'gear' },
      ],
    },
    {
      id: 'door',
      at: 5700,
      lock: room(5640, 340),
      title: 'THE MISSION DOOR',
      squad: [
        { kind: 'imp', x: 5800 },
        { kind: 'acolyte', x: 5880, y: 208, delay: 20 },
        { kind: 'imp', x: 5930, delay: 60 },
        { kind: 'crow', x: 5920, y: 120, delay: 100 },
        { kind: 'gunslinger', x: 5960, delay: 140 },
      ],
    },
    {
      id: 'last-acolytes',
      at: 6100,
      squad: [
        { kind: 'acolyte', x: 6360 },
        { kind: 'monk', x: 6420, y: 198, delay: 60 },
      ],
    },
  ],
  checkpoints: [40, 1210, 2160, 3360, 4560, 5620],
  secrets: [{ id: 's5a1-ledger', x: 3982, y: 46, name: 'THE PADRE LEDGER' }],
  ambient: ['crow'],
  seconds: 360,
  intro: [
    'A BELL RINGS ON THE MESA AT NIGHT.',
    'WITH EVERY TOLL, THE DEAD RISE.',
    'CRIMSON ROBES TEND THE BRAZIERS.',
    'ZUZU CLIMBS THE MISSION STEPS.',
  ],
}

// --- Act 2: the bell gallery -------------------------------------------------------------
// Inside the hollow tower. Bell beams swing over the pits on a high walk (optional, and it pays),
// lifts climb to a gallery over the brazier hall, and the broken roof drops crows and imps in two
// falling-masonry ambushes, the second one held on a high floor.
const bellGallery: Act = {
  id: 's5a2',
  stage: 5,
  act: 2,
  stageName: NAME,
  actName: 'THE BELL GALLERY',
  theme: 'belltower',
  length: 7200,
  ground: groundWith(7300, [
    [1040, 50],
    [1230, 48],
    [1460, 52],
    [4500, 50],
    [4700, 46],
  ]),
  ledges: [
    // The bell walk over the pits: two ledges up, then bell beams to the clapper perch.
    { x: 840, y: 170, w: 56 },
    { x: 912, y: 134, w: 60 },
    { x: 1170, y: 126, w: 60 },
    { x: 1420, y: 112, w: 70 },
    { x: 1660, y: 96, w: 50 },
    // Masonry ambush: the broken floor above the hall.
    { x: 2660, y: 150, w: 80 },
    { x: 2800, y: 140, w: 80 },
    // The high gallery over the brazier hall.
    { x: 3476, y: 132, w: 140 },
    { x: 3648, y: 92, w: 152 },
    { x: 3960, y: 100, w: 90 },
  ],
  blocks: [
    ...steps(1800, [16, 32, 48], 40),
    { x: 1920, w: 200, h: 56 },
    ...steps(2120, [40, 24], 36),
    { x: 4620, w: 12, h: 16, look: 'grave' },
    { x: 4880, w: 12, h: 16, look: 'grave' },
    ...steps(5300, [24, 48, 72], 40),
    { x: 5420, w: 300, h: 88 },
    ...steps(5720, [64, 40, 16], 36),
  ],
  movers: [
    { x: 990, y: 126, w: 36, dx: 130, dy: 0, period: 250, look: 'bell' },
    {
      x: 1250,
      y: 118,
      w: 36,
      dx: 120,
      dy: 0,
      period: 230,
      phase: 0.5,
      look: 'bell',
    },
    { x: 1510, y: 104, w: 36, dx: 110, dy: 0, period: 220, look: 'bell' },
    { x: 3440, y: 192, w: 40, dx: 0, dy: -66, period: 240, look: 'lift' },
    {
      x: 3612,
      y: 134,
      w: 40,
      dx: 0,
      dy: -48,
      period: 200,
      phase: 0.25,
      look: 'lift',
    },
    { x: 3812, y: 96, w: 36, dx: 100, dy: 0, period: 220, look: 'bell' },
  ],
  hazards: [
    fire(560, 30, 160, 80),
    fire(1320, 30, 200, 100),
    fire(1740, 30, 180, 90),
    fire(3500, 34, 200, 100),
    fire(3640, 34, 150, 75),
    fire(3780, 34, 200, 100),
    fire(3920, 34, 150, 75),
    fire(6400, 30, 200, 100),
    fire(6860, 30, 160, 80),
  ],
  crates: [
    { x: 260, holds: 'gear' },
    { x: 2300, holds: 'poncho' },
    { x: 3010, holds: 'gear' },
    { x: 4420, holds: 'nugget' },
    { x: 5160, holds: 'poncho' },
    { x: 6000, holds: 'gear' },
    { x: 6700, holds: 'nugget' },
  ],
  encounters: [
    {
      id: 'gallery-imps',
      at: 200,
      title: 'THE BELL GALLERY',
      squad: [
        { kind: 'imp', x: 420 },
        { kind: 'crow', x: 520, y: 130, delay: 30 },
      ],
    },
    {
      id: 'hall-gunslinger',
      at: 600,
      squad: [{ kind: 'gunslinger', x: 800, y: 208 }],
    },
    {
      id: 'bell-walk',
      at: 980,
      title: 'FALLING MASONRY',
      squad: [
        { kind: 'crow', x: 1160, y: 40 },
        { kind: 'crow', x: 1230, y: 60, delay: 30 },
        { kind: 'crow', x: 1300, y: 80, delay: 60 },
      ],
    },
    {
      id: 'bell-perch',
      at: 1180,
      squad: [
        { kind: 'ghoul', x: 1455, drops: 'heart' },
        { kind: 'gunslinger', x: 1360, y: 208, delay: 40 },
      ],
    },
    {
      id: 'stair-acolytes',
      at: 1640,
      squad: [
        { kind: 'acolyte', x: 2050 },
        { kind: 'monk', x: 2000, y: 150, delay: 40 },
      ],
    },
    {
      id: 'stair-foot',
      at: 2240,
      squad: [
        { kind: 'gunslinger', x: 2480 },
        { kind: 'crow', x: 2440, y: 110, delay: 30 },
      ],
    },
    {
      id: 'roof-falls',
      at: 2600,
      lock: room(2560, 360),
      title: 'FALLING MASONRY',
      squad: [
        { kind: 'crow', x: 2700, y: 40 },
        { kind: 'imp', x: 2700, delay: 10 },
        { kind: 'crow', x: 2780, y: 50, delay: 30 },
        { kind: 'imp', x: 2840, delay: 50 },
        { kind: 'gunslinger', x: 2880, y: 208, delay: 120 },
        { kind: 'monk', x: 2850, y: 198, delay: 160 },
      ],
    },
    {
      id: 'brazier-hall',
      at: 3460,
      title: 'THE BRAZIER HALL',
      squad: [
        { kind: 'acolyte', x: 3710, y: 208 },
        { kind: 'acolyte', x: 3860, y: 208, delay: 60 },
      ],
    },
    {
      id: 'high-gallery',
      at: 3480,
      squad: [
        { kind: 'ghoul', x: 3720, drops: 'nugget' },
        { kind: 'imp', x: 3990, drops: 'gear' },
      ],
    },
    {
      id: 'hall-end',
      at: 3900,
      squad: [
        { kind: 'monk', x: 4120, y: 198 },
        { kind: 'crow', x: 4200, y: 120, delay: 40 },
      ],
    },
    {
      id: 'graves',
      at: 4400,
      title: 'GUNSMOKE',
      squad: [
        { kind: 'gunslinger', x: 4650 },
        { kind: 'gunslinger', x: 4770, delay: 40 },
        { kind: 'ghoul', x: 4990, delay: 60 },
      ],
    },
    {
      id: 'crows',
      at: 4800,
      squad: [
        { kind: 'crow', x: 5000, y: 120, drops: 'gear' },
        { kind: 'crow', x: 5060, y: 150, delay: 20 },
      ],
    },
    {
      id: 'high-floor',
      at: 5440,
      lock: room(5380, 340),
      title: 'THE ROOF GIVES WAY',
      squad: [
        { kind: 'imp', x: 5520 },
        { kind: 'crow', x: 5600, y: 50, delay: 20 },
        { kind: 'imp', x: 5620, delay: 40 },
        { kind: 'acolyte', x: 5680, delay: 90 },
        { kind: 'monk', x: 5690, y: 112, delay: 140 },
      ],
    },
    {
      id: 'descent',
      at: 5760,
      squad: [
        { kind: 'ghoul', x: 6040 },
        { kind: 'gunslinger', x: 6120, delay: 30 },
      ],
    },
    {
      id: 'bell-rope',
      at: 6300,
      squad: [
        { kind: 'monk', x: 6500, y: 198 },
        { kind: 'gunslinger', x: 6620, delay: 40 },
        { kind: 'crow', x: 6640, y: 100, delay: 80 },
      ],
    },
    {
      id: 'tower-top',
      at: 6800,
      squad: [
        { kind: 'imp', x: 6960 },
        { kind: 'acolyte', x: 7060, delay: 30 },
      ],
    },
  ],
  checkpoints: [40, 1190, 2400, 3370, 4340, 5250, 6160],
  secrets: [{ id: 's5a2-clapper', x: 1685, y: 82, name: 'A CRACKED CLAPPER' }],
  ambient: ['crow'],
  seconds: 390,
  intro: [
    'THE TOWER IS HOLLOW, HUNG WITH',
    'BELLS THAT SWING WITH NO WIND.',
    'FAR ABOVE, A CRIMSON HAND',
    'KEEPS THE TIME.',
  ],
}

// --- Act 3: the belfry ----------------------------------------------------------------------
// The top of the tower: long stairs, braziers that burn on one beat, two held ambushes, and the
// Bell Order relic at the end of a hard climb (lift, narrow ledges, two bell beams) above the coals.
// The poncho crate waits just before the Bell Heretic's arena.
const belfry: Act = {
  id: 's5a3',
  stage: 5,
  act: 3,
  stageName: NAME,
  actName: 'THE BELFRY',
  theme: 'belltower',
  length: 7800,
  ground: groundWith(7900, [[5720, 52]]),
  ledges: [
    // The Bell Order climb: narrow, high, over the coals.
    { x: 2828, y: 140, w: 40 },
    { x: 2900, y: 108, w: 24 },
    { x: 3100, y: 80, w: 26 },
    { x: 3270, y: 58, w: 26 },
  ],
  blocks: [
    ...steps(950, [20, 40, 60, 80, 100], 36),
    { x: 1130, w: 140, h: 116 },
    ...steps(1270, [96, 72, 48, 24], 36),
    ...steps(3800, [24, 48, 72, 96, 120], 32),
    { x: 3960, w: 300, h: 128 },
    ...steps(4260, [104, 80, 56, 32], 32),
    ...steps(7000, [24, 48], 40),
    { x: 7080, w: 120, h: 64 },
    ...steps(7200, [40, 16], 40),
  ],
  movers: [
    { x: 2800, y: 192, w: 32, dx: 0, dy: -58, period: 200, look: 'lift' },
    { x: 2950, y: 104, w: 32, dx: 90, dy: 0, period: 180, look: 'bell' },
    {
      x: 3150,
      y: 72,
      w: 30,
      dx: 80,
      dy: 0,
      period: 160,
      phase: 0.5,
      look: 'bell',
    },
  ],
  hazards: [
    fire(640, 30, 150, 75),
    fire(760, 30, 150, 75),
    fire(2870, 36, 200, 100),
    fire(3010, 36, 160, 80),
    fire(3150, 36, 200, 100),
    fire(4800, 32, 180, 90),
    fire(4900, 32, 180, 90),
    fire(5000, 32, 180, 90),
  ],
  crates: [
    { x: 300, holds: 'gear' },
    { x: 1800, holds: 'poncho' },
    { x: 2700, holds: 'nugget' },
    { x: 3640, holds: 'gear' },
    { x: 4600, holds: 'nugget' },
    { x: 5620, holds: 'gear' },
    { x: 6860, holds: 'gear' },
    { x: 7420, holds: 'poncho' },
  ],
  encounters: [
    {
      id: 'acolyte-gate',
      at: 200,
      title: 'THE CRIMSON STAIR',
      squad: [
        { kind: 'acolyte', x: 430 },
        { kind: 'acolyte', x: 530, delay: 40 },
      ],
    },
    {
      id: 'beat-crows',
      at: 560,
      squad: [
        { kind: 'crow', x: 820, y: 120 },
        { kind: 'crow', x: 880, y: 150, delay: 40 },
      ],
    },
    {
      id: 'stair-monk',
      at: 980,
      squad: [
        { kind: 'monk', x: 1240, y: 92 },
        { kind: 'imp', x: 1250, delay: 30 },
      ],
    },
    {
      id: 'stair-foot-acolyte',
      at: 1300,
      squad: [
        { kind: 'acolyte', x: 1560 },
        { kind: 'gunslinger', x: 1660, delay: 60 },
      ],
    },
    {
      id: 'stair-foot',
      at: 1520,
      squad: [
        { kind: 'ghoul', x: 1700 },
        { kind: 'crow', x: 1760, y: 110, delay: 30, drops: 'gear' },
      ],
    },
    {
      id: 'choir',
      at: 2000,
      lock: room(1940, 380),
      title: 'THE CRIMSON CHOIR',
      squad: [
        { kind: 'acolyte', x: 2120 },
        { kind: 'acolyte', x: 2240, delay: 30 },
        { kind: 'imp', x: 2180, delay: 60 },
        { kind: 'monk', x: 2280, y: 198, delay: 120 },
        { kind: 'crow', x: 2300, y: 100, delay: 160, drops: 'poncho' },
      ],
    },
    {
      id: 'order-crows',
      at: 2840,
      squad: [
        { kind: 'crow', x: 3050, y: 80 },
        { kind: 'crow', x: 3120, y: 60, delay: 40 },
      ],
    },
    {
      id: 'coal-walk',
      at: 3000,
      squad: [
        { kind: 'gunslinger', x: 3250, y: 208 },
        { kind: 'ghoul', x: 3330, y: 208, delay: 30 },
      ],
    },
    {
      id: 'stair-acolyte',
      at: 3500,
      squad: [
        { kind: 'acolyte', x: 3700 },
        { kind: 'imp', x: 3760, delay: 40 },
      ],
    },
    {
      id: 'masonry',
      at: 3980,
      lock: room(3900, 340),
      title: 'FALLING MASONRY',
      squad: [
        { kind: 'crow', x: 4140, y: 40 },
        { kind: 'imp', x: 4100, delay: 10 },
        { kind: 'crow', x: 4200, y: 60, delay: 30 },
        { kind: 'imp', x: 4200, delay: 50 },
        { kind: 'monk', x: 3940, y: 84, delay: 120 },
      ],
    },
    {
      id: 'beat',
      at: 4700,
      title: 'ON THE BEAT',
      squad: [
        { kind: 'acolyte', x: 5100 },
        { kind: 'monk', x: 5150, y: 198, delay: 60 },
      ],
    },
    {
      id: 'gunslingers',
      at: 5200,
      squad: [
        { kind: 'gunslinger', x: 5420 },
        { kind: 'gunslinger', x: 5500, delay: 40 },
      ],
    },
    {
      id: 'ringers',
      at: 5960,
      lock: room(5900, 380),
      title: 'THE BELL RINGERS',
      squad: [
        { kind: 'imp', x: 6040 },
        { kind: 'acolyte', x: 6120, delay: 10 },
        { kind: 'gunslinger', x: 6200, delay: 40 },
        { kind: 'crow', x: 6100, y: 120, delay: 80 },
        { kind: 'monk', x: 6240, y: 198, delay: 140 },
        { kind: 'ghoul', x: 6260, delay: 180 },
      ],
    },
    {
      id: 'last-stair',
      at: 6900,
      squad: [
        { kind: 'acolyte', x: 7340 },
        { kind: 'crow', x: 7200, y: 100, delay: 30 },
      ],
    },
    {
      id: 'toll',
      at: 7260,
      title: 'THE BELL TOLLS',
      squad: [
        { kind: 'crow', x: 7460, y: 110 },
        { kind: 'crow', x: 7500, y: 140, delay: 30 },
      ],
    },
  ],
  checkpoints: [40, 1440, 2400, 3550, 4700, 5860, 6580, 7300],
  secrets: [{ id: 's5a3-bell-order', x: 3283, y: 44, name: 'THE BELL ORDER' }],
  ambient: ['crow'],
  seconds: 420,
  boss: 'heretic',
  intro: [
    'THE BELFRY. EVERY STONE SHAKES',
    'WITH THE TOLL. THE BELL HERETIC',
    'WAITS BENEATH THE GREAT BELL,',
    'HIS HANDS RED ON THE ROPE.',
  ],
}

export const STAGE_5_ACTS: Act[] = [missionSteps, bellGallery, belfry]
