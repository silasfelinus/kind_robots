// /utils/arcade/butterflyBlaster/kit.ts
//
// AMI's kit (conductor kr-arcade/t-056, CABINETS.md section 6 "AMI's kit"): what AMI, the
// Anti-Malaria Intelligence, drops as she flies over. Each is short and shows in the HUD.
//
//   Bed Net         a shield that takes one hit (two with the Clinic's sturdy net).
//   Repellent Ring  three citronella sparkles orbit the butterfly, popping what they touch.
//   Spray Fan       every sparkle fans three ways.
//   Dragonfly       a wingman that hunts lone mosquitoes (the natural predators are the cavalry).
//   Lantern Lure    a lantern hung where you caught it: every swarm clusters on it, ready to lasso.
//   Long Sparkle    sparkles fly 60% further.
//   Bat Squadron    one sweep of bats across the sky, gobbling every lone mosquito they meet.
//
// A region lists what AMI may bring (season.ts); the pick is gameplay, on the game's rng.

import { RAMPS } from '../snes'
import type { Ramp } from '../snes'

export type KitId =
  'net' | 'ring' | 'fan' | 'wingman' | 'lure' | 'long' | 'bats'

export const KIT: Record<
  KitId,
  { name: string; ticks: number; ramp: Ramp; points: number }
> = {
  net: { name: 'BED NET', ticks: 480, ramp: RAMPS.sky, points: 250 },
  ring: { name: 'REPELLENT RING', ticks: 600, ramp: RAMPS.leaf, points: 250 },
  fan: { name: 'SPRAY FAN', ticks: 600, ramp: RAMPS.pink, points: 250 },
  wingman: { name: 'DRAGONFLY', ticks: 900, ramp: RAMPS.teal, points: 250 },
  lure: { name: 'LANTERN LURE', ticks: 480, ramp: RAMPS.gold, points: 250 },
  long: { name: 'LONG SPARKLE', ticks: 720, ramp: RAMPS.purple, points: 250 },
  bats: { name: 'BAT SQUADRON', ticks: 240, ramp: RAMPS.night, points: 250 },
}

/** The Repellent Ring: orbs, their orbit and how fast they turn. */
export const RING = {
  orbs: 3,
  radius: 32,
  spin: 0.09,
  reach: 9,
  rest: 18,
} as const
/** The Spray Fan's spread either side, and how many sparkles it allows. */
export const FAN = { spread: 0.26, shots: 9 } as const
/** The Long Sparkle's reach. */
export const LONG = 1.6
/** The dragonfly wingman. */
export const WINGMAN = { speed: 3.2, turn: 0.12, reach: 12 } as const
/** The Lantern Lure's pull on every swarm. */
export const LURE = { pull: 3 } as const

/** The bat squadron: how many, how fast they sweep, and how far each reaches. */
export const BATS = { count: 7, speed: 2.4, reach: 14 } as const

export function pickKit(rng: () => number, kinds: readonly KitId[]): KitId {
  return kinds[Math.floor(rng() * kinds.length)] ?? 'net'
}
