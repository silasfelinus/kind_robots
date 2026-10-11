// /utils/arcade/ghostTrail/acts/stage3.ts
//
// Stage 3: Drowned Watering Hole (conductor kr-arcade t-015..t-020, CAMPAIGN-BLUEPRINT.md). The river
// has burst its banks, and the flood rises and drains on a cycle (world.ts tideAt): low for a while,
// a yellow ripple on the water line as the warning, a rise, a high stand, a fall. Under the line Zuzu
// wades slowly with a short hop; held under it about 2.5 s he loses a hit. So the stage is about
// reading the cycle: crossing the low flats while the water is down, and being up on a bank, a rock,
// a bough or a raft when it comes back.
//
//   Act 1, THE SHALLOWS: the tide taught gently. Rocks to climb every few hundred paces, a shallow
//     first flood, and old jetties on stilts above the flats (the dry high road, and a relic).
//   Act 2, THE SUNKEN CHAPEL: a higher, faster flood. Rafts: ferries across deep pools and ferries
//     between banks over the flooded flats. The chapel roof is the dry road; beneath it, a crypt
//     passage that can only be walked at low tide holds the chalice and two crates. Past the
//     graveyard, the croc pool: a channel too wide to jump, crossed by old jetties up high, or, once
//     the squad on the bank is put down, on the back of the River Croc (a ferry that waits for
//     Zuzu, keeps him above the flood, and leaves him a nugget from the riverbed the first time).
//   Act 3, THE FERRY CROSSING: a short run for the ferry landing. Fast tides that never close over
//     his head but slow him and shorten his jump, so the channels must be taken while it is down.
//     The Drowned Ferryman waits on the landing.
//
// Foes: the drowned, leeches, crows, spirits and a few ghost monks. The River Croc is not a foe here:
// he is a cameo and a conditional ally (CAMPAIGN-BLUEPRINT.md), never hurt and never hurting.

import type { Act, Stage } from '../world'
import { groundWithPits } from './build34'

const STAGE_NAME = 'DROWNED WATERING HOLE'

export const STAGE_3: Stage = {
  stage: 3,
  name: STAGE_NAME,
  outro: [
    'THE FERRYMAN SINKS WITH HIS BOAT.',
    'THE RIVER DRAINS INTO ITS BED',
    'AND THE MUD GIVES BACK ITS DEAD.',
    'ZUZU WRINGS OUT HIS PONCHO.',
    'THE BELL RINGS FROM THE HILLS.',
  ],
}

// --- Act 1: THE SHALLOWS -----------------------------------------------------------------------

const S3A1_LENGTH = 6400

const s3a1: Act = {
  id: 's3a1',
  stage: 3,
  act: 1,
  stageName: STAGE_NAME,
  actName: 'THE SHALLOWS',
  theme: 'waterhole',
  length: S3A1_LENGTH,
  ground: groundWithPits(S3A1_LENGTH, [
    [1640, 44],
    [2900, 48],
    [4520, 52],
    [6060, 44],
  ]),
  // The old jetties: a dry high road on stilts above the flats, from the nook slab to the relic.
  ledges: [
    { x: 3214, y: 150, w: 62 },
    { x: 3310, y: 120, w: 70 },
    { x: 3430, y: 120, w: 76 },
    { x: 3556, y: 124, w: 70 },
    { x: 3664, y: 92, w: 60 },
  ],
  blocks: [
    { x: 340, w: 12, h: 16, look: 'grave' },
    // The old bank: the first flood passes under it.
    { x: 470, w: 200, h: 28, look: 'stone' },
    { x: 930, w: 48, h: 26, look: 'rock' },
    { x: 1150, w: 56, h: 28, look: 'rock' },
    { x: 1320, w: 260, h: 32, look: 'stone' },
    { x: 1744, w: 60, h: 28, look: 'rock' },
    { x: 2010, w: 50, h: 28, look: 'rock' },
    { x: 2260, w: 70, h: 30, look: 'rock' },
    // The ford stones (the first ambush).
    { x: 2560, w: 340, h: 30, look: 'stone' },
    // The nook: a wall and a slab roof over a hollow that opens to the east (a crate inside).
    { x: 3000, w: 40, h: 32, look: 'stone' },
    { x: 3040, y: 176, w: 150, h: 10, look: 'stone' },
    { x: 3420, w: 60, h: 28, look: 'rock' },
    { x: 3700, w: 56, h: 30, look: 'rock' },
    { x: 3990, w: 240, h: 30, look: 'stone' },
    { x: 4300, w: 50, h: 28, look: 'rock' },
    { x: 4700, w: 60, h: 28, look: 'rock' },
    { x: 5000, w: 70, h: 30, look: 'rock' },
    { x: 5300, w: 60, h: 30, look: 'rock' },
    // The landing (the second ambush).
    { x: 5620, w: 360, h: 30, look: 'stone' },
  ],
  tide: { low: 236, high: 176, period: 1500 },
  crates: [
    { x: 250, holds: 'gear' },
    { x: 1080, holds: 'nugget' },
    { x: 1600, holds: 'poncho' },
    { x: 2440, holds: 'poncho' },
    { x: 3110, holds: 'gear' },
    { x: 3880, holds: 'nugget' },
    { x: 4620, holds: 'poncho' },
    { x: 5480, holds: 'gear' },
    { x: 6260, holds: 'nugget' },
  ],
  encounters: [
    // Each kind alone first: a leech, one of the drowned, a crow, a spirit.
    { id: 'bank-leech', at: 140, squad: [{ kind: 'leech', x: 380 }] },
    { id: 'first-drowned', at: 560, squad: [{ kind: 'drowned', x: 800 }] },
    {
      id: 'leech-pair',
      at: 1000,
      squad: [
        { kind: 'leech', x: 1240 },
        { kind: 'leech', x: 1280, delay: 40 },
      ],
    },
    {
      id: 'carrion',
      at: 1380,
      squad: [{ kind: 'crow', x: 1680, y: 150, drops: 'gear' }],
    },
    {
      id: 'reeds',
      at: 1840,
      squad: [
        { kind: 'drowned', x: 2090 },
        { kind: 'leech', x: 2130, delay: 30 },
      ],
    },
    { id: 'first-spirit', at: 2200, squad: [{ kind: 'spirit', x: 2420 }] },
    {
      id: 'the-ford',
      at: 2600,
      lock: { from: 2540, to: 2900 },
      title: 'THE FORD',
      squad: [
        { kind: 'drowned', x: 2700 },
        { kind: 'leech', x: 2780, delay: 30 },
        { kind: 'drowned', x: 2830, delay: 70 },
        { kind: 'crow', x: 2880, y: 140, delay: 120, drops: 'poncho' },
      ],
    },
    {
      id: 'nook',
      at: 2960,
      squad: [
        { kind: 'spirit', x: 3150 },
        { kind: 'spirit', x: 3260, delay: 50 },
      ],
    },
    {
      id: 'orchard',
      at: 3300,
      squad: [
        { kind: 'leech', x: 3520 },
        { kind: 'spirit', x: 3580, delay: 40 },
        { kind: 'leech', x: 3640, delay: 60 },
      ],
    },
    {
      id: 'crow-pair',
      at: 3700,
      squad: [
        { kind: 'crow', x: 3980, y: 120 },
        { kind: 'crow', x: 4040, y: 160, delay: 40, drops: 'gear' },
      ],
    },
    {
      id: 'bank-three',
      at: 4050,
      squad: [
        { kind: 'drowned', x: 4270 },
        { kind: 'spirit', x: 4390, delay: 40 },
        { kind: 'leech', x: 4440, delay: 80 },
      ],
    },
    {
      id: 'channel',
      at: 4580,
      squad: [
        { kind: 'drowned', x: 4800 },
        { kind: 'drowned', x: 4880, delay: 60 },
        { kind: 'crow', x: 4960, y: 130, delay: 100, drops: 'gear' },
      ],
    },
    {
      id: 'leech-bed',
      at: 5100,
      squad: [
        { kind: 'leech', x: 5260 },
        { kind: 'leech', x: 5290, delay: 20 },
        { kind: 'spirit', x: 5240, delay: 60 },
        { kind: 'leech', x: 5420, delay: 40 },
      ],
    },
    {
      id: 'the-landing',
      at: 5660,
      lock: { from: 5600, to: 5960 },
      title: 'THE LANDING',
      squad: [
        { kind: 'drowned', x: 5760 },
        { kind: 'spirit', x: 5640, delay: 40 },
        { kind: 'leech', x: 5880, delay: 20 },
        { kind: 'crow', x: 5950, y: 120, delay: 100 },
        { kind: 'drowned', x: 5680, delay: 150, drops: 'poncho' },
      ],
    },
    {
      id: 'last-crow',
      at: 6080,
      squad: [{ kind: 'crow', x: 6360, y: 140 }],
    },
  ],
  checkpoints: [40, 880, 1716, 3070, 3960, 5120],
  secrets: [
    { id: 's3a1-ferry-token', x: 3696, y: 78, name: 'THE FERRY TOKEN' },
  ],
  ambient: ['crow'],
  seconds: 360,
  intro: [
    'THE RIVER HAS BURST ITS BANKS',
    'AND THE DROWNED WALK THE FLATS.',
    'WATCH THE WATER RISE AND FALL.',
    'WHEN IT RIPPLES, CLIMB.',
  ],
}

// --- Act 2: THE SUNKEN CHAPEL -------------------------------------------------------------------

const S3A2_LENGTH = 7000

const s3a2: Act = {
  id: 's3a2',
  stage: 3,
  act: 2,
  stageName: STAGE_NAME,
  actName: 'THE SUNKEN CHAPEL',
  theme: 'waterhole',
  length: S3A2_LENGTH,
  ground: groundWithPits(S3A2_LENGTH, [
    // The first deep pool (a raft), the font pool below the nave (a raft), the graveyard ditch.
    [800, 120],
    [3860, 140],
    // The croc pool: too wide to jump.
    [5360, 220],
    [5840, 52],
  ]),
  ledges: [
    // The bell loft above the chapel roof.
    { x: 3150, y: 104, w: 64 },
    // The old jetties over the croc pool (the high road), clear of the croc even in a flood.
    { x: 5380, y: 166, w: 40 },
    { x: 5456, y: 150, w: 40 },
    { x: 5530, y: 166, w: 36 },
  ],
  blocks: [
    { x: 280, w: 60, h: 30, look: 'rock' },
    { x: 560, w: 180, h: 34, look: 'stone' },
    { x: 1100, w: 50, h: 30, look: 'rock' },
    { x: 1380, w: 60, h: 30, look: 'rock' },
    // Bank and bank, a raft ferry between them over the flats.
    { x: 1560, w: 200, h: 40, look: 'stone' },
    { x: 2040, w: 160, h: 40, look: 'stone' },
    { x: 2240, w: 60, h: 32, look: 'rock' },
    { x: 2500, w: 50, h: 30, look: 'rock' },
    // The chapel: a step, and the roof over the crypt passage (in at the slot, out at the east end).
    { x: 2780, w: 50, h: 30, look: 'stone' },
    { x: 2848, y: 140, w: 560, h: 34, look: 'stone' },
    // The nave (the ambush), whose east end drops into the font pool.
    { x: 3500, w: 360, h: 40, look: 'stone' },
    { x: 4120, w: 60, h: 32, look: 'rock' },
    { x: 4400, w: 60, h: 32, look: 'rock' },
    { x: 4560, w: 140, h: 40, look: 'stone' },
    { x: 5000, w: 160, h: 40, look: 'stone' },
    // A rock on the croc pool bank, above the flood.
    { x: 5270, w: 44, h: 30, look: 'rock' },
    { x: 6050, w: 60, h: 30, look: 'rock' },
    { x: 6300, w: 200, h: 40, look: 'stone' },
    { x: 6720, w: 60, h: 30, look: 'rock' },
  ],
  movers: [
    // The pool raft: rides the first deep pool, docked at either bank in turn.
    { x: 800, y: 208, w: 40, dx: 80, dy: 0, period: 260, look: 'raft' },
    // The flats ferry: bank to bank at the banks' height, over the flood.
    { x: 1760, y: 168, w: 48, dx: 232, dy: 0, period: 480, look: 'raft' },
    // The font raft: jump down to it from the nave's east end.
    {
      x: 3860,
      y: 208,
      w: 44,
      dx: 96,
      dy: 0,
      period: 300,
      phase: 0.5,
      look: 'raft',
    },
    // The second ferry, over the flats below the belfry.
    {
      x: 4700,
      y: 168,
      w: 48,
      dx: 252,
      dy: 0,
      period: 520,
      phase: 0.3,
      look: 'raft',
    },
    // The River Croc: he surfaces at the near bank of the croc pool once the squad bothering him
    // is down, waits for Zuzu to climb on, and carries him across.
    {
      x: 5352,
      y: 208,
      w: 72,
      dx: 156,
      dy: 0,
      period: 200,
      look: 'croc',
      ferry: true,
      needs: 'croc-pool',
      hello: 'RIVER CROC!',
      gift: 'nugget',
    },
  ],
  tide: { low: 232, high: 164, period: 1380 },
  crates: [
    { x: 200, holds: 'gear' },
    { x: 960, holds: 'nugget' },
    { x: 1480, holds: 'poncho' },
    { x: 2380, holds: 'gear' },
    // In the crypt passage: only reached at low tide.
    { x: 2990, holds: 'poncho' },
    { x: 3270, holds: 'gear' },
    { x: 4280, holds: 'gear' },
    { x: 5220, holds: 'poncho' },
    { x: 6200, holds: 'nugget' },
  ],
  encounters: [
    {
      id: 'mud',
      at: 120,
      squad: [
        { kind: 'drowned', x: 450 },
        { kind: 'leech', x: 500, delay: 30 },
      ],
    },
    {
      id: 'flat-leeches',
      at: 1000,
      squad: [
        { kind: 'leech', x: 1220 },
        { kind: 'leech', x: 1300, delay: 30 },
        { kind: 'crow', x: 1400, y: 140, delay: 60 },
      ],
    },
    // The ghost monk, alone over the bank.
    {
      id: 'first-monk',
      at: 1480,
      squad: [{ kind: 'monk', x: 1720, y: 170 }],
    },
    {
      id: 'ferry-crows',
      at: 1800,
      squad: [
        { kind: 'crow', x: 2080, y: 130 },
        { kind: 'crow', x: 2120, y: 170, delay: 40, drops: 'gear' },
      ],
    },
    {
      id: 'churchyard',
      at: 2250,
      squad: [
        { kind: 'spirit', x: 2460 },
        { kind: 'spirit', x: 2580, delay: 40 },
        { kind: 'drowned', x: 2640, delay: 80 },
      ],
    },
    {
      id: 'roof-monk',
      at: 2860,
      squad: [
        { kind: 'monk', x: 3080, y: 140 },
        { kind: 'crow', x: 3160, y: 100, delay: 60 },
      ],
    },
    // Down in the crypt passage, a leech in the dark (spawned on the floor, under the roof).
    {
      id: 'crypt-leech',
      at: 2900,
      squad: [{ kind: 'leech', x: 3060, y: 200 }],
    },
    {
      id: 'roof-end',
      at: 3240,
      squad: [
        { kind: 'spirit', x: 3380 },
        { kind: 'crow', x: 3480, y: 120, delay: 30 },
      ],
    },
    {
      id: 'the-nave',
      at: 3540,
      lock: { from: 3480, to: 3860 },
      title: 'THE NAVE',
      squad: [
        { kind: 'drowned', x: 3640 },
        { kind: 'leech', x: 3700, delay: 30 },
        { kind: 'monk', x: 3760, y: 170, delay: 40 },
        { kind: 'drowned', x: 3800, delay: 90 },
        { kind: 'crow', x: 3850, y: 130, delay: 140, drops: 'poncho' },
      ],
    },
    {
      id: 'font-spirits',
      at: 4150,
      squad: [
        { kind: 'spirit', x: 4330 },
        { kind: 'spirit', x: 4480, delay: 40 },
      ],
    },
    {
      id: 'belfry-drowned',
      at: 4300,
      squad: [
        { kind: 'drowned', x: 4510 },
        { kind: 'monk', x: 4650, y: 168, delay: 50 },
        { kind: 'leech', x: 4800, delay: 80 },
      ],
    },
    {
      id: 'crow-flight',
      at: 5040,
      squad: [
        { kind: 'crow', x: 5300, y: 120 },
        { kind: 'crow', x: 5340, y: 150, delay: 30 },
        { kind: 'crow', x: 5380, y: 110, delay: 60, drops: 'gear' },
      ],
    },
    // The squad on the croc pool bank: the croc keeps his head down until they are gone.
    {
      id: 'croc-pool',
      at: 5180,
      squad: [
        { kind: 'drowned', x: 5336 },
        { kind: 'leech', x: 5240, delay: 20 },
        { kind: 'drowned', x: 5200, delay: 60 },
      ],
    },
    {
      id: 'graveyard',
      at: 5500,
      squad: [
        { kind: 'spirit', x: 5700 },
        { kind: 'spirit', x: 5760, delay: 30 },
        { kind: 'drowned', x: 5800, delay: 60 },
        { kind: 'crow', x: 5880, y: 140, delay: 100 },
      ],
    },
    {
      id: 'ditch',
      at: 5900,
      squad: [
        { kind: 'leech', x: 6120 },
        { kind: 'leech', x: 6160, delay: 20 },
        { kind: 'crow', x: 6220, y: 140, delay: 60 },
      ],
    },
    {
      id: 'west-door',
      at: 6340,
      squad: [
        { kind: 'drowned', x: 6560 },
        { kind: 'spirit', x: 6640, delay: 40 },
        { kind: 'crow', x: 6800, y: 150, delay: 80, drops: 'poncho' },
      ],
    },
  ],
  checkpoints: [40, 1210, 2440, 3260, 4070, 4980, 6000],
  secrets: [
    { id: 's3a2-chapel-chalice', x: 3140, y: 192, name: 'THE CHAPEL CHALICE' },
  ],
  ambient: ['spirit'],
  seconds: 390,
  intro: [
    'THE OLD CHAPEL STANDS IN THE FLOOD',
    'AND ITS BELL HAS RUNG FOR NO ONE.',
    'RIDE THE RAFTS ABOVE THE WATER.',
    'THE CRYPT IS DRY ONLY AT THE EBB.',
  ],
}

// --- Act 3: THE FERRY CROSSING -----------------------------------------------------------------

const S3A3_LENGTH = 4400

const s3a3: Act = {
  id: 's3a3',
  stage: 3,
  act: 3,
  stageName: STAGE_NAME,
  actName: 'THE FERRY CROSSING',
  theme: 'waterhole',
  length: S3A3_LENGTH,
  ground: groundWithPits(S3A3_LENGTH, [
    [500, 52],
    [760, 48],
    [1000, 130],
    [1750, 56],
    [2320, 150],
    [2900, 56],
    [3320, 120],
    [3880, 48],
  ]),
  // The ferryman's old landing stage: a dry high way over the second pool, and a coin up top.
  ledges: [
    { x: 2330, y: 140, w: 50 },
    { x: 2420, y: 120, w: 50 },
    { x: 2510, y: 150, w: 50 },
  ],
  blocks: [
    { x: 300, w: 12, h: 16, look: 'grave' },
    { x: 1300, w: 60, h: 24, look: 'rock' },
    { x: 2270, w: 40, h: 36, look: 'pillar' },
    { x: 2700, w: 60, h: 24, look: 'rock' },
    { x: 3600, w: 60, h: 24, look: 'rock' },
  ],
  movers: [
    { x: 1000, y: 208, w: 40, dx: 90, dy: 0, period: 240, look: 'raft' },
    {
      x: 2320,
      y: 208,
      w: 44,
      dx: 106,
      dy: 0,
      period: 280,
      phase: 0.4,
      look: 'raft',
    },
    {
      x: 3320,
      y: 208,
      w: 40,
      dx: 80,
      dy: 0,
      period: 230,
      phase: 0.7,
      look: 'raft',
    },
  ],
  tide: { low: 236, high: 192, period: 900 },
  crates: [
    { x: 360, holds: 'gear' },
    { x: 900, holds: 'nugget' },
    { x: 1420, holds: 'poncho' },
    { x: 2620, holds: 'gear' },
    { x: 3200, holds: 'gear' },
    { x: 3700, holds: 'nugget' },
    { x: 4040, holds: 'poncho' },
  ],
  encounters: [
    // The drowned climb out behind him: keep moving.
    {
      id: 'ebb',
      at: 200,
      squad: [
        { kind: 'drowned', x: 120, delay: 30 },
        { kind: 'leech', x: 420, delay: 10 },
        { kind: 'drowned', x: 60, delay: 90 },
      ],
    },
    {
      id: 'ferry-crows',
      at: 860,
      squad: [
        { kind: 'crow', x: 1160, y: 140 },
        { kind: 'crow', x: 1200, y: 170, delay: 30, drops: 'gear' },
      ],
    },
    {
      id: 'channel-leeches',
      at: 1440,
      squad: [
        { kind: 'leech', x: 1650 },
        { kind: 'leech', x: 1690, delay: 20 },
        { kind: 'drowned', x: 1380, delay: 40 },
      ],
    },
    {
      id: 'the-wharf',
      at: 1960,
      lock: { from: 1900, to: 2260 },
      title: 'THE WHARF',
      squad: [
        { kind: 'drowned', x: 2100 },
        { kind: 'spirit', x: 1920, delay: 40 },
        { kind: 'drowned', x: 2180, delay: 60 },
        { kind: 'monk', x: 2200, y: 196, delay: 100 },
        { kind: 'crow', x: 2240, y: 130, delay: 150, drops: 'poncho' },
      ],
    },
    {
      id: 'stage-monk',
      at: 2580,
      squad: [
        { kind: 'monk', x: 2860, y: 196 },
        { kind: 'leech', x: 2800, delay: 20 },
      ],
    },
    {
      id: 'reach',
      at: 3000,
      squad: [
        { kind: 'crow', x: 3280, y: 120 },
        { kind: 'drowned', x: 3220, delay: 30 },
        { kind: 'crow', x: 3300, y: 160, delay: 40 },
      ],
    },
    {
      id: 'last-water',
      at: 3480,
      squad: [
        { kind: 'drowned', x: 3700 },
        { kind: 'spirit', x: 3650, delay: 30 },
        { kind: 'leech', x: 3780, delay: 60 },
        { kind: 'drowned', x: 3440, delay: 90 },
      ],
    },
  ],
  checkpoints: [40, 1250, 1880, 2810, 3820],
  secrets: [
    { id: 's3a3-boatmans-coin', x: 2445, y: 106, name: 'THE BOATMANS COIN' },
  ],
  ambient: ['crow'],
  seconds: 300,
  boss: 'ferryman',
  intro: [
    'THE FERRY LANDING IS CLOSE.',
    'THE WATER COMES AND GOES FASTER.',
    'JUMP THE CHANNELS AT THE EBB.',
    'THE FERRYMAN WILL TAKE HIS TOLL.',
  ],
}

export const STAGE_3_ACTS: Act[] = [s3a1, s3a2, s3a3]
