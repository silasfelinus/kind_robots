// /utils/arcade/pinball/rules/engine.ts
//
// The rules layer (conductor kind-pinball/t-004, shots in t-018): a pure
// reducer from switch events to new state plus effects. It never touches
// physics, meshes or audio; the runtime applies the effects. Plain data in,
// plain data out, so tests can replay a game without WebGL.
//
// It runs the ball cycle, recognises shots (rules/shots.ts) and drives the
// A-M-I drop bank: knocking all three down opens the lock, and a locked
// ball (or a new ball) raises them again. Scoring stays at zero until t-007
// builds Table 1's real rules on this shape, so the 3D preview cabinet never
// posts to the leaderboard.

import type { RuleEffect, ShotDef, ShotEvent, SwitchEvent } from '../types'
import { initialShotProgress, recognizeShots, type ShotProgress } from './shots'

export type RulesEvent =
  { type: 'switch'; event: SwitchEvent; tick?: number } | { type: 'start' }

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
}

export function initialRules(balls: number): PinballRulesState {
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
  }
}

const DROP_BANK_SIZE: Record<string, number> = { ami: 3 }

export type RulesContext = { shots: ShotDef[] }

export function stepRules(
  state: PinballRulesState,
  event: RulesEvent,
  context: RulesContext = { shots: [] },
): { state: PinballRulesState; effects: RuleEffect[] } {
  if (state.over) return { state, effects: [] }
  if (event.type === 'start') {
    return {
      state: { ...state, ball: 1, ballsInPlay: 1 },
      effects: [
        { type: 'serve-ball' },
        { type: 'dmd', text: 'BALL 1', ms: 1500 },
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
  for (const shot of recognized.completed) applyShot(next, shot, effects)
  next = { ...next }

  if (sw.type === 'drain') {
    const ballsInPlay = Math.max(0, next.ballsInPlay - 1)
    if (ballsInPlay > 0) return { state: { ...next, ballsInPlay }, effects }
    const lives = next.lives - 1
    effects.push({ type: 'sound', name: 'drain' })
    if (lives <= 0) {
      effects.push(
        { type: 'dmd', text: 'GAME OVER', ms: 4000 },
        { type: 'game-over' },
      )
      return {
        state: { ...next, ballsInPlay: 0, lives: 0, over: true },
        effects,
      }
    }
    const ball = next.ball + 1
    effects.push(
      { type: 'mechanism', id: 'ami', action: 'reset' },
      { type: 'serve-ball' },
      { type: 'dmd', text: `BALL ${ball}`, ms: 1500 },
    )
    return {
      state: { ...next, ball, lives, ballsInPlay: 1, dropsDown: {} },
      effects,
    }
  }

  if (sw.type === 'drop') {
    const down = [...(next.dropsDown[sw.bank] ?? []), sw.id]
    next.dropsDown = { ...next.dropsDown, [sw.bank]: down }
    effects.push({ type: 'sound', name: 'drop' })
    if (down.length >= (DROP_BANK_SIZE[sw.bank] ?? Infinity)) {
      effects.push({ type: 'dmd', text: 'LOCK IS LIT', ms: 1500 })
    }
    return { state: next, effects }
  }

  if (sw.type === 'capture') {
    if (sw.id === 'lock') {
      next.dropsDown = { ...next.dropsDown, ami: [] }
      effects.push({ type: 'mechanism', id: 'ami', action: 'reset' })
    }
    effects.push({ type: 'sound', name: 'scoop' })
    return { state: next, effects }
  }

  if (sw.type === 'eject') {
    effects.push({ type: 'sound', name: 'kickout' })
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
    if (sw.id.startsWith('pop-')) {
      effects.push(
        { type: 'sound', name: 'pop' },
        { type: 'mechanism', id: sw.id, action: 'flash' },
      )
    } else if (sw.id.startsWith('sling-') && sw.id.endsWith('kicker')) {
      effects.push({ type: 'sound', name: 'sling' })
    } else if (sw.type === 'spin') {
      effects.push({ type: 'sound', name: 'spinner' })
    }
  }
  return { state: next, effects }
}

function applyShot(
  state: PinballRulesState,
  shot: ShotEvent,
  effects: RuleEffect[],
) {
  state.shotsMade = {
    ...state.shotsMade,
    [shot.shotId]: (state.shotsMade[shot.shotId] ?? 0) + 1,
  }
  effects.push(
    { type: 'sound', name: 'shot' },
    { type: 'mechanism', id: shot.shotId, action: 'flash' },
    {
      type: 'dmd',
      text: shot.shotId.replace(/-/g, ' ').toUpperCase(),
      ms: 1200,
    },
  )
}
