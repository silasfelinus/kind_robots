// /utils/arcade/pinball/rules/engine.ts
//
// The rules layer (conductor kind-pinball/t-004): a pure reducer from
// switch and shot events to new state plus effects. It never touches
// physics, meshes or audio; the runtime applies the effects. Plain data in,
// plain data out, so tests can replay a game without WebGL.
//
// t-004 ships the ball cycle only (serve, drain, ball count, game over).
// Scoring stays at zero until t-007 builds Table 1's real rules on this
// shape, so the 3D preview cabinet never posts to the leaderboard.

import type { RuleEffect, ShotEvent, SwitchEvent } from '../types'

export type RulesEvent =
  | { type: 'switch'; event: SwitchEvent }
  | { type: 'shot'; shot: ShotEvent }
  | { type: 'start' }

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
}

export function initialRules(balls: number): PinballRulesState {
  return {
    score: 0,
    ball: 0,
    lives: balls,
    ballsInPlay: 0,
    over: false,
    switches: {},
  }
}

export function stepRules(
  state: PinballRulesState,
  event: RulesEvent,
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
  if (event.type === 'shot') return { state, effects: [] }
  const sw = event.event
  if (sw.type === 'drain') {
    const ballsInPlay = Math.max(0, state.ballsInPlay - 1)
    if (ballsInPlay > 0)
      return { state: { ...state, ballsInPlay }, effects: [] }
    const lives = state.lives - 1
    if (lives <= 0) {
      return {
        state: { ...state, ballsInPlay: 0, lives: 0, over: true },
        effects: [
          { type: 'sound', name: 'drain' },
          { type: 'dmd', text: 'GAME OVER', ms: 4000 },
          { type: 'game-over' },
        ],
      }
    }
    const ball = state.ball + 1
    return {
      state: { ...state, ball, lives, ballsInPlay: 1 },
      effects: [
        { type: 'sound', name: 'drain' },
        { type: 'serve-ball' },
        { type: 'dmd', text: `BALL ${ball}`, ms: 1500 },
      ],
    }
  }
  if (sw.type === 'contact' || sw.type === 'sensor-enter') {
    const switches = {
      ...state.switches,
      [sw.id]: (state.switches[sw.id] ?? 0) + 1,
    }
    const effects: RuleEffect[] = sw.id.startsWith('pop-')
      ? [
          { type: 'sound', name: 'pop' },
          { type: 'mechanism', id: sw.id, action: 'flash' },
        ]
      : sw.id.startsWith('sling-') && sw.id.endsWith('kicker')
        ? [{ type: 'sound', name: 'sling' }]
        : []
    return { state: { ...state, switches }, effects }
  }
  return { state, effects: [] }
}
