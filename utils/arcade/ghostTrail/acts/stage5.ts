// /utils/arcade/ghostTrail/acts/stage5.ts
//
// Stage 5: Mission Bell Tower (conductor kr-arcade t-015..t-020, CAMPAIGN-BLUEPRINT.md).
// PLACEHOLDER: a single prototype act stands in until the stage's authored acts land.

import type { Act, Stage } from '../world'

export const STAGE_5: Stage = {
  stage: 5,
  name: 'MISSION BELL TOWER',
  outro: ['THE BELL HANGS SILENT.'],
}

export const STAGE_5_ACTS: Act[] = [
  {
    id: 's5a1',
    stage: 5,
    act: 1,
    stageName: 'MISSION BELL TOWER',
    actName: 'THE OLD TRAIL',
    theme: 'belltower',
    length: 3520,
    ground: [
      [0, 700],
      [744, 1240],
      [1284, 1700],
      [1744, 2480],
      [2524, 3000],
      [3044, 3700],
    ],
    ledges: [
      { x: 350, y: 158, w: 110 },
      { x: 820, y: 150, w: 110 },
      { x: 1350, y: 146, w: 120 },
      { x: 1950, y: 152, w: 120 },
      { x: 2600, y: 150, w: 110 },
    ],
    blocks: [
      { x: 514, w: 12, h: 16, look: 'grave' },
      { x: 994, w: 12, h: 16, look: 'grave' },
      { x: 1494, w: 12, h: 16, look: 'grave' },
      { x: 2094, w: 12, h: 16, look: 'grave' },
      { x: 2344, w: 12, h: 16, look: 'grave' },
      { x: 2794, w: 12, h: 16, look: 'grave' },
      { x: 3144, w: 12, h: 16, look: 'grave' },
    ],
    crates: [
      { x: 460, holds: 'gear' },
      { x: 880, holds: 'nugget' },
      { x: 1150, holds: 'gear' },
      { x: 1900, holds: 'poncho' },
      { x: 2250, holds: 'gear' },
      { x: 2700, holds: 'poncho' },
      { x: 2940, holds: 'gear' },
      { x: 3340, holds: 'nugget' },
    ],
    encounters: [
      {
        id: 'belfry',
        at: 1200,
        title: 'THE BELFRY',
        squad: [
          { kind: 'imp', x: 1420 },
          { kind: 'acolyte', x: 1520, delay: 30 },
          { kind: 'monk', x: 1600, y: 120, delay: 60 },
        ],
      },
    ],
    movers: [
      { x: 2440, y: 176, w: 40, dx: 0, dy: -36, period: 180, look: 'lift' },
    ],
    hazards: [{ x: 1700, w: 40, kind: 'coals', period: 180, on: 90 }],
    checkpoints: [40, 1800],
    secrets: [{ id: 's5a1-relic', x: 394, y: 144, name: 'HIDDEN RELIC' }],
    ambient: ['spirit', 'crow', 'hyena'],
    seconds: 150,
    boss: 'bull',
    intro: [],
  },
]
