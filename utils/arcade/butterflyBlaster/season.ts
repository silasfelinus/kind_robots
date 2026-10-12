// /utils/arcade/butterflyBlaster/season.ts
//
// The Rainy Season, as data (conductor kr-arcade/t-056, t-057; CABINETS.md section 6 "Structure"
// and "The regions"). The season runs down a river valley in three Moons (acts) of two regions
// each, a nest boss at the end of each Moon, and AMI's Clinic between regions. Each region has
// four nights:
//
//   nights 1-2  bring in the region's new pests and its sky mechanic;
//   night 3     is the region's special night, with its own objective;
//   night 4     remixes the region with everything learned so far.
//
// Moon 1, First Rains:
//   Riverbend       the moonlit savanna; swarms flock to the lit huts. Special: the Lantern Walk.
//   Rice Terraces   paddies that breed wrigglers, skimmers, wind. Special: Tip the Pots.
//   The Hum         a mega-swarm that holds shapes (hum.ts).
// Moon 2, Heavy Rains:
//   Mangrove Delta  the tide rises and falls, fog hides shade swarms. Special: the Firefly Escort.
//   Market Town     festival light strings; bloom clusters and hummers. Special: the Night Market.
//   Old Puddle      a living overflow from the town's rain barrel (puddle.ts).
// Moon 3, Last Rains:
//   Tea Hills Storm lightning and soaking rain; storm cells, sticky swarms. Special: Hold the Hill.
//   The Great Swamp everything returns; decoy glows. Special: the Long Night, three waves long.
//   The Night Queen the swamp's matriarch (queen.ts).
//
// Then dawn: the ending and its credits. A region's golden thread is earned by meeting its
// special night's objective with no hut bitten; with all six, the Moonlit Lagoon opens after the
// credits, and clearing it gives the true ending, Zero Night. After that the river runs on into
// the Dry Season, a New Game+ of remixed nights.

import { GROUND, W } from './sky'
import { POOL_SPOTS, endlessNight } from './nights'
import type { NightPlan, PoolSpot, WavePlan } from './nights'
import type { KitId } from './kit'

export type RegionId =
  'riverbend' | 'terraces' | 'delta' | 'market' | 'tea' | 'swamp' | 'lagoon'
export type BackdropId =
  'savanna' | 'terraces' | 'delta' | 'market' | 'tea' | 'swamp' | 'lagoon'
export type ThemeId = RegionId
export type SpecialKind =
  'lanterns' | 'pots' | 'escort' | 'market' | 'hill' | 'long'
export type BossId = 'hum' | 'puddle' | 'queen'
export type EndingKind = 'dawn' | 'zero'

export type NightDef = NightPlan & {
  title: string
  special?: SpecialKind
  /** Wind gusts blow across this night. */
  wind?: boolean
  /** The tide rises and falls (the Mangrove Delta). */
  tide?: boolean
  /** Fog banks drift across, hiding what is in them. */
  fog?: boolean
  /** Strings of festival lights cross the sky (Market Town). */
  strings?: boolean
  /** A thunderstorm: lightning, rain and rainbow updrafts (the Tea Hills). */
  storm?: boolean
  /** Coins of moonlight hang everywhere (the Moonlit Lagoon). */
  coins?: boolean
}

export type RegionDef = {
  id: RegionId
  name: string
  moon: number
  /** The title card's line under the name. */
  tagline: string
  backdrop: BackdropId
  theme: ThemeId
  /** What AMI may bring here. */
  kit: readonly KitId[]
  nights: readonly NightDef[]
  /** The Clinic's thread hint for this region. */
  threadHint: string
}

export type MoonDef = {
  n: number
  name: string
  regions: readonly RegionId[]
  /** The nest boss at the Moon's end (the secret Lagoon has none). */
  boss?: BossId
  /** Only open with all six golden threads. */
  secret?: boolean
}

/** Paddies up on the Rice Terraces' steps (left and right of the village). */
export const PADDIES: readonly PoolSpot[] = [
  { x: 30, y: GROUND - 56 },
  { x: W - 30, y: GROUND - 56 },
  { x: 76, y: GROUND - 40 },
  { x: W - 76, y: GROUND - 40 },
  { x: 110, y: GROUND - 26 },
  { x: W - 110, y: GROUND - 26 },
]
/** Tip the Pots: a water jar on the step beside each paddy. */
export const JAR_SPOTS: readonly PoolSpot[] = [
  { x: 49, y: GROUND - 63 },
  { x: W - 49, y: GROUND - 63 },
  { x: 93, y: GROUND - 47 },
  { x: W - 93, y: GROUND - 47 },
  { x: 126, y: GROUND - 33 },
  { x: W - 126, y: GROUND - 33 },
]

const wave = (w: Partial<WavePlan>): WavePlan => ({
  big: 0,
  medium: 0,
  needles: 0,
  skimmers: 0,
  cloud: false,
  ...w,
})

/** A night pitched at `heat` on the endless curves, with its own waves and extras. */
function night(
  heat: number,
  title: string,
  waves: Partial<WavePlan>[],
  extra: Partial<NightDef> = {},
): NightDef {
  return {
    ...endlessNight(heat),
    pools: [],
    title,
    waves: waves.map(wave),
    ...extra,
  }
}

const ALL_KIT: readonly KitId[] = [
  'net',
  'ring',
  'fan',
  'long',
  'wingman',
  'lure',
  'bats',
]

export const REGIONS: Record<RegionId, RegionDef> = {
  riverbend: {
    id: 'riverbend',
    name: 'RIVERBEND',
    moon: 1,
    tagline: 'THE FIRST RAINS COME',
    backdrop: 'savanna',
    theme: 'riverbend',
    kit: ['net', 'ring', 'fan', 'long'],
    threadHint: 'LANTERN WALK: KEEP EVERY HUT UNBITTEN',
    nights: [
      night(1, 'FIRST DUSK', [{ big: 2 }, { big: 3, cloud: true }]),
      night(2, 'THE LIT WINDOWS', [
        { big: 3 },
        { big: 3, medium: 1, cloud: true },
      ]),
      night(
        2,
        'THE LANTERN WALK',
        [
          { big: 3, cloud: true },
          { big: 3, medium: 2, cloud: true },
        ],
        { special: 'lanterns' },
      ),
      night(
        3,
        'RIVERBEND REMIX',
        [
          { big: 4, cloud: true },
          { big: 4, medium: 2, cloud: true },
        ],
        { pools: POOL_SPOTS.slice(0, 1) },
      ),
    ],
  },
  terraces: {
    id: 'terraces',
    name: 'RICE TERRACES',
    moon: 1,
    tagline: 'STANDING WATER, STEP BY STEP',
    backdrop: 'terraces',
    theme: 'terraces',
    kit: ['net', 'ring', 'fan', 'long', 'wingman', 'lure'],
    threadHint: 'TIP THE POTS: TIP ALL SIX, NO HUT BITTEN',
    nights: [
      night(3, 'STANDING WATER', [{ big: 3 }, { big: 3, cloud: true }], {
        pools: PADDIES.slice(0, 2),
      }),
      night(
        4,
        'SKIMMERS AND WIND',
        [
          { big: 3, skimmers: 1 },
          { big: 4, skimmers: 1, cloud: true },
        ],
        { pools: PADDIES.slice(0, 2), wind: true },
      ),
      night(
        4,
        'TIP THE POTS',
        [
          { big: 3, skimmers: 1 },
          { big: 4, cloud: true },
        ],
        { pools: [...PADDIES], special: 'pots' },
      ),
      night(
        5,
        'TERRACES REMIX',
        [
          { big: 4, medium: 1, skimmers: 1 },
          { big: 5, medium: 1, skimmers: 2, cloud: true },
        ],
        { pools: PADDIES.slice(0, 4), wind: true },
      ),
    ],
  },
  delta: {
    id: 'delta',
    name: 'MANGROVE DELTA',
    moon: 2,
    tagline: 'THE TIDE COMES IN WITH THE FOG',
    backdrop: 'delta',
    theme: 'delta',
    kit: ['net', 'ring', 'fan', 'long', 'wingman', 'lure'],
    threadHint: 'FIREFLY ESCORT: SEE THEM ACROSS, NO HUT BITTEN',
    nights: [
      night(
        5,
        'HIGH TIDE',
        [
          { big: 3, needles: 1 },
          { big: 3, medium: 1, needles: 1, cloud: true },
        ],
        { tide: true },
      ),
      night(
        6,
        'SHADES IN THE FOG',
        [
          { big: 2, shade: 2 },
          { big: 3, shade: 2, needles: 1, cloud: true },
        ],
        { tide: true, fog: true },
      ),
      night(
        6,
        'THE FIREFLY ESCORT',
        [
          { big: 3, shade: 2 },
          { big: 3, shade: 2, needles: 2, cloud: true },
        ],
        { tide: true, fog: true, special: 'escort' },
      ),
      night(
        7,
        'DELTA REMIX',
        [
          { big: 4, shade: 2, needles: 1, skimmers: 1 },
          { big: 4, shade: 3, needles: 2, cloud: true },
        ],
        { tide: true, fog: true, pools: POOL_SPOTS.slice(0, 2) },
      ),
    ],
  },
  market: {
    id: 'market',
    name: 'MARKET TOWN',
    moon: 2,
    tagline: 'FESTIVAL LIGHTS IN THE RAIN',
    backdrop: 'market',
    theme: 'market',
    kit: ALL_KIT,
    threadHint: 'NIGHT MARKET: GUARD THE STALLS, NO HUT BITTEN',
    nights: [
      night(
        6,
        'FESTIVAL LIGHTS',
        [
          { big: 3, medium: 1 },
          { big: 4, cloud: true },
        ],
        { strings: true },
      ),
      night(
        7,
        'BLOOMS AND HUMMERS',
        [
          { big: 3, blooms: 1 },
          { big: 3, blooms: 2, cloud: true },
        ],
        { strings: true },
      ),
      night(
        7,
        'THE NIGHT MARKET',
        [
          { big: 3, blooms: 1 },
          { big: 4, needles: 1, cloud: true },
        ],
        { strings: true, special: 'market' },
      ),
      night(
        8,
        'MARKET REMIX',
        [
          { big: 4, blooms: 2, shade: 1 },
          { big: 4, blooms: 2, needles: 2, cloud: true },
        ],
        { strings: true, pools: POOL_SPOTS.slice(0, 2) },
      ),
    ],
  },
  tea: {
    id: 'tea',
    name: 'TEA HILLS STORM',
    moon: 3,
    tagline: 'THUNDER OVER THE TEA ROWS',
    backdrop: 'tea',
    theme: 'tea',
    kit: ALL_KIT,
    threadHint: 'HOLD THE HILL: THE SHELTER AND EVERY HUT UNBITTEN',
    nights: [
      night(
        8,
        'FIRST THUNDER',
        [
          { big: 3, storms: 1 },
          { big: 4, storms: 1, cloud: true },
        ],
        { storm: true },
      ),
      night(
        9,
        'STICKY RAIN',
        [
          { big: 3, sticky: 2 },
          { big: 3, sticky: 2, storms: 1, cloud: true },
        ],
        { storm: true },
      ),
      night(
        9,
        'HOLD THE HILL',
        [
          { big: 4, storms: 1, sticky: 1 },
          { big: 4, storms: 2, sticky: 2, cloud: true },
        ],
        { storm: true, special: 'hill' },
      ),
      night(
        10,
        'TEA HILLS REMIX',
        [
          { big: 4, storms: 2, blooms: 1, sticky: 1 },
          { big: 5, storms: 2, needles: 2, cloud: true },
        ],
        { storm: true, wind: true },
      ),
    ],
  },
  swamp: {
    id: 'swamp',
    name: 'THE GREAT SWAMP',
    moon: 3,
    tagline: 'WHERE THE MOSQUITOES COME FROM',
    backdrop: 'swamp',
    theme: 'swamp',
    kit: ALL_KIT,
    threadHint: 'THE LONG NIGHT: ALL THREE WAVES, NO HUT BITTEN',
    nights: [
      night(
        9,
        'THE SOURCE',
        [
          { big: 4, shade: 1, decoys: 1, skimmers: 1 },
          { big: 4, needles: 2, decoys: 2, cloud: true },
        ],
        { pools: POOL_SPOTS.slice(0, 3) },
      ),
      night(
        10,
        'DECOYS IN THE REEDS',
        [
          { big: 4, blooms: 1, decoys: 2 },
          { big: 4, sticky: 2, storms: 1, decoys: 2, cloud: true },
        ],
        { pools: POOL_SPOTS.slice(0, 3), fog: true },
      ),
      night(
        10,
        'THE LONG NIGHT',
        [
          { big: 4, shade: 2, needles: 1 },
          { big: 4, blooms: 2, sticky: 1, decoys: 1, cloud: true },
          { big: 5, storms: 2, needles: 2, skimmers: 1, cloud: true },
        ],
        { pools: POOL_SPOTS.slice(0, 4), fog: true, special: 'long' },
      ),
      night(
        11,
        'SWAMP REMIX',
        [
          { big: 5, shade: 2, blooms: 1, storms: 1 },
          { big: 5, sticky: 2, needles: 2, decoys: 2, cloud: true },
        ],
        { pools: POOL_SPOTS.slice(0, 4), fog: true, wind: true },
      ),
    ],
  },
  lagoon: {
    id: 'lagoon',
    name: 'THE MOONLIT LAGOON',
    moon: 4,
    tagline: 'SIX GOLDEN THREADS OPEN THE WAY',
    backdrop: 'lagoon',
    theme: 'lagoon',
    kit: ALL_KIT,
    threadHint: 'THE LAGOON HAS NO THREAD: IT IS THE PRIZE',
    nights: [
      night(
        14,
        'MIRRORED SKIES',
        [
          { big: 4, shade: 1, needles: 2 },
          { big: 5, blooms: 1, needles: 2, cloud: true },
        ],
        { coins: true },
      ),
      night(
        14,
        'MOONLIGHT COINS',
        [
          { big: 4, sticky: 2, storms: 1 },
          { big: 5, shade: 2, decoys: 2, cloud: true },
        ],
        { coins: true, fog: true },
      ),
      night(
        15,
        'THE STILL WATER',
        [
          { big: 5, blooms: 2, skimmers: 2 },
          { big: 5, storms: 2, sticky: 2, needles: 2, cloud: true },
        ],
        { coins: true, pools: POOL_SPOTS.slice(0, 4), wind: true },
      ),
      night(
        16,
        'ZERO NIGHT EVE',
        [
          { big: 5, shade: 2, blooms: 2, needles: 2 },
          { big: 6, sticky: 2, storms: 2, decoys: 2, cloud: true },
        ],
        { coins: true, fog: true, storm: true },
      ),
    ].map((n) => ({ ...n, speed: 1.75 })),
  },
}

export const MOONS: readonly MoonDef[] = [
  {
    n: 1,
    name: 'FIRST RAINS',
    regions: ['riverbend', 'terraces'],
    boss: 'hum',
  },
  {
    n: 2,
    name: 'HEAVY RAINS',
    regions: ['delta', 'market'],
    boss: 'puddle',
  },
  { n: 3, name: 'LAST RAINS', regions: ['tea', 'swamp'], boss: 'queen' },
  { n: 4, name: 'THE MOONLIT LAGOON', regions: ['lagoon'], secret: true },
]

/** The six regions whose special nights each hide a golden thread. */
export const THREAD_REGIONS: readonly RegionId[] = [
  'riverbend',
  'terraces',
  'delta',
  'market',
  'tea',
  'swamp',
]

export type Step =
  | { kind: 'night'; region: RegionId; night: number; secret?: boolean }
  | { kind: 'clinic'; moon: number }
  | { kind: 'boss'; boss: BossId; moon: number }
  | { kind: 'ending'; ending: EndingKind; secret?: boolean }
  | { kind: 'dry' }
  | { kind: 'endless' }

/**
 * The whole season in order: nights, the Clinic between regions, a nest boss at each Moon's end,
 * the dawn ending, the secret Lagoon and Zero Night, then the Dry Season.
 */
export function campaignSteps(): Step[] {
  const steps: Step[] = []
  const story = MOONS.filter((m) => !m.secret)
  story.forEach((moon, m) => {
    moon.regions.forEach((region, i) => {
      if (i > 0) steps.push({ kind: 'clinic', moon: moon.n })
      REGIONS[region].nights.forEach((_, night) =>
        steps.push({ kind: 'night', region, night }),
      )
    })
    if (moon.boss) steps.push({ kind: 'boss', boss: moon.boss, moon: moon.n })
    if (m < story.length - 1) steps.push({ kind: 'clinic', moon: moon.n })
  })
  steps.push({ kind: 'ending', ending: 'dawn' })
  for (const moon of MOONS.filter((m) => m.secret)) {
    for (const region of moon.regions) {
      REGIONS[region].nights.forEach((_, night) =>
        steps.push({ kind: 'night', region, night, secret: true }),
      )
    }
  }
  steps.push({ kind: 'ending', ending: 'zero', secret: true })
  steps.push({ kind: 'dry' })
  return steps
}

/** Steps only played with all six golden threads. */
export const isSecret = (step: Step | undefined) =>
  !!step && 'secret' in step && step.secret === true

/** Where the season can be picked up again: a night, the Clinic or a nest. */
export const isCheckpoint = (step: Step | undefined) =>
  !!step &&
  (step.kind === 'night' || step.kind === 'clinic' || step.kind === 'boss')

/** The first night of a region (its title card plays). */
export const isRegionStart = (step: Step | undefined) =>
  step?.kind === 'night' && step.night === 0

export const BOSS_NAMES: Record<BossId, { name: string; title: string }> = {
  hum: { name: 'THE HUM', title: 'THE SWARM THAT HOLDS A SHAPE' },
  puddle: { name: 'OLD PUDDLE', title: 'THE RAIN BARREL OVERFLOWS' },
  queen: { name: 'THE NIGHT QUEEN', title: 'MATRIARCH OF THE SWAMP' },
}

/** The region a step belongs to (a Clinic, nest or ending belongs to the region before it). */
export function regionAt(steps: readonly Step[], i: number): RegionDef {
  for (let k = Math.min(i, steps.length - 1); k >= 0; k--) {
    const s = steps[k]!
    if (s.kind === 'night') return REGIONS[s.region]
  }
  return REGIONS.riverbend
}

/**
 * A night of the Dry Season (New Game+), lap `lap` (1 for the first): faster, hungrier, more
 * pests, and every wave turned round so the night plays in a new order.
 */
export function dryNight(def: NightDef, lap: number): NightDef {
  if (lap <= 0) return def
  const waves = [...def.waves].reverse().map((w, i) => ({
    ...w,
    big: w.big + lap,
    needles: w.needles + (i === 0 ? lap : 0),
    shade: (w.shade ?? 0) + (lap > 1 ? 1 : 0),
    cloud: true,
  }))
  return {
    ...def,
    waves,
    speed: Math.min(2.1, def.speed * (1 + 0.15 * lap)),
    hunger: [
      Math.round(def.hunger[0] * 0.8 ** lap),
      Math.round(def.hunger[1] * 0.8 ** lap),
    ],
    cloudEvery: Math.round(def.cloudEvery * 0.85 ** lap),
    poolEvery: Math.round(def.poolEvery * 0.85 ** lap),
  }
}
