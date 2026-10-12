// /utils/arcade/butterflyBlaster/season.ts
//
// The Rainy Season, as data (conductor kr-arcade/t-056, CABINETS.md section 6 "Structure" and "The
// regions"). The season runs down a river valley in Moons (acts) of two regions each, a nest boss
// at the end of each Moon, and the Clinic between regions. Each region has four nights:
//
//   nights 1-2  bring in the region's new pests and its sky mechanic;
//   night 3     is the region's special night, with its own objective;
//   night 4     remixes the region with everything learned so far.
//
// Moon 1, First Rains:
//   Riverbend      the moonlit savanna. Swarms flock to the lit huts. Special: the Lantern Walk.
//   Rice Terraces  stepped paddies of standing water that breed wrigglers, skimmers on the water,
//                  and wind gusts on a flag tell. Special: Tip the Pots.
//   The Hum        a mega-swarm that holds shapes (hum.ts).
//
// Later Moons join this list in slice 3; after the last authored boss the river runs on into
// endless nights.

import { GROUND, W } from './sky'
import { POOL_SPOTS, endlessNight } from './nights'
import type { NightPlan, PoolSpot, WavePlan } from './nights'
import type { KitId } from './kit'

export type RegionId = 'riverbend' | 'terraces'
export type BackdropId = 'savanna' | 'terraces'
export type ThemeId = 'riverbend' | 'terraces'
export type SpecialKind = 'lanterns' | 'pots'
export type BossId = 'hum'

export type NightDef = NightPlan & {
  title: string
  special?: SpecialKind
  /** Wind gusts blow across this night. */
  wind?: boolean
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
  boss: BossId
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
}

export const MOONS: readonly MoonDef[] = [
  {
    n: 1,
    name: 'FIRST RAINS',
    regions: ['riverbend', 'terraces'],
    boss: 'hum',
  },
]

export type Step =
  | { kind: 'night'; region: RegionId; night: number }
  | { kind: 'clinic'; moon: number }
  | { kind: 'boss'; boss: BossId; moon: number }
  | { kind: 'endless' }

/** The whole season in order: nights, the Clinic between regions, a boss at each Moon's end. */
export function campaignSteps(): Step[] {
  const steps: Step[] = []
  for (const moon of MOONS) {
    moon.regions.forEach((region, i) => {
      if (i > 0) steps.push({ kind: 'clinic', moon: moon.n })
      REGIONS[region].nights.forEach((_, night) =>
        steps.push({ kind: 'night', region, night }),
      )
    })
    steps.push({ kind: 'boss', boss: moon.boss, moon: moon.n })
    steps.push({ kind: 'clinic', moon: moon.n })
  }
  steps.push({ kind: 'endless' })
  return steps
}

/** Where the season can be picked up again: any night, the Clinic, or a boss. */
export const isCheckpoint = (step: Step | undefined) =>
  !!step && step.kind !== 'endless'

/** The first night of a region (its title card plays). */
export const isRegionStart = (step: Step | undefined) =>
  step?.kind === 'night' && step.night === 0

export const BOSS_NAMES: Record<BossId, { name: string; title: string }> = {
  hum: { name: 'THE HUM', title: 'THE SWARM THAT HOLDS A SHAPE' },
}

/** The region a step belongs to (a Clinic or boss belongs to the region before it). */
export function regionAt(steps: readonly Step[], i: number): RegionDef {
  for (let k = Math.min(i, steps.length - 1); k >= 0; k--) {
    const s = steps[k]!
    if (s.kind === 'night') return REGIONS[s.region]
  }
  return REGIONS.riverbend
}
