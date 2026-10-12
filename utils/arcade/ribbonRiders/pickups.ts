// /utils/arcade/ribbonRiders/pickups.ts
//
// The six festival pickups (conductor kr-arcade/t-074). They light up on empty cells at set times;
// a rider collects one by riding over it or by wrapping the cell it sits on. A rival's ribbon laid
// across one hides it from the road, so only a wrap can reach it then.

export type PickupKind =
  'snip' | 'spool' | 'eraser' | 'bow' | 'freeze' | 'spark'

export type PickupSpec = {
  name: string
  /** What the banner says it does. */
  about: string
  /** How often it turns up, against the others. */
  weight: number
}

export const PICKUPS: Record<PickupKind, PickupSpec> = {
  snip: { name: 'SNIP', about: 'CUT THE NEXT RIBBON YOU HIT', weight: 3 },
  spool: { name: 'SPOOL', about: 'A DOUBLE-WIDE RIBBON', weight: 2 },
  eraser: { name: 'ERASER', about: 'YOUR OLDEST RIBBON VANISHES', weight: 2 },
  bow: { name: 'BOW', about: 'YOUR NEXT WRAP CAN BE TWICE AS BIG', weight: 2 },
  freeze: { name: 'FREEZE FRAME', about: 'RIVALS PAUSE', weight: 2 },
  spark: { name: 'TURBO SPARK', about: 'TURBO REFILLED', weight: 3 },
}

export const PICKUP_KINDS = Object.keys(PICKUPS) as PickupKind[]

/** Ticks a pickup stays lit before it fades. */
export const PICKUP_LIFE = 60 * 12
/** Ticks the Spool lays a double-wide ribbon. */
export const SPOOL_TICKS = 60 * 5
/** Ribbon cells the Eraser takes from the tail. */
export const ERASER_CELLS = 40
/** Ticks the Freeze Frame holds every rival. */
export const FREEZE_TICKS = 30
/** Snips a rider can carry at once. */
export const MAX_SNIPS = 3

/** A weighted pick from `kinds` with one roll in [0, 1). */
export function rollPickup(
  roll: number,
  kinds: readonly PickupKind[] = PICKUP_KINDS,
): PickupKind {
  const total = kinds.reduce((sum, k) => sum + PICKUPS[k].weight, 0)
  let at = roll * total
  for (const k of kinds) {
    at -= PICKUPS[k].weight
    if (at < 0) return k
  }
  return kinds[kinds.length - 1]!
}
