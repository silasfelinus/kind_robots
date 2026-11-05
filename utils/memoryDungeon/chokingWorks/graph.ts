import { SUBLEVEL_GRAPH } from '../sublevelB/graph'
import type { ChokingRoomId } from './types'

/** The shared 6x6 dungeon plan: the same tunnels as the Breathing Works. */
export const CHOKING_GRAPH = Object.fromEntries(
  Object.entries(SUBLEVEL_GRAPH).map(([id, exits]) => [
    id.replace('SB-', 'CW-'),
    exits.map((to) => to.replace('SB-', 'CW-') as ChokingRoomId),
  ]),
) as Readonly<Record<ChokingRoomId, readonly ChokingRoomId[]>>

/** Two-way passages opened by a decision. */
export const CHOKING_SHORTCUTS: readonly {
  a: ChokingRoomId
  b: ChokingRoomId
  room: ChokingRoomId
  choice: string
}[] = [
  // The hatch to the pump-gallery stair, bolted from the court's side.
  { a: 'CW-18', b: 'CW-05', room: 'CW-18', choice: 'open-hatch' },
  // A sluice wedged open runs straight to the deep works.
  { a: 'CW-24', b: 'CW-31', room: 'CW-24', choice: 'wedge' },
]
