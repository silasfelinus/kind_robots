// /utils/arcade/seedLander/tether.ts
//
// The tether winch (conductor kr-arcade/t-069): hold DOWN over cargo to lower the line and hook
// it; the cargo then swings under the pod as a pendulum on an inextensible line, and the pod feels
// its weight. Cargo lands gently or bumps; a bumped crate drops a seedling. Tap DOWN again to let
// go. Pure rules over a Cargo and a Pod, so tests can pin each one.

import type { Pod } from './flight'
import { FLIGHT, POD_FEET } from './flight'

/** What can hang on the line (later islands add water bubbles and sprout-bots). */
export type CargoKind = 'crate' | 'water' | 'sprout' | 'lander'

export type Cargo = {
  id: string
  kind: CargoKind
  x: number
  y: number
  vx: number
  vy: number
  /** Half its size (a square crate). */
  r: number
  /** How heavy against the pod (1 = as heavy). */
  mass: number
  /** The seat of the pod towing it, or -1. */
  hookedBy: number
  /** Seedlings left in a crate: a bump spills one. */
  seedlings: number
  /** Resting on the ground. */
  resting: boolean
  /** Set down in its drop zone. */
  delivered: boolean
  /** Ticks since the last bump (bumps are counted once per touchdown). */
  bumpCool: number
}

export const WINCH = {
  /** Line length (the Pod Shed's longer winch line adds to it). */
  line: 30,
  /** How close under the pod cargo must be to hook. */
  reach: 12,
  /** Faster than this into the ground and cargo bumps. */
  bump: 0.95,
  /** Cargo on the ground slides to a stop. */
  friction: 0.82,
  /** How springy the line is when it snaps taut (0 dead stop, 1 full rebound). */
  give: 0.15,
} as const

export const CARGO_MASS: Record<CargoKind, number> = {
  crate: 0.4,
  water: 0.5,
  sprout: 0.35,
  lander: 1.2,
}

export function newCargo(
  id: string,
  kind: CargoKind,
  x: number,
  y: number,
  seedlings = 3,
): Cargo {
  return {
    id,
    kind,
    x,
    y,
    vx: 0,
    vy: 0,
    r: kind === 'lander' ? 7 : 5,
    mass: CARGO_MASS[kind],
    hookedBy: -1,
    seedlings,
    resting: true,
    delivered: false,
    bumpCool: 0,
  }
}

/** The point the line hangs from: the pod's belly. */
export function winchPoint(pod: Pod): { x: number; y: number } {
  return {
    x: pod.x - Math.sin(pod.tilt) * POD_FEET,
    y: pod.y + Math.cos(pod.tilt) * POD_FEET,
  }
}

/** Can this pod hook this cargo now: free, close and under the pod, within the line's reach? */
export function canHook(pod: Pod, cargo: Cargo, line: number): boolean {
  if (cargo.hookedBy >= 0 || cargo.delivered) return false
  const w = winchPoint(pod)
  const dx = cargo.x - w.x
  const dy = cargo.y - cargo.r - w.y
  return Math.abs(dx) <= WINCH.reach && dy >= -4 && dy <= line + 6
}

/**
 * One tick of a towed cargo: gravity, then the line pulls taut. The line only pulls (it is a rope):
 * when the cargo strains past the line's length the two share the jerk by mass, so a heavy load
 * drags the pod down and swings it about.
 */
export function swingCargo(
  pod: Pod,
  cargo: Cargo,
  line: number,
  gravity: number,
  wind: number,
) {
  cargo.vy = Math.min(FLIGHT.maxSpeed, cargo.vy + FLIGHT.gravity * gravity)
  cargo.vx += wind * 0.6
  cargo.vx *= 0.995
  cargo.x += cargo.vx
  cargo.y += cargo.vy
  cargo.resting = false
  const w = winchPoint(pod)
  const dx = cargo.x - w.x
  const dy = cargo.y - w.y
  const d = Math.hypot(dx, dy)
  if (d <= line || d === 0) return
  const nx = dx / d
  const ny = dy / d
  // Separating speed along the line: cancel it, shared by mass (the pod counts as 1).
  const rel = (cargo.vx - pod.vx) * nx + (cargo.vy - pod.vy) * ny
  if (rel > 0) {
    const j = (rel * (1 + WINCH.give)) / (1 + 1 / cargo.mass)
    cargo.vx -= (nx * j) / cargo.mass
    cargo.vy -= (ny * j) / cargo.mass
    pod.vx += nx * j
    pod.vy += ny * j
  }
  // Back onto the line's length: mostly the cargo moves, a little the pod.
  const over = d - line
  const share = cargo.mass / (1 + cargo.mass)
  cargo.x -= nx * over * (1 - share * 0.5)
  cargo.y -= ny * over * (1 - share * 0.5)
  pod.x += nx * over * share * 0.5
  pod.y += ny * over * share * 0.5
}

/** Free cargo (dropped, or not yet hooked) falls and settles. */
export function dropCargo(cargo: Cargo, gravity: number) {
  if (cargo.resting) return
  cargo.vy = Math.min(FLIGHT.maxSpeed, cargo.vy + FLIGHT.gravity * gravity)
  cargo.x += cargo.vx
  cargo.y += cargo.vy
}

/**
 * Cargo against the floor at its feet: it stops, slides and settles. Returns 'bump' when it hit
 * too hard (a crate spills a seedling), 'land' when it touched down gently, or null in the air.
 */
export function groundCargo(
  cargo: Cargo,
  floor: number,
): 'bump' | 'land' | null {
  if (cargo.bumpCool > 0) cargo.bumpCool--
  if (cargo.y + cargo.r < floor) return null
  const hard = cargo.vy > WINCH.bump || Math.abs(cargo.vx) > WINCH.bump * 1.4
  cargo.y = floor - cargo.r
  cargo.vy = hard ? -Math.min(1.2, cargo.vy * 0.35) : 0
  cargo.vx *= WINCH.friction
  if (Math.abs(cargo.vx) < 0.02) cargo.vx = 0
  if (!hard && cargo.hookedBy < 0 && cargo.vx === 0) cargo.resting = true
  if (hard && cargo.bumpCool <= 0) {
    cargo.bumpCool = 30
    if (cargo.kind === 'crate' && cargo.seedlings > 0) cargo.seedlings--
    return 'bump'
  }
  return hard ? null : 'land'
}
