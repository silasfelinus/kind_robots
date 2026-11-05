import { SUBLEVEL_GRAPH } from '../sublevelB/graph'
import type { DrownedRoomId } from './types'

/** Same physical archive as Sublevel B: DA-NN sits where SB-NN was. */
export const DROWNED_GRAPH = Object.fromEntries(
  Object.entries(SUBLEVEL_GRAPH).map(([id, exits]) => [
    id.replace('SB-', 'DA-'),
    exits.map((to) => to.replace('SB-', 'DA-') as DrownedRoomId),
  ]),
) as Readonly<Record<DrownedRoomId, readonly DrownedRoomId[]>>

/** Two-way passages opened by a decision. */
export const DROWNED_SHORTCUTS: readonly {
  a: DrownedRoomId
  b: DrownedRoomId
  room: DrownedRoomId
  choice: string
}[] = [
  // Swim the flooded fire stair under the warm corridor back to the intake.
  { a: 'DA-18', b: 'DA-05', room: 'DA-18', choice: 'swim-through' },
  // The dock door, wedged against the surge, is a straight run to the night archive.
  { a: 'DA-24', b: 'DA-31', room: 'DA-24', choice: 'wedge' },
]

export const DROWNED_ENTRY_ROOM: DrownedRoomId = 'DA-01'
export const DROWNED_GUARDIAN_ROOM: DrownedRoomId = 'DA-32'
export const DROWNED_VAULT_ROOM: DrownedRoomId = 'DA-33'
export const DROWNED_CLIMAX_ROOM: DrownedRoomId = 'DA-35'
export const DROWNED_EXIT_ROOM: DrownedRoomId = 'DA-36'
