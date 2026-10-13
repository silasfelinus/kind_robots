export type ChallengeStat = 'might' | 'diplomacy' | 'ingenuity'

export type Follower = {
  id: string
  name: string
  stats: Record<ChallengeStat, number>
  specialties: string[]
  injuredUntilDay?: number
  availableOnDay?: number
  dead?: boolean
}

export type Effects = {
  prosperity?: number
  popularity?: number
  horde?: number
}

export type Choice = {
  id: string
  label: string
  approach: ChallengeStat
  difficulty: number
  specialty?: string
  moralEffect?: Effects
  success: Effects
  failure: Effects
  injuryDaysOnFailure?: number
}

export type Incident = {
  id: string
  day: number
  title: string
  destinationId: string
  opensAtHour: number
  deadlineHour: number
  outwardHours: number
  missionHours: number
  hordeMinimum: number
  hordeMaximum: number
  choices: Choice[]
  neglected: Effects
}

export type MissionOutcome = {
  choiceId: string
  dice: [number, number]
  target: number
  modifier: number
  success: boolean
  injuredFollowerId?: string
  injuredUntilDay?: number
  lostHorde: number
  effects: Effects
}

export type Dispatch = {
  incidentId: string
  choiceId: string
  leaders: string[]
  hordeSent: number
  hordeSurvivors: number
  departedAt: number
  arrivesAt: number
  resolvesAt: number
  returnsAt: number
  incident: Incident
  outcome?: MissionOutcome
}

export type CampaignEvent = {
  hour: number
  incidentId: string
  type: 'ignored' | 'resolved' | 'returned'
  detail: string
}

export type Campaign = {
  version: 1
  seed: number
  hour: number
  prosperity: number
  popularity: number
  horde: number
  hordeCap: number
  followers: Follower[]
  dispatches: Dispatch[]
  ignoredIncidentIds: string[]
  log: CampaignEvent[]
  flags?: string[]
  memorials?: { followerId: string; incidentId: string; reason: string }[]
  equippedRelics?: string[]
  relicUses?: Record<string, number>
}

export type OddsPreview = {
  modifier: number
  target: number
  numerator: number
  denominator: 36
  probability: number
  projectedReturnHour: number
}
