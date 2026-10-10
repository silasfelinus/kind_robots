// /utils/arcade/ghostTrail/acts/stage3.ts
//
// Stage 3: Drowned Watering Hole (conductor kr-arcade t-015..t-020, CAMPAIGN-BLUEPRINT.md).
// PLACEHOLDER: a single prototype act stands in until the stage's authored acts land.

import type { Act, Stage } from '../world'

export const STAGE_3: Stage = {
  stage: 3,
  name: 'DROWNED WATERING HOLE',
  outro: ['THE WATER GOES FLAT AND DARK.'],
}

export const STAGE_3_ACTS: Act[] = [
  {
    id: 's3a1',
    stage: 3,
    act: 1,
    stageName: 'DROWNED WATERING HOLE',
    actName: 'THE OLD TRAIL',
    theme: 'waterhole',
    length: 3520,
    ground: [
      [0, 460],
      [504, 900],
      [944, 1320],
      [1364, 1740],
      [1784, 2200],
      [2244, 2620],
      [2664, 3000],
      [3044, 3700],
    ],
    ledges: [
      { x: 560, y: 162, w: 100 },
      { x: 1420, y: 152, w: 96 },
      { x: 2300, y: 158, w: 110 },
      { x: 2700, y: 150, w: 90 },
    ],
    blocks: [
      { x: 294, w: 12, h: 16, look: 'grave' },
      { x: 694, w: 12, h: 16, look: 'grave' },
      { x: 1144, w: 12, h: 16, look: 'grave' },
      { x: 1494, w: 12, h: 16, look: 'grave' },
      { x: 1994, w: 12, h: 16, look: 'grave' },
      { x: 2444, w: 12, h: 16, look: 'grave' },
      { x: 2844, w: 12, h: 16, look: 'grave' },
      { x: 3144, w: 12, h: 16, look: 'grave' },
    ],
    crates: [
      { x: 620, holds: 'gear' },
      { x: 820, holds: 'nugget' },
      { x: 1240, holds: 'gear' },
      { x: 1900, holds: 'poncho' },
      { x: 2100, holds: 'gear' },
      { x: 2520, holds: 'poncho' },
      { x: 2930, holds: 'gear' },
      { x: 3340, holds: 'nugget' },
    ],
    encounters: [
      {
        id: 'shallows',
        at: 500,
        squad: [
          { kind: 'drowned', x: 760 },
          { kind: 'leech', x: 820, delay: 20 },
          { kind: 'leech', x: 860, delay: 50 },
        ],
      },
    ],
    tide: { low: 236, high: 196, period: 1500 },
    checkpoints: [40, 1800],
    secrets: [{ id: 's3a1-relic', x: 608, y: 148, name: 'HIDDEN RELIC' }],
    ambient: ['spirit', 'crow', 'hyena'],
    seconds: 150,
    boss: 'devil',
    intro: [],
  },
]
