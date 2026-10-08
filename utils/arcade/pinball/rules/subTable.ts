// /utils/arcade/pinball/rules/subTable.ts
//
// The hidden sub-table's rules (conductor kind-pinball/t-012), on the reducer
// in rules/engine.ts. The room itself (t-011) is geometry: a secret door in
// the left orbit, a hole behind it, a subway up into the room, N-E-T standups,
// a HOME saucer and a drain past the room's flippers, both of which send the
// ball back to the award saucer.
//
// Discovery. Locking a ball is the feat that opens the door, and it gets
// harder: the first visit takes one lock, the next two, then three, and the
// door stays open for less time on each. Nothing ever names the left orbit.
// A new player learns the room is there from the DMD's teases ("A DOOR
// CREAKS...", "THE DOOR RATTLES", "THE DOOR SHUTS..."), a creak on the
// callout bus, and the secret flasher and left-orbit arrow flickering while
// the door is open.
//
// The room's mode is NET RUN, a hurry-up: its value starts high (higher on
// each visit) and runs down toward a floor over twenty seconds. A village
// mode on the main table pauses while the ball is in the room, and the room
// has its own music.
//
// Rewards ride home. Through HOME: the hurry-up's value, +1x bonus, and the
// saucer relit for the next village; with all three nets as well: +1x more,
// a village rescued on the map (which feeds the wizard mode, so a skilled
// player plans around the room) and doubled jackpots for the next multiball;
// and in any multiball, a ball added. Past the room's flippers: the nets'
// +1x only.

import { PHYSICS_HZ } from '../clock'
import type { RuleEffect } from '../types'
import type { PinballRulesState } from './engine'
import { award, rescueVillage } from './features'
import type { PinballMusicBed } from '../audio/catalog'
import { BALL_SAVE_STEPS, VALUES, VILLAGES } from './village'

export type SubTableState = {
  /** The secret door is open (it closes itself at `closesAt`). */
  doorOpen: boolean
  closesAt: number
  /** Times a ball has found its way into the sub-table this game. */
  found: number
  /** N-E-T standups lit on this visit. */
  nets: string[]
  /** Locks made toward the next opening of the door. */
  keys: number
  /** A ball is in the room. */
  inRoom: boolean
  /** When NET RUN started (physics step), and the seconds last shown. */
  hurryAt: number
  hurryShown: number
}

export function initialSubTable(): SubTableState {
  return {
    doorOpen: false,
    closesAt: 0,
    found: 0,
    nets: [],
    keys: 0,
    inRoom: false,
    hurryAt: 0,
    hurryShown: 0,
  }
}

export const NET_TARGETS = ['net-n', 'net-e', 'net-t']
/** How long the secret door stays open the first time, in physics steps. */
export const SECRET_DOOR_STEPS = PHYSICS_HZ * 25
/** ...and each visit after shortens it, to no less than this. */
const DOOR_STEP_LESS = PHYSICS_HZ * 5
const DOOR_MIN_STEPS = PHYSICS_HZ * 10
/** Locks to open the door: one more for each visit, up to this. */
const MAX_KEYS = 3
/** NET RUN: the hurry-up's length, its value on the first visit, each later visit's raise, and its floor. */
export const HURRY_SECONDS = 20
export const HURRY_START = 500_000
export const HURRY_RAISE = 250_000
export const HURRY_FLOOR = 100_000
export const SUB_MODE_NAME = 'NET RUN'

/** Locks needed to open the door, `found` visits in. */
export function keysNeeded(found: number): number {
  return Math.min(MAX_KEYS, found + 1)
}

/** How long the door stays open, `found` visits in. */
export function doorSteps(found: number): number {
  return Math.max(DOOR_MIN_STEPS, SECRET_DOOR_STEPS - DOOR_STEP_LESS * found)
}

/** NET RUN's value at `tick`. */
export function hurryValue(sub: SubTableState, tick: number): number {
  const start = HURRY_START + HURRY_RAISE * Math.max(0, sub.found - 1)
  const left = Math.max(
    0,
    1 - (tick - sub.hurryAt) / (HURRY_SECONDS * PHYSICS_HZ),
  )
  return Math.round((HURRY_FLOOR + (start - HURRY_FLOOR) * left) / 10) * 10
}

/** A ball locked: the feat toward the door. */
export function lockFeat(
  state: PinballRulesState,
  tick: number,
  effects: RuleEffect[],
) {
  const sub = state.sub
  if (sub.doorOpen) return
  const keys = sub.keys + 1
  const needed = keysNeeded(sub.found)
  if (keys < needed) {
    state.sub = { ...sub, keys }
    effects.push({ type: 'dmd', text: 'THE DOOR RATTLES', ms: 1500 })
    return
  }
  state.sub = {
    ...sub,
    keys: 0,
    doorOpen: true,
    closesAt: tick + doorSteps(sub.found),
  }
  // Somewhere up the left orbit, a door gives way. The DMD only teases; the
  // player has to find where.
  effects.push(
    { type: 'mechanism', id: 'secret-door', action: 'open' },
    { type: 'sound', name: 'secret-tease' },
    { type: 'dmd', text: 'A DOOR CREAKS...', ms: 1800 },
  )
}

/** A ball through the secret hole: the room is found, and NET RUN starts. */
export function enterRoom(
  state: PinballRulesState,
  tick: number,
  effects: RuleEffect[],
) {
  const found = state.sub.found + 1
  state.sub = {
    ...state.sub,
    doorOpen: false,
    found,
    nets: [],
    inRoom: true,
    hurryAt: tick,
    hurryShown: HURRY_SECONDS,
  }
  // A village's clock stops while the ball is away.
  const mode = state.play.villages.mode
  if (mode && mode.pausedAt === null)
    state.play = {
      ...state.play,
      villages: { ...state.play.villages, mode: { ...mode, pausedAt: tick } },
    }
  effects.push(
    { type: 'mechanism', id: 'secret-door', action: 'close' },
    { type: 'sound', name: 'secret-found' },
    // NET RUN's timer follows on the next second, after the welcome.
    {
      type: 'dmd',
      text: 'SECRET VILLAGE',
      sub: found === 1 ? 'YOU FOUND IT' : 'WELCOME BACK',
      ms: 2200,
      scene: 'mode-intro',
    },
  )
}

/** NET RUN on the DMD's timer: the value to collect, and the seconds it keeps falling. */
function hurryTimer(sub: SubTableState, tick: number): RuleEffect {
  return {
    type: 'dmd',
    text: SUB_MODE_NAME,
    sub: hurryValue(sub, tick).toLocaleString('en-US'),
    ms: 0,
    scene: 'mode-timer',
    value: sub.hurryShown,
  }
}

/** An N-E-T standup in the room. */
export function netHit(
  state: PinballRulesState,
  id: string,
  effects: RuleEffect[],
) {
  if (state.sub.nets.includes(id)) return
  const nets = [...state.sub.nets, id]
  state.sub = { ...state.sub, nets }
  award(state, VALUES.standup)
  effects.push(
    { type: 'sound', name: 'drop' },
    { type: 'mechanism', id, action: 'flash' },
  )
  if (nets.length === NET_TARGETS.length)
    effects.push({
      type: 'dmd',
      text: 'NETS DELIVERED',
      sub: 'GO HOME',
      ms: 1600,
    })
}

/**
 * The ball leaves the room: through HOME (`home`) or past the room's
 * flippers. What it earned rides back with it.
 */
export function leaveRoom(
  state: PinballRulesState,
  home: boolean,
  tick: number,
  effects: RuleEffect[],
) {
  const sub = state.sub
  const nets = sub.nets.length >= NET_TARGETS.length
  const visited = sub.inRoom
  const reward = (home ? 1 : 0) + (nets ? 1 : 0)
  state.bonusMultiplier += reward
  state.sub = { ...sub, nets: [], inRoom: false }
  const perks: string[] = []
  if (home && visited && !state.tilted) {
    const value = hurryValue(sub, tick)
    award(state, value)
    effects.push(
      { type: 'sound', name: 'mode-complete' },
      {
        type: 'dmd',
        text: SUB_MODE_NAME,
        ms: 2000,
        scene: 'mode-total',
        value,
      },
    )
    if (nets) {
      if (rescueVillage(state, effects)) perks.push('VILLAGE RESCUED')
      state.play = { ...state.play, jackpotX: 2 }
      perks.push('JACKPOTS X2')
    }
    const v = state.play.villages
    if (!v.scoopLit && !v.mode && !state.play.wizard.running) {
      state.play = {
        ...state.play,
        villages: { ...v, scoopLit: true, rampsToRelight: 0 },
      }
      perks.push('VILLAGE IS LIT')
    }
    if (state.play.multiball.running || state.play.wizard.running) {
      state.ballsInPlay += 1
      state.play = {
        ...state.play,
        ballSave: { armed: false, until: tick + BALL_SAVE_STEPS },
      }
      effects.push({ type: 'add-ball', count: 1 })
      perks.push('ADD A BALL')
    }
  }
  if (visited) {
    effects.push({ type: 'dmd-clear', scene: 'mode-timer' })
    resumeMode(state, tick, effects)
  }
  // One line home: the best perk (the lamps show the rest), and the bonus.
  effects.push({
    type: 'dmd',
    text: perks[0] ?? 'BACK TO THE VILLAGE',
    sub: reward ? `BONUS ${state.bonusMultiplier}X` : perks[1],
    ms: 1800,
  })
}

/** The village's clock runs again from where it stopped. */
function resumeMode(
  state: PinballRulesState,
  tick: number,
  effects: RuleEffect[],
) {
  const mode = state.play.villages.mode
  if (!mode || mode.pausedAt === null) return
  const next = {
    ...mode,
    endsAt: mode.endsAt + (tick - mode.pausedAt),
    pausedAt: null,
  }
  state.play = {
    ...state.play,
    villages: { ...state.play.villages, mode: next },
  }
  const def = VILLAGES[next.village]!
  effects.push({
    type: 'dmd',
    text: def.name,
    sub: `${next.hits} OF ${def.need}`,
    ms: 0,
    scene: 'mode-timer',
    value: next.shown,
  })
}

/** Time passing: the door closes itself, and NET RUN's value falls. */
export function tickSubTable(
  state: PinballRulesState,
  tick: number,
  effects: RuleEffect[],
) {
  const sub = state.sub
  if (sub.doorOpen && tick >= sub.closesAt) {
    state.sub = { ...sub, doorOpen: false }
    effects.push({ type: 'mechanism', id: 'secret-door', action: 'close' })
    // Until the room is found, the door says it was there.
    if (sub.found === 0)
      effects.push({ type: 'dmd', text: 'THE DOOR SHUTS...', ms: 1500 })
    return
  }
  if (!sub.inRoom) return
  const shown = Math.max(
    0,
    Math.ceil(HURRY_SECONDS - (tick - sub.hurryAt) / PHYSICS_HZ),
  )
  if (shown === sub.hurryShown) return
  state.sub = { ...sub, hurryShown: shown }
  effects.push(hurryTimer(state.sub, tick))
}

/** The music the game calls for now: the room's, multiball's, a mode's, or none. */
export function musicFor(state: PinballRulesState): PinballMusicBed | null {
  if (state.over || state.tilted) return null
  if (state.sub.inRoom) return 'sub-table'
  if (state.play.wizard.running || state.play.multiball.running)
    return 'multiball'
  if (state.play.villages.mode) return 'mode'
  return null
}
