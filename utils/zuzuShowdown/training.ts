// /utils/zuzuShowdown/training.ts
//
// Zuzu Showdown Training mode (conductor zuzu-showdown t-022). P2 is a dummy that stands, crouches,
// jumps, blocks everything, blocks once it has been hit, or blocks at random. The readouts show the
// frame advantage of the last hit or block (the frames the defender stays stuck after the attacker
// can move again), and P1's inputs as numpad directions relative to their facing, how long each was
// held, and the special the motion parser read from them. Meter and health can refill, and the
// fighters can be put back in the centre or either corner. This module is pure: the stage component
// feeds it the match each frame and draws its readouts.

import { drawText, measureText } from '../arcade/font'
import {
  METER_MAX,
  PROXIMITY_GUARD,
  ROUND_FRAMES,
  STAGE_HALF_WIDTH,
  START_OFFSET,
  createMatch,
  moveOf,
} from './sim'
import {
  SUB,
  neutralInput,
  type FighterData,
  type FighterState,
  type MatchState,
  type SimEvent,
  type SimInput,
} from './types'

type Pair<T> = [T, T]

export type DummyMode =
  'stand' | 'crouch' | 'jump' | 'block' | 'block-after-hit' | 'random-block'

export const DUMMY_MODES: readonly DummyMode[] = [
  'stand',
  'crouch',
  'jump',
  'block',
  'block-after-hit',
  'random-block',
]

export const DUMMY_NAMES: Record<DummyMode, string> = {
  stand: 'Stand',
  crouch: 'Crouch',
  jump: 'Jump',
  block: 'Block all',
  'block-after-hit': 'Block after first hit',
  'random-block': 'Random block',
}

export type TrainingPlace = 'center' | 'p1-corner' | 'p2-corner'

/** The dummy keeps blocking this long after it was last hit or blocked (block after first hit). */
export const GUARD_AFTER_HIT = 30
/** An advantage still being measured after this long is a knockdown or a reset: it is dropped. */
export const ADVANTAGE_LIMIT = 120
/** Inputs kept in the display. */
export const INPUT_LOG = 12

export type InputEntry = {
  /** Numpad direction relative to the fighter's facing (6 = forward). */
  dir: number
  buttons: string[]
  /** Frames held. */
  frames: number
  /** The special or super the motion parser read when this input was pressed. */
  read?: string
}

export type Advantage = { frames: number; on: 'hit' | 'block' }

export type TrainingState = {
  seed: number
  /** Block after first hit: the frame until which the dummy keeps blocking. */
  guardUntil: number
  /** Random block: the start frame of the attack last decided on, and the decision. */
  watched: number | null
  blocking: boolean
  /** The frame advantage of the last hit or block that both fighters recovered from. */
  advantage: Advantage | null
  /** A hit or block being measured: who attacked, and the frame each side could act again. */
  measuring: {
    attacker: 0 | 1
    on: 'hit' | 'block'
    since: number
    ready: Pair<number | null>
  } | null
  inputs: InputEntry[]
}

export function newTraining(seed = 0x5eed): TrainingState {
  return {
    seed: seed >>> 0 || 1,
    guardUntil: -1,
    watched: null,
    blocking: false,
    advantage: null,
    measuring: null,
    inputs: [],
  }
}

/** A match set up for training: no intro, the fighters placed, the fight already on. */
export function trainingMatch(
  roster: Pair<FighterData>,
  place: TrainingPlace = 'center',
): MatchState {
  const s = createMatch(roster)
  s.phase = 'fight'
  s.phaseFrame = 0
  s.events = []
  const wall = STAGE_HALF_WIDTH * SUB
  const gap = 2 * START_OFFSET * SUB
  // The sim clamps a fighter placed past the wall back onto the stage on the first frame.
  const xs: Pair<number> =
    place === 'p1-corner'
      ? [-wall, -wall + gap]
      : place === 'p2-corner'
        ? [wall - gap, wall]
        : [-START_OFFSET * SUB, START_OFFSET * SUB]
  s.fighters[0].x = xs[0]
  s.fighters[1].x = xs[1]
  return s
}

// ---------------------------------------------------------------- the dummy

const ACTIONABLE = new Set<FighterState['action']>(['idle', 'walk', 'crouch'])

/** Can this fighter start something new this frame? */
export function canAct(f: FighterState): boolean {
  return ACTIONABLE.has(f.action)
}

function stickInput(dir: number, facing: 1 | -1): SimInput {
  const input = neutralInput()
  const forward = facing === 1 ? 'right' : 'left'
  const back = facing === 1 ? 'left' : 'right'
  if (dir >= 7) input.up = true
  if (dir <= 3) input.down = true
  if (dir % 3 === 0) input[forward] = true
  if (dir % 3 === 1) input[back] = true
  return input
}

/** Is the attacker swinging (or throwing something) close enough that holding back blocks? */
function threatened(
  s: MatchState,
  side: 0 | 1,
): 'attack' | 'projectile' | null {
  const me = s.fighters[side]
  const opp = s.fighters[side === 0 ? 1 : 0]
  const range = PROXIMITY_GUARD * SUB
  if (opp.action === 'attack' && Math.abs(opp.x - me.x) <= range)
    return 'attack'
  if (
    s.projectiles.some((p) => p.owner !== side && Math.abs(p.x - me.x) <= range)
  )
    return 'projectile'
  return null
}

function nextSeed(seed: number): number {
  let x = seed
  x ^= x << 13
  x ^= x >>> 17
  x ^= x << 5
  return x >>> 0
}

/** The dummy's input this frame, and its state after it. */
export function dummyInput(
  t: TrainingState,
  mode: DummyMode,
  s: MatchState,
  side: 0 | 1,
  roster: Pair<FighterData>,
): { training: TrainingState; input: SimInput } {
  const me = s.fighters[side]
  const opp = s.fighters[side === 0 ? 1 : 0]
  const oppData = roster[side === 0 ? 1 : 0]
  const next: TrainingState = { ...t }
  if (s.phase !== 'fight') return { training: next, input: neutralInput() }

  // Hit or blocking: block after first hit keeps its guard up a moment longer.
  if (me.action === 'hitstun' || me.action === 'blockstun')
    next.guardUntil = s.frame + GUARD_AFTER_HIT

  let guard = false
  if (mode === 'block') guard = true
  else if (mode === 'block-after-hit') guard = s.frame <= next.guardUntil
  else if (mode === 'random-block') {
    // Decide once per attack, so a string isn't blocked and dropped hit by hit.
    if (opp.action === 'attack' && opp.attack) {
      const start = s.frame - opp.attack.frame
      if (next.watched !== start) {
        next.seed = nextSeed(next.seed)
        next.watched = start
        next.blocking = next.seed % 2 === 0
      }
      guard = next.blocking
    }
    if (me.action === 'blockstun') guard = true
  }

  const threat = threatened(s, side)
  if (guard && (threat || me.action === 'blockstun')) {
    // Low attacks are blocked crouching; overheads and everything else standing (a crouching dummy
    // stays down for mids).
    const move =
      opp.action === 'attack' && opp.attack ? moveOf(oppData, opp.attack) : null
    const low =
      move?.guard === 'low' || (mode === 'crouch' && move?.guard !== 'high')
    return { training: next, input: stickInput(low ? 1 : 4, me.facing) }
  }
  const base = mode === 'crouch' ? 2 : mode === 'jump' ? 8 : 5
  return { training: next, input: stickInput(base, me.facing) }
}

// ---------------------------------------------------------------- readouts

function dirOf(input: SimInput, facing: 1 | -1): number {
  const forward = facing === 1 ? input.right : input.left
  const back = facing === 1 ? input.left : input.right
  const h = forward && !back ? 1 : back && !forward ? -1 : 0
  const v = input.up && !input.down ? 1 : input.down && !input.up ? -1 : 0
  return 5 + h + v * 3
}

const BUTTON_NAMES: Array<[keyof SimInput, string]> = [
  ['lp', 'LP'],
  ['hp', 'HP'],
  ['lk', 'LK'],
  ['hk', 'HK'],
  ['dodge', 'DG'],
  ['special', 'SP'],
]

/** A move id as a name: `iai-flash` reads Iai Flash. */
export function moveName(id: string): string {
  return id
    .split(/[-_]/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

/** Log P1's input: a new entry when the direction or buttons change, else the held one grows. */
export function logInput(
  log: InputEntry[],
  input: SimInput,
  facing: 1 | -1,
  events: SimEvent[],
): InputEntry[] {
  const dir = dirOf(input, facing)
  const buttons = BUTTON_NAMES.filter(([key]) => input[key]).map(([, n]) => n)
  const read = events.find(
    (e): e is Extract<SimEvent, { type: 'special' | 'super' }> =>
      (e.type === 'special' || e.type === 'super') && e.side === 0,
  )
  const last = log[log.length - 1]
  if (
    last &&
    last.dir === dir &&
    last.buttons.join() === buttons.join() &&
    !read
  )
    return [
      ...log.slice(0, -1),
      { ...last, frames: Math.min(99, last.frames + 1) },
    ]
  const entry: InputEntry = { dir, buttons, frames: 1 }
  if (read) entry.read = moveName(read.move)
  return [...log, entry].slice(-INPUT_LOG)
}

/**
 * Track frame advantage: a hit or block starts a measurement, and once both fighters can act again
 * the advantage is the defender's ready frame minus the attacker's (positive: the attacker is ahead).
 * A newer hit or block restarts it, so a combo reports its last hit.
 */
export function trackAdvantage(t: TrainingState, s: MatchState): TrainingState {
  let measuring = t.measuring
  let advantage = t.advantage
  for (const e of s.events) {
    if (e.type === 'hit' || e.type === 'block') {
      measuring = {
        attacker: e.attacker,
        on: e.type,
        since: s.frame,
        ready: [null, null],
      }
    }
  }
  if (measuring) {
    const ready: Pair<number | null> = [...measuring.ready]
    for (const side of [0, 1] as const) {
      if (ready[side] === null && canAct(s.fighters[side]))
        ready[side] = s.frame
    }
    measuring = { ...measuring, ready }
    const [a, b] = ready
    if (a !== null && b !== null) {
      const attacker = measuring.attacker
      const atk = attacker === 0 ? a : b
      const def = attacker === 0 ? b : a
      advantage = { frames: def - atk, on: measuring.on }
      measuring = null
    } else if (s.frame - measuring.since > ADVANTAGE_LIMIT) measuring = null
  }
  return { ...t, measuring, advantage }
}

export type TrainingRules = { infiniteMeter: boolean; infiniteHealth: boolean }

/**
 * Training's house rules, applied after each step: the clock never runs out, meter stays full, and
 * health comes back once a combo is over and the fighter can move again.
 */
export function applyTrainingRules(
  s: MatchState,
  roster: Pair<FighterData>,
  rules: TrainingRules,
): void {
  if (s.phase !== 'fight') return
  s.timer = ROUND_FRAMES
  for (const side of [0, 1] as const) {
    const f = s.fighters[side]
    if (rules.infiniteMeter) f.meter = METER_MAX
    if (rules.infiniteHealth && canAct(f) && f.health < roster[side].health) {
      f.health = roster[side].health
      f.red = 0
    }
  }
}

/** Frame advantage as shown: `+3 ON BLOCK`, `-2 ON HIT`, `0 ON HIT`. */
export function advantageText(a: Advantage): string {
  const sign = a.frames > 0 ? '+' : ''
  return `${sign}${a.frames} ON ${a.on.toUpperCase()}`
}

const DIR_ARROWS: Record<number, string> = {
  1: 'DB',
  2: 'D',
  3: 'DF',
  4: 'B',
  5: 'N',
  6: 'F',
  7: 'UB',
  8: 'U',
  9: 'UF',
}

/** One line of the input display: frames held, the direction, the buttons, and the read. */
export function inputText(entry: InputEntry): string {
  const parts = [
    String(entry.frames).padStart(2, ' '),
    DIR_ARROWS[entry.dir] ?? '?',
    ...entry.buttons,
  ]
  return entry.read
    ? `${parts.join(' ')} > ${entry.read.toUpperCase()}`
    : parts.join(' ')
}

/** The readouts: frame advantage under the clock, P1's inputs down the left. */
export function drawTraining(
  g: CanvasRenderingContext2D,
  t: TrainingState,
  width: number,
): void {
  drawText(g, 'TRAINING', width / 2, 40, {
    align: 'center',
    color: '#a5f3fc',
    shadow: '#000000',
  })
  if (t.advantage) {
    const a = t.advantage
    drawText(g, advantageText(a), width / 2, 50, {
      align: 'center',
      color: a.frames > 0 ? '#86efac' : a.frames < 0 ? '#fca5a5' : '#ffffff',
      shadow: '#000000',
    })
  }
  const lines = t.inputs.slice().reverse()
  if (!lines.length) return
  const texts = lines.map(inputText)
  const w = Math.max(...texts.map((line) => measureText(line))) + 6
  g.fillStyle = 'rgba(0, 0, 0, 0.45)'
  g.fillRect(4, 40, w, texts.length * 9 + 3)
  texts.forEach((line, i) =>
    drawText(g, line, 7, 42 + i * 9, {
      color: lines[i]!.read ? '#fde047' : '#e7e5e4',
    }),
  )
}
