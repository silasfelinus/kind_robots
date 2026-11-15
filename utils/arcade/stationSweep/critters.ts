// /utils/arcade/stationSweep/critters.ts
//
// Station Sweep's critter roster as data (conductor kr-arcade/t-141, depth slice 1 of The Orbit
// Line). Five families, each growing through three stages: a sac hatches the young stage, and a
// critter left alone grows into the next, then into its adult. Critters are never hurt: Mop sweeps
// them into its bin, and a bin emptied at a lift pays the team credits for the Supply Locker.
//
//   Roller   rollerbub -> roller -> boulderbelly   bowls low; adults roll in bouncing pairs
//   Crawler  ceiling bub -> clinger -> web weaver  drops and clings; the adult hangs a web of babies
//   Biter    nipper -> biter -> snapper            stalks and spits; the adult spits three ways
//   Puffer   puff -> puffer -> spore cloud         swells near Mop and pops into sticky spores
//   Gloop    blob -> gloop -> big gloop            splits in two when swept, unless foamed first

import { RAMPS, type Ramp } from '../snes'

export type Family = 'roller' | 'crawler' | 'biter' | 'puffer' | 'gloop'
export type Stage = 0 | 1 | 2

export const FAMILY_NAMES: readonly Family[] = [
  'roller',
  'crawler',
  'biter',
  'puffer',
  'gloop',
]

export type StageDef = {
  name: string
  /** Sweeps it takes. */
  hp: number
  /** How tall it stands from its feet: what a beam at that height can reach. */
  hitH: number
  /** Half its width, for beams and bumps. */
  halfW: number
  /** Score per sweep, times the station number. */
  points: number
  /** Credits it pays once its bin is emptied at a lift. */
  credits: number
  /** Room it takes in Mop's bin. */
  bin: number
  /** Charge a bump, nibble or bite takes. */
  damage: number
}

export type FamilyDef = {
  name: string
  stages: readonly [StageDef, StageDef, StageDef]
  /** What it does, what gives it away, and the answer: one line each for the guide. */
  does: string
  tell: string
  answer: string
  /** Its body ramp, and the sparkle when it is swept. */
  ramp: Ramp
  spark: string
}

const LIME: Ramp = ['#1f3d0a', '#3f6212', '#65a30d', '#a3e635', '#ecfccb']

function stage(
  name: string,
  hp: number,
  hitH: number,
  halfW: number,
  points: number,
  credits: number,
  bin: number,
  damage: number,
): StageDef {
  return { name, hp, hitH, halfW, points, credits, bin, damage }
}

export const FAMILIES: Record<Family, FamilyDef> = {
  roller: {
    name: 'ROLLER',
    stages: [
      stage('ROLLERBUB', 1, 11, 6, 80, 1, 1, 6),
      stage('ROLLER', 1, 13, 9, 120, 2, 1, 9),
      stage('BOULDERBELLY', 3, 28, 14, 400, 4, 2, 14),
    ],
    does: 'BOWLS LOW. ADULTS ROLL IN BOUNCING PAIRS',
    tell: 'A GROWL BEFORE IT CHARGES',
    answer: 'CROUCH-SWEEP. FOAM STOPS IT',
    ramp: LIME,
    spark: LIME[3],
  },
  crawler: {
    name: 'CRAWLER',
    stages: [
      stage('CEILING BUB', 1, 8, 7, 120, 1, 1, 3),
      stage('CLINGER', 2, 12, 11, 200, 2, 1, 5),
      stage('WEB WEAVER', 4, 26, 14, 500, 4, 2, 10),
    ],
    does: 'DROPS AND CLINGS. ADULTS SPIN WEBS',
    tell: 'A SHADOW ON THE FLOOR',
    answer: 'JUMP TO SHAKE IT. VAC PULLS IT DOWN',
    ramp: RAMPS.purple,
    spark: RAMPS.purple[3],
  },
  biter: {
    name: 'BITER',
    stages: [
      stage('NIPPER', 2, 13, 7, 160, 1, 1, 6),
      stage('BITER', 3, 20, 10, 300, 2, 1, 12),
      stage('SNAPPER', 6, 32, 15, 700, 5, 2, 16),
    ],
    does: 'STALKS AND SPITS. ADULTS SPIT THREE WAYS',
    tell: 'PUFFED-OUT CHEEKS',
    answer: 'CROUCH, OR GET BEHIND IT',
    ramp: RAMPS.pink,
    spark: RAMPS.pink[3],
  },
  puffer: {
    name: 'PUFFER',
    stages: [
      stage('PUFF', 1, 12, 7, 120, 1, 1, 4),
      stage('PUFFER', 2, 19, 10, 250, 2, 1, 6),
      stage('SPORE CLOUD', 3, 24, 15, 550, 4, 2, 8),
    ],
    does: 'SWELLS UP CLOSE, POPS INTO SPORES',
    tell: 'IT SWELLS',
    answer: 'SWEEP IT AT RANGE. STEAM CLEARS SPORES',
    ramp: RAMPS.gold,
    spark: RAMPS.gold[3],
  },
  gloop: {
    name: 'GLOOP',
    stages: [
      stage('BLOB', 1, 9, 7, 100, 1, 1, 5),
      stage('GLOOP', 2, 15, 11, 200, 2, 1, 8),
      stage('BIG GLOOP', 4, 27, 16, 450, 4, 2, 12),
    ],
    does: 'SPLITS IN TWO WHEN SWEPT',
    tell: 'IT WOBBLES',
    answer: 'FOAM THEN SWEEP, OR VACUUM IT WHOLE',
    ramp: RAMPS.teal,
    spark: RAMPS.teal[3],
  },
}

/** A stage's numbers. */
export function stageDef(family: Family, at: Stage): StageDef {
  return FAMILIES[family].stages[at]
}

/**
 * Growing up: a young critter grows after this share of the station's grow time, and the middle
 * stage after all of it. An adult is done growing.
 */
export const GROW_SHARE: readonly [number, number] = [0.6, 1]

/** Ticks a critter at `at` waits before growing, given the station's grow time. */
export function growTicks(at: Stage, growAfter: number): number {
  return at === 2 ? Infinity : Math.round(growAfter * GROW_SHARE[at])
}

/** Which floor critters hatch, by weight, as the stations go on. */
export const FLOOR_HATCH: ReadonlyArray<{
  family: Exclude<Family, 'crawler'>
  /** The first station it hatches on. */
  from: number
  weight: { start: number; step: number; limit: number }
}> = [
  { family: 'roller', from: 1, weight: { start: 1, step: -0.05, limit: 0.7 } },
  { family: 'biter', from: 1, weight: { start: 0.35, step: 0.1, limit: 0.8 } },
  {
    family: 'puffer',
    from: 1,
    weight: { start: 0.3, step: 0.06, limit: 0.55 },
  },
  { family: 'gloop', from: 2, weight: { start: 0.4, step: 0.08, limit: 0.7 } },
]

/** The floor family a sac hatches, from one roll of the dice. */
export function pickFloorFamily(
  station: number,
  roll: number,
): Exclude<Family, 'crawler'> {
  const open = FLOOR_HATCH.filter((h) => station >= h.from)
  const weights = open.map((h) => {
    const { start, step, limit } = h.weight
    const w = start + step * (station - h.from)
    return step >= 0 ? Math.min(limit, w) : Math.max(limit, w)
  })
  const total = weights.reduce((a, b) => a + b, 0)
  let at = roll * total
  for (let i = 0; i < open.length; i++) {
    at -= weights[i]!
    if (at < 0) return open[i]!.family
  }
  return open[open.length - 1]!.family
}

/** A deck holds at most this many critters: sacs wait, webs rest and gloops stay whole past it. */
export const DECK_CRITTER_CAP = 16

// --- behaviour tuning ----------------------------------------------------------------------------

export const ROLLER = {
  /** The pair's partner rolls this far behind its leader. */
  pairGap: 26,
  /** Ticks of growl before a boulderbelly charges, and the charge itself. */
  growl: 40,
  charge: 70,
  /** Ticks between charges. */
  chargeEvery: 220,
  bounceVy: -3.1,
} as const

export const CRAWLER = {
  /** A ceiling bub this close above a Mop casts its shadow, then drops. */
  shadowAt: 34,
  /** A clinger crouches this long, then leaps on a Mop within reach. */
  leapReach: 30,
  leapTell: 24,
  /** A web weaver hangs this far above the floor, and drops a baby this often. */
  hang: 12,
  dropEvery: 300,
} as const

export const BITER = {
  /** Cheeks puff this long before a spit. */
  cheeks: 30,
  /** Ticks between spits, by stage (a nipper only nips). */
  spitEvery: [0, 110, 90] as const,
  /** The snapper turns slowly: ticks to face a Mop who got round behind it. */
  turn: 75,
} as const

export const PUFFER = {
  /** It starts to swell when a Mop comes this close, and pops when the swell is done. */
  swellAt: 44,
  swell: 50,
  /** The sticky patch it leaves: radius by stage, and how long it lasts. */
  sporeR: [18, 28, 42] as const,
  sporeLife: 60 * 6,
  /** A spore cloud sheds a small patch this often as it drifts. */
  shedEvery: 180,
  /** Walking in spores: speed, and a nibble of charge this often. */
  slow: 0.45,
  drainEvery: 20,
} as const

export const GLOOP = {
  /** It wobbles this long before it lunges at a Mop this close. */
  wobble: 30,
  lungeAt: 42,
  lungeVx: 1.7,
  lungeVy: -2.4,
} as const
