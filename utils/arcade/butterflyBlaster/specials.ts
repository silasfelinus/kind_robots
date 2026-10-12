// /utils/arcade/butterflyBlaster/specials.ts
//
// The special nights (conductor kr-arcade/t-056, CABINETS.md section 6 "The regions"): each
// region's third night has an objective of its own.
//
//   The Lantern Walk  villagers carry eight lanterns along the riverbank. Lanterns pull harder
//                     than lit windows, so the swarms flock to them; keep at least five unbitten.
//   Tip the Pots      six water jars stand by the paddies. Sparkle a jar twice to tip it: the water
//                     runs out, its paddy dries and stops breeding. Tip all six before dawn.

import { GROUND, W } from './sky'
import type { PoolSpot } from './nights'
import type { Light } from './swarm'

export type Lantern = {
  x: number
  dir: 1 | -1
  bitten: boolean
  /** Ticks of the flicker after a bite. */
  flicker: number
  seed: number
}

export const LANTERN = {
  count: 8,
  keep: 5,
  speed: 0.22,
  /** Held at about shoulder height. */
  y: GROUND - 16,
  pull: 1.6,
  /** Light ids for lanterns start here (huts are 0..7). */
  id: 100,
} as const

export function newLanterns(): Lantern[] {
  return Array.from({ length: LANTERN.count }, (_, i) => ({
    x: 30 + i * ((W - 60) / (LANTERN.count - 1)),
    dir: i % 2 === 0 ? 1 : -1,
    bitten: false,
    flicker: 0,
    seed: i * 1.7,
  }))
}

/** The villagers stroll the bank, turning at the ends. */
export function walkLanterns(lanterns: Lantern[]) {
  for (const l of lanterns) {
    if (l.flicker > 0) l.flicker--
    if (l.bitten) continue
    l.x += l.dir * LANTERN.speed
    if (l.x < 14) l.dir = 1
    else if (l.x > W - 14) l.dir = -1
  }
}

export function lanternLights(lanterns: readonly Lantern[]): Light[] {
  const out: Light[] = []
  lanterns.forEach((l, i) => {
    if (!l.bitten)
      out.push({
        x: l.x,
        y: LANTERN.y,
        pull: LANTERN.pull,
        grounded: true,
        id: LANTERN.id + i,
      })
  })
  return out
}

export type Jar = {
  x: number
  y: number
  /** Sparkle hits taken (2 tips it). */
  hits: number
  tipped: boolean
  /** Ticks into the tipping animation. */
  tip: number
  /** The paddy it drains (an index into the night's pools). */
  pool: number
}

export const JAR = { hits: 2, radius: 9, points: 300 } as const

/** A jar at each spot, draining the paddy of the same index. */
export function newJars(spots: readonly PoolSpot[]): Jar[] {
  return spots.map((p, i) => ({
    x: p.x,
    y: p.y,
    hits: 0,
    tipped: false,
    tip: 0,
    pool: i,
  }))
}

export type SpecialState =
  { kind: 'lanterns'; lanterns: Lantern[] } | { kind: 'pots'; jars: Jar[] }

/** Has the special night's objective been met (asked at dawn)? */
export function specialMet(s: SpecialState): boolean {
  if (s.kind === 'lanterns')
    return s.lanterns.filter((l) => !l.bitten).length >= LANTERN.keep
  return s.jars.every((j) => j.tipped)
}

/** The objective line in the HUD. */
export function specialLine(s: SpecialState): string {
  if (s.kind === 'lanterns') {
    const lit = s.lanterns.filter((l) => !l.bitten).length
    return `LANTERNS ${lit}/${LANTERN.count} KEEP ${LANTERN.keep}`
  }
  const tipped = s.jars.filter((j) => j.tipped).length
  return `POTS TIPPED ${tipped}/${s.jars.length}`
}

/** The objective as the night's banner says it. */
export const SPECIAL_GOAL = {
  lanterns: `KEEP ${LANTERN.keep} OF ${LANTERN.count} LANTERNS LIT`,
  pots: 'SPARKLE THE JARS TO TIP THEM',
} as const
