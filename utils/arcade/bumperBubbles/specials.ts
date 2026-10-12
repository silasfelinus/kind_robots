// /utils/arcade/bumperBubbles/specials.ts
//
// Special bubbles and the Frost flavour's ice (conductor kr-arcade/t-060, spec: CABINETS.md
// section 7, "Bubbles, items and meta"). Popping a special bubble unleashes it:
//
//   Splash  a water wave runs along the platforms and down off them, washing every grump it
//           sweeps up off the floor (they come out as treats);
//   Zap     a bolt flies across the row and zaps every grump it touches;
//   Toasty  pepper flames drop to the platform below and run along it both ways.
//
// A Frost bubble that traps a grump freezes it into an ice block that drops and slides along
// the platform, bowling over every grump in its path. Each effect counts the grumps it takes,
// so the treats climb the ladder just as a cluster pop's do.

import {
  FLOOR_Y,
  TILE,
  TOP,
  WALL_L,
  WALL_R,
  groundBelow,
  stepBody,
  surface,
} from './tower'
import type { Body, Floor, SpecialKind, Spot } from './tower'
import { grumpCentre } from './grumps'
import type { Grump } from './grumps'

export type Wave = Body & {
  dir: -1 | 1
  t: number
  bounces: number
  carried: Grump[]
  /** Recent positions, for the water trailing behind the head. */
  trail: Spot[]
}
export type Bolt = {
  x: number
  y: number
  dir: -1 | 1
  t: number
  hits: number
}
export type Fire = {
  y: number
  /** The platform run it can spread over. */
  min: number
  max: number
  left: number
  right: number
  t: number
  hits: number
}
export type Ice = Body & { dir: -1 | 1; grump: Grump; hits: number; t: number }

export type Effects = {
  waves: Wave[]
  bolts: Bolt[]
  fires: Fire[]
  ice: Ice[]
}

export function noEffects(): Effects {
  return { waves: [], bolts: [], fires: [], ice: [] }
}

export const WAVE = { speed: 2.4, life: 360, bounces: 3 }
export const BOLT_SPEED = 4.5
export const FIRE = { spread: 1.6, life: 300 }
export const ICE = { speed: 2.6, life: 420 }

/** What the effects can do to the floor around them. */
export interface EffectHost {
  floor: Floor
  grumps: Grump[]
  /** A grump taken by an effect: it tumbles out as a treat on rung `count` (its place in the haul). */
  defeat(g: Grump, x: number, y: number, count: number): void
  /** A bolt or a flame reaching a boss; true if it hurt. */
  strikeBoss?(x: number, y: number, kind: 'zap' | 'fire' | 'wave'): boolean
}

/** Set a popped special bubble loose at `at`, heading `dir` (away from the robot that popped it). */
export function unleash(
  fx: Effects,
  f: Floor,
  kind: SpecialKind,
  at: Spot,
  dir: -1 | 1,
) {
  if (kind === 'zap') {
    fx.bolts.push({ x: at.x, y: at.y, dir, t: 0, hits: 0 })
  } else if (kind === 'splash') {
    fx.waves.push({
      x: at.x,
      y: at.y,
      vx: 0,
      vy: 0,
      onGround: false,
      dir,
      t: 0,
      bounces: 0,
      carried: [],
      trail: [],
    })
  } else {
    // The flames drop onto the platform below and spread along its whole run.
    const y = groundBelow(f, at.x, at.y, 4)
    const r = Math.round((y - TOP) / TILE)
    let c0 = Math.floor(at.x / TILE)
    let c1 = c0
    if (y < FLOOR_Y || surface(f, c0, r)) {
      while (surface(f, c0 - 1, r)) c0--
      while (surface(f, c1 + 1, r)) c1++
    } else {
      c0 = 2
      c1 = 29
    }
    fx.fires.push({
      y,
      min: c0 * TILE,
      max: (c1 + 1) * TILE,
      left: at.x,
      right: at.x,
      t: 0,
      hits: 0,
    })
  }
}

/** A Frost bubble's catch, frozen into a sliding block. */
export function freeze(fx: Effects, g: Grump, at: Spot, dir: -1 | 1) {
  fx.ice.push({
    x: at.x,
    y: at.y + 6,
    vx: 0,
    vy: 0,
    onGround: false,
    dir,
    grump: g,
    hits: 0,
    t: 0,
  })
}

function take(
  host: EffectHost,
  hit: (g: Grump) => boolean,
  each: (g: Grump) => void,
) {
  for (const g of [...host.grumps]) {
    if (!hit(g)) continue
    host.grumps.splice(host.grumps.indexOf(g), 1)
    each(g)
  }
}

/** One tick of every effect on the floor. */
export function updateEffects(fx: Effects, host: EffectHost) {
  const f = host.floor
  // Waves.
  for (const w of fx.waves) {
    w.t++
    w.vx = w.dir * WAVE.speed
    const step = stepBody(f, w, 4)
    if (step.bumped) {
      w.dir = w.dir === 1 ? -1 : 1
      w.bounces++
    }
    w.trail.unshift({ x: w.x, y: w.y })
    if (w.trail.length > 18) w.trail.pop()
    take(
      host,
      (g) => {
        const c = grumpCentre(g)
        return Math.abs(c.x - w.x) < 12 && Math.abs(c.y - (w.y - 5)) < 14
      },
      (g) => w.carried.push(g),
    )
    for (const g of w.carried) {
      g.x = w.x
      g.y = w.y
    }
    host.strikeBoss?.(w.x, w.y - 6, 'wave')
    if (step.wrapped || w.t > WAVE.life || w.bounces >= WAVE.bounces) {
      // Washed off the floor: the haul comes out as treats.
      w.carried.forEach((g, i) =>
        host.defeat(g, w.x, Math.min(w.y, FLOOR_Y) - 8, i),
      )
      w.carried = []
      w.t = -1
    }
  }
  fx.waves = fx.waves.filter((w) => w.t >= 0)
  // Bolts.
  for (const b of fx.bolts) {
    b.t++
    b.x += b.dir * BOLT_SPEED
    take(
      host,
      (g) => {
        const c = grumpCentre(g)
        return Math.abs(c.x - b.x) < 9 && Math.abs(c.y - b.y) < 11
      },
      (g) => host.defeat(g, g.x, g.y - 6, b.hits++),
    )
    if (host.strikeBoss?.(b.x, b.y, 'zap')) b.t = -1
    if (b.x < WALL_L - 8 || b.x > WALL_R + 8) b.t = -1
  }
  fx.bolts = fx.bolts.filter((b) => b.t >= 0)
  // Flames.
  for (const fire of fx.fires) {
    fire.t++
    fire.left = Math.max(fire.min, fire.left - FIRE.spread)
    fire.right = Math.min(fire.max, fire.right + FIRE.spread)
    take(
      host,
      (g) =>
        g.onGround &&
        Math.abs(g.y - fire.y) < 2 &&
        g.x > fire.left - 4 &&
        g.x < fire.right + 4,
      (g) => host.defeat(g, g.x, g.y - 6, fire.hits++),
    )
    if (fire.t % 20 === 0)
      for (let x = fire.left; x <= fire.right; x += 24)
        host.strikeBoss?.(x, fire.y - 8, 'fire')
    if (fire.t > FIRE.life) fire.t = -1
  }
  fx.fires = fx.fires.filter((fire) => fire.t >= 0)
  // Ice blocks.
  for (const ice of fx.ice) {
    ice.t++
    ice.vx = ice.onGround ? ice.dir * ICE.speed : 0
    const step = stepBody(f, ice, 6)
    take(
      host,
      (g) => {
        const c = grumpCentre(g)
        return Math.abs(c.x - ice.x) < 12 && Math.abs(c.y - (ice.y - 7)) < 12
      },
      (g) => host.defeat(g, g.x, g.y - 6, ++ice.hits),
    )
    if (step.bumped || ice.t > ICE.life) {
      // It shatters, and the grump inside tumbles out too.
      host.defeat(ice.grump, ice.x, ice.y - 8, 0)
      ice.t = -1
    }
  }
  fx.ice = fx.ice.filter((ice) => ice.t >= 0)
}
