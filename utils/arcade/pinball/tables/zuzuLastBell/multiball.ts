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
}

export type Citadel = {
  /** A lock is lit: the next ball into the Citadel locks. */
  lit: boolean
  /** Ball ids parked in the physical lock. */
  locked: number[]
  /** Locks counted but not held (the virtual fallback). */
  virtual: number
}

export type MultiballKind = 'harvest'

export type Multiball = {
  kind: MultiballKind | null
  /** The ramp lit for the next jackpot. */
  lit: string
  jackpots: number
  supers: number
  superLit: boolean
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
    text: 'HARVEST MOON TOTAL',
    ms: 2000,
    scene: 'mode-total',
    value: mb.total,
  })
  return initialMultiball()
}
