// /utils/arcade/pinball/physics/world.ts
//
// The pinball physics world on Rapier 3D (conductor kind-pinball/t-004,
// mechanisms added in t-018). It owns every rigid body and collider, steps
// at a fixed 1/120 s, and reports switch traffic as SwitchEvents. It knows
// nothing about rules, scoring or rendering. Rapier's WASM module is passed
// in (the game module initialises it once) so this file never triggers a
// load by itself.
//
// The table is simulated in its own frame (see ../types.ts); the playfield
// pitch becomes a tilted gravity vector instead of rotated geometry.
//
// Mechanisms simulated here, because they are mechanical devices with their
// own timing: one-way gates (a contact hook drops the contact when the ball
// moves the pass way), drop targets (a hit disables the target's collider),
// scoops and saucers (capture, hold, kick out, or send down a subway), and
// spinners (the plate spins with the speed the ball passed at).

import type RAPIER from '@dimforge/rapier3d-compat'
import type {
  BoxCollider,
  ColliderDef,
  DoorDef,
  DropTargetDef,
  MeshCollider,
  FlipperDef,
  ScoopDef,
  SwitchEvent,
  TableDef,
  ToyDef,
  Vec3,
} from '../types'

export type RapierModule = typeof RAPIER

export const PHYSICS_HZ = 120
/** Rapier's length scale: 0.1 gives 2 mm contact prediction. */
const LENGTH_UNIT = 0.1
const G = 9.81
/** Steel ball: 7.85 g/cm^3 gives the familiar ~80 g ball. */
const BALL_DENSITY = 7850
/** A safety fuse only; normal play never reaches it. */
const MAX_BALL_SPEED = 8
/** Hits slower than this do not knock a drop target down (m/s). */
const DROP_MIN_SPEED = 0.25
/** After a kick-out the same ball cannot be captured again for this long. */
const SCOOP_COOLDOWN_STEPS = PHYSICS_HZ / 2
/** Spinner plate: revolutions per second per m/s, and its friction decay. */
const SPIN_PER_SPEED = 7
const SPIN_DECAY = 0.985

export type BallView = {
  id: number
  position: Vec3
  rotation: readonly [number, number, number, number]
  velocity: Vec3
  /** Speed across the playfield (XZ), m/s. */
  speed: number
  /** Held in a scoop (not moving, not drainable). */
  captured: boolean
  /** The table zone the ball is in (the sub-table), if any. */
  zone?: string
}

type LiveBall = {
  id: number
  body: RAPIER.RigidBody
  collider: RAPIER.Collider
  captured: boolean
  /** Physics step before which scoops ignore this ball. */
  scoopCooldown: number
}

type LiveFlipper = {
  def: FlipperDef
  body: RAPIER.RigidBody
  angle: number
  up: boolean
}

type LiveDrop = {
  def: DropTargetDef
  collider: RAPIER.Collider
  up: boolean
}

type Hold = { ball: LiveBall; scoop: ScoopDef; releaseStep: number }

type LiveDoor = {
  def: DoorDef
  closed: RAPIER.Collider[]
  open: RAPIER.Collider[]
  isOpen: boolean
}

type LiveToy = { def: ToyDef; body: RAPIER.RigidBody; angle: number }

function yawQuat(theta: number) {
  return { x: 0, y: Math.sin(theta / 2), z: 0, w: Math.cos(theta / 2) }
}

function boxRotation(def: BoxCollider) {
  if (def.quat) {
    const [x, y, z, w] = def.quat
    return { x, y, z, w }
  }
  return yawQuat(def.yaw ?? 0)
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
  private fixed: RAPIER.RigidBody
  private balls: LiveBall[] = []
  private flippers: LiveFlipper[] = []
  private drops: LiveDrop[] = []
  private doors = new Map<string, LiveDoor>()
  private toys: LiveToy[] = []
  /** Collider handle -> table id, for switch events. */
  private names = new Map<number, string>()
  private kicks = new Map<number, number>()
  private sensorHandles = new Set<number>()
  private gates = new Map<number, Vec3>()
  private mouths = new Map<number, NonNullable<MeshCollider['mouth']>>()
  private scoopHandles = new Map<number, ScoopDef>()
  private spinnerHandles = new Set<number>()
  private spin = new Map<string, { angle: number; rate: number }>()
  private holds: Hold[] = []
  /** The scoop each ball is sitting in, if any. */
  private inScoop = new Map<LiveBall, ScoopDef>()
  /** Ball velocities by body handle, captured before each step for the gate hook. */
  private velocities = new Map<number, Vec3>()
  /** Ball positions by body handle, captured with the velocities for the mouth hook. */
  private positions = new Map<number, Vec3>()
  private hooks: RAPIER.PhysicsHooks
  private stepCount = 0
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
    // Rapier's tolerances default to a 1 m world: 2 cm contact prediction and
    // 5 mm allowed overlap. At pinball scale (a 27 mm ball) that turns every
    // nearby edge into a ghost contact, so scale them to the table.
    this.world.lengthUnit = LENGTH_UNIT
    this.events = new R.EventQueue(true)
    this.fixed = this.world.createRigidBody(R.RigidBodyDesc.fixed())
    for (const def of table.colliders) this.addStatic(def)
    for (const sensor of table.sensors) {
      const collider = this.addSensor(
        R.ColliderDesc.cuboid(...sensor.half)
          .setTranslation(...sensor.at)
          .setRotation(yawQuat(sensor.yaw ?? 0)),
        sensor.id,
      )
      this.sensorHandles.add(collider.handle)
    }
    for (const scoop of table.scoops) {
      const collider = this.addSensor(
        R.ColliderDesc.ball(scoop.radius).setTranslation(...scoop.at),
        scoop.id,
      )
      this.scoopHandles.set(collider.handle, scoop)
    }
    for (const spinner of table.spinners) {
      const collider = this.addSensor(
        R.ColliderDesc.cuboid(...spinner.half)
          .setTranslation(...spinner.at)
          .setRotation(yawQuat(spinner.yaw ?? 0)),
        spinner.id,
      )
      this.spinnerHandles.add(collider.handle)
      this.spin.set(spinner.id, { angle: 0, rate: 0 })
    }
    for (const def of table.drops) this.addDrop(def)
    for (const def of table.flippers) this.addFlipper(def)
    for (const def of table.doors ?? []) this.addDoor(def)
    for (const def of table.toys ?? []) this.addToy(def)
    this.hooks = {
      filterContactPair: (c1, c2, b1, b2) => {
        const mouth = this.mouths.get(c1) ?? this.mouths.get(c2)
        if (mouth) {
          const at = this.positions.get(b1) ?? this.positions.get(b2)
          if (!at) return this.R.SolverFlags.COMPUTE_IMPULSE
          const dx = at[0] - mouth.at[0]
          const dz = at[2] - mouth.at[2]
          const before =
            Math.hypot(dx, dz) < mouth.radius &&
            dx * mouth.dir[0] + dz * mouth.dir[2] < 0
          return before
            ? this.R.SolverFlags.EMPTY
            : this.R.SolverFlags.COMPUTE_IMPULSE
        }
        const gate = this.gates.get(c1) ?? this.gates.get(c2)
        if (!gate) return this.R.SolverFlags.COMPUTE_IMPULSE
        const v = this.velocities.get(b1) ?? this.velocities.get(b2)
        if (!v) return this.R.SolverFlags.COMPUTE_IMPULSE
        const along = v[0] * gate[0] + v[2] * gate[2]
        return along > 0
          ? this.R.SolverFlags.EMPTY
          : this.R.SolverFlags.COMPUTE_IMPULSE
      },
      filterIntersectionPair: () => true,
    }
    liveWorlds++
  }

  private addSensor(desc: RAPIER.ColliderDesc, id: string): RAPIER.Collider {
    desc.setSensor(true).setActiveEvents(this.R.ActiveEvents.COLLISION_EVENTS)
    const collider = this.world.createCollider(desc, this.fixed)
    this.names.set(collider.handle, id)
    return collider
  }

  private addStatic(def: ColliderDef): RAPIER.Collider {
    const R = this.R
    if (def.kind === 'mesh') return this.addMesh(def)
    const desc =
      def.kind === 'box'
        ? R.ColliderDesc.cuboid(...def.half).setRotation(boxRotation(def))
        : R.ColliderDesc.cylinder(def.halfHeight, def.radius)
    desc
      .setTranslation(...def.at)
      .setRestitution(def.restitution ?? 0.3)
      .setFriction(
        def.material === 'playfield' || def.material === 'ramp' ? 0.12 : 0.2,
      )
    if (def.kind === 'post' && def.kick) {
      desc.setActiveEvents(R.ActiveEvents.COLLISION_EVENTS)
    }
    if (def.kind === 'box' && def.passDir) {
      desc.setActiveHooks(R.ActiveHooks.FILTER_CONTACT_PAIRS)
    }
    const collider = this.world.createCollider(desc, this.fixed)
    this.names.set(collider.handle, def.id)
    if (def.kind === 'post' && def.kick)
      this.kicks.set(collider.handle, def.kick)
    if (def.kind === 'box' && def.passDir)
      this.gates.set(collider.handle, def.passDir)
    return collider
  }

  private addMesh(def: MeshCollider): RAPIER.Collider {
    const R = this.R
    // Rapier smooths contacts across the mesh's internal edges, so a ball
    // rolls over the seams between triangles without a bump.
    const desc = R.ColliderDesc.trimesh(
      new Float32Array(def.vertices),
      new Uint32Array(def.indices),
      def.twoSided
        ? R.TriMeshFlags.FIX_INTERNAL_EDGES_TWO_SIDED
        : R.TriMeshFlags.FIX_INTERNAL_EDGES,
    )
      .setRestitution(def.restitution ?? 0.3)
      .setFriction(def.material === 'ramp' ? 0.12 : 0.2)
    if (def.mouth) desc.setActiveHooks(R.ActiveHooks.FILTER_CONTACT_PAIRS)
    const collider = this.world.createCollider(desc, this.fixed)
    this.names.set(collider.handle, def.id)
    if (def.mouth) this.mouths.set(collider.handle, def.mouth)
    return collider
  }

  private addDoor(def: DoorDef) {
    const door: LiveDoor = {
      def,
      closed: def.closed.map((wall) => this.addStatic(wall)),
      open: def.open.map((wall) => this.addStatic(wall)),
      isOpen: false,
    }
    for (const collider of door.open) collider.setEnabled(false)
    this.doors.set(def.id, door)
  }

  private addToy(def: ToyDef) {
    const R = this.R
    const body = this.world.createRigidBody(
      R.RigidBodyDesc.kinematicPositionBased().setTranslation(...def.at),
    )
    for (let i = 0; i < def.arms; i++) {
      const yaw = (2 * Math.PI * i) / def.arms
      const along = def.armHalf[0]
      const collider = this.world.createCollider(
        R.ColliderDesc.cuboid(...def.armHalf)
          .setTranslation(Math.cos(yaw) * along, 0, -Math.sin(yaw) * along)
          .setRotation(yawQuat(yaw))
          .setRestitution(0.4)
          .setFriction(0.3)
          .setActiveEvents(R.ActiveEvents.COLLISION_EVENTS),
        body,
      )
      this.names.set(collider.handle, def.id)
    }
    this.toys.push({ def, body, angle: 0 })
  }

  /** Open or close a door (a mechanism the rules ask for). */
  setDoor(id: string, open: boolean) {
    const door = this.doors.get(id)
    if (!door || door.isOpen === open) return
    door.isOpen = open
    for (const collider of door.closed) collider.setEnabled(!open)
    for (const collider of door.open) collider.setEnabled(open)
  }

  /** Which doors are open, by id. */
  doorStates(): Record<string, boolean> {
    const out: Record<string, boolean> = {}
    for (const [id, door] of this.doors) out[id] = door.isOpen
    return out
  }

  /** Toy hub angles by id, radians. */
  toyAngles(): Record<string, number> {
    const out: Record<string, number> = {}
    for (const toy of this.toys) out[toy.def.id] = toy.angle
    return out
  }

  private addDrop(def: DropTargetDef) {
    const R = this.R
    const collider = this.world.createCollider(
      R.ColliderDesc.cuboid(...def.half)
        .setTranslation(...def.at)
        .setRotation(yawQuat(def.yaw ?? 0))
        .setRestitution(0.3)
        .setActiveEvents(R.ActiveEvents.COLLISION_EVENTS),
      this.fixed,
    )
    this.names.set(collider.handle, def.id)
    this.drops.push({ def, collider, up: true })
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

  /** Put a new ball on the plunger (or anywhere, for tests). Returns its id. */
  serveBall(at: Vec3 = this.table.plunger.rest, velocity?: Vec3): number {
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
    if (velocity)
      body.setLinvel({ x: velocity[0], y: velocity[1], z: velocity[2] }, true)
    const collider = this.world.createCollider(
      R.ColliderDesc.ball(radius)
        .setDensity(BALL_DENSITY)
        .setRestitution(0.35)
        .setFriction(0.25),
      body,
    )
    const id = this.nextBallId++
    this.balls.push({ id, body, collider, captured: false, scoopCooldown: 0 })
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

  /** Bump the cabinet: every free ball gets the same small shove (m/s). */
  nudge(dx: number, dz: number) {
    for (const ball of this.balls) {
      if (ball.captured) continue
      const m = ball.body.mass()
      ball.body.applyImpulse({ x: dx * m, y: 0, z: dz * m }, true)
    }
  }

  setFlipper(side: 'left' | 'right', up: boolean) {
    for (const flipper of this.flippers)
      if (flipper.def.side === side) flipper.up = up
  }

  /** Raise every target in a drop bank (a mechanism the rules ask for). */
  resetDropBank(bank: string) {
    for (const drop of this.drops) {
      if (drop.def.bank !== bank || drop.up) continue
      drop.up = true
      drop.collider.setEnabled(true)
    }
  }

  /** Advance one physics step and return what the switches saw. */
  step(): SwitchEvent[] {
    if (this.disposed) return []
    this.stepCount++
    const dt = 1 / PHYSICS_HZ
    for (const flipper of this.flippers) this.moveFlipper(flipper, dt)
    for (const toy of this.toys) {
      toy.angle = (toy.angle + toy.def.spin * dt) % (2 * Math.PI)
      toy.body.setNextKinematicRotation(yawQuat(toy.angle))
    }
    this.velocities.clear()
    this.positions.clear()
    for (const ball of this.balls) {
      const v = ball.body.linvel()
      const at = ball.body.translation()
      this.velocities.set(ball.body.handle, [v.x, v.y, v.z])
      this.positions.set(ball.body.handle, [at.x, at.y, at.z])
    }
    this.world.step(this.events, this.hooks)
    const out: SwitchEvent[] = []
    this.events.drainCollisionEvents((h1, h2, started) => {
      const ball = this.balls.find(
        (b) => b.collider.handle === h1 || b.collider.handle === h2,
      )
      if (!ball || ball.captured) return
      const other = ball.collider.handle === h1 ? h2 : h1
      const id = this.names.get(other)
      if (!id) return
      const v = ball.body.linvel()
      const speed = Math.hypot(v.x, v.z)
      const scoop = this.scoopHandles.get(other)
      if (scoop) {
        if (started) this.inScoop.set(ball, scoop)
        else if (this.inScoop.get(ball) === scoop) this.inScoop.delete(ball)
        return
      }
      if (this.spinnerHandles.has(other)) {
        if (!started) return
        const spinner = this.spin.get(id)
        if (spinner)
          spinner.rate = Math.max(spinner.rate, speed * SPIN_PER_SPEED)
        out.push({ type: 'spin', id, ballId: ball.id, speed })
        return
      }
      if (this.sensorHandles.has(other)) {
        out.push({
          type: started ? 'sensor-enter' : 'sensor-exit',
          id,
          ballId: ball.id,
        })
        return
      }
      if (!started) return
      const drop = this.drops.find((d) => d.collider.handle === other)
      if (drop?.def.standup) {
        if (speed >= DROP_MIN_SPEED) {
          out.push({ type: 'contact', id, ballId: ball.id, impulse: speed })
        }
        return
      }
      if (drop) {
        if (drop.up && speed >= DROP_MIN_SPEED) {
          drop.up = false
          drop.collider.setEnabled(false)
          out.push({ type: 'drop', id, bank: drop.def.bank, ballId: ball.id })
        }
        return
      }
      const kick = this.kicks.get(other)
      if (kick) this.kickAway(ball, other, kick)
      out.push({ type: 'contact', id, ballId: ball.id, impulse: speed })
    })
    // A scoop keeps trying a ball that sits in it, so one that arrived too
    // fast, or just after a kickout, is still taken once it settles.
    for (const [ball, scoop] of [...this.inScoop]) {
      if (ball.captured) continue
      const v = ball.body.linvel()
      this.tryCapture(ball, scoop, Math.hypot(v.x, v.z), out)
    }
    this.releaseHolds(out)
    for (const spinner of this.spin.values()) {
      spinner.angle += spinner.rate * 2 * Math.PI * dt
      spinner.rate *= SPIN_DECAY
      if (spinner.rate < 0.05) spinner.rate = 0
    }
    for (const ball of [...this.balls]) {
      if (ball.captured) continue
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

  /** A ball entering a scoop slowly enough drops in and is held. */
  private tryCapture(
    ball: LiveBall,
    scoop: ScoopDef,
    speed: number,
    out: SwitchEvent[],
  ) {
    if (this.stepCount < ball.scoopCooldown || speed > scoop.captureMaxSpeed)
      return
    ball.captured = true
    this.inScoop.delete(ball)
    ball.body.setLinvel({ x: 0, y: 0, z: 0 }, true)
    ball.body.setAngvel({ x: 0, y: 0, z: 0 }, true)
    ball.body.setTranslation(
      {
        x: scoop.at[0],
        y: scoop.at[1] - this.table.physical.ballRadiusM * 0.6,
        z: scoop.at[2],
      },
      true,
    )
    ball.body.setEnabled(false)
    const holdSteps = Math.round((scoop.holdMs / 1000) * PHYSICS_HZ)
    this.holds.push({ ball, scoop, releaseStep: this.stepCount + holdSteps })
    out.push({ type: 'capture', id: scoop.id, ballId: ball.id })
  }

  /** Kick out balls whose hold is over, through a subway when there is one. */
  private releaseHolds(out: SwitchEvent[]) {
    const due = this.holds.filter((h) => h.releaseStep <= this.stepCount)
    if (!due.length) return
    this.holds = this.holds.filter((h) => h.releaseStep > this.stepCount)
    for (const hold of due) {
      const target =
        (hold.scoop.subwayTo &&
          this.table.scoops.find((s) => s.id === hold.scoop.subwayTo)) ||
        hold.scoop
      const { at, velocity } = target.eject
      const ball = hold.ball
      ball.body.setEnabled(true)
      ball.body.setTranslation({ x: at[0], y: at[1], z: at[2] }, true)
      ball.body.setLinvel(
        { x: velocity[0], y: velocity[1], z: velocity[2] },
        true,
      )
      ball.captured = false
      ball.scoopCooldown = this.stepCount + SCOOP_COOLDOWN_STEPS
      out.push({ type: 'eject', id: target.id, ballId: ball.id })
    }
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
    this.inScoop.delete(ball)
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
        captured: ball.captured,
        zone: this.zoneAt(t.x, t.z),
      }
    })
  }

  private zoneAt(x: number, z: number): string | undefined {
    for (const zone of this.table.zones ?? []) {
      if (
        x >= zone.min[0] &&
        x <= zone.max[0] &&
        z >= zone.min[1] &&
        z <= zone.max[1]
      )
        return zone.id
    }
    return undefined
  }

  /** Current flipper angles by id (the renderer mirrors them). */
  flipperAngles(): Record<string, number> {
    const out: Record<string, number> = {}
    for (const flipper of this.flippers) out[flipper.def.id] = flipper.angle
    return out
  }

  /** Which drop targets are standing, by id. */
  dropStates(): Record<string, boolean> {
    const out: Record<string, boolean> = {}
    for (const drop of this.drops) out[drop.def.id] = drop.up
    return out
  }

  /** Spinner plate angles by id, radians. */
  spinnerAngles(): Record<string, number> {
    const out: Record<string, number> = {}
    for (const [id, spinner] of this.spin) out[id] = spinner.angle
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
    this.drops = []
    this.holds = []
    liveWorlds--
  }
}

export { flipperYaw, yawQuat }
