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

export type LedgeKind = 'brick' | 'vine' | 'soap'
export type Segment = { x0: number; x1: number; y: number; kind?: LedgeKind }
/** A ledge that glides back and forth between minX and maxX (its left edge). */
export type Lift = {
  y: number
  minX: number
  maxX: number
  w: number
  period: number
}

export type Kind =
  'crawler' | 'crab' | 'flea' | 'knight' | 'moth' | 'puppet' | 'sock'
export type SpecialKind = 'first-fix' | 'seedling-rescue' | 'lost-socks'
export type BonusTwist = 'static' | 'sprinkler' | 'bubbles'
export type SceneId = 'city' | 'greenhouse' | 'laundry'
export type BossId = 'big-shell'

export type District = {
  id: string
  number: number
  shift: 1 | 2 | 3
  name: string
  tagline: string
  segments: Segment[]
  lift?: Lift
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
    lift: { y: 112, minX: 150, maxX: 234, w: 64, period: 60 * 6 },
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
]

export type Step =
  | { kind: 'phase'; phase: number }
  | { kind: 'boss'; boss: BossId }
  | { kind: 'bonus' }
  | { kind: 'workshop' }

/** A district's running order: five phases, its boss if it has one, its bonus round, the Workshop. */
export function districtSteps(d: District): Step[] {
  const steps: Step[] = []
  for (let p = 1; p <= PHASES_PER_DISTRICT; p++)
    steps.push({ kind: 'phase', phase: p })
  if (d.boss) steps.push({ kind: 'boss', boss: d.boss })
  steps.push({ kind: 'bonus' }, { kind: 'workshop' })
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
  const f = 0.5 - 0.5 * Math.cos((2 * Math.PI * tick) / lift.period)
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
export const VALVE_TESTS: Record<SpecialKind, { goal: number; label: string }> =
  {
    'first-fix': { goal: 3, label: 'SEAL ALL 3 LEAKS' },
    'seedling-rescue': { goal: 4, label: 'RESCUE 4 SEEDLINGS' },
    'lost-socks': { goal: 3, label: 'MATCH 3 SOCK PAIRS' },
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
