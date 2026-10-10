// /utils/arcade/pinball/render/dressing.ts
//
// The table's sculpted dressing (conductor kind-pinball/t-028): the parts a
// real machine is built from, in place of the physics primitives. Pop
// bumpers as lit paper-lantern caps on chrome bases, star-post caps on the
// rubber posts, gold trim along the wooden walls, printed plastics on
// standoffs over the slingshots, and paper lanterns on poles along the
// rails. Everything here is scenery: no colliders, so the physics is the
// same with it or without.
//
// Every geometry, material and texture goes through the scene's track(), so
// the scene's dispose() frees them and the leak tests count them.

import * as THREE from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import type {
  BoxCollider,
  LanternDef,
  MeshCollider,
  PostCollider,
  TableDef,
} from '../types'
import { MATERIALS } from './materials'

type Track = <T extends { dispose(): void }>(resource: T) => T

export const POP_COLORS = [0xf472b6, 0x22d3ee, 0xfb923c]
/** A pop's glow at rest, and how much brighter it flashes when it fires. */
export const POP_REST = 0.2
export const POP_FLASH = 4
/** A lantern's glow at full GI. */
const LANTERN_GLOW = 2.2
/** A wall gets a trim rail when it is at least this tall. */
const TRIM_MIN_HEIGHT = 0.015

const GOLD: THREE.MeshPhysicalMaterialParameters = {
  color: 0xe7b65c,
  metalness: 1,
  roughness: 0.28,
  envMapIntensity: 0.9,
}

/** A lathe profile, (radius, height) pairs, turned into a solid. */
function lathe(
  points: ReadonlyArray<readonly [number, number]>,
  segments: number,
): THREE.LatheGeometry {
  return new THREE.LatheGeometry(
    points.map(([r, y]) => new THREE.Vector2(r, y)),
    segments,
  )
}

/** The pop bumper's parts at radius r, from its foot (y = 0) up to `height`. */
function popProfiles(r: number, height: number) {
  const h = (f: number) => f * height
  return {
    base: [
      [0, 0],
      [r * 1.2, 0],
      [r * 1.22, h(0.06)],
      [r * 1.12, h(0.13)],
      [r * 0.9, h(0.15)],
      [0, h(0.15)],
    ] as const,
    body: [
      [r * 0.82, h(0.14)],
      [r * 0.94, h(0.28)],
      [r * 1.0, h(0.45)],
      [r * 0.98, h(0.6)],
      [r * 0.9, h(0.72)],
      [r * 0.8, h(0.8)],
    ] as const,
    cap: [
      [r * 0.9, h(0.78)],
      [r * 0.92, h(0.84)],
      [r * 0.84, h(0.9)],
      [r * 0.62, h(0.96)],
      [r * 0.3, h(1)],
      [0, h(1.01)],
    ] as const,
    ribs: [h(0.28), h(0.45), h(0.6)].map((y, i) => ({
      y,
      r: r * [0.95, 1.01, 0.99][i]!,
    })),
  }
}

/** A gold star on a dark disc: the decal on top of every pop's cap. */
function starDecal(track: Track): THREE.Texture | null {
  if (typeof document === 'undefined') return null
  const size = 128
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const g = canvas.getContext('2d')
  if (!g) return null
  const c = size / 2
  g.strokeStyle = 'rgba(231,182,92,1)'
  g.lineWidth = 6
  g.beginPath()
  g.arc(c, c, c - 4, 0, Math.PI * 2)
  g.stroke()
  g.fillStyle = 'rgba(250,204,21,1)'
  g.beginPath()
  for (let i = 0; i < 10; i++) {
    const a = (Math.PI * i) / 5 - Math.PI / 2
    const r = i % 2 === 0 ? c * 0.78 : c * 0.32
    const x = c + Math.cos(a) * r
    const y = c + Math.sin(a) * r
    if (i === 0) g.moveTo(x, y)
    else g.lineTo(x, y)
  }
  g.closePath()
  g.fill()
  const texture = track(new THREE.CanvasTexture(canvas))
  texture.colorSpace = THREE.SRGBColorSpace
  return texture
}

/**
 * The printed sling plastic: deep indigo, a lantern string and leaves in the
 * village colours, edged in gold. Browser only (it needs a canvas).
 */
function slingArt(track: Track, flip: boolean): THREE.Texture | null {
  if (typeof document === 'undefined') return null
  const size = 256
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const g = canvas.getContext('2d')
  if (!g) return null
  if (flip) {
    g.translate(size, 0)
    g.scale(-1, 1)
  }
  const bg = g.createLinearGradient(0, 0, size, size)
  bg.addColorStop(0, '#1e1b4b')
  bg.addColorStop(1, '#4c1d95')
  g.fillStyle = bg
  g.fillRect(0, 0, size, size)
  g.fillStyle = 'rgba(45,212,191,0.75)'
  for (let i = 0; i < 7; i++) {
    const x = 30 + i * 30
    const y = 200 - i * 14
    g.beginPath()
    g.ellipse(x, y, 22, 8, -0.6 + i * 0.15, 0, Math.PI * 2)
    g.fill()
  }
  g.strokeStyle = 'rgba(250,204,21,0.9)'
  g.lineWidth = 3
  g.beginPath()
  g.moveTo(10, 60)
  g.quadraticCurveTo(128, 120, 246, 40)
  g.stroke()
  const colors = ['#f472b6', '#fb923c', '#facc15', '#22d3ee', '#f472b6']
  colors.forEach((color, i) => {
    const t = (i + 1) / 6
    const x = 10 + t * 236
    const y = 60 + (1 - Math.pow(2 * t - 1, 2)) * 34 - t * 20
    const glow = g.createRadialGradient(x, y + 14, 2, x, y + 14, 22)
    glow.addColorStop(0, 'rgba(255,240,200,0.9)')
    glow.addColorStop(1, 'rgba(255,240,200,0)')
    g.fillStyle = glow
    g.fillRect(x - 24, y - 10, 48, 48)
    g.fillStyle = color
    g.beginPath()
    g.ellipse(x, y + 14, 9, 12, 0, 0, Math.PI * 2)
    g.fill()
    g.fillStyle = '#facc15'
    g.fillRect(x - 6, y, 12, 3)
    g.fillRect(x - 6, y + 25, 12, 3)
  })
  g.strokeStyle = '#e7b65c'
  g.lineWidth = 10
  g.strokeRect(5, 5, size - 10, size - 10)
  const texture = track(new THREE.CanvasTexture(canvas))
  texture.colorSpace = THREE.SRGBColorSpace
  return texture
}

/**
 * The wooden walls' paint, bottom to top: deep plum lacquer rising to
 * violet, a gold pinstripe, and a teal band along the top edge. It runs in
 * bands, so a wall of any length shows it the same.
 */
export function wallPaint(track: Track): THREE.Texture | null {
  if (typeof document === 'undefined') return null
  const canvas = document.createElement('canvas')
  canvas.width = 4
  canvas.height = 128
  const g = canvas.getContext('2d')
  if (!g) return null
  const lacquer = g.createLinearGradient(0, 128, 0, 0)
  lacquer.addColorStop(0, '#140b26')
  lacquer.addColorStop(0.75, '#3b1d6e')
  g.fillStyle = lacquer
  g.fillRect(0, 0, 4, 128)
  g.fillStyle = '#e7b65c'
  g.fillRect(0, 22, 4, 5)
  g.fillStyle = '#0f766e'
  g.fillRect(0, 0, 4, 16)
  g.fillStyle = 'rgba(231,182,92,0.6)'
  g.fillRect(0, 100, 4, 2)
  const texture = track(new THREE.CanvasTexture(canvas))
  texture.colorSpace = THREE.SRGBColorSpace
  return texture
}

type Lantern = { material: THREE.MeshStandardMaterial }

export class Dressing {
  readonly group = new THREE.Group()
  /** Each pop's lit body and cap, by pop id: they flash when it fires. */
  readonly pops = new Map<string, THREE.MeshPhysicalMaterial>()
  private lanterns: Lantern[] = []
  private gi = 1
  private frame = 0

  constructor(
    private table: TableDef,
    private track: Track,
  ) {
    this.buildPops()
    this.buildPostCaps()
    this.buildTrim()
    this.buildSlingPlastics()
    this.buildLanterns()
  }

  /** How many lanterns stand on the rails (for tests). */
  get lanternCount(): number {
    return this.lanterns.length
  }

  /** The lanterns' mean glow now (for tests). */
  get lanternGlow(): number {
    if (!this.lanterns.length) return 0
    const sum = this.lanterns.reduce(
      (a, l) => a + l.material.emissiveIntensity,
      0,
    )
    return sum / this.lanterns.length
  }

  /** The lanterns follow the GI: they dim with it, as on a real machine. */
  setGi(gi: number) {
    this.gi = gi
  }

  /** One frame: the lanterns' candle flicker. */
  animate() {
    this.frame++
    this.lanterns.forEach((lantern, i) => {
      const flicker =
        0.9 +
        0.06 * Math.sin(this.frame * 0.21 + i * 1.7) +
        0.04 * Math.sin(this.frame * 0.53 + i * 0.9)
      lantern.material.emissiveIntensity = LANTERN_GLOW * flicker * this.gi
    })
  }

  private physical(params: THREE.MeshPhysicalMaterialParameters) {
    return this.track(new THREE.MeshPhysicalMaterial(params))
  }

  private buildPops() {
    const chrome = this.physical(MATERIALS.chrome)
    const gold = this.physical(GOLD)
    const decal = starDecal(this.track)
    const pops = this.table.colliders.filter(
      (c): c is PostCollider => c.kind === 'post' && !!c.kick,
    )
    pops.forEach((def, i) => {
      const color = POP_COLORS[i % POP_COLORS.length]!
      const height = def.halfHeight * 2
      const r = def.radius
      const p = popProfiles(r, height)
      const group = new THREE.Group()
      group.position.set(def.at[0], def.at[1] - def.halfHeight, def.at[2])
      const lit = this.physical({
        color: new THREE.Color(color).multiplyScalar(0.45),
        emissive: color,
        emissiveIntensity: POP_REST,
        roughness: 0.35,
        clearcoat: 0.6,
        clearcoatRoughness: 0.2,
        envMapIntensity: 0.3,
      })
      const base = new THREE.Mesh(this.track(lathe(p.base, 32)), chrome)
      const body = new THREE.Mesh(this.track(lathe(p.body, 32)), lit)
      const cap = new THREE.Mesh(this.track(lathe(p.cap, 32)), lit)
      base.castShadow = body.castShadow = cap.castShadow = true
      group.add(base, body, cap)
      for (const rib of p.ribs) {
        const ring = new THREE.Mesh(
          this.track(new THREE.TorusGeometry(rib.r, r * 0.035, 6, 32)),
          gold,
        )
        ring.rotation.x = Math.PI / 2
        ring.position.y = rib.y
        group.add(ring)
      }
      const rim = new THREE.Mesh(
        this.track(new THREE.TorusGeometry(r * 0.9, r * 0.05, 6, 32)),
        gold,
      )
      rim.rotation.x = Math.PI / 2
      rim.position.y = height * 0.8
      group.add(rim)
      if (decal) {
        const star = new THREE.Mesh(
          this.track(new THREE.CircleGeometry(r * 0.5, 32)),
          this.track(
            new THREE.MeshStandardMaterial({
              map: decal,
              roughness: 0.3,
              emissive: 0xffe2a8,
              emissiveMap: decal,
              emissiveIntensity: 0.4,
              transparent: true,
              alphaTest: 0.1,
              polygonOffset: true,
              polygonOffsetFactor: -1,
            }),
          ),
        )
        star.rotation.x = -Math.PI / 2
        star.position.y = height * 1.012
        group.add(star)
      }
      const knob = new THREE.Mesh(
        this.track(new THREE.SphereGeometry(r * 0.1, 12, 8)),
        gold,
      )
      knob.position.y = height * 1.03
      group.add(knob)
      this.group.add(group)
      this.pops.set(def.id, lit)
    })
  }

  /** A chrome star-post nut and a domed screw on top of each rubber post. */
  private buildPostCaps() {
    const posts = this.table.colliders.filter(
      (c): c is PostCollider =>
        c.kind === 'post' && !c.kick && c.radius < 0.012,
    )
    if (!posts.length) return
    const parts: THREE.BufferGeometry[] = []
    for (const def of posts) {
      const top = def.at[1] + def.halfHeight
      const nut = new THREE.CylinderGeometry(
        def.radius * 1.15,
        def.radius * 1.25,
        0.003,
        6,
      )
      nut.translate(def.at[0], top + 0.0015, def.at[2])
      const screw = new THREE.SphereGeometry(
        def.radius * 0.7,
        12,
        6,
        0,
        Math.PI * 2,
        0,
        Math.PI / 2,
      )
      screw.translate(def.at[0], top + 0.003, def.at[2])
      parts.push(nut, screw)
    }
    this.addMerged(parts, this.physical(MATERIALS.chrome))
  }

  /** A gold rail along the top of every wooden wall. */
  private buildTrim() {
    const walls = [...this.table.colliders, ...(this.table.trim ?? [])].filter(
      (c): c is BoxCollider =>
        c.kind === 'box' &&
        c.material === 'wood' &&
        !c.hidden &&
        c.half[1] * 2 >= TRIM_MIN_HEIGHT,
    )
    if (!walls.length) return
    const parts: THREE.BufferGeometry[] = []
    for (const def of walls) {
      const rail = new THREE.BoxGeometry(
        def.half[0] * 2,
        0.0016,
        def.half[2] * 2 + 0.0012,
      )
      const quat = def.quat
        ? new THREE.Quaternion(...def.quat)
        : new THREE.Quaternion().setFromAxisAngle(
            new THREE.Vector3(0, 1, 0),
            def.yaw ?? 0,
          )
      rail.applyMatrix4(
        new THREE.Matrix4().compose(
          new THREE.Vector3(def.at[0], def.at[1] + def.half[1], def.at[2]),
          quat,
          new THREE.Vector3(1, 1, 1),
        ),
      )
      parts.push(rail)
    }
    this.addMerged(parts, this.physical(GOLD))
  }

  /**
   * A printed plastic over each slingshot, a little larger than the sling and
   * just above its clear roof, on three chrome standoffs.
   */
  private buildSlingPlastics() {
    const caps = this.table.colliders.filter(
      (c): c is MeshCollider =>
        c.kind === 'mesh' && /^sling-.+-cap$/.test(c.id) && !c.hidden,
    )
    const chrome = this.physical(MATERIALS.chrome)
    for (const def of caps) {
      const corners: Array<[number, number]> = []
      let peak = 0
      for (let i = 0; i < def.vertices.length; i += 3) {
        peak = Math.max(peak, def.vertices[i + 1]!)
        if (i < 9) corners.push([def.vertices[i]!, def.vertices[i + 2]!])
      }
      const cx = corners.reduce((a, c) => a + c[0], 0) / corners.length
      const cz = corners.reduce((a, c) => a + c[1], 0) / corners.length
      const grown = corners.map(([x, z]): [number, number] => {
        const dx = x - cx
        const dz = z - cz
        const len = Math.hypot(dx, dz) || 1
        return [x + (dx / len) * 0.008, z + (dz / len) * 0.008]
      })
      const shape = new THREE.Shape()
      grown.forEach(([x, z], i) => {
        if (i === 0) shape.moveTo(x, -z)
        else shape.lineTo(x, -z)
      })
      shape.closePath()
      const geo = this.track(
        new THREE.ExtrudeGeometry(shape, { depth: 0.002, bevelEnabled: false }),
      )
      geo.rotateX(-Math.PI / 2)
      geo.translate(0, peak + 0.001, 0)
      const xs = grown.map((c) => c[0])
      const zs = grown.map((c) => c[1])
      const x0 = Math.min(...xs)
      const x1 = Math.max(...xs)
      const z0 = Math.min(...zs)
      const z1 = Math.max(...zs)
      const position = geo.getAttribute('position')
      const uv = new Float32Array(position.count * 2)
      for (let i = 0; i < position.count; i++) {
        uv[i * 2] = (position.getX(i) - x0) / (x1 - x0)
        uv[i * 2 + 1] = 1 - (position.getZ(i) - z0) / (z1 - z0)
      }
      geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2))
      const art = slingArt(this.track, cx > 0)
      const plastic = new THREE.Mesh(
        geo,
        this.physical({
          ...MATERIALS['plastic-printed'],
          color: art ? 0xffffff : 0x312e81,
          map: art,
          transparent: true,
          opacity: 0.96,
        }),
      )
      plastic.castShadow = true
      this.group.add(plastic)
      const standoffs = grown.map(([x, z]) => {
        const post = new THREE.CylinderGeometry(0.0022, 0.0022, peak + 0.004, 8)
        post.translate(x, (peak + 0.004) / 2, z)
        return post
      })
      this.addMerged(standoffs, chrome)
    }
  }

  /** Paper lanterns on black iron poles, on the rails and the Ridge. */
  private buildLanterns() {
    const defs: readonly LanternDef[] = this.table.lanterns ?? []
    if (!defs.length) return
    const iron = this.track(
      new THREE.MeshStandardMaterial({
        color: 0x16121f,
        metalness: 0.6,
        roughness: 0.5,
      }),
    )
    const gold = this.physical(GOLD)
    const poles: THREE.BufferGeometry[] = []
    const trims: THREE.BufferGeometry[] = []
    const shade = [
      [0.0015, 0],
      [0.0055, 0.0015],
      [0.0072, 0.0055],
      [0.0074, 0.008],
      [0.0068, 0.0115],
      [0.0048, 0.0145],
      [0.0015, 0.016],
    ] as const
    for (const def of defs) {
      const height = def.height ?? 0.05
      const [x, y, z] = def.at
      const pole = new THREE.CylinderGeometry(0.0012, 0.0016, height, 8)
      pole.translate(x, y + height / 2, z)
      const arm = new THREE.CylinderGeometry(0.0009, 0.0009, 0.012, 6)
      arm.rotateZ(Math.PI / 2)
      arm.translate(x + 0.006 * (def.side ?? 1), y + height, z)
      poles.push(pole, arm)
      const hangX = x + 0.011 * (def.side ?? 1)
      const top = y + height - 0.003
      const bottom = top - 0.016
      const capTop = new THREE.CylinderGeometry(0.0022, 0.0042, 0.002, 12)
      capTop.translate(hangX, top + 0.001, z)
      const capBottom = new THREE.CylinderGeometry(0.0042, 0.0022, 0.002, 12)
      capBottom.translate(hangX, bottom - 0.001, z)
      trims.push(capTop, capBottom)
      const color = def.color ?? 0xff6b3d
      const material = this.track(
        new THREE.MeshStandardMaterial({
          color,
          emissive: color,
          emissiveIntensity: LANTERN_GLOW,
          roughness: 0.7,
          side: THREE.DoubleSide,
        }),
      )
      const body = new THREE.Mesh(this.track(lathe(shade, 14)), material)
      body.position.set(hangX, bottom, z)
      this.group.add(body)
      this.lanterns.push({ material })
    }
    this.addMerged(poles, iron)
    this.addMerged(trims, gold)
  }

  private addMerged(parts: THREE.BufferGeometry[], material: THREE.Material) {
    const merged = mergeGeometries(parts, false)
    for (const p of parts) p.dispose()
    if (!merged) return
    const mesh = new THREE.Mesh(this.track(merged), material)
    mesh.castShadow = true
    mesh.receiveShadow = true
    this.group.add(mesh)
  }
}
