// /utils/arcade/pinball/tuning/bot.ts
//
// A headless pinball player (conductor kind-pinball/t-013), for tuning with
// evidence. It reads the balls and the rules state and returns the buttons a
// player would press, at one of three skill levels:
//
//   novice   flips at a ball coming down, late or early, and often misses
//   average  saves more, catches the ball on a held flipper and shoots from
//            the cradle, but blind
//   good     saves most balls, cradles, and aims from the measured aiming
//            chart (tuning/aim.ts) at whatever the rules have lit
//
// Seeded, so a session replays exactly.

import { emptyInput, type InputFrame } from '../../types'
import type { PinballRulesState } from '../rules/engine'
import { ARROW_SHOTS, RAMP_SHOTS, VILLAGES } from '../rules/village'
import type { BallView, FlipperDef } from '../types'
import {
  CRADLE_OFFSET,
  delaysFor,
  type AimChart,
  type FlipperSide,
} from './aim'

export type BotSkill = {
  name: string
  /** Chance of going for a ball that comes down at the flippers. */
  save: number
  /** Ticks a live flip may come early or late. */
  jitter: number
  /** Chance of catching a lone ball on a held flipper rather than hitting it. */
  cradle: number
  /** Aims cradled shots from the chart at lit targets. */
  aim: boolean
  /** Nudges a ball rolling down dead centre, between the flipper tips. */
  nudge: boolean
}

export const BOT_SKILLS: Record<'novice' | 'average' | 'good', BotSkill> = {
  novice: {
    name: 'novice',
    save: 0.6,
    jitter: 4,
    cradle: 0,
    aim: false,
    nudge: false,
  },
  average: {
    name: 'average',
    save: 0.8,
    jitter: 3,
    cradle: 0.5,
    aim: false,
    nudge: false,
  },
  good: {
    name: 'good',
    save: 0.93,
    jitter: 1,
    cradle: 0.85,
    aim: true,
    nudge: true,
  },
}

/** What the bot needs to see each tick. */
export type BotView = {
  balls: BallView[]
  rules: PinballRulesState
  ballOnPlunger: boolean
  flippers: FlipperDef[]
}

/** Ticks a flip is held. */
const FLIP_HOLD = 12
/** Ticks ahead a player reads a ball coming down (before their jitter). */
const LEAD = 2
/** Ticks between the bot's nudges: longer than the tilt bob swings. */
const NUDGE_GAP = 120
/** A ball faster than this is not caught on a held flipper. */
const CATCH_SPEED = 2.5

/** The flipper nearest a point. */
function nearest(
  flippers: FlipperDef[],
  x: number,
  z: number,
): FlipperDef | undefined {
  let best: FlipperDef | undefined
  let bestD = Infinity
  for (const f of flippers) {
    const d = Math.hypot(x - f.pivot[0], z - f.pivot[2])
    if (d < bestD) {
      best = f
      bestD = d
    }
  }
  return best
}

/** The ball's path over the next fifth of a second meets the flipper. */
function crosses(f: FlipperDef, ball: BallView): boolean {
  for (let k = 1; k <= 12; k++) {
    const x = ball.position[0] + (ball.velocity[0] * k) / 60
    const z = ball.position[2] + (ball.velocity[2] * k) / 60
    if (overFlipper(f, x, z, Infinity)) return true
  }
  return false
}

/**
 * A point within the resting flipper's reach, close to it from above. A slow
 * ball is let roll out toward the tip first, as a player waits for it: hit
 * at the pivot it only dribbles up the middle.
 */
function overFlipper(
  f: FlipperDef,
  x: number,
  z: number,
  speed: number,
): boolean {
  const toward = f.side === 'left' ? 1 : -1
  const tx = f.pivot[0] + toward * f.length * Math.cos(f.restAngle)
  const tz = f.pivot[2] + f.length * Math.sin(f.restAngle)
  const dx = tx - f.pivot[0]
  const dz = tz - f.pivot[2]
  const t = Math.max(
    0,
    Math.min(
      1,
      ((x - f.pivot[0]) * dx + (z - f.pivot[2]) * dz) / (dx * dx + dz * dz),
    ),
  )
  if (speed < 1 && t < 0.4) return false
  return Math.hypot(x - (f.pivot[0] + t * dx), z - (f.pivot[2] + t * dz)) < 0.03
}
/** A cradled ball is let go after this many ticks, give or take. */
const CRADLE_WAIT = 30
/** Delays an un-aimed cradle shot picks from (the flipper's useful range). */
const BLIND_DELAYS: [number, number] = [14, 56]

type Approach = {
  ballId: number
  save: boolean
  cradle: boolean
  at: number
  /** Tick of this ball's last flip, or null. */
  flipped: number | null
}

export class PinballBot {
  private tick = 0
  private pull = 0
  private pullTarget = 0
  private hold: Record<FlipperSide, number> = { left: 0, right: 0 }
  private approaches = new Map<number, Approach>()
  private lastNudge = -Infinity
  private cradled: {
    side: FlipperSide
    ballId: number
    since: number
    releaseAt: number
    flipAt: number
    target: string | null
  } | null = null

  /** Aimed flips, and how many made the shot they aimed at. */
  aimed = 0
  aimedHits = 0
  /** The shot the last aimed flip went for, and when (for scoring the aim). */
  lastAim: { target: string; at: number } | null = null

  constructor(
    readonly skill: BotSkill,
    private rng: () => number,
    private chart: AimChart | null = null,
  ) {}

  frame(view: BotView): InputFrame {
    this.tick++
    const frame = emptyInput()
    if (view.ballOnPlunger && !this.cradled) {
      this.plunge(frame)
      return frame
    }
    this.pull = 0
    this.pullTarget = 0
    const main = view.flippers.filter((f) => !f.id.startsWith('sub-'))
    if (this.cradled) this.shootFromCradle(view, frame)
    else this.watch(view, main, frame)
    for (const side of ['left', 'right'] as const)
      if (this.hold[side] > 0) {
        this.hold[side]--
        frame.held[side] = true
      }
    return frame
  }

  /**
   * Pull the plunger back a random amount, then let go. A plunge too weak to
   * leave the lane rolls back, and the bot pulls again.
   */
  private plunge(frame: InputFrame) {
    if (!this.pullTarget) this.pullTarget = 30 + Math.floor(this.rng() * 16)
    if (this.pull < this.pullTarget) {
      this.pull++
      frame.held.down = true
      return
    }
    this.pull = 0
    this.pullTarget = 0
  }

  /** Watch the balls coming down and decide what to do with each. */
  private watch(view: BotView, flippers: FlipperDef[], frame: InputFrame) {
    const lone = view.balls.length === 1
    for (const id of this.approaches.keys())
      if (!view.balls.some((b) => b.id === id)) this.approaches.delete(id)
    for (const ball of view.balls) {
      const room = ball.zone === 'sub-table'
      const mine = flippers.filter((f) => f.id.startsWith('sub-') === room)
      const flipper = nearest(mine, ball.position[0], ball.position[2])
      if (!flipper) continue
      const side = flipper.side
      const near =
        Math.hypot(
          ball.position[0] - flipper.pivot[0],
          ball.position[2] - flipper.pivot[2],
        ) <
        flipper.length + 0.08
      // Gone, or knocked back up the table: its next descent is a new one.
      if (!near || ball.velocity[2] < -0.3) {
        this.approaches.delete(ball.id)
        continue
      }
      let approach = this.approaches.get(ball.id)
      if (!approach) {
        if (ball.velocity[2] < 0.05) continue
        approach = {
          ballId: ball.id,
          save: this.rng() < this.skill.save,
          cradle: !room && lone && this.rng() < this.skill.cradle,
          // How far ahead the player reads the ball: a good one flips as it
          // arrives, a worse one early or late.
          at: LEAD + Math.round((this.rng() * 2 - 1) * this.skill.jitter),
          flipped: null,
        }
        this.approaches.set(ball.id, approach)
      }
      if (!approach.save) continue
      // Dead centre and slow, it will pass between the tips: shake it.
      if (
        this.skill.nudge &&
        !room &&
        Math.abs(ball.position[0]) < 0.015 &&
        ball.position[2] > -0.05 &&
        ball.speed < 0.6 &&
        this.tick - this.lastNudge > NUDGE_GAP
      ) {
        this.lastNudge = this.tick
        frame.pressed.up = true
      }
      // Catch only a ball that will land on the flipper, and slowly enough.
      if (
        approach.cradle &&
        (ball.speed > CATCH_SPEED || !crosses(flipper, ball))
      )
        approach.cradle = false
      if (approach.cradle) {
        // Catch it: hold the flipper up until the ball settles in the
        // crook by the pivot.
        this.hold[side] = Math.max(this.hold[side], 2)
        if (
          !room &&
          ball.speed < 0.04 &&
          Math.hypot(
            ball.position[0] - (flipper.pivot[0] + CRADLE_OFFSET[0]),
            ball.position[2] - (flipper.pivot[2] + CRADLE_OFFSET[1]),
          ) < 0.02
        )
          this.startCradle(view, side, ball.id)
        continue
      }
      // Flip once, when the ball (read `at` ticks ahead) is over the flipper.
      const lead = approach.at / 60
      const x = ball.position[0] + ball.velocity[0] * lead
      const z = ball.position[2] + ball.velocity[2] * lead
      // A ball that dribbles back down after a flip gets flipped at again.
      const ready =
        approach.flipped === null ||
        (this.tick - approach.flipped > FLIP_HOLD + 6 &&
          ball.velocity[2] > 0.05)
      if (ready && overFlipper(flipper, x, z, ball.speed)) {
        approach.flipped = this.tick
        this.hold[side] = Math.max(this.hold[side], FLIP_HOLD)
      }
    }
  }

  private startCradle(view: BotView, side: FlipperSide, ballId: number) {
    const target = this.skill.aim ? this.choose(view.rules, side) : null
    const options =
      target && this.chart ? delaysFor(this.chart, side, target) : []
    const delay = options.length
      ? options[Math.floor(this.rng() * options.length)]!
      : BLIND_DELAYS[0] +
        Math.floor(this.rng() * (BLIND_DELAYS[1] - BLIND_DELAYS[0]))
    const releaseAt =
      this.tick + CRADLE_WAIT + Math.floor(this.rng() * CRADLE_WAIT)
    this.cradled = {
      side,
      ballId,
      since: this.tick,
      releaseAt,
      flipAt: releaseAt + delay,
      target: options.length ? target : null,
    }
  }

  /** Hold, let go, and flip at the chosen delay. */
  private shootFromCradle(view: BotView, frame: InputFrame) {
    const c = this.cradled!
    const ball = view.balls.find((b) => b.id === c.ballId)
    if (!ball || view.balls.length > 1 || this.tick > c.flipAt + FLIP_HOLD) {
      this.cradled = null
      return
    }
    if (this.tick < c.releaseAt) {
      frame.held[c.side] = true
      return
    }
    if (this.tick === c.flipAt) {
      this.hold[c.side] = FLIP_HOLD
      if (c.target) {
        this.aimed++
        this.lastAim = { target: c.target, at: this.tick }
      }
    }
  }

  /** Called by the harness when a shot is made, to score the aim. */
  shotMade(shot: string) {
    if (
      this.lastAim &&
      this.lastAim.target === shot &&
      this.tick - this.lastAim.at < 240
    ) {
      this.aimedHits++
      this.lastAim = null
    }
  }

  /** The shot worth going for from `side`, of those the chart says it can make. */
  private choose(rules: PinballRulesState, side: FlipperSide): string | null {
    const makeable = (shot: string) =>
      !!this.chart && delaysFor(this.chart, side, shot).length > 0
    const play = rules.play
    const wanted: string[] = []
    if (play.wizard.running) wanted.push(...ARROW_SHOTS)
    if (play.multiball.superLit) wanted.push('lock')
    if (play.multiball.running) wanted.push(...RAMP_SHOTS)
    const mode = play.villages.mode
    if (mode) wanted.push(...VILLAGES[mode.village]!.shots)
    if (play.villages.scoopLit) wanted.push('award')
    if (rules.sub.doorOpen) wanted.push('left-orbit')
    if ((rules.dropsDown.ami ?? []).length >= 3) wanted.push('lock')
    if (play.extraBallLit) wanted.push('upper-feed')
    wanted.push(...RAMP_SHOTS, 'left-orbit', 'right-orbit', 'spinner')
    return wanted.find(makeable) ?? null
  }
}
