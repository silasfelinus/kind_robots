// /utils/arcade/pinball/tuning/aim.ts
//
// The aiming chart (conductor kind-pinball/t-013): from a ball cradled on a
// held flipper, what each release timing makes. A player drops the flipper,
// lets the ball roll toward the tip, and flips; the delay decides where the
// ball goes. Measured on the real physics, so the chart is also evidence of
// the table's shot geometry: which shots each flipper can make at all, and
// how wide each one's timing window is.

import { PHYSICS_HZ } from '../clock'
import { PinballPhysics, type RapierModule } from '../physics/world'
import { initialShotProgress, recognizeShots } from '../rules/shots'
import type { TableDef } from '../types'

export type FlipperSide = 'left' | 'right'

/** What a release delay (arcade ticks) made: a shot id, or null. */
export type AimChart = Record<FlipperSide, Array<string | null>>

/**
 * How the ball reaches the flipper: resting in a cradle and released, or
 * rolling down the inlane onto it (the commonest live shot).
 */
export type Feed = 'cradle' | 'inlane'

/** Release delays tried, in arcade ticks (60 a second). */
export const AIM_DELAYS = 90
/** How long the flipper stays up after the flip. */
export const AIM_HOLD_TICKS = 15
/** Where a ball comes to rest on a held flipper (from the pivot, per side). */
export const CRADLE_OFFSET: [number, number] = [0, -0.027]
const STEPS_PER_TICK = PHYSICS_HZ / 60
/** How long after the flip a shot still counts as this flip's. */
const AIM_WATCH_TICKS = 60 * 4

/** Put a ball down the inlane of `side`, toward the resting flipper. */
export function inlane(physics: PinballPhysics, side: FlipperSide) {
  const s = side === 'left' ? -1 : 1
  physics.setFlipper(side, false)
  physics.serveBall([0.19 * s, 0.0136, -0.16], [0, 0, 0.35])
}

/** Serve a ball and let it settle on the held flipper of `side`. */
export function cradle(physics: PinballPhysics, side: FlipperSide) {
  const x = side === 'left' ? -0.06 : 0.06
  physics.serveBall([x, 0.0136, -0.15], [0, 0, 0])
  physics.setFlipper(side, true)
  for (let i = 0; i < PHYSICS_HZ * 2.5; i++) physics.step()
}

/** The first shot a released, then flipped, cradled ball makes. */
export function aimedShot(
  R: RapierModule,
  table: TableDef,
  side: FlipperSide,
  delay: number,
  feed: Feed = 'cradle',
): string | null {
  const physics = new PinballPhysics(R, table)
  try {
    if (feed === 'cradle') {
      cradle(physics, side)
      physics.setFlipper(side, false)
    } else {
      inlane(physics, side)
    }
    let progress = initialShotProgress()
    let step = 0
    for (let t = 0; t < delay + AIM_WATCH_TICKS; t++) {
      if (t === delay) physics.setFlipper(side, true)
      if (t === delay + AIM_HOLD_TICKS) physics.setFlipper(side, false)
      for (let k = 0; k < STEPS_PER_TICK; k++) {
        step++
        for (const event of physics.step()) {
          if (event.type === 'drain') return null
          const r = recognizeShots(table.shots, progress, event, step)
          progress = r.progress
          if (r.completed.length && t >= delay) return r.completed[0]!.shotId
        }
      }
    }
    return null
  } finally {
    physics.dispose()
  }
}

/** The whole chart: every delay on both main flippers. */
export function measureAimChart(
  R: RapierModule,
  table: TableDef,
  feed: Feed = 'cradle',
): AimChart {
  const chart: AimChart = { left: [], right: [] }
  for (const side of ['left', 'right'] as const)
    for (let delay = 0; delay < AIM_DELAYS; delay++)
      chart[side].push(aimedShot(R, table, side, delay, feed))
  return chart
}

/** Release delays on `side` that make `shot`. */
export function delaysFor(
  chart: AimChart,
  side: FlipperSide,
  shot: string,
): number[] {
  return chart[side].flatMap((made, delay) => (made === shot ? [delay] : []))
}
