// /utils/arcade/ghostTrail/acts/build12.ts
//
// Small layout helpers for Ghost Trail's Stage 1 and Stage 2 acts (conductor kr-arcade t-015..t-020,
// CAMPAIGN-BLUEPRINT.md). An act's ground is written as the list of its pits rather than its runs,
// grave markers as bare x positions, and flights of boardwalk ledges as one call, so the act files
// read like a level designer's notes. Plain data in, plain data out: nothing here draws or plays.

import type { Block, Ledge } from '../world'

/**
 * Ground runs for an act, given its pits as [x, width] pairs (left to right). The last run carries
 * on past the exit, so the gate and the boss arena always stand on ground.
 */
export function groundWithPits(
  length: number,
  pits: Array<[number, number]>,
): Array<[number, number]> {
  const runs: Array<[number, number]> = []
  let from = 0
  for (const [x, w] of pits) {
    runs.push([from, x])
    from = x + w
  }
  runs.push([from, length + 120])
  return runs
}

/** Grave markers standing on the ground (12x16 stones are painted as the stage's tombstones). */
export function graves(...xs: number[]): Block[] {
  return xs.map((x) => ({ x, w: 12, h: 16, look: 'grave' }))
}

/**
 * A flight of one-way ledges: `n` ledges `w` wide, the first at (x, y), each next one `dx` along
 * and `dy` up (negative) or down. Keep each step within a jump (44 px up).
 */
export function flight(
  x: number,
  y: number,
  n: number,
  w: number,
  dx: number,
  dy: number,
): Ledge[] {
  return Array.from({ length: n }, (_, i) => ({
    x: x + i * dx,
    y: y + i * dy,
    w,
  }))
}
