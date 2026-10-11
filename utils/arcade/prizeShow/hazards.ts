// /utils/arcade/prizeShow/hazards.ts
//
// The later sets' floor hazards (conductor kr-arcade t-029, depth-pass/ASSESSMENT.md section 2, "The
// episodes"). Rooms place them as props (season.ts); the game keeps their state and asks these pure
// helpers what each is doing this tick, so the rules live in one place for the game, its art, its
// attract pilot and the tests.
//
//   Cooking Showdown: hot plates glow (the tell), then sizzle whoever stands on them; conveyor
//     counters carry everyone along; flour clouds hide whoever is inside, thinning as confetti flies
//     through them and thickening again when left alone.
//   Countdown Concert: the room keeps a beat. Speaker stacks thump out a bass ring on their beats,
//     each with a gap to slip through; mosh pits swirl anyone inside, hardest on the beat.
//     Bosses' landings and slams make the same rings (without a gap).

import type { BeltProp, HotPlateProp, Side, SpeakerProp } from './season'
import { CX, CY } from './stage'
import type { Point } from './stage'

// --- the beat --------------------------------------------------------------------------------------

/** How far through the current beat (0 on the beat, toward 1 just before the next). */
export function beatPhase(tick: number, beat: number): number {
  return beat > 0 ? (tick % beat) / beat : 0
}

// --- hot plates ------------------------------------------------------------------------------------

export const HOTPLATE = {
  /** The glow before it sizzles. */
  glow: 50,
  sizzle: 70,
} as const

export type PlateState = { state: 'cold' | 'glow' | 'hot'; k: number }

/** What a hot plate is doing at a room tick, and how far into it (0..1). */
export function plateState(p: HotPlateProp, tick: number): PlateState {
  const at = (tick + p.offset) % p.every
  const hotFrom = p.every - HOTPLATE.sizzle
  const glowFrom = hotFrom - HOTPLATE.glow
  if (at >= hotFrom)
    return { state: 'hot', k: (at - hotFrom) / HOTPLATE.sizzle }
  if (at >= glowFrom)
    return { state: 'glow', k: (at - glowFrom) / HOTPLATE.glow }
  return { state: 'cold', k: at / Math.max(1, glowFrom) }
}

export function onPlate(p: HotPlateProp, x: number, y: number): boolean {
  return x >= p.x && x < p.x + p.w && y >= p.y && y < p.y + p.h
}

// --- conveyor counters -----------------------------------------------------------------------------

export const BELT_SPEED = 0.6

const BELT_DIR: Record<Side, Point> = {
  0: { x: 0, y: -1 },
  1: { x: 1, y: 0 },
  2: { x: 0, y: 1 },
  3: { x: -1, y: 0 },
}

export function onBelt(b: BeltProp, x: number, y: number): boolean {
  return x >= b.x && x < b.x + b.w && y >= b.y && y < b.y + b.h
}

/** How far the counters carry something at (x, y) this tick. */
export function beltPush(
  belts: readonly BeltProp[],
  x: number,
  y: number,
): Point {
  for (const b of belts) {
    if (!onBelt(b, x, y)) continue
    const d = BELT_DIR[b.dir]
    return { x: d.x * BELT_SPEED, y: d.y * BELT_SPEED }
  }
  return { x: 0, y: 0 }
}

export function beltDir(b: BeltProp): Point {
  return BELT_DIR[b.dir]
}

// --- flour clouds ----------------------------------------------------------------------------------

export type Flour = {
  /** Where it hangs, and where it has drifted to this tick. */
  x0: number
  y0: number
  x: number
  y: number
  r: number
  drift: number
  /** 1 is a thick cloud; confetti thins it, and it thickens again on its own. */
  density: number
}

export const FLOUR = {
  /** Lost for each tick a confetti shot spends inside. */
  thin: 0.012,
  regrow: 0.002,
  /** How far it drifts from where it hangs. */
  wander: 22,
} as const

export function newFlour(
  x: number,
  y: number,
  r: number,
  drift: number,
): Flour {
  return { x0: x, y0: y, x, y, r, drift, density: 1 }
}

export function driftFlour(f: Flour, tick: number) {
  const t = tick / 90
  f.x = f.x0 + Math.sin(t * f.drift) * FLOUR.wander
  f.y = f.y0 + Math.sin(t * 0.7 + f.drift) * FLOUR.wander * 0.5
  f.density = Math.min(1, f.density + FLOUR.regrow)
}

export function inFlour(f: Flour, x: number, y: number): boolean {
  return Math.hypot(x - f.x, y - f.y) < f.r
}

// --- bass rings ------------------------------------------------------------------------------------

export type Ring = {
  x: number
  y: number
  r: number
  max: number
  speed: number
  /** The gap's direction (radians), or null for a full ring. */
  gap: number | null
}

export const RING = {
  /** How thick the ring's edge is (either side of its radius). */
  band: 4,
  /** Half the gap's width, in radians. */
  gapHalf: 0.5,
  /** A ring only hurts until it has spread this share of the way (then it is a fading ripple). */
  live: 0.8,
  /** A speaker's ring. */
  speakerMax: 96,
  speakerSpeed: 1.3,
  /** Ticks a speaker pumps before it thumps. */
  speakerTell: 20,
} as const

export function newRing(
  x: number,
  y: number,
  max: number,
  speed: number,
  gap: number | null,
): Ring {
  return { x, y, r: 6, max, speed, gap }
}

/** Is (x, y) in the gap of a ring? */
export function inGap(ring: Ring, x: number, y: number): boolean {
  if (ring.gap === null) return false
  const a = Math.atan2(y - ring.y, x - ring.x)
  let d = Math.abs(a - ring.gap) % (Math.PI * 2)
  if (d > Math.PI) d = Math.PI * 2 - d
  return d < RING.gapHalf
}

/** Is the ring still strong enough to hurt? */
export function ringLive(ring: Ring): boolean {
  return ring.r < ring.max * RING.live
}

/** Does the ring's edge catch (x, y)? */
export function ringHits(ring: Ring, x: number, y: number): boolean {
  if (!ringLive(ring)) return false
  const d = Math.hypot(x - ring.x, y - ring.y)
  return Math.abs(d - ring.r) < RING.band && !inGap(ring, x, y)
}

// --- speaker stacks --------------------------------------------------------------------------------

/** Beats into the room this speaker last thumped (or will next), counting its own shots. */
export function speakerShot(
  s: SpeakerProp,
  tick: number,
  beat: number,
): number {
  const every = s.beats * beat
  return Math.floor((tick + s.offset * beat) / every)
}

/** Does the speaker thump on this tick? */
export function speakerFires(
  s: SpeakerProp,
  tick: number,
  beat: number,
): boolean {
  return tick > 0 && (tick + s.offset * beat) % (s.beats * beat) === 0
}

/** Ticks until its next thump (it pumps for RING.speakerTell ticks first). */
export function speakerUntil(
  s: SpeakerProp,
  tick: number,
  beat: number,
): number {
  const every = s.beats * beat
  return every - ((tick + s.offset * beat) % every)
}

/** Where shot `n` of a speaker leaves its gap: toward the middle, then either side of it. */
export function speakerGap(s: SpeakerProp, n: number): number {
  const toMiddle = Math.atan2(CY - s.y, CX - s.x)
  return toMiddle + [0, 0.8, -0.8][((n % 3) + 3) % 3]!
}

// --- mosh pits -------------------------------------------------------------------------------------

export type Pit = { x: number; y: number; r: number; spin: 1 | -1 }

export const MOSH = {
  /** The swirl inside a pit: this much between beats, up to `beatBoost` more on the beat. */
  swirl: 0.45,
  beatBoost: 0.85,
  /** A little shove out toward the edge. */
  out: 0.15,
} as const

/** How a pit shoves something at (x, y) this tick (crashers get half). */
export function pitShove(
  pits: readonly Pit[],
  x: number,
  y: number,
  tick: number,
  beat: number,
): Point {
  for (const p of pits) {
    const dx = x - p.x
    const dy = y - p.y
    const d = Math.hypot(dx, dy)
    if (d >= p.r || d < 0.001) continue
    const strength =
      MOSH.swirl + MOSH.beatBoost * (1 - beatPhase(tick, beat || 30))
    const ux = dx / d
    const uy = dy / d
    return {
      x: -uy * p.spin * strength + ux * MOSH.out,
      y: ux * p.spin * strength + uy * MOSH.out,
    }
  }
  return { x: 0, y: 0 }
}
