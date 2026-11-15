// /utils/arcade/cocoaCounter/tables.ts
//
// Cocoa Counter depth pass, slice 1 (conductor kr-arcade/t-122): the cafe tour as data. Toppings
// (how each order is poured), counter features, patrons, venues, the Endless Shift unlock ladder
// and the rush steps that keep climbing after the old round-12 plateau. Later slices add rows
// here (venues 2-6, counter features, the rest of the roster) rather than branches in the game.

/** What goes on top of a mug, and so how it is poured: tap A, hold A, or hold A and press B. */
export type Topping = 'plain' | 'marshmallow' | 'swirl'

/** What an urn holds. Every counter pours its urn's drink; the order is the topping. */
export type DrinkBase = 'cocoa'

/** A counter's surface: how a mug travels along it. */
export type CounterFeatureId = 'polished'

export type PatronId = 'thirsty'

export type VenueId = 'snowdrop'

export type ToppingDef = {
  id: Topping
  /** The order as the bubble and the guide name it. */
  name: string
  /** How to pour it. */
  pour: string
  /** The order bubble's colour-coded rim. */
  rim: string
  /** Cozy meter filled by serving this order right. */
  cozy: number
  /** Points for serving this order right, before the Rush combo. */
  points: number
}

export const TOPPINGS: Record<Topping, ToppingDef> = {
  plain: {
    id: 'plain',
    name: 'COCOA',
    pour: 'TAP A',
    rim: '#b45309',
    cozy: 6,
    points: 50,
  },
  marshmallow: {
    id: 'marshmallow',
    name: 'MARSHMALLOW COCOA',
    pour: 'HOLD A',
    rim: '#f472b6',
    cozy: 9,
    points: 80,
  },
  swirl: {
    id: 'swirl',
    name: 'PEPPERMINT SWIRL',
    pour: 'HOLD A + PRESS B',
    rim: '#2dd4bf',
    cozy: 9,
    points: 80,
  },
}

export const TOPPING_ORDER: readonly Topping[] = [
  'plain',
  'marshmallow',
  'swirl',
]

export type DrinkDef = { id: DrinkBase; name: string }

export const DRINKS: Record<DrinkBase, DrinkDef> = {
  cocoa: { id: 'cocoa', name: 'COCOA' },
}

export type CounterFeature = {
  id: CounterFeatureId
  name: string
  /** Full-mug slide speed, times the cafe's base. */
  mugSpeed: number
  /** Empty and handed-back mug speed, times the round's curve. */
  emptySpeed: number
}

export const COUNTER_FEATURES: Record<CounterFeatureId, CounterFeature> = {
  polished: {
    id: 'polished',
    name: 'POLISHED COUNTER',
    mugSpeed: 1,
    emptySpeed: 1,
  },
}

export type CounterDef = { feature: CounterFeatureId; urn: DrinkBase }

export type PatronDef = {
  id: PatronId
  name: string
  /** What the player sees first (the guide's tell). */
  tell: string
  /** What it asks of the player. */
  answer: string
  /** Shuffle speed, times the round's curve. */
  walk: number
  /** How far a caught mug pushes it back, times the round's curve. */
  push: number
  drinkTicks: number
  tipChance: number
  tipPoints: number
  /** Coins a tip pays into the Cafe Fund. */
  tipCoins: number
  /** Walks off with a tip it reaches before the mug-bot does (the tip-stealing hook). */
  stealsTips: boolean
}

export const PATRONS: Record<PatronId, PatronDef> = {
  thirsty: {
    id: 'thirsty',
    name: 'THIRSTY ROBOT',
    tell: 'SHUFFLES UP THE COUNTER, BUBBLE FIRST',
    answer: 'STEADY POURS OF WHAT THE BUBBLE SAYS',
    walk: 1,
    push: 1,
    drinkTicks: 70,
    tipChance: 0.22,
    tipPoints: 250,
    tipCoins: 1,
    stealsTips: false,
  },
}

export type VenueDef = {
  id: VenueId
  name: string
  /** Four counters, top to bottom. */
  counters: readonly [CounterDef, CounterDef, CounterDef, CounterDef]
  patrons: readonly PatronId[]
}

const POLISHED_COCOA: CounterDef = { feature: 'polished', urn: 'cocoa' }

export const VENUES: readonly VenueDef[] = [
  {
    id: 'snowdrop',
    name: 'SNOWDROP CAFE',
    counters: [POLISHED_COCOA, POLISHED_COCOA, POLISHED_COCOA, POLISHED_COCOA],
    patrons: ['thirsty'],
  },
]

/** Endless Shift: the venue rotates every this many rounds. */
export const ROUNDS_PER_VENUE = 4

/** One rung of the Endless Shift ladder: something new each round until the roster is complete. */
export type Unlock =
  | { kind: 'patron'; patron: PatronId; banner: string }
  | { kind: 'topping'; topping: Topping; banner: string }

/** Rung i unlocks at round i + 1. Later slices append their patrons here. */
export const ENDLESS_LADDER: readonly Unlock[] = [
  { kind: 'patron', patron: 'thirsty', banner: 'COCOA ORDERS: TAP A' },
  {
    kind: 'topping',
    topping: 'marshmallow',
    banner: 'NEW ORDER! MARSHMALLOWS: HOLD A',
  },
  {
    kind: 'topping',
    topping: 'swirl',
    banner: 'NEW ORDER! PEPPERMINT: HOLD A + B',
  },
]

/** The round the old curves stopped climbing at. */
export const OLD_PLATEAU = 12

export type RushStepId = 'crowd' | 'pace' | 'orders' | 'arrivals' | 'empties'

/** Past the plateau every round adds one of these, in turn, on top of all the earlier ones. */
export const RUSH_STEPS: readonly { id: RushStepId; banner: string }[] = [
  { id: 'crowd', banner: 'RUSH! A BIGGER CROWD' },
  { id: 'pace', banner: 'RUSH! QUICKER FEET' },
  { id: 'orders', banner: 'RUSH! FANCIER ORDERS' },
  { id: 'arrivals', banner: 'RUSH! CLOSER ARRIVALS' },
  { id: 'empties', banner: 'RUSH! FASTER EMPTIES' },
]

/** What each rush step adds, and where it stops. */
export const RUSH = {
  /** The crowd has no limit: once every other step is maxed, each round brings more robots. */
  crowd: { step: 2, limit: Number.POSITIVE_INFINITY },
  pace: { step: 0.05, limit: 0.45 },
  orders: { step: 0.08, limit: 0.3 },
  arrivals: { step: -4, limit: -18 },
  empties: { step: 0.08, limit: 0.7 },
} as const satisfies Record<RushStepId, { step: number; limit: number }>

export const COZY = {
  max: 100,
  /** A caught empty. */
  empty: 3,
  /** A tip picked up. */
  tip: 12,
  juggle: 5,
  /** The Sing-along, in ticks (5 s). */
  singTicks: 300,
} as const

export const RUSH_COMBO = {
  /** Clean serves per multiplier step. */
  step: 4,
  max: 5,
} as const

/** A pour that ends within this many ticks of an empty being caught is a juggle. */
export const JUGGLE_WINDOW = 8
export const JUGGLE_POINTS = 200

/** Scores that award an extra mug-bot. */
export const EXTRA_MUG_BOTS: readonly number[] = [30_000, 80_000, 150_000]

/** Catching your own handed-back mug before it falls. */
export const HANDBACK_CATCH_POINTS = 25
