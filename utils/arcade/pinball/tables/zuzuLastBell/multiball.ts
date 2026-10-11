// /utils/arcade/pinball/tables/zuzuLastBell/multiball.ts
//
// The Citadel lock and the multiballs (conductor zuzu-pinball/t-009), pure.
//
// The machine has BALLS_INSTALLED balls. The ledger is what the rules know
// of where they are: in play (ballsInPlay, the plunger counts as in play),
// parked in the Citadel's physical lock (`locked`, by ball id), or in the
// trough (the rest). A lit Citadel locks the ball that drops in: physically
// when the trough has a ball to serve in its place, else virtually (the
// saucer kicks it out and the lock is only counted). A physical lock the
// machine could not make heals itself: the ball comes back out of the
// saucer, and its eject turns the lock virtual and puts the ball back in
// play. Locks are kept from ball to ball.
//
// The third lock starts Harvest Moon, three balls: the locked balls are
// released and the trough serves the rest. The Village and Abbey ramps take
// turns lighting the jackpot, and after two jackpots an orbit made in a combo
// collects the super jackpot. A short ball save covers the start.
//
// Storm Crow, four balls: break all four Abbey seals, then make both orbits.
// Every lane has its own jackpot ladder of three rungs; once each lane has
// paid, the bell lane collects the super jackpot and the ladders reset.
//
// The Last Bell, six balls: the wizard multiball when the story's fifth seal
// breaks. Any locked balls are released and the trough serves the rest;
// every major shot is a jackpot, and six of them light the Bell spiral for
// the super jackpot. Every super is worth more than the last.

import { PHYSICS_HZ } from '../../clock'
import type { RuleEffect } from '../../types'

export const BALLS_INSTALLED = 6
export const CITADEL = 'citadel'
export const LOCKS_FOR_HARVEST = 3
export const HARVEST_BALLS = 3
/** The ramp that lights the Citadel, and the two that take turns as jackpots. */
export const LOCK_LIGHTER = 'village-switchback'
export const HARVEST_RAMPS = ['village-switchback', 'abbey-crossover'] as const
export const SUPER_SHOTS: readonly string[] = ['left-orbit', 'right-orbit']
export const JACKPOTS_FOR_SUPER = 2
export const MULTIBALL_SAVE_STEPS = PHYSICS_HZ * 10

export const MULTIBALL_VALUES = {
  lockLit: 10_000,
  lock: 50_000,
  jackpot: 500_000,
  jackpotStep: 250_000,
  superJackpot: 3_000_000,
  superStep: 1_000_000,
  stormJackpot: 400_000,
  stormStep: 200_000,
  stormSuper: 5_000_000,
  stormSuperStep: 1_000_000,
  lastBellJackpot: 1_000_000,
  lastBellStep: 250_000,
  lastBellSuper: 10_000_000,
  lastBellSuperStep: 5_000_000,
}

export type Citadel = {
  /** A lock is lit: the next ball into the Citadel locks. */
  lit: boolean
  /** Ball ids parked in the physical lock. */
  locked: number[]
  /** Locks counted but not held (the virtual fallback). */
  virtual: number
}

export type MultiballKind = 'harvest' | 'storm' | 'last-bell'

/** Balls in play when each multiball starts. */
export const MULTIBALL_BALLS: Record<MultiballKind, number> = {
  harvest: 3,
  storm: 4,
  'last-bell': 6,
}
export const STORM_LANES: readonly string[] = [
  'left-orbit',
  'right-orbit',
  'village-switchback',
  'abbey-crossover',
  'bell-spiral',
]
export const STORM_RUNGS = 3
export const STORM_SUPER = 'bell-lane'
/** The orbits that start Storm Crow once the seals are broken. */
export const STORM_ORBITS: readonly string[] = ['left-orbit', 'right-orbit']
export const LAST_BELL_SHOTS: readonly string[] = [
  'left-orbit',
  'right-orbit',
  'village-switchback',
  'abbey-crossover',
  'croc-mouth',
  'mortuary',
]
export const LAST_BELL_SUPER = 'bell-spiral'
export const LAST_BELL_JACKPOTS_FOR_SUPER = 6
const TOTAL_TEXT: Record<MultiballKind, string> = {
  harvest: 'HARVEST MOON TOTAL',
  storm: 'STORM CROW TOTAL',
  'last-bell': 'LAST BELL TOTAL',
}

export type Multiball = {
  kind: MultiballKind | null
  /** The ramp lit for the next jackpot. */
  lit: string
  jackpots: number
  supers: number
  superLit: boolean
  /** Storm Crow's rungs climbed on each lane. */
  ladder: Record<string, number>
  /** Drains before this step are given back. */
  saveUntil: number
  total: number
}

export function initialCitadel(): Citadel {
  return { lit: true, locked: [], virtual: 0 }
}

export function initialMultiball(): Multiball {
  return {
    kind: null,
    lit: HARVEST_RAMPS[0],
    jackpots: 0,
    supers: 0,
    superLit: false,
    ladder: {},
    saveUntil: Number.NEGATIVE_INFINITY,
    total: 0,
  }
}

export const locksMade = (c: Citadel) => c.locked.length + c.virtual

/** Balls in the trough, by the ledger. */
export const trough = (ballsInPlay: number, c: Citadel) =>
  BALLS_INSTALLED - ballsInPlay - c.locked.length

export type LockResult = {
  citadel: Citadel
  points: number
  /** Harvest Moon starts: the balls to put in play. */
  start: { released: number; served: number } | null
}

/**
 * A ball dropped into the lit Citadel. Below the third lock it is locked
 * (physically when the trough can serve a ball in its place) and a new ball
 * is served; the third starts Harvest Moon.
 */
export function lockBall(
  citadel: Citadel,
  ballId: number,
  ballsInPlay: number,
  round: number,
  effects: RuleEffect[],
): LockResult {
  const points = MULTIBALL_VALUES.lock * round
  const made = locksMade(citadel) + 1
  if (made >= LOCKS_FOR_HARVEST) {
    const released = citadel.locked.length
    if (released)
      effects.push({ type: 'mechanism', id: CITADEL, action: 'release' })
    // The ball in the saucer kicks out by itself; the trough serves the rest.
    const served = Math.max(0, HARVEST_BALLS - ballsInPlay - released)
    if (served) effects.push({ type: 'add-ball', count: served })
    return {
      citadel: { lit: false, locked: [], virtual: 0 },
      points,
      start: { released, served },
    }
  }
  const physical = trough(ballsInPlay, citadel) >= 1
  effects.push(
    { type: 'sound', name: 'lock' },
    {
      type: 'dmd',
      text: 'LOCKED',
      sub: `BALL ${made} OF ${LOCKS_FOR_HARVEST}`,
      ms: 2000,
      scene: 'lock',
    },
  )
  if (!physical)
    return {
      citadel: { ...citadel, lit: false, virtual: citadel.virtual + 1 },
      points,
      start: null,
    }
  effects.push(
    { type: 'mechanism', id: CITADEL, action: 'lock' },
    { type: 'serve-ball' },
  )
  return {
    citadel: { ...citadel, lit: false, locked: [...citadel.locked, ballId] },
    points,
    start: null,
  }
}

/**
 * A ball came out of the Citadel that the rules had locked: the machine
 * could not hold it. The lock stays counted, virtually.
 */
export function lockFellBack(citadel: Citadel, ballId: number): Citadel | null {
  if (!citadel.locked.includes(ballId)) return null
  return {
    ...citadel,
    locked: citadel.locked.filter((id) => id !== ballId),
    virtual: citadel.virtual + 1,
  }
}

export function startHarvest(at: number, effects: RuleEffect[]): Multiball {
  effects.push(
    { type: 'sound', name: 'multiball' },
    { type: 'dmd', text: 'HARVEST MOON', ms: 2500, scene: 'multiball' },
    {
      type: 'dmd',
      text: 'RAMPS LIGHT JACKPOTS',
      sub: 'ORBIT COMBO FOR SUPER',
      ms: 2000,
    },
  )
  return {
    ...initialMultiball(),
    kind: 'harvest',
    saveUntil: at + MULTIBALL_SAVE_STEPS,
  }
}

export const jackpotValue = (jackpots: number, round: number) =>
  (MULTIBALL_VALUES.jackpot + MULTIBALL_VALUES.jackpotStep * jackpots) * round

export const superValue = (supers: number, round: number) =>
  (MULTIBALL_VALUES.superJackpot + MULTIBALL_VALUES.superStep * supers) * round

/**
 * Storm Crow or The Last Bell starts: the balls it needs come from the
 * trough, and The Last Bell also releases the Citadel's locked balls.
 */
export function startMultiball(
  kind: Exclude<MultiballKind, 'harvest'>,
  at: number,
  ballsInPlay: number,
  citadel: Citadel,
  effects: RuleEffect[],
): { mb: Multiball; citadel: Citadel; ballsInPlay: number } {
  const released = kind === 'last-bell' ? citadel.locked.length : 0
  if (released)
    effects.push({ type: 'mechanism', id: CITADEL, action: 'release' })
  const served = Math.max(0, MULTIBALL_BALLS[kind] - ballsInPlay - released)
  if (served) effects.push({ type: 'add-ball', count: served })
  if (kind === 'storm')
    effects.push(
      { type: 'sound', name: 'multiball' },
      { type: 'dmd', text: 'STORM CROW', ms: 2500, scene: 'multiball' },
      {
        type: 'dmd',
        text: 'EVERY LANE A LADDER',
        sub: 'BELL LANE FOR SUPER',
        ms: 2000,
      },
    )
  else
    effects.push(
      { type: 'sound', name: 'wizard' },
      { type: 'dmd', text: 'THE LAST BELL', ms: 3000, scene: 'wizard' },
      {
        type: 'dmd',
        text: 'EVERY SHOT A JACKPOT',
        sub: 'BELL SPIRAL FOR SUPER',
        ms: 2000,
      },
    )
  return {
    mb: { ...initialMultiball(), kind, saveUntil: at + MULTIBALL_SAVE_STEPS },
    citadel:
      kind === 'last-bell' ? { lit: false, locked: [], virtual: 0 } : citadel,
    ballsInPlay: ballsInPlay + released + served,
  }
}

export const stormJackpotValue = (rung: number, round: number) =>
  (MULTIBALL_VALUES.stormJackpot + MULTIBALL_VALUES.stormStep * rung) * round
export const stormSuperValue = (supers: number, round: number) =>
  (MULTIBALL_VALUES.stormSuper + MULTIBALL_VALUES.stormSuperStep * supers) *
  round
export const lastBellJackpotValue = (jackpots: number, round: number) =>
  (MULTIBALL_VALUES.lastBellJackpot +
    MULTIBALL_VALUES.lastBellStep * jackpots) *
  round
export const lastBellSuperValue = (supers: number, round: number) =>
  (MULTIBALL_VALUES.lastBellSuper +
    MULTIBALL_VALUES.lastBellSuperStep * supers) *
  round

/** The shots lit for a jackpot or super right now (for the lamps). */
export function multiballTargets(mb: Multiball): string[] {
  switch (mb.kind) {
    case 'harvest':
      return mb.superLit ? [mb.lit, ...SUPER_SHOTS] : [mb.lit]
    case 'storm': {
      const lanes = STORM_LANES.filter((l) => (mb.ladder[l] ?? 0) < STORM_RUNGS)
      return mb.superLit ? [...lanes, STORM_SUPER] : lanes
    }
    case 'last-bell':
      return mb.superLit
        ? [...LAST_BELL_SHOTS, LAST_BELL_SUPER]
        : [...LAST_BELL_SHOTS]
    default:
      return []
  }
}

function jackpot(
  mb: Multiball,
  points: number,
  sub: string,
  effects: RuleEffect[],
): Multiball {
  effects.push(
    { type: 'sound', name: 'jackpot' },
    {
      type: 'dmd',
      text: 'JACKPOT',
      sub,
      ms: 2000,
      scene: 'jackpot',
      value: points,
    },
  )
  return { ...mb, jackpots: mb.jackpots + 1, total: mb.total + points }
}

function superJackpot(
  mb: Multiball,
  points: number,
  effects: RuleEffect[],
): Multiball {
  effects.push(
    { type: 'sound', name: 'super-jackpot' },
    {
      type: 'dmd',
      text: 'SUPER JACKPOT',
      ms: 2500,
      scene: 'super-jackpot',
      value: points,
    },
  )
  return {
    ...mb,
    jackpots: 0,
    superLit: false,
    ladder: {},
    supers: mb.supers + 1,
    total: mb.total + points,
  }
}

/** A shot during any multiball: its jackpots and super jackpot. */
export function multiballShot(
  mb: Multiball,
  id: string,
  inCombo: boolean,
  round: number,
  effects: RuleEffect[],
): { mb: Multiball; points: number } | null {
  if (mb.kind === 'harvest') return harvestShot(mb, id, inCombo, round, effects)
  if (mb.kind === 'storm') {
    if (mb.superLit && id === STORM_SUPER) {
      const points = stormSuperValue(mb.supers, round)
      return { mb: superJackpot(mb, points, effects), points }
    }
    const rung = mb.ladder[id] ?? 0
    if (!STORM_LANES.includes(id) || rung >= STORM_RUNGS) return null
    const points = stormJackpotValue(rung, round)
    const ladder = { ...mb.ladder, [id]: rung + 1 }
    const superLit = STORM_LANES.every((l) => (ladder[l] ?? 0) > 0)
    const next = jackpot(
      { ...mb, ladder, superLit },
      points,
      superLit ? 'SUPER IS LIT' : `RUNG ${rung + 1} OF ${STORM_RUNGS}`,
      effects,
    )
    return { mb: next, points }
  }
  if (mb.kind === 'last-bell') {
    if (mb.superLit && id === LAST_BELL_SUPER) {
      const points = lastBellSuperValue(mb.supers, round)
      return { mb: superJackpot(mb, points, effects), points }
    }
    if (!LAST_BELL_SHOTS.includes(id)) return null
    const points = lastBellJackpotValue(mb.jackpots, round)
    const superLit =
      mb.superLit || mb.jackpots + 1 >= LAST_BELL_JACKPOTS_FOR_SUPER
    const next = jackpot(
      { ...mb, superLit },
      points,
      superLit ? 'SUPER IS LIT' : '',
      effects,
    )
    return { mb: next, points }
  }
  return null
}

/**
 * A shot during Harvest Moon: the lit ramp is the jackpot, and moves to the
 * other ramp; with the super lit, an orbit made in a combo collects it.
 */
export function harvestShot(
  mb: Multiball,
  id: string,
  inCombo: boolean,
  round: number,
  effects: RuleEffect[],
): { mb: Multiball; points: number } | null {
  if (mb.kind !== 'harvest') return null
  if (id === mb.lit) {
    const points = jackpotValue(mb.jackpots, round)
    const jackpots = mb.jackpots + 1
    const superLit = mb.superLit || jackpots >= JACKPOTS_FOR_SUPER
    effects.push(
      { type: 'sound', name: 'jackpot' },
      {
        type: 'dmd',
        text: 'JACKPOT',
        sub: superLit ? 'SUPER IS LIT' : '',
        ms: 2000,
        scene: 'jackpot',
        value: points,
      },
    )
    return {
      mb: {
        ...mb,
        jackpots,
        superLit,
        lit: HARVEST_RAMPS.find((r) => r !== id) ?? id,
        total: mb.total + points,
      },
      points,
    }
  }
  if (mb.superLit && inCombo && SUPER_SHOTS.includes(id)) {
    const points = superValue(mb.supers, round)
    effects.push(
      { type: 'sound', name: 'super-jackpot' },
      {
        type: 'dmd',
        text: 'SUPER JACKPOT',
        ms: 2500,
        scene: 'super-jackpot',
        value: points,
      },
    )
    return {
      mb: {
        ...mb,
        jackpots: 0,
        superLit: false,
        supers: mb.supers + 1,
        total: mb.total + points,
      },
      points,
    }
  }
  return null
}

/** Down to one ball: the multiball is over, with its total. */
export function endMultiball(mb: Multiball, effects: RuleEffect[]): Multiball {
  if (!mb.kind) return mb
  effects.push({
    type: 'dmd',
    text: TOTAL_TEXT[mb.kind],
    ms: 2000,
    scene: 'mode-total',
    value: mb.total,
  })
  return initialMultiball()
}
