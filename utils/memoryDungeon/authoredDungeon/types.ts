/**
 * Shared types for hand-written 36-room dungeons (Sublevel B and its
 * successors). Each dungeon narrows the room id, entry and ending types.
 */
export type DungeonKind =
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

export interface DungeonGain {
  /** Phone-torch charge, 0..batteryMax. Dark rooms spend it. */
  battery?: number
  evidence?: number
  trust?: number
  danger?: number
}

export interface DungeonRequirement<Entry extends string = string> {
  battery?: number
  evidence?: number
  trust?: number
  entry?: Entry
}

export interface DungeonChoice<Entry extends string = string> {
  id: string
  label: string
  outcome: string
  gain?: DungeonGain
  requires?: DungeonRequirement<Entry>
  /** Shown on the locked card when `requires` is unmet. */
  lockedHint?: string
  /** Guardian room only: this answer gets the player past the guardian. */
  passesGuardian?: true
  artSubject: string
}

/** Appended to the opening when the player holds `flag`. */
export interface DungeonEcho {
  flag: string
  text: string
}

export interface DungeonRoomContent<
  Id extends string = string,
  Entry extends string = string,
> {
  id: Id
  title: string
  kind: DungeonKind
  speaker: string
  opening: string
  artSubject: string
  choices: readonly DungeonChoice<Entry>[]
  /** Lore-only discovery resolved on first entry. */
  autoChoiceId?: string
  echoes?: readonly DungeonEcho[]
}

export interface DungeonRoom<
  Id extends string = string,
  Entry extends string = string,
> extends DungeonRoomContent<Id, Entry> {
  exits: readonly Id[]
}

export interface DungeonProgress<
  Id extends string = string,
  Entry extends string = string,
  Ending extends string = string,
> {
  version: 1
  entry: Entry
  current: Id
  visited: Id[]
  /** Decisions in the order they were made; restore replays them. */
  order: [Id, string][]
  decisions: Record<string, string>
  battery: number
  evidence: number
  trust: number
  danger: number
  guardianPassed: boolean
  ending: Ending | null
  completed: boolean
}

export interface DungeonShortcut<Id extends string = string> {
  a: Id
  b: Id
  /** The room whose decision opens it, and the choice that does. */
  room: Id
  choice: string
}

export interface DungeonDefinition<
  Id extends string,
  Entry extends string,
  Ending extends string,
> {
  /** Room id prefix, e.g. 'SB'; ids run PREFIX-01..PREFIX-NN. */
  prefix: string
  roomCount: number
  rooms: readonly DungeonRoomContent<Id, Entry>[]
  graph: Readonly<Record<Id, readonly Id[]>>
  shortcuts: readonly DungeonShortcut<Id>[]
  entryRoom: Id
  guardianRoom: Id
  /** The room behind the guardian; closed until the guardian is passed. */
  vaultRoom: Id
  climaxRoom: Id
  exitRoom: Id
  endings: readonly Ending[]
  batteryStart: number
  batteryMax: number
}
