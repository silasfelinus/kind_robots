/**
 * The Drowned Archive, e04's 36-room dungeon, bound to the shared
 * authored-dungeon engine. The sea's ledger at DA-32 is the guardian;
 * DA-33 is the vault behind it.
 */
import { createAuthoredDungeon } from '../authoredDungeon/engine'
import {
  DROWNED_CLIMAX_ROOM,
  DROWNED_ENTRY_ROOM,
  DROWNED_EXIT_ROOM,
  DROWNED_GRAPH,
  DROWNED_GUARDIAN_ROOM,
  DROWNED_SHORTCUTS,
  DROWNED_VAULT_ROOM,
} from './graph'
import { DROWNED_ROOMS_A } from './roomsA'
import { DROWNED_ROOMS_B } from './roomsB'
import type { DrownedEnding, DrownedEntry, DrownedRoomId } from './types'

export type * from './types'
export {
  DROWNED_CLIMAX_ROOM,
  DROWNED_ENTRY_ROOM,
  DROWNED_EXIT_ROOM,
  DROWNED_GUARDIAN_ROOM,
  DROWNED_VAULT_ROOM,
}

export const DROWNED_ENDINGS: readonly DrownedEnding[] = [
  'salvage',
  'rescue',
  'testify',
]

export const DROWNED_ARCHIVE = createAuthoredDungeon<
  DrownedRoomId,
  DrownedEntry,
  DrownedEnding
>({
  prefix: 'DA',
  roomCount: 36,
  rooms: [...DROWNED_ROOMS_A, ...DROWNED_ROOMS_B],
  graph: DROWNED_GRAPH,
  shortcuts: DROWNED_SHORTCUTS,
  entryRoom: DROWNED_ENTRY_ROOM,
  guardianRoom: DROWNED_GUARDIAN_ROOM,
  vaultRoom: DROWNED_VAULT_ROOM,
  climaxRoom: DROWNED_CLIMAX_ROOM,
  exitRoom: DROWNED_EXIT_ROOM,
  endings: DROWNED_ENDINGS,
  batteryStart: 3,
  batteryMax: 5,
})
