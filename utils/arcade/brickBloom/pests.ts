// /utils/arcade/brickBloom/pests.ts
//
// Brick Bloom's Cactus Dome and Lily Pond House pests (conductor kr-arcade/t-080, depth-pass
// CABINETS.md section 11, slice 3). Every one is bonked, never hurt, and pops into petals.
//   - Tumbleweed (Cactus Dome): a dust puff at the glass is the tell, then it rolls along the soil
//     bed flattening blooms. Bonk it with the ball or the paddle before it reaches your best bloom.
//   - Shell beetle (Cactus Dome): walks a lane under the crates, armoured at the front. Bank the
//     ball in behind it.
//   - Frog bot (Lily Pond): puffs its cheeks for a second, then tongues the nearest falling seed.
//     Catch the seed first, or bonk the frog while it puffs.
//   - Mirror bug (Lily Pond): shimmers, then splits a ghost ball off yours. The ghost cracks
//     nothing and fades in 4 s; only the real ball casts a shadow on the glass.
// Pure functions; the cabinet owns the state, the ball and the drawing.

import { BALL_R, LEFT, RIGHT, TOP } from './rules'
import { WATER_TOP } from './crates'

/** Which pests come out on which glasshouse's walls (houses 2 and 3: the Dome and the Pond). */
export function pestsOf(house: number, wallId: string) {
  const first = wallId.endsWith('-1')
  return {
    tumbleweed: house === 2 || house === 5,
    beetle: (house === 2 || house === 5) && !first,
    frog: house === 3 || house === 5,
    mirror: (house === 3 || house === 5) && !first,
  }
}

// --- tumbleweed ------------------------------------------------------------------------------

export type Tumbleweed = {
  x: number
  dir: 1 | -1
  /** Ticks of dust-puff tell left before it rolls in. */
  tell: number
  spin: number
}

export const TUMBLE_Y = 301
export const TUMBLE_R = 6
export const TUMBLE_SPEED = 0.9
export const TUMBLE_TELL = 70
/** Ticks between tumbleweeds on a Cactus Dome wall. */
export const TUMBLE_EVERY = 900
export const TUMBLE_SCORE = 120

export function spawnTumbleweed(fromLeft: boolean): Tumbleweed {
  return {
    x: fromLeft ? LEFT + TUMBLE_R : RIGHT - TUMBLE_R,
    dir: fromLeft ? 1 : -1,
    tell: TUMBLE_TELL,
    spin: 0,
  }
}

/** One tick. Returns true once it has rolled off the far side. */
export function stepTumbleweed(t: Tumbleweed): boolean {
  if (t.tell > 0) {
    t.tell--
    return false
  }
  t.x += t.dir * TUMBLE_SPEED
  t.spin += t.dir * 0.2
  return t.x < LEFT - TUMBLE_R * 2 || t.x > RIGHT + TUMBLE_R * 2
}

/** Rolling (not still a dust puff) and touching a point within `r`. */
export function tumbleTouches(t: Tumbleweed, x: number, y: number, r: number) {
  return t.tell === 0 && Math.hypot(t.x - x, TUMBLE_Y - y) <= TUMBLE_R + r
}

// --- shell beetle ----------------------------------------------------------------------------

export type Beetle = { x: number; y: number; dir: 1 | -1; flash: number }

export const BEETLE_LANE = 176
export const BEETLE_W = 9
export const BEETLE_H = 6
export const BEETLE_SPEED = 0.4
export const BEETLE_SCORE = 250

export function spawnBeetle(fromLeft: boolean): Beetle {
  return {
    x: fromLeft ? LEFT + BEETLE_W : RIGHT - BEETLE_W,
    y: BEETLE_LANE,
    dir: fromLeft ? 1 : -1,
    flash: 0,
  }
}

export function stepBeetle(b: Beetle): void {
  if (b.flash > 0) b.flash--
  b.x += b.dir * BEETLE_SPEED
  if (b.x < LEFT + BEETLE_W) {
    b.x = LEFT + BEETLE_W
    b.dir = 1
  } else if (b.x > RIGHT - BEETLE_W) {
    b.x = RIGHT - BEETLE_W
    b.dir = -1
  }
}

export function beetleTouches(b: Beetle, x: number, y: number) {
  return (
    Math.abs(x - b.x) <= BEETLE_W + BALL_R &&
    Math.abs(y - b.y) <= BEETLE_H + BALL_R
  )
}

/**
 * The ball meets the beetle: from behind (the side it walks away from) it pops; from the front,
 * or straight down on its shell, the armour clangs the ball back.
 */
export function beetleBonk(b: Beetle, ballX: number): 'pop' | 'armour' {
  return (ballX - b.x) * b.dir < -2 ? 'pop' : 'armour'
}

// --- frog bot --------------------------------------------------------------------------------

export type Frog = {
  x: number
  y: number
  /** Ticks to the next puff, ticks of puffing (the tell), ticks of tongue out. */
  wait: number
  puff: number
  tongue: number
  /** Where the tongue reaches, while it is out. */
  tx: number
  ty: number
  /** A hop to a new pad: ticks left, and where to. */
  hop: number
  hopTo: number
}

export const FROG_Y = WATER_TOP - 6
export const FROG_R = 7
export const FROG_WAIT = 300
export const FROG_PUFF = 60
export const FROG_TONGUE = 18
/** How far the tongue reaches for a falling seed. */
export const FROG_REACH = 130
export const FROG_SCORE = 300

export function spawnFrog(x: number): Frog {
  return {
    x,
    y: FROG_Y,
    wait: FROG_WAIT,
    puff: 0,
    tongue: 0,
    tx: x,
    ty: FROG_Y,
    hop: 0,
    hopTo: x,
  }
}

export type FrogEvent = 'none' | 'puff' | 'tongue' | 'hop'

/**
 * One tick of the frog's day: wait, puff (the tell), then lick at `seed` if one is in reach, then
 * hop to a new pad. Returns what started this tick.
 */
export function stepFrog(
  f: Frog,
  seed: { x: number; y: number } | null,
  rng: () => number,
): FrogEvent {
  if (f.hop > 0) {
    f.hop--
    f.x += (f.hopTo - f.x) / Math.max(1, f.hop + 1)
    f.y = FROG_Y - Math.sin((f.hop / 24) * Math.PI) * 14
    return 'none'
  }
  if (f.tongue > 0) {
    if (--f.tongue === 0) {
      f.hop = 24
      f.hopTo = LEFT + 20 + rng() * (RIGHT - LEFT - 40)
      return 'hop'
    }
    return 'none'
  }
  if (f.puff > 0) {
    if (--f.puff === 0) {
      f.tongue = FROG_TONGUE
      const near =
        seed && Math.hypot(seed.x - f.x, seed.y - f.y) <= FROG_REACH
          ? seed
          : null
      f.tx = near ? near.x : f.x
      f.ty = near ? near.y : f.y + 20
      return 'tongue'
    }
    return 'none'
  }
  if (--f.wait <= 0) {
    f.wait = FROG_WAIT
    f.puff = FROG_PUFF
    return 'puff'
  }
  return 'none'
}

export function frogTouches(f: Frog, x: number, y: number) {
  return Math.hypot(f.x - x, f.y - y) <= FROG_R + BALL_R
}

// --- mirror bug and its ghost balls ----------------------------------------------------------

export type MirrorBug = { x: number; y: number; t: number; shimmer: number }
export type Ghost = {
  x: number
  y: number
  vx: number
  vy: number
  life: number
}

export const MIRROR_R = 6
export const MIRROR_EVERY = 420
export const MIRROR_SHIMMER = 45
export const GHOST_LIFE = 240
export const MIRROR_SCORE = 300

export function spawnMirror(phase: number): MirrorBug {
  return { x: 128, y: 150, t: Math.round(phase), shimmer: 0 }
}

/** One tick of its figure-eight. Returns true on the tick it splits a ghost off. */
export function stepMirror(m: MirrorBug): boolean {
  m.t++
  m.x = 128 + Math.sin(m.t / 90) * 90
  m.y = 150 + Math.sin(m.t / 45) * 22
  if (m.shimmer > 0) return --m.shimmer === 0
  if (m.t % MIRROR_EVERY === 0) m.shimmer = MIRROR_SHIMMER
  return false
}

export function mirrorTouches(m: MirrorBug, x: number, y: number) {
  return Math.hypot(m.x - x, m.y - y) <= MIRROR_R + BALL_R
}

/** A ghost off a real ball: the same speed, turned a little aside. */
export function splitGhost(ball: {
  x: number
  y: number
  vx: number
  vy: number
}): Ghost {
  const a = Math.atan2(ball.vy, ball.vx) + 0.6
  const s = Math.hypot(ball.vx, ball.vy) || 2.5
  return {
    x: ball.x,
    y: ball.y,
    vx: Math.cos(a) * s,
    vy: Math.sin(a) * s,
    life: GHOST_LIFE,
  }
}

/**
 * A ghost flies through crates, off the glass and the roof, and off a paddle spanning
 * paddleX +/- half at paddleY; it fades out. Returns true while it lasts.
 */
export function stepGhost(
  g: Ghost,
  paddleX: number,
  half: number,
  paddleY: number,
): boolean {
  g.life--
  g.x += g.vx
  g.y += g.vy
  if (g.x < LEFT + BALL_R || g.x > RIGHT - BALL_R) g.vx = -g.vx
  if (g.y < TOP + BALL_R) g.vy = Math.abs(g.vy)
  if (
    g.vy > 0 &&
    g.y >= paddleY - BALL_R &&
    g.y <= paddleY + 4 &&
    Math.abs(g.x - paddleX) <= half
  )
    g.vy = -Math.abs(g.vy)
  return g.life > 0 && g.y < 330
}
