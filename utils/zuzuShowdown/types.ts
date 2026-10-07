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

import type {
  ButtonSpec,
  CommandLevel,
  EasyTable,
  Motion,
  MotionState,
} from './motion'

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

/** Frames (inclusive, counted like `startup`) when a property is live. */
export type FrameWindow = { from: number; to: number }

export type ProjectileData = {
  /** Move frame on which it appears. */
  spawnFrame: number
  /** Where it appears, pixels from the thrower's feet (facing right). */
  spawn: { x: number; y: number }
  box: Box
  /** Sub-pixels per frame, forward. */
  speed: number
  /** Frames before it fizzles. */
  life: number
  /**
   * A boomerang: after this many frames it turns back toward its thrower,
   * can hit once on the way out and once on the way back, and is caught when
   * it reaches the thrower.
   */
  returnAfter?: number
}

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
  /** Damage dealt through a block (specials and supers). */
  chip?: number
  /** Pops the defender high for an air combo; the attacker may super jump. */
  launcher?: boolean
  /** On contact, the move may be cancelled into this level or higher. */
  cancel?: CommandLevel
  /** Invulnerable to strikes / projectiles / throws during the window. */
  invuln?: FrameWindow & {
    strike?: boolean
    projectile?: boolean
    throw?: boolean
  }
  /** Absorbs this many hits during the window (damage still lands). */
  armor?: FrameWindow & { hits: number }
  /** A strike landing in the window is caught and answered for `damage`. */
  parry?: FrameWindow & { damage: number }
  /** A command grab: the hitbox grabs, ignores guard, and can't be teched. */
  grab?: boolean
  projectile?: ProjectileData
  /** Self-movement, sub-pixels per frame (x forward, y up). */
  velocity?: FrameWindow & { x: number; y?: number }
  /** Multi-hit: up to `hits` contacts, `rehit` frames apart. */
  hits?: number
  rehit?: number
  /** Poison: 1 health (as red) every `every` frames for `frames`. */
  poison?: { frames: number; every: number }
  /** Against a childGuard fighter, the renderer plays the fling variant. */
  fling?: boolean
  /** Super flash: frames the whole screen freezes when the move starts. */
  freeze?: number
  /** A Level 3 Showdown super: the renderer cuts to the eye strip. */
  showdown?: boolean
  meterCost?: number
  /** May repeat inside one combo without tripping infinite protection. */
  rapid?: boolean
  /** The body passes through the opponent (no pushbox) during the window. */
  passThrough?: FrameWindow
}

/** A command move: a motion plus a button (or Easy Special) runs `move`. */
export type SpecialMove = {
  id: string
  motion: Motion
  button: ButtonSpec
  level: CommandLevel
  air?: boolean
  move: MoveData
  /** Overrides for the heavy-button version. */
  heavy?: Partial<MoveData>
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
  /** Normals each normal may chain into on contact. */
  chains: Partial<Record<NormalId, NormalId[]>>
  specials: SpecialMove[]
  easy?: EasyTable
  /** The Siblings: fling variants replace bites, stabs and rolls. */
  childGuard?: boolean
  /** Colours (and a hat) for the stand-in renderer until sprites exist. */
  look?: FighterLook
}

export type FighterLook = {
  body: string
  light: string
  dark: string
  hat?: 'kasa'
}

export type Action =
  | 'idle'
  | 'walk'
  | 'crouch'
  | 'prejump'
  | 'jump'
  | 'land'
  | 'attack'
  | 'dodge'
  | 'taunt'
  | 'hitstun'
  | 'blockstun'
  | 'airhit'
  | 'knockdown'
  | 'wakeup'
  | 'breakout'
  | 'throwing'
  | 'throwHold'
  | 'throwWhiff'
  | 'thrown'
  | 'tech'
  | 'ko'
  | 'victory'

export type AttackLevel = 'normal' | CommandLevel

export type AttackState = {
  /** A NormalId, or a SpecialMove id. */
  id: string
  level: AttackLevel
  /** Frames into the move, starting at 1 on the first frame. */
  frame: number
  /** The hitbox has touched this activation (reset between multi-hits). */
  connected: boolean
  /** The move has hit or been blocked at least once (opens cancels). */
  contact: boolean
  hitCount: number
  lastHitFrame: number
  armorUsed: number
  heavy: boolean
  easy: boolean
  /** A dodge or invulnerability already scored READ! against this move. */
  read: boolean
}

export type ComboState = {
  hits: number
  damage: number
  moves: string[]
}

export type FighterState = {
  x: number
  y: number
  vx: number
  vy: number
  facing: Facing
  health: number
  /** Lost health that regenerates while the fighter isn't being hit. */
  red: number
  /** Super meter, 0 .. METER_MAX. */
  meter: number
  action: Action
  /** Frames spent in the current action (1 on the first frame). */
  frame: number
  /** Frames left in a timed state (stun, knockdown, wakeup, tech ...). */
  stun: number
  attack: AttackState | null
  /** The combo being landed on this fighter. */
  combo: ComboState
  /** Remaining pushback to slide, world sub-pixels (signed). */
  push: number
  /** -1 back, 0 neutral, 1 forward, captured when the jump starts. */
  jumpDir: -1 | 0 | 1
  airAttackUsed: boolean
  /** Throw: the defender lands on the far side (the thrower held back). */
  throwBack: boolean
  /** Dodge direction: 1 forward roll, -1 back sidestep. */
  dodgeDir: 1 | -1
  /** Frames since the last hit taken (gates red-health regeneration). */
  sinceHit: number
  poison: { left: number; every: number }
  /** Frames left in which a special counts as a REVERSAL. */
  reversal: number
  /** Frames left to super-jump-cancel a launcher. */
  jumpCancel: number
  motion: MotionState
  /** Buttons pressed during a freeze, applied on the first free frame. */
  buffer: BufferedButton[]
  /** Last applied input, for press edges. */
  prev: SimInput
}

export type BufferedButton = 'lp' | 'hp' | 'lk' | 'hk' | 'dodge' | 'special'

export type Projectile = {
  owner: 0 | 1
  /** The special that threw it. */
  move: string
  heavy: boolean
  x: number
  y: number
  vx: number
  facing: Facing
  life: number
  /** Frames since it was thrown. */
  age: number
  /** A boomerang on its way back. */
  returning: boolean
  /** It has hit (or been blocked) on this pass. */
  struck: boolean
}

export type Phase = 'intro' | 'fight' | 'ko' | 'over'

export type RoundResult = 0 | 1 | 'draw'

export type ReadKind = 'strike' | 'grab' | 'guard'

export type SimEvent =
  | { type: 'roundStart'; round: number }
  | { type: 'fight'; round: number }
  | {
      type: 'hit'
      attacker: 0 | 1
      move: string
      damage: number
      combo: number
      counter: boolean
    }
  | { type: 'block'; attacker: 0 | 1; move: string; chip: number }
  | { type: 'throw'; attacker: 0 | 1; damage: number }
  | { type: 'throwWhiff'; attacker: 0 | 1 }
  | { type: 'tech'; attacker: 0 | 1 }
  | { type: 'read'; side: 0 | 1; kind: ReadKind }
  | { type: 'firstAttack'; side: 0 | 1 }
  | { type: 'reversal'; side: 0 | 1; move: string }
  | { type: 'special'; side: 0 | 1; move: string; easy: boolean }
  | { type: 'super'; side: 0 | 1; move: string; showdown: boolean }
  | { type: 'parry'; side: 0 | 1 }
  | { type: 'armor'; side: 0 | 1 }
  | { type: 'breakout'; side: 0 | 1 }
  | { type: 'breaker'; side: 0 | 1 }
  | { type: 'fling'; attacker: 0 | 1; move: string }
  | { type: 'clash' }
  | { type: 'taunt'; side: 0 | 1 }
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
  /** Frames left in a super flash (everything but the clock stops). */
  freeze: number
  firstAttack: boolean
  fighters: [FighterState, FighterState]
  projectiles: Projectile[]
  /** Events produced by the latest step only (for sound, effects, HUD). */
  events: SimEvent[]
  winner: RoundResult | null
}
