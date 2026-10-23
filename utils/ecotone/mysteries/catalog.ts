import type { Mystery } from './types'
import { KNEELAND_RAM } from './cases/kneelandRam'
import { STUBBORN_HERD } from './cases/stubbornHerd'
import { SECOND_VOICE } from './cases/secondVoice'
import { CRAB_POT_GHOST } from './cases/crabPotGhost'
import { MIDNIGHT_MANE } from './cases/midnightMane'
import { VIRGIN_SACRIFICE } from './cases/virginSacrifice'
import { MIDNIGHT_MAGISTRATE } from './cases/midnightMagistrate'
import { CROW_COURT } from './cases/crowCourt'
import { WANDERING_ARROWS } from './cases/wanderingArrows'
import { SEA_GOAT } from './cases/seaGoat'
import { WATER_BEARER } from './cases/waterBearer'
import { TWO_TAILED_MERMAID } from './cases/twoTailedMermaid'

/** The twelve cases, in case-number order. */
export const MYSTERIES: Mystery[] = [
  KNEELAND_RAM,
  STUBBORN_HERD,
  SECOND_VOICE,
  CRAB_POT_GHOST,
  MIDNIGHT_MANE,
  VIRGIN_SACRIFICE,
  MIDNIGHT_MAGISTRATE,
  CROW_COURT,
  WANDERING_ARROWS,
  SEA_GOAT,
  WATER_BEARER,
  TWO_TAILED_MERMAID,
]
