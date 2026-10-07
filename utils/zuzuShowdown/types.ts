// /utils/zuzuShowdown/types.ts
//
// Shared contracts for Zuzu Showdown (conductor project zuzu-showdown), the
// 2D fighting game. The simulation is pure and deterministic: plain,
// JSON-serializable state, integer math only, and no clocks or Math.random,
// so the same input log always replays to the same match. That property is
// what makes online rollback possible later without a rewrite.
//
// Coordinates: x grows to the right and y grows UP from the floor (y = 0).
// Positions and velocities are in sub-pixels (SUB per pixel). Boxes are
// authored in whole pixels, relative to a fighter's feet, as if the fighter
// faces right; the sim mirrors them when the fighter faces left.

/** Sub-pixels per pixel. Every position and velocity is an integer of these. */
export const SUB = 16

export type Facing = 1 | -1

/** A box in pixels: x is the near edge (forward of the feet), y the bottom. */
export type Box = { x: number; y: number; w: number; h: number }

/** A box in world sub-pixels, edges resolved. */
export type WorldBox = {
  left: number
  right: number
  bottom: number
  top: number
}

/** One frame of raw input for one player, in screen directions. */
export type SimInput = {
  up: boolean
  down: boolean
  left: boolean
  right: boolean
  lp: boolean
  hp: boolean
  lk: boolean
  hk: boolean
  dodge: boolean
  /** Easy Specials: Special plus a direction fires a special move. */
  special: boolean
}

export const SIM_BUTTONS = [
  'up',
  'down',
  'left',
  'right',
  'lp',
  'hp',
  'lk',
  'hk',
  'dodge',
  'special',
] as const satisfies ReadonlyArray<keyof SimInput>

export function neutralInput(): SimInput {
  return {
    up: false,
    down: false,
    left: false,
    right: false,
    lp: false,
    hp: false,
    lk: false,
    hk: false,
    dodge: false,
    special: false,
  }
}

/**
 * How a hit must be blocked: `mid` either way, `low` crouching, `high`
 * (overheads and jump-ins) standing.
 */
export type Guard = 'mid' | 'low' | 'high'

export type AttackButton = 'lp' | 'hp' | 'lk' | 'hk'

export type NormalId =
  | 'stand_lp'
  | 'stand_hp'
  | 'stand_lk'
  | 'stand_hk'
  | 'crouch_lp'
  | 'crouch_hp'
  | 'crouch_lk'
  | 'crouch_hk'
  | 'jump_lp'
  | 'jump_hp'
  | 'jump_lk'
  | 'jump_hk'

/**
 * Frame data for one attack. Frames count from 1: the hitbox is live on
 * frames startup .. startup + active - 1, and the move ends after
 * startup + active - 1 + recovery frames.
 */
export type MoveData = {
  startup: number
  active: number
  recovery: number
  hitbox: Box
  damage: number
  hitstun: number
  blockstun: number
  /** Frames both fighters freeze on contact. */
  hitstop: number
  /** Pixels the defender slides back (or the attacker, at the wall). */
  pushback: number
  guard: Guard
  knockdown?: boolean
}

export type FighterData = {
  slug: string
  name: string
  health: number
  /** Sub-pixels per frame. */
  walkForward: number
  walkBack: number
  /** Initial upward velocity, sub-pixels per frame. */
  jumpVelocity: number
  /** Horizontal speed of a forward/back jump, sub-pixels per frame. */
  jumpForward: number
  /** Sub-pixels per frame per frame. */
  gravity: number
  /** Body box used to keep fighters apart (pixels, centred on x). */
  pushbox: Box
  hurtStand: Box
  hurtCrouch: Box
  hurtAir: Box
  /** Throw reach in pixels, measured between pushbox edges. */
  throwRange: number
  throwDamage: number
  moves: Record<NormalId, MoveData>
}

export type Action =
  | 'idle'
  | 'walk'
  | 'crouch'
  | 'prejump'
  | 'jump'
  | 'land'
  | 'attack'
  | 'hitstun'
  | 'blockstun'
  | 'airhit'
  | 'knockdown'
  | 'wakeup'
  | 'throwing'
  | 'throwHold'
  | 'throwWhiff'
  | 'thrown'
  | 'tech'
  | 'ko'
  | 'victory'

export type AttackState = {
  id: NormalId
  /** Frames into the move, starting at 1 on the first frame. */
  frame: number
  connected: boolean
}

export type FighterState = {
  x: number
  y: number
  vx: number
  vy: number
  facing: Facing
  health: number
  action: Action
  /** Frames spent in the current action (1 on the first frame). */
  frame: number
  /** Frames left in a timed state (stun, knockdown, wakeup, tech ...). */
  stun: number
  attack: AttackState | null
  /** Remaining pushback to slide, world sub-pixels (signed). */
  push: number
  /** -1 back, 0 neutral, 1 forward, captured when the jump starts. */
  jumpDir: -1 | 0 | 1
  airAttackUsed: boolean
  /** Throw: the defender lands on the far side (the thrower held back). */
  throwBack: boolean
  /** Last applied input, for press edges. */
  prev: SimInput
}

export type Phase = 'intro' | 'fight' | 'ko' | 'over'

export type RoundResult = 0 | 1 | 'draw'

export type SimEvent =
  | { type: 'roundStart'; round: number }
  | { type: 'fight'; round: number }
  | { type: 'hit'; attacker: 0 | 1; move: NormalId; damage: number }
  | { type: 'block'; attacker: 0 | 1; move: NormalId }
  | { type: 'throw'; attacker: 0 | 1; damage: number }
  | { type: 'throwWhiff'; attacker: 0 | 1 }
  | { type: 'tech'; attacker: 0 | 1 }
  | { type: 'ko'; result: RoundResult }
  | { type: 'timeOver'; result: RoundResult }
  | { type: 'matchOver'; winner: RoundResult }

export type MatchState = {
  frame: number
  phase: Phase
  phaseFrame: number
  round: number
  /** Frames left on the round clock. */
  timer: number
  wins: [number, number]
  results: RoundResult[]
  /** Frames left in a global hit freeze. */
  hitstop: number
  fighters: [FighterState, FighterState]
  /** Events produced by the latest step only (for sound, effects, HUD). */
  events: SimEvent[]
  winner: RoundResult | null
}
