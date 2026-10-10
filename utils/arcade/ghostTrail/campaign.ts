// /utils/arcade/ghostTrail/campaign.ts
//
// Zuzu: Ghost Trail's book (conductor kr-arcade t-015..t-020, CAMPAIGN-BLUEPRINT.md): every act in
// play order, the stages' closing pages, and the credits. The game runs this list front to back;
// each stage's acts live in acts/.
//
// Card text is drawn in the arcade's pixel font: capitals, digits and . , ! ? - + = : / ( ) only
// (no apostrophes or quotes), and at most 34 characters a line.

import type { Act, Stage } from './world'
import { PROTOTYPE_ACTS } from './acts/prototype'

export const ACTS: Act[] = [...PROTOTYPE_ACTS]

export const STAGES: Stage[] = [
  { stage: 1, name: 'GHOST TOWN', outro: ['THE TOWN FALLS QUIET BEHIND HIM.'] },
  { stage: 2, name: 'THE BONE YARD', outro: ['THE BONES LIE STILL AT LAST.'] },
  {
    stage: 3,
    name: 'DROWNED WATERING HOLE',
    outro: ['THE WATER GOES FLAT AND DARK.'],
  },
  { stage: 4, name: 'MISSION BELL TOWER', outro: ['THE BELL HANGS SILENT.'] },
]

export const CREDITS: string[] = [
  'A KIND ROBOTS ARCADE GAME',
  '',
  'ZUZU',
  'THE KOALA RONIN',
  '',
  'MADE WITH CARE',
  'FOR AMIBOT AND FRIENDS',
  '',
  'THANK YOU FOR PLAYING',
]

/** Total relics hidden across the book. */
export const RELIC_COUNT = ACTS.reduce((n, a) => n + a.secrets.length, 0)

export function stageInfo(stage: number): Stage | undefined {
  return STAGES.find((s) => s.stage === stage)
}
