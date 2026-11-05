/**
 * The Choking Works: e06's dungeon, the Breathing Works warped under the
 * Undertide Crown (e06 4,6). Horror register; Scylla leads, Char decides.
 */
import type {
  DungeonProgress,
  DungeonRoom,
  DungeonRoomContent,
} from '../authoredDungeon/types'

export type ChokingRoomId = `CW-${string}`

/** From e06 4,6: Scylla pulled things free (care) or listened (risk). */
export type ChokingEntry = 'pulled' | 'listened'

export type ChokingEnding = 'breathe-out' | 'seal-the-road' | 'char-holds-key'

export type ChokingRoomContent = DungeonRoomContent<ChokingRoomId, ChokingEntry>
export type ChokingRoom = DungeonRoom<ChokingRoomId, ChokingEntry>
export type ChokingProgress = DungeonProgress<
  ChokingRoomId,
  ChokingEntry,
  ChokingEnding
>
