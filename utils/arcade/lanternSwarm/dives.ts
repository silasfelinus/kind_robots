// /utils/arcade/lanternSwarm/dives.ts
//
// Lantern Swarm depth pass, slice 1 (conductor kr-arcade/t-093): the dive-shape library. A dive is
// a list of waypoints the moth steers through, some of which lean toward the lantern as it comes
// down (`track`). A stage lists which shapes its moths may fly, so the swarm's dives change from
// stage to stage instead of the one sweep of old.
//
// - sweep: out to the side, then a long sweep down at the lantern.
// - loop: out and down into a loop-the-loop, then down at the lantern.
// - zig: a zig-zag down the screen, each zig leaning toward the lantern.
// - swoop: down past the lantern, under the bottom edge, and back up from below to the swarm.

import { H, type DiveShape, type Pt } from './zones'

export type DiveContext = {
  /** Where the moth sets off. */
  x: number
  y: number
  /** -1 when it peels off to the left, 1 to the right. */
  side: -1 | 1
  lanternX: number
  shipY: number
  rng: () => number
}

export type DivePlan = {
  path: Pt[]
  /** Waypoints that lean toward the lantern while the moth is still heading for them. */
  track: number[]
  /** It comes back up into the swarm by itself (instead of looping round from the top). */
  returns: boolean
}

export const DIVES: Record<DiveShape, (c: DiveContext) => DivePlan> = {
  sweep: (c) => ({
    path: [
      { x: c.x + c.side * 26, y: c.y - 16 },
      { x: c.x + c.side * 46, y: c.y + 30 },
      { x: c.lanternX + (c.rng() - 0.5) * 40, y: H * 0.6 },
      { x: c.lanternX, y: c.shipY },
      { x: c.lanternX - c.side * 30, y: H + 30 },
    ],
    track: [2, 3],
    returns: false,
  }),
  loop: (c) => {
    const cx = Math.max(40, Math.min(184, c.x + c.side * 34))
    const cy = 150
    const r = 26
    return {
      path: [
        { x: c.x + c.side * 22, y: c.y - 14 },
        { x: cx, y: cy - r - 20 },
        { x: cx + c.side * r, y: cy },
        { x: cx, y: cy + r },
        { x: cx - c.side * r, y: cy },
        { x: cx, y: cy - r },
        { x: c.lanternX, y: c.shipY },
        { x: c.lanternX + c.side * 30, y: H + 30 },
      ],
      track: [6],
      returns: false,
    }
  },
  zig: (c) => {
    const mid = (c.x + c.lanternX) / 2
    return {
      path: [
        { x: c.x + c.side * 20, y: c.y - 12 },
        { x: mid - 38, y: c.y + 50 },
        { x: mid + 38, y: c.y + 100 },
        { x: c.lanternX - 34, y: c.y + 150 },
        { x: c.lanternX + 22, y: c.shipY - 8 },
        { x: c.lanternX, y: H + 30 },
      ],
      track: [1, 2, 3, 4],
      returns: false,
    }
  },
  swoop: (c) => {
    const back = c.lanternX < 112 ? 1 : -1
    return {
      path: [
        { x: c.x + c.side * 24, y: c.y - 14 },
        { x: c.lanternX - back * 18, y: c.shipY - 40 },
        { x: c.lanternX + back * 10, y: H + 12 },
        { x: c.lanternX + back * 60, y: c.shipY - 2 },
        { x: c.lanternX + back * 50, y: 150 },
      ],
      track: [1],
      returns: true,
    }
  },
}

/** A dive of the stage's shapes, picked on the game's rng. */
export function planDive(
  shapes: readonly DiveShape[],
  c: DiveContext,
): DivePlan {
  const shape = shapes[Math.floor(c.rng() * shapes.length)] ?? 'sweep'
  return DIVES[shape](c)
}
