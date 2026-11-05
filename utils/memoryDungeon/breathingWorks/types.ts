/**
 * The Breathing Works: e05's dungeon, the sea palace's old service tunnels
 * below the Glass Throat (e05 4,6). Warm register; Scylla leads.
 */
import type {
  DungeonProgress,
  DungeonRoom,
  DungeonRoomContent,
} from '../authoredDungeon/types'

export type WorksRoomId = `GT-${string}`

/** From e05 4,6: the intake left running (care) or shut (risk). */
export type WorksEntry = 'current' | 'still'

export type WorksEnding = 'open-road' | 'keep-secret' | 'give-key'

export type WorksRoomContent = DungeonRoomContent<WorksRoomId, WorksEntry>
export type WorksRoom = DungeonRoom<WorksRoomId, WorksEntry>
export type WorksProgress = DungeonProgress<
  WorksRoomId,
  WorksEntry,
  WorksEnding
>
