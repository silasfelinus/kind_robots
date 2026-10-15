// /utils/arcade/butterflyBlaster/coop.ts
//
// Butterfly Blaster's Co-op Flight (conductor kr-arcade t-058 part 2, depth-pass/CABINETS.md
// section 6, "Modes"): two to four butterflies through the cabinet's `players` frames.
//
// The first butterfly is the cabinet's own; every other seat flies a wingmate defined here.
// They share the village, the lives, the score and the sparkles. When two butterflies' ribbons
// cross they close a shared loop, the team lasso, worth double.

import { Ribbon, RIBBON_STEP, crossing, makeLoop, MIN_LOOP_AREA } from './lasso'
import type { Loop } from './lasso'
import { SKY, W, limitSpeed, wrap } from './sky'
import type { Point } from './sky'

/** Shared lives a co-op watch starts with: the solo three, plus this many per extra butterfly. */
export const COOP_LIVES_PER_EXTRA = 2
/** A team lasso pays this many times a solo loop. */
export const TEAM_MULTIPLIER = 2
/** And a flat bonus for pulling it off, per mosquito netted. */
export const TEAM_BONUS = 50

/** Wing tints for seats 1..4 (the first is the rainbow butterfly's own colours). */
export const MATE_TINTS: ReadonlyArray<readonly string[]> = [
  ['#f472b6', '#fb923c', '#facc15', '#4ade80', '#38bdf8', '#a78bfa'],
  ['#38bdf8', '#22d3ee', '#2dd4bf', '#4ade80', '#a3e635', '#e0f2fe'],
  ['#facc15', '#fde047', '#fb923c', '#f97316', '#fbbf24', '#fef3c7'],
  ['#a78bfa', '#c084fc', '#e879f9', '#f472b6', '#d8b4fe', '#f5f3ff'],
]

/** A wingmate: another seat's butterfly. */
export type Mate = {
  seat: number
  x: number
  y: number
  vx: number
  vy: number
  angle: number
  /** Where the butterfly would be before the sky wrapped it: the ribbon is laid here. */
  unwrapped: Point
  alive: boolean
  respawn: number
  invuln: number
  fireCooldown: number
  flap: number
  thrusting: boolean
  lastLaid: number
  ribbon: Ribbon
}

/** The wingmates for a watch of this many seats (seat 0 is the cabinet's own butterfly). */
export function newMates(seats: number): Mate[] {
  const out: Mate[] = []
  const n = Math.max(1, Math.min(4, Math.round(seats)))
  for (let seat = 1; seat < n; seat++) {
    const x = W / 2 + (seat % 2 ? 1 : -1) * 36 * Math.ceil(seat / 2)
    out.push({
      seat,
      x,
      y: SKY / 2,
      vx: 0,
      vy: 0,
      angle: 0,
      unwrapped: { x, y: SKY / 2 },
      alive: true,
      respawn: 0,
      invuln: 0,
      fireCooldown: 0,
      flap: 0,
      thrusting: false,
      lastLaid: -99,
      ribbon: new Ribbon(),
    })
  }
  return out
}

/** The flight constants a wingmate shares with the first butterfly. */
export type Flight = {
  turn: number
  thrust: number
  grip: number
  friction: number
  maxSpeed: number
  ribbonSpeed: number
}

/** The seat's controls, as far as flying goes. */
export type Stick = { left: boolean; right: boolean; up: boolean }

/** One tick of flying: turn, flutter, drift. Returns true when a ribbon point should be laid. */
export function flyMate(
  m: Mate,
  stick: Stick,
  f: Flight,
  push: number,
  tick: number,
): boolean {
  if (stick.left) m.angle -= f.turn
  if (stick.right) m.angle += f.turn
  m.thrusting = stick.up
  if (m.thrusting) {
    const speed0 = Math.hypot(m.vx, m.vy)
    m.vx += (Math.sin(m.angle) * speed0 - m.vx) * f.grip
    m.vy += (-Math.cos(m.angle) * speed0 - m.vy) * f.grip
    m.vx += Math.sin(m.angle) * f.thrust
    m.vy -= Math.cos(m.angle) * f.thrust
    limitSpeed(m, f.maxSpeed)
  }
  m.vx += push
  m.vx *= f.friction
  m.vy *= f.friction
  m.x += m.vx
  m.y += m.vy
  m.unwrapped.x += m.vx
  m.unwrapped.y += m.vy
  wrap(m)
  m.flap += m.thrusting ? 0.45 : 0.15
  m.ribbon.age(tick)
  if (!m.ribbon.points.length) {
    m.unwrapped.x = m.x
    m.unwrapped.y = m.y
  }
  const streaming = Math.hypot(m.vx, m.vy) >= f.ribbonSpeed
  return (m.thrusting || streaming) && tick % RIBBON_STEP === 0
}

/** Lay the wingmate's next ribbon point; a closed solo loop is returned. */
export function layMate(m: Mate, tick: number): Loop | null {
  const joined = tick - m.lastLaid <= RIBBON_STEP + 1
  const loop = m.ribbon.lay(m.unwrapped.x, m.unwrapped.y, tick, joined)
  m.lastLaid = tick
  return loop
}

/** A butterfly's ribbon, and the shift (sky position minus unwrapped) that maps it to the sky. */
export type Trail = { ribbon: Ribbon; shift: Point }

/** Index where the ribbon's unbroken run (back from its head) begins. */
function runStart(r: Ribbon): number {
  let i = r.points.length - 1
  while (i > 0 && !r.points[i]!.gap) i--
  return i
}

/**
 * Do two butterflies' ribbons cross? If so, the team lasso: a loop in `a`'s unwrapped frame that
 * runs from the crossing along `b`'s ribbon to its head, over to `a`'s head and back along `a`'s
 * ribbon to the crossing. `b`'s ribbon is first moved to the copy of the sky nearest `a`.
 */
export function teamLoop(a: Trail, b: Trail): Loop | null {
  const pa = a.ribbon.points
  const pb = b.ribbon.points
  if (pa.length < 2 || pb.length < 2) return null
  const headA = pa.at(-1)!
  const headB = pb.at(-1)!
  const skyA = { x: headA.x + a.shift.x, y: headA.y + a.shift.y }
  const skyB = { x: headB.x + b.shift.x, y: headB.y + b.shift.y }
  const tx = b.shift.x - a.shift.x + Math.round((skyA.x - skyB.x) / W) * W
  const ty = b.shift.y - a.shift.y + Math.round((skyA.y - skyB.y) / SKY) * SKY
  const moved = pb.map((p) => ({ x: p.x + tx, y: p.y + ty }))
  const sa = runStart(a.ribbon)
  const sb = runStart(b.ribbon)
  for (let i = pa.length - 2; i >= sa; i--) {
    for (let j = moved.length - 2; j >= sb; j--) {
      const at = crossing(pa[i]!, pa[i + 1]!, moved[j]!, moved[j + 1]!)
      if (!at) continue
      const ring: Point[] = [at]
      for (let k = j + 1; k < moved.length; k++) ring.push(moved[k]!)
      for (let k = pa.length - 1; k > i; k--) ring.push(pa[k]!)
      const loop = makeLoop(ring)
      return loop.area < MIN_LOOP_AREA ? null : loop
    }
  }
  return null
}
