// /utils/arcade/ghostTrail/foes.ts
//
// Zuzu: Ghost Trail's foe roster (conductor kr-arcade t-015..t-019): each kind's toughness, points,
// body, and how it moves and attacks, behind one small interface so the game loop, the demo pilot and
// the tests treat every foe alike. Behaviours are deterministic: all chance comes from `ctx.rng`, the
// run's seeded generator, and they only ever push hazards through `ctx.bolt` (no direct damage).

import type { FoeKind, Holding } from './world'

export type Foe = {
  kind: FoeKind
  /** Stable squad-member id (encounters), or null for an ambient foe. */
  id: string | null
  x: number
  y: number
  vx: number
  vy: number
  hp: number
  t: number
  /** Generic behaviour state: spirits rise/walk/sink; others use walk/aim/attack/rest/dive. */
  phase: 'rise' | 'walk' | 'sink' | 'aim' | 'attack' | 'rest' | 'dive'
  /** Spirits: the ground line they rise to; flyers: their cruising line. */
  baseY: number
  /** What it drops when put down (crows and harpies carry gear bundles). */
  carrying: Holding | null
  /** Counts down to the next behaviour change. */
  timer: number
  /** Which way it looks, -1 or 1 (for art and attacks). */
  face: number
}

/** A hostile projectile or ground effect. Hits Zuzu on contact; `grav` arcs it. */
export type Bolt = {
  kind:
    | 'clod'
    | 'bullet'
    | 'orb'
    | 'bone'
    | 'feather'
    | 'ember'
    | 'pillar'
    | 'wave'
    | 'chain'
    | 'anchor'
  x: number
  y: number
  vx: number
  vy: number
  /** Gravity per tick (0 for straight shots). */
  grav: number
  life: number
  /** Ticks before it becomes harmful (a telegraph, e.g. a pillar's glow). */
  arm: number
  /** Half extents of its harmful box around (x, y). */
  hw: number
  hh: number
  t: number
  /** Optional colour for a wave: the Ferryman's water (default), the Heretic's crimson, the Abbess's violet. */
  tint?: 'crimson' | 'violet'
}

/** What a foe can see and do each tick. */
export type FoeCtx = {
  px: number
  py: number
  groundY: number
  /** Enemy speed scale for the act (difficulty). */
  speed: number
  rng: () => number
  groundAt: (x: number) => boolean
  /** Solid ground or block top under x near y (for walkers on ledges), else null. */
  floorAt: (x: number, y: number) => number | null
  blockedAt: (x: number, y: number) => boolean
  /** Water line at this tick, or null when the act has no tide. */
  waterY: number | null
  bolt: (b: Omit<Bolt, 't'>) => void
  sound: (name: string) => void
}

export type FoeDef = {
  hp: number
  points: number
  /** Body: half width, centre height above the feet, half height. */
  hw: number
  cy: number
  hh: number
  /** Flyers ignore ground. */
  flies?: boolean
  /** Spirits/drowned rise out of the ground and can't be hit until mostly out. */
  rises?: boolean
  spawn: (f: Foe, ctx: FoeCtx) => void
  update: (f: Foe, ctx: FoeCtx) => void
}

const towards = (from: number, to: number) => Math.sign(to - from) || 1

/** Gravity and ground for walkers: settle on ground/blocks, fall into pits. */
function walkPhysics(f: Foe, ctx: FoeCtx, hopPits: boolean) {
  f.vy += 0.3
  const nx = f.x + f.vx
  if (!ctx.blockedAt(nx, f.y - 4)) f.x = nx
  f.y += f.vy
  const floor = ctx.floorAt(f.x, f.y - f.vy)
  if (floor !== null && f.y >= floor && f.y - f.vy <= floor + 1) {
    f.y = floor
    f.vy = 0
    if (hopPits) {
      const ahead = f.x + Math.sign(f.vx) * 18
      if (ctx.floorAt(ahead, f.y) === null || ctx.blockedAt(ahead, f.y - 4))
        f.vy = -5
    }
  }
}

export const FOES: Record<FoeKind, FoeDef> = {
  // Restless spirits claw up out of the dirt, shuffle at Zuzu, then sink back.
  spirit: {
    hp: 1,
    points: 100,
    hw: 9,
    cy: 8,
    hh: 14,
    rises: true,
    spawn: (f) => {
      f.baseY = f.y
      f.y += 14
      f.phase = 'rise'
    },
    update: (f, ctx) => {
      if (f.phase === 'rise') {
        f.y -= 0.5
        if (f.y <= f.baseY) {
          f.y = f.baseY
          f.phase = 'walk'
        }
      } else if (f.phase === 'walk') {
        const dir = towards(f.x, ctx.px)
        f.face = dir
        f.x += dir * 0.5 * ctx.speed
        if (!ctx.groundAt(f.x) && f.baseY >= ctx.groundY)
          f.x -= dir * 0.5 * ctx.speed
        if (f.t > 60 * 6) f.phase = 'sink'
      } else {
        f.y += 0.4
        if (f.y > f.baseY + 16) f.hp = -99
      }
    },
  },
  // Storm crows swoop toward Zuzu's height and away; some carry a gear bundle.
  crow: {
    hp: 1,
    points: 150,
    hw: 9,
    cy: 8,
    hh: 14,
    flies: true,
    spawn: (f, ctx) => {
      f.vx = -1.4 * ctx.speed * (f.x > ctx.px ? 1 : -1)
      f.face = Math.sign(f.vx) || -1
    },
    update: (f, ctx) => {
      f.x += f.vx
      const target = ctx.py - 14
      f.y +=
        Math.max(-1, Math.min(1, (target - f.y) * 0.02)) +
        Math.sin(f.t / 10) * 0.6
    },
  },
  // Spectral bone coyotes run in hard and leap pits and graves.
  hyena: {
    hp: 2,
    points: 300,
    hw: 9,
    cy: 8,
    hh: 14,
    spawn: (f, ctx) => {
      f.vx = -1.6 * ctx.speed * (f.x > ctx.px ? 1 : -1)
      f.face = Math.sign(f.vx) || -1
    },
    update: (f, ctx) => {
      walkPhysics(f, ctx, true)
    },
  },
  // Skeleton gunslingers walk into range, draw (a red glint: the tell), and fire a bullet at chest
  // height: jump it. Then they holster and step.
  gunslinger: {
    hp: 2,
    points: 400,
    hw: 8,
    cy: 12,
    hh: 13,
    spawn: (f) => {
      f.phase = 'walk'
      f.timer = 40
    },
    update: (f, ctx) => {
      const dir = towards(f.x, ctx.px)
      f.face = dir
      const gap = Math.abs(ctx.px - f.x)
      if (f.phase === 'walk') {
        f.vx = gap > 110 ? dir * 0.7 * ctx.speed : gap < 60 ? -dir * 0.5 : 0
        if (--f.timer <= 0 && gap < 150) {
          f.phase = 'aim'
          f.timer = 42
          f.vx = 0
          ctx.sound('warn')
        }
      } else if (f.phase === 'aim') {
        f.vx = 0
        if (--f.timer <= 0) {
          ctx.bolt({
            kind: 'bullet',
            x: f.x + dir * 10,
            y: f.y - 14,
            vx: dir * 2.6 * ctx.speed,
            vy: 0,
            grav: 0,
            life: 160,
            arm: 0,
            hw: 4,
            hh: 2,
          })
          ctx.sound('shoot')
          f.phase = 'rest'
          f.timer = 70
        }
      } else if (--f.timer <= 0) {
        f.phase = 'walk'
        f.timer = 50 + Math.floor(ctx.rng() * 40)
      }
      walkPhysics(f, ctx, false)
    },
  },
  // Ghost monks float at head height, pause to chant (a cyan glow: the tell), and loose a slow orb
  // that drifts after Zuzu.
  monk: {
    hp: 3,
    points: 500,
    hw: 9,
    cy: 14,
    hh: 16,
    flies: true,
    spawn: (f) => {
      f.baseY = f.y
      f.timer = 90
    },
    update: (f, ctx) => {
      const dir = towards(f.x, ctx.px)
      f.face = dir
      f.y = f.baseY + Math.sin(f.t / 22) * 6
      if (f.phase === 'aim') {
        if (--f.timer <= 0) {
          const dx = ctx.px - f.x
          const dy = ctx.py - 12 - (f.y - 14)
          const d = Math.hypot(dx, dy) || 1
          ctx.bolt({
            kind: 'orb',
            x: f.x,
            y: f.y - 14,
            vx: (dx / d) * 1.1,
            vy: (dy / d) * 1.1,
            grav: 0,
            life: 240,
            arm: 0,
            hw: 4,
            hh: 4,
          })
          f.phase = 'walk'
          f.timer = 130 + Math.floor(ctx.rng() * 50)
        }
        return
      }
      if (Math.abs(ctx.px - f.x) > 70) f.x += dir * 0.45 * ctx.speed
      if (--f.timer <= 0) {
        f.phase = 'aim'
        f.timer = 36
        ctx.sound('warn')
      }
    },
  },
  // Grave ghouls squat on ledges and graves and lob bones in an arc.
  ghoul: {
    hp: 2,
    points: 350,
    hw: 8,
    cy: 9,
    hh: 11,
    spawn: (f) => {
      f.timer = 60
    },
    update: (f, ctx) => {
      const dir = towards(f.x, ctx.px)
      f.face = dir
      f.vx = 0
      if (--f.timer <= 0 && Math.abs(ctx.px - f.x) < 170) {
        const flight = 46
        ctx.bolt({
          kind: 'bone',
          x: f.x,
          y: f.y - 16,
          vx: (ctx.px - f.x) / flight,
          vy: -4.2,
          grav: 0.18,
          life: 120,
          arm: 0,
          hw: 4,
          hh: 4,
        })
        ctx.sound('shoot')
        f.timer = 90 + Math.floor(ctx.rng() * 50)
      }
      walkPhysics(f, ctx, false)
    },
  },
  // The drowned haul themselves out of the water and pits and wade at Zuzu, slow and stubborn.
  drowned: {
    hp: 3,
    points: 400,
    hw: 9,
    cy: 12,
    hh: 14,
    rises: true,
    spawn: (f) => {
      f.baseY = f.y
      f.y += 20
      f.phase = 'rise'
    },
    update: (f, ctx) => {
      if (f.phase === 'rise') {
        f.y -= 0.4
        if (f.y <= f.baseY) {
          f.y = f.baseY
          f.phase = 'walk'
        }
        return
      }
      const dir = towards(f.x, ctx.px)
      f.face = dir
      f.vx = dir * 0.35 * ctx.speed
      walkPhysics(f, ctx, false)
    },
  },
  // Leeches hop along the banks in short arcs at Zuzu.
  leech: {
    hp: 1,
    points: 150,
    // A tall-ish box for a low body, so a kunai thrown from standing still finds it.
    hw: 7,
    cy: 6,
    hh: 8,
    spawn: (f) => {
      f.timer = 30
    },
    update: (f, ctx) => {
      const dir = towards(f.x, ctx.px)
      f.face = dir
      if (f.vy === 0 && --f.timer <= 0) {
        f.vy = -3.2
        f.vx = dir * 1.3 * ctx.speed
        f.timer = 40 + Math.floor(ctx.rng() * 30)
      }
      if (f.vy === 0) f.vx = 0
      walkPhysics(f, ctx, false)
    },
  },
  // Storm harpies circle high, then screech (the tell) and dive at where Zuzu stood.
  harpy: {
    hp: 2,
    points: 450,
    hw: 9,
    cy: 8,
    hh: 12,
    flies: true,
    spawn: (f) => {
      f.baseY = f.y
      f.timer = 80
    },
    update: (f, ctx) => {
      if (f.phase === 'dive') {
        f.x += f.vx
        f.y += f.vy
        if (f.y >= ctx.groundY - 10 || f.t - f.timer > 90) {
          f.phase = 'rest'
          f.vy = -1.6
        }
        return
      }
      if (f.phase === 'rest') {
        f.y += f.vy
        f.x += f.vx * 0.5
        if (f.y <= f.baseY) {
          f.y = f.baseY
          f.phase = 'walk'
          f.timer = 80 + Math.floor(ctx.rng() * 40)
        }
        return
      }
      const dir = towards(f.x, ctx.px)
      f.face = dir
      f.x += dir * 0.9 * ctx.speed
      f.y = f.baseY + Math.sin(f.t / 14) * 4
      if (f.phase === 'aim') {
        if (--f.timer <= 0) {
          const dx = ctx.px - f.x
          const dy = ctx.py - 10 - f.y
          const d = Math.hypot(dx, dy) || 1
          f.vx = (dx / d) * 3.2
          f.vy = (dy / d) * 3.2
          f.phase = 'dive'
          f.timer = f.t
        }
      } else if (--f.timer <= 0 && Math.abs(ctx.px - f.x) < 90) {
        f.phase = 'aim'
        f.timer = 28
        ctx.sound('warn')
      }
    },
  },
  // Wind wraiths ride the gusts in long sine waves straight across the screen.
  wraith: {
    hp: 2,
    points: 300,
    hw: 10,
    cy: 8,
    hh: 10,
    flies: true,
    spawn: (f, ctx) => {
      f.baseY = f.y
      f.vx = -1.5 * ctx.speed * (f.x > ctx.px ? 1 : -1)
      f.face = Math.sign(f.vx) || -1
    },
    update: (f) => {
      f.x += f.vx
      f.y = f.baseY + Math.sin(f.t / 18) * 26
    },
  },
  // Bell imps hop from ledge to ledge and flick embers that arc down.
  imp: {
    hp: 1,
    points: 250,
    hw: 7,
    cy: 7,
    hh: 8,
    spawn: (f) => {
      f.timer = 50
    },
    update: (f, ctx) => {
      const dir = towards(f.x, ctx.px)
      f.face = dir
      if (f.vy === 0 && --f.timer <= 0) {
        if (ctx.rng() < 0.5) {
          ctx.bolt({
            kind: 'ember',
            x: f.x,
            y: f.y - 10,
            vx: dir * (1.2 + ctx.rng() * 0.8),
            vy: -3,
            grav: 0.16,
            life: 120,
            arm: 0,
            hw: 3,
            hh: 3,
          })
          ctx.sound('shoot')
        } else {
          f.vy = -4
          f.vx = dir * 1.1 * ctx.speed
        }
        f.timer = 50 + Math.floor(ctx.rng() * 40)
      }
      if (f.vy === 0) f.vx = 0
      walkPhysics(f, ctx, false)
    },
  },
  // Flame acolytes stand their ground and call a crimson pillar up under Zuzu: the ground glows first
  // (the tell), then it erupts. Keep moving.
  acolyte: {
    hp: 3,
    points: 500,
    hw: 8,
    cy: 13,
    hh: 14,
    spawn: (f) => {
      f.timer = 70
    },
    update: (f, ctx) => {
      f.face = towards(f.x, ctx.px)
      f.vx = 0
      if (--f.timer <= 0 && Math.abs(ctx.px - f.x) < 180) {
        ctx.bolt({
          kind: 'pillar',
          x: ctx.px,
          y: ctx.py - 20,
          vx: 0,
          vy: 0,
          grav: 0,
          life: 70,
          arm: 45,
          hw: 8,
          hh: 22,
        })
        ctx.sound('warn')
        f.timer = 120 + Math.floor(ctx.rng() * 50)
      }
      walkPhysics(f, ctx, false)
    },
  },
  // Abbey shades blink out and reappear a step behind Zuzu (a shimmer: the tell), then lunge.
  shade: {
    hp: 2,
    points: 450,
    hw: 8,
    cy: 12,
    hh: 13,
    flies: true,
    spawn: (f) => {
      f.timer = 60
      f.baseY = f.y
    },
    update: (f, ctx) => {
      if (f.phase === 'aim') {
        if (--f.timer <= 0) {
          f.phase = 'attack'
          f.vx = f.face * 3.2
          f.timer = 26
        }
        return
      }
      if (f.phase === 'attack') {
        f.x += f.vx
        if (--f.timer <= 0) {
          f.phase = 'walk'
          f.timer = 90 + Math.floor(ctx.rng() * 50)
        }
        return
      }
      f.face = towards(f.x, ctx.px)
      f.x += f.face * 0.4 * ctx.speed
      f.y = f.baseY + Math.sin(f.t / 20) * 3
      if (--f.timer <= 0) {
        const side = ctx.rng() < 0.5 ? -1 : 1
        f.x = ctx.px + side * 46
        f.y = ctx.py
        f.baseY = ctx.py
        f.face = -side
        f.phase = 'aim'
        f.timer = 32
        ctx.sound('warn')
      }
    },
  },
  // The Abbess's sisters walk the crypts swinging censers: a wind-up (the tell), then a short sweep in
  // front of them that leaves a lingering ember.
  sister: {
    hp: 3,
    points: 500,
    hw: 8,
    cy: 13,
    hh: 14,
    spawn: (f) => {
      f.timer = 50
    },
    update: (f, ctx) => {
      const dir = towards(f.x, ctx.px)
      const gap = Math.abs(ctx.px - f.x)
      if (f.phase === 'aim') {
        f.vx = 0
        if (--f.timer <= 0) {
          ctx.bolt({
            kind: 'ember',
            x: f.x + f.face * 16,
            y: f.y - 12,
            vx: f.face * 0.6,
            vy: 0,
            grav: 0,
            life: 30,
            arm: 0,
            hw: 10,
            hh: 8,
          })
          ctx.sound('shoot')
          f.phase = 'walk'
          f.timer = 70
        }
      } else {
        f.face = dir
        f.vx = gap > 26 ? dir * 0.55 * ctx.speed : 0
        if (--f.timer <= 0 && gap < 40) {
          f.phase = 'aim'
          f.timer = 30
          ctx.sound('warn')
        }
      }
      walkPhysics(f, ctx, false)
    },
  },
}

export function makeFoe(
  kind: FoeKind,
  id: string | null,
  x: number,
  y: number,
  carrying: Holding | null,
  ctx: FoeCtx,
): Foe {
  const def = FOES[kind]
  const f: Foe = {
    kind,
    id,
    x,
    y,
    vx: 0,
    vy: 0,
    hp: def.hp,
    t: 0,
    phase: 'walk',
    baseY: y,
    carrying,
    timer: 0,
    face: x > ctx.px ? -1 : 1,
  }
  def.spawn(f, ctx)
  return f
}

export function stepBolt(b: Bolt) {
  b.t++
  b.life--
  if (b.arm > 0) b.arm--
  b.vy += b.grav
  b.x += b.vx
  b.y += b.vy
}
