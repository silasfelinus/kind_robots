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

import type { DmdSceneId } from './dmdQueue'

export type Vec3 = readonly [number, number, number]

export type MaterialId =
  | 'playfield'
  | 'chrome'
  | 'rubber'
  | 'plastic-clear'
  | 'plastic-printed'
  | 'wood'
  | 'post'
  | 'ramp'
  | 'cabinet'

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
  /** Full orientation (x, y, z, w); overrides yaw. Ramps use it to tilt. */
  quat?: readonly [number, number, number, number]
  material: MaterialId
  restitution?: number
  /**
   * A one-way gate: the ball passes freely while moving along this
   * direction (XZ) and bounces off when moving against it.
   */
  passDir?: Vec3
  /** Not drawn (glass, invisible stops). */
  hidden?: boolean
  /**
   * A slingshot face: a ball that hits it is kicked off along the face's
   * normal at this speed (m/s), as the sling's arm fires.
   */
  kick?: number
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

/**
 * A static triangle mesh: ramp floors and rails. One mesh per surface keeps
 * it seamless, so the ball does not catch on the joints a chain of boxes has.
 */
export type MeshCollider = {
  kind: 'mesh'
  id: string
  /** Vertex positions as x, y, z triples, in table space. */
  vertices: number[]
  /** Triangles as vertex index triples. */
  indices: number[]
  material: MaterialId
  restitution?: number
  /** Collide from both sides (rails); floors only push the ball up. */
  twoSided?: boolean
  /**
   * A ramp mouth. The mesh ignores a ball near `at` until the ball's centre
   * has crossed it along `dir` (XZ), so the floor's leading edge, flush with
   * the playfield, never bumps a ball rolling up to it.
   */
  mouth?: { at: Vec3; dir: Vec3; radius: number }
  hidden?: boolean
}

export type ColliderDef = BoxCollider | PostCollider | MeshCollider

/** An invisible switch volume that reports the ball passing through. */
export type SensorDef = {
  id: string
  at: Vec3
  half: Vec3
  yaw?: number
}

/** A drop target: knocked down by a hit, raised again by a mechanism. */
export type DropTargetDef = {
  id: string
  bank: string
  at: Vec3
  half: Vec3
  yaw?: number
  /** A standup: reports each hit and never drops. */
  standup?: boolean
}

/**
 * A two-state mechanism the rules move: a secret door, a diverter. Each
 * state has its own walls, and only the current state's walls are solid
 * and drawn.
 */
export type DoorDef = {
  id: string
  closed: BoxCollider[]
  open: BoxCollider[]
}

/** A motorised toy: arms on a hub that turn at a steady rate and bat the ball. */
export type ToyDef = {
  id: string
  /** The hub, on the playfield. */
  at: Vec3
  arms: number
  /** Each arm's half extents; arm i points out from the hub along its +X. */
  armHalf: Vec3
  /** Radians per second about the playfield normal. */
  spin: number
  material: MaterialId
}

/**
 * A kicker under a lane: a sensor box the rules can fire, sending any ball in
 * it off at `velocity` (the outlane kickback).
 */
export type KickerDef = {
  id: string
  at: Vec3
  half: Vec3
  velocity: Vec3
}

/** A named region of the table (XZ), so the camera can follow the balls into it. */
export type ZoneDef = {
  id: string
  min: readonly [number, number]
  max: readonly [number, number]
}

/**
 * A solid the renderer draws between the main camera and a hidden area (the
 * backbox in front of the sub-table). It fades out while the camera visits
 * the area behind it. Drawn only; the physics never sees it.
 */
export type OccluderDef = {
  id: string
  at: Vec3
  half: Vec3
  /** The camera preset that sees through it. */
  fadeFor: CameraPresetId
}

/**
 * A scoop or saucer: a ball that enters slowly enough is captured, held,
 * then kicked out. A subway scoop sends its ball to another scoop's kicker.
 */
export type ScoopDef = {
  id: string
  at: Vec3
  /** Radius of the capture zone around `at`. */
  radius: number
  /** Faster balls roll over (saucers); Infinity always captures (holes). */
  captureMaxSpeed: number
  holdMs: number
  eject: { at: Vec3; velocity: Vec3 }
  /** Eject from this other scoop's kicker instead (a subway). */
  subwayTo?: string
  /** Not drawn: a hole under a plastic, or a kicker the ball arrives by. */
  hidden?: boolean
}

/** A spinner: a sensor gate across a lane that spins when the ball passes. */
export type SpinnerDef = {
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
  'main' | 'plunge' | 'upper-playfield' | 'multiball' | 'award' | 'sub-table'

export type CameraPreset = {
  id: CameraPresetId
  /**
   * Camera position and look target, in table-local metres. Only the
   * direction from target to position is kept: the renderer pulls the
   * camera back until `frame` fits the screen (render/camera.ts).
   */
  position: Vec3
  target: Vec3
  fovDeg: number
  /** The box this preset must show, in table-local metres. */
  frame: { min: Vec3; max: Vec3 }
  /** Points the camera must also keep on screen (the DMD in the backbox). */
  include?: Vec3[]
  /** A tall (phone) screen's eye: closer to top-down so the table fills it. */
  portrait?: Vec3
  portraitFovDeg?: number
}

/**
 * A lamp's state, as rules ask for it: unlit (the plastic still shows its
 * colour), lit, or flashing for attention.
 */
export type LampLevel = 'off' | 'on' | 'blink'

/**
 * A playfield insert: translucent plastic set flush in the playfield with a
 * lamp under it. Shot arrows name their shot so a made shot flashes them.
 */
export type InsertDef = {
  id: string
  /** Centre on the playfield (x, z). */
  at: readonly [number, number]
  shape: 'arrow' | 'circle' | 'rect'
  /** Arrow length / circle diameter / rect width, and the rect's depth. */
  size: number
  depth?: number
  /** Turn about Y from pointing up the table (-Z), radians. */
  yaw?: number
  color: number
  /** The shot this arrow lights the way to. */
  shot?: string
  /** A flasher fired when that shot is made. */
  flasher?: string
}

/** A flasher dome: a bright lamp under coloured plastic that fires on events. */
export type FlasherDef = {
  id: string
  at: Vec3
  color: number
}

export type ShotDef = {
  id: string
  kind: 'ramp' | 'orbit' | 'scoop' | 'lane' | 'target-bank' | 'spinner'
  /**
   * Switches the ball must close in this order to complete the shot: sensor
   * ids (entering), scoop ids (captured) or spinner ids. Order is the
   * direction: an orbit counts going up, not coming back down.
   */
  sensors: string[]
  /** Ticks allowed between consecutive switches (default 2 s). */
  windowTicks?: number
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
  drops: DropTargetDef[]
  scoops: ScoopDef[]
  spinners: SpinnerDef[]
  shots: ShotDef[]
  doors?: DoorDef[]
  kickers?: KickerDef[]
  toys?: ToyDef[]
  zones?: ZoneDef[]
  occluders?: OccluderDef[]
  inserts?: InsertDef[]
  flashers?: FlasherDef[]
  /**
   * Generated art (t-009): a top-down playfield albedo, served from
   * /images/, and the table rectangle (x, z) it covers. Optional: without it,
   * or until it loads, the renderer paints the playfield itself.
   */
  art?: {
    playfield?: {
      src: string
      min: readonly [number, number]
      max: readonly [number, number]
    }
  }
  /**
   * The DMD in the backbox (t-006): the centre of its glass, facing the
   * player, and its width (it is 4:1). It fades with the occluder it sits in.
   */
  dmd?: { at: Vec3; width: number; occluder?: string }
  /** Solid trim the renderer draws and the physics never sees (the apron plate). */
  trim?: BoxCollider[]
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
  | { type: 'capture'; id: string; ballId: number }
  | { type: 'eject'; id: string; ballId: number }
  | { type: 'spin'; id: string; ballId: number; speed: number }
  | { type: 'drop'; id: string; bank: string; ballId: number }
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
  /** Balls to put on the table from the plunger, auto-launched (multiball, ball save). */
  | { type: 'add-ball'; count: number }
  | { type: 'game-over' }
  | { type: 'mechanism'; id: string; action: string; payload?: unknown }
  | {
      type: 'dmd'
      text: string
      sub?: string
      ms: number
      /** The DMD scene to show it in (dmdQueue.ts); a plain message if unset. */
      scene?: DmdSceneId
      value?: number
      /** Bonus count lines. */
      items?: ReadonlyArray<{ label: string; value: number }>
    }
  /** Take a scene off the DMD (a mode ends, a tilt clears). */
  | { type: 'dmd-clear'; scene: DmdSceneId }
