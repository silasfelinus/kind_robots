/**
 * e11's 36-room dungeon on the shared authored-dungeon engine
 * (2026-11-20 PT), entered from e11 6,2.
 */
import { createAuthoredDungeon } from '../authoredDungeon/engine'
import { WELL_OF_RECORDS_GRAPH } from './graph'
import { WELL_OF_RECORDS_ROOMS } from './rooms'
import type {
  WellOfRecordsEnding,
  WellOfRecordsEntry,
  WellOfRecordsRoomId,
} from './types'

export type * from './types'

export const WELL_OF_RECORDS_ENDINGS: readonly WellOfRecordsEnding[] = [
  'her-own-account',
  'open-the-sluice',
  'every-version-witnessed',
]

/** Overworld choice at e11 6,2 → dungeon entry. */
export const WELL_OF_RECORDS_ENTRY_BY_CHOICE: Readonly<
  Record<string, WellOfRecordsEntry>
> = { 'descend-by-choice': 'by-choice', 'test-the-oracle': 'oracle-tested' }

export const WELL_OF_RECORDS = createAuthoredDungeon<
  WellOfRecordsRoomId,
  WellOfRecordsEntry,
  WellOfRecordsEnding
>({
  prefix: 'WR',
  roomCount: 36,
  rooms: WELL_OF_RECORDS_ROOMS,
  graph: WELL_OF_RECORDS_GRAPH,
  shortcuts: [
    { a: 'WR-18', b: 'WR-05', room: 'WR-18', choice: 'shortcut-back' },
    { a: 'WR-24', b: 'WR-31', room: 'WR-24', choice: 'shortcut-down' },
  ],
  entryRoom: 'WR-01',
  guardianRoom: 'WR-32',
  vaultRoom: 'WR-33',
  climaxRoom: 'WR-35',
  exitRoom: 'WR-36',
  endings: WELL_OF_RECORDS_ENDINGS,
  batteryStart: 3,
  batteryMax: 5,
})
