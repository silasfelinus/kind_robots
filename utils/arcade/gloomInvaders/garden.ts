// /utils/arcade/gloomInvaders/garden.ts
//
// The Garden Grows Back (Gloom Invaders depth pass, conductor kr-arcade/t-132): eleven plots along
// the ground. Every cloud cheered rains on the plot beneath it; five waterings bloom a plot into a
// helper chosen by its position and the season, and gloom drops that reach the ground wilt a plot
// a little. Pure rules only: the cabinet runs the helpers and draws them.

import { W } from './weather'
import type { Season } from './weather'

export const PLOTS = 11
export const PLOT_W = 24
export const PLOT_LEFT = (W - PLOTS * PLOT_W) / 2
export const BLOOM_AT = 5
export const WATER_MAX = 10
/** A strawberry plot watered this many times gives an extra Sunny (once). */
export const BERRY_AT = 10

export type HelperKind =
  'sunflower' | 'beanVine' | 'beehive' | 'pumpkin' | 'strawberry'

export const HELPER_NAMES: Record<HelperKind, string> = {
  sunflower: 'SUNFLOWER',
  beanVine: 'BEAN VINE',
  beehive: 'BEEHIVE',
  pumpkin: 'PUMPKIN',
  strawberry: 'STRAWBERRY',
}

/** Ticks between a helper's turns: a sunflower's beam, a bee's flight, a vine's regrowth. */
export const HELPER_TICKS = {
  sunflower: 180,
  beehive: 240,
  vineRegrow: 75,
  pumpkinFuse: 45,
} as const

/** A bean vine's leafy canopy: cells across, two rows deep. */
export const VINE_CELLS = 10

/** What blooms in each plot, left to right, by season. */
export const PLOT_HELPERS: Record<Season, readonly HelperKind[]> = {
  0: [
    'strawberry',
    'sunflower',
    'beanVine',
    'beehive',
    'sunflower',
    'pumpkin',
    'sunflower',
    'beehive',
    'beanVine',
    'sunflower',
    'strawberry',
  ],
  1: [
    'sunflower',
    'beanVine',
    'sunflower',
    'beehive',
    'beanVine',
    'sunflower',
    'beanVine',
    'beehive',
    'sunflower',
    'beanVine',
    'sunflower',
  ],
  2: [
    'pumpkin',
    'beehive',
    'sunflower',
    'pumpkin',
    'beanVine',
    'strawberry',
    'beanVine',
    'pumpkin',
    'sunflower',
    'beehive',
    'pumpkin',
  ],
  3: [
    'beehive',
    'beanVine',
    'strawberry',
    'beehive',
    'sunflower',
    'beanVine',
    'sunflower',
    'beehive',
    'strawberry',
    'beanVine',
    'beehive',
  ],
}

export type Plot = {
  water: number
  helper: HelperKind | null
  /** Ticks to the helper's next turn. */
  timer: number
  berryPaid: boolean
  /** A bean vine's canopy cells (two rows of VINE_CELLS), true where a leaf stands. */
  vine: boolean[]
}

export function newGarden(): Plot[] {
  return Array.from({ length: PLOTS }, () => ({
    water: 0,
    helper: null,
    timer: 0,
    berryPaid: false,
    vine: [],
  }))
}

/** The plot under a point on the ground (the edges belong to the outer plots). */
export function plotIndex(x: number): number {
  return Math.max(0, Math.min(PLOTS - 1, Math.floor((x - PLOT_LEFT) / PLOT_W)))
}

export function plotCenter(i: number): number {
  return PLOT_LEFT + i * PLOT_W + PLOT_W / 2
}

function bloom(plot: Plot, helper: HelperKind) {
  plot.helper = helper
  plot.timer =
    helper === 'sunflower'
      ? 30
      : helper === 'beehive'
        ? 30
        : helper === 'pumpkin'
          ? HELPER_TICKS.pumpkinFuse
          : HELPER_TICKS.vineRegrow
  plot.vine = helper === 'beanVine' ? new Array(VINE_CELLS * 2).fill(true) : []
}

export type WaterResult = {
  plot: number
  bloomed: HelperKind | null
  /** True when this watering earned the strawberry's extra Sunny. */
  berry: boolean
}

/** A cheered cloud rains on the plot below `x`. */
export function waterPlot(
  plots: Plot[],
  x: number,
  season: Season,
): WaterResult {
  const i = plotIndex(x)
  const plot = plots[i]!
  plot.water = Math.min(WATER_MAX, plot.water + 1)
  let bloomed: HelperKind | null = null
  if (!plot.helper && plot.water >= BLOOM_AT) {
    bloomed = PLOT_HELPERS[season][i]!
    bloom(plot, bloomed)
  }
  let berry = false
  if (
    plot.helper === 'strawberry' &&
    !plot.berryPaid &&
    plot.water >= BERRY_AT
  ) {
    plot.berryPaid = true
    berry = true
  }
  return { plot: i, bloomed, berry }
}

/** A gloom drop reached the ground at `x`: that plot wilts a little, and may lose its helper. */
export function wiltPlot(
  plots: Plot[],
  x: number,
): { plot: number; wilted: HelperKind | null } {
  const i = plotIndex(x)
  const plot = plots[i]!
  plot.water = Math.max(0, plot.water - 1)
  let wilted: HelperKind | null = null
  if (plot.helper && plot.water < BLOOM_AT) {
    wilted = plot.helper
    plot.helper = null
    plot.vine = []
  }
  return { plot: i, wilted }
}

/** A pumpkin that has launched goes back to bare soil, ready to be grown again. */
export function spendPumpkin(plot: Plot) {
  plot.helper = null
  plot.water = 0
  plot.timer = 0
}
