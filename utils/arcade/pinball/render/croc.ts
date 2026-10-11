// /utils/arcade/pinball/render/croc.ts
//
// The River Croc (conductor zuzu-pinball/t-015): Zuzu's animatronic toy on
// the left bank. Scenery only, like the heroes: the physics has the mouth's
// scoop and its jaw gate, and the rules decide the phase. This builds the
// sculpted head and eases it through the cycle, frame by frame:
//
//   submerged   head sunk to the eyes, jaws shut, the gate closed
//   rising      breaking the water
//   open        jaws wide, the throat and waterline glowing: shoot it
//   captured    jaws snapped shut on the ball
//   death-roll  the whole head rolling over in a churn of water
//   spit        jaws flung open as the ball goes out to the inlane
//
// The pose's cue (t-016) stirs the waterline on top: 'watering-hole' while
// the Watering Hole runs, 'hungry' while an orbit has lit his mouth. With
// reduced motion the head never rolls and nothing flickers: the death roll
// and the cues show as steady, brighter water and eyes instead.
//
// Every geometry and material goes through the scene's track().

import * as THREE from 'three'
import type { AnimatronicDef } from '../types'
import type { AnimatronicPose } from '../rules/ruleset'

type Track = <T extends { dispose(): void }>(resource: T) => T

/** Jaw gape when wide open, radians. */
const JAW_OPEN = 0.72
/** How far the head sinks below the waterline when submerged, metres. */
const SUNK = 0.022
/** How fast the jaw, head height and glow follow the phase (0..1 per frame). */
const EASE = 0.22
const SNAP = 0.55

const SCALE_GREEN = 0x3f4a24
const BELLY = 0x8c8a4a
const TOOTH = 0xefe6c4
const EYE = 0xffb230
const WATER = 0x3fbfb0

export class CrocToy {
  readonly group = new THREE.Group()
  private head = new THREE.Group()
  private upper = new THREE.Group()
  private lower = new THREE.Group()
  private eyes: THREE.MeshStandardMaterial
  private throat: THREE.MeshStandardMaterial
  private water: THREE.MeshStandardMaterial
  private ring: THREE.Mesh
  private pose: AnimatronicPose = { phase: 'open', age: 0 }
  private jaw = JAW_OPEN
  private sink = 0
  private roll = 0
  private glow = 1
  private stir = 0
  private frame = 0
  private readonly still: boolean

  constructor(
    def: AnimatronicDef,
    track: Track,
    options: { reducedMotion?: boolean } = {},
  ) {
    this.still = options.reducedMotion ?? false
    const scale = def.scale ?? 1
    this.group.position.set(def.at[0], def.at[1], def.at[2])
    this.group.rotation.y = def.yaw ?? 0
    this.group.scale.setScalar(scale)

    const hide = track(
      new THREE.MeshStandardMaterial({ color: SCALE_GREEN, roughness: 0.75 }),
    )
    const belly = track(
      new THREE.MeshStandardMaterial({ color: BELLY, roughness: 0.8 }),
    )
    const tooth = track(
      new THREE.MeshStandardMaterial({ color: TOOTH, roughness: 0.4 }),
    )
    this.eyes = track(
      new THREE.MeshStandardMaterial({
        color: EYE,
        emissive: EYE,
        emissiveIntensity: 1.5,
      }),
    )
    this.throat = track(
      new THREE.MeshStandardMaterial({
        color: 0x3a0f14,
        emissive: WATER,
        emissiveIntensity: 0.6,
        roughness: 0.9,
      }),
    )
    this.water = track(
      new THREE.MeshStandardMaterial({
        color: WATER,
        emissive: WATER,
        emissiveIntensity: 0.5,
        transparent: true,
        opacity: 0.55,
        roughness: 0.2,
      }),
    )

    // The pool he lies in, and the glowing waterline ring around the mouth.
    const pool = new THREE.Mesh(
      track(new THREE.CircleGeometry(0.05, 32)),
      this.water,
    )
    pool.rotation.x = -Math.PI / 2
    pool.position.set(0, 0.0012, -0.025)
    pool.scale.set(1, 1.5, 1)
    this.ring = new THREE.Mesh(
      track(new THREE.TorusGeometry(0.03, 0.0025, 8, 32)),
      this.water,
    )
    this.ring.rotation.x = -Math.PI / 2
    this.ring.position.set(0, 0.002, 0.004)
    this.group.add(pool, this.ring)

    // The head pivots at the back of the jaws, looking down-table (+z).
    this.head.position.set(0, 0.012, -0.02)
    this.group.add(this.head)

    // Skull and brow behind the hinge, with the scarred ridges up the neck.
    const skull = new THREE.Mesh(
      track(new THREE.SphereGeometry(0.022, 16, 12)),
      hide,
    )
    skull.scale.set(1.15, 0.65, 1.2)
    skull.position.set(0, 0.004, -0.012)
    this.head.add(skull)
    const ridge = track(new THREE.ConeGeometry(0.004, 0.009, 5))
    for (let i = 0; i < 6; i++) {
      for (const side of [-1, 1]) {
        const scute = new THREE.Mesh(ridge, hide)
        scute.position.set(side * 0.006, 0.014 - i * 0.0012, -0.02 - i * 0.009)
        this.head.add(scute)
      }
    }
    for (const side of [-1, 1]) {
      const eye = new THREE.Mesh(
        track(new THREE.SphereGeometry(0.0045, 12, 8)),
        this.eyes,
      )
      eye.position.set(side * 0.011, 0.016, -0.004)
      this.head.add(eye)
    }

    // Upper and lower jaws hinge together at the head's origin.
    const snout = (length: number, width: number, height: number) => {
      const geo = track(
        new THREE.CylinderGeometry(width * 0.55, width, length, 10),
      )
      geo.rotateX(Math.PI / 2)
      geo.translate(0, 0, length / 2)
      const mesh = new THREE.Mesh(geo, hide)
      mesh.scale.y = height / width
      return mesh
    }
    const top = snout(0.05, 0.016, 0.007)
    top.position.y = 0.004
    this.upper.add(top)
    const bottom = snout(0.046, 0.014, 0.005)
    bottom.position.y = -0.004
    const jawBelly = new THREE.Mesh(
      track(new THREE.BoxGeometry(0.018, 0.002, 0.04)),
      belly,
    )
    jawBelly.position.set(0, -0.008, 0.022)
    this.lower.add(bottom, jawBelly)
    const fang = track(new THREE.ConeGeometry(0.0018, 0.006, 4))
    for (let i = 0; i < 7; i++) {
      const z = 0.008 + i * 0.006
      const x = 0.011 - i * 0.0008
      for (const side of [-1, 1]) {
        const up = new THREE.Mesh(fang, tooth)
        up.rotation.x = Math.PI
        up.position.set(side * x, 0.0005, z)
        this.upper.add(up)
        const down = new THREE.Mesh(fang, tooth)
        down.position.set(side * (x - 0.001), 0.0002, z + 0.003)
        this.lower.add(down)
      }
    }
    // The throat: what the player shoots for.
    const throat = new THREE.Mesh(
      track(new THREE.SphereGeometry(0.012, 14, 10)),
      this.throat,
    )
    throat.scale.set(1, 0.55, 1)
    throat.position.set(0, 0, 0.004)
    this.head.add(this.upper, this.lower, throat)
    for (const mesh of [skull, top, bottom]) mesh.castShadow = true
  }

  setPose(pose: AnimatronicPose) {
    this.pose = pose
  }

  /** One frame toward the pose. */
  animate() {
    this.frame++
    const { phase, age, cue } = this.pose
    const still = this.still
    /** A slow swell, or a steady middle with reduced motion. */
    const swell = (rate: number) => (still ? 0 : Math.sin(this.frame * rate))
    let jaw = 0
    let sink = 0
    let roll = 0
    let glow = 0.6
    switch (phase) {
      case 'submerged':
        sink = SUNK
        glow = 0.15
        break
      case 'rising':
        sink = SUNK * Math.max(0, 1 - age / 0.6)
        jaw = JAW_OPEN * Math.min(1, age / 0.6) * 0.5
        glow = 0.6
        break
      case 'open':
        // A slow, hungry breath; wide and bright when an orbit lit him.
        jaw =
          cue === 'hungry' ? JAW_OPEN : JAW_OPEN * (0.85 + 0.15 * swell(0.06))
        glow = (cue === 'hungry' ? 1.8 : 1) + 0.5 * swell(0.12)
        break
      case 'captured':
        jaw = 0
        glow = 2.2
        break
      case 'death-roll':
        roll = still ? 0 : Math.min(1, age / 0.5) * Math.PI * 2
        glow = still ? 3.2 : 2.6
        break
      case 'spit':
        jaw = JAW_OPEN * (age < 0.15 ? 1 : Math.max(0, 1 - (age - 0.15) / 0.3))
        glow = 1.6
        break
    }
    const snap =
      !still && (phase === 'captured' || phase === 'spit') ? SNAP : EASE
    // The waterline's stir: astir in the Watering Hole, churning when lit.
    const stir = cue === 'hungry' ? 1 : cue === 'watering-hole' ? 0.5 : 0
    this.stir += (stir - this.stir) * EASE
    this.jaw += (jaw - this.jaw) * snap
    this.sink += (sink - this.sink) * EASE
    this.roll = phase === 'death-roll' ? roll : this.roll * (1 - EASE)
    this.glow += (glow - this.glow) * EASE
    this.upper.rotation.x = -this.jaw * 0.75
    this.lower.rotation.x = this.jaw * 0.25
    this.head.position.y = 0.012 - this.sink
    this.head.rotation.z = this.roll
    this.eyes.emissiveIntensity = 0.6 + this.glow
    this.throat.emissiveIntensity = 0.2 + this.glow * 0.6
    this.water.emissiveIntensity =
      0.25 + this.glow * 0.35 + this.stir * (0.9 + 0.4 * swell(0.3))
    this.ring.scale.setScalar(
      (phase === 'death-roll' ? 1.25 : 1) +
        this.stir * (0.12 + 0.04 * swell(0.3)),
    )
  }

  /** The jaw gape the toy is showing, radians (for tests). */
  get gape(): number {
    return this.jaw
  }

  /** The head's roll, radians (for tests). */
  get rolled(): number {
    return this.head.rotation.z
  }

  /** The waterline's glow (for tests). */
  get waterline(): number {
    return this.water.emissiveIntensity
  }
}
