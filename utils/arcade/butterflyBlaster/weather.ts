// /utils/arcade/butterflyBlaster/weather.ts
//
// The later regions' skies (conductor kr-arcade/t-057, CABINETS.md section 6 "The regions"):
//
//   Tide        (Mangrove Delta) the water rises and falls on a slow cycle. The water line is a
//               floor the butterfly bounces off, so a high tide shrinks the sky.
//   Fog         banks drift across and hide whatever is inside them; fireflies light pools of it,
//               and a shade swarm only shows in their light (or a lightning flash).
//   Strings     (Market Town) strings of festival bulbs cross the sky and the swarms flock to them.
//               A swarm that lingers at a lit string lays a new mosquito; sparkle a string to dim
//               it for a while and send the flock elsewhere.
//   Storm       (Tea Hills) lightning lights the whole sky on a beat, and strikes a spot on the
//               ground after a one-second glow. Rain soaks the wings until a rainbow updraft
//               dries them.
//   Coins       (the Moonlit Lagoon) coins of moonlight hang everywhere, for the catching.
//
// Weather is gameplay, so it rolls the game's rng.

import { GROUND, SKY, W, toward } from './sky'
import type { Point } from './sky'
import type { Light } from './swarm'

export const TIDE = { low: GROUND, high: GROUND - 70, period: 1800 } as const
export const FOG = { banks: 3, radius: 58, speed: 0.18 } as const
export const FIREFLY = { count: 4, reach: 62, speed: 0.4 } as const
export const STRINGS = {
  ys: [92, 150, 208],
  /** Bulbs on a string, each a light. */
  bulbs: 4,
  pull: 1.25,
  dim: 600,
  /** A swarm lingering this long at a lit string lays a mosquito. */
  lay: 360,
  reach: 30,
} as const
export const STORM = {
  /** Ticks between flashes, easing to `fastest` as the night builds. */
  every: 260,
  fastest: 120,
  flash: 14,
  /** The strike's glow tell on the ground, and the width of its column. */
  tell: 60,
  reach: 12,
  /** Rain soaks the wings this fast, to `soaked`. */
  soak: 1,
  soaked: 600,
  updraftEvery: 520,
  updraft: 300,
  updraftReach: 16,
} as const
export const COINS = { count: 10, points: 100, reach: 14 } as const

export type Weather = {
  t: number
  tide: boolean
  fog: { x: number; y: number; vx: number }[]
  fireflies: (Point & { vx: number; vy: number })[]
  strings: { y: number; dim: number; linger: number }[]
  storm: {
    on: boolean
    next: number
    flash: number
    /** A strike glowing on the ground before it lands. */
    strike: { x: number; t: number } | null
    /** Ticks since the last strike landed (for its afterglow). */
    struck: { x: number; t: number } | null
    updrafts: { x: number; t: number }[]
    nextUpdraft: number
  }
  coins: (Point & { phase: number })[]
}

export type WeatherPlan = {
  tide?: boolean
  fog?: boolean
  strings?: boolean
  storm?: boolean
  coins?: boolean
}

export function newWeather(plan: WeatherPlan, rng: () => number): Weather {
  return {
    t: 0,
    tide: !!plan.tide,
    fog: plan.fog
      ? Array.from({ length: FOG.banks }, (_, i) => ({
          x: rng() * W,
          y: 70 + i * 70 + rng() * 30,
          vx: (rng() < 0.5 ? -1 : 1) * FOG.speed,
        }))
      : [],
    fireflies:
      plan.fog || plan.tide
        ? Array.from({ length: FIREFLY.count }, () => ({
            x: rng() * W,
            y: 60 + rng() * (GROUND - 140),
            vx: (rng() - 0.5) * FIREFLY.speed,
            vy: (rng() - 0.5) * FIREFLY.speed,
          }))
        : [],
    strings: plan.strings
      ? STRINGS.ys.map((y) => ({ y, dim: 0, linger: 0 }))
      : [],
    storm: {
      on: !!plan.storm,
      next: STORM.every,
      flash: 0,
      strike: null,
      struck: null,
      updrafts: [],
      nextUpdraft: Math.round(STORM.updraftEvery / 2),
    },
    coins: plan.coins
      ? Array.from({ length: COINS.count }, () => ({
          x: 20 + rng() * (W - 40),
          y: 40 + rng() * (GROUND - 120),
          phase: rng() * 6,
        }))
      : [],
  }
}

/** The tide's water line now (GROUND when there is no tide). */
export function tideLine(w: Weather): number {
  if (!w.tide) return SKY
  const k = (1 - Math.cos((w.t / TIDE.period) * Math.PI * 2)) / 2
  return TIDE.low + (TIDE.high - TIDE.low) * k
}

/** Where a string of bulbs sags at x (a shallow arc between poles at the edges). */
export function stringY(y: number, x: number): number {
  const t = x / W
  return y + Math.sin(t * Math.PI) * 18
}

/** The lit strings' bulbs, as lights the swarms flock to. */
export function stringLights(w: Weather): Light[] {
  const out: Light[] = []
  w.strings.forEach((s, i) => {
    if (s.dim > 0) return
    for (let b = 0; b < STRINGS.bulbs; b++) {
      const x = ((b + 0.5) / STRINGS.bulbs) * W
      out.push({
        x,
        y: stringY(s.y, x),
        pull: STRINGS.pull,
        grounded: false,
        id: 400 + i * 10 + b,
      })
    }
  })
  return out
}

/** Is a point lit for a shade swarm: a firefly near it, or a lightning flash? */
export function litForShade(
  w: Weather,
  at: Point,
  extra: readonly Point[] = [],
) {
  if (w.storm.flash > 0) return true
  for (const f of [...w.fireflies, ...extra])
    if (Math.hypot(toward(f, at).x, toward(f, at).y) < FIREFLY.reach)
      return true
  return false
}

/** Is a point inside a fog bank (and not in a firefly's light)? */
export function inFog(w: Weather, at: Point, extra: readonly Point[] = []) {
  if (!w.fog.length) return false
  if (litForShade(w, at, extra)) return false
  return w.fog.some(
    (f) => Math.hypot(toward(f, at).x, toward(f, at).y) < FOG.radius,
  )
}

/** What the weather did this tick that the game must answer. */
export type WeatherEvent = {
  flash?: boolean
  strikeTell?: number
  strike?: number
}

/**
 * One tick of the weather. `build` (0..1) is how far the night has gone, for a storm that builds;
 * `aim` is where a strike should land near (the butterfly).
 */
export function tickWeather(
  w: Weather,
  rng: () => number,
  build: number,
  aim: Point | null,
): WeatherEvent {
  w.t++
  const ev: WeatherEvent = {}
  for (const f of w.fog) {
    f.x += f.vx
    if (f.x < -FOG.radius) f.x += W + FOG.radius * 2
    else if (f.x > W + FOG.radius) f.x -= W + FOG.radius * 2
  }
  for (const f of w.fireflies) {
    f.vx += (rng() - 0.5) * 0.06
    f.vy += (rng() - 0.5) * 0.06
    const s = Math.hypot(f.vx, f.vy)
    if (s > FIREFLY.speed) {
      f.vx *= FIREFLY.speed / s
      f.vy *= FIREFLY.speed / s
    }
    f.x = (f.x + f.vx + W) % W
    f.y = Math.max(40, Math.min(GROUND - 60, f.y + f.vy))
  }
  for (const s of w.strings) if (s.dim > 0) s.dim--
  const st = w.storm
  if (st.on) {
    if (st.flash > 0) st.flash--
    if (st.struck && ++st.struck.t > 20) st.struck = null
    if (st.strike && --st.strike.t <= 0) {
      ev.strike = st.strike.x
      st.struck = { x: st.strike.x, t: 0 }
      st.strike = null
    }
    if (--st.next <= 0) {
      st.flash = STORM.flash
      ev.flash = true
      const x = aim ? aim.x + (rng() - 0.5) * 120 : rng() * W
      st.strike = { x: Math.max(10, Math.min(W - 10, x)), t: STORM.tell }
      ev.strikeTell = st.strike.x
      const gap =
        STORM.every - (STORM.every - STORM.fastest) * Math.min(1, build)
      st.next = Math.round(gap * (0.8 + rng() * 0.4))
    }
    for (const u of st.updrafts) u.t--
    st.updrafts = st.updrafts.filter((u) => u.t > 0)
    if (--st.nextUpdraft <= 0) {
      st.updrafts.push({ x: 40 + rng() * (W - 80), t: STORM.updraft })
      st.nextUpdraft = STORM.updraftEvery
    }
  }
  return ev
}
