// /utils/arcade/pipePals/districts.ts
//
// Pipe Pals' campaign as data (conductor kr-arcade/t-024, spec: conductor
// projects/kr-arcade/depth-pass/ASSESSMENT.md section 1). Each district has its
// own board, roster, special objective phase, bonus-round twist and look. The
// game reads these; nothing district-specific lives in its update loop.

import type { RampName } from '../snes'

export const W = 448
export const H = 336
/** Floors sit 66 px apart; a pal's jump clears one floor. */
export const FLOOR_Y = [310, 244, 178, 112] as const
export const PHASES_PER_DISTRICT = 5
/** The district's special objective phase. */
export const SPECIAL_PHASE = 3

export type LedgeKind =
  'brick' | 'vine' | 'soap' | 'ice' | 'crumble' | 'conveyor' | 'gear'
export type Segment = {
  x0: number
  y: number
  x1: number
  kind?: LedgeKind
  /** Conveyors carry riders this way (px per tick). */
  dir?: number
}
/** A ledge that glides back and forth between minX and maxX (its left edge). */
export type Lift = {
  y: number
  minX: number
  maxX: number
  w: number
  period: number
  kind?: LedgeKind
  /** Where in its swing it starts, 0..1. */
  phase?: number
}
/** A spot on a ledge (y is the ledge top), for vents, icicles and special-phase props. */
export type Spot = { x: number; y: number }

export type Kind =
  | 'crawler'
  | 'crab'
  | 'flea'
  | 'knight'
  | 'moth'
  | 'puppet'
  | 'sock'
  | 'frost'
  | 'snowball'
  | 'gearbug'
  | 'beetle'
export type SpecialKind =
  | 'first-fix'
  | 'seedling-rescue'
  | 'lost-socks'
  | 'thaw-run'
  | 'pressure-valves'
  | 'valve-routing'
  | 'pump-station'
  | 'lights-out'
export type BonusTwist =
  | 'static'
  | 'sprinkler'
  | 'bubbles'
  | 'ice'
  | 'steam'
  | 'gears'
  | 'underwater'
  | 'skill'
export type SceneId =
  | 'city'
  | 'greenhouse'
  | 'laundry'
  | 'cold'
  | 'boiler'
  | 'clock'
  | 'flooded'
  | 'storm'
  | 'golden'
export type BossId = 'big-shell' | 'thermostat' | 'clog-king'

export type District = {
  id: string
  number: number
  shift: 1 | 2 | 3
  name: string
  tagline: string
  segments: Segment[]
  lifts?: Lift[]
  /** Steam vents on ledge tops: they launch whoever stands in the puff. */
  vents?: Spot[]
  /** Where icicles grow, under these ledge spots. */
  icicles?: Spot[]
  /** The cuckoo pops out of the clock on the hour. */
  cuckoo?: boolean
  /** Props for the special phase (leaks, blocks, gauges, wheels...). */
  spots?: Spot[]
  /** Ember sparks come this much more often here. */
  emberRate?: number
  /** Flood water rising and draining on a cycle (y of the surface, low and high). */
  water?: { low: number; high: number; period: number }
  /** Pipe eels strike out of the top pipes. */
  eels?: boolean
  /** Bubble jellies drift up from the flooded floor. */
  jellies?: boolean
  /** A dark board: only lamps, the pal's own glow and lightning light it. */
  dark?: boolean
  /** Lamps on ledges (the dark board's light pools). */
  lamps?: Spot[]
  /** Mimic coins sit among the ledges from this phase on. */
  mimicsFrom?: number
  /** Under a gap in the 244 row, so a pal can bump it from the floor. */
  kindBlock: { x: number; y: number }
  /** `from` is the phase within the district (1..5) a kind first appears. */
  roster: ReadonlyArray<{ kind: Kind; from: number; weight: number }>
  special: SpecialKind
  bonus: BonusTwist
  boss?: BossId
  scene: SceneId
  ledge: RampName
  ground: RampName
}

const FLOOR: Segment = { x0: 0, x1: W, y: 310 }

export const DISTRICTS: readonly District[] = [
  {
    id: 'rooftop',
    number: 1,
    shift: 1,
    name: 'ROOFTOP RESERVOIR',
    tagline: 'THE WATER TANKS ARE GRUMBLING',
    segments: [
      FLOOR,
      { x0: 0, x1: 170, y: 244 },
      { x0: 278, x1: W, y: 244 },
      { x0: 0, x1: 92, y: 178 },
      { x0: 138, x1: 310, y: 178 },
      { x0: 356, x1: W, y: 178 },
      { x0: 0, x1: 176, y: 112 },
      { x0: 272, x1: W, y: 112 },
    ],
    kindBlock: { x: W / 2 - 12, y: 262 },
    roster: [
      { kind: 'crawler', from: 1, weight: 4 },
      { kind: 'crab', from: 2, weight: 2 },
    ],
    special: 'first-fix',
    bonus: 'static',
    scene: 'city',
    ledge: 'teal',
    ground: 'purple',
  },
  {
    id: 'greenhouse',
    number: 2,
    shift: 1,
    name: 'GREENHOUSE MAINS',
    tagline: 'MIND THE VINES. THEY SAG.',
    segments: [
      FLOOR,
      { x0: 0, x1: 160, y: 244, kind: 'vine' },
      { x0: 288, x1: W, y: 244, kind: 'vine' },
      { x0: 0, x1: 100, y: 178 },
      { x0: 140, x1: 308, y: 178 },
      { x0: 348, x1: W, y: 178 },
      { x0: 0, x1: 150, y: 112, kind: 'vine' },
      { x0: 298, x1: W, y: 112, kind: 'vine' },
    ],
    // A glass-house trolley that ferries pals across the top gap.
    lifts: [{ y: 112, minX: 150, maxX: 234, w: 64, period: 60 * 6 }],
    kindBlock: { x: W / 2 - 12, y: 262 },
    roster: [
      { kind: 'crawler', from: 1, weight: 3 },
      { kind: 'crab', from: 1, weight: 1 },
      { kind: 'flea', from: 1, weight: 2 },
      { kind: 'knight', from: 2, weight: 2 },
    ],
    special: 'seedling-rescue',
    bonus: 'sprinkler',
    scene: 'greenhouse',
    ledge: 'leaf',
    ground: 'earth',
  },
  {
    id: 'suds',
    number: 3,
    shift: 1,
    name: 'SUDS WORKS',
    tagline: 'THE LAUNDRY BASEMENT IS BUBBLING OVER',
    segments: [
      FLOOR,
      { x0: 0, x1: 176, y: 244, kind: 'soap' },
      { x0: 272, x1: W, y: 244, kind: 'soap' },
      { x0: 0, x1: 92, y: 178 },
      { x0: 138, x1: 310, y: 178, kind: 'soap' },
      { x0: 356, x1: W, y: 178 },
      { x0: 0, x1: 150, y: 112 },
      { x0: 298, x1: W, y: 112 },
    ],
    kindBlock: { x: W / 2 - 12, y: 262 },
    roster: [
      { kind: 'crawler', from: 1, weight: 2 },
      { kind: 'crab', from: 1, weight: 1 },
      { kind: 'flea', from: 1, weight: 1 },
      { kind: 'knight', from: 1, weight: 1 },
      { kind: 'moth', from: 1, weight: 2 },
      { kind: 'puppet', from: 2, weight: 2 },
    ],
    special: 'lost-socks',
    bonus: 'bubbles',
    boss: 'big-shell',
    scene: 'laundry',
    ledge: 'sky',
    ground: 'steel',
  },
  {
    id: 'cold',
    number: 4,
    shift: 2,
    name: 'COLD STORAGE',
    tagline: 'EVERY LEDGE IS ICE. SLOW DOWN EARLY.',
    segments: [
      FLOOR,
      { x0: 0, x1: 170, y: 244, kind: 'ice' },
      { x0: 278, x1: W, y: 244, kind: 'ice' },
      { x0: 0, x1: 96, y: 178, kind: 'ice' },
      { x0: 140, x1: 308, y: 178, kind: 'ice' },
      { x0: 352, x1: W, y: 178, kind: 'ice' },
      { x0: 0, x1: 160, y: 112, kind: 'ice' },
      { x0: 288, x1: W, y: 112, kind: 'ice' },
    ],
    icicles: [
      { x: 60, y: 178 },
      { x: 224, y: 178 },
      { x: 400, y: 178 },
      { x: 100, y: 112 },
      { x: 340, y: 112 },
    ],
    // Frozen robots for Thaw Run, each on a ledge with a ledge below it.
    spots: [
      { x: 120, y: 244 },
      { x: 300, y: 178 },
      { x: 400, y: 112 },
    ],
    kindBlock: { x: W / 2 - 12, y: 262 },
    roster: [
      { kind: 'crawler', from: 1, weight: 2 },
      { kind: 'crab', from: 1, weight: 1 },
      { kind: 'knight', from: 1, weight: 1 },
      { kind: 'frost', from: 1, weight: 2 },
      { kind: 'snowball', from: 2, weight: 2 },
    ],
    special: 'thaw-run',
    bonus: 'ice',
    scene: 'cold',
    ledge: 'water',
    ground: 'steel',
  },
  {
    id: 'boiler',
    number: 5,
    shift: 2,
    name: 'BOILER WORKS',
    tagline: 'THE VENTS PUFF ON THE BEAT. RIDE THEM.',
    segments: [
      FLOOR,
      { x0: 0, x1: 170, y: 244 },
      { x0: 278, x1: W, y: 244 },
      { x0: 0, x1: 110, y: 178 },
      { x0: 150, x1: 298, y: 178, kind: 'crumble' },
      { x0: 338, x1: W, y: 178 },
      { x0: 0, x1: 170, y: 112 },
      { x0: 278, x1: W, y: 112 },
    ],
    vents: [
      { x: 190, y: 310 },
      { x: 258, y: 310 },
      { x: 60, y: 178 },
      { x: 390, y: 178 },
    ],
    // Pressure gauges for Pressure Valves.
    spots: [
      { x: 90, y: 244 },
      { x: 360, y: 244 },
      { x: 100, y: 178 },
      { x: 80, y: 112 },
    ],
    emberRate: 1.5,
    kindBlock: { x: W / 2 - 12, y: 262 },
    roster: [
      { kind: 'crawler', from: 1, weight: 2 },
      { kind: 'crab', from: 1, weight: 2 },
      { kind: 'flea', from: 1, weight: 1 },
      { kind: 'moth', from: 1, weight: 1 },
      { kind: 'frost', from: 2, weight: 1 },
    ],
    special: 'pressure-valves',
    bonus: 'steam',
    scene: 'boiler',
    ledge: 'rust',
    ground: 'earth',
  },
  {
    id: 'clock',
    number: 6,
    shift: 2,
    name: 'CLOCKWORK WATER TOWER',
    tagline: 'THE GEARS NEVER STOP. NEITHER DO YOU.',
    segments: [
      FLOOR,
      { x0: 0, x1: 150, y: 244, kind: 'conveyor', dir: 0.6 },
      { x0: 298, x1: W, y: 244, kind: 'conveyor', dir: -0.6 },
      { x0: 0, x1: 100, y: 178 },
      { x0: 140, x1: 308, y: 178 },
      { x0: 348, x1: W, y: 178 },
      { x0: 0, x1: 170, y: 112 },
      { x0: 278, x1: W, y: 112 },
    ],
    lifts: [
      { y: 244, minX: 150, maxX: 234, w: 64, period: 60 * 5, kind: 'gear' },
      {
        y: 112,
        minX: 170,
        maxX: 214,
        w: 64,
        period: 60 * 4,
        kind: 'gear',
        phase: 0.5,
      },
    ],
    cuckoo: true,
    // Route wheels for Valve Routing: bump one to switch the pipe critters use.
    spots: [
      { x: 60, y: 178 },
      { x: 390, y: 178 },
    ],
    kindBlock: { x: W / 2 - 12, y: 262 },
    roster: [
      { kind: 'crawler', from: 1, weight: 2 },
      { kind: 'knight', from: 1, weight: 1 },
      { kind: 'puppet', from: 1, weight: 1 },
      { kind: 'gearbug', from: 1, weight: 3 },
      { kind: 'snowball', from: 3, weight: 1 },
    ],
    special: 'valve-routing',
    bonus: 'gears',
    boss: 'thermostat',
    scene: 'clock',
    ledge: 'gold',
    ground: 'steel',
  },
  {
    id: 'flooded',
    number: 7,
    shift: 3,
    name: 'FLOODED MAINS',
    tagline: 'THE TIDE COMES IN. KICK THEM BEFORE THEY FLOAT.',
    segments: [
      FLOOR,
      { x0: 0, x1: 170, y: 244 },
      { x0: 278, x1: W, y: 244 },
      { x0: 0, x1: 100, y: 178 },
      { x0: 140, x1: 308, y: 178 },
      { x0: 348, x1: W, y: 178 },
      { x0: 0, x1: 170, y: 112 },
      { x0: 278, x1: W, y: 112 },
    ],
    water: { low: 334, high: 222, period: 60 * 21 },
    eels: true,
    jellies: true,
    // Pump buttons for Pump Station, pressed 1-2-3.
    spots: [
      { x: 80, y: 244 },
      { x: 296, y: 178 },
      { x: 400, y: 112 },
    ],
    kindBlock: { x: W / 2 - 12, y: 262 },
    roster: [
      { kind: 'crawler', from: 1, weight: 2 },
      { kind: 'crab', from: 1, weight: 1 },
      { kind: 'knight', from: 1, weight: 1 },
      { kind: 'flea', from: 1, weight: 1 },
      { kind: 'gearbug', from: 2, weight: 1 },
    ],
    special: 'pump-station',
    bonus: 'underwater',
    scene: 'flooded',
    ledge: 'water',
    ground: 'steel',
  },
  {
    id: 'storm',
    number: 8,
    shift: 3,
    name: 'STORM DRAIN AT MIDNIGHT',
    tagline: 'TRUST THE LAMPS. WATCH FOR THE LIGHTNING.',
    segments: [
      FLOOR,
      { x0: 0, x1: 160, y: 244 },
      { x0: 288, x1: W, y: 244 },
      { x0: 0, x1: 96, y: 178 },
      { x0: 140, x1: 308, y: 178 },
      { x0: 352, x1: W, y: 178 },
      { x0: 0, x1: 176, y: 112 },
      { x0: 272, x1: W, y: 112 },
    ],
    dark: true,
    lamps: [
      { x: 60, y: 244 },
      { x: 400, y: 244 },
      { x: 150, y: 178 },
      { x: 420, y: 112 },
    ],
    mimicsFrom: 2,
    kindBlock: { x: W / 2 - 12, y: 262 },
    roster: [
      { kind: 'crawler', from: 1, weight: 2 },
      { kind: 'crab', from: 1, weight: 1 },
      { kind: 'knight', from: 1, weight: 1 },
      { kind: 'moth', from: 1, weight: 1 },
      { kind: 'gearbug', from: 1, weight: 1 },
      { kind: 'beetle', from: 1, weight: 3 },
    ],
    special: 'lights-out',
    bonus: 'skill',
    boss: 'clog-king',
    scene: 'storm',
    ledge: 'purple',
    ground: 'night',
  },
]

/**
 * The secret ninth district: a golden mirror of the rooftop, opened by all eight golden valves. Every
 * critter, the fastest pace, coins everywhere, and the true ending after it.
 */
export const GOLDEN_MAIN: District = {
  id: 'golden',
  number: 9,
  shift: 3,
  name: 'THE GOLDEN MAIN',
  tagline: 'ALL EIGHT VALVES TURNED. THE CITY GLOWS.',
  segments: [
    FLOOR,
    { x0: 0, x1: 170, y: 244 },
    { x0: 278, x1: W, y: 244 },
    { x0: 0, x1: 92, y: 178 },
    { x0: 138, x1: 310, y: 178 },
    { x0: 356, x1: W, y: 178 },
    { x0: 0, x1: 176, y: 112 },
    { x0: 272, x1: W, y: 112 },
  ].map((s) => ({ ...s, x0: W - s.x1, x1: W - s.x0 })),
  kindBlock: { x: W / 2 - 12, y: 262 },
  roster: [
    { kind: 'crawler', from: 1, weight: 2 },
    { kind: 'crab', from: 1, weight: 2 },
    { kind: 'flea', from: 1, weight: 1 },
    { kind: 'knight', from: 1, weight: 1 },
    { kind: 'moth', from: 1, weight: 1 },
    { kind: 'puppet', from: 1, weight: 1 },
    { kind: 'frost', from: 1, weight: 1 },
    { kind: 'gearbug', from: 1, weight: 1 },
    { kind: 'beetle', from: 1, weight: 1 },
  ],
  special: 'first-fix',
  bonus: 'static',
  scene: 'golden',
  ledge: 'gold',
  ground: 'gold',
}

export type Step =
  | { kind: 'phase'; phase: number }
  | { kind: 'boss'; boss: BossId }
  | { kind: 'bonus' }
  | { kind: 'ending'; trueEnding: boolean }
  | { kind: 'workshop' }

/** A district's running order: five phases, its boss if it has one, its bonus round, the Workshop. */
export function districtSteps(d: District): Step[] {
  const steps: Step[] = []
  for (let p = 1; p <= PHASES_PER_DISTRICT; p++)
    steps.push({ kind: 'phase', phase: p })
  if (d.boss) steps.push({ kind: 'boss', boss: d.boss })
  steps.push({ kind: 'bonus' })
  // The campaign ends after the Night Shift's finale (or, for the true ending, the Golden Main).
  if (d.boss === 'clog-king' || d.id === 'golden')
    steps.push({ kind: 'ending', trueEnding: d.id === 'golden' })
  steps.push({ kind: 'workshop' })
  return steps
}

/** The kinds a district phase releases, and the one making its debut there (it leads the queue). */
export function rosterFor(
  d: District,
  phase: number,
): { kinds: Kind[]; debut: Kind | null } {
  const open = d.roster.filter((r) => r.from <= phase)
  const seen = earlier(d)
  const debut =
    d.roster.find((r) => r.from === phase && !seen.includes(r.kind))?.kind ??
    null
  return { kinds: open.map((r) => r.kind), debut }
}

/** Kinds that already appeared in an earlier district. */
function earlier(d: District): Kind[] {
  return DISTRICTS.filter((o) => o.number < d.number).flatMap((o) =>
    o.roster.map((r) => r.kind),
  )
}

/** Wraps past the last authored district, so a long run keeps cycling (harder each lap). */
export function districtAt(index: number): { district: District; lap: number } {
  return {
    district: DISTRICTS[index % DISTRICTS.length]!,
    lap: Math.floor(index / DISTRICTS.length),
  }
}

/** The lift's left edge at a tick: an eased back-and-forth glide. */
export function liftX(lift: Lift, tick: number): number {
  const f =
    0.5 - 0.5 * Math.cos(2 * Math.PI * (tick / lift.period + (lift.phase ?? 0)))
  return lift.minX + (lift.maxX - lift.minX) * f
}

// --- the Workshop -------------------------------------------------------------------------

export type ShopItem = 'pal' | 'kind' | 'tool' | 'lucky' | 'hint' | 'done'
export const SHOP_ITEMS: ReadonlyArray<{
  item: ShopItem
  label: string
  blurb: string
  price: number
}> = [
  { item: 'pal', label: 'EXTRA PAL', blurb: 'ONE MORE LIFE', price: 40 },
  {
    item: 'kind',
    label: 'KIND CHARGE',
    blurb: 'A FOURTH BLOCK CHARGE',
    price: 15,
  },
  {
    item: 'tool',
    label: 'STARTING TOOL',
    blurb: 'BEGIN WITH A TOOL',
    price: 12,
  },
  {
    item: 'lucky',
    label: 'LUCKY PIPE',
    blurb: 'TWO COINS PER KICK',
    price: 10,
  },
  {
    item: 'hint',
    label: 'VALVE HINT',
    blurb: 'EASES THE NEXT VALVE TEST',
    price: 8,
  },
  { item: 'done', label: 'BACK TO WORK', blurb: '', price: 0 },
]

/** Prices rise each shift (and each lap round the city). */
export function shopPrice(base: number, shift: number, lap: number): number {
  return Math.round(base * (1 + 0.5 * (shift - 1) + 0.75 * lap))
}

// --- special phases -----------------------------------------------------------------------

/** What a perfect special phase needs, for the golden valve (a hint eases it by one). */
export const VALVE_TESTS: Record<
  SpecialKind,
  { goal: number; label: string; short: string }
> = {
  'first-fix': { goal: 3, label: 'SEAL ALL 3 LEAKS', short: 'SEALED' },
  'seedling-rescue': { goal: 4, label: 'RESCUE 4 SEEDLINGS', short: 'SAVED' },
  'lost-socks': { goal: 3, label: 'MATCH 3 SOCK PAIRS', short: 'PAIRS' },
  'thaw-run': { goal: 3, label: 'FREE ALL 3 FROZEN PALS', short: 'FREED' },
  'pressure-valves': {
    goal: 4,
    label: 'LET NO GAUGE BURST',
    short: 'GAUGES OK',
  },
  'valve-routing': { goal: 4, label: 'BOWL A CHAIN OF 4', short: 'BEST CHAIN' },
  'pump-station': {
    goal: 3,
    label: 'PUMP 1-2-3 BEFORE THE FLOOD',
    short: 'PUMPS',
  },
  'lights-out': { goal: 4, label: 'RELIGHT ALL 4 LAMPS', short: 'LIT' },
}

/** Leaky joints for First Fix: on ledges, away from the pipes. */
export const LEAKS: ReadonlyArray<{ x: number; y: number }> = [
  { x: 60, y: 244 },
  { x: 292, y: 178 },
  { x: 380, y: 112 },
]

/** Potted seedlings for Seedling Rescue. */
export const SEEDLINGS: ReadonlyArray<{ x: number; y: number }> = [
  { x: 40, y: 244 },
  { x: 120, y: 244 },
  { x: 340, y: 244 },
  { x: 420, y: 244 },
  { x: 60, y: 112 },
  { x: 380, y: 112 },
]

export const SOCK_COLOURS = ['pink', 'gold', 'teal', 'purple'] as const
export type SockColour = (typeof SOCK_COLOURS)[number]
