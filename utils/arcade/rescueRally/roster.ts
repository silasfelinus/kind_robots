// /utils/arcade/rescueRally/roster.ts
//
// Rescue Rally's glitched roster (conductor kr-arcade t-035, depth-pass/CABINETS.md section 1, "The
// roster"). FOES is the data every wave script, test and the table guide read: each kind's hits,
// points, size, whether the wave waits for it, its tell and its answer. Every kind moves here,
// through the small FoeWorld the game hands it, so its rules read on their own.
//
// The beam never hurts anyone: a beaten foe is a helper bot rebooted back into a friend. Five kinds
// come from the original cabinet (drone, seeker, spawner, tank, puddle); slice 1 adds the teeth:
// - the stomper, a wind-up giant no beam can stop, only shove, who knocks the family dizzy;
// - the hypno, who hunts the family and glitches them into glitched friends;
// - the sparker, who flashes, then fires a spark at where the hero is going;
// - the pylon, a neon post laid out in shapes by the wave script.

import { levelCurve } from '../curve'
import type { ArcadeSoundName } from '../sound'
import { ARENA, CX, CY, clampToArena, dist, toward } from './arena'
import type { Point } from './arena'
import type { Rescuee } from './family'

export type FoeKind =
  | 'drone'
  | 'seeker'
  | 'spawner'
  | 'tank'
  | 'puddle'
  | 'stomper'
  | 'hypno'
  | 'sparker'
  | 'pylon'
  | 'windup'
  | 'crate'

export type FoeSpec = {
  name: string
  /** Beam hits to reboot one; 0 means no beam can (it can only be shoved). */
  hp: number
  points: number
  radius: number
  /** The wave isn't clear while one is about. */
  hostile: boolean
  /** How far a beam hit shoves it (px). */
  shove: number
  /** Touching it costs nothing (a crate), though it may still block the way. */
  harmless?: boolean
  /** A box nobody walks through: the hero, the family and the walkers are pushed off it. */
  solid?: boolean
  /** What it shows before it acts, and how to beat it (the table guide's columns). */
  tell: string
  answer: string
}

export const FOES: Record<FoeKind, FoeSpec> = {
  drone: {
    name: 'DRONE',
    hp: 1,
    points: 100,
    radius: 8,
    hostile: true,
    shove: 0,
    tell: 'shuffles at you in little steps',
    answer: 'sweep the crowd',
  },
  seeker: {
    name: 'SEEKER',
    hp: 1,
    points: 150,
    radius: 5,
    hostile: true,
    shove: 0,
    tell: 'hatches from a spawner and homes in',
    answer: 'beam it head on',
  },
  spawner: {
    name: 'SPAWNER',
    hp: 3,
    points: 500,
    radius: 11,
    hostile: true,
    shove: 0,
    tell: 'throbs, then hatches a seeker',
    answer: 'pop it early',
  },
  tank: {
    name: 'TANK',
    hp: 5,
    points: 300,
    radius: 13,
    hostile: true,
    shove: 2.4,
    tell: 'slow treads, a scanning eye',
    answer: 'keep beaming it back',
  },
  puddle: {
    name: 'GLITCH PUDDLE',
    hp: 1,
    points: 25,
    radius: 7,
    hostile: false,
    shove: 0,
    tell: 'bubbles on the floor',
    answer: 'step round or pop it',
  },
  stomper: {
    name: 'STOMPER',
    hp: 0,
    points: 0,
    radius: 13,
    hostile: false,
    shove: 3.2,
    tell: 'big and slow, its key clicks',
    answer: 'steer it from the family',
  },
  hypno: {
    name: 'HYPNO',
    hp: 3,
    points: 400,
    radius: 9,
    hostile: true,
    shove: 0,
    tell: 'swirly eyes, heads for the family',
    answer: 'priority target: get there first',
  },
  sparker: {
    name: 'SPARKER',
    hp: 2,
    points: 250,
    radius: 8,
    hostile: true,
    shove: 0,
    tell: 'flashes before each spark',
    answer: 'change direction on the flash',
  },
  pylon: {
    name: 'PYLON',
    hp: 1,
    points: 25,
    radius: 5,
    hostile: false,
    shove: 0,
    tell: 'static posts, in shapes',
    answer: 'thread it, or pop a gap',
  },
  windup: {
    name: 'LITTLE WIND-UP',
    hp: 1,
    points: 50,
    radius: 6,
    hostile: true,
    shove: 0,
    tell: 'scuttles straight, then turns',
    answer: 'step off its line',
  },
  crate: {
    name: 'CRATE',
    hp: 3,
    points: 50,
    radius: 7,
    hostile: false,
    shove: 0,
    harmless: true,
    solid: true,
    tell: 'stacked toy crates',
    answer: 'cover from sparks; break for a prize',
  },
}

export const FOE_KINDS = Object.keys(FOES) as FoeKind[]

export type Foe = {
  kind: FoeKind
  x: number
  y: number
  vx: number
  vy: number
  hp: number
  timer: number
  seed: number
  /** A behaviour's mode and clock: a stomper's walk or rewind, a sparker's flash, a hypno's trance. */
  mode: number
  clock: number
  /** Shove still carrying it after a beam hit. */
  pushX: number
  pushY: number
}

/** Difficulty by global wave number: each keeps rising to the end of the campaign. */
export const FOE_CURVES = {
  droneSpeed: { start: 0.65, step: 0.04, limit: 1.6 },
  seekerPull: { start: 0.22, step: 0.004, limit: 0.36 },
  spawnEvery: { start: 240, step: -4, limit: 90 },
  sparkEvery: { start: 150, step: -3, limit: 60 },
  sparkSpeed: { start: 2.3, step: 0.03, limit: 3.5 },
  hypnoSpeed: { start: 0.75, step: 0.01, limit: 1.15 },
  stomperSpeed: { start: 0.45, step: 0.008, limit: 0.8 },
} as const

/** The longest-running wave moves its walkers this much faster than at the start. */
export const RUSH_MAX = 2
/** Ticks for a wave to reach full rush. */
export const RUSH_TICKS = 60 * 30

/** A sparker's flash: this many ticks of warning before every spark. */
export const SPARK_TELL = 36
/** A stomper walks for this long, then stops to rewind its key. */
export const STOMP_WALK = 130
export const STOMP_REWIND = 44
/** A hypno stands in a trance this long after glitching someone. */
export const HYPNO_TRANCE = 50

/** A hero as a foe sees it: where, and which way it is moving (sparkers lead it). */
export type Quarry = Point & { vx: number; vy: number }

/** What the roster may ask of the arena. */
export type FoeWorld = {
  rng: () => number
  /** Global wave number, for the curves. */
  heat: number
  /**
   * How long the wave has run, as a speed-up (1 at the start, up to RUSH_MAX): as in the classic,
   * the walkers hurry the longer a hero dawdles.
   */
  rush: number
  /** The nearest hero still standing, or null. */
  hero(from: Point): Quarry | null
  /** The nearest rescuee a hypno could glitch or a stomper could bonk, or null. */
  family(from: Point): Rescuee | null
  /** A stomper has walked into a rescuee. */
  bonk(r: Rescuee, by: Foe): void
  /** A hypno has reached one. */
  glitch(r: Rescuee, by: Foe): void
  /** A foe's shot: a spark at (x, y) with this velocity. */
  fire(x: number, y: number, vx: number, vy: number): void
  /** A new foe in the arena (a spawner's seeker). */
  hatch(kind: FoeKind, at: Point): void
  sound(name: ArcadeSoundName): void
}

export function newFoe(kind: FoeKind, at: Point, rng: () => number): Foe {
  return {
    kind,
    x: at.x,
    y: at.y,
    vx: 0,
    vy: 0,
    hp: FOES[kind].hp,
    timer: Math.floor(rng() * 120),
    seed: rng() * 100,
    mode: 0,
    clock: 0,
    pushX: 0,
    pushY: 0,
  }
}

/** One tick of a foe. */
export function stepFoe(f: Foe, w: FoeWorld) {
  f.timer++
  const hero = w.hero(f)
  switch (f.kind) {
    case 'drone': {
      // Shuffle toward the hero in little steps, like a wind-up toy.
      const speed = heatCurve(w, FOE_CURVES.droneSpeed) * w.rush
      if (f.timer % 12 === 0) {
        const u = hero ? toward(f, hero) : toward(f, { x: CX, y: CY })
        const jitter = (w.rng() - 0.5) * 0.6
        f.vx = (u.x + jitter) * speed * 2
        f.vy = (u.y - jitter) * speed * 2
      }
      if (f.timer % 12 < 7) {
        f.x += f.vx
        f.y += f.vy
      }
      break
    }
    case 'seeker': {
      const pull = heatCurve(w, FOE_CURVES.seekerPull) * Math.sqrt(w.rush)
      const u = hero ? toward(f, hero) : { x: 0, y: 0 }
      f.vx = f.vx * 0.94 + u.x * pull
      f.vy = f.vy * 0.94 + u.y * pull
      f.x += f.vx
      f.y += f.vy
      break
    }
    case 'tank': {
      const u = hero ? toward(f, hero) : { x: 0, y: 0 }
      const speed = heatCurve(w, FOE_CURVES.droneSpeed) * 0.45 * w.rush
      f.x += u.x * speed
      f.y += u.y * speed
      break
    }
    case 'spawner': {
      f.x += Math.cos(f.timer / 60 + f.seed) * 0.4
      f.y += Math.sin(f.timer / 47 + f.seed) * 0.4
      if (f.timer % Math.round(heatCurve(w, FOE_CURVES.spawnEvery)) === 0) {
        w.hatch('seeker', f)
        w.sound('warn')
      }
      break
    }
    case 'stomper':
      stepStomper(f, w, hero)
      break
    case 'hypno':
      stepHypno(f, w, hero)
      break
    case 'sparker':
      stepSparker(f, w, hero)
      break
    case 'windup': {
      // A little wind-up toy: it scuttles straight, then turns toward the hero and goes again.
      if (f.clock <= 0) {
        const u = hero ? toward(f, hero) : toward(f, { x: CX, y: CY })
        const swerve = (w.rng() - 0.5) * 1.2
        const speed = 1.5 * Math.sqrt(w.rush)
        f.vx = (u.x * Math.cos(swerve) - u.y * Math.sin(swerve)) * speed
        f.vy = (u.y * Math.cos(swerve) + u.x * Math.sin(swerve)) * speed
        f.clock = 40 + Math.floor(w.rng() * 40)
      }
      f.clock--
      f.x += f.vx
      f.y += f.vy
      if (f.x < ARENA.left + 8 || f.x > ARENA.right - 8) f.vx *= -1
      if (f.y < ARENA.top + 8 || f.y > ARENA.bottom - 8) f.vy *= -1
      break
    }
    case 'puddle':
    case 'pylon':
    case 'crate':
      break
  }
  if (f.pushX || f.pushY) {
    f.x += f.pushX
    f.y += f.pushY
    f.pushX *= 0.8
    f.pushY *= 0.8
    if (Math.abs(f.pushX) + Math.abs(f.pushY) < 0.05) f.pushX = f.pushY = 0
  }
  clampToArena(f, FOES[f.kind].radius)
}

/**
 * The stomper walks in wind-up bursts toward the nearest of the family (the hero when none is
 * left), then stands to rewind its key. Whoever it walks into is knocked dizzy.
 */
function stepStomper(f: Foe, w: FoeWorld, hero: Quarry | null) {
  if (f.mode === 0 && f.clock === 0) f.clock = STOMP_WALK
  if (--f.clock <= 0) {
    f.mode = f.mode === 0 ? 1 : 0
    f.clock =
      f.mode === 1 ? STOMP_REWIND : STOMP_WALK + Math.floor(w.rng() * 40)
    if (f.mode === 1) w.sound('blip')
  }
  if (f.mode === 1) return
  const prey = w.family(f)
  const goal: Point | null = prey ?? hero
  if (!goal) return
  const u = toward(f, goal)
  const speed = heatCurve(w, FOE_CURVES.stomperSpeed) * (prey ? 1 : 0.6)
  // Heavy: it turns slowly, so a shove sends it the long way round.
  f.vx = f.vx * 0.92 + u.x * speed * 0.08
  f.vy = f.vy * 0.92 + u.y * speed * 0.08
  // Stomp, stomp: the walk goes in beats.
  const beat = f.timer % 20 < 13 ? 1.3 : 0.4
  f.x += f.vx * beat
  f.y += f.vy * beat
  if (prey && dist(f, prey) < FOES.stomper.radius + 6) w.bonk(prey, f)
}

/** The hypno hunts the family; after glitching one it stands in a trance, then hunts again. */
function stepHypno(f: Foe, w: FoeWorld, hero: Quarry | null) {
  const speed = heatCurve(w, FOE_CURVES.hypnoSpeed) * Math.sqrt(w.rush)
  if (f.mode === 1) {
    if (--f.clock <= 0) f.mode = 0
    return
  }
  const prey = w.family(f)
  if (prey) {
    const u = toward(f, prey)
    f.vx = f.vx * 0.9 + u.x * speed * 0.1
    f.vy = f.vy * 0.9 + u.y * speed * 0.1
    f.x += f.vx
    f.y += f.vy
    if (dist(f, prey) < FOES.hypno.radius + 6) {
      w.glitch(prey, f)
      f.mode = 1
      f.clock = HYPNO_TRANCE
    }
    return
  }
  // Nobody left to glitch: it drifts after the hero instead, swaying.
  const goal = hero ?? { x: CX, y: CY }
  const u = toward(f, goal)
  const sway = Math.sin(f.timer / 25 + f.seed)
  f.x += (u.x - u.y * sway) * speed * 0.55
  f.y += (u.y + u.x * sway) * speed * 0.55
}

/**
 * The sparker keeps its distance and circles; every so often it flashes (the tell), then fires a
 * spark at where the hero will be if it keeps going the same way.
 */
function stepSparker(f: Foe, w: FoeWorld, hero: Quarry | null) {
  const every = Math.round(
    heatCurve(w, FOE_CURVES.sparkEvery) / Math.sqrt(w.rush),
  )
  if (f.clock === 0) f.clock = SPARK_TELL + 30 + Math.floor(w.rng() * every)
  if (hero) {
    const d = dist(f, hero)
    const u = toward(f, hero)
    const side = f.seed > 50 ? 1 : -1
    const range = d < 96 ? -1 : d > 160 ? 1 : 0
    const tx = u.x * range - u.y * side * 0.7
    const ty = u.y * range + u.x * side * 0.7
    f.vx = f.vx * 0.9 + tx * 0.75 * 0.1
    f.vy = f.vy * 0.9 + ty * 0.75 * 0.1
  }
  if (f.mode === 1) {
    // Flashing: it plants its feet.
    f.vx *= 0.7
    f.vy *= 0.7
  }
  f.x += f.vx
  f.y += f.vy
  // Wall-shy: it turns back before it pins itself in a corner.
  if (f.x < ARENA.left + 24) f.vx += 0.05
  if (f.x > ARENA.right - 24) f.vx -= 0.05
  if (f.y < ARENA.top + 24) f.vy += 0.05
  if (f.y > ARENA.bottom - 24) f.vy -= 0.05
  f.clock--
  f.mode = f.clock <= SPARK_TELL ? 1 : 0
  if (f.clock > 0) return
  f.clock = every + Math.floor(w.rng() * 40)
  f.mode = 0
  if (!hero) return
  const speed = heatCurve(w, FOE_CURVES.sparkSpeed)
  const lead = leadShot(f, hero, speed)
  w.fire(f.x, f.y, lead.x * speed, lead.y * speed)
  w.sound('blip')
}

/** The unit direction that meets a target moving at (vx, vy), for a shot at `speed`. */
export function leadShot(from: Point, target: Quarry, speed: number): Point {
  // Two passes of "where will it be when the shot gets there" are close enough at these speeds.
  let aim: Point = target
  for (let i = 0; i < 2; i++) {
    const t = dist(from, aim) / speed
    aim = {
      x: Math.min(
        ARENA.right - 6,
        Math.max(ARENA.left + 6, target.x + target.vx * t),
      ),
      y: Math.min(
        ARENA.bottom - 6,
        Math.max(ARENA.top + 6, target.y + target.vy * t),
      ),
    }
  }
  return toward(from, aim)
}

function heatCurve(
  w: FoeWorld,
  spec: { start: number; step: number; limit: number },
) {
  return levelCurve(w.heat, spec)
}
