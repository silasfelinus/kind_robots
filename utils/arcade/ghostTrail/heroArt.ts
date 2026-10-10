// /utils/arcade/ghostTrail/heroArt.ts
//
// Zuzu: Ghost Trail's hero art (conductor kr-arcade t-013/t-014): Zuzu, the koala ronin, drawn by
// code at the accepted mockups' density. Canon (VIDEO-GUARDRAILS.md, CAST-PICKS.md, the campaign
// blueprint): a short, stocky grey koala with a big dark nose and round fuzzy ears, a stern face that
// never smiles, a broad straw kasa whose brim shades his eyes, a rust-brown poncho with an orange
// zigzag trim, the sheathed katana on his back with the hilt over his shoulder, and dark trousers.
// The first hit tears off the poncho and the kasa: the exposed set shows the dark tunic, the orange
// sash and his bare head.
//
// The figure is ~30 logical px tall (the kasa brim ~24 px wide) with its feet on (x, y). Every pose is
// a small skeleton (hip, feet, hands, poncho sway) drawn as ink-outlined, 3-5 tone shaded shapes lit
// from the upper left, and baked once per frame with drawBaked, so a frame costs one blit.
//
// Pure drawing: no game state, no randomness. Safe headless (drawBaked paints straight onto the stub).

import { drawBaked, densityOf } from './bake'
import { INK, rgba } from '../snes'

/** Everything that picks Zuzu's frame. (x, y) are his feet, in world space. */
export type ZuzuPose = {
  x: number
  y: number
  facing: 1 | -1
  /** Still wearing the poncho and kasa (false after the first hit). */
  poncho: boolean
  action: 'idle' | 'walk' | 'jump' | 'fall' | 'throw' | 'cut'
  /** The game's walk phase (+0.25 a tick while walking); drives the 8-frame walk cycle. */
  walkPhase: number
  tick: number
  /**
   * Optional, for 'throw' and 'cut': how far through the action he is, 0 (just started) to 1 (done).
   * e.g. `1 - throwPose / 8` (throw) or `1 - throwPose / 12` (cut). Default: the key frame.
   */
  progress?: number
  /** Optional, for 'throw' and 'cut': in the air, so the legs stay tucked instead of lunging. */
  airborne?: boolean
}

type Ctx = CanvasRenderingContext2D
type Pt = { x: number; y: number }

const pt = (x: number, y: number): Pt => ({ x, y })
const off = (a: Pt, x: number, y: number): Pt => ({ x: a.x + x, y: a.y + y })
const lerp = (a: Pt, b: Pt, t: number): Pt => ({
  x: a.x + (b.x - a.x) * t,
  y: a.y + (b.y - a.y) * t,
})

// --- palette ------------------------------------------------------------------------------------

const FUR = ['#2f3342', '#545b6e', '#838a9e', '#b2b8c8', '#e2e5ee'] as const
const FLUFF = '#eef0f6'
const NOSE = '#15121c'
const STRAW = ['#4f3814', '#8a6526', '#c39a48', '#e3c47a', '#f6e4ad'] as const
const RUST = ['#34110a', '#62230f', '#8e3416', '#b44d1d', '#d9733a'] as const
const ZIG = ['#b4470e', '#f08a2c', '#ffc070'] as const
const TROUSER = ['#1d1310', '#2f201a', '#46302a', '#5f4436'] as const
const TUNIC = ['#0f132c', '#1b2450', '#2b3a7a', '#4a5ca8'] as const
const SASH = ['#9a330a', '#e2600f', '#fb9a4c'] as const
const PAW = ['#26222c', '#3d3946', '#5b5767'] as const
const LACQUER = ['#120d18', '#2a2236', '#5a4c70'] as const
const GOLD = ['#6b4a12', '#b8892e', '#f1cf72'] as const
const STEEL = ['#5d6982', '#c4cfdf', '#ffffff'] as const
const STRAP = '#4a2c1c'
/** The poncho's underside, where it hangs over a raised arm. */
const PONCHO_SLEEVE = [RUST[0], RUST[1], RUST[1], RUST[2]] as const

// --- path helpers -------------------------------------------------------------------------------

function polyline(b: Ctx, pts: readonly Pt[]) {
  b.beginPath()
  pts.forEach((p, i) => (i === 0 ? b.moveTo(p.x, p.y) : b.lineTo(p.x, p.y)))
}

function ellipsePath(
  b: Ctx,
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  rot = 0,
) {
  b.beginPath()
  b.ellipse(cx, cy, Math.max(0.01, rx), Math.max(0.01, ry), rot, 0, Math.PI * 2)
}

/** A round, tufted outline: a koala ear or the fuzz of his head. */
function fuzzyPath(
  b: Ctx,
  cx: number,
  cy: number,
  r: number,
  tufts: number,
  amp: number,
) {
  b.beginPath()
  const n = tufts * 4
  for (let i = 0; i <= n; i++) {
    const a = (i / n) * Math.PI * 2
    const rr = r * (1 + amp * Math.abs(Math.sin((a * tufts) / 2)) - amp * 0.5)
    const x = cx + Math.cos(a) * rr
    const y = cy + Math.sin(a) * rr
    if (i === 0) b.moveTo(x, y)
    else b.lineTo(x, y)
  }
  b.closePath()
}

function stroke(
  b: Ctx,
  color: string,
  width: number,
  cap: CanvasLineCap = 'round',
) {
  b.strokeStyle = color
  b.lineWidth = width
  b.lineCap = cap
  b.lineJoin = 'round'
  b.stroke()
}

function fill(b: Ctx, color: string | CanvasGradient) {
  b.fillStyle = color
  b.fill()
}

/** Two-bone IK: the joint between `a` and `c` with bone lengths l1, l2, bent toward `pref`. */
function joint(a: Pt, c: Pt, l1: number, l2: number, pref: Pt): Pt {
  const dx = c.x - a.x
  const dy = c.y - a.y
  const d = Math.max(0.001, Math.min(l1 + l2 - 0.001, Math.hypot(dx, dy)))
  const ux = dx / Math.max(0.001, Math.hypot(dx, dy))
  const uy = dy / Math.max(0.001, Math.hypot(dx, dy))
  const along = (l1 * l1 - l2 * l2 + d * d) / (2 * d)
  const h = Math.sqrt(Math.max(0, l1 * l1 - along * along))
  const m = pt(a.x + ux * along, a.y + uy * along)
  const k1 = pt(m.x - uy * h, m.y + ux * h)
  const k2 = pt(m.x + uy * h, m.y - ux * h)
  const s1 = (k1.x - m.x) * pref.x + (k1.y - m.y) * pref.y
  const s2 = (k2.x - m.x) * pref.x + (k2.y - m.y) * pref.y
  return s1 >= s2 ? k1 : k2
}

/**
 * One piece of the figure. `ink` lays the piece's silhouette in ink grown by `grow` (the outline);
 * `paint` fills and shades it. All inks go down first at the outer width, so the whole figure wears
 * one strong silhouette line, then each piece gets a thin inner line and its paint, in order.
 */
type Part = { ink: (b: Ctx, grow: number) => void; paint: (b: Ctx) => void }

function shapePart(path: (b: Ctx) => void, paint: (b: Ctx) => void): Part {
  return {
    ink(b, grow) {
      path(b)
      fill(b, INK)
      if (grow > 0) stroke(b, INK, grow * 2)
    },
    paint,
  }
}

function linePart(pts: Pt[], width: number, paint: (b: Ctx) => void): Part {
  return {
    ink(b, grow) {
      polyline(b, pts)
      stroke(b, INK, width + grow * 2)
    },
    paint,
  }
}

const OUTER = 0.62
const INNER = 0.26

function renderParts(b: Ctx, parts: Part[]) {
  for (const p of parts) p.ink(b, OUTER)
  for (const p of parts) {
    p.ink(b, INNER)
    p.paint(b)
  }
}

// --- the kasa -----------------------------------------------------------------------------------

/** The kasa's outline: a broad, shallow straw cone, brim tips at (cx +- hw, by), apex h above. */
function kasaPath(b: Ctx, cx: number, by: number, hw: number, h: number) {
  b.beginPath()
  b.moveTo(cx - hw, by)
  b.quadraticCurveTo(cx - hw * 0.52, by - h * 0.66, cx, by - h)
  b.quadraticCurveTo(cx + hw * 0.52, by - h * 0.66, cx + hw, by)
  b.quadraticCurveTo(cx, by + h * 0.34, cx - hw, by)
  b.closePath()
}

/** Paint the kasa (its ink is laid by the caller): woven straw lit from the upper left. */
function paintKasa(b: Ctx, cx: number, by: number, hw: number, h: number) {
  const u = hw / 12.2
  b.save()
  kasaPath(b, cx, by, hw, h)
  fill(b, STRAW[2])
  b.clip()
  // Light from the upper left, the far side in shadow.
  const g = b.createLinearGradient(cx - hw, by - h, cx + hw, by + h * 0.3)
  g.addColorStop(0, rgba(STRAW[4], 0.85))
  g.addColorStop(0.42, rgba(STRAW[3], 0.25))
  g.addColorStop(0.62, rgba(STRAW[1], 0.2))
  g.addColorStop(1, rgba(STRAW[0], 0.75))
  b.fillStyle = g
  b.fillRect(cx - hw - 1, by - h - 1, hw * 2 + 2, h * 1.6 + 2)
  // Radial straw ribs from the crown to the brim's front edge.
  const apex = pt(cx, by - h)
  const left = pt(cx - hw, by)
  const right = pt(cx + hw, by)
  const ctl = pt(cx, by + h * 0.34)
  const edge = (s: number) => {
    const a = lerp(left, ctl, s)
    const c = lerp(ctl, right, s)
    return lerp(a, c, s)
  }
  for (let i = 1; i < 12; i++) {
    const e = edge(i / 12)
    polyline(b, [apex, e])
    stroke(b, rgba(STRAW[1], 0.55), 0.32 * u)
    if (i < 6) {
      polyline(b, [off(apex, 0.4 * u, 0), off(e, 0.45 * u, 0)])
      stroke(b, rgba(STRAW[4], 0.35), 0.22 * u)
    }
  }
  // Woven bands circling the cone.
  for (const r of [0.34, 0.6, 0.84]) {
    const a = lerp(apex, left, r)
    const c = lerp(apex, right, r)
    const m = lerp(apex, ctl, r)
    b.beginPath()
    b.moveTo(a.x, a.y)
    b.quadraticCurveTo(m.x, m.y, c.x, c.y)
    stroke(b, rgba(STRAW[0], 0.42), 0.38 * u)
    b.beginPath()
    b.moveTo(a.x, a.y - 0.45 * u)
    b.quadraticCurveTo(m.x, m.y - 0.45 * u, c.x, c.y - 0.45 * u)
    stroke(b, rgba(STRAW[4], 0.3), 0.22 * u)
  }
  // The bound rim: a lit lip along the front edge.
  b.beginPath()
  b.moveTo(left.x, left.y - 0.5 * u)
  b.quadraticCurveTo(ctl.x, ctl.y - 0.5 * u, right.x, right.y - 0.5 * u)
  stroke(b, rgba(STRAW[3], 0.9), 0.5 * u)
  b.beginPath()
  b.moveTo(left.x, left.y + 0.1 * u)
  b.quadraticCurveTo(ctl.x, ctl.y + 0.1 * u, right.x, right.y + 0.1 * u)
  stroke(b, STRAW[0], 0.42 * u)
  b.restore()
  // The crown knot.
  ellipsePath(b, apex.x, apex.y + 0.5 * u, 0.85 * u, 0.6 * u)
  fill(b, STRAW[0])
  ellipsePath(b, apex.x - 0.25 * u, apex.y + 0.3 * u, 0.35 * u, 0.25 * u)
  fill(b, STRAW[3])
}

// --- the head -----------------------------------------------------------------------------------

type HeadSpec = {
  /** Head centre. */
  c: Pt
  /** Unit scale (1 for the figure). */
  u: number
  /** 0 faces the viewer, 1 is the three-quarter view toward +x. */
  turn: number
  kasa: boolean
}

function earCentres(h: HeadSpec): [Pt, Pt] {
  const { c, u, turn } = h
  const back = off(c, (-6.0 + turn * 0.6) * u, (-1.0 + turn * 0.1) * u)
  const front = off(c, (6.0 + turn * 0.4) * u, (-1.0 - turn * 0.6) * u)
  return [back, front]
}

const HEAD_RX = 6.1
const HEAD_RY = 5.2
const EAR_R = 3.1

function headPart(h: HeadSpec): Part {
  const { c, u, turn } = h
  const [earB, earF] = earCentres(h)
  const earR = EAR_R * u
  const earRF = (EAR_R - turn * 0.45) * u
  return {
    ink(b, grow) {
      for (const [e, r] of [
        [earB, earR],
        [earF, earRF],
      ] as const) {
        fuzzyPath(b, e.x, e.y, r, 9, 0.16)
        fill(b, INK)
        if (grow > 0) stroke(b, INK, grow * 2)
      }
      ellipsePath(b, c.x, c.y, HEAD_RX * u, HEAD_RY * u)
      fill(b, INK)
      if (grow > 0) stroke(b, INK, grow * 2)
    },
    paint(b) {
      const ear = (e: Pt, r: number, toward: number) => {
        fuzzyPath(b, e.x, e.y, r - 0.1 * u, 9, 0.16)
        fill(b, FUR[2])
        b.save()
        b.clip()
        ellipsePath(b, e.x + 0.6 * u, e.y + 0.7 * u, r, r)
        fill(b, FUR[1])
        ellipsePath(b, e.x - 0.5 * u, e.y - 0.6 * u, r * 0.8, r * 0.8)
        fill(b, FUR[3])
        b.restore()
        // White fluff inside the ear, toward the face.
        fuzzyPath(b, e.x + toward * 0.55 * u, e.y + 0.35 * u, r * 0.55, 7, 0.28)
        fill(b, rgba(FLUFF, 0.92))
        fuzzyPath(b, e.x + toward * 0.9 * u, e.y + 0.7 * u, r * 0.32, 5, 0.3)
        fill(b, rgba(FUR[3], 0.7))
      }
      // Facing the viewer, both ears sit over the head's edge; turned, the far one tucks behind.
      if (turn >= 0.5) ear(earB, earR, 1)
      // The head: grey fur, lit upper left, shadowed lower right.
      b.save()
      ellipsePath(b, c.x, c.y, HEAD_RX * u - 0.05, HEAD_RY * u - 0.05)
      fill(b, FUR[1])
      b.clip()
      ellipsePath(b, c.x - 0.5 * u, c.y - 0.5 * u, HEAD_RX * u, HEAD_RY * u)
      fill(b, FUR[2])
      ellipsePath(b, c.x - 1.8 * u, c.y - 1.9 * u, 3.0 * u, 2.4 * u)
      fill(b, rgba(FUR[3], 0.8))
      // A pale muzzle and chin.
      const nx = c.x + turn * 1.7 * u
      ellipsePath(b, nx - 0.1 * u, c.y + 3.3 * u, 3.3 * u, 1.9 * u)
      fill(b, '#cfd3de')
      ellipsePath(b, nx + 0.5 * u, c.y + 3.9 * u, 3.0 * u, 1.2 * u)
      fill(b, rgba(FUR[3], 0.7))
      // Cheek tufts.
      for (const s of [-1, 1]) {
        const tx = nx + s * (3.6 - turn * (s > 0 ? 1.4 : -0.2)) * u
        fuzzyPath(b, tx, c.y + 2.3 * u, 1.2 * u, 5, 0.35)
        fill(b, rgba(FUR[3], 0.55))
      }
      if (h.kasa) {
        // The brim's shadow across his brow and eyes.
        const sg = b.createLinearGradient(0, c.y - 5 * u, 0, c.y + 0.6 * u)
        sg.addColorStop(0, rgba(INK, 0.72))
        sg.addColorStop(0.75, rgba(INK, 0.42))
        sg.addColorStop(1, rgba(INK, 0))
        b.fillStyle = sg
        b.fillRect(c.x - 7 * u, c.y - 6 * u, 14 * u, 6.6 * u)
      } else {
        // Bare-headed: the fuzz on his crown.
        fuzzyPath(b, c.x - 0.6 * u, c.y - 4.6 * u, 2.6 * u, 8, 0.3)
        fill(b, rgba(FUR[3], 0.6))
      }
      b.restore()
      // Eyes: small, dark and level, under heavy brows angled down to the nose. Never a smile.
      const eyeY = c.y - 0.9 * u
      const eyes = [
        { x: nx - 2.9 * u, s: -1, w: 1 - turn * 0.15 },
        { x: nx + (2.9 - turn * 0.8) * u, s: 1, w: 1 - turn * 0.35 },
      ]
      for (const e of eyes) {
        ellipsePath(b, e.x, eyeY, 0.95 * u * e.w, 0.62 * u)
        fill(b, h.kasa ? '#c9cbd6' : '#eceef4')
        ellipsePath(
          b,
          e.x + turn * 0.25 * u,
          eyeY + 0.05 * u,
          0.52 * u,
          0.56 * u,
        )
        fill(b, NOSE)
        ellipsePath(
          b,
          e.x + (turn * 0.25 - 0.18) * u,
          eyeY - 0.2 * u,
          0.17 * u,
          0.17 * u,
        )
        fill(b, '#ffffff')
        // The stern brow, lowest by the nose.
        polyline(b, [
          pt(e.x - e.s * 1.2 * u * e.w, eyeY - 1.25 * u),
          pt(e.x + e.s * 0.1 * u, eyeY - 0.95 * u),
          pt(e.x + e.s * 1.15 * u * e.w, eyeY - 0.45 * u),
        ])
        stroke(b, INK, 0.62 * u)
      }
      // The big, dark koala nose.
      ellipsePath(b, nx, c.y + 0.7 * u, 1.75 * u, 2.25 * u)
      fill(b, INK)
      ellipsePath(b, nx, c.y + 0.75 * u, 1.55 * u, 2.05 * u)
      fill(b, NOSE)
      ellipsePath(b, nx - 0.55 * u, c.y - 0.2 * u, 0.55 * u, 0.85 * u, 0.3)
      fill(b, 'rgba(150, 140, 175, 0.55)')
      ellipsePath(b, nx - 0.6 * u, c.y - 0.45 * u, 0.22 * u, 0.32 * u, 0.3)
      fill(b, 'rgba(230, 228, 245, 0.8)')
      // A flat, set frown.
      b.beginPath()
      b.moveTo(nx - 1.25 * u, c.y + 3.85 * u)
      b.quadraticCurveTo(nx, c.y + 3.15 * u, nx + 1.25 * u, c.y + 3.85 * u)
      stroke(b, INK, 0.42 * u)
      // The near ear, over the head's edge.
      if (turn < 0.5) {
        fuzzyPath(b, earB.x, earB.y, earR + INNER, 9, 0.16)
        fill(b, INK)
        ear(earB, earR, 1)
      }
      fuzzyPath(b, earF.x, earF.y, earRF + INNER, 9, 0.16)
      fill(b, INK)
      ear(earF, earRF, -1 + turn * 0.6)
    },
  }
}

// --- the figure ---------------------------------------------------------------------------------

type Blade = {
  /** Blade angle in radians (canvas space, 0 = forward, positive = down). */
  angle: number
  /** The iai smear: an arc about the front shoulder from a0 to a1 (radians), radius r. */
  smear?: { a0: number; a1: number; r: number; alpha: number }
}

type Spec = {
  hip: Pt
  footF: Pt
  footB: Pt
  handF: Pt
  handB: Pt
  /** Torso lean (forward +), breathing lift. */
  lean: number
  breath: number
  /** Poncho hem sway (x), flare (lifts the hem), and the front lift for a raised arm. */
  hem: number
  flare: number
  lift: number
  /** The front arm is raised out of the poncho, which drapes over it. */
  armOut: boolean
  /** Head offset from its rest place (a lunge drops it, a cut twists it). */
  headDx: number
  blade?: Blade
}

const THIGH = 3.5
const SHIN = 3.4
const UPPER = 3.8
const FORE = 3.8

function legPart(hipJoint: Pt, foot: Pt, front: boolean): Part[] {
  const end = off(foot, 0, -1.9)
  const knee = joint(hipJoint, end, THIGH, SHIN, pt(1, -0.15))
  const pts = [hipJoint, knee, end]
  const ankle = lerp(knee, end, 0.8)
  const leg = linePart(pts, 3.3, (b) => {
    polyline(b, pts)
    stroke(b, front ? TROUSER[2] : TROUSER[1], 3.3)
    polyline(b, [
      off(hipJoint, -0.45, -0.2),
      off(knee, -0.5, -0.35),
      off(ankle, -0.4, -0.2),
    ])
    stroke(b, rgba(front ? TROUSER[3] : TROUSER[2], 0.9), 1.0)
    polyline(b, [off(knee, 0.7, 0.4), off(ankle, 0.6, 0.1)])
    stroke(b, rgba(TROUSER[0], 0.7), 0.7)
    // Leg wraps at the ankle.
    polyline(b, [off(ankle, -1.1, 0.25), off(ankle, 1.1, -0.25)])
    stroke(b, front ? '#7a6250' : '#5c4a3e', 0.55)
  })
  const fx = foot.x + 0.8
  const fy = foot.y - 1.3
  const paw = shapePart(
    (b) => ellipsePath(b, fx, fy, 2.05, 1.0),
    (b) => {
      ellipsePath(b, fx, fy, 2.05, 1.0)
      fill(b, front ? PAW[1] : PAW[0])
      ellipsePath(b, fx - 0.3, fy - 0.35, 1.3, 0.45)
      fill(b, rgba(PAW[2], front ? 0.9 : 0.6))
    },
  )
  return [leg, paw]
}

function armPart(
  shoulder: Pt,
  hand: Pt,
  sleeve: readonly string[],
  near: boolean,
  fist: boolean,
): Part[] {
  const elbow = joint(shoulder, hand, UPPER, FORE, pt(-0.35, 1))
  const wrist = lerp(elbow, hand, 0.82)
  const fur = near ? FUR[2] : FUR[1]
  const arm = linePart([shoulder, elbow, hand], 2.15, (b) => {
    polyline(b, [shoulder, elbow, wrist])
    stroke(b, fur, 2.15)
    polyline(b, [off(elbow, -0.35, -0.35), off(wrist, -0.3, -0.35)])
    stroke(b, rgba(near ? FUR[3] : FUR[2], 0.9), 0.75)
    // The tunic sleeve on the upper arm.
    polyline(b, [shoulder, lerp(shoulder, elbow, 0.85)])
    stroke(b, near ? (sleeve[2] ?? TUNIC[2]) : (sleeve[1] ?? TUNIC[1]), 2.35)
    polyline(b, [
      off(shoulder, -0.3, -0.35),
      off(lerp(shoulder, elbow, 0.8), -0.3, -0.35),
    ])
    stroke(b, rgba(sleeve[3] ?? TUNIC[3], near ? 0.7 : 0.35), 0.7)
  })
  const r = fist ? 1.25 : 1.1
  const paw = shapePart(
    (b) => ellipsePath(b, hand.x, hand.y, r, r),
    (b) => {
      ellipsePath(b, hand.x, hand.y, r, r)
      fill(b, near ? FUR[2] : FUR[1])
      ellipsePath(b, hand.x - 0.3, hand.y - 0.35, r * 0.55, r * 0.5)
      fill(b, rgba(FUR[3], near ? 0.9 : 0.5))
      if (fist) {
        polyline(b, [off(hand, 0.2, -0.9), off(hand, 0.6, 0.7)])
        stroke(b, rgba(INK, 0.6), 0.3)
      }
    },
  )
  return [arm, paw]
}

/** The poncho's hem corners for a neck point and sway. */
function ponchoCorners(n: Pt, s: Spec) {
  const R = pt(
    n.x + 9.9 + s.hem * 0.4 + s.flare * 0.8,
    n.y + 9.4 - s.flare - s.lift,
  )
  const M = pt(n.x + 0.6 + s.hem, n.y + 11.2 - s.flare * 0.5 - s.lift * 0.3)
  const L = pt(
    n.x - 9.7 + s.hem * 1.3 - s.flare * 0.9,
    n.y + 9.6 - s.flare * 1.1,
  )
  return { L, M, R }
}

function ponchoPath(b: Ctx, n: Pt, s: Spec) {
  const { L, M, R } = ponchoCorners(n, s)
  b.beginPath()
  b.moveTo(n.x - 2.8, n.y - 0.5)
  b.lineTo(n.x + 2.9, n.y - 0.5)
  b.quadraticCurveTo(n.x + 8.8, n.y + 0.4 - s.lift * 0.4, R.x, R.y)
  b.quadraticCurveTo((R.x + M.x) / 2, (R.y + M.y) / 2 + 0.7, M.x, M.y)
  b.quadraticCurveTo((M.x + L.x) / 2, (M.y + L.y) / 2 + 0.7, L.x, L.y)
  b.quadraticCurveTo(n.x - 8.8, n.y + 0.5, n.x - 2.8, n.y - 0.5)
  b.closePath()
}

/** Points along the hem L -> M -> R, raised by `rise`, for the zigzag trim. */
function hemPoint(n: Pt, s: Spec, t: number, rise: number): Pt {
  const { L, M, R } = ponchoCorners(n, s)
  // Quadratic-ish: each half bows down 0.35 at its middle, as the path does.
  const half = t < 0.5 ? t * 2 : (t - 0.5) * 2
  const a = t < 0.5 ? L : M
  const c = t < 0.5 ? M : R
  const p = lerp(a, c, half)
  return pt(p.x, p.y + Math.sin(half * Math.PI) * 0.35 - rise)
}

function ponchoPart(n: Pt, s: Spec): Part {
  return shapePart(
    (b) => ponchoPath(b, n, s),
    (b) => {
      b.save()
      ponchoPath(b, n, s)
      fill(b, RUST[2])
      b.clip()
      const g = b.createLinearGradient(n.x - 8, n.y - 1, n.x + 8, n.y + 12)
      g.addColorStop(0, rgba(RUST[4], 0.75))
      g.addColorStop(0.35, rgba(RUST[3], 0.25))
      g.addColorStop(0.7, rgba(RUST[1], 0.35))
      g.addColorStop(1, rgba(RUST[0], 0.7))
      b.fillStyle = g
      b.fillRect(n.x - 12, n.y - 2, 24, 16)
      // Heavy cloth folds from the collar.
      const { L, M, R } = ponchoCorners(n, s)
      for (const [top, bot, dark] of [
        [off(n, 1.2, 1.5), lerp(M, R, 0.35), true],
        [off(n, -1.4, 1.6), lerp(L, M, 0.55), true],
        [off(n, 3.6, 1.2), lerp(M, R, 0.8), false],
        [off(n, -3.6, 1.2), lerp(L, M, 0.15), false],
      ] as const) {
        b.beginPath()
        b.moveTo(top.x, top.y)
        b.quadraticCurveTo(
          (top.x + bot.x) / 2 + 0.6,
          (top.y + bot.y) / 2,
          bot.x,
          bot.y,
        )
        stroke(
          b,
          dark ? rgba(RUST[0], 0.55) : rgba(RUST[4], 0.45),
          dark ? 0.55 : 0.4,
        )
      }
      // The orange zigzag band above the hem.
      const zig: Pt[] = []
      const flat: Pt[] = []
      const low: Pt[] = []
      const steps = 14
      for (let i = 0; i <= steps; i++) {
        const t = i / steps
        zig.push(hemPoint(n, s, t, 2.35 + (i % 2 === 0 ? 0.85 : -0.85)))
        flat.push(hemPoint(n, s, t, 2.35))
        low.push(hemPoint(n, s, t, 0.65))
      }
      polyline(b, flat)
      stroke(b, rgba(RUST[0], 0.55), 2.9)
      polyline(b, zig)
      stroke(b, ZIG[0], 1.25)
      polyline(b, zig)
      stroke(b, ZIG[1], 0.85)
      polyline(
        b,
        zig.map((p) => off(p, -0.12, -0.22)),
      )
      stroke(b, rgba(ZIG[2], 0.7), 0.3)
      polyline(b, low)
      stroke(b, ZIG[1], 0.4)
      // Collar shadow under the chin.
      ellipsePath(b, n.x + 0.6, n.y + 0.2, 3.6, 1.4)
      fill(b, rgba(RUST[0], 0.6))
      b.restore()
    },
  )
}

/** The poncho lifted by a raised front arm: a wing of cloth from the collar to the wrist. */
function drapePart(n: Pt, shoulder: Pt, hand: Pt, s: Spec): Part {
  const reach = Math.hypot(hand.x - shoulder.x, hand.y - shoulder.y)
  const tip = lerp(
    shoulder,
    hand,
    Math.min(0.72, Math.max(0.3, 1 - 3.0 / reach)),
  )
  const dx = (hand.x - shoulder.x) / Math.max(0.001, reach)
  const dy = (hand.y - shoulder.y) / Math.max(0.001, reach)
  // "Below" the arm: the side of it toward the ground.
  const nx = dy > 0 ? dy : -dy
  const ny = dy > 0 ? -dx : dx
  const down = ny < 0 ? pt(-nx, -ny) : pt(nx, ny)
  const top = off(tip, -down.x * 1.0, -down.y * 1.0)
  const low = off(tip, down.x * 2.6 - dx * 0.8, down.y * 2.6 - dy * 0.8 + 0.8)
  const base = off(n, 5.6, 8.8 - s.lift * 0.6)
  const mid = lerp(low, base, 0.5)
  const path = (b: Ctx) => {
    b.beginPath()
    b.moveTo(n.x - 0.2, n.y - 0.5)
    b.quadraticCurveTo(shoulder.x + 0.2, shoulder.y - 2.0, top.x, top.y)
    b.lineTo(low.x, low.y)
    b.quadraticCurveTo(mid.x - 0.4, mid.y + 0.9, base.x, base.y)
    b.closePath()
  }
  return shapePart(path, (b) => {
    b.save()
    path(b)
    fill(b, RUST[2])
    b.clip()
    const g = b.createLinearGradient(n.x, n.y - 3, base.x + 1, base.y + 1)
    g.addColorStop(0, rgba(RUST[4], 0.8))
    g.addColorStop(0.5, rgba(RUST[3], 0.3))
    g.addColorStop(1, rgba(RUST[0], 0.6))
    b.fillStyle = g
    b.fillRect(n.x - 3, Math.min(n.y, top.y) - 4, 26, 22)
    // A fold from the shoulder, and the trim along the hanging edge.
    b.beginPath()
    b.moveTo(shoulder.x + 0.5, shoulder.y + 0.6)
    b.quadraticCurveTo(
      lerp(shoulder, low, 0.5).x,
      lerp(shoulder, low, 0.5).y + 0.6,
      low.x - 0.4,
      low.y - 0.6,
    )
    stroke(b, rgba(RUST[0], 0.5), 0.45)
    const zig: Pt[] = []
    for (let i = 0; i <= 8; i++) {
      const t = i / 8
      const a =
        t < 0.35
          ? lerp(top, low, 0.5 + t * 1.4)
          : lerp(low, base, (t - 0.35) / 0.65)
      zig.push(
        off(
          a,
          -down.x * 1.0 * (t < 0.35 ? 0 : 1) - (t < 0.35 ? dx : 0) * 1.1,
          -1.0 + (i % 2 ? 0.5 : -0.5),
        ),
      )
    }
    polyline(b, zig)
    stroke(b, ZIG[0], 1.0)
    polyline(b, zig)
    stroke(b, ZIG[1], 0.65)
    b.restore()
  })
}

function tunicPath(b: Ctx, n: Pt, s: Spec) {
  b.beginPath()
  b.moveTo(n.x - 3.2, n.y - 0.3)
  b.lineTo(n.x + 3.3, n.y - 0.3)
  b.quadraticCurveTo(n.x + 5.9, n.y + 0.5, n.x + 5.7, n.y + 4.3)
  b.quadraticCurveTo(n.x + 6.8, n.y + 7.6, n.x + 5.5 + s.hem * 0.3, n.y + 10.6)
  b.lineTo(n.x - 5.0 + s.hem * 0.6, n.y + 10.6)
  b.quadraticCurveTo(n.x - 5.9, n.y + 5, n.x - 5.0, n.y + 1.4)
  b.closePath()
}

function tunicParts(n: Pt, s: Spec): Part[] {
  const knot = off(n, -4.6, 7.4)
  const tail1 = [
    knot,
    off(knot, -2.4 + s.hem, 2.4),
    off(knot, -3.6 + s.hem * 1.6, 3.6),
  ]
  const tail2 = [
    knot,
    off(knot, -1.6 + s.hem * 0.6, 3.2),
    off(knot, -2.2 + s.hem, 4.6),
  ]
  const tails = (w: number, color: string) => (b: Ctx) => {
    polyline(b, tail1)
    stroke(b, color, w)
    polyline(b, tail2)
    stroke(b, color, w)
  }
  return [
    {
      ink(b, grow) {
        tails(1.0 + grow * 2, INK)(b)
      },
      paint(b) {
        tails(1.0, SASH[1])(b)
        polyline(
          b,
          tail1.map((p) => off(p, -0.15, -0.2)),
        )
        stroke(b, rgba(SASH[2], 0.7), 0.35)
      },
    },
    shapePart(
      (b) => tunicPath(b, n, s),
      (b) => {
        b.save()
        tunicPath(b, n, s)
        fill(b, TUNIC[2])
        b.clip()
        const g = b.createLinearGradient(n.x - 6, n.y, n.x + 6, n.y + 11)
        g.addColorStop(0, rgba(TUNIC[3], 0.75))
        g.addColorStop(0.5, rgba(TUNIC[2], 0))
        g.addColorStop(1, rgba(TUNIC[0], 0.8))
        b.fillStyle = g
        b.fillRect(n.x - 7, n.y - 1, 15, 13)
        // Folds and the crossed collar.
        polyline(b, [off(n, -2.6, -0.2), off(n, 1.2, 3.6), off(n, 3.0, -0.2)])
        stroke(b, rgba(TUNIC[0], 0.8), 0.5)
        polyline(b, [off(n, 1.2, 3.6), off(n, 2.4, 6.4)])
        stroke(b, rgba(TUNIC[0], 0.5), 0.4)
        polyline(b, [off(n, -3.4, 8.4), off(n, -2.6, 10.6)])
        stroke(b, rgba(TUNIC[0], 0.6), 0.4)
        polyline(b, [off(n, 3.6, 8.6), off(n, 4.4, 10.6)])
        stroke(b, rgba(TUNIC[0], 0.6), 0.4)
        // The katana's strap across the chest.
        polyline(b, [off(n, -3.0, 0.1), off(n, 5.6, 6.4)])
        stroke(b, INK, 1.1)
        polyline(b, [off(n, -3.0, 0.1), off(n, 5.6, 6.4)])
        stroke(b, STRAP, 0.7)
        // The orange sash.
        b.beginPath()
        b.rect(n.x - 7, n.y + 6.5, 15, 1.75)
        fill(b, SASH[1])
        b.beginPath()
        b.rect(n.x - 7, n.y + 6.5, 15, 0.45)
        fill(b, rgba(SASH[2], 0.8))
        b.beginPath()
        b.rect(n.x - 7, n.y + 7.85, 15, 0.4)
        fill(b, rgba(SASH[0], 0.9))
        b.restore()
        polyline(b, [off(n, -5.4, 6.45), off(n, 6.4, 6.45)])
        polyline(b, [off(n, -5.4, 8.3), off(n, 6.6, 8.3)])
        // The knot at his back hip.
        ellipsePath(b, knot.x, knot.y, 0.95, 0.85)
        fill(b, INK)
        ellipsePath(b, knot.x, knot.y, 0.7, 0.6)
        fill(b, SASH[1])
      },
    ),
  ]
}

/** The katana's hilt over his back shoulder, from the guard `g` to the pommel `p`. */
function hiltPart(g: Pt, p: Pt): Part {
  const pts = [g, p]
  return linePart(pts, 1.8, (b) => {
    polyline(b, pts)
    stroke(b, LACQUER[0], 1.8)
    // The criss-cross wrap.
    const len = Math.hypot(p.x - g.x, p.y - g.y)
    const ux = (p.x - g.x) / len
    const uy = (p.y - g.y) / len
    for (let i = 1; i < len / 1.3 - 0.5; i++) {
      const c = off(g, ux * i * 1.3, uy * i * 1.3)
      b.beginPath()
      b.moveTo(c.x + ux * 0.45, c.y + uy * 0.45)
      b.lineTo(c.x - uy * 0.42, c.y + ux * 0.42)
      b.lineTo(c.x - ux * 0.45, c.y - uy * 0.45)
      b.lineTo(c.x + uy * 0.42, c.y - ux * 0.42)
      b.closePath()
      fill(b, rgba('#d9cfb4', 0.85))
    }
    // Pommel cap and the tsuba.
    ellipsePath(b, p.x, p.y, 0.8, 0.8)
    fill(b, INK)
    ellipsePath(b, p.x, p.y, 0.55, 0.55)
    fill(b, GOLD[1])
    const a = Math.atan2(p.y - g.y, p.x - g.x)
    ellipsePath(b, g.x, g.y, 0.55, 1.5, a)
    fill(b, INK)
    ellipsePath(b, g.x, g.y, 0.35, 1.25, a)
    fill(b, GOLD[1])
  })
}

/** The scabbard's tip, out past his back hip. */
function scabbardPart(a: Pt, c: Pt): Part {
  const pts = [a, c]
  return linePart(pts, 1.45, (b) => {
    polyline(b, pts)
    stroke(b, LACQUER[1], 1.45)
    polyline(b, [off(a, -0.1, -0.35), off(c, 0.1, -0.35)])
    stroke(b, rgba(LACQUER[2], 0.8), 0.4)
    const k = lerp(a, c, 0.9)
    polyline(b, [k, c])
    stroke(b, GOLD[1], 1.45)
    polyline(b, [lerp(a, c, 0.55), lerp(a, c, 0.6)])
    stroke(b, GOLD[0], 1.45, 'butt')
  })
}

/** The drawn katana in the front hand: hilt behind the fist, a curved blade ahead. */
function bladePart(hand: Pt, blade: Blade): Part {
  const d = pt(Math.cos(blade.angle), Math.sin(blade.angle))
  const nrm = pt(-d.y, d.x)
  const butt = off(hand, -d.x * 2.4, -d.y * 2.4)
  const guard = off(hand, d.x * 1.1, d.y * 1.1)
  const start = off(hand, d.x * 1.4, d.y * 1.4)
  const L = 13
  const tip = off(hand, d.x * (1.4 + L), d.y * (1.4 + L))
  const mid = off(lerp(start, tip, 0.5), -nrm.x * 0.7, -nrm.y * 0.7)
  const bladePath = (b: Ctx) => {
    b.beginPath()
    b.moveTo(start.x, start.y)
    b.quadraticCurveTo(mid.x, mid.y, tip.x, tip.y)
  }
  return {
    ink(b, grow) {
      bladePath(b)
      stroke(b, INK, 1.0 + grow * 2)
      polyline(b, [butt, guard])
      stroke(b, INK, 1.5 + grow * 2)
    },
    paint(b) {
      bladePath(b)
      stroke(b, STEEL[1], 1.0)
      b.beginPath()
      b.moveTo(start.x + nrm.x * 0.25, start.y + nrm.y * 0.25)
      b.quadraticCurveTo(
        mid.x + nrm.x * 0.25,
        mid.y + nrm.y * 0.25,
        tip.x,
        tip.y,
      )
      stroke(b, STEEL[2], 0.38)
      b.beginPath()
      b.moveTo(start.x - nrm.x * 0.3, start.y - nrm.y * 0.3)
      b.quadraticCurveTo(mid.x - nrm.x * 0.3, mid.y - nrm.y * 0.3, tip.x, tip.y)
      stroke(b, STEEL[0], 0.3)
      polyline(b, [butt, guard])
      stroke(b, LACQUER[0], 1.5)
      for (let i = 1; i < 3; i++) {
        const c = lerp(butt, hand, i / 3)
        ellipsePath(b, c.x, c.y, 0.36, 0.36)
        fill(b, GOLD[1])
      }
      ellipsePath(b, guard.x, guard.y, 0.55, 1.6, blade.angle)
      fill(b, INK)
      ellipsePath(b, guard.x, guard.y, 0.35, 1.35, blade.angle)
      fill(b, GOLD[2])
    },
  }
}

/** The iai cut's moonlit smear: a crescent swept about `c`. */
function paintSmear(b: Ctx, c: Pt, sm: NonNullable<Blade['smear']>) {
  const outer: Pt[] = []
  const inner: Pt[] = []
  const n = 22
  for (let i = 0; i <= n; i++) {
    const t = i / n
    const a = sm.a0 + (sm.a1 - sm.a0) * t
    const thick = 5.2 * Math.pow(t, 0.75) * Math.min(1, (1 - t) * 5 + 0.15)
    outer.push(pt(c.x + Math.cos(a) * sm.r, c.y + Math.sin(a) * sm.r))
    inner.push(
      pt(
        c.x + Math.cos(a) * (sm.r - thick),
        c.y + Math.sin(a) * (sm.r - thick),
      ),
    )
  }
  b.save()
  b.beginPath()
  outer.forEach((p, i) => (i === 0 ? b.moveTo(p.x, p.y) : b.lineTo(p.x, p.y)))
  for (let i = inner.length - 1; i >= 0; i--) {
    const p = inner[i]
    if (p) b.lineTo(p.x, p.y)
  }
  b.closePath()
  const g = b.createRadialGradient(c.x, c.y, sm.r - 5.5, c.x, c.y, sm.r)
  g.addColorStop(0, rgba('#5eead4', 0))
  g.addColorStop(0.55, rgba('#8fe9f2', 0.45 * sm.alpha))
  g.addColorStop(1, rgba('#f2feff', 0.95 * sm.alpha))
  b.fillStyle = g
  b.fill()
  polyline(b, outer.slice(Math.floor(n * 0.3)))
  stroke(b, rgba('#ffffff', 0.9 * sm.alpha), 0.45)
  b.restore()
}

/** Paint the whole figure facing +x with its feet at (0, 0). */
function paintFigure(b: Ctx, s: Spec, poncho: boolean, hat = poncho) {
  const hip = s.hip
  const n = pt(hip.x + s.lean, hip.y - 9.6 - s.breath)
  const shoulderF = off(n, 2.0, 1.6)
  const shoulderB = off(n, -2.4, 1.6)
  const head: HeadSpec = {
    c: off(n, 0.9 + s.headDx, -4.0 + s.breath * 0.4),
    u: 1,
    turn: 1,
    kasa: hat,
  }
  const hipF = off(hip, 1.1, 0)
  const hipB = off(hip, -1.3, -0.2)
  const parts: Part[] = []

  // Back to front: the back arm, the scabbard and hilt, the legs, the body, the near arm, the head.
  parts.push(...armPart(shoulderB, s.handB, TUNIC, false, true))
  parts.push(scabbardPart(off(hip, -2.4, -3.0), off(hip, -12.2, 1.6)))
  if (!s.blade) parts.push(hiltPart(off(n, -3.4, -0.6), off(n, -10.4, -5.2)))
  parts.push(...legPart(hipB, s.footB, false))
  parts.push(...legPart(hipF, s.footF, true))
  if (poncho) {
    if (!s.armOut) parts.push(...armPart(shoulderF, s.handF, TUNIC, true, true))
    parts.push(ponchoPart(n, s))
  } else {
    parts.push(...tunicParts(n, s))
  }
  const frontArm = armPart(
    shoulderF,
    s.handF,
    poncho && s.armOut ? PONCHO_SLEEVE : TUNIC,
    true,
    true,
  )
  if (!poncho || s.armOut) parts.push(...frontArm)
  if (poncho && s.armOut) parts.push(drapePart(n, shoulderF, s.handF, s))
  parts.push(headPart(head))
  if (hat) {
    const kc = off(head.c, 0.1, -3.1)
    parts.push(
      shapePart(
        (b) => kasaPath(b, kc.x, kc.y, 12.2, 7.2),
        (b) => paintKasa(b, kc.x, kc.y, 12.2, 7.2),
      ),
    )
  }
  // The drawn blade is out in front of everything, the fist over its hilt.
  if (s.blade) {
    parts.push(bladePart(s.handF, s.blade))
    const fist = frontArm[1]
    if (fist) parts.push(fist)
  }
  // The smear sweeps behind him, so his silhouette stays crisp over it.
  if (s.blade?.smear) paintSmear(b, shoulderF, s.blade.smear)
  renderParts(b, parts)
}

// --- poses --------------------------------------------------------------------------------------

const STAND: Spec = {
  hip: pt(0, -7.3),
  footF: pt(2.3, 0),
  footB: pt(-2.5, 0),
  handF: pt(6.9, -6.4),
  handB: pt(-5.6, -8.2),
  lean: 0,
  breath: 0,
  hem: 0,
  flare: 0,
  lift: 0,
  armOut: false,
  headDx: 0,
}

function idleSpec(frame: number, poncho: boolean): Spec {
  const breath = [0, 0.22, 0.4, 0.22][frame] ?? 0
  const sway = [0, 0.3, 0.5, 0.25][frame] ?? 0
  return {
    ...STAND,
    breath,
    hem: -sway,
    handF: poncho ? pt(6.9, -6.4 - breath) : pt(5.4, -8.4 - breath),
    handB: pt(-5.4, -8.4 - breath),
  }
}

function walkSpec(frame: number, poncho: boolean): Spec {
  const a = (frame / 8) * Math.PI * 2
  const c = Math.cos(a)
  const si = Math.sin(a)
  const bob = 0.55 - Math.abs(si) * 0.9
  return {
    ...STAND,
    hip: pt(0.2, -7.4 + bob),
    footF: pt(0.3 + c * 3.8, -Math.max(0, -si) * 1.9),
    footB: pt(-0.3 - c * 3.8, -Math.max(0, si) * 1.9),
    handF: poncho
      ? pt(6.6 - c * 0.9, -6.8 + bob)
      : pt(2.4 - c * 3.0, -8.2 + bob - Math.abs(c) * 0.4),
    handB: pt(-2.6 + c * 2.8, -8.4 + bob),
    lean: 0.6,
    hem: -0.7 - c * 0.45,
    flare: 0.15 + Math.abs(si) * 0.2,
  }
}

function jumpSpec(frame: number): Spec {
  return {
    ...STAND,
    hip: pt(0, -9.2),
    footF: pt(3.4, -4.6),
    footB: pt(-1.4, -3.4),
    handF: pt(8.6, -17.0),
    handB: pt(-7.2, -11.2),
    armOut: true,
    lean: 0.5,
    hem: frame ? -0.6 : -1.0,
    flare: frame ? -0.2 : -0.5,
  }
}

function fallSpec(frame: number): Spec {
  return {
    ...STAND,
    hip: pt(0, -7.0),
    footF: pt(2.9, -0.4),
    footB: pt(-2.6, 0.5),
    handF: pt(7.6, -17.6),
    handB: pt(-7.4, -16.6),
    armOut: true,
    lean: -0.2,
    hem: frame ? 0.6 : 0.2,
    flare: frame ? 2.0 : 1.5,
  }
}

function legsFor(spec: Spec, airborne: boolean, lunge: boolean): Spec {
  if (airborne) {
    return {
      ...spec,
      hip: pt(spec.hip.x, -9.0),
      footF: pt(3.8, -4.2),
      footB: pt(-2.2, -3.2),
    }
  }
  if (lunge) {
    return {
      ...spec,
      hip: pt(0.6, -5.7),
      footF: pt(7.4, 0),
      footB: pt(-6.4, 0),
    }
  }
  return spec
}

/** The front shoulder for a spec (where paintFigure puts it). */
function shoulderOf(s: Spec): Pt {
  return pt(s.hip.x + s.lean + 2.0, s.hip.y - 9.6 - s.breath + 1.6)
}

/** A spec with its hands placed relative to the front shoulder. */
function withHands(s: Spec, front: Pt, back: Pt): Spec {
  const sh = shoulderOf(s)
  return {
    ...s,
    handF: off(sh, front.x, front.y),
    handB: off(sh, back.x, back.y),
  }
}

function throwSpec(frame: number, airborne: boolean): Spec {
  // The mockups' lunge: the throwing arm straight out ahead, the other flung back.
  const spec = legsFor(
    {
      ...STAND,
      armOut: true,
      lean: frame ? 1.0 : 1.6,
      hem: -1.4,
      flare: 0.5,
      lift: frame ? 1.0 : 1.6,
      headDx: 0.3,
    },
    airborne,
    true,
  )
  return frame
    ? withHands(spec, pt(8.6, 0.6), pt(-9.6, 4.2))
    : withHands(spec, pt(11.2, -0.8), pt(-11.0, 3.4))
}

function cutSpec(frame: number, airborne: boolean): Spec {
  // The iai cut: blade raised up and forward, a full arc down through the front, the follow-through
  // low.
  const raise = legsFor(
    {
      ...STAND,
      armOut: true,
      lean: -0.3,
      hem: 0.4,
      flare: 0.6,
      lift: 1.4,
      headDx: -0.2,
      blade: { angle: -Math.PI * 0.36 },
    },
    airborne,
    false,
  )
  const slash = legsFor(
    {
      ...STAND,
      armOut: true,
      lean: 1.7,
      hem: -1.5,
      flare: 0.6,
      lift: 1.4,
      headDx: 0.4,
      blade: {
        angle: 0.1,
        smear: { a0: -Math.PI * 0.46, a1: Math.PI * 0.1, r: 17.0, alpha: 1 },
      },
    },
    airborne,
    true,
  )
  const follow = legsFor(
    {
      ...STAND,
      armOut: true,
      lean: 1.5,
      hem: -1.7,
      flare: 0.3,
      lift: 0.8,
      headDx: 0.4,
      blade: {
        angle: Math.PI * 0.22,
        smear: { a0: -Math.PI * 0.12, a1: Math.PI * 0.24, r: 16.0, alpha: 0.4 },
      },
    },
    airborne,
    true,
  )
  if (frame === 0) return withHands(raise, pt(4.6, 0.6), pt(-8.0, 5.0))
  if (frame === 2) return withHands(follow, pt(6.6, 4.4), pt(-10.0, 1.0))
  return withHands(slash, pt(8.8, -0.2), pt(-10.4, 2.6))
}

// --- public drawing -----------------------------------------------------------------------------

const BOX_W = 60
const BOX_H = 48
const ANCHOR_Y = 43

const mod = (a: number, n: number) => ((Math.floor(a) % n) + n) % n

/** Which baked frame a pose shows, and its spec. */
function frameOf(p: ZuzuPose): { key: string; spec: () => Spec } {
  const air = p.airborne ? 'a' : 'g'
  const prog = p.progress ?? -1
  switch (p.action) {
    case 'walk': {
      const f = mod(p.walkPhase * 2, 8)
      return { key: `walk${f}`, spec: () => walkSpec(f, p.poncho) }
    }
    case 'jump': {
      const f = mod(p.tick / 5, 2)
      return { key: `jump${f}`, spec: () => jumpSpec(f) }
    }
    case 'fall': {
      const f = mod(p.tick / 4, 2)
      return { key: `fall${f}`, spec: () => fallSpec(f) }
    }
    case 'throw': {
      const f = prog >= 0.7 ? 1 : 0
      return { key: `throw${f}${air}`, spec: () => throwSpec(f, !!p.airborne) }
    }
    case 'cut': {
      const f = prog < 0 ? 1 : prog < 0.28 ? 0 : prog < 0.68 ? 1 : 2
      return { key: `cut${f}${air}`, spec: () => cutSpec(f, !!p.airborne) }
    }
    default: {
      const f = mod(p.tick / 14, 4)
      return { key: `idle${f}`, spec: () => idleSpec(f, p.poncho) }
    }
  }
}

/** Snap a logical coordinate to the device pixel grid so the blit stays crisp. */
function snap(g: Ctx, v: number): number {
  const d = densityOf(g)
  return Math.round(v * d) / d
}

/**
 * Zuzu, ~30 logical px tall, feet on (pose.x, pose.y) in world space, facing pose.facing. The caller
 * handles the invulnerability blink.
 */
export function drawZuzu(g: Ctx, pose: ZuzuPose) {
  const { key, spec } = frameOf(pose)
  const set = pose.poncho ? 'p' : 'x'
  drawBaked(
    g,
    `gt-hero-${set}-${key}`,
    snap(g, pose.x - BOX_W / 2),
    snap(g, pose.y - ANCHOR_Y),
    BOX_W,
    BOX_H,
    (b) => {
      b.save()
      b.translate(BOX_W / 2, ANCHOR_Y)
      paintFigure(b, spec(), pose.poncho)
      b.restore()
    },
    { flipX: pose.facing < 0 },
  )
}

// --- fallen -------------------------------------------------------------------------------------

/** Face down in the dust, the scabbard and hilt still on his back, still serious about it. */
function paintLying(b: Ctx, poncho: boolean) {
  const parts: Part[] = []
  // Legs trail off to the left, soles up.
  const legs = [
    [pt(-4.5, -2.0), pt(-9.0, -1.6), pt(-12.4, -2.4)],
    [pt(-4.2, -1.2), pt(-8.6, -0.9), pt(-12.0, -1.1)],
  ] as const
  legs.forEach((leg, i) => {
    const pts = [...leg]
    parts.push(
      linePart(pts, 3.0, (b) => {
        polyline(b, pts)
        stroke(b, i ? TROUSER[2] : TROUSER[1], 3.0)
        polyline(
          b,
          pts.map((p) => off(p, 0, -0.6)),
        )
        stroke(b, rgba(TROUSER[3], 0.7), 0.8)
      }),
    )
    const sole = leg[2]
    parts.push(
      shapePart(
        (b) => ellipsePath(b, sole.x - 0.6, sole.y - 0.6, 1.0, 1.8, 0.3),
        (b) => {
          ellipsePath(b, sole.x - 0.6, sole.y - 0.6, 1.0, 1.8, 0.3)
          fill(b, i ? PAW[1] : PAW[0])
        },
      ),
    )
  })
  // The scabbard and hilt angling up from his back.
  parts.push(scabbardPart(pt(-3.0, -5.2), pt(-11.5, -9.6)))
  parts.push(hiltPart(pt(2.8, -5.6), pt(8.2, -10.4)))
  // The body: a heap of poncho, or the tunic and sash.
  const body = (b: Ctx) => {
    b.beginPath()
    b.moveTo(-6.4, 0)
    b.quadraticCurveTo(-7.4, -5.6, -1.5, -6.0)
    b.quadraticCurveTo(4.8, -6.6, 7.4, -3.4)
    b.lineTo(7.6, 0)
    b.closePath()
  }
  parts.push(
    shapePart(body, (b) => {
      b.save()
      body(b)
      fill(b, poncho ? RUST[2] : TUNIC[2])
      b.clip()
      const gr = b.createLinearGradient(-6, -6, 6, 0)
      gr.addColorStop(0, rgba(poncho ? RUST[4] : TUNIC[3], 0.7))
      gr.addColorStop(1, rgba(poncho ? RUST[0] : TUNIC[0], 0.75))
      b.fillStyle = gr
      b.fillRect(-8, -7, 17, 8)
      if (poncho) {
        const zig: Pt[] = []
        for (let i = 0; i <= 10; i++)
          zig.push(pt(-6.6 + i * 1.4, -1.6 + (i % 2 ? 0.7 : -0.7)))
        polyline(b, zig)
        stroke(b, ZIG[1], 0.9)
      } else {
        b.beginPath()
        b.rect(-3.2, -7, 1.7, 8)
        fill(b, SASH[1])
      }
      b.restore()
    }),
  )
  parts.push(...armPart(pt(5.0, -2.8), pt(9.0, -0.8), TUNIC, true, false))
  // The head, face down: the back of the skull, an ear, the nose pressed to the dirt.
  const hc = pt(10.6, -3.6)
  const head = (b: Ctx) => {
    ellipsePath(b, hc.x, hc.y, 4.4, 3.8, 0.25)
  }
  const ear = pt(9.0, -7.0)
  parts.push(
    shapePart(
      (b) => fuzzyPath(b, ear.x, ear.y, 2.7, 9, 0.16),
      (b) => {
        fuzzyPath(b, ear.x, ear.y, 2.6, 9, 0.16)
        fill(b, FUR[2])
        fuzzyPath(b, ear.x + 0.3, ear.y + 0.4, 1.6, 7, 0.3)
        fill(b, FLUFF)
      },
    ),
  )
  parts.push(
    shapePart(head, (b) => {
      b.save()
      head(b)
      fill(b, FUR[1])
      b.clip()
      ellipsePath(b, hc.x - 0.8, hc.y - 0.9, 3.9, 3.0, 0.25)
      fill(b, FUR[2])
      ellipsePath(b, hc.x - 1.6, hc.y - 1.8, 1.8, 1.2, 0.25)
      fill(b, rgba(FUR[3], 0.8))
      b.restore()
      ellipsePath(b, hc.x + 3.3, hc.y + 2.6, 1.6, 1.0)
      fill(b, NOSE)
      // A shut, unimpressed eye.
      polyline(b, [pt(hc.x + 1.3, hc.y + 0.6), pt(hc.x + 2.6, hc.y + 1.0)])
      stroke(b, INK, 0.45)
    }),
  )
  renderParts(b, parts)
}

const FALL_W = 64
const FALL_H = 48
const FALL_AX = 22
const FALL_AY = 44

/**
 * Zuzu struck down, feet-centre at (x, y) in world space (the caller clamps y to the ground and skips
 * him in a pit, as renderFallen did). `t` is ticks since he fell (0 upward): he topples forward over
 * the first ~10 ticks, lands face down in a puff of dust, and stays down. No kasa: it flew off.
 */
export function drawZuzuFallen(
  g: Ctx,
  x: number,
  y: number,
  t: number,
  poncho: boolean,
) {
  const stage = t < 4 ? 0 : t < 9 ? 1 : 2
  const set = poncho ? 'p' : 'x'
  drawBaked(
    g,
    `gt-hero-fallen-${set}-${stage}`,
    snap(g, x - FALL_AX),
    snap(g, y - FALL_AY),
    FALL_W,
    FALL_H,
    (b) => {
      b.save()
      b.translate(FALL_AX, FALL_AY)
      if (stage < 2) {
        // Toppling forward about his feet, arms flung up.
        b.rotate(stage === 0 ? 0.4 : 1.05)
        paintFigure(b, { ...fallSpec(1), flare: 1.0, hem: 0.8 }, poncho, false)
      } else {
        paintLying(b, poncho)
      }
      b.restore()
    },
  )
  // The dust he kicked up landing.
  if (t >= 9 && t < 34) {
    const k = (t - 9) / 25
    g.save()
    for (let i = 0; i < 5; i++) {
      const dx = (i - 2) * (4 + k * 6)
      const r = 1.6 + k * 2.4 - Math.abs(i - 2) * 0.3
      g.globalAlpha = Math.max(0, 0.55 * (1 - k))
      g.fillStyle = i % 2 ? '#a68a6a' : '#c8ad86'
      g.beginPath()
      g.arc(
        x + dx,
        y - 1 - k * 2.5 - (i % 2) * 0.8,
        Math.max(0.5, r),
        0,
        Math.PI * 2,
      )
      g.fill()
    }
    g.restore()
  }
}

// --- the flying kasa ----------------------------------------------------------------------------

const KASA_BOX = 28
const KASA_STEPS = 16

/**
 * The straw kasa in flight, centred on (x, y) in world space: the thrown, returning hat or the one
 * knocked off by a hit. `spin` is its spin angle in radians (any range); the hat tumbles through 16
 * pre-baked angles, so the blit stays crisp at any spin.
 */
export function drawFlyingKasa(g: Ctx, x: number, y: number, spin: number) {
  const step = mod((spin / (Math.PI * 2)) * KASA_STEPS + 0.5, KASA_STEPS)
  const angle = (step / KASA_STEPS) * Math.PI * 2
  drawBaked(
    g,
    `gt-hero-kasa-${step}`,
    snap(g, x - KASA_BOX / 2),
    snap(g, y - KASA_BOX / 2),
    KASA_BOX,
    KASA_BOX,
    (b) => {
      b.save()
      b.translate(KASA_BOX / 2, KASA_BOX / 2)
      b.rotate(angle)
      // Centre the cone on its middle, not its brim.
      const by = 2.4
      kasaPath(b, 0, by, 11.6, 6.8)
      fill(b, INK)
      stroke(b, INK, OUTER * 2)
      kasaPath(b, 0, by, 11.6, 6.8)
      stroke(b, INK, INNER * 2)
      paintKasa(b, 0, by, 11.6, 6.8)
      b.restore()
    },
  )
}

/**
 * Optional companion to drawFlyingKasa for the hit that tears off his poncho: the rust poncho
 * tumbling away, centred on (x, y) in world space, flapping with `spin`.
 */
export function drawFlyingPoncho(g: Ctx, x: number, y: number, spin: number) {
  const f = mod((spin / (Math.PI * 2)) * 8, 4)
  drawBaked(
    g,
    `gt-hero-cloth-${f}`,
    snap(g, x - 12),
    snap(g, y - 9),
    24,
    18,
    (b) => {
      b.save()
      b.translate(12, 9)
      const flap = [0, 1, 0, -1][f] ?? 0
      const path = (c: Ctx) => {
        c.beginPath()
        c.moveTo(-2.4, -5.2)
        c.lineTo(2.6, -5.0 - flap * 0.4)
        c.quadraticCurveTo(6.8, -2.0, 8.6 + flap, 3.0 - flap)
        c.quadraticCurveTo(3.8, 5.2, 0.4, 4.4 + flap * 0.5)
        c.quadraticCurveTo(-4.0, 5.4, -8.4 + flap * 0.6, 2.6 + flap)
        c.quadraticCurveTo(-6.6, -2.4, -2.4, -5.2)
        c.closePath()
      }
      path(b)
      fill(b, INK)
      stroke(b, INK, OUTER * 2)
      b.save()
      path(b)
      fill(b, RUST[2])
      b.clip()
      const gr = b.createLinearGradient(-8, -5, 8, 5)
      gr.addColorStop(0, rgba(RUST[4], 0.7))
      gr.addColorStop(1, rgba(RUST[0], 0.7))
      b.fillStyle = gr
      b.fillRect(-10, -7, 20, 14)
      const zig: Pt[] = []
      for (let i = 0; i <= 12; i++)
        zig.push(
          pt(
            -8 + i * 1.4,
            2.0 + (i % 2 ? 0.75 : -0.75) + Math.sin(i * 0.6) * flap * 0.4,
          ),
        )
      polyline(b, zig)
      stroke(b, ZIG[1], 0.9)
      ellipsePath(b, 0, -4.4, 2.4, 1.0)
      fill(b, RUST[0])
      b.restore()
      b.restore()
    },
  )
}

// --- HUD portrait -------------------------------------------------------------------------------

const PORT_W = 48
const PORT_H = 34

function paintPortrait(b: Ctx, poncho: boolean) {
  // A dusk-lit backdrop: indigo above, a warm lantern glow low on the left.
  const bg = b.createLinearGradient(0, 0, 0, PORT_H)
  bg.addColorStop(0, '#120e2e')
  bg.addColorStop(1, '#2b1d48')
  b.fillStyle = bg
  b.fillRect(0, 0, PORT_W, PORT_H)
  const glow = b.createRadialGradient(4, PORT_H, 1, 4, PORT_H, 26)
  glow.addColorStop(0, 'rgba(242, 160, 70, 0.45)')
  glow.addColorStop(1, 'rgba(242, 160, 70, 0)')
  b.fillStyle = glow
  b.fillRect(0, 0, PORT_W, PORT_H)

  const u = 2.0
  const head: HeadSpec = { c: pt(24, 19.6), u, turn: 0, kasa: poncho }
  const parts: Part[] = []
  // The hilt over his right shoulder (the viewer's left).
  parts.push({
    ink(c, grow) {
      polyline(c, [pt(12.5, 28), pt(3.4, 11.4)])
      stroke(c, INK, 3.0 + grow * 2)
    },
    paint(c) {
      polyline(c, [pt(12.5, 28), pt(3.4, 11.4)])
      stroke(c, LACQUER[0], 3.0)
      for (let i = 1; i < 6; i++) {
        const p = lerp(pt(11.4, 25.8), pt(3.4, 11.4), i / 6)
        ellipsePath(c, p.x, p.y, 0.7, 0.7)
        fill(c, i % 2 ? GOLD[1] : '#d8d2c4')
      }
      ellipsePath(c, 3.4, 11.4, 1.5, 1.5)
      fill(c, INK)
      ellipsePath(c, 3.4, 11.4, 1.05, 1.05)
      fill(c, GOLD[1])
      ellipsePath(c, 12.4, 26.4, 3.0, 1.0, -1.1)
      fill(c, INK)
      ellipsePath(c, 12.4, 26.4, 2.5, 0.65, -1.1)
      fill(c, GOLD[2])
    },
  })
  // Shoulders: the poncho with its zigzag, or the bare tunic and sash.
  const shoulders = (c: Ctx) => {
    c.beginPath()
    c.moveTo(0, PORT_H + 1)
    c.lineTo(1, 30.5)
    c.quadraticCurveTo(6, 25.2, 17, 24.6)
    c.lineTo(31, 24.6)
    c.quadraticCurveTo(42, 25.2, 47, 30.5)
    c.lineTo(48, PORT_H + 1)
    c.closePath()
  }
  parts.push(
    shapePart(shoulders, (c) => {
      c.save()
      shoulders(c)
      fill(c, poncho ? RUST[2] : TUNIC[2])
      c.clip()
      const gr = c.createLinearGradient(0, 24, 40, 36)
      gr.addColorStop(0, rgba(poncho ? RUST[4] : TUNIC[3], 0.7))
      gr.addColorStop(1, rgba(poncho ? RUST[0] : TUNIC[0], 0.6))
      c.fillStyle = gr
      c.fillRect(0, 24, 48, 12)
      if (poncho) {
        const zig: Pt[] = []
        for (let i = 0; i <= 18; i++)
          zig.push(pt(i * 2.8, 31.6 + (i % 2 ? 1.3 : -1.3)))
        polyline(
          c,
          zig.map((p) => off(p, 0, 0.4)),
        )
        stroke(c, rgba(RUST[0], 0.6), 4.0)
        polyline(c, zig)
        stroke(c, ZIG[0], 2.0)
        polyline(c, zig)
        stroke(c, ZIG[1], 1.4)
        // The collar, gathered under the chin.
        ellipsePath(c, 24, 25.4, 9, 2.6)
        fill(c, rgba(RUST[0], 0.65))
        polyline(c, [pt(16, 26), pt(12, 34)])
        stroke(c, rgba(RUST[0], 0.5), 0.8)
        polyline(c, [pt(32, 26), pt(36, 34)])
        stroke(c, rgba(RUST[0], 0.5), 0.8)
      } else {
        // The crossed collar and the katana strap.
        polyline(c, [pt(17, 24.6), pt(24, 32), pt(31, 24.6)])
        stroke(c, rgba(TUNIC[0], 0.9), 1.0)
        polyline(c, [pt(13, 25.5), pt(32, 36)])
        stroke(c, INK, 2.2)
        polyline(c, [pt(13, 25.5), pt(32, 36)])
        stroke(c, STRAP, 1.4)
        c.beginPath()
        c.rect(0, 32.4, 48, 3)
        fill(c, SASH[1])
      }
      c.restore()
    }),
  )
  parts.push(headPart(head))
  if (poncho) {
    const kc = off(head.c, 0, -5.4)
    parts.push(
      shapePart(
        (c) => kasaPath(c, kc.x, kc.y, 23, 12.4),
        (c) => paintKasa(c, kc.x, kc.y, 23, 12.4),
      ),
    )
  }
  renderParts(b, parts)
}

/**
 * Head-and-shoulders portrait for the HUD, filling the rect (x, y, w, h) in screen space: kasa,
 * stern koala face and poncho collar (or the bare head and tunic once the poncho is gone), on a
 * dusk backdrop. The art keeps its proportions and is cropped to the rect.
 */
export function drawZuzuPortrait(
  g: Ctx,
  x: number,
  y: number,
  w: number,
  h: number,
  poncho: boolean,
) {
  if (!(w > 0 && h > 0)) return
  const s = Math.max(w / PORT_W, h / PORT_H)
  drawBaked(
    g,
    `gt-hero-portrait-${poncho ? 'p' : 'x'}-${w.toFixed(2)}x${h.toFixed(2)}`,
    x,
    y,
    w,
    h,
    (b) => {
      b.save()
      b.beginPath()
      b.rect(0, 0, w, h)
      b.clip()
      b.translate(w / 2, h / 2)
      b.scale(s, s)
      b.translate(-PORT_W / 2, -PORT_H / 2)
      paintPortrait(b, poncho)
      b.restore()
    },
  )
}
