// /utils/arcade/ghostTrail/foeArt.ts
//
// Zuzu: Ghost Trail's foes, bosses, projectiles and pickups (conductor kr-arcade t-013/t-014),
// painted to the accepted mockups: the spectral bone coyote (skeleton canid in a bowler-brimmed
// cowboy hat and red bandana, wrapped in a cyan haunt-glow, ember-red eyes), hooded ghosts that
// claw up out of the dirt, storm crows, the Dust Devil and the Bone Bull, plus Zuzu's thrown gear.
// The campaign roster (t-015..t-019) joins them in the same hand: the skeleton gunslinger, the
// komuso ghost monk, the grave ghoul, the drowned, the river leech, the storm harpy, the wind
// wraith, the bell imp, the flame acolyte, the abbey shade and the censer sister, each with its
// idle/move cycle, a readable tell pose for its `aim` phase (or its wind-up, for foes with none),
// its attack, and a facing flip.
//
// Everything is drawn in logical units (the 320x240 world) and baked per frame at the context's
// density through bake.ts, so the HD style gets painted detail and the Pixel style a clean 1x
// bake. Pure drawing: no game state, no rng (deterministic hashes only). Every sprite's core
// silhouette sits on the game's hitbox: foes are struck around (x, y - 8), the bosses inside
// |dx| < 14 from their feet up (38 tall for the Devil, 26 for the Bull).
//
// Palette: spectral cyan for the haunted, warm bone for skeletons, amber for lantern light, and
// crimson only where it means danger (eyes, the Bull's tell, the Devil's ember skull).

import { densityOf, drawBaked } from './bake'
import { INK, glow, mix, rgba } from '../snes'
import type { FoeKind } from './world'

type G = CanvasRenderingContext2D

export type FoeArtWeapon = 'kunai' | 'shuriken' | 'kasa' | 'lantern' | 'katana'

/** Every behaviour state a foe can be in (foes.ts `Foe['phase']`); `aim` is always the tell. */
export type FoeArtPhase =
  'rise' | 'walk' | 'sink' | 'aim' | 'attack' | 'rest' | 'dive'

export type FoeArtFoe = {
  kind: FoeKind
  x: number
  y: number
  vx: number
  vy: number
  hp: number
  t: number
  phase: FoeArtPhase
  baseY: number
  carrying: boolean
  /** Optional: which way it looks (-1 or 1). Defaults to the sign of vx, else left. */
  face?: number
  /** Optional: the behaviour countdown, which times the wind-ups of foes with no `aim` phase. */
  timer?: number
}

export type FoeArtBoss = {
  kind: 'devil' | 'bull'
  x: number
  y: number
  vx: number
  hp: number
  maxHp: number
  t: number
  flash: number
  mode: 'drift' | 'paw' | 'charge' | 'stunned'
  timer: number
  dying: number
  /** Optional: sign toward Zuzu, for the Bull's paw. Defaults to the sign of vx, else left. */
  face?: number
}

export type FoeArtShot = {
  weapon: FoeArtWeapon
  x: number
  y: number
  vx: number
  vy: number
  life: number
  t: number
  /** Optional: Zuzu's facing, which the iai cut (vx 0) needs. Defaults to the sign of vx, else right. */
  face?: number
}

export type FoeArtFire = { x: number; life: number }

export type FoeArtPickup = {
  x: number
  y: number
  kind: 'poncho' | 'nugget' | 'coin' | FoeArtWeapon
  life: number
}

export type FoeArtClod = { x: number; y: number }

// --- palette --------------------------------------------------------------------------------

/** Warm bone: deep shadow .. highlight. */
const BONE = ['#3b2a26', '#7d6650', '#c4ad88', '#e9dcbc', '#fffaea'] as const
/** Spectral cyan haunt-glow. */
const SPECTRE = ['#06283a', '#0f5866', '#1fa3a8', '#6ff0e0', '#dcfffa'] as const
/** Danger only. */
const CRIMSON = ['#4a0a14', '#9b1424', '#e0263a', '#ff6a5c', '#ffd2c4'] as const
/** Dusty plum through sand: dust, dirt, the Devil. */
const DUST = ['#3a2433', '#6b4a45', '#9e7356', '#c9a274', '#ecd3a4'] as const
const STEEL = ['#1c2338', '#3b4763', '#8693ad', '#c9d3e6', '#ffffff'] as const
const AMBER = ['#5a2a0c', '#a65f12', '#f2b52b', '#fde68a', '#fffbe6'] as const
const RUST = ['#3a1408', '#7a2c10', '#c2541b', '#f59e5b', '#ffe0c2'] as const
/** Storm-crow feathers: midnight indigo with a cold moonlit rim. */
const FEATHER = ['#07061a', '#14112e', '#231f4a', '#3b3772', '#8d93c9'] as const
const HAT = ['#100b18', '#1f1729', '#33283f', '#54445f'] as const
const BANDANA = ['#4a0c12', '#8c1820', '#c22f36', '#e8665a'] as const
const PLUM = ['#1d1022', '#3a1f3c', '#5a3456', '#7d4f72'] as const

const TAU = Math.PI * 2

// --- helpers --------------------------------------------------------------------------------

/** Deterministic 0..1 noise from a number (no rng in drawing). */
function hash(n: number): number {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453
  return s - Math.floor(s)
}

/** Snap a logical coordinate to the device pixel grid, so baked sprites stay crisp. */
function snap(g: G, v: number): number {
  const d = densityOf(g)
  return Math.round(v * d) / d
}

function poly(b: G, pts: readonly number[], close = true) {
  b.beginPath()
  b.moveTo(pts[0] ?? 0, pts[1] ?? 0)
  for (let i = 2; i < pts.length; i += 2) b.lineTo(pts[i] ?? 0, pts[i + 1] ?? 0)
  if (close) b.closePath()
}

/** A closed smooth blob through the midpoints of `pts` (x, y pairs). */
function blob(b: G, pts: readonly number[]) {
  const n = Math.floor(pts.length / 2)
  const px = (i: number) => pts[(i % n) * 2] ?? 0
  const py = (i: number) => pts[(i % n) * 2 + 1] ?? 0
  b.beginPath()
  b.moveTo((px(0) + px(1)) / 2, (py(0) + py(1)) / 2)
  for (let i = 1; i <= n; i++)
    b.quadraticCurveTo(
      px(i),
      py(i),
      (px(i) + px(i + 1)) / 2,
      (py(i) + py(i + 1)) / 2,
    )
  b.closePath()
}

function ellipsePath(
  b: G,
  x: number,
  y: number,
  rx: number,
  ry: number,
  rot = 0,
) {
  b.beginPath()
  b.ellipse(x, y, Math.max(0.01, rx), Math.max(0.01, ry), rot, 0, TAU)
}

/** Ink outline (outer half shows) then fill: the 16-bit sprite edge. */
function inked(
  b: G,
  fill: string | CanvasGradient,
  lw = 1.1,
  ink: string = INK,
) {
  b.lineJoin = 'round'
  b.lineCap = 'round'
  b.lineWidth = lw
  b.strokeStyle = ink
  b.stroke()
  b.fillStyle = fill
  b.fill()
}

/** A round-capped stroke with an ink edge. */
function seg(
  b: G,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  w: number,
  color: string,
  ink: string | null = INK,
) {
  b.lineCap = 'round'
  b.beginPath()
  b.moveTo(x1, y1)
  b.lineTo(x2, y2)
  if (ink) {
    b.lineWidth = w + 1
    b.strokeStyle = ink
    b.stroke()
  }
  b.lineWidth = w
  b.strokeStyle = color
  b.stroke()
}

/** A polyline of bone with ink edge, base tone and a moonlit upper-left highlight. */
function bones(
  b: G,
  pts: readonly number[],
  w: number,
  ramp: readonly string[] = BONE,
) {
  const path = () => {
    b.beginPath()
    b.moveTo(pts[0] ?? 0, pts[1] ?? 0)
    for (let i = 2; i < pts.length; i += 2)
      b.lineTo(pts[i] ?? 0, pts[i + 1] ?? 0)
  }
  b.lineCap = 'round'
  b.lineJoin = 'round'
  path()
  b.lineWidth = w + 1
  b.strokeStyle = INK
  b.stroke()
  b.lineWidth = w
  b.strokeStyle = ramp[2] ?? BONE[2]
  b.stroke()
  b.save()
  b.translate(-w * 0.18, -w * 0.22)
  path()
  b.lineWidth = w * 0.4
  b.strokeStyle = ramp[3] ?? BONE[3]
  b.stroke()
  b.restore()
}

/** Paint `fn` then tint everything it painted white (the hit flash), inside a bake. */
function withFlash(b: G, white: boolean, w: number, h: number, fn: () => void) {
  fn()
  if (!white) return
  b.save()
  b.globalCompositeOperation = 'source-atop'
  b.fillStyle = 'rgba(255, 255, 255, 0.86)'
  b.fillRect(0, 0, w, h)
  b.restore()
}

/** A four-point twinkle star. */
function twinkle(g: G, x: number, y: number, r: number, color: string) {
  g.fillStyle = color
  g.beginPath()
  g.moveTo(x, y - r)
  g.lineTo(x + r * 0.22, y - r * 0.22)
  g.lineTo(x + r, y)
  g.lineTo(x + r * 0.22, y + r * 0.22)
  g.lineTo(x, y + r)
  g.lineTo(x - r * 0.22, y + r * 0.22)
  g.lineTo(x - r, y)
  g.lineTo(x - r * 0.22, y - r * 0.22)
  g.closePath()
  g.fill()
}

function puff(
  g: G,
  x: number,
  y: number,
  r: number,
  color: string,
  alpha: number,
) {
  if (alpha <= 0 || r <= 0) return
  g.globalAlpha = alpha
  g.fillStyle = color
  g.beginPath()
  g.arc(x, y, r, 0, TAU)
  g.fill()
  g.globalAlpha = 1
}

function groundShadow(g: G, x: number, y: number, rx: number, alpha = 0.35) {
  g.fillStyle = rgba('#05030c', alpha)
  ellipsePath(g, x, y, rx, rx * 0.22)
  g.fill()
}

// --- the spectral bone coyote ('hyena') -----------------------------------------------------

const COYOTE_W = 50
const COYOTE_H = 40
const COYOTE_AX = 25
const COYOTE_AY = 35
const COYOTE_FRAMES = 6
/** The coyote stands tall: its body is drawn this far above the ground line, on long legs. */
const COYOTE_LIFT = 3.5
const COYOTE_SCALE = 1.1

type Pt = [number, number]

/** Leg joints for one frame: [front near, front far, back near, back far], each a joint list. */
function coyoteLegs(frame: number, leap: boolean): Pt[][] {
  const legs: Pt[][] = []
  for (const [front, offset, depth] of [
    [true, 0, 0],
    [true, 0.9, 1],
    [false, Math.PI, 0],
    [false, Math.PI + 0.9, 1],
  ] as const) {
    const ph = (frame / COYOTE_FRAMES) * TAU + offset
    const s = leap ? (front ? 1 : -1) : Math.sin(ph)
    const lift = leap ? 0.5 : Math.max(0, Math.cos(ph))
    const dx = depth ? 1.4 : 0
    if (front) {
      const sx = -5 + dx
      const sy = -13
      const a = 0.55 * s
      const kx = sx - Math.sin(a) * 7.6
      const ky = sy + Math.cos(a) * 7.6
      const lb = a - lift * 1.3
      const fx = kx - Math.sin(lb) * 8
      const fy = Math.min(COYOTE_LIFT, ky + Math.cos(lb) * 8)
      legs.push([
        [sx, sy],
        [kx, ky],
        [fx, fy],
        [fx - 1.6, Math.min(COYOTE_LIFT, fy + 0.2)],
      ])
    } else {
      const hx = 9 + dx
      const hy = -14
      const th = 0.45 + 0.5 * s
      const stx = hx - Math.sin(th) * 6.4
      const sty = hy + Math.cos(th) * 6.4
      const sh = th - 1.45 + lift * 0.3
      const hkx = stx - Math.sin(sh) * 6
      const hky = sty + Math.cos(sh) * 6
      const mt = 0.15 * s - lift * 0.9
      const px = hkx - Math.sin(mt) * 6.2
      const py = Math.min(COYOTE_LIFT, hky + Math.cos(mt) * 6.2)
      legs.push([
        [hx, hy],
        [stx, sty],
        [hkx, hky],
        [px, py],
        [px - 1.5, Math.min(COYOTE_LIFT, py + 0.2)],
      ])
    }
  }
  return legs
}

function flat(pts: Pt[]): number[] {
  const out: number[] = []
  for (const [x, y] of pts) out.push(x, y)
  return out
}

/** The coyote's spectral flesh, drawn at a given outward spread (glow, rim, body passes). */
function coyoteFlesh(
  b: G,
  legs: Pt[][],
  tailSway: number,
  spread: number,
  color: string,
) {
  b.fillStyle = color
  b.strokeStyle = color
  b.lineJoin = 'round'
  b.lineCap = 'round'
  // Tail: a bushy spectral brush streaming back.
  const sw = tailSway
  blob(b, [
    10,
    -17,
    14.5,
    -17.6 + sw * 0.3,
    18.6,
    -14.4 + sw * 0.6,
    20.4,
    -9 + sw,
    18.4,
    -6.2 + sw,
    15.6,
    -8.6 + sw * 0.5,
    12.4,
    -12.4,
    9,
    -13.6,
  ])
  b.lineWidth = spread
  if (spread > 0) b.stroke()
  b.fill()
  // Torso and neck.
  blob(
    b,
    [
      -9.5, -18.5, -5, -17.5, 1, -18.6, 8, -18, 12.5, -15.5, 11, -10.5, 4, -9,
      -2, -8.6, -7, -9.8, -10, -13.5,
    ],
  )
  if (spread > 0) b.stroke()
  b.fill()
  // Legs as thick translucent limbs around the bones.
  for (const leg of legs) {
    b.beginPath()
    const first = leg[0]
    if (!first) continue
    b.moveTo(first[0], first[1])
    for (const [x, y] of leg.slice(1)) b.lineTo(x, y)
    b.lineWidth = 2 + spread
    b.stroke()
  }
}

function paintCoyote(b: G, frame: number, leap: boolean, hatOn: boolean) {
  b.translate(COYOTE_AX, COYOTE_AY)
  const legs = coyoteLegs(frame, leap)
  const bob = leap
    ? -0.6
    : Math.abs(Math.sin((frame / COYOTE_FRAMES) * TAU)) * -0.7
  const tailSway = leap ? -2 : Math.sin((frame / COYOTE_FRAMES) * TAU + 1) * 1.2
  b.save()
  b.scale(COYOTE_SCALE, COYOTE_SCALE)
  b.translate(0, bob - COYOTE_LIFT)
  // Spectral flesh: soft glow, a bright cyan rim, and a see-through haunt inside it.
  coyoteFlesh(b, legs, tailSway, 4.2, rgba(SPECTRE[3], 0.16))
  coyoteFlesh(b, legs, tailSway, 2.4, rgba(SPECTRE[3], 0.3))
  coyoteFlesh(b, legs, tailSway, 1.1, SPECTRE[3])
  b.save()
  b.globalCompositeOperation = 'destination-out'
  coyoteFlesh(b, legs, tailSway, 0, '#000000')
  b.restore()
  coyoteFlesh(b, legs, tailSway, 0, rgba('#0b2440', 0.62))
  // Tail fur streaks.
  b.strokeStyle = rgba(SPECTRE[2], 0.7)
  b.lineWidth = 0.5
  for (let i = 0; i < 3; i++) {
    b.beginPath()
    b.moveTo(12 + i, -13 + i)
    b.quadraticCurveTo(
      16 + i,
      -10 + tailSway * 0.5,
      18 + i * 0.5,
      -5 + tailSway,
    )
    b.stroke()
  }
  // Far legs (dim bone), then the skeleton.
  const far = [BONE[0], BONE[1], BONE[1], BONE[2], BONE[3]] as const
  for (const i of [1, 3]) bones(b, flat(legs[i] ?? []), 1.1, far)
  // Spine arching from the neck to the tail root, with vertebra ticks.
  b.lineCap = 'round'
  bones(b, [-7, -16, -2, -17.6, 4, -17.5, 9, -16, 12, -15.5], 1.4)
  b.strokeStyle = BONE[3]
  b.lineWidth = 0.55
  for (let i = 0; i < 7; i++) {
    const x = -4 + i * 2.3
    const y = -17.5 + Math.abs(x - 1) * 0.06
    b.beginPath()
    b.moveTo(x, y)
    b.lineTo(x + 0.5, y - 1.1)
    b.stroke()
  }
  // Ribcage.
  for (let i = 0; i < 5; i++) {
    const x = -4.2 + i * 1.9
    b.beginPath()
    b.moveTo(x, -16.8)
    b.quadraticCurveTo(x - 2.2, -13, x + 0.4 - i * 0.2, -9.6 + i * 0.15)
    b.lineWidth = 1.5
    b.strokeStyle = INK
    b.stroke()
    b.lineWidth = 0.75
    b.strokeStyle = i < 2 ? BONE[3] : BONE[2]
    b.stroke()
  }
  bones(b, [-4.5, -9.6, 3.5, -9.8], 0.7)
  // Shoulder blade and pelvis.
  b.beginPath()
  poly(b, [-6.5, -16.2, -3.6, -16.8, -4.4, -12.2])
  inked(b, BONE[2], 1)
  blob(b, [7.5, -16.2, 11, -16.8, 12.6, -14, 10, -12, 8, -13.5])
  inked(b, BONE[2], 1)
  b.fillStyle = BONE[0]
  b.beginPath()
  b.arc(10, -14.4, 0.8, 0, TAU)
  b.fill()
  // Near legs.
  for (const i of [0, 2]) bones(b, flat(legs[i] ?? []), 1.25)
  // Tail vertebrae inside the brush.
  b.fillStyle = BONE[3]
  for (let i = 0; i < 5; i++) {
    b.beginPath()
    b.arc(
      12.5 + i * 1.5,
      -15 + i * 1.7 + tailSway * (i / 5),
      0.55 - i * 0.05,
      0,
      TAU,
    )
    b.fill()
  }
  // Red bandana knotted at the throat, tails flagging back.
  b.save()
  poly(b, [-8.6, -15.6, -4.6, -16.8, -3.6, -13.2, -6.4, -9.2, -8.8, -12.8])
  inked(b, BANDANA[2], 1)
  b.fillStyle = BANDANA[1]
  poly(b, [-5.4, -14.4, -3.8, -13.4, -6.4, -9.6])
  b.fill()
  b.fillStyle = BANDANA[3]
  poly(b, [-8.4, -15.4, -5.6, -16.2, -7.6, -14])
  b.fill()
  const flap = Math.sin((frame / COYOTE_FRAMES) * TAU * 2) * 0.8
  poly(b, [-4.4, -16.4, -0.4, -17.4 + flap, 0.2, -16 + flap, -4, -15.4])
  inked(b, BANDANA[2], 0.9)
  b.fillStyle = BANDANA[0]
  b.fillRect(-5.2, -16.6, 1.2, 1.2)
  b.restore()
  // Skull: long canid snout, jaw agape, ember eye.
  b.save()
  b.translate(-7.8, -15.6)
  b.rotate(leap ? -0.12 : Math.sin((frame / COYOTE_FRAMES) * TAU) * 0.05)
  b.scale(1.15, 1.15)
  // Lower jaw.
  poly(b, [-0.6, 1.6, -7.8, 3.1, -8.4, 3.9, -6.5, 4.1, -1.4, 3.2])
  inked(b, BONE[2], 1)
  // Cranium and upper jaw.
  blob(
    b,
    [
      1.2, -0.4, 0.4, -3, -1.6, -4.4, -4.2, -3.6, -7.2, -1.8, -9.6, -0.9, -9.8,
      0.6, -7.4, 1.4, -3.4, 1.8, 0.2, 1.6,
    ],
  )
  inked(b, BONE[3], 1.1)
  // Shading: lower half of the skull in shadow, brow lit.
  b.fillStyle = BONE[2]
  blob(b, [-9.2, 0.3, -6, 0.8, -2.4, 1.6, 0.4, 1.2, -0.4, 0.4, -5.6, 0.2])
  b.fill()
  b.fillStyle = BONE[4]
  blob(b, [-1.4, -3.6, -3.8, -3.1, -6.2, -1.7, -3.4, -2.3])
  b.fill()
  // Teeth.
  b.fillStyle = BONE[4]
  for (let i = 0; i < 4; i++) {
    poly(b, [-8.6 + i * 1.5, 1.2, -8 + i * 1.5, 2.5, -7.6 + i * 1.5, 1.3])
    b.fill()
  }
  for (let i = 0; i < 3; i++) {
    poly(b, [-7.6 + i * 1.6, 3.2, -7.1 + i * 1.6, 2.3, -6.6 + i * 1.6, 3.1])
    b.fill()
  }
  // Nasal cavity, cheek line, eye socket.
  b.fillStyle = BONE[0]
  ellipsePath(b, -9, -0.5, 0.6, 0.45)
  b.fill()
  b.strokeStyle = BONE[1]
  b.lineWidth = 0.4
  b.beginPath()
  b.moveTo(-6.6, 0.6)
  b.quadraticCurveTo(-3.6, -0.2, -1.2, 0.8)
  b.stroke()
  b.fillStyle = '#1a0a12'
  ellipsePath(b, -3.4, -1.6, 1.25, 0.95, -0.2)
  b.fill()
  b.fillStyle = CRIMSON[2]
  ellipsePath(b, -3.6, -1.6, 0.7, 0.55)
  b.fill()
  b.fillStyle = CRIMSON[4]
  b.fillRect(-3.9, -1.9, 0.4, 0.4)
  // The hat: wide, curled brim, pinched crown, rust band.
  if (hatOn) {
    b.save()
    b.translate(-2.4, -3.6)
    b.rotate(-0.14)
    poly(
      b,
      [
        -3.4, -1.6, -3.1, -5, -1.6, -5.6, 0.2, -4.9, 1.9, -5.5, 3.4, -4.8, 3.4,
        -1.4,
      ],
    )
    inked(b, HAT[2], 1)
    b.fillStyle = HAT[3]
    poly(b, [-3, -2, -2.8, -4.8, -1.6, -5.3, -1.2, -2])
    b.fill()
    b.fillStyle = RUST[1]
    b.fillRect(-3.3, -2.6, 6.6, 1.05)
    b.fillStyle = RUST[2]
    b.fillRect(-3.3, -2.6, 6.6, 0.4)
    // Brim, curling up at both ends.
    b.beginPath()
    b.moveTo(-7.4, -2.6)
    b.quadraticCurveTo(-5.4, -0.4, 0, -1.2)
    b.quadraticCurveTo(5.4, -0.6, 7, -3)
    b.quadraticCurveTo(6.2, 0.4, 0, 0.5)
    b.quadraticCurveTo(-6.4, 1.2, -7.4, -2.6)
    b.closePath()
    inked(b, HAT[1], 1)
    b.strokeStyle = HAT[3]
    b.lineWidth = 0.35
    b.beginPath()
    b.moveTo(-6.6, -1.9)
    b.quadraticCurveTo(-4.4, -0.4, 0, -0.9)
    b.stroke()
    b.restore()
  } else {
    // Hat knocked off: a crack runs across the bare cranium.
    b.strokeStyle = BONE[0]
    b.lineWidth = 0.4
    b.beginPath()
    b.moveTo(-1.5, -4.2)
    b.lineTo(-2.2, -3)
    b.lineTo(-1.6, -2.4)
    b.stroke()
  }
  b.restore()
  b.restore()
}

function drawCoyote(g: G, f: FoeArtFoe, tick: number) {
  const face = f.face ?? (Math.sign(f.vx) || -1)
  const leap = f.vy !== 0 || f.y < f.baseY - 0.5
  const frame = leap ? 0 : Math.floor(f.t / 3) % COYOTE_FRAMES
  const hatOn = f.hp >= 2
  const x = snap(g, f.x)
  const y = snap(g, f.y)
  if (!leap) groundShadow(g, x, f.baseY, 12)
  glow(g, x, y - 12, 18, SPECTRE[2], 0.16 + Math.sin(tick / 9) * 0.04)
  drawBaked(
    g,
    `gt-foes-coyote-${leap ? 'leap' : frame}-${hatOn ? 'hat' : 'bare'}`,
    x - COYOTE_AX,
    y - COYOTE_AY,
    COYOTE_W,
    COYOTE_H,
    (b) => paintCoyote(b, frame, leap, hatOn),
    { flipX: face > 0 },
  )
  // The ember eye smoulders.
  const ex = x + (face > 0 ? 13.1 : -13.1)
  glow(g, ex, y - 23, 3.4, CRIMSON[3], 0.6)
}

// --- the ghost ('spirit') -------------------------------------------------------------------

const GHOST_W = 32
const GHOST_H = 36
const GHOST_AX = 16
const GHOST_AY = 30
const GHOST_FRAMES = 4

function ghostRobe(b: G, w: number) {
  const tat = (i: number) => Math.sin(w + i * 1.7) * 1.1
  b.beginPath()
  b.moveTo(0.5, -26)
  b.quadraticCurveTo(-3.8, -26, -4.8, -21.5)
  b.quadraticCurveTo(-5.6, -17.5, -5.6, -14.5)
  b.quadraticCurveTo(-7.2, -9, -7.4, -3 + tat(0))
  b.lineTo(-5.4, -4.4 + tat(1))
  b.lineTo(-3.8, 0.6 + tat(2))
  b.lineTo(-2, -3 + tat(3))
  b.lineTo(0, 1.6 + tat(4))
  b.lineTo(2, -2.4 + tat(5))
  b.lineTo(4.2, 1.2 + tat(6))
  b.lineTo(5.6, -3.4 + tat(7))
  b.lineTo(9.6, -1.6 + tat(8))
  b.quadraticCurveTo(7.6, -8, 6.6, -12)
  b.quadraticCurveTo(6.2, -18, 5, -22)
  b.quadraticCurveTo(3.8, -26, 0.5, -26)
  b.closePath()
}

function paintGhost(b: G, frame: number) {
  b.translate(GHOST_AX, GHOST_AY)
  const w = (frame / GHOST_FRAMES) * TAU
  // Outer haunt-glow.
  ghostRobe(b, w)
  b.lineJoin = 'round'
  b.lineWidth = 4
  b.strokeStyle = rgba(SPECTRE[3], 0.14)
  b.stroke()
  b.lineWidth = 2
  b.strokeStyle = rgba(SPECTRE[3], 0.22)
  b.stroke()
  // The far arm reaching, behind the robe.
  const reach = Math.sin(w) * 0.8
  b.beginPath()
  b.moveTo(-1, -17)
  b.quadraticCurveTo(-5, -18.5 + reach, -8.5, -17 + reach)
  b.lineWidth = 2.6
  b.strokeStyle = SPECTRE[1]
  b.stroke()
  // Robe: bright at the shoulders, fading to nothing at the tatters.
  const robe = b.createLinearGradient(0, -26, 0, 2)
  robe.addColorStop(0, rgba(SPECTRE[3], 0.97))
  robe.addColorStop(0.4, rgba(SPECTRE[2], 0.9))
  robe.addColorStop(0.78, rgba(SPECTRE[1], 0.5))
  robe.addColorStop(1, rgba(SPECTRE[1], 0))
  const rim = b.createLinearGradient(0, -26, 0, 2)
  rim.addColorStop(0, SPECTRE[4])
  rim.addColorStop(0.6, rgba(SPECTRE[3], 0.7))
  rim.addColorStop(1, rgba(SPECTRE[3], 0))
  ghostRobe(b, w)
  b.fillStyle = robe
  b.fill()
  b.lineWidth = 0.7
  b.strokeStyle = rim
  b.stroke()
  // Folds in shadow.
  b.strokeStyle = rgba(SPECTRE[0], 0.55)
  b.lineWidth = 0.8
  for (const [x0, x1] of [
    [1.5, 0.5],
    [4, 4.5],
    [-2.5, -3.5],
  ] as const) {
    b.beginPath()
    b.moveTo(x0, -15)
    b.quadraticCurveTo(x0 + 1, -9, x1, -3 + Math.sin(w + x0) * 0.8)
    b.stroke()
  }
  // Moonlit highlight down the back of the hood.
  b.strokeStyle = rgba(SPECTRE[4], 0.75)
  b.lineWidth = 0.7
  b.beginPath()
  b.moveTo(-2.6, -24.6)
  b.quadraticCurveTo(-4.4, -22.4, -4.4, -19)
  b.stroke()
  // Hood opening, and the skull face within.
  b.fillStyle = '#031019'
  ellipsePath(b, -2.6, -19.6, 2.3, 3.1, 0.12)
  b.fill()
  b.fillStyle = mix(BONE[3], SPECTRE[3], 0.35)
  blob(
    b,
    [
      -1.6, -21.6, -3.8, -21.2, -4.4, -18.6, -3.6, -16.6, -2.4, -16.8, -1.2,
      -18.6,
    ],
  )
  b.fill()
  b.fillStyle = '#021018'
  ellipsePath(b, -3.4, -19.6, 0.65, 0.75)
  b.fill()
  ellipsePath(b, -1.9, -19.6, 0.55, 0.7)
  b.fill()
  b.fillRect(-3.4, -17.5, 1.4, 0.35)
  b.fillStyle = SPECTRE[4]
  b.fillRect(-3.6, -19.8, 0.45, 0.45)
  b.fillRect(-2.1, -19.8, 0.4, 0.4)
  // Near arm: a ragged sleeve and a bony, clawing hand.
  b.beginPath()
  b.moveTo(-3.5, -15.5)
  b.quadraticCurveTo(-7, -15 - reach, -9.4, -13 - reach)
  b.lineWidth = 3
  b.strokeStyle = INK
  b.stroke()
  b.lineWidth = 2.1
  b.strokeStyle = SPECTRE[2]
  b.stroke()
  b.lineWidth = 0.6
  b.strokeStyle = SPECTRE[4]
  b.beginPath()
  b.moveTo(-4, -16.3)
  b.quadraticCurveTo(-7, -16 - reach, -9, -14.1 - reach)
  b.stroke()
  const hx = -10
  const hy = -12.8 - reach
  for (const [dx, dy] of [
    [-2.6, -1.4],
    [-2.9, 0],
    [-2.3, 1.3],
    [-0.8, 1.9],
  ] as const) {
    b.beginPath()
    b.moveTo(hx, hy)
    b.quadraticCurveTo(hx + dx * 0.6, hy + dy * 0.4 - 0.4, hx + dx, hy + dy)
    b.lineWidth = 1.1
    b.strokeStyle = INK
    b.stroke()
    b.lineWidth = 0.5
    b.strokeStyle = BONE[3]
    b.stroke()
  }
}

/** Dirt breaking open where a ghost claws up. */
function drawGrave(g: G, x: number, groundY: number, open: number, t: number) {
  g.fillStyle = DUST[1]
  ellipsePath(g, x, groundY, 8 * open + 2, 1.6 * open + 0.6)
  g.fill()
  g.fillStyle = DUST[0]
  ellipsePath(g, x, groundY + 0.4, 5 * open + 1, 0.9 * open + 0.3)
  g.fill()
  g.strokeStyle = '#1a0f16'
  g.lineWidth = 0.6
  g.beginPath()
  g.moveTo(x - 9 * open, groundY + 0.6)
  g.lineTo(x - 4, groundY - 0.2)
  g.moveTo(x + 3, groundY + 0.2)
  g.lineTo(x + 9 * open, groundY - 0.4)
  g.stroke()
  // Clods kicked loose.
  for (let i = 0; i < 4; i++) {
    const p = ((t * 0.9 + i * 9) % 26) / 26
    const dir = i % 2 ? 1 : -1
    const dx = dir * (2 + hash(i + 3) * 5) * p * 2
    const dy = -14 * p + 16 * p * p
    puff(g, x + dx, groundY - 1 + dy, 0.9, i % 2 ? DUST[2] : DUST[3], 1 - p)
  }
}

function drawGhost(g: G, f: FoeArtFoe, tick: number) {
  const face = f.face ?? (Math.sign(f.vx) || -1)
  const frame = Math.floor(f.t / 7) % GHOST_FRAMES
  const x = snap(g, f.x)
  const ground = f.baseY
  const hover = f.phase === 'walk' ? -1.5 + Math.sin(f.t / 11) * 1.1 : 0
  const y = snap(g, f.y + hover)
  const alpha =
    f.phase === 'sink'
      ? Math.max(0.15, 0.85 - ((f.y - ground) / 16) * 0.7)
      : f.phase === 'rise'
        ? 0.92
        : 0.92 + Math.sin(tick / 13) * 0.06
  // Cold light pooling on the ground beneath it.
  g.save()
  g.globalAlpha = alpha
  g.fillStyle = rgba(SPECTRE[3], 0.18)
  ellipsePath(g, x, ground, 9, 1.8)
  g.fill()
  g.restore()
  if (f.phase !== 'walk')
    drawGrave(g, x, ground, f.phase === 'rise' ? 1 : 0.6, f.t)
  g.save()
  g.beginPath()
  g.rect(x - 20, y - 44, 40, ground + 0.5 - (y - 44))
  g.clip()
  glow(g, x, y - 15, 15, SPECTRE[2], 0.22 * alpha)
  drawBaked(
    g,
    `gt-foes-ghost-${frame}`,
    x - GHOST_AX,
    y - GHOST_AY,
    GHOST_W,
    GHOST_H,
    (b) => paintGhost(b, frame),
    { flipX: face > 0, alpha },
  )
  g.restore()
  // A will-o'-wisp circling it.
  if (f.phase === 'walk') {
    const a = f.t / 16
    const wx = x + Math.cos(a) * 10
    const wy = y - 16 + Math.sin(a * 1.3) * 5
    glow(g, wx, wy, 4, SPECTRE[3], 0.6)
    puff(g, wx, wy, 0.8, SPECTRE[4], 0.9)
  }
}

// --- the storm crow -------------------------------------------------------------------------

const CROW_W = 38
const CROW_H = 38
const CROW_AX = 19
const CROW_AY = 17
const CROW_SCALE = 1.25
const CROW_FRAMES = 4
/** The crow's body centre sits this far above its y, on the foe hitbox (y - 8). */
const CROW_LIFT = 7

/** One wing: root at the shoulder, swept to angle `a` (0 = straight back, negative = up). */
function crowWing(b: G, a: number, ramp: readonly string[], rim: boolean) {
  const rx = -1
  const ry = -2
  const ux = Math.cos(a)
  const uy = Math.sin(a)
  // The trailing edge always faces the tail.
  const flip = -uy < 0 ? -1 : 1
  const vx = -uy * flip
  const vy = ux * flip
  const at = (u: number, v: number): [number, number] => [
    rx + u * ux + v * vx,
    ry + u * uy + v * vy,
  ]
  const outline: Array<[number, number]> = [
    [0, -1.4],
    [4, -2],
    [7.6, -1.4],
    [10.8, 0],
    [9.2, 1.1],
    [10.6, 1.6],
    [8.6, 2.6],
    [9.6, 3.3],
    [7.4, 3.9],
    [8, 4.8],
    [5.6, 4.7],
    [3.2, 4.4],
    [0, 3.6],
  ]
  const pts: number[] = []
  for (const [u, v] of outline) pts.push(...at(u, v))
  poly(b, pts)
  inked(b, ramp[2] ?? FEATHER[2], 1)
  // Coverts: a lighter band of small feathers along the arm.
  const cov: number[] = []
  for (const [u, v] of [
    [0.4, -1],
    [4, -1.5],
    [6.6, -0.9],
    [6, 1.2],
    [4.2, 2],
    [2.2, 1.6],
    [0.4, 2.2],
  ] as const)
    cov.push(...at(u, v))
  poly(b, cov)
  b.fillStyle = ramp[3] ?? FEATHER[3]
  b.fill()
  // Primary shafts.
  b.strokeStyle = ramp[1] ?? FEATHER[1]
  b.lineWidth = 0.35
  b.beginPath()
  for (const [u, v] of [
    [9.2, 1.1],
    [8.6, 2.6],
    [7.4, 3.9],
  ] as const) {
    const [x0, y0] = at(u - 3.2, v * 0.6)
    const [x1, y1] = at(u, v)
    b.moveTo(x0, y0)
    b.lineTo(x1, y1)
  }
  b.stroke()
  if (rim) {
    b.strokeStyle = ramp[4] ?? FEATHER[4]
    b.lineWidth = 0.45
    b.beginPath()
    const [x0, y0] = at(0, -1.4)
    const [x1, y1] = at(4, -2)
    const [x2, y2] = at(9.6, -0.6)
    b.moveTo(x0, y0)
    b.lineTo(x1, y1)
    b.lineTo(x2, y2)
    b.stroke()
  }
}

function paintCrow(b: G, frame: number, carrying: boolean) {
  b.translate(CROW_AX, CROW_AY)
  b.scale(CROW_SCALE, CROW_SCALE)
  const angles = [-1.6, -0.5, 1.25, -0.5]
  const a = angles[frame] ?? 0
  // Far wing, in shadow.
  b.save()
  b.translate(1.2, -0.6)
  crowWing(
    b,
    a - 0.3,
    [FEATHER[0], FEATHER[0], FEATHER[1], FEATHER[2], FEATHER[3]],
    false,
  )
  b.restore()
  // Tail fan.
  poly(
    b,
    [
      4, -1.6, 10.4, -3.2, 12.6, -2, 11, -0.9, 12.8, 0.4, 10.6, 1.4, 11.4, 2.4,
      4, 1.4,
    ],
  )
  inked(b, FEATHER[1], 1)
  b.strokeStyle = FEATHER[3]
  b.lineWidth = 0.4
  b.beginPath()
  b.moveTo(5, -1)
  b.lineTo(11.4, -2.4)
  b.stroke()
  // Talons, or the bundle clutched in them.
  if (carrying) {
    b.strokeStyle = '#4a2a14'
    b.lineWidth = 0.6
    b.beginPath()
    b.moveTo(0.2, 2.6)
    b.lineTo(0.6, 7)
    b.stroke()
    blob(
      b,
      [
        -2.8, 8, -1.6, 6.6, 0.6, 6.8, 2.8, 6.6, 3.8, 8.4, 3.2, 11, 0.6, 11.8,
        -2.2, 11,
      ],
    )
    inked(b, RUST[1], 1)
    b.fillStyle = RUST[2]
    blob(b, [-2, 8, -0.6, 7.2, 1.6, 7.4, 1.2, 9, -1.4, 9.4])
    b.fill()
    // Knot ears and an amber glint of gear inside.
    poly(b, [-0.6, 7, -1.4, 5.4, 0.6, 6.4, 2, 5.2, 1.8, 7])
    inked(b, RUST[2], 0.8)
    b.fillStyle = AMBER[3]
    b.fillRect(1.6, 9, 1, 1)
    b.fillStyle = AMBER[4]
    b.fillRect(1.9, 9.2, 0.4, 0.4)
    // Talons gripping the knot.
    b.strokeStyle = '#2b2722'
    b.lineWidth = 0.55
    b.beginPath()
    b.moveTo(-0.6, 2.4)
    b.lineTo(-0.2, 5.4)
    b.moveTo(1, 2.4)
    b.lineTo(1.4, 5.4)
    b.stroke()
  } else {
    b.strokeStyle = '#2b2722'
    b.lineWidth = 0.6
    b.beginPath()
    b.moveTo(-0.4, 2.6)
    b.lineTo(0.8, 4)
    b.lineTo(2.2, 4.2)
    b.moveTo(1, 2.4)
    b.lineTo(2.4, 3.6)
    b.lineTo(3.6, 3.6)
    b.stroke()
  }
  // Body.
  blob(
    b,
    [
      -7.6, -1.2, -6.8, -4.4, -3.6, -4.2, 1, -3.2, 5.2, -2, 5.4, 1.6, 0.4, 3.4,
      -4, 2.4, -7, 1,
    ],
  )
  inked(b, FEATHER[2], 1.1)
  b.fillStyle = FEATHER[1]
  blob(b, [-5, 1.8, -1, 2.8, 4.6, 1.2, 3, -0.4, -2, 0.4])
  b.fill()
  // Ragged crest.
  poly(
    b,
    [
      -5.8, -4, -4.8, -6, -4.4, -4.4, -3.4, -5.6, -3, -4, -1.6, -4.6, -1.8,
      -3.4,
    ],
  )
  inked(b, FEATHER[2], 0.8)
  // Moonlit rim along the head and back.
  b.strokeStyle = FEATHER[4]
  b.lineWidth = 0.5
  b.beginPath()
  b.moveTo(-7.2, -2.6)
  b.quadraticCurveTo(-6.4, -4.4, -4, -4)
  b.moveTo(-1.6, -3.4)
  b.quadraticCurveTo(1.5, -3.2, 4.4, -2)
  b.stroke()
  // Heavy beak.
  b.beginPath()
  b.moveTo(-7, -3)
  b.quadraticCurveTo(-10, -2.6, -11.6, -0.6)
  b.quadraticCurveTo(-9.6, -0.4, -7, 0.4)
  b.closePath()
  inked(b, '#3a3644', 0.9)
  b.strokeStyle = '#8a8698'
  b.lineWidth = 0.4
  b.beginPath()
  b.moveTo(-7.4, -2.6)
  b.quadraticCurveTo(-9.6, -2.2, -11, -0.9)
  b.stroke()
  // Pale gold storm-eye.
  b.fillStyle = '#ffd75e'
  b.beginPath()
  b.arc(-5.6, -2.3, 0.85, 0, TAU)
  b.fill()
  b.fillStyle = INK
  b.fillRect(-5.85, -2.55, 0.5, 0.5)
  // Near wing over the body.
  crowWing(b, a, FEATHER, true)
}

function drawCrow(g: G, f: FoeArtFoe, tick: number) {
  const face = f.face ?? (Math.sign(f.vx) || -1)
  const frame = Math.floor(f.t / 5) % CROW_FRAMES
  const x = snap(g, f.x)
  const y = snap(g, f.y - CROW_LIFT)
  drawBaked(
    g,
    `gt-foes-crow-${frame}-${f.carrying ? 'bundle' : 'bare'}`,
    x - CROW_AX,
    y - CROW_AY,
    CROW_W,
    CROW_H,
    (b) => paintCrow(b, frame, f.carrying),
    { flipX: face > 0 },
  )
  const ex = x + (face > 0 ? 7 : -7)
  glow(g, ex, y - 2.9, 2.8, '#ffd75e', 0.45)
  if (f.carrying)
    glow(
      g,
      x + (face > 0 ? -1 : 1),
      y + 11.6,
      4,
      AMBER[2],
      0.3 + Math.sin(tick / 6) * 0.12,
    )
}

// --- the campaign roster: shared pieces ----------------------------------------------------
//
// The eleven campaign foes (t-015..t-019) follow the slice's recipe: each pose is painted once
// per frame into a bake (facing left, feet at the origin, anchored on the canvas centre line so
// the facing flip mirrors about the feet), and only the live parts (tells, glints, censer swings,
// drips, smoke) are drawn per frame on top. Every tell is a pose change *and* a light: a reader
// at 1x sees the silhouette change, and the glow carries it on a busy backdrop.

/** Duster, dusty plum: deep shadow .. moonlit rim. */
const DUSTER = ['#140c1a', '#2c1b30', '#47293f', '#664057', '#9c7488'] as const
/** Grave-ash flesh for the ghoul: cold shadow .. bone-lit. */
const ASH = ['#16101e', '#2f2838', '#524a5a', '#837b80', '#bdb4a6'] as const
/** Waterlogged flesh, teal. */
const BLOAT = ['#0a2226', '#164046', '#2c6a64', '#5a9a88', '#a6d4bc'] as const
const WEED = ['#0c2018', '#173a26', '#2a5e38', '#4f8a4a'] as const
const RAG = ['#10122a', '#1e2246', '#323a68', '#5a6496'] as const
/** River leech: wet indigo-black, a plum belly, a cold sheen. */
const LEECH_SKIN = [
  '#0a0612',
  '#181026',
  '#2a1c40',
  '#45305e',
  '#a596cc',
] as const
/** The harpy's cold moonlit skin, and her storm-black hair. */
const SKIN = ['#2a2440', '#544c72', '#8a84a6', '#bdb8cf', '#ecebf6'] as const
const HAIR = ['#05040e', '#0f0c22', '#1d1940', '#34306a'] as const
/** The wind wraith: gale-blue spectre. */
const GALE = ['#0e1230', '#25306a', '#5b6fb4', '#a9c0ec', '#eef6ff'] as const
const BRONZE = ['#2a160a', '#5e3714', '#9a6526', '#d6a352', '#f8e2a8'] as const
const IMP_SKIN = [
  '#25060f',
  '#541225',
  '#8a2234',
  '#c0443e',
  '#ec8466',
] as const
const EMBER = ['#4a0d1a', '#a3172f', '#ef4444', '#fb923c', '#fef08a'] as const
/** The flame acolyte's robe: rare crimson, kept deep so its hand and fire carry the danger. */
const ROBE = ['#16040a', '#360a16', '#621222', '#951c2c', '#cf3040'] as const
/** The abbey shade: a violet-rimmed void. */
const VOID = ['#05020c', '#120726', '#2a1050', '#8a4ad8', '#e2c4ff'] as const
const HABIT = ['#0a0816', '#191428', '#2b2342', '#463b62', '#7a6c94'] as const

/** A baked foe pose: `w` x `h` logical px, the feet `ay` px down the canvas centre line. */
type Box = { w: number; h: number; ay: number }

/** Draw a baked pose with its feet at (x, y), mirrored to face right when `face` > 0. */
function foeSprite(
  g: G,
  key: string,
  x: number,
  y: number,
  box: Box,
  face: number,
  paint: (b: G) => void,
  alpha?: number,
) {
  drawBaked(
    g,
    `gt-foes-${key}`,
    x - box.w / 2,
    y - box.ay,
    box.w,
    box.h,
    (b) => {
      b.translate(box.w / 2, box.ay)
      paint(b)
    },
    { flipX: face > 0, alpha },
  )
}

/** World x of a sprite-local x (sprites are painted facing left). */
function sideX(x: number, face: number, lx: number): number {
  return face > 0 ? x - lx : x + lx
}

/** A polyline limb with an ink edge and round joints. */
function limb(
  b: G,
  pts: readonly number[],
  w: number,
  color: string,
  ink: string | null = INK,
) {
  b.lineCap = 'round'
  b.lineJoin = 'round'
  b.beginPath()
  b.moveTo(pts[0] ?? 0, pts[1] ?? 0)
  for (let i = 2; i < pts.length; i += 2) b.lineTo(pts[i] ?? 0, pts[i + 1] ?? 0)
  if (ink) {
    b.lineWidth = w + 1
    b.strokeStyle = ink
    b.stroke()
  }
  b.lineWidth = w
  b.strokeStyle = color
  b.stroke()
}

/** Two-bone chain from (x, y): angles from straight down, positive swinging forward (-x). */
function joint2(
  x: number,
  y: number,
  a1: number,
  l1: number,
  a2: number,
  l2: number,
): [number, number, number, number, number, number] {
  const kx = x - Math.sin(a1) * l1
  const ky = y + Math.cos(a1) * l1
  return [x, y, kx, ky, kx - Math.sin(a2) * l2, ky + Math.cos(a2) * l2]
}

/** A bone club: a shaft with knuckled ends. */
function boneClub(b: G, x1: number, y1: number, x2: number, y2: number) {
  bones(b, [x1, y1, x2, y2], 1.2)
  const a = Math.atan2(y2 - y1, x2 - x1)
  const nx = -Math.sin(a) * 0.9
  const ny = Math.cos(a) * 0.9
  for (const [x, y] of [
    [x1, y1],
    [x2, y2],
  ] as const) {
    for (const s of [-1, 1]) {
      b.beginPath()
      b.arc(x + nx * s, y + ny * s, 0.95, 0, TAU)
      inked(b, BONE[3], 0.8)
    }
  }
}

/** A small teardrop flame (local, base at (x, y)), for the acolyte's palm and the imp's ember. */
function flame(g: G, x: number, y: number, h: number, t: number, hot = false) {
  const lean = Math.sin(t / 3) * h * 0.12
  for (const [k, color] of [
    [1, hot ? EMBER[2] : CRIMSON[2]],
    [0.68, EMBER[3]],
    [0.38, EMBER[4]],
  ] as const) {
    const hh = h * k * (1 + Math.sin(t / 2.3 + k * 4) * 0.08)
    const w = h * 0.36 * k
    g.fillStyle = color
    g.beginPath()
    g.moveTo(x - w, y)
    g.quadraticCurveTo(x - w * 1.1, y - hh * 0.5, x + lean, y - hh)
    g.quadraticCurveTo(x + w * 1.1, y - hh * 0.5, x + w, y)
    g.quadraticCurveTo(x, y + w * 0.7, x - w, y)
    g.fill()
  }
}

// --- the skeleton gunslinger ----------------------------------------------------------------

const SLINGER: Box = { w: 44, h: 44, ay: 38 }
const SLINGER_FRAMES = 6
type SlingerPose = 'walk' | 'draw' | 'smoke' | 'holster'
/** Where the revolver's muzzle sits in the draw pose (sprite-local). */
const SLINGER_MUZZLE: Pt = [-15.8, -16.4]

/** The revolver, painted along -x from its grip at the origin. */
function revolver(b: G) {
  // Barrel and frame.
  seg(b, -1.2, -0.9, -6, -0.9, 1.1, STEEL[2])
  b.strokeStyle = STEEL[4]
  b.lineWidth = 0.35
  b.beginPath()
  b.moveTo(-1.4, -1.25)
  b.lineTo(-5.8, -1.25)
  b.stroke()
  b.fillStyle = STEEL[3]
  b.fillRect(-6.2, -1.9, 0.6, 0.6)
  // Cylinder and hammer.
  b.beginPath()
  b.rect(-2.6, -1.9, 2.2, 1.9)
  inked(b, STEEL[1], 0.8)
  b.fillStyle = STEEL[3]
  b.fillRect(-2.4, -1.8, 1.8, 0.45)
  poly(b, [0, -1.4, 0.9, -2.4, 0.5, -0.8])
  inked(b, STEEL[1], 0.6)
  // Ivory grip.
  b.beginPath()
  b.moveTo(-0.4, -0.4)
  b.quadraticCurveTo(0.6, 0.8, 0.4, 2.4)
  b.lineTo(1.6, 2.2)
  b.quadraticCurveTo(1.6, 0.4, 0.8, -0.6)
  b.closePath()
  inked(b, BONE[3], 0.7)
}

function paintGunslinger(
  b: G,
  pose: SlingerPose,
  frame: number,
  hatOn: boolean,
) {
  const walking = pose === 'walk'
  const ph = (frame / SLINGER_FRAMES) * TAU
  const bob = walking ? -Math.abs(Math.sin(ph)) * 0.6 : 0
  const ground = -bob
  b.translate(0, bob)
  const far = [BONE[0], BONE[1], BONE[1], BONE[2], BONE[3]] as const
  const legAt = (a: number, lift: number) => {
    const p = joint2(0.6, -11, a, 5.6, a - lift, 5.4)
    p[5] = Math.min(ground - 0.6, p[5])
    return p
  }
  const stance: Record<SlingerPose, [number, number]> = {
    walk: [0, 0],
    draw: [0.42, -0.34],
    smoke: [0.42, -0.34],
    holster: [0.2, -0.16],
  }
  const [nearA, farA] = stance[pose]
  const nearLeg = walking
    ? legAt(0.5 * Math.sin(ph), Math.max(0, Math.cos(ph)) * 0.9)
    : legAt(nearA, 0)
  const farLeg = walking
    ? legAt(0.5 * Math.sin(ph + Math.PI), Math.max(0, -Math.cos(ph)) * 0.9)
    : legAt(farA, 0)
  const boot = (lx: number, ly: number, dim: boolean) => {
    blob(b, [
      lx + 0.9,
      ly - 2.8,
      lx + 1.4,
      ly - 0.4,
      lx + 0.4,
      ly + 0.6,
      lx - 2.6,
      ly + 0.6,
      lx - 2.8,
      ly - 0.4,
      lx - 0.6,
      ly - 1.4,
      lx - 0.4,
      ly - 2.8,
    ])
    inked(b, dim ? '#1c1014' : '#3a2220', 1)
    b.fillStyle = dim ? '#2c1a1a' : '#6a4230'
    b.fillRect(lx - 0.3, ly - 2.6, 0.9, 1.4)
    // Spur.
    b.fillStyle = dim ? AMBER[1] : AMBER[2]
    b.fillRect(lx + 1.3, ly - 0.9, 0.8, 0.8)
  }
  // Far arm, behind everything.
  const farSh: Pt = [1.6, -19.8]
  if (pose === 'draw' || pose === 'smoke') {
    // Fanning the hammer.
    limb(b, [farSh[0], farSh[1], -2.2, -18, -6.6, -17.4], 2.2, DUSTER[1])
    b.fillStyle = BONE[2]
    b.beginPath()
    b.arc(-7, -17.2, 0.9, 0, TAU)
    b.fill()
  } else {
    const a = walking ? 0.4 * Math.sin(ph) : 0.1
    const arm = joint2(farSh[0], farSh[1], a, 4.4, a + 0.35, 4)
    limb(b, arm.slice(0, 4), 2.3, DUSTER[1])
    bones(b, arm.slice(2), 0.9, far)
  }
  // Duster's back panel, flaring behind the legs.
  const flap = walking ? Math.sin(ph * 2) * 0.8 : pose === 'draw' ? 1.6 : 0.6
  poly(b, [
    -2.8,
    -21,
    3.4,
    -21.4,
    4.4,
    -13,
    6.8 + flap,
    -5,
    8 + flap * 1.4,
    -2.4,
    5.6 + flap,
    -3.4,
    3.6 + flap * 0.6,
    -2.2,
    1.6,
    -3.6,
    0,
    -11,
    -2.4,
    -16,
  ])
  inked(b, DUSTER[2], 1.1)
  b.fillStyle = DUSTER[1]
  poly(b, [0, -11, 1.6, -3.6, 3.6 + flap * 0.6, -2.2, 3.4, -11])
  b.fill()
  b.strokeStyle = DUSTER[4]
  b.lineWidth = 0.55
  b.beginPath()
  b.moveTo(3.2, -21)
  b.lineTo(4.2, -13)
  b.lineTo(7.4 + flap * 1.3, -3)
  b.stroke()
  b.strokeStyle = DUSTER[0]
  b.lineWidth = 0.45
  b.beginPath()
  b.moveTo(2.4, -12)
  b.lineTo(4.8 + flap, -3.4)
  b.stroke()
  // Legs: bone shins, boots.
  bones(b, farLeg, 1.1, far)
  boot(farLeg[4], farLeg[5], true)
  bones(b, nearLeg, 1.3)
  boot(nearLeg[4], nearLeg[5], false)
  // The open coat front: dark lining, and the ribcage inside.
  poly(b, [-3, -20.4, 1.8, -20.6, 1.4, -11.6, -2, -11.8])
  b.fillStyle = '#0d0812'
  b.fill()
  bones(b, [1, -20.2, 0.6, -15.6, 0.6, -11.8], 0.9)
  for (let i = 0; i < 4; i++) {
    const y = -19 + i * 1.7
    b.beginPath()
    b.moveTo(0.8, y)
    b.quadraticCurveTo(-1.6, y - 0.4, -2.6, y + 0.9)
    b.lineWidth = 1.4
    b.strokeStyle = INK
    b.stroke()
    b.lineWidth = 0.7
    b.strokeStyle = i < 2 ? BONE[3] : BONE[2]
    b.stroke()
  }
  // Pelvis and gun belt.
  blob(b, [-1.6, -12.2, 2.6, -12.4, 2.8, -10.2, 0.6, -9.4, -1.8, -10.4])
  inked(b, BONE[2], 0.9)
  b.beginPath()
  b.rect(-2.4, -12.4, 6.4, 1.3)
  inked(b, '#3a2216', 0.8)
  b.fillStyle = AMBER[2]
  for (let i = 0; i < 4; i++) b.fillRect(-0.4 + i * 1.1, -12.1, 0.5, 0.7)
  b.fillStyle = AMBER[3]
  b.fillRect(-2.4, -12.4, 1.4, 1.3)
  // Holster on the near hip, the ivory grip showing when the gun is home.
  poly(b, [1.4, -11.4, 3.8, -11.4, 4, -6.8, 2.4, -6.2])
  inked(b, '#4a2a18', 0.9)
  b.fillStyle = '#6e4228'
  b.fillRect(1.8, -11, 0.6, 3.8)
  if (walking) {
    b.beginPath()
    b.moveTo(2.4, -11.2)
    b.quadraticCurveTo(3.6, -12.4, 4.4, -13.4)
    b.lineWidth = 2
    b.strokeStyle = INK
    b.stroke()
    b.lineWidth = 1.2
    b.strokeStyle = BONE[3]
    b.stroke()
  }
  // Turned-up collar behind the skull.
  poly(b, [1.4, -21, 3.6, -24.2, 4.2, -20.6])
  inked(b, DUSTER[3], 0.9)
  poly(b, [-3.2, -20.8, -2, -22.4, -1, -20.6])
  inked(b, DUSTER[3], 0.8)
  // Skull.
  b.save()
  if (pose === 'draw') {
    b.translate(-0.6, -21.4)
    b.rotate(-0.08)
    b.translate(0.6, 21.4)
  }
  poly(b, [-4.2, -21.4, -1, -21.2, 0.8, -22, 0.4, -20, -3.6, -20.2])
  inked(b, BONE[2], 1)
  blob(
    b,
    [
      -3.4, -24.6, -3, -27, -0.6, -27.8, 1.8, -27, 2.6, -24.6, 1.6, -22.4, -1,
      -21.6, -3.2, -22.2,
    ],
  )
  inked(b, BONE[3], 1.1)
  poly(b, [-3, -24, -4.8, -23.2, -4.6, -21.8, -2.4, -21.6])
  inked(b, BONE[3], 0.9)
  b.fillStyle = BONE[2]
  blob(b, [-4.4, -22, -2, -22.4, 1.4, -22.6, 1.2, -23.6, -1.8, -23.2])
  b.fill()
  b.fillStyle = BONE[4]
  blob(b, [-2.6, -26.8, -0.4, -27.4, 1.2, -26.6, -0.8, -25.8])
  b.fill()
  b.fillStyle = BONE[4]
  for (let i = 0; i < 3; i++) b.fillRect(-4.2 + i * 1.1, -21.6, 0.6, 0.7)
  b.fillStyle = '#1a0a12'
  ellipsePath(b, -2, -24.2, 1.15, 1.05)
  b.fill()
  ellipsePath(b, -4.2, -22.9, 0.4, 0.35)
  b.fill()
  b.fillStyle = pose === 'draw' ? CRIMSON[3] : CRIMSON[2]
  ellipsePath(b, -2.2, -24.2, 0.55, 0.5)
  b.fill()
  // The hat: flat-brimmed, pinched, a bone band with amber conchos.
  if (hatOn) {
    b.save()
    b.translate(-0.4, -27)
    b.rotate(pose === 'draw' ? -0.12 : walking ? Math.sin(ph) * 0.03 : -0.04)
    poly(
      b,
      [-3.4, 0.4, -3, -3.4, -1, -4.2, 0.8, -3.4, 2.6, -4, 3.8, -3, 3.8, 0.4],
    )
    inked(b, HAT[2], 1)
    b.fillStyle = HAT[3]
    poly(b, [-2.9, 0, -2.6, -3.1, -1.2, -3.8, -0.8, 0])
    b.fill()
    b.fillStyle = BONE[2]
    b.fillRect(-3.4, -1, 7.2, 0.9)
    b.fillStyle = AMBER[3]
    b.fillRect(-2.6, -0.9, 0.7, 0.7)
    b.fillRect(0.2, -0.9, 0.7, 0.7)
    b.fillRect(2.6, -0.9, 0.7, 0.7)
    b.beginPath()
    b.moveTo(-8, 0.2)
    b.quadraticCurveTo(-3, 1.2, 0, 0.6)
    b.quadraticCurveTo(4, 0.4, 7.2, -0.6)
    b.lineTo(7, 0.7)
    b.quadraticCurveTo(3, 1.8, 0, 1.8)
    b.quadraticCurveTo(-5, 2.2, -8, 0.2)
    b.closePath()
    inked(b, HAT[1], 1)
    b.strokeStyle = HAT[3]
    b.lineWidth = 0.45
    b.beginPath()
    b.moveTo(-7.2, 0.4)
    b.quadraticCurveTo(-3, 1.1, 0, 0.7)
    b.stroke()
    b.restore()
  } else {
    b.strokeStyle = BONE[0]
    b.lineWidth = 0.4
    b.beginPath()
    b.moveTo(0.4, -27.6)
    b.lineTo(-0.2, -26.2)
    b.lineTo(0.6, -25.4)
    b.stroke()
  }
  b.restore()
  // Near arm and the revolver.
  const sh: Pt = [0.2, -19.6]
  if (pose === 'draw' || pose === 'smoke') {
    const hand: Pt = pose === 'draw' ? [-7.6, -15.2] : [-6.4, -17.6]
    limb(
      b,
      [sh[0], sh[1], -3.6, -16.8, hand[0] + 1.6, hand[1] + 0.2],
      2.4,
      DUSTER[2],
    )
    b.fillStyle = DUSTER[3]
    b.fillRect(hand[0] + 1, hand[1] - 0.9, 1, 1.9)
    b.save()
    b.translate(hand[0], hand[1])
    if (pose === 'smoke') b.rotate(0.85)
    b.scale(1.3, 1.3)
    revolver(b)
    b.restore()
    b.fillStyle = BONE[3]
    b.beginPath()
    b.arc(hand[0] + 0.4, hand[1] + 0.2, 0.9, 0, TAU)
    b.fill()
  } else if (pose === 'holster') {
    limb(b, [sh[0], sh[1], -1.2, -15.4, -1.8, -12.4], 2.4, DUSTER[2])
    b.save()
    b.translate(-2.4, -11.8)
    b.rotate(-1.2)
    b.scale(1.3, 1.3)
    revolver(b)
    b.restore()
    b.fillStyle = BONE[3]
    b.beginPath()
    b.arc(-2.2, -11.8, 0.9, 0, TAU)
    b.fill()
  } else {
    const a = -0.4 * Math.sin(ph)
    const arm = joint2(sh[0], sh[1], a, 4.6, a + 0.4, 4.2)
    const cuff: Pt = [
      arm[2] + (arm[4] - arm[2]) * 0.45,
      arm[3] + (arm[5] - arm[3]) * 0.45,
    ]
    bones(b, [cuff[0], cuff[1], arm[4], arm[5]], 1)
    limb(b, [arm[0], arm[1], arm[2], arm[3], cuff[0], cuff[1]], 2.4, DUSTER[2])
    b.fillStyle = BONE[3]
    b.beginPath()
    b.arc(arm[4], arm[5] + 0.3, 0.85, 0, TAU)
    b.fill()
  }
  // Moonlit shoulder.
  b.strokeStyle = DUSTER[4]
  b.lineWidth = 0.5
  b.beginPath()
  b.moveTo(-2.4, -20.8)
  b.lineTo(2.8, -21.2)
  b.stroke()
}

function drawGunslinger(g: G, f: FoeArtFoe, tick: number) {
  const face = f.face ?? (Math.sign(f.vx) || -1)
  const timer = f.timer ?? 0
  const pose: SlingerPose =
    f.phase === 'aim'
      ? 'draw'
      : f.phase === 'rest'
        ? timer > 46
          ? 'smoke'
          : timer > 24
            ? 'holster'
            : 'walk'
        : 'walk'
  const moving = Math.abs(f.vx) > 0.05 || f.phase === 'walk'
  const frame =
    pose === 'walk' && moving ? Math.floor(f.t / 6) % SLINGER_FRAMES : 0
  const hatOn = f.hp >= 2
  const x = snap(g, f.x)
  const y = snap(g, f.y)
  groundShadow(g, x, y, 9)
  foeSprite(
    g,
    `slinger-${pose}-${frame}-${hatOn ? 'hat' : 'bare'}`,
    x,
    y,
    SLINGER,
    face,
    (b) => paintGunslinger(b, pose, frame, hatOn),
  )
  // The ember eye, and the tell: a red glint swelling at the muzzle.
  const ex = sideX(x, face, -2.2)
  glow(g, ex, y - 24.2, 2.6, CRIMSON[3], pose === 'draw' ? 0.8 : 0.35)
  if (pose === 'draw') {
    const p = 1 - Math.max(0, Math.min(1, timer / 42))
    const mx = sideX(x, face, SLINGER_MUZZLE[0])
    const my = y + SLINGER_MUZZLE[1]
    const pulse = 0.5 + 0.5 * Math.sin(tick / 2.2)
    glow(g, mx, my, 5 + p * 7, CRIMSON[2], 0.45 + p * 0.4)
    twinkle(g, mx, my, 1.8 + p * 2.6 + pulse * 0.8, CRIMSON[3])
    twinkle(g, mx, my, 0.9 + p * 1.2, CRIMSON[4])
  } else if (pose === 'smoke') {
    // Smoke curling off the barrel.
    const mx = sideX(x, face, -9.4)
    for (let i = 0; i < 3; i++) {
      const p = ((f.t * 0.7 + i * 8) % 24) / 24
      puff(
        g,
        mx + Math.sin(p * 5 + i) * 1.4,
        y - 22.6 - p * 9,
        0.8 + p * 1.8,
        '#b8b0c8',
        (1 - p) * 0.55,
      )
    }
  }
}

// --- the ghost monk (a komuso under his basket hat) ------------------------------------------

const MONK: Box = { w: 40, h: 48, ay: 40 }
const MONK_FRAMES = 4

function monkRobe(b: G, w: number) {
  const tat = (i: number) => Math.sin(w + i * 1.9) * 1.1
  b.beginPath()
  b.moveTo(-2.6, -21.6)
  b.lineTo(-5, -20.2)
  b.quadraticCurveTo(-6.2, -14, -6.6, -6)
  b.lineTo(-6.8, -2.6 + tat(0))
  b.lineTo(-4.4, -0.4 + tat(1))
  b.lineTo(-2.4, -2.6 + tat(2))
  b.lineTo(-0.2, 2.2 + tat(3))
  b.lineTo(2, -1.4 + tat(4))
  b.lineTo(4.4, 1.6 + tat(5))
  b.lineTo(6.6, -2.4 + tat(6))
  b.lineTo(8.6, -0.6 + tat(7))
  b.quadraticCurveTo(6.8, -8, 6.2, -12)
  b.quadraticCurveTo(5.8, -18, 3.2, -21.4)
  b.closePath()
}

function paintMonk(b: G, frame: number, chant: boolean) {
  const w = (frame / MONK_FRAMES) * TAU
  // Haunt-glow halo, then the robe fading to nothing at its hem.
  monkRobe(b, w)
  b.lineJoin = 'round'
  b.lineWidth = 4
  b.strokeStyle = rgba(SPECTRE[3], 0.14)
  b.stroke()
  b.lineWidth = 2
  b.strokeStyle = rgba(SPECTRE[3], 0.24)
  b.stroke()
  // A dark edge that fades with the robe, so it holds against the teal waterhole too.
  const edge = b.createLinearGradient(0, -22, 0, 2)
  edge.addColorStop(0, rgba(INK, 0.75))
  edge.addColorStop(0.7, rgba(INK, 0.4))
  edge.addColorStop(1, rgba(INK, 0))
  monkRobe(b, w)
  b.lineWidth = 1.4
  b.strokeStyle = edge
  b.stroke()
  const robe = b.createLinearGradient(0, -22, 0, 2)
  robe.addColorStop(0, rgba(SPECTRE[2], 0.96))
  robe.addColorStop(0.5, rgba(SPECTRE[1], 0.88))
  robe.addColorStop(1, rgba(SPECTRE[1], 0))
  const rim = b.createLinearGradient(0, -22, 0, 2)
  rim.addColorStop(0, SPECTRE[4])
  rim.addColorStop(0.6, rgba(SPECTRE[3], 0.7))
  rim.addColorStop(1, rgba(SPECTRE[3], 0))
  monkRobe(b, w)
  b.fillStyle = robe
  b.fill()
  b.lineWidth = 0.7
  b.strokeStyle = rim
  b.stroke()
  // Folds.
  b.strokeStyle = rgba(SPECTRE[0], 0.6)
  b.lineWidth = 0.7
  for (const [x0, x1] of [
    [-2.6, -3.6],
    [1.4, 1],
    [4, 5],
  ] as const) {
    b.beginPath()
    b.moveTo(x0, -12)
    b.quadraticCurveTo(x0 + 0.8, -6, x1, -1 + Math.sin(w + x0) * 0.8)
    b.stroke()
  }
  // Under-kimono collar, and the plum kesa slung across with its amber ring.
  poly(b, [-2.8, -21.6, 0.6, -21.8, -1.6, -16.8])
  b.fillStyle = mix(BONE[3], SPECTRE[3], 0.45)
  b.fill()
  poly(b, [1.2, -21.6, 3.8, -21, -4.4, -9.6, -6.4, -10.8])
  b.fillStyle = rgba(PLUM[3], 0.92)
  b.fill()
  b.strokeStyle = rgba(PLUM[0], 0.9)
  b.lineWidth = 0.5
  b.stroke()
  b.strokeStyle = rgba(BONE[3], 0.5)
  b.lineWidth = 0.35
  for (let i = 0; i < 4; i++) {
    const u = 0.15 + i * 0.22
    b.beginPath()
    b.moveTo(1.2 + (-6.4 - 1.2) * u, -21.6 + 11.6 * u)
    b.lineTo(3.8 + (-4.4 - 3.8) * u, -21 + 11.4 * u)
    b.stroke()
  }
  b.beginPath()
  b.arc(-0.4, -17.6, 1, 0, TAU)
  b.lineWidth = 0.6
  b.strokeStyle = AMBER[2]
  b.stroke()
  // Sleeves and hands: the shakuhachi held low, or hands raised together in the chant.
  const hand = mix(BONE[3], SPECTRE[4], 0.5)
  if (chant) {
    poly(
      b,
      [
        -0.6, -20.4, -4.6, -23.4, -7.8, -22.6, -7.6, -19.6, -4.2, -16.6, 0.4,
        -15.6,
      ],
    )
    inked(b, SPECTRE[2], 0.9)
    b.strokeStyle = SPECTRE[4]
    b.lineWidth = 0.5
    b.beginPath()
    b.moveTo(-0.6, -20.4)
    b.lineTo(-4.6, -23.4)
    b.stroke()
    // Palms pressed, fingers up.
    poly(b, [-7.4, -22.6, -8.6, -26, -7.6, -26.4, -6.6, -22.8])
    inked(b, hand, 0.7)
    // Prayer beads looped from the hands.
    for (let i = 0; i < 9; i++) {
      const a = (i / 8) * Math.PI
      b.fillStyle = i % 4 === 0 ? AMBER[2] : PLUM[3]
      b.beginPath()
      b.arc(-7.2 + Math.cos(a) * 1.6, -22 + Math.sin(a) * 3.8, 0.5, 0, TAU)
      b.fill()
    }
  } else {
    // The flute, from under the basket down past the sleeves.
    seg(b, -4.6, -22.2, -9.2, -10.6, 1.1, mix(BONE[2], SPECTRE[3], 0.3))
    b.fillStyle = SPECTRE[0]
    for (const u of [0.35, 0.55, 0.75]) {
      b.fillRect(-4.6 - 4.6 * u - 0.3, -22.2 + 11.6 * u - 0.3, 0.6, 0.6)
    }
    poly(
      b,
      [-0.8, -20.2, -5, -17.4, -7.6, -14.2, -6.2, -11, -3.4, -12.4, 0.2, -15],
    )
    inked(b, SPECTRE[2], 0.9)
    b.strokeStyle = SPECTRE[4]
    b.lineWidth = 0.5
    b.beginPath()
    b.moveTo(-0.8, -20.2)
    b.lineTo(-5, -17.4)
    b.stroke()
    b.fillStyle = hand
    ellipsePath(b, -6.4, -17.4, 1.1, 0.9)
    b.fill()
    ellipsePath(b, -7.6, -14, 1.1, 0.9)
    b.fill()
  }
  // The tengai: a woven basket over the whole head, a mesh slit to see through.
  const hat = () => {
    b.beginPath()
    b.moveTo(-6, -20.6)
    b.quadraticCurveTo(-6.8, -28.6, -3.6, -32)
    b.quadraticCurveTo(0, -33.4, 3.6, -32)
    b.quadraticCurveTo(6.6, -28.4, 5.8, -20.8)
    b.quadraticCurveTo(0, -19.4, -6, -20.6)
    b.closePath()
  }
  const straw = b.createLinearGradient(-6, 0, 6, 0)
  straw.addColorStop(0, mix(BONE[3], SPECTRE[3], 0.35))
  straw.addColorStop(0.6, mix(BONE[2], SPECTRE[2], 0.45))
  straw.addColorStop(1, mix(BONE[1], SPECTRE[1], 0.5))
  hat()
  inked(b, straw, 1.1)
  b.save()
  hat()
  b.clip()
  b.strokeStyle = rgba(SPECTRE[0], 0.55)
  b.lineWidth = 0.4
  for (let i = 0; i < 9; i++) {
    const y = -32.4 + i * 1.4
    b.beginPath()
    b.moveTo(-7, y + 0.4)
    b.quadraticCurveTo(0, y - 0.6, 7, y + 0.4)
    b.stroke()
  }
  b.strokeStyle = rgba(SPECTRE[4], 0.35)
  for (let i = 0; i < 8; i++) {
    const y = -31.7 + i * 1.4
    for (let j = 0; j < 8; j++) {
      const x = -5.6 + j * 1.6 + (i % 2) * 0.8
      b.beginPath()
      b.moveTo(x, y)
      b.lineTo(x + 0.6, y + 0.5)
      b.stroke()
    }
  }
  // Mesh slit and the cold eyes behind it.
  b.fillStyle = rgba('#031019', 0.9)
  b.fillRect(-7, -27.2, 4.6, 1.8)
  b.fillStyle = SPECTRE[4]
  b.fillRect(-5.2, -26.7, 0.7, 0.6)
  b.fillRect(-3.6, -26.7, 0.6, 0.6)
  b.restore()
  b.strokeStyle = rgba(SPECTRE[4], 0.8)
  b.lineWidth = 0.6
  b.beginPath()
  b.moveTo(-5.4, -24)
  b.quadraticCurveTo(-5.6, -29.4, -2.8, -31.6)
  b.stroke()
}

function drawMonk(g: G, f: FoeArtFoe, tick: number) {
  const face = f.face ?? (Math.sign(f.vx) || -1)
  const chant = f.phase === 'aim'
  const frame = Math.floor(f.t / 8) % MONK_FRAMES
  const x = snap(g, f.x)
  const y = snap(g, f.y)
  const alpha = 0.88 + Math.sin(tick / 13) * 0.06
  glow(g, x, y - 16, 17, SPECTRE[2], 0.2)
  foeSprite(
    g,
    `monk-${chant ? 'chant' : 'float'}-${frame}`,
    x,
    y,
    MONK,
    face,
    (b) => paintMonk(b, frame, chant),
    alpha,
  )
  // Motes shed from the hem.
  for (let i = 0; i < 3; i++) {
    const p = ((f.t * 0.5 + i * 11) % 30) / 30
    puff(
      g,
      x + Math.sin(i * 2.1 + p * 4) * 4,
      y - 2 + p * 9,
      0.7,
      SPECTRE[3],
      (1 - p) * 0.7,
    )
  }
  if (chant) {
    // The chant: light gathering where the orb will form, a ring closing on it.
    const p = 1 - Math.max(0, Math.min(1, (f.timer ?? 0) / 36))
    const ox = x
    const oy = y - 14
    glow(g, ox, oy, 8 + p * 10, SPECTRE[3], 0.4 + p * 0.4)
    g.strokeStyle = rgba(SPECTRE[4], 0.4 + p * 0.5)
    g.lineWidth = 0.8
    g.beginPath()
    g.arc(ox, oy, 3 + (1 - p) * 11, 0, TAU)
    g.stroke()
    for (let i = 0; i < 3; i++) {
      const a = tick / 7 + (i * TAU) / 3
      const r = 4 + (1 - p) * 8
      puff(
        g,
        ox + Math.cos(a) * r,
        oy + Math.sin(a) * r * 0.7,
        0.8,
        SPECTRE[4],
        0.9,
      )
    }
    puff(g, ox, oy, 1 + p * 2, SPECTRE[4], 0.5 + p * 0.5)
    const hx = sideX(x, face, -7.6)
    glow(g, hx, y - 24, 5, SPECTRE[4], 0.5)
  }
}

// --- the grave ghoul -------------------------------------------------------------------------

const GHOUL: Box = { w: 40, h: 36, ay: 31 }
const GHOUL_FRAMES = 4

function paintGhoul(b: G, windup: boolean, frame: number) {
  const ph = (frame / GHOUL_FRAMES) * TAU
  const br = windup ? -0.6 : Math.sin(ph) * 0.5
  const gnaw = windup ? 0 : Math.max(0, Math.sin(ph * 2)) * 0.6
  // Far leg and far arm, knuckles down.
  limb(b, [4.6, -8, 7.6, -3.6, 6.4, -0.4, 4.6, -0.4], 2.1, ASH[1])
  limb(b, [0.4, -14 + br, -3, -8, -6.4, -0.8], 2, ASH[1])
  for (const dx of [-1.2, 0, 1.2])
    seg(b, -6.4, -0.8, -7.6 + dx * 0.6, 0, 0.5, BONE[2], null)
  // Hunched torso, spine knobs, starved ribs.
  blob(b, [
    -4.2,
    -14.8 + br,
    -1,
    -19 + br,
    3.6,
    -18.6 + br,
    6.8,
    -14.6,
    6.6,
    -9.4,
    3.6,
    -6.6,
    -0.6,
    -7.6,
    -3.6,
    -10.6,
  ])
  inked(b, ASH[2], 1.1)
  b.fillStyle = ASH[1]
  blob(b, [-2.6, -10.4, 0.4, -8, 4, -7.4, 6, -9.6, 3, -10.6, -0.6, -11.6])
  b.fill()
  b.strokeStyle = ASH[4]
  b.lineWidth = 0.55
  b.beginPath()
  b.moveTo(-2.6, -16.6 + br)
  b.quadraticCurveTo(0.6, -19.4 + br, 4.4, -18.2 + br)
  b.stroke()
  b.strokeStyle = ASH[0]
  b.lineWidth = 0.5
  for (let i = 0; i < 3; i++) {
    b.beginPath()
    b.moveTo(0.6 + i * 1.6, -15.4 + br * 0.5)
    b.quadraticCurveTo(-0.6 + i * 1.6, -12.6, 0.4 + i * 1.5, -10.2)
    b.stroke()
  }
  b.fillStyle = BONE[2]
  for (let i = 0; i < 5; i++) {
    const u = i / 4
    b.beginPath()
    b.arc(
      -1.4 + u * 7,
      -19.2 + br + Math.sin(u * Math.PI) * -0.4 + u * 3.2,
      0.6,
      0,
      TAU,
    )
    b.fill()
  }
  // Burial rag at the hips.
  poly(b, [2, -8.8, 7.2, -9.6, 7.8, -5, 6, -3.2, 4.8, -5.6, 3, -3.4, 2.2, -6])
  inked(b, PLUM[2], 0.9)
  b.fillStyle = PLUM[3]
  poly(b, [2.4, -8.6, 5, -9, 4.6, -7.4, 2.6, -7])
  b.fill()
  // Near leg, squatting.
  limb(b, [3, -7.6, -1.4, -4.4, 1.6, -0.5, -0.8, -0.5], 2.4, ASH[2])
  b.fillStyle = ASH[4]
  b.beginPath()
  b.arc(-1.4, -4.6, 0.7, 0, TAU)
  b.fill()
  // Head: long bald skull thrust forward, a pointed ear, ember eye.
  b.save()
  b.translate(-5.6, -13.6 + br * 0.6)
  b.rotate(windup ? -0.32 : gnaw * 0.08)
  b.translate(5.6, 13.6)
  poly(b, [-4.4, -16.2, -1.2, -19, -3.2, -14.6])
  inked(b, ASH[2], 0.9)
  blob(
    b,
    [
      -3, -16.8, -6, -17.4, -8.8, -15.8, -9.8, -13.4, -9, -11.6, -6.2, -11,
      -3.4, -12, -2.4, -14.4,
    ],
  )
  inked(b, ASH[3], 1.1)
  b.fillStyle = ASH[4]
  blob(b, [-4.4, -16.6, -6.6, -16.8, -8, -15.6, -6, -15.6])
  b.fill()
  b.fillStyle = ASH[2]
  blob(b, [-9.2, -12.4, -6.6, -11.4, -3.6, -12.4, -6, -12.8])
  b.fill()
  // Brow and the ember eye.
  b.fillStyle = '#120a14'
  ellipsePath(b, -7.2, -14.6, 1.2, 0.85, -0.2)
  b.fill()
  b.fillStyle = AMBER[3]
  ellipsePath(b, -7.4, -14.6, 0.65, 0.5)
  b.fill()
  b.strokeStyle = ASH[0]
  b.lineWidth = 0.6
  b.beginPath()
  b.moveTo(-8.8, -15.6)
  b.lineTo(-5.8, -15.6)
  b.stroke()
  // Jaw: gnawing, or agape in a snarl.
  if (windup) {
    poly(b, [-9.6, -12, -6.4, -11.2, -7.8, -9])
    b.fillStyle = CRIMSON[0]
    b.fill()
    poly(b, [-9.8, -11.6, -6.6, -11, -6.2, -9.6, -8.6, -8.6])
    b.lineWidth = 0.7
    b.strokeStyle = INK
    b.stroke()
  }
  b.fillStyle = BONE[4]
  for (let i = 0; i < 3; i++) {
    poly(b, [-9.4 + i * 1.1, -12.1, -9 + i * 1.1, -11.1, -8.6 + i * 1.1, -12.1])
    b.fill()
  }
  b.restore()
  // Near arm: the bone at its teeth, or raised back to throw.
  if (windup) {
    limb(b, [-1.2, -14.4, 2.2, -19.4, 1.4, -23.4], 2.1, ASH[2])
    boneClub(b, -1.4, -26.4, 3.6, -21.6)
    b.fillStyle = ASH[3]
    b.beginPath()
    b.arc(1.4, -23.6, 1.1, 0, TAU)
    b.fill()
  } else {
    limb(b, [-1.6, -13.6 + br, -4.4, -8.6, -8.2, -11.2 + gnaw], 2.1, ASH[2])
    boneClub(b, -11.6, -12.6 + gnaw, -7, -10.6 + gnaw)
    b.fillStyle = ASH[3]
    b.beginPath()
    b.arc(-8.4, -11.2 + gnaw, 1.1, 0, TAU)
    b.fill()
  }
}

function drawGhoul(g: G, f: FoeArtFoe, tick: number) {
  const face = f.face ?? (Math.sign(f.vx) || -1)
  const timer = f.timer ?? 99
  const windup = f.phase === 'aim' || (timer > 0 && timer <= 16)
  const frame = windup ? 0 : Math.floor(f.t / 9) % GHOUL_FRAMES
  const x = snap(g, f.x)
  const y = snap(g, f.y)
  groundShadow(g, x + (face > 0 ? -1 : 1), y, 10)
  foeSprite(g, `ghoul-${windup ? 'windup' : frame}`, x, y, GHOUL, face, (b) =>
    paintGhoul(b, windup, frame),
  )
  const ex = sideX(x, face, windup ? -7.8 : -7.4)
  const ey = y - (windup ? 15.6 : 14.6)
  glow(g, ex, ey, windup ? 5 : 2.6, AMBER[2], windup ? 0.8 : 0.4)
  if (windup) {
    const bx = sideX(x, face, 1.2)
    glow(g, bx, y - 24, 6 + Math.sin(tick / 2) * 1.5, BONE[3], 0.35)
  }
}

// --- the drowned -----------------------------------------------------------------------------

const DROWNED: Box = { w: 40, h: 46, ay: 38 }
const DROWNED_FRAMES = 6

function paintDrowned(b: G, frame: number) {
  const ph = (frame / DROWNED_FRAMES) * TAU
  const bob = -Math.abs(Math.sin(ph)) * 0.6
  const sway = Math.sin(ph + 1) * 0.8
  const reach = Math.sin(ph) * 0.6
  b.translate(0, bob)
  const ground = -bob
  // Far arm reaching, behind everything.
  limb(b, [0.4, -19.4, -4, -18.6, -8.8, -19.6 + reach], 1.9, BLOAT[1])
  limb(b, [0.4, -19.4, -3, -18.8], 2.6, RAG[1])
  for (const d of [-1, 0, 1])
    seg(
      b,
      -8.8,
      -19.6 + reach,
      -10,
      -18.4 + reach + d * 0.8,
      0.45,
      BLOAT[2],
      null,
    )
  // Long hair hanging down its back, weed tangled in it.
  poly(b, [
    -1.6,
    -26.6,
    1.4,
    -26,
    2.8,
    -22,
    3.4 + sway * 0.4,
    -15.6,
    1.6,
    -17,
    0.6,
    -15.2,
    -0.4,
    -19,
  ])
  inked(b, '#0d1416', 0.9)
  b.strokeStyle = WEED[2]
  b.lineWidth = 0.8
  b.beginPath()
  b.moveTo(0.6, -25.6)
  b.quadraticCurveTo(3, -21, 2.6 + sway, -13.6)
  b.stroke()
  // Legs: torn trousers to the knee, bare grey-teal shins, splayed feet.
  const leg = (a: number, lift: number, near: boolean) => {
    const p = joint2(0.8, -10.6, a, 5.2, a - lift, 5.2)
    p[5] = Math.min(ground - 0.5, p[5])
    limb(b, p.slice(2), near ? 1.8 : 1.6, near ? BLOAT[2] : BLOAT[1])
    limb(
      b,
      [p[4], p[5], p[4] - 2.2, p[5] + 0.3],
      1.3,
      near ? BLOAT[2] : BLOAT[1],
    )
    limb(b, p.slice(0, 4), near ? 3.2 : 2.8, near ? RAG[2] : RAG[1])
    poly(b, [
      p[2] - 1.6,
      p[3] - 0.4,
      p[2] + 1.6,
      p[3] - 0.4,
      p[2] + 0.8,
      p[3] + 1.4,
      p[2],
      p[3] + 0.4,
      p[2] - 0.8,
      p[3] + 1.2,
    ])
    b.fillStyle = near ? RAG[2] : RAG[1]
    b.fill()
  }
  leg(0.34 * Math.sin(ph + Math.PI), Math.max(0, -Math.cos(ph)) * 0.5, false)
  leg(0.34 * Math.sin(ph), Math.max(0, Math.cos(ph)) * 0.5, true)
  // Torso, hunched forward: grey-teal skin under a torn indigo shirt, the bloated belly showing.
  const torso = [
    2.2, -21.8, 4, -20.4, 4.4, -15, 3.4, -10, -1.6, -10.2, -3.8, -13, -4.4,
    -17.2, -3.2, -20.6, -1, -21.8,
  ]
  blob(b, torso)
  inked(b, BLOAT[2], 1.1)
  b.fillStyle = BLOAT[3]
  blob(b, [-3.6, -14.4, -1.6, -11.2, 1, -11.6, -0.6, -14])
  b.fill()
  poly(
    b,
    [
      -3.8, -20.4, -1, -22, 2.2, -22, 4.2, -20.2, 4.6, -15.4, 3.4, -13.8, 2.4,
      -15.6, 1.2, -13.4, -0.2, -15.4, -1.8, -14.2, -2.6, -16.2, -4.4, -15.8,
      -4.6, -18.4,
    ],
  )
  inked(b, RAG[2], 0.9)
  b.fillStyle = RAG[3]
  poly(b, [-3.6, -20, -1.2, -21.4, -2.2, -17.6, -4, -17.2])
  b.fill()
  b.strokeStyle = RAG[0]
  b.lineWidth = 0.5
  b.beginPath()
  b.moveTo(1.4, -21.4)
  b.lineTo(0.6, -16.2)
  b.stroke()
  // Weed slung over the shoulder, dripping leaves.
  b.beginPath()
  b.moveTo(-3.4, -20.6)
  b.quadraticCurveTo(0.4, -23.2, 3.6, -20.4)
  b.quadraticCurveTo(5, -16, 4.4 + sway, -11.6)
  b.lineWidth = 1.5
  b.strokeStyle = INK
  b.stroke()
  b.lineWidth = 1
  b.strokeStyle = WEED[2]
  b.stroke()
  b.fillStyle = WEED[3]
  for (const [lx, ly, a] of [
    [-1.8, -21.6, -0.4],
    [3.8, -19, 1.2],
    [4.6 + sway, -13.6, 1.5],
  ] as const) {
    ellipsePath(b, lx, ly, 1.3, 0.55, a)
    b.fill()
  }
  // The head, hung low and forward: a bloated grey-teal face, a slack black mouth, one
  // drowned-pale eye under a hank of wet hair.
  blob(
    b,
    [
      -1.4, -26.4, -4.6, -26.8, -6.8, -24.8, -7, -22.2, -5.8, -20.2, -3.2,
      -19.8, -1, -21.2, -0.4, -23.8,
    ],
  )
  inked(b, BLOAT[3], 1.1)
  b.fillStyle = BLOAT[2]
  blob(b, [-6.6, -22, -5.4, -20.4, -2.8, -20.2, -1.2, -21.8, -3.6, -22.4])
  b.fill()
  b.fillStyle = BLOAT[4]
  blob(b, [-2.2, -26, -4.6, -26.2, -3.4, -25])
  b.fill()
  b.fillStyle = '#071416'
  ellipsePath(b, -5.4, -23.4, 1, 0.9)
  b.fill()
  ellipsePath(b, -6, -20.8, 0.8, 1)
  b.fill()
  b.fillStyle = SPECTRE[4]
  b.fillRect(-5.8, -23.7, 0.7, 0.7)
  // Wet hair plastered over the crown, strands falling across the brow.
  blob(
    b,
    [
      -0.4, -24.4, -1.4, -27, -4.4, -27.4, -6.8, -25.8, -5.6, -25.2, -3.6,
      -25.8, -1.6, -24.4,
    ],
  )
  inked(b, '#0d1416', 0.8)
  b.lineCap = 'round'
  for (const [x0, x1, y1] of [
    [-6, -7, -22.6],
    [-4.6, -4.4, -22.4],
    [-2.4, -1.6, -21.2],
  ] as const) {
    b.beginPath()
    b.moveTo(x0, -25.8)
    b.quadraticCurveTo(x0 - 0.6, -24, x1 + sway * 0.2, y1)
    b.lineWidth = 0.7
    b.strokeStyle = '#0d1416'
    b.stroke()
  }
  // Near arm reaching, fingers dangling, weed wound at the wrist.
  limb(b, [-2.4, -19.4, -6.4, -17.8, -10.6, -17 - reach], 2.2, BLOAT[2])
  limb(b, [-2.4, -19.4, -5, -18.2], 2.9, RAG[2])
  for (const d of [-1, 0, 1])
    seg(
      b,
      -10.6,
      -17 - reach,
      -12,
      -15.6 - reach + d * 0.9,
      0.5,
      BLOAT[3],
      null,
    )
  b.strokeStyle = WEED[3]
  b.lineWidth = 0.6
  b.beginPath()
  b.moveTo(-7.6, -18.2)
  b.lineTo(-8.4, -16.4)
  b.quadraticCurveTo(-8.8, -14, -7.8 + sway * 0.4, -12.6)
  b.stroke()
}

/** Water breaking open where the drowned haul themselves up. */
function drawSplash(g: G, x: number, groundY: number, t: number) {
  g.fillStyle = rgba('#06161c', 0.85)
  ellipsePath(g, x, groundY, 10, 2)
  g.fill()
  g.strokeStyle = rgba(SPECTRE[3], 0.7)
  g.lineWidth = 0.6
  for (let i = 0; i < 2; i++) {
    const p = ((t * 0.8 + i * 14) % 28) / 28
    g.globalAlpha = 1 - p
    ellipsePath(g, x, groundY, 6 + p * 8, 1.2 + p * 1.6)
    g.stroke()
  }
  g.globalAlpha = 1
  for (let i = 0; i < 5; i++) {
    const p = ((t * 1.1 + i * 7) % 22) / 22
    const dir = i % 2 ? 1 : -1
    const dx = dir * (2 + hash(i + 11) * 5) * p * 1.8
    const dy = -12 * p + 14 * p * p
    puff(
      g,
      x + dx,
      groundY - 1 + dy,
      0.8,
      i % 2 ? SPECTRE[3] : SPECTRE[4],
      1 - p,
    )
  }
}

function drawDrowned(g: G, f: FoeArtFoe, tick: number) {
  const face = f.face ?? (Math.sign(f.vx) || -1)
  const rising = f.phase === 'rise'
  const frame = rising ? 0 : Math.floor(f.t / 8) % DROWNED_FRAMES
  const x = snap(g, f.x)
  const y = snap(g, f.y)
  const ground = rising ? f.baseY : f.y
  g.save()
  g.fillStyle = rgba(SPECTRE[1], 0.3)
  ellipsePath(g, x, ground, 10, 1.8)
  g.fill()
  g.restore()
  if (rising) drawSplash(g, x, ground, f.t)
  g.save()
  g.beginPath()
  g.rect(x - 24, y - 50, 48, ground + 0.5 - (y - 50))
  g.clip()
  glow(g, x, y - 14, 15, SPECTRE[1], 0.18)
  foeSprite(g, `drowned-${frame}`, x, y, DROWNED, face, (b) =>
    paintDrowned(b, frame),
  )
  g.restore()
  // The pale eye, and water streaming off its arms.
  glow(
    g,
    sideX(x, face, -5.4),
    y - 23.4,
    2.4,
    SPECTRE[3],
    0.55 + Math.sin(tick / 9) * 0.1,
  )
  if (!rising) {
    for (let i = 0; i < 3; i++) {
      const p = ((f.t * 0.9 + i * 9) % 24) / 24
      const lx = i === 2 ? 4.6 : -10.8 - i * 1.2
      const ly = i === 2 ? -11.6 : -16
      g.fillStyle = rgba(SPECTRE[3], 1 - p)
      g.fillRect(
        sideX(x, face, lx) - 0.4,
        y + ly + p * (Math.abs(ly) - 1),
        0.8,
        1.2,
      )
    }
  }
}

// --- the river leech -------------------------------------------------------------------------

const LEECH: Box = { w: 32, h: 26, ay: 19 }
const LEECH_FRAMES = 4
type LeechPose = 'crawl' | 'squash' | 'leap' | 'fall'

/** The leech's centreline (head first), as [x, y, radius] samples. */
function leechSpine(
  pose: LeechPose,
  frame: number,
): Array<[number, number, number]> {
  const out: Array<[number, number, number]> = []
  const ph = (frame / LEECH_FRAMES) * TAU
  const n = 12
  for (let i = 0; i < n; i++) {
    const u = i / (n - 1)
    // Thin sucking head, fat gut, a rounded tail.
    const fat = 1.1 + 1.7 * Math.pow(Math.sin(Math.PI * u), 0.75) + 0.7 * u
    if (pose === 'crawl' || pose === 'squash') {
      const arch = pose === 'squash' ? 0.3 : 0.9 + Math.sin(ph) * 0.9
      const len = pose === 'squash' ? 13 : 16 - Math.sin(ph) * 1.8
      const r = fat * (pose === 'squash' ? 1.15 : 1)
      out.push([-len / 2 + u * len, -r - Math.sin(u * Math.PI) * arch, r])
    } else if (pose === 'leap') {
      // Stretched out along the hop, head up and forward.
      out.push([
        -7 + u * 14,
        -11 + u * 8.4 - Math.sin(u * Math.PI) * 1.4,
        fat * 0.85,
      ])
    } else {
      // Coming down: curled, head dipping to bite.
      const a = Math.PI * (0.15 + u * 0.8)
      out.push([
        -Math.cos(a) * 7,
        -4.6 - Math.sin(a) * 3.6 + (1 - u) * 1.6,
        fat * 0.95,
      ])
    }
  }
  return out
}

function paintLeech(b: G, pose: LeechPose, frame: number) {
  const s = leechSpine(pose, frame)
  const at = (i: number) =>
    s[Math.max(0, Math.min(s.length - 1, i))] ?? [0, 0, 1]
  /** Point i pushed off the centreline by k radii (+ toward its back). */
  const off = (i: number, k: number): [number, number] => {
    const [x, y, r] = at(i)
    const [x0, y0] = at(i - 1)
    const [x1, y1] = at(i + 1)
    const d = Math.hypot(x1 - x0, y1 - y0) || 1
    return [x + ((y1 - y0) / d) * r * k, y - ((x1 - x0) / d) * r * k]
  }
  const edge = (k: number) => {
    const pts: number[] = []
    for (let i = 0; i < s.length; i++) pts.push(...off(i, k))
    return pts
  }
  const reverse = (pts: number[]) => {
    const out: number[] = []
    for (let i = pts.length - 2; i >= 0; i -= 2)
      out.push(pts[i] ?? 0, pts[i + 1] ?? 0)
    return out
  }
  const back = edge(1)
  const belly = edge(-1)
  const body = () => {
    poly(b, [...back, ...reverse(belly)])
  }
  // Body: wet plum-black back, a duller belly, a moonlit rim.
  body()
  inked(b, LEECH_SKIN[2], 1.2)
  b.save()
  body()
  b.clip()
  poly(b, [...edge(-0.15), ...reverse(edge(-1.4))])
  b.fillStyle = LEECH_SKIN[3]
  b.fill()
  // Segment rings across the back.
  b.strokeStyle = LEECH_SKIN[1]
  b.lineWidth = 0.45
  for (let i = 1; i < s.length - 1; i++) {
    const [ax, ay] = off(i, 1.2)
    const [bx, by] = off(i, -0.1)
    b.beginPath()
    b.moveTo(ax, ay)
    b.lineTo(bx, by)
    b.stroke()
  }
  b.restore()
  // Two rows of rust-amber spots down the back.
  for (const k of [0.6, 0.15]) {
    for (let i = 2; i < s.length - 1; i += 2) {
      const [x, y] = off(i + (k > 0.5 ? 0 : 1), k)
      b.fillStyle = k > 0.5 ? AMBER[2] : RUST[2]
      ellipsePath(b, x, y, 0.65, 0.5)
      b.fill()
    }
  }
  // Wet gloss along the back.
  b.strokeStyle = LEECH_SKIN[4]
  b.lineWidth = 0.5
  b.beginPath()
  for (let i = 1; i < 8; i++) {
    const [x, y] = off(i, 0.86)
    if (i === 1) b.moveTo(x, y)
    else b.lineTo(x, y)
  }
  b.stroke()
  // The sucker mouth: a crimson ring of teeth at the head; a tail disc.
  const [hx, hy, hr] = at(0)
  const [ax, ay] = at(1)
  const ha = Math.atan2(hy - ay, hx - ax)
  const mx = hx + Math.cos(ha) * 0.8
  const my = hy + Math.sin(ha) * 0.8
  ellipsePath(b, mx, my, hr * 0.8, hr * 1.25, ha)
  inked(b, LEECH_SKIN[3], 0.9)
  b.fillStyle = CRIMSON[1]
  ellipsePath(
    b,
    mx + Math.cos(ha) * 0.3,
    my + Math.sin(ha) * 0.3,
    hr * 0.45,
    hr * 0.85,
    ha,
  )
  b.fill()
  b.fillStyle = BONE[4]
  for (let i = 0; i < 3; i++) {
    const a = ha + Math.PI / 2 + ((i + 0.5) / 3) * Math.PI
    b.fillRect(
      mx + Math.cos(a) * hr * 0.55 - 0.2,
      my + Math.sin(a) * hr * 0.9 - 0.2,
      0.45,
      0.45,
    )
  }
  const [tx, ty, tr] = at(s.length - 1)
  const [px, py] = at(s.length - 2)
  const ta = Math.atan2(ty - py, tx - px)
  ellipsePath(
    b,
    tx + Math.cos(ta) * 0.6,
    ty + Math.sin(ta) * 0.6,
    tr * 0.55,
    tr * 1.05,
    ta,
  )
  inked(b, LEECH_SKIN[3], 0.9)
  // Moonlit rim along the back.
  b.strokeStyle = rgba(LEECH_SKIN[4], 0.8)
  b.lineWidth = 0.4
  b.beginPath()
  for (let i = 0; i < s.length; i++) {
    const [x, y] = off(i, 1)
    if (i === 0) b.moveTo(x, y)
    else b.lineTo(x, y)
  }
  b.stroke()
}

function drawLeech(g: G, f: FoeArtFoe, tick: number) {
  const face = f.face ?? (Math.sign(f.vx) || -1)
  const air = Math.abs(f.vy) > 0.01
  const pose: LeechPose = air
    ? f.vy < 0
      ? 'leap'
      : 'fall'
    : (f.timer ?? 99) <= 7 || f.phase === 'aim'
      ? 'squash'
      : 'crawl'
  const frame = pose === 'crawl' ? Math.floor(f.t / 7) % LEECH_FRAMES : 0
  const x = snap(g, f.x)
  const y = snap(g, f.y)
  if (!air) groundShadow(g, x, y, 8, 0.4)
  foeSprite(g, `leech-${pose}-${frame}`, x, y, LEECH, face, (b) =>
    paintLeech(b, pose, frame),
  )
  // A wet glint sliding along its back.
  const c = (tick + Math.floor(f.x * 3)) % 60
  if (c < 8 && !air)
    twinkle(g, sideX(x, face, -3 + c * 0.8), y - 7, 1.4, LEECH_SKIN[4])
}

// --- the storm harpy -------------------------------------------------------------------------

const HARPY: Box = { w: 60, h: 56, ay: 34 }
const HARPY_FRAMES = 4
type HarpyPose = 'fly' | 'screech' | 'dive'

function paintHarpyBundle(b: G) {
  b.save()
  b.translate(0.6, 8.8)
  blob(
    b,
    [
      -3.2, -1, -1.8, -2.6, 0.8, -2.4, 3.2, -2.6, 4.2, -0.4, 3.6, 2.6, 0.6, 3.6,
      -2.6, 2.6,
    ],
  )
  inked(b, RUST[1], 1)
  b.fillStyle = RUST[2]
  blob(b, [-2.4, -1, -0.8, -2, 1.8, -1.8, 1.2, 0.4, -1.6, 0.8])
  b.fill()
  poly(b, [-0.6, -2.4, -1.6, -4.4, 0.6, -3.2, 2.2, -4.6, 2, -2.4])
  inked(b, RUST[2], 0.8)
  b.fillStyle = AMBER[3]
  b.fillRect(1.8, 0.4, 1.1, 1.1)
  b.fillStyle = AMBER[4]
  b.fillRect(2.1, 0.6, 0.45, 0.45)
  b.restore()
}

function paintHarpy(b: G, pose: HarpyPose, frame: number, carrying: boolean) {
  const flap = [-1.15, -0.35, 0.95, -0.35][frame] ?? 0
  // The screech throws both wings up into a wide V; the dive folds them back.
  const nearA = pose === 'screech' ? -0.95 : pose === 'dive' ? 0.18 : flap
  const farA = pose === 'screech' ? -2.2 : pose === 'dive' ? 0.4 : flap - 0.45
  const hairSway =
    pose === 'dive'
      ? 1.6
      : pose === 'screech'
        ? -1.4
        : Math.sin((frame / HARPY_FRAMES) * TAU) * 0.8
  const wing = (a: number, near: boolean) => {
    b.save()
    b.translate(near ? 1.4 : 2.8, near ? -13.4 : -14.2)
    b.scale(1.7, 1.7)
    crowWing(
      b,
      a,
      near
        ? FEATHER
        : [FEATHER[0], FEATHER[0], FEATHER[1], FEATHER[2], FEATHER[3]],
      near,
    )
    b.restore()
  }
  wing(farA, false)
  // Storm-black hair streaming back.
  blob(b, [
    -4,
    -21,
    -1,
    -22.4,
    3.4,
    -21.2,
    8 + hairSway,
    -19.6,
    11.6 + hairSway * 1.4,
    -16 + hairSway,
    8.4 + hairSway,
    -15.4,
    10 + hairSway * 1.2,
    -12.2 + hairSway,
    5.6,
    -13.4,
    1.6,
    -15,
    -0.6,
    -18,
  ])
  inked(b, HAIR[1], 1)
  b.strokeStyle = HAIR[3]
  b.lineWidth = 0.45
  for (let i = 0; i < 3; i++) {
    b.beginPath()
    b.moveTo(-1 + i * 1.2, -21.4 + i * 0.6)
    b.quadraticCurveTo(
      4 + i,
      -20 + i,
      9 + hairSway + i * 0.4,
      -17 + hairSway + i * 1.4,
    )
    b.stroke()
  }
  // Tail fan.
  poly(
    b,
    [
      2.4, -5.6, 9.4, -6.8, 11.6, -4.6, 9.8, -3.6, 11.2, -1.6, 8.6, -1.2, 2.6,
      -3,
    ],
  )
  inked(b, FEATHER[1], 1)
  b.strokeStyle = FEATHER[3]
  b.lineWidth = 0.4
  b.beginPath()
  b.moveTo(3.4, -5)
  b.lineTo(10.6, -5.2)
  b.stroke()
  // Legs: feathered thighs, scaled shanks, talons (gripping a bundle when carrying).
  const legs: Array<[number, number, number, number]> =
    pose === 'dive'
      ? [
          [0.2, -4.6, -4.4, 0.4],
          [1.8, -4.4, -3, 1.4],
        ]
      : [
          [0, -4.6, -0.6, 2.6],
          [1.8, -4.4, 1.6, 2.8],
        ]
  for (const [lx, ly, fx, fy] of legs) {
    limb(b, [lx, ly, (lx + fx) / 2 + 0.4, (ly + fy) / 2], 2.2, FEATHER[2])
    limb(b, [(lx + fx) / 2 + 0.4, (ly + fy) / 2, fx, fy], 0.9, '#4a4258')
    for (const [dx, dy] of [
      [-1.4, 0.8],
      [-0.2, 1.3],
      [1, 0.9],
    ] as const) {
      b.beginPath()
      b.moveTo(fx, fy)
      b.quadraticCurveTo(fx + dx, fy + dy * 0.4, fx + dx * 0.9, fy + dy)
      b.lineWidth = 0.9
      b.strokeStyle = INK
      b.stroke()
      b.lineWidth = 0.45
      b.strokeStyle = BONE[3]
      b.stroke()
    }
  }
  if (carrying) {
    b.save()
    if (pose === 'dive') b.translate(-4.4, -5.6)
    paintHarpyBundle(b)
    b.restore()
  }
  // Body: a feathered bodice, pale skin at the throat.
  blob(
    b,
    [
      -3, -15, 0.6, -15.8, 3.8, -13.2, 4.2, -7.6, 2.8, -3.4, -0.4, -2.8, -2.6,
      -6.4, -3.8, -10.8,
    ],
  )
  inked(b, FEATHER[2], 1.1)
  poly(b, [-3.2, -14.6, -0.6, -15.6, 0, -12.4, -2.8, -11.4])
  b.fillStyle = SKIN[3]
  b.fill()
  b.strokeStyle = FEATHER[3]
  b.lineWidth = 0.45
  for (let r = 0; r < 3; r++) {
    for (let i = 0; i < 3; i++) {
      b.beginPath()
      b.arc(
        -1.6 + i * 1.8 + (r % 2) * 0.9,
        -10 + r * 2.2,
        0.9,
        0.2,
        Math.PI - 0.2,
      )
      b.stroke()
    }
  }
  b.strokeStyle = FEATHER[4]
  b.lineWidth = 0.5
  b.beginPath()
  b.moveTo(0.8, -15.6)
  b.quadraticCurveTo(3.4, -14, 4, -9)
  b.stroke()
  // Head: a gaunt woman's face with a crow's hooked beak-nose, gold storm-eye.
  b.save()
  if (pose === 'screech') {
    b.translate(-2, -16)
    b.rotate(0.22)
    b.translate(2, 16)
  }
  blob(
    b,
    [
      -0.6, -20.6, -3.2, -20.8, -5, -19, -5.4, -17.4, -4.8, -15.6, -3, -14.6,
      -1, -15.4, 0, -18,
    ],
  )
  inked(b, SKIN[3], 1.1)
  b.fillStyle = SKIN[2]
  blob(b, [-1, -15.4, -3, -14.8, -2.2, -17, -0.2, -17.6])
  b.fill()
  b.fillStyle = SKIN[4]
  blob(b, [-2.6, -20.4, -4.4, -19.2, -3.6, -18.6, -2, -19.6])
  b.fill()
  poly(b, [-5, -18.4, -7.4, -17, -5.2, -16.6])
  inked(b, '#3a3644', 0.8)
  b.fillStyle = '#ffd75e'
  ellipsePath(b, -3.6, -18.4, 0.8, 0.55)
  b.fill()
  b.fillStyle = INK
  b.fillRect(-3.95, -18.65, 0.5, 0.5)
  b.strokeStyle = HAIR[0]
  b.lineWidth = 0.5
  b.beginPath()
  b.moveTo(-4.8, -19.4)
  b.lineTo(-2.4, -19.2)
  b.stroke()
  if (pose === 'screech') {
    ellipsePath(b, -4.4, -15.4, 1.1, 1.4)
    b.fillStyle = CRIMSON[0]
    b.fill()
    b.lineWidth = 0.5
    b.strokeStyle = INK
    b.stroke()
    b.fillStyle = BONE[4]
    b.fillRect(-4.9, -16.6, 0.4, 0.5)
    b.fillRect(-4.1, -16.6, 0.4, 0.5)
  } else {
    b.strokeStyle = SKIN[0]
    b.lineWidth = 0.4
    b.beginPath()
    b.moveTo(-4.8, -15.8)
    b.lineTo(-3.4, -15.6)
    b.stroke()
  }
  // Crown of crow quills.
  poly(
    b,
    [
      -2.4, -20.6, -3.4, -23.4, -1.4, -21.4, -0.4, -24, 0.2, -21, 1.8, -22.6, 1,
      -19.8,
    ],
  )
  inked(b, FEATHER[3], 0.8)
  b.restore()
  wing(nearA, true)
}

function drawHarpy(g: G, f: FoeArtFoe, tick: number) {
  const face = f.face ?? (Math.sign(f.vx) || -1)
  const pose: HarpyPose =
    f.phase === 'aim' ? 'screech' : f.phase === 'dive' ? 'dive' : 'fly'
  const rate = f.phase === 'rest' ? 3 : 5
  const frame = pose === 'fly' ? Math.floor(f.t / rate) % HARPY_FRAMES : 0
  const x = snap(g, f.x)
  const y = snap(g, f.y)
  const key = `harpy-${pose}-${frame}-${f.carrying ? 'bundle' : 'bare'}`
  const paint = (b: G) => paintHarpy(b, pose, frame, f.carrying)
  if (pose === 'dive') {
    // Stooping along its line of flight, talons first.
    const dir = Math.sign(f.vx) || face
    const ang = Math.atan2(f.vy, Math.abs(f.vx) || 0.001)
    const tilt = Math.max(-1.1, Math.min(1.1, ang)) * 0.85
    g.save()
    g.translate(x, y - 8)
    g.rotate(dir > 0 ? tilt : -tilt)
    foeSprite(g, key, 0, 8, HARPY, dir, paint)
    g.restore()
    for (let i = 1; i <= 3; i++) {
      g.strokeStyle = rgba(SKIN[4], 0.5 - i * 0.12)
      g.lineWidth = 0.6
      g.beginPath()
      g.moveTo(x - dir * (4 + i * 3), y - 14 + i * 3)
      g.lineTo(x - dir * (10 + i * 4), y - 18 + i * 3)
      g.stroke()
    }
  } else {
    foeSprite(g, key, x, y, HARPY, face, paint)
  }
  const ex = sideX(x, face, -3.6)
  if (pose === 'screech') {
    const p = 1 - Math.max(0, Math.min(1, (f.timer ?? 0) / 28))
    glow(g, ex, y - 18, 4 + p * 3, CRIMSON[3], 0.75)
    // The screech: sound rings bursting from the open beak.
    const mx = sideX(x, face, -6)
    for (let i = 0; i < 3; i++) {
      const r = 3 + ((tick * 0.6 + i * 4) % 12)
      g.strokeStyle = rgba(
        i % 2 ? SKIN[4] : CRIMSON[3],
        Math.max(0, 0.85 - r / 15),
      )
      g.lineWidth = 0.9
      g.beginPath()
      const a0 = face > 0 ? -0.8 : Math.PI - 0.8
      g.arc(mx, y - 15.5, r, a0, a0 + 1.6)
      g.stroke()
    }
  } else if (pose !== 'dive') {
    glow(g, ex, y - 18.4, 2.6, '#ffd75e', 0.4)
  }
  if (f.carrying && pose !== 'dive')
    glow(
      g,
      sideX(x, face, 1.4),
      y + 9.6,
      4.4,
      AMBER[2],
      0.3 + Math.sin(tick / 6) * 0.12,
    )
}

// --- the wind wraith -------------------------------------------------------------------------

const WRAITH: Box = { w: 64, h: 44, ay: 28 }
const WRAITH_FRAMES = 6

function paintWraith(b: G, frame: number) {
  const ph = (frame / WRAITH_FRAMES) * TAU
  // Streamers trailing behind on the gust, the far ones darker.
  const ribbon = (i: number, back: boolean) => {
    const by = -14 + i * 2.4
    const len = 22 + (i % 3) * 4
    const top: number[] = []
    const bottom: number[] = []
    for (let k = 0; k <= 10; k++) {
      const u = k / 10
      const x = -1 + u * len
      const y =
        by + Math.sin(u * 5.2 - ph + i * 1.3) * u * 3.4 + u * (i - 2) * 1.6
      const w = (2.4 - i * 0.15) * Math.pow(1 - u, 0.8) + 0.25
      top.push(x, y - w)
      bottom.unshift(x, y + w)
    }
    poly(b, [...top, ...bottom])
    if (back) {
      b.fillStyle = rgba(GALE[1], 0.75)
      b.fill()
      return
    }
    const fade = b.createLinearGradient(-1, 0, len, 0)
    fade.addColorStop(0, rgba(GALE[3], 0.95))
    fade.addColorStop(0.55, rgba(GALE[2], 0.6))
    fade.addColorStop(1, rgba(GALE[2], 0))
    b.fillStyle = fade
    b.fill()
    b.strokeStyle = rgba(GALE[4], 0.5)
    b.lineWidth = 0.35
    b.beginPath()
    for (let k = 0; k < top.length; k += 2) {
      if (k === 0) b.moveTo(top[k] ?? 0, top[k + 1] ?? 0)
      else if (k < 12) b.lineTo(top[k] ?? 0, top[k + 1] ?? 0)
    }
    b.stroke()
  }
  for (const i of [1, 3]) {
    b.save()
    b.translate(2, -1.6)
    ribbon(i, true)
    b.restore()
  }
  for (const i of [0, 2, 4]) ribbon(i, false)
  // Claw-arms raking forward under the cowl.
  const rake = Math.sin(ph) * 0.8
  for (const [sx, sy, ex, ey, c] of [
    [-3, -7, -12.4, -3 + rake, GALE[2]],
    [-4.6, -8.6, -14, -6.4 - rake, GALE[3]],
  ] as const) {
    b.beginPath()
    b.moveTo(sx, sy - 1.2)
    b.quadraticCurveTo((sx + ex) / 2, sy - 1.6, ex, ey)
    b.quadraticCurveTo((sx + ex) / 2, sy + 1, sx, sy + 1.2)
    b.closePath()
    inked(b, c, 0.9)
    for (const d of [-1, 0, 1])
      seg(b, ex, ey, ex - 2, ey + d * 1.1 + 0.6, 0.45, GALE[4], null)
  }
  // The cowl.
  blob(
    b,
    [
      -12, -12.4, -9.6, -16.8, -4.6, -17.8, 1.6, -16, 7.4, -13.2, 2.6, -9.6, 0,
      -4.8, -5, -3.6, -10, -5.6,
    ],
  )
  b.lineWidth = 2.4
  b.strokeStyle = rgba(GALE[3], 0.25)
  b.stroke()
  const cowl = b.createLinearGradient(-12, 0, 7, 0)
  cowl.addColorStop(0, rgba(GALE[3], 0.95))
  cowl.addColorStop(0.45, rgba(GALE[2], 0.9))
  cowl.addColorStop(1, rgba(GALE[1], 0.35))
  inked(b, cowl, 1)
  b.strokeStyle = rgba(GALE[1], 0.8)
  b.lineWidth = 0.5
  b.beginPath()
  b.moveTo(-4, -15.6)
  b.quadraticCurveTo(0.4, -13.4, 4.6, -13)
  b.moveTo(-4.4, -6.4)
  b.quadraticCurveTo(-1, -7.4, 1.6, -9.6)
  b.stroke()
  b.strokeStyle = GALE[4]
  b.lineWidth = 0.6
  b.beginPath()
  b.moveTo(-11, -13.6)
  b.quadraticCurveTo(-8.6, -17, -4, -17)
  b.stroke()
  // The wailing mask: hollow eyes, a long open mouth.
  blob(
    b,
    [
      -12.6, -11.4, -11.2, -14.4, -7.6, -14.8, -5.6, -12, -6, -8.2, -8.8, -5.6,
      -11.6, -6.8,
    ],
  )
  inked(b, mix(BONE[3], GALE[4], 0.55), 0.9)
  b.fillStyle = mix(BONE[2], GALE[3], 0.5)
  blob(b, [-6, -11.4, -6.2, -8.4, -8.6, -6.2, -7.4, -9])
  b.fill()
  b.fillStyle = GALE[0]
  ellipsePath(b, -10.8, -11.6, 1.05, 1.3, 0.2)
  b.fill()
  ellipsePath(b, -8.1, -11.8, 0.9, 1.2, -0.15)
  b.fill()
  ellipsePath(b, -9.6, -7.9, 0.9, 1.7)
  b.fill()
  b.fillStyle = SPECTRE[4]
  b.fillRect(-11, -11.8, 0.55, 0.55)
  b.fillRect(-8.3, -12, 0.5, 0.5)
}

function drawWraith(g: G, f: FoeArtFoe, tick: number) {
  const face = f.face ?? (Math.sign(f.vx) || -1)
  const frame = Math.floor(f.t / 4) % WRAITH_FRAMES
  const x = snap(g, f.x)
  const y = snap(g, f.y)
  glow(g, sideX(x, face, -6), y - 10, 16, GALE[3], 0.22)
  // Gust lines whipping past behind it.
  for (let i = 0; i < 3; i++) {
    const p = ((tick * 1.4 + i * 17) % 40) / 40
    const lx = -14 + p * 46
    const len = 7 + i * 2
    g.strokeStyle = rgba(GALE[4], (1 - p) * 0.55)
    g.lineWidth = 0.6
    g.beginPath()
    g.moveTo(sideX(x, face, lx), y - 18 + i * 7)
    g.lineTo(sideX(x, face, lx + len), y - 18 + i * 7 + 0.6)
    g.stroke()
  }
  foeSprite(
    g,
    `wraith-${frame}`,
    x,
    y,
    WRAITH,
    face,
    (b) => paintWraith(b, frame),
    0.95,
  )
  glow(
    g,
    sideX(x, face, -9.4),
    y - 11.8,
    3.4,
    SPECTRE[3],
    0.5 + Math.sin(tick / 5) * 0.12,
  )
}

// --- the bell imp ----------------------------------------------------------------------------

const IMP: Box = { w: 32, h: 34, ay: 27 }
const IMP_FRAMES = 4
type ImpPose = 'idle' | 'air' | 'windup'
/** Where the ember sits in the imp's hand while it winds up (sprite-local). */
const IMP_EMBER: Pt = [2.6, -20]

function paintImp(b: G, pose: ImpPose, frame: number) {
  const ph = (frame / IMP_FRAMES) * TAU
  const sq = pose === 'idle' ? Math.sin(ph) * 0.5 : 0
  const rock =
    pose === 'air' ? -0.18 : pose === 'windup' ? 0.1 : Math.sin(ph) * 0.07
  // Tail, behind the bell.
  b.beginPath()
  b.moveTo(4, -6)
  b.quadraticCurveTo(9, -5 + sq, 9.4, -10.4 + sq)
  b.lineWidth = 1.8
  b.strokeStyle = INK
  b.stroke()
  b.lineWidth = 0.9
  b.strokeStyle = IMP_SKIN[2]
  b.stroke()
  poly(b, [9.4, -12.6 + sq, 10.8, -10 + sq, 8.2, -10.2 + sq])
  inked(b, EMBER[3], 0.8)
  // Legs from under the rim.
  const legs =
    pose === 'air'
      ? [
          [-2, -3.4, -3.6, -1.4],
          [2, -3.4, 3, -1.2],
        ]
      : [
          [-2, -3, -2.6 - sq * 0.4, -0.4],
          [2, -3, 2.8 + sq * 0.4, -0.4],
        ]
  for (const [x0, y0, x1, y1] of legs) {
    limb(b, [x0 ?? 0, y0 ?? 0, x1 ?? 0, y1 ?? 0], 1.6, IMP_SKIN[2])
    limb(
      b,
      [x1 ?? 0, y1 ?? 0, (x1 ?? 0) - 1.4, (y1 ?? 0) + 0.2],
      1,
      IMP_SKIN[3],
    )
  }
  b.save()
  b.translate(0, -3 + sq * 0.3)
  b.rotate(rock)
  // Far arm.
  if (pose === 'air') limb(b, [3.6, -7.6, 6.4, -11.4], 1.3, IMP_SKIN[1])
  else limb(b, [3.8, -6.4, 6, -4.4], 1.3, IMP_SKIN[1])
  // The bell it wears: bronze, lit from the moon side, two raised rings and a lip.
  const bell = () => {
    b.beginPath()
    b.moveTo(-6.6, 0)
    b.quadraticCurveTo(-4.4, -1.2, -4, -5)
    b.quadraticCurveTo(-3.8, -9.6, 0, -9.8)
    b.quadraticCurveTo(3.8, -9.6, 4, -5)
    b.quadraticCurveTo(4.4, -1.2, 6.6, 0)
    b.closePath()
  }
  const metal = b.createLinearGradient(-6, 0, 6, 0)
  metal.addColorStop(0, BRONZE[2])
  metal.addColorStop(0.3, BRONZE[4])
  metal.addColorStop(0.5, BRONZE[3])
  metal.addColorStop(1, BRONZE[1])
  bell()
  inked(b, metal, 1.1)
  for (const [y, w] of [
    [-7.4, 3.9],
    [-2.6, 5],
  ] as const) {
    b.strokeStyle = BRONZE[1]
    b.lineWidth = 0.6
    b.beginPath()
    b.moveTo(-w, y + 0.4)
    b.quadraticCurveTo(0, y + 1.2, w, y + 0.4)
    b.stroke()
    b.strokeStyle = BRONZE[4]
    b.lineWidth = 0.35
    b.beginPath()
    b.moveTo(-w, y - 0.1)
    b.quadraticCurveTo(0, y + 0.7, w * 0.4, y + 0.4)
    b.stroke()
  }
  ellipsePath(b, 0, 0, 6.6, 0.9)
  inked(b, BRONZE[2], 0.8)
  b.fillStyle = BRONZE[0]
  ellipsePath(b, 0, 0.3, 5.4, 0.5)
  b.fill()
  b.restore()
  // Head popping out of the crown: crimson, big gold eye, a fanged grin, ember horns.
  const hy = -12.8 + sq * 0.6
  poly(b, [1.6, hy - 1.6, 5.2, hy - 3.2, 2.6, hy + 0.4])
  inked(b, IMP_SKIN[2], 0.8)
  ellipsePath(b, -0.6, hy, 3.7, 3.3)
  inked(b, IMP_SKIN[2], 1.1)
  b.fillStyle = IMP_SKIN[3]
  blob(b, [-3.6, hy - 1, -2, hy - 3, 0.6, hy - 2.8, -1.4, hy - 1.6])
  b.fill()
  b.fillStyle = IMP_SKIN[1]
  blob(b, [1, hy + 2.6, 2.8, hy + 1, 2.4, hy - 0.8, 0.6, hy + 1])
  b.fill()
  for (const [bx, tx, ty] of [
    [-2, -4.4, -6.4],
    [1, 2.4, -6.8],
  ] as const) {
    b.beginPath()
    b.moveTo(bx - 1, hy - 2.4)
    b.quadraticCurveTo(tx - 0.6, hy - 3.6, tx, hy + ty)
    b.quadraticCurveTo(tx + 1, hy - 3.6, bx + 1.1, hy - 2.6)
    b.closePath()
    const horn = b.createLinearGradient(0, hy - 2, 0, hy + ty)
    horn.addColorStop(0, IMP_SKIN[1])
    horn.addColorStop(0.55, EMBER[3])
    horn.addColorStop(1, EMBER[4])
    inked(b, horn, 0.9)
  }
  b.fillStyle = '#ffd75e'
  ellipsePath(b, -2.2, hy - 0.4, 1.2, 1.05)
  b.fill()
  b.fillStyle = INK
  b.fillRect(-2.6, hy - 1, 0.55, 1.2)
  poly(b, [-3.8, hy + 1.2, -0.6, hy + 1.6, -1.6, hy + 2.5, -3.4, hy + 2.2])
  b.fillStyle = '#1a0610'
  b.fill()
  b.fillStyle = BONE[4]
  b.fillRect(-3.4, hy + 1.3, 0.45, 0.6)
  b.fillRect(-1.6, hy + 1.5, 0.45, 0.6)
  // Near arm: flung up, cocked back with an ember, or hanging.
  if (pose === 'air') limb(b, [-3.6, -8.4, -6.2, -12.6], 1.4, IMP_SKIN[2])
  else if (pose === 'windup')
    limb(
      b,
      [-2.6, -8.6, 0.2, -13.6, IMP_EMBER[0], IMP_EMBER[1] + 1.2],
      1.4,
      IMP_SKIN[2],
    )
  else limb(b, [-3.8, -7.4 + sq * 0.3, -6.4, -5.4 + sq], 1.4, IMP_SKIN[2])
}

function drawImp(g: G, f: FoeArtFoe, tick: number) {
  const face = f.face ?? (Math.sign(f.vx) || -1)
  const air = Math.abs(f.vy) > 0.01
  const timer = f.timer ?? 99
  const pose: ImpPose = air
    ? 'air'
    : f.phase === 'aim' || (timer > 0 && timer <= 12)
      ? 'windup'
      : 'idle'
  const frame = pose === 'idle' ? Math.floor(f.t / 6) % IMP_FRAMES : 0
  const x = snap(g, f.x)
  const y = snap(g, f.y)
  if (!air) groundShadow(g, x, y, 7)
  foeSprite(g, `imp-${pose}-${frame}`, x, y, IMP, face, (b) =>
    paintImp(b, pose, frame),
  )
  // Ember horn tips smoulder.
  const hy =
    y -
    12.8 +
    (pose === 'idle' ? Math.sin((frame / IMP_FRAMES) * TAU) * 0.3 : 0)
  const flick = 0.45 + Math.sin(tick / 3 + f.x) * 0.15
  glow(g, sideX(x, face, -4.4), hy - 6.4, 3, EMBER[3], flick)
  glow(g, sideX(x, face, 2.4), hy - 6.8, 3, EMBER[3], flick)
  if (pose === 'windup') {
    const ex = sideX(x, face, IMP_EMBER[0])
    const ey = y + IMP_EMBER[1]
    glow(g, ex, ey, 7, EMBER[2], 0.7)
    flame(g, ex, ey + 1.4, 4.4, tick, true)
  }
}

// --- the flame acolyte -----------------------------------------------------------------------

const ACOLYTE: Box = { w: 40, h: 48, ay: 38 }
const ACOLYTE_FRAMES = 4
/** The raised palm (sprite-local). */
const ACOLYTE_PALM: Pt = [-5.6, -32]

function acolyteRobe(b: G, sw: number) {
  b.beginPath()
  b.moveTo(2.4, -28.6)
  b.quadraticCurveTo(5.4, -26.6, 5, -22.6)
  b.lineTo(4.8, -19.4)
  b.quadraticCurveTo(6.4, -10, 7.6 + sw, 0)
  b.lineTo(4.6 + sw, -1)
  b.lineTo(2.2 + sw * 0.6, 0.2)
  b.lineTo(-0.6 + sw * 0.4, -0.8)
  b.lineTo(-3.4 + sw * 0.5, 0.2)
  b.lineTo(-7.8 + sw * 0.6, 0)
  b.quadraticCurveTo(-6.6, -10, -4.8, -19)
  b.lineTo(-5, -22.4)
  b.quadraticCurveTo(-4.6, -27.4, 2.4, -28.6)
  b.closePath()
}

function paintAcolyte(b: G, raise: boolean, frame: number) {
  const sw = Math.sin((frame / ACOLYTE_FRAMES) * TAU) * 0.6
  const robe = b.createLinearGradient(0, -28, 0, 0)
  robe.addColorStop(0, ROBE[3])
  robe.addColorStop(0.5, ROBE[2])
  robe.addColorStop(1, ROBE[1])
  // Far arm commanding the ground when it calls the pillar.
  if (raise) {
    limb(b, [1.6, -18, -3, -15.4, -7.4, -13.2], 2.6, ROBE[1])
    poly(b, [-7.4, -13.2, -9.6, -12.4, -9.4, -11.4, -7.2, -12])
    inked(b, CRIMSON[2], 0.6)
  }
  acolyteRobe(b, sw)
  inked(b, robe, 1.1)
  // Folds, the moonlit hood edge, the amber hem.
  b.strokeStyle = ROBE[1]
  b.lineWidth = 0.6
  for (const [x0, x1] of [
    [-2.6, -4.6],
    [1, 0.8],
    [3.6, 5],
  ] as const) {
    b.beginPath()
    b.moveTo(x0, -16)
    b.quadraticCurveTo(x0 - 0.4, -8, x1 + sw * 0.5, -1)
    b.stroke()
  }
  b.strokeStyle = ROBE[4]
  b.lineWidth = 0.6
  b.beginPath()
  b.moveTo(-4.4, -23.4)
  b.quadraticCurveTo(-3.8, -27.4, 2.2, -28.2)
  b.stroke()
  b.strokeStyle = AMBER[1]
  b.lineWidth = 0.9
  b.beginPath()
  b.moveTo(-7.4 + sw * 0.6, -1.4)
  b.quadraticCurveTo(0, -2.4, 7.2 + sw, -1.4)
  b.stroke()
  b.fillStyle = AMBER[2]
  for (let i = 0; i < 6; i++)
    b.fillRect(-6 + i * 2.3 + sw * 0.5, -2.2, 0.6, 0.6)
  // Hood opening: darkness and two embers for eyes.
  b.fillStyle = '#0a0206'
  ellipsePath(b, -3, -23, 2.1, 2.9, 0.15)
  b.fill()
  b.fillStyle = raise ? CRIMSON[3] : AMBER[2]
  b.fillRect(-4.1, -23.6, 0.8, 0.6)
  b.fillRect(-2.6, -23.7, 0.7, 0.6)
  // Rope belt and tassel, a flame sigil stitched at the breast.
  limb(b, [-5.6, -12.6, 0, -13.2, 5.6, -12.4], 0.7, BONE[2], ROBE[0])
  limb(b, [-4.2, -12.6, -4.6, -8.4], 0.6, BONE[2], ROBE[0])
  b.fillStyle = BONE[3]
  b.fillRect(-5, -8.6, 0.9, 1.1)
  poly(b, [-0.8, -18.6, 0.2, -16.4, -0.4, -15.4, -1.4, -15.6, -1.8, -16.6])
  b.fillStyle = AMBER[2]
  b.fill()
  // Near arm: hands joined in the sleeves, or one crimson hand thrown up.
  if (raise) {
    poly(
      b,
      [-1.6, -20, -3.4, -23.4, -6.4, -27, -4.6, -28, -1.2, -24.6, 1, -19.4],
    )
    inked(b, ROBE[3], 1)
    limb(
      b,
      [-5.4, -27.4, ACOLYTE_PALM[0], ACOLYTE_PALM[1] + 1.4],
      1.4,
      CRIMSON[1],
    )
    poly(
      b,
      [
        -6.8, -31.6, -6.6, -34.2, -5.8, -32.4, -5.4, -34.8, -4.8, -32.2, -4,
        -34, -4.2, -31.4, -5.4, -30.4,
      ],
    )
    inked(b, CRIMSON[2], 0.7)
  } else {
    poly(
      b,
      [-0.8, -19.4, -4.6, -15.6, -6.8, -13.4, -5, -11.8, -1.6, -13, 1.4, -16],
    )
    inked(b, ROBE[3], 1)
    b.fillStyle = ROBE[0]
    ellipsePath(b, -6, -12.8, 1, 1.4, 0.6)
    b.fill()
  }
}

function drawAcolyte(g: G, f: FoeArtFoe, tick: number) {
  const face = f.face ?? (Math.sign(f.vx) || -1)
  const timer = f.timer ?? 99
  const raise = f.phase === 'aim' || (timer > 0 && timer <= 24)
  const frame = Math.floor(f.t / 10) % ACOLYTE_FRAMES
  const x = snap(g, f.x)
  const y = snap(g, f.y)
  groundShadow(g, x, y, 9)
  foeSprite(
    g,
    `acolyte-${raise ? 'raise' : 'still'}-${frame}`,
    x,
    y,
    ACOLYTE,
    face,
    (b) => paintAcolyte(b, raise, frame),
  )
  const eyes = sideX(x, face, -3.3)
  glow(
    g,
    eyes,
    y - 23.4,
    raise ? 4.4 : 2.6,
    raise ? CRIMSON[3] : AMBER[2],
    raise ? 0.75 : 0.4,
  )
  if (raise) {
    // The tell: a crimson hand aflame, and a sigil turning above it.
    const p = f.phase === 'aim' ? 1 : 1 - Math.max(0, timer) / 24
    const px = sideX(x, face, ACOLYTE_PALM[0])
    const py = y + ACOLYTE_PALM[1]
    glow(g, px, py - 2, 8 + p * 6, CRIMSON[2], 0.6 + p * 0.3)
    flame(g, px, py - 1.6, 5 + p * 3, tick)
    g.save()
    g.translate(px, py - 4)
    g.rotate(tick / 10)
    g.strokeStyle = rgba(CRIMSON[3], 0.5 + p * 0.4)
    g.lineWidth = 0.6
    g.beginPath()
    g.arc(0, 0, 6 - p * 1.5, 0, TAU)
    g.stroke()
    for (let i = 0; i < 6; i++) {
      const a = (i * TAU) / 6
      g.beginPath()
      g.moveTo(Math.cos(a) * (6 - p * 1.5), Math.sin(a) * (6 - p * 1.5))
      g.lineTo(Math.cos(a) * (7.6 - p * 1.5), Math.sin(a) * (7.6 - p * 1.5))
      g.stroke()
    }
    g.restore()
  } else {
    // A small flame cupped at the sleeves.
    const hx = sideX(x, face, -6.2)
    glow(g, hx, y - 15, 4.4, EMBER[3], 0.45)
    flame(g, hx, y - 13.6, 3, tick)
  }
}

// --- the abbey shade -------------------------------------------------------------------------

const SHADE: Box = { w: 48, h: 46, ay: 38 }
const SHADE_FRAMES = 4

function shadePath(b: G, frame: number, lunge: boolean) {
  const w = (frame / SHADE_FRAMES) * TAU
  const tw = (i: number) => Math.sin(w + i * 1.7) * 1
  const lx = lunge ? -3.6 : 0
  const ly = lunge ? 1.4 : 0
  const st = lunge ? 3.4 : 0
  b.beginPath()
  b.moveTo(0.4 + lx, -27.6 + ly)
  b.quadraticCurveTo(4.4 + lx, -26.8 + ly, 4.8 + lx * 0.5, -22)
  b.quadraticCurveTo(5.8, -16, 5.4 + st * 0.4, -9)
  b.lineTo(7 + st + tw(0), -1.2)
  b.lineTo(4 + st * 0.7, -3.6)
  b.lineTo(2.6 + st * 0.8 + tw(1), 1.6)
  b.lineTo(0.2 + st * 0.5, -2.6)
  b.lineTo(-1.8 + st * 0.4 + tw(2), 0.8)
  b.lineTo(-3.4 + st * 0.2, -3.6)
  b.quadraticCurveTo(-5, -8, -5.2 + lx * 0.4, -14)
  b.quadraticCurveTo(-5.6 + lx, -18, -4.6 + lx, -21.6 + ly)
  b.quadraticCurveTo(-4 + lx, -26.4 + ly, 0.4 + lx, -27.6 + ly)
  b.closePath()
}

function paintShade(b: G, frame: number, lunge: boolean) {
  const lx = lunge ? -3.6 : 0
  const ly = lunge ? 1.4 : 0
  // Void arms behind the body when lunging (the far one), long claws.
  const claw = (
    sx: number,
    sy: number,
    ex: number,
    ey: number,
    near: boolean,
  ) => {
    limb(
      b,
      [sx, sy, (sx + ex) / 2, (sy + ey) / 2 + 0.6, ex, ey],
      near ? 1.6 : 1.4,
      VOID[1],
      VOID[3],
    )
    for (const d of [-1, 0, 1]) {
      const cx = ex + (lunge ? -2.6 : -0.8 + d * 0.6)
      const cy = ey + (lunge ? d * 1.1 : 2.4)
      seg(b, ex, ey, cx, cy, 0.45, VOID[4], null)
    }
  }
  if (lunge) claw(-1 + lx, -17 + ly, -12.4, -16.6, false)
  // The silhouette: a soft violet aura, a crisp rim, a void inside full of far stars.
  shadePath(b, frame, lunge)
  b.lineJoin = 'round'
  b.lineWidth = 3.4
  b.strokeStyle = rgba(VOID[3], 0.22)
  b.stroke()
  const inside = b.createLinearGradient(0, -28, 0, 2)
  inside.addColorStop(0, VOID[1])
  inside.addColorStop(0.5, VOID[0])
  inside.addColorStop(1, rgba(VOID[1], 0.55))
  b.fillStyle = inside
  b.fill()
  b.lineWidth = 0.8
  b.strokeStyle = VOID[3]
  b.stroke()
  b.save()
  shadePath(b, frame, lunge)
  b.clip()
  for (let i = 0; i < 14; i++) {
    const sx = -5 + hash(i * 3.1) * 11
    const sy = -26 + hash(i * 7.7) * 26
    b.fillStyle = i % 3 ? rgba(VOID[4], 0.8) : rgba(VOID[3], 0.9)
    const r = i % 4 ? 0.35 : 0.55
    b.fillRect(sx - r / 2 + (frame % 2) * 0.1, sy - r / 2, r, r)
  }
  // Veil folds catching violet light.
  b.strokeStyle = rgba(VOID[2], 0.9)
  b.lineWidth = 0.6
  b.beginPath()
  b.moveTo(-2.6 + lx, -22 + ly)
  b.quadraticCurveTo(-3.6, -14, -2.4, -6)
  b.moveTo(2.4 + lx * 0.5, -22 + ly)
  b.quadraticCurveTo(3, -14, 2.2, -5)
  b.stroke()
  b.restore()
  b.strokeStyle = VOID[4]
  b.lineWidth = 0.55
  b.beginPath()
  b.moveTo(-4.2 + lx, -22 + ly)
  b.quadraticCurveTo(-3.6 + lx, -26.4 + ly, 0.4 + lx, -27.2 + ly)
  b.stroke()
  // Hood hollow and the slit eyes.
  b.fillStyle = '#000000'
  ellipsePath(b, -2.6 + lx, -21.6 + ly, 2, 2.6, 0.1)
  b.fill()
  b.fillStyle = '#f4e8ff'
  ellipsePath(b, -3.6 + lx, -21.8 + ly, 0.75, 0.3, -0.25)
  b.fill()
  ellipsePath(b, -1.8 + lx, -21.9 + ly, 0.65, 0.3, 0.2)
  b.fill()
  // Near arm.
  if (lunge) claw(-3 + lx, -16 + ly, -13.6, -14, true)
  else claw(-3.4, -17, -6.4, -10.6, true)
}

function drawShade(g: G, f: FoeArtFoe, tick: number) {
  const face = f.face ?? (Math.sign(f.vx) || -1)
  const lunge = f.phase === 'attack'
  const shimmer = f.phase === 'aim'
  const frame = Math.floor(f.t / 7) % SHADE_FRAMES
  const x = snap(g, f.x)
  const y = snap(g, f.y)
  const key = `shade-${lunge ? 'lunge' : 'drift'}-${frame}`
  const paint = (b: G) => paintShade(b, frame, lunge)
  g.fillStyle = rgba(VOID[3], 0.18)
  ellipsePath(g, x, y + 1, 8, 1.4)
  g.fill()
  glow(g, x, y - 13, 16, VOID[3], shimmer ? 0.35 : 0.2)
  if (shimmer) {
    // The tell: it ripples in from nowhere, slices of it sliding into place.
    const left = Math.max(0, Math.min(1, (f.timer ?? 0) / 32))
    const amp = 1 + left * 4
    const alpha = 0.45 + (1 - left) * 0.5
    for (let i = 0; i < 11; i++) {
      const top = y - 30 + i * 3
      g.save()
      g.beginPath()
      g.rect(x - 26, top, 52, 3)
      g.clip()
      const off = Math.sin(i * 1.3 + tick * 0.7) * amp
      foeSprite(
        g,
        key,
        x + off,
        y,
        SHADE,
        face,
        paint,
        alpha * (0.8 + hash(i + tick) * 0.2),
      )
      g.restore()
    }
    for (let i = 0; i < 5; i++) {
      const a = tick / 6 + (i * TAU) / 5
      const r = 6 + left * 12
      twinkle(
        g,
        x + Math.cos(a) * r,
        y - 13 + Math.sin(a) * r * 1.1,
        1.2 + (i % 2) * 0.6,
        VOID[4],
      )
    }
  } else {
    if (lunge) {
      const dir = Math.sign(f.vx) || face
      for (let i = 2; i >= 1; i--)
        foeSprite(g, key, x - dir * i * 6, y, SHADE, face, paint, 0.32 / i)
    }
    foeSprite(g, key, x, y, SHADE, face, paint)
  }
  const ex = sideX(x, face, lunge ? -6.4 : -2.8)
  glow(
    g,
    ex,
    y - 21.8 + (lunge ? 1.4 : 0),
    shimmer || lunge ? 4.4 : 3,
    VOID[4],
    shimmer || lunge ? 0.75 : 0.45,
  )
}

// --- the censer sister -----------------------------------------------------------------------

const SISTER: Box = { w: 40, h: 46, ay: 38 }
const SISTER_FRAMES = 6
type SisterArm = 'low' | 'back' | 'fore'
const SISTER_HAND: Record<SisterArm, Pt> = {
  low: [-6.4, -14.4],
  back: [3.6, -21.8],
  fore: [-8.6, -19.8],
}
const CENSER_CHAIN = 8.5

function paintSister(b: G, arm: SisterArm, frame: number) {
  const ph = (frame / SISTER_FRAMES) * TAU
  const sw = Math.sin(ph) * 0.7
  // Veil streaming down her back.
  poly(b, [
    1.2,
    -27,
    4.8,
    -24.6,
    6.6 + sw * 0.5,
    -16,
    7.6 + sw,
    -10.6,
    4.4,
    -12.6,
    2.6,
    -20,
  ])
  inked(b, HABIT[1], 1)
  // Feet peeking under the hem in turn.
  for (const [fx, up] of [
    [-3.8, Math.max(0, Math.sin(ph))],
    [0.6, Math.max(0, -Math.sin(ph))],
  ] as const) {
    ellipsePath(b, fx - up * 1.4, -0.6, 1.8, 0.8)
    inked(b, '#1a1222', 0.7)
  }
  // The habit.
  const habit = () => {
    b.beginPath()
    b.moveTo(-4.4, -19.6)
    b.quadraticCurveTo(-5.4, -10, -6.8 + sw * 0.4, -0.6)
    b.lineTo(-2.6 + sw * 0.3, 0)
    b.lineTo(1.8 + sw * 0.5, -0.4)
    b.lineTo(6.8 + sw, -0.2)
    b.quadraticCurveTo(5.6, -10, 4.6, -19.8)
    b.quadraticCurveTo(0, -21.6, -4.4, -19.6)
    b.closePath()
  }
  const cloth = b.createLinearGradient(-6, 0, 6, 0)
  cloth.addColorStop(0, HABIT[3])
  cloth.addColorStop(0.45, HABIT[2])
  cloth.addColorStop(1, HABIT[1])
  habit()
  inked(b, cloth, 1.1)
  b.strokeStyle = HABIT[0]
  b.lineWidth = 0.6
  for (const [x0, x1] of [
    [-1.6, -3 + sw * 0.4],
    [2.2, 3.6 + sw * 0.6],
  ] as const) {
    b.beginPath()
    b.moveTo(x0, -15)
    b.quadraticCurveTo(x0, -7, x1, -0.6)
    b.stroke()
  }
  b.strokeStyle = HABIT[4]
  b.lineWidth = 0.5
  b.beginPath()
  b.moveTo(4.4, -19.4)
  b.quadraticCurveTo(5.4, -10, 6.4 + sw, -0.6)
  b.stroke()
  // Scapular down the front, a rope cincture, the bone rosary and its cross.
  poly(b, [-3.4, -19.4, -1, -19.8, -1.8, -1, -4.6 + sw * 0.3, -0.6])
  b.fillStyle = HABIT[1]
  b.fill()
  limb(b, [-4.8, -12.6, 0, -13, 4.8, -12.4], 0.6, BONE[1], HABIT[0])
  b.fillStyle = BONE[3]
  for (let i = 0; i < 7; i++) {
    const u = i / 6
    b.fillRect(
      -3.4 + Math.sin(u * Math.PI) * -0.8 - 0.3,
      -19 + u * 8 - 0.3,
      0.6,
      0.6,
    )
  }
  b.fillStyle = AMBER[3]
  b.fillRect(-3.9, -11.4, 0.7, 2.4)
  b.fillRect(-4.5, -10.8, 1.9, 0.6)
  // Wimple framing a shadowed face, the black veil over the crown.
  ellipsePath(b, -1.8, -23.4, 3.5, 3.8)
  inked(b, BONE[3], 1)
  b.fillStyle = BONE[2]
  blob(b, [0.4, -21, 1.6, -23.4, 1, -25.8, 0, -23.6])
  b.fill()
  b.fillStyle = '#0e0812'
  ellipsePath(b, -2.6, -23.2, 2.1, 2.5)
  b.fill()
  b.fillStyle = mix(BONE[2], '#0e0812', 0.65)
  blob(b, [-4.2, -22, -3.2, -20.8, -1.6, -21.2, -2.4, -22])
  b.fill()
  b.beginPath()
  b.moveTo(-5.4, -24.6)
  b.quadraticCurveTo(-4.2, -28.8, 0.4, -28.6)
  b.quadraticCurveTo(4.4, -28, 5, -23.4)
  b.lineTo(1.6, -24.4)
  b.quadraticCurveTo(-1.6, -26.4, -5.4, -24.6)
  b.closePath()
  inked(b, HABIT[1], 1)
  b.strokeStyle = HABIT[4]
  b.lineWidth = 0.5
  b.beginPath()
  b.moveTo(-4.4, -25.6)
  b.quadraticCurveTo(-3, -28.2, 0.6, -28.2)
  b.stroke()
  // Far hand at the rosary.
  b.fillStyle = BONE[3]
  ellipsePath(b, -2.2, -15, 0.9, 0.8)
  b.fill()
  // Near arm: a wide sleeve, a pale hand gripping the chain.
  const [hx, hy] = SISTER_HAND[arm]
  const sx = -0.6
  const sy = -19
  const ex = sx + (hx - sx) * 0.55 + (arm === 'back' ? 0.4 : 0.2)
  const ey = sy + (hy - sy) * 0.55 + 1.2
  poly(b, [
    sx - 1.2,
    sy - 0.6,
    ex - 0.4,
    ey - 1.4,
    hx + (arm === 'back' ? -0.6 : 0.8),
    hy - 1,
    hx + (arm === 'back' ? -0.4 : 1),
    hy + 1.2,
    ex + 0.6,
    ey + 1.6,
    sx + 1.6,
    sy + 1.6,
  ])
  inked(b, HABIT[2], 1)
  b.fillStyle = BONE[3]
  ellipsePath(b, hx, hy, 1, 0.9)
  b.fill()
}

function paintCenser(b: G) {
  b.translate(4, 4)
  b.scale(0.8, 0.8)
  // Finial and domed, pierced lid over a banded bronze bowl.
  b.fillStyle = BRONZE[3]
  b.fillRect(-0.4, -4.2, 0.8, 1)
  blob(b, [-2.6, -1.4, -1.6, -3.4, 0, -3.8, 1.6, -3.4, 2.6, -1.4])
  inked(b, BRONZE[3], 0.9)
  ellipsePath(b, 0, 0.6, 2.9, 2.4)
  inked(b, BRONZE[2], 0.9)
  b.fillStyle = BRONZE[4]
  ellipsePath(b, -1, -0.4, 1, 0.6, -0.4)
  b.fill()
  b.fillStyle = BRONZE[1]
  b.fillRect(-2.8, -1.2, 5.6, 0.7)
  b.fillStyle = EMBER[4]
  for (const [x, y] of [
    [-1.4, -2.2],
    [0.4, -2.6],
    [1.6, -1.8],
    [-0.6, 1.4],
    [1.2, 1.2],
  ] as const)
    b.fillRect(x - 0.3, y - 0.3, 0.6, 0.6)
}

function drawSister(g: G, f: FoeArtFoe, tick: number) {
  const face = f.face ?? (Math.sign(f.vx) || -1)
  const timer = f.timer ?? 0
  const windup = f.phase === 'aim'
  const follow = !windup && timer > 56
  const arm: SisterArm = windup ? 'back' : follow ? 'fore' : 'low'
  const moving = Math.abs(f.vx) > 0.05
  const frame = moving ? Math.floor(f.t / 7) % SISTER_FRAMES : 0
  const x = snap(g, f.x)
  const y = snap(g, f.y)
  groundShadow(g, x, y, 9)
  foeSprite(g, `sister-${arm}-${frame}`, x, y, SISTER, face, (b) =>
    paintSister(b, arm, frame),
  )
  glow(g, sideX(x, face, -2.5), y - 23.6, 2.4, SPECTRE[3], 0.45)
  g.fillStyle = SPECTRE[4]
  g.fillRect(sideX(x, face, -3.3) - 0.35, y - 23.9, 0.7, 0.6)
  g.fillRect(sideX(x, face, -1.8) - 0.35, y - 23.9, 0.7, 0.6)
  // The censer on its chain: a lazy pendulum, a wind-up swung back overhead, a sweep forward.
  const [lhx, lhy] = SISTER_HAND[arm]
  let th: number
  let heat = 0
  if (windup) {
    const p = 1 - Math.max(0, Math.min(1, timer / 30))
    th = -(0.7 + p * 2.1)
    heat = p
  } else if (follow) {
    const q = Math.min(1, (70 - timer) / 14)
    th = 2.1 - q * 1.5
    heat = 1 - q
  } else {
    th = Math.sin(f.t / 11) * 0.45
  }
  const lcx = lhx - Math.sin(th) * CENSER_CHAIN
  const lcy = lhy + Math.cos(th) * CENSER_CHAIN
  const hx = sideX(x, face, lhx)
  const hy = y + lhy
  const cx = sideX(x, face, lcx)
  const cy = y + lcy
  // Embers streaming along the arc of the swing.
  if (heat > 0) {
    for (let i = 1; i <= 4; i++) {
      const tt = th + (windup ? 0.32 : -0.32) * i
      const px = sideX(x, face, lhx - Math.sin(tt) * CENSER_CHAIN)
      const py = y + lhy + Math.cos(tt) * CENSER_CHAIN
      puff(
        g,
        px,
        py,
        1.4 - i * 0.2,
        i % 2 ? EMBER[3] : EMBER[4],
        (0.9 - i * 0.18) * heat,
      )
    }
    glow(g, cx, cy, 6 + heat * 4, EMBER[3], 0.25 + heat * 0.35)
  }
  g.strokeStyle = INK
  g.lineWidth = 1.1
  g.beginPath()
  g.moveTo(hx, hy)
  g.lineTo(cx, cy - 2.6)
  g.stroke()
  g.strokeStyle = STEEL[2]
  g.lineWidth = 0.5
  g.setLineDash([0.8, 0.6])
  g.stroke()
  g.setLineDash([])
  drawBaked(
    g,
    'gt-foes-censer',
    snap(g, cx - 4),
    snap(g, cy - 4),
    8,
    8,
    paintCenser,
  )
  glow(g, cx, cy, 4, AMBER[2], 0.3 + Math.sin(tick / 4) * 0.1)
  // Incense curling up off it.
  if (!windup) {
    for (let i = 0; i < 3; i++) {
      const p = ((f.t * 0.6 + i * 9) % 27) / 27
      puff(
        g,
        cx + Math.sin(p * 6 + i) * 1.6,
        cy - 4 - p * 10,
        0.8 + p * 1.6,
        '#a89cb8',
        (1 - p) * 0.45,
      )
    }
  }
}

/**
 * A foe in world space; (x, y) are its feet (a flyer's y is its flight line). The slice's three
 * (spirit, crow, hyena) draw as they always have; the campaign roster reads every phase: walk/idle
 * cycles, the `aim` tell, attacks and dives, its facing, a harpy's bundle.
 */
export function drawFoe(g: G, foe: FoeArtFoe, tick: number) {
  switch (foe.kind) {
    case 'spirit':
      return drawGhost(g, foe, tick)
    case 'crow':
      return drawCrow(g, foe, tick)
    case 'hyena':
      return drawCoyote(g, foe, tick)
    case 'gunslinger':
      return drawGunslinger(g, foe, tick)
    case 'monk':
      return drawMonk(g, foe, tick)
    case 'ghoul':
      return drawGhoul(g, foe, tick)
    case 'drowned':
      return drawDrowned(g, foe, tick)
    case 'leech':
      return drawLeech(g, foe, tick)
    case 'harpy':
      return drawHarpy(g, foe, tick)
    case 'wraith':
      return drawWraith(g, foe, tick)
    case 'imp':
      return drawImp(g, foe, tick)
    case 'acolyte':
      return drawAcolyte(g, foe, tick)
    case 'shade':
      return drawShade(g, foe, tick)
    case 'sister':
      return drawSister(g, foe, tick)
  }
}

// --- the Dust Devil -------------------------------------------------------------------------

const DEVIL_SKULL_SCALE = 1.35
const DEVIL_SKULL_W = 34
const DEVIL_SKULL_H = 22

function paintDevilSkull(b: G, hot: boolean, white: boolean) {
  withFlash(b, white, DEVIL_SKULL_W, DEVIL_SKULL_H, () => {
    b.save()
    b.translate(DEVIL_SKULL_W / 2, DEVIL_SKULL_H / 2)
    b.scale(DEVIL_SKULL_SCALE, DEVIL_SKULL_SCALE)
    // Horns sweeping out and up.
    for (const s of [-1, 1]) {
      b.beginPath()
      b.moveTo(s * 2.6, -1.8)
      b.quadraticCurveTo(s * 9, -1.6, s * 10.6, -6.4)
      b.quadraticCurveTo(s * 8, -3.2, s * 3, 0.2)
      b.closePath()
      inked(b, BONE[3], 1)
      b.fillStyle = BONE[1]
      b.beginPath()
      b.moveTo(s * 9, -3.4)
      b.quadraticCurveTo(s * 10.2, -4.8, s * 10.6, -6.4)
      b.lineTo(s * 9.4, -5)
      b.closePath()
      b.fill()
    }
    // Long face, front on.
    blob(
      b,
      [
        0, -4.2, 3.6, -3.6, 4, -0.6, 2.4, 3, 1.6, 6.4, 0, 7, -1.6, 6.4, -2.4, 3,
        -4, -0.6, -3.6, -3.6,
      ],
    )
    inked(b, BONE[3], 1.1)
    b.fillStyle = BONE[2]
    blob(b, [1.2, -1, 3.4, -1, 2, 3.4, 1.2, 6.2, 0.4, 3])
    b.fill()
    b.fillStyle = BONE[4]
    blob(b, [-1.6, -3.6, -3, -2.4, -2.4, -0.6, -1, -2])
    b.fill()
    b.fillStyle = '#1a0a0e'
    ellipsePath(b, -1.7, -0.4, 1.2, 1)
    b.fill()
    ellipsePath(b, 1.7, -0.4, 1.2, 1)
    b.fill()
    b.fillStyle = hot ? CRIMSON[3] : CRIMSON[2]
    ellipsePath(b, -1.7, -0.3, 0.65, 0.55)
    b.fill()
    ellipsePath(b, 1.7, -0.3, 0.65, 0.55)
    b.fill()
    b.fillStyle = '#1a0a0e'
    ellipsePath(b, -0.6, 5, 0.4, 0.7)
    b.fill()
    ellipsePath(b, 0.6, 5, 0.4, 0.7)
    b.fill()
    b.restore()
  })
}

function drawDevil(g: G, b: FoeArtBoss, _tick: number) {
  const dying = b.dying > 0
  const k = dying ? 1 - b.dying / 70 : 0
  const white =
    b.flash > 0 || (dying && b.dying > 40 && Math.floor(b.dying / 3) % 2 === 1)
  const fade = dying ? Math.min(1, b.dying / 40) : 1
  const x = snap(g, b.x + (dying ? (hash(b.t) - 0.5) * 2.5 : 0))
  const y = b.y
  const t = b.t
  const armed = !dying && b.timer <= 18
  const bands = 15
  const spread = 1 + k * 1.4
  const sway = (i: number) =>
    Math.sin(t / 6 + i * 0.7) * (1.1 + i * 0.32) * (1 + k)
  const bandY = (i: number) => y - 1.5 - i * 3
  const bandR = (i: number) => (2.2 + i * 1.1 + i * i * 0.04) * spread
  g.save()
  g.globalAlpha = fade
  groundShadow(g, x, y, 18, 0.35)
  // Dust skirt boiling at its foot.
  for (let i = 0; i < 10; i++) {
    const p = ((t * 0.6 + i * 7) % 20) / 20
    const side = i % 2 ? 1 : -1
    puff(
      g,
      x + side * (3 + p * 15 + hash(i) * 3),
      y - 1.5 - p * 5,
      1.6 + p * 2.8,
      i % 3 ? DUST[1] : DUST[2],
      (1 - p) * 0.75 * fade,
    )
  }
  // Debris on the far side of the whirl, then in front of it.
  const debris = (front: boolean) => {
    for (let i = 0; i < 6; i++) {
      const a = t * 0.12 + i * 1.05
      const z = Math.sin(a)
      if (front !== z > 0) continue
      const lvl = 2 + i * 2.1
      const dx = x + sway(lvl) + Math.cos(a) * (bandR(lvl) + 2.5)
      const dy = bandY(lvl) + z * 1.8
      if (i % 3 === 1) {
        const r = a * 2
        seg(
          g,
          dx - Math.cos(r) * 2,
          dy - Math.sin(r) * 2,
          dx + Math.cos(r) * 2,
          dy + Math.sin(r) * 2,
          1,
          BONE[3],
        )
      } else if (i === 3) {
        g.strokeStyle = DUST[3]
        g.lineWidth = 0.45
        for (let s = 0; s < 3; s++) {
          g.beginPath()
          g.arc(dx, dy, 1.4 + s * 0.4, a + s, a + s + 2.4)
          g.stroke()
        }
      } else {
        g.fillStyle = INK
        g.beginPath()
        g.arc(dx, dy, 1.3, 0, TAU)
        g.fill()
        g.fillStyle = front ? DUST[2] : DUST[1]
        g.beginPath()
        g.arc(dx - 0.2, dy - 0.2, 0.95, 0, TAU)
        g.fill()
      }
    }
  }
  debris(false)
  // The funnel: translucent bands of whirling dust, dark at the root, moonlit up top-left.
  g.lineCap = 'round'
  for (let i = 0; i < bands; i++) {
    const cx = x + sway(i)
    const cy = bandY(i)
    const r = bandR(i)
    const ry = r * 0.2 + 1.5
    const lit = i / (bands - 1)
    g.globalAlpha = fade * (0.78 - lit * 0.3 - k * 0.35)
    g.fillStyle = white ? '#ffffff' : mix(DUST[0], DUST[3], 0.3 + lit * 0.5)
    ellipsePath(g, cx, cy, r, ry)
    g.fill()
    if (white) continue
    g.globalAlpha = fade * (0.85 - k * 0.4)
    // Shadowed right flank.
    g.fillStyle = rgba(DUST[0], 0.5)
    g.beginPath()
    g.ellipse(cx, cy, r, ry, 0, -1.2, 1.3)
    g.quadraticCurveTo(cx + r * 0.45, cy, cx + r * 0.36, cy - ry)
    g.closePath()
    g.fill()
    // Streaks whipping round the front.
    const spin = t * 0.34 + i * 1.9
    for (let s = 0; s < 3; s++) {
      const a0 = (spin + (s * TAU) / 3) % TAU
      if (a0 > Math.PI) continue
      g.strokeStyle = s === 0 ? DUST[4] : s === 1 ? DUST[3] : DUST[0]
      g.lineWidth = s === 2 ? 0.8 : 0.55
      g.beginPath()
      g.ellipse(
        cx,
        cy + 0.5,
        r * 0.98,
        ry * 0.8,
        0,
        a0,
        Math.min(Math.PI, a0 + 0.8 + lit * 0.4),
      )
      g.stroke()
    }
    // Moonlit upper-left lip.
    g.strokeStyle = rgba(DUST[4], 0.6)
    g.lineWidth = 0.5
    g.beginPath()
    g.ellipse(cx, cy, r, ry, 0, Math.PI * 1.02, Math.PI * 1.42)
    g.stroke()
  }
  // A churning dust cap where the funnel opens.
  if (!white) {
    for (let i = 0; i < 7; i++) {
      const a = t * 0.18 + (i * TAU) / 7
      const cx = x + sway(bands - 1) + Math.cos(a) * bandR(bands - 1) * 0.8
      const cy = bandY(bands - 1) - 1.5 + Math.sin(a) * 2
      puff(
        g,
        cx,
        cy,
        1.6 + hash(i) * 1.2,
        Math.sin(a) > 0 ? DUST[3] : DUST[1],
        0.45 * fade,
      )
    }
  }
  g.globalAlpha = 1
  g.restore()
  // The ember-eyed skull riding the whirl (it tumbles down as the devil dies).
  const sx = x + sway(9) * 0.8
  const sy = dying ? y - 29 + k * k * 24 : y - 29 + Math.sin(t / 9) * 1.2
  if (armed) {
    // The tell: clods gather and spin at the crown, the skull's eyes flare.
    for (let i = 0; i < 3; i++) {
      const a = t * 0.3 + (i * TAU) / 3
      drawClod(g, {
        x: x + sway(bands - 1) + Math.cos(a) * 10,
        y: y - 47 + Math.sin(a) * 2.4,
      })
    }
  }
  drawBaked(
    g,
    `gt-foes-devilskull-${armed ? 'hot' : 'warm'}-${white ? 'w' : 'n'}`,
    snap(g, sx - DEVIL_SKULL_W / 2),
    snap(g, sy - DEVIL_SKULL_H / 2),
    DEVIL_SKULL_W,
    DEVIL_SKULL_H,
    (c) => paintDevilSkull(c, armed, white),
    { alpha: fade },
  )
  const heat = armed ? 0.9 : 0.45 + Math.sin(t / 7) * 0.1
  const eye = 1.7 * DEVIL_SKULL_SCALE
  const eyeY = sy - 0.3 * DEVIL_SKULL_SCALE
  glow(g, sx - eye, eyeY, armed ? 5.5 : 3.2, CRIMSON[3], heat * fade)
  glow(g, sx + eye, eyeY, armed ? 5.5 : 3.2, CRIMSON[3], heat * fade)
  g.save()
  g.globalAlpha = fade
  debris(true)
  g.restore()
  if (dying) drawDeathRemains(g, b, x, y, 36, DUST)
}

// --- the Bone Bull --------------------------------------------------------------------------

const BULL_W = 72
const BULL_H = 54
const BULL_AX = 36
const BULL_AY = 48
/** The skull's pivot at the end of the neck, in the bull's local space (facing left). */
const BULL_NECK: Pt = [-14, -23]
type BullPose = 'stand' | 'paw' | 'gallop' | 'stun'
type BullEyes = 'dull' | 'hot' | 'out'

function bullHeadAngle(pose: BullPose, frame: number): number {
  if (pose === 'paw') return -0.42 + (frame % 2) * 0.05
  if (pose === 'gallop') return -0.5
  if (pose === 'stun') return -0.75
  return -0.08
}

/** Joint lists [shoulder.., hoof] for [front far, back far, front near, back near]. */
function bullLegs(pose: BullPose, frame: number): Pt[][] {
  const front = (
    sx: number,
    ex: number,
    ey: number,
    fx: number,
    fy: number,
  ): Pt[] => [
    [sx, -19],
    [ex, ey],
    [fx, fy - 2.4],
    [fx - 0.4, fy],
  ]
  const back = (
    hx: number,
    sx: number,
    sy: number,
    kx: number,
    ky: number,
    fx: number,
    fy: number,
  ): Pt[] => [
    [hx, -20],
    [sx, sy],
    [kx, ky],
    [fx, fy],
  ]
  if (pose === 'gallop') {
    const ph = (frame / 4) * TAU
    const fl = (o: number) => {
      const a = 0.6 * Math.sin(ph + o)
      const lift = Math.max(0, Math.cos(ph + o)) * 3
      return front(-8, -8 - a * 6, -10 - lift * 0.5, -8 - a * 12 + lift, -lift)
    }
    const bl = (o: number) => {
      const a = 0.6 * Math.sin(ph + o + Math.PI)
      const lift = Math.max(0, Math.cos(ph + o + Math.PI)) * 3
      return back(
        10,
        7 - a * 5,
        -12,
        12 - a * 7,
        -6 - lift * 0.5,
        11 - a * 11 + lift * 0.5,
        -lift,
      )
    }
    return [fl(0.8), bl(0.8), fl(0), bl(0)]
  }
  if (pose === 'stun') {
    return [
      front(-6, -9, -10, -11, 0),
      back(12, 10, -11, 15, -6, 15, 0),
      front(-9, -12, -10, -14, 0),
      back(10, 7, -11, 12, -6, 12.5, 0),
    ]
  }
  if (pose === 'paw') {
    // The near forehoof lifts, stamps and scrapes back.
    const scrape: Pt[] = [
      [-12, -4.5],
      [-9, -0.5],
      [-4, -1.4],
      [-7, -0.2],
    ]
    const [fx, fy] = scrape[frame % 4] ?? [-8, 0]
    const ex = fx < -10 ? -12 : -9
    return [
      front(-6, -6.5, -10, -6, 0),
      back(12, 9.5, -11, 14.5, -6, 14, 0),
      front(-9, ex, -11 + (fy < -2 ? -1.6 : 0), fx, fy),
      back(10, 7.5, -11, 12.5, -6, 12, 0),
    ]
  }
  return [
    front(-6, -6.5, -10, -6.5, 0),
    back(12, 9.5, -11, 14.5, -6, 14, 0),
    front(-9, -9.5, -10, -9.5, 0),
    back(10, 7.5, -11, 12.5, -6, 12, 0),
  ]
}

function bullLeg(b: G, leg: Pt[], near: boolean) {
  const ramp = near
    ? BONE
    : ([BONE[0], BONE[0], BONE[1], BONE[2], BONE[3]] as const)
  bones(b, flat(leg), near ? 2.6 : 2.2, ramp)
  // Joint knobs and a split hoof.
  b.fillStyle = near ? BONE[3] : BONE[1]
  for (const [x, y] of leg.slice(1, -1)) {
    b.beginPath()
    b.arc(x, y, near ? 1.25 : 1.05, 0, TAU)
    b.fill()
  }
  const hoof = leg[leg.length - 1]
  if (!hoof) return
  const [hx, hy] = hoof
  poly(b, [hx - 1.9, hy, hx - 1.4, hy - 2.1, hx + 1.4, hy - 2.1, hx + 1.7, hy])
  inked(b, near ? '#2e2228' : '#1c1418', 0.9)
  b.strokeStyle = INK
  b.lineWidth = 0.4
  b.beginPath()
  b.moveTo(hx - 0.2, hy - 2)
  b.lineTo(hx - 0.1, hy)
  b.stroke()
}

/** The skull's eyes and muzzle in head-local space (before BULL_HEAD_SCALE). */
const BULL_EYE: Pt = [-6.8, -1.2]
const BULL_EYE_FAR: Pt = [-2.6, -1.6]
const BULL_MUZZLE: Pt = [-6.6, 6.6]
const BULL_HEAD_SCALE = 1.15

/** One spreading horn, from the brow out to an upturned tip (side -1 toward the viewer). */
function bullHorn(b: G, side: number) {
  const near = side < 0
  const bx = near ? -8.4 : -0.6
  const tip: Pt = near ? [-17.6, -11.6] : [6.4, -12.4]
  const mid: Pt = near ? [-15, -5.4] : [4.6, -6.6]
  b.beginPath()
  b.moveTo(bx + (near ? 1.6 : -1.4), -5.6)
  b.quadraticCurveTo(mid[0], mid[1] - 2.2, tip[0], tip[1])
  b.quadraticCurveTo(mid[0] + (near ? 0.6 : -0.6), mid[1] + 0.6, bx, -2.8)
  b.closePath()
  inked(b, near ? BONE[3] : BONE[2], near ? 1.1 : 1)
  if (near) {
    b.fillStyle = BONE[2]
    b.beginPath()
    b.moveTo(bx, -3)
    b.quadraticCurveTo(mid[0] + 0.6, mid[1] + 0.4, tip[0] + 0.6, tip[1] + 1.4)
    b.quadraticCurveTo(mid[0] + 1.6, mid[1] - 0.6, bx + 0.6, -4.2)
    b.closePath()
    b.fill()
    b.fillStyle = BONE[4]
    b.beginPath()
    b.moveTo(bx + 1.2, -5.4)
    b.quadraticCurveTo(mid[0] + 0.4, mid[1] - 2, tip[0] + 0.3, tip[1] + 0.3)
    b.quadraticCurveTo(mid[0] + 1.6, mid[1] - 1.2, bx + 0.6, -4.6)
    b.closePath()
    b.fill()
  }
  // Dark weathered tip.
  b.fillStyle = near ? '#3a2b26' : '#241a18'
  b.beginPath()
  b.moveTo(tip[0], tip[1])
  b.lineTo(tip[0] + (near ? 1.6 : -1.6), tip[1] + 2.6)
  b.lineTo(tip[0] + (near ? 2.4 : -2.4), tip[1] + 1.6)
  b.closePath()
  b.fill()
}

function paintBullHead(b: G, eyes: BullEyes) {
  // Local origin: the neck pivot. A three-quarter longhorn skull, face toward the foe.
  b.scale(BULL_HEAD_SCALE, BULL_HEAD_SCALE)
  bullHorn(b, 1)
  // Skull: wide brow narrowing to a long face and blunt muzzle.
  blob(
    b,
    [
      -4.4, -6, 0.4, -5.4, 0.6, -2.2, -1.6, 1.6, -3.6, 5.4, -5, 7.6, -7.6, 7.6,
      -8.6, 5, -9.2, 1.2, -10.4, -2.6, -9.4, -5.4,
    ],
  )
  inked(b, BONE[3], 1.2)
  // Far cheek in shadow, near brow lit by the moon.
  b.fillStyle = BONE[2]
  blob(b, [-4.4, -1, -0.2, -2.4, -1.6, 1.4, -3.6, 5, -5.2, 7.2, -5.6, 3])
  b.fill()
  b.fillStyle = BONE[4]
  blob(b, [-9.4, -4.8, -6.6, -5.6, -4, -5.2, -6.6, -3.8, -8.8, -2.6])
  b.fill()
  // Nasal ridge, cracks, nostrils.
  b.strokeStyle = BONE[1]
  b.lineWidth = 0.45
  b.beginPath()
  b.moveTo(-5.2, -3.6)
  b.quadraticCurveTo(-5.4, 1, -6.2, 5.2)
  b.moveTo(-3.2, -5.6)
  b.lineTo(-3.8, -4.2)
  b.lineTo(-3.2, -3.2)
  b.stroke()
  b.fillStyle = '#1a0a0e'
  ellipsePath(b, -7.4, 6.2, 0.5, 0.85, 0.2)
  b.fill()
  ellipsePath(b, -5.3, 6.2, 0.45, 0.8, -0.2)
  b.fill()
  // Deep orbits, and what burns in them.
  b.fillStyle = '#16070c'
  ellipsePath(b, BULL_EYE[0], BULL_EYE[1], 1.9, 1.6, 0.3)
  b.fill()
  ellipsePath(b, BULL_EYE_FAR[0], BULL_EYE_FAR[1], 1.3, 1.4, -0.3)
  b.fill()
  for (const [ex, ey, r] of [
    [BULL_EYE[0], BULL_EYE[1], 1],
    [BULL_EYE_FAR[0], BULL_EYE_FAR[1], 0.75],
  ] as const) {
    if (eyes === 'out') {
      b.strokeStyle = '#8a8378'
      b.lineWidth = 0.45
      b.beginPath()
      b.moveTo(ex - r, ey - r)
      b.lineTo(ex + r, ey + r)
      b.moveTo(ex + r, ey - r)
      b.lineTo(ex - r, ey + r)
      b.stroke()
    } else {
      b.fillStyle = eyes === 'hot' ? CRIMSON[3] : CRIMSON[1]
      ellipsePath(b, ex, ey, r, r * 0.8)
      b.fill()
      b.fillStyle = eyes === 'hot' ? CRIMSON[4] : CRIMSON[2]
      b.fillRect(ex - r * 0.5, ey - r * 0.45, r * 0.6, r * 0.6)
    }
  }
  bullHorn(b, -1)
}

function paintBull(
  b: G,
  pose: BullPose,
  frame: number,
  eyes: BullEyes,
  white: boolean,
) {
  withFlash(b, white, BULL_W, BULL_H, () => {
    b.save()
    b.translate(BULL_AX, BULL_AY)
    const sag =
      pose === 'stun' ? 1.2 : pose === 'gallop' ? (frame % 2 ? -0.8 : 0.4) : 0
    const legs = bullLegs(pose, frame)
    // Far legs behind everything.
    bullLeg(b, legs[0] ?? [], false)
    bullLeg(b, legs[1] ?? [], false)
    b.save()
    b.translate(0, sag)
    // Tail: vertebrae with a ragged tuft; streams back in the charge.
    const tail =
      pose === 'gallop'
        ? [14, -23, 18, -24, 22, -23.5, 25, -22]
        : [14, -23, 16.5, -20, 17.4, -15.5, 17.4, -12]
    bones(b, tail, 1, BONE)
    const tx = tail[6] ?? 17
    const ty = tail[7] ?? -12
    poly(
      b,
      pose === 'gallop'
        ? [
            tx,
            ty - 1,
            tx + 4,
            ty - 2.2,
            tx + 3,
            ty - 0.4,
            tx + 4.6,
            ty + 0.8,
            tx,
            ty + 1,
          ]
        : [
            tx - 1,
            ty,
            tx + 1,
            ty,
            tx + 1.8,
            ty + 3.6,
            tx + 0.4,
            ty + 2.6,
            tx - 0.2,
            ty + 4,
            tx - 1.4,
            ty + 2.4,
          ],
    )
    inked(b, PLUM[2], 0.9)
    // Ember heart in the ribcage: the bull's danger burning inside.
    const heart = b.createRadialGradient(-2, -17, 0, -2, -17, 9)
    heart.addColorStop(0, rgba(CRIMSON[3], eyes === 'hot' ? 0.75 : 0.45))
    heart.addColorStop(1, rgba(CRIMSON[1], 0))
    b.fillStyle = heart
    b.beginPath()
    b.arc(-2, -17, 9, 0, TAU)
    b.fill()
    // Ribs.
    for (let i = 0; i < 6; i++) {
      const x = -9 + i * 2.7
      const top = -25.6 + Math.abs(x + 4) * 0.12
      b.beginPath()
      b.moveTo(x, top)
      b.quadraticCurveTo(x - 3.6, -18, x - 0.4 + i * 0.25, -11.6 + i * 0.3)
      b.lineWidth = 2.2
      b.strokeStyle = INK
      b.stroke()
      b.lineWidth = 1.3
      b.strokeStyle = i < 2 ? BONE[3] : BONE[2]
      b.stroke()
    }
    bones(b, [-9.6, -11.8, 4.6, -10.4], 1)
    // Pelvis and shoulder blade.
    blob(b, [8, -24.4, 13.6, -24.8, 15.6, -20.6, 12.6, -17.4, 9, -19.6])
    inked(b, BONE[2], 1.1)
    b.fillStyle = BONE[0]
    b.beginPath()
    b.arc(11.8, -21, 1.2, 0, TAU)
    b.fill()
    poly(b, [-11.4, -25, -5.2, -27, -7.6, -17.2])
    inked(b, BONE[2], 1.1)
    b.fillStyle = BONE[3]
    poly(b, [-10.4, -24.8, -6.4, -26.2, -8.2, -21.6])
    b.fill()
    // Spine over the shoulder hump, dorsal spikes bristling.
    bones(b, [-13, -24, -9, -28.6, -4, -27.6, 3, -26, 10, -24.6, 14, -23], 2)
    for (let i = 0; i < 8; i++) {
      const x = -10.6 + i * 3
      const y = i < 3 ? -28.6 + i * 0.4 : -27.4 + (i - 3) * 0.55
      const h = i < 3 ? 2.6 - i * 0.3 : 1.4
      seg(b, x, y, x + 0.8, y - h, 0.7, BONE[3])
    }
    // A tattered plum shroud slung over the back.
    b.beginPath()
    b.moveTo(-6, -27.6)
    b.quadraticCurveTo(2, -27.4, 9, -25)
    b.lineTo(9.6, -20.4)
    b.lineTo(7.6, -21.8)
    b.lineTo(6.6, -19)
    b.lineTo(4.6, -21.2)
    b.lineTo(2.6, -18.4)
    b.lineTo(1, -21.4)
    b.lineTo(-1.2, -19.6)
    b.lineTo(-2.4, -22.4)
    b.lineTo(-4.6, -21)
    b.closePath()
    inked(b, PLUM[2], 1)
    b.fillStyle = PLUM[3]
    b.beginPath()
    b.moveTo(-5, -27)
    b.quadraticCurveTo(2, -27, 8, -24.6)
    b.lineTo(4, -24.6)
    b.lineTo(-3.4, -25.2)
    b.closePath()
    b.fill()
    b.fillStyle = PLUM[1]
    b.fillRect(-1, -24, 1, 3)
    b.fillRect(5, -23.4, 1, 2.6)
    // Neck vertebrae to the skull.
    const ang = bullHeadAngle(pose, frame)
    const nx = BULL_NECK[0]
    const ny = BULL_NECK[1]
    bones(b, [-11, -24.6, nx + 1, ny - 0.4], 2.2)
    b.restore()
    // Near legs.
    bullLeg(b, legs[2] ?? [], true)
    bullLeg(b, legs[3] ?? [], true)
    // The skull, lowered when it means it.
    b.save()
    b.translate(nx, ny + sag)
    b.rotate(ang)
    paintBullHead(b, eyes)
    b.restore()
    b.restore()
  })
}

/** The Bull's eye in world space for a pose (for the live glow). */
/** A head-local point of the Bull's skull in world space, for a pose. */
function bullHeadPoint(
  pose: BullPose,
  frame: number,
  p: Pt,
  x: number,
  y: number,
  face: number,
): Pt {
  const ang = bullHeadAngle(pose, frame)
  const sag =
    pose === 'stun' ? 1.2 : pose === 'gallop' ? (frame % 2 ? -0.8 : 0.4) : 0
  const px = p[0] * BULL_HEAD_SCALE
  const py = p[1] * BULL_HEAD_SCALE
  const lx = BULL_NECK[0] + px * Math.cos(ang) - py * Math.sin(ang)
  const ly = BULL_NECK[1] + sag + px * Math.sin(ang) + py * Math.cos(ang)
  return [x + (face > 0 ? -lx : lx), y + ly]
}

function drawBull(g: G, b: FoeArtBoss, tick: number) {
  const dying = b.dying > 0
  const fade = dying ? Math.min(1, b.dying / 30) : 1
  const white = b.flash > 0 || (dying && Math.floor(b.dying / 3) % 2 === 1)
  const face =
    b.mode === 'charge'
      ? Math.sign(b.vx) || -1
      : (b.face ?? (Math.sign(b.vx) || -1))
  const pose: BullPose = dying
    ? 'stun'
    : b.mode === 'charge'
      ? 'gallop'
      : b.mode === 'stunned'
        ? 'stun'
        : b.mode === 'paw'
          ? 'paw'
          : 'stand'
  const frame =
    pose === 'gallop'
      ? Math.floor(b.t / 3) % 4
      : pose === 'paw'
        ? Math.floor(b.t / 6) % 4
        : 0
  const eyes: BullEyes =
    pose === 'stun'
      ? 'out'
      : pose === 'paw' || pose === 'gallop'
        ? 'hot'
        : 'dull'
  // The tell builds: the closer to the charge, the harder it shakes.
  const urgent = pose === 'paw' && b.timer < 24
  const jitter = dying
    ? (hash(b.t) - 0.5) * 2.4
    : urgent
      ? (hash(b.t * 1.7) - 0.5) * 1.2
      : pose === 'stun'
        ? Math.sin(b.t / 5) * 0.8
        : 0
  const x = snap(g, b.x + jitter)
  const y = b.y
  const behind = -face
  groundShadow(g, x, y, 18, 0.4 * fade)
  if (pose === 'gallop') {
    // Speed lines streaming off its back, dust kicked high behind.
    g.save()
    g.lineCap = 'round'
    for (let i = 0; i < 7; i++) {
      const ly = y - 4 - i * 4 - hash(i) * 2
      const run = (tick * 3 + i * 23) % 30
      const len = 10 + hash(i + 9) * 14
      const sx = x + behind * (18 + run * 0.6 + hash(i + 4) * 4)
      g.strokeStyle = rgba(i % 2 ? '#ffffff' : BONE[3], 0.65 - run / 60)
      g.lineWidth = i % 3 ? 0.8 : 1.3
      g.beginPath()
      g.moveTo(sx, ly)
      g.lineTo(sx + behind * len, ly)
      g.stroke()
    }
    g.restore()
    for (let i = 0; i < 6; i++) {
      const p = ((tick + i * 5) % 18) / 18
      puff(
        g,
        x + behind * (8 + p * 18 + i),
        y - 1 - p * 6,
        1.6 + p * 3,
        i % 2 ? DUST[2] : DUST[3],
        (1 - p) * 0.75,
      )
    }
  }
  const key = `gt-foes-bull-${pose}-${frame}-${eyes}-${white ? 'w' : 'n'}`
  drawBaked(
    g,
    key,
    x - BULL_AX,
    y - BULL_AY,
    BULL_W,
    BULL_H,
    (c) => paintBull(c, pose, frame, eyes, white),
    { flipX: face > 0, alpha: fade },
  )
  const [ex, ey] = bullHeadPoint(pose, frame, BULL_EYE, x, y, face)
  if (eyes === 'hot') {
    // Glowing eyes: the unmistakable tell.
    const pulse =
      pose === 'paw' ? 0.5 + 0.5 * Math.sin(tick / (urgent ? 2 : 4)) : 1
    const [fx, fy] = bullHeadPoint(pose, frame, BULL_EYE_FAR, x, y, face)
    glow(g, ex, ey, 6 + pulse * 4, CRIMSON[2], 0.55 + pulse * 0.35)
    glow(g, fx, fy, 4 + pulse * 3, CRIMSON[2], 0.4 + pulse * 0.3)
    glow(g, ex, ey, 2.5, CRIMSON[4], 0.9)
    glow(g, fx, fy, 1.8, CRIMSON[4], 0.7)
    // A glint streaking off the eye.
    const flare = (pose === 'paw' ? 3 + pulse * (urgent ? 7 : 4) : 5) * fade
    g.save()
    g.globalCompositeOperation = 'lighter'
    g.fillStyle = rgba(CRIMSON[4], 0.85)
    g.beginPath()
    g.moveTo(ex - flare, ey)
    g.lineTo(ex, ey - 0.45)
    g.lineTo(ex + flare, ey)
    g.lineTo(ex, ey + 0.45)
    g.closePath()
    g.fill()
    g.fillRect(ex - 0.25, ey - flare * 0.45, 0.5, flare * 0.9)
    g.restore()
  } else if (eyes === 'dull' && !dying) {
    glow(g, ex, ey, 3, CRIMSON[2], 0.4)
  }
  if (pose === 'paw') {
    // Pawing the dirt: dust thrown back off the scraping hoof, steam snorted from the muzzle.
    const hoofX = x + (face > 0 ? 7 : -7)
    // Danger pooling under it, hotter as the charge comes.
    g.fillStyle = rgba(
      CRIMSON[2],
      urgent ? 0.3 + 0.15 * Math.sin(tick / 2) : 0.14,
    )
    ellipsePath(g, x, y, 24, 3.2)
    g.fill()
    for (let i = 0; i < 8; i++) {
      const p = ((b.t + i * 2.5) % 20) / 20
      puff(
        g,
        hoofX + behind * (2 + p * 16 + hash(i) * 4),
        y - 1 - p * 9 + p * p * 5,
        1.3 + p * 3.4,
        i % 3 ? DUST[3] : DUST[2],
        (1 - p) * 0.8,
      )
    }
    const [mx, my] = bullHeadPoint(pose, frame, BULL_MUZZLE, x, y, face)
    for (let i = 0; i < 3; i++) {
      const p = ((b.t + i * 9) % 26) / 26
      puff(
        g,
        mx + face * (1 + p * 5),
        my + 1 - p * 3,
        0.8 + p * 2.2,
        '#e8e6f0',
        (1 - p) * 0.5,
      )
    }
    // Grooves scraped in the ground.
    g.strokeStyle = rgba(DUST[0], 0.8)
    g.lineWidth = 0.6
    g.beginPath()
    g.moveTo(hoofX - 1, y - 0.4)
    g.lineTo(hoofX + behind * 7, y - 0.2)
    g.moveTo(hoofX, y + 0.4)
    g.lineTo(hoofX + behind * 5, y + 0.6)
    g.stroke()
  } else if (pose === 'stun' && !dying) {
    // Seeing stars, circling the lowered skull.
    for (let i = 0; i < 3; i++) {
      const a = b.t / 8 + (i * TAU) / 3
      const sx = ex + Math.cos(a) * 11
      const sy = ey - 11 + Math.sin(a) * 3
      const front = Math.sin(a) > 0
      glow(g, sx, sy, 4, AMBER[3], 0.5)
      twinkle(g, sx, sy, front ? 3.2 : 2.3, INK)
      twinkle(g, sx, sy, front ? 2.6 : 1.8, front ? AMBER[4] : AMBER[3])
    }
  }
  if (dying) drawDeathRemains(g, b, x, y, 26, BONE)
}

/** A boss coming apart: shards scattering and its haunt rising free. */
function drawDeathRemains(
  g: G,
  b: FoeArtBoss,
  x: number,
  y: number,
  height: number,
  ramp: readonly string[],
) {
  const k = 1 - b.dying / 70
  for (let i = 0; i < 12; i++) {
    const a = -Math.PI * (0.1 + 0.8 * hash(i + 1))
    const v = 18 + hash(i + 7) * 22
    const sx = x + Math.cos(a) * v * k * (i % 2 ? 1 : -1)
    const sy =
      y - height * (0.3 + hash(i + 3) * 0.6) + Math.sin(a) * v * k + 40 * k * k
    if (sy > y) continue
    const spin = k * 8 + i
    seg(
      g,
      sx - Math.cos(spin) * 1.6,
      sy - Math.sin(spin) * 1.6,
      sx + Math.cos(spin) * 1.6,
      sy + Math.sin(spin) * 1.6,
      0.9,
      ramp[3] ?? BONE[3],
    )
  }
  // The thin-place spirit leaving the remains.
  const ry = y - height * 0.6 - k * 46
  const ra = Math.sin(k * Math.PI) * 0.9
  glow(g, x, ry, 14, SPECTRE[3], ra * 0.6)
  g.save()
  g.globalAlpha = ra
  g.fillStyle = SPECTRE[4]
  g.beginPath()
  g.moveTo(x, ry - 6)
  g.quadraticCurveTo(x + 4, ry, x + 1.5, ry + 6 + Math.sin(k * 20) * 1.5)
  g.quadraticCurveTo(x, ry + 2, x - 1.5, ry + 6)
  g.quadraticCurveTo(x - 4, ry, x, ry - 6)
  g.fill()
  g.restore()
}

/**
 * A boss in world space, feet at (x, y). The Dust Devil whirls (clods gather at its crown when
 * its throw is due); the Bone Bull paws with lowered horns, burning eyes and thrown dust (its
 * tell), charges behind speed lines, and staggers seeing stars. Flash whitens it; dying shakes,
 * scatters it and releases its spirit. No health bar (the HUD draws that).
 */
export function drawBoss(g: G, boss: FoeArtBoss, tick: number) {
  if (boss.kind === 'devil') drawDevil(g, boss, tick)
  else drawBull(g, boss, tick)
}

// --- thrown gear ------------------------------------------------------------------------------

/** A kunai along +x, centred on its balance point, tip at +len/2. */
function paintKunai(b: G, len: number) {
  const h = len / 2
  // Ring pommel.
  b.beginPath()
  b.arc(-h + 1.2, 0, 1.1, 0, TAU)
  b.lineWidth = 1.3
  b.strokeStyle = INK
  b.stroke()
  b.lineWidth = 0.6
  b.strokeStyle = STEEL[2]
  b.stroke()
  // Wrapped grip with a crimson cord.
  poly(b, [-h + 2.2, -0.7, -0.6, -0.8, -0.6, 0.8, -h + 2.2, 0.7])
  inked(b, '#2a1d1a', 0.9)
  b.fillStyle = RUST[1]
  for (let x = -h + 2.8; x < -0.8; x += 1.3) b.fillRect(x, -0.75, 0.55, 1.5)
  // Leaf blade.
  poly(b, [-0.8, 0, 0.6, -1.9, h - 2.6, -0.9, h, 0, h - 2.6, 0.9, 0.6, 1.9])
  inked(b, STEEL[2], 0.9)
  b.fillStyle = STEEL[3]
  poly(b, [-0.4, 0, 0.6, -1.6, h - 2.6, -0.7, h - 0.4, 0])
  b.fill()
  b.fillStyle = STEEL[4]
  poly(b, [0.6, -0.2, h - 1, -0.1, h - 2.6, -0.5, 0.8, -1.1])
  b.fill()
  b.fillStyle = STEEL[1]
  poly(b, [-0.4, 0.1, h - 0.4, 0.1, h - 2.6, 0.75, 0.6, 1.6])
  b.fill()
}

/** A four-point shuriken at angle `a`, radius r. */
function paintShuriken(b: G, r: number, a: number) {
  b.save()
  b.rotate(a)
  b.beginPath()
  for (let i = 0; i < 4; i++) {
    const p = (i * TAU) / 4
    const q = p + TAU / 8
    const tipX = Math.cos(p) * r
    const tipY = Math.sin(p) * r
    if (i === 0) b.moveTo(tipX, tipY)
    else b.lineTo(tipX, tipY)
    b.lineTo(Math.cos(q) * r * 0.32, Math.sin(q) * r * 0.32)
  }
  b.closePath()
  inked(b, STEEL[2], 1)
  // Lit and shadowed facets.
  for (let i = 0; i < 4; i++) {
    const p = (i * TAU) / 4
    const q = p + TAU / 8
    b.fillStyle = i === 2 || i === 3 ? STEEL[3] : STEEL[1]
    poly(b, [
      0,
      0,
      Math.cos(p) * r,
      Math.sin(p) * r,
      Math.cos(q) * r * 0.32,
      Math.sin(q) * r * 0.32,
    ])
    b.fill()
  }
  b.fillStyle = STEEL[4]
  b.beginPath()
  b.arc(-r * 0.35, -r * 0.35, r * 0.12, 0, TAU)
  b.fill()
  b.fillStyle = INK
  b.beginPath()
  b.arc(0, 0, r * 0.18, 0, TAU)
  b.fill()
  b.restore()
}

/** The lantern flask, upright, centred at its glass. */
function paintLantern(b: G, s: number) {
  b.save()
  b.scale(s, s)
  // Bail handle.
  b.beginPath()
  b.arc(0, -4.4, 1.6, Math.PI, 0)
  b.lineWidth = 1.1
  b.strokeStyle = INK
  b.stroke()
  b.lineWidth = 0.5
  b.strokeStyle = AMBER[1]
  b.stroke()
  // Cap and base.
  poly(b, [-2.6, -2.8, -1.6, -4.4, 1.6, -4.4, 2.6, -2.8])
  inked(b, '#6b3a14', 0.9)
  poly(b, [-2.8, 2.8, 2.8, 2.8, 2.4, 4.2, -2.4, 4.2])
  inked(b, '#6b3a14', 0.9)
  // Glass with the flame burning in it.
  const glass = b.createRadialGradient(-0.2, 0.2, 0, 0, 0, 3.4)
  glass.addColorStop(0, AMBER[4])
  glass.addColorStop(0.45, AMBER[3])
  glass.addColorStop(1, AMBER[1])
  poly(b, [-2.3, -2.8, 2.3, -2.8, 2.7, 2.8, -2.7, 2.8])
  inked(b, glass, 0.9)
  b.fillStyle = RUST[2]
  poly(b, [-0.8, 1.4, 0, -1.6, 0.8, 1.4])
  b.fill()
  b.fillStyle = AMBER[4]
  poly(b, [-0.4, 1.2, 0, -0.4, 0.4, 1.2])
  b.fill()
  // Frame bars.
  b.strokeStyle = '#4a2a10'
  b.lineWidth = 0.5
  b.beginPath()
  b.moveTo(-1.2, -2.8)
  b.lineTo(-1.4, 2.8)
  b.moveTo(1.2, -2.8)
  b.lineTo(1.4, 2.8)
  b.stroke()
  b.restore()
}

/** The katana, edge up, along +x (tip at +len/2). */
function paintKatana(b: G, len: number) {
  const h = len / 2
  // Hilt with crimson wrap and a gold tsuba.
  poly(b, [-h, -0.8, -h + 4.6, -0.8, -h + 4.6, 0.8, -h, 0.8])
  inked(b, '#2a1416', 0.9)
  b.fillStyle = CRIMSON[1]
  for (let x = -h + 0.6; x < -h + 4.4; x += 1.2) {
    poly(b, [x, -0.8, x + 0.6, 0, x, 0.8])
    b.fill()
  }
  ellipsePath(b, -h + 5, 0, 0.7, 1.9)
  inked(b, AMBER[2], 0.8)
  // Gently curved blade.
  b.beginPath()
  b.moveTo(-h + 5.5, -0.7)
  b.quadraticCurveTo(0, -1.2, h, -1.6)
  b.quadraticCurveTo(h - 1.6, 0.2, -h + 5.5, 0.7)
  b.closePath()
  inked(b, STEEL[3], 0.9)
  b.strokeStyle = STEEL[4]
  b.lineWidth = 0.4
  b.beginPath()
  b.moveTo(-h + 6, -0.4)
  b.quadraticCurveTo(0, -0.8, h - 0.6, -1.4)
  b.stroke()
}

/** The kasa, as an icon. */
function paintKasa(b: G) {
  b.beginPath()
  b.moveTo(-7, 2.4)
  b.quadraticCurveTo(-2, -2, 0, -4.4)
  b.quadraticCurveTo(2, -2, 7, 2.4)
  b.quadraticCurveTo(0, 3.6, -7, 2.4)
  b.closePath()
  inked(b, '#d6b25e', 1)
  b.fillStyle = '#f0d58a'
  b.beginPath()
  b.moveTo(-6, 1.8)
  b.quadraticCurveTo(-2, -1.8, 0, -4)
  b.lineTo(-1, 1.6)
  b.closePath()
  b.fill()
  b.strokeStyle = '#a07d32'
  b.lineWidth = 0.4
  for (const dx of [-4.2, -1.6, 1.6, 4.2]) {
    b.beginPath()
    b.moveTo(0, -4)
    b.lineTo(dx, 2.6)
    b.stroke()
  }
  b.fillStyle = '#7a5520'
  b.beginPath()
  b.moveTo(-7, 2.4)
  b.quadraticCurveTo(0, 3.6, 7, 2.4)
  b.lineTo(6.6, 3.2)
  b.quadraticCurveTo(0, 4.4, -6.6, 3.2)
  b.closePath()
  b.fill()
}

function drawKunaiShot(g: G, k: FoeArtShot) {
  const dir = Math.sign(k.vx) || 1
  const x = snap(g, k.x)
  const y = snap(g, k.y)
  // A white speed trail streaming off the pommel, with flecks.
  const tail = x - dir * 6
  const grad = g.createLinearGradient(tail, 0, tail - dir * 20, 0)
  grad.addColorStop(0, 'rgba(255, 255, 255, 0.95)')
  grad.addColorStop(0.5, 'rgba(220, 236, 255, 0.45)')
  grad.addColorStop(1, 'rgba(220, 236, 255, 0)')
  g.fillStyle = grad
  g.beginPath()
  g.moveTo(tail, y - 0.9)
  g.lineTo(tail - dir * 20, y - 0.15)
  g.lineTo(tail - dir * 20, y + 0.15)
  g.lineTo(tail, y + 0.9)
  g.closePath()
  g.fill()
  for (let i = 0; i < 3; i++) {
    const p = ((k.t * 2 + i * 7) % 18) / 18
    g.fillStyle = rgba('#ffffff', 0.8 * (1 - p))
    g.fillRect(tail - dir * (4 + p * 16), y + (i - 1) * 2.2, dir * -2.5, 0.5)
  }
  drawBaked(
    g,
    'gt-foes-kunai',
    x - 7,
    y - 3,
    14,
    6,
    (b) => {
      b.translate(7, 3)
      paintKunai(b, 13)
    },
    { flipX: dir < 0 },
  )
}

function drawShurikenShot(g: G, k: FoeArtShot) {
  const dir = Math.sign(k.vx) || 1
  const x = snap(g, k.x)
  const y = snap(g, k.y)
  // A spin blur ring and a short wake.
  g.strokeStyle = rgba(STEEL[3], 0.35)
  g.lineWidth = 0.6
  g.beginPath()
  g.arc(x, y, 4.6, 0, TAU)
  g.stroke()
  g.strokeStyle = rgba('#ffffff', 0.35)
  g.lineWidth = 0.8
  g.beginPath()
  g.moveTo(x - dir * 5, y - k.vy * 1.2)
  g.lineTo(x - dir * 12, y - k.vy * 3)
  g.stroke()
  const frame = k.t % 4
  drawBaked(
    g,
    `gt-foes-shuriken-${frame}`,
    x - 5,
    y - 5,
    10,
    10,
    (b) => {
      b.translate(5, 5)
      paintShuriken(b, 4.2, (frame * TAU) / 16)
    },
    { flipX: dir < 0 },
  )
}

function drawLanternShot(g: G, k: FoeArtShot) {
  const x = snap(g, k.x)
  const y = snap(g, k.y)
  // Sparks shed along the arc.
  for (let i = 1; i <= 4; i++) {
    const p = i / 5
    const sx = x - k.vx * i * 1.6 + (hash(k.t + i) - 0.5) * 2
    const sy = y - (k.vy - 0.25 * i) * i * 1.6
    puff(g, sx, sy, 0.7 * (1 - p) + 0.3, i % 2 ? AMBER[3] : RUST[3], 1 - p)
  }
  glow(g, x, y, 10, AMBER[2], 0.55)
  const frame = Math.floor(k.t / 3) % 8
  drawBaked(g, `gt-foes-lantern-${frame}`, x - 6, y - 6, 12, 12, (b) => {
    b.translate(6, 6)
    b.rotate((frame * TAU) / 8)
    paintLantern(b, 1)
  })
}

function drawIaiCut(g: G, k: FoeArtShot) {
  const face = k.face ?? (Math.sign(k.vx) || 1)
  const sweep = Math.max(0, Math.min(1, (10 - k.life) / 10))
  const alpha = Math.max(0.2, Math.min(1, k.life / 10))
  const a0 = -1.3 + sweep * 0.4
  const a1 = 1.1 + sweep * 0.4
  g.save()
  g.translate(k.x - face * 11, k.y - 1)
  g.scale(face, 1)
  const crescent = (r: number, inset: number) => {
    g.beginPath()
    g.arc(0, 0, r, a0, a1)
    g.arc(-inset, 0, r - 1.2, a1 - 0.06, a0 + 0.06, true)
    g.closePath()
  }
  // Afterimage, glow, then the bright edge.
  g.globalAlpha = alpha * 0.22
  g.fillStyle = SPECTRE[4]
  g.rotate(-0.25)
  crescent(13.5, 3)
  g.fill()
  g.rotate(0.25)
  g.globalCompositeOperation = 'lighter'
  g.globalAlpha = alpha * 0.5
  g.fillStyle = '#bfe9ff'
  crescent(16, 4.4)
  g.fill()
  g.globalCompositeOperation = 'source-over'
  g.globalAlpha = alpha
  const edge = g.createLinearGradient(0, -15, 0, 15)
  edge.addColorStop(0, rgba('#ffffff', 0.2))
  edge.addColorStop(0.5, '#ffffff')
  edge.addColorStop(1, rgba('#e0f2fe', 0.3))
  g.fillStyle = edge
  crescent(15, 3.2)
  g.fill()
  // Glints at the tip of the cut.
  twinkle(g, Math.cos(a1) * 15, Math.sin(a1) * 15, 2.6, '#ffffff')
  g.restore()
}

/**
 * A thrown weapon in world space at (x, y): kunai with a white speed trail, a spinning shuriken,
 * a tumbling lantern flask, the iai cut's crescent (centred as the game's: (x - face*11, y - 1)).
 * The kasa itself is the hero module's; this leaves only a faint wake for it.
 */
export function drawShot(g: G, shot: FoeArtShot, tick: number) {
  void tick
  if (shot.weapon === 'kunai') drawKunaiShot(g, shot)
  else if (shot.weapon === 'shuriken') drawShurikenShot(g, shot)
  else if (shot.weapon === 'lantern') drawLanternShot(g, shot)
  else if (shot.weapon === 'katana') drawIaiCut(g, shot)
  else {
    // The kasa's faint wake: a straw-gold swirl.
    g.save()
    g.strokeStyle = rgba('#f0d58a', 0.28)
    g.lineWidth = 0.8
    g.beginPath()
    g.arc(shot.x, shot.y, 10, shot.t / 2, shot.t / 2 + 1.6)
    g.stroke()
    g.beginPath()
    g.arc(shot.x, shot.y, 10, shot.t / 2 + Math.PI, shot.t / 2 + Math.PI + 1.6)
    g.stroke()
    g.restore()
  }
}

// --- lantern fire ---------------------------------------------------------------------------

const FIRE_W = 32
const FIRE_H = 28
const FIRE_FRAMES = 6

function paintFire(b: G, frame: number) {
  b.translate(FIRE_W / 2, FIRE_H - 2)
  const w = (frame / FIRE_FRAMES) * TAU
  const tongue = (cx: number, h: number, wd: number, lean: number) => {
    b.beginPath()
    b.moveTo(cx - wd, 0)
    b.quadraticCurveTo(cx - wd * 0.9, -h * 0.5, cx + lean, -h)
    b.quadraticCurveTo(cx + wd * 0.9, -h * 0.45, cx + wd, 0)
    b.closePath()
  }
  const flames = [-9, -4.5, 0, 4.5, 9]
  const height = (i: number) =>
    (12 + (2 - Math.abs(i - 2)) * 4) * (0.8 + 0.25 * Math.sin(w + i * 2.1))
  const lean = (i: number) => Math.sin(w * 2 + i * 1.3) * 1.6
  for (const [layer, color, scale] of [
    [0, CRIMSON[1], 1.15],
    [1, RUST[2], 1],
    [2, AMBER[2], 0.7],
    [3, AMBER[4], 0.38],
  ] as const) {
    b.fillStyle = color
    flames.forEach((cx, i) => {
      tongue(
        cx,
        height(i) * scale,
        (layer === 0 ? 4 : 3.2) * scale + 0.4,
        lean(i) * scale,
      )
      b.fill()
    })
  }
  // Charred embers on the ground.
  b.fillStyle = '#2a1410'
  ellipsePath(b, 0, 0.6, 12, 1.4)
  b.fill()
  b.fillStyle = AMBER[2]
  for (let i = 0; i < 6; i++)
    b.fillRect(-10 + i * 4 + hash(i + frame) * 1.5, -0.2, 1, 0.8)
}

/** Lantern fire burning on the ground at fire.x (world space), dying down over its last 20 ticks. */
export function drawFire(
  g: G,
  fire: FoeArtFire,
  groundY: number,
  tick: number,
) {
  const fade = Math.max(0, Math.min(1, fire.life / 20))
  if (fade <= 0) return
  const x = snap(g, fire.x)
  glow(
    g,
    x,
    groundY - 4,
    22 * (0.6 + fade * 0.4),
    AMBER[2],
    0.4 * fade + Math.sin(tick / 3) * 0.05,
  )
  g.fillStyle = rgba(AMBER[2], 0.35 * fade)
  ellipsePath(g, x, groundY, 15, 2)
  g.fill()
  const frame =
    (Math.floor(tick / 4) + Math.floor(Math.abs(fire.x))) % FIRE_FRAMES
  g.save()
  g.translate(x, groundY)
  g.scale(1, 0.25 + fade * 0.75)
  drawBaked(
    g,
    `gt-foes-fire-${frame}`,
    -FIRE_W / 2,
    -(FIRE_H - 2),
    FIRE_W,
    FIRE_H,
    (b) => paintFire(b, frame),
    {
      alpha: 0.5 + fade * 0.5,
    },
  )
  g.restore()
  // Embers lifting off.
  for (let i = 0; i < 5; i++) {
    const p = ((tick + i * 11 + fire.x) % 40) / 40
    const ex =
      x + (hash(i + Math.floor(fire.x)) - 0.5) * 18 + Math.sin(p * 6 + i) * 2
    puff(
      g,
      ex,
      groundY - 4 - p * 22,
      0.55,
      i % 2 ? AMBER[3] : RUST[3],
      (1 - p) * fade,
    )
  }
}

// --- pickups ----------------------------------------------------------------------------------

function paintPoncho(b: G) {
  b.translate(10, 8)
  // Zuzu's spare poncho, laid out: rust cloth falling from the neck, zigzag trim, fringe.
  b.strokeStyle = RUST[1]
  b.lineWidth = 0.5
  b.beginPath()
  for (let i = 0; i < 9; i++) {
    const x = -7 + i * 1.75
    b.moveTo(x, 4.6)
    b.lineTo(x + 0.2, 6.6)
  }
  b.stroke()
  b.beginPath()
  b.moveTo(-1.8, -5.8)
  b.quadraticCurveTo(-5.6, -1.6, -8.6, 4.6)
  b.quadraticCurveTo(0, 5.8, 8.6, 4.6)
  b.quadraticCurveTo(5.6, -1.6, 1.8, -5.8)
  b.closePath()
  inked(b, RUST[2], 1.1)
  // Shadowed fold down the right, light on the left shoulder.
  b.fillStyle = RUST[1]
  b.beginPath()
  b.moveTo(1, -5.4)
  b.quadraticCurveTo(4.6, -1.2, 8.4, 4.6)
  b.quadraticCurveTo(5, 5.2, 2.6, 5.2)
  b.quadraticCurveTo(3.2, 0, 1, -5.4)
  b.closePath()
  b.fill()
  b.fillStyle = RUST[3]
  b.beginPath()
  b.moveTo(-1.8, -5.4)
  b.quadraticCurveTo(-4.6, -2, -6.2, 1.2)
  b.quadraticCurveTo(-4, -1.4, -1, -4.4)
  b.closePath()
  b.fill()
  // Neck opening.
  b.fillStyle = RUST[0]
  ellipsePath(b, 0, -5.4, 2.2, 1)
  b.fill()
  // Orange zigzag trim above the hem.
  b.strokeStyle = '#f97316'
  b.lineWidth = 0.9
  b.lineJoin = 'miter'
  b.beginPath()
  for (let i = 0; i <= 12; i++) {
    const x = -7.4 + i * 1.23
    const y = 2.6 + (i % 2 ? -1 : 0) + Math.abs(x) * 0.05
    if (i === 0) b.moveTo(x, y)
    else b.lineTo(x, y)
  }
  b.stroke()
  b.strokeStyle = '#fdba74'
  b.lineWidth = 0.35
  b.beginPath()
  b.moveTo(-5.4, -0.6)
  b.lineTo(5.4, -0.6)
  b.stroke()
}

function paintNugget(b: G) {
  b.translate(6, 5)
  blob(
    b,
    [
      -4.2, 1.4, -3.4, -1.8, -1, -3, 1.6, -2.6, 3.8, -1, 4, 1.8, 1, 3, -2.4,
      2.8,
    ],
  )
  inked(b, AMBER[2], 1)
  b.fillStyle = AMBER[1]
  blob(b, [0.4, 2.6, 3.6, 1.6, 3.4, -0.4, 1.4, 0.8, -1.6, 1.8])
  b.fill()
  b.fillStyle = AMBER[3]
  blob(b, [-3, 0.2, -2.6, -1.6, -0.6, -2.4, 0.4, -1, -1.4, 0])
  b.fill()
  b.fillStyle = AMBER[4]
  b.fillRect(-2, -1.6, 0.9, 0.9)
}

function paintCoin(b: G, frame: number) {
  b.translate(5, 5)
  const sx = Math.max(0.18, Math.abs(Math.cos((frame / 6) * Math.PI)))
  b.scale(sx, 1)
  b.beginPath()
  b.arc(0, 0, 3.6, 0, TAU)
  inked(b, '#b8c2d4', 1.1 / sx)
  b.fillStyle = '#7d879c'
  b.beginPath()
  b.arc(0.6, 0.6, 3, 0, TAU)
  b.fill()
  b.fillStyle = '#dde4f0'
  b.beginPath()
  b.arc(-0.3, -0.3, 2.6, 0, TAU)
  b.fill()
  // A stamped star.
  twinkle(b, -0.1, -0.1, 1.8, '#8d97ac')
  b.fillStyle = '#ffffff'
  b.fillRect(-1.8, -2, 0.8, 0.8)
}

function paintBundle(b: G) {
  b.translate(9, 9)
  // A furoshiki-wrapped bundle, knot ears on top.
  blob(
    b,
    [
      -6.4, -2.4, -4.6, -5, 0, -5.4, 4.6, -5, 6.4, -2.4, 6.6, 3.6, 4.4, 6.4,
      -4.4, 6.4, -6.6, 3.6,
    ],
  )
  inked(b, '#2d2350', 1.1)
  b.fillStyle = '#1d1638'
  blob(b, [1, 6.2, 4.6, 6, 6.2, 3, 5.6, -1, 3, 2])
  b.fill()
  b.fillStyle = '#463a78'
  blob(b, [-5.6, -2, -4, -4.6, 0, -4.8, -2.6, -2.6, -5, 0])
  b.fill()
  // Knot.
  poly(b, [-1.6, -5, -3.6, -8.2, -0.6, -6.4, 0.6, -6.4, 3.6, -8.2, 1.6, -5])
  inked(b, '#463a78', 0.9)
  b.fillStyle = '#5b4d94'
  ellipsePath(b, 0, -5.2, 1.4, 1)
  b.fill()
  // Amber cord trim.
  b.strokeStyle = AMBER[2]
  b.lineWidth = 0.5
  b.beginPath()
  b.moveTo(-6.2, 4)
  b.quadraticCurveTo(0, 6.6, 6.2, 4)
  b.stroke()
}

/**
 * A pickup in world space centred at (x, y): poncho, gold nugget, silver coin, or gear (a wrapped
 * bundle with the weapon's icon). Blinks out over its last 90 ticks, as the game always has.
 */
export function drawPickup(g: G, p: FoeArtPickup, tick: number) {
  if (p.life < 90 && Math.floor(tick / 5) % 2) return
  const bob = Math.sin(tick / 12 + p.x) * 0.6
  const x = snap(g, p.x)
  const y = snap(g, p.y + bob)
  const sparkle = (dx: number, dy: number, color: string) => {
    const c = (tick + Math.floor(p.x)) % 48
    if (c < 10)
      twinkle(g, x + dx, y + dy, 1 + Math.sin((c / 10) * Math.PI) * 1.6, color)
  }
  if (p.kind === 'poncho') {
    glow(g, x, y, 11, RUST[3], 0.22)
    drawBaked(g, 'gt-foes-poncho', x - 10, y - 8, 20, 16, paintPoncho)
    sparkle(5, -4, '#ffe0c2')
  } else if (p.kind === 'nugget') {
    glow(g, x, y, 9, AMBER[2], 0.35 + Math.sin(tick / 8) * 0.08)
    drawBaked(g, 'gt-foes-nugget', x - 6, y - 5, 12, 10, paintNugget)
    sparkle(-2, -3, AMBER[4])
  } else if (p.kind === 'coin') {
    const frame = Math.floor(tick / 5) % 6
    glow(g, x, y, 7, '#dde4f0', 0.25)
    drawBaked(g, `gt-foes-coin-${frame}`, x - 5, y - 5, 10, 10, (b) =>
      paintCoin(b, frame),
    )
    sparkle(-1.6, -2.4, '#ffffff')
  } else {
    glow(g, x, y, 13, AMBER[2], 0.3 + Math.sin(tick / 6) * 0.15)
    drawBaked(g, 'gt-foes-bundle', x - 9, y - 9, 18, 18, paintBundle)
    drawWeaponIcon(g, p.kind, x, y + 0.6, 10)
    sparkle(5, -5, AMBER[4])
  }
}

/** One of the Dust Devil's clods (world space, centred at (x, y)). */
export function drawClod(g: G, c: FoeArtClod) {
  const frame = Math.floor(Math.abs(c.x + c.y) / 3) % 4
  drawBaked(
    g,
    `gt-foes-clod-${frame}`,
    snap(g, c.x - 4),
    snap(g, c.y - 4),
    8,
    8,
    (b) => {
      b.translate(4, 4)
      b.rotate((frame * TAU) / 4)
      blob(
        b,
        [
          -2.8, -0.6, -1.6, -2.6, 0.8, -2.8, 2.8, -1, 2.6, 1.8, 0.4, 3, -2.2,
          2.2,
        ],
      )
      inked(b, '#7c5a32', 1)
      b.fillStyle = '#5a3e22'
      blob(b, [0.6, 2.6, 2.4, 1.4, 2.2, -0.2, 0.4, 1, -1.6, 1.8])
      b.fill()
      b.fillStyle = DUST[3]
      blob(b, [-2, -0.8, -1.2, -2, 0.4, -2.2, -0.6, -1])
      b.fill()
      b.fillStyle = '#3a2614'
      b.fillRect(0.6, -0.4, 0.7, 0.7)
      b.fillRect(-1.2, 1, 0.6, 0.6)
    },
  )
}

/**
 * A weapon icon in screen (or world) space, centred at (x, y) and `size` logical px across (the
 * old HUD icon was about 12). Kunai and katana lie on the diagonal, tips up-right.
 */
export function drawWeaponIcon(
  g: G,
  weapon: FoeArtWeapon,
  x: number,
  y: number,
  size: number,
) {
  const s = Math.max(4, size)
  drawBaked(
    g,
    `gt-foes-icon-${weapon}-${s}`,
    snap(g, x - s / 2),
    snap(g, y - s / 2),
    s,
    s,
    (b) => {
      b.scale(s / 16, s / 16)
      b.translate(8, 8)
      if (weapon === 'kunai') {
        b.rotate(-Math.PI / 4)
        paintKunai(b, 17)
      } else if (weapon === 'shuriken') {
        paintShuriken(b, 6.6, TAU / 16)
      } else if (weapon === 'kasa') {
        b.translate(0, 1)
        paintKasa(b)
      } else if (weapon === 'lantern') {
        b.translate(0, 0.6)
        paintLantern(b, 1.45)
      } else {
        b.rotate(-Math.PI / 4)
        paintKatana(b, 19)
      }
    },
  )
}
