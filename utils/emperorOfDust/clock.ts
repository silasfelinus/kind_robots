import { advanceClock, neglectIncident, timeAt } from './engine'
import type { Campaign, Incident } from './types'

export const advanceWithDeadlines = (
  state: Campaign,
  targetHour: number,
  incidents: readonly Incident[],
): Campaign => {
  if (!Number.isSafeInteger(targetHour) || targetHour < state.hour) {
    throw new Error('Cannot rewind the court clock')
  }
  const overdue = incidents
    .filter((incident) => {
      const deadline = timeAt(incident.day, incident.deadlineHour)
      return (
        deadline >= state.hour &&
        deadline < targetHour &&
        !state.ignoredIncidentIds.includes(incident.id) &&
        !state.dispatches.some((mission) => mission.incidentId === incident.id)
      )
    })
    .sort((a, b) =>
      timeAt(a.day, a.deadlineHour) - timeAt(b.day, b.deadlineHour),
    )

  let next = state
  for (const incident of overdue) {
    const deadline = timeAt(incident.day, incident.deadlineHour)
    next = advanceClock(next, deadline)
    next = neglectIncident(next, incident)
  }
  return advanceClock(next, targetHour)
}

export const upcomingMoment = (
  state: Campaign,
  incidents: readonly Incident[],
): number => {
  const upcoming = [
    ...incidents
      .filter(
        (incident) =>
          !state.ignoredIncidentIds.includes(incident.id) &&
          !state.dispatches.some((mission) => mission.incidentId === incident.id),
      )
      .flatMap((incident) => [
        timeAt(incident.day, incident.opensAtHour),
        timeAt(incident.day, incident.deadlineHour) + 1,
      ]),
    ...state.dispatches.flatMap((mission) => [
      mission.resolvesAt,
      mission.returnsAt,
    ]),
  ].filter((time) => time > state.hour && time <= timeAt(101, 0))

  return Math.min(state.hour + 1, ...upcoming)
}
