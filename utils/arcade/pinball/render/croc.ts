// /utils/arcade/pinball/render/croc.ts
//
// The River Croc (conductor zuzu-pinball/t-015, rebuilt for t-018): Zuzu's
// animatronic toy on the left bank, the table's signature piece. Scenery
// only, like the heroes: the physics has the mouth's scoop and its jaw gate,
// and the rules decide the phase. This sculpts him and plays each phase as a
// staged beat, frame by frame:
//
//   submerged   sunk to the eyes and nostrils, bubbles rising, lids heavy
//   rising      a dip, a burst of bubbles, then he surges up streaming water
//   open        jaws wide, throat glowing, breathing; head and eyes follow
//               the nearest ball. Hungry (an orbit lit him): eyes narrowed,
//               jaws chomping, tail lashing
//   captured    the jaws slam shut with a clack, the head jerks, a splash
//   death-roll  the whole croc rolls over in a churn of spray and rings
//   spit        he rears back, then lunges and flings his jaws open
//
// The head is lofted from sections (a crocodile's V-snout with its nostril
// bulb, eye bosses, a heavy skull), with interlocking teeth, gums and
// tongue, slit-pupilled eyes under blinking lids, keeled scutes and scars;
// the body and tail lie in the river behind him, mostly under the surface
// as a real croc does, so balls passing behind him skim the water. Motion
// comes from damped springs, so every move anticipates, overshoots and
// settles. With reduced motion nothing rolls, shakes, sprays, tracks or
// flickers: the poses still change, and the death roll and the cues show as
// steady, brighter water and eyes instead.
//
// Every geometry, material and texture goes through the scene's track().

import * as THREE from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import type { AnimatronicDef } from '../types'
import type { AnimatronicPose } from '../rules/ruleset'

type Track = <T extends { dispose(): void }>(resource: T) => T

/** Jaw gape when wide open, radians. */
const JAW_OPEN = 0.72
/** How far the head sinks when submerged: the eyes stay above the water. */
const SUNK = 0.02
/** The hinge of the jaws above the playfield, and behind the toy's origin. */
const HINGE_Y = 0.012
const HINGE_Z = -0.02
/** The height of his spine: the axis he rolls about. */
const SPINE_Y = 0.005
/** The river's surface, just above the playfield. */
const WATER_Y = 0.0015
/** One animation frame, seconds. */
const DT = 1 / 60
/** How fast the glow and the waterline's stir follow the phase. */
const EASE = 0.22
/** Spray particles in the pool, and their pull back to the water. */
const SPRAY = 180
const SPRAY_GRAVITY = 2.6
/** The farthest ball he watches, metres. */
const WATCH_RANGE = 0.35

const BACK = 0x2b3519
const FLANK = 0x4f5b29
const BELLY = 0xb3a868
const SCAR = 0xa8968a
const TOOTH = 0xefe3bd
const GUM = 0x9c3c48
const TONGUE = 0xc06a62
const EYE = 0xffb230
const WATER = 0x3fbfb0

/** A damped spring toward a target: anticipation, overshoot and settle. */
class Spring {
  value: number
  target: number
  velocity = 0
  constructor(
    value: number,
    public stiffness: number,
    public damping: number,
  ) {
    this.value = value
    this.target = value
  }

  /** Tune it: `hz` how quick, `zeta` how bouncy (1 settles without overshoot). */
  tune(hz: number, zeta: number) {
    const w = 2 * Math.PI * hz
    this.stiffness = w * w
    this.damping = 2 * zeta * w
  }

  step() {
    const a =
      this.stiffness * (this.target - this.value) - this.damping * this.velocity
    this.velocity += a * DT
    this.value += this.velocity * DT
    return this.value
  }
}

/** A cheap, repeatable hash in 0..1, for the sculpt's irregularity. */
function hash(i: number, j = 0): number {
  const s = Math.sin(i * 127.1 + j * 311.7) * 43758.5453
  return s - Math.floor(s)
}

type Section = {
  /** Along the body (+z toward the snout's tip). */
  z: number
  /** Half width, height above the centre line and depth below it. */
  w: number
  top: number
  bottom: number
  /** The centre line's height. */
  y?: number
}

/**
 * A loft through superelliptic sections along z: a sculpted, tapering form
 * with a dark back, olive flanks and a pale belly, mottled, and UVs for the
 * scale relief. Closed at both ends.
 */
function loft(
  sections: Section[],
  segments = 18,
  power = 2.6,
  /** Colour the inside of a jaw: the underside ('down') or the top ('up'). */
  mouth?: 'up' | 'down',
) {
  const positions: number[] = []
  const colors: number[] = []
  const uvs: number[] = []
  const indices: number[] = []
  const back = new THREE.Color(BACK)
  const flank = new THREE.Color(FLANK)
  const belly = new THREE.Color(BELLY)
  const gum = new THREE.Color(GUM)
  const c = new THREE.Color()
  const e = 2 / power
  // Faces wind outward whichever way along z the sections run.
  const forward = sections.at(-1)!.z >= sections[0]!.z
  const length = Math.abs(sections.at(-1)!.z - sections[0]!.z) || 1
  sections.forEach((s, i) => {
    for (let j = 0; j <= segments; j++) {
      const a = (j / segments) * Math.PI * 2
      const ca = Math.cos(a)
      const sa = Math.sin(a)
      const x = s.w * Math.sign(ca) * Math.abs(ca) ** e
      const up = sa >= 0
      const y =
        (s.y ?? 0) + (up ? s.top : s.bottom) * Math.sign(sa) * Math.abs(sa) ** e
      positions.push(x, y, s.z)
      // Back to belly by how far round the section the vertex is.
      if (sa > 0.45) c.copy(flank).lerp(back, (sa - 0.45) / 0.55)
      else if (sa > -0.25) c.copy(belly).lerp(flank, (sa + 0.25) / 0.7)
      else c.copy(belly)
      const inMouth = s.z < sections.at(-1)!.z - 0.006
      if (
        inMouth &&
        ((mouth === 'down' && sa < -0.55) || (mouth === 'up' && sa > 0.55))
      )
        c.copy(gum)
      const mottle = 0.86 + 0.24 * hash(i * 7.3, j * 3.1)
      colors.push(c.r * mottle, c.g * mottle, c.b * mottle)
      uvs.push(j / segments, (Math.abs(s.z - sections[0]!.z) / length) * 3)
    }
  })
  const ring = segments + 1
  for (let i = 0; i < sections.length - 1; i++)
    for (let j = 0; j < segments; j++) {
      const a = i * ring + j
      const b = a + ring
      if (forward) indices.push(a, a + 1, b, b, a + 1, b + 1)
      else indices.push(a, b, a + 1, b, b + 1, a + 1)
    }
  // Caps: a fan from each end's centre.
  for (const [i, flip] of [
    [0, true],
    [sections.length - 1, false],
  ] as const) {
    const s = sections[i]!
    const centre = positions.length / 3
    positions.push(0, s.y ?? 0, s.z)
    colors.push(flank.r, flank.g, flank.b)
    uvs.push(0.5, 0)
    for (let j = 0; j < segments; j++) {
      const a = i * ring + j
      if (flip === forward) indices.push(centre, a, a + 1)
      else indices.push(centre, a + 1, a)
    }
  }
  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute(
    'position',
    new THREE.Float32BufferAttribute(positions, 3),
  )
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3))
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2))
  geometry.setIndex(indices)
  geometry.computeVertexNormals()
  return geometry
}

/** A section's half width at `z`, interpolated along a loft's sections. */
function widthAt(sections: Section[], z: number): number {
  for (let i = 1; i < sections.length; i++) {
    const a = sections[i - 1]!
    const b = sections[i]!
    if (z <= b.z) return a.w + ((b.w - a.w) * (z - a.z)) / (b.z - a.z || 1)
  }
  return sections.at(-1)!.w
}

/** A static part to bake into the mesh it rides on, with its colour. */
type Part = {
  geo: THREE.BufferGeometry
  at: [number, number, number]
  rot?: [number, number, number]
  scale?: [number, number, number]
  color: number
}

/**
 * Bake static parts (scutes, nostrils, claws, scars) into one geometry with
 * `base`: one draw call instead of one each. Each part's colour rides in
 * its vertex colours; `base` (or the first part) is consumed.
 */
function bake(base: THREE.BufferGeometry | null, parts: Part[]) {
  const m = new THREE.Matrix4()
  const q = new THREE.Quaternion()
  const pieces = parts.map((p) => {
    const g = p.geo.clone()
    q.setFromEuler(new THREE.Euler(...(p.rot ?? [0, 0, 0])))
    m.compose(
      new THREE.Vector3(...p.at),
      q,
      new THREE.Vector3(...(p.scale ?? [1, 1, 1])),
    )
    g.applyMatrix4(m)
    const c = new THREE.Color(p.color)
    const n = g.getAttribute('position').count
    const rgb = new Float32Array(n * 3)
    for (let i = 0; i < n; i++) rgb.set([c.r, c.g, c.b], i * 3)
    g.setAttribute('color', new THREE.BufferAttribute(rgb, 3))
    return g
  })
  const all = base ? [base, ...pieces] : pieces
  const merged = mergeGeometries(all)
  if (!merged) throw new Error('croc: parts do not merge')
  for (const g of all) g.dispose()
  return merged
}

/** Scale relief for the hide, drawn once (null outside a browser). */
function scaleTexture(): THREE.CanvasTexture | null {
  if (typeof document === 'undefined') return null
  const canvas = document.createElement('canvas')
  canvas.width = 256
  canvas.height = 256
  const g = canvas.getContext('2d')
  if (!g) return null
  g.fillStyle = '#808080'
  g.fillRect(0, 0, 256, 256)
  // Rows of rounded scales, offset every other row, each a raised plate.
  for (let row = 0; row < 12; row++)
    for (let col = 0; col < 12; col++) {
      const x = col * 22 + (row % 2 ? 11 : 0) + 1
      const y = row * 22 + 1
      const shade = 150 + Math.floor(hash(row, col) * 70)
      g.fillStyle = `rgb(${shade},${shade},${shade})`
      g.beginPath()
      g.roundRect(x, y, 19, 19, 6)
      g.fill()
      g.fillStyle = 'rgba(255,255,255,0.25)'
      g.fillRect(x + 4, y + 3, 10, 3)
    }
  const texture = new THREE.CanvasTexture(canvas)
  texture.wrapS = THREE.RepeatWrapping
  texture.wrapT = THREE.RepeatWrapping
  return texture
}

/** A soft round droplet for the spray (null outside a browser). */
function dropletTexture(): THREE.CanvasTexture | null {
  if (typeof document === 'undefined') return null
  const canvas = document.createElement('canvas')
  canvas.width = 32
  canvas.height = 32
  const g = canvas.getContext('2d')
  if (!g) return null
  const grad = g.createRadialGradient(16, 16, 0, 16, 16, 16)
  grad.addColorStop(0, 'rgba(255,255,255,1)')
  grad.addColorStop(0.45, 'rgba(230,255,252,0.75)')
  grad.addColorStop(1, 'rgba(200,255,250,0)')
  g.fillStyle = grad
  g.fillRect(0, 0, 32, 32)
  return new THREE.CanvasTexture(canvas)
}

// The upper jaw and skull, one piece that lifts as he gapes: the heavy
// skull behind the hinge, the V-snout tapering to its nostril bulb.
const UPPER: Section[] = [
  { z: -0.052, w: 0.011, top: 0.006, bottom: 0.004, y: -0.002 },
  { z: -0.042, w: 0.019, top: 0.011, bottom: 0.005 },
  { z: -0.028, w: 0.0225, top: 0.0135, bottom: 0.004 },
  { z: -0.014, w: 0.0215, top: 0.0135, bottom: 0.0032 },
  { z: -0.003, w: 0.019, top: 0.0112, bottom: 0.0024 },
  { z: 0.008, w: 0.0165, top: 0.0086, bottom: 0.0018 },
  { z: 0.02, w: 0.0136, top: 0.0068, bottom: 0.0016 },
  { z: 0.032, w: 0.0108, top: 0.0058, bottom: 0.0015 },
  { z: 0.042, w: 0.0097, top: 0.0055, bottom: 0.0015 },
  { z: 0.05, w: 0.0108, top: 0.0063, bottom: 0.0016 },
  { z: 0.056, w: 0.0094, top: 0.0055, bottom: 0.0015 },
  { z: 0.0605, w: 0.0058, top: 0.0034, bottom: 0.0012 },
  { z: 0.0625, w: 0.0018, top: 0.0012, bottom: 0.0006 },
]

// The lower jaw: flat on top, deep beneath, the bank's mud under it.
const LOWER: Section[] = [
  { z: -0.012, w: 0.0175, top: 0.0016, bottom: 0.0068, y: -0.002 },
  { z: 0.004, w: 0.0158, top: 0.0016, bottom: 0.006, y: -0.002 },
  { z: 0.02, w: 0.0128, top: 0.0016, bottom: 0.0048, y: -0.002 },
  { z: 0.034, w: 0.0104, top: 0.0015, bottom: 0.004, y: -0.002 },
  { z: 0.048, w: 0.0094, top: 0.0015, bottom: 0.0036, y: -0.002 },
  { z: 0.055, w: 0.0085, top: 0.0014, bottom: 0.0032, y: -0.002 },
  { z: 0.0595, w: 0.005, top: 0.0012, bottom: 0.002, y: -0.002 },
  { z: 0.0615, w: 0.0015, top: 0.0006, bottom: 0.0008, y: -0.002 },
]

// The body behind the head, mostly under the water.
const BODY: Section[] = [
  { z: -0.03, w: 0.016, top: 0.008, bottom: 0.008 },
  { z: -0.05, w: 0.024, top: 0.009, bottom: 0.009 },
  { z: -0.08, w: 0.028, top: 0.0095, bottom: 0.009 },
  { z: -0.11, w: 0.026, top: 0.009, bottom: 0.009 },
  { z: -0.13, w: 0.018, top: 0.0075, bottom: 0.007 },
  { z: -0.142, w: 0.012, top: 0.006, bottom: 0.006 },
]

/** Tail segments, their length, and the curl they lie in at rest. */
const TAIL_SEGMENTS = 9
const TAIL_STEP = 0.0145
const TAIL_CURL = 0.17

type Ripple = { x: number; z: number; age: number; amp: number }

export class CrocToy {
  readonly group = new THREE.Group()
  /** Rolls in the death roll: the head and the body together. */
  private rig = new THREE.Group()
  /** The rig's contents, offset so the roll turns about his spine. */
  private spine = new THREE.Group()
  private head = new THREE.Group()
  private upper = new THREE.Group()
  private lower = new THREE.Group()
  private tail: THREE.Group[] = []
  private eyeballs: THREE.Group[] = []
  private lids: THREE.Mesh[] = []
  private claws: THREE.Group[] = []
  private eyes: THREE.MeshStandardMaterial
  private throat: THREE.MeshStandardMaterial
  private water: THREE.MeshStandardMaterial
  private surface: THREE.BufferGeometry
  private surfaceRest: Float32Array
  private ring: THREE.Mesh
  private glowLight: THREE.PointLight
  private spray: THREE.Points
  private sprayVel: Float32Array
  private sprayLife: Float32Array
  private sprayNext = 0
  private ripples: Ripple[] = []
  private pose: AnimatronicPose = { phase: 'open', age: 0 }
  private lastPhase = 'open'
  private watched: [number, number] | null = null
  private jaw = new Spring(JAW_OPEN, 0, 0)
  private sink = new Spring(0, 0, 0)
  private pitch = new Spring(0, 0, 0)
  private yaw = new Spring(0, 0, 0)
  private lunge = new Spring(0, 0, 0)
  private eyeYaw = new Spring(0, 0, 0)
  private lid = new Spring(0, 0, 0)
  private roll = 0
  private settle = 0
  private glow = 1
  private stir = 0
  private frame = 0
  private readonly seed: number
  private readonly still: boolean

  constructor(
    def: AnimatronicDef,
    track: Track,
    options: { reducedMotion?: boolean } = {},
  ) {
    this.still = options.reducedMotion ?? false
    this.seed = hash(def.at[0] * 100, def.at[2] * 100) * 1000
    const scale = def.scale ?? 1
    this.group.position.set(def.at[0], def.at[1], def.at[2])
    this.group.rotation.y = def.yaw ?? 0
    this.group.scale.setScalar(scale)
    this.jaw.tune(1.6, 0.75)
    this.sink.tune(1.4, 0.65)
    this.pitch.tune(2.2, 0.45)
    this.yaw.tune(0.9, 0.85)
    this.lunge.tune(3, 0.4)
    this.eyeYaw.tune(2.5, 0.8)
    this.lid.tune(5, 0.9)
    this.lid.value = this.lid.target = 0.15

    const relief = scaleTexture()
    if (relief) track(relief)
    const hide = track(
      new THREE.MeshStandardMaterial({
        vertexColors: true,
        roughness: 0.42,
        metalness: 0.05,
        bumpMap: relief,
        bumpScale: 1.2,
      }),
    )
    // The same hide for parts without the lofts' painted colours.
    const skin = track(
      new THREE.MeshStandardMaterial({
        color: FLANK,
        roughness: 0.42,
        metalness: 0.05,
        bumpMap: relief,
        bumpScale: 1.2,
      }),
    )
    const tooth = track(
      new THREE.MeshStandardMaterial({ color: TOOTH, roughness: 0.32 }),
    )
    const tongue = track(
      new THREE.MeshStandardMaterial({ color: TONGUE, roughness: 0.5 }),
    )
    this.eyes = track(
      new THREE.MeshStandardMaterial({
        color: EYE,
        emissive: EYE,
        emissiveIntensity: 1.5,
        roughness: 0.15,
      }),
    )
    const pupil = track(
      new THREE.MeshStandardMaterial({ color: 0x050505, roughness: 0.1 }),
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
        color: 0x1d5f5c,
        emissive: 0x0f3f3c,
        emissiveIntensity: 0.5,
        vertexColors: true,
        transparent: true,
        opacity: 0.45,
        roughness: 0.08,
        metalness: 0.1,
        depthWrite: false,
      }),
    )

    // The river: a rippling pool round the head and the body, its edge
    // fading into the playfield, and the glowing waterline ring at the
    // mouth (the shot's aim cue).
    const pool = new THREE.PlaneGeometry(0.12, 0.25, 16, 32)
    pool.rotateX(-Math.PI / 2)
    pool.translate(0.012, WATER_Y, -0.085)
    const rest = pool.getAttribute('position')
    const fade: number[] = []
    for (let i = 0; i < rest.count; i++) {
      const x = (rest.getX(i) - 0.012) / 0.06
      const z = (rest.getZ(i) + 0.085) / 0.125
      const r = Math.hypot(x, z)
      const alpha = Math.max(0, Math.min(1, (1 - r) / 0.35))
      fade.push(1, 1, 1, alpha)
    }
    pool.setAttribute('color', new THREE.Float32BufferAttribute(fade, 4))
    this.surface = track(pool)
    this.surfaceRest = Float32Array.from(rest.array as Float32Array)
    const river = new THREE.Mesh(this.surface, this.water)
    river.renderOrder = 2
    const ringMaterial = track(
      new THREE.MeshStandardMaterial({
        color: WATER,
        emissive: WATER,
        emissiveIntensity: 1,
        transparent: true,
        opacity: 0.7,
      }),
    )
    this.ring = new THREE.Mesh(
      track(new THREE.TorusGeometry(0.03, 0.002, 8, 40)),
      ringMaterial,
    )
    this.ring.rotation.x = -Math.PI / 2
    this.ring.position.set(0, WATER_Y + 0.0006, 0.006)
    // The ring shares the water's glow: one cue, read from `waterline`.
    this.ring.onBeforeRender = () => {
      ringMaterial.emissiveIntensity = this.water.emissiveIntensity * 1.2
    }
    this.group.add(river, this.ring)

    // Spray and bubbles: a pool of points thrown up by every splash.
    const sprayGeo = track(new THREE.BufferGeometry())
    const sprayPos = new Float32Array(SPRAY * 3).fill(-1)
    sprayGeo.setAttribute('position', new THREE.BufferAttribute(sprayPos, 3))
    this.sprayVel = new Float32Array(SPRAY * 3)
    this.sprayLife = new Float32Array(SPRAY)
    const droplet = dropletTexture()
    if (droplet) track(droplet)
    this.spray = new THREE.Points(
      sprayGeo,
      track(
        new THREE.PointsMaterial({
          color: 0xeafffd,
          size: 0.0042,
          map: droplet,
          transparent: true,
          opacity: 0.9,
          depthWrite: false,
        }),
      ),
    )
    this.spray.frustumCulled = false
    this.group.add(this.spray)

    this.rig.position.set(0, SPINE_Y, 0)
    this.spine.position.set(0, -SPINE_Y, 0)
    this.rig.add(this.spine)
    this.group.add(this.rig)

    // The head: it pitches, turns and lunges at the hinge.
    this.head.position.set(0, HINGE_Y, HINGE_Z)
    this.spine.add(this.head)
    this.head.add(this.upper, this.lower)

    // The head's static parts bake into the upper jaw's mesh (one draw).
    const upperParts: Part[] = []
    const upperMesh = new THREE.Mesh(undefined, hide)
    const lowerMesh = new THREE.Mesh(track(loft(LOWER, 22, 2.6, 'up')), hide)
    upperMesh.castShadow = lowerMesh.castShadow = true
    this.upper.add(upperMesh)
    this.lower.add(lowerMesh)

    // Inside the mouth: gums lining both jaws (the lofts' insides), the
    // tongue, and the throat glowing at the back, lighting the teeth.
    const tongueMesh = new THREE.Mesh(
      track(new THREE.SphereGeometry(0.0075, 16, 8)),
      tongue,
    )
    tongueMesh.scale.set(1, 0.22, 2.2)
    tongueMesh.position.set(0, 0.0002, 0.01)
    this.lower.add(tongueMesh)
    const throat = new THREE.Mesh(
      track(new THREE.SphereGeometry(0.0095, 16, 10)),
      this.throat,
    )
    throat.scale.set(1.05, 0.42, 0.8)
    throat.position.set(0, -0.0016, -0.007)
    this.head.add(throat)
    // His own light, as a real machine lights its signature toy: warm,
    // above and in front, so he reads from the player's end of the table.
    const keyLight = new THREE.PointLight(0xffe2b8, 0.012, 0.22, 2)
    keyLight.position.set(0.01, 0.07, 0.06)
    this.group.add(keyLight)
    this.glowLight = new THREE.PointLight(WATER, 0, 0.09, 2)
    this.glowLight.position.set(0, 0.002, 0.006)
    this.head.add(this.glowLight)

    // Teeth: irregular and interlocking, the lower fourth tooth standing
    // up outside the upper jaw as a crocodile's does.
    const fang = track(new THREE.ConeGeometry(0.00105, 0.0048, 6))
    fang.translate(0, 0.0024, 0)
    const teeth = (sections: Section[], up: boolean, count: number) => {
      const mesh = new THREE.InstancedMesh(fang, tooth, count * 2)
      const m = new THREE.Matrix4()
      const q = new THREE.Quaternion()
      const e = new THREE.Euler()
      const s = new THREE.Vector3()
      const p = new THREE.Vector3()
      let n = 0
      for (let i = 0; i < count; i++) {
        const z = 0.003 + i * (up ? 0.0042 : 0.0041) + (up ? 0 : 0.002)
        const big = (!up && i === 3) || (up && (i === 4 || i === 9)) ? 1.6 : 1
        const size = (0.7 + 0.45 * hash(i, up ? 1 : 2)) * big
        for (const side of [-1, 1]) {
          // The big lower fourth tooth stands outside the snout.
          const out = !up && big > 1 ? 1.18 : 0.9
          const w = widthAt(sections, z) * out
          p.set(side * w, up ? -0.0012 : -0.0009, z)
          e.set(
            up ? Math.PI : 0,
            0,
            side * (0.15 + 0.2 * hash(i, side)) * (up ? -1 : 1),
          )
          q.setFromEuler(e)
          s.set(size, size * (0.9 + 0.3 * hash(side, i)), size)
          m.compose(p, q, s)
          mesh.setMatrixAt(n++, m)
        }
      }
      mesh.castShadow = true
      return track(mesh)
    }
    this.upper.add(teeth(UPPER, true, 13))
    this.lower.add(teeth(LOWER, false, 12))

    // Nostrils on the bulb, and the scars down his snout and brow.
    const nostril = track(new THREE.SphereGeometry(0.0021, 10, 6))
    const hole = track(new THREE.SphereGeometry(0.0009, 8, 4))
    for (const side of [-1, 1]) {
      upperParts.push(
        {
          geo: nostril,
          at: [side * 0.0032, 0.0064, 0.0505],
          scale: [1, 0.7, 1.2],
          color: FLANK,
        },
        {
          geo: hole,
          at: [side * 0.0032, 0.0078, 0.051],
          scale: [0.6, 0.4, 1.4],
          color: 0x080808,
        },
      )
    }
    const scarGeo = track(new THREE.BoxGeometry(0.0006, 0.0004, 1))
    const scars: Array<[number, number, number, number, number]> = [
      [0.004, 0.0072, 0.026, 0.018, 0.25],
      [-0.006, 0.0076, 0.016, 0.012, -0.4],
      [0.0085, 0.0118, -0.018, 0.016, 0.6],
      [-0.002, 0.0135, -0.03, 0.01, -0.15],
    ]
    for (const [x, y, z, length, turn] of scars)
      upperParts.push({
        geo: scarGeo,
        at: [x, y, z],
        rot: [0, turn, 0],
        scale: [1, 1, length],
        color: SCAR,
      })

    // The eyes: bosses on the skull, amber eyes with slit pupils that turn
    // to the ball, and heavy upper lids that blink, narrow and squint.
    const boss = track(new THREE.SphereGeometry(0.0062, 16, 10))
    const ball = track(new THREE.SphereGeometry(0.0043, 18, 12))
    const slit = track(new THREE.BoxGeometry(0.0009, 0.0046, 0.0008))
    const lidGeo = track(
      new THREE.SphereGeometry(0.0049, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2),
    )
    for (const side of [-1, 1]) {
      const at = new THREE.Vector3(side * 0.0122, 0.0128, -0.012)
      upperParts.push({
        geo: boss,
        at: [at.x, at.y - 0.002, at.z - 0.001],
        scale: [1, 0.72, 1.15],
        color: FLANK,
      })
      const eyeball = new THREE.Group()
      eyeball.position.copy(at).add(new THREE.Vector3(side * 0.001, 0.0012, 0))
      eyeball.rotation.y = side * 0.35
      const iris = new THREE.Mesh(ball, this.eyes)
      const pupilMesh = new THREE.Mesh(slit, pupil)
      pupilMesh.position.set(0, 0, 0.0038)
      eyeball.add(iris, pupilMesh)
      const lid = new THREE.Mesh(lidGeo, skin)
      lid.scale.set(1.05, 0.7, 1.05)
      lid.position.copy(eyeball.position)
      lid.rotation.y = side * 0.35
      this.upper.add(eyeball, lid)
      this.eyeballs.push(eyeball)
      this.lids.push(lid)
    }

    // Keeled scutes up the neck: two rows, a few loose ones beside.
    const scute = track(new THREE.ConeGeometry(0.0021, 0.0034, 4))
    scute.rotateY(Math.PI / 4)
    scute.scale(0.8, 1, 1.5)
    for (let i = 0; i < 5; i++)
      for (const side of [-1, 1])
        upperParts.push({
          geo: scute,
          at: [side * 0.0045, 0.0118 - i * 0.0012, -0.032 - i * 0.0045],
          color: BACK,
        })
    upperMesh.geometry = track(bake(loft(UPPER, 24, 2.6, 'down'), upperParts))

    // The body in the river behind him, scutes and shoulders breaking the
    // surface; front claws gripping the bank either side of the head.
    const bodyParts: Part[] = []
    for (let i = 0; i < 9; i++)
      for (const col of [-2, -1, 1, 2]) {
        if (Math.abs(col) === 2 && (i < 2 || i > 6)) continue
        const z = -0.036 - i * 0.0115
        const w = widthAt(BODY.slice().reverse(), z) || 0.012
        const k = Math.abs(col) === 1 ? 1.05 : 0.8
        bodyParts.push({
          geo: scute,
          // In the body's own frame, which sits 3.5 mm down.
          at: [col * w * 0.28, 0.0058 - Math.abs(col) * 0.0012 + 0.0035, z],
          scale: [k, k, k],
          color: BACK,
        })
      }
    const body = new THREE.Mesh(track(bake(loft(BODY, 18), bodyParts)), hide)
    body.position.set(0, -0.0035, 0)
    body.castShadow = true
    this.spine.add(body)
    const clawGeo = track(new THREE.ConeGeometry(0.0009, 0.0042, 5))
    clawGeo.rotateX(Math.PI / 2)
    const legGeo = track(new THREE.CapsuleGeometry(0.0038, 0.012, 4, 10))
    for (const side of [-1, 1]) {
      const leg = new THREE.Group()
      leg.position.set(side * 0.022, 0.0005, -0.05)
      const limb = new THREE.Mesh(legGeo, skin)
      limb.rotation.set(Math.PI / 2 - 0.25, 0, side * -0.9)
      limb.position.set(side * 0.006, 0.002, 0.004)
      leg.add(limb)
      const foot: Part[] = [0, 1, 2].map((k) => ({
        geo: clawGeo,
        at: [side * (0.011 + k * 0.0018), 0.0005, 0.011 - k * 0.002],
        rot: [0, side * (0.3 + k * 0.25), 0],
        color: TOOTH,
      }))
      leg.add(new THREE.Mesh(track(bake(null, foot)), tooth))
      this.spine.add(leg)
      this.claws.push(leg)
    }

    // The tail: a chain of segments curling away up the river, each turning
    // a little after the one before it, so it sways with follow-through.
    let parent: THREE.Object3D = this.spine
    let z = -0.138
    for (let i = 0; i < TAIL_SEGMENTS; i++) {
      const f = i / TAIL_SEGMENTS
      const w0 = 0.011 * (1 - f) + 0.0016
      const w1 = 0.011 * (1 - (i + 1) / TAIL_SEGMENTS) + 0.0012
      const seg = new THREE.Group()
      seg.position.set(0, 0, z)
      z = -TAIL_STEP
      seg.rotation.y = TAIL_CURL * (i < 4 ? 1 : -0.6)
      // The tail's crest: a double row, then a single one toward the tip,
      // baked into the segment (in its frame, which sits lower).
      const lift = 0.0045 - f * 0.002
      const crestParts: Part[] = (i < 5 ? [-1, 1] : [0]).map((col) => {
        const k = 1.1 - f * 0.5
        return {
          geo: scute,
          at: [
            col * w0 * 0.35,
            -0.0045 + w0 * 0.55 + 0.0006 + lift,
            -TAIL_STEP / 2,
          ],
          scale: [k, k, k],
          color: BACK,
        }
      })
      const piece = new THREE.Mesh(
        track(
          bake(
            loft(
              [
                { z: 0.0015, w: w0, top: w0 * 0.55, bottom: w0 * 0.5 },
                {
                  z: -TAIL_STEP - 0.0015,
                  w: w1,
                  top: w1 * 0.55,
                  bottom: w1 * 0.5,
                },
              ],
              12,
            ),
            crestParts,
          ),
        ),
        hide,
      )
      piece.position.y = -lift
      seg.add(piece)
      parent.add(seg)
      parent = seg
      this.tail.push(seg)
    }
  }

  setPose(pose: AnimatronicPose) {
    if (pose.phase !== this.lastPhase) this.enter(pose.phase)
    this.pose = pose
    this.lastPhase = pose.phase
  }

  /**
   * The balls on the table (table space): he watches the nearest one. A
   * captured ball is in his jaws, not worth watching.
   */
  watch(
    balls: ReadonlyArray<{
      position: readonly [number, number, number]
      captured?: boolean
    }>,
  ) {
    const g = this.group
    const cos = Math.cos(-g.rotation.y)
    const sin = Math.sin(-g.rotation.y)
    let best = WATCH_RANGE
    this.watched = null
    for (const b of balls) {
      if (b.captured) continue
      const dx = b.position[0] - g.position.x
      const dz = b.position[2] - g.position.z
      const x = dx * cos + dz * sin
      const z = -dx * sin + dz * cos
      const d = Math.hypot(x, z - HINGE_Z)
      if (d < best) {
        best = d
        this.watched = [x, z]
      }
    }
  }

  /** A phase begins: the beats that happen once, on its first frame. */
  private enter(phase: string) {
    if (this.still) return
    const mouth: [number, number] = [0, 0.012]
    switch (phase) {
      case 'captured':
        // The clack: jaws slam, the head jerks back and down, water flies.
        this.jaw.tune(4.5, 0.42)
        this.pitch.velocity -= 3.2
        this.lunge.velocity -= 0.35
        this.splash(mouth, 60, 0.6)
        this.ripple(mouth, 0.0026)
        break
      case 'spit':
        this.splash(mouth, 10, 0.3)
        break
      case 'rising':
        this.bubbles(14)
        this.ripple([0, -0.01], 0.0014)
        break
      case 'submerged':
        this.ripple([0, -0.01], 0.0016)
        this.splash([0, 0], 14, 0.35)
        break
    }
  }

  /** Throw `n` drops of spray from `at` (toy x, z) at about `speed` m/s. */
  private splash(at: [number, number], n: number, speed: number) {
    if (this.still) return
    const pos = this.spray.geometry.getAttribute(
      'position',
    ) as THREE.BufferAttribute
    for (let k = 0; k < n; k++) {
      const i = this.sprayNext
      this.sprayNext = (this.sprayNext + 1) % SPRAY
      const a = hash(this.frame + k, this.seed) * Math.PI * 2
      const r = 0.3 + 0.7 * hash(k, this.frame * 1.7)
      pos.setXYZ(
        i,
        at[0] + Math.cos(a) * 0.012 * r,
        WATER_Y + 0.004,
        at[1] + Math.sin(a) * 0.012 * r,
      )
      this.sprayVel[i * 3] = Math.cos(a) * speed * 0.45 * r
      this.sprayVel[i * 3 + 1] = speed * (0.6 + 0.6 * hash(k, a))
      this.sprayVel[i * 3 + 2] = Math.sin(a) * speed * 0.45 * r
      this.sprayLife[i] = 0.35 + 0.35 * hash(a, k)
    }
    pos.needsUpdate = true
  }

  /** Bubbles rising from his nostrils as he lies under. */
  private bubbles(n: number) {
    if (this.still) return
    const pos = this.spray.geometry.getAttribute(
      'position',
    ) as THREE.BufferAttribute
    for (let k = 0; k < n; k++) {
      const i = this.sprayNext
      this.sprayNext = (this.sprayNext + 1) % SPRAY
      pos.setXYZ(
        i,
        (hash(k, this.frame) - 0.5) * 0.012,
        WATER_Y + 0.0006,
        HINGE_Z + 0.05 + (hash(this.frame, k) - 0.5) * 0.01,
      )
      this.sprayVel[i * 3] = 0
      this.sprayVel[i * 3 + 1] = 0.03 + 0.03 * hash(k, 3)
      this.sprayVel[i * 3 + 2] = 0
      this.sprayLife[i] = 0.25 + 0.2 * hash(k, 5)
    }
    pos.needsUpdate = true
  }

  /** A ring of waves spreading from `at` (toy x, z). */
  private ripple(at: [number, number], amp: number) {
    if (this.still) return
    this.ripples.push({ x: at[0], z: at[1], age: 0, amp })
    if (this.ripples.length > 8) this.ripples.shift()
  }

  /** One frame toward the pose. */
  animate() {
    this.frame++
    const { phase, cue } = this.pose
    const t = this.pose.age
    const still = this.still
    const hungry = cue === 'hungry'
    /** A slow swell, or a steady middle with reduced motion. */
    const swell = (rate: number) => (still ? 0 : Math.sin(this.frame * rate))
    let jaw = 0
    let sink = 0
    let pitch = 0
    let lunge = 0
    let lid = 0.15
    let glow = 0.6
    let lash = 1
    let track = !still
    this.jaw.tune(1.6, 0.75)
    this.sink.tune(1.4, 0.65)
    switch (phase) {
      case 'submerged':
        sink = SUNK
        glow = 0.15
        lid = 0.4
        track = false
        if (!still && this.frame % 14 === 0) this.bubbles(2)
        break
      case 'rising':
        if (t < 0.18) {
          // Anticipation: a dip deeper, and the bubbles boil up.
          sink = SUNK + 0.003
          if (!still && this.frame % 4 === 0) this.bubbles(3)
        } else {
          // The surge: up out of the river, nose high, streaming water.
          this.sink.tune(3.2, 0.32)
          sink = 0
          pitch = t < 0.4 ? 0.28 : 0.08
          if (!still && this.frame % 3 === 0) this.splash([0, -0.01], 3, 0.18)
          jaw = t > 0.4 ? JAW_OPEN * 0.5 : 0
        }
        glow = 0.6
        lid = t < 0.3 ? 0.5 : 0.15
        break
      case 'open': {
        // A slow, hungry breath; wide and bright when an orbit lit him.
        const breath = swell(0.045)
        jaw = JAW_OPEN * (0.86 + 0.14 * breath)
        pitch = 0.06 + 0.03 * breath
        glow = (hungry ? 1.8 : 1) + 0.5 * swell(0.12)
        if (hungry) {
          lid = 0.55
          lash = 2.6
          // Chomp! A quick snap and back, every second or so.
          const beat = (this.frame + this.seed) % 64
          if (!still && beat < 7) {
            this.jaw.tune(4, 0.5)
            jaw = JAW_OPEN * 0.3
          }
          if (!still && beat === 3) {
            this.splash([0, 0.02], 6, 0.25)
            this.ripple([0, 0.02], 0.0008)
          }
        }
        break
      }
      case 'captured':
        jaw = -0.02
        this.jaw.tune(4.5, 0.42)
        glow = 2.2
        lid = 0.7
        track = false
        break
      case 'death-roll':
        glow = still ? 3.2 : 2.6
        lid = 0.85
        lash = 3.2
        track = false
        if (!still) {
          if (this.frame % 2 === 0) this.splash([0, -0.04], 8, 0.45)
          if (this.frame % 5 === 0) this.ripple([0, -0.03], 0.0018)
        }
        break
      case 'spit':
        track = false
        glow = 1.6
        this.jaw.tune(4, 0.45)
        if (t < 0.1) {
          // Rear back, jaws shut, gathering himself.
          pitch = 0.22
          lunge = -0.006
        } else {
          // The lunge: forward, jaws flung wide, then easing shut.
          lunge = 0.007
          pitch = 0.05
          jaw =
            t < 0.25
              ? JAW_OPEN * 1.08
              : JAW_OPEN * Math.max(0, 1 - (t - 0.25) / 0.2)
          if (!still && Math.abs(t - 0.1) < DT) {
            this.splash([0, 0.03], 40, 0.55)
            this.ripple([0, 0.03], 0.0022)
          }
        }
        break
    }

    // The death roll: the whole croc turns over, a full roll every half
    // second; leaving it, he rolls on round to upright rather than back.
    if (phase === 'death-roll' && !still) {
      const spin = Math.min(1, t / 0.12)
      this.roll =
        Math.PI * 2 * (t < 0.12 ? (t * spin) / 0.5 / 2 : (t - 0.06) / 0.5)
      this.settle = Math.ceil(this.roll / (Math.PI * 2)) * Math.PI * 2
    } else if (this.roll !== 0) {
      this.roll += (this.settle - this.roll) * 0.25
      if (Math.abs(this.settle - this.roll) < 0.01) this.roll = this.settle = 0
    }
    if (still) this.roll = this.settle = 0

    // Watching: the head turns a little toward the nearest ball, the eyes
    // the rest of the way; with nothing near, a slow scan of the river.
    let headYaw = 0
    let eyeYaw = 0
    if (track && this.watched) {
      const [x, z] = this.watched
      const angle = Math.atan2(x, z - HINGE_Z)
      headYaw = Math.max(-0.32, Math.min(0.32, angle * 0.45))
      eyeYaw = Math.max(-0.5, Math.min(0.5, angle - headYaw))
    } else if (track) {
      headYaw = 0.12 * Math.sin(this.frame * 0.011 + this.seed)
    }

    // Blinks: a quick shut every few seconds, at his own rhythm.
    if (!still && (this.frame + Math.floor(this.seed)) % 230 < 7) lid = 1

    this.jaw.target = jaw
    this.sink.target = sink
    this.pitch.target = pitch
    this.lunge.target = lunge
    this.yaw.target = headYaw
    this.eyeYaw.target = eyeYaw
    this.lid.target = lid
    for (const s of [
      this.jaw,
      this.sink,
      this.pitch,
      this.lunge,
      this.yaw,
      this.eyeYaw,
      this.lid,
    ])
      s.step()
    if (still)
      for (const s of [this.pitch, this.lunge, this.yaw, this.eyeYaw]) {
        s.value = s.target = 0
        s.velocity = 0
      }

    const stir = hungry ? 1 : cue === 'watering-hole' ? 0.5 : 0
    this.stir += (stir - this.stir) * EASE
    this.glow += (glow - this.glow) * EASE

    // Pose the rig.
    const gape = Math.max(-0.03, this.jaw.value)
    this.upper.rotation.x = -gape * 0.82
    this.lower.rotation.x = gape * 0.18
    this.head.position.set(
      0,
      HINGE_Y - this.sink.value,
      HINGE_Z + this.lunge.value,
    )
    this.head.rotation.set(-this.pitch.value, this.yaw.value, 0)
    this.rig.rotation.z = this.roll
    // The body sinks only until it lies just under the surface, a dark
    // shape in the river; the head goes on down, leaving the eyes up.
    this.rig.position.y = SPINE_Y - this.sink.value * 0.22
    this.eyeballs.forEach((eye, i) => {
      eye.rotation.set(-0.35, (i ? 1 : -1) * 0.35 + this.eyeYaw.value, 0)
    })
    this.lids.forEach((lidMesh, i) => {
      // Open, the lid sits back over the brow; shut, it covers the eye.
      lidMesh.rotation.x = -1.15 + Math.min(1, this.lid.value) * 2.45
      lidMesh.rotation.y = (i ? 1 : -1) * 0.35 + this.eyeYaw.value * 0.3
    })
    // Rolling, the tail straightens out behind him rather than curling up.
    const rolling = Math.min(1, Math.abs(Math.sin(this.roll)) * 2)
    this.tail.forEach((seg, i) => {
      const rest = TAIL_CURL * (i < 4 ? 1 : -0.6) * (1 - rolling)
      const wave = still
        ? 0
        : 0.09 *
          lash *
          (1 - rolling) *
          Math.sin(this.frame * 0.05 * lash - i * 0.7 + this.seed)
      seg.rotation.y = rest + wave
    })
    this.claws.forEach((leg, i) => {
      // Claws dig in as he lunges or snaps, and pad when he rises.
      const grip =
        (i ? 1 : -1) * (this.lunge.value * 8 + this.pitch.value * 0.2)
      leg.rotation.y = still ? 0 : grip
    })

    // Light: the eyes, the throat (and its light on the teeth), the water.
    this.eyes.emissiveIntensity =
      0.6 + Math.max(this.glow, phase === 'submerged' ? 1.1 : 0)
    this.throat.emissiveIntensity = 0.2 + this.glow * 0.6
    this.glowLight.intensity =
      (Math.max(0, gape) / JAW_OPEN) * (0.001 + this.glow * 0.0015)
    this.water.emissiveIntensity =
      0.25 + this.glow * 0.35 + this.stir * (0.9 + 0.4 * swell(0.3))
    this.ring.scale.setScalar(
      (phase === 'death-roll' ? 1.25 : 1) +
        this.stir * (0.12 + 0.04 * swell(0.3)),
    )

    this.animateWater()
    this.animateSpray()
  }

  /** The river's surface: a gentle swell, the stir, and spreading rings. */
  private animateWater() {
    if (this.still && this.frame > 1) return
    const pos = this.surface.getAttribute('position') as THREE.BufferAttribute
    const rest = this.surfaceRest
    const time = this.frame * DT
    for (const r of this.ripples) r.age += DT
    this.ripples = this.ripples.filter((r) => r.age < 1.6)
    const churn = 0.00025 + this.stir * 0.0004
    for (let i = 0; i < pos.count; i++) {
      const x = rest[i * 3]!
      const z = rest[i * 3 + 2]!
      let y = 0
      if (!this.still) {
        y +=
          churn *
          Math.sin(x * 180 + time * 3.1) *
          Math.cos(z * 140 - time * 2.3)
        for (const r of this.ripples) {
          const d = Math.hypot(x - r.x, z - r.z)
          const front = r.age * 0.12
          if (d > front) continue
          y +=
            r.amp *
            Math.exp(-r.age * 2.4) *
            Math.exp(-(front - d) * 40) *
            Math.sin((d - front) * 520)
        }
      }
      pos.setY(i, rest[i * 3 + 1]! + y)
    }
    pos.needsUpdate = true
    this.surface.computeVertexNormals()
  }

  /** Spray flies and falls back; bubbles rise and pop. */
  private animateSpray() {
    if (this.still) return
    const pos = this.spray.geometry.getAttribute(
      'position',
    ) as THREE.BufferAttribute
    let live = false
    for (let i = 0; i < SPRAY; i++) {
      if (this.sprayLife[i]! <= 0) continue
      live = true
      this.sprayLife[i] = this.sprayLife[i]! - DT
      this.sprayVel[i * 3 + 1] = this.sprayVel[i * 3 + 1]! - SPRAY_GRAVITY * DT
      const x = pos.getX(i) + this.sprayVel[i * 3]! * DT
      const y = pos.getY(i) + this.sprayVel[i * 3 + 1]! * DT
      const z = pos.getZ(i) + this.sprayVel[i * 3 + 2]! * DT
      if (this.sprayLife[i]! <= 0 || y < WATER_Y) pos.setXYZ(i, 0, -1, 0)
      else pos.setXYZ(i, x, y, z)
      if (y < WATER_Y) this.sprayLife[i] = 0
    }
    if (live) pos.needsUpdate = true
  }

  /** The jaw gape the toy is showing, radians (for tests). */
  get gape(): number {
    return this.jaw.value
  }

  /** The croc's roll, radians (for tests). */
  get rolled(): number {
    return this.rig.rotation.z
  }

  /** The waterline's glow (for tests). */
  get waterline(): number {
    return this.water.emissiveIntensity
  }

  /** Where his eyes are turned, radians from straight ahead (for tests). */
  get gaze(): number {
    return this.yaw.value + this.eyeYaw.value
  }

  /** Spray and bubbles in the air now (for tests). */
  get droplets(): number {
    let n = 0
    for (let i = 0; i < SPRAY; i++) if (this.sprayLife[i]! > 0) n++
    return n
  }
}
