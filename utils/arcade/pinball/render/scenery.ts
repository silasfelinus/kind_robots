// /utils/arcade/pinball/render/scenery.ts
//
// The village's sculpted scenery (conductor kind-pinball/t-034): blossom
// trees, cottages with lit windows, fences, barrels, crates and flower
// bushes, placed only where no ball can go (reach.ts, and the tests prove
// it), so the table is as crowded as the mockups and plays the same.
//
// Every prop is built from a few simple solids, coloured per vertex, and
// merged: one mesh for the solids and one for the lit windows per quality
// tier, so a crowded village is a handful of draw calls. The low tier keeps
// the cottages and the larger trees; medium adds trees and fences; high adds
// the barrels, crates and bushes.
//
// Every geometry and material goes through the scene's track(), so the
// scene's dispose() frees them and the leak tests count them.

import * as THREE from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import type { SceneryDef, SceneryKind, TableDef } from '../types'
import type { QualityTier } from './quality'

type Track = <T extends { dispose(): void }>(resource: T) => T

/** The order tiers come in: a prop shows at its tier and every one above. */
const TIER_RANK: Record<QualityTier, number> = { low: 0, medium: 1, high: 2 }

/** A window's glow at full GI. */
const WINDOW_GLOW = 1.6

/**
 * What each kind of prop stands on and reaches over, metres before scale:
 * the radius of its footprint, and its crown (the widest part above it),
 * how high the crown starts, and how tall the prop stands.
 */
export const SCENERY_SIZE: Record<
  SceneryKind,
  { foot: number; crown: number; crownFrom: number; height: number }
> = {
  tree: { foot: 0.004, crown: 0.017, crownFrom: 0.016, height: 0.05 },
  cottage: { foot: 0.016, crown: 0.017, crownFrom: 0, height: 0.034 },
  fence: { foot: 0.003, crown: 0.003, crownFrom: 0, height: 0.009 },
  barrel: { foot: 0.0045, crown: 0.0045, crownFrom: 0, height: 0.009 },
  crate: { foot: 0.006, crown: 0.006, crownFrom: 0, height: 0.008 },
  bush: { foot: 0.008, crown: 0.008, crownFrom: 0, height: 0.009 },
}

/** Where a fence's posts stand: from its `at` along its yaw, `length` long. */
export function fenceEnds(def: SceneryDef): Array<[number, number]> {
  const half = (def.length ?? 0.04) / 2
  const c = Math.cos(def.yaw ?? 0)
  const s = Math.sin(def.yaw ?? 0)
  return [
    [def.at[0] - c * half, def.at[2] + s * half],
    [def.at[0] + c * half, def.at[2] - s * half],
  ]
}

const BARK = 0x6b4226
const BLOSSOM = [0xf9a8d4, 0xfbcfe8, 0xf472b6, 0xfce7f3]
const LEAF = 0x4d7c0f
const PLASTER = 0xf1e4c8
const TIMBER = 0x5b3a1f
const ROOFS = [0xb45309, 0x0f766e, 0x9d174d]
const STONE = 0x78716c
const WOOD = 0x9a6a3a
const HOOP = 0x44403c
const FLOWERS = [0xfde047, 0xf472b6, 0xe0f2fe]

/** Paint every vertex of a geometry one colour, and make it non-indexed. */
function painted(
  geo: THREE.BufferGeometry,
  color: number,
): THREE.BufferGeometry {
  const flat = geo.index ? geo.toNonIndexed() : geo
  if (flat !== geo) geo.dispose()
  const c = new THREE.Color(color)
  const count = flat.getAttribute('position').count
  const colors = new Float32Array(count * 3)
  for (let i = 0; i < count; i++) colors.set([c.r, c.g, c.b], i * 3)
  flat.setAttribute('color', new THREE.BufferAttribute(colors, 3))
  if (!flat.getAttribute('uv')) {
    flat.setAttribute(
      'uv',
      new THREE.BufferAttribute(new Float32Array(count * 2), 2),
    )
  }
  return flat
}

/** A seeded unit random, so a table always grows the same trees. */
function seeded(seed: number) {
  let s = seed >>> 0 || 1
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0
    return s / 2 ** 32
  }
}

/** The solids of one prop, in its own frame (y up, front toward +z). */
function propParts(
  def: SceneryDef,
  index: number,
): { solid: THREE.BufferGeometry[]; lit: THREE.BufferGeometry[] } {
  const solid: THREE.BufferGeometry[] = []
  const lit: THREE.BufferGeometry[] = []
  const rand = seeded(index * 7919 + 17)
  const at = (g: THREE.BufferGeometry, x: number, y: number, z: number) => {
    g.translate(x, y, z)
    return g
  }
  switch (def.kind) {
    case 'tree': {
      const trunk = new THREE.CylinderGeometry(0.0016, 0.0028, 0.022, 7)
      solid.push(painted(at(trunk, 0, 0.011, 0), BARK))
      // Two boughs off the trunk, under the blossom.
      for (const side of [-1, 1]) {
        const bough = new THREE.CylinderGeometry(0.0008, 0.0012, 0.012, 5)
        bough.rotateZ(side * 0.8)
        solid.push(painted(at(bough, side * 0.004, 0.022, 0), BARK))
      }
      // The blossom: overlapping clouds of pink, a little uneven.
      const tint = BLOSSOM[index % BLOSSOM.length]!
      const puffs = 6
      for (let i = 0; i < puffs; i++) {
        const a = (i / puffs) * Math.PI * 2 + rand() * 0.6
        const r = 0.0075 + rand() * 0.0025
        const puff = new THREE.IcosahedronGeometry(0.0085 + rand() * 0.003, 1)
        const color =
          i % 3 === 0 ? BLOSSOM[(index + 1) % BLOSSOM.length]! : tint
        solid.push(
          painted(
            at(puff, Math.cos(a) * r, 0.03 + rand() * 0.006, Math.sin(a) * r),
            color,
          ),
        )
      }
      const top = new THREE.IcosahedronGeometry(0.01, 1)
      solid.push(painted(at(top, 0, 0.039, 0), tint))
      break
    }
    case 'cottage': {
      const w = 0.026
      const d = 0.02
      const h = 0.016
      const base = new THREE.BoxGeometry(w + 0.002, 0.003, d + 0.002)
      solid.push(painted(at(base, 0, 0.0015, 0), STONE))
      const walls = new THREE.BoxGeometry(w, h, d)
      solid.push(painted(at(walls, 0, 0.003 + h / 2, 0), PLASTER))
      // Timber framing: corner posts and a beam at the eaves.
      for (const x of [-w / 2, w / 2])
        for (const z of [-d / 2, d / 2]) {
          const post = new THREE.BoxGeometry(0.0016, h, 0.0016)
          solid.push(painted(at(post, x, 0.003 + h / 2, z), TIMBER))
        }
      const beam = new THREE.BoxGeometry(w + 0.001, 0.0016, 0.0016)
      solid.push(painted(at(beam, 0, 0.003 + h * 0.62, d / 2 + 0.0002), TIMBER))
      // A gabled roof with an overhang: a prism along x.
      const roof = new THREE.Shape()
      roof.moveTo(-d / 2 - 0.003, 0)
      roof.lineTo(d / 2 + 0.003, 0)
      roof.lineTo(0, 0.013)
      roof.closePath()
      const prism = new THREE.ExtrudeGeometry(roof, {
        depth: w + 0.005,
        bevelEnabled: false,
      })
      prism.translate(0, 0, -(w + 0.005) / 2)
      prism.rotateY(Math.PI / 2)
      solid.push(
        painted(at(prism, 0, 0.003 + h, 0), ROOFS[index % ROOFS.length]!),
      )
      const chimney = new THREE.BoxGeometry(0.0035, 0.009, 0.0035)
      solid.push(
        painted(at(chimney, w * 0.28, 0.003 + h + 0.008, -d * 0.18), STONE),
      )
      const door = new THREE.BoxGeometry(0.0045, 0.008, 0.0006)
      solid.push(
        painted(at(door, -w * 0.18, 0.003 + 0.004, d / 2 + 0.0003), TIMBER),
      )
      // Warm windows front and back, and one in each gable end.
      for (const [x, z, turn] of [
        [w * 0.2, d / 2 + 0.0003, 0],
        [-w * 0.2, -d / 2 - 0.0003, 0],
        [w * 0.2, -d / 2 - 0.0003, 0],
        [w / 2 + 0.0003, 0, Math.PI / 2],
        [-w / 2 - 0.0003, 0, Math.PI / 2],
      ] as const) {
        const pane = new THREE.BoxGeometry(0.0045, 0.0045, 0.0006)
        pane.rotateY(turn)
        lit.push(painted(at(pane, x, 0.003 + h * 0.5, z), 0xffffff))
      }
      break
    }
    case 'fence': {
      const length = def.length ?? 0.04
      const posts = Math.max(2, Math.round(length / 0.01) + 1)
      for (let i = 0; i < posts; i++) {
        const x = -length / 2 + (length * i) / (posts - 1)
        const post = new THREE.BoxGeometry(0.0018, 0.009, 0.0018)
        solid.push(painted(at(post, x, 0.0045, 0), WOOD))
      }
      for (const y of [0.0035, 0.007]) {
        const rail = new THREE.BoxGeometry(length, 0.0011, 0.0009)
        solid.push(painted(at(rail, 0, y, 0), WOOD))
      }
      break
    }
    case 'barrel': {
      const body = new THREE.CylinderGeometry(0.0038, 0.0038, 0.008, 10)
      solid.push(painted(at(body, 0, 0.004, 0), WOOD))
      for (const y of [0.0018, 0.0062]) {
        const hoop = new THREE.CylinderGeometry(0.0041, 0.0041, 0.0008, 10)
        solid.push(painted(at(hoop, 0, y, 0), HOOP))
      }
      break
    }
    case 'crate': {
      const box = new THREE.BoxGeometry(0.008, 0.008, 0.008)
      solid.push(painted(at(box, 0, 0.004, 0), WOOD))
      for (const z of [-0.0041, 0.0041]) {
        const slat = new THREE.BoxGeometry(0.0085, 0.0012, 0.0006)
        slat.rotateZ(0.78)
        solid.push(painted(at(slat, 0, 0.004, z), TIMBER))
      }
      break
    }
    case 'bush': {
      for (let i = 0; i < 4; i++) {
        const a = (i / 4) * Math.PI * 2 + rand()
        const puff = new THREE.IcosahedronGeometry(0.0045 + rand() * 0.0015, 1)
        solid.push(
          painted(
            at(puff, Math.cos(a) * 0.003, 0.0035, Math.sin(a) * 0.003),
            LEAF,
          ),
        )
      }
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2 + rand()
        const bloom = new THREE.IcosahedronGeometry(0.0013, 0)
        solid.push(
          painted(
            at(
              bloom,
              Math.cos(a) * 0.0055,
              0.005 + rand() * 0.003,
              Math.sin(a) * 0.0055,
            ),
            FLOWERS[i % FLOWERS.length]!,
          ),
        )
      }
      break
    }
  }
  return { solid, lit }
}

export class Scenery {
  readonly group = new THREE.Group()
  private tiers = new Map<QualityTier, THREE.Group>()
  private windows: THREE.MeshStandardMaterial | null = null
  private counts: Record<QualityTier, number> = { low: 0, medium: 0, high: 0 }
  private tier: QualityTier = 'high'
  private castersList: THREE.Mesh[] = []

  constructor(
    private table: TableDef,
    private track: Track,
  ) {
    this.build()
  }

  /** Props shown at each tier (for tests). */
  propsAt(tier: QualityTier): number {
    return this.counts[tier]
  }

  /** Props showing now (for tests). */
  get showing(): number {
    return this.counts[this.tier]
  }

  /** The merged meshes, for the scene's static shadow casters. */
  get casters(): readonly THREE.Mesh[] {
    return this.castersList
  }

  /** The window glow now (for tests). */
  get windowGlow(): number {
    return this.windows?.emissiveIntensity ?? 0
  }

  /** Show the props for this quality tier. */
  setTier(tier: QualityTier) {
    this.tier = tier
    for (const [t, group] of this.tiers)
      group.visible = TIER_RANK[t] <= TIER_RANK[tier]
  }

  /** The cottages' windows follow the GI. */
  setGi(gi: number) {
    if (this.windows) this.windows.emissiveIntensity = WINDOW_GLOW * gi
  }

  private build() {
    const defs = this.table.scenery ?? []
    if (!defs.length) return
    const solidMat = this.track(
      new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.82 }),
    )
    this.windows = this.track(
      new THREE.MeshStandardMaterial({
        color: 0x2a1a0a,
        emissive: 0xffb347,
        emissiveIntensity: WINDOW_GLOW,
      }),
    )
    const byTier = new Map<
      QualityTier,
      { solid: THREE.BufferGeometry[]; lit: THREE.BufferGeometry[] }
    >()
    defs.forEach((def, i) => {
      const tier = def.tier ?? 'low'
      for (const t of ['low', 'medium', 'high'] as const)
        if (TIER_RANK[tier] <= TIER_RANK[t]) this.counts[t]++
      const parts = propParts(def, i)
      const matrix = new THREE.Matrix4().compose(
        new THREE.Vector3(...def.at),
        new THREE.Quaternion().setFromAxisAngle(
          new THREE.Vector3(0, 1, 0),
          def.yaw ?? 0,
        ),
        new THREE.Vector3().setScalar(def.scale ?? 1),
      )
      const bucket = byTier.get(tier) ?? { solid: [], lit: [] }
      for (const g of parts.solid) bucket.solid.push(g.applyMatrix4(matrix))
      for (const g of parts.lit) bucket.lit.push(g.applyMatrix4(matrix))
      byTier.set(tier, bucket)
    })
    for (const [tier, bucket] of byTier) {
      const group = new THREE.Group()
      group.name = `scenery-${tier}`
      this.add(group, bucket.solid, solidMat, true)
      this.add(group, bucket.lit, this.windows, false)
      this.tiers.set(tier, group)
      this.group.add(group)
    }
    this.setTier(this.tier)
  }

  private add(
    group: THREE.Group,
    parts: THREE.BufferGeometry[],
    material: THREE.Material,
    casts: boolean,
  ) {
    if (!parts.length) return
    const merged = mergeGeometries(parts, false)
    for (const p of parts) p.dispose()
    if (!merged) return
    const mesh = new THREE.Mesh(this.track(merged), material)
    mesh.castShadow = casts
    mesh.receiveShadow = true
    if (casts) this.castersList.push(mesh)
    group.add(mesh)
  }
}
