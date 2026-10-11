// /utils/arcade/ghostTrail/campaign.ts
//
// Zuzu: Ghost Trail's book (conductor kr-arcade t-015..t-020, CAMPAIGN-BLUEPRINT.md): every act in
// play order, the stages' closing pages, and the credits. The game runs this list front to back;
// each stage's acts live in acts/.
//
// Card text is drawn in the arcade's pixel font: capitals, digits and . , ! ? - + = : / ( ) only
// (no apostrophes or quotes), and at most 34 characters a line.

import type { Act, Stage } from './world'
import { STAGE_1, STAGE_1_ACTS } from './acts/stage1'
import { STAGE_2, STAGE_2_ACTS } from './acts/stage2'
import { STAGE_3, STAGE_3_ACTS } from './acts/stage3'
import { STAGE_4, STAGE_4_ACTS } from './acts/stage4'
import { STAGE_5, STAGE_5_ACTS } from './acts/stage5'
import { STAGE_6, STAGE_6_ACTS } from './acts/stage6'

export const ACTS: Act[] = [
  ...STAGE_1_ACTS,
  ...STAGE_2_ACTS,
  ...STAGE_3_ACTS,
  ...STAGE_4_ACTS,
  ...STAGE_5_ACTS,
  ...STAGE_6_ACTS,
]

export const STAGES: Stage[] = [
  STAGE_1,
  STAGE_2,
  STAGE_3,
  STAGE_4,
  STAGE_5,
  STAGE_6,
]

/** The credits roll after the ending page: the cast (bosses by their banner titles, then the dead). */
export const CREDITS: string[] = [
  'ZUZU: GHOST TRAIL',
  'A KIND ROBOTS ARCADE GAME',
  '',
  '- STARRING -',
  'ZUZU',
  'THE KOALA RONIN',
  '',
  '- THE SIX -',
  'THE GRAVE MARSHAL',
  'LAW OF THE DEAD',
  '',
  'THE BONE BULL',
  'FROM THE THIN PLACES',
  '',
  'THE DROWNED FERRYMAN',
  'TOLL OF THE DEEP',
  '',
  'THE STORM-CROW MATRIARCH',
  'MOTHER OF THE GALE',
  '',
  'THE BELL HERETIC',
  'HE WHO RANG THE DEAD',
  '',
  'THE ABBESS',
  'BENEATH THE BELL',
  '',
  '- THE RESTLESS DEAD -',
  'RESTLESS SPIRITS',
  'STORM CROWS',
  'SPECTRAL BONE COYOTES',
  'SKELETON GUNSLINGERS',
  'GHOST MONKS',
  'GRAVE GHOULS',
  'THE DROWNED AND THEIR LEECHES',
  'STORM HARPIES',
  'WIND WRAITHS',
  'BELL IMPS',
  'FLAME ACOLYTES',
  'ABBEY SHADES',
  'THE SISTERS OF THE BELL',
  '',
  'MADE WITH CARE',
  'FOR AMIBOT AND FRIENDS',
  '',
  'THANK YOU FOR PLAYING.',
  'THE TRAIL IS QUIET NOW.',
]

/** Shown at the end only when every relic was found: what the relics remember. */
export const TRUE_ENDING: string[] = [
  'THE RELICS GROW WARM IN HIS PACK.',
  'EACH ONE A NAME THE BELL STOLE.',
  'ZUZU SPEAKS THEM ALOUD, ONE BY ONE,',
  'AND THE DEAD WALK HOME AT LAST.',
]

/**
 * Shown on the ending page after the Stage 6 outro when the novice in the abbey cage was freed
 * (s6a1's captive; the rescue is kept with the run's relics).
 */
export const RESCUE_ENDING: string[] = [
  'THE NOVICE FROM THE CAGE WAITS',
  'AT THE GATE TO WALK OUT WITH HIM.',
  'ZUZU SLOWS HIS PACE TO MATCH.',
]

/** Total relics hidden across the book. */
export const RELIC_COUNT = ACTS.reduce((n, a) => n + a.secrets.length, 0)

export function stageInfo(stage: number): Stage | undefined {
  return STAGES.find((s) => s.stage === stage)
}
