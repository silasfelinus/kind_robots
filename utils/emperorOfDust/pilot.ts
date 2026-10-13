import { advanceClock, neglectIncident, timeAt } from './engine'
import { DAY_ONE_INCIDENTS } from './dayOne'
import type { Campaign } from './types'

/**
 * A paused game clock moves only when the player chooses to advance.
 * Expired and unanswered incidents receive their explicitly authored
 * "sent no one" consequence, at the deadline, exactly once.
 */
export const advancePilotClock = (
  campaign: Campaign,
  targetHour: number,
): Campaign => {
  const overdue = DAY_ONE_INCIDENTS.filter((incident) => {
    const deadline = timeAt(incident.day, incident.deadlineHour)
    return campaign.hour <= deadline && targetHour > deadline
  }).sort(
    (left, right) =>
      timeAt(left.day, left.deadlineHour) -
      timeAt(right.day, right.deadlineHour),
  )

  let next = campaign
  for (const incident of overdue) {
    const deadline = timeAt(incident.day, incident.deadlineHour)
    next = advanceClock(next, deadline)
    if (
      !next.ignoredIncidentIds.includes(incident.id) &&
      !next.dispatches.some((mission) => mission.incidentId === incident.id)
    ) {
      next = neglectIncident(next, incident)
    }
  }

  return advanceClock(next, targetHour)
}
