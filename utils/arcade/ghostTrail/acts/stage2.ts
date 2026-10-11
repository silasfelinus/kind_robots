// /utils/arcade/ghostTrail/acts/stage2.ts
//
// Stage 2: The Bone Yard / Haunted Ravine (conductor kr-arcade t-015..t-020, CAMPAIGN-BLUEPRINT.md).
// Two acts, about eleven minutes for a first clear.
//
// Act 1, THE CRYPTS, is a graveyard on the ground: ghouls squat on the graves, spirits claw up
// between the tombs, hyena packs run the rows, and bone spurs (spikes, some of them thrusting on a
// beat) cut the crypt floor. The ossuary and the open graves are ambushes. Crypt rafters over the
// spikes lead to the act's relic; a tall crypt roof hides a poncho. The ghost monk and the wind
// wraith each appear alone before they join the others.
//
// Act 2, THE BROKEN BRIDGE, crosses the haunted ravine twice on a bridge with half its planks gone:
// long jumps one after another, crows over the gaps and hyenas leaping them. Between the spans, the
// chapel terraces climb to a swinging beam and the forgotten grave with the first bell sigil; bell
// lifts and beams carry Zuzu over the high gaps. The far bank ends at the Bone Bull's arena.

import type { Act, Stage } from '../world'
import { flight, graves, groundWithPits } from './build12'

export const STAGE_2: Stage = {
  stage: 2,
  name: 'THE BONE YARD',
  outro: [
    'THE BONE BULL GOES DOWN INTO',
    'THE RAVINE, AND THE BRIDGE',
    'FALLS QUIET UNDER THE STARS.',
    'DOWNSTREAM, THE WATERING HOLE',
    'STIRS. SOMETHING WADES BELOW.',
  ],
}

const THE_CRYPTS: Act = {
  id: 's2a1',
  stage: 2,
  act: 1,
  stageName: 'THE BONE YARD',
  actName: 'THE CRYPTS',
  theme: 'boneyard',
  length: 6600,
  ground: groundWithPits(6600, [
    [1040, 40],
    [3100, 44],
    [4700, 48],
    [4900, 52],
    [5760, 48],
    [6380, 44],
  ]),
  ledges: [
    // Crypt rafters over the bone spurs, up to the relic.
    ...flight(2380, 172, 2, 66, 80, -32),
    { x: 2560, y: 110, w: 120 },
    { x: 2710, y: 120, w: 90 },
    // The tall crypt's roof.
    { x: 5300, y: 140, w: 100 },
  ],
  blocks: [
    ...graves(160, 300, 840, 900),
    // The ossuary's tombs.
    { x: 1790, w: 30, h: 24, look: 'stone' },
    { x: 1940, w: 30, h: 30, look: 'stone' },
    ...graves(3700, 3760, 4210, 4320, 4430),
    // The tall crypt: a plinth, then its wall.
    { x: 5200, w: 36, h: 28, look: 'stone' },
    { x: 5236, w: 36, h: 44, look: 'pillar' },
    ...graves(5990, 6094),
  ],
  hazards: [
    { x: 600, w: 24, kind: 'spikes' },
    { x: 2400, w: 30, kind: 'spikes' },
    { x: 2600, w: 36, kind: 'spikes', period: 120, on: 70 },
    { x: 2740, w: 30, kind: 'spikes' },
    { x: 3830, w: 28, kind: 'spikes', period: 150, on: 90 },
    { x: 5640, w: 30, kind: 'spikes' },
  ],
  crates: [
    { x: 720, holds: 'gear' },
    { x: 1560, holds: 'poncho' },
    { x: 2240, holds: 'nugget' },
    { x: 3300, holds: 'gear' },
    { x: 4000, holds: 'poncho' },
    { x: 5000, holds: 'gear' },
    { x: 5880, holds: 'poncho' },
    { x: 6480, holds: 'nugget' },
  ],
  encounters: [
    {
      id: 'mourners',
      at: 160,
      squad: [
        { kind: 'spirit', x: 400 },
        { kind: 'spirit', x: 460, delay: 50 },
      ],
    },
    {
      id: 'gravekeeper',
      at: 760,
      squad: [{ kind: 'ghoul', x: 906 }],
    },
    {
      id: 'pack',
      at: 1140,
      title: 'HYENA PACK',
      squad: [
        { kind: 'hyena', x: 1400 },
        { kind: 'hyena', x: 1440, delay: 40 },
        { kind: 'hyena', x: 1480, delay: 80 },
      ],
    },
    {
      id: 'ossuary',
      at: 1760,
      lock: { from: 1700, to: 2060 },
      title: 'THE OSSUARY',
      squad: [
        { kind: 'ghoul', x: 1880 },
        { kind: 'spirit', x: 1740, delay: 120 },
        { kind: 'hyena', x: 2050, delay: 110 },
        { kind: 'crow', x: 2050, y: 110, delay: 240 },
      ],
    },
    {
      id: 'crypt-spirits',
      at: 2200,
      squad: [
        { kind: 'spirit', x: 2350 },
        { kind: 'spirit', x: 2290, delay: 90 },
      ],
    },
    {
      id: 'rafter-crow',
      at: 2500,
      squad: [{ kind: 'crow', x: 2780, y: 100, drops: 'gear' }],
    },
    {
      id: 'monk',
      at: 2960,
      title: 'GHOST MONK',
      squad: [{ kind: 'monk', x: 3220, y: 200 }],
    },
    {
      id: 'chant',
      at: 3360,
      squad: [
        { kind: 'monk', x: 3600, y: 200 },
        { kind: 'spirit', x: 3500, delay: 40 },
        { kind: 'spirit', x: 3560, delay: 70 },
      ],
    },
    {
      id: 'twin-graves',
      at: 3640,
      squad: [
        { kind: 'ghoul', x: 3706 },
        { kind: 'ghoul', x: 3900, delay: 40 },
      ],
    },
    {
      id: 'open-graves',
      at: 4200,
      lock: { from: 4140, to: 4500 },
      title: 'OPEN GRAVES',
      squad: [
        { kind: 'spirit', x: 4330 },
        { kind: 'hyena', x: 4490, delay: 40 },
        { kind: 'spirit', x: 4410, delay: 60 },
        { kind: 'hyena', x: 4495, delay: 110 },
        { kind: 'crow', x: 4480, y: 120, delay: 150 },
      ],
    },
    {
      id: 'howl',
      at: 4760,
      squad: [
        { kind: 'hyena', x: 5040 },
        { kind: 'hyena', x: 5080, delay: 50 },
      ],
    },
    {
      id: 'crypt-roof',
      at: 5120,
      squad: [{ kind: 'spirit', x: 5350, drops: 'poncho' }],
    },
    {
      id: 'wraith',
      at: 5480,
      title: 'WIND WRAITH',
      squad: [{ kind: 'wraith', x: 5800, y: 182 }],
    },
    {
      id: 'last-rites',
      at: 5950,
      squad: [
        { kind: 'ghoul', x: 6100 },
        { kind: 'spirit', x: 6190, delay: 30 },
        { kind: 'hyena', x: 6320, delay: 60 },
        { kind: 'monk', x: 6330, y: 200, delay: 150 },
      ],
    },
  ],
  checkpoints: [40, 1120, 2160, 3060, 4060, 5330],
  secrets: [
    { id: 's2a1-widows-locket', x: 2780, y: 106, name: 'WIDOWS LOCKET' },
  ],
  ambient: ['spirit'],
  seconds: 380,
  intro: [
    'PAST SILVER GULCH THE TRAIL',
    'RUNS THROUGH THE BONE YARD,',
    'WHERE THE BELL MONKS WERE LAID',
    'TO REST. NONE OF THEM RESTS.',
  ],
}

const THE_BROKEN_BRIDGE: Act = {
  id: 's2a2',
  stage: 2,
  act: 2,
  stageName: 'THE BONE YARD',
  actName: 'THE BROKEN BRIDGE',
  theme: 'boneyard',
  length: 7400,
  ground: groundWithPits(7400, [
    // The first span.
    [700, 44],
    [800, 48],
    [904, 52],
    [1020, 44],
    [1120, 56],
    [1400, 52],
    [1510, 48],
    [1620, 56],
    [1740, 48],
    // The second span, around the pier.
    [3120, 48],
    [3220, 52],
    [3330, 56],
    [3440, 48],
    [3700, 52],
    [3800, 56],
    [3910, 48],
    [4420, 52],
    [4530, 48],
    [4640, 56],
    [4760, 44],
    // The last span before the arena.
    [6100, 52],
    [6200, 56],
    [6320, 48],
    [6430, 52],
  ]),
  ledges: [
    // The chapel terraces, up to the high loft.
    ...flight(2240, 172, 3, 70, 80, -36),
    { x: 2500, y: 68, w: 120 },
    // The forgotten grave's shelf, past the swinging beam.
    { x: 2800, y: 72, w: 56 },
    // The bridge tower over the second span.
    { x: 3560, y: 170, w: 50 },
    { x: 3620, y: 136, w: 60 },
    { x: 3880, y: 136, w: 60 },
    // The ruined chapel on the far bank.
    { x: 5520, y: 112, w: 90 },
    { x: 5700, y: 112, w: 80 },
  ],
  blocks: [
    ...graves(180, 2140),
    // The forgotten grave itself, on its shelf.
    { x: 2836, y: 56, w: 12, h: 16, look: 'grave' },
    // The chapel stairs on the far bank.
    { x: 5300, w: 40, h: 20, look: 'stone' },
    { x: 5340, w: 40, h: 40, look: 'stone' },
    { x: 5380, w: 120, h: 60, look: 'stone' },
    ...graves(6560, 6880),
  ],
  movers: [
    // Across from the chapel loft to the forgotten grave.
    { x: 2640, y: 72, w: 36, dx: 110, dy: 0, period: 260, look: 'beam' },
    // A bell lift from the chapel yard up to the shelf.
    { x: 2900, y: 196, w: 34, dx: 0, dy: -120, period: 300, look: 'bell' },
    // Over the second span, from tower to tower.
    { x: 3700, y: 136, w: 40, dx: 120, dy: 0, period: 240, look: 'beam' },
    // Between the far bank's chapel ruins.
    { x: 5615, y: 112, w: 36, dx: 0, dy: 40, period: 200, look: 'bell' },
  ],
  hazards: [
    { x: 5180, w: 30, kind: 'spikes' },
    { x: 5560, w: 30, kind: 'spikes', period: 140, on: 80 },
    { x: 5860, w: 28, kind: 'spikes' },
  ],
  crates: [
    { x: 560, holds: 'gear' },
    { x: 1260, holds: 'poncho' },
    { x: 3000, holds: 'gear' },
    { x: 3600, holds: 'nugget' },
    { x: 4200, holds: 'gear' },
    { x: 4880, holds: 'poncho' },
    { x: 6640, holds: 'poncho' },
    { x: 6800, holds: 'gear' },
  ],
  encounters: [
    {
      id: 'rim',
      at: 140,
      squad: [
        { kind: 'spirit', x: 380 },
        { kind: 'crow', x: 480, y: 110, delay: 40 },
      ],
    },
    {
      id: 'ravine-crows',
      at: 760,
      title: 'THE BROKEN BRIDGE',
      squad: [
        { kind: 'crow', x: 1000, y: 120 },
        { kind: 'crow', x: 1080, y: 90, delay: 50 },
      ],
    },
    {
      id: 'bridge-hyena',
      at: 1180,
      squad: [{ kind: 'hyena', x: 1380 }],
    },
    {
      id: 'second-gap',
      at: 1420,
      squad: [
        { kind: 'crow', x: 1700, y: 110 },
        { kind: 'crow', x: 1760, y: 140, delay: 60 },
      ],
    },
    {
      id: 'chapel-yard',
      at: 1900,
      title: 'THE CHAPEL',
      squad: [
        { kind: 'spirit', x: 2100 },
        { kind: 'ghoul', x: 2146, delay: 30 },
      ],
    },
    {
      id: 'loft-ghoul',
      at: 2260,
      squad: [{ kind: 'ghoul', x: 2450, drops: 'nugget' }],
    },
    {
      id: 'chapel-monk',
      at: 2400,
      squad: [{ kind: 'monk', x: 2660, y: 200 }],
    },
    {
      id: 'leapers',
      at: 3480,
      squad: [
        { kind: 'hyena', x: 3780 },
        { kind: 'hyena', x: 3970, delay: 40 },
      ],
    },
    {
      id: 'chasm-monk',
      at: 3600,
      // (Floats above the island run, not in the jump line over the pits.)
      squad: [{ kind: 'monk', x: 3880, y: 160 }],
    },
    {
      id: 'the-pier',
      at: 4040,
      lock: { from: 3980, to: 4380 },
      title: 'THE PIER',
      squad: [
        { kind: 'ghoul', x: 4340 },
        { kind: 'hyena', x: 4300, delay: 20 },
        { kind: 'spirit', x: 4010, delay: 60 },
        { kind: 'crow', x: 4370, y: 100, delay: 120 },
        { kind: 'wraith', x: 4380, y: 182, delay: 160 },
      ],
    },
    {
      id: 'tower-crow',
      at: 4440,
      squad: [{ kind: 'crow', x: 4700, y: 120, drops: 'poncho' }],
    },
    {
      id: 'east-bank',
      at: 4860,
      squad: [
        { kind: 'ghoul', x: 5100 },
        { kind: 'spirit', x: 5040, delay: 30 },
      ],
    },
    {
      id: 'chapel-steps',
      at: 5260,
      squad: [
        { kind: 'ghoul', x: 5488 },
        { kind: 'monk', x: 5620, y: 200, delay: 60 },
      ],
    },
    {
      id: 'last-pack',
      at: 5640,
      title: 'HYENA PACK',
      squad: [
        { kind: 'hyena', x: 5900 },
        { kind: 'hyena', x: 5940, delay: 30 },
        { kind: 'hyena', x: 5980, delay: 70 },
      ],
    },
    {
      id: 'bell-wraith',
      at: 6040,
      squad: [
        { kind: 'wraith', x: 6340, y: 182 },
        { kind: 'crow', x: 6400, y: 110, delay: 40 },
      ],
    },
    {
      id: 'last-span',
      at: 6500,
      squad: [
        { kind: 'monk', x: 6760, y: 200 },
        { kind: 'spirit', x: 6700, delay: 40 },
      ],
    },
  ],
  checkpoints: [40, 660, 1840, 2920, 3990, 5280, 6560],
  secrets: [
    { id: 's2a2-bell-sigil', x: 2820, y: 58, name: 'FIRST BELL SIGIL' },
  ],
  ambient: ['crow', 'spirit'],
  seconds: 420,
  boss: 'bull',
  intro: [
    'THE MISSION BELL HANGS BEYOND',
    'THE HAUNTED RAVINE.',
    'THE BRIDGE IS ROTTEN. JUMP TRUE,',
    'AND LISTEN FOR HOOVES.',
  ],
}

export const STAGE_2_ACTS: Act[] = [THE_CRYPTS, THE_BROKEN_BRIDGE]
