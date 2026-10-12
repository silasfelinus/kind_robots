// /utils/arcade/bumperBubbles/pantries.ts
//
// Fizzwick Tower's five Secret Pantries (conductor kr-arcade m8, spec: CABINETS.md section 7,
// "Structure"). A pantry door appears on floors 20, 40, 60, 80 and 90 when the floor is
// cleared without a robot lost since the wing began: the classic's kind of hidden condition.
// Through it is a room of treats and one of the five lost recipe cards the true ending needs.
// Slice 2 (t-060) opens the first two.

import { PANTRY_ROOMS } from './pantryRooms'
import type { FloorDef } from './tower'

export type PantryDef = {
  /** The floor whose door leads here. */
  floor: number
  name: string
  /** The recipe card waiting inside. */
  card: string
  room: FloorDef
}

export const PANTRIES: readonly PantryDef[] = [
  {
    floor: 20,
    name: 'THE SYRUP PANTRY',
    card: 'CHERRY SYRUP',
    room: PANTRY_ROOMS[0]!,
  },
  {
    floor: 40,
    name: 'THE SUGAR LARDER',
    card: 'STARDUST SUGAR',
    room: PANTRY_ROOMS[1]!,
  },
]

/** The floors whose doors lead to a pantry, built or not yet (the Map points to the next). */
export const PANTRY_FLOORS = [20, 40, 60, 80, 90] as const

/** How long a robot has in a pantry before the tower calls it back. */
export const PANTRY_TICKS = 60 * 14

export function pantryFor(floor: number): PantryDef | null {
  return PANTRIES.find((p) => p.floor === floor) ?? null
}

/** The next pantry floor at or after `floor`, or null past the last. */
export function nextPantryFloor(floor: number): number | null {
  return PANTRY_FLOORS.find((f) => f >= floor) ?? null
}
