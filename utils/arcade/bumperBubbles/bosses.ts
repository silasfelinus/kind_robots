// /utils/arcade/bumperBubbles/bosses.ts
//
// Fizzwick Tower's bosses (conductor kr-arcade m8, spec: CABINETS.md section 7, "The bosses").
// Slice 2 (t-060) brings the first: THE BIG CORK on floor 25, a giant cork bot no bubble can
// hold. It spits little corks; trap them, and a cork bubble popped against the Big Cork (or one
// that floats into it) knocks a chunk off it, the classic's way of hurting a boss. Three hits a
// phase:
//
//   1. It bounces diagonally round the room, spitting corks.
//   2. It wedges itself in the ceiling above a robot, creaks (the tell) and slams down onto that
//      platform, then hauls itself back up.
//   3. It fizzes round the top of the room at double speed: Float bubbles are the way up.

import { FLOOR_Y, TOP, TILE, WALL_L, WALL_R, groundBelow } from './tower'
import type { BossId, Floor, Spot } from './tower'

export type BossState =
  'enter' | 'bounce' | 'climb' | 'creak' | 'slam' | 'fizz' | 'popping' | 'done'

export type Boss = {
  id: BossId
  name: string
  x: number
  y: number
  vx: number
  vy: number
  r: number
  hp: number
  phase: 1 | 2 | 3
  state: BossState
  /** Ticks in this state. */
  t: number
  /** Flashing after a hit (it can't be hurt again until this runs out). */
  hurt: number
  /** Ticks until the next little cork. */
  spit: number
  /** Where a slam is headed. */
  target: number
}

export const BOSS_NAMES: Record<BossId, string> = { cork: 'THE BIG CORK' }

export const CORK = {
  r: 15,
  hpPerPhase: 3,
  speed: 1.0,
  fizzSpeed: 2.0,
  spitEvery: [200, 260, 220] as const,
  maxMinions: 3,
  creakTicks: 45,
  /** Points for the knockout. */
  prize: 30_000,
} as const

export function makeBoss(id: BossId): Boss {
  return {
    id,
    name: BOSS_NAMES[id],
    x: (WALL_L + WALL_R) / 2,
    y: TOP - 20,
    vx: CORK.speed,
    vy: CORK.speed,
    r: CORK.r,
    hp: CORK.hpPerPhase,
    phase: 1,
    state: 'enter',
    t: 0,
    hurt: 0,
    spit: 120,
    target: 0,
  }
}

/** What a boss can see and do. */
export interface BossHost {
  floor: Floor
  rng: () => number
  robots: readonly Spot[]
  /** Little corks on the floor now. */
  minions: number
  /** Spit a little cork out at `at`, flung `dir`-ward. */
  spawnMinion(at: Spot, dir: -1 | 1): void
  /** Something worth a sound or a shake. */
  cue(what: 'creak' | 'slam' | 'phase' | 'spit'): void
}

/** Is (x, y) within `pad` of the boss's body? */
export function bossTouches(b: Boss, x: number, y: number, pad = 0): boolean {
  return (
    b.state !== 'done' &&
    b.state !== 'popping' &&
    Math.hypot(x - b.x, y - b.y) < b.r + pad
  )
}

/** A hit: true if it landed (a boss flashing from the last hit shrugs this one off). */
export function hurtBoss(b: Boss, host: BossHost): boolean {
  if (
    b.hurt > 0 ||
    b.state === 'enter' ||
    b.state === 'popping' ||
    b.state === 'done'
  )
    return false
  b.hurt = 50
  b.hp--
  if (b.hp > 0) return true
  if (b.phase === 3) {
    b.state = 'popping'
    b.t = 0
    return true
  }
  b.phase = (b.phase + 1) as 2 | 3
  b.hp = CORK.hpPerPhase
  b.state = b.phase === 2 ? 'climb' : 'fizz'
  b.t = 0
  b.vx = Math.sign(b.vx || 1) * CORK.fizzSpeed
  b.vy = -CORK.fizzSpeed
  host.cue('phase')
  return true
}

function nearestX(b: Boss, robots: readonly Spot[]): number {
  let best = (WALL_L + WALL_R) / 2
  let d = Infinity
  for (const r of robots) {
    if (Math.abs(r.x - b.x) < d) {
      d = Math.abs(r.x - b.x)
      best = r.x
    }
  }
  return best
}

/** Bounce round a box, off its walls. */
function bounce(b: Boss, top: number, bottom: number) {
  b.x += b.vx
  b.y += b.vy
  if (b.x < WALL_L + b.r) {
    b.x = WALL_L + b.r
    b.vx = Math.abs(b.vx)
  } else if (b.x > WALL_R - b.r) {
    b.x = WALL_R - b.r
    b.vx = -Math.abs(b.vx)
  }
  if (b.y < top + b.r) {
    b.y = top + b.r
    b.vy = Math.abs(b.vy)
  } else if (b.y > bottom - b.r) {
    b.y = bottom - b.r
    b.vy = -Math.abs(b.vy)
  }
}

/** One tick of the Big Cork. */
export function updateBoss(b: Boss, host: BossHost) {
  b.t++
  if (b.hurt > 0) b.hurt--
  const ceiling = TOP + TILE
  if (b.state === 'done') return
  if (b.state === 'popping') {
    if (b.t > 90) b.state = 'done'
    return
  }
  if (b.state === 'enter') {
    // It drops in through the ceiling.
    b.y += 1.2
    if (b.y > ceiling + b.r + 30) {
      b.state = 'bounce'
      b.t = 0
    }
    return
  }
  // Little corks, while there's room for them.
  if (--b.spit <= 0) {
    b.spit = CORK.spitEvery[b.phase - 1]!
    if (host.minions < CORK.maxMinions && b.state !== 'slam') {
      const dir = b.vx < 0 ? -1 : 1
      host.spawnMinion({ x: b.x, y: b.y + b.r - 2 }, dir)
      host.cue('spit')
    }
  }
  if (b.state === 'bounce') {
    bounce(b, ceiling, FLOOR_Y)
    return
  }
  if (b.state === 'fizz') {
    // Double speed, round the top half of the room.
    bounce(b, ceiling, TOP + 120)
    return
  }
  if (b.state === 'climb') {
    // Up to the ceiling, over a robot.
    const tx = nearestX(b, host.robots)
    b.x += Math.max(-1.5, Math.min(1.5, tx - b.x))
    b.y = Math.max(ceiling + b.r, b.y - 1.5)
    if (b.y <= ceiling + b.r && Math.abs(tx - b.x) < 2) {
      b.state = 'creak'
      b.t = 0
      host.cue('creak')
    }
    return
  }
  if (b.state === 'creak') {
    if (b.t >= CORK.creakTicks) {
      b.state = 'slam'
      b.t = 0
      b.vy = 0
      b.target = groundBelow(host.floor, b.x, b.y + b.r + 40, b.r - 4)
    }
    return
  }
  // Slam: down onto the platform below, then back up for another.
  b.vy = Math.min(5, b.vy + 0.35)
  b.y += b.vy
  if (b.y + b.r >= b.target) {
    b.y = b.target - b.r
    host.cue('slam')
    b.state = 'climb'
    b.t = 0
  }
}
