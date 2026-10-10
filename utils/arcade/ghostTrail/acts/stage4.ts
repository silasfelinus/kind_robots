// /utils/arcade/ghostTrail/acts/stage4.ts
//
// Stage 4: Storm Crow Pass (conductor kr-arcade t-015..t-020, CAMPAIGN-BLUEPRINT.md). The trail climbs
// a canyon where the wind runs up the walls. Columns of rising air (pale streaks) lift Zuzu while he
// is in the air inside them: jump in and he is carried up, over a wall too tall to climb or across a
// gulf too wide to jump. The wind (lift under gravity) always lets him settle again, so nobody hangs
// in a column for good. Rope lifts ride up cliffs and across chasms, topping out a little above
// their ledges. Harpies circle and dive at where he stands; an overhang or a cave roof
// turns the dive aside, so the rock is cover.
//
//   Act 1, THE SWITCHBACKS: the wind taught gently (a short gulf with the wind over all of it),
//     then a cliff to ride up, a lift, and a long gulf. The relic sits at the far end of a high
//     walkway above the canyon, reached from the top of the second switchback or by riding the
//     wind at its foot.
//   Act 2, THE CANOPY: boughs over a broken floor, a cave cache tucked under a cliff (the way in faces
//     back down the trail), a canopy shortcut over a field of pits and a hyena pack, a rope ferry, and
//     the Dust Devil waiting in the clearing at the end.
//   Act 3, THE AERIE: the high crags. Wider gulfs, a gondola between two crags, the nesting cliffs,
//     and the Storm-Crow Matriarch on the summit.
//
// Foes: crows, harpies, wind wraiths, hyenas, and a few gunslingers posted on ledges and clifftops.

import type { Act, Stage } from '../world'
import { groundWithPits } from './build34'

const STAGE_NAME = 'STORM CROW PASS'

export const STAGE_4: Stage = {
  stage: 4,
  name: STAGE_NAME,
  outro: [
    'THE MATRIARCH FALLS FROM THE SKY',
    'AND THE CROWS SCATTER ON THE WIND.',
    'BELOW THE PASS, IN THE VALLEY,',
    'THE MISSION BELL TOWER STANDS.',
    'IT IS RINGING.',
  ],
}

// --- Act 1: THE SWITCHBACKS --------------------------------------------------------------------

const S4A1_LENGTH = 6400

const s4a1: Act = {
  id: 's4a1',
  stage: 4,
  act: 1,
  stageName: STAGE_NAME,
  actName: 'THE SWITCHBACKS',
  theme: 'stormpass',
  length: S4A1_LENGTH,
  ground: groundWithPits(S4A1_LENGTH, [
    [820, 50],
    // The first gulf: the wind runs over all of it.
    [1000, 120],
    [2100, 54],
    // The long gulf: ride the wind across.
    [4500, 160],
    [5400, 50],
    [5800, 56],
  ]),
  // The high walkway above the canyon (and the relic), reached off the second switchback.
  ledges: [
    { x: 2740, y: 132, w: 70 },
    { x: 2840, y: 120, w: 70 },
    { x: 2940, y: 108, w: 70 },
    { x: 3040, y: 100, w: 60 },
    { x: 3130, y: 118, w: 60 },
  ],
  blocks: [
    // The first switchback.
    { x: 520, w: 80, h: 30, look: 'rock' },
    { x: 580, w: 120, h: 64, look: 'stone' },
    // The first overhang: shelter from the first harpy.
    { x: 1300, y: 150, w: 140, h: 20, look: 'stone' },
    // A cliff too tall to climb, with the wind running up its face.
    { x: 1700, w: 200, h: 96, look: 'stone' },
    // The second switchback, to a high shelf.
    { x: 2450, w: 60, h: 40, look: 'rock' },
    { x: 2510, w: 60, h: 76, look: 'stone' },
    { x: 2570, w: 130, h: 112, look: 'stone' },
    // Cover in the narrows.
    { x: 3560, y: 150, w: 90, h: 18, look: 'stone' },
    // The lift cliff.
    { x: 4100, w: 160, h: 104, look: 'stone' },
    // The second overhang, under the harpy roost.
    { x: 5000, y: 148, w: 160, h: 22, look: 'stone' },
    { x: 5600, w: 40, h: 24, look: 'rock' },
  ],
  movers: [
    // A rope lift up the face of the lift cliff.
    { x: 4060, y: 208, w: 36, dx: 0, dy: -112, period: 360, look: 'lift' },
  ],
  updrafts: [
    { x: 1000, w: 120, top: 60, lift: 0.26 },
    { x: 1640, w: 60, top: 96, lift: 0.26 },
    { x: 2700, w: 70, top: 96, lift: 0.26 },
    { x: 4500, w: 160, top: 60, lift: 0.26 },
  ],
  crates: [
    { x: 220, holds: 'gear' },
    { x: 930, holds: 'nugget' },
    { x: 1370, holds: 'poncho' },
    { x: 2300, holds: 'gear' },
    { x: 3380, holds: 'poncho' },
    { x: 4400, holds: 'gear' },
    { x: 5080, holds: 'poncho' },
    { x: 6000, holds: 'nugget' },
  ],
  encounters: [
    // Each kind alone first: a hyena, a harpy, a gunslinger, a wraith.
    { id: 'lone-hyena', at: 140, squad: [{ kind: 'hyena', x: 440 }] },
    {
      id: 'gulf-crows',
      at: 760,
      squad: [
        { kind: 'crow', x: 1060, y: 130 },
        { kind: 'crow', x: 1100, y: 160, delay: 40, drops: 'gear' },
      ],
    },
    {
      id: 'first-harpy',
      at: 1240,
      squad: [{ kind: 'harpy', x: 1500, y: 96 }],
    },
    // Posted on the clifftop, waiting for whoever rides the wind up.
    {
      id: 'cliff-gun',
      at: 1600,
      squad: [{ kind: 'gunslinger', x: 1860, y: 100 }],
    },
    {
      id: 'first-wraith',
      at: 1960,
      squad: [{ kind: 'wraith', x: 2260, y: 160 }],
    },
    {
      id: 'switchback',
      at: 2300,
      squad: [
        { kind: 'hyena', x: 2400 },
        { kind: 'crow', x: 2700, y: 110, delay: 30 },
        { kind: 'harpy', x: 2650, y: 70, delay: 60 },
      ],
    },
    {
      id: 'arch',
      at: 2760,
      squad: [
        { kind: 'gunslinger', x: 3070, y: 90 },
        { kind: 'hyena', x: 3000, y: 200, delay: 30 },
      ],
    },
    {
      id: 'canyon-pack',
      at: 3100,
      squad: [
        { kind: 'hyena', x: 3350 },
        { kind: 'hyena', x: 3400, delay: 30 },
        { kind: 'wraith', x: 3380, y: 150, delay: 60 },
      ],
    },
    {
      id: 'the-narrows',
      at: 3480,
      lock: { from: 3440, to: 3800 },
      title: 'THE NARROWS',
      squad: [
        { kind: 'hyena', x: 3700 },
        { kind: 'crow', x: 3650, y: 130, delay: 30 },
        { kind: 'hyena', x: 3760, delay: 80 },
        { kind: 'crow', x: 3790, y: 120, delay: 120, drops: 'poncho' },
        { kind: 'wraith', x: 3780, y: 150, delay: 160 },
      ],
    },
    {
      id: 'lift-crows',
      at: 3900,
      squad: [
        { kind: 'crow', x: 4150, y: 100 },
        { kind: 'harpy', x: 4200, y: 70, delay: 40 },
      ],
    },
    {
      id: 'cliff-top',
      at: 4150,
      squad: [{ kind: 'gunslinger', x: 4240, y: 96 }],
    },
    {
      id: 'gulf-wraiths',
      at: 4680,
      squad: [
        { kind: 'wraith', x: 4980, y: 140 },
        { kind: 'wraith', x: 5020, y: 170, delay: 50 },
      ],
    },
    {
      id: 'harpy-roost',
      at: 4940,
      squad: [
        { kind: 'harpy', x: 5150, y: 80 },
        { kind: 'harpy', x: 5220, y: 100, delay: 40 },
        { kind: 'hyena', x: 5300, delay: 60 },
      ],
    },
    {
      id: 'pass-mouth',
      at: 5480,
      squad: [
        { kind: 'hyena', x: 5700 },
        { kind: 'gunslinger', x: 5760, delay: 20 },
        { kind: 'crow', x: 5900, y: 130, delay: 40, drops: 'gear' },
      ],
    },
    {
      id: 'last-gust',
      at: 5900,
      squad: [
        { kind: 'wraith', x: 6200, y: 150 },
        { kind: 'harpy', x: 6250, y: 90, delay: 30 },
      ],
    },
  ],
  checkpoints: [2240, 4320],
  secrets: [
    { id: 's4a1-storm-feather', x: 3070, y: 86, name: 'THE STORM FEATHER' },
  ],
  ambient: ['crow'],
  seconds: 360,
  intro: [
    'THE TRAIL CLIMBS INTO THE STORM.',
    'THE WIND RUNS UP THE CANYON WALLS:',
    'JUMP INTO IT AND IT WILL LIFT YOU.',
    'WHEN HARPIES DIVE, GET UNDER ROCK.',
  ],
}

// --- Act 2: THE CANOPY -------------------------------------------------------------------------

const S4A2_LENGTH = 6600

const s4a2: Act = {
  id: 's4a2',
  stage: 4,
  act: 2,
  stageName: STAGE_NAME,
  actName: 'THE CANOPY',
  theme: 'stormpass',
  length: S4A2_LENGTH,
  ground: groundWithPits(S4A2_LENGTH, [
    // The rope ferry's gulf.
    [900, 150],
    // The broken floor under the canopy shortcut.
    [2480, 54],
    [2620, 56],
    [2760, 50],
    [2890, 56],
    // The gulf past the stump (a column), and the run to the clearing.
    [3960, 140],
    [4700, 52],
    [5000, 56],
  ]),
  ledges: [
    // Low boughs at the trailhead.
    { x: 600, y: 166, w: 60 },
    { x: 700, y: 130, w: 70 },
    // The gunman's bough.
    { x: 1340, y: 128, w: 100 },
    // The canopy shortcut, from the lift top over the broken floor.
    { x: 2398, y: 104, w: 96 },
    { x: 2536, y: 90, w: 80 },
    { x: 2660, y: 96, w: 90 },
    { x: 2796, y: 92, w: 80 },
    { x: 2920, y: 100, w: 100 },
    // The storm gunman's bough.
    { x: 5280, y: 150, w: 90 },
  ],
  blocks: [
    { x: 500, w: 90, h: 26, look: 'rock' },
    // The cave cache: a west wall and a roof; the way in faces east, back down the trail.
    { x: 1600, w: 40, h: 100, look: 'stone' },
    { x: 1640, y: 108, w: 160, h: 30, look: 'stone' },
    // Cover in the clearing.
    { x: 3260, y: 150, w: 80, h: 18, look: 'stone' },
    // The stump, its wind, and the gulf beyond.
    { x: 3800, w: 120, h: 90, look: 'stone' },
    // The wall and its lift.
    { x: 4400, w: 100, h: 110, look: 'stone' },
    { x: 5600, y: 150, w: 90, h: 18, look: 'stone' },
  ],
  movers: [
    // The rope ferry across the first gulf.
    { x: 900, y: 208, w: 44, dx: 106, dy: 0, period: 300, look: 'lift' },
    // Up to the canopy (step on as it passes the floor, or walk under it).
    {
      x: 2360,
      y: 208,
      w: 36,
      dx: 0,
      dy: -112,
      period: 330,
      phase: 0.25,
      look: 'lift',
    },
    // Up the wall.
    { x: 4360, y: 208, w: 36, dx: 0, dy: -118, period: 320, look: 'lift' },
  ],
  updrafts: [
    // Over the cave cache's wall.
    { x: 1540, w: 60, top: 90, lift: 0.26 },
    // Up the stump.
    { x: 3740, w: 60, top: 100, lift: 0.26 },
    // Across the gulf.
    { x: 3960, w: 140, top: 60, lift: 0.26 },
  ],
  crates: [
    { x: 260, holds: 'gear' },
    { x: 1200, holds: 'nugget' },
    // The cache, inside the cave.
    { x: 1690, holds: 'gear' },
    { x: 1770, holds: 'poncho' },
    { x: 2200, holds: 'gear' },
    { x: 3120, holds: 'poncho' },
    { x: 4200, holds: 'gear' },
    { x: 5450, holds: 'poncho' },
    { x: 6150, holds: 'nugget' },
  ],
  encounters: [
    {
      id: 'thicket',
      at: 120,
      squad: [
        { kind: 'hyena', x: 400 },
        { kind: 'crow', x: 450, y: 140, delay: 40 },
      ],
    },
    {
      id: 'ferry-crows',
      at: 760,
      squad: [
        { kind: 'crow', x: 1060, y: 150 },
        { kind: 'wraith', x: 1120, y: 140, delay: 60 },
      ],
    },
    {
      id: 'canopy-gun',
      at: 1100,
      squad: [{ kind: 'gunslinger', x: 1400, y: 120 }],
    },
    {
      id: 'cave-harpy',
      at: 1650,
      squad: [{ kind: 'harpy', x: 1940, y: 80 }],
    },
    {
      id: 'wraith-pair',
      at: 2000,
      squad: [
        { kind: 'wraith', x: 2300, y: 150 },
        { kind: 'wraith', x: 2340, y: 180, delay: 40 },
      ],
    },
    {
      id: 'deadfall',
      at: 2420,
      squad: [
        { kind: 'hyena', x: 2710 },
        { kind: 'hyena', x: 2850, delay: 40 },
        { kind: 'gunslinger', x: 2990, y: 200, delay: 20 },
      ],
    },
    {
      id: 'canopy-crows',
      at: 2600,
      squad: [
        { kind: 'crow', x: 2900, y: 90 },
        { kind: 'crow', x: 2950, y: 110, delay: 30, drops: 'gear' },
      ],
    },
    {
      id: 'the-clearing',
      at: 3200,
      lock: { from: 3150, to: 3500 },
      title: 'THE CLEARING',
      squad: [
        { kind: 'hyena', x: 3350 },
        { kind: 'crow', x: 3300, y: 120, delay: 30 },
        { kind: 'hyena', x: 3420, delay: 70 },
        { kind: 'wraith', x: 3480, y: 150, delay: 110 },
        { kind: 'crow', x: 3460, y: 120, delay: 150, drops: 'poncho' },
      ],
    },
    {
      id: 'stump-gun',
      at: 3700,
      squad: [{ kind: 'gunslinger', x: 4180, y: 200 }],
    },
    {
      id: 'gulf-wraith',
      at: 4110,
      squad: [
        { kind: 'wraith', x: 4400, y: 140 },
        { kind: 'harpy', x: 4300, y: 70, delay: 30 },
      ],
    },
    {
      id: 'wall-harpies',
      at: 4520,
      squad: [
        { kind: 'harpy', x: 4760, y: 80 },
        { kind: 'harpy', x: 4830, y: 96, delay: 40 },
      ],
    },
    {
      id: 'hyena-run',
      at: 4800,
      squad: [
        { kind: 'hyena', x: 5080 },
        { kind: 'hyena', x: 5120, delay: 20 },
        { kind: 'hyena', x: 5160, delay: 40 },
      ],
    },
    {
      id: 'storm-gun',
      at: 5100,
      squad: [
        { kind: 'gunslinger', x: 5320, y: 140 },
        { kind: 'crow', x: 5400, y: 120, delay: 40 },
      ],
    },
    {
      id: 'last-trees',
      at: 5450,
      squad: [
        { kind: 'wraith', x: 5750, y: 150 },
        { kind: 'hyena', x: 5720, delay: 40 },
        { kind: 'harpy', x: 5800, y: 80, delay: 60 },
      ],
    },
    {
      id: 'before-the-devil',
      at: 5800,
      squad: [
        { kind: 'crow', x: 6050, y: 120, drops: 'poncho' },
        { kind: 'crow', x: 6080, y: 150, delay: 30 },
      ],
    },
  ],
  checkpoints: [2240, 5150],
  secrets: [
    { id: 's4a2-miners-lamp', x: 1700, y: 192, name: 'THE MINERS LAMP' },
  ],
  ambient: ['crow', 'wraith'],
  seconds: 390,
  boss: 'devil',
  intro: [
    'THE PASS RUNS UNDER OLD TREES',
    'AND THE BOUGHS MAKE A HIGH ROAD.',
    'SOMETHING WHIRLS IN THE CLEARING',
    'AT THE END OF THE WOOD.',
  ],
}

// --- Act 3: THE AERIE --------------------------------------------------------------------------

const S4A3_LENGTH = 6000

const s4a3: Act = {
  id: 's4a3',
  stage: 4,
  act: 3,
  stageName: STAGE_NAME,
  actName: 'THE AERIE',
  theme: 'stormpass',
  length: S4A3_LENGTH,
  ground: groundWithPits(S4A3_LENGTH, [
    [520, 180],
    [1400, 200],
    // The gondola gulf between the two crags.
    [2200, 240],
    [3900, 220],
    [4700, 56],
    [5100, 54],
  ]),
  ledges: [
    // The quill perch: take a running jump into the foot of the wind.
    { x: 3680, y: 104, w: 60 },
  ],
  blocks: [
    // Crag stairs.
    { x: 800, w: 60, h: 36, look: 'rock' },
    { x: 860, w: 60, h: 72, look: 'stone' },
    { x: 920, w: 140, h: 108, look: 'stone' },
    { x: 1200, y: 150, w: 120, h: 20, look: 'stone' },
    // The first crag (a lift up its face) and the second, across the gondola gulf.
    { x: 2000, w: 200, h: 104, look: 'stone' },
    { x: 2440, w: 120, h: 104, look: 'stone' },
    // The nesting cliffs: roofs to dive under.
    { x: 2700, y: 150, w: 100, h: 18, look: 'stone' },
    { x: 2950, y: 146, w: 100, h: 18, look: 'stone' },
    { x: 3300, y: 150, w: 90, h: 18, look: 'stone' },
    // The last crags.
    { x: 4300, w: 60, h: 40, look: 'rock' },
    { x: 4360, w: 140, h: 80, look: 'stone' },
    { x: 5300, y: 150, w: 100, h: 18, look: 'stone' },
  ],
  movers: [
    { x: 1960, y: 208, w: 36, dx: 0, dy: -112, period: 360, look: 'lift' },
    // The gondola between the crags.
    { x: 2200, y: 104, w: 40, dx: 200, dy: 0, period: 420, look: 'lift' },
  ],
  updrafts: [
    { x: 520, w: 180, top: 60, lift: 0.26 },
    { x: 1400, w: 200, top: 60, lift: 0.26 },
    { x: 3590, w: 80, top: 96, lift: 0.26 },
    { x: 3900, w: 220, top: 60, lift: 0.26 },
  ],
  crates: [
    { x: 300, holds: 'gear' },
    { x: 1260, holds: 'poncho' },
    { x: 1800, holds: 'nugget' },
    { x: 2650, holds: 'gear' },
    { x: 3000, holds: 'poncho' },
    { x: 3560, holds: 'nugget' },
    { x: 4200, holds: 'gear' },
    { x: 5340, holds: 'poncho' },
  ],
  encounters: [
    {
      id: 'aerie-crows',
      at: 140,
      squad: [
        { kind: 'crow', x: 420, y: 120 },
        { kind: 'crow', x: 460, y: 150, delay: 30 },
      ],
    },
    {
      id: 'first-nest',
      at: 900,
      squad: [
        { kind: 'harpy', x: 1150, y: 70 },
        { kind: 'harpy', x: 1200, y: 90, delay: 50 },
      ],
    },
    {
      id: 'gust',
      at: 1620,
      squad: [
        { kind: 'wraith', x: 1800, y: 150 },
        { kind: 'wraith', x: 1850, y: 120, delay: 30 },
        { kind: 'wraith', x: 1900, y: 170, delay: 60 },
      ],
    },
    {
      id: 'crag-gun',
      at: 1980,
      squad: [{ kind: 'gunslinger', x: 2150, y: 94 }],
    },
    {
      id: 'gondola-crow',
      at: 2200,
      squad: [{ kind: 'crow', x: 2520, y: 90, delay: 60 }],
    },
    {
      id: 'second-nest',
      at: 2650,
      squad: [
        { kind: 'harpy', x: 2900, y: 70 },
        { kind: 'harpy', x: 2960, y: 100, delay: 30 },
        { kind: 'harpy', x: 3080, y: 80, delay: 90 },
        { kind: 'hyena', x: 3060, delay: 60 },
      ],
    },
    {
      id: 'the-nest',
      at: 3200,
      lock: { from: 3160, to: 3520 },
      title: 'THE NEST',
      squad: [
        { kind: 'crow', x: 3380, y: 110 },
        { kind: 'hyena', x: 3300, delay: 60 },
        { kind: 'crow', x: 3440, y: 140, delay: 40 },
        { kind: 'wraith', x: 3500, y: 150, delay: 100 },
        { kind: 'crow', x: 3480, y: 120, delay: 140, drops: 'poncho' },
        { kind: 'hyena', x: 3460, delay: 180 },
      ],
    },
    {
      id: 'gulf-c',
      at: 4130,
      squad: [
        { kind: 'wraith', x: 4420, y: 120 },
        { kind: 'crow', x: 4440, y: 90, delay: 30 },
      ],
    },
    {
      id: 'crag-gun-2',
      at: 4300,
      squad: [{ kind: 'gunslinger', x: 4450, y: 120 }],
    },
    {
      id: 'storm-front',
      at: 4560,
      squad: [
        { kind: 'hyena', x: 4850 },
        { kind: 'hyena', x: 4900, delay: 30 },
        { kind: 'harpy', x: 4880, y: 80, delay: 50 },
      ],
    },
    {
      id: 'summit-wind',
      at: 5100,
      squad: [
        { kind: 'wraith', x: 5400, y: 150 },
        { kind: 'wraith', x: 5450, y: 120, delay: 40 },
        { kind: 'harpy', x: 5450, y: 70, delay: 80, drops: 'poncho' },
      ],
    },
    {
      id: 'summit',
      at: 5350,
      squad: [
        { kind: 'crow', x: 5600, y: 120 },
        { kind: 'hyena', x: 5620, delay: 30 },
      ],
    },
  ],
  checkpoints: [2620, 4560],
  secrets: [
    { id: 's4a3-crown-of-quills', x: 3710, y: 90, name: 'THE CROWN OF QUILLS' },
  ],
  ambient: ['crow', 'wraith'],
  seconds: 390,
  boss: 'matriarch',
  intro: [
    'ABOVE THE TREES THE CRAGS BEGIN.',
    'THE STORM CROWS NEST UP HERE',
    'AND THEIR MOTHER RULES THE WIND.',
    'RIDE IT TO HER, RONIN.',
  ],
}

export const STAGE_4_ACTS: Act[] = [s4a1, s4a2, s4a3]
