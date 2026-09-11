export const RIVALRY_OBSERVED_EVENT_KIND = 'rivalry-observed'
export const FIRST_RIVALRY_RESOLVED_MILESTONE_ID = 'first_rivalry_resolved'

export interface RivalryMilestoneState {
  shouldRecordObserved: boolean
  shouldFireResolved: boolean
}

export function rivalryMilestoneState(
  rivalryActive: boolean,
  rivalryWasObserved: boolean,
  rivalryResolvedAlready: boolean,
): RivalryMilestoneState {
  if (rivalryResolvedAlready) {
    return { shouldRecordObserved: false, shouldFireResolved: false }
  }

  if (rivalryActive) {
    return {
      shouldRecordObserved: !rivalryWasObserved,
      shouldFireResolved: false,
    }
  }

  return {
    shouldRecordObserved: false,
    shouldFireResolved: rivalryWasObserved,
  }
}
