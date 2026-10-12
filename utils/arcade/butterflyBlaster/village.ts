// /utils/arcade/butterflyBlaster/village.ts
//
// The village the night watch keeps (conductor kr-arcade/t-055, CABINETS.md section 6 "Village
// health"): eight huts along the ground line, each with a lit window. A hungry swarm that reaches a
// lit hut bites it and its window flickers; three bites and the family pulls the bed nets close and
// puts the lamp out, so the hut stops drawing swarms. At dawn the village thanks you for every hut
// that came through the night unbitten.

import { GROUND, W } from './sky'
import type { Light } from './swarm'

export const HUT_COUNT = 8
/** Bites a hut can take before its lamp goes out. */
export const HUT_BITES = 3
/** Where a hut's window glows. */
export const WINDOW_Y = GROUND - 9

export const hutX = (i: number) => 18 + i * ((W - 36) / (HUT_COUNT - 1))

export type Hut = {
  x: number
  bites: number
  /** Ticks left of the window's flicker after a bite. */
  flicker: number
}

export function newVillage(): Hut[] {
  return Array.from({ length: HUT_COUNT }, (_, i) => ({
    x: hutX(i),
    bites: 0,
    flicker: 0,
  }))
}

export const hutLit = (hut: Hut) => hut.bites < HUT_BITES

/** The village's lit windows, as lights the swarms are drawn to. */
export function hutLights(huts: readonly Hut[]): Light[] {
  const lights: Light[] = []
  huts.forEach((hut, id) => {
    if (hutLit(hut))
      lights.push({ x: hut.x, y: WINDOW_Y, pull: 1, grounded: true, id })
  })
  return lights
}

/** Has a swarm of radius r at (x, y) reached this hut's window? */
export function reachesHut(hut: Hut, x: number, y: number, r: number): boolean {
  return Math.abs(x - hut.x) < 10 + r * 0.6 && y > WINDOW_Y - 14 - r * 0.6
}

/** Points per hut at the dawn tally. */
export const TALLY = { unbitten: 300, lit: 100, notABite: 2000 } as const

/** A row of the dawn tally; a bonus row pays its sum once (shown as +sum). */
export type TallyRow = {
  label: string
  count: number
  each: number
  bonus?: boolean
}

export type Tally = {
  rows: TallyRow[]
  total: number
  /** Not a hut was bitten all night. */
  perfect: boolean
  unbitten: number
}

/** What the village pays at dawn. */
export function dawnTally(huts: readonly Hut[]): Tally {
  const unbitten = huts.filter((h) => h.bites === 0).length
  const lit = huts.filter((h) => h.bites > 0 && hutLit(h)).length
  const perfect = unbitten === huts.length
  const rows: TallyRow[] = [
    { label: 'HUTS UNBITTEN', count: unbitten, each: TALLY.unbitten },
    { label: 'LAMPS STILL LIT', count: lit, each: TALLY.lit },
  ]
  if (perfect)
    rows.push({
      label: 'NOT A BITE!',
      count: 1,
      each: TALLY.notABite,
      bonus: true,
    })
  const total = rows.reduce((sum, r) => sum + r.count * r.each, 0)
  return { rows, total, perfect, unbitten }
}
