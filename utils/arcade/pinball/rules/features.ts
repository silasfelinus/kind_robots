// /utils/arcade/pinball/rules/features.ts
//
// Table 1's rules depth (conductor kind-pinball/t-007), on the reducer in
// rules/engine.ts: the skill shot, combos, locks and AMI multiball with its
// jackpots, the village map and its twelve timed modes, the Malaria-Free
// wizard mode, the extra ball, ball save, the end-of-ball bonus and match.
//
// Everything here is plain serializable state, changed only by switch, shot
// and tick events, so a replayed game is the same game. Random picks (the
// skill shot's bumper, the next village, the match number) come from a seed
// that rides in the state. The functions take the engine's working copy and
// replace nested objects rather than mutating them, so the state before an
// event is never touched (the light shows compare before and after).

import type { RuleEffect } from '../types'
import type { PinballRulesState } from './engine'
import {
  ARROW_SHOTS,
  BALL_SAVE_STEPS,
  COMBO_STEPS,
  EXTRA_BALL_AT,
  FIRST_MULTIBALL_LOCKS,
  JACKPOTS_FOR_SUPER,
  LOCKS_FOR_MULTIBALL,
  MULTIBALL_ADDS,
  ORBIT_SHOTS,
  RAMP_SHOTS,
  RAMPS_TO_RELIGHT,
  SKILL_STEPS,
  SKILL_TARGETS,
  VALUES,
  VILLAGES,
  WIZARD_ADDS,
  WIZARD_AT,
  WIZARD_NAME,
  nextRandom,
  pick,
} from './village'
import { PHYSICS_HZ } from '../clock'

export type ModeState = {
  /** Index into VILLAGES. */
  village: number
  hits: number
  endsAt: number
  total: number
  /** The whole seconds last put on the DMD timer. */
  shown: number
  /** The clock stopped here while the ball is in the hidden room, or null. */
  pausedAt: number | null
}

export type FeatureState = {
  skill: { target: string; armed: boolean; until: number }
  combo: { count: number; lastAt: number }
  /** Balls locked toward the next multiball. */
  locks: number
  /** Multiballs started this game (the first needs fewer locks). */
  multiballs: number
  multiball: { running: boolean; jackpots: number; superLit: boolean }
  villages: {
    /** Villages played, in order, as indexes into VILLAGES. */
    visited: number[]
    saved: number
    /** The award saucer will start the next village (or the wizard mode). */
    scoopLit: boolean
    rampsToRelight: number
    mode: ModeState | null
  }
  wizard: { running: boolean; hits: number; total: number }
  extraBallLit: boolean
  /** Extra balls earned and not yet played. */
  extraBalls: number
  /** Jackpots are worth this many times over (the hidden room doubles them). */
  jackpotX: number
  /** Ball save: armed until the plunge, then good until `until`. */
  ballSave: { armed: boolean; until: number }
  /** This ball's counts, for the end-of-ball bonus. */
  stats: { ramps: number; orbits: number; locks: number; villages: number }
  seed: number
}

export function initialFeatures(seed: number): FeatureState {
  const [target, next] = pick(SKILL_TARGETS, seed >>> 0)
  return {
    skill: { target, armed: true, until: Number.POSITIVE_INFINITY },
    combo: { count: 0, lastAt: Number.NEGATIVE_INFINITY },
    locks: 0,
    multiballs: 0,
    multiball: { running: false, jackpots: 0, superLit: false },
    villages: {
      visited: [],
      saved: 0,
      scoopLit: true,
      rampsToRelight: 0,
      mode: null,
    },
    wizard: { running: false, hits: 0, total: 0 },
    extraBallLit: false,
    extraBalls: 0,
    jackpotX: 1,
    ballSave: { armed: true, until: Number.NEGATIVE_INFINITY },
    stats: { ramps: 0, orbits: 0, locks: 0, villages: 0 },
    seed: next,
  }
}

/** Points, unless the machine has tilted. */
export function award(state: PinballRulesState, points: number) {
  if (!state.tilted) state.score += points
}

/** A new ball on the plunger: a fresh skill shot, ball save and counts. */
export function newBall(state: PinballRulesState) {
  const [target, seed] = pick(SKILL_TARGETS, state.play.seed)
  state.play = {
    ...state.play,
    skill: { target, armed: true, until: Number.POSITIVE_INFINITY },
    combo: { count: 0, lastAt: Number.NEGATIVE_INFINITY },
    ballSave: { armed: true, until: Number.NEGATIVE_INFINITY },
    stats: { ramps: 0, orbits: 0, locks: 0, villages: 0 },
    seed,
  }
}

/** The plunged ball crosses the lane sensor: the skill shot clock and ball save start. */
export function plunged(
  state: PinballRulesState,
  tick: number,
  effects: RuleEffect[],
) {
  const play = state.play
  const skill =
    play.skill.armed && play.skill.until === Number.POSITIVE_INFINITY
      ? { ...play.skill, until: tick + SKILL_STEPS }
      : play.skill
  const ballSave = play.ballSave.armed
    ? { armed: false, until: tick + BALL_SAVE_STEPS }
    : play.ballSave
  if (skill !== play.skill)
    effects.push({
      type: 'dmd',
      text: 'SKILL SHOT',
      sub: `SHOOT THE ${skill.target.replace(/-/g, ' ').toUpperCase()}`,
      ms: 1500,
    })
  state.play = { ...play, skill, ballSave }
}

/** A bumper hit. */
export function bumper(state: PinballRulesState) {
  award(state, VALUES.pop)
}

/** The first shot after the plunge: the skill shot if it is the lit one. */
function skillShot(
  state: PinballRulesState,
  id: string,
  tick: number,
  effects: RuleEffect[],
): boolean {
  const skill = state.play.skill
  if (!skill.armed || skill.until === Number.POSITIVE_INFINITY) return false
  state.play = { ...state.play, skill: { ...skill, armed: false } }
  if (id !== skill.target || tick > skill.until) return false
  award(state, VALUES.skillShot)
  effects.push(
    { type: 'sound', name: 'skill-shot' },
    {
      type: 'dmd',
      text: 'SKILL SHOT',
      ms: 2000,
      scene: 'skill-shot',
      value: VALUES.skillShot,
    },
  )
  return true
}

const SHOT_VALUE: Record<string, number> = {
  'left-ramp': VALUES.ramp,
  'right-ramp': VALUES.ramp,
  'left-orbit': VALUES.orbit,
  'right-orbit': VALUES.orbit,
  'upper-feed': VALUES.upperFeed,
  award: VALUES.scoop,
}

/**
 * A completed shot. Returns true when it said something on the DMD of its
 * own, so the engine leaves out the plain shot-name message.
 */
export function shot(
  state: PinballRulesState,
  id: string,
  comboEligible: boolean,
  tick: number,
  effects: RuleEffect[],
): boolean {
  if (state.tilted) return false
  let spoke = skillShot(state, id, tick, effects)
  award(state, SHOT_VALUE[id] ?? 0)
  const isRamp = RAMP_SHOTS.includes(id)
  if (isRamp || ORBIT_SHOTS.includes(id)) {
    const stats = state.play.stats
    state.play = {
      ...state.play,
      stats: {
        ...stats,
        ramps: stats.ramps + (isRamp ? 1 : 0),
        orbits: stats.orbits + (isRamp ? 0 : 1),
      },
    }
  }
  if (comboEligible) spoke = combo(state, tick, effects) || spoke
  // Before the mode: the ramp that ends a village does not count toward
  // relighting the saucer for the next one.
  if (isRamp || ORBIT_SHOTS.includes(id))
    spoke = relight(state, effects) || spoke
  if (state.play.wizard.running && ARROW_SHOTS.includes(id))
    return wizardShot(state, effects)
  if (state.play.multiball.running) spoke = jackpot(state, id, effects) || spoke
  if (state.play.villages.mode)
    spoke = modeShot(state, id, tick, effects) || spoke
  if (id === 'upper-feed' && state.play.extraBallLit) {
    state.play = {
      ...state.play,
      extraBallLit: false,
      extraBalls: state.play.extraBalls + 1,
    }
    effects.push(
      { type: 'sound', name: 'extra-ball' },
      { type: 'dmd', text: 'EXTRA BALL', ms: 2500, scene: 'extra-ball' },
    )
    spoke = true
  }
  if (id === 'lock') spoke = lock(state, tick, effects) || spoke
  if (id === 'award') spoke = saucer(state, tick, effects) || spoke
  return spoke
}

/** Ramps and orbits chained quickly are a combo, worth more each step. */
function combo(
  state: PinballRulesState,
  tick: number,
  effects: RuleEffect[],
): boolean {
  const last = state.play.combo
  const chained = tick - last.lastAt <= COMBO_STEPS
  const count = chained ? last.count + 1 : 0
  state.play = { ...state.play, combo: { count, lastAt: tick } }
  if (!chained) return false
  const points = VALUES.comboBase * count
  award(state, points)
  effects.push(
    { type: 'sound', name: 'combo' },
    {
      type: 'dmd',
      text: `${count + 1}-WAY COMBO`,
      sub: points.toLocaleString('en-US'),
      ms: 1400,
    },
  )
  return true
}

function jackpot(
  state: PinballRulesState,
  id: string,
  effects: RuleEffect[],
): boolean {
  const mb = state.play.multiball
  if (RAMP_SHOTS.includes(id)) {
    const value =
      (VALUES.jackpot + VALUES.jackpotStep * mb.jackpots) * state.play.jackpotX
    const jackpots = mb.jackpots + 1
    award(state, value)
    state.play = {
      ...state.play,
      multiball: {
        ...mb,
        jackpots,
        superLit: mb.superLit || jackpots >= JACKPOTS_FOR_SUPER,
      },
    }
    effects.push(
      { type: 'sound', name: 'jackpot' },
      { type: 'dmd', text: 'JACKPOT', ms: 2000, scene: 'jackpot', value },
    )
    return true
  }
  if (id === 'lock' && mb.superLit) {
    const value = VALUES.superJackpot * state.play.jackpotX
    award(state, value)
    state.play = {
      ...state.play,
      multiball: { ...mb, jackpots: 0, superLit: false },
    }
    effects.push(
      { type: 'sound', name: 'super-jackpot' },
      {
        type: 'dmd',
        text: 'SUPER JACKPOT',
        ms: 2500,
        scene: 'super-jackpot',
        value,
      },
    )
    return true
  }
  return false
}

/** Balls join the table from the plunger, auto-launched, with a ball save. */
function addBalls(
  state: PinballRulesState,
  count: number,
  tick: number,
  effects: RuleEffect[],
) {
  state.ballsInPlay += count
  state.play = {
    ...state.play,
    ballSave: { armed: false, until: tick + BALL_SAVE_STEPS },
  }
  effects.push({ type: 'add-ball', count })
}

/**
 * The lock, the Care Package Depot (t-031): lit by the A-M-I bank, each ball
 * it collects is packed as a care package, and the last one needed starts
 * AMI multiball as the packages go out to the village.
 */
function lock(
  state: PinballRulesState,
  tick: number,
  effects: RuleEffect[],
): boolean {
  const lit = (state.dropsDown.ami ?? []).length >= 3
  const play = state.play
  if (!lit || play.multiball.running || play.wizard.running) {
    award(state, VALUES.scoop)
    return false
  }
  award(state, VALUES.lock)
  const locks = play.locks + 1
  state.play = {
    ...play,
    locks,
    stats: { ...play.stats, locks: play.stats.locks + 1 },
  }
  const needed =
    play.multiballs === 0 ? FIRST_MULTIBALL_LOCKS : LOCKS_FOR_MULTIBALL
  if (locks < needed) {
    effects.push(
      { type: 'sound', name: 'lock' },
      {
        type: 'dmd',
        text: `PACKAGE ${locks}`,
        sub: `${needed - locks} MORE TO SEND`,
        ms: 2000,
        scene: 'lock',
      },
    )
    return true
  }
  state.play = {
    ...state.play,
    locks: 0,
    multiballs: play.multiballs + 1,
    multiball: { running: true, jackpots: 0, superLit: false },
  }
  addBalls(state, MULTIBALL_ADDS, tick, effects)
  effects.push(
    { type: 'sound', name: 'multiball' },
    {
      type: 'dmd',
      text: 'AMI MULTIBALL',
      sub: 'CARE PACKAGES OUT',
      ms: 2500,
      scene: 'multiball',
    },
  )
  return true
}

/** The award saucer: starts the next village, or the wizard mode once all twelve are visited. */
function saucer(
  state: PinballRulesState,
  tick: number,
  effects: RuleEffect[],
): boolean {
  const play = state.play
  const v = play.villages
  if (!v.scoopLit || v.mode || play.wizard.running) return false
  if (v.visited.length >= WIZARD_AT) {
    state.play = {
      ...play,
      villages: { ...v, scoopLit: false },
      wizard: { running: true, hits: 0, total: 0 },
    }
    addBalls(state, WIZARD_ADDS, tick, effects)
    effects.push(
      { type: 'sound', name: 'wizard' },
      { type: 'dmd', text: WIZARD_NAME, ms: 3000, scene: 'wizard' },
    )
    return true
  }
  const open = VILLAGES.map((_, i) => i).filter((i) => !v.visited.includes(i))
  const [village, seed] = pick(open, play.seed)
  const def = VILLAGES[village]!
  const visited = [...v.visited, village]
  award(state, VALUES.villageVisited)
  state.play = {
    ...play,
    seed,
    villages: {
      ...v,
      visited,
      scoopLit: false,
      mode: {
        village,
        hits: 0,
        endsAt: tick + def.seconds * PHYSICS_HZ,
        total: 0,
        shown: def.seconds,
        pausedAt: null,
      },
    },
    stats: { ...play.stats, villages: play.stats.villages + 1 },
    extraBallLit: play.extraBallLit || visited.length === EXTRA_BALL_AT,
  }
  effects.push(
    { type: 'sound', name: 'mode-start' },
    {
      type: 'dmd',
      text: def.name,
      sub: def.hint,
      ms: 2200,
      scene: 'mode-intro',
    },
    timer(state.play.villages.mode!),
  )
  if (visited.length === EXTRA_BALL_AT)
    effects.push({ type: 'dmd', text: 'EXTRA BALL IS LIT', ms: 1500 })
  return true
}

/** The mode countdown on the DMD: the village, its shots made and the seconds left. */
function timer(mode: ModeState): RuleEffect {
  const def = VILLAGES[mode.village]!
  return {
    type: 'dmd',
    text: def.name,
    sub: `${mode.hits} OF ${def.need}`,
    ms: 0,
    scene: 'mode-timer',
    value: mode.shown,
  }
}

function modeShot(
  state: PinballRulesState,
  id: string,
  tick: number,
  effects: RuleEffect[],
): boolean {
  const mode = state.play.villages.mode!
  const def = VILLAGES[mode.village]!
  if (mode.pausedAt !== null) return false
  if (!def.shots.includes(id) || tick >= mode.endsAt) return false
  const hits = mode.hits + 1
  const points = VALUES.modeShotBase * hits
  award(state, points)
  const next = { ...mode, hits, total: mode.total + points }
  if (hits < def.need) {
    state.play = {
      ...state.play,
      villages: { ...state.play.villages, mode: next },
    }
    effects.push({ type: 'sound', name: 'mode-shot' }, timer(next))
    return true
  }
  award(state, VALUES.modeComplete)
  next.total += VALUES.modeComplete
  state.play = {
    ...state.play,
    villages: {
      ...state.play.villages,
      saved: state.play.villages.saved + 1,
    },
  }
  endMode(state, next, `${def.name} SAVED`, effects)
  effects.push({ type: 'sound', name: 'mode-complete' })
  return true
}

/** A village's mode ends, saved or out of time; the ramps relight the saucer. */
function endMode(
  state: PinballRulesState,
  mode: ModeState,
  text: string,
  effects: RuleEffect[],
) {
  state.play = {
    ...state.play,
    villages: {
      ...state.play.villages,
      mode: null,
      scoopLit: false,
      rampsToRelight: RAMPS_TO_RELIGHT,
    },
  }
  effects.push(
    { type: 'dmd-clear', scene: 'mode-timer' },
    { type: 'dmd', text, ms: 2000, scene: 'mode-total', value: mode.total },
  )
}

/**
 * Relight the award saucer now (the Ridge's SKY HIGH), unless it is lit
 * already or a village or the wizard mode is running. True when it lit.
 */
export function relightSaucer(state: PinballRulesState): boolean {
  const v = state.play.villages
  if (v.scoopLit || v.mode || state.play.wizard.running) return false
  state.play = {
    ...state.play,
    villages: { ...v, rampsToRelight: 0, scoopLit: true },
  }
  return true
}

/** Ramps and orbits count down to relighting the saucer after a village. */
function relight(state: PinballRulesState, effects: RuleEffect[]): boolean {
  const v = state.play.villages
  if (v.scoopLit || v.mode || state.play.wizard.running) return false
  if (v.rampsToRelight > 1) {
    state.play = {
      ...state.play,
      villages: { ...v, rampsToRelight: v.rampsToRelight - 1 },
    }
    return false
  }
  state.play = {
    ...state.play,
    villages: { ...v, rampsToRelight: 0, scoopLit: true },
  }
  effects.push({
    type: 'dmd',
    text:
      v.visited.length >= WIZARD_AT ? 'WIZARD MODE IS LIT' : 'VILLAGE IS LIT',
    sub: 'SHOOT THE SAUCER',
    ms: 1500,
  })
  return true
}

function wizardShot(state: PinballRulesState, effects: RuleEffect[]): boolean {
  const w = state.play.wizard
  const value = VALUES.wizardShot + VALUES.wizardStep * w.hits
  award(state, value)
  state.play = {
    ...state.play,
    wizard: { running: true, hits: w.hits + 1, total: w.total + value },
  }
  effects.push(
    { type: 'sound', name: 'jackpot' },
    { type: 'dmd', text: 'RESCUE', ms: 2000, scene: 'jackpot', value },
  )
  return true
}

/**
 * A village rescued without playing its mode (the hidden room's reward): it
 * counts on the map toward the extra ball and the wizard mode. False when
 * every village is already on the map.
 */
export function rescueVillage(
  state: PinballRulesState,
  effects: RuleEffect[],
): boolean {
  const play = state.play
  const v = play.villages
  const busy = v.mode ? [v.mode.village] : []
  const open = VILLAGES.map((_, i) => i).filter(
    (i) => !v.visited.includes(i) && !busy.includes(i),
  )
  if (!open.length) return false
  const [village, seed] = pick(open, play.seed)
  const visited = [...v.visited, village]
  award(state, VALUES.villageVisited)
  state.play = {
    ...play,
    seed,
    villages: { ...v, visited, saved: v.saved + 1 },
    stats: { ...play.stats, villages: play.stats.villages + 1 },
    extraBallLit: play.extraBallLit || visited.length === EXTRA_BALL_AT,
  }
  if (visited.length === EXTRA_BALL_AT)
    effects.push({ type: 'dmd', text: 'EXTRA BALL IS LIT', ms: 1500 })
  return true
}

/** Time passing: the skill shot lapses and a village's clock runs. */
export function tickFeatures(
  state: PinballRulesState,
  tick: number,
  effects: RuleEffect[],
) {
  const skill = state.play.skill
  if (skill.armed && tick > skill.until)
    state.play = { ...state.play, skill: { ...skill, armed: false } }
  const mode = state.play.villages.mode
  if (!mode || mode.pausedAt !== null) return
  if (tick >= mode.endsAt) {
    endMode(state, mode, VILLAGES[mode.village]!.name, effects)
    return
  }
  const shown = Math.ceil((mode.endsAt - tick) / PHYSICS_HZ)
  if (shown === mode.shown) return
  const next = { ...mode, shown }
  state.play = {
    ...state.play,
    villages: { ...state.play.villages, mode: next },
  }
  effects.push(timer(next))
}

/** A ball drains with others still on the table; one left ends multiball. */
export function multiballDrain(
  state: PinballRulesState,
  tick: number,
  effects: RuleEffect[],
): boolean {
  if (tick < state.play.ballSave.until && !state.tilted) {
    effects.push(
      { type: 'add-ball', count: 1 },
      { type: 'dmd', text: 'BALL SAVED', ms: 1200 },
    )
    return true
  }
  state.ballsInPlay = Math.max(0, state.ballsInPlay - 1)
  if (state.ballsInPlay > 1) return true
  endMultiball(state, effects)
  return true
}

function endMultiball(state: PinballRulesState, effects: RuleEffect[]) {
  const play = state.play
  if (play.wizard.running) {
    state.play = {
      ...play,
      wizard: { running: false, hits: 0, total: 0 },
      villages: {
        ...play.villages,
        visited: [],
        saved: 0,
        scoopLit: false,
        rampsToRelight: RAMPS_TO_RELIGHT,
      },
    }
    effects.push({
      type: 'dmd',
      text: WIZARD_NAME,
      ms: 2000,
      scene: 'mode-total',
      value: play.wizard.total,
    })
  }
  if (state.play.multiball.running)
    state.play = {
      ...state.play,
      multiball: { running: false, jackpots: 0, superLit: false },
      jackpotX: 1,
    }
}

/**
 * The last ball on the table drained. Returns 'saved' (it comes straight
 * back), or the bonus to count and whether an extra ball plays next.
 */
export function ballOver(
  state: PinballRulesState,
  tick: number,
  effects: RuleEffect[],
): 'saved' | 'extra' | 'next' {
  if (tick < state.play.ballSave.until && !state.tilted) {
    state.play = {
      ...state.play,
      ballSave: { armed: false, until: Number.NEGATIVE_INFINITY },
    }
    effects.push(
      { type: 'add-ball', count: 1 },
      { type: 'dmd', text: 'BALL SAVED', ms: 1500 },
    )
    return 'saved'
  }
  endMultiball(state, effects)
  const mode = state.play.villages.mode
  if (mode) {
    state.play = {
      ...state.play,
      villages: {
        ...state.play.villages,
        mode: null,
        scoopLit: false,
        rampsToRelight: RAMPS_TO_RELIGHT,
      },
    }
    effects.push({ type: 'dmd-clear', scene: 'mode-timer' })
  }
  if (!state.tilted) bonus(state, effects)
  if (state.play.extraBalls > 0) {
    state.play = { ...state.play, extraBalls: state.play.extraBalls - 1 }
    return 'extra'
  }
  return 'next'
}

/** The end-of-ball bonus: this ball's counts, times the multiplier. */
function bonus(state: PinballRulesState, effects: RuleEffect[]) {
  const s = state.play.stats
  const items = [
    { label: 'RAMPS', value: s.ramps * VALUES.bonusRamp },
    { label: 'ORBITS', value: s.orbits * VALUES.bonusOrbit },
    { label: 'LOCKS', value: s.locks * VALUES.bonusLock },
    { label: 'VILLAGES', value: s.villages * VALUES.bonusVillage },
  ].filter((item) => item.value > 0)
  if (!items.length) return
  const total =
    items.reduce((sum, item) => sum + item.value, 0) * state.bonusMultiplier
  award(state, total)
  effects.push({
    type: 'dmd',
    text: 'BONUS',
    ms: 0,
    scene: 'bonus',
    value: state.bonusMultiplier,
    items,
  })
}

/**
 * Match, at the end of the last ball: a random digit against the score's
 * tens. A match plays one more ball. No score, no match.
 */
export function match(
  state: PinballRulesState,
  effects: RuleEffect[],
): boolean {
  const [r, seed] = nextRandom(state.play.seed)
  const digit = Math.floor(r * 10) % 10
  state.play = { ...state.play, seed }
  const won = state.score > 0 && Math.floor(state.score / 10) % 10 === digit
  if (won)
    effects.push(
      { type: 'sound', name: 'match' },
      { type: 'dmd', text: 'MATCH', ms: 3000, scene: 'match', value: digit },
    )
  return won
}
