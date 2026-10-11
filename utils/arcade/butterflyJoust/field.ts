// /utils/arcade/butterflyJoust/field.ts
//
// Butterfly Joust's playfield: its size, the pond line and the ceiling, the ledge shape, and the
// wrap-around arithmetic every flier shares.

export const W = 448
export const H = 336
/** Fall below this and you are in the pond. */
export const POND_Y = 322
/** The HUD band above the arena. */
export const CEILING = 26
/** A ledge slab's thickness. */
export const THICK = 6

export type Ledge = { x0: number; x1: number; y: number }

/** Shortest signed horizontal distance from a to b on the wrapping field. */
export function wrapDx(a: number, b: number): number {
  let d = b - a
  if (d > W / 2) d -= W
  if (d < -W / 2) d += W
  return d
}

export function wrapX(x: number): number {
  return ((x % W) + W) % W
}

/** Whether x (on the wrapping field) is over the ledge. */
export function onLedge(l: Ledge, x: number): boolean {
  return (
    (x >= l.x0 && x <= l.x1) ||
    (x + W >= l.x0 && x + W <= l.x1) ||
    (x - W >= l.x0 && x - W <= l.x1)
  )
}
