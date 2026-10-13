import { advanceWithDeadlines } from './clock'
import { DAY_ONE_INCIDENTS } from './dayOne'
import type { Campaign } from './types'

export const advancePilotClock = (
  campaign: Campaign,
  targetHour: number,
): Campaign => advanceWithDeadlines(campaign, targetHour, DAY_ONE_INCIDENTS)
