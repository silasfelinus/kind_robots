// /utils/arcade/pinball/render/cameraMode.ts
//
// The player's camera views (conductor kind-pinball/t-021), FX3-style:
//   dynamic  a closer camera that follows the ball up the table and settles
//            on the flippers when the ball comes down; with several balls it
//            frames them all (the lowest first), or the whole table when they
//            are too spread out for a close view
//   flippers close and low over the flipper zone; it follows a ball only
//            while that ball is high
//   full     the whole table (the preset fit of render/camera.ts)
//
// Pure maths in table space: each tick gives the box the camera must frame
// (null for the whole table), eased so the view never jerks, and always
// containing every live ball. The scene fits a camera to that box.

import type { BallView } from '../physics/world'
import type { TableDef, Vec3 } from '../types'

export type CameraMode = 'dynamic' | 'flippers' | 'full'

export const CAMERA_MODES: readonly CameraMode[] = [
  'dynamic',
  'flippers',
  'full',
]
export const DEFAULT_CAMERA_MODE: CameraMode = 'dynamic'

export const CAMERA_MODE_LABELS: Record<CameraMode, string> = {
  dynamic: 'DYNAMIC VIEW',
  flippers: 'FLIPPER VIEW',
  full: 'FULL TABLE',
}

export function isCameraMode(value: unknown): value is CameraMode {
  return CAMERA_MODES.includes(value as CameraMode)
}

/** The mode after this one, wrapping around. */
export function nextCameraMode(mode: CameraMode): CameraMode {
  return CAMERA_MODES[(CAMERA_MODES.indexOf(mode) + 1) % CAMERA_MODES.length]!
}

/** What the scene frames: a box on the table, and how low the eye sits. */
export type FollowShot = {
  frame: { min: Vec3; max: Vec3 }
  /** Scale on the eye's height over the table (1 = the preset's own angle). */
  lift: number
}

/** The close view shows this fraction of the table's width. */
const DYNAMIC_WIDTH = 0.7
/** Half the depth of a close view, metres up-table. */
const DYNAMIC_HALF_DEPTH = 0.3
/** A flipper view shows this fraction of the width, and half this depth. */
const FLIPPER_WIDTH = 0.92
const FLIPPER_HALF_DEPTH = 0.24
const FLIPPER_LIFT = 0.7
/** The close view sits this far above the flipper line when settled. */
const SETTLE_AHEAD = 0.06
/** Balls spread over this fraction of the close view or more: show it all. */
const SPREAD_LIMIT = 0.85
/** Metres kept around a ball inside the frame. */
const BALL_MARGIN = 0.05
/** Fraction of the way to the target box each tick (never a snap). */
const EASE = 0.14

type Box = { x0: number; x1: number; z0: number; z1: number }

const clamp = (v: number, lo: number, hi: number) =>
  Math.min(hi, Math.max(lo, v))

export class CameraFollow {
  private readonly bounds: Box
  private readonly flipperZ: number
  private lift = 1
  private box: Box
  private shown = false

  constructor(table: TableDef) {
    const main = table.cameras.find((c) => c.id === 'main') ?? table.cameras[0]!
    this.bounds = {
      x0: main.frame.min[0],
      x1: main.frame.max[0],
      z0: main.frame.min[2],
      z1: main.frame.max[2],
    }
    const pivots = table.flippers.map((f) => f.pivot[2])
    this.flipperZ = pivots.length
      ? pivots.reduce((a, b) => a + b, 0) / pivots.length
      : this.bounds.z1 - 0.15
    this.box = { ...this.bounds }
  }

  /** Forget where the camera was (a new ball, a new game). */
  reset() {
    this.box = { ...this.bounds }
    this.lift = 1
    this.shown = false
  }

  /** The box the mode wants right now, before easing. */
  target(mode: CameraMode, balls: readonly BallView[]): Box & { lift: number } {
    const b = this.bounds
    const width = b.x1 - b.x0
    const cx = (b.x0 + b.x1) / 2
    const live = balls
    if (mode === 'full') return { ...b, lift: 1 }

    const zs = live.map((ball) => ball.position[2])
    const xs = live.map((ball) => ball.position[0])
    const lowest = zs.length ? Math.max(...zs) : this.flipperZ
    const highest = zs.length ? Math.min(...zs) : this.flipperZ

    if (mode === 'flippers') {
      const halfW = (width * FLIPPER_WIDTH) / 2
      const settled = this.flipperZ - 0.04
      // High balls pull the view up; it never lets the ball out of the top.
      const zc = Math.min(settled, highest + FLIPPER_HALF_DEPTH - BALL_MARGIN)
      return this.fit(cx, zc, halfW, FLIPPER_HALF_DEPTH, FLIPPER_LIFT)
    }

    const halfW = (width * DYNAMIC_WIDTH) / 2
    if (!live.length) {
      return this.fit(
        cx,
        this.flipperZ - SETTLE_AHEAD,
        halfW,
        DYNAMIC_HALF_DEPTH,
        1,
      )
    }
    const spreadX = Math.max(...xs) - Math.min(...xs) + 2 * BALL_MARGIN
    const spreadZ = lowest - highest + 2 * BALL_MARGIN
    if (
      spreadX > 2 * halfW * SPREAD_LIMIT ||
      spreadZ > 2 * DYNAMIC_HALF_DEPTH
    ) {
      return { ...b, lift: 1 }
    }
    // Follow the lowest ball up the table; settle on the flippers below.
    const zc = Math.min(
      this.flipperZ - SETTLE_AHEAD,
      (lowest + highest) / 2 - 0.04,
    )
    const bx = (Math.min(...xs) + Math.max(...xs)) / 2
    const xc = cx + (bx - cx) * 0.6
    return this.fit(xc, zc, halfW, DYNAMIC_HALF_DEPTH, 1)
  }

  /** A box around (cx, zc), kept inside the table. */
  private fit(
    cx: number,
    zc: number,
    halfW: number,
    halfD: number,
    lift: number,
  ): Box & { lift: number } {
    const b = this.bounds
    const x = clamp(cx, b.x0 + halfW, b.x1 - halfW)
    const z = clamp(zc, b.z0 + halfD, b.z1 - halfD)
    return { x0: x - halfW, x1: x + halfW, z0: z - halfD, z1: z + halfD, lift }
  }

  /**
   * One tick: ease toward the mode's box, then widen it just enough that no
   * live ball is ever outside it. Null means the whole table (the preset).
   */
  step(mode: CameraMode, balls: readonly BallView[]): FollowShot | null {
    const t = this.target(mode, balls)
    if (!this.shown && mode === 'full') return null
    this.box = {
      x0: this.box.x0 + (t.x0 - this.box.x0) * EASE,
      x1: this.box.x1 + (t.x1 - this.box.x1) * EASE,
      z0: this.box.z0 + (t.z0 - this.box.z0) * EASE,
      z1: this.box.z1 + (t.z1 - this.box.z1) * EASE,
    }
    this.lift += (t.lift - this.lift) * EASE
    const box = this.box
    for (const ball of balls) {
      const [x, , z] = ball.position
      box.x0 = Math.min(box.x0, x - BALL_MARGIN)
      box.x1 = Math.max(box.x1, x + BALL_MARGIN)
      box.z0 = Math.min(box.z0, z - BALL_MARGIN)
      box.z1 = Math.max(box.z1, z + BALL_MARGIN)
    }
    const b = this.bounds
    box.x0 = Math.max(box.x0, b.x0)
    box.x1 = Math.min(box.x1, b.x1)
    box.z0 = Math.max(box.z0, b.z0)
    box.z1 = Math.min(box.z1, b.z1)
    // Back at the whole table: hand the framing back to the preset.
    const whole =
      mode === 'full' &&
      Math.abs(box.x0 - b.x0) + Math.abs(box.x1 - b.x1) < 0.004 &&
      Math.abs(box.z0 - b.z0) + Math.abs(box.z1 - b.z1) < 0.004
    this.shown = !whole
    if (whole) return null
    return {
      frame: { min: [box.x0, 0, box.z0], max: [box.x1, 0.03, box.z1] },
      lift: this.lift,
    }
  }
}
