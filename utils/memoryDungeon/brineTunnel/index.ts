/**
 * e12's 36-room dungeon on the shared authored-dungeon engine
 * (2026-11-20 PT), entered from e12 6,2.
 */
import { createAuthoredDungeon } from '../authoredDungeon/engine'
import { BRINE_TUNNEL_GRAPH } from './graph'
import { BRINE_TUNNEL_ROOMS } from './rooms'
import type {
  BrineTunnelEnding,
  BrineTunnelEntry,
  BrineTunnelRoomId,
} from './types'

export type * from './types'

export const BRINE_TUNNEL_ENDINGS: readonly BrineTunnelEnding[] = [
  'ring-a-held-rest',
  'ring-each-route-home',
  'sign-as-the-source',
]

/** Overworld choice at e12 6,2 → dungeon entry. */
export const BRINE_TUNNEL_ENTRY_BY_CHOICE: Readonly<
  Record<string, BrineTunnelEntry>
> = { 'copy-bell-marks': 'bell-marks', 'bring-singers': 'singers' }

export const BRINE_TUNNEL = createAuthoredDungeon<
  BrineTunnelRoomId,
  BrineTunnelEntry,
  BrineTunnelEnding
>({
  prefix: 'BT',
  roomCount: 36,
  rooms: BRINE_TUNNEL_ROOMS,
  graph: BRINE_TUNNEL_GRAPH,
  shortcuts: [
    { a: 'BT-18', b: 'BT-05', room: 'BT-18', choice: 'shortcut-back' },
    { a: 'BT-24', b: 'BT-31', room: 'BT-24', choice: 'shortcut-down' },
  ],
  entryRoom: 'BT-01',
  guardianRoom: 'BT-32',
  vaultRoom: 'BT-33',
  climaxRoom: 'BT-35',
  exitRoom: 'BT-36',
  endings: BRINE_TUNNEL_ENDINGS,
  batteryStart: 3,
  batteryMax: 5,
})
