// /utils/arcade/brickBloom/bosses.ts
//
// Brick Bloom's first two glasshouse bosses (conductor kr-arcade/t-079, depth-pass CABINETS.md
// section 11, slice 2), as data plus pure step functions; the cabinet owns the ball, the paddle
// and the drawing.
//
// Mister Mulch (Seedling House), a compost-crate golem hanging from the roof:
//   1. crack the crate plates that armour his face;
//   2. he drops dirt clods (a clod on the paddle makes it sluggish; swat it while moving);
//   3. he lowers and sweeps side to side, and the last hit makes him sneeze a shower of flowers.
// The Tangle Rose (Vine Hall), a thorny rose bush:
//   1. three vine roots at the edges feed her shield; crack them;
//   2. petal volleys rain down (a petal stings the paddle still for a moment, never costs a life);
//   3. her vines become crate walls that sweep down the screen; hit the bud through the gaps.
// Every bonk is cartoon: a boss beaten bursts into flowers and cheers up.

import { COLS } from './walls'
import { LEFT, RIGHT, W } from './rules'

export type BossId = 'mister-mulch' | 'tangle-rose'
export type BossPhase = 1 | 2 | 3

/** A guard crate (a face plate or a feeding root) as a wall cell, and the extra crates around it. */
export type BossCell = {
  col: number
  row: number
  hp: number
  kind: 'root' | 'vine' | 'sprout' | 'crate'
  guard: boolean
}

export type BossShot = {
  kind: 'clod' | 'petal'
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
  /** Hits left in this phase (phase 1 is won by cracking the guards instead). */
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
}

export type BossSpec = {
  id: BossId
  name: string
  /** Where the boss hangs in phases 1-2. */
  home: { x: number; y: number }
  w: number
  h: number
  /** Hits to win phases 2 and 3. */
  hits: readonly [number, number]
  /** Ticks between attacks in phases 2 and 3. */
  every: readonly [number, number]
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
const x = (col: number, row: number, kind: BossCell['kind']): BossCell => ({
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
    hits: [6, 7],
    every: [150, 110],
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
    hits: [5, 6],
    every: [140, 260],
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
}

/** Which boss waits at the end of house `house`, if any. */
export function bossOf(house: number): BossId | null {
  return house === 0 ? 'mister-mulch' : house === 1 ? 'tangle-rose' : null
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
  }
}

export function bossRect(b: Boss) {
  return { x: b.x - b.w / 2, y: b.y - b.h / 2, w: b.w, h: b.h }
}

export function bossTouches(b: Boss, x: number, y: number, r: number) {
  const rect = bossRect(b)
  return (
    x + r > rect.x &&
    x - r < rect.x + rect.w &&
    y + r > rect.y &&
    y - r < rect.y + rect.h
  )
}

/** The guards are all cracked: phase 2 opens. */
export function openBoss(b: Boss): void {
  if (b.phase !== 1) return
  b.phase = 2
  b.hits = BOSS_SPECS[b.id].hits[0]
  b.timer = BOSS_SPECS[b.id].every[0]
  b.hurt = 30
}

/** After a hit the boss shrugs the ball off for a moment: no hit-hit-hit off the roof. */
export const HURT_TICKS = 50

export type BossHit = 'shielded' | 'hit' | 'phase' | 'defeated' | 'none'

/** The ball bonks the boss: a shield in phase 1, a hit after; the last hit of a phase moves on. */
export function hitBoss(b: Boss): BossHit {
  if (b.defeated) return 'none'
  if (b.phase === 1) return 'shielded'
  if (b.hurt > 0) return 'none'
  b.hurt = HURT_TICKS
  b.hits--
  if (b.hits > 0) return 'hit'
  if (b.phase === 2) {
    b.phase = 3
    b.hits = BOSS_SPECS[b.id].hits[1]
    b.timer = Math.round(BOSS_SPECS[b.id].every[1] / 2)
    b.tell = 0
    b.shots = b.shots.filter((s) => s.kind === 'clod')
    return 'phase'
  }
  b.defeated = true
  b.shots = []
  b.sweeps = []
  return 'defeated'
}

/** Hits taken so far out of the whole fight's phase 2 and 3 hits, for the HUD bar. */
export function bossHealth(b: Boss): number {
  const [p2, p3] = BOSS_SPECS[b.id].hits
  if (b.defeated) return 0
  if (b.phase === 1) return 1
  const left = b.phase === 2 ? b.hits + p3 : b.hits
  return left / (p2 + p3)
}

export const SWEEP_H = 8
export const SWEEP_SPEED = 0.28
export const SWEEP_FLOOR = 236
export const SHOT_R = 3
export const CELL_W = (RIGHT - LEFT) / COLS

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
  const spec = BOSS_SPECS[b.id]
  if (b.defeated) {
    // A beaten boss floats back up, cheered.
    b.y += (spec.home.y - b.y) * 0.05
    return
  }
  // Each phase eases toward its own path, so a new phase never jumps the boss across the glass.
  let goal = b.x
  if (b.id === 'mister-mulch') {
    if (b.phase === 3) {
      // He lowers on his chains and sweeps from side to side.
      b.y += (112 - b.y) * 0.02
      goal = W / 2 + Math.sin(b.t / 70) * 72
    } else if (b.phase === 2) goal = W / 2 + Math.sin(b.t / 90) * 56
  } else if (b.phase >= 2) goal = W / 2 + Math.sin(b.t / 100) * 28
  b.x += Math.max(-1.6, Math.min(1.6, goal - b.x))
  if (b.phase >= 2) {
    if (b.tell > 0) {
      if (--b.tell === 0) fire(b, aimX, rng)
    } else if (--b.timer <= 0) {
      b.timer = spec.every[b.phase - 2]!
      b.tell = spec.tell
    }
  }
  for (const s of b.shots) {
    s.x += s.vx
    s.y += s.vy
    if (s.kind === 'clod') s.vy = Math.min(2.6, s.vy + 0.03)
    if (s.x < LEFT + SHOT_R || s.x > RIGHT - SHOT_R) s.vx = -s.vx
  }
  b.shots = b.shots.filter((s) => s.y < 330 && s.y > 0)
  for (const s of b.sweeps) s.y += SWEEP_SPEED
  b.sweeps = b.sweeps.filter((s) => s.y < SWEEP_FLOOR)
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
