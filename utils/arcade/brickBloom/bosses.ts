// /utils/arcade/brickBloom/bosses.ts
//
// Brick Bloom's glasshouse bosses (conductor kr-arcade/t-079 and t-080, depth-pass CABINETS.md
// section 11, slices 2 and 3), as data plus pure step functions; the cabinet owns the ball, the
// paddle and the drawing.
//
// Mister Mulch (Seedling House), a compost-crate golem hanging from the roof:
//   1. crack the crate plates that armour his face;
//   2. he drops dirt clods (a clod on the paddle makes it sluggish; swat it while moving);
//   3. he lowers and sweeps side to side, and the last hit makes him sneeze a shower of flowers.
// The Tangle Rose (Vine Hall), a thorny rose bush:
//   1. three vine roots at the edges feed her shield; crack them;
//   2. petal volleys rain down (a petal stings the paddle still for a moment, never costs a life);
//   3. her vines become crate walls that sweep down the screen; hit the bud through the gaps.
// Sunny Saguaro (Cactus Dome), a cactus robot with spinning arms that knock the ball around:
//   his flower crown blooms on a visible count (3, 2, 1) and he can only be hit while it blooms;
//   from phase 2 he lobs prickle balls: catch one on the paddle and it splits off as an extra ball;
//   in phase 3 his arms spin faster and the crown blooms for less time.
// Queen Koi (Lily Pond House), a great clockwork koi circling under the lily pads:
//   1. ripples are the tell; hit her as she leaps;
//   2. each splash-down flips the lily pads end for end;
//   3. she stirs a whirlpool that spirals the ball toward the middle of the pond.
// Every bonk is cartoon: a boss beaten bursts into flowers and cheers up.

import { COLS } from './walls'
import { LEFT, RIGHT, W } from './rules'
import type { CrateKind } from './walls'

export type BossId =
  'mister-mulch' | 'tangle-rose' | 'sunny-saguaro' | 'queen-koi' | 'gloom-bloom' | 'thorn'
export type BossPhase = 1 | 2 | 3

/** A guard crate (a face plate or a feeding root) as a wall cell, and the extra crates around it. */
export type BossCell = {
  col: number
  row: number
  hp: number
  kind: CrateKind
  guard: boolean
}

export type BossShot = {
  kind: 'clod' | 'petal' | 'prickle' | 'gloom'
  x: number
  y: number
  vx: number
  vy: number
}

/** One Tangle Rose vine wall: a row of segments with gaps, creeping down the glass. */
export type Sweep = { y: number; cells: boolean[] }

export type Boss = {
  id: BossId
  name: string
  x: number
  y: number
  w: number
  h: number
  phase: BossPhase
  /** Hits left in this phase (a guard phase is won by cracking the guards instead). */
  hits: number
  /** Ticks of hurt flash; the boss can't be hit twice in one flash. */
  hurt: number
  /** Ticks to the next attack, and ticks of telegraph left before it lands. */
  timer: number
  tell: number
  t: number
  shots: BossShot[]
  sweeps: Sweep[]
  defeated: boolean
  /** Sunny Saguaro: his arms' angle, and where his crown is in its count-and-bloom cycle. */
  spin: number
  crown: number
  /** Ticks before the arms may knock the ball again. */
  knock: number
  /** Queen Koi: ticks into a leap (0 while she swims), and where it starts and lands. */
  leap: number
  leapFrom: number
  leapTo: number
  /** Splash-downs that flipped the lily pads (phase 2), for the cabinet to act on. */
  flips: number
  /** Ticks into the whirlpool's stir-and-rest cycle (phase 3). */
  whirl: number
}

export type BossSpec = {
  id: BossId
  name: string
  /** Where the boss hangs (or swims) at the start. */
  home: { x: number; y: number }
  w: number
  h: number
  /** Hits to win each phase; 0 means the phase is won by cracking the guard crates. */
  hits: readonly [number, number, number]
  /** Ticks between attacks in each phase (0: no attacks in that phase). */
  every: readonly [number, number, number]
  /** Telegraph ticks before an attack lands: the tell. */
  tell: number
  cells: readonly BossCell[]
  /** What the phase banners say. */
  phases: readonly [string, string, string]
  score: number
  petals: number
}

const g = (col: number, row: number, hp: number): BossCell => ({
  col,
  row,
  hp,
  kind: 'root',
  guard: true,
})
const x = (col: number, row: number, kind: CrateKind): BossCell => ({
  col,
  row,
  hp: 1,
  kind,
  guard: false,
})

export const BOSS_SPECS: Readonly<Record<BossId, BossSpec>> = {
  'mister-mulch': {
    id: 'mister-mulch',
    name: 'MISTER MULCH',
    // He hangs flush under the roof beam, so no ball slips in above him until he lowers.
    home: { x: W / 2, y: 44 },
    w: 56,
    h: 32,
    hits: [0, 6, 7],
    every: [0, 150, 110],
    tell: 40,
    cells: [
      g(3, 1, 2),
      g(4, 1, 2),
      g(5, 1, 2),
      g(6, 1, 2),
      g(7, 1, 2),
      g(8, 1, 2),
      x(1, 5, 'sprout'),
      x(10, 5, 'sprout'),
      x(0, 3, 'crate'),
      x(11, 3, 'crate'),
      x(2, 6, 'crate'),
      x(9, 6, 'crate'),
    ],
    phases: [
      'CRACK HIS FACE PLATES',
      'DIRT CLODS! SWAT THEM WHILE MOVING',
      'HE SWEEPS LOW. BONK HIM!',
    ],
    score: 15_000,
    petals: 40,
  },
  'tangle-rose': {
    id: 'tangle-rose',
    name: 'THE TANGLE ROSE',
    home: { x: W / 2, y: 46 },
    w: 44,
    h: 36,
    hits: [0, 5, 6],
    every: [0, 140, 260],
    tell: 45,
    cells: [
      g(0, 4, 3),
      g(COLS - 1, 4, 3),
      g(6, 8, 3),
      x(2, 6, 'vine'),
      x(3, 6, 'vine'),
      x(8, 6, 'vine'),
      x(9, 6, 'vine'),
      x(1, 1, 'sprout'),
      x(10, 1, 'sprout'),
    ],
    phases: [
      'CRACK THE THREE ROOTS',
      'PETAL VOLLEYS! THEY STING, NOT HURT',
      'VINE WALLS! AIM THROUGH THE GAPS',
    ],
    score: 25_000,
    petals: 40,
  },
  'sunny-saguaro': {
    id: 'sunny-saguaro',
    name: 'SUNNY SAGUARO',
    home: { x: W / 2, y: 60 },
    w: 30,
    h: 46,
    hits: [3, 3, 4],
    every: [0, 200, 170],
    tell: 40,
    cells: [
      x(0, 2, 'sand'),
      x(11, 2, 'sand'),
      x(1, 5, 'sprout'),
      x(10, 5, 'sprout'),
      x(0, 6, 'prickle'),
      x(11, 6, 'prickle'),
      x(2, 8, 'crate'),
      x(3, 8, 'crate'),
      x(8, 8, 'crate'),
      x(9, 8, 'crate'),
    ],
    phases: [
      'HIT HIM WHILE HIS CROWN BLOOMS',
      'PRICKLE BALLS! CATCH ONE FOR A BALL',
      'HIS ARMS SPIN FASTER!',
    ],
    score: 35_000,
    petals: 45,
  },
  'queen-koi': {
    id: 'queen-koi',
    name: 'QUEEN KOI',
    home: { x: W / 2, y: 170 },
    w: 40,
    h: 14,
    hits: [3, 3, 4],
    every: [200, 170, 150],
    tell: 40,
    cells: [
      x(0, 0, 'bubble'),
      x(11, 0, 'bubble'),
      x(1, 1, 'crate'),
      x(2, 1, 'sprout'),
      x(9, 1, 'sprout'),
      x(10, 1, 'crate'),
      x(1, 6, 'lily'),
      x(2, 6, 'lily'),
      x(5, 6, 'lily'),
      x(6, 6, 'lily'),
      x(9, 6, 'lily'),
      x(10, 6, 'lily'),
    ],
    phases: [
      'RIPPLES! HIT HER AS SHE LEAPS',
      'SHE FLIPS THE LILY PADS!',
      'WHIRLPOOL! KEEP THE BALL HIGH',
    ],
    score: 45_000,
    petals: 50,
  },
  'gloom-bloom': {
    id: 'gloom-bloom',
    name: 'THE GLOOM BLOOM',
    home: { x: W / 2, y: 56 },
    w: 48,
    h: 38,
    hits: [0, 5, 6],
    every: [0, 0, 140],
    tell: 45,
    cells: [
      { col: 1, row: 3, hp: 2, kind: 'lantern', guard: true },
      { col: 10, row: 3, hp: 2, kind: 'lantern', guard: true },
      { col: 3, row: 7, hp: 2, kind: 'lantern', guard: true },
      { col: 8, row: 7, hp: 2, kind: 'lantern', guard: true },
      x(4, 5, 'glow'),
      x(7, 5, 'glow'),
      x(1, 5, 'sprout'),
      x(10, 5, 'sprout'),
    ],
    phases: [
      'RELIGHT THE FOUR LANTERNS',
      'HIT THE CORE WHILE THE PETALS OPEN',
      'BONK THE GLOOM CLOUDS TO SAVE YOUR BED',
    ],
    score: 55_000,
    petals: 60,
  },
  thorn: {
    id: 'thorn', name: 'THORN', home: { x: W / 2, y: 35 }, w: 46, h: 7,
    hits: [0, 3, 4], every: [0, 0, 0], tell: 0,
    cells: [
      g(2, 2, 2), g(5, 2, 2), g(6, 2, 2), g(9, 2, 2),
      x(1, 3, 'glow'), x(10, 3, 'glow'), x(4, 4, 'puffball'), x(7, 4, 'puffball'),
    ],
    phases: ['CRACK THE FOUR ROOTS ON THORNS SIDE', 'GET THE BALL PAST THE TOP PADDLE', 'THORN RALLIES FASTER. AIM FOR THE GAPS'],
    score: 80_000, petals: 80,
  },
}

/** Thorn's opponent paddle occupies the roof lane. Missing its return costs it a point. */
export const THORN_Y = 35
export const THORN_SPEED = [1.6, 2.1, 2.5] as const
export function thornWidth(b: Boss): number {
  return b.phase === 1 ? 46 : b.phase === 2 ? 36 : 30
}

/** Whether the Gloom Bloom's shutters are open this tick. */
export function gloomOpen(b: Boss): boolean {
  return b.phase === 3 || (b.phase === 2 && b.crown >= 90)
}

/** Which boss waits at the end of house `house`, if any. */
export function bossOf(house: number): BossId | null {
  return (
    (
      [
        'mister-mulch',
        'tangle-rose',
        'sunny-saguaro',
        'queen-koi',
        'gloom-bloom',
        'thorn',
      ] as const
    )[house] ?? null
  )
}

export function spawnBoss(id: BossId): Boss {
  const spec = BOSS_SPECS[id]
  return {
    id,
    name: spec.name,
    x: spec.home.x,
    y: spec.home.y,
    w: spec.w,
    h: spec.h,
    phase: 1,
    hits: spec.hits[0],
    hurt: 0,
    timer: spec.every[0],
    tell: 0,
    t: 0,
    shots: [],
    sweeps: [],
    defeated: false,
    spin: 0,
    crown: 0,
    knock: 0,
    leap: 0,
    leapFrom: spec.home.x,
    leapTo: spec.home.x,
    flips: 0,
    whirl: 0,
  }
}

export function bossRect(b: Boss) {
  return { x: b.x - b.w / 2, y: b.y - b.h / 2, w: b.w, h: b.h }
}

/** Queen Koi under the pads is out of the ball's reach; every other boss is always solid. */
export function bossSolid(b: Boss): boolean {
  return b.id !== 'thorn' && (b.id !== 'queen-koi' || b.leap > 0)
}

export function bossTouches(b: Boss, x: number, y: number, r: number) {
  if (!bossSolid(b)) return false
  const rect = bossRect(b)
  return (
    x + r > rect.x &&
    x - r < rect.x + rect.w &&
    y + r > rect.y &&
    y - r < rect.y + rect.h
  )
}

/** A per-phase number (hits, attack gaps, crown times) for phase `p`. */
export function ofPhase(list: readonly [number, number, number], p: BossPhase) {
  return p === 1 ? list[0] : p === 2 ? list[1] : list[2]
}

/** A phase won by cracking guard crates (Mister Mulch's plates, the Tangle Rose's roots). */
export function guardPhase(b: Boss): boolean {
  return ofPhase(BOSS_SPECS[b.id].hits, b.phase) === 0
}

/** The guards are all cracked: the next phase opens. */
export function openBoss(b: Boss): void {
  if (!guardPhase(b)) return
  nextPhase(b)
  b.hurt = 30
}

function nextPhase(b: Boss) {
  const spec = BOSS_SPECS[b.id]
  b.phase = Math.min(3, b.phase + 1) as BossPhase
  b.hits = ofPhase(spec.hits, b.phase)
  const every = ofPhase(spec.every, b.phase)
  b.timer = b.phase === 3 ? Math.round(every / 2) : every
  b.tell = 0
  b.crown = 0
}

// --- Sunny Saguaro's crown and arms ----------------------------------------------------------

/** Ticks his crown stays shut (counting 3, 2, 1) and then blooms, by phase. */
export const CROWN_SHUT = [180, 180, 150] as const
export const CROWN_BLOOM = [150, 130, 100] as const
export const ARM_LEN = 34
export const ARM_SPIN = [0.025, 0.03, 0.048] as const

export function crownOpen(b: Boss): boolean {
  if (b.id !== 'sunny-saguaro') return false
  return b.crown >= ofPhase(CROWN_SHUT, b.phase)
}

/** The count his crown shows while shut: 3, 2, 1. */
export function crownCount(b: Boss): number {
  const shut = ofPhase(CROWN_SHUT, b.phase)
  return Math.max(1, Math.ceil(((shut - b.crown) / shut) * 3))
}

/** The two arms' tips, either side of his trunk. */
export function armTips(b: Boss): Array<{ x: number; y: number }> {
  return [0, Math.PI].map((o) => ({
    x: b.x + Math.cos(b.spin + o) * ARM_LEN,
    y: b.y + Math.sin(b.spin + o) * ARM_LEN * 0.8,
  }))
}

/** Whether a ball at (x, y) touches one of his arms (a line from the trunk to a tip). */
export function armTouches(b: Boss, x: number, y: number, r: number): boolean {
  if (b.id !== 'sunny-saguaro' || b.defeated) return false
  for (const tip of armTips(b)) {
    const dx = tip.x - b.x
    const dy = tip.y - b.y
    const len2 = dx * dx + dy * dy
    const t = Math.max(
      0.45,
      Math.min(1, ((x - b.x) * dx + (y - b.y) * dy) / len2),
    )
    if (Math.hypot(b.x + dx * t - x, b.y + dy * t - y) <= r + 3) return true
  }
  return false
}

/** An arm knocks the ball: flung straight away from his trunk, spun along with the arms. */
export function armKnock(
  b: Boss,
  ball: { x: number; y: number; vx: number; vy: number },
): { vx: number; vy: number } {
  const s = Math.hypot(ball.vx, ball.vy) || 2.5
  const a = Math.atan2(ball.y - b.y, ball.x - b.x) + 0.35
  b.knock = 12
  return { vx: Math.cos(a) * s, vy: Math.sin(a) * s }
}

// --- Queen Koi's leaps and whirlpool -----------------------------------------------------------

export const LEAP_TICKS = 96
/** How high she leaps: the top of her arc. */
export const LEAP_TOP = 74
export const SWIM_Y = 170
export const WHIRL_ON = 300
export const WHIRL_REST = 240
export const WHIRL_CENTRE = { x: W / 2, y: 160 }
/** Most the whirlpool turns a ball in the pond in one tick, in radians. */
export const WHIRL_TURN = 0.035

export function whirling(b: Boss): boolean {
  return (
    b.id === 'queen-koi' &&
    b.phase === 3 &&
    !b.defeated &&
    b.whirl % (WHIRL_ON + WHIRL_REST) < WHIRL_ON
  )
}

/** Whether the boss can be hurt right now. */
export function bossOpen(b: Boss): boolean {
  if (b.defeated || guardPhase(b)) return false
  if (b.id === 'sunny-saguaro') return crownOpen(b)
  if (b.id === 'queen-koi') return b.leap > 0
  if (b.id === 'gloom-bloom') return gloomOpen(b)
  return true
}

/** After a hit the boss shrugs the ball off for a moment: no hit-hit-hit off the roof. */
export const HURT_TICKS = 50

export type BossHit = 'shielded' | 'hit' | 'phase' | 'defeated' | 'none'

/** The ball bonks the boss: a shield while it is guarded or shut, a hit when it is open. */
export function hitBoss(b: Boss): BossHit {
  if (b.defeated) return 'none'
  if (!bossOpen(b)) return 'shielded'
  if (b.hurt > 0) return 'none'
  b.hurt = HURT_TICKS
  b.hits--
  if (b.hits > 0) return 'hit'
  if (b.phase < 3) {
    nextPhase(b)
    b.shots = b.shots.filter((s) => s.kind !== 'petal')
    return 'phase'
  }
  b.defeated = true
  b.shots = []
  b.sweeps = []
  return 'defeated'
}

/** The hits still to land, out of the whole fight's, for the HUD bar (a guard phase is full). */
export function bossHealth(b: Boss): number {
  const hits = BOSS_SPECS[b.id].hits
  if (b.defeated) return 0
  if (guardPhase(b)) return 1
  const total = hits[0] + hits[1] + hits[2]
  let left = b.hits
  if (b.phase === 1) left += hits[1] + hits[2]
  if (b.phase === 2) left += hits[2]
  return left / total
}

export const SWEEP_H = 8
export const SWEEP_SPEED = 0.28
export const SWEEP_FLOOR = 236
export const SHOT_R = 3
export const CELL_W = (RIGHT - LEFT) / COLS
/** A prickle ball's fall: lobbed up, then gravity. */
export const PRICKLE_GRAVITY = 0.035

/** A vine wall with three one-cell gaps, never two side by side. */
export function newSweep(rng: () => number, y: number): Sweep {
  const cells = Array.from({ length: COLS }, () => true)
  let made = 0
  for (let tries = 0; made < 3 && tries < 60; tries++) {
    const c = Math.floor(rng() * COLS)
    if (!cells[c]) continue
    if (cells[c - 1] === false || cells[c + 1] === false) continue
    cells[c] = false
    made++
  }
  return { y, cells }
}

export function sweepCellAt(s: Sweep, x: number, y: number, r: number) {
  if (y + r < s.y || y - r > s.y + SWEEP_H) return -1
  const c = Math.floor((x - LEFT) / CELL_W)
  if (c < 0 || c >= COLS || !s.cells[c]) {
    // A ball overlapping the edge of a neighbouring cell still meets it.
    for (const n of [
      Math.floor((x - r - LEFT) / CELL_W),
      Math.floor((x + r - LEFT) / CELL_W),
    ])
      if (n >= 0 && n < COLS && s.cells[n]) return n
    return -1
  }
  return c
}

/**
 * One tick of the boss: it moves for its phase, counts down to its next attack, telegraphs it,
 * and fires it; shots fall and vine walls creep. `aimX` is where the paddle is.
 */
export function stepBoss(b: Boss, aimX: number, rng: () => number): void {
  b.t++
  if (b.hurt > 0) b.hurt--
  if (b.knock > 0) b.knock--
  const spec = BOSS_SPECS[b.id]
  if (b.defeated) {
    // A beaten boss floats back to its place, cheered (Queen Koi rests on the water).
    b.leap = 0
    const homeY = b.id === 'queen-koi' ? SWIM_Y - 16 : spec.home.y
    b.y += (homeY - b.y) * 0.05
    return
  }
  if (b.id === 'thorn') {
    const half = thornWidth(b) / 2
    const goal = Math.max(LEFT + half, Math.min(RIGHT - half, aimX))
    const speed = ofPhase(THORN_SPEED, b.phase)
    b.x += Math.max(-speed, Math.min(speed, goal - b.x))
    return
  }
  if (b.id === 'queen-koi') stepKoi(b, rng)
  else {
    if (b.id === 'sunny-saguaro') {
      b.spin += ofPhase(ARM_SPIN, b.phase)
      b.crown =
        (b.crown + 1) %
        (ofPhase(CROWN_SHUT, b.phase) + ofPhase(CROWN_BLOOM, b.phase))
    }
    if (b.id === 'gloom-bloom' && b.phase === 2) b.crown = (b.crown + 1) % 210
    // Each phase eases toward its own path, so a new phase never jumps the boss across the glass.
    let goal = b.x
    if (b.id === 'mister-mulch') {
      if (b.phase === 3) {
        // He lowers on his chains and sweeps from side to side.
        b.y += (112 - b.y) * 0.02
        goal = W / 2 + Math.sin(b.t / 70) * 72
      } else if (b.phase === 2) goal = W / 2 + Math.sin(b.t / 90) * 56
    } else if (b.id === 'tangle-rose' && b.phase >= 2)
      goal = W / 2 + Math.sin(b.t / 100) * 28
    else if (b.id === 'sunny-saguaro' && b.phase === 3)
      goal = W / 2 + Math.sin(b.t / 120) * 40
    else if (b.id === 'gloom-bloom' && b.phase === 3)
      goal = W / 2 + Math.sin(b.t / 70) * 55
    b.x += Math.max(-1.6, Math.min(1.6, goal - b.x))
    const every = ofPhase(spec.every, b.phase)
    if (every > 0) {
      if (b.tell > 0) {
        if (--b.tell === 0) fire(b, aimX, rng)
      } else if (--b.timer <= 0) {
        b.timer = every
        b.tell = spec.tell
      }
    }
  }
  for (const s of b.shots) {
    s.x += s.vx
    s.y += s.vy
    if (s.kind === 'clod') s.vy = Math.min(2.6, s.vy + 0.03)
    if (s.kind === 'prickle') s.vy = Math.min(2.4, s.vy + PRICKLE_GRAVITY)
    if (s.x < LEFT + SHOT_R || s.x > RIGHT - SHOT_R) s.vx = -s.vx
  }
  b.shots = b.shots.filter((s) => s.y < 330 && s.y > 0)
  for (const s of b.sweeps) s.y += SWEEP_SPEED
  b.sweeps = b.sweeps.filter((s) => s.y < SWEEP_FLOOR)
}

/** Queen Koi swims a slow circle under the pads, rippling before every leap. */
function stepKoi(b: Boss, rng: () => number) {
  const spec = BOSS_SPECS['queen-koi']
  if (b.phase === 3) b.whirl++
  if (b.leap > 0) {
    b.leap++
    const t = b.leap / LEAP_TICKS
    b.x = b.leapFrom + (b.leapTo - b.leapFrom) * t
    b.y = SWIM_Y - Math.sin(t * Math.PI) * (SWIM_Y - LEAP_TOP)
    if (b.leap >= LEAP_TICKS) {
      b.leap = 0
      b.y = SWIM_Y
      if (b.phase === 2) b.flips++
    }
    return
  }
  b.x += Math.max(-1.2, Math.min(1.2, W / 2 + Math.sin(b.t / 80) * 80 - b.x))
  b.y = SWIM_Y + Math.sin(b.t / 30) * 2
  if (b.tell > 0) {
    if (--b.tell === 0) {
      b.leap = 1
      b.leapFrom = b.x
      b.leapTo = Math.max(
        LEFT + 30,
        Math.min(RIGHT - 30, b.x + (rng() - 0.5) * 120),
      )
    }
  } else if (--b.timer <= 0) {
    b.timer = ofPhase(spec.every, b.phase)
    b.tell = spec.tell
  }
}

function fire(b: Boss, aimX: number, rng: () => number) {
  const bottom = b.y + b.h / 2
  if (b.id === 'mister-mulch') {
    // One clod (two when he sweeps low), lobbed toward the paddle with a little scatter.
    const count = b.phase === 3 ? 2 : 1
    for (let i = 0; i < count; i++) {
      const from = b.x + (rng() - 0.5) * b.w * 0.6
      const fall = (296 - bottom) / 1.8
      const vx = Math.max(-1.2, Math.min(1.2, (aimX - from) / fall))
      b.shots.push({
        kind: 'clod',
        x: from,
        y: bottom,
        vx: vx + (rng() - 0.5) * 0.3,
        vy: 0.8,
      })
    }
    return
  }
  if (b.id === 'sunny-saguaro') {
    // A prickle ball lobbed from his crown, landing somewhere along the paddle's line.
    const top = b.y - b.h / 2
    const land = LEFT + 20 + rng() * (RIGHT - LEFT - 40)
    // Up 1 px a tick under PRICKLE_GRAVITY: a short hop over his crown, ~150 ticks to the paddle.
    const flight = 150
    b.shots.push({
      kind: 'prickle',
      x: b.x,
      y: top,
      vx: (land - b.x) / flight,
      vy: -1,
    })
    return
  }
  if (b.id === 'gloom-bloom') {
    for (const offset of [-48, 48]) {
      const x = Math.max(LEFT + 8, Math.min(RIGHT - 8, aimX + offset))
      b.shots.push({
        kind: 'gloom',
        x: b.x,
        y: bottom,
        vx: (x - b.x) / 160,
        vy: 1.5,
      })
    }
    return
  }
  if (b.phase === 3) {
    if (b.sweeps.length < 2) b.sweeps.push(newSweep(rng, bottom + 8))
    return
  }
  // A fan of five petals, centred on the paddle.
  const base = Math.atan2(296 - bottom, aimX - b.x)
  for (let i = -2; i <= 2; i++) {
    const a = base + i * 0.22
    b.shots.push({
      kind: 'petal',
      x: b.x,
      y: bottom,
      vx: Math.cos(a) * 1.7,
      vy: Math.max(0.6, Math.sin(a) * 1.7),
    })
  }
}
