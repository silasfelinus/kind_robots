// /utils/arcade/ghostTrail/bosses/matriarch.ts
//
// Zuzu: Ghost Trail's fourth headline boss (conductor kr-arcade t-018, CAMPAIGN-BLUEPRINT.md): the
// Storm-Crow Matriarch, a huge crow-woman with storm-dark wings and a mane of white hair, who rules
// Storm Crow Pass from two lightning-struck snags at the arena's edges.
//
// She alternates between her perches (high: only a jumping throw reaches her there) and the ground:
//   - spread -> volley: her wings spread wide and glints mark the ground where each feather will
//     land, then a fan of feathers arcs down onto the marks: stand in a gap;
//   - screech -> dive: she throws her head back and screeches while her shadow spreads where Zuzu
//     stood, then dive-bombs onto it; she hits the ground hard and sprawls, stunned (the punish
//     window), then labours back up to the perch farther from Zuzu;
//   - storm -> strike: wings raised to the sky, a storm gathers; lightning pillars glow on the
//     ground while they arm (step off them) and then strike;
//   - caw -> call: she calls her brood: two crows (a harpy among them once she is hurt), at most
//     three times a fight.
// No immunity: on the perch she is simply high, and every few beats she comes down.
//
// Deterministic: all chance from ctx.rng. The art reads the same state: the perches, the fan's
// marks, her shadow, the storm and its bolts; `flash` whitens her and `dying` drops her from the
// sky in a burst of feathers.

import type { Boss, BossCtx, BossDef } from '../bosses'
import { INK, glow, mix, rgba } from '../../snes'

type G = CanvasRenderingContext2D

/** The tell that opens each attack mode (the boss test walks these). */
export const MATRIARCH_TELLS: Record<string, string> = {
  volley: 'spread',
  dive: 'screech',
  strike: 'storm',
  call: 'caw',
}

// Scratch slots in b.n.
const SIDE = 0 // which perch: -1 left, +1 right
const TARGET = 1 // the dive's landing x
const ARENA_L = 2 // arena edges (the art draws the perches)
const ARENA_R = 3
const FROM_X = 4 // flight start
const FROM_Y = 5
const COUNT = 6 // attacks begun (the pattern)
const CALLS = 7
const STRIKES = 8 // how many lightning marks (their x in STRIKE0..)
const FANS = 9 // how many feathers (their landing x in FAN0..)
const STRIKE0 = 10 // 4 slots
const FAN0 = 14 // 7 slots

const PERCH_H = 40
const SPREAD_TICKS = 40
const VOLLEY_TICKS = 20
const FEATHER_FLIGHT = 56
const FEATHER_GRAV = 0.18
const SCREECH_TICKS = 42
const DIVE_TICKS = 36
/** The height she climbs to before the plunge. */
const DIVE_TOP = 104
/** Where the thunderheads gather. */
const CLOUD_Y = 58
const LAND_TICKS = 74
const RISE_TICKS = 44
const STORM_TICKS = 34
const STRIKE_ARM = 44
const STRIKE_TICKS = 60
const CAW_TICKS = 38
const CALL_TICKS = 24

const n = (b: Boss, i: number) => b.n[i] ?? 0

function perchX(side: number, l: number, r: number) {
  return side < 0 ? l + 34 : r - 30
}

function perch(b: Boss, ticks: number) {
  b.mode = 'perch'
  b.timer = ticks
}

function tell(b: Boss, ctx: BossCtx, mode: string, ticks: number) {
  b.mode = mode
  b.timer = ticks
  b.face = Math.sign(ctx.px - b.x) || -1
  ctx.sound('warn')
}

function clampArena(ctx: BossCtx, x: number, pad: number) {
  return Math.max(ctx.arenaL + pad, Math.min(ctx.arenaR - pad, x))
}

function decide(b: Boss, ctx: BossCtx) {
  const k = (b.n[COUNT] = n(b, COUNT) + 1)
  const hurt = b.hp <= b.maxHp / 2
  // Dive every other beat: she must come down to be beaten.
  if (k % 2 === 0) {
    b.n[TARGET] = clampArena(ctx, ctx.px, 30)
    tell(b, ctx, 'screech', SCREECH_TICKS)
    return
  }
  const beat = Math.floor(k / 2) % 3
  if (beat === 0) {
    const m = hurt ? 7 : 5
    b.n[FANS] = m
    // The fan lands around Zuzu with man-sized gaps between the marks.
    const gap = 36
    const base = ctx.px + (ctx.rng() - 0.5) * 14
    for (let i = 0; i < m; i++)
      b.n[FAN0 + i] = clampArena(ctx, base + (i - (m - 1) / 2) * gap, 6)
    tell(b, ctx, 'spread', SPREAD_TICKS)
  } else if (beat === 2 && n(b, CALLS) < 3) {
    tell(b, ctx, 'caw', CAW_TICKS)
  } else {
    const m = hurt ? 4 : 3
    b.n[STRIKES] = m
    const xs = [
      ctx.px,
      ctx.px - 56,
      ctx.px + 56,
      ctx.px + (ctx.px > b.x ? -112 : 112),
    ]
    for (let i = 0; i < m; i++)
      b.n[STRIKE0 + i] = clampArena(ctx, xs[i] ?? ctx.px, 10)
    tell(b, ctx, 'storm', STORM_TICKS)
  }
}

function update(b: Boss, ctx: BossCtx) {
  const ground = ctx.groundY
  const perchY = ground - PERCH_H
  b.n[ARENA_L] = ctx.arenaL
  b.n[ARENA_R] = ctx.arenaR

  switch (b.mode) {
    case 'perch':
      b.face = Math.sign(ctx.px - b.x) || -1
      if (--b.timer <= 0) decide(b, ctx)
      break
    case 'spread':
      if (--b.timer <= 0) {
        b.mode = 'volley'
        b.timer = VOLLEY_TICKS
        const x0 = b.x + b.face * 8
        const y0 = b.y - 24
        const T = FEATHER_FLIGHT
        for (let i = 0; i < n(b, FANS); i++) {
          const tx = n(b, FAN0 + i)
          ctx.bolt({
            kind: 'feather',
            x: x0,
            y: y0,
            vx: (tx - x0) / T,
            vy: (ground - y0 - (FEATHER_GRAV * T * (T + 1)) / 2) / T,
            grav: FEATHER_GRAV,
            life: T + 30,
            arm: 0,
            hw: 3,
            hh: 3,
          })
        }
        ctx.sound('shoot')
      }
      break
    case 'volley':
      if (--b.timer <= 0) perch(b, 40)
      break
    case 'screech':
      if (--b.timer <= 0) {
        b.mode = 'dive'
        b.timer = DIVE_TICKS
        b.n[FROM_X] = b.x
        b.n[FROM_Y] = b.y
        b.face = Math.sign(n(b, TARGET) - b.x) || b.face
        // The impact: harmless while she falls (its glow marks the spot), a shock as she lands.
        ctx.bolt({
          kind: 'pillar',
          x: n(b, TARGET),
          y: ground - 6,
          vx: 0,
          vy: 0,
          grav: 0,
          life: DIVE_TICKS + 8,
          arm: DIVE_TICKS,
          hw: 6,
          hh: 6,
        })
      }
      break
    case 'dive': {
      // Up and over to hang above her shadow, then a near-vertical plunge onto it: she is only
      // low enough to strike once she is over the mark.
      const p = 1 - --b.timer / DIVE_TICKS
      const k = Math.min(1, p / 0.62)
      const ex = (1 - Math.cos(k * Math.PI)) / 2
      b.x = n(b, FROM_X) + (n(b, TARGET) - n(b, FROM_X)) * ex
      if (p < 0.45) {
        const q = p / 0.45
        b.y =
          n(b, FROM_Y) + (DIVE_TOP - n(b, FROM_Y)) * Math.sin((q * Math.PI) / 2)
      } else {
        const q = (p - 0.45) / 0.55
        b.y = DIVE_TOP + (ground - DIVE_TOP) * q * q
      }
      if (b.timer <= 0) {
        b.x = n(b, TARGET)
        b.y = ground
        b.mode = 'land'
        b.timer = LAND_TICKS
        ctx.sound('boom')
      }
      break
    }
    case 'land':
      if (--b.timer <= 0) {
        // Back up to the perch farther from Zuzu.
        const mid = (ctx.arenaL + ctx.arenaR) / 2
        b.n[SIDE] = ctx.px < mid ? 1 : -1
        b.n[FROM_X] = b.x
        b.n[FROM_Y] = b.y
        b.mode = 'rise'
        b.timer = RISE_TICKS
      }
      break
    case 'rise': {
      const p = 1 - --b.timer / RISE_TICKS
      const tx = perchX(n(b, SIDE), ctx.arenaL, ctx.arenaR)
      const e = (1 - Math.cos(p * Math.PI)) / 2
      b.x = n(b, FROM_X) + (tx - n(b, FROM_X)) * e
      // Up in a labouring arc, then settling onto the snag.
      b.y =
        n(b, FROM_Y) +
        (perchY - n(b, FROM_Y)) * Math.min(1, p * 1.4) -
        Math.sin(p * Math.PI) * 18
      b.face = Math.sign(tx - n(b, FROM_X)) || b.face
      if (b.timer <= 0) {
        b.x = tx
        b.y = perchY
        perch(b, 36)
      }
      break
    }
    case 'storm':
      if (--b.timer <= 0) {
        b.mode = 'strike'
        b.timer = STRIKE_TICKS
        for (let i = 0; i < n(b, STRIKES); i++)
          ctx.bolt({
            kind: 'pillar',
            x: n(b, STRIKE0 + i),
            y: ground - 40,
            vx: 0,
            vy: 0,
            grav: 0,
            life: STRIKE_TICKS,
            arm: STRIKE_ARM,
            hw: 6,
            hh: 40,
          })
      }
      break
    case 'strike':
      if (b.timer === STRIKE_TICKS - STRIKE_ARM) ctx.sound('boom')
      if (--b.timer <= 0) perch(b, 30)
      break
    case 'caw':
      if (--b.timer <= 0) {
        b.mode = 'call'
        b.timer = CALL_TICKS
        b.n[CALLS] = n(b, CALLS) + 1
        // The brood comes off her own wings, in front of her.
        ctx.summon('crow', b.x, ground - 96)
        ctx.summon(
          b.hp <= b.maxHp / 2 ? 'harpy' : 'crow',
          b.x - n(b, SIDE) * 12,
          ground - 62,
        )
      }
      break
    case 'call':
      if (--b.timer <= 0) perch(b, 40)
      break
    default:
      perch(b, 60)
  }
}

// --- art --------------------------------------------------------------------------------------

const TAU = Math.PI * 2
const FEATHER = ['#05040f', '#100d24', '#1d1940', '#30305e', '#5a64a0'] as const
const STORM = ['#0a2a4a', '#1f5aa8', '#59b6ff', '#bfe8ff', '#ffffff'] as const
const HAIR = ['#4a4a62', '#8a8aa6', '#c8c8dc', '#f0f0fa'] as const
const SKIN = ['#3a3448', '#6a6080', '#a49cb8', '#d4cee0'] as const
const BEAK = ['#2a2420', '#5a5048', '#a09484', '#d8ccbc'] as const
const TALON = ['#14121a', '#2e2a36', '#4c4656', '#e8dcb8'] as const
const SNAG = ['#120c0e', '#24181a', '#3a2a28', '#58423a', '#7a5e4c'] as const
const CRIMSON = ['#4a0a14', '#9b1424', '#e0263a', '#ff6a5c', '#ffd2c4'] as const

let whiteOut = 0
const c = (hex: string) => (whiteOut > 0 ? mix(hex, '#ffffff', 0.72) : hex)

function poly(g: G, pts: readonly number[], close = true) {
  g.beginPath()
  g.moveTo(pts[0] ?? 0, pts[1] ?? 0)
  for (let i = 2; i < pts.length; i += 2) g.lineTo(pts[i] ?? 0, pts[i + 1] ?? 0)
  if (close) g.closePath()
}

function inked(g: G, fill: string, lw = 1) {
  g.lineJoin = 'round'
  g.lineCap = 'round'
  g.lineWidth = lw
  g.strokeStyle = INK
  g.stroke()
  g.fillStyle = c(fill)
  g.fill()
}

function limb(g: G, pts: readonly number[], w: number, fill: string) {
  poly(g, pts, false)
  g.lineJoin = 'round'
  g.lineCap = 'round'
  g.lineWidth = w + 1.4
  g.strokeStyle = INK
  g.stroke()
  g.lineWidth = w
  g.strokeStyle = c(fill)
  g.stroke()
}

function ellipse(g: G, x: number, y: number, rx: number, ry: number, r = 0) {
  g.beginPath()
  g.ellipse(x, y, Math.max(0.1, rx), Math.max(0.1, ry), r, 0, TAU)
}

function hash(i: number) {
  const s = Math.sin(i * 127.1 + 311.7) * 43758.5453
  return s - Math.floor(s)
}

function glint(g: G, x: number, y: number, r: number, colour: string) {
  g.save()
  g.globalCompositeOperation = 'lighter'
  g.fillStyle = colour
  poly(g, [
    x - r,
    y,
    x - r * 0.15,
    y - r * 0.15,
    x,
    y - r,
    x + r * 0.15,
    y - r * 0.15,
    x + r,
    y,
    x + r * 0.15,
    y + r * 0.15,
    x,
    y + r,
    x - r * 0.15,
    y + r * 0.15,
  ])
  g.fill()
  g.restore()
}

/** A jagged lightning bolt from (x, top) to (x, bottom), re-forked every few ticks. */
function bolt(
  g: G,
  x: number,
  top: number,
  bottom: number,
  seed: number,
  a: number,
) {
  const pts: number[] = [x, top]
  const steps = 9
  for (let i = 1; i < steps; i++)
    pts.push(
      x + (hash(seed + i) - 0.5) * 12,
      top + ((bottom - top) * i) / steps,
    )
  pts.push(x, bottom)
  g.save()
  g.globalCompositeOperation = 'lighter'
  poly(g, pts, false)
  g.lineJoin = 'miter'
  g.strokeStyle = rgba(STORM[2], 0.6 * a)
  g.lineWidth = 4
  g.stroke()
  g.strokeStyle = rgba(STORM[4], a)
  g.lineWidth = 1.4
  g.stroke()
  g.restore()
}

/** A dead, lightning-split snag: her perch, its top at the perch line. */
function drawSnag(g: G, x: number, ground: number, side: number, tick: number) {
  g.save()
  g.translate(Math.round(x), ground)
  g.scale(side, 1)
  // Roots and trunk, leaning out from the arena's edge.
  poly(
    g,
    [
      -12, 0, -7, -3, -5, -20, -6, -34, -3, -40, 1, -44, 2, -40, 5, -42, 6, -36,
      5, -20, 7, -4, 13, 0,
    ],
  )
  inked(g, SNAG[2], 1.1)
  g.fillStyle = c(SNAG[3])
  poly(g, [-5, -3, -3.6, -20, -4.6, -34, -2, -39, -1, -20, -1, -3])
  g.fill()
  g.fillStyle = c(SNAG[1])
  poly(g, [3, -4, 4, -20, 4.4, -35, 5.4, -36, 5.6, -20, 6, -4])
  g.fill()
  // A dead branch and the scorched split down the heart, still faintly charged.
  limb(g, [-4, -28, -11, -33, -15, -32], 1.6, SNAG[2])
  limb(g, [5, -22, 11, -26], 1.3, SNAG[2])
  g.strokeStyle = rgba(STORM[2], 0.45 + 0.25 * Math.sin(tick / 7 + side))
  g.lineWidth = 0.7
  poly(g, [0, -40, 1, -32, -0.6, -24, 0.8, -14, 0, -6], false)
  g.stroke()
  // The flat broken top she grips.
  poly(g, [-6, -40, 6, -40, 5, -38, -5, -38])
  inked(g, SNAG[4], 0.8)
  g.restore()
}

type Pose = {
  /** Wing arm angles (radians from +x, - is up) for the near and far wing, and how open they are. */
  near: number
  far: number
  open: number
  /** Body tilt: + leans forward. */
  tilt: number
  /** Head thrown back (screech) 0..1, beak open 0..1. */
  head: number
  beak: number
  /** Legs: 'grip' on the perch, 'reach' talons forward (dive and flight), 'sprawl' on the ground. */
  legs: 'grip' | 'reach' | 'sprawl'
}

function poseOf(b: Boss, tick: number): Pose {
  const p: Pose = {
    near: 1.85,
    far: 1.95,
    open: 0,
    tilt: 0,
    head: 0,
    beak: 0,
    legs: 'grip',
  }
  const breathe = Math.sin(tick / 20) * 0.04
  const lerp = (a: number, z: number, k: number) => a + (z - a) * k
  switch (b.mode) {
    case 'perch':
      // Wings mantled about her like a cloak.
      p.near = 1.4 + breathe
      p.far = 2.25 + breathe
      p.open = 0.18
      p.head = Math.max(0, Math.sin(tick / 37)) * 0.15
      break
    case 'spread': {
      const k = Math.min(1, (SPREAD_TICKS - b.timer) / 16)
      p.near = lerp(1.85, -1.05, k)
      p.far = lerp(1.95, -2.25, k)
      p.open = k
      p.tilt = -0.08 * k
      break
    }
    case 'volley': {
      const k = Math.min(1, (VOLLEY_TICKS - b.timer) / 6)
      p.near = lerp(-1.05, 0.2, k)
      p.far = lerp(-2.25, -1.4, k)
      p.open = 1 - 0.3 * k
      p.tilt = 0.15 * k
      p.beak = 0.4
      break
    }
    case 'screech':
      p.near = -1.3 + Math.sin(tick / 3) * 0.08
      p.far = -2.1 + Math.sin(tick / 3) * 0.08
      p.open = 0.75
      p.head = Math.min(1, (SCREECH_TICKS - b.timer) / 10)
      p.beak = 1
      break
    case 'dive':
      p.near = -2.75
      p.far = -2.95
      p.open = 0.25
      p.tilt = 0.9
      p.legs = 'reach'
      p.beak = 0.3
      break
    case 'land':
      p.near = 0.25 + Math.sin(tick / 9) * 0.05
      p.far = 2.75
      p.open = 0.9
      p.tilt = 0.35
      p.legs = 'sprawl'
      p.beak = 0.2
      break
    case 'rise': {
      const flap = Math.sin(tick / 4)
      p.near = -0.9 + flap * 1.05
      p.far = -1.5 + flap * 1.05
      p.open = 0.85
      p.tilt = 0.1
      p.legs = 'reach'
      break
    }
    case 'storm':
    case 'strike':
      p.near = -1.4 + Math.sin(tick / 5) * 0.05
      p.far = -1.85 + Math.sin(tick / 5) * 0.05
      p.open = 1
      p.tilt = -0.15
      p.head = 0.4
      p.beak = b.mode === 'storm' ? 0.6 : 0.2
      break
    case 'caw':
    case 'call': {
      const flap = Math.sin(tick / 6) * 0.25
      p.near = -1 + flap
      p.far = -2.1 + flap
      p.open = 0.7
      p.head = 0.6
      p.beak = Math.sin(tick / 3) > 0 ? 1 : 0.3
      break
    }
  }
  return p
}

/** A single pointed feather from (x, y) along angle `d`. */
function feather(
  g: G,
  x: number,
  y: number,
  d: number,
  len: number,
  w: number,
  fill: string,
  edge: string | null,
) {
  const cx = Math.cos(d)
  const cy = Math.sin(d)
  const px = -cy * w * 0.5
  const py = cx * w * 0.5
  poly(g, [
    x + px,
    y + py,
    x + cx * len * 0.7 + px * 0.8,
    y + cy * len * 0.7 + py * 0.8,
    x + cx * len,
    y + cy * len,
    x + cx * len * 0.6 - px * 0.9,
    y + cy * len * 0.6 - py * 0.9,
    x - px,
    y - py,
  ])
  inked(g, fill, 0.8)
  if (edge) {
    // The vane's shaft, catching the storm light.
    g.strokeStyle = c(edge)
    g.lineWidth = 0.45
    g.beginPath()
    g.moveTo(x, y)
    g.lineTo(x + cx * len * 0.85, y + cy * len * 0.85)
    g.stroke()
  }
}

/** One wing from the shoulder at (0, 0), arm along `a`: far wings paint darker. */
function paintWing(g: G, a: number, open: number, far: boolean, tick: number) {
  const arm = 13 + open * 11
  const wx = Math.cos(a) * arm
  const wy = Math.sin(a) * arm
  // Feathers rake from the arm's direction toward its trailing side as the wing opens.
  const fan = -(0.22 + 1.05 * open)
  const dark = far ? FEATHER[1] : FEATHER[2]
  const mid = far ? FEATHER[2] : FEATHER[3]
  const shaft = far ? null : FEATHER[4]
  // Secondaries along the arm, shortest at the body.
  for (let i = 5; i >= 0; i--) {
    const t = 0.15 + (i / 5) * 0.8
    feather(
      g,
      wx * t,
      wy * t,
      a + fan * 0.95,
      11 + t * 9 + open * 3,
      4,
      i % 2 ? dark : mid,
      shaft,
    )
  }
  // Primaries fanning from the wrist: long, fingered tips.
  for (let i = 5; i >= 0; i--) {
    const d = a + (fan * i) / 6
    const len = 20 + open * 13 - i * (0.6 + open * 0.8)
    feather(g, wx, wy, d, len, 3.4, i % 2 ? mid : dark, shaft)
  }
  // The arm: covert feathers over the bone, lit along the leading edge.
  poly(g, [
    -2,
    2,
    wx * 0.5 - Math.sin(a) * 2,
    wy * 0.5 + Math.cos(a) * 2,
    wx,
    wy,
    wx * 0.5 + Math.sin(a) * 3,
    wy * 0.5 - Math.cos(a) * 3,
    1,
    -3,
  ])
  inked(g, mid, 1)
  if (!far) {
    g.strokeStyle = rgba(STORM[3], 0.5 + 0.35 * open)
    g.lineWidth = 0.7
    g.beginPath()
    g.moveTo(1, -3)
    g.lineTo(wx * 0.5 + Math.sin(a) * 3, wy * 0.5 - Math.cos(a) * 3)
    g.lineTo(wx, wy)
    g.stroke()
    if (open > 0.6) {
      const i = Math.floor(tick / 5) % 6
      const d = a + (fan * i) / 6
      const len = 20 + open * 13
      glint(g, wx + Math.cos(d) * len, wy + Math.sin(d) * len, 2.6, STORM[4])
    }
  }
}

function paintMatriarch(g: G, b: Boss, pose: Pose, tick: number) {
  g.save()
  g.rotate(pose.tilt)
  const sh: [number, number] = [-1, -31]
  // Far wing behind everything.
  g.save()
  g.translate(sh[0] - 3, sh[1] - 1)
  paintWing(g, pose.far, pose.open, true, tick)
  g.restore()
  // Tail: long storm feathers fanned behind and below.
  for (let i = 4; i >= 0; i--) {
    const s = Math.sin(tick / 12 + i) * 0.05
    feather(
      g,
      -5,
      -12,
      1.95 + i * 0.12 + s,
      22 - i * 1.5,
      4,
      i % 2 ? FEATHER[1] : FEATHER[2],
      FEATHER[3],
    )
  }
  // Talons (gripping the snag, reaching in flight, splayed on the ground).
  for (const s of [-1, 1]) {
    const fx = s * 2.6 + 1
    if (pose.legs === 'reach') {
      limb(g, [fx - 1, -10, fx + 3, -4, fx + 6, -2], 2, TALON[1])
      g.fillStyle = c(TALON[3])
      for (const d of [-1.6, 0, 1.6]) {
        poly(g, [fx + 6, -2 + d, fx + 9.4, -1 + d * 1.4, fx + 6.4, -0.6 + d])
        g.fill()
      }
    } else {
      limb(g, [fx, -10, fx + 1, -3, fx + 1, 0], 2, TALON[1])
      g.fillStyle = c(TALON[3])
      for (const d of [-2.6, 0, 2.6]) {
        poly(g, [
          fx + 1 + d * 0.6,
          -0.6,
          fx + 1.6 + d,
          1.4,
          fx + 2 + d * 0.6,
          -0.6,
        ])
        g.fill()
      }
    }
  }
  // Gown: a cascade of layered feathers flaring to a ragged hem.
  poly(
    g,
    [
      -6, -34, 5, -35, 7, -24, 9, -14, 10, -7, 7, -9, 5, -5, 2, -8, -1, -4, -4,
      -8, -7, -5, -9, -10, -10, -18, -8, -26,
    ],
  )
  inked(g, FEATHER[2], 1.1)
  for (let row = 0; row < 5; row++) {
    const y = -28 + row * 4.4
    const w = 12 + row * 1.6
    for (let i = 0; i < 5; i++) {
      const x = -w / 2 + 1 + (i * w) / 5 + (row % 2) * 1.2
      feather(
        g,
        x,
        y,
        1.62 + (i - 2) * 0.06,
        6,
        3,
        row % 2 ? FEATHER[3] : FEATHER[2],
        null,
      )
    }
  }
  // Bodice and the silver storm-sigil at her breast.
  poly(g, [-4, -35, 5, -36, 6, -26, -3, -26])
  inked(g, FEATHER[1], 0.8)
  g.fillStyle = c(STORM[3])
  poly(
    g,
    [
      1.6, -33.6, -0.4, -30.4, 1.4, -30.4, 0.2, -27.6, 3, -31.6, 1.2, -31.6,
      2.6, -33.6,
    ],
  )
  g.fill()
  glow(g, 1.3, -30.6, 3.5, STORM[2], 0.5)

  // Head, thrown back to screech.
  g.save()
  g.translate(1.5, -39)
  g.rotate(-pose.head * 0.55)
  // A wild white mane streaming back in the gale.
  const wave = (k: number) => Math.sin(tick / 6 + k) * 1.4
  poly(g, [
    1,
    -6,
    -6,
    -6.6,
    -14,
    -5 + wave(0),
    -22,
    -2 + wave(1),
    -18,
    -0.4 + wave(1.5),
    -24,
    3 + wave(2),
    -16,
    3.6 + wave(2.5),
    -19,
    8 + wave(3),
    -10,
    5,
    -4,
    4,
  ])
  inked(g, HAIR[1], 1)
  g.strokeStyle = c(HAIR[3])
  g.lineWidth = 0.55
  for (let i = 0; i < 4; i++) {
    g.beginPath()
    g.moveTo(-2, -4 + i * 2)
    g.quadraticCurveTo(
      -10,
      -4 + i * 2.4 + wave(i),
      -17 - i,
      -2 + i * 2.6 + wave(i + 1),
    )
    g.stroke()
  }
  // A gaunt grey face under a crow's skull-hood.
  poly(g, [-3, -4, 3.6, -6, 6.4, -2, 5.4, 3.4, 1.4, 5, -2.6, 2.4])
  inked(g, SKIN[2], 0.9)
  g.fillStyle = c(SKIN[3])
  poly(g, [0.4, -4.4, 3.6, -5.4, 5.6, -2, 2.4, -1.4])
  g.fill()
  g.fillStyle = c(SKIN[1])
  poly(g, [1.4, 2.6, 5, 2, 4.6, 3.6, 1.6, 4.4])
  g.fill()
  poly(g, [-4.6, -3.4, -1.6, -8.8, 4.6, -9.2, 8, -5.4, 4.6, -3.6, -0.6, -2.6])
  inked(g, FEATHER[2], 0.9)
  g.fillStyle = c(FEATHER[3])
  poly(g, [-1.2, -8.2, 4.4, -8.6, 6.6, -6, 1, -6])
  g.fill()
  // The beak (upper and lower, opening to screech).
  const open = pose.beak * 0.5
  g.save()
  g.translate(6.4, -4)
  g.rotate(-open)
  poly(g, [0, -1.8, 4, -1.4, 12, 0.6, 0, 1.2])
  inked(g, BEAK[2], 0.8)
  g.fillStyle = c(BEAK[3])
  poly(g, [0.6, -1.4, 9, 0.2, 0.6, -0.2])
  g.fill()
  g.restore()
  g.save()
  g.translate(6, -2.6)
  g.rotate(open * 0.8)
  poly(g, [0, -0.6, 8.6, 0.8, 0, 1.8])
  inked(g, BEAK[1], 0.8)
  g.restore()
  // A crest of storm feathers.
  for (let i = 3; i >= 0; i--) {
    const a = -2.1 - i * 0.3 + Math.sin(tick / 9 + i) * 0.06
    feather(
      g,
      1,
      -8,
      a,
      8 + i * 1.4,
      2.2,
      i % 2 ? FEATHER[3] : FEATHER[4],
      null,
    )
  }
  // Eyes: storm-white, crimson while she screeches and dives.
  const eye = b.mode === 'screech' || b.mode === 'dive' ? CRIMSON[3] : STORM[3]
  g.fillStyle = INK
  ellipse(g, 3.6, -4.2, 1.5, 1.1)
  g.fill()
  g.fillStyle = eye
  g.fillRect(3.4, -4.7, 1.3, 1)
  glow(g, 4, -4.2, 4, b.mode === 'screech' ? CRIMSON[2] : STORM[2], 0.55)
  g.restore()

  // Near wing over the body.
  g.save()
  g.translate(sh[0], sh[1])
  paintWing(g, pose.near, pose.open, false, tick)
  g.restore()
  g.restore()
}

function draw(g: G, b: Boss, tick: number, face: number) {
  const ground = 208
  const l = n(b, ARENA_L)
  const r = n(b, ARENA_R)
  const dying = b.dying > 0

  // The perches stand all fight long (they never flash with her).
  whiteOut = 0
  if (r > l) {
    drawSnag(g, perchX(-1, l, r), ground, 1, tick)
    drawSnag(g, perchX(1, l, r), ground, -1, tick)
  }
  whiteOut = b.flash > 0 || (dying && Math.floor(b.dying / 3) % 2 === 1) ? 1 : 0

  // The storm: a cloud gathering over the marks, then lightning down each one.
  if ((b.mode === 'storm' || b.mode === 'strike') && !dying) {
    const k = b.mode === 'storm' ? 1 - b.timer / STORM_TICKS : 1
    const struck = b.mode === 'strike' && STRIKE_TICKS - b.timer >= STRIKE_ARM
    for (let i = 0; i < n(b, STRIKES); i++) {
      const sx = n(b, STRIKE0 + i)
      // A thunderhead boiling up over the mark, lit from inside.
      for (let j = 0; j < 5; j++) {
        const cx = sx - 14 + j * 7
        const cy = CLOUD_Y + Math.sin(tick / 10 + j) * 1.5 - (j % 2) * 3
        g.fillStyle = rgba(INK, 0.6 * k)
        ellipse(g, cx, cy + 1.5, 9 * k + 2, 5 * k + 1)
        g.fill()
        g.fillStyle = rgba(j % 2 ? FEATHER[3] : FEATHER[2], 0.9 * k)
        ellipse(g, cx, cy, 8 * k + 2, 4.4 * k + 1)
        g.fill()
        g.fillStyle = rgba(FEATHER[4], 0.5 * k)
        ellipse(g, cx - 1, cy - 2.4 * k, 4 * k + 1, 1.4 * k + 0.4)
        g.fill()
      }
      if (b.mode === 'strike' && !struck) {
        // Arming: the cloud flickers and the ground mark burns.
        if ((tick + i * 3) % 8 < 3) glow(g, sx, CLOUD_Y + 2, 14, STORM[2], 0.6)
        glow(g, sx, ground - 2, 8, STORM[2], 0.35)
      } else if (struck) {
        const a = Math.min(1, b.timer / 10)
        bolt(g, sx, CLOUD_Y + 2, ground, Math.floor(tick / 3) * 7 + i * 31, a)
        glow(g, sx, ground - 4, 16, STORM[3], 0.6 * a)
      }
    }
  }
  // The feather fan's marks: glints on the ground where each will land.
  if ((b.mode === 'spread' || b.mode === 'volley') && !dying) {
    const k = b.mode === 'spread' ? 1 - b.timer / SPREAD_TICKS : 1
    for (let i = 0; i < n(b, FANS); i++) {
      const fx = n(b, FAN0 + i)
      g.fillStyle = rgba(STORM[2], 0.25 + 0.35 * k)
      ellipse(g, fx, ground, 3 + k * 3, 1.2)
      g.fill()
      glint(
        g,
        fx,
        ground - 1,
        1 + k * 2.4 + Math.sin(tick / 2 + i) * 0.5,
        STORM[3],
      )
    }
  }
  // Her shadow: spreading where she will land, under her while she flies.
  if (!dying) {
    const diving = b.mode === 'screech' || b.mode === 'dive'
    const sx = diving ? n(b, TARGET) : b.x
    const k = b.mode === 'screech' ? 1 - b.timer / SCREECH_TICKS : 1
    const high = (ground - b.y) / 60
    g.fillStyle = rgba(
      INK,
      diving ? 0.25 + 0.3 * k : 0.3 - Math.min(0.2, high * 0.2),
    )
    ellipse(g, sx, ground, diving ? 6 + 12 * k : 14, 2.4)
    g.fill()
    if (diving) {
      g.strokeStyle = rgba(CRIMSON[2], 0.4 + 0.3 * Math.sin(tick / 2) ** 2)
      g.lineWidth = 0.8
      ellipse(g, sx, ground, 7 + 12 * k, 3)
      g.stroke()
    }
  }

  // The screech: rings bursting from her beak.
  const f = b.mode === 'perch' ? face : b.face
  let x = b.x
  let y = b.y
  if (dying) {
    // She falls from wherever she was, tumbling, to the ground.
    const p = 1 - b.dying / 70
    y = b.y + (ground - b.y) * Math.min(1, p * p * 2)
    x += Math.sin(b.dying / 4) * 1.2
  }
  if (b.mode === 'screech' && !dying) {
    const k = 1 - b.timer / SCREECH_TICKS
    for (let i = 0; i < 3; i++) {
      const rr = ((k * 4 + i / 3) % 1) * 26
      g.strokeStyle = rgba(CRIMSON[3], 0.7 * (1 - rr / 26))
      g.lineWidth = 1
      g.beginPath()
      g.arc(
        x + f * 12,
        y - 44,
        rr,
        f > 0 ? -0.8 : Math.PI - 0.8,
        f > 0 ? 0.8 : Math.PI + 0.8,
      )
      g.stroke()
    }
  }
  if (b.mode === 'dive' && !dying) {
    // Speed streaks behind the dive.
    g.strokeStyle = rgba(STORM[3], 0.5)
    g.lineWidth = 0.8
    const dx = n(b, FROM_X) - b.x
    const dy = n(b, FROM_Y) - b.y
    const d = Math.hypot(dx, dy) || 1
    for (let i = 0; i < 5; i++) {
      const ox = (hash(i) - 0.5) * 18
      const oy = -10 - hash(i + 4) * 26
      g.beginPath()
      g.moveTo(x + ox, y + oy)
      g.lineTo(x + ox + (dx / d) * 22, y + oy + (dy / d) * 22)
      g.stroke()
    }
  }

  g.save()
  g.translate(Math.round(x), Math.round(y))
  if (dying) g.rotate((1 - b.dying / 70) * 1.6 * -f)
  g.scale(f * 1.2, 1.2)
  g.globalAlpha *= dying ? Math.min(1, b.dying / 26) : 1
  paintMatriarch(g, b, poseOf(b, tick), tick)
  g.restore()

  // Stunned: storm sparks circling her head.
  if (b.mode === 'land' && !dying) {
    for (let i = 0; i < 3; i++) {
      const a = tick / 8 + (i * TAU) / 3
      glint(
        g,
        x + f * 4 + Math.cos(a) * 10,
        y - 40 + Math.sin(a) * 3,
        2,
        STORM[4],
      )
    }
    // Dust where she hit.
    if (b.timer > LAND_TICKS - 20) {
      const k = (b.timer - (LAND_TICKS - 20)) / 20
      for (let i = 0; i < 6; i++) {
        g.fillStyle = rgba('#9e7356', 0.6 * k)
        ellipse(
          g,
          x + (i - 2.5) * 8 * (1.6 - k),
          ground - 2 - (1 - k) * 6,
          3 + (1 - k) * 3,
          2,
        )
        g.fill()
      }
    }
  }
  // Dying: a burst of black feathers drifting down.
  if (dying) {
    const p = 1 - b.dying / 70
    for (let i = 0; i < 10; i++) {
      const fx = x + (hash(i) - 0.5) * 60 * p
      const fy = y - 30 + p * 40 * hash(i + 3) + Math.sin(tick / 6 + i) * 3
      g.save()
      g.translate(fx, fy)
      g.rotate(tick / 10 + i)
      poly(g, [-3, 0, 0, -1, 3, 0, 0, 1])
      inked(g, FEATHER[3], 0.5)
      g.restore()
    }
  }
  whiteOut = 0
}

export const MATRIARCH: BossDef = {
  name: 'THE STORM-CROW MATRIARCH',
  title: 'MOTHER OF THE GALE',
  hp: 30,
  hw: 14,
  height: 40,
  create: (b, ctx) => {
    b.n = new Array<number>(FAN0 + 7).fill(0)
    b.n[SIDE] = 1
    b.n[ARENA_L] = ctx.arenaL
    b.n[ARENA_R] = ctx.arenaR
    b.x = perchX(1, ctx.arenaL, ctx.arenaR)
    b.y = ctx.groundY - PERCH_H
    perch(b, 70)
  },
  update,
  // Touching her hurts while she dives and sits her perch; sprawled, only her body does, and
  // labouring back up she is no threat.
  contact: (b) =>
    b.mode === 'rise'
      ? null
      : b.mode === 'land'
        ? { hw: 8, height: 18 }
        : b.mode === 'dive'
          ? { hw: 9, height: 30 }
          : { hw: 12, height: 36 },
  draw,
}
