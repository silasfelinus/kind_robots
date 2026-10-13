// /utils/arcade/bumperBubbles/grumps.ts
//
// Fizzwick Tower's grumps (conductor kr-arcade/t-059, spec: CABINETS.md section 7,
// "The roster"). Each grump is a row of data (how fast it walks, how often it hops,
// whether it turns at an edge, how it moves) and one of a few movement rules that
// read only that row, the floor and where the robots are. Behaviour never asks the
// game's update loop which grump it is.

import {
  FLOOR_Y,
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
  | 'grumbler'
  | 'toaster'
  | 'flinger'
  | 'skater'
  | 'cog'
  | 'windup'
  | 'phantom'
  | 'mimic'
  | 'thunder'
  | 'glider'
  | 'jellet'

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
  move:
    | 'walk'
    | 'fly'
    | 'hide'
    | 'swim'
    | 'comet'
    | 'toast'
    | 'cling'
    | 'ghost'
    | 'cloud'
  /** A wind-up's run and rewind: it speeds up for `run` ticks, then stops `rest` to rewind. */
  rewind?: { run: number; rest: number }
  /** A shot it winds up and fires: a water jet or a lens beam along its row. */
  attack?: { kind: HazardKind; every: number; windup: number }
  /** A glider drifts down on the wind instead of dropping. */
  glide?: boolean
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
  grumbler: {
    kind: 'grumbler',
    name: 'STEAM GRUMBLER',
    letter: 'g',
    wing: 5,
    speed: 0.9,
    hop: 0.6,
    edgeTurn: 0.7,
    move: 'walk',
    attack: { kind: 'steam', every: 200, windup: 50 },
    tell: 'ITS NOSE GLOWS RED',
    answer: 'TRAP IT DURING THE WIND-UP',
  },
  toaster: {
    kind: 'toaster',
    name: 'TOAST POPPER',
    letter: 'o',
    wing: 5,
    speed: 1,
    hop: 0.5,
    edgeTurn: 0.6,
    move: 'toast',
    tell: 'THE TOASTER TICKS',
    answer: 'LEAVE A BUBBLE OVER THE SLOT',
  },
  flinger: {
    kind: 'flinger',
    name: 'SNOW-FLINGER',
    letter: 'f',
    wing: 6,
    speed: 0.8,
    hop: 0.5,
    edgeTurn: 0.8,
    move: 'walk',
    attack: { kind: 'snowball', every: 240, windup: 45 },
    tell: 'IT WINDS UP',
    answer: 'DODGE, AND TRAP IT ON THE THROW',
  },
  skater: {
    kind: 'skater',
    name: 'SKATER',
    letter: 'x',
    wing: 6,
    speed: 2.1,
    hop: 0,
    edgeTurn: 0,
    move: 'walk',
    tell: null,
    answer: 'A BUBBLE AT THE END OF ITS SLIDE',
  },
  cog: {
    kind: 'cog',
    name: 'COG CRAWLER',
    letter: 'r',
    wing: 7,
    speed: 0.9,
    hop: 0.6,
    edgeTurn: 0.6,
    move: 'cling',
    tell: 'ITS TEETH CLICK BEFORE IT DROPS',
    answer: 'TRAP IT WHEN IT DROPS',
  },
  windup: {
    kind: 'windup',
    name: 'WIND-UP',
    letter: 'u',
    wing: 7,
    speed: 0.5,
    hop: 0.4,
    edgeTurn: 0.6,
    move: 'walk',
    rewind: { run: 240, rest: 90 },
    tell: 'ITS KEY TURNS',
    answer: 'TRAP IT DURING THE REWIND',
  },
  // The Haunted Pantry (wing 8).
  phantom: {
    kind: 'phantom',
    name: 'PHANTOM',
    letter: 'n',
    wing: 8,
    speed: 0.7,
    hop: 0,
    edgeTurn: 0,
    move: 'ghost',
    tell: 'IT TURNS OPAQUE',
    answer: 'WAIT FOR IT TO TURN SOLID',
  },
  mimic: {
    kind: 'mimic',
    name: 'MIMIC GEM',
    letter: 'e',
    wing: 8,
    speed: 0.6,
    hop: 0.4,
    edgeTurn: 0.6,
    move: 'walk',
    tell: 'THE GEM BLINKS OFF-BEAT',
    answer: 'TRAP IT: IT DROPS A REAL GEM',
  },
  // The Big Jelly's pieces: never in a floor's script, only split off by the boss.
  jellet: {
    kind: 'jellet',
    name: 'LITTLE JELLY',
    letter: 'j',
    wing: 8,
    speed: 1.2,
    hop: 1.3,
    edgeTurn: 0.5,
    move: 'walk',
    tell: null,
    answer: 'POP THEM ALL BEFORE THEY RE-FORM',
  },
  // The Storm Rooftop (wing 9).
  thunder: {
    kind: 'thunder',
    name: 'THUNDER PUFF',
    letter: 'z',
    wing: 9,
    speed: 0.5,
    hop: 0,
    edgeTurn: 0,
    move: 'cloud',
    attack: { kind: 'bolt', every: 240, windup: 60 },
    tell: 'IT TURNS STORM-DARK AND CRACKLES',
    answer: 'TRAP IT WHILE IT IS GREY',
  },
  glider: {
    kind: 'glider',
    name: 'UMBRELLA GRUMP',
    letter: 'l',
    wing: 9,
    speed: 0.9,
    hop: 0.5,
    edgeTurn: 0.15,
    move: 'walk',
    glide: true,
    tell: null,
    answer: 'TRAP IT UPWIND',
  },
}

export type HazardKind = 'jet' | 'beam' | 'steam' | 'snowball' | 'bolt' | 'cap'

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
  /** A snowball's fall, a bottle cap's flight. */
  vy?: number
  /** A bolt's lower end: it strikes the column from y down to y1. */
  y1?: number
  /** A bolt's tell: ticks until it is live. */
  warn?: number
}

export const JET_SPEED = 2.4
export const BEAM_TICKS = 32

export const GRUMP_LETTERS: Record<string, GrumpKind> = Object.fromEntries(
  Object.values(GRUMPS).map((g) => [g.letter, g.kind]),
)

export type GrumpState =
  | 'walk'
  | 'fly'
  | 'hidden'
  | 'rise'
  | 'windup'
  | 'swim'
  | 'leap'
  | 'comet'
  | 'toast'
  | 'popup'
  | 'cling'
  | 'rewind'
  | 'ghost'
  | 'solid'
  | 'cloud'
  | 'charge'

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
  /** Where it started (a toaster's slot). */
  home: Spot
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
            : move === 'toast'
              ? 'toast'
              : move === 'cling'
                ? 'cling'
                : move === 'ghost'
                  ? 'ghost'
                  : move === 'cloud'
                    ? 'cloud'
                    : 'walk'
  return {
    kind,
    x: at.x,
    // A cog crawler hangs under the block above its marker.
    y:
      move === 'fly' || move === 'comet' || move === 'ghost' || move === 'cloud'
        ? at.y - 6
        : move === 'cling'
          ? at.y - 8
          : at.y,
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
    home: { x: at.x, y: at.y },
  }
}

/** Grumps whose position is their centre (they fly, float or hang rather than stand). */
const CENTRED: ReadonlySet<GrumpState> = new Set([
  'fly',
  'comet',
  'ghost',
  'solid',
  'cloud',
  'charge',
])

export const PHANTOM = { ghost: 220, solid: 130 }
export const MIMIC = { beat: 150, disguised: 100 }
export const BOLT_TICKS = 14
export const CLOUD_CHARGE = 60

/** A mimic gem sits still as a gem, then blinks its eyes open off the beat. */
export function disguised(g: Grump): boolean {
  return g.kind === 'mimic' && g.t % MIMIC.beat < MIMIC.disguised
}

/** Can a bubble catch it? (A diver under water can't be reached.) */
export function trappable(g: Grump): boolean {
  return (
    g.state !== 'swim' &&
    g.state !== 'toast' &&
    g.state !== 'cling' &&
    g.state !== 'ghost' &&
    g.state !== 'charge'
  )
}

/** A grump that bonks a robot on touch (a sprout hiding as a flower, or still unfolding, doesn't). */
export function harmful(g: Grump): boolean {
  if (g.state === 'rise') return g.t >= RISE_TICKS / 2
  if (disguised(g)) return false
  return g.state !== 'hidden' && g.state !== 'swim' && g.state !== 'toast'
}

/** The centre of a grump's body, where bubbles catch it. */
export function grumpCentre(g: Grump): Spot {
  if (g.state === 'cling') return { x: g.x, y: g.y + 6 }
  return CENTRED.has(g.state) ? { x: g.x, y: g.y } : { x: g.x, y: g.y - 6 }
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
    if (!CENTRED.has(g.state) && g.state !== 'cling' && g.state !== 'toast') {
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
  if (g.state === 'toast' || g.state === 'popup') {
    toast(g, w)
    return
  }
  if (g.state === 'ghost' || g.state === 'solid') {
    phantom(g, w, spec.speed * w.speed * mult)
    return
  }
  if (g.state === 'cloud' || g.state === 'charge') {
    cloud(g, w, spec.speed * w.speed * mult)
    return
  }
  if (g.state === 'cling') {
    cling(g, w, spec.speed * w.speed * mult)
    return
  }
  if (g.state === 'rewind') {
    // Stopped to wind its key back up (the tell): the moment to trap it.
    g.vx = 0
    stepBody(w.floor, g, HALF, { ledges: w.ledges })
    if (g.t >= (spec.rewind?.rest ?? 0)) {
      g.state = 'walk'
      g.t = 0
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
    // A wind-up speeds up the longer it runs.
    const wound = spec.rewind ? Math.min(4.4, 0.8 + g.t / 70) : 1
    g.vx = g.dir * w.speed * spec.speed * mult * wound
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
  } else if (spec.glide) {
    // An umbrella grump floats down slowly and drifts with the wind.
    g.vy = Math.min(g.vy, 0.45)
    g.vx = g.dir * w.speed * spec.speed * 0.5 + w.floor.wind * 1.4
  }
  const step = stepBody(w.floor, g, HALF, { ledges: w.ledges })
  if (step.bumped) g.dir = g.dir === 1 ? -1 : 1
  else if (g.onGround && w.rng() < 0.003) g.dir = g.dir === 1 ? -1 : 1
  if (spec.rewind && g.t >= spec.rewind.run) {
    g.state = 'rewind'
    g.t = 0
  }
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
  if (attack.kind === 'bolt') {
    // The storm cloud's bolt: straight down its column to the first block.
    let y1 = g.y + 8
    while (y1 < 232 && !solidAt(w.floor, g.x, y1)) y1 += 2
    w.hazards.push({
      kind: 'bolt',
      x: g.x,
      y: g.y + 6,
      vx: 0,
      life: BOLT_TICKS,
      x0: 0,
      x1: 0,
      y1,
      warn: 0,
    })
    return
  }
  if (attack.kind === 'steam') {
    // A scalding cloud puffed out ahead.
    w.hazards.push({
      kind: 'steam',
      x: g.x + g.dir * 14,
      y: g.y - 8,
      vx: g.dir * 0.35,
      life: STEAM_TICKS,
      x0: 0,
      x1: 0,
    })
    return
  }
  if (attack.kind === 'snowball') {
    // Lobbed in an arc at the nearest robot.
    const near = nearest(g, w.robots)
    const dx = near ? near.x - g.x : g.dir * 60
    w.hazards.push({
      kind: 'snowball',
      x: g.x,
      y: g.y - 12,
      vx: Math.max(-2.2, Math.min(2.2, dx / 45)),
      vy: -3.2,
      life: 240,
      x0: 0,
      x1: 0,
    })
    return
  }
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

export const STEAM_TICKS = 50
export const TOAST = { beat: 150, up: 60 }

/** A toast popper: down in its toaster, popping up on the beat, then back into the slot. */
function toast(g: Grump, w: GrumpWorld) {
  if (g.state === 'toast') {
    g.x = g.home.x
    g.y = g.home.y
    g.vx = 0
    g.vy = 0
    if (g.t >= TOAST.beat) {
      g.state = 'popup'
      g.t = 0
      g.vy = -3.6
    }
    return
  }
  // Popped up: out of the slot and back down into it.
  g.vy = Math.min(4, g.vy + w.floor.gravity)
  g.y += g.vy
  if (g.y >= g.home.y && g.vy > 0) {
    g.y = g.home.y
    if (g.t >= TOAST.up) {
      g.state = 'toast'
      g.t = 0
    } else g.vy = -2.4
  }
}

/** A cog crawler, upside down along the underside of the blocks, dropping now and then. */
function cling(g: Grump, w: GrumpWorld, speed: number) {
  const f = w.floor
  const ahead = g.x + g.dir * (HALF + 1)
  const roofAhead = solidAt(f, ahead, g.y - 2)
  if (!roofAhead || ahead <= WALL_L || ahead >= WALL_R)
    g.dir = g.dir === 1 ? -1 : 1
  else g.x += g.dir * speed
  g.vx = g.dir * speed
  if (!solidAt(f, g.x, g.y - 2) || --g.cool <= 0) {
    // It lets go and drops (feet first) onto whatever is beneath.
    g.state = 'walk'
    g.t = 0
    g.y += BODY_DROP
    g.vy = 0
    g.cool = 180 + Math.floor(w.rng() * 160)
  }
}
const BODY_DROP = 14

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

/** A phantom: drifts after the nearest robot through blocks, ghostly, then turns solid for a spell. */
function phantom(g: Grump, w: GrumpWorld, speed: number) {
  if (g.state === 'ghost' && g.t >= PHANTOM.ghost) {
    g.state = 'solid'
    g.t = 0
  } else if (g.state === 'solid' && g.t >= PHANTOM.solid) {
    g.state = 'ghost'
    g.t = 0
  }
  const near = nearest(g, w.robots)
  const s = g.state === 'solid' ? speed * 0.5 : speed
  if (near) {
    const dx = near.x - g.x
    const dy = near.y - 8 - g.y
    const d = Math.hypot(dx, dy) || 1
    g.vx = (dx / d) * s
    g.vy = (dy / d) * s
    g.dir = dx < 0 ? -1 : 1
  } else {
    g.vx = g.dir * s
    g.vy = 0
  }
  g.x = Math.max(WALL_L + HALF, Math.min(WALL_R - HALF, g.x + g.vx))
  g.y = Math.max(TOP + 12, Math.min(FLOOR_Y - 6, g.y + g.vy))
  g.onGround = false
}

/** A thunder puff: drifts along its lane, grey and trappable, then darkens, crackles and bolts the column below. */
function cloud(g: Grump, w: GrumpWorld, speed: number) {
  if (g.state === 'charge') {
    g.vx = 0
    if (g.t >= CLOUD_CHARGE) {
      fire(g, w)
      g.state = 'cloud'
      g.t = 0
      g.cool = Math.floor(
        (GRUMPS[g.kind].attack?.every ?? 240) * (0.7 + w.rng() * 0.6),
      )
    }
    return
  }
  const centre = { x: g.x, y: g.y }
  const hit = slide(w.floor, centre, g.dir * speed, 0, FLY_HALF)
  if (hit.x || centre.x <= WALL_L + FLY_HALF || centre.x >= WALL_R - FLY_HALF)
    g.dir = g.dir === 1 ? -1 : 1
  g.x = centre.x
  g.vx = g.dir * speed
  g.onGround = false
  if (Math.abs(g.y - g.lane) > 1) g.y += Math.sign(g.lane - g.y) * 0.6
  if (--g.cool <= 0) {
    g.state = 'charge'
    g.t = 0
  }
}
