// /utils/arcade/ribbonRiders/arenas.ts
//
// Ribbon Riders' arenas as data (conductor kr-arcade/t-074). An arena is a layout (pillars, gates
// on the beat, turn pads, wrap-round edges, the closing wall), a rival crew, a pickup schedule and
// a floor. Features are written once and mirrored, so a symmetric arena is a few lines. The game
// builds an arena into a terrain grid with buildArena; a new arena is a new entry here, never a
// branch in the update loop.

import type { PickupKind } from './pickups'
import type { RivalKind } from './rivals'
import { GRID, T, idx, type Dir } from './grid'

export type FloorId = 'dusk' | 'teal' | 'violet' | 'pier' | 'gold'

export type Feature =
  /** Solid for good: a lamp post, a booth, a row of crates. */
  | { kind: 'pillar'; x: number; y: number; w?: number; h?: number }
  /**
   * A gate on the beat: a cycle of `every` beats, open for the first `open` of them (shifted by
   * `offset`), flashing for the beat before it shuts.
   */
  | {
      kind: 'gate'
      x: number
      y: number
      w?: number
      h?: number
      every: number
      open: number
      offset?: number
    }
  /** A turn pad: a bike entering it turns to `dir`. */
  | { kind: 'pad'; x: number; y: number; dir: Dir }

/** How features are copied: across x, across y, both (four copies), or turned four ways. */
export type Mirror = 'none' | 'x' | 'y' | 'xy' | 'rot'

export type Spawn = readonly [number, number, Dir]

export type ArenaSpec = {
  id: string
  name: string
  floor: FloorId
  mirror?: Mirror
  features: readonly Feature[]
  /** Edges that wrap round: ride off one side, come in on the other. */
  wrap?: { x?: boolean; y?: boolean }
  /** The closing wall: a cell in from every side each `every` ticks, to `max`; null for none. */
  shrink?: { every: number; max: number } | null
  crew: readonly RivalKind[]
  pickups?: { first: number; every: number; kinds?: readonly PickupKind[] }
  /** Where rivals line up, in crew order (the default lines otherwise). */
  rivalSpawns?: readonly Spawn[]
}

export type Gate = {
  cells: number[]
  every: number
  open: number
  offset: number
}

export type BuiltArena = {
  spec: ArenaSpec
  /** T.* per cell (pads carry their heading: T.PAD + dir). */
  terrain: Uint8Array
  gates: Gate[]
  /** The gate (index into gates) on each gate cell, -1 elsewhere. */
  gateAt: Int16Array
}

/** Riders line up along the bottom, nose up. */
export const RIDER_SPAWNS: readonly Spawn[] = [
  [24, 41, 0],
  [17, 41, 0],
  [31, 41, 0],
  [10, 41, 0],
]
export const RIVAL_SPAWNS: readonly Spawn[] = [
  [24, 6, 2],
  [6, 24, 1],
  [41, 24, 3],
  [11, 9, 2],
  [36, 9, 2],
  [11, 30, 0],
  [36, 30, 0],
  [24, 18, 2],
]

/** Pickups: the first after this many ticks, then one every so often (at most two lit). */
export const DEFAULT_PICKUPS = { first: 60 * 5, every: 60 * 8 } as const
export const MAX_LIT_PICKUPS = 2

type Rect = { x: number; y: number; w: number; h: number; dir?: Dir }

function copies(r: Rect, mirror: Mirror): Rect[] {
  const fx = (q: Rect): Rect => ({
    ...q,
    x: GRID - q.x - q.w,
    dir: q.dir === 1 ? 3 : q.dir === 3 ? 1 : q.dir,
  })
  const fy = (q: Rect): Rect => ({
    ...q,
    y: GRID - q.y - q.h,
    dir: q.dir === 0 ? 2 : q.dir === 2 ? 0 : q.dir,
  })
  const rot = (q: Rect): Rect => ({
    x: GRID - q.y - q.h,
    y: q.x,
    w: q.h,
    h: q.w,
    dir: q.dir === undefined ? undefined : (((q.dir + 1) % 4) as Dir),
  })
  switch (mirror) {
    case 'x':
      return [r, fx(r)]
    case 'y':
      return [r, fy(r)]
    case 'xy':
      return [r, fx(r), fy(r), fx(fy(r))]
    case 'rot': {
      const a = rot(r)
      const b = rot(a)
      return [r, a, b, rot(b)]
    }
    default:
      return [r]
  }
}

/** Lay an arena's features into a fresh terrain grid. Copies landing on one cell merge. */
export function buildArena(spec: ArenaSpec): BuiltArena {
  const terrain = new Uint8Array(GRID * GRID)
  const gateAt = new Int16Array(GRID * GRID).fill(-1)
  const gates: Gate[] = []
  const mirror = spec.mirror ?? 'none'
  for (const f of spec.features) {
    const base: Rect = {
      x: f.x,
      y: f.y,
      w: f.kind === 'pad' ? 1 : (f.w ?? 1),
      h: f.kind === 'pad' ? 1 : (f.h ?? 1),
      dir: f.kind === 'pad' ? f.dir : undefined,
    }
    const seen = new Set<string>()
    for (const r of copies(base, mirror)) {
      const key = `${r.x},${r.y},${r.w},${r.h},${r.dir}`
      if (seen.has(key)) continue
      seen.add(key)
      const gate: Gate | null =
        f.kind === 'gate'
          ? { cells: [], every: f.every, open: f.open, offset: f.offset ?? 0 }
          : null
      for (let y = r.y; y < r.y + r.h; y++) {
        for (let x = r.x; x < r.x + r.w; x++) {
          if (x < 0 || y < 0 || x >= GRID || y >= GRID) continue
          const i = idx(x, y)
          if (f.kind === 'pillar') terrain[i] = T.PILLAR
          else if (f.kind === 'pad') terrain[i] = T.PAD + r.dir!
          else if (gate) {
            terrain[i] = T.GATE
            gateAt[i] = gates.length
            gate.cells.push(i)
          }
        }
      }
      if (gate?.cells.length) gates.push(gate)
    }
  }
  return { spec, terrain, gates, gateAt }
}

/** Is a gate open on this beat? */
export function gateOpen(gate: Gate, beat: number): boolean {
  return (beat + gate.offset) % gate.every < gate.open
}

/** Is a gate in its last open beat, flashing before it shuts? */
export function gateWarning(gate: Gate, beat: number): boolean {
  return (beat + gate.offset) % gate.every === gate.open - 1
}

// --- the Midway: the endless circuit's arenas ----------------------------------------------------

export const MIDWAY: readonly ArenaSpec[] = [
  {
    id: 'square',
    name: 'THE OLD SQUARE',
    floor: 'dusk',
    features: [],
    shrink: { every: 540, max: 14 },
    crew: ['roamer'],
  },
  {
    id: 'lamps',
    name: 'LAMP POST ROW',
    floor: 'teal',
    mirror: 'xy',
    features: [
      { kind: 'pillar', x: 13, y: 13, w: 2, h: 2 },
      { kind: 'pillar', x: 22, y: 13, w: 1, h: 1 },
    ],
    shrink: { every: 540, max: 12 },
    crew: ['roamer', 'cutter'],
  },
  {
    id: 'mirror',
    name: 'HALL OF MIRRORS',
    floor: 'violet',
    mirror: 'x',
    features: [
      { kind: 'pillar', x: 14, y: 8, w: 1, h: 9 },
      { kind: 'pillar', x: 14, y: 31, w: 1, h: 9 },
      { kind: 'pillar', x: 20, y: 23, w: 2, h: 2 },
    ],
    shrink: { every: 520, max: 12 },
    crew: ['copycat', 'roamer'],
    rivalSpawns: [
      [24, 6, 2],
      [8, 24, 1],
      [39, 24, 3],
    ],
  },
  {
    id: 'turnabout',
    name: 'THE TURNABOUT',
    floor: 'gold',
    mirror: 'rot',
    features: [
      { kind: 'pad', x: 12, y: 12, dir: 1 },
      { kind: 'pad', x: 20, y: 6, dir: 2 },
      { kind: 'pillar', x: 21, y: 21, w: 2, h: 2 },
    ],
    shrink: { every: 520, max: 12 },
    crew: ['pacer', 'hugger', 'roamer'],
  },
  {
    id: 'gatehouse',
    name: 'THE GATEHOUSE',
    floor: 'teal',
    mirror: 'x',
    features: [
      { kind: 'pillar', x: 0, y: 23, w: 9, h: 2 },
      { kind: 'gate', x: 9, y: 23, w: 6, h: 2, every: 8, open: 4 },
      { kind: 'pillar', x: 15, y: 23, w: 4, h: 2 },
      { kind: 'gate', x: 19, y: 23, w: 5, h: 2, every: 8, open: 4, offset: 4 },
    ],
    shrink: { every: 520, max: 10 },
    crew: ['dasher', 'cutter', 'hugger'],
    rivalSpawns: [
      [24, 6, 2],
      [8, 12, 1],
      [39, 12, 3],
      [8, 36, 0],
    ],
  },
  {
    id: 'pier',
    name: 'THE PIER LOOP',
    floor: 'pier',
    mirror: 'xy',
    features: [{ kind: 'pillar', x: 15, y: 15, w: 3, h: 3 }],
    wrap: { x: true },
    shrink: null,
    crew: ['roamer', 'pacer', 'dasher', 'copycat'],
  },
]
