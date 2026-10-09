// /utils/arcade/pinball/render/scene.ts
//
// The pinball renderer (conductor kind-pinball/t-004, hero pass t-019): a
// Three.js scene built from a TableDef, mirroring the physics world each
// frame. Physically based materials over a painted, clearcoated playfield
// (render/materials.ts); a night-cabinet environment for chrome and the
// steel ball; GI along the rails and slings; flush inserts and flasher
// domes driven by the lamp matrix (rules/lamps.ts), with a small pool of
// real lights following the brightest flashers; a contact shadow under
// every ball; ACES tone mapping and restrained bloom (render/post.ts); and a
// camera fitted to the screen (render/camera.ts).
//
// What it costs to draw is set by a quality tier chosen from measured frame
// time (render/quality.ts). Every tier draws the same table.
//
// Every geometry, material and texture it creates is tracked and released in
// dispose(), and liveRenderResources() lets tests prove nothing leaks when a
// cabinet is entered and left over and over.

import * as THREE from 'three'
import type { ToyPose } from '../rules/toys'
import { Heroes, Sparks, Trail } from './heroes'
import { Room } from './room'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { ConvexGeometry } from 'three/examples/jsm/geometries/ConvexGeometry.js'
import { flipperProfile, flipperYaw } from '../physics/world'
import type { BallView } from '../physics/world'
import type {
  BoxCollider,
  CameraPreset,
  CameraPresetId,
  FlipperDef,
  LampLevel,
  MaterialId,
  MeshCollider,
  TableDef,
  Vec3,
} from '../types'
import { DMD_COLS, DMD_ROWS } from '../dmd'
import { fitCamera, type Framing } from './camera'
import { createDmdCanvas, paintDmd } from './dmdTexture'
import {
  artBounds,
  BALL_MATERIAL,
  buildEnvironment,
  contactShadowTexture,
  FLIPPER_MATERIAL,
  FLIPPER_RUBBER,
  insertShape,
  MATERIALS,
  paintPlayfield,
  planarUVs,
} from './materials'
import { createPostChain, type PostChain } from './post'
import {
  QualityGovernor,
  TIER_SETTINGS,
  type QualityTier,
  type TierSettings,
} from './quality'

/** The slice of WebGLRenderer the scene uses, so tests can pass a stub. */
export type RendererLike = {
  render(scene: THREE.Scene, camera: THREE.Camera): void
  setSize(width: number, height: number, updateStyle?: boolean): void
  setPixelRatio(ratio: number): void
  dispose(): void
}

export type RendererFactory = (canvas: HTMLCanvasElement) => RendererLike

export const createWebGLRenderer: RendererFactory = (canvas) => {
  const renderer = new THREE.WebGLRenderer({
    canvas,
    // The post chain multisamples its own buffer; the low tier draws
    // straight to the screen, which keeps the canvas's own antialiasing.
    antialias: true,
    powerPreference: 'high-performance',
  })
  renderer.outputColorSpace = THREE.SRGBColorSpace
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = 1.05
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = THREE.PCFShadowMap
  return renderer
}

let liveResources = 0

/** Geometries, materials and textures created by scenes and not yet disposed. */
export function liveRenderResources(): number {
  return liveResources
}

/** Pooled jackpot sparks, and the most balls that leave a trail at once. */
const SPARK_CAPACITY = 240
const TRAIL_BALLS = 6
/** A kicked sling rubber's extra thickness, and how fast it settles. */
const RUBBER_FLEX = 1.6
const RUBBER_DECAY = 0.12

/** How far a drop target travels toward down or up each frame (0..1). */
const DROP_TRAVEL = 0.4
/** How far the camera moves toward its preset each frame (0..1). */
const CAMERA_EASE = 0.08
/** How far a lamp moves toward its level each frame: a bulb's warm-up. */
const LAMP_EASE = 0.35
/** Insert glow when off (the plastic still shows), on, and at a flash peak. */
const INSERT_OFF = 0.04
const INSERT_ON = 2.6
const INSERT_FLASH = 5
/** Flasher dome glow at rest and when fired. */
const FLASHER_REST = 0.12
const FLASHER_FIRED = 2.4
/** Pulses fade by this much a frame. */
const PULSE_DECAY = 0.07
/** Frames per half-cycle of a blinking lamp (~3.75 Hz at 60 FPS). */
const BLINK_FRAMES = 8
/** A pooled flasher light's intensity at full fire. */
const FLASHER_LIGHT = 0.12
const FLASHER_REACH = 0.45
/** Where the pooled light sits from its dome: up, and in over the playfield. */
const FLASHER_LIFT = 0.07
const FLASHER_THROW = 0.06
/** Each GI bulb's intensity at full GI. */
const GI_LIGHT = 0.05
/** How far GI moves toward its level each frame (it browns out on a tilt). */
const GI_EASE = 0.12
/** Pop bumper cap colours, in table order, and their glow at rest and lit. */
const POP_COLORS = [0xf472b6, 0x22d3ee, 0xfb923c]
const POP_REST = 0.5
const POP_FLASH = 4
/** DMD dot glow: the brightest dots just reach the bloom threshold. */
const DMD_GLOW = 2.2
/** Most pooled flasher lights any tier uses. */
const FLASHER_POOL = 4

function v3(v: Vec3): THREE.Vector3 {
  return new THREE.Vector3(v[0], v[1], v[2])
}

/**
 * A collider mesh as render geometry, with each triangle drawn both ways so
 * rails and ramp floors read from either side. The UVs are blank so it
 * merges with the box and cylinder pieces sharing its material.
 */
function meshGeometry(def: MeshCollider): THREE.BufferGeometry {
  // The back faces get their own copy of the vertices: shared, the two
  // windings' normals would average to nothing and the surface would shade
  // as crumpled foil.
  const count = def.vertices.length / 3
  const reversed: number[] = []
  for (let i = 0; i < def.indices.length; i += 3) {
    reversed.push(
      def.indices[i]! + count,
      def.indices[i + 2]! + count,
      def.indices[i + 1]! + count,
    )
  }
  const geo = new THREE.BufferGeometry()
  geo.setAttribute(
    'position',
    new THREE.Float32BufferAttribute([...def.vertices, ...def.vertices], 3),
  )
  geo.setAttribute(
    'uv',
    new THREE.Float32BufferAttribute(new Array(count * 4).fill(0), 2),
  )
  geo.setIndex([...def.indices, ...reversed])
  geo.computeVertexNormals()
  return geo
}

/**
 * A flipper's outline in its own frame, grown or shrunk by `grow` and spanning
 * y0..y1: the bat's plastic body is the physics outline drawn a little in,
 * and its rubber ring is the outline itself, round the middle of the bat.
 */
function batOutline(
  def: FlipperDef,
  grow: number,
  y0: number,
  y1: number,
): THREE.Vector3[] {
  return flipperProfile(def, grow).flatMap(([x, z]) => [
    new THREE.Vector3(x, y0, z),
    new THREE.Vector3(x, y1, z),
  ])
}

type Lamp = {
  material: THREE.MeshStandardMaterial
  level: LampLevel
  /** Current glow, eased toward the level's. */
  glow: number
  pulse: number
}

type Flasher = Lamp & { position: THREE.Vector3; color: THREE.Color }

export type RenderStats = {
  tier: QualityTier
  averageMs: number
  p95Ms: number
  frames: number
  drawCalls: number
  triangles: number
}

export class PinballScene {
  readonly scene = new THREE.Scene()
  readonly camera = new THREE.PerspectiveCamera(32, 9 / 16, 0.02, 20)
  private renderer: RendererLike
  /** The real WebGL renderer, when there is one (not a test stub). */
  private gl: THREE.WebGLRenderer | null
  private post: PostChain | null = null
  private root = new THREE.Group()
  private table: TableDef
  private tracked = new Set<{ dispose(): void }>()
  private materials = new Map<MaterialId, THREE.MeshPhysicalMaterial>()
  private ballGeometry: THREE.SphereGeometry
  private ballMaterial: THREE.MeshStandardMaterial
  private shadowGeometry: THREE.PlaneGeometry
  private shadowMaterial: THREE.MeshBasicMaterial
  private balls = new Map<number, { ball: THREE.Mesh; shadow: THREE.Mesh }>()
  private flippers = new Map<string, THREE.Group>()
  private drops = new Map<string, THREE.Mesh>()
  private spinners = new Map<string, THREE.Group>()
  private caps = new Map<string, THREE.MeshPhysicalMaterial>()
  private flash = new Map<string, number>()
  private doors = new Map<string, { closed: THREE.Group; open: THREE.Group }>()
  private toys = new Map<string, THREE.Group>()
  /** The signature toys (t-010), the jackpot sparks and the ball trail. */
  private heroes: Heroes | null = null
  /** The cabinet body and the room around it (t-020). */
  private room: Room
  private sparks: Sparks
  private trail: Trail
  /** Sling rubbers that flex when their kicker fires: 1 at the kick. */
  private rubbers = new Map<
    string,
    { mesh: THREE.Mesh; material: THREE.MeshStandardMaterial; kick: number }
  >()
  private inserts = new Map<string, Lamp>()
  private flashers = new Map<string, Flasher>()
  /** Insert ids by the shot they point at, and that shot's flasher. */
  private shotLamps = new Map<string, { insert: string; flasher?: string }>()
  private flasherLights: THREE.PointLight[] = []
  private giLights: THREE.PointLight[] = []
  private hemisphere: THREE.HemisphereLight
  private keyLights: THREE.DirectionalLight[] = []
  /** Static scenery meshes, which cast shadow-map shadows on high only. */
  private staticCasters: THREE.Mesh[] = []
  private gi = 1
  private giTarget = 1
  private frame = 0
  private occluders: Array<{
    id: string
    mesh: THREE.Mesh
    material: THREE.MeshPhysicalMaterial
    fadeFor: CameraPresetId
  }> = []
  /** The DMD panel, its canvas and the last framebuffer painted on it. */
  private dmd: {
    group: THREE.Group
    canvas: HTMLCanvasElement
    texture: THREE.CanvasTexture
    occluder?: string
    shown: Uint8Array
  } | null = null
  private view: CameraPresetId = 'main'
  /** The camera's current eye and look target, in table space (eased). */
  private eye = new THREE.Vector3()
  private look = new THREE.Vector3()
  private aimed = false
  private aspect = 9 / 16
  private framings = new Map<CameraPresetId, Framing>()
  /** World up as seen from the pitched table. */
  private up: THREE.Vector3
  private size = { width: 0, height: 0, dpr: 1 }
  private governor = new QualityGovernor('high')
  private settings: TierSettings = TIER_SETTINGS.high
  private lastFrameAt = 0
  private albedoLoaded = false
  private disposed = false

  constructor(
    table: TableDef,
    canvas: HTMLCanvasElement,
    factory: RendererFactory,
  ) {
    this.table = table
    this.renderer = factory(canvas)
    this.gl =
      this.renderer instanceof THREE.WebGLRenderer ? this.renderer : null
    if (this.gl) this.gl.info.autoReset = false
    this.scene.background = new THREE.Color(0x05040c)
    this.root.rotation.x = (table.physical.pitchDeg * Math.PI) / 180
    this.up = new THREE.Vector3(0, 1, 0).applyQuaternion(
      this.root.quaternion.clone().invert(),
    )
    this.scene.add(this.root)
    this.ballGeometry = this.track(
      new THREE.SphereGeometry(table.physical.ballRadiusM, 32, 16),
    )
    this.ballMaterial = this.track(
      new THREE.MeshStandardMaterial(BALL_MATERIAL),
    )
    const r = table.physical.ballRadiusM
    this.shadowGeometry = this.track(new THREE.PlaneGeometry(r * 3.4, r * 3.4))
    this.shadowGeometry.rotateX(-Math.PI / 2)
    this.shadowMaterial = this.track(
      new THREE.MeshBasicMaterial({
        color: 0x000000,
        alphaMap: this.track(contactShadowTexture()),
        transparent: true,
        depthWrite: false,
        polygonOffset: true,
        polygonOffsetFactor: -2,
      }),
    )
    this.hemisphere = new THREE.HemisphereLight(0xc7d2fe, 0x1e1033, 0.55)
    this.scene.add(this.hemisphere)
    this.buildLights()
    this.buildTable()
    this.buildLamps()
    this.buildDmd()
    const track = <T extends { dispose(): void }>(r: T) => this.track(r)
    if (this.table.hero) {
      this.heroes = new Heroes(this.table.hero, track)
      this.root.add(this.heroes.group)
    }
    this.sparks = new Sparks(SPARK_CAPACITY, track)
    this.trail = new Trail(TRAIL_BALLS, track)
    this.root.add(this.sparks.points, this.trail.points)
    this.buildRubbers()
    this.room = new Room(
      this.table,
      track,
      this.root.rotation.x,
      this.table.art?.room,
    )
    this.root.add(this.room.cabinet)
    this.scene.add(this.room.world)
    // The room fades into the dark well away from the machine.
    this.scene.fog = new THREE.Fog(0x05040c, 2.8, 9)
    if (this.gl) this.reflect(this.track(buildEnvironment(this.gl)))
    this.applyTier()
    this.aimCamera(9 / 16)
  }

  private preset(id: CameraPresetId): CameraPreset {
    return (
      this.table.cameras.find((c) => c.id === id) ??
      this.table.cameras.find((c) => c.id === 'main') ??
      this.table.cameras[0]!
    )
  }

  private track<T extends { dispose(): void }>(resource: T): T {
    this.tracked.add(resource)
    liveResources++
    return resource
  }

  private material(id: MaterialId): THREE.MeshPhysicalMaterial {
    let m = this.materials.get(id)
    if (!m) {
      m = this.track(new THREE.MeshPhysicalMaterial(MATERIALS[id]))
      this.materials.set(id, m)
    }
    return m
  }

  /**
   * Give every material the environment map itself: through
   * scene.environment, three.js would use one intensity for all of them,
   * and the playfield needs far less reflection than chrome or the ball.
   */
  private reflect(env: THREE.Texture) {
    this.scene.traverse((node) => {
      const material = (node as THREE.Mesh).material
      if (
        material instanceof THREE.MeshStandardMaterial &&
        material.envMap === null
      )
        material.envMap = env
    })
    this.ballMaterial.envMap = env
  }

  private buildLights() {
    const key = new THREE.DirectionalLight(0xfff4e0, 1.6)
    key.position.set(0.3, 1.6, 0.6)
    key.target = this.root
    const cam = key.shadow.camera
    cam.left = -0.45
    cam.right = 0.45
    cam.top = 0.7
    cam.bottom = -0.7
    cam.near = 0.5
    cam.far = 3
    key.shadow.bias = -0.0005
    key.shadow.normalBias = 0.002
    this.scene.add(key)
    this.keyLights.push(key)
    // Each zone (the sub-table) has its own key light, so its toys and
    // flippers cast shadows too: the main light's shadow box ends at the arch.
    for (const zone of this.table.zones ?? []) {
      const cx = (zone.min[0] + zone.max[0]) / 2
      const cz = (zone.min[1] + zone.max[1]) / 2
      const aim = new THREE.Object3D()
      aim.position.set(cx, 0, cz)
      this.root.add(aim)
      const light = new THREE.DirectionalLight(0xffe7c2, 1.5)
      light.position.set(cx + 0.15, 1.2, cz + 0.35)
      light.target = aim
      const half = Math.max(
        zone.max[0] - zone.min[0],
        zone.max[1] - zone.min[1],
      )
      light.shadow.camera.left = -half
      light.shadow.camera.right = half
      light.shadow.camera.top = half
      light.shadow.camera.bottom = -half
      light.shadow.camera.near = 0.3
      light.shadow.camera.far = 2.5
      light.shadow.bias = -0.0005
      light.shadow.normalBias = 0.002
      this.root.add(light)
      this.keyLights.push(light)
    }
    // GI: warm bulbs under the slings first (every tier keeps those), then
    // under the upper plastics either side of the pops.
    for (const [x, z] of [
      [-0.15, -0.17],
      [0.15, -0.17],
      [-0.17, -0.64],
      [0.19, -0.66],
    ] as const) {
      const bulb = new THREE.PointLight(0xffd59a, GI_LIGHT, 0.45, 2)
      bulb.position.set(x, 0.035, z)
      this.root.add(bulb)
      this.giLights.push(bulb)
    }
    for (let i = 0; i < FLASHER_POOL; i++) {
      // A gentler falloff than physical: a flasher washes an area of the
      // playfield rather than burning a hot spot on the nearest plastic.
      const light = new THREE.PointLight(0xffffff, 0, FLASHER_REACH, 1)
      this.root.add(light)
      this.flasherLights.push(light)
    }
  }

  private buildTable() {
    const pieces = new Map<MaterialId, THREE.BufferGeometry[]>()
    const add = (
      material: MaterialId,
      geo: THREE.BufferGeometry,
      matrix: THREE.Matrix4,
    ) => {
      geo.applyMatrix4(matrix)
      const list = pieces.get(material) ?? []
      list.push(geo)
      pieces.set(material, list)
    }
    const one = new THREE.Vector3(1, 1, 1)
    for (const def of [...this.table.colliders, ...(this.table.trim ?? [])]) {
      if (def.kind !== 'post' && def.hidden) continue
      if (def.kind === 'mesh') {
        add(def.material, meshGeometry(def), new THREE.Matrix4())
        continue
      }
      const position = v3(def.at)
      if (def.kind === 'box') {
        const quat = def.quat
          ? new THREE.Quaternion(...def.quat)
          : new THREE.Quaternion().setFromAxisAngle(
              new THREE.Vector3(0, 1, 0),
              def.yaw ?? 0,
            )
        add(
          def.material,
          new THREE.BoxGeometry(
            def.half[0] * 2,
            def.half[1] * 2,
            def.half[2] * 2,
          ),
          new THREE.Matrix4().compose(position, quat, one),
        )
      } else {
        add(
          def.kick ? 'post' : def.material,
          new THREE.CylinderGeometry(
            def.radius,
            def.radius * 1.08,
            def.halfHeight * 2,
            32,
          ),
          new THREE.Matrix4().compose(position, new THREE.Quaternion(), one),
        )
        if (def.kick) this.addPopCap(def.id, def.at, def.radius, def.halfHeight)
      }
    }
    this.paintPlayfield()
    for (const [material, list] of pieces) {
      const merged = mergeGeometries(list, false)
      for (const geo of list) geo.dispose()
      if (!merged) continue
      if (material === 'playfield') planarUVs(merged, artBounds(this.table))
      const mesh = new THREE.Mesh(this.track(merged), this.material(material))
      mesh.receiveShadow = true
      if (material !== 'playfield' && material !== 'ramp')
        this.staticCasters.push(mesh)
      this.root.add(mesh)
    }
    this.buildMechanisms()
    this.buildDoorsAndToys()
    const body = this.track(new THREE.MeshPhysicalMaterial(FLIPPER_MATERIAL))
    for (const def of this.table.flippers) {
      const group = new THREE.Group()
      group.position.copy(v3(def.pivot))
      const bat = new THREE.Mesh(
        this.track(new ConvexGeometry(batOutline(def, -0.0015, 0.0005, 0.024))),
        body,
      )
      bat.castShadow = true
      const rubber = new THREE.Mesh(
        this.track(new ConvexGeometry(batOutline(def, 0, 0.006, 0.018))),
        this.track(
          new THREE.MeshPhysicalMaterial({
            color: FLIPPER_RUBBER[def.side],
            roughness: 0.75,
          }),
        ),
      )
      group.add(bat, rubber)
      group.rotation.y = flipperYaw(def, def.restAngle)
      this.flippers.set(def.id, group)
      this.root.add(group)
    }
  }

  /**
   * The painted playfield art, on the real renderer only (it needs a
   * canvas). The table's generated albedo loads in the background and is
   * painted in when it arrives; until then, or if it never does, the
   * procedural art stands.
   */
  private paintPlayfield() {
    if (!this.gl) return
    const bounds = artBounds(this.table)
    const canvas = paintPlayfield(this.table, bounds)
    if (!canvas) return
    const art = this.track(new THREE.CanvasTexture(canvas))
    art.colorSpace = THREE.SRGBColorSpace
    art.anisotropy = Math.min(8, this.gl.capabilities.getMaxAnisotropy())
    const playfield = this.material('playfield')
    playfield.map = art
    playfield.color.set(0xffffff)
    const src = this.table.art?.playfield?.src
    if (!src || typeof Image === 'undefined') return
    const image = new Image()
    image.decoding = 'async'
    image.onload = () => {
      if (this.disposed) return
      const painted = paintPlayfield(this.table, bounds, image)
      if (!painted) return
      art.image = painted
      art.needsUpdate = true
      this.albedoLoaded = true
    }
    image.src = src
  }

  /** The generated playfield art has loaded and is on the table. */
  get hasGeneratedArt(): boolean {
    return this.albedoLoaded
  }

  /** Drop targets, scoop holes and saucer rims, and the spinner plates. */
  private buildMechanisms() {
    for (const def of this.table.drops) {
      const geo = this.track(
        new THREE.BoxGeometry(
          def.half[0] * 2,
          def.half[1] * 2,
          def.half[2] * 2,
        ),
      )
      const mesh = new THREE.Mesh(geo, this.material('plastic-printed'))
      mesh.position.copy(v3(def.at))
      mesh.rotation.y = def.yaw ?? 0
      mesh.castShadow = true
      this.drops.set(def.id, mesh)
      this.root.add(mesh)
    }
    const holeMat = this.track(
      new THREE.MeshStandardMaterial({ color: 0x020205, roughness: 1 }),
    )
    for (const def of this.table.scoops) {
      if (def.hidden) continue
      const floor = def.at[1] - this.table.physical.ballRadiusM
      const hole = new THREE.Mesh(
        this.track(new THREE.CircleGeometry(def.radius, 24)),
        holeMat,
      )
      hole.rotation.x = -Math.PI / 2
      hole.position.set(def.at[0], floor + 0.0008, def.at[2])
      this.root.add(hole)
      const rim = new THREE.Mesh(
        this.track(new THREE.TorusGeometry(def.radius + 0.002, 0.0022, 8, 32)),
        this.material('chrome'),
      )
      rim.rotation.x = -Math.PI / 2
      rim.position.set(def.at[0], floor + 0.0015, def.at[2])
      this.root.add(rim)
    }
    for (const def of this.table.spinners) {
      const group = new THREE.Group()
      group.position.set(def.at[0], def.at[1] + 0.012, def.at[2])
      group.rotation.y = def.yaw ?? 0
      const plate = new THREE.Mesh(
        this.track(new THREE.BoxGeometry(def.half[0] * 1.8, 0.02, 0.0015)),
        this.material('chrome'),
      )
      plate.position.y = -0.008
      plate.castShadow = true
      group.add(plate)
      this.spinners.set(def.id, group)
      this.root.add(group)
    }
  }

  private box(def: BoxCollider): THREE.Mesh {
    const mesh = new THREE.Mesh(
      this.track(
        new THREE.BoxGeometry(
          def.half[0] * 2,
          def.half[1] * 2,
          def.half[2] * 2,
        ),
      ),
      this.material(def.material),
    )
    mesh.position.copy(v3(def.at))
    if (def.quat) mesh.quaternion.set(...def.quat)
    else mesh.rotation.y = def.yaw ?? 0
    mesh.castShadow = true
    mesh.receiveShadow = true
    return mesh
  }

  /** Doors (each state's walls), toys, and the occluders that fade. */
  private buildDoorsAndToys() {
    for (const def of this.table.doors ?? []) {
      const closed = new THREE.Group()
      const open = new THREE.Group()
      for (const wall of def.closed)
        if (!wall.hidden) closed.add(this.box(wall))
      for (const wall of def.open) if (!wall.hidden) open.add(this.box(wall))
      open.visible = false
      this.root.add(closed, open)
      this.doors.set(def.id, { closed, open })
    }
    for (const def of this.table.toys ?? []) {
      const group = new THREE.Group()
      group.position.copy(v3(def.at))
      const hub = new THREE.Mesh(
        this.track(new THREE.CylinderGeometry(0.008, 0.008, 0.03, 16)),
        this.material('chrome'),
      )
      hub.position.y = 0.004
      group.add(hub)
      for (let i = 0; i < def.arms; i++) {
        const yaw = (2 * Math.PI * i) / def.arms
        const arm = new THREE.Mesh(
          this.track(
            new THREE.BoxGeometry(
              def.armHalf[0] * 2,
              def.armHalf[1] * 2,
              def.armHalf[2] * 2,
            ),
          ),
          this.material(def.material),
        )
        arm.position.set(
          Math.cos(yaw) * def.armHalf[0],
          0,
          -Math.sin(yaw) * def.armHalf[0],
        )
        arm.rotation.y = yaw
        arm.castShadow = true
        group.add(arm)
      }
      this.toys.set(def.id, group)
      this.root.add(group)
    }
    for (const def of this.table.occluders ?? []) {
      const material = this.track(
        new THREE.MeshPhysicalMaterial({
          ...MATERIALS.cabinet,
          transparent: true,
        }),
      )
      const mesh = new THREE.Mesh(
        this.track(
          new THREE.BoxGeometry(
            def.half[0] * 2,
            def.half[1] * 2,
            def.half[2] * 2,
          ),
        ),
        material,
      )
      mesh.position.copy(v3(def.at))
      // Faded, it must not keep shading the area it hides.
      mesh.castShadow = false
      this.root.add(mesh)
      this.occluders.push({ id: def.id, mesh, material, fadeFor: def.fadeFor })
    }
  }

  /** Inserts set flush in the playfield, and the flasher domes. */
  private buildLamps() {
    for (const def of this.table.inserts ?? []) {
      const geo = this.track(new THREE.ShapeGeometry(insertShape(def), 12))
      geo.rotateX(-Math.PI / 2)
      const color = new THREE.Color(def.color)
      const material = this.track(
        new THREE.MeshStandardMaterial({
          color: color.clone().multiplyScalar(0.2),
          emissive: color,
          emissiveIntensity: INSERT_OFF,
          roughness: 0.18,
          polygonOffset: true,
          polygonOffsetFactor: -1,
        }),
      )
      const mesh = new THREE.Mesh(geo, material)
      mesh.position.set(def.at[0], 0.0004, def.at[1])
      mesh.rotation.y = def.yaw ?? 0
      mesh.receiveShadow = true
      this.root.add(mesh)
      this.inserts.set(def.id, {
        material,
        level: 'off',
        glow: INSERT_OFF,
        pulse: 0,
      })
      if (def.shot)
        this.shotLamps.set(def.shot, { insert: def.id, flasher: def.flasher })
    }
    const dome = this.track(
      new THREE.SphereGeometry(0.011, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2),
    )
    const base = this.track(new THREE.CylinderGeometry(0.013, 0.013, 0.004, 24))
    const post = this.track(new THREE.CylinderGeometry(0.003, 0.003, 1, 12))
    const black = this.track(
      new THREE.MeshStandardMaterial({ color: 0x0b0b10, roughness: 0.6 }),
    )
    const bounds = artBounds(this.table)
    const mid = (bounds.x0 + bounds.x1) / 2
    for (const def of this.table.flashers ?? []) {
      const color = new THREE.Color(def.color)
      const material = this.track(
        new THREE.MeshPhysicalMaterial({
          color: color.clone().multiplyScalar(0.6),
          emissive: color,
          emissiveIntensity: FLASHER_REST,
          roughness: 0.15,
          clearcoat: 1,
          transparent: true,
          opacity: 0.9,
        }),
      )
      const group = new THREE.Group()
      group.position.copy(v3(def.at))
      const plinth = new THREE.Mesh(base, black)
      plinth.position.y = 0.002
      const lens = new THREE.Mesh(dome, material)
      lens.position.y = 0.004
      group.add(plinth, lens)
      if (def.at[1] > 0.005) {
        const stand = new THREE.Mesh(post, this.material('chrome'))
        stand.scale.y = def.at[1]
        stand.position.y = -def.at[1] / 2
        group.add(stand)
      }
      this.root.add(group)
      this.flashers.set(def.id, {
        material,
        level: 'off',
        glow: FLASHER_REST,
        pulse: 0,
        // The light it throws comes from above and in front of the dome:
        // a point light a centimetre from the rail it stands on would burn
        // that one patch white.
        position: v3(def.at).add(
          new THREE.Vector3(
            Math.max(-FLASHER_THROW, Math.min(FLASHER_THROW, mid - def.at[0])),
            FLASHER_LIFT,
            def.at[2] < -0.9 ? FLASHER_THROW : 0,
          ),
        ),
        color,
      })
    }
  }

  /**
   * The DMD in the backbox (real renderer only: it paints a canvas). A dot
   * panel lit by its own picture, a black bezel round it, and a faint glass
   * in front that catches the room.
   */
  private buildDmd() {
    const def = this.table.dmd
    if (!def || !this.gl) return
    const canvas = createDmdCanvas()
    const g = canvas?.getContext('2d')
    if (!canvas || !g) return
    const blank = new Uint8Array(DMD_COLS * DMD_ROWS)
    paintDmd(g, blank)
    const texture = this.track(new THREE.CanvasTexture(canvas))
    texture.colorSpace = THREE.SRGBColorSpace
    texture.anisotropy = Math.min(4, this.gl.capabilities.getMaxAnisotropy())
    const w = def.width
    const h = def.width / 4
    const group = new THREE.Group()
    group.position.copy(v3(def.at))
    const panel = new THREE.Mesh(
      this.track(new THREE.PlaneGeometry(w, h)),
      this.track(
        new THREE.MeshStandardMaterial({
          color: 0x000000,
          emissive: 0xffffff,
          emissiveMap: texture,
          emissiveIntensity: DMD_GLOW,
          roughness: 0.9,
        }),
      ),
    )
    const bezel = new THREE.Mesh(
      this.track(new THREE.BoxGeometry(w + 0.024, h + 0.024, 0.006)),
      this.track(
        new THREE.MeshStandardMaterial({ color: 0x050407, roughness: 0.5 }),
      ),
    )
    bezel.position.z = -0.0035
    const glass = new THREE.Mesh(
      this.track(new THREE.PlaneGeometry(w, h)),
      this.track(
        new THREE.MeshPhysicalMaterial({
          color: 0xffffff,
          transparent: true,
          opacity: 0.06,
          roughness: 0.05,
          clearcoat: 1,
          depthWrite: false,
        }),
      ),
    )
    glass.position.z = 0.002
    group.add(bezel, panel, glass)
    this.root.add(group)
    this.dmd = { group, canvas, texture, occluder: def.occluder, shown: blank }
  }

  /** Show a DMD frame (the 128x32 framebuffer); repaints only on change. */
  setDmd(buf: Uint8Array) {
    const dmd = this.dmd
    if (!dmd || this.disposed) return
    if (
      dmd.shown.length === buf.length &&
      dmd.shown.every((v, i) => v === buf[i])
    )
      return
    dmd.shown = buf.slice()
    const g = dmd.canvas.getContext('2d')
    if (!g) return
    paintDmd(g, dmd.shown)
    dmd.texture.needsUpdate = true
  }

  /**
   * The lit cap on a pop bumper, in its own colour, and the chrome skirt at
   * its foot; the cap flashes when the bumper fires.
   */
  private addPopCap(id: string, at: Vec3, radius: number, halfHeight: number) {
    const color = POP_COLORS[this.caps.size % POP_COLORS.length]!
    const geo = this.track(
      new THREE.CylinderGeometry(radius * 0.92, radius * 0.92, 0.006, 32),
    )
    const mat = this.track(
      new THREE.MeshPhysicalMaterial({
        color,
        emissive: color,
        emissiveIntensity: POP_REST,
        roughness: 0.25,
        clearcoat: 1,
      }),
    )
    const cap = new THREE.Mesh(geo, mat)
    cap.position.set(at[0], at[1] + halfHeight + 0.003, at[2])
    cap.castShadow = true
    this.root.add(cap)
    const skirt = new THREE.Mesh(
      this.track(new THREE.TorusGeometry(radius * 1.12, 0.0025, 8, 40)),
      this.material('chrome'),
    )
    skirt.rotation.x = -Math.PI / 2
    skirt.position.set(at[0], 0.0025, at[2])
    this.root.add(skirt)
    this.caps.set(id, mat)
  }

  /**
   * Light up a mechanism, insert or flasher briefly (rules ask for this on a
   * hit). A shot id flashes that shot's arrow and fires its flasher.
   */
  pulse(id: string) {
    if (this.caps.has(id)) this.flash.set(id, 1)
    const shot = this.shotLamps.get(id)
    const insert = this.inserts.get(shot?.insert ?? id)
    if (insert) insert.pulse = 1
    const flasher = this.flashers.get(shot?.flasher ?? id)
    if (flasher) flasher.pulse = 1
  }

  /** What the signature toys show, from the rules (rules/toys.ts). */
  setToys(pose: ToyPose) {
    this.heroes?.setPose(pose)
  }

  /** The drone's delivery flight: all three nets brought home. */
  deliver() {
    this.heroes?.deliver()
  }

  /** The cabinet and the room around it, for tests. */
  get stage(): Room {
    return this.room
  }

  /** The signature toys, for tests (null on a table without them). */
  get heroToys(): Heroes | null {
    return this.heroes
  }

  /**
   * A shower of sparks over a shot (its first switch) or a toy ('beacon',
   * 'drone'), in the shot's arrow colour: a jackpot.
   */
  burst(id: string) {
    const at = this.spotFor(id)
    if (!at) return
    const insert = this.table.inserts?.find((n) => n.shot === id)
    const color = new THREE.Color(insert?.color ?? 0xfde68a)
    this.sparks.burst(at, color)
  }

  /** Sparks in the air (for tests). */
  get sparksLive(): number {
    return this.sparks.live
  }

  /** Trail points lit behind fast balls this frame (for tests). */
  get trailLit(): number {
    return this.trail.lit
  }

  /** A sling's kicker fired: its rubber flexes. */
  kick(id: string) {
    const rubber = this.rubbers.get(id)
    if (rubber) rubber.kick = 1
  }

  /** How far a sling rubber is still flexed (for tests). */
  rubberKick(id: string): number {
    return this.rubbers.get(id)?.kick ?? 0
  }

  private spotFor(id: string): Vec3 | null {
    const hero = this.table.hero
    if (id === 'beacon' && hero) return hero.beacon.at
    if (id === 'drone' && this.heroes) return this.heroes.droneAt
    const first = this.table.shots.find((s) => s.id === id)?.sensors[0]
    if (!first) return null
    const at =
      this.table.sensors.find((s) => s.id === first)?.at ??
      this.table.scoops.find((s) => s.id === first)?.at ??
      this.table.spinners.find((s) => s.id === first)?.at
    return at ? [at[0], 0.03, at[2]] : null
  }

  /**
   * The sling rubbers: a band over each kicker, hidden at rest (the static
   * table draws the rubber), shown flexing out for a few frames when it
   * fires.
   */
  private buildRubbers() {
    for (const def of this.table.colliders) {
      if (def.kind !== 'box' || !/^sling-.+-kicker$/.test(def.id)) continue
      const geo = this.track(
        new THREE.BoxGeometry(
          def.half[0] * 2,
          def.half[1] * 2.1,
          def.half[2] * 2,
        ),
      )
      const material = this.track(
        new THREE.MeshStandardMaterial({
          color: 0xf8fafc,
          roughness: 0.6,
          emissive: 0xffffff,
          emissiveIntensity: 0,
        }),
      )
      const mesh = new THREE.Mesh(geo, material)
      mesh.position.copy(v3(def.at))
      mesh.rotation.y = def.yaw ?? 0
      mesh.visible = false
      this.root.add(mesh)
      this.rubbers.set(def.id, { mesh, material, kick: 0 })
    }
  }

  /** One frame of the toys, sparks and sling rubbers. */
  private animateToys() {
    this.heroes?.animate()
    this.sparks.update()
    for (const rubber of this.rubbers.values()) {
      rubber.mesh.visible = rubber.kick > 0
      if (rubber.kick <= 0) continue
      rubber.mesh.scale.z = 1 + rubber.kick * RUBBER_FLEX
      rubber.material.emissiveIntensity = rubber.kick * 0.8
      rubber.kick = Math.max(0, rubber.kick - RUBBER_DECAY)
    }
  }

  /** Set every lamp from the lamp matrix (rules/lamps.ts), and the GI level. */
  setLamps(lamps: Record<string, LampLevel>, gi: number) {
    for (const [id, level] of Object.entries(lamps)) {
      const lamp = this.inserts.get(id) ?? this.flashers.get(id)
      if (lamp) lamp.level = level
    }
    this.giTarget = gi
  }

  /** The level each lamp is set to (for tests). */
  lampLevels(): Record<string, LampLevel> {
    const out: Record<string, LampLevel> = {}
    for (const [id, lamp] of this.inserts) out[id] = lamp.level
    for (const [id, lamp] of this.flashers) out[id] = lamp.level
    return out
  }

  /** Pin a quality tier (screenshots, tests); null returns to measuring. */
  forceQuality(tier: QualityTier | null) {
    this.governor.force(tier)
    this.applyTier()
  }

  get quality(): QualityTier {
    return this.governor.tier
  }

  /** Apply the governor's tier to the renderer, lights and shadows. */
  private applyTier() {
    const before = this.settings
    this.settings = TIER_SETTINGS[this.governor.tier]
    const s = this.settings
    this.sparks.budget = s.sparks
    this.trail.enabled = s.trail
    this.room?.setTier(this.governor.tier)
    const shadows = s.shadowMapSize > 0
    for (const light of this.keyLights) {
      light.castShadow = shadows
      if (shadows && light.shadow.mapSize.x !== s.shadowMapSize) {
        light.shadow.mapSize.set(s.shadowMapSize, s.shadowMapSize)
        light.shadow.map?.dispose()
        light.shadow.map = null
      }
    }
    for (const mesh of this.staticCasters) mesh.castShadow = s.staticShadows
    for (const [i, light] of this.flasherLights.entries())
      light.visible = i < s.flasherLights
    for (const [i, light] of this.giLights.entries())
      light.visible = i < s.giLights
    this.shadowMaterial.opacity = s.contactShadow
    if (this.gl) {
      if (this.gl.shadowMap.enabled !== shadows) {
        this.gl.shadowMap.enabled = shadows
        this.scene.traverse((node) => {
          const material = (node as THREE.Mesh).material
          if (material instanceof THREE.Material) material.needsUpdate = true
        })
      }
      const postChanged =
        !this.post ||
        before.bloomScale !== s.bloomScale ||
        before.samples !== s.samples
      if (postChanged) {
        this.post?.dispose()
        this.post =
          s.bloomScale > 0
            ? createPostChain(this.gl, this.scene, this.camera, s)
            : null
      }
    }
    if (this.size.width > 0) this.applySize()
  }

  private applySize() {
    const { width, height, dpr } = this.size
    const ratio = Math.min(this.settings.maxPixelRatio, Math.max(1, dpr))
    this.renderer.setPixelRatio(ratio)
    this.renderer.setSize(width, height, false)
    this.post?.setSize(width, height, ratio)
  }

  /** Where a preset puts the camera at the current aspect, in table space. */
  private framing(id: CameraPresetId): Framing {
    let framing = this.framings.get(id)
    if (!framing) {
      framing = fitCamera(this.preset(id), this.aspect, this.up)
      this.framings.set(id, framing)
    }
    return framing
  }

  private aimCamera(aspect: number) {
    if (aspect !== this.aspect) this.framings.clear()
    this.aspect = aspect
    if (!this.aimed) {
      const { eye, target } = this.framing(this.view)
      this.eye.copy(eye)
      this.look.copy(target)
      this.aimed = true
    }
    this.placeCamera()
  }

  private placeCamera() {
    this.root.updateMatrixWorld()
    this.camera.position.copy(this.root.localToWorld(this.eye.clone()))
    this.camera.fov = this.framing(this.view).fov
    this.camera.aspect = this.aspect
    this.camera.updateProjectionMatrix()
    this.camera.lookAt(this.root.localToWorld(this.look.clone()))
  }

  /** Ease toward a camera preset (the sub-table while every ball is there). */
  setView(id: CameraPresetId) {
    if (this.table.cameras.some((c) => c.id === id)) this.view = id
  }

  /** The preset the camera is easing toward. */
  get cameraView(): CameraPresetId {
    return this.view
  }

  /**
   * Move the camera one frame toward its preset, and fade any occluder that
   * stands in front of the area it is visiting.
   */
  private easeCamera() {
    const { eye, target } = this.framing(this.view)
    this.eye.lerp(eye, CAMERA_EASE)
    this.look.lerp(target, CAMERA_EASE)
    this.placeCamera()
    const home = this.framing('main').target
    for (const occluder of this.occluders) {
      const away = this.framing(occluder.fadeFor).target
      const span = home.distanceTo(away) || 1
      const t = Math.min(1, Math.max(0, 1 - this.look.distanceTo(away) / span))
      occluder.material.opacity = 1 - t
      occluder.material.depthWrite = t < 0.5
      // Gone, not just clear: a faded lid still catches the key light's
      // highlight and veils the room under it.
      occluder.mesh.visible = t < 0.95
      // The DMD is part of the backbox: it goes when the backbox does.
      if (this.dmd && this.dmd.occluder === occluder.id)
        this.dmd.group.visible = t < 0.5
      if (occluder.id === 'backbox') this.room.setBackglassOpacity(1 - t)
    }
  }

  resize(width: number, height: number, dpr: number) {
    if (this.disposed || width <= 0 || height <= 0) return
    this.size = { width, height, dpr }
    this.applySize()
    this.aimCamera(width / height)
  }

  /** Mirror the physics world: balls appear, move and vanish; flippers swing. */
  sync(
    balls: BallView[],
    flipperAngles: Record<string, number>,
    mechanisms: {
      drops?: Record<string, boolean>
      spinners?: Record<string, number>
      doors?: Record<string, boolean>
      toys?: Record<string, number>
    } = {},
  ) {
    if (this.disposed) return
    const seen = new Set<number>()
    const r = this.table.physical.ballRadiusM
    for (const ball of balls) {
      seen.add(ball.id)
      let view = this.balls.get(ball.id)
      if (!view) {
        view = {
          ball: new THREE.Mesh(this.ballGeometry, this.ballMaterial),
          shadow: new THREE.Mesh(this.shadowGeometry, this.shadowMaterial),
        }
        view.ball.castShadow = true
        this.balls.set(ball.id, view)
        this.root.add(view.ball, view.shadow)
      }
      view.ball.position.set(...ball.position)
      view.ball.quaternion.set(...ball.rotation)
      view.shadow.position.set(
        ball.position[0],
        ball.position[1] - r + 0.0006,
        ball.position[2],
      )
    }
    for (const [id, view] of this.balls) {
      if (seen.has(id)) continue
      this.root.remove(view.ball, view.shadow)
      this.balls.delete(id)
    }
    this.trail.update(balls)
    for (const def of this.table.flippers) {
      const group = this.flippers.get(def.id)
      const angle = flipperAngles[def.id]
      if (group && angle !== undefined)
        group.rotation.y = flipperYaw(def, angle)
    }
    // Drop targets sink into the playfield and rise again, not blink: a few
    // frames of travel, as the real bank's coil throws them.
    for (const def of this.table.drops) {
      const mesh = this.drops.get(def.id)
      const up = mechanisms.drops?.[def.id]
      if (!mesh || up === undefined) continue
      const height = def.half[1] * 2
      const target = up ? def.at[1] : def.at[1] - height
      mesh.position.y += (target - mesh.position.y) * DROP_TRAVEL
      if (Math.abs(target - mesh.position.y) < 1e-4) mesh.position.y = target
      mesh.visible = mesh.position.y > def.at[1] - height + 1e-4
    }
    for (const [id, angle] of Object.entries(mechanisms.spinners ?? {})) {
      const group = this.spinners.get(id)
      if (group) group.rotation.x = angle
    }
    for (const [id, open] of Object.entries(mechanisms.doors ?? {})) {
      const door = this.doors.get(id)
      if (!door) continue
      door.closed.visible = !open
      door.open.visible = open
    }
    for (const [id, angle] of Object.entries(mechanisms.toys ?? {})) {
      const group = this.toys.get(id)
      if (group) group.rotation.y = angle
    }
    for (const [id, level] of this.flash) {
      const mat = this.caps.get(id)
      if (mat) mat.emissiveIntensity = POP_REST + level * POP_FLASH
      const next = level - 0.08
      if (next <= 0) this.flash.delete(id)
      else this.flash.set(id, next)
    }
  }

  /** One frame of lamp warm-up and fade, GI, and the flasher light pool. */
  private animateLamps() {
    this.frame++
    const blinkOn = Math.floor(this.frame / BLINK_FRAMES) % 2 === 0
    const ease = (lamp: Lamp, off: number, on: number, peak: number) => {
      const lit =
        lamp.level === 'on' || (lamp.level === 'blink' && blinkOn) ? on : off
      lamp.glow += (lit - lamp.glow) * LAMP_EASE
      lamp.pulse = Math.max(0, lamp.pulse - PULSE_DECAY)
      lamp.material.emissiveIntensity =
        Math.max(lamp.glow, lamp.pulse * peak) * this.gi
    }
    this.gi += (this.giTarget - this.gi) * GI_EASE
    for (const lamp of this.inserts.values())
      ease(lamp, INSERT_OFF, INSERT_ON, INSERT_FLASH)
    for (const lamp of this.flashers.values())
      ease(lamp, FLASHER_REST, FLASHER_FIRED, FLASHER_FIRED)
    for (const light of this.giLights) light.intensity = GI_LIGHT * this.gi
    this.hemisphere.intensity = 0.2 + 0.35 * this.gi
    // The pool follows the brightest flashers; the rest glow on their own.
    const firing = [...this.flashers.values()]
      .filter((f) => f.material.emissiveIntensity > FLASHER_REST * 2)
      .sort(
        (a, b) => b.material.emissiveIntensity - a.material.emissiveIntensity,
      )
    for (const [i, light] of this.flasherLights.entries()) {
      const flasher = firing[i]
      if (!flasher || !light.visible) {
        light.intensity = 0
        continue
      }
      light.position.copy(flasher.position)
      light.color.copy(flasher.color)
      light.intensity =
        (FLASHER_LIGHT * flasher.material.emissiveIntensity) / FLASHER_FIRED
    }
  }

  /** Frame timing, the tier, and what the last frame cost to draw. */
  stats(): RenderStats {
    const timing = this.governor.stats()
    return {
      tier: this.governor.tier,
      ...timing,
      drawCalls: this.gl?.info.render.calls ?? 0,
      triangles: this.gl?.info.render.triangles ?? 0,
    }
  }

  render() {
    if (this.disposed) return
    const now = performance.now()
    if (this.lastFrameAt > 0 && this.governor.sample(now - this.lastFrameAt))
      this.applyTier()
    this.lastFrameAt = now
    this.easeCamera()
    this.animateLamps()
    this.animateToys()
    this.gl?.info.reset()
    if (this.post) this.post.render()
    else this.renderer.render(this.scene, this.camera)
  }

  dispose() {
    if (this.disposed) return
    this.disposed = true
    this.post?.dispose()
    this.post = null
    for (const light of this.keyLights) light.shadow.map?.dispose()
    for (const resource of this.tracked) {
      resource.dispose()
      liveResources--
    }
    this.tracked.clear()
    this.scene.clear()
    this.renderer.dispose()
  }
}
