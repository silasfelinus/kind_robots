/**
 * The Choking Works, e06's 36-room dungeon: the Breathing Works warped, on
 * the same plan. CW-NN is GT-NN after the court began feeding the tunnels
 * what it wants forgotten. Maud Weir at CW-32 is the guardian.
 */
import { createAuthoredDungeon } from '../authoredDungeon/engine'
import { CHOKING_GRAPH, CHOKING_SHORTCUTS } from './graph'
import { CHOKING_ROOMS_A } from './roomsA'
import { CHOKING_ROOMS_B } from './roomsB'
import type { ChokingEnding, ChokingEntry, ChokingRoomId } from './types'

export type * from './types'

export const CHOKING_ENDINGS: readonly ChokingEnding[] = [
  'breathe-out',
  'seal-the-road',
  'char-holds-key',
]

export const CHOKING_WORKS = createAuthoredDungeon<
  ChokingRoomId,
  ChokingEntry,
  ChokingEnding
>({
  prefix: 'CW',
  roomCount: 36,
  rooms: [...CHOKING_ROOMS_A, ...CHOKING_ROOMS_B],
  graph: CHOKING_GRAPH,
  shortcuts: CHOKING_SHORTCUTS,
  entryRoom: 'CW-01',
  guardianRoom: 'CW-32',
  vaultRoom: 'CW-33',
  climaxRoom: 'CW-35',
  exitRoom: 'CW-36',
  endings: CHOKING_ENDINGS,
  batteryStart: 3,
  batteryMax: 5,
})
