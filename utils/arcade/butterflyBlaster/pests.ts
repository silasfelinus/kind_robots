// /utils/arcade/butterflyBlaster/pests.ts
//
// The first new pests of the Rainy Season (conductor kr-arcade/t-055, CABINETS.md section 6 "The
// roster"), and the standing water they breed in:
//
//   Breeding pool  standing water on the ground line. Now and then it ripples, and a wriggler rises.
//   Wriggler       a larva rising from a pool. Sparkle it near the surface, or it hatches into a
//                  swarm. (Removing standing water, taught by play.)
//   Skimmer        skates along the ground line and flicks a spray of drops up into the sky.
//   Needle         drifts, then stops and glows red for half a second, then dashes straight across
//                  the sky (and the wrap) along the line it locked on.
//
// And from the later Moons (conductor kr-arcade/t-057):
//
//   Bloom cluster  a spinning hexagon of six petals. Break it and it scatters into six hummers.
//   Hummer         small and slow, and it never stops homing on the butterfly.
//   Storm cell     a little dark cloud that drifts over the butterfly's column, crackles, then
//                  drops a line of lightning straight down it.
//   Decoy glow     looks like AMI's falling net, but it blinks twice. Catch it and it bursts into
//                  hummers; sparkle it instead.
//
// Each pest's tell comes before its danger, and each has a plain answer.

import { GROUND, W, toward, wrap } from './sky'
import type { Body, Point } from './sky'

export type PestKind =
  'wriggler' | 'skimmer' | 'needle' | 'bloom' | 'hummer' | 'storm' | 'decoy'
export type PestState =
  'rise' | 'skate' | 'drift' | 'aim' | 'dash' | 'crackle' | 'strike'

export type Pest = Body & {
  kind: PestKind
  state: PestState
  /** Ticks into (or left of) its current state. */
  t: number
  /** A needle's locked line, or a drifter's wander. */
  heading: number
  /** Cosmetic phase. */
  seed: number
  /** Sparkle hits it can still take. */
  hp: number
}

export const PEST_POINTS: Record<PestKind, number> = {
  wriggler: 150,
  skimmer: 200,
  needle: 300,
  bloom: 400,
  hummer: 80,
  storm: 400,
  decoy: 150,
}
export const PEST_RADIUS: Record<PestKind, number> = {
  wriggler: 8,
  skimmer: 11,
  needle: 10,
  bloom: 14,
  hummer: 7,
  storm: 13,
  decoy: 10,
}
/** Sparkle hits each pest takes. */
export const PEST_HP: Record<PestKind, number> = {
  wriggler: 1,
  skimmer: 1,
  needle: 1,
  bloom: 2,
  hummer: 1,
  storm: 2,
  decoy: 1,
}
/** Mosquitoes a pest counts as in a lasso (a bloom is its six hummers). */
export const PEST_TREE: Record<PestKind, number> = {
  wriggler: 1,
  skimmer: 1,
  needle: 1,
  bloom: 6,
  hummer: 1,
  storm: 1,
  decoy: 1,
}

// --- breeding pools -------------------------------------------------------------------------------

export type Pool = {
  x: number
  /** Its water line: the ground, or a paddy up on a terrace. */
  y: number
  /** Half its width. */
  w: number
  /** Ticks until the next ripple. */
  timer: number
  /** Ticks left of the ripple tell (a wriggler rises when it ends). */
  ripple: number
  /** Tipped out or dried: it breeds no more. */
  dry: boolean
  /** Wrigglers it still has in it this wave. */
  broods: number
}

/** Wrigglers a pool can raise in one wave: standing water is a hazard, not a flood. */
export const BROODS = 3

/** The ripple tell before a wriggler rises. */
export const RIPPLE_TICKS = 70
/** A wriggler hatches this long after it rises... */
export const HATCH_TICKS = 170
/** ...rising this fast. */
export const RISE_SPEED = 0.28

export function newPool(
  spot: { x: number; y: number },
  every: number,
  rng: () => number,
): Pool {
  return {
    x: spot.x,
    y: spot.y,
    w: 13,
    timer: Math.round(every * (0.5 + rng() * 0.5)),
    ripple: 0,
    dry: false,
    broods: BROODS,
  }
}

/** One tick of a pool: true when a wriggler rises from it this tick. */
export function tickPool(
  pool: Pool,
  every: number,
  rng: () => number,
): boolean {
  if (pool.dry || pool.broods <= 0) return false
  if (pool.ripple > 0) {
    if (--pool.ripple === 0) {
      pool.broods--
      pool.timer = Math.round(every * (0.8 + rng() * 0.4))
      return true
    }
    return false
  }
  if (--pool.timer <= 0) pool.ripple = RIPPLE_TICKS
  return false
}

// --- the pests ------------------------------------------------------------------------------------

export const NEEDLE = {
  /** Ticks of drifting between dashes (least, spread). */
  drift: [130, 110],
  /** The red glow before a dash. */
  tell: 30,
  dash: 64,
  speed: 6,
  wander: 0.85,
} as const

export const SKIMMER = {
  speed: 1.05,
  /** Skates just above the ground line. */
  y: GROUND - 7,
  sprayEvery: 170,
  /** It crouches this long before it flicks its spray. */
  tell: 32,
  /** Three drops up, fanned this far either side of straight up. */
  fan: 0.42,
  sprayVy: 3.3,
} as const

export const BLOOM = { speed: 0.45, spin: 0.04, petals: 6 } as const
export const HUMMER = { speed: 0.75, turn: 0.05 } as const
export const STORM = {
  speed: 0.7,
  /** The crackle tell, then the strike down the column. */
  tell: 60,
  strike: 24,
  rest: 170,
  /** Half the width of the lightning line. */
  reach: 8,
  y: 52,
} as const
export const DECOY = { fall: 0.8, blink: 90 } as const

export function newPest(
  kind: PestKind,
  x: number,
  y: number,
  rng: () => number,
): Pest {
  const heading = rng() * Math.PI * 2
  const p: Pest = {
    kind,
    x,
    y,
    vx: 0,
    vy: 0,
    state: 'drift',
    t: 0,
    heading,
    seed: rng() * 1000,
    hp: PEST_HP[kind],
  }
  if (kind === 'bloom' || kind === 'hummer') {
    p.vx = Math.cos(heading) * 0.4
    p.vy = Math.sin(heading) * 0.4
    return p
  }
  if (kind === 'storm') {
    p.y = STORM.y + rng() * 30
    p.t = STORM.rest
    return p
  }
  if (kind === 'decoy') {
    p.vy = DECOY.fall
    return p
  }
  if (kind === 'wriggler') {
    p.state = 'rise'
    p.vy = -RISE_SPEED
  } else if (kind === 'skimmer') {
    p.state = 'skate'
    p.y = SKIMMER.y
    p.vx = (rng() < 0.5 ? -1 : 1) * SKIMMER.speed
    p.t = Math.round(SKIMMER.sprayEvery * (0.5 + rng() * 0.5))
  } else {
    p.t = NEEDLE.drift[0] + Math.round(rng() * NEEDLE.drift[1])
    p.vx = Math.cos(heading) * NEEDLE.wander
    p.vy = Math.sin(heading) * NEEDLE.wander
  }
  return p
}

export type PestHost = {
  rng: () => number
  /** The butterfly, when it is in the sky. */
  target: Point | null
  /** A drop flicked into the sky (gravity pulls it back down). */
  spray(x: number, y: number, vx: number, vy: number): void
}

/** What a pest did this tick that the game must answer. */
export type PestEvent = 'hatch' | 'dash' | 'spray' | 'crackle' | 'strike' | null

/** Steer a homer toward a point at a speed. */
function home(p: Pest, at: Point | null, speed: number, turn: number) {
  if (!at) return
  const d = toward(p, at)
  const m = Math.hypot(d.x, d.y) || 1
  p.vx += ((d.x / m) * speed - p.vx) * turn
  p.vy += ((d.y / m) * speed - p.vy) * turn
}

/** One tick of a pest. */
export function movePest(p: Pest, host: PestHost): PestEvent {
  const { rng } = host
  if (p.kind === 'bloom') {
    p.heading += BLOOM.spin
    home(p, host.target, BLOOM.speed, 0.01)
    p.x += p.vx
    p.y += p.vy
    if (p.y > GROUND - 60) p.vy -= 0.05
    wrap(p)
    return null
  }
  if (p.kind === 'hummer') {
    home(p, host.target, HUMMER.speed, HUMMER.turn)
    p.x += p.vx
    p.y += p.vy
    wrap(p)
    return null
  }
  if (p.kind === 'decoy') {
    p.t++
    p.y += p.vy
    p.x += Math.sin((p.t + p.seed) / 30) * 0.4
    return null
  }
  if (p.kind === 'storm') {
    let event: PestEvent = null
    if (p.state === 'drift') {
      // Drift over the butterfly's column, high up.
      const tx = host.target?.x ?? p.x
      const dx = toward(p, { x: tx, y: p.y }).x
      p.vx +=
        (Math.sign(dx) * Math.min(STORM.speed, Math.abs(dx) / 20) - p.vx) * 0.05
      p.x += p.vx
      if (p.x < 0) p.x += W
      else if (p.x >= W) p.x -= W
      if (--p.t <= 0 && Math.abs(dx) < 24) {
        p.state = 'crackle'
        p.t = STORM.tell
        event = 'crackle'
      } else if (p.t <= 0) {
        p.t = 20
      }
    } else if (p.state === 'crackle') {
      if (--p.t <= 0) {
        p.state = 'strike'
        p.t = STORM.strike
        event = 'strike'
      }
    } else if (--p.t <= 0) {
      p.state = 'drift'
      p.t = STORM.rest + Math.round(rng() * 60)
    }
    return event
  }
  if (p.kind === 'wriggler') {
    p.t++
    p.y += p.vy
    return p.t >= HATCH_TICKS ? 'hatch' : null
  }
  if (p.kind === 'skimmer') {
    p.x += p.vx
    if (p.x < 0) p.x += W
    else if (p.x >= W) p.x -= W
    if (--p.t <= 0) {
      p.t = SKIMMER.sprayEvery + Math.round(rng() * 40)
      for (const turn of [-SKIMMER.fan, 0, SKIMMER.fan]) {
        const a = -Math.PI / 2 + turn
        host.spray(
          p.x,
          p.y - 6,
          Math.cos(a) * SKIMMER.sprayVy,
          Math.sin(a) * SKIMMER.sprayVy,
        )
      }
      return 'spray'
    }
    return null
  }
  // The needle.
  let event: PestEvent = null
  if (p.state === 'drift') {
    p.heading += (rng() - 0.5) * 0.25
    p.vx += (Math.cos(p.heading) * NEEDLE.wander - p.vx) * 0.05
    p.vy += (Math.sin(p.heading) * NEEDLE.wander - p.vy) * 0.05
    if (p.y > GROUND - 50) p.vy -= 0.06
    if (--p.t <= 0 && host.target) {
      p.state = 'aim'
      p.t = NEEDLE.tell
      const d = toward(p, host.target)
      p.heading = Math.atan2(d.y, d.x)
    } else if (p.t <= 0) {
      p.t = 30
    }
  } else if (p.state === 'aim') {
    p.vx *= 0.8
    p.vy *= 0.8
    if (--p.t <= 0) {
      p.state = 'dash'
      p.t = NEEDLE.dash
      p.vx = Math.cos(p.heading) * NEEDLE.speed
      p.vy = Math.sin(p.heading) * NEEDLE.speed
      event = 'dash'
    }
  } else if (--p.t <= 0) {
    p.state = 'drift'
    p.t = NEEDLE.drift[0] + Math.round(rng() * NEEDLE.drift[1])
    p.heading = Math.atan2(p.vy, p.vx)
    p.vx *= 0.15
    p.vy *= 0.15
  }
  p.x += p.vx
  p.y += p.vy
  wrap(p)
  return event
}

/** Is this pest dangerous to touch right now? (A rising wriggler is not; it just hatches, and a
 * decoy bursts when caught rather than hurting.) */
export function pestHurts(p: Pest): boolean {
  return p.kind !== 'wriggler' && p.kind !== 'decoy'
}

/** Is a storm cell's lightning line down on this point? */
export function struckBy(p: Pest, at: Point): boolean {
  return (
    p.kind === 'storm' &&
    p.state === 'strike' &&
    Math.abs(toward(p, at).x) < STORM.reach &&
    at.y > p.y
  )
}
