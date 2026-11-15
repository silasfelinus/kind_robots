// /utils/arcade/lanternSwarm/zones.ts
//
// Lantern Swarm depth pass (conductor kr-arcade/t-093, t-094): the Long Night Festival as data.
// A zone is one Watch of the night: six stages (three formation stages, a Glow Stage, a remix and a
// Guardian). Each formation stage scripts its own entrance (groups, paths, fill order and entry
// fire), its formation layout, the dive shapes its moths may fly and its tuning, so stage 2 no
// longer flies stage 1's entrance and the difficulty lives here instead of in the update loop.
//
// The Watches run in order (WATCHES). A Watch with two zones is a fork: the Sky Chart lets the
// player pick a branch. Slice 2 adds the Evening fork, the Orchard Canopy and the River of Lights.
// Once the last Watch's Guardian floats home the night goes round again, one lap harder.

export const W = 224
export const H = 288

export type Kind =
  | 'moth'
  | 'luna'
  | 'queen'
  | 'escort'
  | 'cocoon'
  | 'sparker'
  | 'skimmer'
  | 'duster'
  | 'moonlet'
export type Pt = { x: number; y: number }

/** The four kinds of formation slot; every new moth borrows one of them. */
export type SlotKind = 'queen' | 'escort' | 'luna' | 'moth'
export const SLOT_OF: Record<Kind, SlotKind | null> = {
  queen: 'queen',
  escort: 'escort',
  luna: 'luna',
  moth: 'moth',
  cocoon: 'moth',
  sparker: 'luna',
  skimmer: 'luna',
  duster: 'luna',
  /** Moonlets hatch mid-flight and never take a place in the swarm. */
  moonlet: null,
}

const mirror = (path: readonly Pt[]): Pt[] =>
  path.map((p) => ({ x: W - p.x, y: p.y }))

const TOP_L: Pt[] = [
  { x: W / 2 - 10, y: -10 },
  { x: W / 2 - 10, y: 110 },
  { x: 50, y: 190 },
  { x: 28, y: 140 },
  { x: 64, y: 112 },
]
const SIDE_L: Pt[] = [
  { x: -10, y: 230 },
  { x: 70, y: 215 },
  { x: 120, y: 165 },
  { x: 96, y: 120 },
  { x: 54, y: 142 },
]
/** Down the left, a full loop-the-loop over the rooftops, then up to the swarm. */
const LOOP_L: Pt[] = [
  { x: 40, y: -10 },
  { x: 60, y: 120 },
  { x: 110, y: 200 },
  { x: 152, y: 172 },
  { x: 132, y: 128 },
  { x: 92, y: 150 },
  { x: 72, y: 112 },
]
/** In low from the side, a long glide under the swarm and a hook back up. */
const HOOK_L: Pt[] = [
  { x: -10, y: 150 },
  { x: 80, y: 182 },
  { x: 160, y: 192 },
  { x: 192, y: 142 },
  { x: 150, y: 110 },
]
/** Straight down the middle like a dropped ribbon, then a curl out to the side. */
const DROP_L: Pt[] = [
  { x: W / 2 - 18, y: -10 },
  { x: W / 2 - 18, y: 176 },
  { x: 70, y: 212 },
  { x: 38, y: 160 },
  { x: 62, y: 118 },
]
/** Zig-zagging down like a seed off a branch, then up into the canopy. */
const VINE_L: Pt[] = [
  { x: 20, y: -10 },
  { x: 92, y: 60 },
  { x: 30, y: 128 },
  { x: 112, y: 190 },
  { x: 156, y: 150 },
  { x: 112, y: 112 },
]
/** Low along the river from the side, then a rise up through the lights. */
const RIVER_L: Pt[] = [
  { x: -10, y: 222 },
  { x: 60, y: 232 },
  { x: 140, y: 222 },
  { x: 192, y: 176 },
  { x: 150, y: 120 },
]

export const PATHS = {
  topL: TOP_L,
  topR: mirror(TOP_L),
  sideL: SIDE_L,
  sideR: mirror(SIDE_L),
  loopL: LOOP_L,
  loopR: mirror(LOOP_L),
  hookL: HOOK_L,
  hookR: mirror(HOOK_L),
  dropL: DROP_L,
  dropR: mirror(DROP_L),
  vineL: VINE_L,
  vineR: mirror(VINE_L),
  riverL: RIVER_L,
  riverR: mirror(RIVER_L),
} as const satisfies Record<string, readonly Pt[]>
export type PathName = keyof typeof PATHS

/** The mirror twin of a path name (topL <-> topR). */
export function mirrorPath(name: PathName): PathName {
  const base = name.slice(0, -1)
  return (name.endsWith('L') ? `${base}R` : `${base}L`) as PathName
}

// --- formation layouts and fill orders ---------------------------------------------------------

export type Slot = { row: number; col: number }
export type Layout = Record<
  SlotKind,
  ReadonlyArray<{ row: number; cols: readonly number[] }>
>

/** Formation grids (10 columns, 5 rows); each holds 4 queens, 4 escorts, 12 lunas and 20 moths. */
export const LAYOUTS = {
  /** The classic block: escorts tucked right under the queens. */
  classic: {
    queen: [{ row: 0, cols: [3, 4, 5, 6] }],
    escort: [{ row: 1, cols: [3, 4, 5, 6] }],
    luna: [
      { row: 1, cols: [1, 2, 7, 8] },
      { row: 2, cols: [1, 2, 3, 4, 5, 6, 7, 8] },
    ],
    moth: [
      { row: 3, cols: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9] },
      { row: 4, cols: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9] },
    ],
  },
  /** Two rooftop wings: queens split to the eaves with an escort on each side. */
  eaves: {
    queen: [{ row: 0, cols: [1, 2, 7, 8] }],
    escort: [{ row: 0, cols: [0, 3, 6, 9] }],
    luna: [
      { row: 1, cols: [0, 1, 2, 3, 6, 7, 8, 9] },
      { row: 2, cols: [1, 2, 7, 8] },
    ],
    moth: [
      { row: 2, cols: [3, 4, 5, 6] },
      { row: 3, cols: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9] },
      { row: 4, cols: [2, 3, 4, 5, 6, 7] },
    ],
  },
  /** A lantern arch: the swarm hangs in a curve, its crown of queens in the middle. */
  arch: {
    queen: [{ row: 0, cols: [3, 4, 5, 6] }],
    escort: [
      { row: 0, cols: [2, 7] },
      { row: 1, cols: [2, 7] },
    ],
    luna: [
      { row: 1, cols: [0, 1, 3, 4, 5, 6, 8, 9] },
      { row: 2, cols: [0, 1, 8, 9] },
    ],
    moth: [
      { row: 2, cols: [2, 3, 4, 5, 6, 7] },
      { row: 3, cols: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9] },
      { row: 4, cols: [3, 4, 5, 6] },
    ],
  },
} as const satisfies Record<string, Layout>
export type LayoutName = keyof typeof LAYOUTS

/** The order a stage hands out its slots: across, from the middle out, or from the edges in. */
export type FillOrder = 'across' | 'centre' | 'edges'

/** A slot kind's places in a layout, in the stage's fill order. */
export function slotsFor(
  layout: LayoutName,
  kind: SlotKind,
  fill: FillOrder,
): Slot[] {
  const rows: Layout[SlotKind] = LAYOUTS[layout][kind]
  const slots = rows.flatMap((r) => r.cols.map((col) => ({ row: r.row, col })))
  if (fill === 'across') return slots
  const off = (s: Slot) => Math.abs(s.col - 4.5)
  const sign = fill === 'centre' ? 1 : -1
  return [...slots].sort(
    (a, b) => sign * (off(a) - off(b)) || a.row - b.row || a.col - b.col,
  )
}

// --- entrances, dives and tuning ---------------------------------------------------------------

export type EntryGroup = {
  path: PathName
  /** Fly the mirror image at the same time, the kinds alternating between the two lines. */
  pair?: boolean
  kinds: Kind[]
  /** When the group sets off, in entrance beats (GROUP_GAP ticks each). */
  at: number
  /** Dust dropped on the way in, as a share of the stage's dive dust (absent: none). */
  fire?: number
}

export type DiveShape = 'sweep' | 'loop' | 'zig' | 'swoop'

export type Tuning = {
  /** Ticks between dives once the swarm is in. */
  diveGap: number
  /** Most moths diving at once. */
  divers: number
  diveSpeed: number
  /** Chance per tick that a diving moth drops dust. */
  dust: number
  /** Chance a queen without a captive comes down to shine her glow. */
  capture: number
}

export type FormationStage = {
  kind: 'formation'
  name: string
  layout: LayoutName
  fill: FillOrder
  entrance: EntryGroup[]
  dives: DiveShape[]
  tune: Tuning
  /** Dives may start before the last group has settled. */
  earlyDives?: boolean
}
export type GlowName = 'paper-cranes' | 'falling-leaves' | 'fish-kites'
export type GlowStage = {
  kind: 'glow'
  name: string
  choreography: GlowName
}
export type GuardianName = 'grand-lantern-moth' | 'silk-spinner' | 'heron-kite'
export type GuardianStage = {
  kind: 'guardian'
  name: string
  guardian: GuardianName
}
export type Stage = FormationStage | GlowStage | GuardianStage

export type SkyName = 'rooftop' | 'orchard' | 'river'
export type Zone = {
  id: string
  /** The Watch of the night this zone fills. */
  watch: string
  name: string
  sky: SkyName
  /** The Sky Chart's line about what waits there. */
  chart: string
  /** The moths a player meets here first. */
  newMoths: Kind[]
  /** Floating candles drift along the river and soak up dust. */
  candles?: boolean
  stages: Stage[]
}

const Q = 'queen'
const E = 'escort'
const L = 'luna'
const M = 'moth'
const C = 'cocoon'
const S = 'sparker'
const K = 'skimmer'
const D = 'duster'
const n = (kind: Kind, count: number): Kind[] =>
  Array.from({ length: count }, () => kind)
const mixed = (a: Kind, b: Kind, count: number, every: number): Kind[] =>
  Array.from({ length: count }, (_, i) => (i % every === every - 1 ? b : a))

export const ROOFTOP_FESTIVAL: Zone = {
  id: 'rooftop-festival',
  watch: 'DUSK',
  name: 'ROOFTOP FESTIVAL',
  sky: 'rooftop',
  chart: 'PAPER LANTERNS RISE',
  newMoths: ['escort'],
  stages: [
    {
      kind: 'formation',
      name: 'LANTERN LIGHTING',
      layout: 'classic',
      fill: 'across',
      entrance: [
        { path: 'topL', kinds: n(L, 4), at: 0 },
        { path: 'topR', kinds: n(M, 4), at: 0 },
        { path: 'sideL', kinds: [Q, E, Q, E, Q, E, Q, E], at: 1 },
        { path: 'sideR', kinds: n(L, 8), at: 2 },
        { path: 'topL', kinds: n(M, 8), at: 3 },
        { path: 'topR', kinds: n(M, 8), at: 4 },
      ],
      dives: ['sweep'],
      tune: {
        diveGap: 170,
        divers: 2,
        diveSpeed: 1.7,
        dust: 0.012,
        capture: 0.45,
      },
    },
    {
      kind: 'formation',
      name: 'ROOFTOP PARADE',
      layout: 'eaves',
      fill: 'edges',
      entrance: [
        { path: 'loopL', pair: true, kinds: [Q, Q, E, E, Q, Q, E, E], at: 0 },
        { path: 'hookL', kinds: n(L, 6), at: 1, fire: 0.3 },
        { path: 'hookR', kinds: n(L, 6), at: 1.5, fire: 0.3 },
        { path: 'dropL', pair: true, kinds: n(M, 10), at: 2.5, fire: 0.3 },
        { path: 'topR', pair: true, kinds: n(M, 10), at: 3.5 },
      ],
      dives: ['sweep', 'loop'],
      tune: {
        diveGap: 150,
        divers: 3,
        diveSpeed: 1.85,
        dust: 0.016,
        capture: 0.45,
      },
    },
    {
      kind: 'formation',
      name: 'RIBBON DANCE',
      layout: 'arch',
      fill: 'centre',
      entrance: [
        { path: 'sideL', pair: true, kinds: n(M, 10), at: 0, fire: 0.4 },
        { path: 'loopR', pair: true, kinds: [Q, E, Q, E, Q, E, Q, E], at: 1 },
        { path: 'dropR', pair: true, kinds: n(L, 12), at: 2, fire: 0.4 },
        { path: 'hookL', pair: true, kinds: n(M, 10), at: 3.2, fire: 0.4 },
      ],
      dives: ['sweep', 'loop', 'zig'],
      tune: {
        diveGap: 132,
        divers: 4,
        diveSpeed: 2,
        dust: 0.02,
        capture: 0.4,
      },
      earlyDives: true,
    },
    {
      kind: 'glow',
      name: 'PAPER CRANES',
      choreography: 'paper-cranes',
    },
    {
      kind: 'formation',
      name: 'FESTIVAL REMIX',
      layout: 'classic',
      fill: 'edges',
      entrance: [
        { path: 'dropL', pair: true, kinds: [Q, E, Q, E, Q, E, Q, E], at: 0 },
        { path: 'loopL', pair: true, kinds: n(L, 12), at: 0.8, fire: 0.5 },
        { path: 'sideR', pair: true, kinds: n(M, 10), at: 1.8, fire: 0.5 },
        { path: 'hookR', pair: true, kinds: n(M, 10), at: 2.6, fire: 0.5 },
      ],
      dives: ['sweep', 'loop', 'zig', 'swoop'],
      tune: {
        diveGap: 112,
        divers: 4,
        diveSpeed: 2.15,
        dust: 0.024,
        capture: 0.4,
      },
      earlyDives: true,
    },
    {
      kind: 'guardian',
      name: 'THE GRAND LANTERN MOTH',
      guardian: 'grand-lantern-moth',
    },
  ],
}

export const ORCHARD_CANOPY: Zone = {
  id: 'orchard-canopy',
  watch: 'EVENING',
  name: 'ORCHARD CANOPY',
  sky: 'orchard',
  chart: 'FIREFLIES IN THE TREES',
  newMoths: ['cocoon', 'sparker'],
  stages: [
    {
      kind: 'formation',
      name: 'BLOSSOM ROW',
      layout: 'classic',
      fill: 'edges',
      entrance: [
        { path: 'vineL', pair: true, kinds: [Q, E, Q, E, Q, E, Q, E], at: 0 },
        { path: 'topL', kinds: mixed(L, S, 6, 3), at: 1 },
        { path: 'topR', kinds: mixed(L, S, 6, 3), at: 1.4 },
        { path: 'sideL', pair: true, kinds: mixed(M, C, 10, 5), at: 2.3 },
        { path: 'vineR', pair: true, kinds: mixed(M, C, 10, 5), at: 3.3 },
      ],
      dives: ['sweep', 'loop'],
      tune: {
        diveGap: 150,
        divers: 3,
        diveSpeed: 1.9,
        dust: 0.016,
        capture: 0.4,
      },
    },
    {
      kind: 'formation',
      name: 'FIREFLY HOLLOW',
      layout: 'arch',
      fill: 'centre',
      entrance: [
        { path: 'dropL', pair: true, kinds: mixed(S, L, 12, 3), at: 0 },
        { path: 'loopR', pair: true, kinds: [Q, E, Q, E, Q, E, Q, E], at: 1 },
        {
          path: 'vineL',
          pair: true,
          kinds: mixed(M, C, 10, 2),
          at: 2,
          fire: 0.3,
        },
        {
          path: 'hookR',
          pair: true,
          kinds: mixed(M, C, 10, 4),
          at: 3,
          fire: 0.3,
        },
      ],
      dives: ['sweep', 'zig'],
      tune: {
        diveGap: 138,
        divers: 3,
        diveSpeed: 2,
        dust: 0.018,
        capture: 0.4,
      },
    },
    {
      kind: 'formation',
      name: 'SILK ORCHARD',
      layout: 'eaves',
      fill: 'across',
      entrance: [
        { path: 'loopL', pair: true, kinds: [Q, Q, E, E, Q, Q, E, E], at: 0 },
        {
          path: 'vineR',
          pair: true,
          kinds: mixed(L, S, 12, 2),
          at: 1,
          fire: 0.4,
        },
        {
          path: 'dropR',
          pair: true,
          kinds: mixed(C, M, 10, 2),
          at: 2,
          fire: 0.4,
        },
        { path: 'sideL', pair: true, kinds: mixed(M, C, 10, 3), at: 3 },
      ],
      dives: ['sweep', 'loop', 'zig'],
      tune: {
        diveGap: 124,
        divers: 4,
        diveSpeed: 2.05,
        dust: 0.021,
        capture: 0.4,
      },
      earlyDives: true,
    },
    {
      kind: 'glow',
      name: 'FALLING LEAVES',
      choreography: 'falling-leaves',
    },
    {
      kind: 'formation',
      name: 'CANOPY REMIX',
      layout: 'classic',
      fill: 'centre',
      entrance: [
        { path: 'vineL', pair: true, kinds: [Q, E, Q, E, Q, E, Q, E], at: 0 },
        {
          path: 'loopR',
          pair: true,
          kinds: mixed(S, L, 12, 2),
          at: 0.8,
          fire: 0.5,
        },
        {
          path: 'hookL',
          pair: true,
          kinds: mixed(C, M, 10, 2),
          at: 1.8,
          fire: 0.5,
        },
        {
          path: 'dropR',
          pair: true,
          kinds: mixed(M, C, 10, 3),
          at: 2.6,
          fire: 0.5,
        },
      ],
      dives: ['sweep', 'loop', 'zig', 'swoop'],
      tune: {
        diveGap: 108,
        divers: 4,
        diveSpeed: 2.2,
        dust: 0.025,
        capture: 0.4,
      },
      earlyDives: true,
    },
    {
      kind: 'guardian',
      name: 'THE SILK SPINNER',
      guardian: 'silk-spinner',
    },
  ],
}

export const RIVER_OF_LIGHTS: Zone = {
  id: 'river-of-lights',
  watch: 'EVENING',
  name: 'RIVER OF LIGHTS',
  sky: 'river',
  chart: 'CANDLES ON THE WATER',
  newMoths: ['skimmer', 'duster'],
  candles: true,
  stages: [
    {
      kind: 'formation',
      name: 'LANTERN QUAY',
      layout: 'classic',
      fill: 'across',
      entrance: [
        { path: 'riverL', kinds: [Q, E, Q, E, Q, E, Q, E], at: 0 },
        { path: 'riverR', kinds: mixed(L, K, 12, 3), at: 1 },
        { path: 'topL', pair: true, kinds: n(M, 10), at: 2 },
        { path: 'topR', pair: true, kinds: n(M, 10), at: 3 },
      ],
      dives: ['sweep', 'loop'],
      tune: {
        diveGap: 150,
        divers: 3,
        diveSpeed: 1.9,
        dust: 0.016,
        capture: 0.4,
      },
    },
    {
      kind: 'formation',
      name: 'CANDLE CURRENT',
      layout: 'eaves',
      fill: 'centre',
      entrance: [
        { path: 'dropL', pair: true, kinds: [Q, Q, E, E, Q, Q, E, E], at: 0 },
        {
          path: 'riverL',
          pair: true,
          kinds: [D, K, L, D, K, L, D, K, L, D, K, L],
          at: 1,
          fire: 0.3,
        },
        { path: 'hookR', pair: true, kinds: n(M, 10), at: 2.1, fire: 0.3 },
        { path: 'loopL', pair: true, kinds: n(M, 10), at: 3 },
      ],
      dives: ['sweep', 'zig'],
      tune: {
        diveGap: 138,
        divers: 3,
        diveSpeed: 2,
        dust: 0.018,
        capture: 0.4,
      },
    },
    {
      kind: 'formation',
      name: 'BRIDGE OF LIGHTS',
      layout: 'arch',
      fill: 'edges',
      entrance: [
        { path: 'loopR', pair: true, kinds: [Q, E, Q, E, Q, E, Q, E], at: 0 },
        {
          path: 'riverR',
          pair: true,
          kinds: mixed(K, D, 12, 2),
          at: 1,
          fire: 0.4,
        },
        { path: 'sideL', pair: true, kinds: n(M, 10), at: 2, fire: 0.4 },
        { path: 'dropL', pair: true, kinds: n(M, 10), at: 3 },
      ],
      dives: ['sweep', 'loop', 'zig'],
      tune: {
        diveGap: 124,
        divers: 4,
        diveSpeed: 2.05,
        dust: 0.021,
        capture: 0.4,
      },
      earlyDives: true,
    },
    {
      kind: 'glow',
      name: 'FISH KITES',
      choreography: 'fish-kites',
    },
    {
      kind: 'formation',
      name: 'RIVER REMIX',
      layout: 'classic',
      fill: 'edges',
      entrance: [
        { path: 'riverL', pair: true, kinds: [Q, E, Q, E, Q, E, Q, E], at: 0 },
        {
          path: 'dropR',
          pair: true,
          kinds: [K, D, L, K, D, L, K, D, L, K, D, L],
          at: 0.8,
          fire: 0.5,
        },
        { path: 'loopL', pair: true, kinds: n(M, 10), at: 1.8, fire: 0.5 },
        { path: 'hookR', pair: true, kinds: n(M, 10), at: 2.6, fire: 0.5 },
      ],
      dives: ['sweep', 'loop', 'zig', 'swoop'],
      tune: {
        diveGap: 108,
        divers: 4,
        diveSpeed: 2.2,
        dust: 0.025,
        capture: 0.4,
      },
      earlyDives: true,
    },
    {
      kind: 'guardian',
      name: 'THE HERON KITE',
      guardian: 'heron-kite',
    },
  ],
}

/**
 * The Watches of the night in order; a Watch with two zones is a fork chosen on the Sky Chart.
 * (The Midnight, Small Hours and Dawn Watches join in later slices.)
 */
export const WATCHES: ReadonlyArray<readonly Zone[]> = [
  [ROOFTOP_FESTIVAL],
  [ORCHARD_CANOPY, RIVER_OF_LIGHTS],
]
export const ZONES: readonly Zone[] = WATCHES.flat()

/** Each lap of the night tightens every stage's tuning, up to these limits. */
export const LAP_RAMP = {
  diveGap: { factor: 0.82, limit: 45 },
  divers: { step: 1, limit: 7 },
  diveSpeed: { step: 0.25, limit: 3.2 },
  dust: { factor: 1.3, limit: 0.045 },
} as const

/** A stage's tuning on lap `lap` (1 is the first time through the night). */
export function tuneFor(tune: Tuning, lap: number): Tuning {
  const k = Math.max(0, Math.floor(lap) - 1)
  return {
    diveGap: Math.max(
      LAP_RAMP.diveGap.limit,
      Math.round(tune.diveGap * LAP_RAMP.diveGap.factor ** k),
    ),
    divers: Math.min(
      LAP_RAMP.divers.limit,
      tune.divers + LAP_RAMP.divers.step * k,
    ),
    diveSpeed: Math.min(
      LAP_RAMP.diveSpeed.limit,
      tune.diveSpeed + LAP_RAMP.diveSpeed.step * k,
    ),
    dust: Math.min(LAP_RAMP.dust.limit, tune.dust * LAP_RAMP.dust.factor ** k),
    capture: tune.capture,
  }
}

/** Where a run stands: the lap of the night, the Watch, the branch taken there and the stage. */
export type Route = {
  lap: number
  watch: number
  branch: number
  stage: number
}

export type StagePlace = Omit<Route, 'stage'> & {
  zone: Zone
  /** The stage's place in its zone (Route.stage). */
  stageIndex: number
  stage: Stage
}

export function placeOf(r: Route): StagePlace {
  const zones = WATCHES[r.watch] ?? WATCHES[0]!
  const zone = zones[Math.min(zones.length - 1, Math.max(0, r.branch))]!
  const stage = zone.stages[r.stage] ?? zone.stages[0]!
  return {
    lap: r.lap,
    watch: r.watch,
    branch: r.branch,
    zone,
    stageIndex: r.stage,
    stage,
  }
}

/** The Watch after `watch` (round to the first, one lap on, after the last). */
export function nextWatch(
  lap: number,
  watch: number,
): { lap: number; watch: number } {
  return watch + 1 >= WATCHES.length
    ? { lap: lap + 1, watch: 0 }
    : { lap, watch: watch + 1 }
}

/**
 * The night's `index`th stage (0-based) along a route that takes `branches[i]` at the i-th fork
 * reached (the left branch when it runs out).
 */
export function stageAt(
  index: number,
  branches: readonly number[] = [],
): StagePlace {
  let rest = Math.max(0, Math.floor(index))
  let lap = 1
  let watch = 0
  let fork = 0
  for (;;) {
    const zones = WATCHES[watch]!
    const branch = zones.length > 1 ? (branches[fork] ?? 0) % zones.length : 0
    const zone = zones[branch]!
    if (rest < zone.stages.length)
      return placeOf({ lap, watch, branch, stage: rest })
    rest -= zone.stages.length
    if (zones.length > 1) fork++
    ;({ lap, watch } = nextWatch(lap, watch))
  }
}

// --- Glow Stage choreographies -----------------------------------------------------------------

export type GlowGroup = { path: Pt[]; count: number; at: number }

/**
 * A figure-of-eight weave (a lemniscate of Gerono) across the middle of the sky, entered from
 * `from` and left off a top corner. `flip` starts on the other lobe.
 */
export function figureEight(from: Pt, flip: boolean): Pt[] {
  const cx = W / 2
  const cy = 138
  const ax = 82
  const ay = 52
  const s = flip ? -1 : 1
  const points: Pt[] = [from]
  for (let i = 1; i <= 16; i++) {
    const t = (i / 16) * Math.PI * 2
    points.push({
      x: Math.round(cx + s * ax * Math.sin(t)),
      y: Math.round(cy - ay * Math.sin(t) * Math.cos(t) * 2),
    })
  }
  points.push({ x: cx + s * 40, y: 60 }, { x: s > 0 ? W + 24 : -24, y: 20 })
  return points
}

/** A leaf's fall: a spiral that tightens as it drifts down, then a lift back up and away. */
export function leafSpiral(cx: number, flip: boolean): Pt[] {
  const s = flip ? -1 : 1
  const points: Pt[] = [{ x: cx, y: -12 }]
  for (let i = 0; i <= 14; i++) {
    const a = i * 0.9
    const r = 56 - i * 2.4
    points.push({
      x: Math.round(cx + s * Math.cos(a) * r),
      y: Math.round(40 + i * 11 + Math.sin(a) * r * 0.5),
    })
  }
  points.push(
    { x: cx + s * 30, y: 150 },
    { x: cx, y: 70 },
    { x: cx - s * 20, y: -24 },
  )
  return points
}

/** A long serpentine school: across the sky in a wave, a turn, and back lower down. */
export function serpent(fromLeft: boolean, y0: number): Pt[] {
  const s = fromLeft ? 1 : -1
  const x0 = fromLeft ? -16 : W + 16
  const points: Pt[] = []
  for (let i = 0; i <= 12; i++)
    points.push({
      x: Math.round(x0 + s * i * 20),
      y: Math.round(y0 + Math.sin(i * 0.9) * 24),
    })
  for (let i = 12; i >= 0; i--)
    points.push({
      x: Math.round(x0 + s * i * 20),
      y: Math.round(y0 + 76 + Math.sin(i * 0.9 + 1.5) * 24),
    })
  return points
}

/** Every Glow Stage flies forty in five groups of eight. */
export const GLOW_CHOREOGRAPHIES: Record<GlowName, GlowGroup[]> = {
  'paper-cranes': [
    { path: figureEight({ x: W / 2, y: -12 }, false), count: 8, at: 0 },
    { path: figureEight({ x: W / 2, y: -12 }, true), count: 8, at: 0.9 },
    { path: figureEight({ x: -12, y: 210 }, false), count: 8, at: 1.8 },
    { path: figureEight({ x: W + 12, y: 210 }, true), count: 8, at: 2.7 },
    { path: figureEight({ x: W / 2, y: -12 }, false), count: 8, at: 3.6 },
  ],
  'falling-leaves': [
    { path: leafSpiral(80, false), count: 8, at: 0 },
    { path: leafSpiral(144, true), count: 8, at: 0.8 },
    { path: leafSpiral(112, false), count: 8, at: 1.6 },
    { path: leafSpiral(80, true), count: 8, at: 2.4 },
    { path: leafSpiral(144, false), count: 8, at: 3.2 },
  ],
  'fish-kites': [
    { path: serpent(true, 70), count: 8, at: 0 },
    { path: serpent(true, 70), count: 8, at: 0.45 },
    { path: serpent(true, 70), count: 8, at: 0.9 },
    { path: serpent(false, 92), count: 8, at: 2.2 },
    { path: serpent(false, 92), count: 8, at: 2.65 },
  ],
}

/** Which art each choreography's dancers wear. */
export const GLOW_ART: Record<GlowName, 'crane' | 'leaf' | 'fish'> = {
  'paper-cranes': 'crane',
  'falling-leaves': 'leaf',
  'fish-kites': 'fish',
}
