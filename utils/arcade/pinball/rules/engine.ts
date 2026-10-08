// /utils/arcade/pinball/rules/engine.ts
//
// The rules layer (conductor kind-pinball/t-004, shots in t-018): a pure
// reducer from switch events to new state plus effects. It never touches
// physics, meshes or audio; the runtime applies the effects. Plain data in,
// plain data out, so tests can replay a game without WebGL.
//
// It runs the ball cycle, recognises shots (rules/shots.ts) and drives the
// A-M-I drop bank: knocking all three down opens the lock, and a locked
// ball (or a new ball) raises them again. Table 1's scoring and features
// (t-007: skill shot, combos, multiball, the village map, the wizard mode,
// extra ball, ball save, bonus and match) live in rules/features.ts and ride
// on this reducer in `state.play`.
//
// The hidden sub-table (t-011, rules in t-012: rules/subTable.ts): locking
// balls is the feat that opens the secret door for a short while, harder on
// each visit, with only teases on the DMD. A ball through the door is a
// discovery and starts the room's NET RUN hurry-up; what it earns there rides
// back home through HOME (or past the room's flippers).
//
// Physics-feel rules (t-005): the left outlane kickback is lit at the start
// of each ball, fires once, and is relit by knocking down the A-M-I bank.
// The tilt bob: a nudge while the bob is still swinging from the last one is
// a warning; two warnings, then the next makes it TILT, which kills the
// flippers until the ball drains.

import { PHYSICS_HZ } from '../clock'
import type { RuleEffect, ShotDef, ShotEvent, SwitchEvent } from '../types'
import {
  award,
  ballOver,
  bumper,
  initialFeatures,
  match,
  multiballDrain,
  newBall,
  plunged,
  shot as featureShot,
  tickFeatures,
  type FeatureState,
} from './features'
import { initialShotProgress, recognizeShots, type ShotProgress } from './shots'
import {
  enterRoom,
  initialSubTable,
  leaveRoom,
  lockFeat,
  NET_TARGETS,
  netHit,
  tickSubTable,
  type SubTableState,
} from './subTable'
import { VALUES } from './village'

export type RulesEvent =
  | { type: 'switch'; event: SwitchEvent; tick?: number }
  | { type: 'start' }
  /** Time passing (physics steps), for timers such as the secret door. */
  | { type: 'tick'; tick: number }
  /** The player nudged the cabinet. */
  | { type: 'nudge'; tick: number }

export type { SubTableState }
export { SECRET_DOOR_STEPS } from './subTable'

export type PinballRulesState = {
  score: number
  /** The ball being played, from 1. */
  ball: number
  /** Balls left including the one in play. */
  lives: number
  /** Balls on the table right now. */
  ballsInPlay: number
  over: boolean
  /** Switch closures this game, by switch id (for tuning and tests). */
  switches: Record<string, number>
  /** Completed shots this game, by shot id. */
  shotsMade: Record<string, number>
  /** Drop targets currently down, by bank. */
  dropsDown: Record<string, string[]>
  shotProgress: ShotProgress
  sub: SubTableState
  /** The end-of-ball bonus multiplier; the sub-table's reward rides back on it. */
  bonusMultiplier: number
  /** The left outlane kickback will fire. */
  kickbackLit: boolean
  /** Tilt warnings this ball, and whether it has tilted. */
  tiltWarnings: number
  tilted: boolean
  /** When the tilt bob was last set swinging (physics step), or -Infinity. */
  lastNudgeAt: number
  /** Table 1's features (rules/features.ts). */
  play: FeatureState
}

/** A new game of `balls` balls; `seed` drives its random picks. */
export function initialRules(balls: number, seed = 1): PinballRulesState {
  return {
    score: 0,
    ball: 0,
    lives: balls,
    ballsInPlay: 0,
    over: false,
    switches: {},
    shotsMade: {},
    dropsDown: {},
    shotProgress: initialShotProgress(),
    sub: initialSubTable(),
    bonusMultiplier: 1,
    kickbackLit: true,
    tiltWarnings: 0,
    tilted: false,
    lastNudgeAt: -Infinity,
    play: initialFeatures(seed),
  }
}

const DROP_BANK_SIZE: Record<string, number> = { ami: 3 }
/** The tilt bob swings this long after a nudge; another nudge inside it warns. */
export const TILT_BOB_STEPS = Math.round(PHYSICS_HZ * 1.5)
/** Warnings before the next swing tilts the machine. */
export const TILT_WARNINGS = 2

export type RulesContext = { shots: ShotDef[] }

export function stepRules(
  state: PinballRulesState,
  event: RulesEvent,
  context: RulesContext = { shots: [] },
): { state: PinballRulesState; effects: RuleEffect[] } {
  if (state.over) return { state, effects: [] }
  if (event.type === 'tick') {
    const next = { ...state }
    const effects: RuleEffect[] = []
    tickSubTable(next, event.tick, effects)
    tickFeatures(next, event.tick, effects)
    if (next.sub === state.sub && next.play === state.play)
      return { state, effects: [] }
    return { state: next, effects }
  }
  if (event.type === 'nudge') return nudge(state, event.tick)
  if (event.type === 'start') {
    return {
      state: { ...state, ball: 1, ballsInPlay: 1 },
      effects: [
        { type: 'serve-ball' },
        { type: 'dmd', text: 'BALL 1', ms: 1500, scene: 'ball', value: 1 },
      ],
    }
  }
  const sw = event.event
  const tick = event.tick ?? 0
  const speed =
    sw.type === 'contact' || sw.type === 'spin'
      ? sw.type === 'spin'
        ? sw.speed
        : sw.impulse
      : 0
  const recognized = recognizeShots(
    context.shots,
    state.shotProgress,
    sw,
    tick,
    speed,
  )
  let next: PinballRulesState = { ...state, shotProgress: recognized.progress }
  const effects: RuleEffect[] = []
  for (const shot of recognized.completed) applyShot(next, shot, tick, effects)
  next = { ...next }

  if (sw.type === 'drain') {
    if (next.ballsInPlay > 1) {
      multiballDrain(next, tick, effects)
      return { state: next, effects }
    }
    const outcome = ballOver(next, tick, effects)
    if (outcome === 'saved') return { state: next, effects }
    effects.push({ type: 'sound', name: 'drain' })
    let lives = next.lives
    let ball = next.ball
    if (outcome === 'next') {
      lives--
      ball++
      if (lives <= 0) {
        if (match(next, effects)) {
          lives = 1
        } else {
          effects.push(
            { type: 'dmd', text: 'GAME OVER', ms: 4000, scene: 'game-over' },
            { type: 'game-over' },
          )
          return {
            state: { ...next, ballsInPlay: 0, lives: 0, over: true },
            effects,
          }
        }
      }
    }
    effects.push(
      { type: 'mechanism', id: 'ami', action: 'reset' },
      { type: 'serve-ball' },
      outcome === 'extra'
        ? { type: 'dmd', text: 'SHOOT AGAIN', ms: 2500, scene: 'extra-ball' }
        : {
            type: 'dmd',
            text: `BALL ${ball}`,
            ms: 1500,
            scene: 'ball',
            value: ball,
          },
    )
    if (next.sub.doorOpen) {
      effects.push({ type: 'mechanism', id: 'secret-door', action: 'close' })
    }
    if (next.tilted) {
      effects.push(
        { type: 'mechanism', id: 'flippers', action: 'enable' },
        { type: 'dmd-clear', scene: 'tilt' },
      )
    }
    newBall(next)
    return {
      state: {
        ...next,
        ball,
        lives,
        ballsInPlay: 1,
        dropsDown: {},
        sub: { ...next.sub, doorOpen: false, nets: [], inRoom: false },
        bonusMultiplier: 1,
        kickbackLit: true,
        tiltWarnings: 0,
        tilted: false,
        lastNudgeAt: -Infinity,
      },
      effects,
    }
  }

  if (sw.type === 'drop') {
    const down = [...(next.dropsDown[sw.bank] ?? []), sw.id]
    next.dropsDown = { ...next.dropsDown, [sw.bank]: down }
    award(next, VALUES.drop)
    effects.push({ type: 'sound', name: 'drop' })
    if (down.length >= (DROP_BANK_SIZE[sw.bank] ?? Infinity)) {
      effects.push({ type: 'dmd', text: 'LOCK IS LIT', ms: 1500 })
      if (sw.bank === 'ami' && !next.kickbackLit) {
        next.kickbackLit = true
        effects.push({ type: 'dmd', text: 'KICKBACK LIT', ms: 1200 })
      }
    }
    return { state: next, effects }
  }

  if (sw.type === 'capture') {
    if (sw.id === 'lock') {
      next.dropsDown = { ...next.dropsDown, ami: [] }
      effects.push({ type: 'mechanism', id: 'ami', action: 'reset' })
      lockFeat(next, tick, effects)
    } else if (sw.id === 'secret-hole') {
      enterRoom(next, tick, effects)
    } else if (sw.id === 'sub-home' || sw.id === 'sub-drain') {
      leaveRoom(next, sw.id === 'sub-home', tick, effects)
    }
    effects.push({ type: 'sound', name: 'scoop' })
    return { state: next, effects }
  }

  if (sw.type === 'eject') {
    effects.push({ type: 'sound', name: 'kickout' })
    return { state: next, effects }
  }

  if (sw.type === 'sensor-enter' && sw.id === 'kickback') {
    if (next.kickbackLit && !next.tilted) {
      next.kickbackLit = false
      effects.push(
        { type: 'mechanism', id: 'kickback', action: 'fire' },
        { type: 'sound', name: 'kickback' },
        { type: 'dmd', text: 'KICKBACK', ms: 1200 },
      )
    }
    return { state: next, effects }
  }

  if (
    sw.type === 'contact' ||
    sw.type === 'sensor-enter' ||
    sw.type === 'spin'
  ) {
    next.switches = {
      ...next.switches,
      [sw.id]: (next.switches[sw.id] ?? 0) + 1,
    }
    if (sw.type === 'sensor-enter' && sw.id === 'shooter-exit') {
      plunged(next, tick, effects)
    } else if (NET_TARGETS.includes(sw.id)) {
      netHit(next, sw.id, effects)
    } else if (sw.id.startsWith('pop-')) {
      bumper(next)
      effects.push(
        { type: 'sound', name: 'pop' },
        { type: 'mechanism', id: sw.id, action: 'flash' },
      )
    } else if (sw.id.startsWith('sling-') && sw.id.endsWith('kicker')) {
      award(next, VALUES.sling)
      effects.push({ type: 'sound', name: 'sling' })
    } else if (sw.type === 'spin') {
      award(next, VALUES.spin)
      effects.push({ type: 'sound', name: 'spinner' })
    }
  }
  return { state: next, effects }
}

/**
 * The tilt bob. A lone nudge is free; a nudge while the bob is still swinging
 * from the last one is a warning, and once the warnings are used up the next
 * one tilts the machine: the flippers die until the ball drains.
 */
function nudge(
  state: PinballRulesState,
  tick: number,
): { state: PinballRulesState; effects: RuleEffect[] } {
  if (state.tilted) return { state, effects: [] }
  const swinging = tick - state.lastNudgeAt < TILT_BOB_STEPS
  const next = { ...state, lastNudgeAt: tick }
  if (!swinging) return { state: next, effects: [] }
  if (state.tiltWarnings >= TILT_WARNINGS) {
    return {
      state: { ...next, tilted: true, kickbackLit: false },
      effects: [
        { type: 'mechanism', id: 'flippers', action: 'disable' },
        { type: 'sound', name: 'tilt' },
        { type: 'dmd', text: 'TILT', ms: 3000, scene: 'tilt' },
      ],
    }
  }
  const warnings = state.tiltWarnings + 1
  return {
    state: { ...next, tiltWarnings: warnings },
    effects: [
      { type: 'sound', name: 'tilt-warning' },
      {
        type: 'dmd',
        text: warnings === 1 ? 'WARNING' : 'DANGER',
        ms: 1200,
        scene: 'tilt-warning',
      },
    ],
  }
}

function applyShot(
  state: PinballRulesState,
  shot: ShotEvent,
  tick: number,
  effects: RuleEffect[],
) {
  state.shotsMade = {
    ...state.shotsMade,
    [shot.shotId]: (state.shotsMade[shot.shotId] ?? 0) + 1,
  }
  effects.push(
    { type: 'sound', name: 'shot' },
    { type: 'mechanism', id: shot.shotId, action: 'flash' },
  )
  // A shot that meant something says so; any other names itself.
  if (!featureShot(state, shot.shotId, shot.comboEligible, tick, effects))
    effects.push({
      type: 'dmd',
      text: shot.shotId.replace(/-/g, ' ').toUpperCase(),
      ms: 1200,
    })
}
