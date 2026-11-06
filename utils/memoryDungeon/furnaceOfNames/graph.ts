import { SUBLEVEL_GRAPH } from '../sublevelB/graph'
import type { FurnaceRoomId } from './types'

/** The shared 6x6 dungeon plan, laid out as the night Oven's halls. */
export const FURNACE_GRAPH = Object.fromEntries(
  Object.entries(SUBLEVEL_GRAPH).map(([id, exits]) => [
    id.replace('SB-', 'FN-'),
    exits.map((to) => to.replace('SB-', 'FN-') as FurnaceRoomId),
  ]),
) as Readonly<Record<FurnaceRoomId, readonly FurnaceRoomId[]>>

/** Two-way passages opened by a decision. */
export const FURNACE_SHORTCUTS: readonly {
  a: FurnaceRoomId
  b: FurnaceRoomId
  room: FurnaceRoomId
  choice: string
}[] = [
  // A flue ladder back up to the night shift.
  { a: 'FN-18', b: 'FN-05', room: 'FN-18', choice: 'climb-flue' },
  // A feeding line propped open runs straight to the deep hearth.
  { a: 'FN-24', b: 'FN-31', room: 'FN-24', choice: 'prop-line' },
]
