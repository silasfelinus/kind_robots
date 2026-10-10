// /utils/arcade/pinball/rules/ridge.ts
//
// The Ridge's rules (conductor kind-pinball/t-022), on the reducer in
// rules/engine.ts. The Ridge is the upper playfield past the arch: the upper
// feed (shot 3) is its way up, a subway to the kicker at its far corner, and
// a one-way gate in the arch's crown is its way home, above the pops.
//
// Up there: the S-K-Y lanes across the top, three pop bumpers, and the
// cloud standups down the left side. All three S-K-Y lanes: SKY HIGH, +1x
// bonus and the village saucer relit if it was out. All three clouds: the
// kickback relit if it was used, or a CLOUD BURST of points. Coming home
// through the gate pays a RIDGE RUN for every switch the ball made up there.
// The lanes and clouds stay lit from ball to ball until they are completed.

import type { RuleEffect } from '../types'
import type { PinballRulesState } from './engine'
import { award, bumper, relightSaucer } from './features'

export type RidgeState = {
  /** S-K-Y lanes made toward the next SKY HIGH. */
  sky: string[]
  /** Cloud standups lit toward the next CLOUD BURST. */
  clouds: string[]
  /** Times a ball has come up onto the Ridge this game. */
  visits: number
  /** A ball is up there now, and the switches it has made on this visit. */
  up: boolean
  hits: number
  /** Lookouts made this ball (each is worth more). */
  lookouts: number
}

export function initialRidge(): RidgeState {
  return { sky: [], clouds: [], visits: 0, up: false, hits: 0, lookouts: 0 }
}

export const SKY_LANES = ['sky-s', 'sky-k', 'sky-y']
export const CLOUD_TARGETS = ['cloud-1', 'cloud-2', 'cloud-3']
export const RIDGE_NAME = 'THE RIDGE'
export const RIDGE_VALUES = {
  visit: 25_000,
  lane: 5_000,
  skyHigh: 75_000,
  cloud: 5_000,
  cloudBurst: 150_000,
  runBase: 10_000,
  runPerHit: 5_000,
  lookout: 50_000,
} as const

/** The upper feed's subway has brought a ball up onto the Ridge. */
export function reachRidge(state: PinballRulesState, effects: RuleEffect[]) {
  const ridge = state.ridge
  state.ridge = { ...ridge, visits: ridge.visits + 1, up: true, hits: 0 }
  award(state, RIDGE_VALUES.visit)
  effects.push({
    type: 'dmd',
    text: RIDGE_NAME,
    sub: 'MAKE S-K-Y FOR 1X',
    ms: 1500,
  })
}

/** A switch on the Ridge; false when `id` is not one of its switches. */
export function ridgeSwitch(
  state: PinballRulesState,
  id: string,
  effects: RuleEffect[],
): boolean {
  if (SKY_LANES.includes(id)) {
    countHit(state)
    skyLane(state, id, effects)
    return true
  }
  if (CLOUD_TARGETS.includes(id)) {
    countHit(state)
    cloud(state, id, effects)
    return true
  }
  if (id.startsWith('ridge-pop-')) {
    countHit(state)
    bumper(state)
    effects.push(
      { type: 'sound', name: 'pop' },
      { type: 'mechanism', id, action: 'flash' },
    )
    return true
  }
  if (id === 'ridge-exit') {
    comeHome(state, effects)
    return true
  }
  return false
}

/** A new ball: nobody is on the Ridge; its lanes and clouds stay lit. */
export function ridgeNewBall(state: PinballRulesState) {
  state.ridge = { ...state.ridge, up: false, hits: 0, lookouts: 0 }
}

/**
 * The Lookout (t-023), the left Ridge flipper's cross shot: points that grow
 * with each one this ball, and the next unmade S-K-Y lane spotted (so a
 * third Lookout in a row is a SKY HIGH).
 */
export function lookout(state: PinballRulesState, effects: RuleEffect[]) {
  countHit(state)
  const made = state.ridge.lookouts + 1
  state.ridge = { ...state.ridge, lookouts: made }
  const value = RIDGE_VALUES.lookout * made
  award(state, value)
  effects.push({
    type: 'dmd',
    text: 'LOOKOUT',
    sub: made > 1 ? `${made}X` : 'A LANE SPOTTED',
    ms: 1400,
    scene: 'jackpot',
    value,
  })
  const next = SKY_LANES.find((id) => !state.ridge.sky.includes(id))
  if (next) skyLane(state, next, effects)
}

function countHit(state: PinballRulesState) {
  if (state.ridge.up)
    state.ridge = { ...state.ridge, hits: state.ridge.hits + 1 }
}

function skyLane(state: PinballRulesState, id: string, effects: RuleEffect[]) {
  award(state, RIDGE_VALUES.lane)
  effects.push({ type: 'sound', name: 'shot' })
  const sky = state.ridge.sky.includes(id)
    ? state.ridge.sky
    : [...state.ridge.sky, id]
  if (sky.length < SKY_LANES.length) {
    state.ridge = { ...state.ridge, sky }
    return
  }
  state.ridge = { ...state.ridge, sky: [] }
  state.bonusMultiplier += 1
  award(state, RIDGE_VALUES.skyHigh)
  const relit = relightSaucer(state)
  effects.push(
    { type: 'sound', name: 'mode-complete' },
    {
      type: 'dmd',
      text: 'SKY HIGH',
      sub: relit
        ? `BONUS ${state.bonusMultiplier}X  VILLAGE LIT`
        : `BONUS ${state.bonusMultiplier}X`,
      ms: 2000,
    },
  )
}

function cloud(state: PinballRulesState, id: string, effects: RuleEffect[]) {
  award(state, RIDGE_VALUES.cloud)
  effects.push({ type: 'sound', name: 'drop' })
  const clouds = state.ridge.clouds.includes(id)
    ? state.ridge.clouds
    : [...state.ridge.clouds, id]
  if (clouds.length < CLOUD_TARGETS.length) {
    state.ridge = { ...state.ridge, clouds }
    return
  }
  state.ridge = { ...state.ridge, clouds: [] }
  if (!state.kickbackLit && !state.tilted) {
    state.kickbackLit = true
    effects.push({
      type: 'dmd',
      text: 'CLOUD BURST',
      sub: 'KICKBACK LIT',
      ms: 1600,
    })
    return
  }
  award(state, RIDGE_VALUES.cloudBurst)
  effects.push(
    { type: 'sound', name: 'jackpot' },
    {
      type: 'dmd',
      text: 'CLOUD BURST',
      ms: 1600,
      scene: 'jackpot',
      value: RIDGE_VALUES.cloudBurst,
    },
  )
}

/** Down through the gate: the visit's RIDGE RUN. */
function comeHome(state: PinballRulesState, effects: RuleEffect[]) {
  const ridge = state.ridge
  if (!ridge.up) return
  const value = RIDGE_VALUES.runBase + RIDGE_VALUES.runPerHit * ridge.hits
  state.ridge = { ...ridge, up: false, hits: 0 }
  award(state, value)
  effects.push({
    type: 'dmd',
    text: 'RIDGE RUN',
    ms: 1400,
    scene: 'jackpot',
    value,
  })
}
