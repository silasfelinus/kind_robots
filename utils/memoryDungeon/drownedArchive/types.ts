/**
 * The Drowned Archive: e04's dungeon. Sublevel B after the sea arrived
 * uninvited: the same 36 rooms (DA-NN is SB-NN, flooded), now a horror
 * register of tide, ledgers and drowned records.
 */
import type {
  DungeonChoice,
  DungeonProgress,
  DungeonRoom,
  DungeonRoomContent,
} from '../authoredDungeon/types'

export type DrownedRoomId = `DA-${string}`

/** From e04 6,2: sealed the door with Walt and came in by the dock, or forced it alone. */
export type DrownedEntry = 'walt' | 'alone'

export type DrownedEnding = 'salvage' | 'rescue' | 'testify'

export type DrownedChoice = DungeonChoice<DrownedEntry>
export type DrownedRoomContent = DungeonRoomContent<DrownedRoomId, DrownedEntry>
export type DrownedRoom = DungeonRoom<DrownedRoomId, DrownedEntry>
export type DrownedProgress = DungeonProgress<
  DrownedRoomId,
  DrownedEntry,
  DrownedEnding
>
