// Emperor of Dust v0.3 "Fortress" model (conductor SYSTEMS-V03.md).
// Game days only: no Horde, no hours, no travel clock.

export const STATS = ['might', 'guile', 'wits', 'heart', 'lore'] as const
export type Stat = (typeof STATS)[number]
export type StatBlock = Record<Stat, number>

export const LOCAL_FACTIONS = [
  'ledger',
  'old-houses',
  'yard',
  'lamplight',
  'gate-watch',
] as const
export type LocalFactionId = (typeof LOCAL_FACTIONS)[number]

export const KINGDOM_FACTIONS = [
  'hollow-bell',
  'abbey',
  'storm-crows',
  'mire-mothers',
  'jackalwire',
  'saltroad',
  'freeholds',
  'moles',
  'rustline',
  'black-verge',
] as const
export type KingdomFactionId = (typeof KINGDOM_FACTIONS)[number]

export const AFFINITY_TIERS = [
  'hostile',
  'wary',
  'neutral',
  'friendly',
  'allied',
] as const
export type AffinityTier = (typeof AFFINITY_TIERS)[number]

export const BANDS = ['low', 'mid', 'high', 'extreme'] as const
export type Band = (typeof BANDS)[number]

export type Danger = 'none' | 'low' | 'mid' | 'high'
export type QuestResultTier = 'triumph' | 'success' | 'partial' | 'failure'

/** Changes applied by a choice, a quest result or an expiry. */
export type Effects = {
  brass?: number
  local?: Partial<Record<LocalFactionId, number>>
  affinity?: Partial<Record<KingdomFactionId, number>>
  strength?: Partial<Record<KingdomFactionId, number>>
  flags?: string[]
  clearFlags?: string[]
  /** Follower ids who join the barracks now (each needs a free bed). */
  recruit?: string[]
  /** Follower ids offered for later recruitment (still need a bed and the fee). */
  recruitable?: string[]
  items?: string[]
}

/** Gate on an audience option, quest posting or recruitment. */
export type Requirement = {
  /** Brass spent when the option is taken. */
  cost?: number
  local?: Partial<Record<LocalFactionId, number>>
  affinity?: Partial<Record<KingdomFactionId, AffinityTier>>
  follower?: string
  flags?: string[]
  notFlags?: string[]
}

export type TraitKind = 'skill' | 'weakness' | 'allegiance'

export type TraitDef = {
  id: string
  kind: TraitKind
  name: string
  text: string
  /** Applies when a quest needs this stat, involves this faction or has this tag. */
  trigger: { stat?: Stat; faction?: KingdomFactionId; tag?: string }
  /** Added to this follower's contribution to every requirement while active. */
  amount: number
  /** Allegiance traits are only revealed through conversation flags. */
  revealFlag?: string
}

export type AbilityKind =
  | 'field-surgery'
  | 'jury-rig'
  | 'swift'
  | 'scout'
  | 'guardian'
  | 'lucky'
  | 'confessor'
  | 'warden'
  | 'bounty'
  | 'omen'
  | 'apology'
  | 'thick-hide'
  | 'encore'
  | 'chronicle'
  | 'beloved'
  | 'forecast'
  | 'stall'
  | 'quartermaster'
  | 'undermine'
  | 'many-hands'

export type AbilityDef = {
  kind: AbilityKind
  name: string
  text: string
  stat?: Stat
  /** Local faction warmed by a `beloved` ability. */
  local?: LocalFactionId
  amount: number
}

export type FollowerDef = {
  id: string
  name: string
  species: string
  pronouns: string
  origin: KingdomFactionId | LocalFactionId
  region: string
  biography: string
  stats: StatBlock
  traits: TraitDef[]
  ability: AbilityDef
  /** Public, always-known modifiers per kingdom faction. */
  factionModifiers: Partial<Record<KingdomFactionId, number>>
  /** Barracks chatter, one line shown per day. */
  talk?: string[]
  romanceable: boolean
  starter: boolean
  recruitFee: number
}

export type ItemSlot = 'tool' | 'charm'

export type ItemDef = {
  id: string
  name: string
  slot: ItemSlot
  price: number
  text: string
  stats?: Partial<StatBlock>
  ability?: Omit<AbilityDef, 'name' | 'text'>
  /** Market (t-024): the faction whose people sell it; none for fortress staples. */
  faction?: KingdomFactionId
  /** Stock gate: the seller's affinity tier, or local support the stall needs. */
  stock?: {
    tier?: AffinityTier
    local?: Partial<Record<LocalFactionId, number>>
  }
  /** +amount to every requirement of a quest for this faction or with this tag. */
  edge?: { faction?: KingdomFactionId; tag?: string; amount: number }
  /** What buying it costs beyond brass: somebody hears where it came from. */
  onBuy?: Effects
}

export type QuestRequirement = { stat: Stat; band: Band; hidden?: boolean }

export type QuestDef = {
  id: string
  title: string
  summary: string
  region: string
  faction?: KingdomFactionId
  /** A follower who must be in the party (their own story quest). */
  mustInclude?: string
  durationDays: 1 | 2 | 3
  /** Days the quest stays on the board, counting the day it is posted. */
  boardDays: 1 | 2 | 3
  party: { min: number; max: number }
  requirements: QuestRequirement[]
  danger: Danger
  lethal?: boolean
  tags?: string[]
  rewards: {
    triumph?: Effects
    success: Effects
    partial?: Effects
    failure: Effects
  }
  expired: Effects
  /** Text shown in the dawn report, by result. */
  outcomes: Partial<Record<QuestResultTier | 'expired', string>>
}

/**
 * One line of a scene. A plain string is spoken by the scene's speaker (or is
 * narration); an object hands the line to someone else in the room.
 */
export type SceneLine = string | { who: string; npc?: string; text: string }

export type AudienceOption = {
  id: string
  label: string
  requires?: Requirement
  effects: Effects
  response: string
  /** Quest ids posted to the board immediately. */
  postsQuests?: string[]
  /**
   * A beat of the same audience that follows this answer. The audience stays
   * open until an option without `next` closes it; every answer along the way
   * applies its effects and leaves a `chose:` flag.
   */
  next?: string
}

/** A further exchange inside an audience, reached through an option's `next`. */
export type AudienceBeat = {
  id: string
  /** Who speaks in this beat; the audience's speaker when omitted. */
  speaker?: string
  npc?: string
  lines: SceneLine[]
  options: AudienceOption[]
}

export type AudienceDef = {
  id: string
  title: string
  speaker: string
  /** Major NPC slug for illustrated reactions; omitted for minor petitioners. */
  npc?: string
  faction?: KingdomFactionId | LocalFactionId
  lines: SceneLine[]
  options: AudienceOption[]
  /** Later exchanges of the same audience, reached through `next`. */
  beats?: AudienceBeat[]
  /** Audiences only appear when these hold. */
  requires?: Requirement
}

/**
 * A barracks conversation with one follower, played like an audience scene.
 * The emperor can sit with one follower a day; each talk is heard once.
 */
export type TalkDef = {
  id: string
  follower: string
  title: string
  /** The first day this talk can happen. */
  fromDay: number
  /** Romance steps are marked so the barracks can show them as such. */
  romance?: boolean
  requires?: Requirement
  lines: SceneLine[]
  options: AudienceOption[]
  beats?: AudienceBeat[]
}

export type Briefing = {
  id: string
  source: string
  text: string
  truth: boolean
  /** Komodo's own lie, readable after the Day 40 betrayal. */
  komodoLie?: boolean
}

export type DayDef = {
  day: number
  title: string
  briefings: [Briefing, Briefing, Briefing]
  /** Who gives the morning briefing; Young Komodo until he betrays the throne. */
  advisor?: { name: string; npc: string }
  /** The advisor's own line on the day's reports. */
  komodo: string
  /** Something overheard at court that morning, shown under the reports. */
  whisper?: { source: string; text: string }
  audiences: AudienceDef[]
  /** Quests posted at dawn regardless of audiences. */
  quests: string[]
}

export type FollowerState = {
  id: string
  joinedDay: number
  injuredUntilDay?: number
  dead?: boolean
  deathDay?: number
  equipment: Partial<Record<ItemSlot, string>>
}

export type BoardQuest = { questId: string; postedDay: number; lastDay: number }

export type ActiveQuest = {
  questId: string
  party: string[]
  departedDay: number
  returnsDay: number
  /** Board entry, restored if the assignment is withdrawn the same day. */
  postedDay: number
  lastDay: number
}

export type QuestReport = {
  questId: string
  tier: QuestResultTier | 'expired'
  party: string[]
  chance: number
  roll: number
  injuries: { followerId: string; days: number }[]
  deaths: string[]
  revealedTraits: string[]
  effects: Effects
}

export type DawnReport = {
  day: number
  quests: QuestReport[]
  taxes: number
  wages: number
  loanTaken: boolean
  events: string[]
}

export type FortressRun = {
  version: 3
  seed: number
  /** Incremented on every rewind so replayed days roll fresh. */
  branch: number
  day: number
  brass: number
  loans: number
  local: Record<LocalFactionId, number>
  affinity: Record<KingdomFactionId, number>
  strength: Record<KingdomFactionId, number>
  revealedFactions: KingdomFactionId[]
  wipedOut: KingdomFactionId[]
  beds: 6 | 9 | 12
  roster: FollowerState[]
  recruitable: string[]
  inventory: string[]
  board: BoardQuest[]
  active: ActiveQuest[]
  audiencesHeard: string[]
  flags: string[]
  equippedRelics: string[]
  /** Relic id -> act number in which it was last used. */
  relicUses: Record<string, number>
  reports: DawnReport[]
  memorials: { followerId: string; questId: string; day: number }[]
  hideout?: string
  /** Audiences eligible at dawn; they stay at court for the whole day. */
  dayAudiences?: string[]
  /** Audience id -> the beat it has reached, while a scene is still open. */
  audienceBeats?: Record<string, string>
  /** Barracks talks heard, in order. */
  talksHeard?: string[]
  /** The day of the last talk, which uses up that day's conversation. */
  talkDay?: number
  /** The talk under way today and the beat it has reached. */
  talkOpen?: { id: string; beat?: string }
  /**
   * Market (t-024): items bought from this stock window's stalls, and the
   * followers treated today. Stale windows and days read as empty.
   */
  market?: { window: number; bought: string[]; day: number; treated: string[] }
}

/** Persistent across runs: revealed traits and allegiances. */
export type Codex = { version: 1; revealed: string[] }

export type OddsPreview = {
  chance: number
  /** True when any requirement is still hidden, so the chance is an estimate. */
  estimate: boolean
  low: number
  high: number
  perRequirement: {
    stat: Stat
    band: Band
    hidden: boolean
    total: number
    needed: number
  }[]
  durationDays: number
  injuryChance: number
}
