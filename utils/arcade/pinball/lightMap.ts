// /utils/arcade/pinball/lightMap.ts
//
// The insert light-map editor's model (conductor zuzu-pinball/t-017): a
// table's inserts, flashers and LED rail laid flat over its painted
// playfield, so lamp positions can be lined up with the art by eye. The
// editor (components/arcade/pinball-light-map.vue) drags inserts around this
// map; these helpers convert between the table's metres and the map's
// pixels, track what moved, and write the moves back as table data to paste
// into the table's source. Pure, so it is tested without a browser.

import type { InsertDef, TableDef } from './types'

/** The table rectangle the map shows, in metres (x, z). */
export type MapBounds = {
  min: readonly [number, number]
  max: readonly [number, number]
}

export type LightMapFlasher = {
  id: string
  at: [number, number]
  color: number
}

export type LightMap = {
  bounds: MapBounds
  /** The painted playfield under the map, when the table has one. */
  art?: string
  inserts: InsertDef[]
  flashers: LightMapFlasher[]
  /** The LED rail's path and where each LED sits on it. */
  rail: { points: Array<[number, number]>; leds: Array<[number, number]> }
}

/** Metres either side of the flippers when a table has no painted art. */
const PAD = 0.03

/** The light map of a table: what the editor draws, over what. */
export function lightMapOf(table: TableDef): LightMap {
  const art = table.art?.playfield
  const bounds: MapBounds = art
    ? { min: art.min, max: art.max }
    : fallbackBounds(table)
  const rail = table.ledRail
  return {
    bounds,
    art: art?.src,
    inserts: (table.inserts ?? []).map((i) => ({ ...i })),
    flashers: (table.flashers ?? []).map((f) => ({
      id: f.id,
      at: [f.at[0], f.at[2]],
      color: f.color,
    })),
    rail: rail
      ? {
          points: rail.points.map((p): [number, number] => [p[0], p[1]]),
          leds: ledPositions(rail.points, rail.count),
        }
      : { points: [], leds: [] },
  }
}

/** Without art: the box round everything the editor draws, padded. */
function fallbackBounds(table: TableDef): MapBounds {
  const xs: number[] = []
  const zs: number[] = []
  for (const i of table.inserts ?? []) {
    xs.push(i.at[0])
    zs.push(i.at[1])
  }
  for (const f of table.flippers) {
    xs.push(f.pivot[0])
    zs.push(f.pivot[2])
  }
  if (!xs.length) return { min: [-0.3, -1], max: [0.3, 0.2] }
  return {
    min: [Math.min(...xs) - PAD, Math.min(...zs) - PAD],
    max: [Math.max(...xs) + PAD, Math.max(...zs) + PAD],
  }
}

/** Each LED's place on the rail: `count` spaced evenly along the path. */
export function ledPositions(
  points: ReadonlyArray<readonly [number, number]>,
  count: number,
): Array<[number, number]> {
  const lengths = points
    .slice(1)
    .map((p, i) => Math.hypot(p[0] - points[i]![0], p[1] - points[i]![1]))
  const total = lengths.reduce((a, b) => a + b, 0)
  const out: Array<[number, number]> = []
  for (let i = 0; i < count && lengths.length; i++) {
    let d = ((i + 0.5) / count) * total
    let seg = 0
    while (seg < lengths.length - 1 && d > lengths[seg]!) d -= lengths[seg++]!
    const a = points[seg]!
    const b = points[seg + 1]!
    const t = lengths[seg]! > 0 ? d / lengths[seg]! : 0
    out.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t])
  }
  return out
}

/**
 * The map's pixel frame for a width in pixels: up the table (-z) is up the
 * screen, and a pixel is the same size both ways.
 */
export function mapFrame(bounds: MapBounds, width: number) {
  const spanX = bounds.max[0] - bounds.min[0]
  const spanZ = bounds.max[1] - bounds.min[1]
  const scale = width / spanX
  return {
    width,
    height: spanZ * scale,
    /** Metres per pixel, for nudges. */
    metresPerPixel: 1 / scale,
    toMap: ([x, z]: readonly [number, number]): [number, number] => [
      (x - bounds.min[0]) * scale,
      (z - bounds.min[1]) * scale,
    ],
    toTable: ([px, py]: readonly [number, number]): [number, number] => [
      bounds.min[0] + px / scale,
      bounds.min[1] + py / scale,
    ],
  }
}

/** Metres a nudge moves an insert: a millimetre, or five with Shift. */
export const NUDGE_M = 0.001
export const NUDGE_FAST_M = 0.005

/** Where an insert goes when nudged by arrow key `key`. */
export function nudged(
  at: readonly [number, number],
  key: 'ArrowLeft' | 'ArrowRight' | 'ArrowUp' | 'ArrowDown',
  fast = false,
): [number, number] {
  const step = fast ? NUDGE_FAST_M : NUDGE_M
  const [x, z] = at
  if (key === 'ArrowLeft') return [x - step, z]
  if (key === 'ArrowRight') return [x + step, z]
  if (key === 'ArrowUp') return [x, z - step]
  return [x, z + step]
}

/** Positions to the millimetre: what the table's source writes. */
export function roundMm(at: readonly [number, number]): [number, number] {
  return [Math.round(at[0] * 1000) / 1000, Math.round(at[1] * 1000) / 1000]
}

export type InsertMove = {
  id: string
  from: [number, number]
  to: [number, number]
}

/** The inserts the editor moved (to the millimetre), in table order. */
export function movedInserts(
  original: readonly InsertDef[],
  edited: readonly InsertDef[],
): InsertMove[] {
  const before = new Map(original.map((i) => [i.id, roundMm(i.at)]))
  const out: InsertMove[] = []
  for (const insert of edited) {
    const from = before.get(insert.id)
    const to = roundMm(insert.at)
    if (from && (from[0] !== to[0] || from[1] !== to[1]))
      out.push({ id: insert.id, from, to })
  }
  return out
}

/** The moves as table data, one `at:` line per insert, to paste back. */
export function insertSnippet(moves: readonly InsertMove[]): string {
  if (!moves.length) return '// No inserts moved.'
  return moves
    .map(
      (m) =>
        `// ${m.id}: was [${m.from[0].toFixed(3)}, ${m.from[1].toFixed(3)}]\nat: [${m.to[0].toFixed(3)}, ${m.to[1].toFixed(3)}],`,
    )
    .join('\n')
}

/** A 0xRRGGBB colour as CSS. */
export function cssColor(color: number): string {
  return `#${color.toString(16).padStart(6, '0')}`
}
