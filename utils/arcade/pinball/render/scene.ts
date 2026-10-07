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
import { flipperYaw } from '../physics/world'
import type { BallView } from '../physics/world'
import type { CameraPreset, MaterialId, TableDef, Vec3 } from '../types'

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
}

function v3(v: Vec3): THREE.Vector3 {
  return new THREE.Vector3(v[0], v[1], v[2])
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
  private caps = new Map<string, THREE.MeshStandardMaterial>()
  private flash = new Map<string, number>()
  private preset: CameraPreset
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
    this.preset =
      table.cameras.find((c) => c.id === 'main') ?? table.cameras[0]!
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
    // Warm GI glow down each side rail, as a lit cabinet has.
    for (const x of [-0.24, 0.24]) {
      const gi = new THREE.PointLight(0xffd59a, 0.08, 0.5, 2)
      gi.position.set(x, 0.06, -0.3)
      this.root.add(gi)
    }
  }

  private buildTable() {
    for (const def of this.table.colliders) {
      if (def.id === 'glass') continue
      let mesh: THREE.Mesh
      if (def.kind === 'box') {
        const geo = this.track(
          new THREE.BoxGeometry(
            def.half[0] * 2,
            def.half[1] * 2,
            def.half[2] * 2,
          ),
        )
        mesh = new THREE.Mesh(geo, this.material(def.material))
        mesh.rotation.y = def.yaw ?? 0
      } else {
        const geo = this.track(
          new THREE.CylinderGeometry(
            def.radius,
            def.radius * 1.08,
            def.halfHeight * 2,
            32,
          ),
        )
        mesh = new THREE.Mesh(
          geo,
          this.material(
            def.kind === 'post' && def.kick ? 'post' : def.material,
          ),
        )
        if (def.kick) this.addPopCap(def.id, def.at, def.radius, def.halfHeight)
      }
      mesh.position.copy(v3(def.at))
      mesh.castShadow = def.id !== 'playfield'
      mesh.receiveShadow = true
      this.root.add(mesh)
    }
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

  private aimCamera(aspect: number) {
    const p = this.preset
    // A narrower screen pulls the camera back so the full width stays in view.
    const fit = Math.max(1, 0.78 / aspect)
    const target = v3(p.target)
    const offset = v3(p.position).sub(target).multiplyScalar(fit)
    const local = target.clone().add(offset)
    this.root.updateMatrixWorld()
    this.camera.position.copy(this.root.localToWorld(local.clone()))
    this.camera.fov = p.fovDeg
    this.camera.aspect = aspect
    this.camera.updateProjectionMatrix()
    this.camera.lookAt(this.root.localToWorld(target.clone()))
  }

  resize(width: number, height: number, dpr: number) {
    if (this.disposed || width <= 0 || height <= 0) return
    this.renderer.setPixelRatio(Math.min(2, Math.max(1, dpr)))
    this.renderer.setSize(width, height, false)
    this.aimCamera(width / height)
  }

  /** Mirror the physics world: balls appear, move and vanish; flippers swing. */
  sync(balls: BallView[], flipperAngles: Record<string, number>) {
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
