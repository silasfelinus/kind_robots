// /utils/arcade/cableCrawler/glitches.ts
//
// The Mainframe's glitches (conductor kr-arcade/t-064): the little faults living in the
// components. Each has a tell and an answer (CABINETS.md section 8, "The roster"):
//
//   static bug    wanders the corridors and crackles near the plug. Meeting the plug head-on
//                 unplugs you; it bounces off your cable's body. Lead it alongside and surge.
//   dust bunny    a soft block in a corridor. The plug pushes it, Sokoban-style, and it rolls up
//                 any spark it is pushed over. Park it in a dead end, or surge it away.
//   mimic spark   looks like a spark but twinkles out of phase. Slurping it shorts ten seconds
//                 off the battery. Read the twinkle, or surge it.
//
// A surged glitch reboots: it turns into points, and a static bug boots back up at its home
// a while later.

import { COLS, ROWS, cellKey, cellX, cellY } from './mazes'

export type GlitchKind = 'bug' | 'bunny' | 'mimic'

export type Glitch = {
  kind: GlitchKind
  /** Its cell. */
  k: number
  /** Where it came from (a bug boots back up here). */
  home: number
  dx: number
  dy: number
  /** Ticks to its next step. */
  timer: number
  /** Ticks until a rebooted bug boots back up (0 while it is about). */
  down: number
  /** Ticks it blinks harmlessly after booting up. */
  booting: number
  /** Gone for the rest of this maze (a surged bunny or mimic). */
  gone: boolean
}

export const GLITCH_POINTS: Record<GlitchKind, number> = {
  bug: 250,
  bunny: 150,
  mimic: 100,
}

/** Ticks a rebooted static bug stays down before it boots back up. */
export const BUG_DOWN = 900
/** Ticks a booting bug blinks, harmless, before it wanders again. */
export const BUG_BOOT = 120
/** How close (in steps) a static bug crackles at the plug. */
export const CRACKLE_RANGE = 4
/** Battery a mimic spark shorts, in ticks. */
export const MIMIC_SHORT = 600

export function newGlitch(kind: GlitchKind, k: number): Glitch {
  return {
    kind,
    k,
    home: k,
    dx: 0,
    dy: -1,
    timer: 30,
    down: 0,
    booting: 0,
    gone: false,
  }
}

/** A glitch that can touch things: not rebooting, gone or still booting. */
export function glitchLive(g: Glitch): boolean {
  return !g.gone && g.down === 0 && g.booting === 0
}

/** What a static bug's next cell holds, as the game sees it. */
export type BugSight = 'open' | 'wall' | 'body' | 'head'

const WAYS = [
  { dx: 0, dy: -1 },
  { dx: 1, dy: 0 },
  { dx: 0, dy: 1 },
  { dx: -1, dy: 0 },
] as const

/**
 * Pick a static bug's next way: straight on two times in three where it can, otherwise a turn
 * at random, and back the way it came only from a dead end. Returns null when it is boxed in.
 */
export function bugWay(
  bug: Glitch,
  look: (k: number) => BugSight,
  rng: () => number,
): { dx: number; dy: number } | null {
  const x = cellX(bug.k)
  const y = cellY(bug.k)
  const cell = (d: { dx: number; dy: number }) => {
    const nx = x + d.dx
    const ny = y + d.dy
    if (nx < 0 || ny < 0 || nx >= COLS || ny >= ROWS) return -1
    return cellKey(nx, ny)
  }
  const can = (d: { dx: number; dy: number }) => {
    const n = cell(d)
    return n >= 0 && look(n) !== 'wall'
  }
  const back = (d: { dx: number; dy: number }) =>
    d.dx === -bug.dx && d.dy === -bug.dy
  const ahead = WAYS.find((d) => d.dx === bug.dx && d.dy === bug.dy)
  const turns = WAYS.filter((d) => !back(d) && can(d))
  if (ahead && can(ahead) && (turns.length === 1 || rng() < 0.67)) return ahead
  if (turns.length) return turns[Math.floor(rng() * turns.length)]!
  const reverse = WAYS.find(back)
  return reverse && can(reverse) ? reverse : null
}
