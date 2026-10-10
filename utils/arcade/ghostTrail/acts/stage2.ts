// /utils/arcade/ghostTrail/acts/stage2.ts
//
// Stage 2: The Bone Yard (conductor kr-arcade t-015..t-020, CAMPAIGN-BLUEPRINT.md).
// PLACEHOLDER: a single prototype act stands in until the stage's authored acts land.

import type { Act, Stage } from '../world'

export const STAGE_2: Stage = {
  stage: 2,
  name: 'THE BONE YARD',
  outro: ['THE BONES LIE STILL AT LAST.'],
}

export const STAGE_2_ACTS: Act[] = [
  {
    id: 's2a1',
    stage: 2,
    act: 1,
    stageName: 'THE BONE YARD',
    actName: 'THE OLD TRAIL',
    theme: 'boneyard',
    length: 3520,
    ground: [
      [0, 520],
      [564, 1100],
      [1144, 1540],
      [1584, 2300],
      [2344, 2860],
      [2904, 3700],
    ],
    ledges: [
      { x: 250, y: 160, w: 90 },
      { x: 1200, y: 150, w: 100 },
      { x: 1900, y: 156, w: 110 },
      { x: 2560, y: 150, w: 90 },
    ],
    blocks: [
      { x: 374, w: 12, h: 16, look: 'grave' },
      { x: 754, w: 12, h: 16, look: 'grave' },
      { x: 974, w: 12, h: 16, look: 'grave' },
      { x: 1294, w: 12, h: 16, look: 'grave' },
      { x: 1694, w: 12, h: 16, look: 'grave' },
      { x: 2044, w: 12, h: 16, look: 'grave' },
      { x: 2494, w: 12, h: 16, look: 'grave' },
      { x: 2694, w: 12, h: 16, look: 'grave' },
      { x: 3094, w: 12, h: 16, look: 'grave' },
    ],
    crates: [
      { x: 440, holds: 'gear' },
      { x: 860, holds: 'nugget' },
      { x: 1380, holds: 'gear' },
      { x: 1950, holds: 'poncho' },
      { x: 2200, holds: 'gear' },
      { x: 2620, holds: 'poncho' },
      { x: 3000, holds: 'gear' },
      { x: 3340, holds: 'nugget' },
    ],
    encounters: [
      {
        id: 'ossuary',
        at: 900,
        lock: { from: 860, to: 1180 },
        title: 'THE BONE PIT',
        squad: [
          { kind: 'ghoul', x: 1100 },
          { kind: 'hyena', x: 1170, delay: 40 },
          { kind: 'hyena', x: 1170, delay: 140, drops: 'poncho' },
        ],
      },
    ],
    hazards: [{ x: 1900, w: 30, kind: 'spikes' }],
    checkpoints: [40, 1800],
    secrets: [{ id: 's2a1-relic', x: 295, y: 146, name: 'HIDDEN RELIC' }],
    ambient: ['spirit', 'crow', 'hyena'],
    seconds: 150,
    boss: 'bull',
    intro: [],
  },
]
