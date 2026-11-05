/**
 * Sublevel B: e03's dungeon, the after-hours archive under the Research
 * Annex where Rowan's unfinished project is stored and where Morrow first
 * found him. Mundane Earth: nothing magical works down here.
 *
 * The room graph lives in graph.ts; rooms*.ts hold authored content only.
 * Shapes are the shared authored-dungeon types, narrowed to SB ids.
 */
import type {
  DungeonChoice,
  DungeonEcho,
  DungeonGain,
  DungeonKind,
  DungeonProgress,
  DungeonRequirement,
  DungeonRoom,
  DungeonRoomContent,
} from '../authoredDungeon/types'

export type SublevelRoomId = `SB-${string}`

/** How Morrow got in, from e03 6,2: signed key log with Walt, or a borrowed badge. */
export type SublevelEntry = 'escort' | 'badge'

export type SublevelEnding = 'return' | 'finish' | 'confess'

export type SublevelKind = DungeonKind
export type SublevelGain = DungeonGain
export type SublevelRequirement = DungeonRequirement<SublevelEntry>
export type SublevelChoice = DungeonChoice<SublevelEntry>
export type SublevelEcho = DungeonEcho
export type SublevelRoomContent = DungeonRoomContent<
  SublevelRoomId,
  SublevelEntry
>
export type SublevelRoom = DungeonRoom<SublevelRoomId, SublevelEntry>
export type SublevelProgress = DungeonProgress<
  SublevelRoomId,
  SublevelEntry,
  SublevelEnding
>
