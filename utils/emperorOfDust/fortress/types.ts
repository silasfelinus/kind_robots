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

/**
 * A story-flag gate (t-040), shared by every flag-keyed variant, aid and due:
 * all of `flags`, none of `notFlags`, and at least one of `anyFlags`.
 */
export type FlagGate = {
  flags?: string[]
  notFlags?: string[]
  anyFlags?: string[]
}

export const gateHolds = (
  flags: readonly string[],
  gate: FlagGate | undefined,
): boolean =>
  !gate ||
  ((gate.flags ?? []).every((flag) => flags.includes(flag)) &&
    !(gate.notFlags ?? []).some((flag) => flags.includes(flag)) &&
    (!gate.anyFlags?.length ||
      gate.anyFlags.some((flag) => flags.includes(flag))))

/** The first variant whose gate holds for these flags. */
export const pickVariant = <T extends FlagGate>(
  flags: readonly string[],
  variants: readonly T[] | undefined,
): T | undefined => variants?.find((variant) => gateHolds(flags, variant))

/**
 * A fixed line as a run holding certain flags reads it (t-040): quest
 * outcomes, the advisor's morning line, the whisper, the betrayal page.
 * The first match wins; mechanics never change with the words.
 *
 * @example
 * outcomeVariants: {
 *   expired: [{ flags: ['d10-thistledown-promised'],
 *     text: 'The rider waited by the board until dark. Nobody signed.' }],
 * }
 */
export type TextVariant = FlagGate & { text: string }

export const variantText = (
  flags: readonly string[],
  text: string,
  variants: readonly TextVariant[] | undefined,
): string => pickVariant(flags, variants)?.text ?? text

/**
 * Help for one quest (t-040). `bonus` is added to the party's total on every
 * requirement, or only on `stat`; the board preview counts it, so the odds
 * stay honest.
 */
export type AidBonus = {
  /** Who is helping, as the board and the preview name them. */
  label: string
  bonus?: number
  stat?: Stat
}

/**
 * An answer that helps a quest already on the board, or one posted later
 * (`effects.questAid`). With `resolve`, a quest nobody is sent on settles at
 * that tier when it leaves the board instead of expiring, with `outcome` as
 * its dawn line; a party can still go and roll, aid included.
 *
 * @example
 * questAid: [{ questId: 'q-d31-iron-rain', label: 'The Watch holds the near bank',
 *   bonus: 2, resolve: 'partial',
 *   outcome: 'Dunmark held the near bank with the Watch and no plan. They came home in carts.' }]
 */
export type QuestAid = AidBonus & {
  questId: string
  resolve?: QuestResultTier
  outcome?: string
}

/**
 * Standing help a quest reads from the run's flags at the moment of the roll
 * (`QuestDef.aid`): Day 50's alliances. Shown per source in the preview.
 *
 * @example
 * aid: [{ flags: ['watch-returned'], label: 'The Watch came home', bonus: 2, stat: 'might' }]
 */
export type FlagAid = FlagGate & AidBonus & { bonus: number }

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
  /**
   * Help for a quest on (or soon on) the board (t-040).
   * @example questAid: [{ questId: 'q-d10-freehold-raid', label: 'The Watch rode out', bonus: 3 }]
   */
  questAid?: QuestAid[]
  /**
   * Obligations that come due on a later dawn, by id in `DUES` (t-040):
   * debts, fees that rise, threats that return. Scheduling one already
   * pending does nothing.
   * @example schedule: ['ledger-loan']
   */
  schedule?: string[]
  /**
   * Pending obligations settled or called off before they come due.
   * @example cancelDues: ['vane-bolt']
   */
  cancelDues?: string[]
  /**
   * Followers who leave the court alive, by their own choice or the crown's
   * (t-040). `reason` is the line the barracks keeps. An answer that would
   * leave fewer than MIN_LEFT followers, or send someone who is away, is
   * locked rather than half-applied.
   * @example dismiss: [{ follower: 'F003', reason: 'Kiyo went home to her boy.' }]
   */
  dismiss?: { follower: string; reason: string }[]
  /**
   * Act V: the court leaves its host for another hideout (`HIDEOUT_NAMES`);
   * the `hideout:<id>` flag moves with it.
   * @example relocate: 'nameless-cave'
   */
  relocate?: string
}

/**
 * A debt, fee or threat that comes due on a later dawn (t-040, `DUES`).
 * Scheduled by `effects.schedule`; settled at that dawn after taxes and
 * wages. With a `cost`, the treasury pays if it can (`line`, `effects`), or
 * `unpaid` applies. If `when` fails on the day, `lapsed` applies instead.
 * With `every`, it comes due again that many days later while `when` holds
 * (a standing law). Never rolled: same run, same result.
 *
 * @example
 * { id: 'ledger-loan', title: 'The Ledger’s loan', day: 20, cost: 50,
 *   warning: 'Fifty brass to the Ledger at the Day 20 dawn.',
 *   line: 'Factor Tallow came for the fifty at dawn.',
 *   effects: { clearFlags: ['ledger-credit'], flags: ['ledger-loan-repaid'] },
 *   unpaid: { line: 'The strongbox could not cover it.', effects: { local: { ledger: -5 } } } }
 */
export type DueDef = {
  id: string
  /** The court ledger's name for it. */
  title: string
  /** The dawn it comes due, or days after the day it was scheduled. */
  day?: number
  inDays?: number
  /** Comes due again this many days later while `when` holds. */
  every?: number
  /** The last dawn a recurring due can fire. */
  until?: number
  when?: FlagGate
  cost?: number
  effects?: Effects
  /** The dawn line when it is paid or applied. */
  line: string
  unpaid?: { effects?: Effects; line: string }
  lapsed?: { effects?: Effects; line?: string }
  /** What the ledger and the throne say is coming. */
  warning?: string
  /** A consequence the court does not see coming: kept off the ledger and the throne. */
  hidden?: boolean
}

/** A due waiting in the run: which, on what dawn, and the day it was set. */
export type PendingDue = { id: string; day: number; from: number }

/** Gate on an audience option, quest posting or recruitment. */
export type Requirement = {
  /** Brass spent when the option is taken. */
  cost?: number
  local?: Partial<Record<LocalFactionId, number>>
  affinity?: Partial<Record<KingdomFactionId, AffinityTier>>
  follower?: string
  flags?: string[]
  notFlags?: string[]
  /** At least `min` of these flags: a standing earned over many days. */
  standing?: Standing
}

/** A track of story flags that accumulate, such as the crown's concessions. */
export type Standing = { flags: readonly string[]; min: number }

export const standingHeld = (
  flags: readonly string[],
  standing: Standing | undefined,
): boolean =>
  !standing ||
  standing.flags.filter((flag) => flags.includes(flag)).length >= standing.min

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
  /** Outcome lines keyed on the run's flags at that dawn (t-040). */
  outcomeVariants?: Partial<Record<QuestResultTier | 'expired', TextVariant[]>>
  /** Standing help read from flags when the quest rolls (t-040). */
  aid?: FlagAid[]
  /**
   * Chores only (t-041): further lines for a result. A chore's second trip
   * home reads differently from its first.
   */
  outcomeAlts?: Partial<Record<QuestResultTier | 'expired', string[]>>
  /** Chores only (t-041): the first and last day it can be posted. */
  days?: [number, number]
  /** Chores only (t-041): never posted beside these quests (an authored twin). */
  shuns?: string[]
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
  variants?: SceneVariant[]
}

/**
 * A scene's opening lines as they read in runs that hold (or lack) certain
 * story flags, such as who bought the tower. The first match replaces the
 * lines; answers and their effects never change.
 */
export type SceneVariant = FlagGate & { lines: SceneLine[] }

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
  variants?: SceneVariant[]
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

/**
 * A briefing as it reads in runs that hold (or lack) certain story flags. The
 * first matching variant replaces the source and text; truth never changes, so
 * the day keeps exactly one lie and the Eye still finds it.
 */
export type BriefingVariant = FlagGate & { source?: string; text?: string }

export type Briefing = {
  id: string
  source: string
  text: string
  truth: boolean
  /** Komodo's own lie, readable after the Day 40 betrayal. */
  komodoLie?: boolean
  /** What was true instead, shown once Komodo has betrayed the throne. */
  hindsight?: string
  variants?: BriefingVariant[]
}

export type DayDef = {
  day: number
  title: string
  briefings: [Briefing, Briefing, Briefing]
  /** Who gives the morning briefing; Young Komodo until he betrays the throne. */
  advisor?: { name: string; npc: string }
  /** The advisor's own line on the day's reports. */
  komodo: string
  /** The advisor's line as runs holding certain flags hear it (t-040). */
  komodoVariants?: TextVariant[]
  /** Something overheard at court that morning, shown under the reports. */
  whisper?: { source: string; text: string; variants?: BriefingVariant[] }
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
  /**
   * Gone from court alive: with Young Komodo at the betrayal (t-028), or
   * sent away or leaving by choice (t-040, `effects.dismiss`, with `reason`).
   */
  departed?: { day: number; why: DepartureWhy; reason?: string }
  equipment: Partial<Record<ItemSlot, string>>
}

/**
 * Why a follower left with Komodo: a hidden allegiance to his buyer, or forty
 * days in which nobody at court sat with them while their people were crossed.
 */
/**
 * Why a follower left: a hidden allegiance to the buyer, neglect, their own
 * people turned against the crown (`kin`, t-041), talked round by Komodo on
 * the last night (`persuaded`, t-041), or sent home by an answer.
 */
export type DepartureWhy =
  'allegiance' | 'neglect' | 'kin' | 'persuaded' | 'dismissed'

/** Who Komodo sold the tower to. The Abbess is always his patron. */
export type BuyerId = 'abbey' | 'black-verge' | 'old-houses'

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
  /** The dawn line as this run read it (variants and aid applied, t-040). */
  text?: string
  /** Settled without a party by an answer's `questAid` (t-040). */
  aided?: boolean
}

/**
 * A change the map room announces at an act-end dawn (Days 11, 21, 31, 41):
 * a banner revealed, a faction wiped out, land taken, a faction that held,
 * or a warning about the next act end.
 */
export type MapEventKind =
  'revealed' | 'wiped' | 'taken' | 'held' | 'warned-wipe' | 'warned-raid'

export type MapEvent = {
  /** The dawn it was announced. */
  day: number
  kind: MapEventKind
  faction: KingdomFactionId
  /** The rival that took, or threatens to take, the land. */
  by?: KingdomFactionId
  region?: string
}

/** A map change warned one act ahead; it can only happen on `dueDay`. */
export type MapThreat = {
  kind: 'wipe' | 'raid'
  faction: KingdomFactionId
  by?: KingdomFactionId
  region?: string
  issuedDay: number
  dueDay: number
}

export type DawnReport = {
  day: number
  quests: QuestReport[]
  taxes: number
  wages: number
  loanTaken: boolean
  events: string[]
  /** Act-end map changes announced this dawn. */
  map?: MapEvent[]
  /** Act V: `taxes` is what the host shared, not the regions' taxes. */
  income?: 'host'
  /** The Day 41 dawn: who took the tower and who went with Komodo. */
  betrayal?: {
    buyer: BuyerId
    hideout: string
    departed: { followerId: string; why: DepartureWhy }[]
    /** How the tower fell and why, as this run read them (t-040). */
    fell?: string
    why?: string
    /** What the crown's precautions saved, line by line (t-038). */
    ready?: string[]
    /** Komodo's note under the seal: the physician answer, kept (t-038). */
    note?: string
  }
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
  /** Regions taken at an act end: region id -> new holder. */
  controllers?: Partial<Record<string, KingdomFactionId>>
  /** Map changes warned for the next act end. */
  mapWatch?: MapThreat[]
  /** Every act-end map change so far, for the map room's history. */
  mapLog?: MapEvent[]
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
  /** Help promised to quests by answers, by quest id (t-040). */
  aid?: Record<string, QuestAid[]>
  /** Debts, fees and threats waiting for a later dawn (t-040). */
  dues?: PendingDue[]
}

/** Persistent across runs: revealed traits and allegiances. */
export type Codex = { version: 1; revealed: string[] }

export type OddsPreview = {
  chance: number
  /**
   * True when any requirement is still hidden, or someone in the party has a
   * trait here the Codex has not read: the chance is an estimate, low-high.
   */
  estimate: boolean
  /** Party members whose unread traits apply here (t-041). */
  unread?: number
  low: number
  high: number
  perRequirement: {
    stat: Stat
    band: Band
    hidden: boolean
    /** The party's total, aid included. */
    total: number
    needed: number
    /** How much of `total` is aid rather than the party (t-040). */
    aid: number
  }[]
  /** Every source of aid counted in these odds (t-040). */
  aid: AidBonus[]
  /** If nobody is sent, the tier an answer's aid settles it at (t-040). */
  resolvesAs?: QuestResultTier
  durationDays: number
  /** Chance each follower is wounded if the quest fails. */
  injuryChance: number
  /** Chance each follower comes home wounded, across every result. */
  injuryRisk: number
  /** Wound length range in days, after Field Surgery. */
  injuryDays: [number, number]
  /** Chance someone does not come home; 0 unless the quest is lethal. */
  deathChance: number
}
