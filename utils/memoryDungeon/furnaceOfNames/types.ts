/**
 * The Furnace of Names: e08's dungeon, the Red Oven after the night
 * procession took Hoshimori (e08 4,3). Horror register; Vesper leads.
 */
import type {
  DungeonProgress,
  DungeonRoom,
  DungeonRoomContent,
} from '../authoredDungeon/types'

export type FurnaceRoomId = `FN-${string}`

/** From e08 4,3: Vesper demanded the burnt names, or fed the queue unnamed. */
export type FurnaceEntry = 'named' | 'unnamed'

export type FurnaceEnding = 'return-names' | 'burn-ledger' | 'vesper-signs'

export type FurnaceRoomContent = DungeonRoomContent<FurnaceRoomId, FurnaceEntry>
export type FurnaceRoom = DungeonRoom<FurnaceRoomId, FurnaceEntry>
export type FurnaceProgress = DungeonProgress<
  FurnaceRoomId,
  FurnaceEntry,
  FurnaceEnding
>
