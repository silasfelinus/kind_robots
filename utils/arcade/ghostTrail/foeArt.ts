// /utils/arcade/ghostTrail/foeArt.ts
//
// Zuzu: Ghost Trail's foes, bosses, projectiles and pickups (conductor kr-arcade t-013/t-014),
// painted to the accepted mockups: the spectral bone coyote (skeleton canid in a bowler-brimmed
// cowboy hat and red bandana, wrapped in a cyan haunt-glow, ember-red eyes), hooded ghosts that
// claw up out of the dirt, storm crows, the Dust Devil and the Bone Bull, plus Zuzu's thrown gear.
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

type G = CanvasRenderingContext2D

export type FoeArtWeapon = 'kunai' | 'shuriken' | 'kasa' | 'lantern' | 'katana'

export type FoeArtFoe = {
  kind: 'spirit' | 'crow' | 'hyena'
  x: number
  y: number
  vx: number
  vy: number
  hp: number
  t: number
  phase: 'rise' | 'walk' | 'sink'
  baseY: number
  carrying: boolean
  /** Optional: sign toward Zuzu (spirits reach for him). Defaults to the sign of vx, else left. */
  face?: number
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

/** A foe in world space; (x, y) are its feet (a crow's y is its flight line). */
export function drawFoe(g: G, foe: FoeArtFoe, tick: number) {
  if (foe.kind === 'spirit') drawGhost(g, foe, tick)
  else if (foe.kind === 'crow') drawCrow(g, foe, tick)
  else drawCoyote(g, foe, tick)
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
