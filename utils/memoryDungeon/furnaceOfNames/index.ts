/**
 * The Furnace of Names, e08's 36-room dungeon: e07's Red Oven after the
 * night procession, on the shared plan. FN-NN remembers OV-NN. Kogane,
 * now the procession's registrar, is the guardian at FN-32.
 */
import { createAuthoredDungeon } from '../authoredDungeon/engine'
import { FURNACE_GRAPH, FURNACE_SHORTCUTS } from './graph'
import { FURNACE_ROOMS_A } from './roomsA'
import { FURNACE_ROOMS_B } from './roomsB'
import type { FurnaceEnding, FurnaceEntry, FurnaceRoomId } from './types'

export type * from './types'

export const FURNACE_ENDINGS: readonly FurnaceEnding[] = [
  'return-names',
  'burn-ledger',
  'vesper-signs',
]

export const FURNACE_OF_NAMES = createAuthoredDungeon<
  FurnaceRoomId,
  FurnaceEntry,
  FurnaceEnding
>({
  prefix: 'FN',
  roomCount: 36,
  rooms: [...FURNACE_ROOMS_A, ...FURNACE_ROOMS_B],
  graph: FURNACE_GRAPH,
  shortcuts: FURNACE_SHORTCUTS,
  entryRoom: 'FN-01',
  guardianRoom: 'FN-32',
  vaultRoom: 'FN-33',
  climaxRoom: 'FN-35',
  exitRoom: 'FN-36',
  endings: FURNACE_ENDINGS,
  batteryStart: 3,
  batteryMax: 5,
})
