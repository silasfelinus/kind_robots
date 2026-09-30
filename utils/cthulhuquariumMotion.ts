// /utils/cthulhuquariumMotion.ts
//
// How each Cthulhuquarium occupant moves through the tank: the fish bible's
// nine `behavior` modes (fish/SCHEMA.md "Movement modes") as steering, not as
// one sine wave with nine speeds. Pure and framework-free so the swim canvas
// stays a renderer and this stays testable.
//
//   drift    ambles on a sine, turning now and then
//   dart     bursts, then stops dead
//   lurk     holds position while watched; creeps when the pointer leaves
//   school   a leader wanders and packmates follow it as one body
//   anchor   does not move; the tank moves past it
//   surface  sits at the waterline and bobs
//   hover    holds depth precisely and turns in place
//   tumble   rotates through discrete orientations
//   cling    on the inside of the glass, in front of everything, crawling
//
// `motion` in utils/cthulhuquariumSprites.ts is the body's own movement; this
// is the path it takes. The two compose: a lurking angler still tailbeats.

export type BehaviorMode =
  | 'drift'
  | 'dart'
  | 'lurk'
  | 'school'
  | 'anchor'
  | 'surface'
  | 'hover'
  | 'tumble'
  | 'cling'

export interface Packmate {
  dx: number
  dy: number
  lag: number
  scale: number
}

export interface SwimState {
  mode: BehaviorMode
  x: number
  y: number
  vx: number
  vy: number
  phase: number
  angle: number
  targetAngle: number
  timer: number
  bursting: boolean
  startled: number
  chaseTime: number
  chaseX: number
  chaseY: number
  goalX: number
  goalY: number
  packmates: Packmate[]
}

export interface SwimEnvironment {
  width: number
  height: number
  delta: number
  speedMultiplier: number
  pointer: { x: number; y: number } | null
  food: { x: number; y: number } | null
  random?: () => number
}

interface ModeTuning {
  speed: number
  band: readonly [number, number]
  wobble: number
}

export const MODE_TUNING: Record<BehaviorMode, ModeTuning> = {
  drift: { speed: 30, band: [0.15, 0.85], wobble: 9 },
  dart: { speed: 150, band: [0.15, 0.85], wobble: 4 },
  lurk: { speed: 16, band: [0.35, 0.9], wobble: 2 },
  school: { speed: 42, band: [0.2, 0.72], wobble: 7 },
  anchor: { speed: 0, band: [0.8, 0.93], wobble: 0 },
  surface: { speed: 22, band: [0.06, 0.16], wobble: 0 },
  hover: { speed: 8, band: [0.3, 0.62], wobble: 2 },
  tumble: { speed: 22, band: [0.15, 0.85], wobble: 12 },
  cling: { speed: 9, band: [0.08, 0.92], wobble: 0 },
}

const FOOD_SPEED = 58
const STARTLE_RADIUS = 60
const STARTLE_SECONDS = 0.7
const LURK_WATCH_RADIUS = 140

export function toBehaviorMode(
  behavior: string | null | undefined,
): BehaviorMode {
  const key = (behavior ?? '').toLowerCase()
  return key in MODE_TUNING ? (key as BehaviorMode) : 'drift'
}

/** A new occupant somewhere sensible for its mode, with packmates if it schools. */
export function spawnSwimState(
  behavior: string | null | undefined,
  width: number,
  height: number,
  random: () => number = Math.random,
): SwimState {
  const mode = toBehaviorMode(behavior)
  const tuning = MODE_TUNING[mode]
  const [top, bottom] = tuning.band
  const y = height * (top + random() * (bottom - top))
  const x = 40 + random() * (width - 80)
  const heading = random() < 0.5 ? -1 : 1
  const packmates: Packmate[] =
    mode === 'school'
      ? Array.from({ length: 3 + Math.floor(random() * 3) }, () => ({
          dx: -18 - random() * 34,
          dy: (random() - 0.5) * 34,
          lag: 0.15 + random() * 0.5,
          scale: 0.7 + random() * 0.25,
        }))
      : []
  return {
    mode,
    x,
    y,
    vx: heading * tuning.speed,
    vy: 0,
    phase: random() * Math.PI * 2,
    angle: 0,
    targetAngle: 0,
    timer: random() * 2,
    bursting: false,
    startled: 0,
    chaseTime: 0,
    chaseX: x,
    chaseY: y,
    goalX: x,
    goalY: y,
    packmates,
  }
}

/** Scare anything near a tap. Anchors and clingers hold their ground. */
export function startle(state: SwimState, x: number, y: number): boolean {
  if (state.mode === 'anchor' || state.mode === 'cling') return false
  const dx = state.x - x
  const dy = state.y - y
  const distance = Math.hypot(dx, dy)
  if (distance > STARTLE_RADIUS) return false
  const away = distance || 1
  const burst = MODE_TUNING[state.mode].speed * 2 + 120
  state.vx = (dx / away) * burst
  state.vy = (dy / away) * burst * 0.6
  state.startled = STARTLE_SECONDS
  return true
}

function newGoal(state: SwimState, env: SwimEnvironment, random: () => number) {
  const [top, bottom] = MODE_TUNING[state.mode].band
  state.goalX = 30 + random() * (env.width - 60)
  state.goalY = env.height * (top + random() * (bottom - top))
}

function steerTo(
  state: SwimState,
  gx: number,
  gy: number,
  speed: number,
  delta: number,
) {
  const dx = gx - state.x
  const dy = gy - state.y
  const distance = Math.hypot(dx, dy)
  if (distance < 1) {
    state.vx *= 0.9
    state.vy *= 0.9
    return distance
  }
  const ease = Math.min(1, delta * 3)
  state.vx += ((dx / distance) * speed - state.vx) * ease
  state.vy += ((dy / distance) * speed - state.vy) * ease
  return distance
}

/** Advance one occupant by `env.delta` seconds. */
export function stepSwimState(state: SwimState, env: SwimEnvironment): void {
  const random = env.random ?? Math.random
  const { delta, width, height } = env
  const tuning = MODE_TUNING[state.mode]
  const speed = tuning.speed * env.speedMultiplier
  state.phase += delta
  state.timer -= delta

  if (state.chaseTime > 0) {
    state.chaseTime -= delta
    steerTo(state, state.chaseX, state.chaseY, speed * 2.4 + 60, delta * 2)
  } else if (state.startled > 0) {
    state.startled -= delta
    state.vx *= 1 - Math.min(1, delta * 1.5)
    state.vy *= 1 - Math.min(1, delta * 1.5)
  } else if (env.food && state.mode !== 'anchor' && state.mode !== 'cling') {
    steerTo(
      state,
      env.food.x,
      env.food.y,
      FOOD_SPEED * env.speedMultiplier,
      delta,
    )
  } else {
    switch (state.mode) {
      case 'drift':
      case 'tumble': {
        if (state.timer <= 0) {
          state.timer = 3 + random() * 5
          if (random() < 0.35) state.vx = -state.vx
        }
        const heading = Math.sign(state.vx) || 1
        state.vx += (heading * speed - state.vx) * Math.min(1, delta * 2)
        state.vy = Math.sin(state.phase * 0.9) * tuning.wobble
        if (state.mode === 'tumble' && state.timer % 1.4 < delta) {
          state.targetAngle += (Math.PI / 2) * (random() < 0.5 ? 1 : -1)
        }
        break
      }
      case 'dart': {
        if (state.timer <= 0) {
          state.bursting = !state.bursting
          state.timer = state.bursting
            ? 0.25 + random() * 0.35
            : 0.8 + random() * 2.2
          if (state.bursting) newGoal(state, env, random)
        }
        if (state.bursting)
          steerTo(state, state.goalX, state.goalY, speed, delta * 4)
        else {
          state.vx *= 1 - Math.min(1, delta * 6)
          state.vy *= 1 - Math.min(1, delta * 6)
        }
        break
      }
      case 'lurk': {
        const watched =
          env.pointer !== null &&
          Math.hypot(env.pointer.x - state.x, env.pointer.y - state.y) <
            LURK_WATCH_RADIUS
        if (watched) {
          state.vx *= 1 - Math.min(1, delta * 8)
          state.vy *= 1 - Math.min(1, delta * 8)
        } else {
          if (
            state.timer <= 0 ||
            Math.hypot(state.goalX - state.x, state.goalY - state.y) < 8
          ) {
            state.timer = 4 + random() * 6
            newGoal(state, env, random)
          }
          steerTo(state, state.goalX, state.goalY, speed, delta)
        }
        break
      }
      case 'school': {
        if (state.timer <= 0) {
          state.timer = 2.5 + random() * 3
          newGoal(state, env, random)
        }
        steerTo(state, state.goalX, state.goalY, speed, delta)
        state.vy += Math.sin(state.phase * 1.7) * tuning.wobble * delta
        break
      }
      case 'anchor': {
        state.vx = 0
        state.vy = 0
        break
      }
      case 'surface': {
        if (state.timer <= 0) {
          state.timer = 4 + random() * 4
          if (random() < 0.4) state.vx = -state.vx
        }
        const heading = Math.sign(state.vx) || 1
        state.vx += (heading * speed - state.vx) * Math.min(1, delta * 2)
        state.vy = 0
        state.y = height * tuning.band[0] + Math.sin(state.phase * 1.3) * 3
        break
      }
      case 'hover': {
        state.vx *= 1 - Math.min(1, delta * 2)
        state.vy = Math.sin(state.phase * 0.6) * tuning.wobble
        state.targetAngle = Math.sin(state.phase * 0.35) * 0.5
        break
      }
      case 'cling': {
        if (
          state.timer <= 0 ||
          Math.hypot(state.goalX - state.x, state.goalY - state.y) < 4
        ) {
          state.timer = 6 + random() * 8
          newGoal(state, env, random)
        }
        steerTo(state, state.goalX, state.goalY, speed, delta)
        break
      }
    }
  }

  state.x += state.vx * delta
  state.y += state.vy * delta

  const [top, bottom] = tuning.band
  const minX = 18
  const maxX = width - 18
  if (state.x < minX) {
    state.x = minX
    state.vx = Math.abs(state.vx)
  } else if (state.x > maxX) {
    state.x = maxX
    state.vx = -Math.abs(state.vx)
  }
  const minY = env.food ? height * 0.05 : height * top
  const maxY = env.food ? height * 0.95 : height * bottom
  if (state.y < minY) {
    state.y = minY
    state.vy = Math.abs(state.vy) * 0.5
  } else if (state.y > maxY) {
    state.y = maxY
    state.vy = -Math.abs(state.vy) * 0.5
  }

  const turn = Math.min(1, delta * (state.mode === 'tumble' ? 10 : 3))
  state.angle += (state.targetAngle - state.angle) * turn
}

/** Which way the sprite faces: +1 right, -1 left. Held while nearly still. */
export function facingOf(state: SwimState, previous: number): number {
  if (Math.abs(state.vx) < 2) return previous
  return state.vx > 0 ? 1 : -1
}

/** Nose pitch while swimming: tilt with the vertical velocity, gently. */
export function pitchOf(state: SwimState): number {
  if (state.mode === 'tumble' || state.mode === 'hover') return state.angle
  if (state.mode === 'anchor' || state.mode === 'cling') return 0
  const speed = Math.abs(state.vx) + 1
  return Math.max(-0.45, Math.min(0.45, Math.atan2(state.vy, speed) * 0.6))
}

/** Where each packmate is drawn this frame, trailing the leader. */
export function packmatePositions(
  state: SwimState,
  facing: number,
): Array<{ x: number; y: number; scale: number; offset: number }> {
  return state.packmates.map((mate, index) => ({
    x: state.x + mate.dx * facing + Math.sin(state.phase * 2 + index) * 2,
    y: state.y + mate.dy + Math.cos(state.phase * 1.6 + index * 1.3) * 3,
    scale: mate.scale,
    offset: mate.lag,
  }))
}

const CHASE_SECONDS = 1.6

/**
 * A predator lunges at a prey's position for a moment and the prey bolts.
 * Visual only -- nothing is ever eaten; fish never die (DESIGN-BRIEF.md).
 * Returns false when either party can't take part (anchors and clingers hold
 * their ground; something already fleeing or chasing is left alone).
 */
export function hunt(predator: SwimState, prey: SwimState): boolean {
  const still = (state: SwimState) =>
    state.mode === 'anchor' || state.mode === 'cling'
  if (still(predator) || still(prey)) return false
  if (predator.chaseTime > 0 || prey.startled > 0) return false
  predator.chaseTime = CHASE_SECONDS
  predator.chaseX = prey.x
  predator.chaseY = prey.y
  const dx = prey.x - predator.x
  const dy = prey.y - predator.y
  const distance = Math.hypot(dx, dy) || 1
  const burst = MODE_TUNING[prey.mode].speed * 2 + 150
  prey.vx = (dx / distance) * burst
  prey.vy = (dy / distance) * burst * 0.6
  prey.startled = STARTLE_SECONDS + 0.4
  return true
}
