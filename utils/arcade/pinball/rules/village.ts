// /utils/arcade/pinball/rules/village.ts
//
// AMI Village Rescue's feature data (conductor kind-pinball/t-007): what
// everything scores, the twelve villages on the village map and the mode each
// one plays, and a small seeded random source so the rules stay pure and a
// replayed game is the same game.
//
// The award saucer starts the next village. Each village is a short timed
// mode that lights its own shots; make enough of them in time and the village
// is saved for a big total. Every village visited counts toward the map, and
// all twelve light the Malaria-Free wizard mode at the saucer.

import { PHYSICS_HZ } from '../clock'

/** Points for each switch and shot. */
export const VALUES = {
  pop: 1_000,
  sling: 110,
  spin: 250,
  drop: 2_500,
  standup: 5_000,
  ramp: 25_000,
  orbit: 15_000,
  upperFeed: 20_000,
  scoop: 10_000,
  skillShot: 100_000,
  comboBase: 20_000,
  lock: 50_000,
  jackpot: 500_000,
  jackpotStep: 100_000,
  superJackpot: 2_000_000,
  modeShotBase: 50_000,
  modeComplete: 250_000,
  villageVisited: 25_000,
  wizardShot: 1_000_000,
  wizardStep: 250_000,
  bonusRamp: 5_000,
  bonusOrbit: 3_000,
  bonusLock: 10_000,
  bonusVillage: 25_000,
} as const

/** A ramp or orbit this soon after the last is a combo. */
export const COMBO_STEPS = PHYSICS_HZ * 4
/**
 * The skill shot. Every plunge rounds the left orbit and comes down the left
 * inlane to the left flipper (measured, t-013), so the plunge lights one of
 * the shots that flipper can make; made first, this soon after the plunge,
 * it is the skill shot. (It was the lit pop bumper, which no plunge reaches.)
 */
export const SKILL_STEPS = PHYSICS_HZ * 6
export const SKILL_TARGETS = ['upper-feed', 'spinner', 'right-ramp'] as const
/** Ball save after the plunge. */
export const BALL_SAVE_STEPS = PHYSICS_HZ * 10
/** Locks that start AMI multiball, and the balls it adds. */
export const LOCKS_FOR_MULTIBALL = 3
export const MULTIBALL_ADDS = 2
/** Ramp jackpots before the super jackpot lights at the lock. */
export const JACKPOTS_FOR_SUPER = 2
/** Ramp shots that relight the saucer after a village. */
export const RAMPS_TO_RELIGHT = 2
/** Villages visited that light the extra ball (at the upper feed). */
export const EXTRA_BALL_AT = 5
/** The wizard mode's extra balls. */
export const WIZARD_ADDS = 2

export const RAMP_SHOTS = ['left-ramp', 'right-ramp']
export const ORBIT_SHOTS = ['left-orbit', 'right-orbit']
export const ARROW_SHOTS = [
  'left-orbit',
  'left-ramp',
  'upper-feed',
  'lock',
  'spinner',
  'right-ramp',
  'right-orbit',
]

export type VillageMode = {
  name: string
  /** What the DMD tells the player to do. */
  hint: string
  /** The shots it lights. */
  shots: string[]
  /** Shots needed in time to save the village. */
  need: number
  seconds: number
}

/** The twelve villages on the map, each with its own mode. */
export const VILLAGES: VillageMode[] = [
  {
    name: 'RIVERBEND',
    hint: 'SHOOT THE RAMPS',
    shots: ['left-ramp', 'right-ramp'],
    need: 3,
    seconds: 30,
  },
  {
    name: 'HILLTOP',
    hint: 'SHOOT THE ORBITS',
    shots: ['left-orbit', 'right-orbit'],
    need: 3,
    seconds: 30,
  },
  {
    name: 'MARKET TOWN',
    hint: 'SPIN THE SPINNER',
    shots: ['spinner'],
    need: 4,
    seconds: 25,
  },
  {
    name: 'LAKESIDE',
    hint: 'LEFT SIDE SHOTS',
    shots: ['left-orbit', 'left-ramp', 'upper-feed'],
    need: 3,
    seconds: 30,
  },
  {
    name: 'PALM GROVE',
    hint: 'RIGHT SIDE SHOTS',
    shots: ['right-ramp', 'right-orbit', 'spinner'],
    need: 3,
    seconds: 30,
  },
  {
    name: 'STONE BRIDGE',
    hint: 'RAMP THEN ORBIT',
    shots: ['left-ramp', 'right-ramp', 'left-orbit', 'right-orbit'],
    need: 4,
    seconds: 35,
  },
  {
    name: 'SUNRISE',
    hint: 'UPPER FEED',
    shots: ['upper-feed'],
    need: 2,
    seconds: 25,
  },
  {
    name: 'FERRY LANDING',
    hint: 'ANY LIT SHOT',
    shots: ['left-orbit', 'left-ramp', 'spinner', 'right-ramp', 'right-orbit'],
    need: 5,
    seconds: 35,
  },
  {
    name: 'TEA GARDENS',
    hint: 'SHOOT THE CENTRE',
    shots: ['upper-feed', 'spinner', 'lock'],
    need: 3,
    seconds: 30,
  },
  {
    name: 'COPPER MINE',
    hint: 'CROSS THE RAMPS',
    shots: ['left-ramp', 'right-ramp'],
    need: 4,
    seconds: 30,
  },
  {
    name: 'WINDY PASS',
    hint: 'ORBIT FRENZY',
    shots: ['left-orbit', 'right-orbit', 'spinner'],
    need: 5,
    seconds: 35,
  },
  {
    name: 'HARBOUR',
    hint: 'EVERY SHOT',
    shots: ARROW_SHOTS.filter((s) => s !== 'lock'),
    need: 6,
    seconds: 40,
  },
]

export const WIZARD_NAME = 'MALARIA-FREE'

/** One step of a small seeded generator (mulberry32): [value 0..1, next seed]. */
export function nextRandom(seed: number): [number, number] {
  let t = (seed + 0x6d2b79f5) >>> 0
  const next = t
  t = Math.imul(t ^ (t >>> 15), t | 1)
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
  return [((t ^ (t >>> 14)) >>> 0) / 4294967296, next]
}

/** Pick one of `items` with the seed: [pick, next seed]. */
export function pick<T>(items: readonly T[], seed: number): [T, number] {
  const [r, next] = nextRandom(seed)
  return [items[Math.floor(r * items.length) % items.length]!, next]
}
