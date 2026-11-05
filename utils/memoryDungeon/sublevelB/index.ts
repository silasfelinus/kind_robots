/**
 * Sublevel B, e03's 36-room dungeon, bound to the shared authored-dungeon
 * engine (utils/memoryDungeon/authoredDungeon). Hollis at SB-32 is the
 * guardian; SB-33 is the vault behind her.
 */
import { createAuthoredDungeon } from '../authoredDungeon/engine'
import {
  SUBLEVEL_CLIMAX_ROOM,
  SUBLEVEL_ENTRY_ROOM,
  SUBLEVEL_EXIT_ROOM,
  SUBLEVEL_GRAPH,
  SUBLEVEL_GUARDIAN_ROOM,
  SUBLEVEL_SHORTCUTS,
} from './graph'
import { SUBLEVEL_ROOMS_A } from './roomsA'
import { SUBLEVEL_ROOMS_B } from './roomsB'
import type {
  SublevelChoice,
  SublevelEnding,
  SublevelEntry,
  SublevelProgress,
  SublevelRoom,
  SublevelRoomId,
} from './types'

export type * from './types'
export {
  SUBLEVEL_CLIMAX_ROOM,
  SUBLEVEL_ENTRY_ROOM,
  SUBLEVEL_EXIT_ROOM,
  SUBLEVEL_GUARDIAN_ROOM,
}

export const SUBLEVEL_BATTERY_START = 3
export const SUBLEVEL_BATTERY_MAX = 5
export const SUBLEVEL_ENDINGS: readonly SublevelEnding[] = [
  'return',
  'finish',
  'confess',
]

export const SUBLEVEL_B = createAuthoredDungeon<
  SublevelRoomId,
  SublevelEntry,
  SublevelEnding
>({
  prefix: 'SB',
  roomCount: 36,
  rooms: [...SUBLEVEL_ROOMS_A, ...SUBLEVEL_ROOMS_B],
  graph: SUBLEVEL_GRAPH,
  shortcuts: SUBLEVEL_SHORTCUTS,
  entryRoom: SUBLEVEL_ENTRY_ROOM,
  guardianRoom: SUBLEVEL_GUARDIAN_ROOM,
  vaultRoom: 'SB-33',
  climaxRoom: SUBLEVEL_CLIMAX_ROOM,
  exitRoom: SUBLEVEL_EXIT_ROOM,
  endings: SUBLEVEL_ENDINGS,
  batteryStart: SUBLEVEL_BATTERY_START,
  batteryMax: SUBLEVEL_BATTERY_MAX,
})

export const SUBLEVEL_ROOMS: Readonly<Record<SublevelRoomId, SublevelRoom>> =
  SUBLEVEL_B.rooms

export function isSublevelRoomId(value: unknown): value is SublevelRoomId {
  return SUBLEVEL_B.isRoomId(value)
}

export function sublevelRoom(id: string): SublevelRoom | null {
  return SUBLEVEL_B.room(id)
}

export function newSublevelProgress(entry: SublevelEntry): SublevelProgress {
  return SUBLEVEL_B.newProgress(entry)
}

export function sublevelExits(
  progress: SublevelProgress,
  from: SublevelRoomId = progress.current,
): SublevelRoomId[] {
  return SUBLEVEL_B.exits(progress, from)
}

export function sublevelChoiceLock(
  progress: SublevelProgress,
  choice: SublevelChoice,
): string | null {
  return SUBLEVEL_B.choiceLock(progress, choice)
}

export function travelSublevel(
  progress: SublevelProgress,
  to: SublevelRoomId,
): SublevelProgress {
  return SUBLEVEL_B.travel(progress, to)
}

export function chooseSublevel(
  progress: SublevelProgress,
  choiceId: string,
): SublevelProgress {
  return SUBLEVEL_B.choose(progress, choiceId)
}

export function sublevelFlags(progress: SublevelProgress): string[] {
  return SUBLEVEL_B.flags(progress)
}

export function sublevelOpening(
  room: SublevelRoom,
  flags: readonly string[],
): string {
  return SUBLEVEL_B.opening(room, flags)
}

export function restoreSublevelProgress(
  input: unknown,
  entry: SublevelEntry,
): SublevelProgress {
  return SUBLEVEL_B.restore(input, entry)
}

export function validateSublevel(): string[] {
  return SUBLEVEL_B.validate()
}
