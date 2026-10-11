// /utils/arcade/prizeShow/roster.ts
//
// Prize Show Panic's party crashers (conductor kr-arcade t-027, depth-pass/ASSESSMENT.md section 2,
// "The roster: 4 -> 19 crashers"). ROSTER is the data every room script and test reads: each kind's
// cheer-up hits, points, the episode it debuts in, its tell and its answer. The four founding kinds
// (grabber, bouncer, conga, thrower) still move in games/prizeShowPanic.ts; the fifteen new ones move
// here, through the small CrasherWorld the game hands them, so their rules read on their own.
//
// Every new crasher shows its move before it makes it (the tell column) and has a way to beat it
// (the answer column). Cartoon rules: nobody is hurt, crashers get cheered up and dance off.

import type { ArcadeSoundName } from '../sound'
import type { Side } from './season'
import {
  BOTTOM,
  CX,
  CY,
  LEFT,
  RIGHT,
  TOP,
  clampX,
  clampY,
  wallSpot,
} from './stage'
import type { Point } from './stage'

export type CrasherKind =
  | 'grabber'
  | 'bouncer'
  | 'conga'
  | 'thrower'
  | 'popper'
  | 'tank'
  | 'stagehand'
  | 'drone'
  | 'mascot'
  | 'crane'
  | 'chef'
  | 'timer'
  | 'meatball'
  | 'roadie'
  | 'diver'
  | 'heckler'
  | 'saucer'
  | 'clone'
  | 'fluffball'

export type RosterEntry = {
  name: string
  /** Confetti hits to cheer one up. */
  hp: number
  points: number
  /** The episode it belongs to (episodes 2-4 debut in Opening Night's Encore loops for now). */
  episode: 1 | 2 | 3 | 4
  /** What it shows before it acts. */
  tell: string
  /** How to beat it. */
  answer: string
  /** Bumping into it costs a contestant (wall turrets and fliers don't). */
  contact: boolean
}

export const ROSTER: Record<CrasherKind, RosterEntry> = {
  grabber: {
    name: 'GRABBER',
    hp: 1,
    points: 100,
    episode: 1,
    tell: 'comes in a gang',
    answer: 'spray the gang',
    contact: true,
  },
  bouncer: {
    name: 'BOUNCER',
    hp: 2,
    points: 150,
    episode: 1,
    tell: 'ricochets in straight lines',
    answer: 'read the bounce',
    contact: true,
  },
  conga: {
    name: 'CONGA LINE',
    hp: 1,
    points: 75,
    episode: 1,
    tell: 'the head weaves, the line follows',
    answer: 'cut the line',
    contact: true,
  },
  thrower: {
    name: 'THROWER',
    hp: 3,
    points: 250,
    episode: 1,
    tell: 'winds up a streamer',
    answer: 'close in',
    contact: true,
  },
  popper: {
    name: 'POPPER',
    hp: 1,
    points: 200,
    episode: 1,
    tell: 'swells and flashes before it bursts',
    answer: 'pop it at range',
    contact: true,
  },
  tank: {
    name: 'SWEEPER TANK',
    hp: 6,
    points: 600,
    episode: 1,
    tell: 'its wand glows before a bubble burst',
    answer: 'flank it: the front plate turns confetti',
    contact: true,
  },
  stagehand: {
    name: 'STAGEHAND',
    hp: 2,
    points: 300,
    episode: 1,
    tell: 'crouches to lay a floor mine',
    answer: 'catch it early',
    contact: true,
  },
  drone: {
    name: 'SPOTLIGHT DRONE',
    hp: 3,
    points: 400,
    episode: 1,
    tell: 'a dotted lock line before its beam',
    answer: 'break the line or outpace it',
    contact: false,
  },
  mascot: {
    name: 'MASCOT',
    hp: 16,
    points: 2500,
    episode: 1,
    tell: 'stamps its feet before a charge',
    answer: 'dodge the charge, hit its back',
    contact: true,
  },
  crane: {
    name: 'CAMERA CRANE',
    hp: 4,
    points: 300,
    episode: 1,
    tell: 'the lens glows red along an aim line',
    answer: 'out-angle it',
    contact: false,
  },
  chef: {
    name: 'PIE CHEF',
    hp: 3,
    points: 350,
    episode: 2,
    tell: 'raises a pie; a shadow marks where it lands',
    answer: 'keep moving, mind the cream',
    contact: true,
  },
  timer: {
    name: 'EGG-TIMER BOT',
    hp: 3,
    points: 300,
    episode: 2,
    tell: 'its dial counts down and flashes',
    answer: 'cheer it before zero',
    contact: true,
  },
  meatball: {
    name: 'MEATBALL ROLLER',
    hp: 3,
    points: 300,
    episode: 2,
    tell: 'revs in place, kicking up dust',
    answer: 'sidestep, then spray',
    contact: true,
  },
  roadie: {
    name: 'ROADIE',
    hp: 3,
    points: 350,
    episode: 3,
    tell: 'shoves a flight case ahead of it',
    answer: 'use the cases as cover',
    contact: true,
  },
  diver: {
    name: 'STAGE DIVER',
    hp: 2,
    points: 400,
    episode: 3,
    tell: 'a growing shadow where it lands',
    answer: 'read the shadow',
    contact: true,
  },
  heckler: {
    name: 'HECKLER',
    hp: 2,
    points: 350,
    episode: 3,
    tell: 'raises a megaphone',
    answer: 'cheer it first',
    contact: true,
  },
  saucer: {
    name: 'SAUCER CAM',
    hp: 3,
    points: 400,
    episode: 4,
    tell: 'a tractor beam on a prize',
    answer: 'save the prize, then the saucer',
    contact: false,
  },
  clone: {
    name: 'MIRROR CLONE',
    hp: 3,
    points: 450,
    episode: 4,
    tell: 'copies your moves a beat late',
    answer: 'move so it walks into your spray',
    contact: true,
  },
  fluffball: {
    name: 'FLUFFBALL',
    hp: 1,
    points: 50,
    episode: 4,
    tell: 'swells before it splits',
    answer: 'clear them early',
    contact: true,
  },
}

export const CRASHER_KINDS = Object.keys(ROSTER) as CrasherKind[]

/** Projectiles crashers throw (the game draws and moves them). */
export type ShotStyle = 'streamer' | 'flash' | 'spark' | 'shard' | 'bubble'

export type FlightCase = {
  x: number
  y: number
  vx: number
  vy: number
  /** Still being shoved (its roadie not yet cheered up). */
  pushed: boolean
}

export type Crasher = {
  kind: CrasherKind
  x: number
  y: number
  vx: number
  vy: number
  hp: number
  maxHp: number
  t: number
  /** Conga dancers follow the one in front. */
  leader: Crasher | null
  color: string
  /** Behaviour phase, and ticks spent in it. */
  mode: number
  clock: number
  /** A locked target: where a charge, a leap, a beam or a pie is going. */
  tx: number
  ty: number
  /** Heading in radians (tank, mascot, meatball). */
  face: number
  /** Height off the floor (a diver in the air, a saucer). */
  z: number
  /** Ticks left slowed by the foam cannon, and pumped up by a heckler. */
  slow: number
  pumped: number
  /** A camera crane's wall and firing cadence. */
  side: Side
  every: number
  offset: number
  /** A roadie's flight case. */
  flightCase: FlightCase | null
  /** What a saucer is beaming up. */
  prize: (Point & { lift: number }) | null
  /** Brought on by another crasher (a hatch, a split, a float's drop), not by the script. */
  extra: boolean
  /** A meatball's bounces this roll. */
  count: number
  /** Where a diver took off from. */
  ox: number
  oy: number
}

/** What a crasher may ask of the room it is in. The game implements it. */
export interface CrasherWorld {
  rng(): number
  /** Ticks since the room began. */
  roomTick(): number
  /** Where Sparkle is. */
  player(): Point
  /** Who the crowd chases: Sparkle, or her cardboard cutout while it stands. */
  chase(): Point
  /** Sparkle's position `ago` ticks back (the clone's beat). */
  history(ago: number): Point
  /** This crasher's walking pace (room, loop, foam, heckling and modifiers all in). */
  pace(c: Crasher): number
  /** Everyone still crashing the room. */
  crowd(): readonly Crasher[]
  spawn(kind: CrasherKind, x: number, y: number): Crasher
  fire(
    x: number,
    y: number,
    angle: number,
    speed: number,
    style: ShotStyle,
  ): void
  /** A pie, lobbed to land at (tx, ty) after `ticks`. */
  lobPie(x: number, y: number, tx: number, ty: number, ticks: number): void
  layMine(kind: 'cushion' | 'peel', x: number, y: number): boolean
  /** Sparkle is caught (respects invulnerability and shields). */
  hurt(why: string): void
  /** The prize nearest (x, y) nobody is beaming up yet. */
  freePrize(x: number, y: number): (Point & { lift: number }) | null
  steal(prize: Point): void
  addCase(x: number, y: number): FlightCase
  /** Leave the room without being cheered (a popper that bursts on its own). */
  remove(c: Crasher): void
  puff(x: number, y: number, colour: string, count: number): void
  say(text: string, x: number, y: number): void
  play(sound: ArcadeSoundName): void
}

const TAU = Math.PI * 2

function toward(c: Crasher, p: Point): number {
  return Math.atan2(p.y - c.y, p.x - c.x)
}

function step(c: Crasher, angle: number, speed: number) {
  c.x = clampX(c.x + Math.cos(angle) * speed)
  c.y = clampY(c.y + Math.sin(angle) * speed)
}

function setMode(c: Crasher, mode: number) {
  c.mode = mode
  c.clock = 0
}

/** Turn `face` toward `angle` by at most `rate` radians. */
function turn(face: number, angle: number, rate: number): number {
  let d = angle - face
  while (d > Math.PI) d -= TAU
  while (d < -Math.PI) d += TAU
  return face + Math.max(-rate, Math.min(rate, d))
}

/** Can confetti reach it? (a diver in mid-air can't be hit) */
export function shootable(c: Crasher): boolean {
  return !(c.kind === 'diver' && c.z > 6)
}

/** Can bumping into it hurt Sparkle right now? */
export function touches(c: Crasher): boolean {
  return ROSTER[c.kind].contact && !(c.kind === 'diver' && c.z > 6)
}

/** How close counts as bumping into it. */
export function reachOf(c: Crasher): number {
  if (c.kind === 'mascot') return 14
  if (c.kind === 'tank') return 10
  if (c.kind === 'fluffball') return 6
  return 8
}

/**
 * A plate that turns confetti: the tank's front, and the mascot's belly unless it is dizzy.
 * (vx, vy) is the shot's flight.
 */
export function deflects(c: Crasher, vx: number, vy: number): boolean {
  if (c.kind !== 'tank' && !(c.kind === 'mascot' && c.mode !== 3)) return false
  const len = Math.hypot(vx, vy) || 1
  const head = (vx / len) * Math.cos(c.face) + (vy / len) * Math.sin(c.face)
  return head < -0.35
}

// --- the timings every tell runs on ----------------------------------------------------------

export const TELLS = {
  popperSwell: 30,
  popperRange: 42,
  tankEvery: 170,
  tankCharge: 36,
  stagehandEvery: 210,
  stagehandCrouch: 24,
  droneEvery: 200,
  droneLock: 40,
  droneBeam: 24,
  droneLength: 240,
  mascotWalk: 100,
  mascotStamp: 45,
  mascotStun: 100,
  craneCharge: 42,
  chefEvery: 130,
  chefWindup: 30,
  pieFlight: 50,
  timerFuse: 480,
  meatballRev: 40,
  meatballBounces: 3,
  diverWalk: 80,
  diverFlight: 60,
  diverRing: 26,
  hecklerEvery: 160,
  hecklerWindup: 36,
  hecklerReach: 80,
  hecklerPump: 240,
  saucerBeam: 80,
  cloneBeat: 30,
  fluffEvery: 300,
  fluffSwell: 45,
  fluffCap: 12,
} as const

/** Fresh state for a crasher of `kind` at (x, y). */
export function newCrasher(
  kind: CrasherKind,
  x: number,
  y: number,
  color: string,
  t: number,
): Crasher {
  return {
    kind,
    x: clampX(x),
    y: clampY(y),
    vx: 0,
    vy: 0,
    hp: ROSTER[kind].hp,
    maxHp: ROSTER[kind].hp,
    t,
    leader: null,
    color,
    mode: 0,
    clock: 0,
    tx: x,
    ty: y,
    face: Math.atan2(CY - y, CX - x),
    z: kind === 'saucer' ? 14 : kind === 'drone' ? 10 : 0,
    slow: 0,
    pumped: 0,
    side: 0,
    every: 150,
    offset: 0,
    flightCase: null,
    prize: null,
    extra: false,
    count: 0,
    ox: x,
    oy: y,
  }
}

/** Hang a camera crane on `side`, `at` -1..1 along it. */
export function mountCrane(
  c: Crasher,
  side: Side,
  at: number,
  every: number,
  offset: number,
) {
  const spot = wallSpot(side, at)
  c.x = spot.x
  c.y = spot.y
  c.side = side
  c.every = every
  c.offset = offset
}

/** Whether a crane is charging a flash (its lens glows, its aim line shows). */
export function craneCharging(c: Crasher, roomTick: number): boolean {
  const k = (roomTick + c.offset) % c.every
  return k >= c.every - TELLS.craneCharge
}

/** Move one of the fifteen new crashers a tick. */
export function updateCrasher(c: Crasher, w: CrasherWorld) {
  c.clock++
  if (c.slow > 0) c.slow--
  if (c.pumped > 0) c.pumped--
  const speed = w.pace(c)
  const goal = w.chase()
  switch (c.kind) {
    case 'popper': {
      // Floats in on a bob; close enough, it swells (the tell) and bursts into a ring of shards.
      if (c.mode === 0) {
        step(c, toward(c, goal), speed * 0.55)
        c.y = clampY(c.y + Math.sin(c.t / 9) * 0.35)
        const near = Math.hypot(goal.x - c.x, goal.y - c.y) < TELLS.popperRange
        if (near || c.clock > 600) setMode(c, 1)
      } else if (c.clock >= TELLS.popperSwell) {
        burstPopper(c, w)
        w.remove(c)
      }
      return
    }
    case 'tank': {
      // Grinds round to face Sparkle; its wand glows, then a fan of bubbles.
      c.face = turn(c.face, toward(c, goal), 0.02)
      if (c.mode === 0) {
        step(c, c.face, speed * 0.45)
        if (c.clock >= TELLS.tankEvery) setMode(c, 1)
      } else if (c.clock >= TELLS.tankCharge) {
        for (let i = -2; i <= 2; i++)
          w.fire(
            c.x + Math.cos(c.face) * 10,
            c.y + Math.sin(c.face) * 6,
            c.face + i * 0.22,
            1.5,
            'bubble',
          )
        w.play('shoot')
        setMode(c, 0)
      }
      return
    }
    case 'stagehand': {
      // Wanders the set to waypoints, crouching every so often to lay a cushion or a peel.
      if (c.mode === 0) {
        if (Math.hypot(c.tx - c.x, c.ty - c.y) < 6 || c.clock === 1) {
          c.tx = LEFT + 30 + w.rng() * (RIGHT - LEFT - 60)
          c.ty = TOP + 30 + w.rng() * (BOTTOM - TOP - 60)
        }
        step(c, toward(c, { x: c.tx, y: c.ty }), speed * 0.8)
        if (c.clock >= TELLS.stagehandEvery) setMode(c, 1)
      } else if (c.clock >= TELLS.stagehandCrouch) {
        const near = Math.hypot(w.player().x - c.x, w.player().y - c.y) < 24
        if (!near) w.layMine((c.t >> 4) % 2 ? 'peel' : 'cushion', c.x, c.y + 4)
        setMode(c, 0)
      }
      return
    }
    case 'drone': {
      // Orbits; locks a line on Sparkle (dotted tell), then lights a beam down it.
      if (c.mode === 0) {
        const a = Math.atan2(c.y - goal.y, c.x - goal.x) + 0.018
        const ox = goal.x + Math.cos(a) * 72
        const oy = goal.y + Math.sin(a) * 72
        step(c, toward(c, { x: ox, y: oy }), Math.max(speed, 0.9))
        if (c.clock >= TELLS.droneEvery) {
          c.tx = w.player().x
          c.ty = w.player().y
          setMode(c, 1)
        }
      } else if (c.mode === 1) {
        if (c.clock >= TELLS.droneLock) {
          setMode(c, 2)
          w.play('warn')
        }
      } else {
        const hit = beamHits(
          c.x,
          c.y,
          Math.atan2(c.ty - c.y, c.tx - c.x),
          w.player(),
        )
        if (hit) w.hurt('SPOTLIT!')
        if (c.clock >= TELLS.droneBeam) setMode(c, 0)
      }
      return
    }
    case 'mascot': {
      // Waddles after Sparkle, stamps (the tell), charges in a line, and sees stars at the wall.
      if (c.mode === 0) {
        c.face = toward(c, goal)
        step(c, c.face, speed * 0.7)
        if (c.clock >= TELLS.mascotWalk) {
          setMode(c, 1)
          w.play('warn')
        }
      } else if (c.mode === 1) {
        c.face = turn(c.face, toward(c, goal), 0.05)
        if (c.clock % 10 === 0) w.puff(c.x, c.y + 10, '#c9926a', 3)
        if (c.clock >= TELLS.mascotStamp) setMode(c, 2)
      } else if (c.mode === 2) {
        const nx = c.x + Math.cos(c.face) * 3
        const ny = c.y + Math.sin(c.face) * 3
        c.x = clampX(nx, 12)
        c.y = clampY(ny, 12)
        if (c.x !== nx || c.y !== ny) {
          setMode(c, 3)
          w.puff(c.x, c.y, '#fde68a', 8)
          w.say('BONK!', c.x, c.y - 22)
          w.play('pop')
        }
      } else if (c.clock >= TELLS.mascotStun) {
        setMode(c, 0)
      }
      return
    }
    case 'crane': {
      // A camera on the wall: it locks where Sparkle is as it starts to charge, then flashes.
      const k = (w.roomTick() + c.offset) % c.every
      if (k === c.every - TELLS.craneCharge) {
        c.tx = w.player().x
        c.ty = w.player().y
      }
      if (k === c.every - 1) {
        w.fire(c.x, c.y, Math.atan2(c.ty - c.y, c.tx - c.x), 2.4, 'flash')
        w.play('blip')
      }
      return
    }
    case 'chef': {
      // Keeps its distance; raises a pie (the tell) and lobs it where Sparkle stands.
      const d = Math.hypot(goal.x - c.x, goal.y - c.y)
      const away = d < 80 ? -1 : d > 130 ? 1 : 0
      if (c.mode === 0) {
        step(c, toward(c, goal), speed * 0.6 * away)
        c.x = clampX(c.x + Math.cos(c.t / 30) * 0.3)
        if (c.clock >= TELLS.chefEvery) setMode(c, 1)
      } else if (c.clock >= TELLS.chefWindup) {
        w.lobPie(c.x, c.y - 8, w.player().x, w.player().y, TELLS.pieFlight)
        w.play('blip')
        setMode(c, 0)
      }
      return
    }
    case 'timer': {
      // Trundles about with its dial running down; at zero it hatches a clutch of grabbers.
      step(c, toward(c, goal), speed * 0.35)
      if (c.clock >= TELLS.timerFuse) {
        for (let i = 0; i < 4; i++) {
          const a = (i / 4) * TAU
          const chick = w.spawn(
            'grabber',
            c.x + Math.cos(a) * 9,
            c.y + Math.sin(a) * 9,
          )
          chick.extra = true
        }
        w.say('DING!', c.x, c.y - 14)
        w.puff(c.x, c.y, '#fffbe6', 10)
        w.play('warn')
        w.remove(c)
      }
      return
    }
    case 'meatball': {
      // Revs on the spot (dust, the tell) lined up on Sparkle, then rolls and ricochets.
      if (c.mode === 0) {
        const dx = goal.x - c.x
        const dy = goal.y - c.y
        c.face =
          Math.abs(dx) > Math.abs(dy)
            ? dx > 0
              ? 0
              : Math.PI
            : dy > 0
              ? Math.PI / 2
              : -Math.PI / 2
        if (c.clock % 8 === 0) w.puff(c.x, c.y + 6, '#c9926a', 2)
        if (c.clock >= TELLS.meatballRev) {
          c.vx = Math.round(Math.cos(c.face)) * 2.4
          c.vy = Math.round(Math.sin(c.face)) * 2.4
          c.count = 0
          setMode(c, 1)
        }
      } else {
        c.x += c.vx
        c.y += c.vy
        let bounced = false
        if (c.x < LEFT + 7 || c.x > RIGHT - 7) {
          c.vx = -c.vx
          bounced = true
        }
        if (c.y < TOP + 7 || c.y > BOTTOM - 7) {
          c.vy = -c.vy
          bounced = true
        }
        c.x = clampX(c.x, 7)
        c.y = clampY(c.y, 7)
        if (bounced && ++c.count >= TELLS.meatballBounces) setMode(c, 0)
      }
      return
    }
    case 'roadie': {
      // Shoves its flight case along a line toward Sparkle; the case stops confetti and her too.
      if (!c.flightCase) c.flightCase = w.addCase(c.x, c.y)
      const box = c.flightCase
      if (c.mode === 0) {
        const dx = goal.x - c.x
        const dy = goal.y - c.y
        c.face =
          Math.abs(dx) > Math.abs(dy)
            ? dx > 0
              ? 0
              : Math.PI
            : dy > 0
              ? Math.PI / 2
              : -Math.PI / 2
        setMode(c, 1)
      }
      if (c.mode === 1) {
        const fx = Math.round(Math.cos(c.face))
        const fy = Math.round(Math.sin(c.face))
        const nx = c.x + fx * speed * 0.8
        const ny = c.y + fy * speed * 0.8
        c.x = clampX(nx, 20)
        c.y = clampY(ny, 20)
        box.x = c.x + fx * 15
        box.y = c.y + fy * 13
        if (c.x !== nx || c.y !== ny || c.clock > 160) setMode(c, 2)
      } else if (c.mode === 2 && c.clock >= 30) {
        setMode(c, 0)
      }
      return
    }
    case 'diver': {
      // Walks, then leaps: a shadow grows where it will land, and the landing rings out.
      if (c.mode === 0) {
        step(c, toward(c, goal), speed * 0.6)
        if (c.clock >= TELLS.diverWalk) {
          c.ox = c.x
          c.oy = c.y
          c.tx = clampX(w.player().x, 12)
          c.ty = clampY(w.player().y, 12)
          setMode(c, 1)
          w.play('blip')
        }
      } else {
        const u = Math.min(1, c.clock / TELLS.diverFlight)
        c.x = c.ox + (c.tx - c.ox) * u
        c.y = c.oy + (c.ty - c.oy) * u
        c.z = Math.sin(u * Math.PI) * 44
        if (u >= 1) {
          c.z = 0
          setMode(c, 0)
          w.puff(c.x, c.y, '#f9a8d4', 12)
          w.say('WHUMP!', c.x, c.y - 16)
          w.play('pop')
          const d = Math.hypot(w.player().x - c.x, w.player().y - c.y)
          if (d < TELLS.diverRing) w.hurt('CROWD SURFED!')
        }
      }
      return
    }
    case 'heckler': {
      // Hangs back; raises its megaphone (the tell) and boos the crowd round it into a frenzy.
      const d = Math.hypot(goal.x - c.x, goal.y - c.y)
      const away = d < 90 ? -1 : d > 130 ? 1 : 0
      if (c.mode === 0) {
        step(c, toward(c, goal), speed * 0.5 * away)
        if (c.clock >= TELLS.hecklerEvery) setMode(c, 1)
      } else if (c.clock >= TELLS.hecklerWindup) {
        for (const other of w.crowd()) {
          if (other === c || other.kind === 'heckler') continue
          if (Math.hypot(other.x - c.x, other.y - c.y) < TELLS.hecklerReach)
            other.pumped = TELLS.hecklerPump
        }
        w.say('BOOO!', c.x, c.y - 16)
        w.play('warn')
        setMode(c, 0)
      }
      return
    }
    case 'saucer': {
      // Hovers to the nearest prize and beams it up. Cheer it mid-beam and the prize drops back.
      if (c.mode === 0) {
        const prize = w.freePrize(c.x, c.y)
        if (prize) {
          step(c, toward(c, prize), Math.max(1, speed))
          if (Math.hypot(prize.x - c.x, prize.y - c.y) < 4) {
            c.prize = prize
            setMode(c, 1)
          }
        } else {
          const tx = CX + Math.sin(c.t / 70) * 110
          const ty = TOP + 40 + Math.sin(c.t / 45) * 20
          step(c, toward(c, { x: tx, y: ty }), Math.max(0.8, speed))
        }
      } else {
        const prize = c.prize
        if (!prize) {
          setMode(c, 0)
          return
        }
        prize.lift = c.clock / TELLS.saucerBeam
        if (c.clock >= TELLS.saucerBeam) {
          w.steal(prize)
          w.say('BEAMED UP!', c.x, c.y - 18)
          c.prize = null
          setMode(c, 0)
        }
      }
      return
    }
    case 'clone': {
      // Replays Sparkle's moves a beat late, from wherever it is.
      const now = w.history(TELLS.cloneBeat)
      const before = w.history(TELLS.cloneBeat + 1)
      c.vx = now.x - before.x
      c.vy = now.y - before.y
      c.x = clampX(c.x + c.vx)
      c.y = clampY(c.y + c.vy)
      return
    }
    case 'fluffball': {
      // Bumbles after Sparkle; left alone it swells and splits in two.
      step(c, toward(c, goal) + Math.sin(c.t / 11) * 0.8, speed * 0.5)
      if (c.clock >= TELLS.fluffEvery + TELLS.fluffSwell) {
        const fluff = w.crowd().filter((o) => o.kind === 'fluffball').length
        if (fluff < TELLS.fluffCap) {
          const twin = w.spawn('fluffball', c.x + 8, c.y)
          twin.extra = true
          twin.clock = Math.floor(w.rng() * 60)
          w.puff(c.x, c.y, '#f9a8d4', 6)
        }
        setMode(c, 0)
        c.clock = Math.floor(w.rng() * 60)
      }
      return
    }
    default:
      return
  }
}

/** A popper's ring of eight streamer shards. */
export function burstPopper(c: Crasher, w: CrasherWorld) {
  for (let i = 0; i < 8; i++) w.fire(c.x, c.y, (i / 8) * TAU, 1.6, 'shard')
  w.puff(c.x, c.y, '#f9a8d4', 10)
  w.play('pop')
}

/** Does a drone's beam from (x, y) along `angle` cover `p`? */
export function beamHits(
  x: number,
  y: number,
  angle: number,
  p: Point,
): boolean {
  const dx = Math.cos(angle)
  const dy = Math.sin(angle)
  const rx = p.x - x
  const ry = p.y - y
  const along = rx * dx + ry * dy
  const across = Math.abs(rx * dy - ry * dx)
  return along > 4 && along < TELLS.droneLength && across < 5
}
