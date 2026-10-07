// /utils/arcade/pinball/physics/world.ts
//
// The pinball physics world on Rapier 3D (conductor kind-pinball/t-004).
// It owns every rigid body and collider, steps at a fixed 1/120 s, and
// reports switch traffic as SwitchEvents. It knows nothing about rules,
// scoring or rendering. Rapier's WASM module is passed in (the game module
// initialises it once) so this file never triggers a load by itself.
//
// The table is simulated in its own frame (see ../types.ts); the playfield
// pitch becomes a tilted gravity vector instead of rotated geometry.

import type RAPIER from '@dimforge/rapier3d-compat'
import type {
  ColliderDef,
  FlipperDef,
  SwitchEvent,
  TableDef,
  Vec3,
} from '../types'

export type RapierModule = typeof RAPIER

export const PHYSICS_HZ = 120
const G = 9.81
/** Steel ball: 7.85 g/cm^3 gives the familiar ~80 g ball. */
const BALL_DENSITY = 7850
/** A safety fuse only; normal play never reaches it. */
const MAX_BALL_SPEED = 8

export type BallView = {
  id: number
  position: Vec3
  rotation: readonly [number, number, number, number]
  velocity: Vec3
  /** Speed across the playfield (XZ), m/s. */
  speed: number
}

type LiveBall = {
  id: number
  body: RAPIER.RigidBody
  collider: RAPIER.Collider
}

type LiveFlipper = {
  def: FlipperDef
  body: RAPIER.RigidBody
  angle: number
  up: boolean
}

function yawQuat(theta: number) {
  return { x: 0, y: Math.sin(theta / 2), z: 0, w: Math.cos(theta / 2) }
}

/** World yaw that points a flipper's +X at its angle (+Z is down-table). */
function flipperYaw(def: FlipperDef, angle: number): number {
  return def.side === 'left' ? -angle : Math.PI + angle
}

let liveWorlds = 0

/** Physics worlds created and not yet disposed (for leak tests). */
export function livePhysicsWorlds(): number {
  return liveWorlds
}

export class PinballPhysics {
  readonly table: TableDef
  private R: RapierModule
  private world: RAPIER.World
  private events: RAPIER.EventQueue
  private balls: LiveBall[] = []
  private flippers: LiveFlipper[] = []
  /** Collider handle -> table id, for switch events. */
  private names = new Map<number, string>()
  private kicks = new Map<number, number>()
  private sensorHandles = new Set<number>()
  private nextBallId = 1
  private disposed = false

  constructor(R: RapierModule, table: TableDef) {
    this.R = R
    this.table = table
    const pitch = (table.physical.pitchDeg * Math.PI) / 180
    this.world = new R.World({
      x: 0,
      y: -G * Math.cos(pitch),
      z: G * Math.sin(pitch),
    })
    this.world.timestep = 1 / PHYSICS_HZ
    this.events = new R.EventQueue(true)
    const fixed = this.world.createRigidBody(R.RigidBodyDesc.fixed())
    for (const def of table.colliders) this.addStatic(fixed, def)
    for (const sensor of table.sensors) {
      const desc = R.ColliderDesc.cuboid(...sensor.half)
        .setTranslation(...sensor.at)
        .setRotation(yawQuat(sensor.yaw ?? 0))
        .setSensor(true)
        .setActiveEvents(R.ActiveEvents.COLLISION_EVENTS)
      const collider = this.world.createCollider(desc, fixed)
      this.names.set(collider.handle, sensor.id)
      this.sensorHandles.add(collider.handle)
    }
    for (const def of table.flippers) this.addFlipper(def)
    liveWorlds++
  }

  private addStatic(body: RAPIER.RigidBody, def: ColliderDef) {
    const R = this.R
    const desc =
      def.kind === 'box'
        ? R.ColliderDesc.cuboid(...def.half).setRotation(yawQuat(def.yaw ?? 0))
        : R.ColliderDesc.cylinder(def.halfHeight, def.radius)
    desc
      .setTranslation(...def.at)
      .setRestitution(def.restitution ?? 0.3)
      .setFriction(def.material === 'playfield' ? 0.12 : 0.2)
    if (def.kind === 'post' && def.kick) {
      desc.setActiveEvents(R.ActiveEvents.COLLISION_EVENTS)
    }
    const collider = this.world.createCollider(desc, body)
    this.names.set(collider.handle, def.id)
    if (def.kind === 'post' && def.kick)
      this.kicks.set(collider.handle, def.kick)
  }

  private addFlipper(def: FlipperDef) {
    const R = this.R
    const body = this.world.createRigidBody(
      R.RigidBodyDesc.kinematicPositionBased()
        .setTranslation(...def.pivot)
        .setRotation(yawQuat(flipperYaw(def, def.restAngle))),
    )
    const radius = (def.baseRadius + def.tipRadius) / 2
    // A capsule lying along the flipper's +X, from the pivot to the tip.
    const collider = this.world.createCollider(
      R.ColliderDesc.capsule(def.length / 2, radius)
        .setTranslation(def.length / 2, radius, 0)
        .setRotation({ x: 0, y: 0, z: Math.SQRT1_2, w: Math.SQRT1_2 })
        .setRestitution(0.25)
        .setFriction(0.6)
        .setActiveEvents(R.ActiveEvents.COLLISION_EVENTS),
      body,
    )
    this.names.set(collider.handle, def.id)
    this.flippers.push({ def, body, angle: def.restAngle, up: false })
  }

  /** Put a new ball on the plunger. Returns its id. */
  serveBall(at: Vec3 = this.table.plunger.rest): number {
    const R = this.R
    const radius = this.table.physical.ballRadiusM
    const body = this.world.createRigidBody(
      R.RigidBodyDesc.dynamic()
        .setTranslation(...at)
        .setCcdEnabled(true)
        .setCanSleep(false)
        .setLinearDamping(0.05)
        .setAngularDamping(0.3),
    )
    const collider = this.world.createCollider(
      R.ColliderDesc.ball(radius)
        .setDensity(BALL_DENSITY)
        .setRestitution(0.35)
        .setFriction(0.25),
      body,
    )
    const id = this.nextBallId++
    this.balls.push({ id, body, collider })
    return id
  }

  /** Fire the plunger: launch any ball resting in the shooter lane up-table. */
  launch(power: number): boolean {
    const { minSpeed, maxSpeed, rest } = this.table.plunger
    const p = Math.max(0, Math.min(1, power))
    let fired = false
    for (const ball of this.balls) {
      const at = ball.body.translation()
      const inLane =
        Math.abs(at.x - rest[0]) < 0.012 && Math.abs(at.z - rest[2]) < 0.03
      if (!inLane) continue
      ball.body.setLinvel(
        { x: 0, y: 0, z: -(minSpeed + (maxSpeed - minSpeed) * p) },
        true,
      )
      fired = true
    }
    return fired
  }

  /** True while a ball sits on the plunger waiting to be launched. */
  ballOnPlunger(): boolean {
    const rest = this.table.plunger.rest
    return this.balls.some((ball) => {
      const at = ball.body.translation()
      const v = ball.body.linvel()
      return (
        Math.abs(at.x - rest[0]) < 0.012 &&
        Math.abs(at.z - rest[2]) < 0.02 &&
        Math.hypot(v.x, v.z) < 0.05
      )
    })
  }

  /** Bump the cabinet: every ball gets the same small shove (m/s). */
  nudge(dx: number, dz: number) {
    for (const ball of this.balls) {
      const m = ball.body.mass()
      ball.body.applyImpulse({ x: dx * m, y: 0, z: dz * m }, true)
    }
  }

  setFlipper(side: 'left' | 'right', up: boolean) {
    for (const flipper of this.flippers)
      if (flipper.def.side === side) flipper.up = up
  }

  /** Advance one physics step and return what the switches saw. */
  step(): SwitchEvent[] {
    if (this.disposed) return []
    const dt = 1 / PHYSICS_HZ
    for (const flipper of this.flippers) this.moveFlipper(flipper, dt)
    this.world.step(this.events)
    const out: SwitchEvent[] = []
    this.events.drainCollisionEvents((h1, h2, started) => {
      const ball = this.balls.find(
        (b) => b.collider.handle === h1 || b.collider.handle === h2,
      )
      if (!ball) return
      const other = ball.collider.handle === h1 ? h2 : h1
      const id = this.names.get(other)
      if (!id) return
      if (this.sensorHandles.has(other)) {
        out.push({
          type: started ? 'sensor-enter' : 'sensor-exit',
          id,
          ballId: ball.id,
        })
        return
      }
      if (!started) return
      const kick = this.kicks.get(other)
      const v = ball.body.linvel()
      if (kick) this.kickAway(ball, other, kick)
      out.push({
        type: 'contact',
        id,
        ballId: ball.id,
        impulse: Math.hypot(v.x, v.z),
      })
    })
    for (const ball of [...this.balls]) {
      const at = ball.body.translation()
      const v = ball.body.linvel()
      const speed = Math.hypot(v.x, v.y, v.z)
      if (speed > MAX_BALL_SPEED) {
        const k = MAX_BALL_SPEED / speed
        ball.body.setLinvel({ x: v.x * k, y: v.y * k, z: v.z * k }, true)
      }
      const lost =
        at.z > this.table.drainZ ||
        !Number.isFinite(at.x + at.y + at.z) ||
        at.y < -0.1 ||
        Math.abs(at.x) > 1
      if (lost) {
        this.removeBall(ball)
        out.push({ type: 'drain', ballId: ball.id })
      }
    }
    return out
  }

  /** A pop bumper fires: push the ball straight away from its centre. */
  private kickAway(ball: LiveBall, handle: number, speed: number) {
    const post = this.world.getCollider(handle)
    if (!post) return
    const c = post.translation()
    const at = ball.body.translation()
    const dx = at.x - c.x
    const dz = at.z - c.z
    const d = Math.hypot(dx, dz) || 1
    const m = ball.body.mass()
    ball.body.applyImpulse(
      { x: (dx / d) * speed * m, y: 0, z: (dz / d) * speed * m },
      true,
    )
  }

  private moveFlipper(flipper: LiveFlipper, dt: number) {
    const { def } = flipper
    const target = flipper.up ? def.activeAngle : def.restAngle
    const span = Math.abs(def.restAngle - def.activeAngle)
    const ms = flipper.up ? def.strokeMs : def.returnMs
    const stepAngle = (span / (ms / 1000)) * dt
    const delta = target - flipper.angle
    flipper.angle += Math.sign(delta) * Math.min(Math.abs(delta), stepAngle)
    flipper.body.setNextKinematicRotation(
      yawQuat(flipperYaw(def, flipper.angle)),
    )
  }

  private removeBall(ball: LiveBall) {
    this.world.removeRigidBody(ball.body)
    this.balls = this.balls.filter((b) => b !== ball)
  }

  ballViews(): BallView[] {
    return this.balls.map((ball) => {
      const t = ball.body.translation()
      const r = ball.body.rotation()
      const v = ball.body.linvel()
      return {
        id: ball.id,
        position: [t.x, t.y, t.z],
        rotation: [r.x, r.y, r.z, r.w],
        velocity: [v.x, v.y, v.z],
        speed: Math.hypot(v.x, v.z),
      }
    })
  }

  /** Current flipper angles by id (the renderer mirrors them). */
  flipperAngles(): Record<string, number> {
    const out: Record<string, number> = {}
    for (const flipper of this.flippers) out[flipper.def.id] = flipper.angle
    return out
  }

  get ballCount(): number {
    return this.balls.length
  }

  dispose() {
    if (this.disposed) return
    this.disposed = true
    this.events.free()
    this.world.free()
    this.balls = []
    this.flippers = []
    liveWorlds--
  }
}

export { flipperYaw, yawQuat }
