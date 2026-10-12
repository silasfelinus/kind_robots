// /utils/arcade/batteryMaze/tables.ts
//
// Battery Maze's per-maze tables (conductor kr-arcade/t-039). Every maze plays at a "heat": its
// row here sets every speed, the scatter/chase schedule, how long a power cell makes the gremlins
// sleepy, when each docked gremlin leaves, and when the chaser overclocks. The rows keep rising
// to heat 20, where the cells stop making anyone sleepy and turn into shield cells. The numbers
// are this cabinet's own.

/** Tiles per tick at 100% (8.1 tiles a second). */
export const BASE_SPEED = 0.135

export type HeatRow = {
  heat: number
  /** Robot speed, as a fraction of BASE_SPEED. */
  robot: number
  /** Robot speed while chomping sparks. */
  robotEat: number
  /** Robot speed while the gremlins are sleepy (it has the run of the maze). */
  robotSleepy: number
  gremlin: number
  /** Gremlins crawl through the tunnels. */
  tunnel: number
  sleepyGremlin: number
  /** Ticks a power cell keeps the gremlins sleepy; 0 makes every cell a shield cell. */
  sleepyTicks: number
  /** Scatter, chase, scatter, chase... in ticks; after the last entry they chase for good. */
  schedule: readonly number[]
  /** Sparks eaten before each docked gremlin, in turn, steps out. */
  release: readonly number[]
  /** Ticks without a chomp before the next docked gremlin steps out anyway. */
  idleRelease: number
  /** Sparks left when the chaser overclocks (+5%), then overclocks again (+10%). */
  overclock: readonly [number, number]
}

/** A shield cell's two seconds of safety. */
export const SHIELD_TICKS = 120
/** The overclocked chaser's extra speed, by overclock stage. */
export const OVERCLOCK_BOOST = [1, 1.05, 1.1] as const

const s = (seconds: readonly number[]) => seconds.map((v) => v * 60)
const GENTLE = s([6, 20, 6, 20, 5, 20, 5])
const STEADY = s([6, 22, 5, 22, 4, 40, 2])
const BUSY = s([5, 24, 4, 26, 3, 60, 1])
const LATE = s([4, 28, 3, 30, 1])

// One entry per heat, 1 to 20.
const ROBOT = [
  0.78, 0.82, 0.85, 0.88, 0.9, 0.92, 0.94, 0.96, 0.97, 0.98, 0.99, 1, 1, 1, 1,
  1, 1, 1, 1, 1,
]
const GREMLIN = [
  0.7, 0.74, 0.77, 0.8, 0.83, 0.85, 0.87, 0.89, 0.9, 0.91, 0.92, 0.93, 0.94,
  0.94, 0.95, 0.95, 0.96, 0.96, 0.97, 0.97,
]
const SLEEPY = [
  360, 300, 270, 240, 210, 180, 165, 150, 135, 120, 105, 90, 75, 60, 60, 45, 45,
  30, 30, 0,
]
const RELEASE: ReadonlyArray<readonly number[]> = [
  [0, 20, 45],
  [0, 10, 30],
  [0, 0, 18],
  [0, 0, 8],
]

export const HEAT_TABLE: readonly HeatRow[] = ROBOT.map((robot, i) => {
  const heat = i + 1
  return {
    heat,
    robot,
    robotEat: robot - 0.08,
    robotSleepy: Math.min(1.06, robot + 0.06),
    gremlin: GREMLIN[i]!,
    tunnel: 0.4 + Math.min(0.12, i * 0.008),
    sleepyGremlin: 0.48 + Math.min(0.1, i * 0.006),
    sleepyTicks: SLEEPY[i]!,
    schedule:
      heat === 1 ? GENTLE : heat <= 5 ? STEADY : heat <= 12 ? BUSY : LATE,
    release: RELEASE[Math.min(i, RELEASE.length - 1)]!,
    idleRelease: heat <= 4 ? 240 : heat <= 10 ? 180 : 140,
    overclock: [30 + i * 3, 15 + Math.round(i * 1.5)] as const,
  }
})

export const MAX_HEAT = HEAT_TABLE.length

/** The row for a heat (rows past the last keep the last). */
export function heatRow(heat: number): HeatRow {
  const i = Math.max(1, Math.min(MAX_HEAT, Math.floor(heat))) - 1
  return HEAT_TABLE[i]!
}

/** Which stage of overclock the chaser is in with `left` sparks still to eat. */
export function overclockStage(row: HeatRow, left: number): 0 | 1 | 2 {
  return left <= row.overclock[1] ? 2 : left <= row.overclock[0] ? 1 : 0
}

/** The Friend Train pays this when its power cell runs out. */
export function trainPayout(length: number): number {
  return 500 * length * length
}

/** Bumping a sleepy gremlin: 200, 400, 800, 1,600 within one cell. */
export function bumpPoints(chain: number): number {
  return 100 * 2 ** Math.min(4, Math.max(1, chain))
}

export type Prize = { name: string; points: number; color: string }

/** The roaming prizes, by heat; the last two sit beyond the crown. */
export const PRIZES: readonly Prize[] = [
  { name: 'GEAR', points: 100, color: '#cbd5e1' },
  { name: 'OIL CAN', points: 300, color: '#fbbf24' },
  { name: 'FLOWER', points: 500, color: '#f472b6' },
  { name: 'BOLT', points: 700, color: '#facc15' },
  { name: 'STAR', points: 1000, color: '#fde68a' },
  { name: 'HEART', points: 2000, color: '#fb7185' },
  { name: 'RAINBOW', points: 3000, color: '#a78bfa' },
  { name: 'CROWN', points: 5000, color: '#fcd34d' },
  { name: 'GOLDEN PLUG', points: 7000, color: '#fde047' },
  { name: 'RAINBOW BATTERY', points: 10000, color: '#5eead4' },
]

export function prizeFor(heat: number): number {
  return Math.max(0, Math.min(PRIZES.length - 1, Math.floor(heat) - 1))
}

/** A roaming prize wanders this long before it heads for the way out. */
export const PRIZE_WANDER_TICKS = 60 * 9
/** Roaming prizes amble along at this many tiles a tick. */
export const PRIZE_SPEED = 0.05
/** The share of the maze eaten when each of the maze's two prizes rolls in. */
export const PRIZE_AT = [0.3, 0.68] as const

/** Rewire flips per maze; a power cell tops them back up. */
export const REWIRE_FLIPS = 3

// --- power-ups (slice 2, t-040) -------------------------------------------------------

/** Power-ups roll out of the dock now and then. */
/** The four that roll out anywhere, and the two board tools (Greenhouse, Arcade). */
export type PowerUpKind =
  'magnet' | 'turbo' | 'decoy' | 'freeze' | 'can' | 'lamp'

export const POWER_UPS: Record<
  PowerUpKind,
  { name: string; ticks: number; about: string }
> = {
  magnet: { name: 'MAGNET', ticks: 60 * 8, about: 'SPARKS FLY TO YOU' },
  turbo: { name: 'TURBO WHEELS', ticks: 60 * 6, about: '+25% SPEED' },
  decoy: { name: 'DECOY BOT', ticks: 60 * 8, about: 'GREMLINS CHASE IT' },
  freeze: { name: 'FREEZE POP', ticks: 60 * 4, about: 'GREMLINS FREEZE' },
  can: { name: 'WATERING CAN', ticks: 60 * 8, about: 'THE VINES WITHER' },
  lamp: { name: 'LAMP', ticks: 60 * 10, about: 'A BIGGER LIGHT' },
}
export const POWER_UP_KINDS: readonly PowerUpKind[] = [
  'magnet',
  'turbo',
  'decoy',
  'freeze',
]
/** A board's own tool rolls out this often, against the other four. */
export const TOOL_CHANCE = 0.45
/** Overclocked (New Game+) plays every maze this much hotter: the late tables from the start. */
export const OVERCLOCKED_HEAT = 14
/** The first power-up rolls out this far into a maze, then one every `every` ticks. */
export const POWER_UP_ROLL = { first: 60 * 15, every: 60 * 24, wander: 60 * 8 }
/** A magnet pulls sparks from this many tiles away. */
export const MAGNET_RANGE = 3
export const TURBO_BOOST = 1.25
