// /utils/arcade/seedLander/flight.ts
//
// Seed Lander's flight core (conductor kr-arcade/t-069, depth-pass CABINETS.md section 9): how a
// seed pod leans, puffs and falls, the Hop (the classic's abort), the flight tiers chosen at the
// start, and how a touchdown is ranked. Pure rules over a Pod, so tests can pin each one.

/** The pod's handling: per-tick acceleration and lean. */
export const FLIGHT = {
  gravity: 0.011,
  thrust: 0.03,
  turn: 0.045,
  maxTilt: Math.PI / 2,
  /** Fastest the pod may fall or slide (a terminal drift, so a long drop stays readable). */
  maxSpeed: 3.2,
} as const

/** Half the pod's width at the feet, and how far its feet hang below its centre. */
export const POD_HALF = 5
export const POD_FEET = 6
/** The pod's top above its centre (the cap and sprig), for roofs and ledges. */
export const POD_TOP = 9

/** A safe touchdown: no faster than this down or across, and no more tilted. */
export const SAFE = { vy: 0.55, vx: 0.4, tilt: 0.22 } as const
/** A Feather landing: a whisper of a touchdown, well inside safe. */
export const FEATHER = { vy: 0.24, vx: 0.18, tilt: 0.09 } as const
/** Up to this much faster than safe still plants, as a Bumpy landing (springier legs raise it). */
export const BUMPY = 1.7

/** Hop: snaps the pod upright and fires one strong puff, for a big sun cost. */
export const HOP = { lift: 1.25, cost: 90, cooldown: 45 } as const

/** Fastest a parachuting pod can be steered across. */
export const CHUTE_DRIFT = 0.55

/** How long a pod rests on a pad before it may puff off again. */
export const SETTLE_TICKS = 30

export type LandingRank = 'feather' | 'soft' | 'bumpy' | 'bonk'

export const RANK_NAMES: Record<LandingRank, string> = {
  feather: 'FEATHER',
  soft: 'SOFT',
  bumpy: 'BUMPY',
  bonk: 'BONK',
}

/** What each rank pays, times the pad's multiplier. */
export const RANK_PAY: Record<LandingRank, number> = {
  feather: 1.5,
  soft: 1,
  bumpy: 1 / 3,
  bonk: 0,
}

/**
 * How a touchdown ranks, from the pod's speed relative to the pad and its lean. `legs` is how much
 * faster than safe still counts as Bumpy (springier legs from the Pod Shed raise it).
 */
export function rankLanding(
  vx: number,
  vy: number,
  tilt: number,
  legs = BUMPY,
): LandingRank {
  const ax = Math.abs(vx)
  const down = Math.max(0, vy)
  const lean = Math.abs(tilt)
  if (lean > SAFE.tilt) return 'bonk'
  if (down <= FEATHER.vy && ax <= FEATHER.vx && lean <= FEATHER.tilt)
    return 'feather'
  if (down <= SAFE.vy && ax <= SAFE.vx) return 'soft'
  if (down <= SAFE.vy * legs && ax <= SAFE.vx * legs) return 'bumpy'
  return 'bonk'
}

/** The Feather streak's score multiplier: +0.1 a Feather in a row, up to x2. */
export function streakMultiplier(streak: number): number {
  return 1 + Math.min(10, Math.max(0, streak)) * 0.1
}

/** The streak after a landing of this rank: a Feather builds it, Soft holds it, worse breaks it. */
export function nextStreak(streak: number, rank: LandingRank): number {
  if (rank === 'feather') return streak + 1
  if (rank === 'soft') return streak
  return 0
}

export type TierId = 'breezy' | 'standard' | 'gale'

export type FlightTier = {
  id: TierId
  name: string
  about: string
  /** Gravity times this. */
  gravity: number
  /** Each mission's sun budget times this. */
  sun: number
  /** Wind times this. */
  wind: number
  /** Hops allowed per mission (Infinity for no limit). */
  hops: number
  /** Show the predicted landing arc. */
  arc: boolean
}

/** The classic's difficulty select, re-riffed: Breezy, Standard and Gale. */
export const TIERS: Record<TierId, FlightTier> = {
  breezy: {
    id: 'breezy',
    name: 'BREEZY',
    about: 'LANDING ARC, MORE SUN',
    gravity: 1,
    sun: 1.25,
    wind: 0.75,
    hops: Infinity,
    arc: true,
  },
  standard: {
    id: 'standard',
    name: 'STANDARD',
    about: 'THE POD AS BUILT',
    gravity: 1,
    sun: 1,
    wind: 1,
    hops: Infinity,
    arc: false,
  },
  gale: {
    id: 'gale',
    name: 'GALE',
    about: 'HEAVY AIR, ONE HOP A MISSION',
    gravity: 1.2,
    sun: 1,
    wind: 1.3,
    hops: 1,
    arc: false,
  },
}
export const TIER_ORDER: readonly TierId[] = ['breezy', 'standard', 'gale']

/** One seed pod in flight (a game seats one, or two in Tandem). */
export type Pod = {
  seat: number
  x: number
  y: number
  vx: number
  vy: number
  tilt: number
  puffing: boolean
  /** Ticks of puffing left in this mission's tank. */
  sun: number
  /** Hops used this mission. */
  hops: number
  hopCool: number
  /** The pad it rests on, by id, or null in the air. */
  restOn: string | null
  /** Ticks it has rested (it may lift off after SETTLE_TICKS). */
  rest: number
  /** Drifting down under its leaf cap with an empty tank. */
  chute: boolean
  /** Dandelion fluff stuck to it (seedLander/hazards.ts), and ticks of puffing in a row. */
  fluff: number
  puffRun: number
}

/** Pod Shed tuning for steerPod: lean speed, and how fast it levels itself when not leaning. */
export type PodMods = { turn: number; settle: number }
export const STOCK_MODS: PodMods = { turn: 1, settle: 0 }

export function newPod(seat: number, x: number, y: number, sun: number): Pod {
  return {
    seat,
    x,
    y,
    vx: 0,
    vy: 0,
    tilt: 0,
    puffing: false,
    sun,
    hops: 0,
    hopCool: 0,
    restOn: null,
    rest: 0,
    chute: false,
    fluff: 0,
    puffRun: 0,
  }
}

export type Controls = {
  left: boolean
  right: boolean
  puff: boolean
  hop: boolean
}

/** Can this pod hop now (sun for it, cooldown done, a hop left on this tier)? */
export function canHop(pod: Pod, tier: FlightTier): boolean {
  return (
    !pod.chute &&
    pod.hopCool <= 0 &&
    pod.sun >= HOP.cost &&
    pod.hops < tier.hops
  )
}

/**
 * One tick of flight under the controls: lean, puff or hop, then gravity times `gravity` (the
 * tier and the island) and any outside push (wind, vents). Returns true if it hopped.
 */
export function steerPod(
  pod: Pod,
  input: Controls,
  tier: FlightTier,
  gravity: number,
  push: { x: number; y: number },
  mods: PodMods = STOCK_MODS,
): boolean {
  let hopped = false
  if (pod.hopCool > 0) pod.hopCool--
  if (pod.chute) {
    // An empty tank: the leaf cap opens and the pod floats down, slow, steered a little by
    // leaning (onto a sunflower, which saves the mission).
    pod.puffing = false
    const steer = (input.right ? 1 : 0) - (input.left ? 1 : 0)
    pod.vx = Math.max(
      -CHUTE_DRIFT,
      Math.min(CHUTE_DRIFT, pod.vx * 0.97 + push.x * 0.5 + steer * 0.008),
    )
    pod.tilt = pod.tilt * 0.85 + pod.vx * 0.06
    pod.vy = Math.min(0.35, pod.vy + FLIGHT.gravity * gravity * 0.4)
    pod.x += pod.vx
    pod.y += pod.vy
    return false
  }
  const turn = FLIGHT.turn * mods.turn
  if (input.left) pod.tilt = Math.max(-FLIGHT.maxTilt, pod.tilt - turn)
  if (input.right) pod.tilt = Math.min(FLIGHT.maxTilt, pod.tilt + turn)
  if (!input.left && !input.right && mods.settle > 0)
    pod.tilt -= Math.sign(pod.tilt) * Math.min(Math.abs(pod.tilt), mods.settle)
  if (input.hop && canHop(pod, tier)) {
    pod.tilt = 0
    pod.vy = Math.min(pod.vy, 0) - HOP.lift
    pod.vx *= 0.5
    pod.sun = Math.max(0, pod.sun - HOP.cost)
    pod.hops++
    pod.hopCool = HOP.cooldown
    hopped = true
  }
  pod.puffing = input.puff && pod.sun > 0
  if (pod.puffing) {
    pod.sun = Math.max(0, pod.sun - 1)
    pod.vx += Math.sin(pod.tilt) * FLIGHT.thrust
    pod.vy -= Math.cos(pod.tilt) * FLIGHT.thrust
  }
  pod.vx += push.x
  pod.vy += FLIGHT.gravity * gravity + push.y
  pod.vx = Math.max(-FLIGHT.maxSpeed, Math.min(FLIGHT.maxSpeed, pod.vx))
  pod.vy = Math.max(-FLIGHT.maxSpeed, Math.min(FLIGHT.maxSpeed, pod.vy))
  pod.x += pod.vx
  pod.y += pod.vy
  return hopped
}

/**
 * Where the pod would fall with no more puffs (the Breezy tier's landing arc): points every
 * `every` ticks until `floor` says it has reached the ground, at most `ticks` ticks ahead.
 */
export function predictArc(
  pod: Pod,
  gravity: number,
  wind: number,
  floor: (x: number) => number,
  ticks = 150,
  every = 6,
): Array<{ x: number; y: number }> {
  const out: Array<{ x: number; y: number }> = []
  let { x, y, vx, vy } = pod
  for (let t = 1; t <= ticks; t++) {
    vx += wind
    vy = Math.min(FLIGHT.maxSpeed, vy + FLIGHT.gravity * gravity)
    x += vx
    y += vy
    if (y + POD_FEET >= floor(x)) {
      out.push({ x, y: floor(x) - POD_FEET })
      break
    }
    if (t % every === 0) out.push({ x, y })
  }
  return out
}
