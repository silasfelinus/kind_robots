// /utils/arcade/hedgehogCrossing/rules.ts
//
// Hedgehog Crossing depth pass, slice 1 (conductor kr-arcade/t-102): the rules that are plain
// data and arithmetic, kept out of the render loop so a test can drive them directly. The
// escalation table (every level asks for something new, with no plateau), the grass snake and
// its tongue-flick tell, the heron and its sweeping shadow, the Family Parade's scoring, and where
// a hop lands -- shared by the lead hedgehog, every hoglet in the parade, and Bristle Dash. The
// lanes themselves (kinds, the Park Lane board, the per-level remixes) live in ./lanes.ts.

import { levelCurve } from '../curve'
import type { CurveSpec } from '../curve'

export const TILE = 20
export const W = 280
export const HALF = 7
export const START_ROW = 12
export const MEDIAN_ROW = 6

export const HOP_TICKS = 8
/** Bristle Dash covers two rows in a slightly longer, flatter leap. */
export const DASH_TICKS = 11
/** Three seconds before the next dash. */
export const DASH_COOLDOWN = 180
export const DASH_ROWS = 2

export const MAX_PARADE = 3
/** A Parade Bonus pays this times the hoglets in the line, squared. */
export const PARADE_BONUS = 1000

/** The first level a plateau used to begin at (level 11); the table below keeps climbing past it. */
export const OLD_PLATEAU = 11

export const HEDGEHOG_CURVES = {
  speed: { start: 1, step: 0.12, limit: 2.2 },
  /** Tiles shaved off every log, so the gaps grow. */
  logTrim: { start: 0, step: 0.5, limit: 2 },
  divingGroups: { start: 1, step: 1, limit: 4 },
  foxEvery: { start: 0, step: 520, limit: 520 },
} as const satisfies Record<string, CurveSpec>

/** What a level asks of the player, from the curves plus the late-game climb. */
export type Escalation = {
  /** Lane speed multiplier. */
  speed: number
  logTrim: number
  /** Turtle groups that dive, counted across the creek. */
  divingGroups: number
  /** 1 means every other turtle group dives (today); 2 means every group. */
  diveStride: 1 | 2
  /** Ticks between foxes (0 = no fox yet). */
  foxEvery: number
  snakes: number
  snakeSpeed: number
  /** Lanes whose direction is flipped this level (parity of lane index to flip). */
  flipParity: 0 | 1 | null
  /** Hoglets waiting on the median at the start of each trip. */
  hoglets: number
  /** Whether a lost hoglet rides a log. */
  lostHoglet: boolean
  /** Ticks between heron visits (0 = no heron yet). */
  heronEvery: number
}

/** Past the old plateau the climb continues, slower, until a ceiling nobody reaches by accident. */
const LATE_SPEED_STEP = 0.04
const LATE_SPEED_LIMIT = 3.2

export function escalation(level: number): Escalation {
  const lvl = Math.max(1, Math.floor(level))
  const late = Math.max(0, lvl - OLD_PLATEAU)
  const speed = Math.min(
    LATE_SPEED_LIMIT,
    levelCurve(lvl, HEDGEHOG_CURVES.speed) + late * LATE_SPEED_STEP,
  )
  const fox = levelCurve(lvl, HEDGEHOG_CURVES.foxEvery)
  return {
    speed,
    logTrim: Math.floor(levelCurve(lvl, HEDGEHOG_CURVES.logTrim)),
    divingGroups: Math.round(levelCurve(lvl, HEDGEHOG_CURVES.divingGroups)),
    diveStride: lvl > OLD_PLATEAU ? 1 : 2,
    foxEvery: fox === 0 ? 0 : Math.max(240, fox - late * 20),
    snakes: lvl < 2 ? 0 : lvl < 5 ? 1 : lvl < 9 ? 2 : 3,
    snakeSpeed: Math.min(1.5, 0.5 + 0.03 * (lvl - 2) + late * 0.01),
    flipParity: lvl > OLD_PLATEAU ? ((lvl % 2) as 0 | 1) : null,
    hoglets: Math.min(MAX_PARADE, 1 + Math.floor(lvl / 2)),
    lostHoglet: lvl >= 2,
    heronEvery: heronEvery(lvl),
  }
}

// --- the heron ------------------------------------------------------------------------

/** The heron starts fishing the creek on this level. */
export const HERON_FROM = 6
/** Ticks the shadow sweeps across the creek toward the hedgehog's column. */
export const HERON_SWEEP = 70
/** Ticks the shadow holds still over the chosen column: the tell, time to leave. */
export const HERON_HOLD = 40
/** Ticks the beak is down in the water. */
export const HERON_STAB = 18
/** How close to the column's centre a body must be for the beak to find it. */
export const HERON_REACH = 12

/** Ticks between herons: every 12 s on level 6, falling to every 5 s. */
export function heronEvery(level: number): number {
  if (level < HERON_FROM) return 0
  return Math.max(300, 720 - 60 * (Math.floor(level) - HERON_FROM))
}

export type Heron = {
  phase: 'sweep' | 'hold' | 'stab'
  t: number
  /** Where the shadow came in from (one bank or the other). */
  from: number
  /** The shadow's column right now. */
  x: number
}

const HERON_MIN = HALF + 6
const HERON_MAX = W - HALF - 6

export function newHeron(fromLeft: boolean): Heron {
  const from = fromLeft ? 0 : W
  return { phase: 'sweep', t: 0, from, x: from }
}

/**
 * One tick of the heron. Its shadow sweeps in from a bank and closes on `targetX` (the hedgehog's
 * column, followed while it sweeps), holds there, then the beak stabs. Returns false once the
 * heron has flown off.
 */
export function stepHeron(h: Heron, targetX: number): boolean {
  h.t++
  const target = Math.max(HERON_MIN, Math.min(HERON_MAX, targetX))
  if (h.phase === 'sweep') {
    h.x = h.from + (target - h.from) * Math.min(1, h.t / HERON_SWEEP)
    if (h.t >= HERON_SWEEP) {
      h.phase = 'hold'
      h.t = 0
      h.x = target
    }
    return true
  }
  if (h.phase === 'hold') {
    if (h.t >= HERON_HOLD) {
      h.phase = 'stab'
      h.t = 0
    }
    return true
  }
  return h.t < HERON_STAB
}

/** Is the beak down on a body standing at x in the creek? */
export function heronStrikes(h: Heron, x: number): boolean {
  return h.phase === 'stab' && Math.abs(x - h.x) < HERON_REACH
}

// --- the grass snake ------------------------------------------------------------------

export const SNAKE_LEN = 30
/** Ticks the tongue flicks before the snake turns: the tell. */
export const SNAKE_FLICK = 45

export type Snake = {
  x: number
  dir: 1 | -1
  phase: 'slither' | 'flick'
  timer: number
}

export function newSnake(x: number, dir: 1 | -1, timer: number): Snake {
  return { x, dir, phase: 'slither', timer }
}

/**
 * One tick of a snake on the median: it slithers, then holds still and flicks its tongue for
 * SNAKE_FLICK ticks, then slithers off again (usually the other way). It always flicks before it
 * turns, including at the edge of the verge.
 */
export function stepSnake(s: Snake, speed: number, rng: () => number): void {
  const min = SNAKE_LEN / 2 + 4
  const max = W - SNAKE_LEN / 2 - 4
  if (s.phase === 'flick') {
    if (--s.timer > 0) return
    // Turn most of the time; now and then carry straight on.
    if (rng() < 0.75 || s.x <= min || s.x >= max) s.dir = s.dir > 0 ? -1 : 1
    s.phase = 'slither'
    s.timer = 90 + Math.floor(rng() * 110)
    return
  }
  s.x += s.dir * speed
  if (s.x <= min || s.x >= max) {
    s.x = Math.max(min, Math.min(max, s.x))
    s.phase = 'flick'
    s.timer = SNAKE_FLICK
    return
  }
  if (--s.timer <= 0) {
    s.phase = 'flick'
    s.timer = SNAKE_FLICK
  }
}

/** Does a hedgehog (or hoglet) standing at x share the snake's tile? */
export function snakeBites(s: Snake, x: number): boolean {
  return Math.abs(x - s.x) < SNAKE_LEN / 2 + HALF - 4
}

// --- hops -----------------------------------------------------------------------------

export type Delta = { dx: number; drow: number; dash?: boolean }

/**
 * Where a hop from (x, row) lands. `drift` is how far the lane under the hopper carries it
 * during the hop (a log or turtle keeps its current through the leap).
 */
export function landing(
  x: number,
  row: number,
  delta: Delta,
  drift: number,
): { toX: number; toRow: number } {
  return {
    toRow: Math.max(0, Math.min(START_ROW, row + delta.drow)),
    toX: Math.max(HALF + 3, Math.min(W - HALF - 3, x + delta.dx + drift)),
  }
}

/** A dash needs two rows of road ahead; from row 1 it would only be a plain hop. */
export function canDash(row: number, cooldown: number): boolean {
  return cooldown <= 0 && row >= DASH_ROWS
}

// --- the Family Parade ----------------------------------------------------------------------

/** What every point earned on the way is multiplied by: one extra per hoglet in the line. */
export function paradeMultiplier(hoglets: number): number {
  return 1 + Math.max(0, Math.min(MAX_PARADE, hoglets))
}

/** The Parade Bonus for walking `hoglets` hoglets into one burrow. */
export function paradeBonus(hoglets: number): number {
  const n = Math.max(0, Math.min(MAX_PARADE, hoglets))
  return PARADE_BONUS * n * n
}
