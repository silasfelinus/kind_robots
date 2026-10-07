// /utils/zuzuShowdown/motion.ts
//
// The special-move reader for Zuzu Showdown (conductor zuzu-showdown t-004).
// Pure and deterministic, so the sim can keep a MotionState per fighter and
// replay it exactly. Directions are stored in numpad notation relative to the
// way the fighter faced on that frame (6 = toward the opponent):
//
//   7 8 9
//   4 5 6
//   1 2 3
//
// Supported motions, with the Street Fighter names fighters.yaml uses:
// QCF 236, QCB 214, DP 623 (shortcut 323), HCB 6-2-4, 360, 720, charge
// [b]f and [d]u (45 frames), dd (down, release, down), and the super motions
// QCF QCF and QCB QCB. A motion's last direction must fall within LENIENCY
// frames of the button press, and the whole motion within its own window.

import type { Facing, SimInput } from './types'

export type Dir = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9

/** Frames of direction history kept (the 720 needs the longest window). */
export const HISTORY_FRAMES = 64
/** A button may come this many frames after the motion's last direction. */
export const LENIENCY = 10
/** Frames a charge direction must be held. */
export const CHARGE_FRAMES = 45
/** Easy Specials deal this percentage of a move's damage. */
export const EASY_DAMAGE_PERCENT = 80

export type Motion =
  | 'qcf'
  | 'qcb'
  | 'dp'
  | 'hcb'
  | '360'
  | '720'
  | 'qcf2'
  | 'qcb2'
  | 'chargeBF'
  | 'chargeDU'
  | 'dd'

/** Which motion wins when several are completed by the same press. */
export const MOTION_PRIORITY: readonly Motion[] = [
  '720',
  'qcf2',
  'qcb2',
  '360',
  'hcb',
  'dp',
  'qcf',
  'qcb',
  'chargeBF',
  'chargeDU',
  'dd',
]

export function dirOf(
  input: Pick<SimInput, 'up' | 'down' | 'left' | 'right'>,
  facing: Facing,
): Dir {
  const x = (input.right ? 1 : 0) - (input.left ? 1 : 0)
  const y = (input.up ? 1 : 0) - (input.down ? 1 : 0)
  return (5 + x * facing + 3 * y) as Dir
}

export type MotionState = {
  /** Oldest first; the newest entry is the current frame. */
  dirs: Dir[]
  backCharge: number
  downCharge: number
  /** Frames since a full back charge was released, or -1. */
  backRelease: number
  downRelease: number
}

export function emptyMotion(): MotionState {
  return {
    dirs: [],
    backCharge: 0,
    downCharge: 0,
    backRelease: -1,
    downRelease: -1,
  }
}

const set = (...dirs: Dir[]): ReadonlySet<Dir> => new Set(dirs)
const BACK = set(1, 4, 7)
const FORWARD = set(3, 6, 9)
const DOWN = set(1, 2, 3)
const UP = set(7, 8, 9)
const NOT_DOWN = set(4, 5, 6, 7, 8, 9)

function charge(
  count: number,
  release: number,
  holding: boolean,
): [count: number, release: number] {
  if (holding) return [count + 1, -1]
  if (count >= CHARGE_FRAMES) return [0, 0]
  if (release >= 0 && release < LENIENCY) return [0, release + 1]
  return [0, -1]
}

/** Record one frame's direction. Pure: returns a new state. */
export function pushDir(m: MotionState, dir: Dir): MotionState {
  const dirs =
    m.dirs.length >= HISTORY_FRAMES ? m.dirs.slice(1) : m.dirs.slice()
  dirs.push(dir)
  const [backCharge, backRelease] = charge(
    m.backCharge,
    m.backRelease,
    BACK.has(dir),
  )
  const [downCharge, downRelease] = charge(
    m.downCharge,
    m.downRelease,
    DOWN.has(dir),
  )
  return { dirs, backCharge, downCharge, backRelease, downRelease }
}

type Sequence = { steps: ReadonlyArray<ReadonlySet<Dir>>; window: number }

const SEQUENCES: Record<
  'qcf' | 'qcb' | 'dp' | 'hcb' | 'dd' | 'qcf2' | 'qcb2',
  Sequence
> = {
  qcf: { steps: [set(2), set(3), set(6)], window: 15 },
  qcb: { steps: [set(2), set(1), set(4)], window: 15 },
  // 623, or the 323 shortcut.
  dp: { steps: [set(6, 3), set(2), set(3)], window: 15 },
  hcb: { steps: [set(6), set(3, 2), set(2, 1), set(4)], window: 25 },
  dd: { steps: [DOWN, NOT_DOWN, DOWN], window: 15 },
  qcf2: { steps: [set(2), set(3), set(6), set(2), set(3), set(6)], window: 30 },
  qcb2: { steps: [set(2), set(1), set(4), set(2), set(1), set(4)], window: 30 },
}

/**
 * Is `steps` a subsequence of the recent history, with the last step inside
 * the leniency? Walking backward and taking the latest match for each step is
 * enough to decide whether any match exists.
 */
function matchSequence(dirs: Dir[], { steps, window }: Sequence): boolean {
  const oldest = Math.max(0, dirs.length - window)
  let i = dirs.length - 1
  for (let k = steps.length - 1; k >= 0; k -= 1) {
    const step = steps[k]!
    const limit =
      k === steps.length - 1 ? Math.max(oldest, dirs.length - LENIENCY) : oldest
    while (i >= limit && !step.has(dirs[i]!)) i -= 1
    if (i < limit) return false
    i -= 1
  }
  return true
}

type Quarter = 'R' | 'D' | 'L' | 'U'

function quarterOf(dir: Dir): Quarter | null {
  if (dir === 6) return 'R'
  if (dir === 2) return 'D'
  if (dir === 4) return 'L'
  if (UP.has(dir)) return 'U'
  return null
}

/** A full circle touches right, down, left and up; a 720 does it twice. */
function matchRotation(dirs: Dir[], window: number, turns: number): boolean {
  const recent = dirs.slice(-window)
  if (!recent.slice(-LENIENCY).some((dir) => quarterOf(dir) !== null))
    return false
  const visits: Quarter[] = []
  for (const dir of recent) {
    const quarter = quarterOf(dir)
    if (quarter && visits[visits.length - 1] !== quarter) visits.push(quarter)
  }
  const counts: Record<Quarter, number> = { R: 0, D: 0, L: 0, U: 0 }
  for (const quarter of visits) counts[quarter] += 1
  return Object.values(counts).every((count) => count >= turns)
}

function matchCharge(
  dirs: Dir[],
  release: number,
  toward: ReadonlySet<Dir>,
): boolean {
  if (release < 0) return false
  return dirs.slice(-(release + 1)).some((dir) => toward.has(dir))
}

export function matches(m: MotionState, motion: Motion): boolean {
  switch (motion) {
    case '360':
      return matchRotation(m.dirs, 30, 1)
    case '720':
      return matchRotation(m.dirs, HISTORY_FRAMES, 2)
    case 'chargeBF':
      return matchCharge(m.dirs, m.backRelease, FORWARD)
    case 'chargeDU':
      return matchCharge(m.dirs, m.downRelease, UP)
    default:
      return matchSequence(m.dirs, SEQUENCES[motion])
  }
}

// ---------------------------------------------------------------- commands

/** P / K is either strength; the rest name one button. */
export type ButtonSpec = 'P' | 'K' | 'LP' | 'HP' | 'LK' | 'HK' | 'D'

export type AttackButton = 'lp' | 'hp' | 'lk' | 'hk' | 'dodge'

const BUTTONS_FOR: Record<ButtonSpec, readonly AttackButton[]> = {
  // Heavy first: a press of both strengths takes the heavy version.
  P: ['hp', 'lp'],
  K: ['hk', 'lk'],
  LP: ['lp'],
  HP: ['hp'],
  LK: ['lk'],
  HK: ['hk'],
  D: ['dodge'],
}

export type CommandLevel = 'special' | 'super'

export type CommandSpec = {
  id: string
  motion: Motion
  button: ButtonSpec
  level: CommandLevel
  /** Only in the air (true), only on the ground (false or unset). */
  air?: boolean
}

export type EasySlot = 'neutral' | 'forward' | 'back' | 'down' | 'up'

/** Each fighter's Easy Specials: a special per direction, plus the Lv1 super. */
export type EasyTable = Partial<Record<EasySlot, string>> & { super?: string }

export type CommandResult = {
  id: string
  /** The button that fired it (strength), or null for an Easy Special. */
  button: AttackButton | null
  easy: boolean
}

export type Pressed = Pick<
  SimInput,
  'lp' | 'hp' | 'lk' | 'hk' | 'dodge' | 'special'
>

function slotOf(dir: Dir): EasySlot {
  if (DOWN.has(dir)) return 'down'
  if (UP.has(dir)) return 'up'
  if (dir === 6) return 'forward'
  if (dir === 4) return 'back'
  return 'neutral'
}

const LEVEL_RANK: Record<CommandLevel, number> = { super: 0, special: 1 }

/**
 * The command a press fires this frame, or null (the sim then plays a normal).
 * Easy Specials win when Special is pressed; otherwise supers beat specials,
 * and within a level MOTION_PRIORITY decides (so a DP beats a QCF).
 */
export function resolveCommand(
  m: MotionState,
  pressed: Pressed,
  held: Pressed,
  commands: readonly CommandSpec[],
  airborne: boolean,
  easy?: EasyTable,
): CommandResult | null {
  if (pressed.special && easy) {
    const heavy = held.hp || held.hk
    if (heavy && easy.super) return { id: easy.super, button: null, easy: true }
    const dir = m.dirs[m.dirs.length - 1] ?? 5
    const id = easy[slotOf(dir)] ?? easy.neutral
    if (id) return { id, button: null, easy: true }
  }
  const ordered = commands
    .filter((command) => (command.air ?? false) === airborne)
    .slice()
    .sort(
      (a, b) =>
        LEVEL_RANK[a.level] - LEVEL_RANK[b.level] ||
        MOTION_PRIORITY.indexOf(a.motion) - MOTION_PRIORITY.indexOf(b.motion),
    )
  for (const command of ordered) {
    const button = BUTTONS_FOR[command.button].find((b) => pressed[b])
    if (button && matches(m, command.motion)) {
      return { id: command.id, button, easy: false }
    }
  }
  return null
}

// ---------------------------------------------------------------- notation

const NOTATION: Record<string, Motion> = {
  'QCF QCF': 'qcf2',
  'QCB QCB': 'qcb2',
  QCF: 'qcf',
  QCB: 'qcb',
  DP: 'dp',
  HCB: 'hcb',
  '360': '360',
  '720': '720',
  '[b]f': 'chargeBF',
  '[d]u': 'chargeDU',
  dd: 'dd',
}

/**
 * Read a fighters.yaml input like "QCF+P", "QCB QCB+HP", "[b]f+P" or
 * "QCF+K in the air". Returns null for inputs that aren't a motion plus a
 * button ("any P while submerged", follow-ups), which the fighter module
 * wires by hand.
 */
export function parseNotation(
  text: string,
): { motion: Motion; button: ButtonSpec; air: boolean } | null {
  let rest = text.replace(/\s*\(.*\)\s*$/, '').trim()
  const air = /\s+in the air$/.test(rest)
  rest = rest.replace(/\s+in the air$/, '')
  const match = /^(.+)\+(P|K|LP|HP|LK|HK|D)$/.exec(rest)
  if (!match) return null
  const motion = NOTATION[match[1]!.trim()]
  if (!motion) return null
  return { motion, button: match[2] as ButtonSpec, air }
}
