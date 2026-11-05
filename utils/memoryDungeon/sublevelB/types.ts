/**
 * Sublevel B: e03's dungeon, the after-hours archive under the Research
 * Annex where Rowan's unfinished project is stored and where Morrow first
 * found him. Mundane Earth: nothing magical works down here.
 *
 * The room graph lives in graph.ts; rooms*.ts hold authored content only.
 */
export type SublevelRoomId = `SB-${string}`

export type SublevelKind =
  | 'entry'
  | 'lore'
  | 'puzzle'
  | 'treasure'
  | 'choice'
  | 'hazard'
  | 'companion'
  | 'shortcut'
  | 'rest'
  | 'secret'
  | 'guardian'
  | 'climax'
  | 'exit'

/** How Morrow got in, from e03 6,2: signed key log with Walt, or a borrowed badge. */
export type SublevelEntry = 'escort' | 'badge'

export type SublevelEnding = 'return' | 'finish' | 'confess'

export interface SublevelGain {
  /** Phone-torch charge, 0..5. Dark rooms spend it. */
  battery?: number
  evidence?: number
  trust?: number
  danger?: number
}

export interface SublevelRequirement {
  battery?: number
  evidence?: number
  trust?: number
  entry?: SublevelEntry
}

export interface SublevelChoice {
  id: string
  label: string
  outcome: string
  gain?: SublevelGain
  requires?: SublevelRequirement
  /** Shown on the locked card when `requires` is unmet. */
  lockedHint?: string
  /** SB-32 only: this answer gets Morrow past Hollis. */
  passesGuardian?: true
  artSubject: string
}

/**
 * Appended to the opening when the player holds `flag`:
 * `entry:escort`, `entry:badge`, `SB-07:<choiceId>`, or an e03 overworld
 * flag `e03:<x>,<y>:<choiceId>`.
 */
export interface SublevelEcho {
  flag: string
  text: string
}

export interface SublevelRoomContent {
  id: SublevelRoomId
  title: string
  kind: SublevelKind
  speaker: string
  opening: string
  artSubject: string
  choices: readonly SublevelChoice[]
  /** Lore-only discovery resolved on first entry. */
  autoChoiceId?: string
  echoes?: readonly SublevelEcho[]
}

export interface SublevelRoom extends SublevelRoomContent {
  exits: readonly SublevelRoomId[]
}

export interface SublevelProgress {
  version: 1
  entry: SublevelEntry
  current: SublevelRoomId
  visited: SublevelRoomId[]
  /** Decisions in the order they were made; restore replays them. */
  order: [SublevelRoomId, string][]
  decisions: Record<string, string>
  battery: number
  evidence: number
  trust: number
  danger: number
  hollisPassed: boolean
  ending: SublevelEnding | null
  completed: boolean
}
