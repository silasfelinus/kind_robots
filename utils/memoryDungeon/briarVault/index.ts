/**
 * e09's 36-room dungeon on the shared authored-dungeon engine
 * (2026-11-20 PT), entered from e09 3,6.
 */
import { createAuthoredDungeon } from '../authoredDungeon/engine'
import { BRIAR_VAULT_GRAPH } from './graph'
import { BRIAR_VAULT_ROOMS } from './rooms'
import type {
  BriarVaultEnding,
  BriarVaultEntry,
  BriarVaultRoomId,
} from './types'

export type * from './types'

export const BRIAR_VAULT_ENDINGS: readonly BriarVaultEnding[] = [
  'return-every-tin',
  'sign-for-the-house',
  'let-the-tide-clear-it',
]

/** Overworld choice at e09 3,6 → dungeon entry. */
export const BRIAR_VAULT_ENTRY_BY_CHOICE: Readonly<
  Record<string, BriarVaultEntry>
> = {
  'descend-by-vesper-road': 'vesper-road',
  'read-the-red-wax-receipt': 'red-wax',
}

export const BRIAR_VAULT = createAuthoredDungeon<
  BriarVaultRoomId,
  BriarVaultEntry,
  BriarVaultEnding
>({
  prefix: 'BV',
  roomCount: 36,
  rooms: BRIAR_VAULT_ROOMS,
  graph: BRIAR_VAULT_GRAPH,
  shortcuts: [
    { a: 'BV-18', b: 'BV-05', room: 'BV-18', choice: 'shortcut-back' },
    { a: 'BV-24', b: 'BV-31', room: 'BV-24', choice: 'shortcut-down' },
  ],
  entryRoom: 'BV-01',
  guardianRoom: 'BV-32',
  vaultRoom: 'BV-33',
  climaxRoom: 'BV-35',
  exitRoom: 'BV-36',
  endings: BRIAR_VAULT_ENDINGS,
  batteryStart: 3,
  batteryMax: 5,
})
