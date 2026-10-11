// /utils/arcade/rescueRally/family.ts
//
// Rescue Rally's family (conductor kr-arcade t-035, depth-pass/CABINETS.md section 1, "Rescue under
// threat"): the people, pets and little bots waiting to be rescued, and the states the glitch can put
// them in. Nobody is ever hurt:
//
// - calm: wandering, waiting. Touch to collect at once, or hold B to lead them in a parade.
// - parade: following a hero's footsteps (up to three) to a beacon pad, for double the bonus.
// - dizzy: a stomper knocked them silly. They stagger off to the nearest wall and head home safe,
//   with no bonus for the wave unless a hero catches them first (saved, but unpaid).
// - glitched: a hypno got them. Swirly eyes, chasing the hero; a beam hit reboots them, never more.

import { ARENA, clampToArena, dist, nearestExit, toward } from './arena'
import type { Point } from './arena'
import { levelCurve } from '../curve'

export type RescueeKind = 'person' | 'cat' | 'dog' | 'bot'
export type RescueeState = 'calm' | 'parade' | 'dizzy' | 'glitched'

export type Rescuee = {
  id: number
  kind: RescueeKind
  x: number
  y: number
  vx: number
  vy: number
  turn: number
  /** A person's shirt and skin (pets and bots ignore them). */
  color: string
  skin: string
  state: RescueeState
  /** Ticks left in a state that wears off (a dizzy stagger, a fresh reboot's daze). */
  clock: number
  /** A just-rebooted rescuee can't be glitched again until this runs out. */
  immune: number
  /** In a parade: whose (a hero's seat) and where in the line (0 nearest). */
  seat: number
  slot: number
}

/** The most rescuees one hero can lead at once. */
export const PARADE_MAX = 3
/** A parade walks this many trail steps behind the hero, and this far apart. */
export const PARADE_GAP = 9
export const RESCUEE_RADIUS = 7

export const WANDER_SPEED: Record<RescueeKind, number> = {
  person: 0.35,
  cat: 0.4,
  dog: 0.42,
  bot: 0.5,
}

export const FAMILY_CURVES = {
  /** How fast a glitched friend chases the hero. */
  glitchSpeed: { start: 0.7, step: 0.012, limit: 1.15 },
} as const

/** What a rescuee needs to know about the arena around it. */
export type FamilyWorld = {
  rng: () => number
  /** Global wave number, for the curves. */
  heat: number
  /** The nearest hero still standing, or null. */
  hero(from: Point): Point | null
  /** Where a parade slot should stand: a point on that hero's trail, or null when the hero is down. */
  trail(seat: number, slot: number): Point | null
  /** A pylon post the point is pressed against (within `r`), or null. */
  post(at: Point, r: number): Point | null
}

/** One tick of a rescuee. Returns true once a dizzy one has wandered off home. */
export function stepRescuee(r: Rescuee, w: FamilyWorld): boolean {
  if (r.immune > 0) r.immune--
  switch (r.state) {
    case 'calm':
      wander(r, w)
      break
    case 'parade': {
      const spot = w.trail(r.seat, r.slot)
      if (!spot) {
        r.state = 'calm'
        break
      }
      const d = dist(r, spot)
      const speed = Math.min(2.4, d * 0.2)
      if (d > 0.5) {
        const u = toward(r, spot)
        r.vx = u.x * speed
        r.vy = u.y * speed
        r.x += r.vx
        r.y += r.vy
      }
      break
    }
    case 'dizzy': {
      if (r.clock > 0) r.clock--
      const exit = nearestExit(r)
      const u = toward(r, exit)
      const wobble = Math.sin((r.clock + r.id * 17) / 6) * 0.5
      r.vx = (u.x - u.y * wobble) * 0.45
      r.vy = (u.y + u.x * wobble) * 0.45
      r.x += r.vx
      r.y += r.vy
      if (
        r.x <= ARENA.left + 3 ||
        r.x >= ARENA.right - 3 ||
        r.y <= ARENA.top + 3 ||
        r.y >= ARENA.bottom - 3
      )
        return true
      break
    }
    case 'glitched': {
      const hero = w.hero(r)
      const speed = levelCurve(w.heat, FAMILY_CURVES.glitchSpeed)
      if (hero) {
        const u = toward(r, hero)
        const jitter = (w.rng() - 0.5) * 0.8
        r.vx = r.vx * 0.85 + (u.x - u.y * jitter) * speed * 0.15
        r.vy = r.vy * 0.85 + (u.y + u.x * jitter) * speed * 0.15
      } else {
        r.vx *= 0.9
        r.vy *= 0.9
      }
      r.x += r.vx
      r.y += r.vy
      break
    }
  }
  if (r.state !== 'dizzy') clampToArena(r, RESCUEE_RADIUS)
  return false
}

function wander(r: Rescuee, w: FamilyWorld) {
  if (r.clock > 0) {
    // Just rebooted or scattered: blinking, standing still a moment.
    r.clock--
    r.vx *= 0.8
    r.vy *= 0.8
  } else if (--r.turn <= 0) {
    const a = w.rng() * Math.PI * 2
    const speed = WANDER_SPEED[r.kind]
    r.vx = Math.cos(a) * speed
    r.vy = Math.sin(a) * speed
    r.turn = 60 + Math.floor(w.rng() * 90)
  }
  r.x += r.vx
  r.y += r.vy
  if (r.x < ARENA.left + 8 || r.x > ARENA.right - 8) r.vx *= -1
  if (r.y < ARENA.top + 8 || r.y > ARENA.bottom - 8) r.vy *= -1
  // Pylons are walls to a wanderer: turn back from the post.
  const post = w.post(r, RESCUEE_RADIUS + 5)
  if (post) {
    const u = toward(post, r)
    r.x = post.x + u.x * (RESCUEE_RADIUS + 5)
    r.y = post.y + u.y * (RESCUEE_RADIUS + 5)
    const along = r.vx * u.x + r.vy * u.y
    if (along < 0) {
      r.vx -= 2 * along * u.x
      r.vy -= 2 * along * u.y
    }
  }
}
