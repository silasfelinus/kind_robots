// /utils/arcade/ghostTrail/acts/stage6.ts
//
// Stage 6: the Abbey Beneath the Bell (conductor kr-arcade t-015..t-020, CAMPAIGN-BLUEPRINT.md). The
// finale and the longest stage: three acts under the mission, where the Abbess has been ringing the
// dead up for her own ends. Hidden ritual tunnels run under low stone roofs (no room to hop, so the
// ritual fire in them is timed, not jumped), and their roofs are a second, riskier road. Escalating
// held rooms remix every move the trail has taught: fire on a beat, beams over fire beds, a ritual
// wind shaft that lifts Zuzu up a wall, ambushes in series. The last act brings back the dead of the
// whole trail as cameos before the Abbess. Relics here are pages of the story: two per act.
//
// The ending page (STAGE_6.outro) is shown above the credits roll.

import type { Act, Stage } from '../world'
import { fire, groundWith, roof, room, steps } from './build56'

const NAME = 'ABBEY BENEATH THE BELL'

export const STAGE_6: Stage = {
  stage: 6,
  name: NAME,
  outro: [
    'THE ABBESS FALLS. THE BELL CRACKS.',
    'ONE BY ONE, THE DEAD LIE DOWN.',
    'THE BELL IS SILENT. DAWN COMES UP',
    'OVER THE MESA, AND ZUZU WALKS ON.',
    'HE DOES NOT SMILE.',
  ],
}

const ritual = (x: number, w: number, period: number, on: number) =>
  fire(x, w, period, on, 'ritual')

// --- Act 1: the undercroft ------------------------------------------------------------------
// Teaches the abbey: three ritual tunnels (wait out the fire under the roof, or climb onto the
// roof for the high road), sisters and shades, and two held rooms. Relics on both roofs. Past the
// novices' hall, up a floating stair off the main road, a novice hangs in a cage: break its lock
// with any weapon and put down the ambush it was bait for, and the novice goes free (an optional
// rescue, kept with the relics, that adds a page to the ending).
const undercroft: Act = {
  id: 's6a1',
  stage: 6,
  act: 1,
  stageName: NAME,
  actName: 'THE UNDERCROFT',
  theme: 'abbey',
  length: 8000,
  ground: groundWith(8100, [
    [1560, 48],
    [1760, 52],
    [7000, 50],
    [7150, 46],
  ]),
  ledges: [
    // Up onto the first tunnel roof.
    { x: 690, y: 172, w: 50 },
    // Up onto the second roof, and the vow above it.
    { x: 3236, y: 172, w: 44 },
    { x: 3880, y: 100, w: 32 },
  ],
  blocks: [
    roof(760, 520, 140),
    // The stair up to the cage loft (floating stone, walked under on the road below).
    { x: 2790, y: 172, w: 36, h: 12 },
    { x: 2846, y: 140, w: 36, h: 12 },
    { x: 2902, y: 108, w: 56, h: 14 },
    roof(3300, 700, 140),
    ...steps(4950, [24, 48, 72], 36),
    { x: 5058, w: 160, h: 88 },
    ...steps(5218, [64, 40, 16], 36),
    roof(6500, 400, 140),
  ],
  hazards: [
    ritual(900, 40, 200, 80),
    ritual(1100, 40, 180, 70),
    ritual(3420, 36, 160, 60),
    ritual(3600, 40, 200, 90),
    ritual(3800, 36, 160, 60),
    ritual(4640, 30, 160, 80),
    ritual(6620, 40, 180, 70),
    ritual(6780, 40, 180, 70),
  ],
  crates: [
    { x: 300, holds: 'gear' },
    { x: 1450, holds: 'nugget' },
    { x: 2850, holds: 'poncho' },
    { x: 4300, holds: 'gear' },
    { x: 5480, holds: 'gear' },
    { x: 6250, holds: 'poncho' },
    { x: 7300, holds: 'gear' },
    { x: 7800, holds: 'nugget' },
  ],
  encounters: [
    {
      id: 'sisters',
      at: 200,
      title: 'THE SISTERS',
      squad: [
        { kind: 'sister', x: 430 },
        { kind: 'sister', x: 540, delay: 60 },
      ],
    },
    {
      id: 'roof-sister',
      at: 700,
      squad: [{ kind: 'sister', x: 1180, drops: 'heart' }],
    },
    {
      id: 'tunnel-shade',
      at: 820,
      title: 'THE RITUAL TUNNEL',
      squad: [
        { kind: 'shade', x: 1000, y: 200 },
        { kind: 'sister', x: 1200, y: 208, delay: 40 },
      ],
    },
    {
      id: 'crypt-wraiths',
      at: 1450,
      squad: [
        { kind: 'wraith', x: 1720, y: 150 },
        { kind: 'wraith', x: 1800, y: 170, delay: 40 },
      ],
    },
    {
      id: 'crypt',
      at: 1850,
      squad: [
        { kind: 'acolyte', x: 2060 },
        { kind: 'monk', x: 2150, y: 198, delay: 40 },
        { kind: 'sister', x: 2200, delay: 70 },
      ],
    },
    {
      id: 'novices',
      at: 2420,
      lock: room(2400, 360),
      title: 'THE NOVICES',
      squad: [
        { kind: 'sister', x: 2560 },
        { kind: 'sister', x: 2680, delay: 40 },
        { kind: 'shade', x: 2700, y: 200, delay: 90 },
        { kind: 'acolyte', x: 2740, delay: 150 },
      ],
    },
    // The cage was bait: the lock breaking springs them (never before; see `captive`).
    {
      id: 'cage-bait',
      at: 2780,
      lock: room(2760, 360),
      title: 'THE CAGE WAS BAIT',
      squad: [
        { kind: 'shade', x: 3040, y: 110 },
        { kind: 'wraith', x: 3110, y: 96, delay: 30 },
        { kind: 'sister', x: 2870, y: 208, delay: 60 },
        { kind: 'sister', x: 3070, y: 208, delay: 100, drops: 'heart' },
        { kind: 'shade', x: 2800, y: 190, delay: 140 },
      ],
    },
    {
      id: 'after-novices',
      at: 2900,
      squad: [
        { kind: 'sister', x: 3120 },
        { kind: 'shade', x: 3160, y: 200, delay: 60 },
      ],
    },
    {
      id: 'tunnel-sisters',
      at: 3340,
      squad: [
        { kind: 'sister', x: 3520, y: 208 },
        { kind: 'sister', x: 3720, y: 208, delay: 60 },
      ],
    },
    {
      id: 'roof-wraiths',
      at: 3420,
      squad: [
        { kind: 'wraith', x: 3700, y: 104 },
        { kind: 'wraith', x: 3800, y: 96, delay: 60 },
      ],
    },
    {
      id: 'tunnel-shade-2',
      at: 3650,
      squad: [{ kind: 'shade', x: 3860, y: 200 }],
    },
    {
      id: 'ossuary',
      at: 4080,
      lock: room(4060, 340),
      title: 'THE OSSUARY',
      squad: [
        { kind: 'sister', x: 4220 },
        { kind: 'shade', x: 4260, y: 200, delay: 60 },
        { kind: 'monk', x: 4370, y: 198, delay: 120 },
        { kind: 'acolyte', x: 4380, delay: 160 },
      ],
    },
    {
      id: 'acolytes',
      at: 4500,
      title: 'CRIMSON ACOLYTES',
      squad: [
        { kind: 'acolyte', x: 4760 },
        { kind: 'acolyte', x: 4860, delay: 40 },
      ],
    },
    {
      id: 'stair-shade',
      at: 5000,
      squad: [
        { kind: 'shade', x: 5150, y: 120 },
        { kind: 'monk', x: 5140, y: 120, delay: 40 },
      ],
    },
    {
      id: 'stair-foot',
      at: 5300,
      squad: [
        { kind: 'sister', x: 5520 },
        { kind: 'acolyte', x: 5580, delay: 40 },
      ],
    },
    {
      id: 'scriptorium',
      at: 5640,
      lock: room(5600, 380),
      title: 'THE SCRIPTORIUM',
      squad: [
        { kind: 'sister', x: 5760 },
        { kind: 'sister', x: 5860, delay: 30 },
        { kind: 'acolyte', x: 5940, delay: 60 },
        { kind: 'shade', x: 5700, y: 190, delay: 120 },
        { kind: 'wraith', x: 5960, y: 160, delay: 160 },
      ],
    },
    {
      id: 'after-scriptorium',
      at: 6060,
      squad: [
        { kind: 'monk', x: 6300, y: 198 },
        { kind: 'acolyte', x: 6380, delay: 30 },
      ],
    },
    {
      id: 'last-tunnel',
      at: 6520,
      squad: [
        { kind: 'shade', x: 6700, y: 200 },
        { kind: 'sister', x: 6860, y: 208, delay: 40 },
      ],
    },
    {
      id: 'pit-run',
      at: 6960,
      squad: [
        { kind: 'wraith', x: 7220, y: 160 },
        // She comes up from beyond the second pit late, so she never guards its landing.
        { kind: 'sister', x: 7460, delay: 150 },
      ],
    },
    {
      id: 'stair-down',
      at: 7420,
      title: 'THE STAIR GOES DOWN',
      squad: [
        { kind: 'monk', x: 7620, y: 198 },
        { kind: 'acolyte', x: 7700, delay: 30 },
        { kind: 'wraith', x: 7760, y: 150, delay: 60 },
      ],
    },
  ],
  checkpoints: [40, 1180, 2250, 3350, 4450, 5400, 6350, 7110],
  secrets: [
    { id: 's6a1-letter', x: 1250, y: 126, name: 'A NOVICE LETTER' },
    { id: 's6a1-vow', x: 3896, y: 86, name: 'THE FIRST VOW' },
  ],
  // The novice who wrote the letter, hung in a cage off the end of the loft.
  captive: {
    id: 's6a1-novice',
    x: 2990,
    y: 112,
    ambush: 'cage-bait',
    name: 'THE NOVICE IS FREE',
  },
  ambient: ['wraith'],
  seconds: 420,
  intro: [
    'BELOW THE BELL, A STAIR GOES DOWN',
    'INTO AN ABBEY NO MAP REMEMBERS.',
    'ITS SISTERS STILL KEEP THE HOURS.',
    'ZUZU KEEPS HIS OWN.',
  ],
}

// --- Act 2: the ritual halls ----------------------------------------------------------------
// Four held halls, each one harder and each remixing what came before: a fire on the beat, a fire
// bed wider than a jump (wait for it, or ride the beam over), wind and wraiths, and a last hall of
// everything. Between them, the ritual wind shafts lift Zuzu up the walls, a long tunnel burns on
// three beats, and a lift climbs to a gallery where a sister left her confession.
const ritualHalls: Act = {
  id: 's6a2',
  stage: 6,
  act: 2,
  stageName: NAME,
  actName: 'THE RITUAL HALLS',
  theme: 'abbey',
  length: 8600,
  ground: groundWith(8700, [
    [7700, 50],
    [7900, 48],
  ]),
  ledges: [
    // The gallery above the low hall.
    { x: 3936, y: 128, w: 110 },
    { x: 4090, y: 112, w: 90 },
    { x: 4222, y: 88, w: 36 },
    // A perch above the second shaft wall: the foundry mark.
    { x: 5010, y: 92, w: 40 },
  ],
  blocks: [
    { x: 1400, w: 200, h: 72 },
    roof(2000, 640, 140),
    { x: 5000, w: 60, h: 72 },
    { x: 5060, w: 160, h: 48 },
    roof(5900, 600, 140),
  ],
  movers: [
    // A beam over the fire bed in the hall of fire.
    { x: 3120, y: 168, w: 40, dx: 110, dy: 0, period: 240, look: 'beam' },
    // The gallery lift.
    { x: 3900, y: 192, w: 40, dx: 0, dy: -70, period: 240, look: 'lift' },
    // Bells over the last hall.
    { x: 6900, y: 120, w: 36, dx: 120, dy: 0, period: 260, look: 'bell' },
  ],
  updrafts: [
    { x: 1356, w: 44, top: 60, lift: 0.23 },
    { x: 4956, w: 44, top: 60, lift: 0.23 },
  ],
  hazards: [
    ritual(860, 32, 160, 80),
    ritual(2120, 40, 200, 80),
    ritual(2300, 40, 200, 80),
    ritual(2480, 40, 160, 60),
    ritual(3140, 110, 240, 90),
    ritual(6000, 40, 180, 70),
    ritual(6200, 40, 220, 90),
    ritual(6380, 40, 180, 70),
  ],
  crates: [
    { x: 280, holds: 'gear' },
    { x: 1750, holds: 'poncho' },
    { x: 2800, holds: 'nugget' },
    { x: 3700, holds: 'gear' },
    { x: 4700, holds: 'poncho' },
    { x: 5780, holds: 'gear' },
    { x: 6720, holds: 'nugget' },
    { x: 7500, holds: 'poncho' },
    { x: 8200, holds: 'gear' },
  ],
  encounters: [
    {
      id: 'shades',
      at: 180,
      title: 'THE RITUAL HALLS',
      squad: [
        { kind: 'shade', x: 400, y: 200 },
        { kind: 'sister', x: 520, delay: 40 },
      ],
    },
    {
      id: 'first-hall',
      at: 720,
      lock: room(700, 380),
      title: 'THE FIRST HALL',
      squad: [
        { kind: 'sister', x: 920 },
        { kind: 'sister', x: 1010, delay: 30 },
        { kind: 'acolyte', x: 1060, delay: 60 },
        { kind: 'hyena', x: 1070, delay: 120 },
      ],
    },
    {
      id: 'wind-top',
      at: 1300,
      title: 'THE WIND SHAFT',
      squad: [
        { kind: 'wraith', x: 1600, y: 100 },
        { kind: 'monk', x: 1560, y: 134, delay: 60 },
      ],
    },
    {
      id: 'behind-wall',
      at: 1640,
      squad: [
        { kind: 'sister', x: 1860 },
        { kind: 'acolyte', x: 1920, delay: 30 },
      ],
    },
    {
      id: 'tunnel-shades',
      at: 2040,
      squad: [
        { kind: 'shade', x: 2250, y: 200 },
        { kind: 'sister', x: 2520, y: 208, delay: 30 },
      ],
    },
    {
      id: 'pre-hall',
      at: 2700,
      squad: [{ kind: 'monk', x: 2920, y: 198 }],
    },
    {
      id: 'hall-of-fire',
      at: 3020,
      lock: room(3000, 400),
      title: 'THE HALL OF FIRE',
      squad: [
        { kind: 'monk', x: 3300, y: 198 },
        { kind: 'sister', x: 3360, delay: 40 },
        { kind: 'shade', x: 3200, y: 200, delay: 100 },
        { kind: 'acolyte', x: 3380, delay: 160 },
      ],
    },
    {
      id: 'gallery',
      at: 3920,
      squad: [{ kind: 'ghoul', x: 4130, drops: 'nugget' }],
    },
    {
      id: 'low-hall',
      at: 3960,
      squad: [
        { kind: 'gunslinger', x: 4260, y: 208 },
        { kind: 'sister', x: 4360, y: 208, delay: 40 },
      ],
    },
    {
      id: 'second-shaft',
      at: 4760,
      squad: [
        { kind: 'acolyte', x: 4940 },
        { kind: 'wraith', x: 5040, y: 104, delay: 40 },
      ],
    },
    {
      id: 'wall-top',
      at: 5020,
      squad: [{ kind: 'sister', x: 5160 }],
    },
    {
      id: 'hall-of-winds',
      at: 5320,
      lock: room(5300, 380),
      title: 'THE HALL OF WINDS',
      squad: [
        { kind: 'wraith', x: 5650, y: 150 },
        { kind: 'shade', x: 5400, y: 200, delay: 30 },
        { kind: 'wraith', x: 5660, y: 120, delay: 60 },
        { kind: 'sister', x: 5620, delay: 90 },
        { kind: 'crow', x: 5640, y: 110, delay: 150, drops: 'gear' },
      ],
    },
    {
      id: 'tunnel-hounds',
      at: 5920,
      squad: [
        { kind: 'hyena', x: 6200, y: 208 },
        { kind: 'hyena', x: 6300, y: 208, delay: 60 },
        { kind: 'sister', x: 6450, y: 208, delay: 30 },
      ],
    },
    {
      id: 'tunnel-end',
      at: 6380,
      squad: [{ kind: 'shade', x: 6560, y: 200 }],
    },
    {
      id: 'bell-hall',
      at: 6820,
      lock: room(6800, 400),
      title: 'THE HALL OF BELLS',
      squad: [
        { kind: 'acolyte', x: 6960 },
        { kind: 'acolyte', x: 7100, delay: 30 },
        { kind: 'monk', x: 7150, y: 198, delay: 90 },
        { kind: 'shade', x: 6900, y: 200, delay: 140 },
        { kind: 'sister', x: 7180, delay: 180 },
      ],
    },
    {
      id: 'exit-wraiths',
      at: 7600,
      squad: [
        { kind: 'wraith', x: 7800, y: 160 },
        { kind: 'wraith', x: 7900, y: 130, delay: 40 },
      ],
    },
    {
      id: 'last',
      at: 8100,
      squad: [
        { kind: 'sister', x: 8300 },
        { kind: 'shade', x: 8400, y: 200, delay: 60 },
      ],
    },
  ],
  checkpoints: [40, 1130, 1950, 2910, 3860, 5240, 6600, 7600],
  secrets: [
    { id: 's6a2-confession', x: 4240, y: 74, name: 'A SISTER CONFESSION' },
    { id: 's6a2-foundry', x: 5030, y: 78, name: 'THE FOUNDRY MARK' },
  ],
  ambient: ['sister'],
  seconds: 450,
  intro: [
    'THE HALLS ARE BUILT LIKE A PRAYER:',
    'EACH ROOM HARDER THAN THE LAST.',
    'THE WIND DOWN HERE BLOWS UPWARD,',
    'TOWARD THE BELL.',
  ],
}

// --- Act 3: the bell beneath ----------------------------------------------------------------
// The root of the tower, where the Abbess rings a second bell, black as a well. The dead of the
// whole trail answer her: gunslingers and bone coyotes, ghouls and spirits, the drowned in a
// cistern, crows and harpies in a held storm, and her own sisters and shades for the last vespers.
// A ritual wind shaft lifts to the high road and her ledger. The poncho crate waits at the nave.
const bellBeneath: Act = {
  id: 's6a3',
  stage: 6,
  act: 3,
  stageName: NAME,
  actName: 'THE BELL BENEATH',
  theme: 'abbey',
  length: 9000,
  ground: groundWith(9100, [
    [1600, 48],
    [4560, 48],
  ]),
  ledges: [
    // The high road over the cistern, from the top of the wind shaft wall.
    { x: 2870, y: 112, w: 80 },
    { x: 3160, y: 96, w: 60 },
    // A ledge above the stair crown: the last litany.
    { x: 6380, y: 84, w: 36 },
  ],
  blocks: [
    { x: 960, w: 12, h: 16, look: 'grave' },
    { x: 1180, w: 12, h: 16, look: 'grave' },
    roof(1250, 300, 140),
    { x: 2800, w: 60, h: 72 },
    roof(3700, 560, 140),
    ...steps(6200, [24, 48, 72], 36),
    { x: 6308, w: 200, h: 88 },
    ...steps(6508, [64, 40, 16], 36),
    roof(7900, 300, 140),
  ],
  movers: [
    { x: 2990, y: 104, w: 36, dx: 120, dy: 0, period: 240, look: 'bell' },
    { x: 5780, y: 168, w: 40, dx: 100, dy: 0, period: 240, look: 'beam' },
  ],
  updrafts: [{ x: 2756, w: 44, top: 60, lift: 0.23 }],
  hazards: [
    ritual(1360, 40, 160, 60),
    ritual(3400, 30, 180, 90),
    ritual(3800, 40, 200, 80),
    ritual(3980, 40, 180, 70),
    ritual(4140, 40, 200, 80),
    ritual(5800, 100, 240, 90),
    ritual(8000, 40, 160, 60),
  ],
  crates: [
    { x: 260, holds: 'gear' },
    { x: 1664, holds: 'poncho' },
    { x: 2660, holds: 'gear' },
    { x: 3550, holds: 'nugget' },
    { x: 4700, holds: 'poncho' },
    { x: 5500, holds: 'gear' },
    { x: 6700, holds: 'gear' },
    { x: 7450, holds: 'nugget' },
    { x: 8600, holds: 'poncho' },
  ],
  encounters: [
    {
      id: 'the-dead',
      at: 160,
      title: 'THE DEAD ANSWER',
      squad: [
        { kind: 'spirit', x: 360 },
        { kind: 'spirit', x: 440, delay: 30 },
        { kind: 'hyena', x: 600, delay: 60 },
      ],
    },
    {
      id: 'town-ghosts',
      at: 760,
      title: 'GHOSTS OF THE TOWN',
      squad: [
        { kind: 'gunslinger', x: 1020 },
        { kind: 'gunslinger', x: 1100, delay: 40 },
      ],
    },
    {
      id: 'tunnel-shade',
      at: 1260,
      squad: [{ kind: 'shade', x: 1450, y: 200 }],
    },
    {
      id: 'bone-choir',
      at: 1720,
      lock: room(1700, 380),
      title: 'THE BONE CHOIR',
      squad: [
        { kind: 'ghoul', x: 1900 },
        { kind: 'hyena', x: 2040, delay: 30 },
        { kind: 'spirit', x: 1860, delay: 60 },
        { kind: 'sister', x: 2000, delay: 90 },
        { kind: 'imp', x: 2060, delay: 120 },
      ],
    },
    {
      id: 'shaft',
      at: 2560,
      title: 'THE WIND SHAFT',
      squad: [{ kind: 'wraith', x: 2900, y: 100 }],
    },
    {
      id: 'high-road',
      at: 2880,
      squad: [{ kind: 'crow', x: 3100, y: 70, drops: 'gear' }],
    },
    {
      id: 'cistern',
      at: 3000,
      title: 'THE CISTERN',
      squad: [
        { kind: 'drowned', x: 3150 },
        { kind: 'drowned', x: 3250, delay: 40 },
        { kind: 'leech', x: 3300, delay: 60 },
      ],
    },
    {
      id: 'tunnel-shades',
      at: 3720,
      squad: [
        { kind: 'shade', x: 3900, y: 200 },
        { kind: 'shade', x: 4060, y: 200, delay: 120 },
      ],
    },
    {
      id: 'tunnel-sister',
      at: 3960,
      squad: [{ kind: 'sister', x: 4200, y: 208 }],
    },
    {
      id: 'harpies',
      at: 4300,
      squad: [
        { kind: 'harpy', x: 4500, y: 90 },
        { kind: 'harpy', x: 4560, y: 70, delay: 40 },
      ],
    },
    {
      id: 'storm',
      at: 4820,
      lock: room(4800, 380),
      title: 'A STORM OF CROWS',
      squad: [
        { kind: 'crow', x: 4960, y: 120 },
        { kind: 'crow', x: 5000, y: 150, delay: 20 },
        { kind: 'crow', x: 5100, y: 90, delay: 60, drops: 'poncho' },
        { kind: 'wraith', x: 5160, y: 150, delay: 100 },
        { kind: 'sister', x: 5150, delay: 140 },
      ],
    },
    {
      id: 'fire-hall',
      at: 5640,
      squad: [
        { kind: 'acolyte', x: 6000 },
        { kind: 'monk', x: 6050, y: 198, delay: 40 },
      ],
    },
    {
      id: 'stair-crown',
      at: 6220,
      squad: [
        { kind: 'imp', x: 6420 },
        { kind: 'gunslinger', x: 6480, delay: 30 },
      ],
    },
    {
      id: 'vespers',
      at: 6920,
      lock: room(6900, 400),
      title: 'THE LAST VESPERS',
      squad: [
        { kind: 'sister', x: 7060 },
        { kind: 'sister', x: 7160, delay: 20 },
        { kind: 'acolyte', x: 7240, delay: 50 },
        { kind: 'shade', x: 7000, y: 200, delay: 100 },
        { kind: 'monk', x: 7280, y: 198, delay: 140 },
        { kind: 'ghoul', x: 7290, delay: 180 },
      ],
    },
    {
      id: 'procession',
      at: 7500,
      title: 'THE PROCESSION',
      squad: [
        { kind: 'spirit', x: 7650 },
        { kind: 'spirit', x: 7720, delay: 30 },
        { kind: 'hyena', x: 7840, delay: 60 },
      ],
    },
    {
      id: 'last-tunnel',
      at: 7900,
      squad: [{ kind: 'sister', x: 8120, y: 208 }],
    },
    {
      id: 'nave',
      at: 8260,
      title: 'THE BLACK BELL',
      squad: [
        { kind: 'wraith', x: 8460, y: 150 },
        { kind: 'shade', x: 8500, y: 200, delay: 40 },
      ],
    },
  ],
  checkpoints: [40, 1320, 2600, 3900, 4760, 5640, 6860, 8240],
  secrets: [
    { id: 's6a3-ledger', x: 3180, y: 82, name: 'THE ABBESS LEDGER' },
    { id: 's6a3-litany', x: 6398, y: 70, name: 'THE LAST LITANY' },
  ],
  ambient: ['spirit', 'wraith'],
  seconds: 480,
  boss: 'abbess',
  intro: [
    'AT THE ROOT OF THE TOWER HANGS A',
    'SECOND BELL, BLACK AS A WELL.',
    'THE ABBESS RINGS IT, AND THE DEAD',
    'OF THE WHOLE TRAIL ANSWER HER.',
  ],
}

export const STAGE_6_ACTS: Act[] = [undercroft, ritualHalls, bellBeneath]
