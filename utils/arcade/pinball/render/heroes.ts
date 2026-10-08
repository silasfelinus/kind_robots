// /utils/arcade/pinball/render/heroes.ts
//
// AMI Village Rescue's signature toys, and the motion around them
// (conductor kind-pinball/t-010). Everything here is scenery: no colliders,
// so the physics is the same with it or without. The rules decide what each
// toy shows (rules/toys.ts toyPose); this only builds the meshes and eases
// them toward that pose, frame by frame.
//
//   Heroes   the hut bank, the AMI beacon and the net drone.
//   Sparks   a pooled burst of additive points for a jackpot.
//   Trail    a short streak behind a fast ball (speed only: a slow ball
//            leaves none).
//   Rubbers  the sling rubbers, which flex when their kicker fires.
//
// Every geometry, material and texture goes through the scene's track(), so
// the scene's dispose() frees them and the leak tests count them.

import * as THREE from 'three'
import type { HeroDef, Vec3 } from '../types'
import type { HutLevel, ToyPose } from '../rules/toys'

type Track = <T extends { dispose(): void }>(resource: T) => T

/** How fast a hut's or eye's glow follows its level (0..1 per frame). */
const GLOW_EASE = 0.15
/** Frames per half blink. */
const BLINK = 10
const HUT_GLOW: Record<HutLevel, number> = {
  dark: 0.05,
  visited: 1.4,
  saved: 3.4,
  playing: 3.4,
  wizard: 4,
}
/** The huts read at a glance from the player's seat at this size. */
const HUT_SCALE = 1.35
/** Frames the drone takes to fly out to the huts and back. */
const DELIVERY_FRAMES = 150
/** The beacon's turn, radians per frame, when the lock is lit. */
const BEACON_TURN = 0.18
const ROTOR_TURN = 0.9

export class Heroes {
  readonly group = new THREE.Group()
  private def: HeroDef
  private huts: Array<{ window: THREE.MeshStandardMaterial; glow: number }> = []
  private head: THREE.Group
  private headMaterial: THREE.MeshStandardMaterial
  private eyes: Array<{ material: THREE.MeshStandardMaterial; glow: number }> =
    []
  private beacon: THREE.Group
  private beaconMaterial: THREE.MeshStandardMaterial
  private drone: THREE.Group
  private rotors: THREE.Mesh[] = []
  private nets: THREE.Mesh[] = []
  private pose: ToyPose | null = null
  private frame = 0
  private circleAngle = 0
  /** Frames into a delivery flight; 0 when the drone is not delivering. */
  private delivering = 0
  private dronePosition = new THREE.Vector3()

  constructor(def: HeroDef, track: Track) {
    this.def = def
    this.buildHuts(track)
    const head = this.buildBeacon(track)
    this.head = head.head
    this.headMaterial = head.material
    this.beacon = head.beacon
    this.beaconMaterial = head.beaconMaterial
    this.drone = this.buildDrone(track)
    this.dronePosition.set(...def.drone.perch)
    this.drone.position.copy(this.dronePosition)
  }

  private buildHuts(track: Track) {
    const wall = track(new THREE.BoxGeometry(0.02, 0.014, 0.016))
    wall.translate(0, 0.007, 0)
    const roof = track(new THREE.ConeGeometry(0.0155, 0.011, 4))
    roof.rotateY(Math.PI / 4)
    roof.translate(0, 0.0195, 0)
    const pane = track(new THREE.PlaneGeometry(0.009, 0.007))
    const wallMat = track(
      new THREE.MeshStandardMaterial({ color: 0xe9d5b5, roughness: 0.8 }),
    )
    const roofMat = track(
      new THREE.MeshStandardMaterial({ color: 0x7c2d12, roughness: 0.6 }),
    )
    for (const spot of this.def.huts) {
      const hut = new THREE.Group()
      hut.position.set(...spot.at)
      hut.rotation.y = spot.yaw
      hut.scale.setScalar(HUT_SCALE)
      const body = new THREE.Mesh(wall, wallMat)
      body.castShadow = true
      const top = new THREE.Mesh(roof, roofMat)
      top.castShadow = true
      const window = track(
        new THREE.MeshStandardMaterial({
          color: 0x1c1208,
          emissive: 0xffb347,
          emissiveIntensity: HUT_GLOW.dark,
        }),
      )
      const glass = new THREE.Mesh(pane, window)
      glass.position.set(0, 0.0075, 0.0081)
      hut.add(body, top, glass)
      this.group.add(hut)
      this.huts.push({ window, glow: HUT_GLOW.dark })
    }
  }

  private buildBeacon(track: Track) {
    const at = this.def.beacon.at
    const head = new THREE.Group()
    head.position.set(...at)
    const material = track(
      new THREE.MeshStandardMaterial({
        color: 0x2dd4bf,
        metalness: 0.3,
        roughness: 0.35,
        emissive: 0x2dd4bf,
        emissiveIntensity: 0,
      }),
    )
    const chrome = track(
      new THREE.MeshStandardMaterial({
        color: 0xd4d4d8,
        metalness: 1,
        roughness: 0.2,
      }),
    )
    const box = new THREE.Mesh(
      track(new THREE.BoxGeometry(0.036, 0.024, 0.026)),
      material,
    )
    box.castShadow = true
    // The post runs down from the head to the lock pocket's back wall.
    const postLength = at[1] - 0.025
    const postGeo = track(
      new THREE.CylinderGeometry(0.0025, 0.0025, postLength),
    )
    const post = new THREE.Mesh(postGeo, chrome)
    post.position.set(0, -postLength / 2, 0.01)
    // Three eyes, the A, M and I drops, across the face.
    const eyeGeo = track(new THREE.SphereGeometry(0.0042, 12, 8))
    const colors = [0x67e8f9, 0xf472b6, 0xfacc15]
    colors.forEach((color, i) => {
      const eye = track(
        new THREE.MeshStandardMaterial({
          color: 0x111111,
          emissive: color,
          emissiveIntensity: 0.05,
        }),
      )
      const mesh = new THREE.Mesh(eyeGeo, eye)
      mesh.position.set((i - 1) * 0.011, 0.002, 0.0135)
      head.add(mesh)
      this.eyes.push({ material: eye, glow: 0.05 })
    })
    // The antenna, and the beacon lamp on it with a turning shade.
    const mast = new THREE.Mesh(
      track(new THREE.CylinderGeometry(0.0012, 0.0012, 0.012)),
      chrome,
    )
    mast.position.set(0, 0.018, 0)
    const beaconMaterial = track(
      new THREE.MeshStandardMaterial({
        color: 0x7c2d12,
        emissive: 0xff7a1a,
        emissiveIntensity: 0.1,
      }),
    )
    const lamp = new THREE.Mesh(
      track(new THREE.SphereGeometry(0.0045, 12, 8)),
      beaconMaterial,
    )
    lamp.position.set(0, 0.0265, 0)
    const beacon = new THREE.Group()
    beacon.position.set(0, 0.0265, 0)
    const shade = new THREE.Mesh(
      track(new THREE.BoxGeometry(0.011, 0.007, 0.0015)),
      chrome,
    )
    shade.position.set(0, 0, 0.004)
    beacon.add(shade)
    head.add(box, post, mast, lamp, beacon)
    this.group.add(head)
    return { head, material, beacon, beaconMaterial }
  }

  private buildDrone(track: Track) {
    const drone = new THREE.Group()
    const shell = track(
      new THREE.MeshStandardMaterial({
        color: 0xf8fafc,
        metalness: 0.2,
        roughness: 0.4,
      }),
    )
    const trim = track(
      new THREE.MeshStandardMaterial({
        color: 0x111827,
        emissive: 0x22d3ee,
        emissiveIntensity: 0.6,
      }),
    )
    const body = new THREE.Mesh(
      track(new THREE.BoxGeometry(0.026, 0.008, 0.018)),
      shell,
    )
    body.castShadow = true
    const armGeo = track(new THREE.BoxGeometry(0.05, 0.002, 0.003))
    for (const yaw of [Math.PI / 4, -Math.PI / 4]) {
      const arm = new THREE.Mesh(armGeo, trim)
      arm.rotation.y = yaw
      drone.add(arm)
    }
    const rotorGeo = track(new THREE.CylinderGeometry(0.009, 0.009, 0.0008, 16))
    const rotorMat = track(
      new THREE.MeshStandardMaterial({
        color: 0xcbd5e1,
        transparent: true,
        opacity: 0.45,
        depthWrite: false,
      }),
    )
    for (const [x, z] of [
      [0.0177, 0.0177],
      [-0.0177, 0.0177],
      [0.0177, -0.0177],
      [-0.0177, -0.0177],
    ] as const) {
      const rotor = new THREE.Mesh(rotorGeo, rotorMat)
      rotor.position.set(x, 0.002, z)
      drone.add(rotor)
      this.rotors.push(rotor)
    }
    // The nets it carries, slung underneath: one per N-E-T target hit.
    const netGeo = track(new THREE.BoxGeometry(0.008, 0.006, 0.008))
    const netMat = track(
      new THREE.MeshStandardMaterial({
        color: 0x22c55e,
        emissive: 0x16a34a,
        emissiveIntensity: 0.5,
        roughness: 0.9,
      }),
    )
    for (let i = 0; i < 3; i++) {
      const net = new THREE.Mesh(netGeo, netMat)
      net.position.set((i - 1) * 0.009, -0.009, 0)
      net.visible = false
      drone.add(net)
      this.nets.push(net)
    }
    drone.add(body)
    this.group.add(drone)
    return drone
  }

  /** What the rules say the toys show now. */
  setPose(pose: ToyPose) {
    this.pose = pose
  }

  /** All three nets brought home: the drone flies them to the village. */
  deliver() {
    if (this.delivering === 0) this.delivering = 1
  }

  get isDelivering(): boolean {
    return this.delivering > 0
  }

  /** Where the drone is now (table space), for tests and the sparks. */
  get droneAt(): Vec3 {
    const p = this.drone.position
    return [p.x, p.y, p.z]
  }

  /** One frame of every toy's motion. */
  animate() {
    this.frame++
    const pose = this.pose
    const blinkOn = Math.floor(this.frame / BLINK) % 2 === 0
    this.huts.forEach((hut, i) => {
      const level = pose?.huts[i] ?? 'dark'
      const lit =
        level === 'playing' || level === 'wizard'
          ? blinkOn
            ? HUT_GLOW[level]
            : HUT_GLOW.visited * 0.5
          : HUT_GLOW[level]
      hut.glow += (lit - hut.glow) * GLOW_EASE
      hut.window.emissiveIntensity = hut.glow
    })
    const beacon = pose?.beacon
    this.eyes.forEach((eye, i) => {
      const on = beacon?.eyes[i] ? 2.4 : 0.05
      eye.glow += (on - eye.glow) * GLOW_EASE
      const flash = beacon?.excited && blinkOn ? 1.5 : 0
      eye.material.emissiveIntensity = eye.glow + flash
    })
    if (beacon?.turning) this.beacon.rotation.y += BEACON_TURN
    const target = beacon?.turning ? 3 : 0.1
    this.beaconMaterial.emissiveIntensity +=
      (target - this.beaconMaterial.emissiveIntensity) * GLOW_EASE
    this.headMaterial.emissiveIntensity = beacon?.excited
      ? blinkOn
        ? 0.6
        : 0.15
      : 0
    // A little bob, so the head reads as a robot, not a block.
    this.head.position.y =
      this.def.beacon.at[1] + Math.sin(this.frame * 0.05) * 0.0008
    this.animateDrone()
  }

  private animateDrone() {
    const def = this.def.drone
    const pose = this.pose?.drone
    for (const rotor of this.rotors) rotor.rotation.y += ROTOR_TURN
    const carried = this.delivering > 0 ? 3 : (pose?.nets ?? 0)
    this.nets.forEach((net, i) => (net.visible = i < carried))
    const want = new THREE.Vector3()
    if (this.delivering > 0) {
      // Out to the village, a beat over the huts, then home again.
      const t = this.delivering / DELIVERY_FRAMES
      const leg = t < 0.5 ? t / 0.5 : (1 - t) / 0.5
      const from = new THREE.Vector3(...def.perch)
      const to = new THREE.Vector3(...def.deliver)
      want.lerpVectors(from, to, Math.min(1, leg * 1.2))
      want.y += Math.sin(Math.min(1, leg) * Math.PI) * 0.02
      if (t > 0.5) for (const net of this.nets) net.visible = false
      this.delivering++
      if (this.delivering > DELIVERY_FRAMES) this.delivering = 0
    } else if (pose?.mode === 'circle') {
      this.circleAngle += 0.025
      want.set(
        def.circle.at[0] + Math.cos(this.circleAngle) * def.circle.radius,
        def.circle.at[1],
        def.circle.at[2] + Math.sin(this.circleAngle) * def.circle.radius * 0.6,
      )
    } else {
      want.set(...def.perch)
      want.y += Math.sin(this.frame * 0.04) * 0.002
    }
    this.dronePosition.lerp(want, this.delivering > 0 ? 0.2 : 0.06)
    this.drone.position.copy(this.dronePosition)
    // Lean into the way it is going.
    const dx = want.x - this.dronePosition.x
    this.drone.rotation.z = THREE.MathUtils.clamp(-dx * 8, -0.4, 0.4)
  }
}

/** A pooled spray of additive sparks, for a jackpot. */
export class Sparks {
  readonly points: THREE.Points
  private positions: Float32Array
  private colors: Float32Array
  private velocity: Float32Array
  private life: Float32Array
  private base: Float32Array
  private next = 0
  private capacity: number
  /** Sparks a burst may use, set by the quality tier (0: none). */
  budget: number

  constructor(capacity: number, track: Track) {
    this.capacity = capacity
    this.budget = capacity
    this.positions = new Float32Array(capacity * 3)
    this.colors = new Float32Array(capacity * 3)
    this.velocity = new Float32Array(capacity * 3)
    this.life = new Float32Array(capacity)
    this.base = new Float32Array(capacity * 3)
    const geometry = track(new THREE.BufferGeometry())
    geometry.setAttribute(
      'position',
      new THREE.BufferAttribute(this.positions, 3),
    )
    geometry.setAttribute('color', new THREE.BufferAttribute(this.colors, 3))
    const material = track(
      new THREE.PointsMaterial({
        size: 0.006,
        vertexColors: true,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    )
    this.points = new THREE.Points(geometry, material)
    this.points.frustumCulled = false
  }

  /** Throw a burst of sparks up from `at`. */
  burst(at: Vec3, color: THREE.Color, count = 48) {
    const n = Math.min(count, this.budget)
    for (let k = 0; k < n; k++) {
      const i = this.next
      this.next = (this.next + 1) % this.capacity
      const angle = (k / n) * Math.PI * 2 + Math.random() * 0.4
      const out = 0.25 + Math.random() * 0.35
      this.positions.set(at, i * 3)
      this.velocity[i * 3] = Math.cos(angle) * out
      this.velocity[i * 3 + 1] = 0.35 + Math.random() * 0.45
      this.velocity[i * 3 + 2] = Math.sin(angle) * out
      this.base[i * 3] = color.r
      this.base[i * 3 + 1] = color.g
      this.base[i * 3 + 2] = color.b
      this.life[i] = 1
    }
  }

  /** Sparks still in the air. */
  get live(): number {
    let n = 0
    for (const life of this.life) if (life > 0) n++
    return n
  }

  /** One frame (1/60 s) of flight and fade. */
  update() {
    const dt = 1 / 60
    for (let i = 0; i < this.capacity; i++) {
      if (this.life[i]! <= 0) continue
      this.life[i] = Math.max(0, this.life[i]! - dt * 1.4)
      this.velocity[i * 3 + 1]! -= 1.6 * dt
      for (let a = 0; a < 3; a++) {
        this.positions[i * 3 + a]! += this.velocity[i * 3 + a]! * dt * 0.25
        this.colors[i * 3 + a] = this.base[i * 3 + a]! * this.life[i]!
      }
    }
    const geometry = this.points.geometry
    geometry.attributes.position!.needsUpdate = true
    geometry.attributes.color!.needsUpdate = true
  }
}

/** Points behind a fast ball: the last few positions, fading. */
export class Trail {
  readonly points: THREE.Points
  private positions: Float32Array
  private colors: Float32Array
  private history = new Map<number, Vec3[]>()
  private slots: number
  /** Off on the low tier. */
  enabled = true

  /** Below this speed (m/s across the playfield) a ball leaves no trail. */
  static readonly MIN_SPEED = 1.4
  static readonly LENGTH = 8

  constructor(maxBalls: number, track: Track) {
    this.slots = maxBalls * Trail.LENGTH
    this.positions = new Float32Array(this.slots * 3)
    this.colors = new Float32Array(this.slots * 3)
    const geometry = track(new THREE.BufferGeometry())
    geometry.setAttribute(
      'position',
      new THREE.BufferAttribute(this.positions, 3),
    )
    geometry.setAttribute('color', new THREE.BufferAttribute(this.colors, 3))
    const material = track(
      new THREE.PointsMaterial({
        size: 0.014,
        vertexColors: true,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    )
    this.points = new THREE.Points(geometry, material)
    this.points.frustumCulled = false
  }

  /** Follow the balls: record where each is and draw its fading streak. */
  update(balls: Array<{ id: number; position: Vec3; speed: number }>) {
    this.colors.fill(0)
    if (!this.enabled) {
      this.history.clear()
      this.points.geometry.attributes.color!.needsUpdate = true
      return
    }
    const seen = new Set<number>()
    let slot = 0
    for (const ball of balls) {
      seen.add(ball.id)
      const trail = this.history.get(ball.id) ?? []
      trail.unshift(ball.position)
      if (trail.length > Trail.LENGTH) trail.length = Trail.LENGTH
      this.history.set(ball.id, trail)
      const strength = Math.min(
        1,
        Math.max(0, (ball.speed - Trail.MIN_SPEED) / Trail.MIN_SPEED),
      )
      if (strength === 0) continue
      for (let k = 1; k < trail.length; k++) {
        if (slot >= this.slots) break
        const fade = strength * (1 - k / Trail.LENGTH) * 0.5
        this.positions.set(trail[k]!, slot * 3)
        this.colors[slot * 3] = 0.55 * fade
        this.colors[slot * 3 + 1] = 0.85 * fade
        this.colors[slot * 3 + 2] = 1 * fade
        slot++
      }
    }
    for (const id of this.history.keys())
      if (!seen.has(id)) this.history.delete(id)
    const geometry = this.points.geometry
    geometry.attributes.position!.needsUpdate = true
    geometry.attributes.color!.needsUpdate = true
  }

  /** Trail points lit this frame (for tests). */
  get lit(): number {
    let n = 0
    for (let i = 0; i < this.slots; i++)
      if (this.colors[i * 3]! + this.colors[i * 3 + 2]! > 0) n++
    return n
  }
}
