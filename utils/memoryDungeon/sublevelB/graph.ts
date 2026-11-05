import type { SublevelRoomId } from './types'

/**
 * Authored passages (forward exits; backtracking through visited rooms is
 * always allowed). The 6x6 atlas places SB-01..SB-36 row by row:
 * intake, compactor stacks, cold rooms, server and records, Rowan's corner,
 * and the night archive.
 */
export const SUBLEVEL_GRAPH: Readonly<
  Record<SublevelRoomId, readonly SublevelRoomId[]>
> = {
  'SB-01': ['SB-02', 'SB-07'],
  'SB-02': ['SB-03', 'SB-08'],
  'SB-03': ['SB-04', 'SB-09'],
  'SB-04': ['SB-05', 'SB-10'],
  'SB-05': ['SB-06', 'SB-11'],
  'SB-06': ['SB-12'],
  'SB-07': ['SB-08', 'SB-13'],
  'SB-08': ['SB-09', 'SB-14'],
  'SB-09': ['SB-10'],
  'SB-10': ['SB-11', 'SB-16'],
  'SB-11': ['SB-12', 'SB-17'],
  'SB-12': ['SB-18'],
  'SB-13': ['SB-14', 'SB-19'],
  'SB-14': ['SB-15', 'SB-20'],
  'SB-15': ['SB-16', 'SB-21'],
  'SB-16': ['SB-17', 'SB-22'],
  'SB-17': ['SB-18', 'SB-23'],
  'SB-18': ['SB-24'],
  'SB-19': ['SB-20', 'SB-25'],
  'SB-20': ['SB-21', 'SB-26'],
  'SB-21': ['SB-22', 'SB-27'],
  'SB-22': ['SB-23', 'SB-28'],
  'SB-23': ['SB-24', 'SB-29'],
  'SB-24': ['SB-30'],
  'SB-25': ['SB-26', 'SB-31'],
  'SB-26': ['SB-27'],
  'SB-27': ['SB-28'],
  'SB-28': ['SB-29'],
  'SB-29': ['SB-30'],
  'SB-30': [],
  'SB-31': ['SB-32'],
  'SB-32': ['SB-33'],
  'SB-33': ['SB-34'],
  'SB-34': ['SB-35'],
  'SB-35': ['SB-36'],
  'SB-36': [],
}

/** Two-way passages opened by a decision. */
export const SUBLEVEL_SHORTCUTS: readonly {
  a: SublevelRoomId
  b: SublevelRoomId
  room: SublevelRoomId
  choice: string
}[] = [
  // The warm corridor's fire door, unlatched, drops back to the intake stair.
  { a: 'SB-18', b: 'SB-05', room: 'SB-18', choice: 'unlatch' },
  // A wedged loading-dock door is a straight run to the night archive.
  { a: 'SB-24', b: 'SB-31', room: 'SB-24', choice: 'wedge' },
]

export const SUBLEVEL_ENTRY_ROOM: SublevelRoomId = 'SB-01'
export const SUBLEVEL_GUARDIAN_ROOM: SublevelRoomId = 'SB-32'
export const SUBLEVEL_CLIMAX_ROOM: SublevelRoomId = 'SB-35'
export const SUBLEVEL_EXIT_ROOM: SublevelRoomId = 'SB-36'
