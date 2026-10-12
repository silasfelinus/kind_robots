// /utils/arcade/rescueRally/bosses.ts
//
// Rescue Rally's district bosses (conductor kr-arcade t-036, depth-pass/CABINETS.md section 1, "The
// bosses"). Each closes its district as wave 8. Its rules live here, through the small BossWorld the
// game hands it; its art lives in bossArt.ts. Every boss shows a move before it makes it, and none is
// ever hurt: a beaten boss winds down, or sits back in its box, and reboots as a friend.
//
// - The Big Wind-Up (Neon Plaza): a giant tin robot with a key in its back. Phase 1 it walks the
//   arena stomping shockwave rings (the floor cracks first). Phase 2 its key spins faster and little
//   wind-ups pour from its hatch. Phase 3 it staggers, and only beams on its key wind it down.
// - The Jack-in-the-Box (Toy Factory): a box that pops up where its shadow falls. Phase 1 its spring
//   head lunges along a line it shows first. Phase 2 the lid fires confetti fans between lunges.
//   Phase 3 it rolls like a die, and the face that lands up picks its next attack.
// - Overgrowth, the Static Twins and the Glitch Core (districts 3-5) are in bossesLate.ts.

import { levelCurve } from '../curve'
import type { ArcadeSoundName } from '../sound'
import { ARENA, CX, CY, clampToArena, dist, toward } from './arena'
import type { Point } from './arena'
import type { FoeKind, Quarry } from './roster'
import { segmentDistance } from './floors'
import {
  LINK_APART,
  PETALS,
  PETAL_HP,
  petalSpot,
  stepCore,
  stepOvergrowth,
  stepTwins,
  stepWhips,
  whipLive,
  WHIP_REACH,
} from './bossesLate'

export type BossKind = 'windup' | 'jack' | 'overgrowth' | 'twins' | 'core'

export type BossSpec = {
  name: string
  /** Beam hits to clear each phase. */
  hp: readonly number[]
  points: number
  radius: number
}

export const BOSSES: Record<BossKind, BossSpec> = {
  windup: {
    name: 'THE BIG WIND-UP',
    hp: [70, 60, 46],
    points: 25_000,
    radius: 20,
  },
  jack: {
    name: 'THE JACK-IN-THE-BOX',
    hp: [56, 56, 64],
    points: 30_000,
    radius: 16,
  },
  overgrowth: {
    name: 'OVERGROWTH',
    hp: [PETALS * PETAL_HP, 60, 60],
    points: 35_000,
    radius: 18,
  },
  twins: {
    name: 'THE STATIC TWINS',
    hp: [36, 76, 48],
    points: 40_000,
    radius: 12,
  },
  core: {
    name: 'THE GLITCH CORE',
    hp: [50, 40, 64],
    points: 60_000,
    radius: 14,
  },
}

/** A root whip: its line, and ticks left (it shows first, then lashes). */
export type Whip = {
  x0: number
  y0: number
  x1: number
  y1: number
  clock: number
}
/** One of the Static Twins. */
export type Twin = { x: number; y: number; hp: number; clock: number }

/**
 * A stomp's shockwave: a ring spreading over the floor, broken by gaps (angles, radians) the hero can
 * slip through. The floor cracks everywhere but the gaps first, so the safe lanes show.
 */
export type Shock = {
  x: number
  y: number
  r: number
  max: number
  gaps: number[]
}
/** Half the width of a gap in a shockwave (radians). */
export const SHOCK_GAP = 0.32

/** True when an angle lies in one of a shockwave's gaps. */
export function inGap(gaps: readonly number[], angle: number, slack = 0) {
  return gaps.some((g) => {
    const d = Math.atan2(Math.sin(angle - g), Math.cos(angle - g))
    return Math.abs(d) < SHOCK_GAP + slack
  })
}

export type Boss = {
  kind: BossKind
  x: number
  y: number
  vx: number
  vy: number
  /** 0, 1 or 2. */
  phase: number
  hp: number
  mode: string
  clock: number
  timer: number
  seed: number
  /** Ticks of hit flash left. */
  flash: number
  /** Down: winding down / sitting back in its box, then gone. */
  down: number
  shocks: Shock[]
  /** The Jack's next spot (its shadow), lunge line, head reach and die face. */
  next: Point | null
  aim: Point
  reach: number
  face: number
  /** Attacks left before the box hides again. */
  left: number
  /** The safe lanes of the Big Wind-Up's next stomp. */
  gaps: number[]
  /** Overgrowth's petals (hits left on each) and every root whip on the floor. */
  petals: number[]
  whips: Whip[]
  /** The Static Twins. */
  twins: Twin[]
  /** The Glitch Core's four shield gaps (angles), whether it is shut tight, and its next echo. */
  rings: number[]
  guard: boolean
  echo: number
}

export type BossWorld = {
  rng: () => number
  heat: number
  hero(from: Point): Quarry | null
  /** A shot from the boss (confetti for the Jack). */
  fire(x: number, y: number, vx: number, vy: number): void
  hatch(kind: FoeKind, at: Point): void
  /** How many of a kind are about (so a hatch never floods the arena). */
  count(kind: FoeKind): number
  /** The Glitch Core glitches every rescuee in the arena at once. */
  glitchAll(): void
  sound(name: ArcadeSoundName): void
}

/** The Big Wind-Up's stomp shows its cracks this long first. */
export const CRACK_TELL = 54
/** A shockwave hurts within this many px of its ring. */
export const SHOCK_BAND = 5
/** The Jack's lunge line shows this long before the head flies. */
export const LUNGE_TELL = 40
/** Its shadow shows this long before the box pops up there. */
export const SHADOW_TELL = 50
export const LUNGE_REACH = 170
export const DOWN_TICKS = 150

const JACK_STATIONS: readonly Point[] = [
  { x: ARENA.left + 60, y: ARENA.top + 60 },
  { x: ARENA.right - 60, y: ARENA.top + 60 },
  { x: ARENA.right - 60, y: ARENA.bottom - 60 },
  { x: ARENA.left + 60, y: ARENA.bottom - 60 },
  { x: CX, y: ARENA.top + 70 },
]

export function newBoss(kind: BossKind, at: Point, rng: () => number): Boss {
  return {
    kind,
    x: at.x,
    y: at.y,
    vx: 0,
    vy: 0,
    phase: 0,
    hp: BOSSES[kind].hp[0]!,
    mode: kind === 'jack' ? 'hide' : 'walk',
    clock: kind === 'jack' ? SHADOW_TELL + 30 : 90,
    timer: 0,
    seed: rng() * 100,
    flash: 0,
    down: 0,
    shocks: [],
    next: kind === 'jack' ? { x: at.x, y: at.y } : null,
    aim: { x: 0, y: 1 },
    reach: 0,
    face: 1,
    left: 0,
    gaps: [],
    petals: kind === 'overgrowth' ? Array(PETALS).fill(PETAL_HP) : [],
    whips: [],
    twins:
      kind === 'twins'
        ? [
            { x: at.x - 40, y: at.y, hp: 38, clock: 0 },
            { x: at.x + 40, y: at.y, hp: 38, clock: 35 },
          ]
        : [],
    rings: kind === 'core' ? [0] : [],
    guard: false,
    echo: 0,
  }
}

/** Where a beam can reach the boss: its spots, and whether each hurts (the rest just clank). */
export type BossTarget = {
  id: string
  x: number
  y: number
  r: number
  hurts: boolean
}

export function bossTargets(b: Boss): BossTarget[] {
  if (b.down) return []
  switch (b.kind) {
    case 'windup': {
      const key = {
        id: 'key',
        x: b.x,
        y: b.y - 52,
        r: 10,
        hurts: b.phase === 2,
      }
      const body = {
        id: 'body',
        x: b.x,
        y: b.y - 16,
        r: 22,
        hurts: b.phase < 2,
      }
      return [key, body]
    }
    case 'jack': {
      if (b.mode === 'hide') return []
      const spots = [{ id: 'box', x: b.x, y: b.y - 6, r: 17, hurts: true }]
      if (b.reach > 12) {
        const head = jackHead(b)
        spots.push({ id: 'head', x: head.x, y: head.y, r: 10, hurts: true })
      }
      return spots
    }
    case 'overgrowth': {
      const core = {
        id: 'core',
        x: b.x,
        y: b.y - 18,
        r: 13,
        hurts: b.phase > 0,
      }
      if (b.phase > 0) return [core]
      const petals = b.petals
        .map((hp, k) => ({ hp, k }))
        .filter((p) => p.hp > 0)
        .map(({ k }) => ({
          id: `p${k}`,
          ...petalSpot(b, k),
          r: 8,
          hurts: true,
        }))
      return [...petals, core]
    }
    case 'twins': {
      const bodies = b.twins
        .map((t, i) => ({ t, i }))
        .filter(({ t }) => t.hp > 0)
        .map(({ t, i }) => ({
          id: `t${i}`,
          x: t.x,
          y: t.y,
          r: 12,
          hurts: b.phase > 0,
        }))
      if (b.phase > 0) return bodies
      const [t0, t1] = b.twins
      const apart = dist(t0!, t1!)
      const mid = {
        id: 'link',
        x: (t0!.x + t1!.x) / 2,
        y: (t0!.y + t1!.y) / 2,
        r: 10,
        hurts: apart >= LINK_APART,
      }
      return [mid, ...bodies]
    }
    case 'core':
      return [
        {
          id: 'core',
          x: b.x,
          y: b.y,
          r: 14,
          hurts: !(b.phase === 1 && b.guard),
        },
      ]
  }
}

/** The Jack's spring head, out along its lunge line. */
export function jackHead(b: Boss): Point {
  return { x: b.x + b.aim.x * b.reach, y: b.y - 14 + b.aim.y * b.reach }
}

/** A beam hit that hurts: the boss loses a hit; 'phase' when a phase ends, 'down' when beaten. */
export function hurtBoss(b: Boss, id = ''): 'hit' | 'phase' | 'down' {
  b.flash = 6
  if (b.kind === 'overgrowth' && b.phase === 0) {
    // A petal turret takes the hit; the phase ends when the last one breaks.
    const k = Number(id.slice(1))
    if (b.petals[k]! > 0) b.petals[k]!--
    b.hp = b.petals.reduce((a, v) => a + v, 0)
    if (b.hp > 0) return 'hit'
  } else if (b.kind === 'twins' && b.phase > 0) {
    const i = Number(id.slice(1))
    const t = b.twins[i]!
    t.hp = Math.max(0, t.hp - 1)
    b.hp = b.twins.reduce((a, v) => a + v.hp, 0)
    if (b.phase === 1 && t.hp === 0) {
      // One twin down: the other enrages.
      const other = b.twins[1 - i]!
      other.hp += 10
      b.phase = 2
      b.hp = other.hp
      return 'phase'
    }
    if (b.hp > 0) return 'hit'
    b.down = DOWN_TICKS
    b.whips = []
    return 'down'
  } else if (--b.hp > 0) return 'hit'
  const hp = BOSSES[b.kind].hp
  if (b.phase + 1 < hp.length) {
    b.phase++
    b.hp = hp[b.phase]!
    if (b.kind === 'twins') b.hp = b.twins.reduce((a, v) => a + v.hp, 0)
    if (b.kind === 'core' && b.phase === 2) b.mode = 'chase'
    b.mode = b.kind === 'jack' && b.phase === 2 ? 'roll' : b.mode
    if (b.kind === 'jack' && b.phase === 2) {
      b.clock = 150
      b.reach = 0
      if (b.mode === 'roll') {
        b.vx = 1.8
        b.vy = 1.4
      }
    }
    return 'phase'
  }
  b.down = DOWN_TICKS
  b.shocks = []
  b.whips = []
  b.reach = 0
  return 'down'
}

/** The boss (or its shockwaves) touches a circle at p of radius r. */
export function bossHarms(b: Boss, p: Point, r: number): boolean {
  if (b.down) return false
  for (const s of b.shocks) {
    const d = dist(s, p)
    if (s.r > 8 && Math.abs(d - s.r) < SHOCK_BAND + r * 0.5) {
      // Anyone even half in a gap slips through.
      const slack = r / Math.max(d, 1)
      if (!inGap(s.gaps, Math.atan2(p.y - s.y, p.x - s.x), slack)) return true
    }
  }
  for (const wp of b.whips) {
    if (
      whipLive(wp) &&
      segmentDistance(p, wp.x0, wp.y0, wp.x1, wp.y1) < WHIP_REACH + r * 0.5
    )
      return true
  }
  switch (b.kind) {
    case 'overgrowth':
      return dist({ x: b.x, y: b.y - 12 }, p) < BOSSES.overgrowth.radius + r - 2
    case 'twins': {
      const live = b.twins.filter((t) => t.hp > 0)
      if (live.some((t) => dist(t, p) < 11 + r - 2)) return true
      const [t0, t1] = b.twins
      return (
        b.phase === 0 &&
        segmentDistance(p, t0!.x, t0!.y, t1!.x, t1!.y) < 4 + r * 0.5
      )
    }
    case 'core':
      return dist(b, p) < BOSSES.core.radius + r - 2
    case 'windup':
      return dist({ x: b.x, y: b.y - 12 }, p) < BOSSES.windup.radius + r - 2
    case 'jack': {
      if (b.mode === 'hide') return false
      if (dist({ x: b.x, y: b.y - 6 }, p) < BOSSES.jack.radius + r - 2)
        return true
      return b.reach > 12 && dist(jackHead(b), p) < 9 + r - 2
    }
  }
}

/** A shockwave ring passing over a point this tick (for knocking the family dizzy). */
export function shockAt(b: Boss, p: Point): boolean {
  return b.shocks.some(
    (s) =>
      s.r > 8 &&
      Math.abs(dist(s, p) - s.r) < SHOCK_BAND &&
      !inGap(s.gaps, Math.atan2(p.y - s.y, p.x - s.x)),
  )
}

export function stepBoss(b: Boss, w: BossWorld) {
  b.timer++
  if (b.flash > 0) b.flash--
  for (const s of b.shocks) s.r += 2
  b.shocks = b.shocks.filter((s) => s.r < s.max)
  if (b.down) {
    b.down--
    return
  }
  stepWhips(b)
  const hero = w.hero(b)
  switch (b.kind) {
    case 'windup':
      stepWindup(b, w)
      break
    case 'jack':
      stepJack(b, w)
      break
    case 'overgrowth':
      stepOvergrowth(b, w, hero)
      break
    case 'twins':
      stepTwins(b, w, hero)
      break
    case 'core':
      if (b.phase === 1 && b.mode !== 'shut') {
        // Phase 2 opens with every rescuee in the arena glitched at once.
        b.mode = 'shut'
        w.glitchAll()
      }
      stepCore(b, w, hero)
      break
  }
}

// --- the Big Wind-Up -------------------------------------------------------------------------------

function stepWindup(b: Boss, w: BossWorld) {
  const hero = w.hero(b)
  const speed = levelCurve(w.heat, { start: 0.5, step: 0.01, limit: 0.85 })
  b.clock--
  switch (b.mode) {
    case 'walk': {
      // Stomp, stomp: it walks at the hero in beats; staggering, it lurches about at random.
      const goal: Point =
        b.phase === 2
          ? {
              x: CX + Math.cos(b.timer / 70 + b.seed) * 150,
              y: CY + Math.sin(b.timer / 53 + b.seed) * 90,
            }
          : (hero ?? { x: CX, y: CY })
      const u = toward(b, goal)
      const beat = b.timer % 24 < 14 ? 1.3 : 0.3
      const lurch = b.phase === 2 ? 1.2 + Math.sin(b.timer / 7) * 0.8 : 1
      b.vx = b.vx * 0.9 + u.x * speed * 0.1
      b.vy = b.vy * 0.9 + u.y * speed * 0.1
      b.x += b.vx * beat * lurch
      b.y += b.vy * beat * lurch
      // Phase 2: the hatch drops little wind-ups as it goes.
      if (b.phase === 1 && b.timer % 80 === 0 && w.count('windup') < 8) {
        w.hatch('windup', { x: b.x - 10, y: b.y + 10 })
        w.hatch('windup', { x: b.x + 10, y: b.y + 10 })
        w.sound('warn')
      }
      if (b.clock <= 0) {
        b.mode = 'crack'
        b.clock = CRACK_TELL
        // Four safe lanes, rolled now so the cracks can show them.
        const turn = w.rng() * Math.PI * 2
        b.gaps = [0, 1, 2, 3].map((k) => turn + (k * Math.PI) / 2)
      }
      break
    }
    case 'crack':
      // Foot raised, the floor cracking out from under it: the tell.
      if (b.clock <= 0) {
        b.shocks.push({
          x: b.x,
          y: b.y + 8,
          r: 6,
          max: b.phase === 2 ? 130 : 200,
          gaps: b.gaps,
        })
        w.sound('boom')
        b.mode = 'walk'
        b.clock = b.phase === 0 ? 150 : b.phase === 1 ? 190 : 220
      }
      break
  }
  b.x = Math.min(ARENA.right - 26, Math.max(ARENA.left + 26, b.x))
  b.y = Math.min(ARENA.bottom - 16, Math.max(ARENA.top + 48, b.y))
}

// --- the Jack-in-the-Box ---------------------------------------------------------------------------

function stepJack(b: Boss, w: BossWorld) {
  const hero = w.hero(b)
  b.clock--
  switch (b.mode) {
    case 'hide': {
      // Gone, with its shadow growing where it will pop up.
      if (b.clock <= 0 && b.next) {
        b.x = b.next.x
        b.y = b.next.y
        b.next = null
        b.mode = 'pop'
        b.clock = 22
        w.sound('pop')
      }
      break
    }
    case 'pop':
      if (b.clock <= 0) {
        b.left = b.phase === 0 ? 2 : 3
        startAttack(b, w, hero, b.phase === 1 ? 'lunge-or-fan' : 'lunge')
      }
      break
    case 'aim':
      // The lunge line shows; the head flies when it runs out.
      if (b.clock <= 0) {
        b.mode = 'lunge'
        w.sound('shoot')
      }
      break
    case 'lunge':
      b.reach += 7
      if (b.reach >= LUNGE_REACH) b.mode = 'back'
      break
    case 'back':
      b.reach = Math.max(0, b.reach - 4)
      if (b.reach === 0) nextAttack(b, w, hero)
      break
    case 'fan':
      if (b.clock % 22 === 0 && hero) {
        const a = Math.atan2(hero.y - b.y, hero.x - b.x)
        for (let k = -3; k <= 3; k++) {
          const t = a + k * 0.2
          w.fire(b.x, b.y - 18, Math.cos(t) * 2.2, Math.sin(t) * 2.2)
        }
        w.sound('pop')
      }
      if (b.clock <= 0) nextAttack(b, w, hero)
      break
    case 'ring':
      if (b.clock === 20) {
        for (let k = 0; k < 16; k++) {
          const t = (k / 16) * Math.PI * 2
          w.fire(b.x, b.y - 8, Math.cos(t) * 2, Math.sin(t) * 2)
        }
        w.sound('boom')
      }
      if (b.clock <= 0) nextAttack(b, w, hero)
      break
    case 'hatch':
      if (b.clock === 20) {
        for (let k = 0; k < 3 && w.count('drone') < 12; k++)
          w.hatch('drone', { x: b.x + (k - 1) * 14, y: b.y + 18 })
        w.sound('warn')
      }
      if (b.clock <= 0) nextAttack(b, w, hero)
      break
    case 'close':
      if (b.clock <= 0) {
        b.mode = 'hide'
        b.clock = SHADOW_TELL
        const options = JACK_STATIONS.filter((s) => dist(s, b) > 40)
        b.next = options[Math.floor(w.rng() * options.length)]!
      }
      break
    case 'roll': {
      // Tumbling like a die, the face on top turning over as it goes.
      b.x += b.vx
      b.y += b.vy
      if (b.x < ARENA.left + 22 || b.x > ARENA.right - 22) b.vx *= -1
      if (b.y < ARENA.top + 30 || b.y > ARENA.bottom - 20) b.vy *= -1
      if (b.timer % 8 === 0) b.face = 1 + Math.floor(w.rng() * 6)
      if (b.clock <= 0) {
        b.mode = 'land'
        b.clock = 36
        b.face = 1 + Math.floor(w.rng() * 6)
        w.sound('blip')
      }
      break
    }
    case 'land':
      // The face is up: its pips say what comes next.
      if (b.clock <= 0) {
        b.left = 1
        const f = b.face
        startAttack(
          b,
          w,
          hero,
          f <= 2 ? 'lunge' : f <= 4 ? 'fan' : f === 5 ? 'hatch' : 'ring',
        )
      }
      break
  }
  const p = { x: b.x, y: b.y }
  clampToArena(p, 22)
  b.x = p.x
  b.y = Math.max(ARENA.top + 30, p.y)
}

function startAttack(
  b: Boss,
  w: BossWorld,
  hero: Quarry | null,
  kind: 'lunge' | 'fan' | 'lunge-or-fan' | 'hatch' | 'ring',
) {
  const pick =
    kind === 'lunge-or-fan' ? (b.left % 2 === 1 ? 'fan' : 'lunge') : kind
  if (pick === 'lunge') {
    b.aim = hero ? toward({ x: b.x, y: b.y - 14 }, hero) : { x: 0, y: 1 }
    b.mode = 'aim'
    b.clock = LUNGE_TELL
    w.sound('warn')
  } else if (pick === 'fan') {
    b.mode = 'fan'
    b.clock = 70
  } else if (pick === 'hatch') {
    b.mode = 'hatch'
    b.clock = 50
  } else {
    b.mode = 'ring'
    b.clock = 50
  }
}

function nextAttack(b: Boss, w: BossWorld, hero: Quarry | null) {
  b.reach = 0
  if (b.phase === 2) {
    b.mode = 'roll'
    b.clock = 110 + Math.floor(w.rng() * 60)
    const a = w.rng() * Math.PI * 2
    const speed = 1.6 + w.rng() * 0.6
    b.vx = Math.cos(a) * speed
    b.vy = Math.sin(a) * speed
    return
  }
  if (--b.left > 0) {
    startAttack(b, w, hero, b.phase === 1 ? 'lunge-or-fan' : 'lunge')
    return
  }
  b.mode = 'close'
  b.clock = 16
}
