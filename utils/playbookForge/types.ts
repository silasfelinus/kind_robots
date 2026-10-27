import type { BudgetDimension } from '../playbookKit/budget'
import type { PlaybookTier } from '../playbookKit/types'
import type { CheckpointClassId } from './calibration'
import type { Design } from './designs'
import type { Spark } from './facets'

// A playbook blueprint: every factor a designer can set before a story game is
// built. One shape serves a new idea and an existing game's plan, so the same
// forecast compares them. The factors are the union of what Emperor of Dust,
// Shifting Lands, Shifting Desks, Prom of Doom, Space Couch, Ecotone,
// Crystal Street and the Zuzu gamebook actually do.

export type Placement = 'admin' | 'play' | 'projects'

export type CreatorMode = 'fixed' | 'roster' | 'builder'

export type PortraitStrategy =
  'per-option' | 'per-combination' | 'on-demand' | 'code-drawn'

export type CheckStyle = 'none' | '2d6' | 'percent' | 'd20' | 'cards'

export type OutcomeModel =
  'pass-fail' | 'three-tier' | 'four-tier' | 'five-tier'

export type OutcomeArt = 'none' | 'success' | 'both'

export type EndingMode = 'authored' | 'families'

/** One version of each ending, or one per hero the player can start as. */
export type EndingVersions = 'one' | 'per-hero'

export type UndoMode = 'none' | 'last-choice' | 'rewind'

export type SaveStyle = 'snapshot' | 'ledger'

export type UnreadablePolicy = 'hold' | 'warn' | 'reset'

export type Blueprint = {
  /** Kebab-case slug; for an existing game, its Conductor slug. */
  slug: string
  title: string
  idea: string
  genre: string
  placement: Placement
  /** Locks the tier; null lets the forecast pick the smallest that fits. */
  tier: PlaybookTier | null
  checkpoint: CheckpointClassId
  /** Art styles every picture is rendered in (Ecotone renders 2–4). */
  artStyles: number

  creator: CreatorMode
  /** Roster mode: how many ready-made heroes to pick from (Warp: 6 captains). */
  rosterSize: number
  /** Builder mode: how many factors the player chooses (archetype, background, power, look…). */
  creatorFactors: number
  /** Builder mode: options offered per factor. */
  optionsPerFactor: number
  portraits: PortraitStrategy
  /** Emotion or action variants per hero portrait. */
  expressions: number
  /** The player names their hero and picks pronouns. */
  nameAndPronouns: boolean
  /** The player may upload their own portrait (Ecotone, stored as a private ArtImage). */
  playerUpload: boolean
  /** Who the hero is changes the odds (Prom powers, Desks jobs) rather than being cosmetic (Ecotone). */
  identityAffectsOdds: boolean

  stats: number
  checks: CheckStyle
  visibleOdds: boolean
  outcomes: OutcomeModel
  /** "Always interesting": every failure branches the story instead of ending a thread. */
  failForward: boolean
  outcomeArt: OutcomeArt
  meters: number
  /** A hidden moral ledger shapes endings (Lands marks, Desks grades, Gamebook honor). */
  hiddenLedger: boolean

  acts: number
  chaptersPerAct: number
  encounters: number
  choicesPerEncounter: number
  quests: number
  questSteps: number
  /** Places the story travels between: star systems, districts, towns. */
  locations: number

  followers: number
  partySize: number
  followerExpressions: number
  /** Steps in the personal quest each follower brings (0: none). The party picked decides where the story goes. */
  followerQuestSteps: number
  villains: number
  /** A different principal villain is drawn each run (Warp: 8, Crystal Street: 22). */
  villainPerRun: boolean
  figures: number
  factions: number
  romances: number

  reveals: number
  moments: number
  trailerBeats: number
  endings: number
  endingMode: EndingMode
  /** Beats in each finale sequence (epilogue cards per ending). */
  finaleBeats: number
  /** Per-hero: the opening hero rewrites and repaints every ending. A party only adds epilogue lines. */
  endingVersions: EndingVersions
  /** Each follower gets an epilogue line in every ending. */
  followerEpilogues: boolean
  /** Endings each party combination earns of its own (Space Couch: two per trio of crew). */
  partyEndings: number
  /** Steps in an adventure written for each party combination (0: none). */
  partyAdventureSteps: number
  /** Endings each villain brings, beyond the shared ones (a galactic boss beaten, won over or fled). */
  villainEndings: number

  autosave: boolean
  /** Snapshot stores the run; a ledger stores the seed and every action and replays it. */
  saveStyle: SaveStyle
  /** What happens when a stored save cannot be read. */
  unreadable: UnreadablePolicy
  saveSlots: number
  undo: UndoMode
  seededRuns: boolean
  /** A link or daily seed lets players share the same run (Crystal Street, Shifting Desks). */
  shareSeed: boolean
  /** Scrapbook, endings and secrets persist across runs. */
  metaProgress: boolean
  exportSaves: boolean

  /** Facets dealt into the design: genre, tone, world, question, cast, look. */
  sparks: Spark[]
  /** Named elements with their art prompts (and pictures once rendered). */
  designs: Design[]
}

export type ForecastLine = { label: string; count: number; detail: string }

export type Forecast = {
  images: ForecastLine[]
  totalImages: number
  renderSeconds: number
  queueSeconds: number
  words: ForecastLine[]
  totalWords: number
  sessions: number
  qaRuns: number
  tier: PlaybookTier | null
  overBudget: BudgetDimension[]
  notes: string[]
}
