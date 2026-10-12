// /utils/arcade/butterflyBlaster/specials.ts
//
// The special nights (conductor kr-arcade/t-056, CABINETS.md section 6 "The regions"): each
// region's third night has an objective of its own.
//
//   The Lantern Walk  villagers carry eight lanterns along the riverbank. Lanterns pull harder
//                     than lit windows, so the swarms flock to them; keep at least five unbitten.
//   Tip the Pots      six water jars stand by the paddies. Sparkle a jar twice to tip it: the water
//                     runs out, its paddy dries and stops breeding. Tip all six before dawn.
//   Firefly Escort    (t-057) lead a drifting firefly cloud across the delta; it lifts the fog.
//   Night Market      (t-057) the stall lights blink on in turn: defend whichever is lit.
//   Hold the Hill     (t-057) the tea pickers' shelter on the summit must stay unbitten.
//   The Long Night    (t-057) three waves before the dawn tally.

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

// --- the Firefly Escort (Mangrove Delta) -----------------------------------------------------------

/**
 * A drifting cloud of fireflies to see across the delta. It edges along on its own, follows the
 * butterfly when it flies close, and lifts the fog wherever it shines. The swarms flock to its
 * glow; five bites and it scatters.
 */
export type Escort = {
  x: number
  y: number
  vx: number
  vy: number
  health: number
  flicker: number
  arrived: boolean
}
export const ESCORT = {
  health: 5,
  drift: 0.12,
  follow: 70,
  speed: 0.7,
  /** It is across when it reaches here. */
  goal: W - 34,
  pull: 1.8,
  id: 300,
  reach: 12,
} as const

export function newEscort(): Escort {
  return {
    x: 30,
    y: 150,
    vx: 0,
    vy: 0,
    health: ESCORT.health,
    flicker: 0,
    arrived: false,
  }
}

/** One tick of the firefly cloud, drawn along by the butterfly. */
export function moveEscort(e: Escort, ship: { x: number; y: number } | null) {
  if (e.flicker > 0) e.flicker--
  if (e.arrived || e.health <= 0) return
  let tx = ESCORT.drift
  let ty = (150 - e.y) * 0.002
  if (ship) {
    const dx = ship.x - e.x
    const dy = ship.y - e.y
    const d = Math.hypot(dx, dy)
    if (d < ESCORT.follow && d > 18) {
      tx = (dx / d) * ESCORT.speed
      ty = (dy / d) * ESCORT.speed
    }
  }
  e.vx += (tx - e.vx) * 0.05
  e.vy += (ty - e.vy) * 0.05
  e.x = Math.max(12, e.x + e.vx)
  e.y = Math.max(40, Math.min(GROUND - 50, e.y + e.vy))
  if (e.x >= ESCORT.goal) e.arrived = true
}

// --- the Night Market (Market Town) -------------------------------------------------------------------

/** The stalls light one at a time; whichever is lit is the spot to defend. */
export type Stall = { x: number; bites: number; flicker: number }
export const MARKET = {
  stalls: [113, 176, 240, 303, 367],
  /** Ticks each stall stays lit. */
  lit: 480,
  pull: 2,
  /** Stall bites the market can take and still be a success. */
  spare: 2,
  y: GROUND - 20,
  id: 500,
} as const

export function newStalls(): Stall[] {
  return MARKET.stalls.map((x) => ({ x, bites: 0, flicker: 0 }))
}

// --- Hold the Hill (Tea Hills) -------------------------------------------------------------------------

export type Shelter = { x: number; y: number; bites: number; flicker: number }
export const SHELTER = { x: W / 2, y: GROUND - 64, pull: 1.6, id: 600 } as const

export type SpecialState =
  | { kind: 'lanterns'; lanterns: Lantern[] }
  | { kind: 'pots'; jars: Jar[] }
  | { kind: 'escort'; escort: Escort }
  | { kind: 'market'; stalls: Stall[]; lit: number; t: number }
  | { kind: 'hill'; shelter: Shelter }
  | { kind: 'long' }

/** The lights a special night adds for the swarms. */
export function specialLights(s: SpecialState): Light[] {
  if (s.kind === 'lanterns') return lanternLights(s.lanterns)
  if (s.kind === 'escort') {
    const e = s.escort
    if (e.arrived || e.health <= 0) return []
    return [
      { x: e.x, y: e.y, pull: ESCORT.pull, grounded: false, id: ESCORT.id },
    ]
  }
  if (s.kind === 'market') {
    const st = s.stalls[s.lit]!
    return [
      {
        x: st.x,
        y: MARKET.y,
        pull: MARKET.pull,
        grounded: true,
        id: MARKET.id + s.lit,
      },
    ]
  }
  if (s.kind === 'hill')
    return [
      {
        x: s.shelter.x,
        y: s.shelter.y,
        pull: SHELTER.pull,
        grounded: true,
        id: SHELTER.id,
      },
    ]
  return []
}

/** Has the special night's objective been met (asked at dawn)? */
export function specialMet(s: SpecialState): boolean {
  if (s.kind === 'lanterns')
    return s.lanterns.filter((l) => !l.bitten).length >= LANTERN.keep
  if (s.kind === 'pots') return s.jars.every((j) => j.tipped)
  if (s.kind === 'escort') return s.escort.arrived && s.escort.health > 0
  if (s.kind === 'market')
    return s.stalls.reduce((n, st) => n + st.bites, 0) <= MARKET.spare
  if (s.kind === 'hill') return s.shelter.bites === 0
  return true
}

/** The objective line in the HUD. */
export function specialLine(s: SpecialState): string {
  if (s.kind === 'lanterns') {
    const lit = s.lanterns.filter((l) => !l.bitten).length
    return `LANTERNS ${lit}/${LANTERN.count} KEEP ${LANTERN.keep}`
  }
  if (s.kind === 'pots') {
    const tipped = s.jars.filter((j) => j.tipped).length
    return `POTS TIPPED ${tipped}/${s.jars.length}`
  }
  if (s.kind === 'escort') {
    const e = s.escort
    if (e.health <= 0) return 'THE FIREFLIES SCATTERED'
    if (e.arrived) return 'THE FIREFLIES ARE ACROSS!'
    const way = Math.round((e.x / ESCORT.goal) * 100)
    return `FIREFLIES ${way}% ACROSS  GLOW ${e.health}`
  }
  if (s.kind === 'market') {
    const bites = s.stalls.reduce((n, st) => n + st.bites, 0)
    return `STALL BITES ${bites} (AT MOST ${MARKET.spare})`
  }
  if (s.kind === 'hill')
    return s.shelter.bites ? 'THE SHELTER WAS BITTEN' : 'SHELTER UNBITTEN'
  return 'THE LONG NIGHT: THREE WAVES'
}

/** The objective as the night's banner says it. */
export const SPECIAL_GOAL = {
  lanterns: `KEEP ${LANTERN.keep} OF ${LANTERN.count} LANTERNS LIT`,
  pots: 'SPARKLE THE JARS TO TIP THEM',
  escort: 'LEAD THE FIREFLIES ACROSS THE DELTA',
  market: 'GUARD WHICHEVER STALL IS LIT',
  hill: "KEEP THE PICKERS' SHELTER UNBITTEN",
  long: 'THREE WAVES BEFORE THE DAWN',
} as const
