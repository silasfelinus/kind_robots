// /utils/arcade/gloomInvaders/weather.ts
//
// Gloom Invaders depth pass, slice 1 (conductor kr-arcade/t-132): the weather as data. Cloud
// kinds, the five formations (the grid, drifting rows, the diagonal sweep, the spinning ring and
// the jet-stream rows), the fronts that string them together, the drop kinematics and the
// heartbeat loop. Everything here is pure, so the deterministic tests can drive it directly.

import type { MusicLoop } from '../sound'

export const W = 288
export const H = 384
export const CLOUD_W = 18
export const CLOUD_H = 12
export const CELL_H = 18
export const STEP_X = 4
export const HURRY_STEP_X = 6
export const DROP_Y = 8
export const EDGE = 6

// --- clouds -------------------------------------------------------------------------------------

export type CloudKind =
  | 'anvil'
  | 'puff'
  | 'grump'
  | 'drizzler'
  | 'splitter'
  | 'half'
  | 'diver'
  | 'hailer'
  | 'thunderhead'

export type CloudSpec = {
  name: string
  points: number
  /** Beams it takes to cheer (a Sun Lance or a pumpkin cheers it in one). */
  hp: number
  w: number
  h: number
}

export const CLOUD_KINDS: Record<CloudKind, CloudSpec> = {
  anvil: { name: 'STORM ANVIL', points: 30, hp: 1, w: CLOUD_W, h: CLOUD_H },
  puff: { name: 'GREY PUFF', points: 20, hp: 1, w: CLOUD_W, h: CLOUD_H },
  grump: { name: 'GRUMP', points: 10, hp: 1, w: CLOUD_W, h: CLOUD_H },
  drizzler: { name: 'DRIZZLER', points: 25, hp: 1, w: CLOUD_W, h: CLOUD_H },
  splitter: {
    name: 'SPLITTER PUFF',
    points: 20,
    hp: 1,
    w: CLOUD_W,
    h: CLOUD_H,
  },
  half: { name: 'LITTLE PUFF', points: 15, hp: 1, w: 10, h: 8 },
  diver: { name: 'DIVER GUST', points: 40, hp: 1, w: CLOUD_W, h: CLOUD_H },
  hailer: { name: 'HAILER', points: 30, hp: 1, w: CLOUD_W, h: CLOUD_H },
  thunderhead: {
    name: 'THUNDERHEAD',
    points: 60,
    hp: 3,
    w: CLOUD_W,
    h: CLOUD_H,
  },
}

/** Cheering both halves of one splitter puff earns this on top of their points. */
export const SPLIT_PAIR_BONUS = 50
/** A diver gust beamed mid-swoop scores this many times its points. */
export const DIVE_MULTIPLIER = 2
/** Where each half of a split puff sits inside its parent's slot. */
export const HALF_OFFSETS = { left: [-2, 2], right: [10, 2] } as const

// --- formations ---------------------------------------------------------------------------------

/** One row's clouds: a single kind, or kinds repeating across the columns. */
export type RowSpec = CloudKind | readonly CloudKind[]

export type FormationSpec =
  | { kind: 'grid'; cols: number; cellW: number; rows: readonly RowSpec[] }
  | {
      kind: 'drift'
      cols: number
      cellW: number
      rows: readonly RowSpec[]
      /** Each row's pace (STEP_X a step times this); rows bounce off the walls on their own. */
      speeds: readonly number[]
      descendEvery: number
    }
  | {
      kind: 'diagonal'
      cols: number
      cellW: number
      rows: readonly RowSpec[]
      /** Pixels a column lower than its neighbour once the front has tilted all the way. */
      slope: number
    }
  | {
      kind: 'ring'
      rings: readonly { count: number; radius: number; kinds: RowSpec }[]
      /** Radians a step; every other ring turns the other way. */
      spin: number
    }
  | {
      kind: 'jet'
      cols: number
      /** Gap between clouds in a row; a row wraps round the sky every cols × spacing. */
      spacing: number
      rows: readonly RowSpec[]
      /** Signed: a negative row slides left. */
      speeds: readonly number[]
      descendEvery: number
    }

export type FormationKind = FormationSpec['kind']

export type Slot = { kind: CloudKind; row: number; col: number }

export type FormationState = {
  x: number
  y: number
  dir: 1 | -1
  rowX: number[]
  rowDir: Array<1 | -1>
  angle: number
  /** The diagonal front's lean, -1..1, chasing its direction of travel. */
  tilt: number
  steps: number
}

/** The squash that turns the ring into an oval, so it fits the sky. */
const RING_SQUASH = 0.8
const TILT_STEP = 0.25

function rowKind(spec: RowSpec, i: number): CloudKind {
  return typeof spec === 'string' ? spec : spec[i % spec.length]!
}

/** Every cloud the formation starts with, in drawing order. */
export function formationSlots(spec: FormationSpec): Slot[] {
  const slots: Slot[] = []
  if (spec.kind === 'ring') {
    spec.rings.forEach((ring, row) => {
      for (let col = 0; col < ring.count; col++)
        slots.push({ kind: rowKind(ring.kinds, col), row, col })
    })
    return slots
  }
  spec.rows.forEach((kinds, row) => {
    for (let col = 0; col < spec.cols; col++)
      slots.push({ kind: rowKind(kinds, col), row, col })
  })
  return slots
}

function ringOuter(spec: Extract<FormationSpec, { kind: 'ring' }>): number {
  return Math.max(...spec.rings.map((r) => r.radius))
}

function blockWidth(cols: number, cellW: number): number {
  return (cols - 1) * cellW + CLOUD_W
}

/** A new formation with its top row at `startY`, centred. */
export function newFormation(
  spec: FormationSpec,
  startY: number,
): FormationState {
  const state: FormationState = {
    x: 0,
    y: startY,
    dir: 1,
    rowX: [],
    rowDir: [],
    angle: 0,
    tilt: 0,
    steps: 0,
  }
  switch (spec.kind) {
    case 'grid':
    case 'diagonal':
      state.x = Math.round((W - blockWidth(spec.cols, spec.cellW)) / 2)
      break
    case 'drift': {
      const x = Math.round((W - blockWidth(spec.cols, spec.cellW)) / 2)
      state.rowX = spec.rows.map(() => x)
      state.rowDir = spec.rows.map((_, r) => (r % 2 ? -1 : 1))
      break
    }
    case 'jet':
      state.rowX = spec.rows.map((_, r) => r * 11)
      state.rowDir = spec.rows.map((_, r) => (spec.speeds[r]! < 0 ? -1 : 1))
      break
    case 'ring':
      state.x = W / 2
      break
  }
  return state
}

function mod(n: number, m: number): number {
  return ((n % m) + m) % m
}

/** The top-left of a slot's cloud box right now. */
export function slotHome(
  spec: FormationSpec,
  s: FormationState,
  row: number,
  col: number,
): { x: number; y: number } {
  switch (spec.kind) {
    case 'grid':
      return { x: s.x + col * spec.cellW, y: s.y + row * CELL_H }
    case 'diagonal': {
      const mid = (spec.cols - 1) / 2
      return {
        x: s.x + col * spec.cellW,
        y:
          s.y +
          row * CELL_H +
          Math.round(spec.slope * (mid + (col - mid) * s.tilt)),
      }
    }
    case 'drift':
      return {
        x: Math.round(s.rowX[row]! + col * spec.cellW),
        y: s.y + row * CELL_H,
      }
    case 'jet': {
      const span = spec.cols * spec.spacing
      return {
        x: Math.round(mod(s.rowX[row]! + col * spec.spacing, span)) - CLOUD_W,
        y: s.y + row * CELL_H,
      }
    }
    case 'ring': {
      const ring = spec.rings[row]!
      const turn = row % 2 ? -1 : 1
      const a = s.angle * turn + (Math.PI * 2 * col) / ring.count
      const outer = ringOuter(spec)
      return {
        x: Math.round(s.x + Math.cos(a) * ring.radius - CLOUD_W / 2),
        y: Math.round(s.y + (outer + Math.sin(a) * ring.radius) * RING_SQUASH),
      }
    }
  }
}

/**
 * One march step for the clouds still in the sky (by slot). Returns true when the formation
 * stepped down a row: the grid, the diagonal and the ring drop when they reach a wall, the
 * drifting and jet-stream rows on a fixed count of steps.
 */
export function marchStep(
  spec: FormationSpec,
  s: FormationState,
  alive: readonly { row: number; col: number }[],
  stepX: number,
): boolean {
  if (!alive.length) return false
  s.steps++
  switch (spec.kind) {
    case 'grid':
    case 'diagonal': {
      const dx = stepX * s.dir
      const cols = alive.map((c) => c.col)
      const left = s.x + Math.min(...cols) * spec.cellW + dx
      const right = s.x + Math.max(...cols) * spec.cellW + CLOUD_W + dx
      if (left < EDGE || right > W - EDGE) {
        s.y += DROP_Y
        s.dir = s.dir === 1 ? -1 : 1
        return true
      }
      s.x += dx
      if (spec.kind === 'diagonal')
        s.tilt = Math.max(-1, Math.min(1, s.tilt + TILT_STEP * s.dir))
      return false
    }
    case 'drift': {
      spec.rows.forEach((_, row) => {
        const cols = alive.filter((c) => c.row === row).map((c) => c.col)
        if (!cols.length) return
        const dx = stepX * spec.speeds[row]! * s.rowDir[row]!
        const left = s.rowX[row]! + Math.min(...cols) * spec.cellW + dx
        const right =
          s.rowX[row]! + Math.max(...cols) * spec.cellW + CLOUD_W + dx
        if (left < EDGE || right > W - EDGE)
          s.rowDir[row] = s.rowDir[row] === 1 ? -1 : 1
        else s.rowX[row] = s.rowX[row]! + dx
      })
      break
    }
    case 'jet':
      spec.rows.forEach((_, row) => {
        s.rowX[row] = s.rowX[row]! + stepX * spec.speeds[row]!
      })
      break
    case 'ring': {
      const dx = stepX * s.dir
      const reach =
        Math.max(...alive.map((c) => spec.rings[c.row]!.radius)) + CLOUD_W / 2
      s.angle += spec.spin
      if (s.x + dx - reach < EDGE || s.x + dx + reach > W - EDGE) {
        s.y += DROP_Y
        s.dir = s.dir === 1 ? -1 : 1
        return true
      }
      s.x += dx
      return false
    }
  }
  if (s.steps % spec.descendEvery === 0) {
    s.y += DROP_Y
    return true
  }
  return false
}

// --- fronts -------------------------------------------------------------------------------------

export type Season = 0 | 1 | 2 | 3
export const SEASON_NAMES = ['SPRING', 'SUMMER', 'AUTUMN', 'WINTER'] as const

/** The rain the plain clouds (grump, puff, anvil, splitter) let fall: weights per drop kind. */
export type RainMix = Partial<Record<'straight' | 'sleet', number>>

export type Front = {
  id: string
  name: string
  sub: string
  season: Season
  formation: FormationSpec
  rain: RainMix
}

/** Today's game: the 9 × 5 block of three looks, straight drops only. */
export const CLASSIC_FRONT: Front = {
  id: 'classic',
  name: 'WAVE',
  sub: 'SHINE ON THE GLOOM',
  season: 0,
  formation: {
    kind: 'grid',
    cols: 9,
    cellW: 24,
    rows: ['anvil', 'puff', 'puff', 'grump', 'grump'],
  },
  rain: { straight: 1 },
}

/**
 * The weather run, in order; it loops with the difficulty curves still climbing. Each front
 * brings in a formation or a cloud (the calendar of slice 2 regroups them into months).
 */
export const WEATHER_FRONTS: readonly Front[] = [
  {
    id: 'cumulus-grid',
    name: 'CUMULUS GRID',
    sub: 'FIFTY-FIVE GRUMPY CLOUDS',
    season: 0,
    formation: {
      kind: 'grid',
      cols: 11,
      cellW: 22,
      rows: ['anvil', 'puff', 'puff', 'grump', 'grump'],
    },
    rain: { straight: 1 },
  },
  {
    id: 'drizzle',
    name: 'THE DRIZZLE',
    sub: 'DARK CLOUD? STEP ASIDE',
    season: 0,
    formation: {
      kind: 'grid',
      cols: 11,
      cellW: 22,
      rows: ['anvil', ['puff', 'drizzler'], 'puff', 'grump', 'grump'],
    },
    rain: { straight: 1 },
  },
  {
    id: 'showers',
    name: 'SHOWERS',
    sub: 'CHEER BOTH HALVES',
    season: 0,
    formation: {
      kind: 'drift',
      cols: 9,
      cellW: 26,
      rows: ['anvil', 'splitter', 'puff', 'splitter', 'grump'],
      speeds: [1, 0.6, 1.25, 0.8, 1.1],
      descendEvery: 12,
    },
    rain: { straight: 1 },
  },
  {
    id: 'thunderhead-rows',
    name: 'THUNDERHEAD ROWS',
    sub: 'LEAVE THE LIT COLUMN',
    season: 1,
    formation: {
      kind: 'grid',
      cols: 11,
      cellW: 22,
      rows: [['anvil', 'thunderhead'], 'puff', 'puff', 'grump', 'grump'],
    },
    rain: { straight: 1 },
  },
  {
    id: 'squall-line',
    name: 'THE SQUALL LINE',
    sub: 'RED EDGE MEANS A DIVE',
    season: 1,
    formation: {
      kind: 'diagonal',
      cols: 11,
      cellW: 22,
      rows: [['anvil', 'diver'], 'puff', 'puff', 'grump', 'grump'],
      slope: 3,
    },
    rain: { straight: 1 },
  },
  {
    id: 'hailstorm',
    name: 'HAILSTORM',
    sub: 'HAIL BOUNCES ONCE',
    season: 1,
    formation: {
      kind: 'grid',
      cols: 9,
      cellW: 24,
      rows: ['hailer', ['puff', 'hailer'], 'puff', 'grump', 'grump', 'grump'],
    },
    rain: { straight: 1 },
  },
  {
    id: 'spiral-low',
    name: 'THE SPIRAL LOW',
    sub: 'WAIT FOR THE ZIG',
    season: 2,
    formation: {
      kind: 'ring',
      rings: [
        { count: 14, radius: 52, kinds: ['puff', 'grump'] },
        { count: 8, radius: 28, kinds: ['drizzler', 'splitter'] },
        { count: 1, radius: 0, kinds: 'thunderhead' },
      ],
      spin: 0.12,
    },
    rain: { straight: 2, sleet: 1 },
  },
  {
    id: 'jet-stream',
    name: 'THE JET STREAM',
    sub: 'EVERY ROW ITS OWN WIND',
    season: 3,
    formation: {
      kind: 'jet',
      cols: 9,
      spacing: 34,
      rows: [
        'anvil',
        ['diver', 'puff'],
        'splitter',
        ['hailer', 'grump'],
        'grump',
      ],
      speeds: [1, -0.75, 1.3, -1, 0.6],
      descendEvery: 10,
    },
    rain: { straight: 1, sleet: 1 },
  },
]

export function weatherFront(wave: number): Front {
  const n = WEATHER_FRONTS.length
  return WEATHER_FRONTS[(((Math.max(1, wave) - 1) % n) + n) % n]!
}

/** Pick a plain cloud's drop kind from the front's rain mix with one roll in [0, 1). */
export function rainKind(mix: RainMix, roll: number): 'straight' | 'sleet' {
  const straight = mix.straight ?? 0
  const sleet = mix.sleet ?? 0
  const total = straight + sleet
  if (total <= 0) return 'straight'
  return roll * total < straight ? 'straight' : 'sleet'
}

// --- drops --------------------------------------------------------------------------------------

/** The four kinds that fall (lightning is a strike: see Strike). */
export type DropKind = 'straight' | 'drizzle' | 'hail' | 'sleet'

export type Drop = {
  kind: DropKind
  x: number
  y: number
  vx: number
  vy: number
  /** Sleet's centre line and zig-zag clock. */
  x0: number
  phase: number
  /** Hail that has already bounced (its next landing melts it). */
  bounced: boolean
}

/** The drizzle leans toward Sunny this fast, until it is this low. */
export const DRIZZLE_SEEK = 0.35
export const DRIZZLE_SEEK_UNTIL = H - 110
export const SLEET_AMP = 9
export const SLEET_PERIOD = 48
export const HAIL_GRAVITY = 0.11
export const HAIL_BOUNCE = 0.6

export function newDrop(
  kind: DropKind,
  x: number,
  y: number,
  speed: number,
): Drop {
  return {
    kind,
    x,
    y,
    vx: 0,
    vy: kind === 'drizzle' ? speed * 0.8 : speed,
    x0: x,
    phase: 0,
    bounced: false,
  }
}

/** A triangle wave: sleet's sideways offset `phase` ticks after it fell. */
export function zigzag(phase: number): number {
  const t = mod(phase, SLEET_PERIOD) / SLEET_PERIOD
  const tri = t < 0.25 ? t * 4 : t < 0.75 ? 2 - t * 4 : t * 4 - 4
  return Math.round(tri * SLEET_AMP)
}

/** Move one drop one tick; `targetX` is Sunny, whom the drizzle leans toward. */
export function stepDrop(d: Drop, targetX: number) {
  switch (d.kind) {
    case 'drizzle':
      if (d.y < DRIZZLE_SEEK_UNTIL)
        d.x += Math.max(-DRIZZLE_SEEK, Math.min(DRIZZLE_SEEK, targetX - d.x))
      d.y += d.vy
      break
    case 'sleet':
      d.phase++
      d.x = d.x0 + zigzag(d.phase)
      d.y += d.vy
      break
    case 'hail':
      d.x += d.vx
      if (d.bounced) d.vy += HAIL_GRAVITY
      d.y += d.vy
      break
    default:
      d.y += d.vy
  }
}

/** Hail's one bounce: back up, kicked away from the middle of the sky. */
export function bounceHail(d: Drop) {
  d.bounced = true
  d.vy = -Math.abs(d.vy) * HAIL_BOUNCE
  d.vx = d.x < W / 2 ? 0.9 : -0.9
}

/** A thunderhead's lightning: its column glows on the ground, then the bolt falls. */
export type Strike = { x: number; tell: number; flash: number }
export const STRIKE_TELL = 60
export const STRIKE_FLASH = 12
export const STRIKE_HALF = 4

// --- the heartbeat ------------------------------------------------------------------------------

/** March intervals (ticks between steps) at which the heartbeat moves up a tempo. */
export const HEARTBEAT_STEPS = [16, 11, 7, 4] as const
export const HEARTBEAT_BPM = [92, 108, 126, 148, 176] as const

function heartbeat(bpm: number): MusicLoop {
  return {
    bpm,
    stepsPerBeat: 2,
    tracks: [
      {
        type: 'triangle',
        vol: 0.08,
        steps:
          'E2 . . . D2 . . . C2 . . . B1 . . . E2 . . . D2 . . . C2 . . . D2 . . .',
      },
      {
        type: 'square',
        vol: 0.018,
        steps:
          '. . G4 . . . E4 . . . A4 . . . G4 . . . G4 . . . B4 . . . C5 - . . B4 .',
      },
      {
        noise: true,
        vol: 0.02,
        steps:
          'x . . . . . x . x . . . . . x . x . . . . . x . x . . . . . x x',
      },
    ],
  }
}

/** The heartbeat loops, slowest first: one object per tempo, so the cabinet swaps them cleanly. */
export const HEARTBEAT_LOOPS: readonly MusicLoop[] =
  HEARTBEAT_BPM.map(heartbeat)

/** Which heartbeat tempo a march interval calls for. */
export function heartbeatTier(stepEvery: number): number {
  const tier = HEARTBEAT_STEPS.findIndex((min) => stepEvery >= min)
  return tier === -1 ? HEARTBEAT_STEPS.length : tier
}
