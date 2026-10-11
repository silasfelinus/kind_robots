// /utils/arcade/pinball/render/materials.ts
//
// The pinball renderer's materials (conductor kind-pinball/t-019): a
// physically based catalogue for every MaterialId, the night-cabinet
// environment that chrome and the steel ball reflect, the painted playfield,
// and the soft contact shadow every ball carries.
//
// The playfield art is procedural for now: the AMI Village night palette
// from the blueprint (deep indigo to plum, a village skyline under the arch,
// a map hub around the pops, dark surrounds that make every insert read)
// and a teal-and-gold floor for the hidden room. Generated art (t-009)
// replaces the painter, not the mapping. The art carries no painted
// lighting: light comes from the lamps.

import * as THREE from 'three'
import { mulberry32 } from '../../curve'
import type {
  ArtRegion,
  InsertDef,
  MaterialId,
  PostCollider,
  TableDef,
} from '../types'

export const MATERIALS: Record<
  MaterialId,
  THREE.MeshPhysicalMaterialParameters
> = {
  playfield: {
    color: 0x1b2350,
    roughness: 0.38,
    metalness: 0,
    clearcoat: 1,
    clearcoatRoughness: 0.06,
    // Faint: seen from above (a phone's view) the playfield mirrors the
    // cabinet's strip light, and any stronger that whites out the art.
    envMapIntensity: 0.1,
  },
  chrome: {
    color: 0xe8eef5,
    roughness: 0.2,
    metalness: 1,
    envMapIntensity: 0.75,
  },
  rubber: { color: 0xd8dee8, roughness: 0.92, metalness: 0 },
  'plastic-clear': {
    color: 0xe0f2fe,
    roughness: 0.1,
    transparent: true,
    opacity: 0.14,
    depthWrite: false,
    envMapIntensity: 0.5,
  },
  'plastic-printed': {
    color: 0x2dd4bf,
    roughness: 0.3,
    metalness: 0,
    clearcoat: 0.8,
    clearcoatRoughness: 0.1,
  },
  wood: {
    color: 0x1e1b4b,
    roughness: 0.5,
    metalness: 0,
    clearcoat: 0.4,
    clearcoatRoughness: 0.3,
  },
  post: { color: 0xf8fafc, roughness: 0.35, clearcoat: 0.6 },
  ramp: {
    color: 0x38bdf8,
    roughness: 0.18,
    metalness: 0,
    transparent: true,
    opacity: 0.3,
    depthWrite: false,
    envMapIntensity: 0.45,
  },
  cabinet: {
    color: 0x141022,
    roughness: 0.55,
    metalness: 0.1,
    clearcoat: 0.3,
    clearcoatRoughness: 0.4,
  },
}

/** The steel ball: a mirror the environment and flashers show up in. */
export const BALL_MATERIAL: THREE.MeshStandardMaterialParameters = {
  color: 0xffffff,
  metalness: 1,
  roughness: 0.06,
  envMapIntensity: 1.6,
}

/** Flipper bat plastic, and each side's rubber ring. */
export const FLIPPER_MATERIAL: THREE.MeshPhysicalMaterialParameters = {
  color: 0xfff4dd,
  roughness: 0.3,
  clearcoat: 0.8,
}
export const FLIPPER_RUBBER = { left: 0xec4899, right: 0x22d3ee }

/**
 * A night arcade for the reflections: dark walls, the cabinet's warm strip
 * light overhead, cool and warm neon either side, and the backbox glow at
 * the far end. Chrome and the ball pick these up as highlights.
 */
export function buildEnvironment(renderer: THREE.WebGLRenderer): THREE.Texture {
  const room = new THREE.Scene()
  const shell = new THREE.Mesh(
    new THREE.BoxGeometry(8, 4, 8),
    new THREE.MeshBasicMaterial({ color: 0x0b0a16, side: THREE.BackSide }),
  )
  shell.position.y = 1.5
  room.add(shell)
  const panel = (
    color: number,
    strength: number,
    size: [number, number],
    at: [number, number, number],
    rotation: [number, number, number],
  ) => {
    const material = new THREE.MeshBasicMaterial({
      color: new THREE.Color(color).multiplyScalar(strength),
      side: THREE.DoubleSide,
    })
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(...size), material)
    mesh.position.set(...at)
    mesh.rotation.set(...rotation)
    room.add(mesh)
  }
  panel(0xfff1d6, 3, [0.6, 3], [0, 3.2, 0], [Math.PI / 2, 0, 0])
  panel(0x22d3ee, 2.2, [0.25, 3], [-3.9, 1.6, 0], [0, Math.PI / 2, 0])
  panel(0xf472b6, 2.2, [0.25, 3], [3.9, 1.6, 0], [0, -Math.PI / 2, 0])
  panel(0xf59e0b, 2.5, [2.5, 0.8], [0, 1.2, -3.9], [0, 0, 0])
  panel(0x6366f1, 0.6, [6, 1], [0, 0.4, 3.9], [0, Math.PI, 0])
  const pmrem = new THREE.PMREMGenerator(renderer)
  const texture = pmrem.fromScene(room, 0.03).texture
  room.traverse((node) => {
    const mesh = node as THREE.Mesh
    mesh.geometry?.dispose()
    ;(mesh.material as THREE.Material | undefined)?.dispose()
  })
  pmrem.dispose()
  return texture
}

/** The table-space rectangle the playfield art covers (x and z, metres). */
export type ArtBounds = { x0: number; x1: number; z0: number; z1: number }

export function artBounds(table: TableDef): ArtBounds {
  const xs: number[] = []
  const zs: number[] = []
  for (const def of table.colliders) {
    if (def.kind !== 'box' || def.material !== 'playfield') continue
    xs.push(def.at[0] - def.half[0], def.at[0] + def.half[0])
    zs.push(def.at[2] - def.half[2], def.at[2] + def.half[2])
  }
  return {
    x0: Math.min(...xs),
    x1: Math.max(...xs),
    z0: Math.min(...zs),
    z1: Math.max(...zs),
  }
}

/** Give playfield geometry UVs straight down from above, over the art bounds. */
export function planarUVs(geo: THREE.BufferGeometry, bounds: ArtBounds) {
  const position = geo.getAttribute('position')
  const uv = new Float32Array(position.count * 2)
  for (let i = 0; i < position.count; i++) {
    uv[i * 2] = (position.getX(i) - bounds.x0) / (bounds.x1 - bounds.x0)
    uv[i * 2 + 1] = 1 - (position.getZ(i) - bounds.z0) / (bounds.z1 - bounds.z0)
  }
  geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2))
}

/** The insert outline as a 2D shape (x across, y up the table), metres. */
export function insertShape(def: InsertDef): THREE.Shape {
  const shape = new THREE.Shape()
  const s = def.size
  if (def.shape === 'circle') {
    shape.absarc(0, 0, s / 2, 0, Math.PI * 2, false)
  } else if (def.shape === 'chevron') {
    // A V pointing up the table, its arms a band of even depth.
    const w = s * 1.3
    const k = s * 0.42
    shape.moveTo(0, s / 2)
    shape.lineTo(w / 2, -s / 2 + k)
    shape.lineTo(w / 2, -s / 2)
    shape.lineTo(0, s / 2 - k)
    shape.lineTo(-w / 2, -s / 2)
    shape.lineTo(-w / 2, -s / 2 + k)
  } else if (def.shape === 'rect') {
    const d = def.depth ?? s / 2
    shape.moveTo(-s / 2, -d / 2)
    shape.lineTo(s / 2, -d / 2)
    shape.lineTo(s / 2, d / 2)
    shape.lineTo(-s / 2, d / 2)
  } else {
    // An arrowhead on a short shaft, pointing up the table.
    const w = s * 0.62
    shape.moveTo(0, s / 2)
    shape.lineTo(w / 2, s * 0.08)
    shape.lineTo(w * 0.2, s * 0.08)
    shape.lineTo(w * 0.2, -s / 2)
    shape.lineTo(-w * 0.2, -s / 2)
    shape.lineTo(-w * 0.2, s * 0.08)
    shape.lineTo(-w / 2, s * 0.08)
  }
  shape.closePath()
  return shape
}

/**
 * Canvas pixels per metre of playfield: about the painted art's own
 * resolution, so it is not resampled soft (t-027). A device's texture limit
 * lowers it (artScale).
 */
const ART_PX_PER_M = 1750

/** The generated art's grade (t-032): an overall dimming, and the rails' falloff. */
const PAINT_DIM = '#d6cde2'
const PAINT_EDGE = '#5a4a72'

/** The generated images painted over their regions, as they load. */
export type ArtImages = {
  playfield?: CanvasImageSource & { width: number; height: number }
  ridge?: CanvasImageSource & { width: number; height: number }
}

/** Pixels per metre for these bounds, kept inside a texture of `maxSize`. */
export function artScale(bounds: ArtBounds, maxSize = 4096): number {
  const longest = Math.max(bounds.x1 - bounds.x0, bounds.z1 - bounds.z0)
  return Math.min(ART_PX_PER_M, Math.floor(maxSize / longest))
}

function css(color: number, alpha = 1): string {
  const c = new THREE.Color(color)
  return `rgba(${Math.round(c.r * 255)},${Math.round(c.g * 255)},${Math.round(c.b * 255)},${alpha})`
}

/**
 * Paint the playfield art for a table (browser only: it needs a canvas).
 * Deterministic: the same table always paints the same picture. With the
 * table's generated albedo loaded, that image fills the main playfield and
 * the procedural art stays only where it does not reach (the hidden room).
 */
export function paintPlayfield(
  table: TableDef,
  bounds: ArtBounds,
  images: ArtImages = {},
  maxSize = 4096,
): HTMLCanvasElement | null {
  if (typeof document === 'undefined') return null
  const scale = artScale(bounds, maxSize)
  const width = Math.round((bounds.x1 - bounds.x0) * scale)
  const height = Math.round((bounds.z1 - bounds.z0) * scale)
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const g = canvas.getContext('2d')
  if (!g) return null
  const px = (x: number) => (x - bounds.x0) * scale
  const pz = (z: number) => (z - bounds.z0) * scale
  const m = (metres: number) => metres * scale
  const rng = mulberry32(1903)
  const room = table.zones?.find((z) => z.id === 'sub-table')
  const roomBottom = room ? room.max[1] : bounds.z0

  // Night sky to plum, top of the main playfield to the flippers.
  const top = pz(roomBottom)
  const sky = g.createLinearGradient(0, top, 0, height)
  sky.addColorStop(0, '#0f1736')
  sky.addColorStop(0.5, '#172951')
  sky.addColorStop(0.82, '#2a1748')
  sky.addColorStop(1, '#3a1240')
  g.fillStyle = sky
  g.fillRect(0, top, width, height - top)

  // Stars, thinning toward the flippers so the lower third stays clean.
  for (let i = 0; i < 700; i++) {
    const x = rng() * width
    const y = top + Math.pow(rng(), 1.6) * (height - top) * 0.8
    const r = 0.6 + rng() * 1.6
    const hue = [0xffffff, 0xbae6fd, 0xfde68a][Math.floor(rng() * 3)]!
    g.fillStyle = css(hue, 0.15 + rng() * 0.45)
    g.beginPath()
    g.arc(x, y, r, 0, Math.PI * 2)
    g.fill()
  }

  // The village skyline under the arch: roofs and lit windows.
  const skylineBase = pz(-0.72)
  g.fillStyle = '#0a1029'
  let x = px(-0.24)
  while (x < px(0.26)) {
    const w = m(0.025 + rng() * 0.03)
    const h = m(0.03 + rng() * 0.05)
    const roof = m(0.012 + rng() * 0.015)
    g.beginPath()
    g.moveTo(x, skylineBase)
    g.lineTo(x, skylineBase - h)
    g.lineTo(x + w / 2, skylineBase - h - roof)
    g.lineTo(x + w, skylineBase - h)
    g.lineTo(x + w, skylineBase)
    g.closePath()
    g.fill()
    g.fillStyle = css(0xf59e0b, 0.55)
    for (
      let wy = skylineBase - h + m(0.008);
      wy < skylineBase - m(0.008);
      wy += m(0.014)
    ) {
      if (rng() > 0.45) g.fillRect(x + w * 0.3, wy, m(0.005), m(0.006))
    }
    g.fillStyle = '#0a1029'
    x += w + m(0.004 + rng() * 0.01)
  }
  const ground = g.createLinearGradient(
    0,
    skylineBase,
    0,
    skylineBase + m(0.08),
  )
  ground.addColorStop(0, '#0a1029')
  ground.addColorStop(1, 'rgba(10,16,41,0)')
  g.fillStyle = ground
  g.fillRect(px(-0.26), skylineBase, m(0.52), m(0.08))

  // The map hub: rings and bearings around the pop bumpers.
  const pops = table.colliders.filter(
    (c): c is PostCollider =>
      c.kind === 'post' && !!c.kick && c.id.startsWith('pop-'),
  )
  if (pops.length) {
    const cx = px(pops.reduce((a, c) => a + c.at[0], 0) / pops.length)
    const cz = pz(pops.reduce((a, c) => a + c.at[2], 0) / pops.length)
    g.strokeStyle = css(0x22d3ee, 0.22)
    g.lineWidth = 2
    for (const r of [0.07, 0.1, 0.13]) {
      g.setLineDash([m(0.008), m(0.006)])
      g.beginPath()
      g.arc(cx, cz, m(r), 0, Math.PI * 2)
      g.stroke()
    }
    g.setLineDash([])
    for (let i = 0; i < 16; i++) {
      const a = (Math.PI * 2 * i) / 16
      const r0 = m(i % 4 === 0 ? 0.115 : 0.124)
      g.beginPath()
      g.moveTo(cx + Math.cos(a) * r0, cz + Math.sin(a) * r0)
      g.lineTo(cx + Math.cos(a) * m(0.136), cz + Math.sin(a) * m(0.136))
      g.stroke()
    }
  }

  // Generated art (t-009, t-027), as it loads, replaces the painted Ridge
  // and main playfield; the engine's own marks still go on top, crisp. Each
  // image is cropped to its region's shape, never stretched.
  const cover = (
    image: NonNullable<ArtImages['playfield']>,
    region: ArtRegion,
  ) => {
    const w = m(region.max[0] - region.min[0])
    const h = m(region.max[1] - region.min[1])
    const fit = Math.max(w / image.width, h / image.height)
    const sw = w / fit
    const sh = h / fit
    g.drawImage(
      image,
      (image.width - sw) / 2,
      (image.height - sh) / 2,
      sw,
      sh,
      px(region.min[0]),
      pz(region.min[1]),
      w,
      h,
    )
  }
  // Graded like a lacquered playfield under a dark glass (t-032): a touch
  // dimmer overall and falling away to the rails, so lamps, inserts and
  // lanterns carry the light rather than the paint.
  const grade = (region: ArtRegion) => {
    const x = px(region.min[0])
    const z = pz(region.min[1])
    const w = m(region.max[0] - region.min[0])
    const h = m(region.max[1] - region.min[1])
    g.save()
    g.globalCompositeOperation = 'multiply'
    g.fillStyle = PAINT_DIM
    g.fillRect(x, z, w, h)
    const fall = g.createRadialGradient(
      x + w / 2,
      z + h * 0.55,
      Math.min(w, h) * 0.25,
      x + w / 2,
      z + h * 0.55,
      Math.max(w, h) * 0.62,
    )
    fall.addColorStop(0, '#ffffff')
    fall.addColorStop(0.65, '#cbbfd9')
    fall.addColorStop(1, PAINT_EDGE)
    g.fillStyle = fall
    g.fillRect(x, z, w, h)
    g.restore()
  }
  if (images.ridge && table.art?.ridge) {
    cover(images.ridge, table.art.ridge)
    grade(table.art.ridge)
  }
  if (images.playfield && table.art?.playfield) {
    cover(images.playfield, table.art.playfield)
    grade(table.art.playfield)
  }

  // The rainbow band the multiplier lamps sit on.
  const rainbow = (table.inserts ?? []).filter((i) =>
    i.id.startsWith('rainbow-'),
  )
  if (rainbow.length > 1) {
    g.strokeStyle = 'rgba(255,255,255,0.07)'
    g.lineWidth = m(0.022)
    g.lineCap = 'round'
    g.beginPath()
    rainbow.forEach((lamp, i) => {
      if (i === 0) g.moveTo(px(lamp.at[0]), pz(lamp.at[1]))
      else g.lineTo(px(lamp.at[0]), pz(lamp.at[1]))
    })
    g.stroke()
  }

  // The hidden room's floor: deep teal with a gold lattice and a compass.
  if (room) {
    const rx0 = px(room.min[0])
    const rz0 = pz(room.min[1])
    const rw = m(room.max[0] - room.min[0])
    const rh = m(room.max[1] - room.min[1])
    const floor = g.createLinearGradient(0, rz0, 0, rz0 + rh)
    floor.addColorStop(0, '#05262b')
    floor.addColorStop(1, '#0b1d3a')
    g.fillStyle = floor
    g.fillRect(0, 0, width, rz0 + rh)
    g.save()
    g.beginPath()
    g.rect(rx0, rz0, rw, rh)
    g.clip()
    g.strokeStyle = css(0xfacc15, 0.16)
    g.lineWidth = 1.5
    const step = m(0.03)
    for (let d = -rh; d < rw + rh; d += step) {
      g.beginPath()
      g.moveTo(rx0 + d, rz0)
      g.lineTo(rx0 + d + rh, rz0 + rh)
      g.moveTo(rx0 + d, rz0 + rh)
      g.lineTo(rx0 + d + rh, rz0)
      g.stroke()
    }
    const ccx = rx0 + rw / 2
    const ccz = rz0 + rh * 0.55
    g.fillStyle = css(0xfacc15, 0.28)
    g.beginPath()
    for (let i = 0; i < 8; i++) {
      const a = (Math.PI * i) / 4 - Math.PI / 2
      const r = i % 2 === 0 ? m(0.07) : m(0.022)
      if (i === 0) g.moveTo(ccx + Math.cos(a) * r, ccz + Math.sin(a) * r)
      else g.lineTo(ccx + Math.cos(a) * r, ccz + Math.sin(a) * r)
    }
    g.closePath()
    g.fill()
    g.restore()
  }

  paintContactShade(g, table, px, pz, m)

  // A dark surround behind every insert, edged in its colour, so lit or
  // unlit it reads against the art.
  for (const insert of table.inserts ?? []) {
    const shape = insertShape(insert)
    const points = shape.getPoints(24)
    const yaw = insert.yaw ?? 0
    g.save()
    g.translate(px(insert.at[0]), pz(insert.at[1]))
    g.rotate(-yaw)
    g.scale(m(1.32), m(1.32))
    g.beginPath()
    points.forEach((p, i) => {
      if (i === 0) g.moveTo(p.x, -p.y)
      else g.lineTo(p.x, -p.y)
    })
    g.closePath()
    g.fillStyle = 'rgba(3,4,12,0.9)'
    g.fill()
    g.lineWidth = 1.5 / m(1.32)
    g.strokeStyle = css(insert.color, 0.55)
    g.stroke()
    g.restore()
  }
  return canvas
}

/** How dark, and how far it spreads, the baked shade under a part is. */
const SHADE_ALPHA = 0.55
const SHADE_SPREAD_M = 0.01

/**
 * Baked ambient occlusion: a soft shade on the playfield where each wall,
 * post and bumper meets it, so the parts sit on the table on every tier,
 * even the one with no shadow map. Drawn with the canvas shadow trick: each
 * footprint is filled far off the canvas and only its blurred shadow lands.
 */
function paintContactShade(
  g: CanvasRenderingContext2D,
  table: TableDef,
  px: (x: number) => number,
  pz: (z: number) => number,
  m: (metres: number) => number,
) {
  const away = g.canvas.width * 4
  g.save()
  g.shadowColor = `rgba(0,0,0,${SHADE_ALPHA})`
  g.shadowBlur = m(SHADE_SPREAD_M)
  g.shadowOffsetX = away
  g.fillStyle = '#000'
  for (const def of table.colliders) {
    if (def.kind === 'mesh') continue
    if (def.kind === 'post') {
      g.beginPath()
      g.arc(
        px(def.at[0]) - away,
        pz(def.at[2]),
        m(def.radius * 1.15),
        0,
        Math.PI * 2,
      )
      g.fill()
      continue
    }
    // Only what stands on the playfield: not the playfield itself, not
    // covers or plates held up above it, not tilted pieces.
    if (def.hidden || def.material === 'playfield' || def.quat) continue
    if (def.at[1] - def.half[1] > 0.005) continue
    const yaw = def.yaw ?? 0
    const cos = Math.cos(yaw)
    const sin = Math.sin(yaw)
    g.beginPath()
    for (const [i, [lx, lz]] of (
      [
        [-1, -1],
        [1, -1],
        [1, 1],
        [-1, 1],
      ] as const
    ).entries()) {
      const x = lx * def.half[0]
      const z = lz * def.half[2]
      const wx = def.at[0] + x * cos + z * sin
      const wz = def.at[2] - x * sin + z * cos
      if (i === 0) g.moveTo(px(wx) - away, pz(wz))
      else g.lineTo(px(wx) - away, pz(wz))
    }
    g.closePath()
    g.fill()
  }
  g.restore()
}

/** A soft round shadow, alpha in every channel (no DOM needed). */
export function contactShadowTexture(): THREE.DataTexture {
  const size = 64
  const data = new Uint8Array(size * size * 4)
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const dx = (x + 0.5) / size - 0.5
      const dy = (y + 0.5) / size - 0.5
      const d = Math.min(1, Math.sqrt(dx * dx + dy * dy) * 2)
      const a = Math.round(255 * Math.pow(1 - d, 2.2))
      data.set([a, a, a, a], (y * size + x) * 4)
    }
  }
  const texture = new THREE.DataTexture(data, size, size)
  texture.needsUpdate = true
  return texture
}
