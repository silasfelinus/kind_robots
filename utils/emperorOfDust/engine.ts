import type {
  Campaign,
  Choice,
  Dispatch,
  Effects,
  Follower,
  Incident,
  MissionOutcome,
  OddsPreview,
} from './types'

const DAY_HOURS = 24
const DAY_ONE = 1
const DEFAULT_START_HOUR = 7

const integer = (value: number, label: string): void => {
  if (!Number.isSafeInteger(value))
    throw new Error(`${label} must be an integer`)
}
const clamp = (value: number, floor: number, ceiling: number): number =>
  Math.max(floor, Math.min(ceiling, value))

export const dayAt = (hour: number): number =>
  Math.floor(hour / DAY_HOURS) + DAY_ONE

export const timeAt = (day: number, hour: number): number =>
  (day - DAY_ONE) * DAY_HOURS + hour

export const availableHorde = (state: Campaign): number => {
  const committed = state.dispatches
    .filter((mission) => mission.returnsAt > state.hour)
    .reduce((total, mission) => total + mission.hordeSurvivors, 0)
  return Math.max(0, state.horde - committed)
}

export const availableFollowers = (state: Campaign): Follower[] => {
  const traveling = new Set(
    state.dispatches
      .filter((mission) => mission.returnsAt > state.hour)
      .flatMap((mission) => mission.leaders),
  )
  return state.followers.filter(
    (leader) =>
      !leader.dead &&
      !traveling.has(leader.id) &&
      (leader.injuredUntilDay ?? 0) <= dayAt(state.hour) &&
      (leader.availableOnDay ?? 0) <= dayAt(state.hour),
  )
}

export const createCampaign = (
  seed: number,
  followers: Follower[],
  horde = 60,
): Campaign => {
  integer(seed, 'seed')
  integer(horde, 'horde')
  if (horde < 0 || horde > 250) throw new Error('invalid Horde strength')
  if (new Set(followers.map((leader) => leader.id)).size !== followers.length) {
    throw new Error('duplicate follower IDs')
  }
  for (const leader of followers) {
    if (
      Object.values(leader.stats).some(
        (stat) => !Number.isInteger(stat) || stat < 0 || stat > 5,
      )
    ) {
      throw new Error(`invalid stats for ${leader.id}`)
    }
  }
  return {
    version: 1,
    seed,
    hour: DEFAULT_START_HOUR,
    prosperity: 45,
    popularity: 55,
    horde,
    hordeCap: 250,
    followers: followers.map((leader) => ({
      ...leader,
      stats: { ...leader.stats },
      specialties: [...leader.specialties],
    })),
    dispatches: [],
    ignoredIncidentIds: [],
    log: [],
    flags: [],
    memorials: [],
  }
}

const assertIncident = (incident: Incident): void => {
  const fields: [number, string][] = [
    [incident.day, 'day'],
    [incident.opensAtHour, 'opensAtHour'],
    [incident.deadlineHour, 'deadlineHour'],
    [incident.outwardHours, 'outwardHours'],
    [incident.missionHours, 'missionHours'],
    [incident.hordeMinimum, 'hordeMinimum'],
    [incident.hordeMaximum, 'hordeMaximum'],
  ]
  fields.forEach(([value, label]) => integer(value, label))
  if (
    incident.day < 1 ||
    incident.day > 100 ||
    incident.opensAtHour < 0 ||
    incident.deadlineHour > 23 ||
    incident.deadlineHour < incident.opensAtHour ||
    incident.outwardHours < 1 ||
    incident.outwardHours > 5 ||
    incident.missionHours < 1 ||
    incident.missionHours > 12 ||
    incident.hordeMinimum < 0 ||
    incident.hordeMaximum < incident.hordeMinimum ||
    incident.choices.length === 0 ||
    new Set(incident.choices.map((choice) => choice.id)).size !==
      incident.choices.length
  ) {
    throw new Error(`invalid incident: ${incident.id}`)
  }
  for (const choice of incident.choices) {
    integer(choice.difficulty, 'difficulty')
    if (choice.difficulty < 1 || choice.difficulty > 12) {
      throw new Error('invalid difficulty')
    }
    if (choice.injuryDaysOnFailure !== undefined) {
      integer(choice.injuryDaysOnFailure, 'injuryDaysOnFailure')
      if (choice.injuryDaysOnFailure < 0 || choice.injuryDaysOnFailure > 10) {
        throw new Error('invalid injury days')
      }
    }
  }
}

const ensureOpen = (state: Campaign, incident: Incident): void => {
  assertIncident(incident)
  if (dayAt(state.hour) !== incident.day) {
    throw new Error('incident is not on this day')
  }
  if (
    state.hour < timeAt(incident.day, incident.opensAtHour) ||
    state.hour > timeAt(incident.day, incident.deadlineHour)
  ) {
    throw new Error('incident is not open')
  }
  if (
    state.ignoredIncidentIds.includes(incident.id) ||
    state.dispatches.some((dispatch) => dispatch.incidentId === incident.id)
  ) {
    throw new Error('incident was already answered')
  }
}

const additive = (a?: Effects, b?: Effects): Effects => ({
  prosperity: (a?.prosperity ?? 0) + (b?.prosperity ?? 0),
  popularity: (a?.popularity ?? 0) + (b?.popularity ?? 0),
  horde: (a?.horde ?? 0) + (b?.horde ?? 0),
})

const applyEconomy = (
  state: Campaign,
  effects: Effects,
  maxHordeLoss: number,
  atHour: number,
): void => {
  state.prosperity = clamp(state.prosperity + (effects.prosperity ?? 0), 0, 100)
  state.popularity = clamp(state.popularity + (effects.popularity ?? 0), 0, 100)
  const committed = state.dispatches
    .filter((mission) => mission.returnsAt > atHour)
    .reduce((total, mission) => total + mission.hordeSurvivors, 0)
  state.horde = clamp(
    state.horde + Math.max(-maxHordeLoss, effects.horde ?? 0),
    committed,
    state.hordeCap,
  )
}

const chooseLeaders = (state: Campaign, leaderIds: string[]): Follower[] => {
  if (
    leaderIds.length < 1 ||
    leaderIds.length > 3 ||
    new Set(leaderIds).size !== leaderIds.length
  ) {
    throw new Error('dispatch requires one to three distinct leaders')
  }
  const eligible = new Map(
    availableFollowers(state).map((leader) => [leader.id, leader]),
  )
  return leaderIds.map((id) => {
    const follower = eligible.get(id)
    if (!follower) throw new Error(`leader unavailable: ${id}`)
    return follower
  })
}

const chooseAction = (incident: Incident, choiceId: string): Choice => {
  const choice = incident.choices.find((item) => item.id === choiceId)
  if (!choice) throw new Error(`unknown choice: ${choiceId}`)
  return choice
}

const calculateOdds = (
  incident: Incident,
  choice: Choice,
  leaders: Follower[],
  assignedHorde: number,
  departure: number,
): OddsPreview => {
  const sorted = leaders
    .map((leader) => leader.stats[choice.approach])
    .sort((a, b) => b - a)
  const primary = sorted[0] ?? 0
  const teamwork = clamp(
    Math.floor(sorted.slice(1).reduce((sum, stat) => sum + stat, 0) / 4),
    0,
    2,
  )
  const specialty = choice.specialty
    ? Number(
        leaders.some((leader) =>
          leader.specialties.includes(choice.specialty!),
        ),
      )
    : 0
  const troops = clamp(Math.floor(assignedHorde / 10), 0, 2)
  const modifier = primary + teamwork + specialty + troops
  const target = 8 + choice.difficulty
  let numerator = 0
  for (let first = 1; first <= 6; first += 1) {
    for (let second = 1; second <= 6; second += 1) {
      if (first + second + modifier >= target) numerator += 1
    }
  }
  return {
    modifier,
    target,
    numerator,
    denominator: 36,
    probability: numerator / 36,
    projectedReturnHour:
      departure + incident.outwardHours * 2 + incident.missionHours,
  }
}

export const previewDispatch = (
  state: Campaign,
  incident: Incident,
  leaderIds: string[],
  hordeSent: number,
  choiceId: string,
  useHourglass = false,
): OddsPreview => {
  ensureOpen(state, incident)
  const canUseHourglass =
    (state.equippedRelics ?? []).includes('komodo-brass-hourglass') &&
    (state.relicUses?.['komodo-brass-hourglass'] ?? 0) !== dayAt(state.hour) &&
    incident.outwardHours > 1
  if (useHourglass && !canUseHourglass)
    throw new Error('Brass Hourglass is not available for this mission')
  const outbound = incident.outwardHours - Number(useHourglass)
  integer(hordeSent, 'hordeSent')
  const leaders = chooseLeaders(state, leaderIds)
  if (
    hordeSent < incident.hordeMinimum ||
    hordeSent > incident.hordeMaximum ||
    hordeSent > availableHorde(state)
  ) {
    throw new Error('Horde contingent unavailable or outside mission limits')
  }
  if (state.hour + outbound > timeAt(incident.day, incident.deadlineHour)) {
    throw new Error('cannot reach incident before deadline')
  }
  const odds = calculateOdds(
    incident,
    chooseAction(incident, choiceId),
    leaders,
    hordeSent,
    state.hour,
  )
  return {
    ...odds,
    projectedReturnHour:
      state.hour + outbound + incident.missionHours + incident.outwardHours,
  }
}

export const dispatchFollowers = (
  state: Campaign,
  incident: Incident,
  leaderIds: string[],
  hordeSent: number,
  choiceId: string,
  useHourglass = false,
): Campaign => {
  previewDispatch(state, incident, leaderIds, hordeSent, choiceId, useHourglass)
  const arrivesAt = state.hour + incident.outwardHours - Number(useHourglass)
  const dispatch: Dispatch = {
    incidentId: incident.id,
    choiceId,
    leaders: [...leaderIds],
    hordeSent,
    hordeSurvivors: hordeSent,
    departedAt: state.hour,
    arrivesAt,
    resolvesAt: arrivesAt + incident.missionHours,
    returnsAt: arrivesAt + incident.missionHours + incident.outwardHours,
    incident,
  }
  return {
    ...state,
    dispatches: [...state.dispatches, dispatch],
    ...(useHourglass
      ? {
          relicUses: {
            ...state.relicUses,
            'komodo-brass-hourglass': dayAt(state.hour),
          },
        }
      : {}),
  }
}

export const neglectIncident = (
  state: Campaign,
  incident: Incident,
): Campaign => {
  ensureOpen(state, incident)
  const next: Campaign = {
    ...state,
    ignoredIncidentIds: [...state.ignoredIncidentIds, incident.id],
    log: [
      ...state.log,
      {
        hour: state.hour,
        incidentId: incident.id,
        type: 'ignored',
        detail: 'The court sent no followers.',
      },
    ],
  }
  applyEconomy(
    next,
    incident.neglected,
    Math.max(0, availableHorde(state)),
    state.hour,
  )
  return next
}

const roll = (seed: number, mission: Dispatch): [number, number] => {
  const identity = [
    String(seed),
    mission.incidentId,
    mission.choiceId,
    ...mission.leaders,
    String(mission.hordeSent),
  ].join('|')
  let hash = 2166136261
  for (let i = 0; i < identity.length; i += 1) {
    hash = Math.imul(hash ^ identity.charCodeAt(i), 16777619)
  }
  const next = (): number => {
    hash ^= hash << 13
    hash ^= hash >>> 17
    hash ^= hash << 5
    return ((hash >>> 0) % 6) + 1
  }
  return [next(), next()]
}

const settleMission = (next: Campaign, mission: Dispatch): void => {
  const choice = chooseAction(mission.incident, mission.choiceId)
  const leaders = mission.leaders.map((id) => {
    const leader = next.followers.find((candidate) => candidate.id === id)
    if (!leader) throw new Error(`missing leader ${id}`)
    return leader
  })
  const odds = calculateOdds(
    mission.incident,
    choice,
    leaders,
    mission.hordeSent,
    mission.departedAt,
  )
  const dice = roll(next.seed, mission)
  const success = dice[0] + dice[1] + odds.modifier >= odds.target
  const effects = additive(
    choice.moralEffect,
    success ? choice.success : choice.failure,
  )
  const lostHorde = Math.min(
    mission.hordeSent,
    Math.max(0, -(effects.horde ?? 0)),
  )
  mission.hordeSurvivors = mission.hordeSent - lostHorde
  const injuryDays = !success ? (choice.injuryDaysOnFailure ?? 0) : 0
  const injuredFollowerId = injuryDays ? leaders[0]?.id : undefined
  const injuredUntilDay = injuryDays
    ? dayAt(mission.resolvesAt) + injuryDays + 1
    : undefined
  if (injuredFollowerId && injuredUntilDay) {
    const leader = next.followers.find(
      (member) => member.id === injuredFollowerId,
    )
    if (leader) {
      leader.injuredUntilDay = Math.max(
        leader.injuredUntilDay ?? 0,
        injuredUntilDay,
      )
    }
  }
  const outcome: MissionOutcome = {
    choiceId: choice.id,
    dice,
    target: odds.target,
    modifier: odds.modifier,
    success,
    injuredFollowerId,
    injuredUntilDay,
    lostHorde,
    effects,
  }
  mission.outcome = outcome
  applyEconomy(next, effects, lostHorde, mission.resolvesAt)
  next.log.push({
    hour: mission.resolvesAt,
    incidentId: mission.incidentId,
    type: 'resolved',
    detail: success ? 'Mission succeeded.' : 'Mission failed.',
  })
}

export const advanceClock = (state: Campaign, targetHour: number): Campaign => {
  integer(targetHour, 'targetHour')
  if (targetHour < state.hour || targetHour > timeAt(101, 0)) {
    throw new Error('cannot rewind or exceed the campaign clock')
  }
  const next: Campaign = {
    ...state,
    followers: state.followers.map((leader) => ({
      ...leader,
      stats: { ...leader.stats },
      specialties: [...leader.specialties],
    })),
    dispatches: state.dispatches.map((mission) => ({
      ...mission,
      leaders: [...mission.leaders],
    })),
    log: [...state.log],
  }
  const timeline = next.dispatches
    .flatMap((mission) => [
      ...(!mission.outcome && mission.resolvesAt <= targetHour
        ? [{ hour: mission.resolvesAt, phase: 'resolve' as const, mission }]
        : []),
      ...(mission.returnsAt > state.hour && mission.returnsAt <= targetHour
        ? [{ hour: mission.returnsAt, phase: 'return' as const, mission }]
        : []),
    ])
    .sort((a, b) => a.hour - b.hour || (a.phase === 'resolve' ? -1 : 1))
  for (const item of timeline) {
    if (item.phase === 'resolve') {
      settleMission(next, item.mission)
    } else {
      next.log.push({
        hour: item.hour,
        incidentId: item.mission.incidentId,
        type: 'returned',
        detail: 'The expedition returned to the Tower.',
      })
    }
  }
  next.hour = targetHour
  return next
}
