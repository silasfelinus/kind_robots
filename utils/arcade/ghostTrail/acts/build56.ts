// /utils/arcade/ghostTrail/acts/build56.ts
//
// Layout helpers for Stages 5 and 6 (Mission Bell Tower, the Abbey Beneath the Bell; conductor
// kr-arcade t-015..t-020, CAMPAIGN-BLUEPRINT.md). Plain functions that turn a designer's shorthand
// (a pit list, a flight of steps, a brazier, a tunnel roof, an ambush room) into the act data the
// game reads, so the acts themselves stay readable as level scripts. Pure data; no game state.

import type { Block, Encounter, Hazard } from '../world'

/** The ground line every act stands on (zuzuGhostTrail's GROUND_Y). */
export const GROUND = 208

/** Ground from 0 to `end`, with pits cut out, each given as [left edge, width]. */
export function groundWith(
  end: number,
  pits: Array<[number, number]>,
): Array<[number, number]> {
  const out: Array<[number, number]> = []
  let from = 0
  for (const [x, w] of [...pits].sort((a, b) => a[0] - b[0])) {
    out.push([from, x])
    from = x + w
  }
  out.push([from, end])
  return out
}

/** A flight of steps standing on the ground: one block per height, each `run` wide, left to right. */
export function steps(
  x: number,
  heights: number[],
  run: number,
  look: Block['look'] = 'stone',
): Block[] {
  return heights.map((h, i) => ({ x: x + i * run, w: run, h, look }))
}

/** A brazier's coals (or the abbey's ritual fire), burning `on` of every `period` ticks. */
export function fire(
  x: number,
  w: number,
  period: number,
  on: number,
  kind: Hazard['kind'] = 'coals',
): Hazard {
  return { x, w, kind, period, on }
}

/**
 * A tunnel roof: a floating block from `top` down to `headroom` px above the ground. Zuzu (22 px
 * tall) walks under it, but a jump inside only bumps his head, so the fire in a tunnel is timed,
 * not hopped. Its top is a walkable upper route.
 */
export function roof(
  x: number,
  w: number,
  top: number,
  headroom = 30,
  look: Block['look'] = 'stone',
): Block {
  return { x, w, y: top, h: GROUND - headroom - top, look }
}

/** The camera hold for an ambush room that starts at `from` (at least a screen wide). */
export function room(from: number, w = 340): NonNullable<Encounter['lock']> {
  return { from, to: from + Math.max(320, w) }
}
