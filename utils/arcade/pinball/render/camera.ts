// /utils/arcade/pinball/render/camera.ts
//
// Camera framing for the pinball renderer (conductor kind-pinball/t-019).
// A preset gives a viewing direction, a field of view and the box it must
// show; the camera is then pulled back just far enough, and slid sideways,
// to fit that box on screen at any aspect. A tall phone screen gets a closer,
// more top-down view than a wide desktop one (the preset's `portrait` eye),
// so the playfield fills the width instead of floating in black.
//
// Pure maths in table space, so tests can check framing without WebGL.

import * as THREE from 'three'
import type { CameraPreset } from '../types'

/** At this aspect and narrower the camera uses the preset's portrait eye. */
const PORTRAIT_ASPECT = 0.56
/** At this aspect and wider it uses the landscape eye. */
const LANDSCAPE_ASPECT = 1
/** Fraction of the screen each edge keeps clear of the framed box. */
const MARGIN = 0.03

export type Framing = {
  eye: THREE.Vector3
  target: THREE.Vector3
  fov: number
}

/** How far toward the portrait eye a screen of this aspect sits (0..1). */
export function portraitBlend(aspect: number): number {
  const t = (LANDSCAPE_ASPECT - aspect) / (LANDSCAPE_ASPECT - PORTRAIT_ASPECT)
  return Math.min(1, Math.max(0, t))
}

function corners(preset: CameraPreset): THREE.Vector3[] {
  const [x0, y0, z0] = preset.frame.min
  const [x1, y1, z1] = preset.frame.max
  const out: THREE.Vector3[] = []
  for (const x of [x0, x1])
    for (const y of [y0, y1])
      for (const z of [z0, z1]) out.push(new THREE.Vector3(x, y, z))
  for (const p of preset.include ?? []) out.push(new THREE.Vector3(...p))
  return out
}

/**
 * Where to put the camera so the preset's frame box fills the screen.
 *
 * `up` is the screen's up direction in table space (world up, seen from the
 * pitched table). The eye keeps the preset's direction from the target; only
 * its distance and a sideways/vertical slide are solved for, by bisection on
 * the distance: at each distance, a slide that fits every corner exists when
 * the corners' allowed ranges overlap on both screen axes.
 */
export function fitCamera(
  preset: CameraPreset,
  aspect: number,
  up: THREE.Vector3,
): Framing {
  const target = new THREE.Vector3(...preset.target)
  const landscape = new THREE.Vector3(...preset.position).sub(target)
  const portrait = new THREE.Vector3(
    ...(preset.portrait ?? preset.position),
  ).sub(target)
  const t = portraitBlend(aspect)
  const back = landscape.normalize().lerp(portrait.normalize(), t).normalize()
  const fov =
    preset.fovDeg +
    ((preset.portraitFovDeg ?? preset.fovDeg) - preset.fovDeg) * t
  const forward = back.clone().negate()
  const right = new THREE.Vector3().crossVectors(forward, up).normalize()
  const screenUp = new THREE.Vector3().crossVectors(right, forward).normalize()
  const tanV = Math.tan((fov * Math.PI) / 360) * (1 - 2 * MARGIN)
  const tanH = tanV * aspect
  const points = corners(preset).map((p) => {
    const r = p.clone().sub(target)
    return { x: r.dot(right), y: r.dot(screenUp), along: r.dot(back) }
  })

  // The slide on one screen axis that fits every corner at distance d, or
  // null when none does.
  const slide = (d: number, axis: 'x' | 'y', tan: number) => {
    let lo = -Infinity
    let hi = Infinity
    for (const p of points) {
      const depth = d - p.along
      if (depth <= 0) return null
      lo = Math.max(lo, p[axis] - tan * depth)
      hi = Math.min(hi, p[axis] + tan * depth)
    }
    return lo <= hi ? (lo + hi) / 2 : null
  }

  // Spare height goes above the box, not below: the table sits on the
  // bottom of a tall screen and the backbox (and its DMD) takes the top.
  const topSlack = (d: number) => {
    let hi = Infinity
    for (const p of points) hi = Math.min(hi, p.y + tanV * (d - p.along))
    return Number.isFinite(hi) ? hi : null
  }

  let near = 0
  let far = 1
  while (slide(far, 'x', tanH) === null || slide(far, 'y', tanV) === null) {
    far *= 2
    if (far > 1e3) break
  }
  for (let i = 0; i < 40; i++) {
    const mid = (near + far) / 2
    if (slide(mid, 'x', tanH) !== null && slide(mid, 'y', tanV) !== null)
      far = mid
    else near = mid
  }
  const sx = slide(far, 'x', tanH) ?? 0
  const sy = topSlack(far) ?? slide(far, 'y', tanV) ?? 0
  const shift = right.multiplyScalar(sx).add(screenUp.multiplyScalar(sy))
  const look = target.clone().add(shift)
  return { eye: look.clone().addScaledVector(back, far), target: look, fov }
}
