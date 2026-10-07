// /utils/arcade/pinball/render/scene.ts
//
// The pinball renderer (conductor kind-pinball/t-004): a Three.js scene built
// from a TableDef, mirroring the physics world each frame. Greybox materials
// for now (t-019 brings the PBR hero pass), but already a real perspective
// table: pitched root, physically based materials, an environment map so the
// steel ball reflects, and shadows.
//
// Every geometry, material and texture it creates is tracked and released in
// dispose(), and liveRenderResources() lets tests prove nothing leaks when a
// cabinet is entered and left over and over.

import * as THREE from 'three'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { flipperYaw } from '../physics/world'
import type { BallView } from '../physics/world'
import type {
  BoxCollider,
  CameraPreset,
  CameraPresetId,
  MaterialId,
  MeshCollider,
  TableDef,
  Vec3,
} from '../types'

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
    antialias: true,
    powerPreference: 'high-performance',
  })
  renderer.outputColorSpace = THREE.SRGBColorSpace
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = 1.1
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = THREE.PCFShadowMap
  return renderer
}

let liveResources = 0

/** Geometries, materials and textures created by scenes and not yet disposed. */
export function liveRenderResources(): number {
  return liveResources
}

const MATERIALS: Record<MaterialId, THREE.MeshStandardMaterialParameters> = {
  playfield: { color: 0x2b1d5c, roughness: 0.42, metalness: 0 },
  chrome: { color: 0xdfe6ee, roughness: 0.18, metalness: 1 },
  rubber: { color: 0xf8fafc, roughness: 0.85, metalness: 0 },
  'plastic-clear': {
    color: 0xffffff,
    roughness: 0.05,
    transparent: true,
    opacity: 0.15,
  },
  'plastic-printed': { color: 0x2dd4bf, roughness: 0.3, metalness: 0 },
  wood: { color: 0x3a2a55, roughness: 0.55, metalness: 0.1 },
  post: { color: 0xf8fafc, roughness: 0.6, metalness: 0 },
  ramp: {
    color: 0x7dd3fc,
    roughness: 0.12,
    metalness: 0,
    transparent: true,
    opacity: 0.45,
  },
  cabinet: { color: 0x1c1030, roughness: 0.6, metalness: 0.2 },
}

/** How far the camera moves toward its preset each frame (0..1). */
const CAMERA_EASE = 0.08

function v3(v: Vec3): THREE.Vector3 {
  return new THREE.Vector3(v[0], v[1], v[2])
}

/**
 * A collider mesh as render geometry, with each triangle drawn both ways so
 * rails and ramp floors read from either side. The UVs are blank so it
 * merges with the box and cylinder pieces sharing its material.
 */
function meshGeometry(def: MeshCollider): THREE.BufferGeometry {
  const geo = new THREE.BufferGeometry()
  const reversed: number[] = []
  for (let i = 0; i < def.indices.length; i += 3) {
    reversed.push(def.indices[i]!, def.indices[i + 2]!, def.indices[i + 1]!)
  }
  geo.setAttribute(
    'position',
    new THREE.Float32BufferAttribute(def.vertices, 3),
  )
  geo.setAttribute(
    'uv',
    new THREE.Float32BufferAttribute(
      new Array((def.vertices.length / 3) * 2).fill(0),
      2,
    ),
  )
  geo.setIndex([...def.indices, ...reversed])
  geo.computeVertexNormals()
  return geo
}

export class PinballScene {
  readonly scene = new THREE.Scene()
  readonly camera = new THREE.PerspectiveCamera(44, 9 / 16, 0.02, 20)
  private renderer: RendererLike
  private root = new THREE.Group()
  private table: TableDef
  private tracked = new Set<{ dispose(): void }>()
  private materials = new Map<MaterialId, THREE.MeshStandardMaterial>()
  private ballGeometry: THREE.SphereGeometry
  private ballMaterial: THREE.MeshStandardMaterial
  private balls = new Map<number, THREE.Mesh>()
  private flippers = new Map<string, THREE.Group>()
  private drops = new Map<string, THREE.Mesh>()
  private spinners = new Map<string, THREE.Group>()
  private caps = new Map<string, THREE.MeshStandardMaterial>()
  private flash = new Map<string, number>()
  private doors = new Map<string, { closed: THREE.Group; open: THREE.Group }>()
  private toys = new Map<string, THREE.Group>()
  private occluders: Array<{
    material: THREE.MeshStandardMaterial
    fadeFor: CameraPresetId
  }> = []
  private view: CameraPresetId = 'main'
  /** The camera's current eye and look target, in table space (eased). */
  private eye = new THREE.Vector3()
  private look = new THREE.Vector3()
  private aimed = false
  private aspect = 9 / 16
  private disposed = false

  constructor(
    table: TableDef,
    canvas: HTMLCanvasElement,
    factory: RendererFactory,
  ) {
    this.table = table
    this.renderer = factory(canvas)
    this.scene.background = new THREE.Color(0x07040f)
    this.root.rotation.x = (table.physical.pitchDeg * Math.PI) / 180
    this.scene.add(this.root)
    this.ballGeometry = this.track(
      new THREE.SphereGeometry(table.physical.ballRadiusM, 32, 16),
    )
    this.ballMaterial = this.track(
      new THREE.MeshStandardMaterial({
        color: 0xffffff,
        metalness: 1,
        roughness: 0.08,
      }),
    )
    this.buildEnvironment()
    this.buildLights()
    this.buildTable()
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

  private material(id: MaterialId): THREE.MeshStandardMaterial {
    let m = this.materials.get(id)
    if (!m) {
      m = this.track(new THREE.MeshStandardMaterial(MATERIALS[id]))
      this.materials.set(id, m)
    }
    return m
  }

  /** A soft studio environment so metal reads as metal (real renderer only). */
  private buildEnvironment() {
    if (!(this.renderer instanceof THREE.WebGLRenderer)) return
    const pmrem = new THREE.PMREMGenerator(this.renderer)
    const room = new RoomEnvironment()
    const env = this.track(pmrem.fromScene(room, 0.04).texture)
    this.scene.environment = env
    this.scene.environmentIntensity = 0.55
    room.traverse((node) => {
      const mesh = node as THREE.Mesh
      mesh.geometry?.dispose()
      const mat = mesh.material as THREE.Material | THREE.Material[] | undefined
      if (Array.isArray(mat)) mat.forEach((m) => m.dispose())
      else mat?.dispose()
    })
    pmrem.dispose()
  }

  private buildLights() {
    this.scene.add(new THREE.HemisphereLight(0xc7d2fe, 0x1e1033, 0.7))
    const key = new THREE.DirectionalLight(0xfff4e0, 2.2)
    key.position.set(0.3, 1.6, 0.6)
    key.target = this.root
    key.castShadow = true
    key.shadow.mapSize.set(1024, 1024)
    const cam = key.shadow.camera
    cam.left = -0.45
    cam.right = 0.45
    cam.top = 0.7
    cam.bottom = -0.7
    cam.near = 0.5
    cam.far = 3
    key.shadow.bias = -0.0005
    this.scene.add(key)
    // Each zone (the sub-table) has its own key light, so its toys and
    // flippers cast shadows too: the main light's shadow box ends at the arch.
    for (const zone of this.table.zones ?? []) {
      const cx = (zone.min[0] + zone.max[0]) / 2
      const cz = (zone.min[1] + zone.max[1]) / 2
      const aim = new THREE.Object3D()
      aim.position.set(cx, 0, cz)
      this.root.add(aim)
      const light = new THREE.DirectionalLight(0xffe7c2, 1.6)
      light.position.set(cx + 0.15, 1.2, cz + 0.35)
      light.target = aim
      light.castShadow = true
      light.shadow.mapSize.set(512, 512)
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
      this.root.add(light)
    }
    // Warm GI glow down each side rail, as a lit cabinet has.
    for (const x of [-0.24, 0.24]) {
      const gi = new THREE.PointLight(0xffd59a, 0.08, 0.5, 2)
      gi.position.set(x, 0.06, -0.3)
      this.root.add(gi)
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
    for (const def of this.table.colliders) {
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
    for (const [material, list] of pieces) {
      const merged = mergeGeometries(list, false)
      for (const geo of list) geo.dispose()
      if (!merged) continue
      const mesh = new THREE.Mesh(this.track(merged), this.material(material))
      mesh.castShadow = material !== 'playfield' && material !== 'ramp'
      mesh.receiveShadow = true
      this.root.add(mesh)
    }
    this.buildMechanisms()
    this.buildDoorsAndToys()
    for (const def of this.table.flippers) {
      const group = new THREE.Group()
      group.position.copy(v3(def.pivot))
      const radius = (def.baseRadius + def.tipRadius) / 2
      const geo = this.track(
        new THREE.CapsuleGeometry(radius, def.length, 6, 16),
      )
      const bat = new THREE.Mesh(geo, this.material('rubber'))
      bat.position.set(def.length / 2, radius, 0)
      bat.rotation.z = Math.PI / 2
      bat.castShadow = true
      group.add(bat)
      group.rotation.y = flipperYaw(def, def.restAngle)
      this.flippers.set(def.id, group)
      this.root.add(group)
    }
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
        new THREE.MeshStandardMaterial({
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
      this.occluders.push({ material, fadeFor: def.fadeFor })
    }
  }

  /** The lit cap on a pop bumper; it flashes when the bumper fires. */
  private addPopCap(id: string, at: Vec3, radius: number, halfHeight: number) {
    const geo = this.track(
      new THREE.CylinderGeometry(radius * 0.92, radius * 0.92, 0.006, 32),
    )
    const mat = this.track(
      new THREE.MeshStandardMaterial({
        color: 0xf472b6,
        emissive: 0xf472b6,
        emissiveIntensity: 0.25,
        roughness: 0.35,
      }),
    )
    const cap = new THREE.Mesh(geo, mat)
    cap.position.set(at[0], at[1] + halfHeight + 0.003, at[2])
    cap.castShadow = true
    this.root.add(cap)
    this.caps.set(id, mat)
  }

  /** Light up a mechanism briefly (rules ask for this on a hit). */
  pulse(id: string) {
    if (this.caps.has(id)) this.flash.set(id, 1)
  }

  /** Where a preset puts the camera at the current aspect, in table space. */
  private framing(id: CameraPresetId) {
    const p = this.preset(id)
    // A narrower screen pulls the camera back so the full width stays in view.
    const fit = Math.max(1, 0.78 / this.aspect)
    const target = v3(p.target)
    const eye = v3(p.position).sub(target).multiplyScalar(fit).add(target)
    return { eye, target, fov: p.fovDeg }
  }

  private aimCamera(aspect: number) {
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
    this.camera.fov = this.preset(this.view).fovDeg
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
      occluder.material.opacity = 1 - 0.9 * t
      occluder.material.depthWrite = t < 0.5
    }
  }

  resize(width: number, height: number, dpr: number) {
    if (this.disposed || width <= 0 || height <= 0) return
    this.renderer.setPixelRatio(Math.min(2, Math.max(1, dpr)))
    this.renderer.setSize(width, height, false)
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
    for (const ball of balls) {
      seen.add(ball.id)
      let mesh = this.balls.get(ball.id)
      if (!mesh) {
        mesh = new THREE.Mesh(this.ballGeometry, this.ballMaterial)
        mesh.castShadow = true
        this.balls.set(ball.id, mesh)
        this.root.add(mesh)
      }
      mesh.position.set(...ball.position)
      mesh.quaternion.set(...ball.rotation)
    }
    for (const [id, mesh] of this.balls) {
      if (seen.has(id)) continue
      this.root.remove(mesh)
      this.balls.delete(id)
    }
    for (const def of this.table.flippers) {
      const group = this.flippers.get(def.id)
      const angle = flipperAngles[def.id]
      if (group && angle !== undefined)
        group.rotation.y = flipperYaw(def, angle)
    }
    for (const [id, up] of Object.entries(mechanisms.drops ?? {})) {
      const mesh = this.drops.get(id)
      if (mesh) mesh.visible = up
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
      if (mat) mat.emissiveIntensity = 0.25 + level * 2.5
      const next = level - 0.08
      if (next <= 0) this.flash.delete(id)
      else this.flash.set(id, next)
    }
  }

  render() {
    if (this.disposed) return
    this.easeCamera()
    this.renderer.render(this.scene, this.camera)
  }

  dispose() {
    if (this.disposed) return
    this.disposed = true
    for (const resource of this.tracked) {
      resource.dispose()
      liveResources--
    }
    this.tracked.clear()
    this.scene.clear()
    this.renderer.dispose()
  }
}
