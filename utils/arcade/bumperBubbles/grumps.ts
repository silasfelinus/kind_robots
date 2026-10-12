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
  WATER,
  slide,
  solidAt,
  stepBody,
  surface,
  waterAt,
} from './tower'
import type { Body, Floor, Ledge, Spot } from './tower'

export type GrumpKind =
  | 'waddler'
  | 'hopper'
  | 'dasher'
  | 'climber'
  | 'bouncer'
  | 'sprout'
  | 'puffer'
  | 'diver'
  | 'comet'
  | 'tick'
  | 'corklet'

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
  move: 'walk' | 'fly' | 'hide' | 'swim' | 'comet'
  /** A shot it winds up and fires: a water jet or a lens beam along its row. */
  attack?: { kind: HazardKind; every: number; windup: number }
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
  puffer: {
    kind: 'puffer',
    name: 'PUDDLE PUFFER',
    letter: 'p',
    wing: 3,
    speed: 0.8,
    hop: 0.5,
    edgeTurn: 0.8,
    move: 'walk',
    attack: { kind: 'jet', every: 220, windup: 60 },
    tell: 'ITS CHEEKS PUFF',
    answer: 'HOP THE JET, TRAP IT FROM BEHIND',
  },
  diver: {
    kind: 'diver',
    name: 'DIVER',
    letter: 'i',
    wing: 3,
    speed: 1.1,
    hop: 0.5,
    edgeTurn: 0.7,
    move: 'swim',
    tell: 'BUBBLES RISE WHERE IT SWIMS',
    answer: 'TRAP IT AS IT SURFACES',
  },
  comet: {
    kind: 'comet',
    name: 'COMET SPRITE',
    letter: 'm',
    wing: 4,
    speed: 2.6,
    hop: 0,
    edgeTurn: 0,
    move: 'comet',
    tell: null,
    answer: 'SET A BUBBLE WALL IN ITS LANE',
  },
  tick: {
    kind: 'tick',
    name: 'TELESCOPE TICK',
    letter: 't',
    wing: 4,
    speed: 0.6,
    hop: 0.4,
    edgeTurn: 0.9,
    move: 'walk',
    attack: { kind: 'beam', every: 260, windup: 50 },
    tell: 'A GLINT IN ITS LENS',
    answer: 'LEAVE THE ROW',
  },
  // The Big Cork's spit: never in a floor's script, only flung out by the boss.
  corklet: {
    kind: 'corklet',
    name: 'LITTLE CORK',
    letter: 'k',
    wing: 3,
    speed: 1.1,
    hop: 2.2,
    edgeTurn: 0.3,
    move: 'walk',
    tell: null,
    answer: 'POP IT AGAINST THE BIG CORK',
  },
}

export type HazardKind = 'jet' | 'beam'

/** A grump's shot: a water jet flying along, or a beam lit across a row. */
export type Hazard = {
  kind: HazardKind
  x: number
  y: number
  vx: number
  life: number
  /** A beam's ends. */
  x0: number
  x1: number
}

export const JET_SPEED = 2.4
export const BEAM_TICKS = 32

export const GRUMP_LETTERS: Record<string, GrumpKind> = Object.fromEntries(
  Object.values(GRUMPS).map((g) => [g.letter, g.kind]),
)

export type GrumpState =
  'walk' | 'fly' | 'hidden' | 'rise' | 'windup' | 'swim' | 'leap' | 'comet'

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
  /** Ticks until it next winds up a shot, or surfaces. */
  cool: number
  /** A comet's lane (the height it streaks along, and drifts back to). */
  lane: number
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
  /** Shots grumps fire land here. */
  hazards?: Hazard[]
  /** Every grump stands frozen (the Clock). */
  frozen?: boolean
}

/** A sprout pops up when a robot comes this close along its platform. */
export const SPROUT_REACH = { x: 22, y: 18, twitch: 60 }
export const RISE_TICKS = 28
const FLY_HALF = 6
const HALF = 6

export function makeGrump(kind: GrumpKind, at: Spot, rng: () => number): Grump {
  const spec = GRUMPS[kind]
  const move = spec.move
  const state: GrumpState =
    move === 'fly'
      ? 'fly'
      : move === 'hide'
        ? 'hidden'
        : move === 'swim'
          ? 'swim'
          : move === 'comet'
            ? 'comet'
            : 'walk'
  return {
    kind,
    x: at.x,
    y: move === 'fly' || move === 'comet' ? at.y - 6 : at.y,
    vx: 0,
    vy: 0,
    onGround: false,
    dir: rng() < 0.5 ? -1 : 1,
    dy: rng() < 0.5 ? -1 : 1,
    angry: false,
    state,
    t: 0,
    twitch: false,
    cool: Math.floor((spec.attack?.every ?? 180) * (0.5 + rng() * 0.6)),
    lane: at.y - 6,
  }
}

/** Can a bubble catch it? (A diver under water can't be reached.) */
export function trappable(g: Grump): boolean {
  return g.state !== 'swim'
}

/** A grump that bonks a robot on touch (a sprout hiding as a flower, or still unfolding, doesn't). */
export function harmful(g: Grump): boolean {
  if (g.state === 'rise') return g.t >= RISE_TICKS / 2
  return g.state !== 'hidden' && g.state !== 'swim'
}

/** The centre of a grump's body, where bubbles catch it. */
export function grumpCentre(g: Grump): Spot {
  return g.state === 'fly' || g.state === 'comet'
    ? { x: g.x, y: g.y }
    : { x: g.x, y: g.y - 6 }
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
  if (w.frozen) {
    // The Clock: everyone stands still (a flyer hangs where it is).
    if (g.state !== 'fly' && g.state !== 'comet') {
      g.vx = 0
      stepBody(w.floor, g, HALF, { ledges: w.ledges })
    }
    return
  }
  if (g.state === 'windup') {
    // The tell: puffed cheeks, or a glinting lens. Then the shot.
    g.vx = 0
    stepBody(w.floor, g, HALF, { ledges: w.ledges })
    if (g.t >= (spec.attack?.windup ?? 0)) {
      fire(g, w)
      g.state = 'walk'
      g.t = 0
      g.cool = Math.floor((spec.attack?.every ?? 200) * (0.7 + w.rng() * 0.6))
    }
    return
  }
  if (g.state === 'swim' || g.state === 'leap') {
    swim(g, w, spec.speed * w.speed * mult)
    return
  }
  if (g.state === 'comet') {
    // Straight along its lane, fast, turning at walls and blocks.
    const s = w.speed * spec.speed * mult
    const centre = { x: g.x, y: g.y }
    const hit = slide(w.floor, centre, g.dir * s, 0, FLY_HALF)
    if (hit.x || centre.x <= WALL_L + FLY_HALF || centre.x >= WALL_R - FLY_HALF)
      g.dir = g.dir === 1 ? -1 : 1
    g.x = centre.x
    g.vx = g.dir * s
    g.onGround = false
    // Freed from a bubble somewhere else, it drifts back to its lane.
    if (Math.abs(g.y - g.lane) > 1) g.y += Math.sign(g.lane - g.y) * 0.6
    return
  }
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
  // A shooter winds up now and then, facing the nearest robot on its level.
  if (spec.attack && g.onGround && --g.cool <= 0) {
    const near = nearest(g, w.robots)
    if (near && Math.abs(near.y - g.y) < 24) g.dir = near.x < g.x ? -1 : 1
    g.state = 'windup'
    g.t = 0
  }
  // A diver flopping about on dry land slips back into any water it reaches.
  if (spec.move === 'swim' && waterAt(w.floor, g.x, g.y - 4) !== WATER.none) {
    g.state = 'swim'
    g.t = 0
  }
}

function fire(g: Grump, w: GrumpWorld) {
  const attack = GRUMPS[g.kind].attack
  if (!attack || !w.hazards) return
  const y = g.y - 6
  if (attack.kind === 'jet') {
    w.hazards.push({
      kind: 'jet',
      x: g.x + g.dir * 8,
      y,
      vx: g.dir * JET_SPEED,
      life: 200,
      x0: 0,
      x1: 0,
    })
  } else {
    // A beam across the row, out to the first block or wall.
    let x = g.x + g.dir * 8
    while (x > WALL_L && x < WALL_R && !solidAt(w.floor, x, y)) x += g.dir * 2
    w.hazards.push({
      kind: 'beam',
      x: g.x,
      y,
      vx: 0,
      life: BEAM_TICKS,
      x0: Math.min(g.x, x),
      x1: Math.max(g.x, x),
    })
  }
}

/** A diver: along its channel under water, leaping clear every so often. */
function swim(g: Grump, w: GrumpWorld, speed: number) {
  const f = w.floor
  if (g.state === 'swim') {
    const wet = waterAt(f, g.x, g.y - 4) !== WATER.none
    if (!wet) {
      // Out of the water: it walks (and flops) until it finds some.
      g.state = 'walk'
      g.t = 0
      return
    }
    const ahead = g.x + g.dir * (HALF + 2)
    if (
      waterAt(f, ahead, g.y - 4) === WATER.none ||
      ahead <= WALL_L ||
      ahead >= WALL_R
    )
      g.dir = g.dir === 1 ? -1 : 1
    g.vx = g.dir * speed
    stepBody(f, g, HALF)
    if (--g.cool <= 0) {
      g.state = 'leap'
      g.t = 0
      g.vy = JUMP_V * 0.85
      g.onGround = false
      g.cool = 150 + Math.floor(w.rng() * 120)
    }
    return
  }
  // Leaping: up out of the channel and back down into it.
  g.vx = g.dir * speed * 0.6
  stepBody(f, g, HALF)
  if (
    g.t > 8 &&
    (g.onGround || g.vy > 0) &&
    waterAt(f, g.x, g.y - 4) !== WATER.none
  ) {
    g.state = 'swim'
    g.t = 0
  } else if (g.onGround && g.t > 8) {
    g.state = 'walk'
    g.t = 0
  }
}
