// /utils/arcade/pinball/rules/shots.ts
//
// The shot recognizer (conductor kind-pinball/t-018): turns low-level switch
// traffic into semantic shot events. A shot completes when one ball closes
// its switches in order, each within the window of the last, so a ramp only
// counts when the ball both entered and reached the top, and an orbit only
// counts going up (low then high), never coming back down (high then low).
// Pure data in, data out: rules and tests use it without physics.

import { PHYSICS_HZ } from '../clock'
import type { ShotDef, ShotEvent, SwitchEvent } from '../types'

/** How long a shot's next switch may take, in physics steps. */
export const DEFAULT_WINDOW_TICKS = PHYSICS_HZ * 2

export type ShotProgress = {
  /** Per ball id, per shot id: how many switches are matched and when. */
  balls: Record<number, Record<string, { matched: number; at: number }>>
  /** The last completed shot (for combos), by tick. */
  lastShotAt: number
}

export function initialShotProgress(): ShotProgress {
  return { balls: {}, lastShotAt: -Infinity }
}

/** The switch id an event closes for shot purposes, if any. */
function switchId(event: SwitchEvent): string | null {
  switch (event.type) {
    case 'sensor-enter':
    case 'capture':
    case 'spin':
      return event.id
    default:
      return null
  }
}

/**
 * Feed one switch event at physics step `tick`. Returns the new progress and
 * any shots it completed.
 */
export function recognizeShots(
  shots: ShotDef[],
  progress: ShotProgress,
  event: SwitchEvent,
  tick: number,
  speed = 0,
): { progress: ShotProgress; completed: ShotEvent[] } {
  if (event.type === 'drain') {
    const balls = Object.fromEntries(
      Object.entries(progress.balls).filter(
        ([id]) => Number(id) !== event.ballId,
      ),
    )
    return { progress: { ...progress, balls }, completed: [] }
  }
  const id = switchId(event)
  if (!id) return { progress, completed: [] }
  const ballId = event.ballId
  const mine = { ...(progress.balls[ballId] ?? {}) }
  const completed: ShotEvent[] = []
  let lastShotAt = progress.lastShotAt
  for (const shot of shots) {
    const window = shot.windowTicks ?? DEFAULT_WINDOW_TICKS
    const state = mine[shot.id] ?? { matched: 0, at: -Infinity }
    const expired = tick - state.at > window
    let matched = expired ? 0 : state.matched
    if (shot.sensors[matched] === id) {
      matched++
    } else if (shot.sensors[0] === id) {
      // Starting over at the first switch (a ball that came back down).
      matched = 1
    } else {
      // Unrelated switch: keep progress (other sensors sit along the way).
      continue
    }
    if (matched >= shot.sensors.length) {
      completed.push({
        shotId: shot.id,
        ballId,
        speed,
        comboEligible: shot.kind === 'ramp' || shot.kind === 'orbit',
      })
      lastShotAt = tick
      mine[shot.id] = { matched: 0, at: tick }
    } else {
      mine[shot.id] = { matched, at: tick }
    }
  }
  return {
    progress: { balls: { ...progress.balls, [ballId]: mine }, lastShotAt },
    completed,
  }
}
