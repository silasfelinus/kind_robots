// /utils/arcade/ghostTrail/bosses/ferryman.ts
//
// Zuzu: Ghost Trail's third headline boss (conductor kr-arcade t-017, CAMPAIGN-BLUEPRINT.md): the
// Drowned Ferryman, a tall drowned boatman in a sodden hood who poles a black skiff across the
// Drowned Watering Hole, a lantern of corpse-light in one hand and a long oar in the other. His
// own dark water follows the skiff, and when the act has a tide the skiff rides its line.
//
// Two phases:
//   While he drifts, keeping his distance, his lantern wards him: a ring of corpse-light round the
//   skiff turns throws aside. It drops whenever he attacks, so hit him while he swings and rests.
//   Phase 1 (full to half health):
//   - oarUp -> swing: the oar rises overhead, blade dripping and glowing (the tell), then sweeps
//     the water and sends a rolling wave along the ground: jump it. A high tide makes it taller.
//   - anchorTell -> anchor: he raises the lantern and a shadow spreads where Zuzu stands; an
//     anchor drops out of the dark onto it. Step off the shadow.
//   Each ends with the oar planted while he catches himself: the punish window.
//   At half health he sinks (immune: he is under the water) and resurfaces enraged (phase 2): his
//   hood torn back, his lantern and eyes burning crimson, a chain wound round him. He adds:
//   - whirl -> chain: the chain whirls overhead (HIGH: stay down) or along the water (LOW: jump),
//     then lashes out down that lane;
//   - lantern -> call: the lantern flares and the drowned claw up beside Zuzu (twice at most);
//   - submerge -> surface: he slips under (immune, briefly) and comes up across the water.
//
// Deterministic: all chance from ctx.rng. The art reads the same state (mode, timer, phase, the
// stashed water line), flashes white on `flash` and sinks for good on `dying`.

import type { Boss, BossCtx, BossDef } from '../bosses'
import { INK, glow, mix, rgba } from '../../snes'

type G = CanvasRenderingContext2D

/** The tell that opens each attack mode (the boss test walks these). */
export const FERRYMAN_TELLS: Record<string, string> = {
  swing: 'oarUp',
  anchor: 'anchorTell',
  chain: 'whirl',
  call: 'lantern',
}

// Scratch slots in b.n.
const WATER = 0 // the water line this tick (the act's tide), or 0 with none
const ANCHOR_X = 1 // first anchor's mark
const LANE = 2 // chain lane: 0 low (jump), 1 high (stay down)
const CALLS = 3 // times he has called the drowned
const COUNT = 4 // attacks begun (the pattern)
const DIR = 5 // drift direction
const ANCHOR_X2 = 6 // second anchor (phase 2), or 0
const CALL_X = 7 // where the drowned rise (art)
const CALL_X2 = 8
const FROM = 9 // submerge start x
const TO = 10 // where he surfaces
const SPLASH = 11 // ticks left on the oar's splash (art)

const OAR_TICKS = 40
const SWING_TICKS = 16
const ANCHOR_TELL = 44
const ANCHOR_FALL = 26
const WHIRL_TICKS = 42
const CHAIN_TICKS = 22
const LANTERN_TICKS = 40
const CALL_TICKS = 26
const SINK_TICKS = 60
const RISE_TICKS = 48
const SUBMERGE_TICKS = 40
const SURFACE_TICKS = 26
const ANCHOR_TOP = 40
/** The art's scale over its drawn units. */
const SCALE = 1.2

const n = (b: Boss, i: number) => b.n[i] ?? 0

/** The surface his skiff rides: the tide's line when it is up, else the ground. */
function surfaceOf(ctx: BossCtx) {
  return ctx.waterY !== null ? Math.min(ctx.groundY, ctx.waterY) : ctx.groundY
}

function rest(b: Boss) {
  b.mode = 'rest'
  b.timer = b.phase === 2 ? 38 : 50
}

function tell(b: Boss, ctx: BossCtx, mode: string, ticks: number) {
  b.mode = mode
  b.timer = ticks
  b.face = Math.sign(ctx.px - b.x) || -1
  ctx.sound('warn')
}

function clampArena(ctx: BossCtx, x: number, pad = 14) {
  return Math.max(ctx.arenaL + pad, Math.min(ctx.arenaR - pad, x))
}

function decide(b: Boss, ctx: BossCtx) {
  const k = (b.n[COUNT] = n(b, COUNT) + 1)
  if (b.phase === 1) {
    if (k % 2) tell(b, ctx, 'oarUp', OAR_TICKS)
    else {
      b.n[ANCHOR_X] = clampArena(ctx, ctx.px)
      b.n[ANCHOR_X2] = 0
      tell(b, ctx, 'anchorTell', ANCHOR_TELL)
    }
    return
  }
  // Phase 2: the full repertoire, on a fixed rotation so it reads.
  const step = k % 5
  if (step === 0 && n(b, CALLS) < 2) {
    b.n[CALL_X] = clampArena(ctx, ctx.px - 56, 20)
    b.n[CALL_X2] = clampArena(ctx, ctx.px + 56, 20)
    tell(b, ctx, 'lantern', LANTERN_TICKS)
  } else if (step === 1 || step === 0) {
    b.n[LANE] = ctx.rng() < 0.5 ? 0 : 1
    tell(b, ctx, 'whirl', WHIRL_TICKS)
  } else if (step === 2) {
    tell(b, ctx, 'oarUp', OAR_TICKS)
  } else if (step === 3) {
    b.n[ANCHOR_X] = clampArena(ctx, ctx.px)
    const side = b.x > ctx.px ? 1 : -1
    b.n[ANCHOR_X2] = clampArena(ctx, ctx.px + side * 44)
    tell(b, ctx, 'anchorTell', ANCHOR_TELL)
  } else {
    // Slip under and come up across the water from Zuzu.
    b.mode = 'submerge'
    b.timer = SUBMERGE_TICKS
    b.n[FROM] = b.x
    const lo = ctx.arenaL + 40
    const hi = ctx.arenaR - 34
    const far = ctx.px - lo > hi - ctx.px ? lo : hi
    b.n[TO] = Math.abs(far - ctx.px) < 70 ? b.x : far
  }
}

function update(b: Boss, ctx: BossCtx) {
  const ground = ctx.groundY
  const surf = surfaceOf(ctx)
  b.n[WATER] = ctx.waterY ?? 0
  if (n(b, SPLASH) > 0) b.n[SPLASH] = n(b, SPLASH) - 1
  const lo = ctx.arenaL + (b.phase === 2 ? 40 : 110)
  const hi = ctx.arenaR - 34

  switch (b.mode) {
    case 'drift': {
      b.face = Math.sign(ctx.px - b.x) || -1
      const gap = ctx.px - b.x
      // Keep his distance; otherwise wander the water.
      let dir = n(b, DIR) || -1
      if (Math.abs(gap) < 72) dir = -Math.sign(gap) || 1
      b.x += dir * 0.45 * ctx.speed
      if (b.x <= lo || b.x >= hi) {
        b.x = Math.max(lo, Math.min(hi, b.x))
        dir = b.x <= lo ? 1 : -1
      }
      b.n[DIR] = dir
      if (--b.timer <= 0) decide(b, ctx)
      break
    }
    case 'oarUp':
      if (--b.timer <= 0) {
        b.mode = 'swing'
        b.timer = SWING_TICKS
        const high = surf < ground
        ctx.bolt({
          kind: 'wave',
          x: b.x + b.face * 40,
          y: surf - (high ? 8 : 6),
          vx: b.face * 2.2 * ctx.speed,
          vy: 0,
          grav: 0,
          life: 150,
          arm: 0,
          hw: 7,
          hh: high ? 8 : 6,
        })
        ctx.sound('boom')
        b.n[SPLASH] = 24
      }
      break
    case 'swing':
      if (--b.timer <= 0) rest(b)
      break
    case 'anchorTell':
      if (--b.timer <= 0) {
        b.mode = 'anchor'
        b.timer = ANCHOR_FALL
        for (const i of [ANCHOR_X, ANCHOR_X2]) {
          if (!n(b, i)) continue
          ctx.bolt({
            kind: 'anchor',
            x: n(b, i),
            y: ANCHOR_TOP,
            vx: 0,
            vy: 3,
            grav: 0.3,
            life: 60,
            arm: 0,
            hw: 7,
            hh: 9,
          })
        }
        ctx.sound('shoot')
      }
      break
    case 'anchor':
      if (--b.timer <= 0) {
        ctx.sound('boom')
        rest(b)
      }
      break
    case 'whirl':
      if (--b.timer <= 0) {
        b.mode = 'chain'
        b.timer = CHAIN_TICKS
        const high = n(b, LANE) === 1
        ctx.bolt({
          kind: 'chain',
          x: b.x + b.face * 34,
          y: high ? ground - 38 : surf - 10,
          vx: b.face * 3.6 * ctx.speed,
          vy: 0,
          grav: 0,
          life: 90,
          arm: 0,
          hw: 14,
          hh: 3,
        })
        ctx.sound('shoot')
      }
      break
    case 'chain':
      if (--b.timer <= 0) rest(b)
      break
    case 'lantern':
      if (--b.timer <= 0) {
        b.mode = 'call'
        b.timer = CALL_TICKS
        b.n[CALLS] = n(b, CALLS) + 1
        ctx.summon('drowned', n(b, CALL_X), ground)
        ctx.summon('drowned', n(b, CALL_X2), ground)
      }
      break
    case 'call':
      if (--b.timer <= 0) rest(b)
      break
    case 'rest':
      if (--b.timer <= 0 && b.phase === 1 && b.hp <= b.maxHp / 2) {
        // Hurt to half: he goes under, straight from the blow that did it.
        b.mode = 'sink'
        b.timer = SINK_TICKS
        ctx.sound('boom')
      } else if (b.timer <= 0) {
        b.mode = 'drift'
        b.timer = b.phase === 2 ? 30 : 46 + Math.floor(ctx.rng() * 24)
      }
      break
    case 'sink':
      if (--b.timer <= 0) {
        b.mode = 'rise'
        b.timer = RISE_TICKS
        b.phase = 2
        ctx.sound('warn')
      }
      break
    case 'rise':
      if (--b.timer <= 0) {
        // He comes up calling his drowned.
        b.n[CALL_X] = clampArena(ctx, ctx.px - 56, 20)
        b.n[CALL_X2] = clampArena(ctx, ctx.px + 56, 20)
        b.n[COUNT] = 0
        tell(b, ctx, 'lantern', LANTERN_TICKS)
      }
      break
    case 'submerge':
      if (--b.timer <= 0) {
        b.x = n(b, TO)
        b.face = Math.sign(ctx.px - b.x) || -1
        b.mode = 'surface'
        b.timer = SURFACE_TICKS
      }
      break
    case 'surface':
      if (--b.timer <= 0) {
        b.mode = 'drift'
        b.timer = 24
      }
      break
    default:
      b.mode = 'drift'
      b.timer = 60
  }
}

// --- art --------------------------------------------------------------------------------------

const TAU = Math.PI * 2
/** Sodden oilcloth: near-black slate with a cold rim, so he stands out of the marsh fog. */
const CLOAK = ['#05060c', '#0c1018', '#161e2a', '#26384a', '#7ab4b4'] as const
const SKIN = ['#1e3430', '#3e6458', '#7aa092', '#b8d4c4', '#e6f4ea'] as const
const BONE = ['#3b2a26', '#7d6650', '#c4ad88', '#e9dcbc', '#fffaea'] as const
const WOOD = ['#140c0a', '#2a1a14', '#43291e', '#62402c', '#86603e'] as const
const WEED = ['#0f2a1a', '#1d4a2c', '#2f6b3a', '#5a9a52'] as const
const IRON = ['#14161c', '#2c303a', '#4a505e', '#7a8292', '#b4bcc8'] as const
const BRASS = ['#3a2410', '#6b4a1c', '#a87a2c', '#d8b25a'] as const
const WATER_C = ['#040c14', '#0a1c2a', '#123446', '#1f5a6e', '#5eb6c4'] as const
const GHOST = ['#0a3a2a', '#1f7a5a', '#4ad6a0', '#9cf5c8', '#e6fff2'] as const
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

/** A run of chain links from (x0, y0) to (x1, y1). */
function chainLinks(g: G, x0: number, y0: number, x1: number, y1: number) {
  const len = Math.hypot(x1 - x0, y1 - y0)
  const a = Math.atan2(y1 - y0, x1 - x0)
  const count = Math.max(1, Math.floor(len / 2.6))
  for (let i = 0; i <= count; i++) {
    const t = i / count
    ellipse(
      g,
      x0 + (x1 - x0) * t,
      y0 + (y1 - y0) * t,
      1.6,
      i % 2 ? 0.6 : 1.1,
      a,
    )
    g.lineWidth = 0.9
    g.strokeStyle = INK
    g.stroke()
    g.lineWidth = 0.5
    g.strokeStyle = c(i % 2 ? IRON[2] : IRON[3])
    g.stroke()
  }
}

/** The skiff: a long, waterlogged boat, prow at +x, its deck at -5. */
function paintSkiff(g: G, tick: number) {
  poly(
    g,
    [
      -32, -9, -28, -4, -20, 0, 18, 0, 27, -4, 33, -13, 35, -16, 33, -16, 30,
      -8, 24, -5, -26, -5, -30, -10,
    ],
  )
  inked(g, WOOD[2], 1.1)
  // Planks and their lit edges.
  g.fillStyle = c(WOOD[3])
  poly(g, [-28, -4.6, 26, -4.6, 24, -3.2, -26, -3.2])
  g.fill()
  g.fillStyle = c(WOOD[1])
  poly(g, [-21, -1.6, 19, -1.6, 18, 0, -20, 0])
  g.fill()
  g.strokeStyle = c(WOOD[1])
  g.lineWidth = 0.5
  for (const x of [-16, -6, 4, 14]) {
    g.beginPath()
    g.moveTo(x, -4.6)
    g.lineTo(x + 1, 0)
    g.stroke()
  }
  // Prow curl, rusted nails, weed trailing from the hull.
  g.fillStyle = c(WOOD[4])
  g.fillRect(29, -12, 1, 6)
  g.fillStyle = c(BRASS[1])
  for (const x of [-22, -12, -2, 8, 18]) g.fillRect(x, -3.8, 0.8, 0.8)
  for (let i = 0; i < 5; i++) {
    const x = -24 + i * 11 + hash(i) * 4
    const sway = Math.sin(tick / 16 + i) * 1.2
    limb(g, [x, -1, x + sway, 2.5, x - sway * 0.5, 5], 0.8, WEED[i % 2 ? 2 : 1])
  }
}

type Pose = {
  /** Oar: angle of the shaft (radians from +x, + is down) and where along it he holds it. */
  oar: number | null
  /** Lantern hand: 'low' hanging, 'high' raised, 'forward' held out. */
  lantern: 'low' | 'high' | 'forward'
  lean: number
  whirl: number | null
}

function poseOf(b: Boss, tick: number): Pose {
  const p: Pose = { oar: 2.05, lantern: 'low', lean: 0, whirl: null }
  switch (b.mode) {
    case 'drift':
      // Poling: the oar pushes back through the water.
      p.oar = 2.05 + Math.sin(tick / 20) * 0.16
      break
    case 'oarUp': {
      const k = Math.min(1, (OAR_TICKS - b.timer) / 14)
      p.oar = 2.05 + (-2.35 - 2.05) * k
      p.lean = -0.08 * k
      break
    }
    case 'swing': {
      const k = Math.min(1, (SWING_TICKS - b.timer) / 6)
      p.oar = -2.35 + (0.55 + 2.35) * k
      p.lean = 0.14 * k
      break
    }
    case 'rest':
      p.oar = 1.15
      p.lean = 0.1 + Math.sin(tick / 9) * 0.02
      break
    case 'anchorTell':
    case 'anchor':
      p.lantern = 'high'
      p.oar = 1.75
      break
    case 'lantern':
    case 'call':
      p.lantern = 'forward'
      p.oar = 1.85
      break
    case 'whirl':
      p.oar = 1.85
      p.whirl = n(b, LANE)
      break
    case 'chain':
      p.oar = 1.85
      p.lean = 0.12
      break
  }
  return p
}

function paintFerryman(g: G, b: Boss, pose: Pose, tick: number, rage: boolean) {
  const eye = rage ? CRIMSON : GHOST
  g.save()
  g.translate(0, -5)
  g.rotate(pose.lean)
  const sway = Math.sin(tick / 18) * 1.2

  // The oar behind him when it is planted or poling.
  const oarBehind = pose.oar !== null && (pose.oar > 1 || pose.oar < -1)
  const hold: [number, number] = [5, -28]
  const paintOar = () => {
    if (pose.oar === null) return
    g.save()
    g.translate(hold[0], hold[1])
    g.rotate(pose.oar)
    // Shaft from 18 behind the hand to the blade 40 ahead.
    poly(g, [-24, -1, 32, -1, 32, 1, -24, 1])
    inked(g, WOOD[3], 1)
    g.fillStyle = c(WOOD[4])
    g.fillRect(-24, -1, 56, 0.6)
    // The blade, slick and weed-hung.
    poly(g, [31, -1.4, 36, -3.4, 46, -3, 48, 0, 46, 3, 36, 3.4, 31, 1.4])
    inked(g, WOOD[2], 1)
    g.fillStyle = c(WOOD[3])
    poly(g, [33, -2.2, 46, -2, 47, 0, 33, 0])
    g.fill()
    limb(g, [40, 3, 41, 6, 39, 8.4], 0.8, WEED[2])
    if (b.mode === 'oarUp') {
      const k = 1 - b.timer / OAR_TICKS
      glow(g, 40, 0, 8 + k * 8, WATER_C[4], 0.3 + 0.4 * k)
      // Water streaming off the raised blade.
      for (let i = 0; i < 4; i++) {
        const d = ((tick * 0.8 + i * 6) % 22) / 22
        g.fillStyle = rgba(WATER_C[4], 0.8 * (1 - d))
        g.fillRect(36 + i * 2.4, 3 + d * 18, 0.8, 2)
      }
    }
    g.restore()
  }
  if (oarBehind) paintOar()

  // The long sodden cloak, tattered at the hem, dripping onto the deck.
  poly(g, [
    -4,
    -44,
    -9,
    -30,
    -12 - sway,
    -6,
    -9,
    -1.5,
    -6.5,
    -4,
    -4,
    0,
    -1,
    -3.6,
    2,
    0,
    5,
    -3,
    8,
    0,
    10 + sway * 0.5,
    -6,
    9,
    -30,
    5,
    -44,
  ])
  inked(g, CLOAK[2], 1.1)
  g.fillStyle = c(CLOAK[1])
  poly(g, [-4, -40, -8.6, -28, -11 - sway, -5, -7, -3, -3, -18])
  g.fill()
  g.fillStyle = c(CLOAK[3])
  poly(g, [4, -42, 8, -29, 9 + sway * 0.4, -7, 6, -4, 3, -26])
  g.fill()
  // A cold rim light down his front edge.
  g.strokeStyle = c(CLOAK[4])
  g.lineWidth = 0.6
  poly(g, [5, -43, 8.6, -30, 9.6 + sway * 0.5, -7], false)
  g.stroke()
  // Fold lines.
  g.strokeStyle = c(CLOAK[0])
  g.lineWidth = 0.6
  for (const x of [-5, 0, 4]) {
    g.beginPath()
    g.moveTo(x * 0.4, -34)
    g.quadraticCurveTo(x, -18, x * 1.3 + sway * 0.3, -3)
    g.stroke()
  }
  // Weed draped over the shoulders.
  for (let i = 0; i < 4; i++) {
    const x = -5 + i * 3.4
    const s = Math.sin(tick / 13 + i * 2) * 0.8
    limb(
      g,
      [x, -41, x + s, -34, x - s * 0.6, -27 + hash(i) * 4],
      0.9,
      WEED[i % 2 ? 3 : 2],
    )
  }
  // A rope belt with a brass toll-coin.
  g.fillStyle = INK
  g.fillRect(-7.6, -21, 16, 2.4)
  g.fillStyle = c('#7a6a4a')
  g.fillRect(-7.2, -20.6, 15.2, 1.6)
  ellipse(g, 3, -18, 1.7, 1.7)
  inked(g, BRASS[2], 0.6)
  // Phase 2: a chain wound round him.
  if (rage) chainLinks(g, -8, -36, 9, -14)

  // The hood, peaked forward, and the drowned face in its shadow.
  g.save()
  g.translate(1, -47)
  poly(g, [-7, 6, -8, -1, -4, -6.5, 3, -7.5, 9.5, -3, 8, 1, 7.4, 6])
  inked(g, CLOAK[3], 1.1)
  g.fillStyle = c(CLOAK[4])
  poly(g, [-4, -5.6, 3, -6.6, 8.6, -3, 3, -4.6])
  g.fill()
  // The opening.
  poly(g, [-1, 6, 0, -2, 4, -4, 7.6, -1, 7, 6])
  g.fillStyle = c(INK)
  g.fill()
  if (rage) {
    // Hood torn back: the skull, weed-grey and barnacled, jaw slack.
    poly(g, [1.2, 2.4, 7.4, 2.2, 7, 6.6, 2.4, 6.4])
    inked(g, BONE[1], 0.6)
    ellipse(g, 4.2, 0, 3.6, 3.6)
    inked(g, BONE[2], 0.7)
    g.fillStyle = c(SKIN[2])
    ellipse(g, 3, -1.6, 1.8, 1.2)
    g.fill()
    g.fillStyle = INK
    ellipse(g, 3.6, 0.6, 1.3, 1.2)
    g.fill()
    ellipse(g, 6.4, 0.6, 1, 1.2)
    g.fill()
    poly(g, [5, 2.2, 5.8, 3.4, 4.6, 3.4])
    g.fill()
    g.fillRect(2.2, 4.4, 4.8, 1.4)
    g.fillStyle = c(BONE[3])
    for (let i = 0; i < 4; i++) g.fillRect(2.4 + i * 1.2, 4.2, 0.7, 0.8)
    g.fillStyle = c(SKIN[0])
    for (let i = 0; i < 3; i++)
      g.fillRect(1.6 + i * 1.6, -3 + hash(i) * 1.2, 0.9, 0.9)
  } else {
    // A drowned face, gaunt and grey-green, sunk in the hood's shadow.
    poly(g, [2, -2, 6.6, -2.6, 7.4, 1.6, 6.4, 5.6, 4, 6.4, 2.2, 4])
    inked(g, SKIN[1], 0.6)
    g.fillStyle = c(SKIN[2])
    poly(g, [4.4, -2.2, 6.6, -2.4, 7.2, 1.4, 5, 0.6])
    g.fill()
    // Sunken sockets and a gaping mouth with a trickle of water.
    g.fillStyle = INK
    ellipse(g, 4.4, -0.1, 1.2, 1.1)
    g.fill()
    ellipse(g, 6.6, 0, 0.9, 1)
    g.fill()
    poly(g, [4, 3, 6.6, 2.8, 6, 5.4, 4.4, 5.4])
    g.fill()
    g.fillStyle = c(WATER_C[4])
    g.fillRect(5, 5.4, 0.5, 1.6 + Math.sin(tick / 5))
  }
  g.fillStyle = eye[3]
  g.fillRect(3.9, -0.5, 1, 0.9)
  g.fillRect(6.2, -0.4, 0.8, 0.9)
  g.restore()
  glow(g, 6, -47, 4.5, eye[2], 0.55)

  // Oar arm (both hands on the shaft when it is in front).
  if (!oarBehind) paintOar()
  limb(g, [3, -40, 7, -33, hold[0], hold[1]], 3.2, CLOAK[3])
  ellipse(g, hold[0], hold[1], 1.7, 1.6)
  inked(g, SKIN[2], 0.7)

  // Lantern arm.
  const lp: [number, number] =
    pose.lantern === 'high'
      ? [8, -60]
      : pose.lantern === 'forward'
        ? [16, -36]
        : [-9, -24]
  const sh: [number, number] = pose.lantern === 'low' ? [-3, -40] : [2, -41]
  const el: [number, number] =
    pose.lantern === 'high'
      ? [8, -50]
      : pose.lantern === 'forward'
        ? [9, -36]
        : [-8, -33]
  limb(g, [sh[0], sh[1], el[0], el[1], lp[0], lp[1]], 3, CLOAK[2])
  ellipse(g, lp[0], lp[1], 1.6, 1.5)
  inked(g, SKIN[2], 0.7)
  paintLantern(g, lp[0], lp[1] + 2, tick, rage, b)

  // The chain whirling for its lash.
  if (pose.whirl !== null) {
    const k = 1 - b.timer / WHIRL_TICKS
    // It spins at the very height it will lash: overhead-high or skimming the water.
    const cy = pose.whirl ? -38 / SCALE + 5 : -10 / SCALE + 5
    const r = 8 + k * 3
    const a = tick * (0.25 + k * 0.25)
    g.save()
    g.globalAlpha *= 0.85
    for (let i = 0; i < 10; i++) {
      const t = a + (i / 10) * TAU
      ellipse(g, 20 + Math.cos(t) * r, cy + Math.sin(t) * r * 0.45, 1.6, 1, t)
      g.lineWidth = 0.8
      g.strokeStyle = INK
      g.stroke()
      g.lineWidth = 0.5
      g.strokeStyle = c(IRON[3])
      g.stroke()
    }
    g.restore()
    glow(g, 20, cy, r + 4, CRIMSON[2], 0.2 + 0.3 * k)
    limb(g, [6, -38, 12, (cy - 38) / 2, 18, cy], 3, CLOAK[3])
  }
  if (b.mode === 'chain') {
    // The arm thrown out after the lash.
    limb(g, [6, -38, 14, -34, 21, -36], 3, CLOAK[3])
    chainLinks(g, 21, -36, 30, -36 + Math.sin(tick / 2) * 2)
  }
  g.restore()
}

function paintLantern(
  g: G,
  x: number,
  y: number,
  tick: number,
  rage: boolean,
  b: Boss,
) {
  const flame = rage ? CRIMSON : GHOST
  const swing = Math.sin(tick / 11) * 0.12
  g.save()
  g.translate(x, y)
  g.rotate(swing)
  g.strokeStyle = INK
  g.lineWidth = 0.6
  g.beginPath()
  g.moveTo(0, -2)
  g.lineTo(0, 0)
  g.stroke()
  poly(g, [-2.6, 1.4, 2.6, 1.4, 3, 8, -3, 8])
  inked(g, flame[2], 0.8)
  g.fillStyle = c(flame[4])
  poly(g, [-0.8, 7, 0, 3 + Math.sin(tick / 3) * 0.6, 0.8, 7])
  g.fill()
  g.fillStyle = c(IRON[1])
  g.fillRect(-3, 0.6, 6, 1.4)
  g.fillRect(-3.2, 7.6, 6.4, 1.4)
  g.fillRect(-0.4, 1.4, 0.8, 6.4)
  g.restore()
  const flare =
    b.mode === 'lantern'
      ? 1 - b.timer / LANTERN_TICKS
      : b.mode === 'anchorTell'
        ? 0.5
        : 0
  glow(g, x, y + 5, 12 + flare * 14, flame[2], 0.5 + flare * 0.35)
}

function draw(g: G, b: Boss, tick: number, face: number) {
  const ground = b.y
  const water = n(b, WATER)
  const surf = water > 0 ? Math.min(ground, water) : ground
  const dying = b.dying > 0
  whiteOut = b.flash > 0 || (dying && Math.floor(b.dying / 3) % 2 === 1) ? 1 : 0
  const rage = b.phase === 2 || (b.mode === 'rise' && b.timer < RISE_TICKS - 10)
  const f = b.mode === 'drift' || b.mode === 'rest' ? face : b.face
  // How far under the water he is (0 up .. 1 gone).
  let under = 0
  if (b.mode === 'sink') under = 1 - b.timer / SINK_TICKS
  else if (b.mode === 'rise') under = b.timer / RISE_TICKS
  else if (b.mode === 'submerge')
    under = Math.min(1, (1 - b.timer / SUBMERGE_TICKS) * 1.6)
  else if (b.mode === 'surface') under = b.timer / SURFACE_TICKS
  if (dying) under = Math.max(under, 1 - b.dying / 70)
  const depth = under * 66
  const x = Math.round(b.x)
  const bob = Math.sin(tick / 22) * 1

  // Anchor marks: a shadow spreading where it will fall, tightening as it comes.
  if (b.mode === 'anchorTell' || b.mode === 'anchor') {
    const k =
      b.mode === 'anchorTell'
        ? 1 - b.timer / ANCHOR_TELL
        : 1 + (ANCHOR_FALL - b.timer) / ANCHOR_FALL
    for (const i of [ANCHOR_X, ANCHOR_X2]) {
      const ax = n(b, i)
      if (!ax) continue
      g.fillStyle = rgba(INK, 0.25 + 0.3 * Math.min(1, k))
      ellipse(g, ax, ground, 4 + Math.min(1, k) * 8, 1.4 + Math.min(1, k) * 1.4)
      g.fill()
      g.strokeStyle = rgba(CRIMSON[2], 0.35 + 0.35 * Math.sin(tick / 3) ** 2)
      g.lineWidth = 0.8
      ellipse(g, ax, ground, 13 - Math.min(1, k) * 3, 3)
      g.stroke()
      // A chain hanging down out of the dark onto the mark.
      if (b.mode === 'anchorTell') {
        g.save()
        g.globalAlpha *= 0.5 * k
        chainLinks(g, ax, 30, ax, 30 + k * 30)
        g.restore()
      }
    }
  }
  // Where the drowned will claw up: hands breaking the earth.
  if (b.mode === 'lantern' || b.mode === 'call') {
    const k = b.mode === 'lantern' ? 1 - b.timer / LANTERN_TICKS : 1
    for (const i of [CALL_X, CALL_X2]) {
      const cx = n(b, i)
      glow(g, cx, ground - 2, 10 + 6 * k, GHOST[2], 0.3 + 0.3 * k)
      for (const s of [-1, 1]) {
        const hx = cx + s * 3
        const hy = ground + 2 - k * 6
        limb(g, [hx, ground + 2, hx + s * 0.6, hy], 1.6, SKIN[1])
        g.fillStyle = c(SKIN[2])
        for (let j = 0; j < 3; j++) g.fillRect(hx - 1 + j, hy - 1.6, 0.6, 1.6)
      }
    }
  }

  // His black water, following the skiff (on the tide's line when it is up).
  g.save()
  const poolW = 40
  g.fillStyle = rgba(WATER_C[1], 0.85)
  ellipse(g, x, surf + 1, poolW, 3.6)
  g.fill()
  g.fillStyle = rgba(WATER_C[2], 0.9)
  ellipse(g, x, surf + 0.6, poolW - 6, 2.4)
  g.fill()
  for (let i = 0; i < 6; i++) {
    const rx = x - poolW + 6 + ((i * 13 + tick * 0.3) % (poolW * 2 - 12))
    g.fillStyle = rgba(rage ? CRIMSON[3] : WATER_C[4], 0.55)
    g.fillRect(rx, surf - 0.4 + (i % 2), 3, 0.6)
  }
  if (rage) {
    g.strokeStyle = rgba(CRIMSON[2], 0.35 + 0.15 * Math.sin(tick / 6))
    g.lineWidth = 0.8
    ellipse(g, x, surf + 1, poolW - 2 + Math.sin(tick / 9) * 2, 3)
    g.stroke()
  }
  g.restore()

  // Skiff and ferryman, clipped at the water line as he goes under.
  g.save()
  g.beginPath()
  g.rect(x - 70, 0, 140, surf + 1)
  g.clip()
  g.translate(x, surf + bob * (1 - under) + depth)
  g.rotate(under * 0.25 * -f)
  g.scale(f, 1)
  const fade = dying ? Math.min(1, b.dying / 30) : 1
  g.globalAlpha *= fade
  g.scale(SCALE, SCALE)
  paintSkiff(g, tick)
  paintFerryman(g, b, poseOf(b, tick), tick, rage)
  g.restore()

  // The lantern's ward: a ring of light round him while he drifts, fading as he readies a blow.
  if (b.mode === 'drift' && !dying) {
    const k = Math.min(1, b.timer / 12)
    const ward = rage ? CRIMSON : GHOST
    g.save()
    g.globalAlpha *= 0.55 * k
    g.strokeStyle = ward[3]
    g.lineWidth = 0.8
    ellipse(g, x, surf - 36, 27 + Math.sin(tick / 8), 41)
    g.stroke()
    g.setLineDash([2, 3])
    g.lineDashOffset = -tick * 0.3
    ellipse(g, x, surf - 36, 24, 38)
    g.stroke()
    g.restore()
    glow(g, x, surf - 36, 34, ward[2], 0.12 * k)
  }
  // Bubbles and a crimson upwelling while he is under.
  if (under > 0.05) {
    for (let i = 0; i < 6; i++) {
      const p = ((tick * 0.7 + i * 9) % 30) / 30
      g.strokeStyle = rgba(WATER_C[4], 0.8 * (1 - p))
      g.lineWidth = 0.6
      ellipse(g, x - 14 + hash(i) * 28, surf - p * 10, 1 + p * 1.2, 1 + p * 1.2)
      g.stroke()
    }
    if (b.mode === 'rise') glow(g, x, surf - 6, 30, CRIMSON[2], 0.5)
  }
  // The splash where the oar struck.
  const splash = n(b, SPLASH)
  if (splash > 0 && !dying) {
    const k = splash / 24
    const sx = x + b.face * 40
    for (let i = 0; i < 8; i++) {
      const a = -Math.PI / 2 + (i - 3.5) * 0.22
      const r = (1 - k) * 16 + 2
      g.fillStyle = rgba(i % 2 ? WATER_C[4] : '#e0fbff', 0.9 * k)
      g.fillRect(sx + Math.cos(a) * r, surf + Math.sin(a) * r * 1.4, 1.4, 1.4)
    }
  }
  whiteOut = 0
}

export const FERRYMAN: BossDef = {
  name: 'THE DROWNED FERRYMAN',
  title: 'TOLL OF THE DEEP',
  hp: 34,
  hw: 12,
  height: 58,
  create: (b, ctx) => {
    b.n = [ctx.waterY ?? 0, 0, 0, 0, 0, -1, 0, 0, 0, 0, 0, 0]
    b.x = Math.min(b.x, ctx.arenaR - 40)
    b.mode = 'drift'
    b.timer = 70
  },
  update,
  // Drifting, his lantern's ward holds (a ring of corpse-light round the skiff); attacking, his
  // hands are busy and it drops. Under the water, nothing reaches him.
  immune: (b) =>
    b.mode === 'drift' ||
    b.mode === 'sink' ||
    b.mode === 'rise' ||
    b.mode === 'submerge' ||
    (b.mode === 'surface' && b.timer > SURFACE_TICKS / 2),
  contact: (b) =>
    b.mode === 'sink' ||
    b.mode === 'rise' ||
    b.mode === 'submerge' ||
    b.mode === 'surface'
      ? null
      : { hw: 9, height: 54 },
  draw,
}
