// /utils/arcade/prizeShow/arsenal.ts
//
// Prize Show Panic's power-ups (conductor kr-arcade t-027, depth-pass/ASSESSMENT.md section 2, "The
// arsenal: 3 -> 10"). Each is a short timed boost; picking up one you already have adds to its clock
// (up to `cap`), several run at once, and the HUD shows every live one with its own draining gauge.

import { RAMPS } from '../snes'
import type { Ramp } from '../snes'

export type PowerKind =
  | 'spread'
  | 'rapid'
  | 'shield'
  | 'poppers'
  | 'rockets'
  | 'orbiters'
  | 'skates'
  | 'laser'
  | 'foamgun'
  | 'cutout'

export type Power = {
  name: string
  /** The letter on its orb and its HUD chip. */
  letter: string
  /** Ticks one pickup gives. */
  ticks: number
  /** The most it can bank by stacking pickups. */
  cap: number
  ramp: Ramp
  /** Relative odds in a prize drop. */
  weight: number
  blurb: string
}

const S = 60

export const POWERS: Record<PowerKind, Power> = {
  spread: {
    name: 'SPREAD SHOT',
    letter: 'S',
    ticks: 10 * S,
    cap: 20 * S,
    ramp: RAMPS.purple,
    weight: 5,
    blurb: 'three streams of confetti',
  },
  rapid: {
    name: 'RAPID FIRE',
    letter: 'R',
    ticks: 10 * S,
    cap: 20 * S,
    ramp: RAMPS.rust,
    weight: 5,
    blurb: 'the cannon fires faster',
  },
  shield: {
    name: 'SHIELD',
    letter: 'D',
    ticks: 8 * S,
    cap: 16 * S,
    ramp: RAMPS.teal,
    weight: 4,
    blurb: 'takes one hit for you',
  },
  poppers: {
    name: 'PARTY POPPERS',
    letter: 'P',
    ticks: 8 * S,
    cap: 16 * S,
    ramp: RAMPS.pink,
    weight: 3,
    blurb: 'lobs a popper that bursts over a crowd',
  },
  rockets: {
    name: 'BUBBLE ROCKETS',
    letter: 'B',
    ticks: 8 * S,
    cap: 16 * S,
    ramp: RAMPS.sky,
    weight: 3,
    blurb: 'slow, heavy, and straight through',
  },
  orbiters: {
    name: 'STREAMER ORBITERS',
    letter: 'O',
    ticks: 10 * S,
    cap: 20 * S,
    ramp: RAMPS.gold,
    weight: 3,
    blurb: 'two ribbons circle and guard you',
  },
  skates: {
    name: 'ROLLER SKATES',
    letter: 'K',
    ticks: 8 * S,
    cap: 16 * S,
    ramp: RAMPS.leaf,
    weight: 3,
    blurb: 'half as fast again',
  },
  laser: {
    name: 'GLITTER LASER',
    letter: 'L',
    ticks: 6 * S,
    cap: 12 * S,
    ramp: RAMPS.cream,
    weight: 3,
    blurb: 'a beam that pierces the whole line',
  },
  foamgun: {
    name: 'FOAM CANNON',
    letter: 'F',
    ticks: 8 * S,
    cap: 16 * S,
    ramp: RAMPS.water,
    weight: 3,
    blurb: 'slows crashers and foams the floor',
  },
  cutout: {
    name: 'CARDBOARD CUTOUT',
    letter: 'C',
    ticks: 8 * S,
    cap: 8 * S,
    ramp: RAMPS.earth,
    weight: 2,
    blurb: 'a decoy of you that the crowd chases',
  },
}

export const POWER_KINDS = Object.keys(POWERS) as PowerKind[]

/** A pickup: `left` ticks more of `kind`, stacked onto what is banked, up to its cap. */
export function stackPower(kind: PowerKind, banked: number): number {
  const power = POWERS[kind]
  return Math.min(power.cap, Math.max(0, banked) + power.ticks)
}

/** A power-up rolled from the drop weights with one roll in 0..1. */
export function powerFromRoll(roll: number, kinds = POWER_KINDS): PowerKind {
  const total = kinds.reduce((sum, k) => sum + POWERS[k].weight, 0)
  let left = roll * total
  for (const kind of kinds) {
    left -= POWERS[kind].weight
    if (left < 0) return kind
  }
  return kinds[kinds.length - 1]!
}

/** How the arsenal tunes the cannon. */
export const ARSENAL = {
  /** Ticks between shots: the plain cannon, rapid fire, and the heavy rockets. */
  cooldown: 7,
  rapidCooldown: 4,
  rocketCooldown: 13,
  laserCooldown: 9,
  rocketSpeed: 2.6,
  rocketPierce: 3,
  rocketDamage: 2,
  /** A laser reaches the wall, cheering everything within this of its line. */
  laserHalf: 4,
  laserShow: 6,
  /** Party poppers: one lobbed this often while firing, landing this far ahead, bursting this wide. */
  popperEvery: 36,
  popperRange: 72,
  popperFlight: 28,
  popperBlast: 24,
  popperDamage: 2,
  /** Foam: how long a hit slows a crasher, and how long the foam stays on the floor. */
  foamSlow: 150,
  foamLife: 360,
  foamRadius: 14,
  orbitRadius: 18,
  orbitReach: 7,
  orbitEvery: 12,
  skateSpeed: 1.5,
  cutoutHp: 12,
} as const
