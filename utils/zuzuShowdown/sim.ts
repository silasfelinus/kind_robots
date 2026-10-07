// /utils/zuzuShowdown/sim.ts
//
// The Zuzu Showdown match simulation: one pure step per 60 Hz frame.
//
//   const next = step(state, [p1Input, p2Input], roster)
//
// `step` never mutates its argument and uses integer math only, so a match is
// a function of (roster, input log). This first slice (conductor
// zuzu-showdown t-003) covers movement, jumping, crouching, blocking high and
// low, normals with hit/block stun and hitstop, pushback (onto the attacker at
// the wall), knockdown and wake-up, throws with a tech window, and rounds
// (best of three, a 99 s clock, KO, time over, double KO). Chains, cancels,
// specials, the strike/grab/guard READ!, meter and supers land in t-005.

import {
  SIM_BUTTONS,
  SUB,
  neutralInput,
  type Action,
  type AttackButton,
  type Box,
  type Facing,
  type FighterData,
  type FighterState,
  type MatchState,
  type MoveData,
  type NormalId,
  type RoundResult,
  type SimInput,
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
/** Holding back within this range of an incoming attack guards in place. */
export const PROXIMITY_GUARD = 140

type Pair<T> = [T, T]
type Side = 0 | 1

const other = (side: Side): Side => (side === 0 ? 1 : 0)

// ---------------------------------------------------------------- setup

function freshFighter(data: FighterData, side: Side): FighterState {
  return {
    x: (side === 0 ? -START_OFFSET : START_OFFSET) * SUB,
    y: 0,
    vx: 0,
    vy: 0,
    facing: side === 0 ? 1 : -1,
    health: data.health,
    action: 'idle',
    frame: 0,
    stun: 0,
    attack: null,
    push: 0,
    jumpDir: 0,
    airAttackUsed: false,
    throwBack: false,
    prev: neutralInput(),
  }
}

export function createMatch(roster: Pair<FighterData>): MatchState {
  return {
    frame: 0,
    phase: 'intro',
    phaseFrame: 0,
    round: 1,
    timer: ROUND_FRAMES,
    wins: [0, 0],
    results: [],
    hitstop: 0,
    fighters: [freshFighter(roster[0], 0), freshFighter(roster[1], 1)],
    events: [{ type: 'roundStart', round: 1 }],
    winner: null,
  }
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}

// ---------------------------------------------------------------- boxes

/** Resolve a pixel box authored facing right into world sub-pixels. */
export function toWorld(f: FighterState, box: Box): WorldBox {
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

/** The live hurtbox, or null while invulnerable (knockdown, wake-up, throws). */
export function hurtbox(f: FighterState, data: FighterData): WorldBox | null {
  switch (f.action) {
    case 'knockdown':
    case 'wakeup':
    case 'thrown':
    case 'throwHold':
    case 'tech':
    case 'ko':
    case 'victory':
      return null
    default:
      break
  }
  if (isAirborne(f)) return toWorld(f, data.hurtAir)
  if (isCrouching(f) || (f.action === 'blockstun' && f.prev.down)) {
    return toWorld(f, data.hurtCrouch)
  }
  return toWorld(f, data.hurtStand)
}

/** The live hitbox of the current attack, or null. */
export function hitbox(f: FighterState, data: FighterData): WorldBox | null {
  const attack = f.attack
  if (!attack || attack.connected) return null
  const move = data.moves[attack.id]
  if (attack.frame < move.startup || attack.frame >= move.startup + move.active)
    return null
  return toWorld(f, move.hitbox)
}

export function pushbox(f: FighterState, data: FighterData): WorldBox {
  return toWorld(f, data.pushbox)
}

function halfWidth(data: FighterData): number {
  return Math.trunc((data.pushbox.w * SUB) / 2)
}

function moveTotal(move: MoveData): number {
  return move.startup + move.active - 1 + move.recovery
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

/** Heavy wins when several attack buttons go down on the same frame. */
function pressedAttack(r: Read): AttackButton | null {
  if (r.pressed.hp) return 'hp'
  if (r.pressed.hk) return 'hk'
  if (r.pressed.lp) return 'lp'
  if (r.pressed.lk) return 'lk'
  return null
}

// ---------------------------------------------------------------- actions

function setAction(f: FighterState, action: Action, stun = 0): void {
  f.action = action
  f.frame = 0
  f.stun = stun
  if (action !== 'attack' && action !== 'jump') f.attack = null
}

function startAttack(f: FighterState, id: NormalId): void {
  f.attack = { id, frame: 0, connected: false }
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

const ACTIONABLE: ReadonlySet<Action> = new Set(['idle', 'walk', 'crouch'])

/** Input and timers for one fighter, before physics. */
function think(
  f: FighterState,
  data: FighterData,
  r: Read,
  threatened: boolean,
): void {
  f.frame += 1

  if (ACTIONABLE.has(f.action)) {
    if (wantsThrow(r)) {
      setAction(f, 'throwing')
      // Counted like an attack: the press frame is frame 1 of the startup.
      f.frame = 1
      f.throwBack = r.back
      f.vx = 0
      return
    }
    const button = pressedAttack(r)
    if (button) {
      setAction(f, 'attack')
      startAttack(f, `${r.held.down ? 'crouch' : 'stand'}_${button}`)
      f.vx = 0
      f.attack!.frame = 1
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
      if (f.attack) {
        f.attack.frame += 1
        if (f.attack.frame > moveTotal(data.moves[f.attack.id])) f.attack = null
      } else if (!f.airAttackUsed) {
        const button = pressedAttack(r)
        if (button) {
          startAttack(f, `jump_${button}`)
          f.attack!.frame = 1
          f.airAttackUsed = true
        }
      }
      return
    }
    case 'attack': {
      const attack = f.attack!
      attack.frame += 1
      if (attack.frame > moveTotal(data.moves[attack.id])) {
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
    case 'hitstun':
    case 'blockstun':
    case 'tech':
    case 'throwWhiff':
      f.stun -= 1
      if (f.stun <= 0) {
        setAction(f, 'idle')
        groundNeutral(f, data, r)
      }
      return
    case 'knockdown':
      f.stun -= 1
      if (f.stun <= 0) setAction(f, 'wakeup', WAKEUP_FRAMES)
      return
    case 'wakeup':
      f.stun -= 1
      if (f.stun <= 0) {
        setAction(f, 'idle')
        groundNeutral(f, data, r)
      }
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
    f.vy -= data.gravity
    if (f.y <= 0) {
      f.y = 0
      f.vy = 0
      f.vx = 0
      f.attack = null
      if (f.action === 'airhit') setAction(f, 'knockdown', KNOCKDOWN_FRAMES)
      else if (f.action === 'jump') setAction(f, 'land')
      // ko keeps its pose on landing
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

  // Pushboxes never overlap.
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
  'throwing',
  'throwWhiff',
])

function inThrowRange(
  s: MatchState,
  roster: Pair<FighterData>,
  side: Side,
): boolean {
  const f = s.fighters[side]
  const o = s.fighters[other(side)]
  const gap =
    Math.abs(f.x - o.x) -
    halfWidth(roster[side]) -
    halfWidth(roster[other(side)])
  return gap <= roster[side].throwRange * SUB
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
  if (ready.length === 2 && inThrowRange(s, roster, 0)) {
    // Grab against grab cancels out.
    startTech(s, 0)
    return
  }
  for (const side of ready) {
    const a = s.fighters[side]
    const d = s.fighters[other(side)]
    const throwable = THROWABLE.has(d.action) && d.y === 0
    if (throwable && inThrowRange(s, roster, side)) {
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

type Contact = { attacker: Side; move: MoveData; id: NormalId }

const CAN_BLOCK: ReadonlySet<Action> = new Set([
  'idle',
  'walk',
  'crouch',
  'blockstun',
])

function blocks(d: FighterState, r: Read, move: MoveData): boolean {
  if (d.y !== 0 || !CAN_BLOCK.has(d.action) || !r.back) return false
  const crouching = r.held.down
  if (move.guard === 'low') return crouching
  if (move.guard === 'high') return !crouching
  return true
}

function resolveHits(
  s: MatchState,
  roster: Pair<FighterData>,
  reads: Pair<Read>,
): void {
  const contacts: Contact[] = []
  for (const side of [0, 1] as const) {
    const a = s.fighters[side]
    const box = hitbox(a, roster[side])
    if (!box) continue
    const hurt = hurtbox(s.fighters[other(side)], roster[other(side)])
    if (hurt && overlaps(box, hurt)) {
      const id = a.attack!.id
      contacts.push({ attacker: side, move: roster[side].moves[id], id })
    }
  }
  // Both contacts apply together, so simultaneous hits trade: mark every
  // contact before any hit reaction can clear the other fighter's attack.
  for (const { attacker } of contacts)
    s.fighters[attacker].attack!.connected = true
  for (const { attacker, move, id } of contacts) {
    const a = s.fighters[attacker]
    const defenderSide = other(attacker)
    const d = s.fighters[defenderSide]
    const away = a.x <= d.x ? 1 : -1
    if (blocks(d, reads[defenderSide], move)) {
      setAction(d, 'blockstun', move.blockstun)
      d.vx = 0
      d.push = away * move.pushback * SUB
      s.hitstop = Math.max(s.hitstop, move.hitstop - 2)
      s.events.push({ type: 'block', attacker, move: id })
      continue
    }
    d.health = Math.max(0, d.health - move.damage)
    if (isAirborne(d)) {
      setAction(d, 'airhit')
      d.vy = AIRHIT_POP
      d.vx = away * AIRHIT_DRIFT
    } else if (move.knockdown) {
      setAction(d, 'knockdown', KNOCKDOWN_FRAMES)
      d.vx = 0
      d.push = away * move.pushback * SUB
    } else {
      setAction(d, 'hitstun', move.hitstun)
      d.vx = 0
      d.push = away * move.pushback * SUB
    }
    s.hitstop = Math.max(s.hitstop, move.hitstop)
    s.events.push({ type: 'hit', attacker, move: id, damage: move.damage })
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
  const prev: Pair<SimInput> = [s.fighters[0].prev, s.fighters[1].prev]
  s.fighters = [freshFighter(roster[0], 0), freshFighter(roster[1], 1)]
  s.fighters[0].prev = prev[0]
  s.fighters[1].prev = prev[1]
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
  const attack = a.attack
  if (!attack || attack.connected) return false
  const move = roster[side].moves[attack.id]
  if (attack.frame >= move.startup + move.active) return false
  return Math.abs(a.x - s.fighters[other(side)].x) <= PROXIMITY_GUARD * SUB
}

function remember(s: MatchState, inputs: Pair<SimInput>): void {
  s.fighters[0].prev = { ...inputs[0] }
  s.fighters[1].prev = { ...inputs[1] }
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

  // Hitstop freezes everything. The previous input is kept, so a button
  // pressed during the freeze still registers as a press when it ends.
  if (s.hitstop > 0) {
    s.hitstop -= 1
    return s
  }

  const reads: Pair<Read> = [
    read(s.fighters[0], inputs[0]),
    read(s.fighters[1], inputs[1]),
  ]
  const startX: Pair<number> = [s.fighters[0].x, s.fighters[1].x]

  think(s.fighters[0], roster[0], reads[0], threatens(s, roster, 1))
  think(s.fighters[1], roster[1], reads[1], threatens(s, roster, 0))
  physics(s.fighters[0], roster[0])
  physics(s.fighters[1], roster[1])
  clampToStage(s, roster)
  separate(s, roster, startX)
  resolveThrows(s, roster, reads)
  resolveHits(s, roster, reads)
  clampToStage(s, roster)
  faceEachOther(s)
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
