// /utils/arcade/seedLander/pilot.ts
//
// Seed Lander's autopilot (conductor kr-arcade/t-069..t-073): the attract demo flies with it, and
// the pilot probes fly real games with it. The game picks a goal (land on a pad, hook a crate,
// set a towed crate down on a pad, fly through a ring); the pilot climbs over the hills between,
// drifts over the goal without overshooting and sets down gently and upright.

import { emptyInput } from '../types'
import type { InputFrame } from '../types'
import type { FlightTier, Pod } from './flight'
import { POD_FEET, canHop } from './flight'
import { highestBetween } from './missions'
import type { Pad, Terrain } from './terrain'

export type PilotGoal =
  | { kind: 'land'; pad: Pad }
  /** Hover just over (x, y) holding DOWN (to hook a crate there). */
  | { kind: 'hook'; x: number; y: number }
  /** Hover just over (x, y), waiting. */
  | { kind: 'hover'; x: number; y: number }
  /** Set a load hanging `hang` below the pod's feet down on a pad. */
  | { kind: 'deliver'; pad: Pad; hang: number }
  /** Fly through a point. */
  | { kind: 'pass'; x: number; y: number }

/** The pilot's controls this tick toward `goal`. */
export function pilotInput(
  pod: Pod,
  terrain: Terrain,
  goal: PilotGoal | null,
  tier: FlightTier,
  /** Tops of things to fly over that are not the ground (windmill sails). */
  over?: (x: number) => number,
  /** The steady sideways push at the pod (wind and gust lanes). */
  push = 0,
): InputFrame {
  const frame = emptyInput()
  const held = frame.held
  if (!goal) return frame
  const target =
    goal.kind === 'land' || goal.kind === 'deliver'
      ? {
          // A moving pad: aim where it will be in a moment.
          x: (goal.pad.x0 + goal.pad.x1) / 2 + goal.pad.vx * 12,
          y: goal.pad.y,
          half: (goal.pad.x1 - goal.pad.x0) / 2,
          vx: goal.pad.vx,
          vy: goal.pad.vy,
        }
      : { x: goal.x, y: goal.y, half: 6, vx: 0, vy: 0 }
  const hang = goal.kind === 'deliver' ? goal.hang : 0
  if (pod.restOn) {
    if (goal.kind === 'land' && pod.restOn === goal.pad.id) return frame
    held.a = true
    return frame
  }
  const dx = target.x - pod.x
  if (pod.chute) {
    held.left = dx < -2
    held.right = dx > 2
    return frame
  }
  if (goal.kind === 'hook') held.down = Math.abs(dx) < 14
  const above = Math.abs(dx) < Math.max(1.5, target.half - 3)
  const feet = pod.y + POD_FEET + hang
  const height = target.y - feet
  const floorAt = (x: number) =>
    Math.min(terrain.floorAt(x, pod.y), over ? over(x) : Infinity)
  const reach = pod.x + Math.sign(dx) * Math.min(Math.abs(dx), 120)
  const ridge = highestBetween(floorAt, pod.x - Math.sign(dx) * 8, reach)
  const cruise =
    Math.min(
      ridge,
      goal.kind === 'land' || goal.kind === 'deliver' ? target.y : Infinity,
    ) -
    26 -
    Math.abs(pod.vx) * 12
  const altitude = floorAt(pod.x) - (pod.y + POD_FEET)
  const near = Math.abs(dx) < 26
  let wantVx = Math.sign(dx) * Math.min(1.3, Math.sqrt(0.01 * Math.abs(dx)))
  if (near)
    wantVx = Math.max(
      -0.6,
      Math.min(0.6, (dx - (pod.vx - target.vx) * 18) / 30),
    )
  wantVx += target.vx
  if (!near && feet > cruise + 8)
    wantVx = Math.max(-0.25, Math.min(0.25, wantVx))
  let wantVy: number
  if (goal.kind === 'pass') {
    // A ring: line up its height on the way, and keep the pace up through it.
    const ty = Math.min(target.y, cruise + 26)
    const off = ty - pod.y
    const arrive = Math.max(12, Math.abs(dx) / Math.max(0.5, Math.abs(pod.vx)))
    wantVy = Math.max(-0.7, Math.min(0.6, off / arrive + off / 60))
    wantVx = Math.sign(dx) * Math.max(0.6, Math.min(1.1, Math.abs(dx) / 45))
    // Close and still off its height: ease up and line up first.
    if (Math.abs(dx) < 40 && Math.abs(off) > 6) wantVx = Math.sign(dx) * 0.25
    if (feet > cruise) wantVy = Math.min(wantVy, -0.3)
  } else if (!near && feet > cruise) wantVy = -0.45
  else if (!near) wantVy = feet < cruise - 40 ? 0.5 : 0.05
  else if (!above) {
    const rim = highestBetween(floorAt, pod.x - Math.sign(dx) * 7, target.x)
    const top = Math.min(rim, target.y)
    wantVy = feet > top - 12 ? -0.3 : feet < top - 30 ? 0.35 : 0
  } else if (Math.abs(pod.vx - target.vx) > 0.28 && height < 40) wantVy = 0
  else
    wantVy = Math.min(
      1.1,
      (goal.kind === 'deliver' ? 0.1 : 0.16) + Math.max(0, height) / 95,
    )
  if (goal.kind === 'hover' && near)
    wantVy = Math.max(-0.5, Math.min(0.4, height / 30))
  if (goal.kind !== 'pass') wantVy += target.vy
  const authority = near ? 0.3 : 0.5
  let wantTilt = Math.max(
    -authority,
    Math.min(authority, (wantVx - pod.vx) * 1.5),
  )
  if (goal.kind !== 'pass' && height < 24 && Math.abs(dx) < target.half + 12) {
    wantTilt = Math.max(-0.12, Math.min(0.12, (wantVx - pod.vx) * 0.8))
    if (above) wantTilt = Math.max(-0.07, Math.min(0.07, wantTilt))
    else wantVy = Math.min(wantVy, -0.05 + target.vy)
  }
  const wall = highestBetween(floorAt, pod.x - 16, pod.x + 16)
  if (!near && pod.y + POD_FEET > wall - 6) {
    wantTilt = Math.max(-0.15, Math.min(0.15, -pod.vx * 1.5))
    wantVy = Math.min(wantVy, -0.4)
  }
  // Lean into a steady push (wind, a gust lane) so hovering holds its place.
  // Near touchdown the lean stays inside safe; at the very end the pod stands up straight.
  const lean =
    goal.kind !== 'pass' && near && height < 24 ? (height < 6 ? 0 : 0.12) : 0.6
  const bias = -Math.max(
    -lean,
    Math.min(lean, Math.asin(Math.max(-0.6, Math.min(0.6, push / 0.011)))),
  )
  wantTilt += bias
  if (wantTilt < pod.tilt - 0.03) held.left = true
  if (wantTilt > pod.tilt + 0.03) held.right = true
  const steer = wantVx - pod.vx
  const leaning =
    Math.abs(pod.tilt) > 0.2 && Math.sign(pod.tilt) === Math.sign(steer)
  if (
    pod.vy > wantVy ||
    (Math.abs(pod.tilt - bias) > 0.3 && pod.vy > 0.15 && altitude < 50) ||
    (leaning && Math.abs(steer) > 0.12 && pod.vy > wantVy - (near ? 0.02 : 0.1))
  )
    held.a = true
  const ahead = floorAt(pod.x + pod.vx * 20) - (pod.y + POD_FEET)
  if (!above && ahead < 10 && pod.vy > 0.6 && canHop(pod, tier)) {
    held.b = true
    frame.pressed.b = true
  }
  return frame
}
