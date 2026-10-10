// /utils/arcade/ghostTrail/acts/stage1.ts
//
// Stage 1: Ghost Town (conductor kr-arcade t-015..t-020, CAMPAIGN-BLUEPRINT.md).
// PLACEHOLDER: a single prototype act stands in until the stage's authored acts land.

import type { Act, Stage } from '../world'

export const STAGE_1: Stage = {
  stage: 1,
  name: 'GHOST TOWN',
  outro: ['THE TOWN FALLS QUIET BEHIND HIM.'],
}

export const STAGE_1_ACTS: Act[] = [
  {
    id: 's1a1',
    stage: 1,
    act: 1,
    stageName: 'GHOST TOWN',
    actName: 'THE OLD TRAIL',
    theme: 'town',
    length: 3520,
    ground: [
      [0, 620],
      [664, 1160],
      [1204, 1720],
      [1764, 2420],
      [2466, 2920],
      [2964, 3700],
    ],
    ledges: [
      { x: 300, y: 164, w: 96 },
      { x: 900, y: 156, w: 80 },
      { x: 1380, y: 148, w: 112 },
      { x: 2000, y: 160, w: 120 },
      { x: 2590, y: 152, w: 96 },
      { x: 3120, y: 156, w: 104 },
    ],
    blocks: [
      { x: 446, w: 12, h: 16, look: 'grave' },
      { x: 1004, w: 12, h: 16, look: 'grave' },
      { x: 1594, w: 12, h: 16, look: 'grave' },
      { x: 2204, w: 12, h: 16, look: 'grave' },
      { x: 2754, w: 12, h: 16, look: 'grave' },
      { x: 3124, w: 12, h: 16, look: 'grave' },
    ],
    crates: [
      { x: 560, holds: 'gear' },
      { x: 820, holds: 'nugget' },
      { x: 1300, holds: 'gear' },
      { x: 1930, holds: 'poncho' },
      { x: 2340, holds: 'gear' },
      { x: 2700, holds: 'poncho' },
      { x: 3050, holds: 'gear' },
      { x: 3340, holds: 'nugget' },
    ],
    encounters: [
      {
        id: 'saloon',
        at: 700,
        title: 'GUNSLINGERS',
        squad: [
          { kind: 'gunslinger', x: 960 },
          { kind: 'gunslinger', x: 1050, delay: 60 },
        ],
      },
      {
        id: 'graves',
        at: 2380,
        lock: { from: 2300, to: 2700 },
        title: 'AMBUSH',
        squad: [
          { kind: 'ghoul', x: 2560 },
          { kind: 'spirit', x: 2480, delay: 30 },
          { kind: 'spirit', x: 2620, delay: 90 },
          { kind: 'crow', x: 2700, y: 110, delay: 120, drops: 'gear' },
        ],
      },
    ],
    checkpoints: [40, 1800],
    secrets: [{ id: 's1a1-relic', x: 346, y: 150, name: 'HIDDEN RELIC' }],
    ambient: ['spirit', 'crow', 'hyena'],
    seconds: 150,
    boss: 'devil',
    intro: [],
  },
]
