// /utils/arcade/ghostTrail/acts/stage1.ts
//
// Stage 1: Ghost Town / Silver Gulch (conductor kr-arcade t-015..t-020, CAMPAIGN-BLUEPRINT.md).
// Two acts, about ten minutes for a first clear.
//
// Act 1, MAIN STREET, is the tutorial street: a barrel to hop, a crate to break, narrow pits, then
// one new foe at a time (a spirit, a storm crow, a bone coyote) before they come in pairs. Ponchos
// sit in crates just ahead of the harder stretches, so the poncho rule is learned by losing one
// and finding the next. An optional water-tower climb leads to the act's relic; the town square
// is an ambush; the skeleton gunslingers walk in at the far end of the street.
//
// Act 2, THE COURTHOUSE, opens on gunslingers and the boot hill's grave ghouls, then splits: a
// rooftop run of porches, balconies and chimneys above a street of pits and gunfire. The saloon
// keeps its relic in the crawlspace under its porch, reached only by turning back along the
// street. A jailbreak ambush, the courthouse steps and its cupola, and a high-noon standoff lead
// to the Grave Marshal's street.

import type { Act, Stage } from '../world'
import { flight, graves, groundWithPits } from './build12'

export const STAGE_1: Stage = {
  stage: 1,
  name: 'GHOST TOWN',
  outro: [
    'THE GRAVE MARSHAL FALLS, AND',
    'HIS TIN STAR GOES DARK AT LAST.',
    'BUT THE BELL TOLLS AGAIN, FROM',
    'THE RAVINE EAST OF TOWN.',
    'ZUZU FOLLOWS THE SOUND.',
  ],
}

const MAIN_STREET: Act = {
  id: 's1a1',
  stage: 1,
  act: 1,
  stageName: 'GHOST TOWN',
  actName: 'MAIN STREET',
  theme: 'town',
  length: 6400,
  ground: groundWithPits(6400, [
    [540, 32],
    [1660, 40],
    [2080, 40],
    [2260, 48],
    [3520, 44],
    [3780, 48],
    [5220, 44],
    [5760, 50],
  ]),
  ledges: [
    // The saloon porch and its balcony: the first one-way boards.
    { x: 1380, y: 172, w: 96 },
    { x: 1450, y: 140, w: 90 },
    // The water tower climb (optional): porch, landing, tank walk, the tower cap and its relic.
    ...flight(3300, 172, 2, 70, 80, -36),
    { x: 3460, y: 104, w: 120 },
    { x: 3610, y: 96, w: 80 },
  ],
  blocks: [
    { x: 250, w: 14, h: 14, look: 'crate' },
    { x: 2900, w: 22, h: 12, look: 'stone' },
    { x: 5000, w: 14, h: 20, look: 'crate' },
    { x: 5880, w: 14, h: 18, look: 'crate' },
  ],
  crates: [
    { x: 400, holds: 'nugget' },
    { x: 1000, holds: 'gear' },
    { x: 2440, holds: 'poncho' },
    { x: 3180, holds: 'gear' },
    { x: 4160, holds: 'poncho' },
    { x: 4780, holds: 'gear' },
    { x: 5320, holds: 'poncho' },
    { x: 5960, holds: 'nugget' },
  ],
  encounters: [
    {
      id: 'first-dead',
      at: 640,
      title: 'THE RESTLESS DEAD',
      squad: [{ kind: 'spirit', x: 860 }],
    },
    {
      id: 'two-more',
      at: 1060,
      squad: [
        { kind: 'spirit', x: 1240 },
        { kind: 'spirit', x: 1300, delay: 50 },
      ],
    },
    {
      id: 'porch',
      at: 1400,
      squad: [{ kind: 'spirit', x: 1600 }],
    },
    {
      id: 'crow',
      at: 1720,
      title: 'STORM CROW',
      squad: [{ kind: 'crow', x: 1960, y: 120 }],
    },
    {
      id: 'crows',
      at: 1900,
      squad: [
        { kind: 'crow', x: 2150, y: 100 },
        { kind: 'crow', x: 2200, y: 130, delay: 40 },
      ],
    },
    {
      id: 'gulch-wind',
      at: 2300,
      squad: [
        { kind: 'spirit', x: 2520 },
        { kind: 'crow', x: 2600, y: 110, delay: 40, drops: 'gear' },
      ],
    },
    {
      id: 'coyote',
      at: 2760,
      title: 'BONE COYOTE',
      squad: [{ kind: 'hyena', x: 3020 }],
    },
    {
      id: 'pack',
      at: 3560,
      title: 'COYOTE PACK',
      squad: [
        { kind: 'hyena', x: 3900 },
        { kind: 'hyena', x: 3950, delay: 60 },
      ],
    },
    {
      id: 'dust',
      at: 3960,
      squad: [
        { kind: 'spirit', x: 4100 },
        { kind: 'crow', x: 4220, y: 120, delay: 40 },
      ],
    },
    {
      id: 'square',
      at: 4300,
      lock: { from: 4240, to: 4600 },
      title: 'AMBUSH',
      squad: [
        { kind: 'spirit', x: 4420 },
        { kind: 'spirit', x: 4500, delay: 40 },
        { kind: 'hyena', x: 4590, delay: 70 },
        { kind: 'crow', x: 4580, y: 110, delay: 110 },
        { kind: 'spirit', x: 4270, delay: 200 },
      ],
    },
    {
      id: 'first-draw',
      at: 4860,
      title: 'GUNSLINGER',
      squad: [{ kind: 'gunslinger', x: 5100 }],
    },
    {
      id: 'standoff',
      at: 5360,
      squad: [
        { kind: 'gunslinger', x: 5600 },
        { kind: 'spirit', x: 5500, delay: 40 },
        { kind: 'gunslinger', x: 5680, delay: 90 },
      ],
    },
    {
      id: 'last-light',
      at: 5860,
      squad: [
        { kind: 'hyena', x: 6100 },
        { kind: 'crow', x: 6160, y: 100, delay: 30 },
        { kind: 'gunslinger', x: 6240, delay: 60 },
      ],
    },
  ],
  checkpoints: [40, 1340, 2680, 3690, 4700, 5550],
  secrets: [{ id: 's1a1-tin-star', x: 3670, y: 82, name: 'GULCH TIN STAR' }],
  ambient: ['spirit'],
  seconds: 360,
  intro: [
    'A BELL TOLLS ACROSS THE DESERT,',
    'AND THE DEAD OF SILVER GULCH',
    'CLIMB OUT OF THEIR GRAVES.',
    'ZUZU WALKS IN AT MOONRISE.',
  ],
}

const THE_COURTHOUSE: Act = {
  id: 's1a2',
  stage: 1,
  act: 2,
  stageName: 'GHOST TOWN',
  actName: 'THE COURTHOUSE',
  theme: 'town',
  length: 7000,
  ground: groundWithPits(7000, [
    [820, 40],
    [1460, 48],
    [1790, 44],
    [1980, 52],
    [2170, 40],
    [2350, 48],
    [3250, 44],
    [3800, 48],
    [4290, 48],
    [4600, 52],
    [4840, 44],
    [5160, 50],
  ]),
  ledges: [
    // The rooftop route: porch, balcony, then roofs over the street's pits, and a step back down.
    { x: 1660, y: 172, w: 80 },
    { x: 1750, y: 136, w: 70 },
    { x: 1840, y: 104, w: 200 },
    { x: 2080, y: 108, w: 170 },
    { x: 2290, y: 100, w: 120 },
    { x: 2440, y: 148, w: 70 },
    // The gallows.
    { x: 3140, y: 170, w: 60 },
    // The courthouse's second storey and cupola, then down the far side.
    { x: 4100, y: 124, w: 90 },
    { x: 4210, y: 92, w: 110 },
    { x: 4350, y: 100, w: 90 },
    { x: 4470, y: 130, w: 80 },
  ],
  blocks: [
    { x: 470, w: 14, h: 20, look: 'crate' },
    ...graves(1000, 1090, 1284),
    // A chimney on the first roof.
    { x: 1930, y: 86, w: 14, h: 18, look: 'stone' },
    // The saloon: a solid wall, and a porch floor with a crawlspace under it (open on the right).
    { x: 2760, w: 20, h: 36, look: 'stone' },
    { x: 2780, y: 172, w: 170, h: 14, look: 'crate' },
    { x: 3500, w: 14, h: 18, look: 'crate' },
    // The courthouse steps.
    { x: 3960, w: 40, h: 16, look: 'stone' },
    { x: 4000, w: 40, h: 32, look: 'stone' },
    { x: 4040, w: 200, h: 44, look: 'stone' },
    { x: 5900, w: 14, h: 20, look: 'crate' },
  ],
  crates: [
    { x: 260, holds: 'gear' },
    { x: 1560, holds: 'poncho' },
    { x: 3020, holds: 'nugget' },
    { x: 3320, holds: 'poncho' },
    { x: 4720, holds: 'gear' },
    { x: 5260, holds: 'poncho' },
    { x: 6200, holds: 'poncho' },
    { x: 6450, holds: 'gear' },
  ],
  encounters: [
    {
      id: 'welcome',
      at: 360,
      title: 'COURTHOUSE ROW',
      squad: [
        { kind: 'gunslinger', x: 640 },
        { kind: 'gunslinger', x: 720, delay: 100 },
      ],
    },
    {
      id: 'boothill',
      at: 930,
      title: 'GRAVE GHOUL',
      squad: [{ kind: 'ghoul', x: 1200 }],
    },
    {
      id: 'boothill-2',
      at: 1200,
      squad: [
        { kind: 'ghoul', x: 1290 },
        { kind: 'spirit', x: 1150, delay: 90 },
      ],
    },
    {
      id: 'street-guns',
      at: 1760,
      title: 'ROOFS OR STREET',
      squad: [
        { kind: 'gunslinger', x: 2060 },
        { kind: 'gunslinger', x: 2120, delay: 60 },
      ],
    },
    {
      id: 'roof-ghoul',
      at: 2000,
      squad: [{ kind: 'ghoul', x: 2330, drops: 'nugget' }],
    },
    {
      id: 'rooftop-crows',
      at: 2200,
      squad: [
        { kind: 'crow', x: 2460, y: 90 },
        { kind: 'crow', x: 2520, y: 150, delay: 50, drops: 'gear' },
      ],
    },
    {
      id: 'saloon',
      at: 2720,
      title: 'THE SALOON',
      squad: [
        { kind: 'gunslinger', x: 2880 },
        { kind: 'spirit', x: 2700, delay: 60 },
      ],
    },
    {
      id: 'gallows',
      at: 3000,
      squad: [{ kind: 'ghoul', x: 3170, drops: 'nugget' }],
    },
    {
      id: 'jailbreak',
      at: 3420,
      lock: { from: 3360, to: 3720 },
      title: 'JAILBREAK',
      squad: [
        { kind: 'ghoul', x: 3690 },
        { kind: 'gunslinger', x: 3640, delay: 40 },
        { kind: 'spirit', x: 3380, delay: 90 },
        { kind: 'crow', x: 3700, y: 100, delay: 220 },
      ],
    },
    {
      id: 'court-guards',
      at: 3900,
      title: 'THE COURTHOUSE',
      squad: [
        { kind: 'gunslinger', x: 4070 },
        { kind: 'gunslinger', x: 4200, delay: 50 },
      ],
    },
    {
      id: 'cupola',
      at: 4150,
      squad: [{ kind: 'ghoul', x: 4400, drops: 'poncho' }],
    },
    {
      id: 'bailiffs',
      at: 4700,
      squad: [
        { kind: 'hyena', x: 4960 },
        { kind: 'hyena', x: 5000, delay: 40 },
        { kind: 'gunslinger', x: 5060, delay: 80 },
      ],
    },
    {
      id: 'deputies',
      at: 5200,
      squad: [
        { kind: 'ghoul', x: 5390 },
        { kind: 'gunslinger', x: 5500, delay: 40 },
        { kind: 'spirit', x: 5330, delay: 80 },
      ],
    },
    {
      id: 'high-noon',
      at: 5800,
      lock: { from: 5740, to: 6100 },
      title: 'HIGH NOON',
      squad: [
        { kind: 'gunslinger', x: 5980 },
        { kind: 'ghoul', x: 6080 },
        { kind: 'gunslinger', x: 6050, delay: 60 },
        { kind: 'hyena', x: 6090, delay: 120 },
      ],
    },
    {
      id: 'last-call',
      at: 6300,
      squad: [
        { kind: 'spirit', x: 6500 },
        { kind: 'crow', x: 6560, y: 110, delay: 30 },
      ],
    },
  ],
  checkpoints: [40, 1320, 2600, 3900, 4760, 5620, 6620],
  secrets: [
    { id: 's1a2-piano-key', x: 2800, y: 194, name: 'SALOON PIANO KEY' },
  ],
  ambient: ['spirit', 'crow'],
  seconds: 400,
  boss: 'marshal',
  intro: [
    'THE OLD MARSHAL STILL HOLDS',
    'COURT IN SILVER GULCH AT NIGHT.',
    'TAKE THE ROOFS OR THE STREET.',
    'EITHER WAY, HE IS WAITING.',
  ],
}

export const STAGE_1_ACTS: Act[] = [MAIN_STREET, THE_COURTHOUSE]
