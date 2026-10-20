// /utils/arcade/brickBloom/snails.ts
//
// Brick Bloom's snail bot (conductor kr-arcade/t-079, depth-pass CABINETS.md section 11, slice 2):
// a slow shelled pest that patrols a lane under the Vine Hall crates. Its shell bounces the ball
// back up; two hits crack it. Pure functions; the cabinet owns the state and the drawing.

import { LEFT, RIGHT } from './rules'

export type Snail = {
  x: number
  y: number
  dir: 1 | -1
  hp: number
  flash: number
}

export const SNAIL_HP = 2
export const SNAIL_RADIUS = 8
export const SNAIL_SPEED = 0.3
export const SNAIL_LANE = 170
export const SNAIL_FLASH = 12
export const SNAIL_SCORE = 150

/** Vine Hall (house 1) is where snail bots patrol, from its second wall on. */
export function snailsPatrol(house: number, wallId: string): boolean {
  return house === 1 && wallId !== 'vine-1'
}

export function spawnSnail(fromLeft: boolean): Snail {
  return {
    x: fromLeft ? LEFT + SNAIL_RADIUS : RIGHT - SNAIL_RADIUS,
    y: SNAIL_LANE,
    dir: fromLeft ? 1 : -1,
    hp: SNAIL_HP,
    flash: 0,
  }
}

/** One tick: creep along the lane and turn at the glass. */
export function stepSnail(s: Snail): void {
  if (s.flash > 0) s.flash--
  s.x += s.dir * SNAIL_SPEED
  if (s.x < LEFT + SNAIL_RADIUS) {
    s.x = LEFT + SNAIL_RADIUS
    s.dir = 1
  } else if (s.x > RIGHT - SNAIL_RADIUS) {
    s.x = RIGHT - SNAIL_RADIUS
    s.dir = -1
  }
}

export function snailHit(s: Snail, x: number, y: number): boolean {
  return Math.hypot(s.x - x, s.y - y) <= SNAIL_RADIUS
}

/** The shell takes a hit. Returns the score when it cracks, otherwise 0. */
export function crackSnail(s: Snail, level: number): number {
  s.hp = Math.max(0, s.hp - 1)
  s.flash = SNAIL_FLASH
  return s.hp === 0 ? SNAIL_SCORE * Math.max(1, level) : 0
}
