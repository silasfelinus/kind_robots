/**
 * e10's 36-room dungeon on the shared authored-dungeon engine
 * (2026-11-20 PT), entered from e10 6,2.
 */
import { createAuthoredDungeon } from '../authoredDungeon/engine'
import { SPECIMEN_STACKS_GRAPH } from './graph'
import { SPECIMEN_STACKS_ROOMS } from './rooms'
import type {
  SpecimenStacksEnding,
  SpecimenStacksEntry,
  SpecimenStacksRoomId,
} from './types'

export type * from './types'

export const SPECIMEN_STACKS_ENDINGS: readonly SpecimenStacksEnding[] = [
  'return-every-page',
  'two-column-ledger',
  'bill-the-building',
]

/** Overworld choice at e10 6,2 → dungeon entry. */
export const SPECIMEN_STACKS_ENTRY_BY_CHOICE: Readonly<
  Record<string, SpecimenStacksEntry>
> = {
  'carry-signed-testimony': 'testimony',
  'return-pages-before-descent': 'returned-pages',
}

export const SPECIMEN_STACKS = createAuthoredDungeon<
  SpecimenStacksRoomId,
  SpecimenStacksEntry,
  SpecimenStacksEnding
>({
  prefix: 'SP',
  roomCount: 36,
  rooms: SPECIMEN_STACKS_ROOMS,
  graph: SPECIMEN_STACKS_GRAPH,
  shortcuts: [
    { a: 'SP-18', b: 'SP-05', room: 'SP-18', choice: 'shortcut-back' },
    { a: 'SP-24', b: 'SP-31', room: 'SP-24', choice: 'shortcut-down' },
  ],
  entryRoom: 'SP-01',
  guardianRoom: 'SP-32',
  vaultRoom: 'SP-33',
  climaxRoom: 'SP-35',
  exitRoom: 'SP-36',
  endings: SPECIMEN_STACKS_ENDINGS,
  batteryStart: 3,
  batteryMax: 5,
})
