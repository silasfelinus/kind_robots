// /utils/arcade/lanternSwarm/flock.ts
//
// Lantern Swarm depth pass, slice 2 (conductor kr-arcade/t-094): the Welcome Glow, the Flock and the
// festival charms, as rules the game reads.
//
// - Hold B to open a soft warm cone above the lantern. It drains the glow gauge; beaming refills it.
// - A moth that dives through the cone while the gauge is full (at or above FRIEND_AT) is
//   befriended and joins the Flock, up to four, flying around the lantern and beaming with you:
//   a moth adds a straight beam, a luna an angled side beam, a softened queen a slow piercing one.
//   Befriending spends the full gauge.
// - A Flock moth takes a hit for you and flutters home instead of costing a lantern.
// - Tap B to send the whole Flock on a Homecoming dive up through the swarm, clearing a column.
// - Charms float down from perfect Glow Stages and escort bonuses: Paper Crane (wide beam),
//   Sparkler (rapid beam), Moon Mirror (blocks one hit of dust), Kite String (beams curve).

import type { Kind, Pt } from './zones'

export const GAUGE_MAX = 100
/** The gauge counts as full from here: the cone shines gold and can befriend. */
export const FRIEND_AT = 60
/** Gauge drained per tick while the cone is open. */
export const GAUGE_DRAIN = 0.35
/** Gauge won back by each beam that lands. */
export const GAUGE_REFILL = 10
/** A press of B shorter than this (and then released) is a tap: the Homecoming dive. */
export const TAP_TICKS = 9
export const FLOCK_MAX = 4
/** How tall the cone reaches above the lantern, and how wide it opens at the top. */
export const CONE_REACH = 84
export const CONE_HALF = 26

/** Where each Flock place flies, relative to the lantern. */
export const FLOCK_SLOTS: readonly Pt[] = [
  { x: -17, y: -3 },
  { x: 17, y: -3 },
  { x: -10, y: -19 },
  { x: 10, y: -19 },
]

export type FriendBeam = 'straight' | 'angled' | 'pierce'

/** The beam a befriended kind adds (null: it cannot be befriended). */
export function friendBeam(kind: Kind, hp: number): FriendBeam | null {
  switch (kind) {
    case 'moth':
    case 'cocoon':
    case 'sparker':
    case 'moonlet':
      return 'straight'
    case 'luna':
    case 'escort':
    case 'skimmer':
    case 'duster':
      return 'angled'
    case 'queen':
      // Only a queen softened by one beam will come along.
      return hp <= 1 ? 'pierce' : null
  }
}

/** The speed of each friend beam, as (vx toward its side, vy). */
export const FRIEND_BEAM_SPEED: Record<FriendBeam, { vx: number; vy: number }> =
  {
    straight: { vx: 0, vy: -5.5 },
    angled: { vx: 1.5, vy: -5 },
    pierce: { vx: 0, vy: -3 },
  }

/** Is (x, y) inside the Welcome Glow's cone over a lantern at (lx, ly)? */
export function inCone(x: number, y: number, lx: number, ly: number): boolean {
  const up = ly - 6 - y
  if (up < 0 || up > CONE_REACH) return false
  return Math.abs(x - lx) < 6 + (CONE_HALF - 6) * (up / CONE_REACH)
}

/** The Homecoming dive: the Flock flies straight up from the lantern, clearing a column. */
export const HOMECOMING = {
  speed: 5,
  /** Half the width of the column it clears. */
  half: 11,
  /** Guardian hits each Flock moth is worth on the way up. */
  hitsEach: 2,
  points: 2,
} as const

export type CharmKind = 'crane' | 'sparkler' | 'mirror' | 'kite'
export const CHARMS: Record<
  CharmKind,
  { name: string; ticks: number; line: string }
> = {
  crane: { name: 'PAPER CRANE', ticks: 900, line: 'WIDE BEAM' },
  sparkler: { name: 'SPARKLER', ticks: 900, line: 'RAPID BEAM' },
  /** The mirror lasts until it blocks a hit. */
  mirror: { name: 'MOON MIRROR', ticks: Infinity, line: 'BLOCKS ONE HIT' },
  kite: { name: 'KITE STRING', ticks: 900, line: 'BEAMS CURVE' },
}
export const CHARM_KINDS = Object.keys(CHARMS) as CharmKind[]
export const CHARM_FALL = 0.8

/** A beam's half-width and speed under the charm in play. */
export function beamFor(charm: CharmKind | null): {
  half: number
  speed: number
  perGun: number
} {
  return {
    half: charm === 'crane' ? 12 : 7,
    speed: charm === 'sparkler' ? 7 : 5.5,
    perGun: charm === 'sparkler' ? 4 : 2,
  }
}
