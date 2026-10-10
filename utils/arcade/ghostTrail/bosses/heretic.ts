// /utils/arcade/ghostTrail/bosses/heretic.ts
//
// The Bell Heretic (conductor kr-arcade t-019, CAMPAIGN-BLUEPRINT.md stage 5): the end of Mission
// Bell Tower. A hunched giant in a crimson robe, a ram's skull under the hood, swinging the tower's
// great bell on a chain. Every attack has a tell (a windup you can see and hear), an active window
// and a recovery you can punish:
//
//   - swing: he hauls the bell back over his shoulder (a crimson arc traces its path), then sweeps it
//     down past his feet and out in front. Jump the low end, or stand outside its reach.
//   - slam: he hoists the bell over a spot in front of him (the flagstones there crack crimson) and
//     drops it; a beat later crimson waves roll out of the crater both ways. Jump them. The bell
//     sticks: hit him while he heaves at it.
//   - ritual: he raises his claw and crimson circles open under Zuzu, one at a time; each glows
//     before its pillar erupts. Step off. (Not at arm's length, where stepping off means into him.)
//   - toll: he rings the bell overhead and the tower sheds its masonry. Shadows and trickling grit
//     mark where each stone will land.
//   - leap: crowded against a wall, he crouches and heaves himself over Zuzu to the open floor (no
//     contact in the air) and lands heavily.
//
// While he stalks and attacks, a ring of crimson sigils wards him (hits spark off). The ward gutters
// out when an attack leaves him spent, the bell stuck, or the robe parted over his burning heart:
// that is the window. He fights at the length of his chain, shuffling back when crowded. At half
// health his robe catches fire (a roar and a firestorm, the ward blazing; then he staggers, open)
// and the pattern quickens: shorter windups and recoveries, a second shock when he wrenches the bell
// free, stones shaken loose by every swing.
//
// Deterministic: all chance from ctx.rng. The bell is painted, not a bolt sprite: its reach is a
// one-tick bolt that steps onto it from off-screen (see `reach`), so the game's own bolt collision
// decides hits. Drawing is plain canvas 2D.

import type { Boss, BossCtx, BossDef } from '../bosses'
import { INK, glow, mix, rgba } from '../../snes'

const TAU = Math.PI * 2

/** Every move the Heretic makes, in the order a fight first shows them. */
export const HERETIC_MODES = [
  'stalk',
  'swingTell',
  'swing',
  'slamTell',
  'slam',
  'stuck',
  'ritualTell',
  'ritual',
  'tollTell',
  'toll',
  'spent',
  'ignite',
  'leapTell',
  'leap',
] as const
export type HereticMode = (typeof HERETIC_MODES)[number]

/** Each attack and the tell that must come first. */
export const HERETIC_TELLS: Record<string, HereticMode> = {
  swing: 'swingTell',
  slam: 'slamTell',
  ritual: 'ritualTell',
  toll: 'tollTell',
  leap: 'leapTell',
}

/** Where his ward is down: the punish windows. */
const OPEN = new Set<string>(['spent', 'stuck'])

// --- scratch layout (b.n) ---------------------------------------------------------------------
const N_LAST = 0 // last attack (index into ATTACKS)
const N_LEFT = 1 // ritual circles still to come
const N_LEN = 2 // the current mode's full length, for progress
const N_AUX = 3 // per-mode counter (ticks to the next circle)
const ROCK0 = 4 // falling masonry: ROCKS slots of [x, t0 (shadow appears), 0]
const ROCKS = 6
const RING0 = ROCK0 + ROCKS * 3 // ritual circles: RINGS slots of [x, t0, arm]
const RINGS = 4
const N_IGNITE = RING0 + RINGS * 3 // b.t when the robe caught
const N_FROM = N_IGNITE + 1 // leap: take-off x
const N_TO = N_FROM + 1 // leap: landing x
const N_SIZE = N_TO + 1

const ATTACKS = ['swing', 'slam', 'ritual', 'toll'] as const

// --- tuning (phase 1, phase 2) ----------------------------------------------------------------
const HP = 34
const WALK = [0.34, 0.5]
const STALK = [72, 50]
const SWING_TELL = [52, 38]
const SWING = [46, 36]
const SLAM_TELL = [50, 36]
const SLAM = 16
const SLAM_HIT = 6 // slam timer value at impact
const STUCK = [58, 50]
const WAVE_SPEED = 1.6
const WRENCH = 40 // phase two: ticks into 'stuck' when he wrenches the bell free
const RITUAL_TELL = [42, 32]
const RITUAL_EVERY = [52, 42] // never two circles armed at once
const RITUAL_COUNT = [3, 4]
const RITUAL_ARM = [48, 38]
const PILLAR_LIVE = 28
const TOLL_TELL = [50, 38]
const TOLL_COUNT = [4, 6]
const TOLL_STAGGER = 9
const SHADOW_LEAD = 42 // ticks a stone's shadow shows before it drops
const STONE_TOP = 34
const STONE_VY = 0.5
const STONE_G = 0.22
const SPENT = [52, 46]
const IGNITE = 96
const LEAP_TELL = 36
const LEAP = 50
const LEAP_HEIGHT = 62
const LAND = 40
/** The floor every arena stands on (the game's GROUND_Y). */
const FLOOR = 208

// --- the bell's rig -----------------------------------------------------------------------------
/** Swing pivot (his raised fist) and chain length, local frame (+x toward his face, feet at 0). */
const PIVOT = { x: 8, y: -84 }
const CHAIN = 72
const SWING_FROM = -2.3
const SWING_TO = 0.75
const SLAM_AT = { x: 44, y: -11 }
/** The fist's height when the bell is hoisted over the mark. */
const SLAM_TOP = -98
const REST = { x: 18, y: -42 }

const ease = (u: number) => (1 - Math.cos(Math.PI * clamp01(u))) / 2
const clamp01 = (u: number) => Math.max(0, Math.min(1, u))
const lerp = (a: number, b: number, u: number) => a + (b - a) * u

const ph = (b: Boss) => (b.phase === 2 ? 1 : 0)
const progress = (b: Boss) => 1 - b.timer / Math.max(1, b.n[N_LEN] ?? 1)

type Rig = {
  /** Fist holding the chain. */
  hx: number
  hy: number
  /** Bell centre and tilt. */
  bx: number
  by: number
  ang: number
  /** Chain sag (0 taut). */
  sag: number
}

function swingAngle(u: number) {
  return SWING_FROM + (SWING_TO - SWING_FROM) * ease(u)
}

/** Where his fist and the bell are this tick (local frame). Shared by the hitbox and the art. */
export function hereticRig(b: Boss): Rig {
  const u = progress(b)
  const t = b.t
  const sway = Math.sin(t / 26) * 0.12
  const hang = (hx: number, hy: number, len: number, a: number): Rig => ({
    hx,
    hy,
    bx: hx + Math.sin(a) * (len + 13),
    by: hy + Math.cos(a) * (len + 13),
    ang: -a,
    sag: 0,
  })
  if (b.dying > 0) return { ...hang(22, -30, 12, 0), bx: 30, by: -11, sag: 6 }
  switch (b.mode) {
    case 'swingTell': {
      const k = ease(Math.min(1, u * 1.25))
      const shake = u > 0.75 ? Math.sin(t * 1.3) * 0.05 : 0
      const len = lerp(28, CHAIN, k)
      const a = lerp(0, SWING_FROM, k) + shake
      const hx = lerp(REST.x, PIVOT.x, k)
      const hy = lerp(REST.y, PIVOT.y, k)
      return {
        hx,
        hy,
        bx: hx + Math.sin(a) * len,
        by: hy + Math.cos(a) * len,
        ang: -a,
        sag: 0,
      }
    }
    case 'swing': {
      const a = swingAngle(u)
      return {
        hx: PIVOT.x,
        hy: PIVOT.y,
        bx: PIVOT.x + Math.sin(a) * CHAIN,
        by: PIVOT.y + Math.cos(a) * CHAIN,
        ang: -a,
        sag: 0,
      }
    }
    case 'slamTell': {
      // Hoisted high over the mark on its chain, shaking as it comes to the top.
      const k = ease(Math.min(1, u * 1.4))
      const shake = u > 0.7 ? Math.sin(t * 1.5) * 0.12 : 0
      return hang(
        lerp(REST.x, SLAM_AT.x - 4, k),
        lerp(REST.y, SLAM_TOP, k),
        13,
        shake + (1 - k) * Math.sin(Math.PI * k) * 0.8,
      )
    }
    case 'slam': {
      // Straight down onto the mark the tell lit, gathering speed.
      const fall = clamp01((SLAM - b.timer) / (SLAM - SLAM_HIT))
      const by = lerp(SLAM_TOP + 26, SLAM_AT.y, fall * fall)
      return {
        hx: SLAM_AT.x - 4,
        hy: Math.min(by - 26, -40),
        bx: SLAM_AT.x,
        by,
        ang: 0,
        sag: by - 26 < -40 ? 0 : 4,
      }
    }
    case 'stuck': {
      const tug = Math.max(0, Math.sin(t / 7)) * 3
      return {
        hx: 30 - tug,
        hy: -36 - tug * 0.5,
        bx: SLAM_AT.x,
        by: SLAM_AT.y + 2,
        ang: -0.15,
        sag: 2 - tug * 0.6,
      }
    }
    case 'tollTell':
    case 'toll': {
      const k = b.mode === 'tollTell' ? ease(Math.min(1, u * 1.6)) : 1
      const ring = Math.sin(t / 4) * (b.mode === 'toll' ? 0.55 : 0.2 + 0.4 * u)
      const hx = lerp(REST.x, 30, k)
      const hy = lerp(REST.y, -108, k)
      return hang(hx, hy, lerp(15, 9, k), ring)
    }
    case 'ritualTell':
    case 'ritual':
      // The bell planted at his feet; the fist holds the slack.
      return { hx: 20, hy: -36, bx: 26, by: -11, ang: 0, sag: 5 }
    case 'spent': {
      // Dropped where the last move left it.
      const drop = clamp01(u * 5)
      return {
        hx: 22,
        hy: -32,
        bx: 34,
        by: lerp(-34, -11, drop * drop),
        ang: (1 - drop) * 0.5,
        sag: 6 * drop,
      }
    }
    case 'ignite':
      return { hx: 30, hy: -40, bx: 34, by: -11, ang: 0.1, sag: 4 }
    case 'leap': {
      // The bell swings out behind him through the air.
      const a = -0.9 - Math.sin(Math.PI * u) * 0.6
      return hang(16, -50, 12, a)
    }
    default:
      return hang(REST.x, REST.y + Math.sin(t / 18), 15, sway)
  }
}

// --- behaviour ----------------------------------------------------------------------------------

function setMode(b: Boss, mode: HereticMode, len: number) {
  b.mode = mode
  b.timer = Math.max(1, Math.round(len))
  b.n[N_LEN] = b.timer
  b.n[N_AUX] = 0
}

/** Tells are never shorter than 30 ticks, even on New Game+. */
const tellLen = (ticks: number, ctx: BossCtx) =>
  Math.max(30, Math.round(ticks / (1 + (ctx.tier - 1) * 0.12)))

function tell(b: Boss, ctx: BossCtx, mode: HereticMode, ticks: number) {
  setMode(b, mode, tellLen(ticks, ctx))
  ctx.sound('warn')
}

function lo(ctx: BossCtx) {
  return ctx.arenaL + 46
}
function hi(ctx: BossCtx) {
  return ctx.arenaR - 46
}

function pickAttack(b: Boss, ctx: BossCtx) {
  const gap = Math.abs(ctx.px - b.x)
  // Crowded against a wall: heave himself over Zuzu to the open floor.
  const pinned = b.x <= lo(ctx) + 2 || b.x >= hi(ctx) - 2
  if (pinned && gap < 76) {
    const dir = Math.sign(ctx.px - b.x) || -b.face
    b.n[N_FROM] = b.x
    b.n[N_TO] = Math.max(lo(ctx), Math.min(hi(ctx), ctx.px + dir * 96))
    tell(b, ctx, 'leapTell', LEAP_TELL)
    return
  }
  const room = b.face > 0 ? ctx.arenaR - b.x : b.x - ctx.arenaL
  const weights = ATTACKS.map((a, i): number => {
    if (i === b.n[N_LAST]) return 0
    if (a === 'swing') return room < 84 ? 0 : gap < 120 ? 4 : 1
    if (a === 'slam') return gap < 150 ? 3 : 1
    // Not at arm's length: stepping off a circle there means stepping into him.
    if (a === 'ritual') return gap < 50 ? 0 : gap > 90 ? 3 : 1
    return 2
  })
  const total = weights.reduce((s, w) => s + w, 0)
  let r = ctx.rng() * total
  let pick = 0
  for (let i = 0; i < weights.length; i++) {
    r -= weights[i]!
    if (r < 0) {
      pick = i
      break
    }
  }
  b.n[N_LAST] = pick
  const p = ph(b)
  const attack = ATTACKS[pick]!
  if (attack === 'swing') tell(b, ctx, 'swingTell', SWING_TELL[p]!)
  else if (attack === 'slam') tell(b, ctx, 'slamTell', SLAM_TELL[p]!)
  else if (attack === 'ritual') tell(b, ctx, 'ritualTell', RITUAL_TELL[p]!)
  else tell(b, ctx, 'tollTell', TOLL_TELL[p]!)
}

/**
 * A one-tick hitbox over a painted weapon. The game steps a bolt before it tests the hit, so this
 * one starts far off-screen and steps exactly onto (x, y) next tick: the boss's own art is all the
 * player sees, and the game's bolt collision decides the hit. Which side it steps in from changes
 * nothing for a player; it is only how the demo pilot reads it (see `from`).
 */
export function reach(
  ctx: BossCtx,
  x: number,
  y: number,
  hw: number,
  hh: number,
  /**
   * 'side' arrives from off-screen left instead: to the demo pilot that reads as something low and
   * incoming to hop (right for a sweep along the floor); 'drop' reads as something to step from.
   */
  from: 'drop' | 'side' = 'drop',
) {
  const side = from === 'side'
  ctx.bolt({
    kind: 'chain',
    x: side ? x - REACH_FROM : x,
    y: side ? y : y - REACH_FROM,
    vx: side ? REACH_FROM : 0,
    vy: side ? 0 : REACH_FROM,
    grav: 0,
    life: 1,
    arm: 0,
    hw,
    hh,
  })
}
export const REACH_FROM = 2000

/** The bell's reach, where it will be next tick. */
function bellBolt(b: Boss, ctx: BossCtx, prev: Rig, from: 'drop' | 'side') {
  const r = hereticRig(b)
  // Lead it by its own motion, so the hitbox lands where the bell is drawn next tick.
  const nx = r.bx + (r.bx - prev.bx)
  const ny = r.by + (r.by - prev.by)
  reach(ctx, b.x + b.face * nx, b.y + ny, 11, 12, from)
}

/** Crimson waves rolling out both ways from where the bell struck. */
function shockwave(ctx: BossCtx, x: number) {
  for (const dir of [-1, 1])
    ctx.bolt({
      kind: 'wave',
      x: x + dir * 2,
      y: ctx.groundY - 7,
      vx: dir * WAVE_SPEED,
      vy: 0,
      grav: 0,
      life: 220,
      arm: 0,
      hw: 6,
      hh: 7,
    })
}

function dropStone(b: Boss, ctx: BossCtx, x: number, delay: number) {
  for (let s = 0; s < ROCKS; s++) {
    const i = ROCK0 + s * 3
    if (b.n[i]) continue
    b.n[i] = Math.max(ctx.arenaL + 10, Math.min(ctx.arenaR - 10, x))
    b.n[i + 1] = b.t + delay
    b.n[i + 2] = 0
    return
  }
}

function openCircle(b: Boss, ctx: BossCtx) {
  const p = ph(b)
  const arm = RITUAL_ARM[p]!
  // Centred a step off Zuzu: behind him when he keeps his distance (the quick way off is toward
  // the Heretic), in front of him when he is close (the quick way off is back, out of reach).
  const toward = Math.sign(b.x - ctx.px) || 1
  const off = Math.abs(ctx.px - b.x) < 26 ? toward * 4 : -toward * 4
  const x = Math.max(ctx.arenaL + 12, Math.min(ctx.arenaR - 12, ctx.px + off))
  for (let s = 0; s < RINGS; s++) {
    const i = RING0 + s * 3
    if (b.n[i]) continue
    b.n[i] = x
    b.n[i + 1] = b.t
    b.n[i + 2] = arm
    break
  }
  ctx.bolt({
    kind: 'pillar',
    x,
    y: ctx.groundY - 26,
    vx: 0,
    vy: 0,
    grav: 0,
    life: arm + PILLAR_LIVE,
    arm,
    hw: 7,
    hh: 26,
  })
  ctx.sound('warn')
}

/** Masonry: drop the stone whose shadow has waited long enough; forget the ones that landed. */
function stepSlots(b: Boss, ctx: BossCtx) {
  for (let s = 0; s < ROCKS; s++) {
    const i = ROCK0 + s * 3
    const x = b.n[i]
    if (!x) continue
    const t0 = b.n[i + 1]!
    if (b.t === t0) ctx.sound('warn')
    if (b.t === t0 + SHADOW_LEAD)
      ctx.bolt({
        kind: 'clod',
        x,
        y: STONE_TOP,
        vx: 0,
        vy: STONE_VY,
        grav: STONE_G,
        life: 200,
        arm: 0,
        hw: 6,
        hh: 7,
      })
    if (b.t > t0 + SHADOW_LEAD + 60) b.n[i] = 0
  }
  for (let s = 0; s < RINGS; s++) {
    const i = RING0 + s * 3
    if (b.n[i] && b.t > b.n[i + 1]! + b.n[i + 2]! + PILLAR_LIVE) b.n[i] = 0
  }
}

function update(b: Boss, ctx: BossCtx) {
  const p = ph(b)
  stepSlots(b, ctx)
  // Half health: the robe catches and the pattern quickens.
  if (b.phase === 1 && b.hp <= b.maxHp / 2) {
    b.phase = 2
    b.n[N_IGNITE] = b.t
    setMode(b, 'ignite', IGNITE)
    ctx.sound('boom')
    return
  }
  const prev = hereticRig(b)
  const mode = b.mode as HereticMode
  b.timer--
  switch (mode) {
    case 'stalk': {
      // He fights at the length of his chain: closes in from afar, shuffles back when crowded.
      b.face = Math.sign(ctx.px - b.x) || b.face || -1
      const gap = Math.abs(ctx.px - b.x)
      const pace = WALK[p]! * Math.min(1.3, ctx.speed)
      if (gap > 104) b.x += b.face * pace
      else if (gap < 84) b.x -= b.face * pace * 0.8
      if (b.timer <= 0) pickAttack(b, ctx)
      break
    }
    case 'swingTell':
      if (b.timer <= 0) {
        setMode(b, 'swing', SWING[p]!)
        ctx.sound('shoot')
      }
      break
    case 'swing':
      bellBolt(b, ctx, prev, 'side')
      if (b.timer <= 0) {
        setMode(b, 'spent', SPENT[p]!)
        if (p) {
          // Phase two: the blow shakes two stones loose from the vault, one over Zuzu.
          dropStone(b, ctx, ctx.px, 0)
          dropStone(
            b,
            ctx,
            ctx.arenaL + 20 + ctx.rng() * (ctx.arenaR - ctx.arenaL - 40),
            12,
          )
        }
      }
      break
    case 'slamTell':
      if (b.timer <= 0) setMode(b, 'slam', SLAM)
      break
    case 'slam':
      if (b.timer > SLAM_HIT) bellBolt(b, ctx, prev, 'drop')
      if (b.timer === SLAM_HIT) {
        const x = b.x + b.face * SLAM_AT.x
        ctx.sound('boom')
        // The crash itself, where the bell lands.
        reach(ctx, x, ctx.groundY - 10, 14, 10)
        if (p) {
          // The tower answers the blow: two stones shaken loose, one over Zuzu.
          dropStone(b, ctx, ctx.px, 2)
          dropStone(
            b,
            ctx,
            ctx.arenaL + 20 + ctx.rng() * (ctx.arenaR - ctx.arenaL - 40),
            14,
          )
        }
      }
      if (b.timer <= 0) {
        // A beat after the crash the shock spreads from the crater, both ways.
        shockwave(ctx, b.x + b.face * SLAM_AT.x)
        setMode(b, 'stuck', STUCK[p]!)
      }
      break
    case 'ritualTell':
      if (b.timer <= 0) {
        const count = RITUAL_COUNT[p]!
        const every = RITUAL_EVERY[p]!
        setMode(
          b,
          'ritual',
          (count - 1) * every + RITUAL_ARM[p]! + PILLAR_LIVE + 4,
        )
        b.n[N_LEFT] = count
        b.n[N_AUX] = 0
      }
      break
    case 'ritual':
      if (b.n[N_LEFT]! > 0 && --b.n[N_AUX]! <= 0) {
        openCircle(b, ctx)
        b.n[N_LEFT]!--
        b.n[N_AUX] = RITUAL_EVERY[p]!
      }
      if (b.timer <= 0) setMode(b, 'spent', SPENT[p]!)
      break
    case 'tollTell':
      if (b.timer <= 0) {
        const count = TOLL_COUNT[p]!
        setMode(b, 'toll', (count - 1) * TOLL_STAGGER + SHADOW_LEAD + 44)
        ctx.sound('boom')
        // One stone over Zuzu, the rest spread over the floor.
        const span = ctx.arenaR - ctx.arenaL - 40
        dropStone(b, ctx, ctx.px, 0)
        for (let k = 1; k < count; k++)
          dropStone(
            b,
            ctx,
            ctx.arenaL + 20 + ((k - 1 + ctx.rng()) / (count - 1)) * span,
            k * TOLL_STAGGER,
          )
      }
      break
    case 'toll':
      if (b.timer <= 0) setMode(b, 'spent', SPENT[p]!)
      break
    case 'stuck':
      // Phase two: wrenching the bell free cracks the floor again, a second pair of waves well
      // behind the first (one jump each).
      if (p && b.timer === STUCK[p]! - WRENCH) {
        ctx.sound('boom')
        shockwave(ctx, b.x + b.face * SLAM_AT.x)
      }
      if (b.timer <= 0) setMode(b, 'stalk', STALK[p]!)
      break
    case 'spent':
      if (b.timer <= 0) setMode(b, 'stalk', STALK[p]!)
      break
    case 'ignite':
      // Caught: he staggers in the flames before he comes on again.
      if (b.timer <= 0) setMode(b, 'spent', SPENT[p]!)
      break
    case 'leapTell':
      if (b.timer <= 0) {
        setMode(b, 'leap', LEAP)
        b.face = Math.sign(b.n[N_TO]! - b.n[N_FROM]!) || b.face
        ctx.sound('shoot')
      }
      break
    case 'leap': {
      const k = progress(b)
      b.x = lerp(b.n[N_FROM]!, b.n[N_TO]!, k)
      b.y = ctx.groundY - 4 * LEAP_HEIGHT * k * (1 - k)
      if (b.timer <= 0) {
        b.y = ctx.groundY
        b.face = Math.sign(ctx.px - b.x) || -b.face
        ctx.sound('boom')
        // He lands heavily and needs a moment: a window.
        setMode(b, 'spent', LAND)
      }
      break
    }
    default:
      setMode(b, 'stalk', STALK[p]!)
  }
  b.x = Math.max(lo(ctx), Math.min(hi(ctx), b.x))
}

export const HERETIC: BossDef = {
  name: 'THE BELL HERETIC',
  title: 'HE WHO RANG THE DEAD',
  hp: HP,
  hw: 16,
  height: 64,
  create: (b, ctx) => {
    b.n = new Array<number>(N_SIZE).fill(0)
    b.n[N_LAST] = -1
    b.face = Math.sign(ctx.px - b.x) || -1
    setMode(b, 'stalk', 80)
  },
  update,
  // The ward of sigils turns blows aside except when an attack leaves him spent or stuck; the robe
  // catching (a firestorm) is the other warded beat.
  immune: (b) => !OPEN.has(b.mode),
  // The body's core: the robe's ragged edges are only cloth.
  contact: (b) => (b.mode === 'leap' ? null : { hw: 10, height: 60 }),
  draw: (g, b, tick) => drawHeretic(g, b, tick),
}

// --- art ------------------------------------------------------------------------------------------

const ROBE = ['#1f040c', '#43081a', '#6e1024', '#9b2235', '#c8494f'] as const
const CHAR = ['#130307', '#2a0811', '#47101b', '#6b1a24', '#8f3434'] as const
const BONE = ['#4a3c2e', '#8e7c62', '#cbbd9f', '#e9e0c8', '#fffaf0'] as const
const HORN = ['#120d10', '#251d21', '#3c3236', '#5a4e50', '#857774'] as const
export const BRONZE = [
  '#2b1a0a',
  '#5a3712',
  '#8c6024',
  '#c39545',
  '#f2d58c',
] as const
const RUST = ['#24160f', '#43291b', '#6b432a', '#9a6a42'] as const
const CRIMSON = ['#4a0710', '#9b1020', '#e11d2e', '#ff5a5f', '#ffd0c8'] as const
const FIRE = ['#7c1d06', '#ea580c', '#fb923c', '#fde047', '#fffbe6'] as const
const STONE = ['#1b1622', '#2f2836', '#4a4150', '#6e6474', '#9a90a0'] as const

/** Flash-to-white for hits: every colour drawn passes through this. */
let whiten = 0
const c = (hex: string) => (whiten > 0 ? mix(hex, '#ffffff', whiten) : hex)
/** Lets another boss's art share the bell and chain painters with its own hit flash. */
export function setWhiten(k: number) {
  whiten = k
}

function poly(g: CanvasRenderingContext2D, pts: readonly number[]) {
  g.beginPath()
  g.moveTo(pts[0]!, pts[1]!)
  for (let i = 2; i < pts.length; i += 2) g.lineTo(pts[i]!, pts[i + 1]!)
  g.closePath()
}

function fillPoly(
  g: CanvasRenderingContext2D,
  pts: readonly number[],
  fill: string,
  outline: string | null = INK,
) {
  poly(g, pts)
  if (outline) {
    g.lineWidth = 2
    g.strokeStyle = outline
    g.lineJoin = 'round'
    g.stroke()
  }
  g.fillStyle = fill
  g.fill()
}

const hash = (n: number) => {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453
  return s - Math.floor(s)
}

/** A flame tongue standing at (x, y), h tall (additive). */
export function flame(
  g: CanvasRenderingContext2D,
  x: number,
  y: number,
  h: number,
  w: number,
  t: number,
  alpha = 1,
) {
  if (h <= 0.5) return
  const lick = Math.sin(t / 3 + x) * w * 0.35
  g.save()
  g.globalCompositeOperation = 'lighter'
  const layers: [string, number, number][] = [
    [FIRE[1], 1, 0.75],
    [FIRE[2], 0.72, 0.8],
    [FIRE[3], 0.45, 0.85],
  ]
  for (const [col, k, a] of layers) {
    g.globalAlpha = alpha * a
    g.fillStyle = col
    g.beginPath()
    g.moveTo(x - w * k, y)
    g.quadraticCurveTo(x - w * k, y - h * k * 0.55, x + lick * k, y - h * k)
    g.quadraticCurveTo(x + w * k, y - h * k * 0.55, x + w * k, y)
    g.closePath()
    g.fill()
  }
  g.restore()
}

/** The great bell, centred at (0, 0) in its own frame, mouth down. `charge` lights its runes. */
export function paintBell(
  g: CanvasRenderingContext2D,
  x: number,
  y: number,
  ang: number,
  s: number,
  charge: number,
  tick: number,
  options: { crack?: boolean; ramp?: readonly string[] } = {},
) {
  const R = options.ramp ?? BRONZE
  g.save()
  g.translate(x, y)
  g.rotate(ang)
  g.scale(s, s)
  // Crown loop.
  g.lineWidth = 3
  g.strokeStyle = INK
  g.beginPath()
  g.arc(0, -13, 3, Math.PI, 0)
  g.stroke()
  g.lineWidth = 1.4
  g.strokeStyle = c(R[2]!)
  g.stroke()
  if (charge > 0)
    glow(g, 0, 0, 16 + charge * 10, CRIMSON[2], 0.3 + 0.4 * charge)
  const body = () => {
    g.beginPath()
    g.moveTo(-6, -11)
    g.quadraticCurveTo(0, -14.5, 6, -11)
    g.bezierCurveTo(9, -6, 8, 2, 12, 7)
    g.lineTo(13.5, 10.5)
    g.lineTo(-13.5, 10.5)
    g.lineTo(-12, 7)
    g.bezierCurveTo(-8, 2, -9, -6, -6, -11)
    g.closePath()
  }
  body()
  g.lineWidth = 2
  g.strokeStyle = INK
  g.stroke()
  // Banded bronze, lit from the upper left.
  const grad = g.createLinearGradient(-13, 0, 13, 0)
  grad.addColorStop(0, c(R[1]!))
  grad.addColorStop(0.16, c(R[2]!))
  grad.addColorStop(0.16, c(R[3]!))
  grad.addColorStop(0.3, c(R[3]!))
  grad.addColorStop(0.3, c(R[4]!))
  grad.addColorStop(0.36, c(R[4]!))
  grad.addColorStop(0.36, c(R[2]!))
  grad.addColorStop(0.66, c(R[2]!))
  grad.addColorStop(0.66, c(R[1]!))
  grad.addColorStop(0.88, c(R[1]!))
  grad.addColorStop(0.88, c(R[0]!))
  grad.addColorStop(1, c(R[0]!))
  g.fillStyle = grad
  g.fill()
  // Mouldings: two bands at the shoulder, a heavy lip.
  g.fillStyle = c(R[0]!)
  g.fillRect(-7.5, -7, 15, 1)
  g.fillRect(-9.5, 3, 19, 1)
  g.fillStyle = c(R[3]!)
  g.fillRect(-7.5, -8, 6, 1)
  g.fillStyle = c(R[1]!)
  g.fillRect(-13, 7.5, 26, 3)
  g.fillStyle = c(R[3]!)
  g.fillRect(-12, 7.5, 9, 1)
  // The dark mouth and the clapper.
  g.fillStyle = INK
  g.beginPath()
  g.ellipse(0, 10.5, 12, 1.8, 0, 0, TAU)
  g.fill()
  g.fillStyle = c(R[1]!)
  g.beginPath()
  g.arc(Math.sin(tick / 5) * 1.5, 12.2, 2, 0, TAU)
  g.fill()
  // Verdigris streaks and pitting.
  g.fillStyle = rgba('#3f8f7a', 0.35)
  g.fillRect(4, -4, 1, 7)
  g.fillRect(-3, 4, 1, 3)
  g.fillStyle = rgba(INK, 0.4)
  g.fillRect(2, -2, 1, 1)
  g.fillRect(-5, 1, 1, 1)
  g.fillRect(7, 4, 1, 1)
  if (options.crack) {
    g.strokeStyle = INK
    g.lineWidth = 1.2
    g.beginPath()
    g.moveTo(3, -10)
    g.lineTo(1, -5)
    g.lineTo(4, -1)
    g.lineTo(2, 5)
    g.stroke()
  }
  if (charge > 0) {
    // Occult script burning in the waist.
    g.save()
    g.globalCompositeOperation = 'lighter'
    g.globalAlpha = Math.min(1, charge)
    // Occult marks: small eyes and diamonds, alternating.
    for (let i = -2; i <= 2; i++) {
      const gx = i * 4
      g.fillStyle = CRIMSON[3]
      if (i % 2) {
        poly(g, [gx, -2.5, gx + 1.5, -0.5, gx, 1.5, gx - 1.5, -0.5])
        g.fill()
      } else {
        g.beginPath()
        g.ellipse(gx, -0.5, 1.8, 1, 0, 0, TAU)
        g.fill()
        g.fillStyle = CRIMSON[4]
        g.fillRect(gx - 0.5, -1, 1, 1)
      }
    }
    g.restore()
  }
  g.restore()
}

/** Chain links from (x0, y0) to (x1, y1), sagging by `sag`. */
export function paintChain(
  g: CanvasRenderingContext2D,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  sag: number,
  hot = 0,
) {
  const len = Math.hypot(x1 - x0, y1 - y0)
  const n = Math.max(2, Math.round(len / 3.2))
  const mx = (x0 + x1) / 2
  const my = (y0 + y1) / 2 + sag
  const at = (u: number) => {
    const a = (1 - u) * (1 - u)
    const b2 = 2 * (1 - u) * u
    const d = u * u
    return [a * x0 + b2 * mx + d * x1, a * y0 + b2 * my + d * y1] as const
  }
  for (let i = 0; i < n; i++) {
    const [ax, ay] = at(i / n)
    const [bx, by] = at((i + 1) / n)
    const ang = Math.atan2(by - ay, bx - ax)
    g.save()
    g.translate((ax + bx) / 2, (ay + by) / 2)
    g.rotate(ang)
    g.strokeStyle = INK
    g.lineWidth = 2.6
    g.beginPath()
    if (i % 2) g.ellipse(0, 0, 2.4, 1.3, 0, 0, TAU)
    else g.ellipse(0, 0, 2.4, 0.5, 0, 0, TAU)
    g.stroke()
    g.strokeStyle = c(
      hot > 0 ? mix(RUST[3], CRIMSON[3], hot) : RUST[i % 2 ? 2 : 3],
    )
    g.lineWidth = 1.1
    g.stroke()
    g.restore()
  }
}

function paintHorn(
  g: CanvasRenderingContext2D,
  x: number,
  y: number,
  s: number,
  ramp: readonly string[],
) {
  // A ram's horn: rising off the brow, sweeping back over the hood, the tip hooking up and out.
  const P = [
    [0, 0],
    [-13 * s, -5 * s],
    [-17 * s, -25 * s],
    [-3 * s, -31 * s],
  ] as const
  const at = (u: number) => {
    const v = 1 - u
    const k = [v * v * v, 3 * v * v * u, 3 * v * u * u, u * u * u]
    return [
      x + k.reduce((a, w, i) => a + w * P[i]![0], 0),
      y + k.reduce((a, w, i) => a + w * P[i]![1], 0),
    ] as const
  }
  const steps = 18
  const top: number[] = []
  const under: number[] = []
  for (let i = 0; i <= steps; i++) {
    const u = i / steps
    const [px, py] = at(u)
    const [qx, qy] = at(Math.min(1, u + 0.01))
    const [rx, ry] = at(Math.max(0, u - 0.01))
    const nx = -(qy - ry)
    const ny = qx - rx
    const nl = Math.hypot(nx, ny) || 1
    const w = (4.2 * (1 - u) ** 1.2 + 0.5) * s
    top.push(px + (nx / nl) * w, py + (ny / nl) * w)
    under.push(px - (nx / nl) * w, py - (ny / nl) * w)
  }
  const outline = [...top]
  for (let i = under.length - 2; i >= 0; i -= 2)
    outline.push(under[i]!, under[i + 1]!)
  fillPoly(g, outline, c(ramp[2]!))
  // Shadowed underside.
  g.fillStyle = c(ramp[1]!)
  g.beginPath()
  for (let i = 0; i <= steps; i++) {
    const [px, py] = at(i / steps)
    const ux = under[i * 2]!
    const uy = under[i * 2 + 1]!
    const mx = (px + ux) / 2
    const my = (py + uy) / 2
    if (i === 0) g.moveTo(ux, uy)
    else g.lineTo(ux, uy)
    void mx
    void my
  }
  for (let i = steps; i >= 0; i--) {
    const [px, py] = at(i / steps)
    g.lineTo(px, py)
  }
  g.closePath()
  g.fill()
  // Growth ridges across it.
  g.strokeStyle = c(ramp[0]!)
  g.lineWidth = 0.9
  for (let i = 1; i < steps - 1; i++) {
    g.beginPath()
    g.moveTo(top[i * 2]!, top[i * 2 + 1]!)
    g.lineTo(under[i * 2]!, under[i * 2 + 1]!)
    g.stroke()
  }
  // A lit ridge along the top.
  g.strokeStyle = c(ramp[4]!)
  g.lineWidth = 1
  g.beginPath()
  for (let i = 1; i < steps - 2; i++) {
    const [px, py] = at(i / steps)
    const tx = (px + top[i * 2]!) / 2
    const ty = (py + top[i * 2 + 1]!) / 2
    if (i === 1) g.moveTo(tx, ty)
    else g.lineTo(tx, ty)
  }
  g.stroke()
}

function paintSkull(
  g: CanvasRenderingContext2D,
  x: number,
  y: number,
  jaw: number,
  eye: number,
  tick: number,
) {
  // A ram's skull in profile, long snout down and forward, set deep in the hood. (x, y): cranium.
  paintHorn(
    g,
    x + 3,
    y - 6,
    0.92,
    HORN.map((h) => mix(h, INK, 0.3)),
  )
  // Lower jaw, hinged under the eye (it drops when he roars).
  g.save()
  g.translate(x + 2, y + 4)
  g.rotate(jaw)
  fillPoly(g, [0, -1, 9, 3, 16, 6, 16, 8, 8, 7, 1, 3], c(BONE[1]))
  g.fillStyle = c(BONE[3])
  for (let i = 6; i < 16; i += 2.2) g.fillRect(i, 4.4 + (i - 6) * 0.2, 1, 1.5)
  g.restore()
  // Cranium and the long snout.
  const skull = [
    x - 7,
    y - 1,
    x - 5,
    y - 7,
    x + 1,
    y - 10,
    x + 7,
    y - 8,
    x + 13,
    y - 3,
    x + 21,
    y + 3,
    x + 23,
    y + 7,
    x + 20,
    y + 9,
    x + 12,
    y + 7,
    x + 4,
    y + 5,
    x - 3,
    y + 4,
  ]
  fillPoly(g, skull, c(BONE[2]))
  g.save()
  poly(g, skull)
  g.clip()
  g.fillStyle = c(BONE[3])
  poly(g, [
    x - 6,
    y - 4,
    x + 1,
    y - 9,
    x + 8,
    y - 7,
    x + 22,
    y + 4,
    x + 8,
    y - 1,
    x - 2,
    y,
  ])
  g.fill()
  g.fillStyle = c(BONE[4])
  poly(g, [x - 2, y - 8, x + 3, y - 9, x + 9, y - 6, x + 3, y - 6])
  g.fill()
  g.fillRect(x + 11, y - 2, 6, 1)
  g.fillStyle = c(BONE[1])
  poly(g, [
    x - 8,
    y,
    x + 2,
    y + 2,
    x + 12,
    y + 5,
    x + 22,
    y + 8,
    x + 22,
    y + 12,
    x - 8,
    y + 12,
  ])
  g.fill()
  // Sutures and a crack across the brow.
  g.strokeStyle = c(BONE[0])
  g.lineWidth = 0.7
  g.beginPath()
  g.moveTo(x - 3, y - 7)
  g.lineTo(x - 1, y - 4)
  g.lineTo(x - 3, y - 1)
  g.moveTo(x + 9, y - 5)
  g.lineTo(x + 11, y - 2)
  g.stroke()
  g.restore()
  // Teeth along the upper jaw.
  g.fillStyle = c(BONE[4])
  for (let i = 10; i < 21; i += 2.1)
    g.fillRect(x + i, y + 6 + (i - 10) * 0.15, 1, 2)
  // Nostril and the deep eye socket under a heavy brow.
  g.fillStyle = INK
  poly(g, [x + 18, y + 2, x + 22, y + 5, x + 19, y + 6])
  g.fill()
  g.beginPath()
  g.ellipse(x + 3, y - 2, 3.4, 2.8, 0.25, 0, TAU)
  g.fill()
  g.fillStyle = c(BONE[3])
  poly(g, [x - 1, y - 5, x + 3, y - 6, x + 8, y - 4, x + 3, y - 4.5])
  g.fill()
  // The ember in the socket.
  const pulse = 0.6 + 0.4 * Math.sin(tick / 5)
  glow(g, x + 3.5, y - 2, 5 + eye * 10, CRIMSON[2], 0.5 + eye * 0.4)
  g.fillStyle = CRIMSON[eye > 0.5 ? 4 : 3]
  g.fillRect(x + 3, y - 3, 2, 1.6 + pulse * 0.6)
  // The near horn, curling back over the hood.
  paintHorn(g, x, y - 5, 1.05, HORN)
}

/** A skeletal hand at (x, y): `grip` closed around a chain, else a splayed claw toward `aim`. */
function paintHand(
  g: CanvasRenderingContext2D,
  x: number,
  y: number,
  aim: number,
  grip: boolean,
) {
  g.save()
  g.translate(x, y)
  g.rotate(aim)
  g.lineCap = 'round'
  const bone = (pts: number[], w: number) => {
    g.beginPath()
    g.moveTo(pts[0]!, pts[1]!)
    for (let i = 2; i < pts.length; i += 2) g.lineTo(pts[i]!, pts[i + 1]!)
    g.strokeStyle = INK
    g.lineWidth = w + 2
    g.stroke()
    g.strokeStyle = c(BONE[3])
    g.lineWidth = w
    g.stroke()
  }
  // Palm.
  g.fillStyle = INK
  g.beginPath()
  g.ellipse(0, 0, 3.6, 2.8, 0, 0, TAU)
  g.fill()
  g.fillStyle = c(BONE[2])
  g.beginPath()
  g.ellipse(0, 0, 2.6, 1.9, 0, 0, TAU)
  g.fill()
  if (grip) {
    for (let i = 0; i < 3; i++)
      bone([1, -1.5 + i * 1.6, 4, -2 + i * 1.6, 3, 1 + i * 1.6], 1.1)
    bone([0, -2, 2, -4], 1.1)
  } else {
    for (let i = 0; i < 4; i++) {
      const a = -0.6 + i * 0.38
      bone(
        [
          1.5,
          0,
          1.5 + Math.cos(a) * 5,
          Math.sin(a) * 5,
          1.5 + Math.cos(a + 0.5) * 8.5,
          Math.sin(a + 0.5) * 8.5,
        ],
        1.1,
      )
    }
    bone([-1, -1.5, 1, -5, 4, -6.5], 1.1)
  }
  g.restore()
}

function paintArmBones(
  g: CanvasRenderingContext2D,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
) {
  g.lineCap = 'round'
  for (const [w, col] of [
    [4.5, INK],
    [2.6, c(BONE[2])],
  ] as const) {
    g.strokeStyle = col
    g.lineWidth = w
    g.beginPath()
    g.moveTo(x0, y0)
    g.lineTo(x1, y1)
    g.stroke()
  }
  g.strokeStyle = c(BONE[4])
  g.lineWidth = 0.8
  g.beginPath()
  g.moveTo(x0, y0 - 1)
  g.lineTo(x1, y1 - 1)
  g.stroke()
}

/** A hanging bell sleeve from the shoulder toward the fist, ragged where it droops. */
function paintSleeve(
  g: CanvasRenderingContext2D,
  sx: number,
  sy: number,
  hx: number,
  hy: number,
  cover: number,
  ramp: readonly string[],
  t: number,
) {
  const ex = sx + (hx - sx) * cover
  const ey = sy + (hy - sy) * cover
  const len = Math.hypot(ex - sx, ey - sy) || 1
  const dx = (ex - sx) / len
  const dy = (ey - sy) / len
  // The side of the arm gravity pulls the cloth to.
  let nx = -dy
  let ny = dx
  if (ny < 0) {
    nx = -nx
    ny = -ny
  }
  const flap = Math.sin(t / 9) * 1.2
  const drop = 7 + ny * 4
  const pts = [
    sx - nx * 6,
    sy - ny * 6,
    ex - nx * 4 + dx * 2,
    ey - ny * 4 + dy * 2,
    ex + nx * 4 + dx * 3,
    ey + ny * 4 + dy * 3,
  ]
  // The drooping cuff, torn into tongues.
  for (let i = 1; i <= 5; i++) {
    const u = i / 5
    const bx = ex + nx * 4 - (ex - sx) * 0.55 * u
    const by = ey + ny * 4 - (ey - sy) * 0.55 * u
    const hang = (i % 2 ? drop : drop * 0.55) * (1 - u * 0.5) + flap * (1 - u)
    pts.push(bx, by + hang)
  }
  pts.push(sx + nx * 8, sy + ny * 8)
  fillPoly(g, pts, c(ramp[2]!))
  g.save()
  poly(g, pts)
  g.clip()
  g.fillStyle = c(ramp[1]!)
  poly(g, [
    sx + nx * 2,
    sy + ny * 2,
    ex + nx * 1,
    ey + ny * 1,
    ex + nx * 20,
    ey + ny * 20 + 12,
    sx + nx * 20,
    sy + ny * 20 + 12,
  ])
  g.fill()
  g.fillStyle = c(ramp[3]!)
  poly(g, [
    sx - nx * 6,
    sy - ny * 6,
    ex - nx * 4,
    ey - ny * 4,
    ex - nx * 1.5,
    ey - ny * 1.5,
    sx - nx * 3,
    sy - ny * 3,
  ])
  g.fill()
  g.restore()
  // The cuff's dark mouth.
  g.fillStyle = INK
  g.beginPath()
  g.ellipse(ex + dx * 2.5, ey + dy * 2.5, 2, 4.2, Math.atan2(dy, dx), 0, TAU)
  g.fill()
}

/** Robe silhouette path, local frame (feet at 0, facing +x). */
function robePath(g: CanvasRenderingContext2D, t: number) {
  const sw = Math.sin(t / 22)
  g.beginPath()
  g.moveTo(25, -3)
  g.quadraticCurveTo(23, -26, 15, -40)
  g.quadraticCurveTo(12, -46, 17, -50)
  g.lineTo(23, -55)
  g.quadraticCurveTo(22, -68, 10, -73)
  g.quadraticCurveTo(0, -77, -10, -80)
  g.quadraticCurveTo(-25, -77, -31, -56)
  g.quadraticCurveTo(-38, -28, -44 + sw * 1.5, -3)
  g.closePath()
}

/** The ragged hem: tongues of cloth to the ground with gaps between, swaying. */
function paintHem(
  g: CanvasRenderingContext2D,
  ramp: readonly string[],
  t: number,
) {
  const sw = Math.sin(t / 22)
  for (let i = 0; i < 14; i++) {
    const x0 = -44 + i * 5 + sw * (1 - i / 14) * 1.5
    const w = 3.2 + hash(i) * 2.6
    const long = hash(i + 40) > 0.3
    const tip = long ? 0 : -3 - hash(i + 7) * 3
    const lean = Math.sin(t / 17 + i) * 0.8 - (1 - i / 14) * 1.5
    fillPoly(
      g,
      [
        x0,
        -6,
        x0 + w,
        -6,
        x0 + w * 0.7 + lean,
        tip,
        x0 + w * 0.25 + lean,
        tip + 1,
      ],
      c(ramp[i % 3 ? 1 : 2]!),
    )
  }
}

function paintRobe(
  g: CanvasRenderingContext2D,
  ramp: readonly string[],
  t: number,
) {
  paintHem(g, ramp, t)
  robePath(g, t)
  g.lineWidth = 2
  g.strokeStyle = INK
  g.lineJoin = 'round'
  g.stroke()
  g.fillStyle = c(ramp[2]!)
  g.fill()
  g.save()
  robePath(g, t)
  g.clip()
  // Light from the front and above: the back half falls into shadow in hard 16-bit steps.
  g.fillStyle = c(ramp[1]!)
  poly(
    g,
    [
      -50, 4, -50, -90, -14, -90, -14, -74, -8, -66, -12, -50, -8, -38, -12,
      -24, -6, -12, -10, 4,
    ],
  )
  g.fill()
  g.fillStyle = c(ramp[0]!)
  poly(g, [-50, 4, -50, -64, -30, -56, -24, -40, -28, -24, -22, -10, -26, 4])
  g.fill()
  // Under the hood's chin and down the front: deep shade.
  g.fillStyle = c(ramp[1]!)
  poly(g, [10, -50, 18, -48, 22, -30, 26, 4, 18, 4, 14, -26, 8, -40])
  g.fill()
  // Lit planes: the hood crown, the shoulder, a stripe down the chest.
  g.fillStyle = c(ramp[3]!)
  poly(g, [-14, -79, -4, -79, 10, -73, 20, -63, 8, -69, -6, -75])
  g.fill()
  poly(g, [-8, -66, 2, -64, 6, -56, -2, -58])
  g.fill()
  poly(g, [2, -46, 8, -44, 12, -24, 16, 4, 10, 4, 6, -22])
  g.fill()
  g.fillStyle = c(ramp[4]!)
  g.fillRect(-10, -80, 9, 1)
  g.fillRect(4, -40, 1, 14)
  g.fillRect(13, -14, 1, 9)
  // Long folds from the hunch to the hem, each with a lit edge.
  for (const i of [0, 2, 3]) {
    const x0 = -24 + i * 9 + (i === 3 ? 4 : 0)
    const sway = Math.sin(t / 25 + i) * 1.2
    g.strokeStyle = c(ramp[0]!)
    g.lineWidth = 1.6
    g.beginPath()
    g.moveTo(x0 + 2, -60 + i * 4)
    g.quadraticCurveTo(x0 - 5 + sway, -30, x0 - 3 + i * 1.4, 2)
    g.stroke()
    g.strokeStyle = c(ramp[3]!)
    g.lineWidth = 0.8
    g.beginPath()
    g.moveTo(x0 + 3.5, -56 + i * 4)
    g.quadraticCurveTo(x0 - 3 + sway, -30, x0 - 1 + i * 1.4, 0)
    g.stroke()
  }
  // Rents where the cloth has rotted through, and burn-holes.
  g.fillStyle = INK
  const rents = [
    [-24, -30, 3, 6],
    [-12, -16, 2, 5],
    [-32, -12, 2.5, 7],
    [6, -12, 2, 4],
    [-18, -48, 2, 3],
    [-2, -6, 2, 5],
  ] as const
  for (const [rx, ry, w, h] of rents)
    poly(g, [
      rx,
      ry - h,
      rx + w,
      ry - h * 0.2,
      rx + w * 0.4,
      ry + h,
      rx - w * 0.6,
      ry,
    ])
  g.fill()
  g.restore()
  // The hood's dark mouth, where the skull sits.
  g.fillStyle = INK
  g.beginPath()
  g.moveTo(23, -55)
  g.quadraticCurveTo(21, -67, 10, -70)
  g.quadraticCurveTo(0, -71, -1, -61)
  g.quadraticCurveTo(0, -50, 15, -47)
  g.closePath()
  g.fill()
  // Hood rim lit along its edge.
  g.strokeStyle = c(ramp[3]!)
  g.lineWidth = 1
  g.beginPath()
  g.moveTo(23, -55)
  g.quadraticCurveTo(21, -67, 10, -70)
  g.stroke()
}

function paintWard(
  g: CanvasRenderingContext2D,
  t: number,
  front: boolean,
  power: number,
) {
  const n = 6
  const cy = -38
  const rx = 38
  const ry = 9
  // The orbit itself, a faint thread of light (the half on this side of him).
  g.save()
  g.globalCompositeOperation = 'lighter'
  g.globalAlpha = 0.35 * power
  g.strokeStyle = CRIMSON[2]
  g.lineWidth = 1
  g.beginPath()
  g.ellipse(-4, cy, rx, ry, 0, front ? 0 : Math.PI, front ? Math.PI : TAU)
  g.stroke()
  g.restore()
  for (let i = 0; i < n; i++) {
    const a = t / 36 + (i * TAU) / n
    const depth = Math.sin(a)
    if (front !== depth >= 0) continue
    const x = -4 + Math.cos(a) * rx
    const y = cy + depth * ry + Math.sin(t / 15 + i) * 1.5
    const alpha = (front ? 1 : 0.5) * power
    glow(g, x, y, 8, CRIMSON[2], 0.5 * alpha)
    g.save()
    g.globalAlpha = Math.min(1, alpha)
    g.translate(x, y)
    // A rune in a ring: stave and hooked branches, each one a little different.
    g.strokeStyle = CRIMSON[3]
    g.lineWidth = 1
    g.beginPath()
    g.arc(0, 0, 3.8, 0, TAU)
    g.stroke()
    g.strokeStyle = CRIMSON[4]
    g.beginPath()
    g.moveTo(0, -3.5)
    g.lineTo(0, 3.5)
    if (i % 3 === 0) {
      g.moveTo(-2.5, -1.5)
      g.lineTo(0, 0.5)
      g.lineTo(2.5, -1.5)
    } else if (i % 3 === 1) {
      g.moveTo(0, -3)
      g.lineTo(2.5, -1)
      g.moveTo(0, 1)
      g.lineTo(-2.5, 3)
    } else {
      g.moveTo(-2.5, -2)
      g.lineTo(2.5, 2)
      g.moveTo(-2.5, 2)
      g.lineTo(2.5, -2)
    }
    g.stroke()
    g.restore()
  }
}

function paintFloorFx(g: CanvasRenderingContext2D, b: Boss, tick: number) {
  const ground = FLOOR
  // Ritual circles opening under Zuzu.
  for (let s = 0; s < RINGS; s++) {
    const i = RING0 + s * 3
    const x = b.n[i]
    if (!x) continue
    const age = b.t - b.n[i + 1]!
    const arm = b.n[i + 2]!
    const u = clamp01(age / arm)
    const live = age >= arm
    const fade = live ? 1 - clamp01((age - arm) / PILLAR_LIVE) : 1
    const a = (0.35 + 0.65 * u) * fade
    g.save()
    g.globalCompositeOperation = 'lighter'
    g.globalAlpha = a
    g.strokeStyle = CRIMSON[live ? 4 : 2]
    g.lineWidth = 1.2
    g.beginPath()
    g.ellipse(x, ground - 1, 6 + 10 * Math.min(1, u * 2), 4, 0, 0, TAU)
    g.stroke()
    g.beginPath()
    g.ellipse(x, ground - 1, 4 + 6 * Math.min(1, u * 2), 2.4, 0, 0, TAU)
    g.stroke()
    // A flattened star turning inside it.
    g.beginPath()
    for (let k = 0; k <= 5; k++) {
      const p = tick / 30 + (k * 2 * TAU) / 5
      const px = x + Math.cos(p) * 14 * Math.min(1, u * 2)
      const py = ground - 1 + Math.sin(p) * 3.4
      if (k === 0) g.moveTo(px, py)
      else g.lineTo(px, py)
    }
    g.stroke()
    // Sparks climbing as it readies.
    g.fillStyle = CRIMSON[3]
    for (let k = 0; k < 5; k++) {
      const q = (age * 0.9 + k * 7) % 22
      g.fillRect(
        x - 10 + hash(k + s * 9) * 20,
        ground - 2 - q * (0.6 + u),
        1,
        2,
      )
    }
    g.restore()
    glow(g, x, ground - 2, 10 + 10 * u, CRIMSON[2], 0.3 * a)
  }
  // Masonry: a shadow and trickling grit, then the stone itself.
  for (let s = 0; s < ROCKS; s++) {
    const i = ROCK0 + s * 3
    const x = b.n[i]
    if (!x) continue
    const age = b.t - b.n[i + 1]!
    if (age < 0) continue
    const k = age - SHADOW_LEAD
    const y =
      k < 0 ? -99 : STONE_TOP + STONE_VY * k + (STONE_G * k * (k + 1)) / 2
    if (y >= ground) continue
    const near =
      k < 0
        ? clamp01(age / SHADOW_LEAD) * 0.5
        : 0.5 + 0.5 * clamp01((y - STONE_TOP) / (ground - STONE_TOP))
    g.save()
    g.globalAlpha = 0.25 + 0.45 * near
    g.fillStyle = INK
    g.beginPath()
    g.ellipse(x, ground - 1, 4 + 6 * near, 1.5 + 1.5 * near, 0, 0, TAU)
    g.fill()
    g.restore()
    if (k < 0) {
      // Grit pouring from the dark above: the stone is coming.
      g.fillStyle = rgba(STONE[4], 0.8)
      for (let q = 0; q < 6; q++) {
        const fy = 34 + ((age * 3 + q * 29) % (ground - 40))
        g.fillRect(x - 3 + hash(q + s) * 6, fy, 1, 2)
      }
    } else {
      g.save()
      g.translate(x, y)
      g.rotate((k / 12) * (s % 2 ? 1 : -1))
      g.fillStyle = rgba(STONE[4], 0.35)
      g.fillRect(-4, -14, 8, 6)
      fillPoly(g, [-8, -6, 7, -7, 8, 6, -7, 7], c(STONE[2]))
      g.fillStyle = c(STONE[3])
      g.fillRect(-7, -6, 13, 2)
      g.fillStyle = c(STONE[1])
      g.fillRect(-6, 4, 13, 2)
      g.fillStyle = c(STONE[4])
      g.fillRect(-7, -6, 4, 1)
      g.fillStyle = INK
      g.fillRect(-1, -2, 5, 1)
      g.restore()
    }
  }
}

function drawHeretic(g: CanvasRenderingContext2D, b: Boss, tick: number) {
  const f = b.face || -1
  const t = b.t
  const dying = b.dying > 0
  const dp = dying ? 1 - b.dying / 70 : 0
  whiten = b.flash > 0 ? 0.8 : dying && Math.floor(b.dying / 4) % 2 ? 0.35 : 0
  const open = OPEN.has(b.mode) && !dying
  const burning = b.phase === 2
  const u = progress(b)
  const igniting = b.mode === 'ignite' && !dying
  const rig = hereticRig(b)
  const mode = dying ? 'dead' : b.mode
  const crouch = mode === 'leapTell' ? ease(Math.min(1, u * 1.6)) : 0
  const slump = dying ? dp : open ? 1 : mode === 'ritual' ? 0.4 : crouch * 1.6
  const rear =
    igniting || mode === 'tollTell' || mode === 'toll'
      ? 1
      : mode === 'slamTell'
        ? u
        : 0
  const ramp = burning ? CHAR : ROBE
  if (!dying) paintFloorFx(g, b, tick)

  g.save()
  const jitter =
    dying || igniting
      ? (hash(t) - 0.5) * 2.4
      : mode === 'stuck'
        ? Math.sin(t / 3.5) * 0.6
        : 0
  g.translate(Math.round(b.x + jitter), b.y)
  g.scale(f, 1)
  const fade = dying ? Math.min(1, b.dying / 26) : 1
  g.globalAlpha = fade
  // Ground shadow (on the floor, even mid-leap), and the crimson pool his ward casts.
  const air = FLOOR - b.y
  g.save()
  g.globalAlpha = 0.45 * fade * Math.max(0.3, 1 - air / 90)
  g.fillStyle = INK
  g.beginPath()
  g.ellipse(-4, air, 36 - Math.min(16, air / 4), 4, 0, 0, TAU)
  g.fill()
  g.restore()
  if (mode === 'leapTell' || mode === 'leap') {
    // Dust kicked up by the crouch and the take-off.
    for (let k = 0; k < 8; k++) {
      const p = ((t * 1.5 + k * 7) % 24) / 24
      g.fillStyle = rgba(STONE[4], (1 - p) * 0.5)
      g.beginPath()
      g.arc(
        -30 + k * 8 + (k % 2 ? p : -p) * 10,
        air - p * 10,
        1.5 + p * 4,
        0,
        TAU,
      )
      g.fill()
    }
  }
  if (!open && !dying) {
    glow(g, -4, -2, 40, CRIMSON[1], 0.22 + 0.06 * Math.sin(t / 9))
    paintWard(g, t, false, igniting ? 1.4 : 1)
  }

  // The body: slumped forward when spent, reared up to roar, sinking as he dies.
  const squash = 1 + rear * 0.08 - slump * 0.07
  const skew = -0.06 * slump + 0.03 * rear
  const breathe = 1 + Math.sin(t / 20) * 0.012
  const body = (x: number, y: number) =>
    [x + skew * y * squash * breathe, y * squash * breathe] as const
  g.save()
  if (dying) {
    g.translate(0, dp * dp * 18)
    g.rotate(dp * 0.12)
  }
  g.transform(1, 0, skew, 1, 0, 0)
  g.scale(1, squash * breathe)
  paintRobe(g, ramp, t)

  // The open window: the robe rent over his ribs and the coal of a heart.
  if (open) {
    const beat = 0.5 + 0.5 * Math.sin(t / 5)
    const gape = Math.min(1, (b.n[N_LEN]! - b.timer) / 10)
    // The robe falls open over a cage of ribs.
    fillPoly(
      g,
      [
        6,
        -46,
        12 + 3 * gape,
        -40,
        13 + 3 * gape,
        -28,
        8,
        -18,
        2 - 3 * gape,
        -28,
        1 - 2 * gape,
        -40,
      ],
      INK,
      null,
    )
    glow(g, 7, -32, 16 + beat * 8, CRIMSON[2], 0.7 + 0.3 * beat)
    g.fillStyle = CRIMSON[2]
    g.beginPath()
    g.ellipse(7, -32, 3.6 + beat * 0.6, 4.4 + beat * 0.6, 0.25, 0, TAU)
    g.fill()
    g.fillStyle = CRIMSON[4]
    g.fillRect(5.5, -35, 2, 2)
    g.strokeStyle = c(BONE[3])
    g.lineWidth = 1.2
    for (let i = 0; i < 4; i++) {
      g.beginPath()
      g.moveTo(1, -42 + i * 5.5)
      g.quadraticCurveTo(8, -45 + i * 5.5, 14, -40 + i * 5.5)
      g.stroke()
    }
    g.fillStyle = c(BONE[2])
    g.fillRect(0.5, -43, 1.5, 22)
    // Breath steaming out of the skull.
    for (let i = 0; i < 3; i++) {
      const p = ((t + i * 10) % 30) / 30
      g.fillStyle = rgba('#e8e2f0', (1 - p) * 0.45)
      g.beginPath()
      g.arc(34 + p * 8, -52 - p * 6, 1 + p * 2.5, 0, TAU)
      g.fill()
    }
  }

  // The free claw, reaching out in front of him.
  const claw = (() => {
    if (mode === 'ritualTell' || mode === 'ritual') {
      const lift = mode === 'ritualTell' ? ease(Math.min(1, u * 1.5)) : 1
      return [lerp(0, 10, lift), lerp(-34, -88, lift), -1.4]
    }
    if (igniting) return [6, -98, -1.9]
    if (mode === 'slamTell' || mode === 'slam')
      return [rig.hx - 6, rig.hy + 2, -1]
    if (open) return [20, -14 + Math.sin(t / 8), 1.1]
    return [22, -30 + Math.sin(t / 20) * 1.5, 0.15]
  })()
  paintSleeve(g, -4, -54, claw[0]!, claw[1]!, 0.55, ramp, t)
  paintArmBones(
    g,
    -4 + (claw[0]! + 4) * 0.55,
    -54 + (claw[1]! + 54) * 0.55,
    claw[0]!,
    claw[1]!,
  )
  paintHand(
    g,
    claw[0]!,
    claw[1]!,
    claw[2]!,
    mode === 'slamTell' || mode === 'slam',
  )

  // Skull and horns.
  const headX = 9 + slump * 3
  const headY = -61 + slump * 2
  const roar = igniting
    ? 0.5
    : mode === 'tollTell' || mode === 'slamTell'
      ? 0.25 * u
      : open
        ? 0.15
        : 0.05
  const eye =
    mode.endsWith('Tell') || igniting ? 0.6 + 0.4 * u : open ? 0.2 : 0.4
  paintSkull(g, headX, headY, roar, eye, tick)
  g.restore()

  // Near arm, from the (transformed) shoulder to the chain fist.
  const [shx, shy] = body(6, -54)
  g.save()
  if (dying) g.translate(0, dp * dp * 18)
  paintSleeve(g, shx, shy, rig.hx, rig.hy, 0.6, ramp, t + 7)
  paintArmBones(
    g,
    shx + (rig.hx - shx) * 0.6,
    shy + (rig.hy - shy) * 0.6,
    rig.hx,
    rig.hy,
  )
  g.restore()

  // The chain and the bell.
  const charge =
    mode === 'swingTell' || mode === 'slamTell' || mode === 'tollTell'
      ? u
      : mode === 'swing' || mode === 'slam' || mode === 'toll'
        ? 1
        : burning
          ? 0.3
          : 0
  if (mode === 'swingTell' && u > 0.35) {
    // The path the bell will take, traced in crimson.
    g.save()
    g.globalCompositeOperation = 'lighter'
    g.globalAlpha = (u - 0.35) * 1.3 * (0.6 + 0.4 * Math.sin(tick / 2))
    g.strokeStyle = CRIMSON[2]
    g.lineWidth = 2
    g.setLineDash([3, 4])
    g.beginPath()
    for (let a = SWING_FROM; a <= SWING_TO; a += 0.08) {
      const px = PIVOT.x + Math.sin(a) * CHAIN
      const py = PIVOT.y + Math.cos(a) * CHAIN
      if (a === SWING_FROM) g.moveTo(px, py)
      else g.lineTo(px, py)
    }
    g.stroke()
    g.setLineDash([])
    g.restore()
  }
  if (mode === 'swing') {
    // Motion ghosts behind the swinging bell.
    for (let k = 4; k >= 1; k--) {
      const a = swingAngle(u - k * 0.045)
      const gx = PIVOT.x + Math.sin(a) * CHAIN
      const gy = PIVOT.y + Math.cos(a) * CHAIN
      g.save()
      g.globalAlpha = 0.16 * (5 - k)
      paintBell(g, gx, gy, -a, 1.05, 0, tick, {
        ramp: BRONZE.map((h) => mix(h, CRIMSON[1], 0.6)),
      })
      g.restore()
    }
  }
  if (mode === 'slamTell') {
    // Where it will land: the flagstones already cracking crimson.
    const a = clamp01((u - 0.2) * 1.4)
    g.save()
    g.globalCompositeOperation = 'lighter'
    g.globalAlpha = a
    g.strokeStyle = CRIMSON[3]
    g.lineWidth = 1
    for (let k = 0; k < 6; k++) {
      const ang = (k / 6) * Math.PI + 0.2
      g.beginPath()
      g.moveTo(SLAM_AT.x, -1)
      g.lineTo(SLAM_AT.x + Math.cos(ang) * 18 * a, -1 - Math.sin(ang) * 3)
      g.stroke()
    }
    g.restore()
    glow(g, SLAM_AT.x, -2, 12 + 10 * a, CRIMSON[2], 0.5 * a)
  }
  if (mode === 'slam' && b.timer <= SLAM_HIT) {
    // The crash: a crimson flare and splintered flagstones.
    const p = 1 - b.timer / SLAM_HIT
    glow(g, SLAM_AT.x, -6, 30 * (1 - p * 0.5), CRIMSON[2], 0.8 * (1 - p))
    g.fillStyle = c(STONE[3])
    for (let k = 0; k < 6; k++) {
      const a = Math.PI + (k / 5) * Math.PI
      const r = 6 + p * 18
      g.fillRect(SLAM_AT.x + Math.cos(a) * r, -2 + Math.sin(a) * r * 0.6, 2, 2)
    }
  }
  if (mode === 'stuck') {
    // The bell bitten into the floor, cracks radiating.
    g.strokeStyle = INK
    g.lineWidth = 1
    for (let k = 0; k < 4; k++) {
      g.beginPath()
      g.moveTo(SLAM_AT.x - 12 + k * 8, 0)
      g.lineTo(SLAM_AT.x - 16 + k * 11, 3)
      g.stroke()
    }
  }
  paintChain(
    g,
    rig.hx,
    rig.hy,
    rig.bx + Math.sin(rig.ang) * 13,
    rig.by - Math.cos(rig.ang) * 13,
    rig.sag,
    charge * 0.8,
  )
  paintBell(g, rig.bx, rig.by, rig.ang, 1.05, charge, tick, {
    crack: dying,
  })
  if (mode === 'tollTell' || mode === 'toll') {
    // The toll rolling out: rings of sound off the bell.
    g.save()
    g.globalCompositeOperation = 'lighter'
    g.strokeStyle = CRIMSON[3]
    for (let k = 0; k < 3; k++) {
      const p = ((t + k * 9) % 27) / 27
      g.globalAlpha = (1 - p) * (mode === 'toll' ? 0.9 : u * 0.8)
      g.lineWidth = 1.5
      g.beginPath()
      g.arc(rig.bx, rig.by, 14 + p * 34, -Math.PI * 0.95, -Math.PI * 0.05)
      g.stroke()
    }
    g.restore()
  }
  // The fist over the chain.
  paintHand(g, rig.hx, rig.hy, 1.2, true)

  if (mode === 'ritualTell' || mode === 'ritual') {
    // A sigil spinning in the raised claw.
    const lift = mode === 'ritualTell' ? ease(Math.min(1, u * 1.5)) : 1
    const sx = lerp(0, 10, lift)
    const sy = lerp(-34, -88, lift) - 10
    g.save()
    g.globalCompositeOperation = 'lighter'
    g.globalAlpha = lift
    g.strokeStyle = CRIMSON[3]
    g.lineWidth = 1.2
    g.beginPath()
    g.arc(sx, sy, 8, 0, TAU)
    g.stroke()
    g.beginPath()
    for (let k = 0; k <= 5; k++) {
      const p = tick / 14 + (k * 2 * TAU) / 5
      const px = sx + Math.cos(p) * 8
      const py = sy + Math.sin(p) * 8
      if (k === 0) g.moveTo(px, py)
      else g.lineTo(px, py)
    }
    g.stroke()
    g.restore()
    glow(g, sx, sy, 18, CRIMSON[2], 0.5 * lift)
  }

  // Phase two: the robe burns.
  if (burning || igniting) {
    const grow = igniting ? ease(u * 1.6) : 1
    // Burning from the hem up the back of the robe.
    const blaze = igniting ? 1 + 2.2 * Math.sin(Math.PI * clamp01(u * 1.2)) : 1
    for (let k = 0; k < 12; k++) {
      const fx = 24 - k * 5.8
      const h =
        (8 + hash(k) * 10 + Math.sin(t / 4 + k * 1.7) * 3) * grow * blaze
      flame(g, fx, -1, h, 3.6, t + k * 5)
    }
    // A sheet of fire licking up the hump and down the back, tongues overlapping, leaning back.
    const back = [
      [-6, -80],
      [-14, -79],
      [-21, -74],
      [-26, -66],
      [-29, -57],
      [-31, -48],
      [-33, -39],
      [-36, -29],
      [-39, -19],
    ] as const
    glow(g, -24, -56, 30 * grow, FIRE[1], 0.3 * grow * blaze)
    back.forEach(([fx, fy], k) => {
      const h = 9 + hash(k + 20) * 9 + Math.sin(t / 3 + k * 1.3) * 3
      g.save()
      g.translate(fx + 2, fy + 3)
      g.rotate(-0.35)
      flame(g, 0, 0, h * grow * blaze, 4.2, t + k * 11, 0.9)
      flame(g, -3, 1, h * 0.6 * grow * blaze, 3, t + k * 7 + 5, 0.8)
      g.restore()
    })
    // Embers riding the heat.
    g.save()
    g.globalCompositeOperation = 'lighter'
    for (let k = 0; k < 10; k++) {
      const p = ((t * 0.8 + k * 13) % 60) / 60
      g.fillStyle = k % 2 ? FIRE[3] : FIRE[2]
      g.globalAlpha = (1 - p) * grow
      g.fillRect(
        -30 + hash(k) * 56 + Math.sin(t / 10 + k) * 3,
        -4 - p * 90,
        1,
        1 + (k % 2),
      )
    }
    g.restore()
    glow(g, -4, -20, 46, FIRE[1], 0.22 * grow)
  }
  if (igniting) {
    // The firestorm as the robe catches: a pillar of flame and a roar.
    glow(g, -4, -40, 80 * (1 - u * 0.4), FIRE[2], 0.55 * (1 - u * 0.5))
    if (u < 0.3)
      glow(g, -4, -40, 120 * (u / 0.3), '#ffffff', 0.5 * (1 - u / 0.3))
    // Shock rings of the roar.
    g.save()
    g.globalCompositeOperation = 'lighter'
    g.strokeStyle = FIRE[3]
    for (let k = 0; k < 2; k++) {
      const p = (u * 2 + k * 0.5) % 1
      g.globalAlpha = (1 - p) * 0.7
      g.lineWidth = 2
      g.beginPath()
      g.ellipse(22, -56, 8 + p * 50, 6 + p * 34, 0, -1.3, 1.3)
      g.stroke()
    }
    g.restore()
  }
  if (!open && !dying) paintWard(g, t, true, igniting ? 1.4 : 1)

  if (dying) {
    // Crimson light breaking out of him as he comes apart.
    g.save()
    g.globalCompositeOperation = 'lighter'
    for (let k = 0; k < 7; k++) {
      const ang = -Math.PI / 2 + (k - 3) * 0.42 + Math.sin(t / 9 + k) * 0.05
      const len = 30 + dp * 70
      g.globalAlpha = 0.5 * (1 - dp * 0.6)
      g.fillStyle = k % 2 ? CRIMSON[3] : FIRE[3]
      g.beginPath()
      g.moveTo(4, -38)
      g.lineTo(4 + Math.cos(ang - 0.05) * len, -38 + Math.sin(ang - 0.05) * len)
      g.lineTo(4 + Math.cos(ang + 0.05) * len, -38 + Math.sin(ang + 0.05) * len)
      g.closePath()
      g.fill()
    }
    g.restore()
    glow(g, 4, -38, 30 + dp * 30, CRIMSON[3], 0.7)
  }
  g.restore()
  whiten = 0
}
