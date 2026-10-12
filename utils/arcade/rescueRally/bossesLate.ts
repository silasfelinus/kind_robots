// /utils/arcade/rescueRally/bossesLate.ts
//
// Rescue Rally's last three bosses (conductor kr-arcade t-037, depth-pass/CABINETS.md section 1, "The
// bosses: 0 -> 5"). bosses.ts dispatches to these; their art is in bossArt.ts.
//
// - Overgrowth (Botanic Dome): a great flower-bot. Its petals are turrets broken one by one; root
//   whips show as lines across the floor before they lash. Phase 3 it uproots and chases the hero.
// - The Static Twins (Data Docks): two bots joined by a crackling beam that sweeps the arena. The
//   link can only be broken while they are far apart; then each twin fights on, and when one goes
//   down the other enrages.
// - The Glitch Core (Storm Rooftops, the finale): a core behind four turning shields; beams reach
//   it only through lined-up gaps. Phase 2 it glitches every rescuee at once and stays shut until
//   they are all rebooted. Phase 3 it chases the hero, firing echoes of every boss before it.

import { ARENA, CX, CY, dist, toward } from './arena'
import type { Point } from './arena'
import type { Boss, BossWorld, Whip } from './bosses'
import type { Quarry } from './roster'

/** A root whip shows its line this long, then lashes for this long. */
export const WHIP_TELL = 50
export const WHIP_LIVE = 22
export const WHIP_REACH = 6
export const PETALS = 6
export const PETAL_HP = 8
/** The Twins' link can be broken only while they are at least this far apart. */
export const LINK_APART = 190
/**
 * The Core's shields: four plates turning round it on one ring, with gaps between them. A beam gets
 * through only when a gap turns to face it.
 */
export const SHIELD_RADIUS = 34
export const SHIELD_SPIN = 0.018
/** Half the width of each plate (radians); the gaps are what's left of each quarter turn. */
export const SHIELD_PLATE = 0.48

export function petalSpot(b: Boss, k: number): Point {
  const a = (k / PETALS) * Math.PI * 2 + b.timer / 160
  return { x: b.x + Math.cos(a) * 26, y: b.y - 18 + Math.sin(a) * 20 }
}

/** The Twins, wherever they are. */
export function twinSpots(b: Boss): Point[] {
  return b.twins.map((t) => ({ x: t.x, y: t.y }))
}

/** Is a shot at `p` stopped by one of the Core's shield plates? */
export function shieldBlocks(b: Boss, p: Point): boolean {
  if (b.kind !== 'core' || b.phase !== 0) return false
  const d = dist(p, { x: b.x, y: b.y })
  if (Math.abs(d - SHIELD_RADIUS) > 4) return false
  return onPlate(b, Math.atan2(p.y - b.y, p.x - b.x))
}

/** True when an angle round the Core falls on one of its four shield plates. */
export function onPlate(b: Boss, angle: number) {
  const quarter = Math.PI / 2
  const t = (((angle - b.rings[0]!) % quarter) + quarter) % quarter
  return Math.abs(t - quarter / 2) < SHIELD_PLATE
}

function whip(b: Boss, from: Point, toward_: Point) {
  const u = toward(from, toward_)
  b.whips.push({
    x0: from.x,
    y0: from.y,
    x1: from.x + u.x * 420,
    y1: from.y + u.y * 420,
    clock: WHIP_TELL + WHIP_LIVE,
  })
}

// --- Overgrowth ------------------------------------------------------------------------------------

export function stepOvergrowth(b: Boss, w: BossWorld, hero: Quarry | null) {
  const root = { x: b.x, y: b.y + 6 }
  if (b.phase === 2) {
    // Uprooted: it shuffles after the hero on its roots.
    const goal = hero ?? { x: CX, y: CY }
    const u = toward(b, goal)
    const speed = 0.55 + 0.25 * Math.abs(Math.sin(b.timer / 20))
    b.x += u.x * speed
    b.y += u.y * speed
  }
  const whipEvery = b.phase === 0 ? 150 : b.phase === 1 ? 110 : 140
  if (b.timer % whipEvery === 0 && hero) {
    whip(b, root, hero)
    if (b.phase === 1) {
      const off = { x: hero.x + (CX - hero.x) * 0.6, y: hero.y + 90 }
      whip(b, root, off)
    }
    w.sound('warn')
  }
  // Seeds from the petals (or the bare core once they are gone).
  if (b.phase === 0 && b.timer % 70 === 0 && hero) {
    const alive = b.petals
      .map((hp, k) => (hp > 0 ? k : -1))
      .filter((k) => k >= 0)
    if (alive.length) {
      const k = alive[Math.floor(w.rng() * alive.length)]!
      const p = petalSpot(b, k)
      const u = toward(p, hero)
      w.fire(p.x, p.y, u.x * 2.1, u.y * 2.1)
    }
  }
  if (b.phase >= 1 && b.timer % 160 === 80) {
    for (let k = 0; k < 10; k++) {
      const a = (k / 10) * Math.PI * 2 + b.timer / 50
      w.fire(b.x, b.y - 18, Math.cos(a) * 1.7, Math.sin(a) * 1.7)
    }
    w.sound('pop')
  }
}

// --- the Static Twins ------------------------------------------------------------------------------

export function stepTwins(b: Boss, w: BossWorld, hero: Quarry | null) {
  if (b.phase === 0) {
    // Linked: they turn about the middle, drifting apart and together; the beam sweeps.
    const apart = 80 + 140 * (0.5 + 0.5 * Math.sin(b.timer / 150))
    const a = b.timer / 220 + b.seed
    b.x = CX
    b.y = CY
    const [t0, t1] = b.twins
    t0!.x = CX + (Math.cos(a) * apart) / 2
    t0!.y = CY + ((Math.sin(a) * apart) / 2) * 0.8
    t1!.x = CX - (Math.cos(a) * apart) / 2
    t1!.y = CY - ((Math.sin(a) * apart) / 2) * 0.8
    return
  }
  const enraged = b.phase === 2
  for (const t of b.twins) {
    if (t.hp <= 0) continue
    // Apart, each wanders after the hero and fires; enraged, faster and in rings.
    t.clock = (t.clock + 1) % 1000
    const goal = hero
      ? {
          x: hero.x + Math.cos(b.timer / 60 + t.x) * 110,
          y: hero.y + Math.sin(b.timer / 47 + t.y) * 80,
        }
      : { x: CX, y: CY }
    const u = toward(t, goal)
    const speed = enraged ? 1.3 : 0.7
    t.x += u.x * speed
    t.y += u.y * speed
    t.x = Math.min(ARENA.right - 16, Math.max(ARENA.left + 16, t.x))
    t.y = Math.min(ARENA.bottom - 16, Math.max(ARENA.top + 24, t.y))
    if (!hero) continue
    if (enraged && t.clock % 90 === 0) {
      for (let k = 0; k < 10; k++) {
        const ang = (k / 10) * Math.PI * 2
        w.fire(t.x, t.y, Math.cos(ang) * 2, Math.sin(ang) * 2)
      }
      w.sound('boom')
    } else if (!enraged && t.clock % 70 === 0) {
      const v = toward(t, hero)
      w.fire(t.x, t.y, v.x * 2.4, v.y * 2.4)
      w.sound('blip')
    }
  }
  const live = b.twins.filter((t) => t.hp > 0)
  if (live.length) {
    b.x = live.reduce((s, t) => s + t.x, 0) / live.length
    b.y = live.reduce((s, t) => s + t.y, 0) / live.length
  }
}

// --- the Glitch Core -------------------------------------------------------------------------------

export function stepCore(b: Boss, w: BossWorld, hero: Quarry | null) {
  b.rings[0]! += SHIELD_SPIN
  if (b.phase < 2) {
    b.x = CX + Math.sin(b.timer / 90) * 30
    b.y = CY - 30 + Math.sin(b.timer / 60) * 10
  }
  if (b.phase === 0) {
    if (b.timer % 80 === 0 && hero) {
      const u = toward(b, hero)
      w.fire(b.x, b.y, u.x * 1.8, u.y * 1.8)
    }
    return
  }
  if (b.phase === 1) {
    if (b.timer % 120 === 0) {
      for (let k = 0; k < 8; k++) {
        const a = (k / 8) * Math.PI * 2 + b.timer / 40
        w.fire(b.x, b.y, Math.cos(a) * 1.5, Math.sin(a) * 1.5)
      }
    }
    return
  }
  // Phase 3: it chases the hero round the roof, firing echoes of every boss before it.
  const goal = hero ?? { x: CX, y: CY }
  const u = toward(b, goal)
  b.x += u.x * 0.7
  b.y += u.y * 0.7
  b.x = Math.min(ARENA.right - 30, Math.max(ARENA.left + 30, b.x))
  b.y = Math.min(ARENA.bottom - 30, Math.max(ARENA.top + 40, b.y))
  if (b.mode === 'crack') {
    if (--b.clock <= 0) {
      b.shocks.push({ x: b.x, y: b.y, r: 6, max: 170, gaps: b.gaps })
      w.sound('boom')
      b.mode = 'chase'
    }
    return
  }
  if (b.timer % 170 !== 0) return
  b.echo = (b.echo + 1) % 3
  if (b.echo === 0) {
    // The Big Wind-Up's stomp, cracks and safe lanes and all.
    b.mode = 'crack'
    b.clock = 54
    const turn = w.rng() * Math.PI * 2
    b.gaps = [0, 1, 2, 3].map((k) => turn + (k * Math.PI) / 2)
  } else if (b.echo === 1 && hero) {
    // The Jack's confetti fan.
    const a = Math.atan2(hero.y - b.y, hero.x - b.x)
    for (let k = -3; k <= 3; k++) {
      const t = a + k * 0.2
      w.fire(b.x, b.y, Math.cos(t) * 2.2, Math.sin(t) * 2.2)
    }
    w.sound('pop')
  } else if (hero) {
    // Overgrowth's root whips.
    whip(b, b, hero)
    whip(b, b, { x: hero.x + 80, y: hero.y - 60 })
    w.sound('warn')
  }
}

/** Whips count down: the line shows, then lashes, then is gone. */
export function stepWhips(b: Boss) {
  for (const wp of b.whips) wp.clock--
  b.whips = b.whips.filter((wp) => wp.clock > 0)
}

export function whipLive(wp: Whip) {
  return wp.clock <= WHIP_LIVE
}
