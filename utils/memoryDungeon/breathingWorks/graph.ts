import { SUBLEVEL_GRAPH } from '../sublevelB/graph'
import type { WorksRoomId } from './types'

/** The shared 6x6 dungeon plan, laid out as the sea-works' tunnels. */
export const WORKS_GRAPH = Object.fromEntries(
  Object.entries(SUBLEVEL_GRAPH).map(([id, exits]) => [
    id.replace('SB-', 'GT-'),
    exits.map((to) => to.replace('SB-', 'GT-') as WorksRoomId),
  ]),
) as Readonly<Record<WorksRoomId, readonly WorksRoomId[]>>

/** Two-way passages opened by a decision. */
export const WORKS_SHORTCUTS: readonly {
  a: WorksRoomId
  b: WorksRoomId
  room: WorksRoomId
  choice: string
}[] = [
  // A maintenance hatch back up to the pump-gallery stair.
  { a: 'GT-18', b: 'GT-05', room: 'GT-18', choice: 'open-hatch' },
  // A sluice wedged open runs straight to the deep works.
  { a: 'GT-24', b: 'GT-31', room: 'GT-24', choice: 'wedge' },
]
