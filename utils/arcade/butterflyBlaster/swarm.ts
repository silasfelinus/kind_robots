// /utils/arcade/butterflyBlaster/swarm.ts
//
// The living swarm (conductor kr-arcade/t-055, CABINETS.md section 6): mosquito swarms in three
// sizes that fly as a flock (boids: keep apart, fly together, hold together) and hum toward light.
// A swarm wanders until it gets hungry, then heads for the nearest lit hut (or a lantern, or the
// butterfly's own glow when it flies close). A sparkle splits it in two; the halves scatter, then
// regroup, and two halves that meet merge back into the bigger swarm.

import { GROUND, clamp, limitSpeed, toward, wrap } from './sky'
import type { Body, Point } from './sky'

export type Size = 1 | 2 | 3

/** Drawn at double density: a single mosquito is about 24 px across. */
export const SWARM_RADIUS: Record<Size, number> = { 3: 30, 2: 18, 1: 11 }
export const SWARM_POINTS: Record<Size, number> = { 3: 20, 2: 50, 1: 100 }
export const SWARM_SPEED: Record<Size, number> = { 3: 0.62, 2: 0.95, 1: 1.35 }
/** Mosquitoes drawn humming in a swarm of each size. */
export const SWARM_GNATS: Record<Size, number> = { 3: 9, 2: 5, 1: 1 }
/** Mosquitoes in a swarm's whole split tree (1 + 2 + 4 for a big one): what the lasso nets. */
export const SWARM_TREE: Record<Size, number> = { 3: 7, 2: 3, 1: 1 }

/** Ticks split halves fly apart before they steer again. */
export const SCATTER_TICKS = 45
/** Ticks after a split before the halves start looking for each other. */
export const REGROUP_TICKS = 360
/** Ticks a swarm that has bitten a hut is shooed off before it comes back. */
export const SHOO_TICKS = 240
/** The butterfly's glow draws swarms (not lone mosquitoes) flying this close. */
export const GLOW_REACH = 90
/** The last mosquito of a night sprints this much faster. */
export const SPRINT = 1.9

export type SwarmKind = 'plain'

export type SwarmMode = 'wander' | 'seek' | 'shoo' | 'scatter'

export type Swarm = Body & {
  kind: SwarmKind
  size: Size
  /** Cosmetic: where its gnats are in their orbits. */
  seed: number
  /** Where it wanders when nothing pulls it. */
  heading: number
  mode: SwarmMode
  /** Ticks left of a shoo or a scatter. */
  modeTicks: number
  /** Ticks until it gets hungry and goes looking for a light. */
  hunger: number
  /** Ticks until it may merge back with another half (0: ready). */
  regroup: number
  /** The last mosquito of the night: faster, and it shies from the butterfly. */
  sprint: boolean
}

/** Something a swarm is drawn to. */
export type Light = Point & {
  /** How hard it pulls a hungry swarm. */
  pull: number
  /** A hut window, a lantern or a bulb sits on the ground: swarms come at it from above. */
  grounded: boolean
  /** Which hut (or other light) it is, so a bite lands on it. */
  id: number
}

export type FlockWorld = {
  swarms: readonly Swarm[]
  lights: readonly Light[]
  /** The butterfly, when it is in the sky. */
  glow: Point | null
  /** Swarm speed for this night (1 = the base speed). */
  speed: number
  rng: () => number
}

export function newSwarm(
  x: number,
  y: number,
  size: Size,
  rng: () => number,
  hunger: number,
): Swarm {
  const heading = rng() * Math.PI * 2
  const speed = SWARM_SPEED[size] * (0.6 + rng() * 0.4)
  return {
    kind: 'plain',
    x,
    y,
    vx: Math.cos(heading) * speed,
    vy: Math.sin(heading) * speed,
    size,
    seed: rng() * 1000,
    heading,
    mode: 'wander',
    modeTicks: 0,
    hunger,
    regroup: 0,
    sprint: false,
  }
}

/** The vector toward a light: wrapped sideways; grounded lights are come at straight down. */
export function towardLight(from: Point, light: Light): Point {
  const d = toward(from, light)
  if (light.grounded) d.y = light.y - from.y
  return d
}

/** The light a hungry swarm heads for: the strongest pull for the distance. */
export function pickLight(s: Point, lights: readonly Light[]): Light | null {
  let best: Light | null = null
  let score = -Infinity
  for (const light of lights) {
    const d = towardLight(s, light)
    const v = light.pull * 200 - Math.hypot(d.x, d.y)
    if (v > score) {
      score = v
      best = light
    }
  }
  return best
}

function unit(x: number, y: number, weight: number): Point {
  const m = Math.hypot(x, y)
  return m < 1e-6
    ? { x: 0, y: 0 }
    : { x: (x / m) * weight, y: (y / m) * weight }
}

/** One tick of a swarm's flight: steer by the flock and the lights, then move. */
export function flySwarm(s: Swarm, world: FlockWorld) {
  const { rng } = world
  if (s.regroup > 0) s.regroup--
  if (s.mode === 'scatter') {
    if (--s.modeTicks <= 0) s.mode = 'wander'
  } else if (s.mode === 'shoo') {
    if (--s.modeTicks <= 0) s.mode = 'wander'
  } else if (s.mode === 'wander' && --s.hunger <= 0) {
    s.mode = 'seek'
  }
  if (s.mode !== 'seek' && s.mode !== 'shoo' && s.hunger <= 0) s.mode = 'seek'

  let dx = 0
  let dy = 0
  if (s.mode !== 'scatter') {
    // Wander: a slowly turning heading.
    s.heading += (rng() - 0.5) * 0.35
    dx += Math.cos(s.heading) * 0.8
    dy += Math.sin(s.heading) * 0.8

    // The flock: keep apart, fly together, hold together; halves look for each other.
    let cx = 0
    let cy = 0
    let ax = 0
    let ay = 0
    let n = 0
    const r = SWARM_RADIUS[s.size]
    for (const o of world.swarms) {
      if (o === s) continue
      const d = toward(s, o)
      const dist = Math.hypot(d.x, d.y)
      const ro = SWARM_RADIUS[o.size]
      const mates =
        s.regroup === 0 && o.regroup === 0 && o.size === s.size && s.size < 3
      if (mates && dist < 150) {
        const p = unit(d.x, d.y, 1.6)
        dx += p.x
        dy += p.y
        continue
      }
      if (dist < r + ro + 8) {
        const p = unit(-d.x, -d.y, 1.4)
        dx += p.x
        dy += p.y
      }
      if (dist < 110) {
        cx += d.x
        cy += d.y
        ax += o.vx
        ay += o.vy
        n++
      }
    }
    if (n) {
      const c = unit(cx / n, cy / n, 0.25)
      const a = unit(ax / n, ay / n, 0.3)
      dx += c.x + a.x
      dy += c.y + a.y
    }

    if (s.mode === 'seek') {
      const light = pickLight(s, world.lights)
      if (light) {
        const d = towardLight(s, light)
        const p = unit(d.x, d.y, 2.4 * light.pull)
        dx += p.x
        dy += p.y
      }
    } else if (s.mode === 'shoo') {
      dy -= 2.2
    }
    if (world.glow && s.mode !== 'shoo') {
      const d = toward(s, world.glow)
      const dist = Math.hypot(d.x, d.y)
      if (s.sprint && dist < 120) {
        const p = unit(-d.x, -d.y, 3)
        dx += p.x
        dy += p.y
      } else if (dist < GLOW_REACH && s.size > 1) {
        const p = unit(d.x, d.y, 0.35)
        dx += p.x
        dy += p.y
      }
    }
    // Hutless sky low down is nobody's: a swarm that is not biting rises off the ground.
    if (s.mode !== 'seek' && s.y > GROUND - 40) dy -= 1
  }

  const max = SWARM_SPEED[s.size] * world.speed * (s.sprint ? SPRINT : 1)
  const accel = 0.03 + 0.012 * (3 - s.size)
  const push = unit(dx, dy, accel * (s.sprint ? 2 : 1))
  s.vx += push.x
  s.vy += push.y
  limitSpeed(s, max)
  // Insects never hover still: a stalled swarm picks up speed along its heading.
  const speed = Math.hypot(s.vx, s.vy)
  if (speed < max * 0.35) {
    s.vx += Math.cos(s.heading) * 0.02
    s.vy += Math.sin(s.heading) * 0.02
  }
  s.x += s.vx
  s.y += s.vy
  wrap(s)
}

/** Split a swarm in two smaller halves that fly apart (null for a single mosquito). */
export function splitSwarm(
  s: Swarm,
  rng: () => number,
  hunger: number,
): [Swarm, Swarm] | null {
  if (s.size === 1) return null
  const size = (s.size - 1) as Size
  const a = rng() * Math.PI * 2
  const speed = SWARM_SPEED[size] * 1.2
  const halves = [0, Math.PI].map((turn) => {
    const half = newSwarm(s.x, s.y, size, rng, hunger)
    half.vx = Math.cos(a + turn) * speed + s.vx * 0.3
    half.vy = Math.sin(a + turn) * speed + s.vy * 0.3
    half.heading = a + turn
    half.mode = 'scatter'
    half.modeTicks = SCATTER_TICKS
    half.regroup = REGROUP_TICKS
    half.hunger = clamp(Math.min(s.hunger, hunger), 0, hunger)
    half.kind = s.kind
    return half
  })
  return [halves[0]!, halves[1]!]
}

/**
 * Halves left alone long enough merge back: two regrouping swarms of one size that touch become
 * one of the next size. Returns the swarms after merging (and how many merges happened).
 */
export function regroupSwarms(swarms: Swarm[]): {
  swarms: Swarm[]
  merged: Swarm[]
} {
  const merged: Swarm[] = []
  const gone = new Set<Swarm>()
  for (let i = 0; i < swarms.length; i++) {
    const a = swarms[i]!
    if (gone.has(a) || a.regroup > 0 || a.size === 3 || a.sprint) continue
    for (let j = i + 1; j < swarms.length; j++) {
      const b = swarms[j]!
      if (
        gone.has(b) ||
        b.regroup > 0 ||
        b.size !== a.size ||
        b.kind !== a.kind
      )
        continue
      const d = toward(a, b)
      if (Math.hypot(d.x, d.y) > SWARM_RADIUS[a.size] * 1.3) continue
      const size = (a.size + 1) as Size
      const whole: Swarm = {
        ...a,
        x: a.x + d.x / 2,
        y: a.y + d.y / 2,
        vx: (a.vx + b.vx) / 2,
        vy: (a.vy + b.vy) / 2,
        size,
        mode: a.mode === 'seek' || b.mode === 'seek' ? 'seek' : 'wander',
        modeTicks: 0,
        hunger: Math.min(a.hunger, b.hunger),
        regroup: size < 3 ? REGROUP_TICKS : 0,
      }
      wrap(whole)
      gone.add(a)
      gone.add(b)
      merged.push(whole)
      break
    }
  }
  if (!merged.length) return { swarms, merged }
  return { swarms: [...swarms.filter((s) => !gone.has(s)), ...merged], merged }
}
