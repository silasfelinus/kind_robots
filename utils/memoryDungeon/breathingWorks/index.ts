/**
 * The Breathing Works, e05's 36-room dungeon, bound to the shared
 * authored-dungeon engine. The Sluice-Warden at GT-32 is the guardian;
 * GT-33 is the vault behind her.
 */
import { createAuthoredDungeon } from '../authoredDungeon/engine'
import { WORKS_GRAPH, WORKS_SHORTCUTS } from './graph'
import { WORKS_ROOMS_A } from './roomsA'
import { WORKS_ROOMS_B } from './roomsB'
import type { WorksEnding, WorksEntry, WorksRoomId } from './types'

export type * from './types'

export const WORKS_ENDINGS: readonly WorksEnding[] = [
  'open-road',
  'keep-secret',
  'give-key',
]

export const BREATHING_WORKS = createAuthoredDungeon<
  WorksRoomId,
  WorksEntry,
  WorksEnding
>({
  prefix: 'GT',
  roomCount: 36,
  rooms: [...WORKS_ROOMS_A, ...WORKS_ROOMS_B],
  graph: WORKS_GRAPH,
  shortcuts: WORKS_SHORTCUTS,
  entryRoom: 'GT-01',
  guardianRoom: 'GT-32',
  vaultRoom: 'GT-33',
  climaxRoom: 'GT-35',
  exitRoom: 'GT-36',
  endings: WORKS_ENDINGS,
  batteryStart: 3,
  batteryMax: 5,
})
