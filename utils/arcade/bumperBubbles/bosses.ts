// /utils/arcade/bumperBubbles/bosses.ts
//
// Fizzwick Tower's bosses (conductor kr-arcade m8, spec: CABINETS.md section 7, "The bosses").
// Each boss is a row of data (its size, its hits a phase, what can hurt it in each phase, the
// minion it spits, the special bubbles that drift in while it fights, its prize) and a state
// machine per boss. Bubbles can never hold a boss.
//
// THE BIG CORK (floor 25; slice 2, t-060): a cork bubble popped against it, or floating into
// it, knocks a chunk off.
//   1. It bounces diagonally round the room, spitting little corks.
//   2. It wedges in the ceiling over a robot, creaks (the tell) and slams onto that platform.
//   3. It fizzes round the top of the room at double speed: Float bubbles are the way up.
//
// THE KETTLE COLOSSUS (floor 50; slice 3, t-061): a huge kettle squatting on the floor.
//   1. Its lid rattles (the tell), then a steam column blasts up where a robot stood. It spits
//      steam grumblers: pop their bubbles against it.
//   2. It pours scalding water that floods the bottom of the room. Splash bubbles drift in: the
//      wave they set loose runs down the platforms and crashes into it.
//   3. It spins whistling across the floor in great hops. Zap bubbles drift in: a bolt stuns it
//      and hurts.
//
// THE JELLY MOULD (floor 75, in the dark; slice 4, t-062): a wobbling giant jelly. Each phase
// ends by splitting it: into two, then four, then eight little jellies. Little jellies trapped
// and popped against it hurt it; left alone too long they slide back together and heal it.
//
// THE GRUMBLE FIZZ KING (floor 100; slice 4): a huge sulking bottle on a throne of crates.
//   1. He throws bottle caps in fans. Only Zap bubbles, and minions popped beside him, hurt him.
//   2. He shakes himself up and fizz floods the room upward (it rises, drains, rises again):
//      climb on bubbles and gum ledges ahead of it.
//   3. His cap pops off and he shrinks into a tiny, cheerful, harmless soda bot.

import type { GrumpKind } from './grumps'
import { FLOOR_Y, TOP, TILE, WALL_L, WALL_R, groundBelow } from './tower'
import type { BossId, Floor, SpecialKind, Spot } from './tower'

export type BossState =
  | 'enter'
  | 'bounce'
  | 'climb'
  | 'creak'
  | 'slam'
  | 'fizz'
  | 'idle'
  | 'rattle'
  | 'blast'
  | 'pour'
  | 'spin'
  | 'stunned'
  | 'popping'
  | 'wobble'
  | 'throw'
  | 'shake'
  | 'tiny'
  | 'done'

/** What can hurt a boss: a minion's bubble popped against it, a Splash wave, a bolt, flames. */
export type HurtKind = 'pop' | 'wave' | 'zap' | 'fire'

export type Phase = 1 | 2 | 3

export type BossSpec = {
  name: string
  r: number
  hpPerPhase: number
  prize: number
  minion: GrumpKind
  maxMinions: number
  /** How close to it a minion's bubble must pop to hurt it (px beyond its body). */
  popReach: number
  spitEvery: readonly [number, number, number]
  hurtBy: Record<Phase, readonly HurtKind[]>
  specials: Record<Phase, readonly SpecialKind[]>
  /** The banner as each later phase begins. */
  phases: Record<2 | 3, { text: string; sub: string }>
}

export const BOSSES: Record<BossId, BossSpec> = {
  cork: {
    name: 'THE BIG CORK',
    r: 15,
    hpPerPhase: 3,
    prize: 30_000,
    minion: 'corklet',
    maxMinions: 3,
    popReach: 17,
    spitEvery: [200, 260, 220],
    hurtBy: { 1: ['pop'], 2: ['pop'], 3: ['pop'] },
    specials: { 1: [], 2: [], 3: [] },
    phases: {
      2: { text: 'IT WEDGES IN!', sub: 'WATCH FOR THE CREAK' },
      3: { text: 'IT FIZZES!', sub: 'FLOAT BUBBLES TAKE YOU UP' },
    },
  },
  kettle: {
    name: 'THE KETTLE COLOSSUS',
    r: 20,
    hpPerPhase: 3,
    prize: 50_000,
    minion: 'grumbler',
    maxMinions: 3,
    popReach: 44,
    spitEvery: [230, 400, 400],
    hurtBy: { 1: ['pop'], 2: ['wave'], 3: ['zap'] },
    specials: { 1: [], 2: ['splash'], 3: ['zap'] },
    phases: {
      2: { text: 'IT POURS!', sub: 'RIDE A SPLASH WAVE INTO IT' },
      3: { text: 'IT SPINS!', sub: 'ZAP BUBBLES STUN IT' },
    },
  },
  jelly: {
    name: 'THE JELLY MOULD',
    r: 22,
    hpPerPhase: 2,
    prize: 75_000,
    minion: 'jellet',
    maxMinions: 8,
    popReach: 40,
    spitEvery: [220, 320, 320],
    hurtBy: { 1: ['pop'], 2: ['pop'], 3: ['pop'] },
    specials: { 1: [], 2: [], 3: [] },
    phases: {
      2: { text: 'IT SPLITS!', sub: 'POP THE JELLIES AGAINST IT' },
      3: { text: 'IT SPLITS AGAIN!', sub: 'POP THEM BEFORE THEY RE-FORM' },
    },
  },
  king: {
    name: 'THE GRUMBLE FIZZ KING',
    r: 24,
    hpPerPhase: 3,
    prize: 150_000,
    minion: 'waddler',
    maxMinions: 3,
    popReach: 46,
    spitEvery: [260, 420, 99_999],
    hurtBy: {
      1: ['zap', 'pop'],
      2: ['zap', 'pop'],
      3: ['zap', 'pop'],
    },
    specials: { 1: ['zap'], 2: ['zap'], 3: ['zap'] },
    phases: {
      2: { text: 'HE SHAKES!', sub: 'CLIMB AHEAD OF THE FIZZ' },
      3: { text: 'HIS CAP POPS OFF!', sub: 'HE IS TINY AND CHEERFUL' },
    },
  },
}

/** Kept for slice 2's callers: the Big Cork's numbers. */
export const CORK = {
  ...BOSSES.cork,
  speed: 1.0,
  fizzSpeed: 2.0,
  creakTicks: 45,
} as const

export const KETTLE = {
  idleTicks: 120,
  rattleTicks: 50,
  blastTicks: 60,
  blastHalf: 18,
  /** How high the scalding flood stands (px above the floor line). */
  floodHeight: 34,
  floodRise: 0.3,
  spinSpeed: 2.4,
  stunTicks: 70,
} as const

export const JELLY = {
  /** Its radius in each phase: it shrinks as it splits. */
  radii: [22, 17, 12],
  speed: 0.5,
  /** Ticks without a hit before little jellies start sliding back together. */
  reform: 900,
} as const

export const KING = {
  throwEvery: 120,
  tell: 30,
  fan: 5,
  capSpeed: 1.9,
  floodMax: 120,
  floodMin: 30,
  floodRise: 0.12,
  floodDrain: 0.3,
  tinyRadius: 8,
  tinySpeed: 1.3,
} as const

export type Boss = {
  id: BossId
  name: string
  x: number
  y: number
  vx: number
  vy: number
  r: number
  hp: number
  phase: Phase
  state: BossState
  /** Ticks in this state. */
  t: number
  /** Flashing after a hit (it can't be hurt again until this runs out). */
  hurt: number
  /** Ticks until the next minion. */
  spit: number
  /** Where a slam is headed, or where the steam blasts. */
  target: number
  /** The Kettle's flood, in px above the floor line. */
  flood: number
  /** Ticks since it was last hurt (little jellies re-form while it is calm). */
  calm: number
}

export function makeBoss(id: BossId): Boss {
  const spec = BOSSES[id]
  return {
    id,
    name: spec.name,
    x: (WALL_L + WALL_R) / 2,
    y: TOP - 30,
    vx: id === 'cork' ? CORK.speed : 0,
    vy: id === 'cork' ? CORK.speed : 0,
    r: spec.r,
    hp: spec.hpPerPhase,
    phase: 1,
    state: 'enter',
    t: 0,
    hurt: 0,
    spit: 120,
    target: 0,
    flood: 0,
    calm: 0,
  }
}

/** What a boss can see and do. */
export interface BossHost {
  floor: Floor
  rng: () => number
  robots: readonly Spot[]
  /** Minions on the floor now. */
  minions: number
  /** Spit a minion out at `at`, flung `dir`-ward. */
  spawnMinion(at: Spot, dir: -1 | 1, kind: GrumpKind): void
  /** Something worth a sound, a shake or a banner. */
  cue(what: 'creak' | 'slam' | 'phase' | 'spit' | 'rattle' | 'blast'): void
  /** A bottle cap thrown from (x, y) with this velocity. */
  cap?(x: number, y: number, vx: number, vy: number): void
}

export function bossAlive(b: Boss): boolean {
  return b.state !== 'done' && b.state !== 'popping'
}

/** Does touching it bonk a robot? (The King, shrunk to a cheerful soda bot, is harmless.) */
export function bossHarms(b: Boss): boolean {
  return bossAlive(b) && !(b.id === 'king' && b.phase === 3)
}

/** Is (x, y) within `pad` of the boss's body? */
export function bossTouches(b: Boss, x: number, y: number, pad = 0): boolean {
  return bossAlive(b) && Math.hypot(x - b.x, y - b.y) < b.r + pad
}

/** Can this kind of hit hurt the boss in its current phase? */
export function bossCanBeHurt(b: Boss, kind: HurtKind): boolean {
  return BOSSES[b.id].hurtBy[b.phase].includes(kind)
}

/** The special bubbles that drift in while the boss is in this phase. */
export function bossSpecials(b: Boss): readonly SpecialKind[] {
  return bossAlive(b) ? BOSSES[b.id].specials[b.phase] : []
}

export type Rect = { x0: number; y0: number; x1: number; y1: number }

/** What scalds: the Kettle's steam column, and its flood. */
export function bossHazards(b: Boss): Rect[] {
  const out: Rect[] = []
  if (!bossAlive(b)) return out
  if (b.state === 'blast')
    out.push({
      x0: b.target - KETTLE.blastHalf,
      x1: b.target + KETTLE.blastHalf,
      y0: TOP + TILE,
      y1: FLOOR_Y,
    })
  if (b.flood > 2)
    out.push({ x0: WALL_L, x1: WALL_R, y0: FLOOR_Y - b.flood, y1: FLOOR_Y + 1 })
  return out
}

/** A hit: true if it landed (a boss flashing from the last hit shrugs this one off). */
export function hurtBoss(b: Boss, host: BossHost): boolean {
  if (b.hurt > 0 || b.state === 'enter' || !bossAlive(b)) return false
  const spec = BOSSES[b.id]
  b.hurt = 50
  b.calm = 0
  b.hp--
  if (b.hp > 0) return true
  if (b.id === 'jelly') splitJelly(b, host, b.phase === 3 ? 8 : b.phase * 2)
  if (b.phase === 3) {
    b.state = 'popping'
    b.t = 0
    return true
  }
  b.phase = (b.phase + 1) as 2 | 3
  b.hp = b.id === 'king' && b.phase === 3 ? 1 : spec.hpPerPhase
  b.t = 0
  if (b.id === 'jelly') {
    b.r = JELLY.radii[b.phase - 1]!
    b.state = 'wobble'
  } else if (b.id === 'king') {
    b.state = b.phase === 2 ? 'shake' : 'tiny'
    if (b.phase === 3) {
      b.r = KING.tinyRadius
      b.vx = KING.tinySpeed
      b.vy = 0
    }
  } else if (b.id === 'cork') {
    b.state = b.phase === 2 ? 'climb' : 'fizz'
    b.vx = Math.sign(b.vx || 1) * CORK.fizzSpeed
    b.vy = -CORK.fizzSpeed
  } else {
    b.state = b.phase === 2 ? 'pour' : 'spin'
    b.vx = KETTLE.spinSpeed
  }
  host.cue('phase')
  return true
}

/** The jelly splits: `n` little jellies burst out of it. */
function splitJelly(b: Boss, host: BossHost, n: number) {
  for (let i = 0; i < n; i++)
    host.spawnMinion(
      { x: b.x + (i - n / 2) * 5, y: b.y },
      i % 2 ? -1 : 1,
      'jellet',
    )
}

/** A Zap bolt stuns the Kettle where it spins. */
export function stunBoss(b: Boss) {
  if (b.id === 'kettle' && b.state === 'spin') {
    b.state = 'stunned'
    b.t = 0
  }
}

function nearestX(b: Boss, robots: readonly Spot[]): number {
  let best = (WALL_L + WALL_R) / 2
  let d = Infinity
  for (const r of robots) {
    if (Math.abs(r.x - b.x) < d) {
      d = Math.abs(r.x - b.x)
      best = r.x
    }
  }
  return best
}

/** Bounce round a box, off its walls. */
function bounce(b: Boss, top: number, bottom: number) {
  b.x += b.vx
  b.y += b.vy
  if (b.x < WALL_L + b.r) {
    b.x = WALL_L + b.r
    b.vx = Math.abs(b.vx)
  } else if (b.x > WALL_R - b.r) {
    b.x = WALL_R - b.r
    b.vx = -Math.abs(b.vx)
  }
  if (b.y < top + b.r) {
    b.y = top + b.r
    b.vy = Math.abs(b.vy)
  } else if (b.y > bottom - b.r) {
    b.y = bottom - b.r
    b.vy = -Math.abs(b.vy)
  }
}

/** One tick of a boss. */
export function updateBoss(b: Boss, host: BossHost) {
  b.t++
  if (b.hurt > 0) b.hurt--
  if (b.state === 'done') return
  if (b.state === 'popping') {
    b.flood = Math.max(0, b.flood - 1)
    if (b.t > 90) b.state = 'done'
    return
  }
  const spec = BOSSES[b.id]
  if (b.state === 'enter') {
    // It drops in through the ceiling.
    b.y += 1.4
    const onFloor = b.id !== 'cork'
    const rest = onFloor ? FLOOR_Y - b.r : TOP + TILE + b.r + 30
    if (b.y >= rest) {
      b.y = rest
      b.state =
        b.id === 'kettle'
          ? 'idle'
          : b.id === 'jelly'
            ? 'wobble'
            : b.id === 'king'
              ? 'throw'
              : 'bounce'
      b.t = 0
      if (onFloor) host.cue('slam')
      if (b.id === 'jelly') b.vx = JELLY.speed
    }
    return
  }
  // Minions, while there's room for them.
  if (--b.spit <= 0) {
    b.spit = spec.spitEvery[b.phase - 1]!
    if (host.minions < spec.maxMinions && b.state !== 'slam') {
      const dir = (b.vx < 0 ? -1 : b.vx > 0 ? 1 : host.rng() < 0.5 ? -1 : 1) as
        | -1
        | 1
      // The Big Cork spits from underneath; the Kettle's minions climb out of its lid.
      const y = b.id === 'cork' ? b.y + b.r - 2 : b.y - b.r
      host.spawnMinion({ x: b.x, y }, dir, spec.minion)
      host.cue('spit')
    }
  }
  if (b.id === 'cork') updateCork(b, host)
  else if (b.id === 'kettle') updateKettle(b, host)
  else if (b.id === 'jelly') updateJelly(b, host)
  else updateKing(b, host)
}

function updateJelly(b: Boss, host: BossHost) {
  b.calm++
  // It wobbles slowly back and forth along the floor.
  b.x += b.vx
  if (b.x < WALL_L + b.r) {
    b.x = WALL_L + b.r
    b.vx = Math.abs(b.vx)
  } else if (b.x > WALL_R - b.r) {
    b.x = WALL_R - b.r
    b.vx = -Math.abs(b.vx)
  }
  b.y = FLOOR_Y - b.r
  // Left alone, the pieces slide back together and it heals a chunk.
  if (
    b.phase > 1 &&
    host.minions > 0 &&
    b.calm >= JELLY.reform &&
    b.calm % 450 === 0
  ) {
    b.hp = Math.min(BOSSES.jelly.hpPerPhase, b.hp + 1)
    host.cue('rattle')
  }
}

function updateKing(b: Boss, host: BossHost) {
  if (b.phase === 3) {
    // Tiny and cheerful: hopping about, the flood draining away.
    b.flood = Math.max(0, b.flood - 0.6)
    b.x += b.vx
    if (b.x < WALL_L + b.r) {
      b.x = WALL_L + b.r
      b.vx = Math.abs(b.vx)
    } else if (b.x > WALL_R - b.r) {
      b.x = WALL_R - b.r
      b.vx = -Math.abs(b.vx)
    }
    b.vy += 0.15
    b.y += b.vy
    if (b.y >= FLOOR_Y - b.r) {
      b.y = FLOOR_Y - b.r
      b.vy = -3.2
    }
    return
  }
  b.y = FLOOR_Y - b.r
  if (b.phase === 2) {
    // The fizz rises to its line, then drains a little, over and over.
    if (b.target === 0) {
      b.flood = Math.min(KING.floodMax, b.flood + KING.floodRise)
      if (b.flood >= KING.floodMax) b.target = 1
    } else {
      b.flood = Math.max(KING.floodMin, b.flood - KING.floodDrain)
      if (b.flood <= KING.floodMin) b.target = 0
    }
  }
  // Caps thrown in a fan at the nearest robot: a wider fan and slower beat when he is shaken up.
  const every = b.phase === 1 ? KING.throwEvery : KING.throwEvery * 1.6
  if (b.t % every === every - KING.tell) host.cue('rattle')
  if (b.t % every === 0 && host.cap) {
    const tx = nearestX(b, host.robots)
    const aim = Math.atan2(FLOOR_Y - 40 - (b.y - b.r), tx - b.x)
    const n = b.phase === 1 ? KING.fan : 3
    for (let i = 0; i < n; i++) {
      const a = aim + (i - (n - 1) / 2) * 0.4
      host.cap(
        b.x,
        b.y - b.r * 0.4,
        Math.cos(a) * KING.capSpeed,
        Math.sin(a) * KING.capSpeed,
      )
    }
    host.cue('spit')
  }
}

function updateCork(b: Boss, host: BossHost) {
  const ceiling = TOP + TILE
  if (b.state === 'bounce') {
    bounce(b, ceiling, FLOOR_Y)
    return
  }
  if (b.state === 'fizz') {
    // Double speed, round the top half of the room.
    bounce(b, ceiling, TOP + 120)
    return
  }
  if (b.state === 'climb') {
    // Up to the ceiling, over a robot.
    const tx = nearestX(b, host.robots)
    b.x += Math.max(-1.5, Math.min(1.5, tx - b.x))
    b.y = Math.max(ceiling + b.r, b.y - 1.5)
    if (b.y <= ceiling + b.r && Math.abs(tx - b.x) < 2) {
      b.state = 'creak'
      b.t = 0
      host.cue('creak')
    }
    return
  }
  if (b.state === 'creak') {
    if (b.t >= CORK.creakTicks) {
      b.state = 'slam'
      b.t = 0
      b.vy = 0
      b.target = groundBelow(host.floor, b.x, b.y + b.r + 40, b.r - 4)
    }
    return
  }
  // Slam: down onto the platform below, then back up for another.
  b.vy = Math.min(5, b.vy + 0.35)
  b.y += b.vy
  if (b.y + b.r >= b.target) {
    b.y = b.target - b.r
    host.cue('slam')
    b.state = 'climb'
    b.t = 0
  }
}

function updateKettle(b: Boss, host: BossHost) {
  if (b.phase === 1) {
    if (b.state === 'idle' && b.t >= KETTLE.idleTicks) {
      b.state = 'rattle'
      b.t = 0
      b.target = nearestX(b, host.robots)
      host.cue('rattle')
    } else if (b.state === 'rattle' && b.t >= KETTLE.rattleTicks) {
      b.state = 'blast'
      b.t = 0
      host.cue('blast')
    } else if (b.state === 'blast' && b.t >= KETTLE.blastTicks) {
      b.state = 'idle'
      b.t = 0
    }
    return
  }
  if (b.phase === 2) {
    // Pouring: the scalding flood rises to its line and stays while it pours.
    b.flood = Math.min(KETTLE.floodHeight, b.flood + KETTLE.floodRise)
    return
  }
  // Phase 3: the flood drains, and it spins whistling along the floor.
  b.flood = Math.max(0, b.flood - 0.5)
  if (b.state === 'stunned') {
    if (b.t >= KETTLE.stunTicks) {
      b.state = 'spin'
      b.t = 0
    }
    return
  }
  b.x += b.vx
  if (b.x < WALL_L + b.r) {
    b.x = WALL_L + b.r
    b.vx = Math.abs(b.vx)
  } else if (b.x > WALL_R - b.r) {
    b.x = WALL_R - b.r
    b.vx = -Math.abs(b.vx)
  }
  // Great whistling hops, up into reach of a bolt.
  b.vy += 0.12
  b.y += b.vy
  if (b.y >= FLOOR_Y - b.r) {
    b.y = FLOOR_Y - b.r
    b.vy = -3.6
  }
}
