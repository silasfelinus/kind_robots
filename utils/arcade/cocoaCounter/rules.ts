// /utils/arcade/cocoaCounter/rules.ts
//
// Cocoa Counter depth pass, slice 1 (conductor kr-arcade/t-122): the rules that are plain data
// and arithmetic, kept out of the render loop so a test can drive them directly. What a round
// asks for (the old curves, the Endless Shift ladder and the rush steps past the plateau), how a
// held A turns into a topping, the Rush combo, juggles and extra mug-bots.

import { levelCurve } from '../curve'
import type { CurveSpec } from '../curve'
import {
  ENDLESS_LADDER,
  EXTRA_MUG_BOTS,
  JUGGLE_WINDOW,
  OLD_PLATEAU,
  ROUNDS_PER_VENUE,
  RUSH,
  RUSH_COMBO,
  RUSH_STEPS,
  VENUES,
} from './tables'
import type { PatronId, RushStepId, Topping, Unlock, VenueDef } from './tables'

export const COCOA_CURVES = {
  /** Robots to serve in the round. */
  robots: { start: 6, step: 2, limit: 26 },
  /** How fast a robot shuffles while it is stepping. */
  walk: { start: 0.42, step: 0.05, limit: 0.95 },
  /** Ticks between robots walking in. */
  gap: { start: 150, step: -12, limit: 48 },
  /** How far a caught mug nudges a robot back. */
  push: { start: 84, step: -5, limit: 44 },
  /** Empty-mug slide speed. */
  empty: { start: 0.8, step: 0.08, limit: 1.5 },
  /** Chance a robot is still thirsty after a mug (it comes back for more). */
  thirst: { start: 0.25, step: 0.08, limit: 0.7 },
} as const satisfies Record<string, CurveSpec>

/** Ticks of a plain pour; holding A past it adds the marshmallows. */
export const POUR_TICKS = 10
/** Extra ticks of holding A that top a mug with marshmallows. */
export const TOPPING_TICKS = 16

/** The round the rush steps begin after: the old plateau, or the end of the ladder if later. */
export const RUSH_AFTER = Math.max(OLD_PLATEAU, ENDLESS_LADDER.length)

export type ShiftRules = {
  round: number
  venue: VenueDef
  robots: number
  walk: number
  gap: number
  push: number
  empty: number
  thirst: number
  /** Toppings a patron may order this round, plain first. */
  toppings: Topping[]
  /** Chance an order asks for a topping rather than plain cocoa. */
  topped: number
  patrons: PatronId[]
  /** How many times each rush step has applied. */
  rush: Record<RushStepId, number>
  /** What is new this round, for the round banner. */
  news: string | null
}

function rushAmount(id: RushStepId, count: number): number {
  const spec = RUSH[id]
  const value = spec.step * count
  return spec.step >= 0
    ? Math.min(value, spec.limit)
    : Math.max(value, spec.limit)
}

function rushMaxed(id: RushStepId, count: number): boolean {
  return Math.abs(RUSH[id].step * count) >= Math.abs(RUSH[id].limit)
}

/**
 * The rush steps the first `late` rounds past the plateau applied, in turn. A step already at its
 * limit passes its round to the next one that is not, so every round still adds something; the
 * crowd has no limit, so there is always one.
 */
export function rushCounts(late: number): {
  counts: Record<RushStepId, number>
  last: RushStepId | null
} {
  const counts = Object.fromEntries(RUSH_STEPS.map((s) => [s.id, 0])) as Record<
    RushStepId,
    number
  >
  let last: RushStepId | null = null
  for (let k = 0; k < late; k++) {
    for (let j = 0; j < RUSH_STEPS.length; j++) {
      const id = RUSH_STEPS[(k + j) % RUSH_STEPS.length]!.id
      if (rushMaxed(id, counts[id])) continue
      counts[id]++
      last = id
      break
    }
  }
  return { counts, last }
}

export function venueForRound(round: number): VenueDef {
  const turn = Math.floor((Math.max(1, round) - 1) / ROUNDS_PER_VENUE)
  return VENUES[turn % VENUES.length]!
}

export function unlockedBy(round: number): Unlock[] {
  return ENDLESS_LADDER.slice(0, Math.max(1, Math.floor(round)))
}

export function shiftRules(level: number): ShiftRules {
  const round = Math.max(1, Math.floor(level))
  const late = Math.max(0, round - RUSH_AFTER)
  const { counts: rush, last } = rushCounts(late)
  const unlocked = unlockedBy(round)
  const toppings: Topping[] = ['plain']
  const patrons: PatronId[] = []
  let firstTopped = 0
  unlocked.forEach((u, i) => {
    if (u.kind === 'topping' && !toppings.includes(u.topping)) {
      toppings.push(u.topping)
      if (!firstTopped) firstTopped = i + 1
    } else if (u.kind === 'patron' && !patrons.includes(u.patron))
      patrons.push(u.patron)
  })
  const topped = firstTopped
    ? Math.min(0.55, 0.3 + 0.04 * (round - firstTopped)) +
      rushAmount('orders', rush.orders)
    : 0
  const rung = ENDLESS_LADDER[round - 1]
  return {
    round,
    venue: venueForRound(round),
    robots:
      Math.round(levelCurve(round, COCOA_CURVES.robots)) +
      rushAmount('crowd', rush.crowd),
    walk:
      levelCurve(round, COCOA_CURVES.walk) *
      (1 + rushAmount('pace', rush.pace)),
    gap:
      levelCurve(round, COCOA_CURVES.gap) +
      rushAmount('arrivals', rush.arrivals),
    push: levelCurve(round, COCOA_CURVES.push),
    empty:
      levelCurve(round, COCOA_CURVES.empty) +
      rushAmount('empties', rush.empties),
    thirst: levelCurve(round, COCOA_CURVES.thirst),
    toppings,
    topped,
    patrons: patrons.length ? patrons : ['thirsty'],
    rush,
    news: rung
      ? rung.banner
      : last
        ? RUSH_STEPS.find((s) => s.id === last)!.banner
        : null,
  }
}

/** A patron's order: plain cocoa, or one of the round's toppings. */
export function pickOrder(rng: () => number, rules: ShiftRules): Topping {
  const fancy = rules.toppings.filter((t) => t !== 'plain')
  if (!fancy.length || rng() >= rules.topped) return 'plain'
  return fancy[Math.floor(rng() * fancy.length)]!
}

export function pickPatron(rng: () => number, rules: ShiftRules): PatronId {
  const pool = rules.patrons
  return pool.length === 1 ? pool[0]! : pool[Math.floor(rng() * pool.length)]!
}

/** A pour in progress at the urn. */
export type Pour = {
  ticks: number
  /** A let go of: the mug goes out plain once the cocoa is in. */
  released: boolean
  /** B pressed while A was still held: a peppermint swirl. */
  swirl: boolean
  /** Ticks the plain pour takes (the Cafe Fund's faster pour shortens it). */
  base: number
}

export function newPour(base = POUR_TICKS): Pour {
  return { ticks: 0, released: false, swirl: false, base }
}

/**
 * One tick of pouring with A `held` and B `pressedB`. Returns the topping once the mug is ready
 * to slide, or null while it is still filling. Tap for plain, hold through the topping for
 * marshmallows, hold and press B for a swirl.
 */
export function pourStep(
  pour: Pour,
  held: boolean,
  pressedB: boolean,
): Topping | null {
  pour.ticks++
  if (!held) pour.released = true
  else if (pressedB && !pour.released) pour.swirl = true
  if (pour.ticks < pour.base) return null
  if (pour.swirl) return 'swirl'
  if (pour.released) return 'plain'
  return pour.ticks >= pour.base + TOPPING_TICKS ? 'marshmallow' : null
}

/** The Rush combo multiplier for a run of clean serves: x1 up to x5. */
export function comboMultiplier(streak: number): number {
  return Math.min(
    RUSH_COMBO.max,
    1 + Math.floor(Math.max(0, streak) / RUSH_COMBO.step),
  )
}

/** Extra mug-bots earned by a score going from `before` to `after`. */
export function extraMugBotsBetween(before: number, after: number): number {
  return EXTRA_MUG_BOTS.filter((s) => before < s && after >= s).length
}

/** A catch and a finished pour this close together make a juggle. */
export function isJuggle(pourTick: number, catchTick: number): boolean {
  return Math.abs(pourTick - catchTick) <= JUGGLE_WINDOW
}
