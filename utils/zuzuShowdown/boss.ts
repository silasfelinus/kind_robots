// /utils/zuzuShowdown/boss.ts
//
// The Thing Behind the Door (conductor zuzu-showdown t-021, fighters.yaml `boss`): the arcade's final
// fight, on the Thin Place, after the Swamp Witch sinks into the mud. It is never seen whole: a door of
// starry dark at the stage's edge and what comes through it. It never moves and is never stunned or
// thrown (FighterData `immovable`); the player wears it down while reading its tentacles.
//
//   Phase 1: tentacles slam down where you stand and sweep the floor; the eye fires a low beam you
//            dodge through or jump.
//   Phase 2 (below 50%): the door widens; grasping tentacles try command grabs and minor portals open
//            under you.
//   Phase 3 (below 20%): the eye comes close enough to hit directly, and hits on it do double.
//
// One long round. Its attacks are Easy Specials its own AI (bossInput) fires by phase; the renderer
// draws the door, the eye and the tentacle that is striking from the T021 layers (bossArt.ts).

import {
  SUB,
  neutralInput,
  type FighterData,
  type MatchState,
  type MoveData,
  type SimInput,
  type SpecialMove,
} from './types'
import { defaultChains, defaultNormals } from './fighters/placeholders'
import { phaseIndex } from './sim'
import { BOSS_SLUG } from './arcade'

/** Half the door's width: it stands flush against the stage's right edge. */
const DOOR_HALF = 30
const NO_HITBOX = { x: 0, y: 0, w: 0, h: 0 }

/**
 * The door's stones and the tentacles massed at its foot, reaching out past its pushbox so every
 * fighter's normals land on it: the target in phases 1 and 2.
 */
const DOOR_HURT = { x: -DOOR_HALF, y: 0, w: DOOR_HALF * 3, h: 110 }
/** Phase 3: the eye, out of the door and down at head height. */
const EYE_HURT = { x: -6, y: 40, w: 72, h: 48 }

// A tentacle rises over where the opponent stood and crashes down: blockable, and it knocks down.
const slam: MoveData = {
  startup: 34,
  active: 6,
  recovery: 40,
  hitbox: { x: -16, y: 0, w: 32, h: 112 },
  damage: 120,
  chip: 12,
  hitstun: 26,
  blockstun: 18,
  hitstop: 10,
  pushback: 8,
  guard: 'mid',
  knockdown: true,
  strikeAt: 'opponent',
}

// A tentacle sweeps out along the floor from the door: block it low or jump it.
const sweep: MoveData = {
  startup: 28,
  active: 12,
  recovery: 36,
  hitbox: { x: 10, y: 0, w: 280, h: 24 },
  damage: 100,
  chip: 10,
  hitstun: 24,
  blockstun: 16,
  hitstop: 8,
  pushback: 10,
  guard: 'low',
  knockdown: true,
}

// The eye fires a low beam across the stage: dodge through it, jump it, or block it.
const beam: MoveData = {
  startup: 30,
  active: 1,
  recovery: 30,
  hitbox: NO_HITBOX,
  damage: 90,
  chip: 9,
  hitstun: 22,
  blockstun: 14,
  hitstop: 8,
  pushback: 8,
  guard: 'mid',
  projectile: {
    spawnFrame: 30,
    spawn: { x: 40, y: 34 },
    box: { x: -16, y: -6, w: 32, h: 12 },
    speed: 7 * SUB,
    life: 90,
  },
}

// Phase 2: a tentacle bursts up under the opponent and drags at them. A grab: jump it.
const grasp: MoveData = {
  startup: 30,
  active: 4,
  recovery: 44,
  hitbox: { x: -22, y: 0, w: 44, h: 90 },
  damage: 160,
  hitstun: 0,
  blockstun: 0,
  hitstop: 12,
  pushback: 0,
  guard: 'mid',
  grab: true,
  fling: true,
  strikeAt: 'opponent',
}

// Phase 2: minor portals open in the floor under the opponent, three bursts.
const portals: MoveData = {
  startup: 26,
  active: 30,
  recovery: 34,
  hitbox: { x: -26, y: 0, w: 52, h: 64 },
  damage: 50,
  chip: 5,
  hitstun: 18,
  blockstun: 12,
  hitstop: 6,
  pushback: 4,
  guard: 'mid',
  hits: 3,
  rehit: 10,
  strikeAt: 'opponent',
}

const special = (id: string, move: MoveData): SpecialMove => ({
  id,
  motion: 'qcf',
  button: 'P',
  level: 'special',
  move,
})

export const BOSS: FighterData = {
  slug: BOSS_SLUG,
  name: 'The Thing Behind the Door',
  health: 1600,
  walkForward: 0,
  walkBack: 0,
  jumpVelocity: 0,
  jumpForward: 0,
  gravity: Math.round(0.5 * SUB),
  pushbox: { x: -DOOR_HALF, y: 0, w: DOOR_HALF * 2, h: 120 },
  hurtStand: DOOR_HURT,
  hurtCrouch: DOOR_HURT,
  hurtAir: DOOR_HURT,
  throwRange: 0,
  throwDamage: 0,
  moves: defaultNormals(120),
  chains: defaultChains(),
  specials: [
    special('slam', slam),
    special('sweep', sweep),
    special('beam', beam),
    special('grasp', grasp),
    special('portals', portals),
  ],
  easy: {
    neutral: 'slam',
    forward: 'sweep',
    back: 'beam',
    down: 'grasp',
    super: 'portals',
  },
  look: { body: '#1e1030', light: '#facc15', dark: '#0b0614' },
  immovable: true,
  startX: 384 - DOOR_HALF,
  phases: [
    { below: 50, hurtStand: DOOR_HURT },
    { below: 20, hurtStand: EYE_HURT, damageTaken: 200 },
  ],
  singleRound: true,
}

/** The boss's phase now: 0 (first), 1 (below half) or 2 (the eye is out). */
export function bossPhase(match: MatchState, side: 0 | 1 = 1): number {
  return phaseIndex(match.fighters[side].health, BOSS)
}

export type BossMove = 'slam' | 'sweep' | 'beam' | 'grasp' | 'portals'

/** What the Thing may do in each phase, and how often (weights). */
export const BOSS_PATTERNS: Record<number, Array<[BossMove, number]>> = {
  0: [
    ['slam', 45],
    ['sweep', 30],
    ['beam', 25],
  ],
  1: [
    ['slam', 25],
    ['sweep', 20],
    ['beam', 20],
    ['grasp', 20],
    ['portals', 15],
  ],
  2: [
    ['slam', 20],
    ['sweep', 20],
    ['beam', 25],
    ['grasp', 15],
    ['portals', 20],
  ],
}

/** Frames it waits between attacks in each phase: [least, most]. */
export const BOSS_COOLDOWN: Record<number, [number, number]> = {
  0: [50, 80],
  1: [40, 65],
  2: [30, 50],
}

export type BossState = { wait: number; rng: number }

export function newBoss(seed: number): BossState {
  return { wait: 90, rng: seed >>> 0 || 1 }
}

function next(rng: number): number {
  let x = rng | 0 || 1
  x ^= x << 13
  x ^= x >>> 17
  x ^= x << 5
  return x >>> 0
}

/** The button presses for `move` (an Easy Special: Special plus a direction, or plus HP for portals). */
export function bossPress(move: BossMove, facing: 1 | -1): SimInput {
  const input = { ...neutralInput(), special: true }
  if (move === 'sweep') {
    if (facing === 1) input.right = true
    else input.left = true
  } else if (move === 'beam') {
    if (facing === 1) input.left = true
    else input.right = true
  } else if (move === 'grasp') input.down = true
  else if (move === 'portals') input.hp = true
  return input
}

const READY = new Set(['idle', 'walk', 'crouch'])

/** The Thing's input this frame (it plays `side`). */
export function bossInput(
  state: BossState,
  match: MatchState,
  side: 0 | 1 = 1,
): { boss: BossState; input: SimInput } {
  const f = match.fighters[side]
  if (match.phase !== 'fight' || f.attack || !READY.has(f.action))
    return { boss: state, input: neutralInput() }
  if (state.wait > 0)
    return { boss: { ...state, wait: state.wait - 1 }, input: neutralInput() }
  const phase = bossPhase(match, side)
  const pattern = BOSS_PATTERNS[phase]!
  let rng = next(state.rng)
  const total = pattern.reduce((sum, [, weight]) => sum + weight, 0)
  let roll = rng % total
  let move: BossMove = pattern[0]![0]
  for (const [candidate, weight] of pattern) {
    if (roll < weight) {
      move = candidate
      break
    }
    roll -= weight
  }
  rng = next(rng)
  const [least, most] = BOSS_COOLDOWN[phase]!
  const wait = least + (rng % (most - least + 1))
  return { boss: { wait, rng }, input: bossPress(move, f.facing) }
}
