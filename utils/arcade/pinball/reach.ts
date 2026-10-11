// /utils/arcade/pinball/reach.ts
//
// Where a ball can go (conductor kind-pinball/t-034): a flood fill over the
// playfield, on a grid of small cells, of every place a ball's centre can
// reach from where balls enter play. Scenery may stand only where it cannot,
// so a prop never sits in a ball's way and play is unchanged by dressing.
//
// It errs toward reachable: ramps, doors and one-way gates never block, and
// every wall low enough for the ball to meet does. Pure, so tests can run it.

import type { BoxCollider, TableDef } from './types'

export type ReachMap = {
  x0: number
  z0: number
  cell: number
  cols: number
  rows: number
  /** 1 where a ball's centre can reach. */
  reach: Uint8Array
}

/** Grid spacing, metres: well under a ball's radius. */
const CELL = 0.002

/** A wall the ball meets: on the playfield and lower than the ball's top. */
function isWall(def: BoxCollider, ballR: number): boolean {
  return (
    def.material !== 'playfield' &&
    !def.passDir &&
    def.at[1] - def.half[1] < ballR * 2 &&
    def.at[1] + def.half[1] > 0.002
  )
}

/** The box's yaw, from its quaternion when it has one. */
function yawOf(def: BoxCollider): number {
  if (!def.quat) return def.yaw ?? 0
  const [x, y, z, w] = def.quat
  // The box's local +X carried into the world, flattened onto the table.
  const ax = 1 - 2 * (y * y + z * z)
  const az = 2 * (x * z - w * y)
  return Math.atan2(-az, ax)
}

/** Every place a ball's centre can reach on the table, from where balls enter. */
export function reachMap(table: TableDef, cell = CELL): ReachMap {
  const ballR = table.physical.ballRadiusM
  const walls = table.colliders.filter(
    (c): c is BoxCollider => c.kind === 'box' && isWall(c, ballR),
  )
  const posts = table.colliders.filter((c) => c.kind === 'post')
  const floors = table.colliders.filter(
    (c): c is BoxCollider => c.kind === 'box' && c.material === 'playfield',
  )
  let x0 = Infinity
  let x1 = -Infinity
  let z0 = Infinity
  let z1 = -Infinity
  for (const f of floors) {
    x0 = Math.min(x0, f.at[0] - f.half[0])
    x1 = Math.max(x1, f.at[0] + f.half[0])
    z0 = Math.min(z0, f.at[2] - f.half[2])
    z1 = Math.max(z1, f.at[2] + f.half[2])
  }
  const cols = Math.ceil((x1 - x0) / cell)
  const rows = Math.ceil((z1 - z0) / cell)
  const blocked = new Uint8Array(cols * rows)
  const onFloor = new Uint8Array(cols * rows)
  const centre = (i: number, j: number) => [
    x0 + (i + 0.5) * cell,
    z0 + (j + 0.5) * cell,
  ]
  for (let j = 0; j < rows; j++)
    for (let i = 0; i < cols; i++) {
      const [x, z] = centre(i, j) as [number, number]
      const k = j * cols + i
      onFloor[k] = floors.some(
        (f) =>
          Math.abs(x - f.at[0]) <= f.half[0] - ballR &&
          Math.abs(z - f.at[2]) <= f.half[2] - ballR,
      )
        ? 1
        : 0
    }
  // Each wall's footprint, grown by the ball's radius: no centre goes there.
  for (const w of walls) {
    const yaw = yawOf(w)
    const c = Math.cos(yaw)
    const s = Math.sin(yaw)
    const hx = w.half[0] + ballR
    const hz = w.half[2] + ballR
    const reach = Math.hypot(hx, hz)
    const i0 = Math.max(0, Math.floor((w.at[0] - reach - x0) / cell))
    const i1 = Math.min(cols - 1, Math.ceil((w.at[0] + reach - x0) / cell))
    const j0 = Math.max(0, Math.floor((w.at[2] - reach - z0) / cell))
    const j1 = Math.min(rows - 1, Math.ceil((w.at[2] + reach - z0) / cell))
    for (let j = j0; j <= j1; j++)
      for (let i = i0; i <= i1; i++) {
        const [x, z] = centre(i, j) as [number, number]
        const dx = x - w.at[0]
        const dz = z - w.at[2]
        // Into the box's frame: yaw turns +X toward -Z.
        const lx = dx * c - dz * s
        const lz = dx * s + dz * c
        if (Math.abs(lx) <= hx && Math.abs(lz) <= hz) blocked[j * cols + i] = 1
      }
  }
  for (const p of posts) {
    const r = p.radius + ballR
    const i0 = Math.max(0, Math.floor((p.at[0] - r - x0) / cell))
    const i1 = Math.min(cols - 1, Math.ceil((p.at[0] + r - x0) / cell))
    const j0 = Math.max(0, Math.floor((p.at[2] - r - z0) / cell))
    const j1 = Math.min(rows - 1, Math.ceil((p.at[2] + r - z0) / cell))
    for (let j = j0; j <= j1; j++)
      for (let i = i0; i <= i1; i++) {
        const [x, z] = centre(i, j) as [number, number]
        if (Math.hypot(x - p.at[0], z - p.at[2]) <= r) blocked[j * cols + i] = 1
      }
  }
  // Balls enter at the plunger, and at every scoop's and kicker's eject.
  const seeds: Array<readonly [number, number]> = [
    [table.plunger.rest[0], table.plunger.rest[2]],
    ...table.scoops.map((s) => [s.eject.at[0], s.eject.at[2]] as const),
    ...(table.kickers ?? []).map((k) => [k.at[0], k.at[2]] as const),
  ]
  const reach = new Uint8Array(cols * rows)
  const queue: number[] = []
  for (const [x, z] of seeds) {
    const i = Math.floor((x - x0) / cell)
    const j = Math.floor((z - z0) / cell)
    if (i < 0 || j < 0 || i >= cols || j >= rows) continue
    const k = j * cols + i
    if (!reach[k]) {
      reach[k] = 1
      queue.push(k)
    }
  }
  while (queue.length) {
    const k = queue.pop()!
    const i = k % cols
    const j = (k - i) / cols
    for (const [di, dj] of [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ] as const) {
      const ni = i + di
      const nj = j + dj
      if (ni < 0 || nj < 0 || ni >= cols || nj >= rows) continue
      const n = nj * cols + ni
      if (reach[n] || blocked[n] || !onFloor[n]) continue
      reach[n] = 1
      queue.push(n)
    }
  }
  return { x0, z0, cell, cols, rows, reach }
}

/** Whether a ball's centre can come within `radius` of (x, z). */
export function reachesNear(
  map: ReachMap,
  x: number,
  z: number,
  radius: number,
): boolean {
  const { x0, z0, cell, cols, rows, reach } = map
  const i0 = Math.max(0, Math.floor((x - radius - x0) / cell))
  const i1 = Math.min(cols - 1, Math.ceil((x + radius - x0) / cell))
  const j0 = Math.max(0, Math.floor((z - radius - z0) / cell))
  const j1 = Math.min(rows - 1, Math.ceil((z + radius - z0) / cell))
  for (let j = j0; j <= j1; j++)
    for (let i = i0; i <= i1; i++) {
      if (!reach[j * cols + i]) continue
      const cx = x0 + (i + 0.5) * cell
      const cz = z0 + (j + 0.5) * cell
      if (Math.hypot(cx - x, cz - z) <= radius) return true
    }
  return false
}
