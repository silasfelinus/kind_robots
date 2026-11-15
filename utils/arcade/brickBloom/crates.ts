// /utils/arcade/brickBloom/crates.ts
//
// Brick Bloom's Cactus Dome and Lily Pond House crates and water (conductor kr-arcade/t-080,
// depth-pass CABINETS.md section 11, slice 3), as numbers and pure functions:
//   - prickle crates prick the ball and every ball speeds up a step (past the usual cap a little);
//   - sand-timer crates are unbreakable while their sand runs, then flip and can be cracked;
//   - the Lily Pond's lower wall is under water: the ball moves slow and floaty there, and lily-pad
//     rows drift on the current;
//   - a bubble crate pops into a short-lived bumper that springs the ball away.
// The cabinet owns the crates and the ball; these own the rules, so the test can pin each one.

import { COLS } from './walls'

// --- prickle crates --------------------------------------------------------------------------

/** Pixels per tick a prickle adds to every ball, and how far past the stage's cap it may push. */
export const PRICKLE_BOOST = 0.3
export const PRICKLE_OVER = 0.8

export function prickled(speed: number, cap: number): number {
  return Math.min(cap + PRICKLE_OVER, speed + PRICKLE_BOOST)
}

// --- sand-timer crates -----------------------------------------------------------------------

/** Ticks the sand runs (unbreakable), then ticks it lies flipped (crackable). */
export const SAND_RUN = 240
export const SAND_OPEN = 180

/** Whether a sand timer with this offset lies flipped open at `tick`. */
export function sandOpen(tick: number, offset: number): boolean {
  return (tick + offset) % (SAND_RUN + SAND_OPEN) >= SAND_RUN
}

/** How much sand is left in the top bulb (1 full .. 0 empty); 0 while it lies flipped. */
export function sandLeft(tick: number, offset: number): number {
  const t = (tick + offset) % (SAND_RUN + SAND_OPEN)
  return t >= SAND_RUN ? 0 : 1 - t / SAND_RUN
}

// --- the pond --------------------------------------------------------------------------------

/** The water fills the lower wall: from the top of wall row 6 down past the wall. */
export const WATER_TOP = 108
export const WATER_BOTTOM = 212
/** Under water the ball moves at this fraction of its speed... */
export const WATER_DRAG = 0.6
/** ...and the current nudges it sideways, a little, every tick. */
export const WATER_CURRENT = 0.012

export function inWater(y: number): boolean {
  return y >= WATER_TOP && y <= WATER_BOTTOM
}

/** Which way the current runs along wall row `row` at `tick` (rows alternate). */
export function currentDir(row: number, tick: number): number {
  return Math.sin(tick / 200 + row * 1.7)
}

/** Most a drifting lily row moves in one tick. */
export const LILY_DRIFT = 0.4

/**
 * Where a lily row wants to sit: swaying on the current between hard left and hard right, so its
 * pads (columns minCol..maxCol) never leave the glass.
 */
export function lilyGoal(
  row: number,
  tick: number,
  minCol: number,
  maxCol: number,
  cellW: number,
): number {
  const lo = -minCol * cellW
  const hi = (COLS - 1 - maxCol) * cellW
  return lo + (hi - lo) * (0.5 + 0.5 * currentDir(row, tick))
}

/** Step a row's drift toward its goal, never faster than the current. */
export function driftToward(dx: number, goal: number): number {
  return dx + Math.max(-LILY_DRIFT, Math.min(LILY_DRIFT, goal - dx))
}

// --- bubble bumpers --------------------------------------------------------------------------

export type Bumper = { x: number; y: number; ticks: number; cool: number }

export const BUMPER_TICKS = 240
export const BUMPER_R = 9
export const BUMPER_SCORE = 30
/** A bumper springs the ball away this much faster (up to the cap the cabinet gives). */
export const BUMPER_KICK = 0.25

export function spawnBumper(x: number, y: number): Bumper {
  return { x, y, ticks: BUMPER_TICKS, cool: 0 }
}

/**
 * A ball touching a bumper is sprung straight away from its middle. Returns the new velocity, or
 * null when it doesn't touch (or the bumper is still ringing from the last spring).
 */
export function bumperBounce(
  b: Bumper,
  ball: { x: number; y: number; vx: number; vy: number },
  r: number,
  cap: number,
): { vx: number; vy: number } | null {
  if (b.cool > 0 || b.ticks <= 0) return null
  const dx = ball.x - b.x
  const dy = ball.y - b.y
  const d = Math.hypot(dx, dy)
  if (d > BUMPER_R + r || d === 0) return null
  const s = Math.min(cap, Math.hypot(ball.vx, ball.vy) + BUMPER_KICK)
  b.cool = 8
  return { vx: (dx / d) * s, vy: (dy / d) * s }
}

export function stepBumper(b: Bumper): void {
  if (b.cool > 0) b.cool--
  if (b.ticks > 0) b.ticks--
}
