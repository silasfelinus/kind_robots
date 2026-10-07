// /utils/arcade/pinball/types.ts
//
// Shared contracts for the 3D pinball engine (conductor kind-pinball/t-004,
// SYSTEM-DESIGN-SPEC.md). Simulation, rules, rendering and presentation are
// separate layers that only talk through these types.
//
// Coordinates are metres in the table's local frame:
//   X  left (-) to right (+) across the playfield
//   Y  height above the playfield surface
//   Z  up-table (-) to down-table (+), toward the player
// The origin is the centre of the flipper line on the playfield plane. The
// table is pitched by `physical.pitchDeg`; physics applies that as a tilted
// gravity vector, and the renderer rotates the table root by the same angle.

export type Vec3 = readonly [number, number, number]

export type MaterialId =
  | 'playfield'
  | 'chrome'
  | 'rubber'
  | 'plastic-clear'
  | 'plastic-printed'
  | 'wood'
  | 'post'

/** A static box: walls, guides, lane dividers, the apron. */
export type BoxCollider = {
  kind: 'box'
  id: string
  /** Centre of the box. */
  at: Vec3
  /** Half extents along X, Y, Z before rotation. */
  half: Vec3
  /** Rotation about the playfield normal (Y), radians. */
  yaw?: number
  material: MaterialId
  restitution?: number
}

/** A static upright cylinder: posts and pop bumper bodies. */
export type PostCollider = {
  kind: 'post'
  id: string
  at: Vec3
  radius: number
  halfHeight: number
  material: MaterialId
  restitution?: number
  /** Kick the ball away on contact (pop bumpers), in metres per second. */
  kick?: number
}

export type ColliderDef = BoxCollider | PostCollider

/** An invisible switch volume that reports the ball passing through. */
export type SensorDef = {
  id: string
  at: Vec3
  half: Vec3
  yaw?: number
}

export type FlipperDef = {
  id: string
  side: 'left' | 'right'
  pivot: Vec3
  length: number
  /** Radius at the pivot end and at the tip. */
  baseRadius: number
  tipRadius: number
  /** Resting and raised angles about Y, radians (0 points along +X). */
  restAngle: number
  activeAngle: number
  /** Time for a full stroke up and for the return. */
  strokeMs: number
  returnMs: number
}

export type CameraPresetId =
  'main' | 'plunge' | 'upper-playfield' | 'multiball' | 'award'

export type CameraPreset = {
  id: CameraPresetId
  /** Camera position and look target, in table-local metres. */
  position: Vec3
  target: Vec3
  fovDeg: number
}

export type ShotDef = {
  id: string
  kind: 'ramp' | 'orbit' | 'scoop' | 'lane' | 'target-bank' | 'spinner'
  /** Sensor ids crossed in order to complete the shot. */
  sensors: string[]
  displayName: string
}

export type TableDef = {
  id: string
  title: string
  physical: {
    widthM: number
    lengthM: number
    pitchDeg: number
    ballRadiusM: number
  }
  cameras: CameraPreset[]
  colliders: ColliderDef[]
  sensors: SensorDef[]
  flippers: FlipperDef[]
  shots: ShotDef[]
  /** Where a new ball sits in the shooter lane, and the lane's launch speed range (m/s). */
  plunger: { rest: Vec3; minSpeed: number; maxSpeed: number }
  /** A ball whose Z passes this line has drained. */
  drainZ: number
  balls: number
}

/** Low-level switch traffic from the physics world. */
export type SwitchEvent =
  | { type: 'sensor-enter'; id: string; ballId: number }
  | { type: 'sensor-exit'; id: string; ballId: number }
  | { type: 'contact'; id: string; ballId: number; impulse: number }
  | { type: 'drain'; ballId: number }

/** What rules consume: a completed shot, never raw coordinates. */
export type ShotEvent = {
  shotId: string
  ballId: number
  speed: number
  comboEligible: boolean
}

/** Requests from rules to the rest of the machine. */
export type RuleEffect =
  | { type: 'score'; points: number }
  | { type: 'sound'; name: string }
  | { type: 'serve-ball' }
  | { type: 'game-over' }
  | { type: 'mechanism'; id: string; action: string; payload?: unknown }
  | { type: 'dmd'; text: string; sub?: string; ms: number }
