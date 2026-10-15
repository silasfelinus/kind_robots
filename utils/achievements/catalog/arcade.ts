// /utils/achievements/catalog/arcade.ts
//
// The three achievements of every arcade cabinet, judged from a finished run.

import type { GameAchievementDef } from '../gameAchievements'
import { GROUP_1 } from './arcadeGroup1'
import { GROUP_2 } from './arcadeGroup2'
import { GROUP_3 } from './arcadeGroup3'
import { GROUP_4 } from './arcadeGroup4'

export const ARCADE_ACHIEVEMENT_DEFS: GameAchievementDef[] = [
  ...GROUP_1,
  ...GROUP_2,
  ...GROUP_3,
  ...GROUP_4,
]
