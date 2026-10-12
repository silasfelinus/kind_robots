// /utils/arcade/ribbonRiders/wrap.ts
//
// The wrap-up (Ribbon Riders' signature rule): close a loop and your ribbon gift-wraps whatever is
// inside. A rider's sides are its own ribbon (and its team's), the arena wall and solid terrain;
// a rival's ribbon is not a side, so a loop drawn across one still closes and wraps it too.
//
// After every cell a rider lays, each open neighbour of the new cell is flooded. A flood that stays
// within the size limit is a closed loop; one that runs past it is the open arena. The region the
// rider is riding into is never wrapped, so a rider can't gift-wrap the road in front of it.

import { DX, DY, GRID, idx, type Dir } from './grid'

export type WrapQuery = {
  /** The cell just laid. */
  x: number
  y: number
  /** The way the rider is heading. */
  dir: Dir
  /** The largest loop that wraps. */
  limit: number
  /** True for a side: off the board, the wall, solid terrain, or the rider's own team's ribbon. */
  side: (x: number, y: number) => boolean
  /** Edges that wrap round (the pier's), so a flood crosses them. */
  wrapX?: boolean
  wrapY?: boolean
  /** A cell no wrap may take (a teammate's bike): any region holding one is left alone. */
  forbid?: (i: number) => boolean
}

/** Grid indices of every region the new cell closed, each a closed loop no larger than the limit. */
export function findWraps(q: WrapQuery): number[][] {
  const regions: number[][] = []
  const taken = new Set<number>()
  const fx = step(q.x + DX[q.dir], q.wrapX)
  const fy = step(q.y + DY[q.dir], q.wrapY)
  const ahead = fx < 0 || fy < 0 || q.side(fx, fy) ? -1 : idx(fx, fy)
  for (let d = 0; d < 4; d++) {
    const nx = step(q.x + DX[d]!, q.wrapX)
    const ny = step(q.y + DY[d]!, q.wrapY)
    if (nx < 0 || ny < 0 || q.side(nx, ny)) continue
    const start = idx(nx, ny)
    if (taken.has(start)) continue
    const region = flood(nx, ny, q)
    if (!region) continue
    for (const i of region) taken.add(i)
    if (ahead >= 0 && region.includes(ahead)) continue
    if (q.forbid && region.some(q.forbid)) continue
    regions.push(region)
  }
  return regions
}

function step(v: number, wraps?: boolean): number {
  if (v >= 0 && v < GRID) return v
  return wraps ? (v + GRID) % GRID : -1
}

/** The open region holding (x, y), or null once it is larger than the limit. */
function flood(x: number, y: number, q: WrapQuery): number[] | null {
  const seen = new Set<number>([idx(x, y)])
  const out = [idx(x, y)]
  for (let head = 0; head < out.length; head++) {
    const i = out[head]!
    const cx = i % GRID
    const cy = (i - cx) / GRID
    for (let d = 0; d < 4; d++) {
      const nx = step(cx + DX[d]!, q.wrapX)
      const ny = step(cy + DY[d]!, q.wrapY)
      if (nx < 0 || ny < 0) continue
      const k = idx(nx, ny)
      if (seen.has(k) || q.side(nx, ny)) continue
      seen.add(k)
      out.push(k)
      if (out.length > q.limit) return null
    }
  }
  return out
}

/** Where to tie the bow: the region's cell nearest its centre of mass. */
export function bowCell(region: readonly number[]): number {
  let sx = 0
  let sy = 0
  for (const i of region) {
    sx += i % GRID
    sy += Math.floor(i / GRID)
  }
  const mx = sx / region.length
  const my = sy / region.length
  let best = region[0]!
  let bestD = Infinity
  for (const i of region) {
    const d = Math.hypot((i % GRID) - mx, Math.floor(i / GRID) - my)
    if (d < bestD) {
      bestD = d
      best = i
    }
  }
  return best
}
