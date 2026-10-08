// /utils/zuzuShowdown/cpu.ts
//
// Zuzu Showdown CPU opponent (conductor zuzu-showdown t-020; DESIGN-BRIEF.md "CPU opponents"). A state
// machine over the same frame data and the same input path as a player: every frame it reads the match
// and returns the SimInput a player would have held, never touching the state itself. It is pure and
// deterministic: its randomness is its own seeded generator, carried in its state, so a CPU-vs-CPU match
// replays to the same hash.
//
// Four levels set how fast it reacts, how often it blocks, how long its combos run and which supers it
// will spend meter on. From Normal up it plays the triangle: it counts what you do at close range
// (strike, grab or guard) and leans toward the counter (guard beats strike, grab beats guard, strike
// beats grab), so your habits get read. Kid blocks rarely and never uses a Showdown super.

import type { Dir } from './motion'
import { moveOf } from './sim'
import {
  SUB,
  neutralInput,
  type FighterData,
  type FighterState,
  type MatchState,
  type MoveData,
  type NormalId,
  type SimInput,
  type SpecialMove,
} from './types'

export type CpuLevel = 'kid' | 'normal' | 'hard' | 'showdown'

export const CPU_LEVELS: readonly CpuLevel[] = [
  'kid',
  'normal',
  'hard',
  'showdown',
]

export type LevelSpec = {
  /** Frames between seeing an attack start and being able to answer it. */
  reaction: number
  /**
   * Chance it blocks: an attack slow enough to see coming, and the chance it waits between decisions
   * already holding back (how anyone blocks a jab faster than they can react).
   */
  block: number
  /** Most normals it chains in one combo. */
  combo: number
  /** Which supers it spends meter on. */
  supers: 'lv1' | 'all'
  /** How hard it leans on your habits (0 never reads you). */
  reads: number
  /** Chance it advances rather than waits at mid range. */
  aggression: number
  /** Chance it answers a jump-in with an anti-air. */
  antiAir: number
  /** Chance it reaches for a special move when one fits. */
  specials: number
  /** Frames it idles between decisions. */
  think: number
}

export const LEVELS: Record<CpuLevel, LevelSpec> = {
  kid: {
    reaction: 30,
    block: 0.15,
    combo: 1,
    supers: 'lv1',
    reads: 0,
    aggression: 0.35,
    antiAir: 0.1,
    specials: 0.15,
    think: 24,
  },
  normal: {
    reaction: 18,
    block: 0.45,
    combo: 2,
    supers: 'lv1',
    reads: 0.5,
    aggression: 0.5,
    antiAir: 0.4,
    specials: 0.3,
    think: 14,
  },
  hard: {
    reaction: 11,
    block: 0.7,
    combo: 3,
    supers: 'all',
    reads: 0.8,
    aggression: 0.6,
    antiAir: 0.7,
    specials: 0.4,
    think: 9,
  },
  showdown: {
    reaction: 7,
    block: 0.85,
    combo: 3,
    supers: 'all',
    reads: 1,
    aggression: 0.65,
    antiAir: 0.9,
    specials: 0.45,
    think: 6,
  },
}

/** The three answers of the rock-paper-scissors at close range. */
export type Choice = 'strike' | 'grab' | 'guard'

export type Habits = Record<Choice, number>

export type CpuState = {
  level: CpuLevel
  /** The generator's state (mulberry32). */
  seed: number
  /** Input frames still to send, oldest first. */
  plan: SimInput[]
  /** Frames to idle before the next decision. */
  wait: number
  /** What the opponent has done at close range, decayed so recent habits weigh most. */
  habits: Habits
  /** The opponent attack it last decided whether to block (its start frame), and the decision. */
  watched: number | null
  blocking: boolean
  /** Whether it is holding back while it waits. */
  guarding: boolean
  /** The opponent's action and its frame last tick, to see new choices start. */
  last: { action: FighterState['action']; frame: number } | null
}

/** Within this many pixels (between centres) the triangle is in play. */
export const CLOSE = 72

export function newCpu(level: CpuLevel, seed: number): CpuState {
  return {
    level,
    seed: seed >>> 0 || 1,
    plan: [],
    wait: 30,
    habits: { strike: 0, grab: 0, guard: 0 },
    watched: null,
    blocking: false,
    guarding: false,
    last: null,
  }
}

// ---------------------------------------------------------------- the generator

/** mulberry32: a uniform draw in [0, 1) and the generator's next state. */
function draw(seed: number): [number, number] {
  const next = (seed + 0x6d2b79f5) >>> 0
  let t = next
  t = Math.imul(t ^ (t >>> 15), t | 1)
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
  return [((t ^ (t >>> 14)) >>> 0) / 4294967296, next]
}

// ---------------------------------------------------------------- reading the opponent

/**
 * Weights for the three answers at close range. Without reads they are a fixed mix; with them, each
 * answer gains the share of the habit it beats (guard gains your strikes, grab your guards, strike
 * your grabs).
 */
export function triangleWeights(level: CpuLevel, habits: Habits): Habits {
  const base: Habits = { strike: 0.5, grab: 0.2, guard: 0.3 }
  const reads = LEVELS[level].reads
  const total = habits.strike + habits.grab + habits.guard
  if (reads <= 0 || total <= 0) return base
  const share = (c: Choice) => habits[c] / total
  const w: Habits = {
    strike: base.strike * (1 - reads) + reads * share('grab'),
    grab: base.grab * (1 - reads) + reads * share('guard'),
    guard: base.guard * (1 - reads) + reads * share('strike'),
  }
  const sum = w.strike + w.grab + w.guard
  return { strike: w.strike / sum, grab: w.grab / sum, guard: w.guard / sum }
}

/** The close-range choice the opponent just started, if it started one this frame. */
function choiceStarted(
  o: FighterState,
  last: CpuState['last'],
  data: FighterData,
): Choice | null {
  const fresh = !last || last.action !== o.action || o.frame < last.frame
  if (!fresh) return null
  if (o.action === 'throwing') return 'grab'
  if (o.action === 'blockstun') return 'guard'
  if (o.action === 'attack' && o.attack) {
    try {
      const move = moveOf(data, o.attack)
      if (move.grab) return 'grab'
      if (move.parry) return 'guard'
    } catch {
      return 'strike'
    }
    return 'strike'
  }
  return null
}

/** The move an attack is, or null for an id the kit doesn't know. */
function moveOrNull(
  data: FighterData,
  attack: NonNullable<FighterState['attack']>,
): MoveData | null {
  try {
    return moveOf(data, attack)
  } catch {
    return null
  }
}

function remember(habits: Habits, choice: Choice): Habits {
  const decayed: Habits = {
    strike: habits.strike * 0.9,
    grab: habits.grab * 0.9,
    guard: habits.guard * 0.9,
  }
  decayed[choice] += 1
  return decayed
}

// ---------------------------------------------------------------- input frames

/** Numpad direction (6 = toward the opponent) as stick input for a fighter facing `facing`. */
function stick(dir: Dir, facing: 1 | -1): SimInput {
  const input = neutralInput()
  const forward = facing === 1 ? 'right' : 'left'
  const back = facing === 1 ? 'left' : 'right'
  if (dir === 7 || dir === 8 || dir === 9) input.up = true
  if (dir === 1 || dir === 2 || dir === 3) input.down = true
  if (dir === 3 || dir === 6 || dir === 9) input[forward] = true
  if (dir === 1 || dir === 4 || dir === 7) input[back] = true
  return input
}

type Button = 'lp' | 'hp' | 'lk' | 'hk' | 'dodge'

function press(dir: Dir, facing: 1 | -1, ...buttons: Button[]): SimInput {
  const input = stick(dir, facing)
  for (const b of buttons) input[b] = true
  return input
}

/** Hold `dir` for `frames` frames. */
function hold(dir: Dir, facing: 1 | -1, frames: number): SimInput[] {
  return Array.from({ length: frames }, () => stick(dir, facing))
}

const MOTION_DIRS: Partial<Record<SpecialMove['motion'], Dir[]>> = {
  qcf: [2, 3, 6],
  qcb: [2, 1, 4],
  dp: [6, 2, 3],
  hcb: [6, 3, 2, 1, 4],
  dd: [2, 5, 2],
  qcf2: [2, 3, 6, 2, 3, 6],
  qcb2: [2, 1, 4, 2, 1, 4],
}

function buttonOf(spec: SpecialMove['button'], heavy: boolean): Button {
  switch (spec) {
    case 'P':
      return heavy ? 'hp' : 'lp'
    case 'K':
      return heavy ? 'hk' : 'lk'
    case 'D':
      return 'dodge'
    default:
      return spec.toLowerCase() as Button
  }
}

/** The input frames that perform a special: its motion, two frames a direction, the button last. */
export function specialFrames(
  special: SpecialMove,
  facing: 1 | -1,
  heavy = false,
): SimInput[] | null {
  const button = buttonOf(special.button, heavy)
  if (special.motion === 'chargeBF')
    return [...hold(4, facing, 48), press(6, facing, button)]
  if (special.motion === 'chargeDU')
    return [...hold(2, facing, 48), press(8, facing, button)]
  const dirs = MOTION_DIRS[special.motion]
  if (!dirs) return null
  const frames: SimInput[] = []
  dirs.forEach((dir, i) => {
    frames.push(stick(dir, facing))
    frames.push(
      i === dirs.length - 1 ? press(dir, facing, button) : stick(dir, facing),
    )
  })
  return frames
}

function idle(frames: number): SimInput[] {
  return Array.from({ length: frames }, () => neutralInput())
}

// ---------------------------------------------------------------- deciding

const STUCK = new Set<FighterState['action']>([
  'hitstun',
  'airhit',
  'knockdown',
  'wakeup',
  'thrown',
  'throwHold',
  'throwWhiff',
  'tech',
  'ko',
  'victory',
  'breakout',
])

function canAct(f: FighterState): boolean {
  return !STUCK.has(f.action) && f.action !== 'attack' && f.action !== 'dodge'
}

/** A normal's frames from button to the next press: through its active frames. */
function normalFrames(move: MoveData): number {
  return move.startup + move.active
}

/** A combo of up to `length` normals along the fighter's chains, pressed as each one connects. */
function comboPlan(
  data: FighterData,
  facing: 1 | -1,
  length: number,
  low: boolean,
): SimInput[] {
  const plan: SimInput[] = []
  let id: NormalId = low ? 'crouch_lk' : 'stand_lp'
  for (let i = 0; i < length; i += 1) {
    const button = id.split('_')[1] as Button
    const crouch = id.startsWith('crouch')
    plan.push(press(crouch ? 3 : 5, facing, button))
    const move = data.moves[id]
    plan.push(...hold(crouch ? 2 : 5, facing, normalFrames(move) - 1))
    const next: NormalId | undefined = data.chains[id]?.find((n) =>
      n.startsWith(crouch ? 'crouch' : 'stand'),
    )
    if (!next) break
    id = next
  }
  return plan
}

/** The fighter's specials (or supers) done from the ground, or with `air`, from a jump. */
function specialsOf(
  data: FighterData,
  level: 'special' | 'super',
  air = false,
): SpecialMove[] {
  return data.specials.filter(
    (sp) => sp.level === level && (sp.air ?? false) === air,
  )
}

type Decision = {
  plan: SimInput[]
  wait: number
  seed: number
  guarding: boolean
}

function decide(
  cpu: CpuState,
  s: MatchState,
  me: FighterState,
  opp: FighterState,
  data: FighterData,
): Decision {
  const spec = LEVELS[cpu.level]
  let seed = cpu.seed
  const roll = () => {
    const [value, next] = draw(seed)
    seed = next
    return value
  }
  const facing = me.facing
  const gap = Math.abs(me.x - opp.x) / SUB
  // Waiting after this decision, it holds back as often as its level blocks.
  const guarding = roll() < spec.block
  const done = (plan: SimInput[], wait = spec.think) => ({
    plan,
    wait,
    seed,
    guarding,
  })

  // A jump-in coming: an anti-air from the crouch.
  if (opp.y > 0 && gap < 110 && roll() < spec.antiAir) {
    return done([press(2, facing, 'hp'), ...hold(2, facing, 20)])
  }

  // A super when there is meter for it and they are close (Kid keeps to level 1).
  const supers = specialsOf(data, 'super').filter(
    (sp) =>
      (sp.move.meterCost ?? 0) <= me.meter &&
      (spec.supers === 'all' || !sp.move.showdown),
  )
  if (supers.length && gap < 110 && roll() < spec.specials * 0.5) {
    const sp = supers[Math.floor(roll() * supers.length)]!
    const frames = specialFrames(sp, facing)
    if (frames) return done([...frames, ...idle(10)], spec.think * 2)
  }

  if (gap > 170) {
    // Far: a projectile if the kit has one, else close the distance.
    const shots = specialsOf(data, 'special').filter((sp) => sp.move.projectile)
    if (shots.length && roll() < spec.specials) {
      const frames = specialFrames(
        shots[Math.floor(roll() * shots.length)]!,
        facing,
      )
      if (frames) return done([...frames, ...idle(16)])
    }
    return done(hold(6, facing, 16 + Math.floor(roll() * 20)))
  }

  if (gap > CLOSE) {
    const r = roll()
    if (r < spec.aggression * 0.6)
      return done(hold(6, facing, 10 + Math.floor(roll() * 16)))
    if (r < spec.aggression * 0.75) {
      // A jump-in: up and forward, then an air special if the kit has one, else the flying kick.
      const air = specialsOf(data, 'special', true)
      const frames =
        air.length && roll() < spec.specials
          ? specialFrames(air[Math.floor(roll() * air.length)]!, facing)
          : null
      return done([
        press(9, facing),
        ...idle(10),
        ...(frames ?? [...idle(6), press(5, facing, 'hk')]),
        ...idle(20),
      ])
    }
    if (r < spec.aggression * 0.9) {
      // A poke at the edge of the heavy kick.
      return done([press(5, facing, 'hk'), ...idle(18)])
    }
    if (r < spec.aggression) {
      const specials = specialsOf(data, 'special').filter(
        (sp) => !sp.move.projectile,
      )
      if (specials.length && roll() < spec.specials) {
        const frames = specialFrames(
          specials[Math.floor(roll() * specials.length)]!,
          facing,
        )
        if (frames) return done([...frames, ...idle(12)])
      }
      return done(hold(6, facing, 12))
    }
    // Wait it out, guarding.
    return done(hold(4, facing, 12 + Math.floor(roll() * 12)))
  }

  // Close: the triangle.
  const w = triangleWeights(cpu.level, cpu.habits)
  const r = roll()
  if (r < w.grab) return done([press(5, facing, 'lp', 'lk'), ...idle(10)])
  if (r < w.grab + w.guard) {
    const parries = specialsOf(data, 'special').filter((sp) => sp.move.parry)
    if (parries.length && roll() < spec.specials) {
      const frames = specialFrames(parries[0]!, facing)
      if (frames) return done([...frames, ...idle(8)])
    }
    return done(
      hold(roll() < 0.5 ? 1 : 4, facing, 14 + Math.floor(roll() * 14)),
    )
  }
  const length = 1 + Math.floor(roll() * spec.combo)
  return done(comboPlan(data, facing, length, roll() < 0.35))
}

/**
 * The CPU's input for this frame, and its next state. `side` is the CPU's side; the match is only
 * read, never changed.
 */
export function cpuInput(
  cpu: CpuState,
  s: MatchState,
  side: 0 | 1,
  roster: [FighterData, FighterData],
): { cpu: CpuState; input: SimInput } {
  const me = s.fighters[side]
  const opp = s.fighters[side === 0 ? 1 : 0]
  const data = roster[side]
  const oppData = roster[side === 0 ? 1 : 0]
  const spec = LEVELS[cpu.level]
  let next: CpuState = { ...cpu }

  // Read the opponent: what they just chose at close range.
  const gap = Math.abs(me.x - opp.x) / SUB
  const started = choiceStarted(opp, cpu.last, oppData)
  if (started && gap <= CLOSE) next.habits = remember(cpu.habits, started)
  next.last = { action: opp.action, frame: opp.frame }

  if (s.phase !== 'fight') {
    next = { ...next, plan: [], wait: spec.think }
    return { cpu: next, input: neutralInput() }
  }

  // Guard: once per opponent attack, decide whether to block it. Only an attack slower than its
  // reaction can be seen coming; it starts holding back once its reaction time has passed.
  const attack = opp.action === 'attack' && opp.attack ? opp.attack : null
  if (attack) {
    const start = s.frame - attack.frame
    if (next.watched !== start) {
      const startup = moveOrNull(oppData, attack)?.startup ?? 0
      const [value, seed] = draw(next.seed)
      next.seed = seed
      next.watched = start
      next.blocking = startup > spec.reaction && value < spec.block
    }
    if (
      next.watched === start &&
      next.blocking &&
      attack.frame >= spec.reaction &&
      (canAct(me) || me.action === 'blockstun')
    ) {
      const low = moveOrNull(oppData, attack)?.guard === 'low'
      next.plan = []
      return { cpu: next, input: stick(low ? 1 : 4, me.facing) }
    }
  } else {
    next.blocking = false
  }
  // Still in blockstun: keep holding back, so a follow-up is blocked too.
  if (me.action === 'blockstun')
    return { cpu: next, input: stick(4, me.facing) }

  if (next.plan.length) {
    const [input, ...rest] = next.plan
    next.plan = rest
    return { cpu: next, input: input! }
  }
  if (!canAct(me)) return { cpu: next, input: neutralInput() }
  if (next.wait > 0) {
    next.wait -= 1
    return {
      cpu: next,
      input: next.guarding ? stick(4, me.facing) : neutralInput(),
    }
  }
  const decision = decide(next, s, me, opp, data)
  next = {
    ...next,
    seed: decision.seed,
    wait: decision.wait,
    guarding: decision.guarding,
  }
  const [input, ...rest] = decision.plan
  next.plan = rest
  return { cpu: next, input: input ?? neutralInput() }
}
