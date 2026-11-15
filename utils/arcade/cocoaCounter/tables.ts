// /utils/arcade/cocoaCounter/tables.ts
//
// Cocoa Counter depth pass (conductor kr-arcade/t-122, t-123): the cafe tour as data. Pours
// (tap / hold / hold-and-B), drinks, counter features, patrons, venues with their shifts, rush-hour
// regulars and bonus rounds, the Cafe Fund shop, the Endless Shift unlock ladder and the rush steps
// that keep climbing after the old round-12 plateau. Later slices add rows here (venues 3-6, counter
// features, the rest of the roster) rather than branches in the game.

/** How an order is poured: tap A, hold A, or hold A and press B. Each venue's menu names the drinks. */
export type Topping = 'plain' | 'marshmallow' | 'swirl'

export type DrinkId = 'cocoa' | 'marshmallow' | 'peppermint' | 'berry' | 'mango'

/** A counter's surface: how a mug travels along it. */
export type CounterFeatureId = 'polished' | 'boardwalk'

export type PatronId =
  | 'thirsty'
  | 'toddler'
  | 'trio'
  | 'surfer'
  | 'seagull'
  | 'vip'
  | 'golem'
  | 'crab'

export type VenueId = 'snowdrop' | 'seaside'

export type BossId = 'golem' | 'crab'

export type BonusId = 'mixup' | 'coconuts'

export type UpgradeId = 'pour' | 'mop' | 'sticky' | 'cozy' | 'card'

export type ToppingDef = {
  id: Topping
  /** The Snowdrop drink this pour makes (the guide's name for it). */
  name: string
  /** How to pour it. */
  pour: string
  /** The order bubble's colour-coded rim at the Snowdrop Cafe. */
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

export type DrinkDef = {
  id: DrinkId
  name: string
  /** The order bubble's colour-coded rim. */
  rim: string
}

export const DRINKS: Record<DrinkId, DrinkDef> = {
  cocoa: { id: 'cocoa', name: 'COCOA', rim: '#b45309' },
  marshmallow: {
    id: 'marshmallow',
    name: 'MARSHMALLOW COCOA',
    rim: '#f472b6',
  },
  peppermint: { id: 'peppermint', name: 'PEPPERMINT SWIRL', rim: '#2dd4bf' },
  berry: { id: 'berry', name: 'BERRY SMOOTHIE', rim: '#c026d3' },
  mango: { id: 'mango', name: 'MANGO SMOOTHIE', rim: '#f59e0b' },
}

export type CounterFeature = {
  id: CounterFeatureId
  name: string
  /** Full-mug slide speed, times the cafe's base. */
  mugSpeed: number
  /** Empty and handed-back mug speed, times the round's curve. */
  emptySpeed: number
  /** How much speed a full mug loses per pixel it slides (0 for a polished counter). */
  friction: number
}

export const COUNTER_FEATURES: Record<CounterFeatureId, CounterFeature> = {
  polished: {
    id: 'polished',
    name: 'POLISHED COUNTER',
    mugSpeed: 1,
    emptySpeed: 1,
    friction: 0,
  },
  boardwalk: {
    id: 'boardwalk',
    name: 'BOARDWALK COUNTER',
    mugSpeed: 1.05,
    emptySpeed: 1,
    friction: 1 / 380,
  },
}

/** A full mug must still be going this fast (times its counter's start) to clear a boardwalk gap. */
export const GAP_SPEED = 0.72
/** No mug slows below this share of its start speed. */
export const MIN_MUG_SPEED = 0.3

export type CounterDef = {
  feature: CounterFeatureId
  /** A gap in the boardwalk: full mugs that reach it too slowly sink into the sand. */
  gap?: { x: number; w: number }
}

export type PatronDef = {
  id: PatronId
  name: string
  /** A one-word name for the regular's card. */
  short: string
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
  /** How likely it is to be picked from a shift's pool. */
  weight: number
  /** Robots that walk in together, close behind each other. */
  group: number
  /** Drawn small (the toddler-bot). */
  small: boolean
  /** Mugs it always comes back for after the first. */
  refills: number
  /** Rides in fast on a wave before it starts to shuffle. */
  surfs: boolean
  /** Not a counter patron: it swoops over the counters (the seagull-bot). */
  flies: boolean
  /** Gold bubble, always a topped drink, fills a quarter of the Cozy meter. */
  vip: boolean
  /** A rush-hour regular, run by its boss table. */
  boss: boolean
}

const PATRON_BASE = {
  walk: 1,
  push: 1,
  drinkTicks: 70,
  tipChance: 0.22,
  tipPoints: 250,
  tipCoins: 1,
  stealsTips: false,
  weight: 1,
  group: 1,
  small: false,
  refills: 0,
  surfs: false,
  flies: false,
  vip: false,
  boss: false,
} as const

export const PATRONS: Record<PatronId, PatronDef> = {
  thirsty: {
    ...PATRON_BASE,
    id: 'thirsty',
    name: 'THIRSTY ROBOT',
    short: 'THIRSTY',
    tell: 'SHUFFLES UP THE COUNTER, BUBBLE FIRST',
    answer: 'STEADY POURS OF WHAT THE BUBBLE SAYS',
    weight: 3,
  },
  toddler: {
    ...PATRON_BASE,
    id: 'toddler',
    name: 'TODDLER-BOT',
    short: 'TODDLER',
    tell: 'SMALL AND QUICK; A MUG BARELY SLOWS IT',
    answer: 'TWO QUICK MUGS: IT ALWAYS WANTS SECONDS',
    walk: 1.5,
    push: 0.5,
    drinkTicks: 45,
    tipChance: 0.15,
    weight: 2,
    small: true,
    refills: 1,
  },
  trio: {
    ...PATRON_BASE,
    id: 'trio',
    name: 'THE TRIO',
    short: 'TRIO',
    tell: 'THREE FRIENDS WALKING CLOSE TOGETHER',
    answer: 'THREE POURS IN A ROW DOWN ONE COUNTER',
    tipChance: 0.18,
    group: 3,
  },
  surfer: {
    ...PATRON_BASE,
    id: 'surfer',
    name: 'SURFER-BOT',
    short: 'SURFER',
    tell: 'RIDES IN FAST ON A WAVE, THEN SLOWS',
    answer: 'POUR EARLY, FOR WHERE THE WAVE STOPS',
    weight: 2,
    tipChance: 0.25,
    surfs: true,
  },
  seagull: {
    ...PATRON_BASE,
    id: 'seagull',
    name: 'SEAGULL-BOT',
    short: 'SEAGULL',
    tell: 'ITS SHADOW CROSSES A COUNTER, THEN IT SWOOPS',
    answer: 'POUR AFTER THE SWOOP, NOT INTO IT',
    tipChance: 0.5,
    tipPoints: 150,
    flies: true,
  },
  vip: {
    ...PATRON_BASE,
    id: 'vip',
    name: 'VIP',
    short: 'VIP',
    tell: 'A GOLD ORDER BUBBLE, ALWAYS A FANCY DRINK',
    answer: 'HOLD TO TOP IT: A PERFECT SERVE IS A QUARTER METER',
    tipChance: 0.6,
    tipPoints: 500,
    tipCoins: 2,
    vip: true,
  },
  golem: {
    ...PATRON_BASE,
    id: 'golem',
    name: 'THE SNOW GOLEM REGULAR',
    short: 'GOLEM',
    tell: 'FILLS A COUNTER; HIS ARM WINDS UP TO LOB A SNOWBALL',
    answer: 'KEEP POURING WHAT HE ASKS; DODGE THE SNOWBALLS',
    tipChance: 0.01,
    boss: true,
  },
  crab: {
    ...PATRON_BASE,
    id: 'crab',
    name: 'CAPTAIN CRAB',
    short: 'CRAB',
    tell: 'CLICK-CLACK: HE SIDESTEPS TO ANOTHER COUNTER',
    answer: 'THREE BERRY SMOOTHIES WHILE HE STAYS ON ONE ROW',
    tipChance: 0.01,
    boss: true,
  },
}

export type ShiftDef = {
  /** Who walks in. */
  patrons: readonly PatronId[]
  /** What they may order. */
  orders: readonly Topping[]
  /** What is new, for the shift banner. */
  news: string
}

export type BossDef = {
  id: BossId
  name: string
  /** Mugs per phase. */
  hp: readonly number[]
  /** Points for seeing the regular home happy. */
  bonus: number
  /** Thirsty patrons who still walk in during the rush. */
  crowd: number
  intro: string
}

export const BOSSES: Record<BossId, BossDef> = {
  golem: {
    id: 'golem',
    name: 'THE SNOW GOLEM REGULAR',
    hp: [6, 4],
    bonus: 5000,
    crowd: 5,
    intro: 'HE WANTS A LOT OF COCOA. WATCH HIS ARM!',
  },
  crab: {
    id: 'crab',
    name: 'CAPTAIN CRAB',
    hp: [3, 3, 3],
    bonus: 8000,
    crowd: 5,
    intro: '3 BERRY SMOOTHIES ON ONE ROW, 3 TIMES!',
  },
}

export type BonusDef = {
  id: BonusId
  name: string
  lines: readonly string[]
}

export const BONUSES: Record<BonusId, BonusDef> = {
  mixup: {
    id: 'mixup',
    name: 'MARSHMALLOW MIX-UP',
    lines: [
      'ONE MUG HIDES THE MARSHMALLOW.',
      'WATCH THE SHUFFLE, THEN PICK IT WITH A.',
    ],
  },
  coconuts: {
    id: 'coconuts',
    name: 'CATCH THE COCONUTS',
    lines: [
      'CATCH FALLING COCONUTS IN THE MUG.',
      'GOLDEN ONES PAY INTO THE CAFE FUND.',
    ],
  },
}

export type VenueDef = {
  id: VenueId
  name: string
  tagline: string
  /** Four counters, top to bottom. */
  counters: readonly [CounterDef, CounterDef, CounterDef, CounterDef]
  /** The drink each pour makes here; a pour with no drink is never ordered. */
  menu: Partial<Record<Topping, DrinkId>>
  /** The patrons this venue introduces. */
  patrons: readonly PatronId[]
  shifts: readonly [ShiftDef, ShiftDef, ShiftDef, ShiftDef]
  boss: BossId
  bonus: BonusId
  /** The golden mug for a no-spill shift here. */
  golden: string
}

const POLISHED: CounterDef = { feature: 'polished' }

export const VENUES: readonly VenueDef[] = [
  {
    id: 'snowdrop',
    name: 'SNOWDROP CAFE',
    tagline: 'COCOA FOR A SNOWY NIGHT',
    counters: [POLISHED, POLISHED, POLISHED, POLISHED],
    menu: { plain: 'cocoa', marshmallow: 'marshmallow', swirl: 'peppermint' },
    patrons: ['thirsty', 'toddler', 'trio'],
    shifts: [
      {
        patrons: ['thirsty', 'toddler'],
        orders: ['plain', 'marshmallow'],
        news: 'TODDLER-BOTS: QUICK, AND THEY WANT SECONDS',
      },
      {
        patrons: ['thirsty', 'toddler', 'trio'],
        orders: ['plain', 'marshmallow'],
        news: 'THE TRIO: THREE POURS DOWN ONE COUNTER',
      },
      {
        patrons: ['thirsty', 'toddler', 'trio', 'vip'],
        orders: ['plain', 'marshmallow', 'swirl'],
        news: 'A VIP! GOLD BUBBLE: HOLD TO TOP IT',
      },
      {
        patrons: ['thirsty', 'toddler', 'trio', 'vip'],
        orders: ['plain', 'marshmallow', 'swirl'],
        news: 'THE LAST SHIFT BEFORE THE RUSH',
      },
    ],
    boss: 'golem',
    bonus: 'mixup',
    golden: 'THE SNOWFLAKE MUG',
  },
  {
    id: 'seaside',
    name: 'SEASIDE SMOOTHIE SHACK',
    tagline: 'SMOOTHIES ON THE SUMMER BOARDWALK',
    counters: [
      { feature: 'boardwalk', gap: { x: 196, w: 14 } },
      { feature: 'boardwalk', gap: { x: 110, w: 14 } },
      { feature: 'boardwalk', gap: { x: 178, w: 14 } },
      { feature: 'boardwalk', gap: { x: 70, w: 14 } },
    ],
    menu: { plain: 'berry', marshmallow: 'mango' },
    patrons: ['surfer', 'seagull'],
    shifts: [
      {
        patrons: ['thirsty', 'surfer'],
        orders: ['plain', 'marshmallow'],
        news: 'MIND THE GAPS: SLOW MUGS SINK IN THE SAND',
      },
      {
        patrons: ['thirsty', 'surfer', 'seagull'],
        orders: ['plain', 'marshmallow'],
        news: 'SEAGULL-BOTS: POUR AFTER THE SWOOP',
      },
      {
        patrons: ['thirsty', 'toddler', 'trio', 'surfer', 'seagull', 'vip'],
        orders: ['plain', 'marshmallow'],
        news: 'EVERYONE CAME TO THE BEACH',
      },
      {
        patrons: ['thirsty', 'toddler', 'trio', 'surfer', 'seagull', 'vip'],
        orders: ['plain', 'marshmallow'],
        news: 'THE LAST SHIFT BEFORE THE RUSH',
      },
    ],
    boss: 'crab',
    bonus: 'coconuts',
    golden: 'THE SEASHELL MUG',
  },
]

export type UpgradeDef = {
  id: UpgradeId
  name: string
  does: string
  price: number
}

/** The Cafe Fund shop between venues: tips earned in play buy these (never real money). */
export const UPGRADES: readonly UpgradeDef[] = [
  { id: 'pour', name: 'FASTER POUR', does: 'EVERY POUR IS QUICKER', price: 6 },
  {
    id: 'mop',
    name: 'A THIRD MOP',
    does: 'THE MOP-BOT MOPS 3 SPILLS',
    price: 5,
  },
  {
    id: 'sticky',
    name: 'STICKY COUNTER',
    does: 'A MUG PUSHES ROBOTS BACK FURTHER',
    price: 6,
  },
  {
    id: 'cozy',
    name: 'BIGGER COZY METER',
    does: 'SING FOR 8 SECONDS',
    price: 8,
  },
  {
    id: 'card',
    name: "REGULAR'S CARD",
    does: "SHOWS EACH SHIFT'S PATRONS",
    price: 4,
  },
]

/** Pour ticks with the faster pour; how much further a sticky counter pushes. */
export const FAST_POUR_TICKS = 7
export const STICKY_PUSH = 1.35
export const BIG_SING_TICKS = 480

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
  { kind: 'patron', patron: 'toddler', banner: 'NEW: TODDLER-BOTS' },
  { kind: 'patron', patron: 'trio', banner: 'NEW: THE TRIO' },
  { kind: 'patron', patron: 'surfer', banner: 'NEW: SURFER-BOTS' },
  { kind: 'patron', patron: 'seagull', banner: 'NEW: SEAGULL-BOTS' },
  { kind: 'patron', patron: 'vip', banner: 'NEW: VIPS' },
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
