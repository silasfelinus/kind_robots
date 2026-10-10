// /utils/arcade/pinball/render/wireforms.ts
//
// Ramp metalwork (conductor kind-pinball/t-029): the ramps drawn the way a
// real machine builds them, in place of the solid chrome sheets the physics
// uses for their side rails. Each rail is two chrome wires on uprights, cross
// ties run under the clear floor, and a lit strip edges the floor. The lane
// guides get a rounded chrome bead along their tops so they catch the light.
// Everything here is scenery: the colliders are the table's own, unchanged.
//
// Every geometry, material and texture goes through the scene's track(), so
// the scene's dispose() frees them and the leak tests count them.

import * as THREE from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import type { BoxCollider, MeshCollider, TableDef } from '../types'
import { MATERIALS } from './materials'

type Track = <T extends { dispose(): void }>(resource: T) => T

/**
 * The ramp rails the wireforms replace: both rails of every ramp with a
 * floor. The scene leaves these sheets out and draws the wires instead.
 */
export function wireformRails(table: TableDef): Set<string> {
  const ids = new Set(table.colliders.map((c) => c.id))
  const out = new Set<string>()
  for (const id of ids) {
    if (!id.endsWith('-floor')) continue
    const base = id.slice(0, -'-floor'.length)
    if (ids.has(`${base}-rail-l`) && ids.has(`${base}-rail-r`))
      out.add(`${base}-rail-l`).add(`${base}-rail-r`)
  }
  return out
}
const WIRE_RADIUS = 0.0011
const STRIP_RADIUS = 0.0008
/** Every this many path points an upright; under the floor, a tie. */
const UPRIGHT_EVERY = 4
const TIE_EVERY = 6
/** The light strips' glow at full GI. */
const STRIP_GLOW = 1.8

type Pt = THREE.Vector3

function tube(points: Pt[], radius: number): THREE.BufferGeometry | null {
  if (points.length < 2) return null
  const curve = new THREE.CatmullRomCurve3(points)
  return new THREE.TubeGeometry(curve, points.length * 2, radius, 6, false)
}

function rod(a: Pt, b: Pt, radius: number): THREE.BufferGeometry {
  const length = a.distanceTo(b)
  const geo = new THREE.CylinderGeometry(radius, radius, length, 6)
  const mid = a.clone().add(b).multiplyScalar(0.5)
  const dir = b.clone().sub(a).normalize()
  geo.applyQuaternion(
    new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir),
  )
  geo.translate(mid.x, mid.y, mid.z)
  return geo
}

/** A rail's points along the ramp: (x, z) at the rail, the floor height under it. */
function railPath(rail: MeshCollider, floor: MeshCollider, left: boolean) {
  const out: Array<{ x: number; z: number; floor: number; top: number }> = []
  const n = Math.min(rail.vertices.length / 6, floor.vertices.length / 6)
  for (let i = 0; i < n; i++) {
    const top = rail.vertices[i * 6 + 4]!
    const edge = floor.vertices[i * 6 + (left ? 0 : 3) + 1]!
    out.push({
      x: rail.vertices[i * 6]!,
      z: rail.vertices[i * 6 + 2]!,
      floor: edge,
      top,
    })
  }
  return out
}

export class Wireforms {
  readonly group = new THREE.Group()
  private strips: THREE.MeshStandardMaterial | null = null
  private rampCount = 0

  constructor(
    private table: TableDef,
    private track: Track,
  ) {
    this.buildRamps()
    this.buildBeads()
  }

  /** How many ramps are drawn as wireforms (for tests). */
  get ramps(): number {
    return this.rampCount
  }

  /** The light strips' glow now (for tests). */
  get stripGlow(): number {
    return this.strips?.emissiveIntensity ?? 0
  }

  /** The light strips follow the GI. */
  setGi(gi: number) {
    if (this.strips) this.strips.emissiveIntensity = STRIP_GLOW * gi
  }

  private buildRamps() {
    const meshes = new Map<string, MeshCollider>()
    for (const c of this.table.colliders)
      if (c.kind === 'mesh' && !c.hidden) meshes.set(c.id, c)
    const wires: THREE.BufferGeometry[] = []
    const strips: THREE.BufferGeometry[] = []
    for (const [id, floor] of meshes) {
      if (!id.endsWith('-floor')) continue
      const base = id.slice(0, -'-floor'.length)
      const left = meshes.get(`${base}-rail-l`)
      const right = meshes.get(`${base}-rail-r`)
      if (!left || !right) continue
      this.rampCount++
      const sides = [railPath(left, floor, true), railPath(right, floor, false)]
      for (const path of sides) {
        const top = path.map((p) => new THREE.Vector3(p.x, p.top, p.z))
        const mid = path.map(
          (p) =>
            new THREE.Vector3(p.x, p.floor + (p.top - p.floor) * 0.45, p.z),
        )
        const edge = path.map(
          (p) => new THREE.Vector3(p.x, p.floor + 0.0016, p.z),
        )
        for (const geo of [tube(top, WIRE_RADIUS), tube(mid, WIRE_RADIUS)])
          if (geo) wires.push(geo)
        const strip = tube(edge, STRIP_RADIUS)
        if (strip) strips.push(strip)
        path.forEach((p, i) => {
          if (i % UPRIGHT_EVERY !== 0) return
          wires.push(
            rod(
              new THREE.Vector3(p.x, p.floor, p.z),
              new THREE.Vector3(p.x, p.top, p.z),
              WIRE_RADIUS * 0.8,
            ),
          )
        })
      }
      const [l, r] = sides
      l!.forEach((p, i) => {
        const q = r![i]
        if (!q || i % TIE_EVERY !== 0 || p.floor < 0.01) return
        wires.push(
          rod(
            new THREE.Vector3(p.x, p.floor - 0.002, p.z),
            new THREE.Vector3(q.x, q.floor - 0.002, q.z),
            WIRE_RADIUS * 0.9,
          ),
        )
      })
    }
    this.addMerged(wires, this.track(new THREE.MeshPhysicalMaterial(CHROME)))
    if (strips.length) {
      this.strips = this.track(
        new THREE.MeshStandardMaterial({
          color: 0x0e7490,
          emissive: 0x67e8f9,
          emissiveIntensity: STRIP_GLOW,
          roughness: 0.4,
        }),
      )
      this.addMerged(strips, this.strips)
    }
  }

  /** A rounded chrome bead along the top of every chrome lane guide. */
  private buildBeads() {
    const guides = [...this.table.colliders, ...(this.table.trim ?? [])].filter(
      (c): c is BoxCollider =>
        c.kind === 'box' && c.material === 'chrome' && !c.hidden,
    )
    const beads: THREE.BufferGeometry[] = []
    for (const def of guides) {
      const radius = Math.max(def.half[2], 0.0016)
      const bead = new THREE.CylinderGeometry(
        radius,
        radius,
        def.half[0] * 2,
        8,
      )
      bead.rotateZ(Math.PI / 2)
      const quat = def.quat
        ? new THREE.Quaternion(...def.quat)
        : new THREE.Quaternion().setFromAxisAngle(
            new THREE.Vector3(0, 1, 0),
            def.yaw ?? 0,
          )
      bead.applyMatrix4(
        new THREE.Matrix4().compose(
          new THREE.Vector3(def.at[0], def.at[1] + def.half[1], def.at[2]),
          quat,
          new THREE.Vector3(1, 1, 1),
        ),
      )
      beads.push(bead)
    }
    this.addMerged(beads, this.track(new THREE.MeshPhysicalMaterial(CHROME)))
  }

  private addMerged(parts: THREE.BufferGeometry[], material: THREE.Material) {
    if (!parts.length) return
    const merged = mergeGeometries(parts, false)
    for (const p of parts) p.dispose()
    if (!merged) return
    const mesh = new THREE.Mesh(this.track(merged), material)
    mesh.castShadow = true
    this.group.add(mesh)
  }
}

/** Polished chrome, a touch brighter in the room than sheet chrome. */
const CHROME: THREE.MeshPhysicalMaterialParameters = {
  ...MATERIALS.chrome,
  roughness: 0.14,
  envMapIntensity: 1.3,
}
