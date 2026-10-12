import type { Campaign, Follower, Incident } from './types'

const object = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const int = (value: unknown, low: number, high: number): value is number =>
  Number.isSafeInteger(value) &&
  (value as number) >= low &&
  (value as number) <= high

const text = (value: unknown, max = 200): value is string =>
  typeof value === 'string' && value.length > 0 && value.length <= max

const effect = (value: unknown): boolean =>
  object(value) &&
  ['prosperity', 'popularity', 'horde'].every(
    (key) => value[key] === undefined || int(value[key], -500, 500),
  )

const follower = (value: unknown): value is Follower => {
  if (!object(value) || !object(value.stats)) return false
  const stats = value.stats
  return (
    text(value.id, 30) &&
    text(value.name, 100) &&
    ['might', 'diplomacy', 'ingenuity'].every((key) => int(stats[key], 0, 5)) &&
    Array.isArray(value.specialties) &&
    value.specialties.length <= 12 &&
    value.specialties.every((tag: unknown) => text(tag, 60)) &&
    (value.dead === undefined || typeof value.dead === 'boolean') &&
    (value.injuredUntilDay === undefined ||
      int(value.injuredUntilDay, 1, 102)) &&
    (value.availableOnDay === undefined || int(value.availableOnDay, 1, 101))
  )
}

const incident = (value: unknown): value is Incident => {
  if (!object(value) || !Array.isArray(value.choices)) return false
  return (
    text(value.id, 100) &&
    text(value.title, 200) &&
    text(value.destinationId, 80) &&
    int(value.day, 1, 100) &&
    int(value.opensAtHour, 0, 23) &&
    int(value.deadlineHour, 0, 23) &&
    value.deadlineHour >= value.opensAtHour &&
    int(value.outwardHours, 1, 5) &&
    int(value.missionHours, 1, 12) &&
    int(value.hordeMinimum, 0, 250) &&
    int(value.hordeMaximum, 0, 250) &&
    value.hordeMinimum <= value.hordeMaximum &&
    effect(value.neglected) &&
    value.choices.length >= 1 &&
    value.choices.length <= 12 &&
    value.choices.every((choice: unknown) => {
      if (!object(choice)) return false
      return (
        text(choice.id, 80) &&
        text(choice.label, 300) &&
        ['might', 'diplomacy', 'ingenuity'].includes(String(choice.approach)) &&
        int(choice.difficulty, 1, 12) &&
        (choice.specialty === undefined || text(choice.specialty, 60)) &&
        effect(choice.success) &&
        effect(choice.failure) &&
        (choice.moralEffect === undefined || effect(choice.moralEffect)) &&
        (choice.injuryDaysOnFailure === undefined ||
          int(choice.injuryDaysOnFailure, 0, 10))
      )
    })
  )
}

export const isSavedEmperorCampaign = (value: unknown): value is Campaign => {
  if (!object(value)) return false
  if (
    value.version !== 1 ||
    !int(value.seed, -2147483648, 4294967295) ||
    !int(value.hour, 0, 2400) ||
    !int(value.prosperity, 0, 100) ||
    !int(value.popularity, 0, 100) ||
    !int(value.hordeCap, 0, 250) ||
    !int(value.horde, 0, value.hordeCap as number) ||
    !Array.isArray(value.followers) ||
    !Array.isArray(value.dispatches) ||
    !Array.isArray(value.ignoredIncidentIds) ||
    !Array.isArray(value.log) ||
    value.followers.length > 100 ||
    value.dispatches.length > 1000 ||
    value.ignoredIncidentIds.length > 1000 ||
    value.log.length > 5000 ||
    !value.followers.every(follower) ||
    !value.ignoredIncidentIds.every((id: unknown) => text(id, 100))
  ) {
    return false
  }

  const roster = new Set(value.followers.map((item: Follower) => item.id))
  if (roster.size !== value.followers.length) return false
  if (
    value.flags !== undefined &&
    (!Array.isArray(value.flags) ||
      value.flags.length > 500 ||
      !value.flags.every((flag: unknown) => text(flag, 100)))
  ) {
    return false
  }
  if (
    value.memorials !== undefined &&
    (!Array.isArray(value.memorials) ||
      value.memorials.length > 100 ||
      !value.memorials.every(
        (entry: unknown) =>
          object(entry) &&
          text(entry.followerId, 30) &&
          text(entry.incidentId, 100) &&
          text(entry.reason, 500),
      ))
  ) {
    return false
  }
  if (
    !value.log.every(
      (entry: unknown) =>
        object(entry) &&
        int(entry.hour, 0, 2400) &&
        text(entry.incidentId, 100) &&
        ['ignored', 'resolved', 'returned'].includes(String(entry.type)) &&
        text(entry.detail, 500),
    )
  ) {
    return false
  }

  const dispatched = new Set<string>()
  let committed = 0
  for (const entry of value.dispatches) {
    if (
      !object(entry) ||
      !text(entry.incidentId, 100) ||
      dispatched.has(entry.incidentId) ||
      !text(entry.choiceId, 80) ||
      !Array.isArray(entry.leaders) ||
      entry.leaders.length < 1 ||
      entry.leaders.length > 3 ||
      !entry.leaders.every(
        (id: unknown) => typeof id === 'string' && roster.has(id),
      ) ||
      new Set(entry.leaders).size !== entry.leaders.length ||
      !int(entry.hordeSent, 0, 250) ||
      !int(entry.hordeSurvivors, 0, entry.hordeSent) ||
      !int(entry.departedAt, 0, 2400) ||
      !int(entry.arrivesAt, entry.departedAt, 2400) ||
      !int(entry.resolvesAt, entry.arrivesAt, 2400) ||
      !int(entry.returnsAt, entry.resolvesAt, 2420) ||
      !incident(entry.incident)
    ) {
      return false
    }
    if (entry.returnsAt > value.hour) committed += entry.hordeSurvivors
    if (entry.outcome !== undefined) {
      const o = entry.outcome
      if (
        !object(o) ||
        !text(o.choiceId, 80) ||
        !Array.isArray(o.dice) ||
        o.dice.length !== 2 ||
        !o.dice.every((die: unknown) => int(die, 1, 6)) ||
        !int(o.target, 1, 25) ||
        !int(o.modifier, 0, 20) ||
        typeof o.success !== 'boolean' ||
        !int(o.lostHorde, 0, entry.hordeSent) ||
        !effect(o.effects) ||
        (o.injuredFollowerId !== undefined &&
          !roster.has(String(o.injuredFollowerId))) ||
        (o.injuredUntilDay !== undefined && !int(o.injuredUntilDay, 1, 102))
      ) {
        return false
      }
    }
    dispatched.add(entry.incidentId)
  }
  return committed <= value.horde
}

export const decodeEmperorSave = (raw: string | null): Campaign | null => {
  if (!raw || raw.length > 2_000_000) return null
  try {
    const parsed: unknown = JSON.parse(raw)
    if (!object(parsed) || parsed.format !== 1) return null
    return isSavedEmperorCampaign(parsed.campaign) ? parsed.campaign : null
  } catch {
    return null
  }
}

export const encodeEmperorSave = (campaign: Campaign): string => {
  if (!isSavedEmperorCampaign(campaign))
    throw new Error('Invalid campaign state')
  return JSON.stringify({ format: 1, campaign })
}
