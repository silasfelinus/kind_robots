// /utils/arcade/butterflyBlaster/nights.ts
//
// A night of the watch, as data (conductor kr-arcade/t-055, CABINETS.md section 6 "Structure"):
// two waves of pests over one village, then the dawn tally. The season's regions (slice 2) author
// their nights in this shape; until then, and for the endless Long Night, nights are built from
// curves that keep climbing: more swarms, then breeding pools, skimmers and needles, then faster,
// hungrier swarms and a sharper malaria cloud.

import { levelCurve } from '../curve'
import { GROUND } from './sky'

export type WavePlan = {
  /** Big swarms on the edges at the start. */
  big: number
  /** Medium swarms too. */
  medium: number
  needles: number
  skimmers: number
  /** The malaria cloud may come during this wave. */
  cloud: boolean
}

export type PoolSpot = { x: number; y: number }

export type NightPlan = {
  waves: WavePlan[]
  /** Breeding pools: standing water on the ground, or paddies up on the terraces. */
  pools: PoolSpot[]
  /** Ticks between wrigglers from one pool. */
  poolEvery: number
  /** Swarm speed (1 = the base speed). */
  speed: number
  /** Ticks a fresh swarm wanders before it gets hungry (least, spread). */
  hunger: [number, number]
  /** Ticks between malaria clouds. */
  cloudEvery: number
  /** Ticks between the cloud's drops. */
  cloudFire: number
  /** The cloud's aim error (radians either side). */
  cloudAim: number
  /** Ticks between AMI's visits. */
  amiEvery: number
}

/** How a night's numbers climb with the night (difficulty as data). */
export const NIGHT_CURVES = {
  big: { start: 3, step: 0.5, limit: 8 },
  medium: { start: 0, step: 0.34, limit: 4 },
  needles: { start: -1, step: 0.5, limit: 4 },
  skimmers: { start: 0, step: 0.25, limit: 3 },
  pools: { start: 0, step: 0.5, limit: 4 },
  poolEvery: { start: 640, step: -30, limit: 300 },
  speed: { start: 1, step: 0.05, limit: 1.75 },
  hunger: { start: 600, step: -30, limit: 200 },
  cloudEvery: { start: 1500, step: -80, limit: 520 },
  cloudFire: { start: 90, step: -5, limit: 36 },
  cloudAim: { start: 0.6, step: -0.05, limit: 0.08 },
  amiEvery: { start: 1100, step: 90, limit: 2300 },
} as const

/** Where pools may lie: between huts, clear of the HUD's bottom corners. */
export const POOL_SPOTS: readonly PoolSpot[] = [240, 176, 303, 113, 367].map(
  (x) => ({ x, y: GROUND + 4 }),
)

/** Night n of the endless watch. */
export function endlessNight(n: number): NightPlan {
  const c = (k: keyof typeof NIGHT_CURVES) => levelCurve(n, NIGHT_CURVES[k])
  const big = c('big')
  const medium = c('medium')
  const needles = Math.max(0, c('needles'))
  const skimmers = c('skimmers')
  const wave = (second: boolean): WavePlan => ({
    big: Math.max(2, Math.round(second ? big + 0.5 : big - 0.5)),
    medium: Math.floor(second ? medium + 0.5 : medium),
    needles: Math.floor(second ? needles + 0.5 : needles),
    skimmers: Math.floor(second ? skimmers + 0.5 : skimmers),
    cloud: second || n >= 2,
  })
  const pools = Math.floor(c('pools') + (n >= 2 ? 0.5 : 0))
  return {
    waves: [wave(false), wave(true)],
    pools: POOL_SPOTS.slice(0, pools),
    poolEvery: Math.round(c('poolEvery')),
    speed: c('speed'),
    hunger: [Math.round(c('hunger')), Math.round(c('hunger'))],
    cloudEvery: Math.round(c('cloudEvery')),
    cloudFire: Math.round(c('cloudFire')),
    cloudAim: c('cloudAim'),
    amiEvery: Math.round(c('amiEvery')),
  }
}
