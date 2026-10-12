// /utils/arcade/bumperBubbles/grumps.ts
//
// Fizzwick Tower's grumps (conductor kr-arcade/t-059, spec: CABINETS.md section 7,
// "The roster"). Each grump is a row of data (how fast it walks, how often it hops,
// whether it turns at an edge, how it moves) and one of a few movement rules that
// read only that row, the floor and where the robots are. Behaviour never asks the
// game's update loop which grump it is.

import {
  JUMP_V,
  TILE,
  TOP,
  WALL_L,
  WALL_R,
  slide,
  stepBody,
  surface,
} from './tower'
import type { Body, Floor, Ledge, Spot } from './tower'

export type GrumpKind =
  'waddler' | 'hopper' | 'dasher' | 'climber' | 'bouncer' | 'sprout'

export type GrumpSpec = {
  kind: GrumpKind
  name: string
  /** Its letter in a floor's ASCII. */
  letter: string
  /** The wing it first appears in. */
  wing: number
  /** Walk (or flight) speed, times the floor's base speed. */
  speed: number
  /** Hop chance, times the floor's base hop chance. */
  hop: number
  /** Chance it turns back at a platform's edge instead of walking off. */
  edgeTurn: number
  move: 'walk' | 'fly' | 'hide'
  /** What warns you, if anything. */
  tell: string | null
  /** The answer it asks for (the guide's line). */
  answer: string
}

export const GRUMPS: Record<GrumpKind, GrumpSpec> = {
  waddler: {
    kind: 'waddler',
    name: 'WADDLER',
    letter: 'w',
    wing: 1,
    speed: 1,
    hop: 1,
    edgeTurn: 0.75,
    move: 'walk',
    tell: null,
    answer: 'A BUBBLE AT RANGE',
  },
  hopper: {
    kind: 'hopper',
    name: 'HOPPER',
    letter: 'h',
    wing: 1,
    speed: 0.9,
    hop: 3.2,
    edgeTurn: 0.4,
    move: 'walk',
    tell: null,
    answer: 'TRAP IT AT THE TOP OF ITS HOP',
  },
  dasher: {
    kind: 'dasher',
    name: 'DASHER',
    letter: 'd',
    wing: 1,
    speed: 1.6,
    hop: 0.6,
    edgeTurn: 0.25,
    move: 'walk',
    tell: null,
    answer: 'LEAD YOUR SHOT',
  },
  climber: {
    kind: 'climber',
    name: 'CLIMBER',
    letter: 'c',
    wing: 1,
    speed: 0.95,
    hop: 0.7,
    edgeTurn: 0.5,
    move: 'walk',
    tell: null,
    answer: 'STAY ON ITS LEVEL',
  },
  bouncer: {
    kind: 'bouncer',
    name: 'BOUNCER',
    letter: 'b',
    wing: 2,
    speed: 1.5,
    hop: 0,
    edgeTurn: 0,
    move: 'fly',
    tell: null,
    answer: 'LEAVE A BUBBLE ON ITS LINE',
  },
  sprout: {
    kind: 'sprout',
    name: 'SPROUT SNEAK',
    letter: 's',
    wing: 2,
    speed: 1.2,
    hop: 0.8,
    edgeTurn: 0.6,
    move: 'hide',
    tell: 'ITS PETALS TWITCH',
    answer: 'BUBBLE THE FLOWER',
  },
}

export const GRUMP_LETTERS: Record<string, GrumpKind> = Object.fromEntries(
  Object.values(GRUMPS).map((g) => [g.letter, g.kind]),
)

export type GrumpState = 'walk' | 'fly' | 'hidden' | 'rise'

export type Grump = Body & {
  kind: GrumpKind
  dir: -1 | 1
  /** Up or down, for a flyer. */
  dy: -1 | 1
  angry: boolean
  state: GrumpState
  /** Ticks in this state. */
  t: number
  /** A robot is close: the hidden sprout's petals twitch. */
  twitch: boolean
}

/** What a grump can see: the floor, the robots, and this floor's base pace. */
export type GrumpWorld = {
  floor: Floor
  rng: () => number
  /** Base walk speed (px a tick) for this floor. */
  speed: number
  /** Base chance a tick of a hop. */
  hop: number
  robots: readonly Spot[]
  ledges?: readonly Ledge[]
}

/** A sprout pops up when a robot comes this close along its platform. */
export const SPROUT_REACH = { x: 22, y: 18, twitch: 60 }
export const RISE_TICKS = 28
const FLY_HALF = 6
const HALF = 6

export function makeGrump(kind: GrumpKind, at: Spot, rng: () => number): Grump {
  const move = GRUMPS[kind].move
  return {
    kind,
    x: at.x,
    y: move === 'fly' ? at.y - 6 : at.y,
    vx: 0,
    vy: 0,
    onGround: false,
    dir: rng() < 0.5 ? -1 : 1,
    dy: rng() < 0.5 ? -1 : 1,
    angry: false,
    state: move === 'fly' ? 'fly' : move === 'hide' ? 'hidden' : 'walk',
    t: 0,
    twitch: false,
  }
}

/** A grump that bonks a robot on touch (a sprout hiding as a flower, or still unfolding, doesn't). */
export function harmful(g: Grump): boolean {
  if (g.state === 'rise') return g.t >= RISE_TICKS / 2
  return g.state !== 'hidden'
}

/** The centre of a grump's body, where bubbles catch it. */
export function grumpCentre(g: Grump): Spot {
  return g.state === 'fly' ? { x: g.x, y: g.y } : { x: g.x, y: g.y - 6 }
}

function nearest(g: Grump, robots: readonly Spot[]): Spot | null {
  let best: Spot | null = null
  let bd = Infinity
  for (const r of robots) {
    const d = Math.abs(r.x - g.x) + Math.abs(r.y - g.y) * 0.6
    if (d < bd) {
      bd = d
      best = r
    }
  }
  return best
}

/** Is there something to stand on just ahead of a walker's feet? */
function groundAhead(f: Floor, g: Grump): boolean {
  const c = Math.floor((g.x + g.dir * (HALF + 3)) / TILE)
  const r = Math.round((g.y - TOP) / TILE)
  return surface(f, c, r)
}

/** One tick of a grump. */
export function updateGrump(g: Grump, w: GrumpWorld) {
  const spec = GRUMPS[g.kind]
  const mult = g.angry ? 1.5 : 1
  g.t++
  if (g.state === 'hidden') {
    // A flower on the platform, waiting; it rests where it lands.
    const near = nearest(g, w.robots)
    g.twitch =
      !!near &&
      Math.abs(near.x - g.x) < SPROUT_REACH.twitch &&
      Math.abs(near.y - g.y) < SPROUT_REACH.y * 2
    g.vx = 0
    stepBody(w.floor, g, HALF, { ledges: w.ledges })
    if (
      near &&
      Math.abs(near.x - g.x) < SPROUT_REACH.x &&
      Math.abs(near.y - g.y) < SPROUT_REACH.y
    ) {
      g.state = 'rise'
      g.t = 0
      g.dir = near.x < g.x ? -1 : 1
    }
    return
  }
  if (g.state === 'rise') {
    g.vx = 0
    stepBody(w.floor, g, HALF, { ledges: w.ledges })
    if (g.t >= RISE_TICKS) {
      g.state = 'walk'
      g.t = 0
    }
    return
  }
  if (g.state === 'fly') {
    // A diagonal flyer: straight lines, ricocheting off every wall, block, floor and ceiling.
    const s = w.speed * spec.speed * mult
    g.vx = g.dir * s
    g.vy = g.dy * s * 0.8
    const centre = { x: g.x, y: g.y }
    const hit = slide(w.floor, centre, g.vx, g.vy, FLY_HALF)
    if (hit.x || centre.x <= WALL_L + FLY_HALF || centre.x >= WALL_R - FLY_HALF)
      g.dir = g.dir === 1 ? -1 : 1
    if (hit.y || centre.y >= 232 - FLY_HALF) g.dy = g.dy === 1 ? -1 : 1
    g.x = centre.x
    g.y = Math.min(232 - FLY_HALF, centre.y)
    g.onGround = false
    return
  }
  // Walkers.
  if (g.onGround) {
    const near = nearest(g, w.robots)
    if (!groundAhead(w.floor, g) && w.rng() < spec.edgeTurn) {
      // A climber with a robot below walks off to follow it.
      const follow = g.kind === 'climber' && near && near.y > g.y + 20
      if (!follow) g.dir = g.dir === 1 ? -1 : 1
    }
    g.vx = g.dir * w.speed * spec.speed * mult
    let jump = w.rng() < w.hop * spec.hop * mult
    if (
      g.kind === 'climber' &&
      near &&
      near.y < g.y - 24 &&
      w.rng() < 0.025 * mult
    ) {
      jump = true
      g.dir = near.x < g.x ? -1 : 1
    }
    if (jump) {
      g.vy = JUMP_V
      g.onGround = false
    }
  }
  const step = stepBody(w.floor, g, HALF, { ledges: w.ledges })
  if (step.bumped) g.dir = g.dir === 1 ? -1 : 1
  else if (g.onGround && w.rng() < 0.003) g.dir = g.dir === 1 ? -1 : 1
}
