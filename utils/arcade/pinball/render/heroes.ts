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
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js'
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

/** How far a wing swings each way as AMI flutters, radians. */
const WING_FLAP = 0.35
const WING_OPEN = 0.45

/**
 * One butterfly wing, upper and lower lobe, in its own plane: x outward from
 * the body, y up. UVs span the wing's bounds so its painted art fills it.
 */
function wingGeometry(): THREE.ShapeGeometry {
  const shape = new THREE.Shape()
  shape.moveTo(0, 0.002)
  shape.bezierCurveTo(0.006, 0.03, 0.03, 0.036, 0.034, 0.02)
  shape.bezierCurveTo(0.037, 0.008, 0.02, 0.002, 0.004, -0.001)
  shape.bezierCurveTo(0.02, -0.006, 0.026, -0.02, 0.016, -0.024)
  shape.bezierCurveTo(0.008, -0.026, 0.002, -0.014, 0, 0.002)
  const geo = new THREE.ShapeGeometry(shape, 12)
  const position = geo.getAttribute('position')
  const uv = geo.getAttribute('uv')
  for (let i = 0; i < position.count; i++) {
    uv.setXY(i, position.getX(i) / 0.037, (position.getY(i) + 0.026) / 0.062)
  }
  return geo
}

/** The wings' paint: amber at the body through orange and magenta to violet, cyan eyespots. */
function wingArt(track: Track): THREE.Texture | null {
  if (typeof document === 'undefined') return null
  const size = 128
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const g = canvas.getContext('2d')
  if (!g) return null
  const glow = g.createRadialGradient(0, size * 0.58, 4, 0, size * 0.58, size)
  glow.addColorStop(0, '#fde68a')
  glow.addColorStop(0.3, '#fb923c')
  glow.addColorStop(0.62, '#db2777')
  glow.addColorStop(0.9, '#4c1d95')
  g.fillStyle = glow
  g.fillRect(0, 0, size, size)
  g.strokeStyle = 'rgba(46,16,62,0.7)'
  g.lineWidth = 2
  for (const a of [-0.9, -0.45, 0, 0.4, 0.8]) {
    g.beginPath()
    g.moveTo(0, size * 0.58)
    g.lineTo(Math.cos(a) * size, size * 0.58 + Math.sin(a) * size)
    g.stroke()
  }
  g.fillStyle = '#67e8f9'
  for (const [x, y, r] of [
    [96, 28, 9],
    [70, 18, 5],
    [62, 104, 6],
  ] as const) {
    g.beginPath()
    g.arc(x, y, r, 0, Math.PI * 2)
    g.fill()
  }
  const texture = track(new THREE.CanvasTexture(canvas))
  texture.colorSpace = THREE.SRGBColorSpace
  return texture
}

/** Frames a care package takes to fly from the depot to its hut. */
const PARCEL_FLIGHT = 80
/** Frames between one package leaving and the next. */
const PARCEL_STAGGER = 14
/** How high a package arcs over the table on its way, metres. */
const PARCEL_ARC = 0.12
/** A hut's window flare as a package lands at its door. */
const PARCEL_ARRIVAL_GLOW = 5

type Parcel = {
  group: THREE.Group
  slot: THREE.Vector3
  /** Frames into its flight; negative while it waits its turn, 0 at rest. */
  flight: number
  hut: number
  shown: number
}

/** A parcel: kraft card with a ribbon round it in a village colour. */
function buildParcel(
  box: THREE.BoxGeometry,
  ribbon: THREE.BoxGeometry,
  card: THREE.Material,
  tie: THREE.Material,
): THREE.Group {
  const group = new THREE.Group()
  const body = new THREE.Mesh(box, card)
  body.castShadow = true
  const across = new THREE.Mesh(ribbon, tie)
  const along = new THREE.Mesh(ribbon, tie)
  along.rotation.y = Math.PI / 2
  group.add(body, across, along)
  group.scale.setScalar(0)
  return group
}

export class Heroes {
  readonly group = new THREE.Group()
  private def: HeroDef
  private huts: Array<{ window: THREE.MeshStandardMaterial; glow: number }> = []
  private head: THREE.Group
  private headMaterial: THREE.MeshStandardMaterial
  private eyes: Array<{ material: THREE.MeshStandardMaterial; glow: number }> =
    []
  private beacon: THREE.Group
  private wings: Array<{ group: THREE.Group; side: number }> = []
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
  private parcels: Parcel[] = []
  private sending = false

  constructor(def: HeroDef, track: Track) {
    this.def = def
    this.buildHuts(track)
    const head = this.buildBeacon(track)
    this.head = head.head
    this.headMaterial = head.material
    this.beacon = head.beacon
    this.beaconMaterial = head.beaconMaterial
    this.buildDepot(track)
    this.drone = this.buildDrone(track)
    this.dronePosition.set(...def.drone.perch)
    this.drone.position.copy(this.dronePosition)
  }

  /**
   * Round village huts (t-028): mud walls on a darker footing, a stepped
   * thatch roof with an overhang, a door, and a lit window either side of it.
   */
  private buildHuts(track: Track) {
    const wall = track(new THREE.CylinderGeometry(0.0092, 0.0098, 0.013, 14))
    wall.translate(0, 0.0065, 0)
    const footing = track(
      new THREE.CylinderGeometry(0.0102, 0.0104, 0.0025, 14),
    )
    footing.translate(0, 0.00125, 0)
    const thatch = track(
      new THREE.LatheGeometry(
        (
          [
            [0.0001, 0.0262],
            [0.0034, 0.0222],
            [0.0042, 0.0214],
            [0.0074, 0.0186],
            [0.0082, 0.0178],
            [0.0118, 0.0142],
            [0.0128, 0.0124],
            [0.0112, 0.0122],
          ] as const
        ).map(([r, y]) => new THREE.Vector2(r, y)),
        14,
      ),
    )
    const door = track(new THREE.PlaneGeometry(0.0046, 0.0078))
    const pane = track(new THREE.PlaneGeometry(0.0034, 0.0034))
    const wallMat = track(
      new THREE.MeshStandardMaterial({ color: 0xc98a4b, roughness: 0.9 }),
    )
    const footMat = track(
      new THREE.MeshStandardMaterial({ color: 0x6b3f22, roughness: 0.9 }),
    )
    const roofMat = track(
      new THREE.MeshStandardMaterial({
        color: 0xd9b25f,
        roughness: 0.95,
        side: THREE.DoubleSide,
      }),
    )
    const doorMat = track(
      new THREE.MeshStandardMaterial({ color: 0x3b2314, roughness: 0.8 }),
    )
    for (const spot of this.def.huts) {
      const hut = new THREE.Group()
      hut.position.set(...spot.at)
      hut.rotation.y = spot.yaw
      hut.scale.setScalar(HUT_SCALE)
      const body = new THREE.Mesh(wall, wallMat)
      body.castShadow = true
      const foot = new THREE.Mesh(footing, footMat)
      const top = new THREE.Mesh(thatch, roofMat)
      top.castShadow = true
      const entry = new THREE.Mesh(door, doorMat)
      entry.position.set(0, 0.0039, 0.0099)
      const window = track(
        new THREE.MeshStandardMaterial({
          color: 0x1c1208,
          emissive: 0xffb347,
          emissiveIntensity: HUT_GLOW.dark,
        }),
      )
      hut.add(body, foot, top, entry)
      for (const a of [-0.75, 0.75]) {
        const glass = new THREE.Mesh(pane, window)
        glass.position.set(Math.sin(a) * 0.0099, 0.0075, Math.cos(a) * 0.0099)
        glass.rotation.y = a
        hut.add(glass)
      }
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
      track(new RoundedBoxGeometry(0.036, 0.024, 0.026, 3, 0.007)),
      material,
    )
    box.castShadow = true
    // A dark glass visor the eyes shine through, and an ear pod each side.
    const visor = new THREE.Mesh(
      track(new RoundedBoxGeometry(0.031, 0.012, 0.004, 2, 0.0018)),
      track(
        new THREE.MeshPhysicalMaterial({
          color: 0x0b1020,
          roughness: 0.08,
          clearcoat: 1,
        }),
      ),
    )
    visor.position.set(0, 0.002, 0.0118)
    const earGeo = track(new THREE.CylinderGeometry(0.0055, 0.0055, 0.004, 16))
    earGeo.rotateZ(Math.PI / 2)
    for (const side of [-1, 1]) {
      const ear = new THREE.Mesh(earGeo, chrome)
      ear.position.set(side * 0.019, 0.001, 0)
      head.add(ear)
    }
    const collar = new THREE.Mesh(
      track(new THREE.TorusGeometry(0.006, 0.0018, 8, 20)),
      chrome,
    )
    collar.rotation.x = Math.PI / 2
    collar.position.set(0, -0.0125, 0.004)
    head.add(visor, collar)
    // AMI's butterfly wings, behind the head; they flutter (t-028).
    const art = wingArt(track)
    const wingMat = track(
      new THREE.MeshStandardMaterial({
        color: art ? 0xffffff : 0xfb923c,
        map: art,
        emissive: art ? 0xffffff : 0xdb2777,
        emissiveMap: art,
        emissiveIntensity: 0.55,
        roughness: 0.5,
        side: THREE.DoubleSide,
      }),
    )
    const wingGeo = track(wingGeometry())
    for (const side of [-1, 1]) {
      const group = new THREE.Group()
      group.position.set(side * 0.006, 0.006, -0.012)
      const wing = new THREE.Mesh(wingGeo, wingMat)
      wing.scale.x = side
      wing.castShadow = true
      group.add(wing)
      group.rotation.y = side * WING_OPEN
      head.add(group)
      this.wings.push({ group, side })
    }
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
      track(new RoundedBoxGeometry(0.026, 0.009, 0.018, 3, 0.0035)),
      shell,
    )
    body.castShadow = true
    const dome = new THREE.Mesh(
      track(
        new THREE.SphereGeometry(0.0055, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2),
      ),
      track(
        new THREE.MeshPhysicalMaterial({
          color: 0x0e7490,
          roughness: 0.05,
          clearcoat: 1,
          emissive: 0x22d3ee,
          emissiveIntensity: 0.3,
        }),
      ),
    )
    dome.position.y = 0.0042
    drone.add(dome)
    const armGeo = track(new THREE.CylinderGeometry(0.0013, 0.0013, 0.05, 8))
    armGeo.rotateZ(Math.PI / 2)
    for (const yaw of [Math.PI / 4, -Math.PI / 4]) {
      const arm = new THREE.Mesh(armGeo, trim)
      arm.rotation.y = yaw
      drone.add(arm)
    }
    const podGeo = track(new THREE.CylinderGeometry(0.0024, 0.0028, 0.004, 12))
    const skidGeo = track(new THREE.CylinderGeometry(0.0008, 0.0008, 0.02, 6))
    skidGeo.rotateX(Math.PI / 2)
    for (const x of [-0.008, 0.008]) {
      const skid = new THREE.Mesh(skidGeo, trim)
      skid.position.set(x, -0.0065, 0)
      drone.add(skid)
    }
    const bladeGeo = track(new THREE.BoxGeometry(0.017, 0.0004, 0.0022))
    const bladeMat = track(
      new THREE.MeshStandardMaterial({ color: 0x1f2937, roughness: 0.5 }),
    )
    const rotorGeo = track(new THREE.CylinderGeometry(0.009, 0.009, 0.0008, 16))
    const rotorMat = track(
      new THREE.MeshStandardMaterial({
        color: 0xcbd5e1,
        transparent: true,
        opacity: 0.18,
        depthWrite: false,
      }),
    )
    for (const [x, z] of [
      [0.0177, 0.0177],
      [-0.0177, 0.0177],
      [0.0177, -0.0177],
      [-0.0177, -0.0177],
    ] as const) {
      const pod = new THREE.Mesh(podGeo, shell)
      pod.position.set(x, 0, z)
      const rotor = new THREE.Mesh(rotorGeo, rotorMat)
      rotor.position.set(x, 0.0025, z)
      const blade = new THREE.Mesh(bladeGeo, bladeMat)
      rotor.add(blade)
      drone.add(pod, rotor)
      this.rotors.push(rotor)
    }
    // The nets it carries, slung underneath: one per N-E-T target hit.
    const netGeo = track(new THREE.SphereGeometry(0.0046, 12, 8))
    netGeo.scale(1, 0.72, 1)
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

  /**
   * The Care Package Depot (t-031): a little post house over the lock, its
   * roof on the pocket's walls under AMI, and a parcel for every package
   * slot (shown as balls are locked).
   */
  private buildDepot(track: Track) {
    const def = this.def.depot
    if (!def) return
    const wood = track(
      new THREE.MeshStandardMaterial({ color: 0x7c4a2a, roughness: 0.75 }),
    )
    const tiles = track(
      new THREE.MeshStandardMaterial({
        color: 0x0f766e,
        roughness: 0.55,
        side: THREE.DoubleSide,
      }),
    )
    const [x, y, z] = def.roof
    const half = def.width / 2
    const pitch = 0.009
    for (const side of [-1, 1]) {
      const slope = Math.hypot(def.depth / 2, pitch)
      const plane = new THREE.Mesh(
        track(new THREE.PlaneGeometry(def.width, slope)),
        tiles,
      )
      plane.rotation.x = -Math.PI / 2 + side * Math.atan2(pitch, def.depth / 2)
      plane.position.set(x, y + pitch / 2, z + (side * def.depth) / 4)
      plane.castShadow = true
      this.group.add(plane)
    }
    const postGeo = track(new THREE.CylinderGeometry(0.0018, 0.0018, 0.016, 8))
    for (const px of [-half + 0.006, half - 0.006])
      for (const pz of [z - def.depth / 2 + 0.003, z + def.depth / 2 - 0.003]) {
        const post = new THREE.Mesh(postGeo, wood)
        post.position.set(x + px, y - 0.008, pz)
        this.group.add(post)
      }
    const ridge = new THREE.Mesh(
      track(new THREE.CylinderGeometry(0.0015, 0.0015, def.width, 8)),
      wood,
    )
    ridge.rotation.z = Math.PI / 2
    ridge.position.set(x, y + pitch, z)
    this.group.add(ridge)
    const box = track(new THREE.BoxGeometry(0.011, 0.009, 0.011))
    const ribbon = track(new THREE.BoxGeometry(0.0118, 0.0094, 0.0024))
    const card = track(
      new THREE.MeshStandardMaterial({ color: 0xc8955a, roughness: 0.85 }),
    )
    const ties = [0xf472b6, 0x22d3ee, 0xfacc15].map((color) =>
      track(
        new THREE.MeshStandardMaterial({
          color,
          emissive: color,
          emissiveIntensity: 0.35,
          roughness: 0.4,
        }),
      ),
    )
    def.slots.forEach((at, i) => {
      const group = buildParcel(box, ribbon, card, ties[i % ties.length]!)
      const slot = new THREE.Vector3(...at)
      group.position.copy(slot)
      this.group.add(group)
      this.parcels.push({
        group,
        slot,
        flight: 0,
        hut: (i * 2 + 1) % Math.max(1, this.def.huts.length),
        shown: 0,
      })
    })
  }

  /** Packages on the depot now, and in the air (for tests). */
  get parcelsWaiting(): number {
    return this.parcels.filter((p) => p.flight === 0 && p.shown > 0.5).length
  }

  get parcelsFlying(): number {
    return this.parcels.filter((p) => p.flight !== 0).length
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
    const flap =
      Math.sin(this.frame * (beacon?.excited ? 0.45 : 0.12)) * WING_FLAP
    for (const wing of this.wings)
      wing.group.rotation.y = wing.side * (WING_OPEN + flap)
    // A little bob, so the head reads as a robot, not a block.
    this.head.position.y =
      this.def.beacon.at[1] + Math.sin(this.frame * 0.05) * 0.0008
    this.animateDrone()
    this.animateDepot()
  }

  /**
   * Packed parcels pop in on the depot; when multiball starts every one the
   * depot needed is sent, one after another, to a hut whose window flares
   * as it lands.
   */
  private animateDepot() {
    const depot = this.pose?.depot
    if (!depot || !this.parcels.length) return
    if (depot.sending && !this.sending) {
      const count = Math.min(depot.needed, this.parcels.length)
      for (let i = 0; i < count; i++) {
        const parcel = this.parcels[i]!
        parcel.flight = i === 0 ? 1 : -i * PARCEL_STAGGER
        parcel.shown = 1
      }
    }
    this.sending = depot.sending
    this.parcels.forEach((parcel, i) => {
      if (parcel.flight < 0) {
        parcel.flight++
        if (parcel.flight === 0) parcel.flight = 1
      } else if (parcel.flight > 0) {
        parcel.flight++
      }
      if (parcel.flight > 0) {
        const t = Math.min(1, parcel.flight / PARCEL_FLIGHT)
        const hut = this.def.huts[parcel.hut]
        const to = hut ? new THREE.Vector3(...hut.at) : parcel.slot
        parcel.group.position.lerpVectors(parcel.slot, to, t)
        parcel.group.position.y += 4 * t * (1 - t) * PARCEL_ARC
        parcel.group.rotation.y += 0.12
        if (t >= 1) {
          parcel.flight = 0
          parcel.shown = 0
          parcel.group.position.copy(parcel.slot)
          parcel.group.rotation.y = 0
          const window = this.huts[parcel.hut]
          if (window) window.glow = PARCEL_ARRIVAL_GLOW
        }
      } else if (parcel.flight === 0) {
        const want = !depot.sending && i < depot.packed ? 1 : 0
        parcel.shown += (want - parcel.shown) * GLOW_EASE * 1.5
        if (Math.abs(want - parcel.shown) < 0.01) parcel.shown = want
      }
      parcel.group.scale.setScalar(parcel.flight !== 0 ? 1 : parcel.shown)
      parcel.group.visible = parcel.flight !== 0 || parcel.shown > 0.01
    })
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
