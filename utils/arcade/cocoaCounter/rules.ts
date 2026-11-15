// /utils/arcade/cocoaCounter/rules.ts
//
// Cocoa Counter depth pass (conductor kr-arcade/t-122, t-123): the rules that are plain data and
// arithmetic, kept out of the render loop so a test can drive them directly. What a round asks for
// (the old curves, the Endless Shift ladder, the rush steps past the plateau, and each tour shift),
// how a held A turns into a topping, the Rush combo, juggles and extra mug-bots, boardwalk friction
// and gaps, the Marshmallow Mix-up shuffle, the Cafe Fund and the save.

import { levelCurve } from '../curve'
import type { CurveSpec } from '../curve'
import {
  COUNTER_FEATURES,
  ENDLESS_LADDER,
  EXTRA_MUG_BOTS,
  GAP_SPEED,
  JUGGLE_WINDOW,
  MIN_MUG_SPEED,
  OLD_PLATEAU,
  PATRONS,
  ROUNDS_PER_VENUE,
  RUSH,
  RUSH_COMBO,
  RUSH_STEPS,
  UPGRADES,
  VENUES,
} from './tables'
import type {
  CounterDef,
  PatronId,
  RushStepId,
  Topping,
  Unlock,
  UpgradeId,
  VenueDef,
  VenueId,
} from './tables'

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

/** The pours a venue's menu has a drink for. */
export function menuToppings(venue: VenueDef): Topping[] {
  return (['plain', 'marshmallow', 'swirl'] as const).filter(
    (t) => venue.menu[t],
  )
}

function toppedShare(round: number, firstTopped: number, orders: number) {
  return firstTopped
    ? Math.min(0.55, 0.3 + 0.04 * (round - firstTopped)) +
        rushAmount('orders', orders)
    : 0
}

/** Endless Shift: the curves, the ladder (something new every round) and the rush past it. */
export function shiftRules(level: number): ShiftRules {
  const round = Math.max(1, Math.floor(level))
  const late = Math.max(0, round - RUSH_AFTER)
  const { counts: rush, last } = rushCounts(late)
  const venue = venueForRound(round)
  const menu = menuToppings(venue)
  const toppings: Topping[] = ['plain']
  const patrons: PatronId[] = []
  let firstTopped = 0
  unlockedBy(round).forEach((u, i) => {
    if (u.kind === 'topping') {
      if (!firstTopped) firstTopped = i + 1
      if (menu.includes(u.topping) && !toppings.includes(u.topping))
        toppings.push(u.topping)
    } else if (!patrons.includes(u.patron)) patrons.push(u.patron)
  })
  const rung = ENDLESS_LADDER[round - 1]
  return {
    round,
    venue,
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
    topped: toppedShare(round, firstTopped, rush.orders),
    patrons: patrons.length ? patrons : ['thirsty'],
    rush,
    news: rung
      ? rung.banner
      : last
        ? RUSH_STEPS.find((s) => s.id === last)!.banner
        : null,
  }
}

/** Shifts per venue on the Cozy Cafe Tour, then the Rush Hour regular. */
export const TOUR_SHIFTS = 4
export const RUSH_HOUR = TOUR_SHIFTS + 1

/**
 * A shift of the Cozy Cafe Tour: venue `venueIndex`, shift 1-4 (or RUSH_HOUR). Shifts 1-2 bring in
 * the venue's patrons and counters; 3-4 remix them with everything earlier. The curves run on as
 * if each venue were four more rounds.
 */
export function tourRules(venueIndex: number, shift: number): ShiftRules {
  const venue = VENUES[Math.max(0, Math.min(VENUES.length - 1, venueIndex))]!
  const s = Math.max(1, Math.min(RUSH_HOUR, Math.floor(shift)))
  const def = venue.shifts[Math.min(TOUR_SHIFTS, s) - 1]!
  const round = venueIndex * TOUR_SHIFTS + Math.min(TOUR_SHIFTS, s)
  const toppings = def.orders.filter((t) => venue.menu[t])
  const rush = rushCounts(0).counts
  const boss = s === RUSH_HOUR
  return {
    round,
    venue,
    robots: boss ? 0 : Math.round(levelCurve(round, COCOA_CURVES.robots)) + 2,
    walk: levelCurve(round, COCOA_CURVES.walk),
    gap: levelCurve(round, COCOA_CURVES.gap) + (boss ? 60 : 0),
    push: levelCurve(round, COCOA_CURVES.push),
    empty: levelCurve(round, COCOA_CURVES.empty),
    thirst: levelCurve(round, COCOA_CURVES.thirst),
    toppings: toppings.length ? toppings : ['plain'],
    topped: toppings.length > 1 ? Math.min(0.55, 0.3 + 0.05 * (s - 1)) : 0,
    patrons: def.patrons.filter((p) => !PATRONS[p].boss),
    rush,
    news: boss ? null : def.news,
  }
}

/** A patron's order: plain, or one of the round's toppings. A VIP always wants a topped drink. */
export function pickOrder(
  rng: () => number,
  rules: ShiftRules,
  vip = false,
): Topping {
  const fancy = rules.toppings.filter((t) => t !== 'plain')
  if (!fancy.length) return 'plain'
  if (!vip && rng() >= rules.topped) return 'plain'
  return fancy[Math.floor(rng() * fancy.length)]!
}

/** A patron from the shift's pool, by weight. */
export function pickPatron(rng: () => number, rules: ShiftRules): PatronId {
  const pool = rules.patrons
  if (pool.length === 1) return pool[0]!
  const total = pool.reduce((sum, p) => sum + PATRONS[p].weight, 0)
  let roll = rng() * total
  for (const p of pool) {
    roll -= PATRONS[p].weight
    if (roll < 0) return p
  }
  return pool[pool.length - 1]!
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

// --- boardwalk counters ---------------------------------------------------------------------

/** A full mug's speed, as a share of its counter's start speed, after sliding `travelled` px. */
export function mugPace(counter: CounterDef, travelled: number): number {
  const friction = COUNTER_FEATURES[counter.feature].friction
  return Math.max(MIN_MUG_SPEED, 1 - friction * Math.max(0, travelled))
}

/** Whether a full mug at `x` going at `pace` sinks into the sand through the counter's gap. */
export function sinksAt(counter: CounterDef, x: number, pace: number): boolean {
  const gap = counter.gap
  return !!gap && x >= gap.x && x < gap.x + gap.w && pace < GAP_SPEED
}

/**
 * Whether a mug poured at `startX` sinks before it reaches `targetX` (so the robot there can't be
 * served yet: wait for it to cross the gap).
 */
export function sinksBefore(
  counter: CounterDef,
  startX: number,
  targetX: number,
): boolean {
  const gap = counter.gap
  if (!gap || targetX >= gap.x + gap.w) return false
  return mugPace(counter, startX - gap.x) < GAP_SPEED
}

// --- Marshmallow Mix-up ---------------------------------------------------------------------

/** The swaps of a Mix-up shuffle: pairs of cup slots, never a cup with itself. */
export function shuffleSwaps(
  rng: () => number,
  cups: number,
  count: number,
): [number, number][] {
  const swaps: [number, number][] = []
  for (let i = 0; i < count; i++) {
    const a = Math.floor(rng() * cups)
    const b = (a + 1 + Math.floor(rng() * (cups - 1))) % cups
    swaps.push([a, b])
  }
  return swaps
}

/** Where the marshmallow's cup ends up after the swaps. */
export function followCup(start: number, swaps: [number, number][]): number {
  let at = start
  for (const [a, b] of swaps) at = at === a ? b : at === b ? a : at
  return at
}

// --- the Cafe Fund and the save -------------------------------------------------------------

export function upgradePrice(id: UpgradeId): number {
  return UPGRADES.find((u) => u.id === id)!.price
}

export type TourSave = {
  /** The venue to start at. */
  venue: number
  score: number
  lives: number
  fund: number
  upgrades: UpgradeId[]
}

/** What Cocoa Counter keeps on this device: golden mugs for good, and a tour to continue. */
export type CocoaSave = {
  v: 1
  golden: VenueId[]
  tour: TourSave | null
}

const VENUE_IDS = new Set<string>(VENUES.map((v) => v.id))
const UPGRADE_IDS = new Set<string>(UPGRADES.map((u) => u.id))

const count = (n: unknown, max: number): n is number =>
  typeof n === 'number' && Number.isInteger(n) && n >= 0 && n <= max

/** A stored save, validated (it is untrusted), or null. */
export function readCocoaSave(raw: unknown): CocoaSave | null {
  if (!raw || typeof raw !== 'object') return null
  const r = raw as Record<string, unknown>
  if (r.v !== 1 || !Array.isArray(r.golden)) return null
  const golden = [
    ...new Set(
      r.golden.filter(
        (g): g is VenueId => typeof g === 'string' && VENUE_IDS.has(g),
      ),
    ),
  ]
  let tour: TourSave | null = null
  const t = r.tour as Record<string, unknown> | null | undefined
  if (
    t &&
    typeof t === 'object' &&
    count(t.venue, VENUES.length - 1) &&
    count(t.score, 2_000_000) &&
    count(t.lives, 9) &&
    t.lives >= 1 &&
    count(t.fund, 9999) &&
    Array.isArray(t.upgrades)
  )
    tour = {
      venue: t.venue,
      score: t.score,
      lives: t.lives,
      fund: t.fund,
      upgrades: [
        ...new Set(
          t.upgrades.filter(
            (u): u is UpgradeId => typeof u === 'string' && UPGRADE_IDS.has(u),
          ),
        ),
      ],
    }
  return { v: 1, golden, tour }
}
