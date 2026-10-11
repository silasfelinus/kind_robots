// /utils/arcade/butterflyJoust/roster.ts
//
// The moth riders of the Four Gardens Tourney as data (conductor kr-arcade/t-048): what each is
// worth, how it flies, and what its cocoon hatches into. The game's update loop reads `ai` to pick
// a flight plan; nothing here touches a canvas or the game's dice.

export type RiderKind =
  'drifter' | 'hunter' | 'shadow' | 'glider' | 'twin' | 'bomber'

/**
 * How a rider flies: drift wanders, hunt chases your height, shadow climbs above you, glide never
 * flaps and rides the thermals, bomb hovers over you dropping pollen puffs.
 */
export type RiderAi = 'drift' | 'hunt' | 'shadow' | 'glide' | 'bomb'

export type RiderSpec = {
  name: string
  points: number
  ai: RiderAi
  /** Speed against the arena's rider speed. */
  speed: number
  /** Ticks between flaps (plus a little dice). */
  flapGap: number
  /** What its cocoon hatches into. */
  hatch: RiderKind
  /** Its spark colour. */
  spark: string
  /** A bonk splits it into this many cocoons (twin riders: two). */
  cocoons: number
  /** The tell and the answer, for the guide. */
  tell: string
  answer: string
}

export const ROSTER: Record<RiderKind, RiderSpec> = {
  drifter: {
    name: 'DRIFTER',
    points: 500,
    ai: 'drift',
    speed: 0.75,
    flapGap: 16,
    hatch: 'hunter',
    spark: '#f87171',
    cocoons: 1,
    tell: 'WANDERS',
    answer: 'GET ABOVE IT',
  },
  hunter: {
    name: 'HUNTER',
    points: 750,
    ai: 'hunt',
    speed: 1,
    flapGap: 12,
    hatch: 'shadow',
    spark: '#a78bfa',
    cocoons: 1,
    tell: 'CHASES YOUR HEIGHT',
    answer: 'GET ABOVE IT',
  },
  shadow: {
    name: 'SHADOW',
    points: 1500,
    ai: 'shadow',
    speed: 1.15,
    flapGap: 9,
    hatch: 'shadow',
    spark: '#475569',
    cocoons: 1,
    tell: 'CLIMBS OVER YOU',
    answer: 'OUTCLIMB IT',
  },
  glider: {
    name: 'GLIDER',
    points: 750,
    ai: 'glide',
    speed: 0.9,
    flapGap: 99,
    hatch: 'hunter',
    spark: '#fcd34d',
    cocoons: 1,
    tell: 'CIRCLES UP A THERMAL',
    answer: 'MEET IT AT THE TOP',
  },
  twin: {
    name: 'TWIN RIDERS',
    points: 1000,
    ai: 'hunt',
    speed: 0.85,
    flapGap: 14,
    hatch: 'hunter',
    spark: '#f472b6',
    cocoons: 2,
    tell: 'TWO MOTHS, ONE MOUNT',
    answer: 'SPLIT THEM, SCOOP BOTH',
  },
  bomber: {
    name: 'POLLEN BOMBER',
    points: 1000,
    ai: 'bomb',
    speed: 0.9,
    flapGap: 13,
    hatch: 'bomber',
    spark: '#facc15',
    cocoons: 1,
    tell: 'DROPS SNEEZY PUFFS',
    answer: 'FLY ROUND THE PUFF',
  },
}

/** The classic pond's three tiers, in order. */
export const CLASSIC_TIERS: readonly RiderKind[] = [
  'drifter',
  'hunter',
  'shadow',
]

/** A pollen puff: how long it falls, then lingers as a cloud, and the sneeze it gives. */
export const POLLEN = {
  /** Ticks between a bomber's drops (plus dice). */
  every: 150,
  fall: 0.9,
  cloud: 60 * 3,
  radius: 14,
  /** Half a second of lost control. */
  sneeze: 30,
} as const

/** A glider sinks this slowly between thermals. */
export const GLIDE = { gravity: 0.03, maxFall: 0.9 } as const
