// /utils/zuzuShowdown/sim.ts
//
// The Zuzu Showdown match simulation: one pure step per 60 Hz frame.
//
//   const next = step(state, [p1Input, p2Input], roster)
//
// `step` never mutates its argument and uses integer math only, so a match is
// a function of (roster, input log).
//
// t-003 (the core): movement, jumping, crouching, blocking high and low with
// proximity guard, normals with hit/block stun and hitstop, pushback (onto the
// attacker at the wall), knockdown and wake-up, throws with a tech window, and
// rounds (best of three, a 99 s clock, KO, time over, double KO).
//
// t-005 (combat systems, DESIGN-BRIEF.md "The Showdown triangle", "Combos",
// "Meter, life and rounds"): chains and cancels, the launcher with a super
// jump into an air chain, damage scaling, infinite protection (Breakout),
// specials and supers read by motion.ts (super flash, Showdown supers),
// projectiles, invulnerability, armor, parries, command grabs, poison, dodge,
// the strike/grab/guard READ!, counter hits, FIRST ATTACK and REVERSAL, red
// recoverable health, the three-bar meter, the Combo Breaker, the taunt, and
// the fling flag for the Siblings.
//
// t-016 (Storm Crow and River Croc): flight mode, a dive that bounces off,
// a grab that reels the victim in, strikes placed at the opponent's spot, a
// submerged body that only lows can touch with its follow-up, armor that soaks
// light hits only, and frozen red health.

import {
  EASY_DAMAGE_PERCENT,
  dirOf,
  emptyMotion,
  pushDir,
  resolveCommand,
  type CommandSpec,
  type Pressed,
} from './motion'
import {
  SIM_BUTTONS,
  SUB,
  neutralInput,
  type Action,
  type AttackButton,
  type AttackLevel,
  type AttackState,
  type Box,
  type BufferedButton,
  type Facing,
  type FighterData,
  type FighterState,
  type FrameWindow,
  type MatchState,
  type MoveData,
  type NormalId,
  type ReadKind,
  type RoundResult,
  type SimInput,
  type SpecialMove,
  type WorldBox,
} from './types'

export const FPS = 60
export const INTRO_FRAMES = 90
export const KO_FRAMES = 150
export const ROUND_FRAMES = 99 * FPS
export const ROUNDS_TO_WIN = 2
/** A match ends after this many rounds even if draws kept anyone from 2 wins. */
export const MAX_ROUNDS = 5

/** Stage edges, in pixels either side of centre. */
export const STAGE_HALF_WIDTH = 384
/** Pixels between a teleporting fighter and the opponent they appear behind. */
const TELEPORT_GAP = 28
/** Fighters can't walk further apart than one screen. */
export const MAX_SEPARATION = 400
export const START_OFFSET = 70

export const PREJUMP_FRAMES = 4
export const LANDING_FRAMES = 3
export const KNOCKDOWN_FRAMES = 40
export const WAKEUP_FRAMES = 20
export const THROW_STARTUP = 5
export const THROW_WHIFF_FRAMES = 20
/** Frames after being grabbed in which LP+LK breaks the throw. */
export const TECH_WINDOW = 7
export const THROW_HOLD_FRAMES = 30
export const TECH_FRAMES = 18
export const TECH_PUSH = 40
export const AIRHIT_POP = 5 * SUB
export const AIRHIT_DRIFT = 2 * SUB
/** A returning boomerang is caught this close (pixels) to its thrower. */
export const CATCH_RANGE = 16
/**
 * A spinning grab passes through up (a 720 twice): for this many frames of the
 * jump it starts, a finished 360 or 720 still grabs on the ground.
 */
const GRAB_LENIENCY = 20
/** Holding back within this range of an incoming attack guards in place. */
export const PROXIMITY_GUARD = 140

// Meter: three bars of METER_BAR.
export const METER_BAR = 1000
export const METER_MAX = 3 * METER_BAR
export const READ_METER = 250
export const TAUNT_METER = 100
export const BLOCK_METER = 10
export const BREAKER_COST = 2 * METER_BAR

// Life: this share of every hit's damage stays red and can regenerate.
export const RED_PERCENT = 40
export const REGEN_DELAY = 90
export const REGEN_EVERY = 3

// Combos.
/** Frames after contact in which a chain or cancel is accepted. */
export const CANCEL_WINDOW = 14
export const SCALE_STEP = 10
export const SCALE_FLOOR = 30
export const MAX_COMBO_HITS = 30
export const MIN_HITSTUN = 6
export const COUNTER_HITSTUN = 4
export const COUNTER_DAMAGE_PERCENT = 120
export const LAUNCH_POP = 11 * SUB
export const SUPER_JUMP_VELOCITY = 12 * SUB
export const JUMP_CANCEL_WINDOW = 18
/** The super jump ends up this close (pixels) to the launched opponent. */
export const SUPER_JUMP_REACH = 20
export const SUPER_JUMP_CLOSE_FRAMES = 16
export const BREAKOUT_FRAMES = 24
export const BREAKER_STUN = 24
export const BREAKER_PUSH = 60
export const PARRY_STUN = 22
export const REVERSAL_WINDOW = 3
export const TAUNT_FRAMES = 45

/** Dodge: a forward roll through the opponent, or a short back sidestep. */
export const DODGE = {
  forward: {
    frames: 22,
    invuln: { from: 3, to: 14 },
    move: { from: 1, to: 14 },
    speed: 5 * SUB,
  },
  back: {
    frames: 18,
    invuln: { from: 2, to: 10 },
    move: { from: 1, to: 10 },
    speed: 2 * SUB,
  },
} as const

/** Flight mode (Take Wing): speed either way, the height he climbs to, and his ceiling, in pixels. */
export const FLIGHT_SPEED = 3 * SUB
export const FLIGHT_HOVER = 40
export const FLIGHT_CEILING = 150

type Pair<T> = [T, T]
type Side = 0 | 1
type HitKind = 'strike' | 'projectile' | 'throw'

const other = (side: Side): Side => (side === 0 ? 1 : 0)
const within = (window: FrameWindow, frame: number) =>
  frame >= window.from && frame <= window.to

// ---------------------------------------------------------------- setup

function freshFighter(data: FighterData, side: Side): FighterState {
  return {
    x: (side === 0 ? -START_OFFSET : START_OFFSET) * SUB,
    y: 0,
    vx: 0,
    vy: 0,
    facing: side === 0 ? 1 : -1,
    health: data.health,
    red: 0,
    meter: 0,
    action: 'idle',
    frame: 0,
    stun: 0,
    attack: null,
    combo: { hits: 0, damage: 0, moves: [] },
    push: 0,
    jumpDir: 0,
    airAttackUsed: false,
    throwBack: false,
    dodgeDir: 1,
    sinceHit: REGEN_DELAY,
    poison: { left: 0, every: 0 },
    reversal: 0,
    jumpCancel: 0,
    ammo: data.ammo ?? 0,
    blind: 0,
    bell: 0,
    flight: 0,
    redFreeze: 0,
    motion: emptyMotion(),
    buffer: [],
    prev: neutralInput(),
  }
}

/** The default seed; a replay must pass the same one. */
export const DEFAULT_SEED = 0x9e3779b9

export function createMatch(
  roster: Pair<FighterData>,
  seed: number = DEFAULT_SEED,
): MatchState {
  return {
    frame: 0,
    phase: 'intro',
    phaseFrame: 0,
    round: 1,
    timer: ROUND_FRAMES,
    wins: [0, 0],
    results: [],
    hitstop: 0,
    freeze: 0,
    firstAttack: false,
    fighters: [freshFighter(roster[0], 0), freshFighter(roster[1], 1)],
    projectiles: [],
    events: [{ type: 'roundStart', round: 1 }],
    winner: null,
    rng: seed >>> 0 || DEFAULT_SEED,
  }
}

/** Advance the seeded generator (xorshift32) and return the next value. */
export function nextRandom(s: MatchState): number {
  let x = s.rng
  x ^= x << 13
  x ^= x >>> 17
  x ^= x << 5
  s.rng = x >>> 0
  return s.rng
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}

// ---------------------------------------------------------------- moves

function specialOf(data: FighterData, id: string): SpecialMove | undefined {
  return data.specials.find((special) => special.id === id)
}

/** The frame data for an attack: a normal, or a special with its heavy overrides. */
export function moveOf(
  data: FighterData,
  attack: Pick<AttackState, 'id' | 'heavy'>,
): MoveData {
  const normal = (data.moves as Record<string, MoveData | undefined>)[attack.id]
  if (normal) return normal
  const special = specialOf(data, attack.id)
  if (!special) throw new Error(`zuzuShowdown: unknown move ${attack.id}`)
  return attack.heavy && special.heavy
    ? { ...special.move, ...special.heavy }
    : special.move
}

function moveTotal(move: MoveData): number {
  return move.startup + move.active - 1 + move.recovery
}

function newAttack(
  id: string,
  level: AttackLevel,
  heavy = false,
  easy = false,
): AttackState {
  return {
    id,
    level,
    frame: 1,
    connected: false,
    contact: false,
    hitCount: 0,
    lastHitFrame: 0,
    armorUsed: 0,
    heavy,
    easy,
    read: false,
  }
}

// ---------------------------------------------------------------- boxes

/** Resolve a pixel box authored facing right into world sub-pixels. */
export function toWorld(
  f: Pick<FighterState, 'x' | 'y' | 'facing'>,
  box: Box,
): WorldBox {
  const near = box.x * SUB
  const far = (box.x + box.w) * SUB
  const left = f.facing === 1 ? f.x + near : f.x - far
  const right = f.facing === 1 ? f.x + far : f.x - near
  return {
    left,
    right,
    bottom: f.y + box.y * SUB,
    top: f.y + (box.y + box.h) * SUB,
  }
}

function overlaps(a: WorldBox, b: WorldBox): boolean {
  return (
    a.left < b.right && b.left < a.right && a.bottom < b.top && b.bottom < a.top
  )
}

function isAirborne(f: FighterState): boolean {
  return f.action === 'jump' || f.action === 'airhit' || f.y > 0
}

function isCrouching(f: FighterState): boolean {
  return (
    f.action === 'crouch' ||
    (f.action === 'attack' && f.attack?.id.startsWith('crouch_') === true)
  )
}

const FULLY_INVULNERABLE: ReadonlySet<Action> = new Set([
  'knockdown',
  'wakeup',
  'thrown',
  'throwHold',
  'tech',
  'breakout',
  'ko',
  'victory',
])

/** The body box, or null in states nothing can touch (knockdown, throws ...). */
export function hurtbox(f: FighterState, data: FighterData): WorldBox | null {
  if (FULLY_INVULNERABLE.has(f.action)) return null
  if (f.attack) {
    const move = moveOf(data, f.attack)
    if (move.hurtbox && f.attack.frame >= move.startup)
      return toWorld(f, move.hurtbox)
  }
  if (isAirborne(f)) return toWorld(f, data.hurtAir)
  if (isCrouching(f) || (f.action === 'blockstun' && f.prev.down)) {
    return toWorld(f, data.hurtCrouch)
  }
  return toWorld(f, data.hurtStand)
}

/** Invulnerable to this kind of attack right now (dodges, invincible specials). */
function invulnerable(
  f: FighterState,
  data: FighterData,
  kind: HitKind,
  guard?: MoveData['guard'],
): boolean {
  if (FULLY_INVULNERABLE.has(f.action)) return true
  if (f.action === 'dodge') {
    const spec = f.dodgeDir === 1 ? DODGE.forward : DODGE.back
    // Only a dodge's recovery can be grabbed.
    if (kind === 'throw') return f.frame <= spec.invuln.to
    return within(spec.invuln, f.frame)
  }
  if (f.attack) {
    const invuln = moveOf(data, f.attack).invuln
    if (
      invuln &&
      within(invuln, f.attack.frame) &&
      invuln[kind] &&
      !(invuln.exceptLow && guard === 'low')
    )
      return true
  }
  return false
}

/** The live hitbox of the current attack, or null. */
export function hitbox(f: FighterState, data: FighterData): WorldBox | null {
  const attack = f.attack
  if (!attack || attack.connected) return null
  const move = moveOf(data, attack)
  if (
    attack.frame < move.startup ||
    attack.frame >= move.startup + move.active
  ) {
    return null
  }
  if (move.hitbox.w <= 0 || move.hitbox.h <= 0) return null
  return toWorld(strikeOrigin(f, attack, move), move.hitbox)
}

/**
 * Where a move's hitbox is measured from: the fighter, or for a `strikeAt`
 * move the floor where the opponent stood when it started.
 */
export function strikeOrigin(
  f: Pick<FighterState, 'x' | 'y' | 'facing'>,
  attack: Pick<AttackState, 'targetX'>,
  move: MoveData,
): Pick<FighterState, 'x' | 'y' | 'facing'> {
  if (move.strikeAt !== 'opponent' || attack.targetX === undefined) return f
  return { x: attack.targetX, y: 0, facing: f.facing }
}

export function pushbox(f: FighterState, data: FighterData): WorldBox {
  return toWorld(f, data.pushbox)
}

export function projectileBox(
  s: MatchState,
  roster: Pair<FighterData>,
  index: number,
): WorldBox | null {
  const p = s.projectiles[index]
  if (!p) return null
  const data = moveOf(roster[p.owner], {
    id: p.move,
    heavy: p.heavy,
  }).projectile
  if (!data) return null
  return toWorld({ x: p.x, y: p.y, facing: p.facing }, data.box)
}

function halfWidth(data: FighterData): number {
  return Math.trunc((data.pushbox.w * SUB) / 2)
}

// ---------------------------------------------------------------- input

type Read = {
  held: SimInput
  pressed: Record<keyof SimInput, boolean>
  forward: boolean
  back: boolean
}

function read(f: FighterState, input: SimInput): Read {
  const pressed = {} as Record<keyof SimInput, boolean>
  for (const button of SIM_BUTTONS)
    pressed[button] = input[button] && !f.prev[button]
  for (const button of f.buffer) pressed[button] = true
  const forward = f.facing === 1 ? input.right : input.left
  const back = f.facing === 1 ? input.left : input.right
  // Holding both directions is neutral, like an arcade stick can't.
  return {
    held: input,
    pressed,
    forward: forward && !back,
    back: back && !forward,
  }
}

function wantsThrow(r: Read): boolean {
  return r.held.lp && r.held.lk && (r.pressed.lp || r.pressed.lk)
}

function wantsTaunt(r: Read): boolean {
  return r.held.dodge && r.held.hk && (r.pressed.dodge || r.pressed.hk)
}

/** Heavy wins when several attack buttons go down on the same frame. */
function pressedAttack(r: Read): AttackButton | null {
  if (r.pressed.hp) return 'hp'
  if (r.pressed.hk) return 'hk'
  if (r.pressed.lp) return 'lp'
  if (r.pressed.lk) return 'lk'
  return null
}

function buttonsOf(r: Record<keyof SimInput, boolean> | SimInput): Pressed {
  return {
    lp: r.lp,
    hp: r.hp,
    lk: r.lk,
    hk: r.hk,
    dodge: r.dodge,
    special: r.special,
  }
}

// ---------------------------------------------------------------- events

function gainMeter(f: FighterState, amount: number): void {
  f.meter = Math.max(0, Math.min(METER_MAX, f.meter + amount))
}

function scoreRead(s: MatchState, side: Side, kind: ReadKind): void {
  gainMeter(s.fighters[side], READ_METER)
  s.events.push({ type: 'read', side, kind })
}

// ---------------------------------------------------------------- actions

function setAction(f: FighterState, action: Action, stun = 0): void {
  f.action = action
  f.frame = 0
  f.stun = stun
  if (action !== 'attack' && action !== 'jump') f.attack = null
}

function startNormal(f: FighterState, id: NormalId): void {
  if (f.action !== 'jump') {
    setAction(f, 'attack')
    f.frame = 1
    f.vx = 0
  }
  f.attack = newAttack(id, 'normal')
}

/**
 * Neutral ground movement. `threatened` is proximity guard: holding back while
 * an attack is on its way stands the fighter in guard instead of walking off.
 */
function groundNeutral(
  f: FighterState,
  data: FighterData,
  r: Read,
  threatened = false,
): void {
  if (r.held.down) {
    if (f.action !== 'crouch') setAction(f, 'crouch')
    f.vx = 0
    return
  }
  if (r.forward) {
    if (f.action !== 'walk') setAction(f, 'walk')
    f.vx = data.walkForward * f.facing
  } else if (r.back && !threatened) {
    if (f.action !== 'walk') setAction(f, 'walk')
    f.vx = -data.walkBack * f.facing
  } else {
    if (f.action !== 'idle') setAction(f, 'idle')
    f.vx = 0
  }
}

/** Back to neutral after a stun; a special in the next frames is a REVERSAL. */
function recover(f: FighterState, data: FighterData, r: Read): void {
  setAction(f, 'idle')
  f.reversal = REVERSAL_WINDOW
  groundNeutral(f, data, r)
}

const ACTIONABLE: ReadonlySet<Action> = new Set(['idle', 'walk', 'crouch'])

/** What a contact lets this attack cancel into, if anything. */
function cancelLevel(
  f: FighterState,
  data: FighterData,
): 'special' | 'super' | null {
  const attack = f.attack
  if (!attack || !attack.contact) return null
  if (attack.frame > attack.lastHitFrame + CANCEL_WINDOW) return null
  if (attack.level === 'super') return null
  const cancel = moveOf(data, attack).cancel
  if (!cancel) return null
  if (attack.level === 'special') return 'super'
  return cancel
}

function chainTarget(
  f: FighterState,
  data: FighterData,
  r: Read,
): NormalId | null {
  const attack = f.attack
  if (!attack || attack.level !== 'normal' || !attack.contact) return null
  if (attack.frame > attack.lastHitFrame + CANCEL_WINDOW) return null
  const button = pressedAttack(r)
  if (!button) return null
  const stance = f.action === 'jump' ? 'jump' : r.held.down ? 'crouch' : 'stand'
  const next = `${stance}_${button}` as NormalId
  return data.chains[attack.id as NormalId]?.includes(next) ? next : null
}

/** The special or super this frame's input fires, honouring meter and cancels. */
function pickCommand(
  s: MatchState,
  side: Side,
  data: FighterData,
  r: Read,
  airborne: boolean,
  minLevel: 'special' | 'super',
  spinsOnly = false,
): { special: SpecialMove; heavy: boolean; easy: boolean } | null {
  const f = s.fighters[side]
  const hasProjectile = s.projectiles.some((p) => p.owner === side)
  const allowed = data.specials.filter(
    (special) =>
      !special.followUp &&
      (!spinsOnly || special.motion === '360' || special.motion === '720') &&
      (special.air ?? false) === airborne &&
      (minLevel === 'special' || special.level === 'super') &&
      f.meter >= (special.move.meterCost ?? 0) &&
      !(hasProjectile && special.move.projectile) &&
      f.ammo >= (special.move.ammoCost ?? 0),
  )
  if (allowed.length === 0) return null
  const commands: CommandSpec[] = allowed.map((special) => ({
    id: special.id,
    motion: special.motion,
    button: special.button,
    level: special.level,
    air: special.air,
  }))
  const result = resolveCommand(
    f.motion,
    buttonsOf(r.pressed),
    buttonsOf(r.held),
    commands,
    airborne,
    data.easy,
  )
  if (!result) return null
  const special = allowed.find((candidate) => candidate.id === result.id)
  if (!special) return null
  const heavy = result.button === 'hp' || result.button === 'hk'
  return { special, heavy, easy: result.easy }
}

function startCommand(
  s: MatchState,
  side: Side,
  special: SpecialMove,
  heavy: boolean,
  easy: boolean,
): void {
  const f = s.fighters[side]
  if (special.air) {
    f.airAttackUsed = true
  } else {
    setAction(f, 'attack')
    f.frame = 1
    f.vx = 0
  }
  f.attack = newAttack(special.id, special.level, heavy, easy)
  const move =
    special.heavy && heavy
      ? { ...special.move, ...special.heavy }
      : special.move
  if (move.strikeAt === 'opponent') f.attack.targetX = s.fighters[other(side)].x
  gainMeter(f, -(move.meterCost ?? 0))
  f.ammo = Math.max(0, f.ammo - (move.ammoCost ?? 0))
  if (special.level === 'super') {
    s.events.push({
      type: 'super',
      side,
      move: special.id,
      showdown: move.showdown === true,
    })
  } else {
    s.events.push({ type: 'special', side, move: special.id, easy })
  }
  if (f.reversal > 0) {
    s.events.push({ type: 'reversal', side, move: special.id })
    f.reversal = 0
  }
  if (move.freeze) s.freeze = Math.max(s.freeze, move.freeze)
}

function startDodge(f: FighterState, r: Read): void {
  setAction(f, 'dodge')
  f.frame = 1
  f.dodgeDir = r.forward ? 1 : -1
  f.vx = 0
}

function comboBreaker(s: MatchState, side: Side): void {
  const f = s.fighters[side]
  const o = s.fighters[other(side)]
  gainMeter(f, -BREAKER_COST)
  setAction(f, 'breakout', BREAKOUT_FRAMES)
  f.combo = { hits: 0, damage: 0, moves: [] }
  const away: Facing = o.x >= f.x ? 1 : -1
  setAction(o, 'hitstun', BREAKER_STUN)
  o.vx = 0
  o.push = away * BREAKER_PUSH * SUB
  s.events.push({ type: 'breaker', side })
}

function applyMoveVelocity(f: FighterState, move: MoveData): void {
  const velocity = move.velocity
  if (!velocity || !f.attack) return
  // A dive that bounced off keeps the bounce.
  if (move.bounce && f.attack.contact) return
  if (within(velocity, f.attack.frame)) {
    f.vx = velocity.x * f.facing
    if (velocity.y !== undefined) f.vy = velocity.y
  } else if (f.y === 0) {
    f.vx = 0
  }
}

/** Reappear behind the opponent, at the wall beyond them, or under them, facing them. */
function teleport(
  f: FighterState,
  o: FighterState,
  to: 'behind' | 'wall' | 'under',
): void {
  const edge = (STAGE_HALF_WIDTH - 24) * SUB
  const dir = o.x >= f.x ? 1 : -1
  const target =
    to === 'wall'
      ? dir * edge
      : to === 'under'
        ? o.x
        : o.x + dir * TELEPORT_GAP * SUB
  f.x = Math.max(-edge, Math.min(edge, target))
  if (o.x !== f.x) f.facing = o.x > f.x ? 1 : -1
  f.vx = 0
}

/** Into the air in flight mode: he climbs to his hover height, then flies freely. */
function takeWing(f: FighterState, frames: number): void {
  setAction(f, 'jump')
  f.attack = null
  f.flight = frames
  f.vx = 0
  f.vy = FLIGHT_SPEED
  f.airAttackUsed = false
}

/**
 * A frame of flight: directions fly him anywhere (up to the ceiling), and
 * with no direction up he holds his height, rising to it after take-off. An
 * attack that moves him (a dive) steers itself. He keeps facing the opponent.
 */
function fly(
  f: FighterState,
  o: FighterState,
  data: FighterData,
  r: Read,
): void {
  f.flight -= 1
  if (f.attack && moveOf(data, f.attack).velocity) return
  if (!f.attack) f.facing = o.x >= f.x ? 1 : -1
  const forward = f.facing === 1 ? r.held.right : r.held.left
  const back = f.facing === 1 ? r.held.left : r.held.right
  const dir = forward && !back ? 1 : back && !forward ? -1 : 0
  f.vx = dir * FLIGHT_SPEED * f.facing
  if (r.held.up) f.vy = FLIGHT_SPEED
  else if (r.held.down) f.vy = -FLIGHT_SPEED
  else f.vy = f.y < FLIGHT_HOVER * SUB ? FLIGHT_SPEED : 0
  if (f.y + f.vy > FLIGHT_CEILING * SUB) f.vy = FLIGHT_CEILING * SUB - f.y
}

/** A seeded aim wobble of up to `spread` pixels either way. */
function spreadOffset(s: MatchState, spread: number | undefined): number {
  if (!spread) return 0
  return (nextRandom(s) % (2 * spread + 1)) - spread
}

/** Advance the current attack one frame: multi-hit rearm, projectile spawn, end. */
function advanceAttack(
  s: MatchState,
  side: Side,
  data: FighterData,
  r: Read,
): void {
  const f = s.fighters[side]
  const attack = f.attack
  if (!attack) return
  attack.frame += 1
  const move = moveOf(data, attack)
  if (
    attack.connected &&
    move.hits &&
    attack.hitCount < move.hits &&
    attack.frame - attack.lastHitFrame >= (move.rehit ?? 4)
  ) {
    attack.connected = false
  }
  if (move.reload && attack.frame === move.startup) {
    s.fighters[side].ammo = data.ammo ?? 0
  }
  if (move.slowProjectiles && attack.frame === move.startup) {
    f.bell = move.slowProjectiles
  }
  if (move.meterGain && attack.frame === move.startup) {
    gainMeter(f, move.meterGain)
  }
  if (move.teleport && attack.frame === move.teleport.frame) {
    teleport(f, s.fighters[other(side)], move.teleport.to)
  }
  if (move.flight && attack.frame === move.startup) {
    takeWing(f, move.flight)
    return
  }
  const projectile = move.projectile
  if (projectile && attack.frame === projectile.spawnFrame) {
    if (!s.projectiles.some((p) => p.owner === side)) {
      s.projectiles.push({
        owner: side,
        move: attack.id,
        heavy: attack.heavy,
        x: f.x + projectile.spawn.x * SUB * f.facing,
        y:
          f.y + (projectile.spawn.y + spreadOffset(s, projectile.spread)) * SUB,
        vx: projectile.speed * f.facing,
        facing: f.facing,
        life: projectile.life,
        age: 0,
        returning: false,
        struck: false,
      })
    }
  }
  applyMoveVelocity(f, move)
  if (attack.frame > moveTotal(move)) {
    if (f.action === 'jump') {
      f.attack = null
    } else {
      setAction(f, 'idle')
      groundNeutral(f, data, r)
    }
  }
}

/** Input and timers for one fighter, before physics. */
function think(
  s: MatchState,
  side: Side,
  roster: Pair<FighterData>,
  r: Read,
  threatened: boolean,
): void {
  const f = s.fighters[side]
  const data = roster[side]
  const o = s.fighters[other(side)]
  f.frame += 1
  if (f.reversal > 0) f.reversal -= 1
  if (f.jumpCancel > 0) f.jumpCancel -= 1
  if (f.blind > 0 && f.action !== 'hitstun') f.blind -= 1
  if (f.bell > 0) f.bell -= 1
  if (data.ammoRegen && data.ammo && s.frame % data.ammoRegen === 0) {
    f.ammo = Math.min(data.ammo, f.ammo + 1)
  }

  // Combo Breaker: Dodge + any attack while being comboed, for two bars.
  if (
    (f.action === 'hitstun' || f.action === 'airhit') &&
    f.combo.hits > 0 &&
    r.pressed.dodge &&
    (r.held.lp || r.held.hp || r.held.lk || r.held.hk) &&
    f.meter >= BREAKER_COST &&
    o.attack?.level !== 'super'
  ) {
    comboBreaker(s, side)
    return
  }

  // A move's follow-up (Submerge into Erupt): one of its buttons after startup.
  if (f.attack) {
    const move = moveOf(data, f.attack)
    const follow = move.followUp
    if (
      follow &&
      f.attack.frame >= move.startup &&
      (!follow.onHit || f.attack.contact) &&
      follow.buttons.some((button) => r.pressed[button])
    ) {
      const special = specialOf(data, follow.move)
      const motionDone =
        !special ||
        !follow.motion ||
        resolveCommand(
          f.motion,
          buttonsOf(r.pressed),
          buttonsOf(r.held),
          [
            {
              id: special.id,
              motion: special.motion,
              button: special.button,
              level: special.level,
            },
          ],
          false,
          undefined,
        ) !== null
      if (special && motionDone) {
        const heavy = r.pressed.hp || r.pressed.hk
        startCommand(s, side, special, heavy, false)
        return
      }
    }
  }

  // Specials and supers: from neutral, from the air, or cancelling a hit.
  const neutralGround = ACTIONABLE.has(f.action)
  // A 360 passes through up: the jump's pre-jump frames still take a ground
  // special (jump-cancel leniency).
  const preJump = f.action === 'prejump'
  const neutralAir = f.action === 'jump' && !f.attack && f.y > 0
  const cancel = cancelLevel(f, data)
  if (neutralGround || preJump || neutralAir || cancel) {
    const pick = pickCommand(
      s,
      side,
      data,
      r,
      f.action === 'jump',
      neutralGround || preJump || neutralAir ? 'special' : cancel!,
    )
    if (pick) {
      startCommand(s, side, pick.special, pick.heavy, pick.easy)
      return
    }
  }

  // A spinning grab that passed through up: the jump it started gives way to
  // the grab, back on the ground.
  if (f.action === 'jump' && f.frame <= GRAB_LENIENCY && !f.attack) {
    const pick = pickCommand(s, side, data, r, false, 'special', true)
    if (pick) {
      setAction(f, 'idle')
      f.y = 0
      f.vy = 0
      startCommand(s, side, pick.special, pick.heavy, pick.easy)
      return
    }
  }

  // A launcher that hit can be cancelled into a super jump by holding up.
  if (f.action === 'attack' && f.jumpCancel > 0 && r.held.up) {
    setAction(f, 'jump')
    f.attack = null
    f.vy = SUPER_JUMP_VELOCITY
    // The super jump follows the launched opponent: it closes to striking
    // range over the rise.
    const gap = o.x - f.x - f.facing * SUPER_JUMP_REACH * SUB
    f.vx = Math.trunc(gap / SUPER_JUMP_CLOSE_FRAMES)
    f.airAttackUsed = false
    f.jumpCancel = 0
    return
  }

  // Chains: light into heavy, punch into kick, on contact.
  const chain = chainTarget(f, data, r)
  if (chain) {
    startNormal(f, chain)
    return
  }

  if (neutralGround) {
    if (wantsThrow(r)) {
      setAction(f, 'throwing')
      // Counted like an attack: the press frame is frame 1 of the startup.
      f.frame = 1
      f.throwBack = r.back
      f.vx = 0
      return
    }
    if (wantsTaunt(r)) {
      setAction(f, 'taunt', TAUNT_FRAMES)
      f.vx = 0
      gainMeter(f, TAUNT_METER)
      s.events.push({ type: 'taunt', side })
      return
    }
    if (r.pressed.dodge) {
      startDodge(f, r)
      return
    }
    const button = pressedAttack(r)
    if (button) {
      startNormal(f, `${r.held.down ? 'crouch' : 'stand'}_${button}`)
      return
    }
    if (r.held.up) {
      setAction(f, 'prejump')
      f.jumpDir = r.forward ? 1 : r.back ? -1 : 0
      f.vx = 0
      return
    }
    groundNeutral(f, data, r, threatened)
    return
  }

  switch (f.action) {
    case 'prejump':
      if (f.frame >= PREJUMP_FRAMES) {
        setAction(f, 'jump')
        f.vy = data.jumpVelocity
        f.vx = f.jumpDir * data.jumpForward * f.facing
        f.airAttackUsed = false
      }
      return
    case 'jump': {
      // In flight he attacks as often as he likes, at any height.
      const flying = f.flight > 0
      if (flying) fly(f, o, data, r)
      if (f.attack) {
        advanceAttack(s, side, data, r)
      } else if (!f.airAttackUsed || flying) {
        const button = pressedAttack(r)
        if (button) {
          startNormal(f, `jump_${button}`)
          f.airAttackUsed = true
        }
      }
      return
    }
    case 'attack':
      advanceAttack(s, side, data, r)
      return
    case 'dodge': {
      const spec = f.dodgeDir === 1 ? DODGE.forward : DODGE.back
      f.vx = within(spec.move, f.frame) ? f.dodgeDir * spec.speed * f.facing : 0
      if (f.frame >= spec.frames) {
        setAction(f, 'idle')
        groundNeutral(f, data, r)
      }
      return
    }
    case 'land':
      if (f.frame >= LANDING_FRAMES) {
        setAction(f, 'idle')
        groundNeutral(f, data, r)
      }
      return
    case 'tech':
    case 'throwWhiff':
    case 'taunt':
      f.stun -= 1
      if (f.stun <= 0) {
        setAction(f, 'idle')
        groundNeutral(f, data, r)
      }
      return
    case 'hitstun':
    case 'blockstun':
      f.stun -= 1
      if (f.stun <= 0) recover(f, data, r)
      return
    case 'breakout':
      f.stun -= 1
      if (f.stun <= 0 && f.y === 0) recover(f, data, r)
      return
    case 'knockdown':
      f.stun -= 1
      if (f.stun <= 0) setAction(f, 'wakeup', WAKEUP_FRAMES)
      return
    case 'wakeup':
      f.stun -= 1
      if (f.stun <= 0) recover(f, data, r)
      return
    default:
      // throwing / throwHold / thrown / airhit / ko / victory are driven
      // by resolveThrows and physics.
      return
  }
}

// ---------------------------------------------------------------- physics

function physics(f: FighterState, data: FighterData): void {
  // Pushback slides off a quarter at a time, at least one pixel a frame.
  if (f.push !== 0) {
    const sign = f.push > 0 ? 1 : -1
    let slice = Math.trunc(f.push / 4)
    if (Math.abs(slice) < SUB) slice = sign * Math.min(SUB, Math.abs(f.push))
    f.x += slice
    f.push -= slice
  }
  f.x += f.vx
  if (isAirborne(f) || f.vy !== 0) {
    f.y += f.vy
    if (f.flight === 0) f.vy -= data.gravity
    if (f.y <= 0) {
      f.y = 0
      f.vy = 0
      f.vx = 0
      f.flight = 0
      if (f.action === 'airhit') setAction(f, 'knockdown', KNOCKDOWN_FRAMES)
      else if (f.action === 'jump') setAction(f, 'land')
      // Ground moves that rose (an uppercut) finish on the ground; ko and
      // breakout keep their pose.
    }
  }
}

function clampToStage(s: MatchState, roster: Pair<FighterData>): void {
  for (const side of [0, 1] as const) {
    const f = s.fighters[side]
    const limit = STAGE_HALF_WIDTH * SUB - halfWidth(roster[side])
    if (f.x > limit || f.x < -limit) {
      const clamped = f.x > limit ? limit : -limit
      const overflow = f.x - clamped
      f.x = clamped
      // Pushback that can't move the defender into the wall moves the
      // attacker back instead (the corner rule).
      if (f.push !== 0 && Math.sign(f.push) === Math.sign(overflow)) {
        const o = s.fighters[other(side)]
        o.x -= overflow
        f.push = 0
      }
    }
  }
}

function rollingThrough(f: FighterState, data: FighterData): boolean {
  if (f.action === 'dodge') {
    return f.dodgeDir === 1 && within(DODGE.forward.move, f.frame)
  }
  const window = f.attack ? moveOf(data, f.attack).passThrough : undefined
  return (
    window !== undefined && f.attack !== null && within(window, f.attack.frame)
  )
}

function separate(
  s: MatchState,
  roster: Pair<FighterData>,
  startX: Pair<number>,
): void {
  const [a, b] = s.fighters
  // Max separation: the fighter(s) moving away are held back.
  const distance = Math.abs(a.x - b.x)
  const maxSub = MAX_SEPARATION * SUB
  if (distance > maxSub) {
    const overflow = distance - maxSub
    const leftSide: Side = a.x <= b.x ? 0 : 1
    const rightSide = other(leftSide)
    const left = s.fighters[leftSide]
    const right = s.fighters[rightSide]
    const leftAway = startX[leftSide] - left.x
    const rightAway = right.x - startX[rightSide]
    if (leftAway > 0 && rightAway > 0) {
      const half = Math.trunc(overflow / 2)
      left.x += half
      right.x -= overflow - half
    } else if (leftAway > 0) left.x += overflow
    else right.x -= overflow
  }

  // Pushboxes never overlap, except while a forward dodge rolls through.
  if (rollingThrough(a, roster[0]) || rollingThrough(b, roster[1])) return
  const pa = pushbox(a, roster[0])
  const pb = pushbox(b, roster[1])
  if (!overlaps(pa, pb)) return
  const aLeft = a.x < b.x || (a.x === b.x && a.facing === 1)
  const overlap = aLeft ? pa.right - pb.left : pb.right - pa.left
  if (overlap <= 0) return
  const half = Math.trunc(overlap / 2)
  if (aLeft) {
    a.x -= half
    b.x += overlap - half
  } else {
    a.x += half
    b.x -= overlap - half
  }
  clampToStage(s, roster)
  // If the wall stopped one, give the whole gap to the other.
  const pa2 = pushbox(a, roster[0])
  const pb2 = pushbox(b, roster[1])
  if (overlaps(pa2, pb2)) {
    const rest = aLeft ? pa2.right - pb2.left : pb2.right - pa2.left
    if (rest > 0) {
      const aLimit = STAGE_HALF_WIDTH * SUB - halfWidth(roster[0])
      const aAtWall = Math.abs(a.x) >= aLimit
      if (aAtWall) b.x += aLeft ? rest : -rest
      else a.x += aLeft ? -rest : rest
    }
  }
}

function faceEachOther(s: MatchState): void {
  const [a, b] = s.fighters
  for (const [f, o] of [
    [a, b],
    [b, a],
  ] as const) {
    if (f.y !== 0 || !ACTIONABLE.has(f.action)) continue
    if (o.x > f.x) f.facing = 1
    else if (o.x < f.x) f.facing = -1
  }
}

// ---------------------------------------------------------------- throws

const THROWABLE: ReadonlySet<Action> = new Set([
  'idle',
  'walk',
  'crouch',
  'prejump',
  'land',
  'attack',
  'dodge',
  'taunt',
  'throwing',
  'throwWhiff',
])

function inThrowRange(
  s: MatchState,
  roster: Pair<FighterData>,
  side: Side,
  range: number,
): boolean {
  const f = s.fighters[side]
  const o = s.fighters[other(side)]
  const gap =
    Math.abs(f.x - o.x) -
    halfWidth(roster[side]) -
    halfWidth(roster[other(side)])
  return gap <= range * SUB
}

function grabbable(d: FighterState, data: FighterData): boolean {
  return THROWABLE.has(d.action) && d.y === 0 && !invulnerable(d, data, 'throw')
}

function startTech(s: MatchState, attacker: Side): void {
  const a = s.fighters[attacker]
  const d = s.fighters[other(attacker)]
  setAction(a, 'tech', TECH_FRAMES)
  setAction(d, 'tech', TECH_FRAMES)
  const dir: Facing = a.x <= d.x ? 1 : -1
  a.push = -dir * TECH_PUSH * SUB
  d.push = dir * TECH_PUSH * SUB
  s.events.push({ type: 'tech', attacker })
}

/** A grab beats a guard: a grab on a blocking or dodging fighter is a READ!. */
function guarding(d: FighterState, r: Read): boolean {
  return (
    d.action === 'dodge' ||
    d.action === 'blockstun' ||
    (r.back && ACTIONABLE.has(d.action))
  )
}

function resolveThrows(
  s: MatchState,
  roster: Pair<FighterData>,
  reads: Pair<Read>,
): void {
  // A defender breaks the throw with LP+LK inside the window.
  for (const side of [0, 1] as const) {
    const d = s.fighters[side]
    if (d.action !== 'thrown') continue
    const attacker = other(side)
    if (d.frame <= TECH_WINDOW && wantsThrow(reads[side])) {
      startTech(s, attacker)
      continue
    }
    if (d.frame === TECH_WINDOW + 1) {
      const a = s.fighters[attacker]
      const damage = roster[attacker].throwDamage
      d.health = Math.max(0, d.health - damage)
      d.red = Math.min(
        d.red + Math.trunc((damage * RED_PERCENT) / 100),
        roster[side].health - d.health,
      )
      d.sinceHit = 0
      gainMeter(a, damage)
      gainMeter(d, Math.trunc(damage / 2))
      const dir: Facing = a.throwBack ? (-a.facing as Facing) : a.facing
      d.x =
        a.x +
        dir * (halfWidth(roster[attacker]) + halfWidth(roster[side]) + 8 * SUB)
      d.facing = -dir as Facing
      setAction(d, 'knockdown', KNOCKDOWN_FRAMES)
      s.events.push({ type: 'throw', attacker, damage })
    }
  }
  for (const side of [0, 1] as const) {
    const a = s.fighters[side]
    if (a.action === 'throwHold' && a.frame >= THROW_HOLD_FRAMES)
      setAction(a, 'idle')
  }

  // Throw attempts reaching their active frame.
  const ready = ([0, 1] as const).filter(
    (side) =>
      s.fighters[side].action === 'throwing' &&
      s.fighters[side].frame >= THROW_STARTUP,
  )
  if (ready.length === 2 && inThrowRange(s, roster, 0, roster[0].throwRange)) {
    // Grab against grab cancels out.
    startTech(s, 0)
    return
  }
  for (const side of ready) {
    const a = s.fighters[side]
    const defender = other(side)
    const d = s.fighters[defender]
    if (
      grabbable(d, roster[defender]) &&
      inThrowRange(s, roster, side, roster[side].throwRange)
    ) {
      if (guarding(d, reads[defender])) scoreRead(s, side, 'grab')
      setAction(a, 'throwHold')
      setAction(d, 'thrown')
      d.vx = 0
      d.push = 0
    } else {
      setAction(a, 'throwWhiff', THROW_WHIFF_FRAMES)
      s.events.push({ type: 'throwWhiff', attacker: side })
    }
  }
}

// ---------------------------------------------------------------- hits

type Contact = {
  attacker: Side
  id: string
  move: MoveData
  level: AttackLevel
  easy: boolean
  kind: HitKind
  /** Index into s.projectiles, for projectile contacts. */
  projectile: number | null
}

const CAN_BLOCK: ReadonlySet<Action> = new Set([
  'idle',
  'walk',
  'crouch',
  'blockstun',
])

const COMBO_STATES: ReadonlySet<Action> = new Set(['hitstun', 'airhit'])

function blocks(d: FighterState, r: Read, move: MoveData): boolean {
  if (d.y !== 0 || !CAN_BLOCK.has(d.action) || !r.back || d.blind > 0)
    return false
  const crouching = r.held.down
  if (move.guard === 'low') return crouching
  if (move.guard === 'high') return !crouching
  return true
}

/** Damage for the n-th hit of a combo (Skullgirls-style scaling). */
export function scaledDamage(
  base: number,
  hitIndex: number,
  level: AttackLevel,
): number {
  // A move with no damage (Bellow's roar) stays harmless.
  if (base <= 0) return 0
  const scale =
    hitIndex <= 2
      ? 100
      : Math.max(SCALE_FLOOR, 100 - SCALE_STEP * (hitIndex - 2))
  // Supers shrug off half of the scaling.
  const applied =
    level === 'super' ? 100 - Math.trunc((100 - scale) / 2) : scale
  return Math.max(1, Math.trunc((base * applied) / 100))
}

function decayedHitstun(hitstun: number, hitIndex: number): number {
  return Math.max(
    MIN_HITSTUN,
    hitstun - Math.trunc(Math.max(0, hitIndex - 4) / 2),
  )
}

function takeDamage(
  d: FighterState,
  data: FighterData,
  damage: number,
  redPercent: number,
): void {
  d.health = Math.max(0, d.health - damage)
  d.red = Math.min(
    d.red + Math.trunc((damage * redPercent) / 100),
    data.health - d.health,
  )
  d.sinceHit = 0
}

function contactAttack(s: MatchState, c: Contact): AttackState | null {
  if (c.projectile !== null) return null
  return s.fighters[c.attacker].attack
}

function collectContacts(s: MatchState, roster: Pair<FighterData>): Contact[] {
  const contacts: Contact[] = []
  for (const side of [0, 1] as const) {
    const a = s.fighters[side]
    const box = hitbox(a, roster[side])
    if (!box || !a.attack) continue
    const hurt = hurtbox(s.fighters[other(side)], roster[other(side)])
    if (hurt && overlaps(box, hurt)) {
      const move = moveOf(roster[side], a.attack)
      contacts.push({
        attacker: side,
        id: a.attack.id,
        move,
        level: a.attack.level,
        easy: a.attack.easy,
        kind: move.grab ? 'throw' : 'strike',
        projectile: null,
      })
    }
  }
  s.projectiles.forEach((p, index) => {
    if (p.struck) return
    const box = projectileBox(s, roster, index)
    const defender = other(p.owner)
    const hurt = hurtbox(s.fighters[defender], roster[defender])
    if (box && hurt && overlaps(box, hurt)) {
      contacts.push({
        attacker: p.owner,
        id: p.move,
        move: moveOf(roster[p.owner], { id: p.move, heavy: p.heavy }),
        level: specialOf(roster[p.owner], p.move)?.level ?? 'special',
        easy: false,
        kind: 'projectile',
        projectile: index,
      })
    }
  })
  return contacts
}

function landHit(s: MatchState, roster: Pair<FighterData>, c: Contact): void {
  const a = s.fighters[c.attacker]
  const defenderSide = other(c.attacker)
  const d = s.fighters[defenderSide]
  const dData = roster[defenderSide]
  const attack = contactAttack(s, c)
  const dMove = d.attack ? moveOf(dData, d.attack) : null

  const grabStartup =
    d.action === 'throwing' ||
    (d.attack !== null &&
      dMove?.grab === true &&
      d.attack.frame < dMove.startup)
  if (grabStartup) scoreRead(s, c.attacker, 'strike')
  const counter =
    d.action === 'throwing' ||
    (d.attack !== null && dMove !== null && d.attack.frame < dMove.startup)

  if (!(d.combo.hits > 0 && COMBO_STATES.has(d.action))) {
    d.combo = { hits: 0, damage: 0, moves: [] }
  }
  // Infinite protection: a move may land once per combo (a multi-hit move's
  // later hits and `rapid` moves excepted), and a combo has a hard cap.
  const continuing = attack !== null && attack.hitCount > 0
  const repeated = d.combo.moves.includes(c.id) && !c.move.rapid && !continuing
  if (repeated || d.combo.hits >= MAX_COMBO_HITS) {
    setAction(d, 'breakout', BREAKOUT_FRAMES)
    d.combo = { hits: 0, damage: 0, moves: [] }
    d.push = (a.x <= d.x ? 1 : -1) * 30 * SUB
    s.events.push({ type: 'breakout', side: defenderSide })
    return
  }

  const index = d.combo.hits + 1
  let damage = scaledDamage(c.move.damage, index, c.level)
  if (c.easy) damage = Math.trunc((damage * EASY_DAMAGE_PERCENT) / 100)
  if (counter) damage = Math.trunc((damage * COUNTER_DAMAGE_PERCENT) / 100)
  takeDamage(d, dData, damage, RED_PERCENT)
  d.combo.hits = index
  d.combo.damage += damage
  if (!continuing) d.combo.moves.push(c.id)
  if (c.level !== 'super') gainMeter(a, damage)
  gainMeter(d, Math.trunc(damage / 2))

  if (!s.firstAttack) {
    s.firstAttack = true
    s.events.push({ type: 'firstAttack', side: c.attacker })
  }
  if (c.move.poison)
    d.poison = { left: c.move.poison.frames, every: c.move.poison.every }
  if (c.move.blind) d.blind = c.move.blind
  if (c.move.freezeRed) d.redFreeze = c.move.freezeRed
  // A hit knocks a flyer out of the sky.
  d.flight = 0
  if (c.move.pull !== undefined) {
    // Yanked in to the attacker's feet.
    const reach =
      halfWidth(roster[c.attacker]) + halfWidth(dData) + c.move.pull * SUB
    d.x = a.x + a.facing * reach
    d.push = 0
  }

  const away: Facing = a.x <= d.x ? 1 : -1
  if (c.move.launcher && d.y === 0) {
    setAction(d, 'airhit')
    d.vy = LAUNCH_POP
    d.vx = 0
    a.jumpCancel = JUMP_CANCEL_WINDOW
  } else if (isAirborne(d)) {
    setAction(d, 'airhit')
    d.vy = AIRHIT_POP
    d.vx = away * AIRHIT_DRIFT
  } else if (c.move.knockdown) {
    setAction(d, 'knockdown', KNOCKDOWN_FRAMES)
    d.vx = 0
    d.push = away * c.move.pushback * SUB
  } else {
    const stun =
      decayedHitstun(c.move.hitstun, index) + (counter ? COUNTER_HITSTUN : 0)
    setAction(d, 'hitstun', stun)
    d.vx = 0
    d.push = away * c.move.pushback * SUB
  }
  s.hitstop = Math.max(s.hitstop, c.move.hitstop)
  s.events.push({
    type: 'hit',
    attacker: c.attacker,
    move: c.id,
    damage,
    combo: index,
    counter,
  })
  if (c.move.fling && dData.childGuard) {
    s.events.push({ type: 'fling', attacker: c.attacker, move: c.id })
  }
}

function commandGrab(
  s: MatchState,
  roster: Pair<FighterData>,
  reads: Pair<Read>,
  c: Contact,
): boolean {
  const a = s.fighters[c.attacker]
  const defenderSide = other(c.attacker)
  const d = s.fighters[defenderSide]
  const dData = roster[defenderSide]
  if (!grabbable(d, dData)) return false
  if (guarding(d, reads[defenderSide])) scoreRead(s, c.attacker, 'grab')
  let damage = c.move.damage
  if (c.easy) damage = Math.trunc((damage * EASY_DAMAGE_PERCENT) / 100)
  takeDamage(d, dData, damage, RED_PERCENT)
  gainMeter(a, damage)
  gainMeter(d, Math.trunc(damage / 2))
  if (c.move.stealMeter) {
    const taken = Math.min(d.meter, c.move.stealMeter)
    gainMeter(d, -taken)
    gainMeter(a, taken)
  }
  const dir = a.facing
  d.x = a.x + dir * (halfWidth(roster[c.attacker]) + halfWidth(dData) + 8 * SUB)
  if (c.move.grabStun) {
    // Reeled in and left standing, close enough to hit again.
    setAction(d, 'hitstun', c.move.grabStun)
    d.facing = -dir as Facing
    d.vx = 0
    d.push = 0
  } else {
    setAction(d, 'knockdown', KNOCKDOWN_FRAMES)
  }
  s.hitstop = Math.max(s.hitstop, c.move.hitstop)
  s.events.push({ type: 'throw', attacker: c.attacker, damage })
  if (c.move.fling && dData.childGuard) {
    s.events.push({ type: 'fling', attacker: c.attacker, move: c.id })
  }
  return true
}

function resolveHits(
  s: MatchState,
  roster: Pair<FighterData>,
  reads: Pair<Read>,
): void {
  // Two projectiles that meet cancel out.
  const spent = new Set<number>()
  for (let i = 0; i < s.projectiles.length; i += 1) {
    for (let j = i + 1; j < s.projectiles.length; j += 1) {
      if (s.projectiles[i]!.owner === s.projectiles[j]!.owner) continue
      const bi = projectileBox(s, roster, i)
      const bj = projectileBox(s, roster, j)
      if (bi && bj && overlaps(bi, bj)) {
        spent.add(i)
        spent.add(j)
        s.events.push({ type: 'clash' })
      }
    }
  }

  const contacts = collectContacts(s, roster).filter(
    (c) => c.projectile === null || !spent.has(c.projectile),
  )
  // Both contacts apply together, so simultaneous hits trade: mark every
  // melee contact before any reaction can clear the other fighter's attack.
  for (const c of contacts) {
    const attack = contactAttack(s, c)
    if (attack) attack.connected = true
  }

  for (const c of contacts) {
    const defenderSide = other(c.attacker)
    const d = s.fighters[defenderSide]
    const dData = roster[defenderSide]
    const attack = contactAttack(s, c)

    if (invulnerable(d, dData, c.kind, c.move.guard)) {
      // The move passes through; its hitbox stays live for later frames.
      if (attack) attack.connected = false
      if (d.action === 'dodge' && c.kind !== 'throw') {
        if (attack && !attack.read) {
          attack.read = true
          scoreRead(s, defenderSide, 'guard')
        }
      }
      continue
    }

    if (c.kind === 'throw') {
      if (!commandGrab(s, roster, reads, c) && attack) attack.connected = false
      continue
    }

    if (c.projectile !== null) {
      const p = s.projectiles[c.projectile]!
      const boomerang = c.move.projectile?.returnAfter !== undefined
      if (boomerang && !p.returning) p.struck = true
      else spent.add(c.projectile)
    }
    const markContact = () => {
      if (!attack) return
      attack.contact = true
      attack.hitCount += 1
      attack.lastHitFrame = attack.frame
      if (c.move.bounce) {
        // The dive kicks off them and springs back up.
        const a = s.fighters[c.attacker]
        a.vy = c.move.bounce
        a.vx = -a.facing * 2 * SUB
      }
    }

    // Parry: the defender's parry window catches the strike.
    const dMove = d.attack ? moveOf(dData, d.attack) : null
    if (
      d.attack &&
      dMove?.parry &&
      within(dMove.parry, d.attack.frame) &&
      (dMove.parry.guards?.includes(c.move.guard) ?? true)
    ) {
      d.attack.contact = true
      d.attack.lastHitFrame = d.attack.frame
      scoreRead(s, defenderSide, 'guard')
      s.events.push({ type: 'parry', side: defenderSide })
      s.hitstop = Math.max(s.hitstop, 10)
      if (c.kind === 'strike') {
        const a = s.fighters[c.attacker]
        takeDamage(a, roster[c.attacker], dMove.parry.damage, RED_PERCENT)
        setAction(a, 'hitstun', PARRY_STUN)
        a.vx = 0
        s.events.push({
          type: 'hit',
          attacker: defenderSide,
          move: d.attack.id,
          damage: dMove.parry.damage,
          combo: 1,
          counter: true,
        })
      }
      continue
    }

    if (blocks(d, reads[defenderSide], c.move)) {
      const chip = c.move.chip ?? 0
      if (chip > 0) takeDamage(d, dData, chip, 100)
      setAction(d, 'blockstun', c.move.blockstun)
      d.vx = 0
      d.push =
        (s.fighters[c.attacker].x <= d.x ? 1 : -1) * c.move.pushback * SUB
      gainMeter(d, BLOCK_METER)
      gainMeter(s.fighters[c.attacker], Math.trunc(c.move.damage / 4))
      if (c.move.freezeRed) d.redFreeze = c.move.freezeRed
      s.hitstop = Math.max(s.hitstop, c.move.hitstop - 2)
      s.events.push({ type: 'block', attacker: c.attacker, move: c.id, chip })
      markContact()
      continue
    }

    // Armor soaks the hit: the damage lands, the stun doesn't.
    const light = c.level === 'normal' && /_l[pk]$/.test(c.id)
    if (
      d.attack &&
      dMove?.armor &&
      within(dMove.armor, d.attack.frame) &&
      d.attack.armorUsed < dMove.armor.hits &&
      (!dMove.armor.lightOnly || light)
    ) {
      d.attack.armorUsed += 1
      const share = dMove.armor.damagePercent ?? 100
      takeDamage(
        d,
        dData,
        Math.trunc((c.move.damage * share) / 100),
        RED_PERCENT,
      )
      gainMeter(d, dMove.armor.meter ?? 0)
      s.hitstop = Math.max(s.hitstop, c.move.hitstop)
      s.events.push({ type: 'armor', side: defenderSide })
      markContact()
      continue
    }

    landHit(s, roster, c)
    markContact()
  }

  s.projectiles = s.projectiles.filter((_, index) => !spent.has(index))
}

function moveProjectiles(s: MatchState, roster: Pair<FighterData>): void {
  const edge = STAGE_HALF_WIDTH * SUB
  const kept: MatchState['projectiles'] = []
  for (const p of s.projectiles) {
    const data = moveOf(roster[p.owner], {
      id: p.move,
      heavy: p.heavy,
    }).projectile
    const owner = s.fighters[p.owner]
    const next = { ...p, age: p.age + 1, life: p.life - 1 }
    if (data?.returnAfter !== undefined) {
      if (!next.returning && next.age >= data.returnAfter) {
        next.returning = true
        next.struck = false
      }
      if (next.returning) {
        // It comes home to the thrower, wherever they have moved.
        const toward = owner.x >= next.x ? 1 : -1
        next.vx = toward * Math.abs(next.vx)
        if (Math.abs(owner.x - next.x) <= CATCH_RANGE * SUB) continue
      }
    }
    // Vespers: the bell halves the speed of the other side's projectiles.
    const slowed = s.fighters[p.owner === 0 ? 1 : 0].bell > 0
    next.x += slowed ? Math.trunc(next.vx / 2) : next.vx
    if (next.life > 0 && Math.abs(next.x) <= edge) kept.push(next)
  }
  s.projectiles = kept
}

// ---------------------------------------------------------------- life

const NO_REGEN: ReadonlySet<Action> = new Set([
  'hitstun',
  'blockstun',
  'airhit',
  'knockdown',
  'thrown',
])

function tickLife(s: MatchState): void {
  for (const f of s.fighters) {
    f.sinceHit = Math.min(f.sinceHit + 1, 100000)
    if (f.redFreeze > 0) f.redFreeze -= 1
    if (f.poison.left > 0) {
      f.poison.left -= 1
      // Poison drains as red health and never finishes anyone.
      if (f.poison.left % f.poison.every === 0 && f.health > 1) {
        f.health -= 1
        f.red += 1
      }
      continue
    }
    if (
      f.red > 0 &&
      f.redFreeze === 0 &&
      f.sinceHit > REGEN_DELAY &&
      !NO_REGEN.has(f.action) &&
      s.frame % REGEN_EVERY === 0
    ) {
      f.health += 1
      f.red -= 1
    }
  }
}

// ---------------------------------------------------------------- rounds

function healthRatioWinner(
  s: MatchState,
  roster: Pair<FighterData>,
): RoundResult {
  // Compare health / max without division: h0 * max1 vs h1 * max0.
  const left = s.fighters[0].health * roster[1].health
  const right = s.fighters[1].health * roster[0].health
  if (left === right) return 'draw'
  return left > right ? 0 : 1
}

function endRound(s: MatchState, result: RoundResult, timeOver: boolean): void {
  s.phase = 'ko'
  s.phaseFrame = 0
  s.results.push(result)
  s.projectiles = []
  if (result !== 'draw') s.wins[result] += 1
  for (const f of s.fighters) {
    if (f.health > 0) continue
    setAction(f, 'ko')
    if (f.y === 0) f.vx = 0
  }
  s.events.push(
    timeOver ? { type: 'timeOver', result } : { type: 'ko', result },
  )
}

function checkRoundEnd(s: MatchState, roster: Pair<FighterData>): void {
  const dead0 = s.fighters[0].health === 0
  const dead1 = s.fighters[1].health === 0
  if (dead0 || dead1) {
    endRound(s, dead0 && dead1 ? 'draw' : dead0 ? 1 : 0, false)
    return
  }
  s.timer -= 1
  if (s.timer <= 0) {
    s.timer = 0
    endRound(s, healthRatioWinner(s, roster), true)
  }
}

function nextRoundOrOver(s: MatchState, roster: Pair<FighterData>): void {
  const [w0, w1] = s.wins
  if (w0 >= ROUNDS_TO_WIN || w1 >= ROUNDS_TO_WIN || s.round >= MAX_ROUNDS) {
    s.phase = 'over'
    s.phaseFrame = 0
    s.winner = w0 === w1 ? 'draw' : w0 > w1 ? 0 : 1
    s.events.push({ type: 'matchOver', winner: s.winner })
    return
  }
  s.round += 1
  s.phase = 'intro'
  s.phaseFrame = 0
  s.timer = ROUND_FRAMES
  s.hitstop = 0
  s.freeze = 0
  s.firstAttack = false
  const old = s.fighters
  s.fighters = [freshFighter(roster[0], 0), freshFighter(roster[1], 1)]
  for (const side of [0, 1] as const) {
    // Meter carries between rounds; everything else resets.
    s.fighters[side].meter = old[side].meter
    s.fighters[side].prev = old[side].prev
  }
  s.events.push({ type: 'roundStart', round: s.round })
}

// ---------------------------------------------------------------- step

/** Is `side` mid-attack (before its hitbox is spent) and close enough to guard against? */
function threatens(
  s: MatchState,
  roster: Pair<FighterData>,
  side: Side,
): boolean {
  const a = s.fighters[side]
  const target = s.fighters[other(side)]
  const range = PROXIMITY_GUARD * SUB
  // A projectile on its way counts too.
  if (
    s.projectiles.some(
      (p) => p.owner === side && Math.abs(p.x - target.x) <= range,
    )
  ) {
    return true
  }
  const attack = a.attack
  if (!attack || attack.connected) return false
  const move = moveOf(roster[side], attack)
  if (attack.frame >= move.startup + move.active) return false
  return Math.abs(a.x - target.x) <= range
}

function remember(s: MatchState, inputs: Pair<SimInput>): void {
  s.fighters[0].prev = { ...inputs[0] }
  s.fighters[1].prev = { ...inputs[1] }
}

const BUFFERABLE: readonly BufferedButton[] = [
  'lp',
  'hp',
  'lk',
  'hk',
  'dodge',
  'special',
]

/** Presses made during a freeze wait for the first free frame. */
function bufferPresses(s: MatchState, inputs: Pair<SimInput>): void {
  for (const side of [0, 1] as const) {
    const f = s.fighters[side]
    for (const button of BUFFERABLE) {
      if (
        inputs[side][button] &&
        !f.prev[button] &&
        !f.buffer.includes(button)
      ) {
        f.buffer.push(button)
      }
    }
  }
  remember(s, inputs)
}

/** Every frame of the fight, frozen or not, feeds the motion reader. */
function recordMotion(
  s: MatchState,
  inputs: Pair<SimInput>,
  frozen = false,
): void {
  for (const side of [0, 1] as const) {
    const f = s.fighters[side]
    const dir = dirOf(inputs[side], f.facing)
    // While frozen only changes are recorded, so a motion entered during the
    // freeze is still fresh when the freeze ends (the special-cancel buffer).
    if (frozen && f.motion.dirs[f.motion.dirs.length - 1] === dir) continue
    f.motion = pushDir(f.motion, dir)
  }
}

function resetFinishedCombos(s: MatchState): void {
  for (const f of s.fighters) {
    if (f.combo.hits > 0 && !COMBO_STATES.has(f.action)) {
      f.combo = { hits: 0, damage: 0, moves: [] }
    }
  }
}

/** Advance the match by one 60 Hz frame. Pure: returns a new state. */
export function step(
  prev: MatchState,
  inputs: Pair<SimInput>,
  roster: Pair<FighterData>,
): MatchState {
  const s = clone(prev)
  s.frame += 1
  s.events = []

  switch (s.phase) {
    case 'over':
      return s
    case 'intro':
      s.phaseFrame += 1
      if (s.phaseFrame >= INTRO_FRAMES) {
        s.phase = 'fight'
        s.phaseFrame = 0
        s.events.push({ type: 'fight', round: s.round })
      }
      remember(s, inputs)
      return s
    case 'ko':
      s.phaseFrame += 1
      for (const side of [0, 1] as const) {
        const f = s.fighters[side]
        physics(f, roster[side])
        const lastResult = s.results[s.results.length - 1]
        if (
          f.y === 0 &&
          f.action !== 'ko' &&
          f.action !== 'victory' &&
          lastResult === side
        ) {
          setAction(f, 'victory')
          f.vx = 0
        }
      }
      clampToStage(s, roster)
      if (s.phaseFrame >= KO_FRAMES) nextRoundOrOver(s, roster)
      remember(s, inputs)
      return s
    case 'fight':
      break
  }

  // A super flash and hitstop freeze everything. Directions still feed the
  // motion reader, and presses made during the freeze are buffered for the
  // first free frame (that is how chains and cancels are timed).
  if (s.freeze > 0 || s.hitstop > 0) {
    if (s.freeze > 0) s.freeze -= 1
    else s.hitstop -= 1
    recordMotion(s, inputs, true)
    bufferPresses(s, inputs)
    return s
  }

  recordMotion(s, inputs)
  const reads: Pair<Read> = [
    read(s.fighters[0], inputs[0]),
    read(s.fighters[1], inputs[1]),
  ]
  const startX: Pair<number> = [s.fighters[0].x, s.fighters[1].x]
  const threatened: Pair<boolean> = [
    threatens(s, roster, 1),
    threatens(s, roster, 0),
  ]

  think(s, 0, roster, reads[0], threatened[0])
  think(s, 1, roster, reads[1], threatened[1])
  s.fighters[0].buffer = []
  s.fighters[1].buffer = []
  // A super flash that just started freezes the rest of this frame too.
  if (s.freeze > 0) {
    remember(s, inputs)
    return s
  }
  physics(s.fighters[0], roster[0])
  physics(s.fighters[1], roster[1])
  moveProjectiles(s, roster)
  clampToStage(s, roster)
  separate(s, roster, startX)
  resolveThrows(s, roster, reads)
  resolveHits(s, roster, reads)
  clampToStage(s, roster)
  // A throw can land the defender against the wall, inside the thrower.
  separate(s, roster, [s.fighters[0].x, s.fighters[1].x])
  faceEachOther(s)
  tickLife(s)
  resetFinishedCombos(s)
  checkRoundEnd(s, roster)
  remember(s, inputs)
  return s
}

// ---------------------------------------------------------------- hashing

/** FNV-1a over the serialized state: equal hashes mean equal matches. */
export function hashState(s: MatchState): string {
  const text = JSON.stringify(s)
  let hash = 0x811c9dc5
  for (let i = 0; i < text.length; i += 1) {
    hash ^= text.charCodeAt(i)
    hash = Math.imul(hash, 0x01000193) >>> 0
  }
  return hash.toString(16).padStart(8, '0')
}
