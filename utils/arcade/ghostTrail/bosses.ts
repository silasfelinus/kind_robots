// /utils/arcade/ghostTrail/bosses.ts
//
// Zuzu: Ghost Trail's bosses (conductor kr-arcade t-016..t-019). Each guards the end of its stage in a
// locked arena. A boss is a small state machine whose every attack has a readable tell (a windup the
// player can see and hear), an active window, and a recovery the player can punish. The game owns
// damage, flashing, the dying sequence and scoring; a boss def owns movement, attacks and its body.
//
// Deterministic: all chance from ctx.rng. Attacks are pushed as bolts (see foes.ts) or summoned foes.

import type { Bolt, FoeCtx } from './foes'
import type { BossId, FoeKind } from './world'

export type Boss = {
  id: BossId
  x: number
  y: number
  vx: number
  vy: number
  hp: number
  maxHp: number
  t: number
  flash: number
  /** The current move; each boss names its own (e.g. 'paw', 'charge', 'stunned'). */
  mode: string
  timer: number
  dying: number
  /** 1, or 2 once a two-phase boss has turned. */
  phase: number
  face: number
  /** Scratch numbers a boss keeps between ticks (cover index, combo count, ...). */
  n: number[]
}

export type BossCtx = FoeCtx & {
  arenaL: number
  arenaR: number
  /** Difficulty: 1 on a first run, higher on New Game+. */
  tier: number
  summon: (kind: FoeKind, x: number, y: number) => void
  bolt: (b: Omit<Bolt, 't'>) => void
}

export type BossDef = {
  name: string
  /** Banner sub-line when it appears. */
  title: string
  hp: number
  /** Hurtbox: half width and height above the feet. */
  hw: number
  height: number
  create: (b: Boss, ctx: BossCtx) => void
  update: (b: Boss, ctx: BossCtx) => void
  /** Hits that land while this is true are shrugged off (e.g. the bull mid-charge). */
  immune?: (b: Boss) => boolean
  /**
   * Paint the boss (world space; the game has translated by -camX). `face` is the sign toward Zuzu.
   * Optional while its art is in progress: without it the game draws a stand-in body.
   */
  draw?: (
    g: CanvasRenderingContext2D,
    b: Boss,
    tick: number,
    face: number,
  ) => void
  /** Contact damage box (half width, height); null while it can't hurt by touch. */
  contact?: (b: Boss) => { hw: number; height: number } | null
}

const dirTo = (b: Boss, ctx: BossCtx) => Math.sign(ctx.px - b.x) || -1

export const BOSSES: Partial<Record<BossId, BossDef>> = {
  // The Dust Devil whirls back and forth across the arena and flings clods at Zuzu when he keeps away.
  devil: {
    name: 'THE DUST DEVIL',
    title: 'FROM THE THIN PLACES',
    hp: 18,
    hw: 14,
    height: 38,
    create: (b) => {
      b.mode = 'drift'
      b.vx = -1
      b.timer = 90
    },
    update: (b, ctx) => {
      b.x += b.vx * 0.8 * ctx.speed
      if (b.x < ctx.arenaL + 16 || b.x > ctx.arenaR - 20) {
        b.x = Math.max(ctx.arenaL + 16, Math.min(ctx.arenaR - 20, b.x))
        b.vx = -b.vx
      }
      if (--b.timer <= 0 && Math.abs(ctx.px - b.x) > 75) {
        b.timer = Math.max(55, 92 - ctx.tier * 8)
        const dir = dirTo(b, ctx)
        for (let i = 0; i < 3; i++)
          ctx.bolt({
            kind: 'clod',
            x: b.x,
            y: b.y - 34,
            vx: dir * (0.9 + i * 0.9),
            vy: -3.6 - i * 0.3,
            grav: 0.2,
            life: 160,
            arm: 0,
            hw: 5,
            hh: 5,
          })
        ctx.sound('shoot')
      }
    },
    contact: () => ({ hw: 13, height: 34 }),
  },
  // The Bone Bull paws the dirt (its tell), charges (jump it; it shrugs off hits mid-charge), slams
  // the arena wall and staggers: the window to hit it. From half health it also stamps, shaking bones
  // loose from above: watch the shadows.
  bull: {
    name: 'THE BONE BULL',
    title: 'FROM THE THIN PLACES',
    hp: 16,
    hw: 15,
    height: 26,
    create: (b) => {
      b.mode = 'paw'
      b.timer = 90
    },
    update: (b, ctx) => {
      if (b.mode === 'paw') {
        b.face = dirTo(b, ctx)
        if (--b.timer <= 0) {
          if (b.hp <= b.maxHp / 2 && b.n[0] !== 1) {
            b.mode = 'stamp'
            b.timer = 50
            b.n[0] = 1
            ctx.sound('warn')
          } else {
            b.mode = 'charge'
            b.n[0] = 0
            b.vx = b.face * 3.4 * ctx.speed
            ctx.sound('warn')
          }
        }
      } else if (b.mode === 'stamp') {
        if (--b.timer === 20) {
          ctx.sound('boom')
          for (let i = 0; i < 4; i++)
            ctx.bolt({
              kind: 'bone',
              x: ctx.arenaL + 30 + ctx.rng() * (ctx.arenaR - ctx.arenaL - 60),
              y: -10 - i * 30,
              vx: 0,
              vy: 0.5,
              grav: 0.12,
              life: 160,
              arm: 0,
              hw: 5,
              hh: 5,
            })
        }
        if (b.timer <= 0) {
          b.mode = 'paw'
          b.timer = 50
        }
      } else if (b.mode === 'charge') {
        b.x += b.vx
        if (b.x < ctx.arenaL + 20 || b.x > ctx.arenaR - 16) {
          b.x = Math.max(ctx.arenaL + 20, Math.min(ctx.arenaR - 16, b.x))
          b.mode = 'stunned'
          b.timer = 80
          ctx.sound('boom')
        }
      } else if (--b.timer <= 0) {
        b.mode = 'paw'
        b.timer = Math.max(30, 64 - ctx.tier * 6)
      }
    },
    immune: (b) => b.mode === 'charge',
    contact: () => ({ hw: 15, height: 22 }),
  },
}

export function makeBoss(
  id: BossId,
  x: number,
  groundY: number,
  ctx: BossCtx,
): Boss {
  const def = BOSSES[id]
  const hp = Math.round((def?.hp ?? 20) * (1 + (ctx.tier - 1) * 0.35))
  const b: Boss = {
    id,
    x,
    y: groundY,
    vx: 0,
    vy: 0,
    hp,
    maxHp: hp,
    t: 0,
    flash: 0,
    mode: 'idle',
    timer: 60,
    dying: 0,
    phase: 1,
    face: -1,
    n: [0, 0, 0, 0],
  }
  def?.create(b, ctx)
  return b
}
