// /utils/arcade/ghostTrail/bosses/abbess.ts
//
// The Abbess (conductor kr-arcade t-020, CAMPAIGN-BLUEPRINT.md stage 6): the final boss, at the end
// of the Abbey Beneath the Bell. Two real phases, each with its own health bar.
//
// Phase one, the veiled Abbess: tall, black-habited, a crozier hung with a little bell, her face
// hidden behind a white veil. She glides between three points of the crypt and sometimes vanishes
// (a shimmering column marks where she will reappear). She casts:
//   - orbs: ghost-lights gather in her raised hand, then sink to a lane along the floor and drift
//     after Zuzu; close in, each commits to its line and gutters out. Jump them.
//   - summon: she rings her hand bell and a circle opens at her side: a sister steps out, the next
//     time a shade (two a phase, never with Zuzu at arm's length). A guard to shoot through.
//   - fire: a line of runes glows along the floor from Zuzu's heels away from her, then erupts into
//     a wall of ritual fire, embers flung off its far end. The way out is a step toward her.
// While she drifts and casts she is half in this world (drawn translucent and shimmering, a cold
// rim of light: blows pass through her). After each casting she kneels to pray, solid, a crimson
// heart-light showing: that is the window. She hurts by her spells and summons, never by touch.
//
// At the end of her first bar she refuses to die (BossDef.onDefeat). In a transformation of under
// three seconds (warded: a column of crimson light, her bar refilling) the cracked bell of the abbey
// comes down over her and she rises as a winged bell-spectre with a full second bar. Faster now:
//   - sweep: she climbs to her side of the crypt, the bell-weight on her chain scraping sparks off
//     the floor, then flies across dragging it. Jump it as it passes.
//   - toll: she swells and rings; the bell slams down twice and shockwaves roll out both ways. Jump
//     them. (Not at arm's length, where the first wave would rise under Zuzu.)
//   - dive: she soars, shrieks, and a crimson mark hunts Zuzu, then locks; she swoops over it and
//     plunges straight down, crashing into the floor, stunned.
// After each attack she reels or lies stunned on the floor, solid: the window.
//
// Deterministic: all chance from ctx.rng. Homing orbs and the dragged bell are simulated here and
// painted, their hitboxes laid down as one-tick bolts (heretic.ts `reach`), so the game's own bolt
// collision decides hits. Two things exist only for the demo pilot and change nothing for a player:
// those hitboxes present as "hop this" only when a hop would clear them (`cue`), and a harmless,
// invisible bolt far above the screen marks the locked dive spot (`markCue`).

import type { Boss, BossCtx, BossDef } from '../bosses'
import { INK, glow, mix, rgba } from '../../snes'
import {
  BRONZE,
  REACH_FROM,
  flame,
  paintBell,
  paintChain,
  reach,
  setWhiten,
} from './heretic'

const TAU = Math.PI * 2

/** Every move the Abbess makes, both phases. */
export const ABBESS_MODES = [
  'glide',
  'vanish',
  'appear',
  'orbsTell',
  'orbs',
  'summonTell',
  'summon',
  'fireTell',
  'fire',
  'pray',
  'transform',
  'hover',
  'sweepTell',
  'sweep',
  'tollTell',
  'toll',
  'diveTell',
  'dive',
  'reel',
  'stagger',
] as const
export type AbbessMode = (typeof ABBESS_MODES)[number]

/** Each attack and the tell that must come first. */
export const ABBESS_TELLS: Record<string, AbbessMode> = {
  appear: 'vanish',
  orbs: 'orbsTell',
  summon: 'summonTell',
  fire: 'fireTell',
  sweep: 'sweepTell',
  toll: 'tollTell',
  dive: 'diveTell',
}

/** Solid (and hittable) only while she prays, reels or lies stunned. */
const OPEN = new Set<string>(['pray', 'reel', 'stagger'])

// --- scratch layout (b.n) ---------------------------------------------------------------------
const N_LAST = 0 // last attack (index into this phase's list)
const N_LEN = 1 // current mode's full length
const N_AUX = 2 // per-mode counter
const N_LEFT = 3 // orbs / tolls still to come
const N_DEST = 4 // glide or teleport destination x
const N_SUMMONS = 5 // summons this phase
const N_FROM_Y = 6 // height a move started from
const N_FIRE0 = 7 // fire line: left x, right x, b.t it began glowing
const N_FIRE1 = 8
const N_FIRET = 9
const N_TARGET = 10 // dive target x / sweep direction
const N_FROM_X = 11 // x a move started from
const N_SPOT0 = 12 // summoning circles: two slots of [x, y]
const ORB0 = 16 // homing orbs: ORBS slots of [x, y, vx, vy, life]
const ORBS = 4
const N_SIZE = ORB0 + ORBS * 5

const P1_ATTACKS = ['orbs', 'summon', 'fire'] as const
const P2_ATTACKS = ['sweep', 'toll', 'dive'] as const

// --- tuning ---------------------------------------------------------------------------------------
const HP = 28
const PHASE2_HP = 28
const GLIDE = 96
const GLIDE_SPEED = 0.75
const VANISH = 40
const APPEAR = 14
const ORBS_TELL = 44
const ORB_EVERY = 60
const ORB_COUNT = 2
const ORB_SPEED = 0.9
const ORB_TURN = 0.03
const ORB_COMMIT = 44
const ORB_FADE = 70 // ticks a committed orb flies on before it gutters out
const ORB_LANE = 9 // cruising height of the orbs' centre above the floor
const ORB_LIFE = 220
const SUMMON_TELL = 48
const SUMMON = 20
const SUMMON_CAP = 2
const FIRE_TELL = 56
const FIRE = 44
const FIRE_SPAN = 96
const FIRE_STEP = 16
const PRAY = 40
const TRANSFORM = 160
const HOVER = 64
const HOVER_Y = 204
const SWEEP_TELL = 38
const SWEEP_SPEED = 3.3
const SWEEP_Y = 148
const TOLL_TELL = 36
const TOLL_EVERY = 40
const TOLL_COUNT = 2
const DIVE_TELL = 44
const DIVE_LOCK = 14 // the mark stops following Zuzu this many ticks before the dive
const DIVE_Y = 92
const DIVE_SPEED = 5.5
const PLUNGE = 44 // the last stretch of the dive is straight down
const REEL = 40
const STAGGER = 46
const FLOOR_Y = 206 // where the spectre lies when she crashes

const clamp01 = (u: number) => Math.max(0, Math.min(1, u))
const lerp = (a: number, b: number, u: number) => a + (b - a) * u
const ease = (u: number) => (1 - Math.cos(Math.PI * clamp01(u))) / 2
const progress = (b: Boss) => 1 - b.timer / Math.max(1, b.n[N_LEN] ?? 1)

function setMode(b: Boss, mode: AbbessMode, len: number) {
  b.mode = mode
  b.timer = Math.max(1, Math.round(len))
  b.n[N_LEN] = b.timer
  b.n[N_AUX] = 0
  b.n[N_FROM_X] = b.x
  b.n[N_FROM_Y] = b.y
}

const tellLen = (ticks: number, ctx: BossCtx) =>
  Math.max(30, Math.round(ticks / (1 + (ctx.tier - 1) * 0.12)))

function tell(b: Boss, ctx: BossCtx, mode: AbbessMode, ticks: number) {
  setMode(b, mode, tellLen(ticks, ctx))
  ctx.sound('warn')
}

const lo = (ctx: BossCtx) => ctx.arenaL + 24
const hi = (ctx: BossCtx) => ctx.arenaR - 24

/** The three points of the crypt she haunts. */
function points(ctx: BossCtx) {
  return [ctx.arenaL + 40, (ctx.arenaL + ctx.arenaR) / 2, ctx.arenaR - 40]
}

/** A point well away from Zuzu, and not the one she is at. */
function pickPoint(b: Boss, ctx: BossCtx) {
  const far = points(ctx).filter(
    (x) => Math.abs(x - ctx.px) > 80 && Math.abs(x - b.x) > 30,
  )
  const pool = far.length ? far : points(ctx)
  return pool[Math.floor(ctx.rng() * pool.length)] ?? pool[0]!
}

function pickAttack<T extends string>(
  b: Boss,
  ctx: BossCtx,
  list: readonly T[],
  allowed: (a: T) => boolean,
): T {
  const options = list
    .map((a, i) => [a, i] as const)
    .filter(([a, i]) => i !== b.n[N_LAST] && allowed(a))
  const pool = options.length ? options : list.map((a, i) => [a, i] as const)
  const [attack, index] = pool[Math.floor(ctx.rng() * pool.length)]!
  b.n[N_LAST] = index
  return attack
}

function startPhase1Attack(b: Boss, ctx: BossCtx) {
  const a = pickAttack(
    b,
    ctx,
    P1_ATTACKS,
    // Summons are capped, and never called with Zuzu at arm's length.
    (x) =>
      x !== 'summon' ||
      ((b.n[N_SUMMONS] ?? 0) < SUMMON_CAP && Math.abs(ctx.px - b.x) > 60),
  )
  b.face = Math.sign(ctx.px - b.x) || b.face || -1
  if (a === 'orbs') {
    tell(b, ctx, 'orbsTell', ORBS_TELL)
  } else if (a === 'summon') {
    tell(b, ctx, 'summonTell', SUMMON_TELL)
    // Where it will step out: at her side, facing Zuzu, a guard to shoot through (a sister walking
    // the floor, then a shade hanging in the air).
    const shade = (b.n[N_SUMMONS] ?? 0) === SUMMON_CAP - 1
    const toward = Math.sign(b.x - ctx.px) || -1
    // Never on top of Zuzu: if he is at her side, it rises behind her instead.
    const near = b.x - toward * 26
    const x = Math.abs(near - ctx.px) < 34 ? b.x + toward * 26 : near
    b.n[N_SPOT0] = Math.max(ctx.arenaL + 16, Math.min(ctx.arenaR - 16, x))
    b.n[N_SPOT0 + 1] = shade ? ctx.groundY - 34 : ctx.groundY
    b.n[N_SPOT0 + 2] = 0
  } else {
    tell(b, ctx, 'fireTell', FIRE_TELL)
    // The floor behind Zuzu, from his heels away from her: it cuts off his retreat, and the way
    // out of it is a step toward her.
    const toward = Math.sign(b.x - ctx.px) || -1
    const edge = ctx.px + toward * 4
    const far = edge - toward * FIRE_SPAN
    const x0 = Math.max(ctx.arenaL + 4, Math.min(edge, far))
    const x1 = Math.min(ctx.arenaR - 4, Math.max(edge, far))
    b.n[N_FIRE0] = x0
    b.n[N_FIRE1] = x1
    b.n[N_FIRET] = b.t
    for (let k = 0; k < FIRE_SPAN / FIRE_STEP; k++) {
      const x = edge - toward * (FIRE_STEP / 2 + k * FIRE_STEP)
      if (x < x0 || x > x1) continue
      ctx.bolt({
        kind: 'pillar',
        x,
        y: ctx.groundY - 16,
        vx: 0,
        vy: 0,
        grav: 0,
        life: b.timer + FIRE,
        arm: b.timer,
        hw: FIRE_STEP / 2,
        hh: 16,
      })
    }
  }
}

function startPhase2Attack(b: Boss, ctx: BossCtx) {
  // No toll at arm's length: its first wave would rise under Zuzu with no time to jump.
  const a = pickAttack(
    b,
    ctx,
    P2_ATTACKS,
    (x) => x !== 'toll' || Math.abs(ctx.px - b.x) > 60,
  )
  b.face = Math.sign(ctx.px - b.x) || b.face || -1
  if (a === 'sweep') {
    tell(b, ctx, 'sweepTell', SWEEP_TELL)
    // Start from her own side of Zuzu and sweep across him.
    const dir = b.x < ctx.px ? 1 : -1
    b.n[N_TARGET] = dir
    b.n[N_DEST] = dir > 0 ? lo(ctx) + 6 : hi(ctx) - 6
  } else if (a === 'toll') {
    tell(b, ctx, 'tollTell', TOLL_TELL)
  } else {
    tell(b, ctx, 'diveTell', DIVE_TELL)
    b.n[N_TARGET] = ctx.px
    b.n[N_DEST] = Math.max(
      lo(ctx),
      Math.min(hi(ctx), b.x + (ctx.px - b.x) * 0.35),
    )
  }
}

// --- homing ghost-lights -------------------------------------------------------------------------

function castOrb(b: Boss, ctx: BossCtx, x: number, y: number) {
  for (let s = 0; s < ORBS; s++) {
    const i = ORB0 + s * 5
    if (b.n[i + 4]! > 0) continue
    const dx = ctx.px - x
    const dy = ctx.py - 11 - y
    const d = Math.hypot(dx, dy) || 1
    b.n[i] = x
    b.n[i + 1] = y
    b.n[i + 2] = (dx / d) * ORB_SPEED
    b.n[i + 3] = (dy / d) * ORB_SPEED
    b.n[i + 4] = ORB_LIFE
    ctx.sound('shoot')
    return
  }
}

function stepOrbs(b: Boss, ctx: BossCtx) {
  for (let s = 0; s < ORBS; s++) {
    const i = ORB0 + s * 5
    if (!(b.n[i + 4]! > 0)) continue
    let x = b.n[i]!
    let y = b.n[i + 1]!
    // The game just tested last tick's hitbox against Zuzu: if it touched him, this one is spent.
    if (Math.abs(x - ctx.px) < 4 + 5 && y + 4 > ctx.py - 22 && y - 4 < ctx.py) {
      b.n[i + 4] = 0
      continue
    }
    let vx = b.n[i + 2]!
    let vy = b.n[i + 3]!
    // Sinking to a low lane along the floor and drifting after Zuzu; close in, it commits to its
    // line, so a timely jump clears it.
    const dx = ctx.px - x
    const lane = ctx.groundY - ORB_LANE + Math.sin((b.t + s * 40) / 12) * 1.5
    if (b.n[i + 4]! > ORB_FADE) {
      if (Math.abs(dx) > ORB_COMMIT)
        vx += ((Math.sign(dx) || 1) * ORB_SPEED - vx) * ORB_TURN
      else {
        // Committed: it holds its line at full pace from here and gutters out.
        b.n[i + 4] = ORB_FADE
        vx = (Math.sign(vx) || Math.sign(dx) || 1) * ORB_SPEED
      }
    }
    vy += (Math.max(-0.7, Math.min(1.6, (lane - y) * 0.1)) - vy) * 0.2
    x += vx
    y = Math.min(ctx.groundY - 4, y + vy)
    // It gutters out at the crypt's walls.
    if (x < ctx.arenaL + 2 || x > ctx.arenaR - 2) {
      b.n[i + 4] = 0
      continue
    }
    b.n[i] = x
    b.n[i + 1] = y
    b.n[i + 2] = vx
    b.n[i + 3] = vy
    b.n[i + 4] = b.n[i + 4]! - 1
    // Only an orb down in its lane is one to hop.
    const low = y > lane - 3
    reach(ctx, x + vx, y + vy, 4, 4, low ? cue(ctx, x, vx, 4) : 'drop')
  }
}

/**
 * How a low hazard's hitbox presents to the demo pilot (see heretic.ts `reach`): as something to
 * hop only inside the distance window where a hop started now clears it, otherwise as something to
 * step from. Players see and feel no difference.
 */
function cue(ctx: BossCtx, x: number, vx: number, hw: number) {
  const zone = hw + 5
  const speed = Math.abs(vx)
  const gap = Math.abs(ctx.px - x)
  const closing = Math.sign(vx) === Math.sign(ctx.px - x)
  return closing && gap > zone + 4 * speed && gap < 30 * speed - zone
    ? 'side'
    : 'drop'
}

/**
 * A cue for the demo pilot only: a harmless, invisible one-tick bolt over the locked dive mark, far
 * above Zuzu's head (it can never touch him), which the pilot reads as "step away from here".
 */
function markCue(ctx: BossCtx, x: number) {
  ctx.bolt({
    kind: 'chain',
    x,
    y: -REACH_FROM,
    vx: 0,
    vy: 1,
    grav: 0,
    life: 1,
    arm: 0,
    hw: 7,
    hh: 0,
  })
}

function clearOrbs(b: Boss) {
  for (let s = 0; s < ORBS; s++) b.n[ORB0 + s * 5 + 4] = 0
}

// --- behaviour ------------------------------------------------------------------------------------

function update(b: Boss, ctx: BossCtx) {
  stepOrbs(b, ctx)
  const u = progress(b)
  b.timer--
  switch (b.mode as AbbessMode) {
    // Phase one --------------------------------------------------------------------------------------
    case 'glide': {
      const dest = b.n[N_DEST] ?? b.x
      const step =
        Math.sign(dest - b.x) * Math.min(Math.abs(dest - b.x), GLIDE_SPEED)
      b.x += step
      b.face = Math.sign(ctx.px - b.x) || b.face
      if (b.timer <= 0) {
        if (ctx.rng() < 0.45) {
          tell(b, ctx, 'vanish', VANISH)
          b.n[N_DEST] = pickPoint(b, ctx)
        } else startPhase1Attack(b, ctx)
      }
      break
    }
    case 'vanish':
      if (b.timer <= 0) {
        b.x = b.n[N_DEST] ?? b.x
        b.face = Math.sign(ctx.px - b.x) || b.face
        setMode(b, 'appear', APPEAR)
      }
      break
    case 'appear':
      if (b.timer <= 0) startPhase1Attack(b, ctx)
      break
    case 'orbsTell':
      if (b.timer <= 0) {
        setMode(b, 'orbs', ORB_EVERY * ORB_COUNT)
        b.n[N_LEFT] = ORB_COUNT
      }
      break
    case 'orbs':
      if (b.n[N_LEFT]! > 0 && b.timer % ORB_EVERY === ORB_EVERY - 1) {
        const k = ORB_COUNT - b.n[N_LEFT]!
        castOrb(b, ctx, b.x + b.face * 32, b.y - 86 + k * 4)
        b.n[N_LEFT]!--
      }
      if (b.timer <= 0) setMode(b, 'pray', PRAY)
      break
    case 'summonTell':
      if (b.timer <= 0) setMode(b, 'summon', SUMMON)
      break
    case 'summon':
      if (b.timer === SUMMON - 2) {
        ctx.sound('boom')
        // One at a time: a sister, then a shade.
        const count = b.n[N_SUMMONS] ?? 0
        if (count < SUMMON_CAP) {
          ctx.summon(
            count === SUMMON_CAP - 1 ? 'shade' : 'sister',
            b.n[N_SPOT0]!,
            b.n[N_SPOT0 + 1]!,
          )
          b.n[N_SUMMONS] = count + 1
        }
      }
      if (b.timer <= 0) setMode(b, 'pray', PRAY)
      break
    case 'fireTell':
      if (b.timer <= 0) {
        setMode(b, 'fire', FIRE)
        ctx.sound('boom')
        // Embers flung up off the far end of the line as it catches, away from Zuzu.
        const x0 = b.n[N_FIRE0]!
        const x1 = b.n[N_FIRE1]!
        const out = Math.abs(x1 - ctx.px) > Math.abs(x0 - ctx.px) ? 1 : -1
        for (let k = 0; k < 3; k++)
          ctx.bolt({
            kind: 'ember',
            x: out > 0 ? x1 - k * 10 : x0 + k * 10,
            y: ctx.groundY - 30,
            vx: out * (0.6 + ctx.rng() * 0.6),
            vy: -3.2 - ctx.rng(),
            grav: 0.16,
            life: 120,
            arm: 0,
            hw: 3,
            hh: 3,
          })
      }
      break
    case 'fire':
      if (b.timer <= 0) {
        b.n[N_FIRE0] = 0
        b.n[N_FIRE1] = 0
        setMode(b, 'pray', PRAY)
      }
      break
    case 'pray':
      if (b.timer <= 0) {
        setMode(b, 'glide', GLIDE)
        b.n[N_DEST] = pickPoint(b, ctx)
      }
      break
    case 'transform': {
      // Rise into the column of light; the bar refills; settle as the spectre.
      const k = clamp01((u - 0.15) / 0.65)
      b.hp = Math.max(b.hp, Math.round(b.maxHp * k))
      b.y =
        u < 0.75
          ? lerp(ctx.groundY, 140, ease(u / 0.6))
          : lerp(140, HOVER_Y, ease((u - 0.75) / 0.25))
      if (b.timer === Math.round(b.n[N_LEN]! * 0.45)) ctx.sound('boom')
      if (b.timer <= 0) {
        b.hp = b.maxHp
        b.y = HOVER_Y
        setMode(b, 'hover', 30)
      }
      break
    }
    // Phase two --------------------------------------------------------------------------------------
    case 'hover': {
      // Keep about ninety pixels off Zuzu, on the roomier side.
      const side = ctx.px - ctx.arenaL > ctx.arenaR - ctx.px ? -1 : 1
      const want = Math.max(lo(ctx), Math.min(hi(ctx), ctx.px + side * 90))
      b.x += Math.sign(want - b.x) * Math.min(Math.abs(want - b.x), 1.1)
      b.y += (HOVER_Y + Math.sin(b.t / 14) * 2 - b.y) * 0.2
      b.face = Math.sign(ctx.px - b.x) || b.face
      if (b.timer <= 0) startPhase2Attack(b, ctx)
      break
    }
    case 'sweepTell': {
      // Climb to her starting side; the bell-weight drags on the floor beneath her.
      const k = ease(Math.min(1, u * 1.3))
      b.x = lerp(b.n[N_FROM_X]!, b.n[N_DEST]!, k)
      b.y = lerp(b.n[N_FROM_Y]!, SWEEP_Y, k)
      b.face = b.n[N_TARGET]!
      if (b.timer <= 0) {
        setMode(b, 'sweep', 999)
        ctx.sound('shoot')
      }
      break
    }
    case 'sweep': {
      const dir = b.n[N_TARGET]!
      b.x += dir * SWEEP_SPEED
      b.y = SWEEP_Y + Math.sin(b.t / 5) * 2
      // The dragged bell, a pace behind her, where it will be next tick.
      const bx = b.x + dir * SWEEP_SPEED - dir * 16
      reach(
        ctx,
        bx,
        ctx.groundY - 10,
        9,
        10,
        cue(ctx, bx, dir * SWEEP_SPEED, 9),
      )
      if ((dir > 0 && b.x >= hi(ctx)) || (dir < 0 && b.x <= lo(ctx))) {
        b.x = Math.max(lo(ctx), Math.min(hi(ctx), b.x))
        setMode(b, 'reel', REEL)
      }
      break
    }
    case 'tollTell':
      b.y = lerp(b.n[N_FROM_Y]!, HOVER_Y - 18, ease(u))
      if (b.timer <= 0) {
        setMode(b, 'toll', TOLL_EVERY * TOLL_COUNT + 10)
        b.n[N_LEFT] = TOLL_COUNT
        b.n[N_AUX] = 0
      }
      break
    case 'toll': {
      // Each toll: drop, ring, waves both ways; the second rolls slower so the two never merge.
      if (b.n[N_LEFT]! > 0 && --b.n[N_AUX]! <= 0) {
        const k = TOLL_COUNT - b.n[N_LEFT]!
        b.n[N_LEFT]!--
        b.n[N_AUX] = TOLL_EVERY
        ctx.sound('boom')
        for (const dir of [-1, 1])
          ctx.bolt({
            kind: 'wave',
            x: b.x + dir * 14,
            y: ctx.groundY - 7,
            vx: dir * (k === 0 ? 2.1 : 1.9),
            vy: 0,
            grav: 0,
            life: 200,
            arm: 0,
            hw: 6,
            hh: 7,
          })
      }
      const since = TOLL_EVERY - (b.n[N_AUX] ?? 0)
      b.y =
        since < 4
          ? FLOOR_Y
          : lerp(FLOOR_Y, HOVER_Y - 12, clamp01((since - 4) / 14))
      if (b.timer <= 0) setMode(b, 'reel', REEL)
      break
    }
    case 'diveTell': {
      const k = ease(Math.min(1, u * 1.4))
      b.x = lerp(b.n[N_FROM_X]!, b.n[N_DEST]!, k)
      b.y = lerp(b.n[N_FROM_Y]!, DIVE_Y, k)
      if (b.timer > DIVE_LOCK)
        b.n[N_TARGET] = Math.max(lo(ctx), Math.min(hi(ctx), ctx.px))
      else markCue(ctx, b.n[N_TARGET]!)
      b.face = Math.sign(b.n[N_TARGET]! - b.x) || b.face
      if (b.timer <= 0) {
        setMode(b, 'dive', 999)
        ctx.sound('shoot')
      }
      break
    }
    case 'dive': {
      const tx = b.n[N_TARGET]!
      markCue(ctx, tx)
      // Swoop to just over the mark, then plunge straight down onto it.
      const above = b.y < FLOOR_Y - PLUNGE && Math.abs(tx - b.x) > 0.5
      const dx = tx - b.x
      const dy = (above ? FLOOR_Y - PLUNGE : FLOOR_Y) - b.y
      const d = Math.hypot(dx, dy)
      if (above && d <= DIVE_SPEED) {
        b.x = tx
        b.y = FLOOR_Y - PLUNGE
      } else if (d <= DIVE_SPEED) {
        b.x = tx
        b.y = FLOOR_Y
        setMode(b, 'stagger', STAGGER)
        ctx.sound('boom')
      } else {
        b.x += (dx / d) * DIVE_SPEED
        b.y += (dy / d) * DIVE_SPEED
      }
      break
    }
    case 'reel':
    case 'stagger':
      b.y += (FLOOR_Y - b.y) * 0.25
      if (b.timer <= 0) setMode(b, 'hover', HOVER)
      break
    default:
      setMode(b, b.phase === 2 ? 'hover' : 'glide', 30)
  }
  b.x = Math.max(lo(ctx), Math.min(hi(ctx), b.x))
}

/** End of the first bar: refuse death and become the spectre. */
function onDefeat(b: Boss, ctx: BossCtx) {
  if (b.phase !== 1) return false
  b.phase = 2
  b.hp = 0
  b.maxHp = Math.round(b.maxHp * (PHASE2_HP / HP))
  b.n[N_LAST] = -1
  b.n[N_FIRE0] = 0
  b.n[N_FIRE1] = 0
  clearOrbs(b)
  setMode(b, 'transform', TRANSFORM)
  ctx.sound('boom')
  return true
}

export const ABBESS: BossDef = {
  name: 'THE ABBESS',
  title: 'BENEATH THE BELL',
  hp: HP,
  hw: 14,
  height: 64,
  create: (b, ctx) => {
    b.n = new Array<number>(N_SIZE).fill(0)
    b.n[N_LAST] = -1
    b.face = Math.sign(ctx.px - b.x) || -1
    setMode(b, 'glide', 50)
    b.n[N_DEST] = b.x
  },
  update,
  onDefeat,
  // Half in this world while she drifts, casts or attacks (drawn translucent); the transformation
  // is a column of light. Solid when she prays, reels or lies stunned.
  immune: (b) => !OPEN.has(b.mode),
  contact: (b) => {
    // A ghost: she hurts by her spells, her summons, her bell, and by diving on him.
    return b.mode === 'dive' ? { hw: 10, height: 40 } : null
  },
  draw: (g, b, tick) => drawAbbess(g, b, tick),
}

// --- art ------------------------------------------------------------------------------------------

const HABIT = ['#08060f', '#151024', '#241a3a', '#3a2c57', '#594784'] as const
const VEIL = ['#6f6a86', '#a6a1bd', '#d9d5ea', '#f1eef9', '#ffffff'] as const
const SKIN = ['#4b3f52', '#8c7d93', '#c9bccb', '#e8dee6', '#fff7fb'] as const
const GOLD = ['#5a2a0c', '#a65f12', '#e0a93a', '#fde68a', '#fffbe6'] as const
const CRIMSON = ['#4a0710', '#9b1020', '#e11d2e', '#ff5a5f', '#ffd0c8'] as const
const WING = ['#07050c', '#140d1f', '#24183a', '#3d2a5a', '#5c447e'] as const
const SPIRIT = ['#5b3f8f', '#9b7fd6', '#d7c8ff', '#f4eeff', '#ffffff'] as const
const BELL_DARK = BRONZE.map((h) => mix(h, '#3a2c57', 0.25))

let whiten = 0
const c = (hex: string) => (whiten > 0 ? mix(hex, '#ffffff', whiten) : hex)

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
    g.lineJoin = 'round'
    g.strokeStyle = outline
    g.stroke()
  }
  g.fillStyle = fill
  g.fill()
}

const hash = (n: number) => {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453
  return s - Math.floor(s)
}

/** A long skeletal hand at (x, y), fingers toward `aim`, spread by `spread`. */
function paintHand(
  g: CanvasRenderingContext2D,
  x: number,
  y: number,
  aim: number,
  spread: number,
) {
  g.save()
  g.translate(x, y)
  g.rotate(aim)
  g.lineCap = 'round'
  for (let i = 0; i < 4; i++) {
    const a = (i - 1.5) * 0.28 * spread
    g.beginPath()
    g.moveTo(0, 0)
    g.lineTo(Math.cos(a) * 4, Math.sin(a) * 4)
    g.lineTo(Math.cos(a * 1.4) * 8, Math.sin(a * 1.4) * 8 + 1)
    g.strokeStyle = INK
    g.lineWidth = 2.6
    g.stroke()
    g.strokeStyle = c(SKIN[3])
    g.lineWidth = 1
    g.stroke()
  }
  g.fillStyle = INK
  g.beginPath()
  g.ellipse(0, 0, 2.8, 2.2, 0, 0, TAU)
  g.fill()
  g.fillStyle = c(SKIN[2])
  g.beginPath()
  g.ellipse(0, 0, 1.9, 1.4, 0, 0, TAU)
  g.fill()
  g.restore()
}

/** A wide habit sleeve from the shoulder to the wrist, the cuff hanging open. */
function paintSleeve(
  g: CanvasRenderingContext2D,
  sx: number,
  sy: number,
  wx: number,
  wy: number,
  ramp: readonly string[],
) {
  const len = Math.hypot(wx - sx, wy - sy) || 1
  const dx = (wx - sx) / len
  const dy = (wy - sy) / len
  let nx = -dy
  let ny = dx
  if (ny < 0) {
    nx = -nx
    ny = -ny
  }
  const pts = [
    sx - nx * 4,
    sy - ny * 4,
    wx - nx * 4,
    wy - ny * 4,
    wx + nx * 7 + dx * 2,
    wy + ny * 7 + dy * 2 + 3,
    sx + nx * 6,
    sy + ny * 6,
  ]
  fillPoly(g, pts, c(ramp[2]!))
  g.fillStyle = c(ramp[3]!)
  poly(g, [
    sx - nx * 4,
    sy - ny * 4,
    wx - nx * 4,
    wy - ny * 4,
    wx - nx * 1,
    wy - ny * 1,
    sx - nx * 1,
    sy - ny * 1,
  ])
  g.fill()
  g.fillStyle = INK
  g.beginPath()
  g.ellipse(
    wx + nx * 1.5,
    wy + ny * 1.5 + 1,
    2.2,
    5,
    Math.atan2(dy, dx),
    0,
    TAU,
  )
  g.fill()
}

/** The crimson heart-light both bosses show when they can be hurt. */
function paintHeart(
  g: CanvasRenderingContext2D,
  x: number,
  y: number,
  t: number,
) {
  const beat = 0.5 + 0.5 * Math.sin(t / 5)
  glow(g, x, y, 14 + beat * 8, CRIMSON[2], 0.6 + 0.3 * beat)
  g.fillStyle = CRIMSON[2]
  g.beginPath()
  g.ellipse(x, y, 2.6 + beat * 0.6, 3.2 + beat * 0.6, 0.2, 0, TAU)
  g.fill()
  g.fillStyle = CRIMSON[4]
  g.fillRect(x - 1, y - 2, 1.5, 1.5)
}

/** The crozier: a tall gold staff, its crook hung with a little bell. */
function paintCrozier(
  g: CanvasRenderingContext2D,
  x: number,
  top: number,
  tick: number,
  hot: number,
) {
  g.lineCap = 'round'
  for (const [w, col] of [
    [3.4, INK],
    [1.6, c(GOLD[2])],
  ] as const) {
    g.strokeStyle = col
    g.lineWidth = w
    g.beginPath()
    g.moveTo(x, 2)
    g.lineTo(x, top)
    g.arc(x + 5, top, 5, Math.PI, 0.35)
    g.stroke()
  }
  g.strokeStyle = c(GOLD[4])
  g.lineWidth = 0.6
  g.beginPath()
  g.moveTo(x - 0.5, -4)
  g.lineTo(x - 0.5, top)
  g.stroke()
  // Knops on the staff.
  g.fillStyle = c(GOLD[3])
  for (const ky of [top + 10, top + 30]) {
    g.fillStyle = INK
    g.fillRect(x - 2, ky - 1.5, 4, 3)
    g.fillStyle = c(GOLD[3])
    g.fillRect(x - 1.5, ky - 1, 3, 2)
  }
  const sway = Math.sin(tick / 12) * 0.25
  paintChain(g, x + 9.6, top + 2, x + 9.6 + Math.sin(sway) * 4, top + 6, 0)
  paintBell(g, x + 9.6 + Math.sin(sway) * 5, top + 10, -sway, 0.38, hot, tick)
}

/** Phase one: the veiled Abbess. Local frame: feet at (0, 0), facing +x. */
function paintVeiled(
  g: CanvasRenderingContext2D,
  t: number,
  mode: string,
  u: number,
  tick: number,
  open: boolean,
) {
  const bob = Math.sin(t / 16) * 1.5
  const kneel = mode === 'pray' ? ease(Math.min(1, u * 4)) : 0
  const lift =
    mode === 'orbsTell' || mode === 'orbs'
      ? 1
      : mode === 'fireTell' || mode === 'fire'
        ? 0.8
        : 0
  const k6 = kneel * 7
  g.save()
  g.translate(0, -4 + bob * (1 - kneel) + kneel * 4)
  // The crozier, held in the far hand.
  const staffUp = lift * 6 - kneel * 2
  paintCrozier(g, -11, -80 - staffUp + k6, tick, lift)
  // The habit's hem dissolving into smoke: she has no feet.
  for (let i = 0; i < 8; i++) {
    const p = ((t * 0.7 + i * 9) % 40) / 40
    g.fillStyle = rgba(HABIT[3], (1 - p) * 0.5)
    g.beginPath()
    g.arc(-14 + i * 4.4 + Math.sin(t / 9 + i) * 2, 2 + p * 5, 2 + p * 4, 0, TAU)
    g.fill()
  }
  // The long black veil, streaming down her back.
  const stream = Math.sin(t / 14) * 2
  fillPoly(
    g,
    [
      0,
      -74 + k6,
      -8,
      -68 + k6,
      -14 + stream * 0.5,
      -50,
      -20 + stream,
      -28,
      -26 + stream * 1.5,
      -6,
      -18 + stream,
      -9,
      -14 + stream,
      -4,
      -10,
      -20,
      -6,
      -46,
    ],
    c(HABIT[1]),
  )
  // Ragged hem tongues, then the habit itself: a tall column flaring to the floor.
  for (let i = 0; i < 8; i++) {
    const x0 = -16 + i * 4.4
    const sway = Math.sin(t / 10 + i) * 1.2
    fillPoly(
      g,
      [x0, -3, x0 + 4.2, -3, x0 + 2.5 + sway, 3 + hash(i) * 3],
      c(HABIT[1]),
    )
  }
  const habit = [
    -16,
    0,
    -11,
    -20,
    -9,
    -40,
    -8,
    -50 + k6,
    0,
    -54 + k6,
    8,
    -50 + k6,
    10,
    -40,
    12,
    -20,
    18,
    0,
  ]
  fillPoly(g, habit, c(HABIT[2]))
  g.save()
  poly(g, habit)
  g.clip()
  g.fillStyle = c(HABIT[1])
  poly(g, [-20, 4, -20, -60, -3, -60, -5, -30, -2, 4])
  g.fill()
  g.fillStyle = c(HABIT[0])
  poly(g, [-20, 4, -20, -30, -10, -22, -9, 4])
  g.fill()
  g.fillStyle = c(HABIT[3])
  poly(g, [4, -48, 9, -42, 13, -12, 16, 4, 10, 4, 7, -22])
  g.fill()
  g.fillStyle = c(HABIT[4])
  g.fillRect(9, -32, 1, 16)
  g.strokeStyle = c(HABIT[0])
  g.lineWidth = 1.2
  for (let i = 0; i < 3; i++) {
    g.beginPath()
    g.moveTo(-5 + i * 5, -40)
    g.quadraticCurveTo(-7 + i * 5 + Math.sin(t / 12 + i), -18, -9 + i * 6, 2)
    g.stroke()
  }
  g.restore()
  // Scapular: a white panel down her front, gold-hemmed, a cracked bell stitched on it.
  fillPoly(g, [3, -44 + k6, 9, -43 + k6, 13, -6, 6, -6], c(VEIL[2]))
  g.fillStyle = c(VEIL[3])
  g.fillRect(5, -40 + k6, 2, 30)
  g.fillStyle = c(GOLD[2])
  g.fillRect(6, -8, 7, 1)
  paintBell(g, 9, -24, 0, 0.3, open ? 0.8 : 0, tick, { crack: true })
  // The wimple: a rounded white collar over the shoulders, shaded underneath.
  g.fillStyle = INK
  g.beginPath()
  g.ellipse(1.5, -52 + k6, 11.5, 9.5, 0, 0, Math.PI)
  g.fill()
  g.fillStyle = c(VEIL[3])
  g.beginPath()
  g.ellipse(1.5, -52 + k6, 10.5, 8.5, 0, 0, Math.PI)
  g.fill()
  g.fillStyle = c(VEIL[2])
  g.beginPath()
  g.ellipse(1.5, -50 + k6, 10.5, 6.5, 0, 0.15, Math.PI - 0.15)
  g.fill()
  g.fillStyle = c(VEIL[1])
  g.beginPath()
  g.ellipse(1.5, -48 + k6, 9, 4.5, 0, 0.3, Math.PI - 0.3)
  g.fill()
  // Rosary across the collar.
  g.fillStyle = INK
  for (let i = 0; i < 7; i++) {
    g.beginPath()
    g.arc(-5 + i * 2.2, -47 + k6 + Math.sin((i / 6) * Math.PI) * 4, 0.8, 0, TAU)
    g.fill()
  }
  if (open) paintHeart(g, 3, -36 + k6, t)
  // Head: an oval white coif around a shadowed face, crimson eyes burning through a gauze veil
  // that falls past her chin; a tall black cap with a gold circlet.
  const hx = 3
  const hy = -62 + k6
  g.fillStyle = INK
  g.beginPath()
  g.ellipse(hx + 2, hy + 1, 8.5, 10, 0, 0, TAU)
  g.fill()
  g.fillStyle = c(VEIL[3])
  g.beginPath()
  g.ellipse(hx + 2, hy + 1, 7.5, 9, 0, 0, TAU)
  g.fill()
  g.fillStyle = c(VEIL[2])
  g.beginPath()
  g.ellipse(hx + 0.5, hy + 2, 6, 8, 0, Math.PI * 0.5, Math.PI * 1.5)
  g.fill()
  // The face in the coif's shadow: hollow cheeks, a skull's hint.
  g.fillStyle = c(SKIN[0])
  g.beginPath()
  g.ellipse(hx + 4.2, hy + 1.5, 4.2, 6.2, 0, 0, TAU)
  g.fill()
  g.fillStyle = c(SKIN[1])
  g.beginPath()
  g.ellipse(hx + 5, hy + 0.5, 2.6, 4.4, 0, 0, TAU)
  g.fill()
  g.fillStyle = INK
  g.fillRect(hx + 2.6, hy - 1.6, 2.2, 2)
  g.fillRect(hx + 5.8, hy - 1.6, 2.2, 2)
  g.fillRect(hx + 3.6, hy + 4.5, 3.6, 0.8)
  const eye = mode.endsWith('Tell') ? 0.7 + 0.3 * u : open ? 0.25 : 0.55
  glow(g, hx + 3.7, hy - 0.6, 2 + eye * 2.5, CRIMSON[2], 0.5 + eye * 0.4)
  glow(g, hx + 6.9, hy - 0.6, 2 + eye * 2.5, CRIMSON[2], 0.5 + eye * 0.4)
  g.fillStyle = CRIMSON[eye > 0.6 ? 4 : 3]
  g.fillRect(hx + 3, hy - 1.2, 1.4, 1.2)
  g.fillRect(hx + 6.2, hy - 1.2, 1.4, 1.2)
  // The gauze: a pale, sheer drape from the brow to below the chin.
  g.save()
  g.globalAlpha *= 0.2
  g.fillStyle = c(VEIL[4])
  poly(g, [
    hx - 0.5,
    hy - 6,
    hx + 9.5,
    hy - 5,
    hx + 11,
    hy + 12,
    hx + 6,
    hy + 14,
    hx + 0.5,
    hy + 12,
  ])
  g.fill()
  g.restore()
  g.strokeStyle = rgba(VEIL[4], 0.5)
  g.lineWidth = 0.5
  for (let i = 0; i < 4; i++) {
    const sway = Math.sin(t / 15 + i) * 0.6
    g.beginPath()
    g.moveTo(hx + 0.5 + i * 2.8, hy - 5)
    g.quadraticCurveTo(
      hx + 1 + i * 3 + sway,
      hy + 4,
      hx + 1.2 + i * 3.1,
      hy + 12.5,
    )
    g.stroke()
  }
  // Tall cap and circlet.
  fillPoly(
    g,
    [
      hx - 9,
      hy - 1,
      hx - 8,
      hy - 10,
      hx - 3,
      hy - 16,
      hx + 4,
      hy - 15,
      hx + 10,
      hy - 6,
      hx + 9,
      hy - 3,
      hx + 2,
      hy - 8,
      hx - 5,
      hy - 5,
    ],
    c(HABIT[2]),
  )
  g.fillStyle = c(HABIT[4])
  g.fillRect(hx - 4, hy - 15, 6, 1)
  g.fillStyle = INK
  g.fillRect(hx - 8, hy - 10, 18, 3)
  g.fillStyle = c(GOLD[2])
  g.fillRect(hx - 7, hy - 9, 16, 1.4)
  g.fillStyle = c(GOLD[3])
  for (const px of [hx - 5, hx + 1, hx + 7]) g.fillRect(px, hy - 11, 1.2, 2)
  // Far hand on the crozier.
  paintSleeve(g, -4, -48 + k6, -10, -40 - staffUp * 0.5 + k6, HABIT)
  paintHand(g, -10, -40 - staffUp * 0.5 + k6, 1.6, 0.5)
  // Near arm: casting, ringing, praying.
  if (mode === 'summonTell' || mode === 'summon') {
    const ring = Math.sin(t / 2.5) * 0.5
    paintSleeve(g, 5, -48, 17, -58, HABIT)
    paintBell(g, 21 + Math.sin(ring) * 4, -52, -ring, 0.5, 0.7, tick)
    paintHand(g, 18, -61, -1.3, 0.6)
  } else if (mode === 'pray') {
    paintSleeve(g, 5, -48 + k6, 11, -40 + k6, HABIT)
    paintHand(g, 12, -42 + k6, -2.2, 0.3)
  } else {
    const nx = lerp(13, 23, lift)
    const ny = lerp(-28, -64, lift)
    paintSleeve(g, 5, -48, nx, ny, HABIT)
    paintHand(g, nx + 2, ny - 1, lift > 0 ? -1.2 : 0.9, 1 + lift)
  }
  g.restore()
}

/** Phase two: the winged bell-spectre. Local frame: (0, 0) under the bell's lip, facing +x. */
function paintSpectre(
  g: CanvasRenderingContext2D,
  t: number,
  mode: string,
  u: number,
  tick: number,
  grow: number,
  open: boolean,
) {
  const crashed = mode === 'stagger'
  const flapRate =
    mode === 'dive' ? 0 : mode === 'diveTell' || mode === 'sweep' ? 3 : 6
  const beat = flapRate ? Math.sin(t / flapRate) : 0
  const spread =
    mode === 'dive'
      ? 0.15
      : mode === 'diveTell'
        ? 1.15
        : crashed
          ? 0.2
          : mode === 'reel'
            ? 0.45
            : 0.85
  // Great membrane wings, spread like a bat's, the far one darker.
  const wing = (side: number) => {
    g.save()
    g.translate(side * 3, -50)
    g.scale(side, 1)
    const open = Math.max(0.05, spread * grow)
    g.rotate(-(beat * 0.22 + (crashed ? -0.7 : 0)) * open)
    // Arm bone up and out to the wrist, then four fingers.
    const wx = 18 * (0.6 + 0.4 * open)
    const wy = -14 * open - 4
    const fingers: [number, number][] = [
      [wx + 40 * open + 6, wy + 2],
      [wx + 36 * open + 4, wy + 18 + 6 * (1 - open)],
      [wx + 24 * open + 2, wy + 32],
      [wx + 8 * open + 2, wy + 40],
    ]
    const membrane: number[] = [0, 4, wx, wy]
    fingers.forEach(([fx, fy], k) => {
      membrane.push(fx, fy)
      const next = fingers[k + 1]
      if (next) membrane.push((fx + next[0]) / 2 - 4, (fy + next[1]) / 2 - 2)
    })
    membrane.push(4, 22)
    const ramp = side > 0 ? WING : WING.map((h) => mix(h, INK, 0.35))
    fillPoly(g, membrane, c(ramp[2]!))
    g.save()
    poly(g, membrane)
    g.clip()
    // Lit along the leading edge; crimson veins glowing through.
    g.fillStyle = c(ramp[3]!)
    poly(g, [
      0,
      4,
      wx,
      wy,
      fingers[0]![0],
      fingers[0]![1],
      wx + 4,
      wy + 6,
      4,
      10,
    ])
    g.fill()
    g.fillStyle = c(ramp[1]!)
    poly(g, [
      4,
      22,
      fingers[3]![0],
      fingers[3]![1],
      fingers[2]![0],
      fingers[2]![1],
      wx,
      wy + 24,
    ])
    g.fill()
    g.strokeStyle = rgba(CRIMSON[2], 0.55)
    g.lineWidth = 0.8
    for (const [fx, fy] of fingers) {
      g.beginPath()
      g.moveTo(wx * 0.5, wy * 0.5 + 8)
      g.quadraticCurveTo(fx * 0.6, fy * 0.6 + 10, fx * 0.85, fy * 0.85 + 4)
      g.stroke()
    }
    // Tears in the membrane.
    g.fillStyle = INK
    poly(g, [
      wx + 20 * open,
      wy + 16,
      wx + 26 * open,
      wy + 19,
      wx + 21 * open,
      wy + 22,
    ])
    g.fill()
    poly(g, [
      wx + 10 * open,
      wy + 28,
      wx + 15 * open,
      wy + 30,
      wx + 9 * open,
      wy + 33,
    ])
    g.fill()
    g.restore()
    // Bones: arm and fingers.
    g.lineCap = 'round'
    const bone = (
      x0: number,
      y0: number,
      x1: number,
      y1: number,
      w: number,
    ) => {
      g.strokeStyle = INK
      g.lineWidth = w + 2
      g.beginPath()
      g.moveTo(x0, y0)
      g.lineTo(x1, y1)
      g.stroke()
      g.strokeStyle = c(SKIN[side > 0 ? 3 : 2])
      g.lineWidth = w
      g.stroke()
    }
    bone(0, 2, wx, wy, 2.2)
    for (const [fx, fy] of fingers) bone(wx, wy, fx, fy, 1.2)
    // A claw at the wrist.
    g.fillStyle = c(SKIN[3])
    poly(g, [wx, wy - 1, wx + 3, wy - 6, wx + 2, wy])
    g.fill()
    g.restore()
  }
  wing(-1)
  // Spirit trailing from under the bell.
  for (let i = 0; i < 7; i++) {
    const p = ((t + i * 7) % 36) / 36
    g.fillStyle = rgba(SPIRIT[2], (1 - p) * 0.4)
    g.beginPath()
    g.arc(-12 + i * 4 + Math.sin(t / 8 + i) * 2, 2 + p * 7, 2 + p * 4, 0, TAU)
    g.fill()
  }
  // Torso rising out of the bell's crown, in the rags of her habit.
  const ty = crashed ? 3 : 0
  fillPoly(
    g,
    [
      -8,
      -32 + ty,
      -10,
      -46 + ty,
      -6,
      -56 + ty,
      6,
      -56 + ty,
      10,
      -46 + ty,
      8,
      -32 + ty,
    ],
    c(HABIT[2]),
  )
  g.fillStyle = c(HABIT[3])
  poly(g, [2, -55 + ty, 9, -46 + ty, 7, -34 + ty, 2, -34 + ty])
  g.fill()
  // Ribs of light through the torn habit.
  g.strokeStyle = rgba(CRIMSON[3], 0.85)
  g.lineWidth = 1
  for (let i = 0; i < 3; i++) {
    g.beginPath()
    g.moveTo(-5, -50 + i * 5 + ty)
    g.quadraticCurveTo(0, -52 + i * 5 + ty, 5, -48 + i * 5 + ty)
    g.stroke()
  }
  if (open) paintHeart(g, 0, -44 + ty, t)
  // The head: a skull in the tatters of her veil, a crown of candles.
  const hx = 1
  const hy = -64 + ty + (crashed ? 2 : 0)
  const scream =
    mode === 'diveTell' || mode === 'tollTell' ? 1 : mode === 'dive' ? 0.7 : 0
  // Veil hood around the skull, streaming behind.
  const stream = Math.sin(t / 9) * 2
  fillPoly(
    g,
    [
      hx - 9,
      hy + 8,
      hx - 10,
      hy - 3,
      hx - 4,
      hy - 10,
      hx + 6,
      hy - 10,
      hx + 10,
      hy - 3,
      hx + 9,
      hy + 8,
      hx + 4,
      hy + 4,
      hx - 4,
      hy + 4,
    ],
    c(VEIL[2]),
  )
  fillPoly(
    g,
    [
      hx - 8,
      hy - 2,
      hx - 18 + stream,
      hy + 4,
      hx - 26 + stream,
      hy + 20,
      hx - 15,
      hy + 14,
      hx - 9,
      hy + 8,
    ],
    c(VEIL[1]),
  )
  fillPoly(
    g,
    [
      hx + 8,
      hy - 2,
      hx + 16 - stream,
      hy + 6,
      hx + 18 - stream,
      hy + 18,
      hx + 12,
      hy + 12,
      hx + 9,
      hy + 8,
    ],
    c(VEIL[1]),
  )
  // Skull.
  const skull = [
    hx - 6,
    hy - 2,
    hx - 5,
    hy - 7,
    hx,
    hy - 9,
    hx + 5,
    hy - 7,
    hx + 6,
    hy - 2,
    hx + 4,
    hy + 3,
    hx + 3,
    hy + 6 + scream * 3,
    hx - 3,
    hy + 6 + scream * 3,
    hx - 4,
    hy + 3,
  ]
  fillPoly(g, skull, c(SKIN[3]))
  g.fillStyle = c(SKIN[4])
  poly(g, [hx - 4, hy - 6, hx, hy - 8, hx + 3, hy - 7, hx - 1, hy - 5])
  g.fill()
  g.fillStyle = INK
  g.beginPath()
  g.ellipse(hx - 2.4, hy - 1.5, 1.7, 2.1, 0, 0, TAU)
  g.ellipse(hx + 2.4, hy - 1.5, 1.7, 2.1, 0, 0, TAU)
  g.fill()
  poly(g, [hx, hy + 1, hx + 1, hy + 2.6, hx - 1, hy + 2.6])
  g.fill()
  g.fillRect(hx - 3, hy + 4, 6, 1 + scream * 3)
  g.fillStyle = c(SKIN[4])
  for (let i = 0; i < 4; i++) g.fillRect(hx - 2.6 + i * 1.6, hy + 3.6, 0.9, 1.2)
  const eye = mode.endsWith('Tell') || mode === 'dive' ? 1 : crashed ? 0.2 : 0.6
  for (const ex of [hx - 2.4, hx + 2.4]) {
    glow(g, ex, hy - 1.5, 4 + eye * 7, CRIMSON[2], 0.5 + 0.4 * eye)
    g.fillStyle = CRIMSON[4]
    g.fillRect(ex - 0.6, hy - 2, 1.2, 1.2)
  }
  // Candle crown.
  g.fillStyle = INK
  g.fillRect(hx - 7, hy - 10, 14, 2.4)
  g.fillStyle = c(GOLD[2])
  g.fillRect(hx - 6.5, hy - 9.5, 13, 1.2)
  for (let k = 0; k < 5; k++) {
    const cx = hx - 6 + k * 3
    const top = hy - 13 - (k === 2 ? 3 : k % 2 ? 1.5 : 0)
    g.fillStyle = c(VEIL[3])
    g.fillRect(cx - 0.8, top, 1.6, hy - 10 - top)
    if (!crashed)
      flame(g, cx, top, 3 + Math.sin(t / 3 + k) * 0.8, 1.1, t + k * 3, 0.9)
  }
  // The bell she has become: her skirt, cracked, crimson light leaking from the crack.
  const charge =
    mode === 'tollTell'
      ? u
      : mode === 'toll'
        ? 1
        : mode === 'diveTell'
          ? 0.5
          : 0.25
  paintBell(
    g,
    0,
    -16,
    crashed ? 0.22 : Math.sin(t / 11) * 0.05,
    1.5,
    charge,
    tick,
    {
      crack: true,
      ramp: BELL_DARK,
    },
  )
  glow(g, 4, -22, 8 + charge * 8, CRIMSON[2], 0.5 + 0.4 * charge)
  wing(1)
  // Arms: thrown up to toll or to dive; low over the bell otherwise.
  const tolling = mode === 'tollTell' || mode === 'toll'
  const up = tolling || mode === 'diveTell'
  const ay = up ? -66 : crashed ? -38 : -42
  paintSleeve(g, -5, -52 + ty, -14, ay + ty, HABIT)
  paintHand(g, -15, ay - 1 + ty, up ? -1.9 : 2.3, 1.2)
  paintSleeve(g, 5, -52 + ty, 14, ay + ty, HABIT)
  paintHand(g, 15, ay - 1 + ty, up ? -1.2 : 0.8, 1.2)
}

function paintOrb(
  g: CanvasRenderingContext2D,
  x: number,
  y: number,
  t: number,
  a = 1,
) {
  const pulse = 0.5 + 0.5 * Math.sin(t / 4)
  glow(g, x, y, 10 + pulse * 3, CRIMSON[2], 0.45 * a)
  glow(g, x, y, 5, SPIRIT[3], 0.8 * a)
  g.save()
  g.globalAlpha = a
  g.fillStyle = SPIRIT[4]
  g.beginPath()
  g.arc(x, y, 2.4, 0, TAU)
  g.fill()
  // A wisp tail.
  g.fillStyle = rgba(SPIRIT[2], 0.6)
  g.beginPath()
  g.arc(x - Math.sin(t / 5) * 2, y + 3, 1.4, 0, TAU)
  g.fill()
  g.restore()
}

function paintFloorFx(
  g: CanvasRenderingContext2D,
  b: Boss,
  tick: number,
  ground: number,
) {
  const mode = b.mode
  const u = progress(b)
  // The fire line: runes kindling, then a wall of ritual flame.
  const x0 = b.n[N_FIRE0]!
  const x1 = b.n[N_FIRE1]!
  if (x0 && x1 && (mode === 'fireTell' || mode === 'fire')) {
    const live = mode === 'fire'
    const k = live ? 1 : u
    g.save()
    g.globalCompositeOperation = 'lighter'
    g.globalAlpha = 0.4 + 0.6 * k
    g.fillStyle = CRIMSON[live ? 3 : 2]
    g.fillRect(x0, ground - 2, x1 - x0, 2)
    for (let x = x0 + 4; x < x1; x += 8) {
      const on = (Math.floor(x / 8) + Math.floor(tick / 6)) % 3 !== 0 || live
      if (!on) continue
      g.fillRect(x, ground - 5 - k * 2, 1, 3)
      g.fillRect(x - 1, ground - 4 - k * 2, 3, 1)
    }
    g.restore()
    glow(
      g,
      (x0 + x1) / 2,
      ground - 2,
      (x1 - x0) * (0.4 + 0.3 * k),
      CRIMSON[1],
      0.35 * k,
    )
    if (live) {
      const fade = Math.min(1, b.timer / 10)
      for (let x = x0 + 3; x < x1; x += 6) {
        const h = (16 + hash(x) * 14 + Math.sin(tick / 3 + x) * 4) * fade
        flame(g, x, ground, h, 4, tick + x)
      }
    }
  }
  // Summoning circles where the sisters and shades will step out.
  if (mode === 'summonTell' || mode === 'summon') {
    const k = mode === 'summon' ? 1 : u
    for (let i = 0; i < 2; i++) {
      const x = b.n[N_SPOT0 + i * 2]!
      const y = b.n[N_SPOT0 + i * 2 + 1]!
      if (!x) continue
      const flat = i === 0
      g.save()
      g.globalCompositeOperation = 'lighter'
      g.globalAlpha = 0.3 + 0.7 * k
      g.strokeStyle = SPIRIT[2]
      g.lineWidth = 1.2
      g.beginPath()
      g.ellipse(
        x,
        flat ? y - 1 : y - 12,
        12 * k + 3,
        flat ? 3.5 : 12 * k + 3,
        tick / 20,
        0,
        TAU,
      )
      g.stroke()
      g.strokeStyle = CRIMSON[3]
      g.beginPath()
      g.ellipse(
        x,
        flat ? y - 1 : y - 12,
        8 * k + 2,
        flat ? 2.2 : 8 * k + 2,
        -tick / 14,
        0,
        TAU,
      )
      g.stroke()
      g.restore()
      glow(g, x, flat ? y - 4 : y - 12, 14 + 10 * k, SPIRIT[1], 0.35 * k)
    }
  }
  // Teleport: a shimmering column where she will reappear.
  if (mode === 'vanish') {
    const x = b.n[N_DEST]!
    g.save()
    g.globalCompositeOperation = 'lighter'
    for (let k = 0; k < 6; k++) {
      const p = ((tick * 1.2 + k * 11) % 64) / 64
      g.fillStyle = rgba(k % 2 ? SPIRIT[3] : CRIMSON[3], (1 - p) * u * 0.9)
      g.fillRect(x - 8 + hash(k) * 16, ground - p * 64, 1, 4)
    }
    g.globalAlpha = 0.25 * u
    g.fillStyle = SPIRIT[2]
    g.fillRect(x - 6, ground - 64, 12, 64)
    g.restore()
    glow(g, x, ground - 4, 16 * u, SPIRIT[2], 0.6 * u)
  }
  // The dive's mark, hunting Zuzu, then locked.
  if (mode === 'diveTell' || mode === 'dive') {
    const x = b.n[N_TARGET]!
    const locked = mode === 'dive' || b.timer <= DIVE_LOCK
    const k = mode === 'dive' ? 1 : u
    g.save()
    g.globalCompositeOperation = 'lighter'
    g.strokeStyle = CRIMSON[locked ? 4 : 2]
    g.globalAlpha = 0.4 + 0.6 * k
    g.lineWidth = locked ? 1.6 : 1
    g.beginPath()
    g.ellipse(x, ground - 1, 14 - 4 * k, 3.5, 0, 0, TAU)
    g.stroke()
    g.beginPath()
    g.moveTo(x - 6, ground - 4)
    g.lineTo(x + 6, ground + 2)
    g.moveTo(x + 6, ground - 4)
    g.lineTo(x - 6, ground + 2)
    g.stroke()
    g.restore()
  }
}

/** Her two forms are drawn larger than their rigs: a tall abbess, a towering spectre. */
const VEILED_SCALE = 1.25
const SPECTRE_SCALE = 1.2

/** The bell-weight dragged along the floor on her chain (the sweep), with sparks. */
function paintDraggedBell(
  g: CanvasRenderingContext2D,
  b: Boss,
  t: number,
  tick: number,
  mode: string,
  S: number,
  ground: number,
) {
  const bx = -16
  const by = ground - b.y - 10
  paintChain(g, -10 * S, -40 * S, bx, by - 8, -6, 0.6)
  paintBell(
    g,
    bx,
    by,
    mode === 'sweep' ? 0.35 : Math.sin(t / 4) * 0.2,
    0.7,
    0.8,
    tick,
  )
  g.save()
  g.globalCompositeOperation = 'lighter'
  for (let k = 0; k < 6; k++) {
    const p = ((t * 2 + k * 5) % 14) / 14
    g.fillStyle = k % 2 ? '#fde047' : CRIMSON[3]
    g.globalAlpha = 1 - p
    g.fillRect(bx - 4 - p * 16, by + 8 - p * 8 + p * p * 10, 1, 1)
  }
  g.restore()
}

function drawAbbess(g: CanvasRenderingContext2D, b: Boss, tick: number) {
  const t = b.t
  const f = b.face || -1
  const dying = b.dying > 0
  const dp = dying ? 1 - b.dying / 70 : 0
  const mode = dying ? 'dead' : b.mode
  const u = progress(b)
  whiten = b.flash > 0 ? 0.8 : dying && Math.floor(b.dying / 4) % 2 ? 0.35 : 0
  setWhiten(whiten)
  const ground = 208
  if (!dying) paintFloorFx(g, b, tick, ground)

  const open = OPEN.has(b.mode) && !dying
  const spectre = b.phase === 2 && !(mode === 'transform' && u < 0.55)
  // Half in this world: translucent, shimmering. Solid when open.
  let alpha = open || dying ? 1 : 0.72 + 0.1 * Math.sin(t / 5)
  if (mode === 'vanish') alpha *= 1 - u
  if (mode === 'appear') alpha *= u
  if (dying) alpha = Math.min(1, b.dying / 30)

  g.save()
  const shake =
    mode === 'transform' && u < 0.5
      ? (hash(t) - 0.5) * 3
      : dying
        ? (hash(t) - 0.5) * 2
        : 0
  g.translate(Math.round(b.x + shake), Math.round(b.y))
  // Shadow on the floor, smaller the higher she floats.
  const lift = Math.max(0, ground - b.y)
  g.save()
  g.globalAlpha = 0.4 * Math.max(0.2, 1 - lift / 120)
  g.fillStyle = INK
  g.beginPath()
  g.ellipse(0, ground - b.y, 20 - Math.min(12, lift / 10), 3, 0, 0, TAU)
  g.fill()
  g.restore()
  g.scale(f, 1)
  // The sweep's chain runs from her hand to the bell on the floor in the unscaled frame, where the
  // bell's hitbox is.
  const S = spectre ? SPECTRE_SCALE : VEILED_SCALE
  if (spectre && (mode === 'sweepTell' || mode === 'sweep'))
    paintDraggedBell(g, b, t, tick, mode, S, ground)
  g.save()
  g.scale(S, S)
  // A pale rim of light so she stands out of the dark crypt: cold and shimmering while she is out
  // of reach, warm when she can be hurt.
  if (!dying && mode !== 'transform') {
    glow(
      g,
      0,
      -34,
      44,
      open ? CRIMSON[1] : SPIRIT[1],
      open ? 0.3 : 0.32 + 0.1 * Math.sin(t / 7),
    )
    if (!open) {
      g.save()
      g.globalCompositeOperation = 'lighter'
      g.fillStyle = rgba(SPIRIT[3], 0.18)
      for (let k = 0; k < 4; k++) {
        const sy = -70 + (((t * 1.3 + k * 19) % 76) | 0)
        g.fillRect(-14, sy, 28, 1)
      }
      g.restore()
    }
  }
  if (mode === 'transform') {
    // A column of crimson light from the vault; the cracked bell coming down into it.
    const col = Math.sin(Math.PI * clamp01(u * 1.1))
    g.save()
    g.globalCompositeOperation = 'lighter'
    g.globalAlpha = col * 0.7
    const grad = g.createLinearGradient(-20, 0, 20, 0)
    grad.addColorStop(0, rgba(CRIMSON[2], 0))
    grad.addColorStop(0.5, CRIMSON[3])
    grad.addColorStop(1, rgba(CRIMSON[2], 0))
    g.fillStyle = grad
    g.fillRect(-20, -b.y / S, 40, (ground + 10) / S)
    g.restore()
    glow(g, 0, -30, 60 * col, CRIMSON[2], 0.6 * col)
    if (u > 0.45 && u < 0.62)
      glow(g, 0, -30, 140, '#ffffff', 0.7 * (1 - Math.abs(u - 0.53) / 0.09))
  }

  g.save()
  g.globalAlpha = alpha
  if (spectre) {
    const grow = mode === 'transform' ? ease((u - 0.55) / 0.3) : 1
    if (dying) {
      g.translate(0, dp * 12)
      g.rotate(dp * 0.2)
    }
    paintSpectre(g, t, mode, u, tick, grow, open)
  } else {
    if (mode === 'transform') {
      // Torn upward: the veil ripping free, arms flung wide.
      g.translate(0, 0)
    }
    paintVeiled(g, t, mode === 'transform' ? 'orbsTell' : mode, u, tick, open)
  }
  g.restore()

  if (mode === 'transform' && u < 0.6) {
    // The bell descending onto her.
    const k = ease(clamp01((u - 0.1) / 0.45))
    const by = lerp(-b.y / S - 20, -16, k)
    paintBell(g, 0, by, 0, 1.5, k, tick, { crack: true, ramp: BELL_DARK })
    paintChain(g, 0, -b.y / S, 0, by - 20, 0, k)
  }
  // Ghost-lights gathering in her hands as she readies the volley.
  if (mode === 'orbsTell' || mode === 'orbs') {
    const left = mode === 'orbs' ? (b.n[N_LEFT] ?? 0) : ORB_COUNT
    for (let k = ORB_COUNT - left; k < ORB_COUNT; k++) {
      const a = t / 12 + (k * TAU) / ORB_COUNT
      const r = 9 + (mode === 'orbsTell' ? (1 - u) * 10 : 0)
      paintOrb(
        g,
        26 + Math.cos(a) * r * 0.6,
        -70 + Math.sin(a) * r * 0.5,
        t + k * 7,
        mode === 'orbsTell' ? 0.3 + 0.7 * u : 1,
      )
    }
  }
  if (mode === 'tollTell' || mode === 'toll') {
    g.save()
    g.globalCompositeOperation = 'lighter'
    g.strokeStyle = CRIMSON[3]
    for (let k = 0; k < 3; k++) {
      const p = ((t + k * 8) % 24) / 24
      g.globalAlpha = (1 - p) * (mode === 'toll' ? 0.9 : u * 0.8)
      g.lineWidth = 1.5
      g.beginPath()
      g.ellipse(0, -15, 22 + p * 40, 14 + p * 24, 0, 0, TAU)
      g.stroke()
    }
    g.restore()
  }
  if (mode === 'dive') {
    // Speed streaks off her wings.
    g.save()
    g.globalCompositeOperation = 'lighter'
    g.strokeStyle = rgba(SPIRIT[3], 0.6)
    g.lineWidth = 1
    for (let k = 0; k < 6; k++) {
      const ox = -30 + k * 10
      g.beginPath()
      g.moveTo(ox, -60 + k * 3)
      g.lineTo(ox - 14, -76 + k * 3)
      g.stroke()
    }
    g.restore()
  }
  if (b.mode === 'stagger' && !dying) {
    // Stunned: little bell-chimes circling.
    for (let k = 0; k < 3; k++) {
      const a = t / 10 + (k * TAU) / 3
      g.fillStyle = GOLD[3]
      g.fillRect(Math.cos(a) * 14 - 1, -70 + Math.sin(a) * 4 - 1, 2, 2)
    }
  }
  if (dying) {
    g.save()
    g.globalCompositeOperation = 'lighter'
    for (let k = 0; k < 9; k++) {
      const ang = (k / 9) * TAU + t / 30
      const len = 20 + dp * 90
      g.globalAlpha = 0.45 * (1 - dp * 0.5)
      g.fillStyle = k % 2 ? CRIMSON[3] : SPIRIT[3]
      g.beginPath()
      g.moveTo(0, -36)
      g.lineTo(Math.cos(ang - 0.06) * len, -36 + Math.sin(ang - 0.06) * len)
      g.lineTo(Math.cos(ang + 0.06) * len, -36 + Math.sin(ang + 0.06) * len)
      g.closePath()
      g.fill()
    }
    g.restore()
    glow(g, 0, -36, 30 + dp * 40, CRIMSON[3], 0.7)
  }
  g.restore()
  g.restore()

  // Homing ghost-lights in flight (world space).
  for (let s = 0; s < ORBS; s++) {
    const i = ORB0 + s * 5
    if (!(b.n[i + 4]! > 0) || dying) continue
    paintOrb(
      g,
      b.n[i]!,
      b.n[i + 1]!,
      tick + s * 13,
      Math.min(1, b.n[i + 4]! / 20),
    )
  }
  whiten = 0
  setWhiten(0)
}
