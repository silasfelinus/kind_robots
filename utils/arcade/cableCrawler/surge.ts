// /utils/arcade/cableCrawler/surge.ts
//
// The Plug-In Surge (conductor kr-arcade/t-064): drive the plug into a socket and the current runs
// down the whole cable. Every spark by the cable's sides (two cells out, across a thin wall) is slurped as a climbing chain,
// every glitch touching it reboots, and the battery tops up by the cable's length. The rules here
// are pure, so the test can check them cell by cell.

import { COLS, ROWS, cellKey, cellX, cellY } from './mazes'

/** The chain a surge climbs, spark by spark; it holds at the last step. */
export const CHAIN = [10, 20, 40, 80, 160, 320, 500] as const

/** Points for the nth spark of a chain (0 first), before the component's multiplier. */
export function chainPoints(n: number): number {
  return CHAIN[Math.min(n, CHAIN.length - 1)]!
}

/** Ticks a socket takes to recharge after a surge. */
export const SOCKET_RECHARGE = 600
/** Battery a surge gives back for each cell of cable, in ticks. */
export const SURGE_TOPUP_PER_CELL = 30

/** How far the current arcs off the cable's sides, in cells (a Workbench upgrade adds one). */
export const SURGE_REACH = 2

/** Offsets within `reach` steps, nearest first (clockwise from up at each distance). */
function offsets(reach: number): Array<{ dx: number; dy: number }> {
  const out: Array<{ dx: number; dy: number; d: number; a: number }> = []
  for (let dy = -reach; dy <= reach; dy++)
    for (let dx = -reach; dx <= reach; dx++) {
      const d = Math.abs(dx) + Math.abs(dy)
      if (d === 0 || d > reach) continue
      const a = (Math.atan2(dx, -dy) + 2 * Math.PI) % (2 * Math.PI)
      out.push({ dx, dy, d, a })
    }
  return out.sort((p, q) => p.d - q.d || p.a - q.a)
}

/**
 * The cells a surge sweeps, in the order the current reaches them: walking the cable from the
 * plug to its tail end, every floor cell within `reach` steps of each cable cell, nearest first.
 * The current arcs across a thin wall, so a cable laid down one corridor sweeps the next one
 * over too. The cable's own cells are never in the sweep.
 */
export function surgeSweep(
  cable: readonly number[],
  walls: readonly boolean[],
  reach = SURGE_REACH,
): number[] {
  const onCable = new Set(cable)
  const seen = new Set<number>()
  const out: number[] = []
  const around = offsets(reach)
  for (const k of cable)
    for (const d of around) {
      const x = cellX(k) + d.dx
      const y = cellY(k) + d.dy
      if (x < 0 || y < 0 || x >= COLS || y >= ROWS) continue
      const n = cellKey(x, y)
      if (walls[n] || onCable.has(n) || seen.has(n)) continue
      seen.add(n)
      out.push(n)
    }
  return out
}
