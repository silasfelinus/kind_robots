// /utils/arcade/pinball/tables/builders.ts
//
// Geometry helpers for table definitions (conductor kind-pinball/t-018).
// Tables are authored as 2D wall lines and 3D ramp centrelines in metres;
// these turn them into the colliders physics and rendering share.

import type { BoxCollider, MaterialId, MeshCollider, Vec3 } from '../types'

export type Quat = readonly [number, number, number, number]
export type XZ = readonly [number, number]
/** A ramp control point: x, z on the playfield and height above it. */
export type XZH = readonly [number, number, number]

export const WALL_HEIGHT = 0.025
export const WALL_THICKNESS = 0.006

export function yawQuat(theta: number): Quat {
  return [0, Math.sin(theta / 2), 0, Math.cos(theta / 2)]
}

/** Yaw that turns +X toward (dx, dz) on the playfield (+Z is down-table). */
export function yawToward(dx: number, dz: number): number {
  return Math.atan2(-dz, dx)
}

type WallOptions = {
  material?: MaterialId
  thickness?: number
  height?: number
  /** Height of the wall's base above the playfield. */
  base?: number
  restitution?: number
  passDir?: Vec3
  hidden?: boolean
  /** A slingshot face's kick, m/s. */
  kick?: number
}

/** A wall from a to b on the playfield, as a thin upright box. */
export function wall(
  id: string,
  a: XZ,
  b: XZ,
  options: WallOptions = {},
): BoxCollider {
  const material = options.material ?? 'wood'
  const thickness = options.thickness ?? WALL_THICKNESS
  const height = options.height ?? WALL_HEIGHT
  const base = options.base ?? 0
  const dx = b[0] - a[0]
  const dz = b[1] - a[1]
  return {
    kind: 'box',
    id,
    at: [(a[0] + b[0]) / 2, base + height / 2, (a[1] + b[1]) / 2],
    half: [Math.hypot(dx, dz) / 2, height / 2, thickness / 2],
    yaw: yawToward(dx, dz),
    material,
    restitution: options.restitution ?? (material === 'rubber' ? 0.7 : 0.35),
    passDir: options.passDir,
    hidden: options.hidden,
    kick: options.kick,
  }
}

/** A chain of walls through the points, named id-1, id-2 ... */
export function walls(
  id: string,
  points: XZ[],
  options: WallOptions = {},
): BoxCollider[] {
  const out: BoxCollider[] = []
  for (let i = 1; i < points.length; i++) {
    out.push(wall(`${id}-${i}`, points[i - 1]!, points[i]!, options))
  }
  return out
}

/** Catmull-Rom through the control points, sampled about every `step` metres. */
export function smoothPath(points: XZH[], step = 0.018): XZH[] {
  if (points.length < 3) return points
  const out: XZH[] = []
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[Math.max(0, i - 1)]!
    const p1 = points[i]!
    const p2 = points[i + 1]!
    const p3 = points[Math.min(points.length - 1, i + 2)]!
    const length = Math.hypot(p2[0] - p1[0], p2[1] - p1[1], p2[2] - p1[2])
    const n = Math.max(1, Math.ceil(length / step))
    for (let k = 0; k < n; k++) {
      const t = k / n
      const t2 = t * t
      const t3 = t2 * t
      const c = (j: 0 | 1 | 2) =>
        0.5 *
        (2 * p1[j] +
          (-p0[j] + p2[j]) * t +
          (2 * p0[j] - 5 * p1[j] + 4 * p2[j] - p3[j]) * t2 +
          (-p0[j] + 3 * p1[j] - 3 * p2[j] + p3[j]) * t3)
      out.push([c(0), c(1), c(2)])
    }
  }
  out.push(points[points.length - 1]!)
  return out
}

export type RampOptions = {
  /** Inside width between the rails. */
  width?: number
  railHeight?: number
  floorMaterial?: MaterialId
  /** Run-in over which the floor curves up from flat, in metres. */
  entryLength?: number
  /**
   * A clear cover over part of the ramp, from and to these distances along
   * it (metres): a fast ball cresting the climb cannot fly out of the turn.
   */
  cover?: readonly [number, number]
}

/** Gap between a cover and the ball's top, in metres. */
const COVER_GAP = 0.004

/** Below this floor height no ball fits underneath, so rails reach the playfield. */
const CLEARANCE = 0.032

/**
 * Reshape the first `length` metres of a ramp so it leaves the playfield
 * flat and curves up into the authored slope. A ramp that starts at an angle
 * is a step the ball hits: it loses most of its speed and hops.
 */
function easeEntry(path: XZH[], length: number): XZH[] {
  if (path.length < 2 || length <= 0) return path
  const dist = [0]
  for (let i = 1; i < path.length; i++) {
    const a = path[i - 1]!
    const b = path[i]!
    dist.push(dist[i - 1]! + Math.hypot(b[0] - a[0], b[1] - a[1]))
  }
  const end = dist.findIndex((d) => d >= length)
  if (end <= 0) return path
  const span = dist[end]!
  const h0 = path[0]![2]
  const h1 = path[end]![2]
  const next = path[Math.min(end + 1, path.length - 1)]!
  const run = Math.hypot(next[0] - path[end]![0], next[1] - path[end]![1]) || 1
  const slope = end + 1 < path.length ? (next[2] - h1) / run : 0
  return path.map((p, i): XZH => {
    if (i >= end) return p
    // Cubic Hermite: flat at the mouth, matching height and slope at `end`.
    const t = dist[i]! / span
    const t2 = t * t
    const t3 = t2 * t
    const h =
      h0 * (2 * t3 - 3 * t2 + 1) +
      h1 * (3 * t2 - 2 * t3) +
      slope * span * (t3 - t2)
    return [p[0], p[1], h]
  })
}

/** Unit horizontal vector to the right of travel at each path point. */
function sides(path: XZH[]): Array<[number, number]> {
  return path.map((_, i) => {
    const a = path[Math.max(0, i - 1)]!
    const b = path[Math.min(path.length - 1, i + 1)]!
    const dx = b[0] - a[0]
    const dz = b[1] - a[1]
    const flat = Math.hypot(dx, dz) || 1
    return [-dz / flat, dx / flat]
  })
}

/**
 * A ramp along a 3D centreline: a seamless floor mesh the ball rolls on and a
 * chrome rail each side. The first point is the mouth, at height 0; the floor
 * leaves the playfield flat there and curves up into the climb.
 */
export function ramp(
  id: string,
  points: XZH[],
  options: RampOptions = {},
): MeshCollider[] {
  const width = options.width ?? 0.042
  const railHeight = options.railHeight ?? 0.022
  const path = easeEntry(smoothPath(points, 0.01), options.entryLength ?? 0.08)
  const side = sides(path)
  // The floor runs under the rails so there is no gap at its edges.
  const half = width / 2 + 0.002
  const floor: number[] = []
  const floorIdx: number[] = []
  path.forEach((p, i) => {
    const [sx, sz] = side[i]!
    floor.push(p[0] - sx * half, p[2], p[1] - sz * half)
    floor.push(p[0] + sx * half, p[2], p[1] + sz * half)
    if (i === 0) return
    const l0 = (i - 1) * 2
    const l1 = i * 2
    // Wound so the faces point up.
    floorIdx.push(l0, l0 + 1, l1, l0 + 1, l1 + 1, l1)
  })
  const rail = (sign: -1 | 1): MeshCollider => {
    const vertices: number[] = []
    const indices: number[] = []
    path.forEach((p, i) => {
      const [sx, sz] = side[i]!
      const x = p[0] + sign * sx * (width / 2)
      const z = p[1] + sign * sz * (width / 2)
      const bottom = p[2] < CLEARANCE ? Math.min(0, p[2]) : p[2] - 0.004
      vertices.push(x, bottom, z, x, p[2] + railHeight, z)
      if (i === 0) return
      const b0 = (i - 1) * 2
      const b1 = i * 2
      indices.push(b0, b0 + 1, b1, b0 + 1, b1 + 1, b1)
    })
    return {
      kind: 'mesh',
      id: `${id}-rail-${sign < 0 ? 'l' : 'r'}`,
      vertices,
      indices,
      material: 'chrome',
      restitution: 0.3,
      twoSided: true,
    }
  }
  const p0 = path[0]!
  const p1 = path[1] ?? p0
  const run = Math.hypot(p1[0] - p0[0], p1[1] - p0[1]) || 1
  return [
    {
      kind: 'mesh',
      id: `${id}-floor`,
      vertices: floor,
      indices: floorIdx,
      material: options.floorMaterial ?? 'ramp',
      restitution: 0.15,
      mouth: {
        at: [p0[0], p0[2], p0[1]],
        dir: [(p1[0] - p0[0]) / run, 0, (p1[1] - p0[1]) / run],
        radius: 0.06,
      },
    },
    rail(-1),
    rail(1),
    ...(options.cover ? [cover(id, path, side, width, options.cover)] : []),
  ]
}

/** A clear roof over the stretch of a ramp between two distances along it. */
function cover(
  id: string,
  path: XZH[],
  side: Array<[number, number]>,
  width: number,
  [from, to]: readonly [number, number],
): MeshCollider {
  const vertices: number[] = []
  const indices: number[] = []
  const lift = 2 * 0.0135 + COVER_GAP
  let dist = 0
  let n = 0
  path.forEach((p, i) => {
    if (i > 0) {
      const a = path[i - 1]!
      dist += Math.hypot(p[0] - a[0], p[1] - a[1])
    }
    if (dist < from || dist > to) return
    const [sx, sz] = side[i]!
    const half = width / 2
    vertices.push(p[0] - sx * half, p[2] + lift, p[1] - sz * half)
    vertices.push(p[0] + sx * half, p[2] + lift, p[1] + sz * half)
    if (n > 0) {
      const l0 = (n - 1) * 2
      const l1 = n * 2
      indices.push(l0, l1, l0 + 1, l0 + 1, l1, l1 + 1)
    }
    n++
  })
  return {
    kind: 'mesh',
    id: `${id}-cover`,
    vertices,
    indices,
    material: 'plastic-clear',
    restitution: 0.2,
    twoSided: true,
  }
}

/** Mirror a 2D point across the table's centre line (x = 0). */
export function mirror(p: XZ): [number, number] {
  return [-p[0], p[1]]
}

export function mirror3(p: XZH): [number, number, number] {
  return [-p[0], p[1], p[2]]
}
