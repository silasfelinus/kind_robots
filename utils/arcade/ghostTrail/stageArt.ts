// /utils/arcade/ghostTrail/stageArt.ts
//
// Zuzu: Ghost Trail's backdrops and terrain (conductor kr-arcade t-013/t-014), drawn to the three
// accepted mockups: a delivered far plate panned slowly behind two procedural parallax silhouette
// layers and drifting fog, then hand-built gameplay surfaces whose silhouettes are exactly the
// collision the game uses (ground runs and pits, boardwalk ledges, the 12x16 obstacle blocks,
// crates, the end gate), and a low foreground fence strip drawn over the actors.
//
// Everything is pure drawing from the arguments: static art is baked once per key and density
// through bake.ts, lights flicker from `tick`, and headless (no document) it all still draws
// straight onto the context without throwing.

import { drawBaked, loadedImage } from './bake'
import { INK, backdropRng, glow, mix, rgba } from '../snes'

export type StageKey = 'town' | 'boneyard' | 'waterhole' | 'belltower'

export type TerrainStage = {
  key: StageKey
  /** Solid ground runs [from, to] in world x, with pits between them. */
  ground: ReadonlyArray<readonly [number, number]>
  /** Ledges: land on top at y anywhere in (x, x + w). */
  boardwalks: ReadonlyArray<{ x: number; y: number; w: number }>
  /** Centres of the solid 12x16 obstacle blocks standing on the ground. */
  tombstones: readonly number[]
}

type Ctx = CanvasRenderingContext2D

const W = 320
const H = 240
const GROUND_Y = 208
const STAGE_END = 3520
/** The camera's furthest scroll (the game clamps camX to STAGE_END + 80 - W). */
const CAM_MAX = STAGE_END + 80 - W
const TILE = 64

// --- palettes -----------------------------------------------------------------------------------

type Look = {
  plate: string
  sky: readonly string[]
  moon: { x: number; y: number; r: number; color: string; shade: string }
  far: string
  farRim: string
  near: string
  nearRim: string
  /** Mid-ground silhouettes: the far layer, then the nearer one. */
  midA: string
  midARim: string
  midB: string
  midBRim: string
  window: string
  mist: string
  /** How strongly fog veils the scene (0..1). */
  fog: number
}

const LOOKS: Record<StageKey, Look> = {
  town: {
    plate: 'ghost-town-far',
    sky: ['#07071c', '#100f30', '#1d1a4a', '#2e2763', '#463a7c', '#5f4c8c'],
    moon: { x: 236, y: 62, r: 30, color: '#f4e7c4', shade: '#cdb994' },
    far: '#2a2350',
    farRim: '#4d4184',
    near: '#1d1840',
    nearRim: '#3c3270',
    midA: '#17132f',
    midARim: '#4a3f80',
    midB: '#0c0a1c',
    midBRim: '#3a2f68',
    window: '#f0a04a',
    mist: '#7a6cb0',
    fog: 0.5,
  },
  boneyard: {
    plate: 'bone-yard-far',
    sky: ['#080820', '#121638', '#1f2852', '#2f4468', '#47707e', '#6a9a94'],
    moon: { x: 214, y: 44, r: 18, color: '#eef3e2', shade: '#c5d0bc' },
    far: '#28224a',
    farRim: '#575090',
    near: '#1b1736',
    nearRim: '#3d3870',
    midA: '#16142e',
    midARim: '#4f5a8c',
    midB: '#0b0a1a',
    midBRim: '#3a3a6a',
    window: '#f2a850',
    mist: '#8fd6c8',
    fog: 0.55,
  },
  waterhole: {
    plate: 'waterhole-far',
    sky: ['#03101a', '#061e28', '#0b2f38', '#114440', '#1b5a50', '#2f7a6a'],
    moon: { x: 78, y: 48, r: 18, color: '#dff4e6', shade: '#b4d0c0' },
    far: '#0c2a32',
    farRim: '#2c6a64',
    near: '#0a1f26',
    nearRim: '#1f5250',
    midA: '#081a20',
    midARim: '#2f6e66',
    midB: '#041014',
    midBRim: '#1c4a48',
    window: '#f4b050',
    mist: '#78dcc4',
    fog: 0.5,
  },
  belltower: {
    plate: 'bell-tower-far',
    sky: ['#0c0820', '#1c1338', '#33204c', '#4f2852', '#743450', '#97464c'],
    moon: { x: 92, y: 60, r: 30, color: '#f6dcb4', shade: '#d4b48e' },
    far: '#2a1736',
    farRim: '#6a3a5c',
    near: '#1e1028',
    nearRim: '#52304c',
    midA: '#1a0e24',
    midARim: '#6a3a58',
    midB: '#0e0614',
    midBRim: '#4a2a40',
    window: '#ff9a48',
    mist: '#c87088',
    fog: 0.32,
  },
}

/** Five-step ramps [ink, shadow, base, light, highlight] for the surfaces. */
const WOOD = ['#1e120c', '#3e2616', '#6a4226', '#9a6a3e', '#d0a068'] as const
const GREYWOOD = [
  '#16121c',
  '#2e2832',
  '#4a4248',
  '#726666',
  '#a89c90',
] as const
const DOCK = ['#14140e', '#2c2a1c', '#4a442e', '#6e6644', '#9e9468'] as const
const SLATE = ['#120e1e', '#252038', '#3c3456', '#5c527a', '#8c82aa'] as const
const SANDSTONE = [
  '#1c1218',
  '#3a2a30',
  '#5e4a48',
  '#8a7266',
  '#b8a08a',
] as const
const MASONRY = ['#1c0e16', '#3a2028', '#5c3838', '#8a5a4c', '#bc8c6c'] as const
const MUD = ['#0c0906', '#1e1810', '#30261a', '#4a3a26', '#6e5a3c'] as const
const BONE = ['#3a3028', '#7a6a56', '#b0a084', '#d8ccb0', '#f4ecd8'] as const
const IRON = ['#06060c', '#14141e', '#26263a', '#3e3e58', '#6a6a8a'] as const
const AMBER = '#ffb347'
const CYAN = '#7df3ff'
const CRIMSON = '#ff3a4a'

type Ramp = readonly [string, string, string, string, string]

// --- small helpers ------------------------------------------------------------------------------

/** A stable 0..1 hash of an integer (never the game's rng). */
function hash(n: number): number {
  let h = Math.imul((n | 0) ^ 0x9e3779b9, 0x85ebca6b)
  h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35)
  h ^= h >>> 16
  return (h >>> 0) / 4294967296
}

function mod(a: number, n: number): number {
  return ((a % n) + n) % n
}

function roundRect(
  b: Ctx,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  const k = Math.max(0, Math.min(r, w / 2, h / 2))
  b.beginPath()
  b.moveTo(x + k, y)
  b.lineTo(x + w - k, y)
  b.arcTo(x + w, y, x + w, y + k, k)
  b.lineTo(x + w, y + h - k)
  b.arcTo(x + w, y + h, x + w - k, y + h, k)
  b.lineTo(x + k, y + h)
  b.arcTo(x, y + h, x, y + h - k, k)
  b.lineTo(x, y + k)
  b.arcTo(x, y, x + k, y, k)
  b.closePath()
}

/** A shaded block lit from the upper left, ink-outlined: stones, slabs and ashlar. */
function block(
  b: Ctx,
  x: number,
  y: number,
  w: number,
  h: number,
  ramp: Ramp,
  r = 1.5,
  tone = 0,
) {
  const base =
    tone === 0
      ? ramp[2]
      : mix(ramp[2], tone > 0 ? ramp[3] : ramp[1], Math.abs(tone))
  roundRect(b, x, y, w, h, r)
  b.fillStyle = base
  b.fill()
  b.save()
  b.clip()
  b.fillStyle = ramp[1]
  b.fillRect(x + w * 0.35, y + h - Math.min(2, h * 0.3), w, h)
  b.fillRect(x + w - Math.min(1.6, w * 0.25), y + h * 0.3, 3, h)
  b.fillStyle = ramp[3]
  b.fillRect(x, y, w, Math.min(1.2, h * 0.25))
  b.fillRect(x, y, Math.min(1, w * 0.2), h * 0.7)
  b.fillStyle = rgba(ramp[4], 0.7)
  b.fillRect(x + 0.6, y + 0.4, Math.min(w * 0.45, 5), 0.6)
  b.restore()
  roundRect(b, x, y, w, h, r)
  b.strokeStyle = rgba(ramp[0], 0.9)
  b.lineWidth = 0.5
  b.stroke()
}

/** A horizontal timber with grain, lit along its top. */
function plank(
  b: Ctx,
  x: number,
  y: number,
  w: number,
  h: number,
  ramp: Ramp,
  seed: number,
) {
  const rand = backdropRng(seed)
  b.fillStyle = ramp[2]
  b.fillRect(x, y, w, h)
  b.fillStyle = ramp[3]
  b.fillRect(x, y, w, Math.min(1, h * 0.3))
  b.fillStyle = ramp[1]
  b.fillRect(x, y + h - Math.min(1, h * 0.3), w, Math.min(1, h * 0.3))
  b.strokeStyle = rgba(ramp[1], 0.8)
  b.lineWidth = 0.35
  for (let i = 0; i < Math.max(1, h / 1.6); i++) {
    const gy = y + 1 + rand() * (h - 2)
    const gx = x + rand() * w * 0.5
    b.beginPath()
    b.moveTo(gx, gy)
    b.lineTo(gx + w * (0.3 + rand() * 0.5), gy + (rand() - 0.5) * 0.6)
    b.stroke()
  }
  if (rand() < 0.5) {
    b.fillStyle = ramp[1]
    b.beginPath()
    b.ellipse(
      x + w * (0.2 + rand() * 0.6),
      y + h / 2,
      1,
      0.6,
      0,
      0,
      Math.PI * 2,
    )
    b.fill()
  }
  b.strokeStyle = rgba(ramp[0], 0.95)
  b.lineWidth = 0.5
  b.strokeRect(x + 0.25, y + 0.25, w - 0.5, h - 0.5)
}

/** A vertical timber post, lit on its left face. */
function post(b: Ctx, x: number, y: number, w: number, h: number, ramp: Ramp) {
  b.fillStyle = ramp[2]
  b.fillRect(x, y, w, h)
  b.fillStyle = ramp[3]
  b.fillRect(x, y, Math.max(0.6, w * 0.3), h)
  b.fillStyle = ramp[1]
  b.fillRect(x + w * 0.7, y, w * 0.3, h)
  b.strokeStyle = rgba(ramp[1], 0.7)
  b.lineWidth = 0.3
  for (let gy = y + 3; gy < y + h - 2; gy += 5.5) {
    b.beginPath()
    b.moveTo(x + w * 0.45, gy)
    b.lineTo(x + w * 0.5, gy + 3)
    b.stroke()
  }
  b.strokeStyle = ramp[0]
  b.lineWidth = 0.5
  b.strokeRect(x + 0.25, y + 0.25, w - 0.5, h - 0.5)
}

/** A diagonal brace: a thick ink line with a lighter core. */
function brace(
  b: Ctx,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  ramp: Ramp,
  w = 2,
) {
  b.lineCap = 'butt'
  b.strokeStyle = ramp[0]
  b.lineWidth = w + 1
  b.beginPath()
  b.moveTo(x1, y1)
  b.lineTo(x2, y2)
  b.stroke()
  b.strokeStyle = ramp[2]
  b.lineWidth = w
  b.stroke()
  b.strokeStyle = rgba(ramp[3], 0.8)
  b.lineWidth = w * 0.3
  b.beginPath()
  b.moveTo(x1, y1 - w * 0.25)
  b.lineTo(x2, y2 - w * 0.25)
  b.stroke()
}

/** A sagging chain of little links between two points. */
function chain(
  b: Ctx,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  sag: number,
) {
  const len = Math.hypot(x2 - x1, y2 - y1) + sag
  const n = Math.max(2, Math.round(len / 1.6))
  for (let i = 0; i <= n; i++) {
    const t = i / n
    const x = x1 + (x2 - x1) * t
    const y = y1 + (y2 - y1) * t + Math.sin(t * Math.PI) * sag
    b.strokeStyle = IRON[0]
    b.lineWidth = 0.9
    b.beginPath()
    if (i % 2) b.ellipse(x, y, 0.5, 0.9, 0, 0, Math.PI * 2)
    else b.ellipse(x, y, 0.9, 0.5, 0, 0, Math.PI * 2)
    b.stroke()
    b.strokeStyle = IRON[3]
    b.lineWidth = 0.35
    b.stroke()
  }
}

/** A hanging chain straight down. */
function dropChain(b: Ctx, x: number, y1: number, y2: number) {
  for (let y = y1, i = 0; y < y2; y += 1.5, i++) {
    b.strokeStyle = IRON[0]
    b.lineWidth = 0.8
    b.beginPath()
    if (i % 2) b.ellipse(x, y, 0.45, 0.85, 0, 0, Math.PI * 2)
    else b.ellipse(x, y, 0.85, 0.45, 0, 0, Math.PI * 2)
    b.stroke()
    b.strokeStyle = IRON[3]
    b.lineWidth = 0.3
    b.stroke()
  }
}

/** A frontier lantern hanging with its top at (x, y): iron cage, amber glass. 5 x 8. */
function lantern(b: Ctx, x: number, y: number, lit = true) {
  b.fillStyle = IRON[1]
  b.fillRect(x - 1, y, 2, 1)
  b.beginPath()
  b.moveTo(x - 2.5, y + 2)
  b.lineTo(x, y + 0.6)
  b.lineTo(x + 2.5, y + 2)
  b.closePath()
  b.fill()
  const glass = b.createLinearGradient(x - 2, y + 2, x + 2, y + 7)
  glass.addColorStop(0, lit ? '#fff2c0' : '#4a4a5a')
  glass.addColorStop(0.5, lit ? '#ffb347' : '#2e2e3a')
  glass.addColorStop(1, lit ? '#c4521a' : '#1c1c26')
  b.fillStyle = glass
  b.fillRect(x - 2, y + 2, 4, 5)
  b.fillStyle = IRON[0]
  b.fillRect(x - 2.5, y + 2, 0.6, 5)
  b.fillRect(x + 1.9, y + 2, 0.6, 5)
  b.fillRect(x - 0.3, y + 2, 0.6, 5)
  b.fillRect(x - 2.5, y + 7, 5, 1)
  if (lit) {
    b.fillStyle = '#fffbe6'
    b.fillRect(x - 0.9, y + 3.6, 0.8, 1.6)
  }
}

/** A church bell with its crown at (cx, top), `s` wide. */
function bellShape(
  b: Ctx,
  cx: number,
  top: number,
  s: number,
  ramp: Ramp = BRONZE,
) {
  const h = s * 1.05
  b.beginPath()
  b.moveTo(cx - s * 0.18, top + s * 0.08)
  b.quadraticCurveTo(cx - s * 0.36, top + h * 0.2, cx - s * 0.36, top + h * 0.6)
  b.quadraticCurveTo(cx - s * 0.4, top + h * 0.85, cx - s * 0.52, top + h)
  b.lineTo(cx + s * 0.52, top + h)
  b.quadraticCurveTo(cx + s * 0.4, top + h * 0.85, cx + s * 0.36, top + h * 0.6)
  b.quadraticCurveTo(
    cx + s * 0.36,
    top + h * 0.2,
    cx + s * 0.18,
    top + s * 0.08,
  )
  b.closePath()
  const grad = b.createLinearGradient(cx - s * 0.5, 0, cx + s * 0.5, 0)
  grad.addColorStop(0, ramp[3])
  grad.addColorStop(0.35, ramp[2])
  grad.addColorStop(1, ramp[0])
  b.fillStyle = grad
  b.fill()
  b.strokeStyle = INK
  b.lineWidth = 0.5
  b.stroke()
  b.fillStyle = ramp[1]
  b.fillRect(cx - s * 0.5, top + h - s * 0.12, s, s * 0.12)
  b.fillStyle = ramp[4]
  b.fillRect(cx - s * 0.26, top + h * 0.3, s * 0.08, h * 0.4)
  b.fillStyle = INK
  b.fillRect(cx - s * 0.08, top - s * 0.06, s * 0.16, s * 0.16)
}

const BRONZE = ['#1e1008', '#4a2c12', '#7a5222', '#b08440', '#f0d08a'] as const

/** A cross, `h` tall standing on `by`. */
function cross(
  b: Ctx,
  cx: number,
  by: number,
  h: number,
  colour: string,
  w = 1.4,
) {
  b.fillStyle = colour
  b.fillRect(cx - w / 2, by - h, w, h)
  b.fillRect(cx - h * 0.3, by - h * 0.78, h * 0.6, w)
}

/** A gnarled dead tree, drawn as tapering branches. */
function deadTree(
  b: Ctx,
  x: number,
  base: number,
  h: number,
  colour: string,
  seed: number,
) {
  const rand = backdropRng(seed)
  b.strokeStyle = colour
  b.lineCap = 'round'
  const limb = (
    x0: number,
    y0: number,
    a: number,
    len: number,
    w: number,
    depth: number,
  ) => {
    const x1 = x0 + Math.cos(a) * len
    const y1 = y0 + Math.sin(a) * len
    b.lineWidth = w
    b.beginPath()
    b.moveTo(x0, y0)
    b.quadraticCurveTo(
      (x0 + x1) / 2 + (rand() - 0.5) * len * 0.3,
      (y0 + y1) / 2,
      x1,
      y1,
    )
    b.stroke()
    if (depth <= 0 || len < 2) return
    const n = depth > 2 ? 2 : 2 + (rand() < 0.5 ? 1 : 0)
    for (let i = 0; i < n; i++) {
      const spread = (rand() - 0.5) * 1.3 + (i - (n - 1) / 2) * 0.5
      limb(x1, y1, a + spread, len * (0.55 + rand() * 0.2), w * 0.62, depth - 1)
    }
  }
  b.fillStyle = colour
  b.beginPath()
  b.moveTo(x - h * 0.09, base)
  b.lineTo(x - h * 0.03, base - h * 0.2)
  b.lineTo(x + h * 0.03, base - h * 0.2)
  b.lineTo(x + h * 0.1, base)
  b.fill()
  limb(
    x,
    base - h * 0.15,
    -Math.PI / 2 + (rand() - 0.5) * 0.3,
    h * 0.42,
    h * 0.07,
    4,
  )
  b.lineCap = 'butt'
}

// --- the far layer: the delivered plate, or a procedural one -----------------------------------

const PLATE_W = 368
const PLATE_H = 276
const PLATE_Y = -24

const FAR_W = 400

/** The procedural far layer: banded sky, stars, moon, clouds, mesas and the stage's landmark. */
function paintFar(b: Ctx, key: StageKey) {
  const look = LOOKS[key]
  const rand = backdropRng(key.length * 977 + 13)
  // Banded HDMA sky.
  const bands = 40
  for (let i = 0; i < bands; i++) {
    const t = i / (bands - 1)
    const at = t * (look.sky.length - 1)
    const lo = Math.min(look.sky.length - 2, Math.floor(at))
    b.fillStyle = mix(look.sky[lo]!, look.sky[lo + 1]!, at - lo)
    b.fillRect(0, (i * H) / bands, FAR_W, H / bands + 0.5)
  }
  // Stars.
  for (let i = 0; i < 90; i++) {
    const x = rand() * FAR_W
    const y = rand() * 120
    const s = rand() < 0.15 ? 1 : 0.5
    b.fillStyle = rgba('#e8e4ff', 0.3 + rand() * 0.6)
    b.fillRect(x, y, s, s)
  }
  // The moon, its halo rings, craters and terminator.
  const { x: mx, y: my, r: mr, color, shade } = look.moon
  for (let i = 3; i >= 1; i--) {
    b.fillStyle = rgba(color, 0.05 + 0.03 * (3 - i))
    b.beginPath()
    b.arc(mx, my, mr + i * 6, 0, Math.PI * 2)
    b.fill()
  }
  b.fillStyle = color
  b.beginPath()
  b.arc(mx, my, mr, 0, Math.PI * 2)
  b.fill()
  b.save()
  b.beginPath()
  b.arc(mx, my, mr, 0, Math.PI * 2)
  b.clip()
  b.fillStyle = shade
  for (let i = 0; i < 14; i++) {
    const a = rand() * Math.PI * 2
    const d = rand() * mr * 0.85
    b.globalAlpha = 0.35 + rand() * 0.4
    b.beginPath()
    b.arc(
      mx + Math.cos(a) * d,
      my + Math.sin(a) * d,
      1 + rand() * mr * 0.16,
      0,
      Math.PI * 2,
    )
    b.fill()
  }
  b.globalAlpha = 1
  b.fillStyle = rgba(look.sky[1]!, 0.22)
  b.beginPath()
  b.arc(mx + mr * 0.35, my + mr * 0.2, mr, 0, Math.PI * 2)
  b.fill()
  b.restore()
  // Clouds: long shelves in front of the moon, lit along their tops.
  for (let i = 0; i < 9; i++) {
    const cx = rand() * FAR_W
    const cy = 30 + rand() * 70
    const cw = 30 + rand() * 60
    const tone = mix(look.sky[2]!, look.farRim, 0.4)
    b.fillStyle = rgba(tone, 0.75)
    for (let k = 0; k < 5; k++) {
      b.beginPath()
      b.ellipse(
        cx + (k - 2) * cw * 0.18,
        cy - (k % 2) * 2,
        cw * 0.22,
        3 + (k % 3),
        0,
        0,
        Math.PI * 2,
      )
      b.fill()
    }
    b.fillStyle = rgba(look.moon.color, 0.18)
    b.fillRect(cx - cw * 0.3, cy - 4, cw * 0.5, 0.6)
  }
  // Two rows of mesas / buttes: lit cliff faces on the moon side, strata, a misty foot.
  const mesas = (
    seed: number,
    base: number,
    amp: number,
    fill: string,
    rim: string,
  ) => {
    const r = backdropRng(seed)
    let x = -30 + r() * 20
    while (x < FAR_W + 20) {
      const w = 34 + r() * 70
      const top = base - amp * (0.35 + r() * 0.65)
      const cl = 5 + r() * 9
      const cr = 5 + r() * 9
      const shape = () => {
        b.beginPath()
        b.moveTo(x - 6, H)
        b.lineTo(x - 6, base + 6)
        b.lineTo(x, base)
        b.lineTo(x + cl * 0.6, top + (base - top) * 0.45)
        b.lineTo(x + cl, top + 3)
        b.lineTo(x + cl + 2, top)
        b.lineTo(x + w - cr - 2, top + r() * 2)
        b.lineTo(x + w - cr, top + 3)
        b.lineTo(x + w - cr * 0.5, top + (base - top) * 0.5)
        b.lineTo(x + w, base)
        b.lineTo(x + w + 6, base + 6)
        b.lineTo(x + w + 6, H)
        b.closePath()
      }
      shape()
      b.fillStyle = fill
      b.fill()
      b.save()
      shape()
      b.clip()
      // Moonlit left face and cap.
      b.fillStyle = rgba(rim, 0.45)
      b.beginPath()
      b.moveTo(x, base)
      b.lineTo(x + cl * 0.6, top + (base - top) * 0.45)
      b.lineTo(x + cl, top + 3)
      b.lineTo(x + cl + 2, top)
      b.lineTo(x + cl + 6, top)
      b.lineTo(x + cl + 3, base)
      b.fill()
      b.fillStyle = rgba(rim, 0.9)
      b.fillRect(x + cl + 1, top, w - cl - cr - 1, 0.8)
      // Strata and gullies.
      b.fillStyle = rgba(INK, 0.25)
      for (let sy = top + 5; sy < base; sy += 4 + r() * 4)
        b.fillRect(x - 6, sy, w + 12, 0.6)
      for (let gx = x + cl + 6; gx < x + w - cr; gx += 5 + r() * 8)
        b.fillRect(gx, top + 2 + r() * 4, 0.7, (base - top) * (0.3 + r() * 0.5))
      b.restore()
      x += w + 6 + r() * 26
    }
    // Mist pooling at their feet.
    const fog = b.createLinearGradient(0, base - amp * 0.4, 0, base + 10)
    fog.addColorStop(0, rgba(look.mist, 0))
    fog.addColorStop(1, rgba(look.mist, 0.28))
    b.fillStyle = fog
    b.fillRect(0, base - amp * 0.4, FAR_W, amp * 0.4 + 10)
  }
  mesas(key.length * 31 + 1, 150, 64, mix(look.far, INK, 0.2), look.farRim)
  // The stage's far landmark.
  if (key === 'town') {
    // A chapel on a hill, windows lit.
    b.fillStyle = look.near
    b.beginPath()
    b.moveTo(230, 175)
    b.quadraticCurveTo(290, 120, 360, 175)
    b.fill()
    b.fillRect(282, 112, 22, 24)
    b.beginPath()
    b.moveTo(279, 113)
    b.lineTo(293, 100)
    b.lineTo(307, 113)
    b.fill()
    b.fillRect(288, 82, 9, 20)
    b.beginPath()
    b.moveTo(286, 83)
    b.lineTo(292.5, 66)
    b.lineTo(299, 83)
    b.fill()
    cross(b, 292.5, 66, 6, look.near, 1)
    b.fillStyle = look.window
    b.fillRect(287, 120, 2, 4)
    b.fillRect(297, 120, 2, 4)
    b.fillRect(291.5, 88, 2, 4)
  } else if (key === 'boneyard') {
    // An aqueduct across the ravine, a waterfall behind.
    b.fillStyle = rgba('#b8f0e8', 0.55)
    b.fillRect(186, 90, 16, 70)
    b.fillStyle = rgba('#ffffff', 0.35)
    for (let i = 0; i < 6; i++) b.fillRect(188 + i * 2.4, 92, 0.6, 66)
    b.fillStyle = look.near
    b.fillRect(140, 128, 120, 8)
    for (let i = 0; i < 6; i++) {
      const ax = 142 + i * 20
      b.fillRect(ax, 136, 5, 50)
      b.beginPath()
      b.moveTo(ax + 5, 136)
      b.quadraticCurveTo(ax + 10, 150, ax + 15, 136)
      b.lineTo(ax + 15, 136)
      b.fill()
    }
    b.fillStyle = look.nearRim
    b.fillRect(140, 128, 120, 0.8)
  } else if (key === 'waterhole') {
    // Flat-topped cliffs and still water reflecting the moon.
    b.fillStyle = mix(look.sky[5]!, look.mist, 0.3)
    b.fillRect(0, 168, FAR_W, 72)
    b.fillStyle = rgba(look.moon.color, 0.35)
    for (let i = 0; i < 8; i++)
      b.fillRect(look.moon.x - 8 + (i % 3) * 3, 172 + i * 4, 14 - i, 1)
  } else {
    // A ruined bell frame against the moon.
    b.fillStyle = look.near
    b.fillRect(40, 70, 6, 110)
    b.fillRect(136, 70, 6, 110)
    b.fillRect(36, 64, 110, 8)
    b.beginPath()
    b.moveTo(46, 72)
    b.quadraticCurveTo(91, 90, 136, 72)
    b.lineTo(136, 80)
    b.quadraticCurveTo(91, 98, 46, 80)
    b.fill()
    bellShape(b, 91, 84, 26, [
      '#120a18',
      '#22142a',
      '#33203a',
      '#4a3048',
      '#6a4a60',
    ])
    b.fillStyle = look.near
    for (let i = 0; i < 5; i++) {
      const ax = 160 + i * 44
      b.fillRect(ax, 110 - (i % 2) * 14, 8, 80)
      b.beginPath()
      b.arc(ax + 22, 112 - (i % 2) * 14, 18, Math.PI, 0)
      b.lineTo(ax + 40, 112)
      b.lineTo(ax + 36, 112)
      b.arc(ax + 22, 114 - (i % 2) * 14, 14, 0, Math.PI, true)
      b.fill()
    }
  }
  mesas(key.length * 53 + 7, 196, 36, mix(look.near, INK, 0.35), look.nearRim)
}

function drawPlate(g: Ctx, key: StageKey, camX: number): boolean {
  const img = loadedImage(
    `/images/arcade/ghost-trail/plates/${LOOKS[key].plate}.webp`,
  )
  if (!img) return false
  const t = Math.max(0, Math.min(1, camX / CAM_MAX))
  g.save()
  g.imageSmoothingEnabled = true
  g.drawImage(img, -Math.round(t * (PLATE_W - W)), PLATE_Y, PLATE_W, PLATE_H)
  g.restore()
  return true
}

// --- the mid-ground: two parallax silhouette strips per stage ----------------------------------

const MID_W = 640
const MID_A_TOP = 112
const MID_A_H = GROUND_Y + 8 - MID_A_TOP
const MID_B_TOP = 136
const MID_B_H = GROUND_Y + 8 - MID_B_TOP
const PAR_A = 0.28
const PAR_B = 0.55

type Light = {
  /** Strip-local position. */
  x: number
  y: number
  r: number
  color: string
  kind?: 'wheel' | 'mill' | 'bell' | 'fire'
}

const GL_A = MID_A_H - 8
const GL_B = MID_B_H - 8

type Building = { x: number; w: number; h: number }

const TOWN_A: Building[] = [
  { x: 6, w: 44, h: 46 },
  { x: 56, w: 34, h: 34 },
  { x: 100, w: 54, h: 60 },
  { x: 214, w: 40, h: 40 },
  { x: 262, w: 30, h: 30 },
  { x: 400, w: 50, h: 52 },
  { x: 458, w: 34, h: 38 },
  { x: 556, w: 46, h: 44 },
  { x: 608, w: 28, h: 30 },
]

/** Lights and moving parts on each strip (strip-local coordinates). */
const MID_LIGHTS: Record<StageKey, { a: Light[]; b: Light[] }> = {
  town: {
    a: [{ x: 352, y: GL_A - 56, r: 8, color: AMBER }],
    b: [
      { x: 67, y: GL_B - 33, r: 13, color: AMBER },
      { x: 395, y: GL_B - 33, r: 13, color: AMBER },
    ],
  },
  boneyard: {
    a: [{ x: 235, y: GL_A - 14, r: 10, color: AMBER }],
    b: [
      { x: 150, y: GL_B - 44, r: 12, color: AMBER },
      { x: 520, y: GL_B - 30, r: 10, color: CYAN },
    ],
  },
  waterhole: {
    a: [
      { x: 290, y: GL_A - 12, r: 0, color: AMBER, kind: 'wheel' },
      { x: 336, y: GL_A - 26, r: 9, color: AMBER },
    ],
    b: [
      { x: 470, y: GL_B - 62, r: 0, color: AMBER, kind: 'mill' },
      { x: 180, y: GL_B - 20, r: 12, color: AMBER },
    ],
  },
  belltower: {
    a: [
      { x: 203, y: GL_A - 70, r: 0, color: AMBER, kind: 'bell' },
      { x: 203, y: GL_A - 44, r: 9, color: AMBER },
    ],
    b: [
      { x: 120, y: GL_B - 26, r: 16, color: AMBER, kind: 'fire' },
      { x: 450, y: GL_B - 26, r: 16, color: AMBER, kind: 'fire' },
      { x: 300, y: GL_B - 42, r: 0, color: AMBER, kind: 'bell' },
    ],
  },
}

function rimLeft(b: Ctx, x: number, y: number, h: number, colour: string) {
  b.fillStyle = colour
  b.fillRect(x, y, 0.7, h)
}

/** A small lit (or dark) window with a mullion. */
function window4(
  b: Ctx,
  x: number,
  y: number,
  w: number,
  h: number,
  lit: boolean,
  colour: string,
) {
  b.fillStyle = lit ? colour : rgba('#000000', 0.35)
  b.fillRect(x, y, w, h)
  if (lit) {
    b.fillStyle = rgba('#fff2c8', 0.75)
    b.fillRect(x, y, w * 0.45, h * 0.45)
    b.fillStyle = rgba(INK, 0.7)
    b.fillRect(x + w / 2 - 0.25, y, 0.5, h)
    b.fillRect(x, y + h / 2 - 0.25, w, 0.5)
  }
}

/** A frontier false-front building on the ground line `gl`. */
function falseFront(
  b: Ctx,
  bd: Building,
  gl: number,
  f: string,
  rim: string,
  light: string,
  seed: number,
) {
  const { x, w, h } = bd
  const rand = backdropRng(seed)
  const top = gl - h
  // A gabled roof behind the front.
  b.fillStyle = f
  b.beginPath()
  b.moveTo(x + 2, top + 8)
  b.lineTo(x + w / 2, top - 2)
  b.lineTo(x + w - 2, top + 8)
  b.fill()
  b.fillRect(x, top, w, h)
  // Parapet: stepped or arched.
  if (rand() < 0.5) {
    b.fillRect(x + 3, top - 5, w - 6, 5)
    b.fillRect(x + w / 2 - 5, top - 8, 10, 3)
  } else {
    b.beginPath()
    b.moveTo(x + 2, top)
    b.quadraticCurveTo(x + w / 2, top - 12, x + w - 2, top)
    b.fill()
  }
  b.fillStyle = rgba(rim, 0.9)
  b.fillRect(x - 1, top - 0.5, w + 2, 1)
  rimLeft(b, x, top, h, rgba(rim, 0.8))
  // Clapboard siding.
  b.fillStyle = rgba(rim, 0.12)
  for (let y = top + 3; y < gl; y += 2.2) b.fillRect(x + 1, y, w - 2, 0.35)
  // Sign board.
  b.fillStyle = mix(f, rim, 0.25)
  b.fillRect(x + w * 0.2, top + 2, w * 0.6, 4)
  // Windows.
  const floors = h > 44 ? 2 : 1
  for (let fl = 0; fl < floors; fl++) {
    const wy = top + 9 + fl * 16
    for (const fx of w > 40 ? [0.16, 0.42, 0.68] : [0.2, 0.62])
      window4(b, x + w * fx, wy, 4, 6, rand() < 0.45, light)
  }
  if (floors === 2 && rand() < 0.7) {
    // A balcony.
    b.fillStyle = f
    b.fillRect(x - 3, top + 22, w + 6, 1.5)
    for (let bx = x - 2; bx < x + w + 3; bx += 2.2)
      b.fillRect(bx, top + 18, 0.5, 4)
    b.fillRect(x - 3, top + 18, w + 6, 0.8)
    b.fillStyle = rgba(rim, 0.7)
    b.fillRect(x - 3, top + 18, w + 6, 0.4)
  }
  // Porch roof on posts and a dark door.
  b.fillStyle = f
  b.beginPath()
  b.moveTo(x - 4, gl - 13)
  b.lineTo(x + w + 4, gl - 13)
  b.lineTo(x + w + 4, gl - 11)
  b.lineTo(x - 4, gl - 11)
  b.fill()
  b.fillStyle = rgba(rim, 0.7)
  b.fillRect(x - 4, gl - 13, w + 6, 0.5)
  b.fillStyle = f
  for (const px of [x - 3, x + w + 2]) b.fillRect(px, gl - 11, 1, 11)
  const lit = rand() < 0.4
  b.fillStyle = lit ? rgba(light, 0.85) : rgba('#000000', 0.45)
  b.fillRect(x + w / 2 - 3, gl - 9, 6, 9)
  b.fillStyle = rgba(INK, 0.8)
  b.fillRect(x + w / 2 - 0.25, gl - 9, 0.5, 9)
}

/** A weeping willow on `gl`, `h` tall. */
function willow(
  b: Ctx,
  x: number,
  gl: number,
  h: number,
  f: string,
  rim: string,
  seed: number,
) {
  const rand = backdropRng(seed)
  b.fillStyle = f
  // Trunk, forked.
  b.beginPath()
  b.moveTo(x - 5, gl)
  b.quadraticCurveTo(x - 1, gl - h * 0.35, x - 6, gl - h * 0.7)
  b.lineTo(x - 2, gl - h * 0.72)
  b.quadraticCurveTo(x + 2, gl - h * 0.5, x + 4, gl - h * 0.72)
  b.lineTo(x + 7, gl - h * 0.7)
  b.quadraticCurveTo(x + 3, gl - h * 0.35, x + 7, gl)
  b.fill()
  // Crown.
  const R = h * 0.5
  const crown = gl - h
  for (let i = 0; i < 7; i++) {
    const cx = x - R * 0.7 + (i / 6) * R * 1.4
    const cy = crown + 6 + Math.abs(i - 3) * 2.2
    b.beginPath()
    b.ellipse(cx, cy, R * 0.28, 7, 0, 0, Math.PI * 2)
    b.fill()
  }
  // Hanging fronds, tapered, ending at varied heights.
  for (let i = 0; i < 46; i++) {
    const t = rand()
    const sx = x - R + t * R * 2
    const sy = crown + 4 + Math.pow((sx - x) / R, 2) * 10
    const len = h * (0.35 + rand() * 0.35) * (1 - Math.abs(sx - x) / (R * 2))
    const wid = 1.2 + rand() * 1.4
    b.beginPath()
    b.moveTo(sx - wid, sy)
    b.quadraticCurveTo(
      sx - wid * 0.5,
      sy + len * 0.6,
      sx + (rand() - 0.5) * 2,
      sy + len,
    )
    b.quadraticCurveTo(sx + wid * 0.5, sy + len * 0.6, sx + wid, sy)
    b.fill()
  }
  // Moonlit strands on the left of the crown.
  b.strokeStyle = rgba(rim, 0.75)
  b.lineWidth = 0.4
  for (let i = 0; i < 14; i++) {
    const sx = x - R * 0.9 + rand() * R
    const sy = crown + 2 + Math.pow((sx - x) / R, 2) * 10
    b.beginPath()
    b.moveTo(sx, sy)
    b.quadraticCurveTo(sx + 0.5, sy + 6, sx - 0.3, sy + 10 + rand() * 10)
    b.stroke()
  }
}

/** Grass/reeds along `gl`. */
function reeds(
  b: Ctx,
  x0: number,
  x1: number,
  gl: number,
  n: number,
  maxH: number,
  f: string,
  seed: number,
  cattails = false,
) {
  const rand = backdropRng(seed)
  b.strokeStyle = f
  b.fillStyle = f
  for (let i = 0; i < n; i++) {
    const rx = x0 + rand() * (x1 - x0)
    const rh = maxH * (0.35 + rand() * 0.65)
    b.lineWidth = 0.6
    b.beginPath()
    b.moveTo(rx, gl)
    b.quadraticCurveTo(rx + 1, gl - rh / 2, rx + (rand() - 0.5) * 5, gl - rh)
    b.stroke()
    if (cattails && rand() < 0.3) {
      roundRect(b, rx - 0.9, gl - rh * 0.85, 1.8, 4.5, 0.9)
      b.fill()
    }
  }
}

/** Silhouette tone and fog for a finished strip: faint texture, then mist rising from the ground. */
function finishStrip(b: Ctx, h: number, mist: string, fogAmt: number) {
  b.save()
  b.globalCompositeOperation = 'source-atop'
  const grad = b.createLinearGradient(0, 0, 0, h)
  grad.addColorStop(0, rgba(mist, 0))
  grad.addColorStop(0.55, rgba(mist, fogAmt * 0.35))
  grad.addColorStop(1, rgba(mist, fogAmt))
  b.fillStyle = grad
  b.fillRect(0, 0, MID_W, h)
  b.restore()
}

function paintMidA(b: Ctx, key: StageKey) {
  const look = LOOKS[key]
  const f = look.midA
  const rim = look.midARim
  const gl = GL_A
  const rand = backdropRng(key.length * 7 + 101)
  const flat: Ramp = [f, f, f, f, f]
  b.fillStyle = f
  b.fillRect(0, gl, MID_W, MID_A_H - gl)
  if (key === 'town') {
    TOWN_A.forEach((bd, i) =>
      falseFront(b, bd, gl, f, rim, look.window, 300 + i),
    )
    // Water tower.
    const tx = 170
    b.fillStyle = f
    for (const lx of [tx, tx + 22]) b.fillRect(lx, gl - 44, 1.6, 44)
    brace(b, tx + 1, gl - 40, tx + 23, gl - 16, flat, 0.7)
    brace(b, tx + 23, gl - 40, tx + 1, gl - 16, flat, 0.7)
    b.fillStyle = f
    b.fillRect(tx - 3, gl - 64, 29, 22)
    b.beginPath()
    b.moveTo(tx - 5, gl - 64)
    b.lineTo(tx + 11.5, gl - 74)
    b.lineTo(tx + 28, gl - 64)
    b.fill()
    rimLeft(b, tx - 3, gl - 64, 22, rim)
    b.fillStyle = rgba(rim, 0.45)
    for (let k = 0; k < 3; k++) b.fillRect(tx - 3, gl - 60 + k * 7, 29, 0.5)
    b.fillRect(tx - 5, gl - 64, 33, 0.5)
    // Chapel and steeple.
    const cx = 330
    b.fillStyle = f
    b.fillRect(cx, gl - 34, 40, 34)
    b.beginPath()
    b.moveTo(cx - 2, gl - 34)
    b.lineTo(cx + 20, gl - 46)
    b.lineTo(cx + 42, gl - 34)
    b.fill()
    b.fillRect(cx + 15, gl - 66, 10, 24)
    b.beginPath()
    b.moveTo(cx + 13, gl - 66)
    b.lineTo(cx + 20, gl - 86)
    b.lineTo(cx + 27, gl - 66)
    b.fill()
    cross(b, cx + 20, gl - 86, 7, f, 1)
    rimLeft(b, cx, gl - 34, 34, rim)
    rimLeft(b, cx + 15, gl - 66, 24, rim)
    window4(b, cx + 18, gl - 60, 4, 6, true, look.window)
    for (const wx of [cx + 6, cx + 30]) {
      b.fillStyle = rgba(look.window, 0.85)
      b.beginPath()
      b.arc(wx + 2, gl - 22, 2, Math.PI, 0)
      b.fillRect(wx, gl - 22, 4, 7)
      b.fill()
    }
    // Windmill.
    const mx = 520
    b.fillStyle = f
    b.beginPath()
    b.moveTo(mx - 7, gl)
    b.lineTo(mx - 1, gl - 50)
    b.lineTo(mx + 1, gl - 50)
    b.lineTo(mx + 7, gl)
    b.fill()
    for (let i = 0; i < 12; i++) {
      const a = (i * Math.PI) / 6
      b.fillRect(
        mx + Math.cos(a) * 9 - 0.6,
        gl - 52 + Math.sin(a) * 9 - 0.6,
        1.2,
        1.2,
      )
      brace(
        b,
        mx,
        gl - 52,
        mx + Math.cos(a) * 9,
        gl - 52 + Math.sin(a) * 9,
        flat,
        0.5,
      )
    }
  } else if (key === 'boneyard') {
    // A hill of graves.
    const hill = (x: number) =>
      gl - 14 - Math.sin((x / MID_W) * Math.PI * 4) * 6
    b.beginPath()
    b.moveTo(0, gl)
    for (let x = 0; x <= MID_W; x += 8) b.lineTo(x, hill(x))
    b.lineTo(MID_W, gl)
    b.fill()
    for (let i = 0; i < 34; i++) {
      const gx = rand() * MID_W
      if (gx > 30 && gx < 260) continue
      const gy = hill(gx) + 1
      if (rand() < 0.5) cross(b, gx, gy, 5 + rand() * 4, f, 1)
      else {
        roundRect(b, gx - 1.8, gy - 5, 3.6, 6, 1.6)
        b.fill()
      }
    }
    // Cloister arches.
    b.fillStyle = f
    b.fillRect(34, gl - 44, 156, 7)
    for (let i = 0; i < 7; i++) {
      const ax = 34 + i * 25
      b.fillRect(ax, gl - 37, 5, 37)
      b.beginPath()
      b.moveTo(ax + 5, gl - 37)
      b.quadraticCurveTo(ax + 15, gl - 26, ax + 25, gl - 37)
      b.fill()
      rimLeft(b, ax, gl - 37, 37, rgba(rim, 0.6))
    }
    b.fillStyle = rim
    b.fillRect(34, gl - 44, 156, 0.6)
    for (let i = 0; i < 10; i++) cross(b, 40 + i * 16, gl - 44, 4, f, 0.8)
    // A crypt with a lit door.
    const mx = 218
    b.fillStyle = f
    b.fillRect(mx, gl - 34, 34, 34)
    b.beginPath()
    b.moveTo(mx - 3, gl - 34)
    b.lineTo(mx + 17, gl - 46)
    b.lineTo(mx + 37, gl - 34)
    b.fill()
    b.fillRect(mx + 14, gl - 58, 6, 14)
    b.beginPath()
    b.moveTo(mx + 13, gl - 58)
    b.lineTo(mx + 17, gl - 70)
    b.lineTo(mx + 21, gl - 58)
    b.fill()
    cross(b, mx + 17, gl - 70, 6, f, 0.9)
    rimLeft(b, mx, gl - 34, 34, rim)
    b.fillStyle = rgba(rim, 0.8)
    b.fillRect(mx - 3, gl - 34, 40, 0.5)
    b.fillStyle = look.window
    b.beginPath()
    b.arc(mx + 17, gl - 18, 5, Math.PI, 0)
    b.fillRect(mx + 12, gl - 18, 10, 18)
    b.fill()
    b.fillStyle = rgba('#fff2c8', 0.6)
    b.fillRect(mx + 13, gl - 16, 3, 16)
    // Dead trees on the ridge.
    deadTree(b, 330, hill(330), 50, f, 11)
    deadTree(b, 470, hill(470), 40, f, 23)
    deadTree(b, 610, hill(610), 56, f, 37)
    // A great ribcage half sunk in the hill.
    b.strokeStyle = f
    b.lineWidth = 2.4
    for (let i = 0; i < 5; i++) {
      const r = 20 - Math.abs(i - 2) * 3
      b.beginPath()
      b.arc(520 + i * 10, hill(540) + 2, r, Math.PI, Math.PI * 1.5)
      b.stroke()
    }
  } else if (key === 'waterhole') {
    willow(b, 80, gl, 74, f, rim, 5)
    willow(b, 540, gl, 82, f, rim, 9)
    // Mill house on stilts.
    const hx = 300
    b.fillStyle = f
    b.fillRect(hx, gl - 40, 50, 34)
    b.beginPath()
    b.moveTo(hx - 4, gl - 40)
    b.lineTo(hx + 25, gl - 56)
    b.lineTo(hx + 54, gl - 40)
    b.fill()
    for (const px of [hx + 2, hx + 24, hx + 46]) b.fillRect(px, gl - 6, 2, 6)
    rimLeft(b, hx, gl - 40, 34, rim)
    b.fillStyle = rgba(rim, 0.8)
    b.beginPath()
    b.moveTo(hx - 4, gl - 40)
    b.lineTo(hx + 25, gl - 56)
    b.lineTo(hx + 25, gl - 55)
    b.lineTo(hx - 3, gl - 39.5)
    b.fill()
    b.fillStyle = rgba(rim, 0.12)
    for (let y = gl - 38; y < gl - 6; y += 2.2) b.fillRect(hx + 1, y, 48, 0.35)
    for (const [wx, lit] of [
      [hx + 8, false],
      [hx + 22, true],
      [hx + 36, true],
    ] as const)
      window4(b, wx, gl - 32, 6, 8, lit, look.window)
    // Stone ruins of an old cabin.
    b.fillStyle = f
    b.fillRect(180, gl - 18, 4, 18)
    b.fillRect(180, gl - 18, 20, 3)
    b.fillRect(214, gl - 12, 4, 12)
    reeds(b, 0, MID_W, gl, 160, 14, f, 31, true)
  } else {
    // Ruined arcade.
    for (let ax = 0; ax < MID_W; ax += 30) {
      if (ax > 170 && ax < 240) continue
      const broken = hash(ax + 3) < 0.35
      const ah = 34 + Math.floor(hash(ax) * 16)
      b.fillStyle = f
      b.fillRect(ax, gl - ah, 7, ah)
      b.fillRect(ax - 1, gl - ah, 9, 2)
      if (!broken) {
        b.beginPath()
        b.moveTo(ax + 7, gl - ah + 2)
        b.arc(ax + 18.5, gl - ah + 6, 11.5, Math.PI, 0)
        b.lineTo(ax + 30, gl - ah - 8)
        b.lineTo(ax, gl - ah - 8)
        b.closePath()
        b.fill()
        b.fillStyle = rgba(rim, 0.6)
        b.fillRect(ax, gl - ah - 8, 30, 0.5)
      } else {
        b.beginPath()
        b.moveTo(ax - 1, gl - ah)
        b.lineTo(ax + 3, gl - ah - 6)
        b.lineTo(ax + 6, gl - ah - 3)
        b.lineTo(ax + 9, gl - ah)
        b.fill()
      }
      rimLeft(b, ax, gl - ah, ah, rim)
    }
    // A bell tower (its bell swings live in the opening).
    const tx = 190
    b.fillStyle = f
    b.fillRect(tx, gl - 84, 26, 84)
    b.fillRect(tx - 3, gl - 87, 32, 4)
    b.beginPath()
    b.moveTo(tx - 2, gl - 87)
    b.lineTo(tx + 13, gl - 100)
    b.lineTo(tx + 28, gl - 87)
    b.fill()
    cross(b, tx + 13, gl - 100, 7, f, 1.1)
    rimLeft(b, tx, gl - 84, 84, rim)
    b.fillStyle = rgba(rim, 0.14)
    for (let y = gl - 82; y < gl; y += 3) b.fillRect(tx + 1, y, 24, 0.4)
    b.fillStyle = mix(look.sky[3]!, f, 0.35)
    b.beginPath()
    b.arc(tx + 13, gl - 72, 8, Math.PI, 0)
    b.fillRect(tx + 5, gl - 72, 16, 14)
    b.fill()
    window4(b, tx + 10, gl - 48, 6, 8, true, look.window)
    // Cypresses.
    for (const cx of [262, 278, 590]) {
      const ch = 46 + (cx % 3) * 6
      b.fillStyle = f
      b.beginPath()
      b.moveTo(cx, gl - ch)
      b.quadraticCurveTo(cx + 7, gl - ch * 0.4, cx + 2.5, gl)
      b.lineTo(cx - 2.5, gl)
      b.quadraticCurveTo(cx - 7, gl - ch * 0.4, cx, gl - ch)
      b.fill()
    }
  }
  finishStrip(b, MID_A_H, mix(look.mist, look.midA, 0.55), look.fog * 0.45)
}

function paintMidB(b: Ctx, key: StageKey) {
  const look = LOOKS[key]
  const f = look.midB
  const rim = look.midBRim
  const gl = GL_B
  const rand = backdropRng(key.length * 13 + 211)
  const flat: Ramp = [f, f, f, f, f]
  b.fillStyle = f
  // A low rolling bank everywhere so nothing floats.
  b.beginPath()
  b.moveTo(0, MID_B_H)
  for (let x = 0; x <= MID_W; x += 16)
    b.lineTo(x, gl - 2 - Math.sin((x / MID_W) * Math.PI * 6) * 2)
  b.lineTo(MID_W, MID_B_H)
  b.fill()
  if (key === 'town') {
    // Gallows.
    const gx = 200
    b.fillRect(gx, gl - 16, 40, 3)
    b.fillRect(gx + 1, gl - 13, 2, 13)
    b.fillRect(gx + 37, gl - 13, 2, 13)
    b.fillRect(gx + 6, gl - 50, 3, 34)
    b.fillRect(gx + 4, gl - 52, 24, 3)
    brace(b, gx + 9, gl - 38, gx + 18, gl - 49, flat, 1.1)
    b.strokeStyle = f
    b.lineWidth = 0.6
    b.beginPath()
    b.moveTo(gx + 24, gl - 49)
    b.lineTo(gx + 24, gl - 36)
    b.stroke()
    b.beginPath()
    b.ellipse(gx + 24, gl - 34, 1.6, 2.4, 0, 0, Math.PI * 2)
    b.stroke()
    for (let s = 0; s < 4; s++)
      b.fillRect(gx + 40 + s * 3, gl - 13 + s * 3.3, 4, 1.2)
    rimLeft(b, gx + 6, gl - 50, 34, rim)
    b.fillStyle = rgba(rim, 0.7)
    b.fillRect(gx + 4, gl - 52, 24, 0.5)
    b.fillRect(gx, gl - 16, 40, 0.5)
    // Lamp posts with lit lanterns.
    for (const lx of [64, 392]) {
      b.fillStyle = f
      b.fillRect(lx - 0.8, gl - 36, 1.6, 36)
      b.fillRect(lx - 1, gl - 36, 5, 1)
      lantern(b, lx + 3, gl - 36)
    }
    // Telegraph poles with sagging wires.
    const poles = [120, 300, 480, 600, 760]
    for (const px of poles) {
      b.fillStyle = f
      b.fillRect(px, gl - 62, 1.6, 62)
      b.fillRect(px - 5, gl - 59, 12, 1.2)
    }
    b.strokeStyle = rgba(f, 0.9)
    b.lineWidth = 0.35
    for (let i = 0; i < poles.length - 1; i++)
      for (const dx of [-4, 6]) {
        b.beginPath()
        b.moveTo(poles[i]! + dx, gl - 59)
        b.quadraticCurveTo(
          (poles[i]! + poles[i + 1]!) / 2,
          gl - 50,
          poles[i + 1]! + dx,
          gl - 59,
        )
        b.stroke()
      }
    // Wagon wheel, barrels, trough, a dead tree, boot hill crosses.
    b.strokeStyle = f
    b.lineWidth = 1.3
    b.beginPath()
    b.arc(150, gl - 8, 8, 0, Math.PI * 2)
    b.stroke()
    b.lineWidth = 0.6
    for (let i = 0; i < 6; i++) {
      const a = (i * Math.PI) / 3 + 0.2
      b.beginPath()
      b.moveTo(150, gl - 8)
      b.lineTo(150 + Math.cos(a) * 8, gl - 8 + Math.sin(a) * 8)
      b.stroke()
    }
    b.fillStyle = f
    for (const bx of [330, 339]) {
      roundRect(b, bx, gl - 10, 8, 10, 2)
      b.fill()
    }
    b.fillRect(270, gl - 6, 22, 6)
    deadTree(b, 545, gl - 1, 54, f, 5)
    for (let i = 0; i < 9; i++)
      cross(b, 420 + rand() * 100, gl - 1, 5 + rand() * 4, f, 1)
  } else if (key === 'boneyard') {
    // Iron fence, crosses, a tree with a hanging cage, an angel.
    b.fillStyle = f
    for (let x = 0; x < MID_W; x += 3.6) {
      if (x > 236 && x < 336) continue
      b.fillRect(x, gl - 13, 0.7, 13)
      b.beginPath()
      b.moveTo(x - 0.6, gl - 13)
      b.lineTo(x + 0.35, gl - 15.5)
      b.lineTo(x + 1.3, gl - 13)
      b.fill()
    }
    for (const fy of [gl - 11, gl - 4]) {
      b.fillRect(0, fy, 236, 0.8)
      b.fillRect(336, fy, MID_W - 336, 0.8)
    }
    for (let i = 0; i < 16; i++)
      cross(b, 244 + rand() * 86, gl - 1, 6 + rand() * 7, f, 1.2)
    deadTree(b, 140, gl - 1, 70, f, 9)
    b.strokeStyle = f
    b.lineWidth = 0.5
    b.beginPath()
    b.moveTo(166, gl - 54)
    b.lineTo(166, gl - 40)
    b.stroke()
    b.strokeRect(162.5, gl - 40, 7, 10)
    for (let i = 1; i < 4; i++) b.fillRect(162.5 + i * 1.75, gl - 40, 0.4, 10)
    b.beginPath()
    b.moveTo(150, gl - 50)
    b.lineTo(150, gl - 45)
    b.stroke()
    lantern(b, 150, gl - 45)
    // An angel statue on a plinth.
    const sx = 420
    b.fillStyle = f
    b.fillRect(sx - 7, gl - 12, 14, 12)
    b.beginPath()
    b.moveTo(sx - 4, gl - 12)
    b.lineTo(sx - 2.5, gl - 32)
    b.arc(sx, gl - 34, 2.5, Math.PI, 0)
    b.lineTo(sx + 4, gl - 12)
    b.fill()
    b.beginPath()
    b.moveTo(sx - 2, gl - 28)
    b.quadraticCurveTo(sx - 14, gl - 38, sx - 10, gl - 18)
    b.lineTo(sx - 3, gl - 22)
    b.moveTo(sx + 2, gl - 28)
    b.quadraticCurveTo(sx + 14, gl - 38, sx + 10, gl - 18)
    b.lineTo(sx + 3, gl - 22)
    b.fill()
    rimLeft(b, sx - 4, gl - 32, 20, rim)
    b.fillStyle = rgba(rim, 0.6)
    b.fillRect(sx - 7, gl - 12, 14, 0.5)
    // A will-o'-wisp post.
    b.fillStyle = f
    b.fillRect(519.4, gl - 30, 1.2, 30)
    deadTree(b, 600, gl - 1, 56, f, 19)
  } else if (key === 'waterhole') {
    // A dock on pilings with a lantern, snags, cattails and a windmill (blades turn live).
    b.fillStyle = f
    for (const px of [150, 161, 172, 183, 194, 205]) {
      roundRect(b, px, gl - 20, 3.4, 20, 1.4)
      b.fill()
    }
    b.fillRect(146, gl - 17, 64, 2.5)
    b.fillStyle = rgba(rim, 0.8)
    b.fillRect(146, gl - 17, 64, 0.5)
    b.fillStyle = f
    b.fillRect(179.4, gl - 26, 1.2, 9)
    b.fillRect(179.4, gl - 26, 4, 1)
    lantern(b, 182, gl - 25)
    deadTree(b, 60, gl - 1, 56, f, 3)
    deadTree(b, 300, gl - 1, 44, f, 29)
    const mx = 470
    b.fillStyle = f
    b.beginPath()
    b.moveTo(mx - 9, gl)
    b.lineTo(mx - 1.5, gl - 62)
    b.lineTo(mx + 1.5, gl - 62)
    b.lineTo(mx + 9, gl)
    b.lineTo(mx + 6.5, gl)
    b.lineTo(mx, gl - 56)
    b.lineTo(mx - 6.5, gl)
    b.closePath()
    b.fill()
    for (let k = 1; k < 5; k++) {
      const yy = gl - 62 + (62 * k) / 5
      const half = 1.5 + (7.5 * k) / 5
      b.fillRect(mx - half, yy, half * 2, 0.8)
    }
    b.fillRect(mx - 2.5, gl - 65, 7, 4)
    reeds(b, 0, MID_W, gl, 110, 20, f, 47, true)
  } else {
    // Broken columns, a bell frame, braziers on posts, crosses.
    for (const cx of [40, 230, 560]) {
      const ch = 28 + (cx % 7) * 2
      b.fillStyle = f
      b.fillRect(cx, gl - ch, 10, ch)
      b.fillRect(cx - 1.5, gl - 3, 13, 3)
      b.beginPath()
      b.moveTo(cx - 0.5, gl - ch)
      b.lineTo(cx + 3, gl - ch - 4)
      b.lineTo(cx + 6, gl - ch - 1)
      b.lineTo(cx + 10.5, gl - ch - 3)
      b.lineTo(cx + 10.5, gl - ch)
      b.fill()
      b.fillStyle = rgba(rim, 0.45)
      for (let k = 2; k < 10; k += 2.6) b.fillRect(cx + k, gl - ch, 0.4, ch - 3)
      rimLeft(b, cx, gl - ch, ch, rim)
    }
    const fx = 300
    b.fillStyle = f
    b.beginPath()
    b.moveTo(fx - 15, gl)
    b.lineTo(fx - 3, gl - 44)
    b.lineTo(fx - 0.5, gl - 44)
    b.lineTo(fx - 12, gl)
    b.moveTo(fx + 15, gl)
    b.lineTo(fx + 3, gl - 44)
    b.lineTo(fx + 0.5, gl - 44)
    b.lineTo(fx + 12, gl)
    b.fill()
    b.fillRect(fx - 10, gl - 45, 20, 2.5)
    b.fillStyle = rgba(rim, 0.7)
    b.fillRect(fx - 10, gl - 45, 20, 0.5)
    for (const bx of [120, 450]) {
      b.fillStyle = f
      b.fillRect(bx - 1, gl - 22, 2, 22)
      b.beginPath()
      b.moveTo(bx - 5, gl - 26)
      b.lineTo(bx + 5, gl - 26)
      b.lineTo(bx + 2.5, gl - 21)
      b.lineTo(bx - 2.5, gl - 21)
      b.fill()
      b.fillStyle = rgba('#ff9a48', 0.7)
      b.fillRect(bx - 5, gl - 26, 10, 0.6)
    }
    for (let i = 0; i < 10; i++)
      cross(b, 340 + rand() * 90, gl - 1, 6 + rand() * 5, f, 1.2)
    deadTree(b, 610, gl - 1, 48, f, 41)
  }
  finishStrip(b, MID_B_H, mix(look.mist, look.midB, 0.6), look.fog * 0.35)
}

/** The strips' animated parts and lights, drawn over the baked silhouettes. */
function animateStrip(
  g: Ctx,
  key: StageKey,
  layer: 'a' | 'b',
  ox: number,
  tick: number,
) {
  const look = LOOKS[key]
  const f = layer === 'a' ? look.midA : look.midB
  const top = layer === 'a' ? MID_A_TOP : MID_B_TOP
  for (const l of MID_LIGHTS[key][layer]) {
    const x = ox + l.x
    const y = top + l.y
    if (x < -40 || x > W + 40) continue
    if (l.kind === 'wheel') {
      // A mill wheel turning slowly.
      const a0 = tick / 90
      g.strokeStyle = f
      g.lineWidth = 1.6
      g.beginPath()
      g.arc(x, y, 11, 0, Math.PI * 2)
      g.stroke()
      g.lineWidth = 0.9
      for (let i = 0; i < 8; i++) {
        const a = a0 + (i * Math.PI) / 4
        g.beginPath()
        g.moveTo(x, y)
        g.lineTo(x + Math.cos(a) * 13, y + Math.sin(a) * 13)
        g.stroke()
      }
      g.strokeStyle = rgba(look.midARim, 0.7)
      g.lineWidth = 0.4
      g.beginPath()
      g.arc(x, y, 11.5, Math.PI * 1.05, Math.PI * 1.6)
      g.stroke()
    } else if (l.kind === 'mill') {
      const a0 = tick / 70
      g.fillStyle = f
      g.strokeStyle = f
      for (let i = 0; i < 4; i++) {
        const a = a0 + (i * Math.PI) / 2
        const c = Math.cos(a)
        const s = Math.sin(a)
        g.lineWidth = 0.9
        g.beginPath()
        g.moveTo(x, y)
        g.lineTo(x + c * 18, y + s * 18)
        g.stroke()
        g.beginPath()
        g.moveTo(x + c * 5, y + s * 5)
        g.lineTo(x + c * 18, y + s * 18)
        g.lineTo(x + c * 18 - s * 3.5, y + s * 18 + c * 3.5)
        g.lineTo(x + c * 5 - s * 2.5, y + s * 5 + c * 2.5)
        g.fill()
      }
    } else if (l.kind === 'bell') {
      const swing = Math.sin(tick / 40 + l.x) * 0.22
      g.save()
      g.translate(x, y)
      g.rotate(swing)
      bellShape(g, 0, 0, layer === 'a' ? 9 : 10, [
        '#0e0612',
        '#24141c',
        '#3e2a24',
        '#6a4c30',
        '#9a7a4a',
      ])
      g.restore()
    } else if (l.kind === 'fire') {
      flame(g, x, y, 0.9, tick + l.x)
      const fl = flicker(tick, l.x)
      glow(g, x, y - 3, l.r * fl, AMBER, 0.4)
    } else {
      const fl = flicker(tick, l.x + l.y)
      glow(g, x, y + 4, l.r * fl, l.color, 0.4)
    }
  }
}

function flicker(tick: number, seed: number): number {
  return (
    0.86 +
    0.08 * Math.sin(tick * 0.23 + seed) +
    0.06 * Math.sin(tick * 0.71 + seed * 1.7) +
    (hash(Math.floor(tick / 5) + seed * 31) < 0.08 ? -0.12 : 0)
  )
}

/** A small licking flame with its base at (x, y). */
function flame(
  g: Ctx,
  x: number,
  y: number,
  s: number,
  tick: number,
  hot = AMBER,
) {
  const t = tick / 6
  g.save()
  g.globalCompositeOperation = 'lighter'
  for (let i = 0; i < 3; i++) {
    const h = (7 - i * 2) * s * (0.85 + 0.15 * Math.sin(t + i * 2))
    const w = (3.2 - i * 0.9) * s
    const sway = Math.sin(t * 1.3 + i) * 0.8 * s
    g.fillStyle =
      i === 0
        ? rgba(i === 0 && hot === CRIMSON ? '#c0182a' : '#e2541a', 0.85)
        : i === 1
          ? rgba(hot, 0.9)
          : 'rgba(255, 246, 200, 0.95)'
    g.beginPath()
    g.moveTo(x - w, y)
    g.quadraticCurveTo(x - w * 0.9, y - h * 0.5, x + sway, y - h)
    g.quadraticCurveTo(x + w * 0.9, y - h * 0.5, x + w, y)
    g.closePath()
    g.fill()
  }
  g.restore()
}

/** A fog texture: soft overlapping puffs, baked once per stage. */
function paintFog(b: Ctx, colour: string, seed: number) {
  const rand = backdropRng(seed)
  for (let i = 0; i < 26; i++) {
    const x = rand() * W
    const y = 14 + rand() * 20
    const rx = 20 + rand() * 40
    const ry = 6 + rand() * 8
    for (const ox of [x, x - W, x + W]) {
      const grad = b.createRadialGradient(ox, y, 0, ox, y, rx)
      grad.addColorStop(0, rgba(colour, 0.35))
      grad.addColorStop(1, rgba(colour, 0))
      b.fillStyle = grad
      b.save()
      b.translate(ox, y)
      b.scale(1, ry / rx)
      b.translate(-ox, -y)
      b.beginPath()
      b.arc(ox, y, rx, 0, Math.PI * 2)
      b.fill()
      b.restore()
    }
  }
}

function drawFogBand(
  g: Ctx,
  key: StageKey,
  y: number,
  offset: number,
  alpha: number,
) {
  const look = LOOKS[key]
  const x0 = -mod(offset, W)
  for (const x of [x0, x0 + W])
    drawBaked(
      g,
      `gt-stage-fog-${key}`,
      x,
      y,
      W,
      48,
      (b) => paintFog(b, look.mist, key.length * 41),
      { alpha },
    )
}

/**
 * The stage backdrop in screen space, filling all 320x240; draw it first. The delivered plate
 * (or a procedural sky when it is not loaded) pans slowly across the whole stage, two silhouette
 * strips parallax in front of it, and fog drifts between the layers.
 */
export function drawBackdrop(
  g: Ctx,
  stage: StageKey,
  camX: number,
  tick: number,
): void {
  const look = LOOKS[stage] ?? LOOKS.town
  const key: StageKey = LOOKS[stage] ? stage : 'town'
  g.save()
  g.fillStyle = look.sky[0]!
  g.fillRect(0, 0, W, H)
  const t = Math.max(0, Math.min(1, camX / CAM_MAX))
  const plate = drawPlate(g, key, camX)
  if (!plate) {
    drawBaked(
      g,
      `gt-stage-far-${key}`,
      -Math.round(t * (FAR_W - W)),
      0,
      FAR_W,
      H,
      (b) => paintFar(b, key),
    )
    // Twinkling stars over the baked sky.
    for (let i = 0; i < 6; i++) {
      const s = Math.sin(tick / 20 + i * 2.3)
      if (s < 0.6) continue
      const sx = mod(i * 67 + 13 - camX * 0.02, W)
      const sy = 12 + ((i * 37) % 70)
      g.fillStyle = rgba('#ffffff', (s - 0.6) * 2)
      g.fillRect(sx - 1, sy, 3, 0.5)
      g.fillRect(sx, sy - 1, 0.5, 3)
    }
  }
  // Push the far art back: an indigo veil, heavier toward the horizon.
  const veil = g.createLinearGradient(0, 0, 0, H)
  const v = plate ? 1 : 0.4
  veil.addColorStop(0, rgba(look.sky[0]!, 0.18 * v))
  veil.addColorStop(0.55, rgba(look.sky[2]!, 0.22 * v))
  veil.addColorStop(1, rgba(look.sky[1]!, 0.5 * v))
  g.fillStyle = veil
  g.fillRect(0, 0, W, H)
  // Far fog bank.
  drawFogBand(g, key, 118, camX * 0.12 + tick * 0.05, look.fog * 0.8)
  // Mid-ground strip A.
  const oa = -mod(camX * PAR_A, MID_W)
  for (const ox of [oa, oa + MID_W]) {
    if (ox > W || ox + MID_W < 0) continue
    drawBaked(g, `gt-stage-mida-${key}`, ox, MID_A_TOP, MID_W, MID_A_H, (b) =>
      paintMidA(b, key),
    )
    animateStrip(g, key, 'a', ox, tick)
  }
  drawFogBand(g, key, 160, camX * 0.3 + tick * 0.1, look.fog * 0.55)
  // Mid-ground strip B.
  const ob = -mod(camX * PAR_B, MID_W)
  for (const ox of [ob, ob + MID_W]) {
    if (ox > W || ox + MID_W < 0) continue
    drawBaked(g, `gt-stage-midb-${key}`, ox, MID_B_TOP, MID_W, MID_B_H, (b) =>
      paintMidB(b, key),
    )
    animateStrip(g, key, 'b', ox, tick)
  }
  // Ground haze where the trail meets the scenery.
  drawFogBand(g, key, 172, camX * 0.6 + tick * 0.16, look.fog * 0.9)
  const haze = g.createLinearGradient(0, 168, 0, GROUND_Y + 4)
  haze.addColorStop(0, rgba(look.mist, 0))
  haze.addColorStop(1, rgba(look.mist, 0.22 * look.fog * 2))
  g.fillStyle = haze
  g.fillRect(0, 168, W, GROUND_Y + 4 - 168)
  // A touch of dark at the top so the HUD sits on night sky.
  const top = g.createLinearGradient(0, 0, 0, 40)
  top.addColorStop(0, rgba(INK, 0.45))
  top.addColorStop(1, rgba(INK, 0))
  g.fillStyle = top
  g.fillRect(0, 0, W, 40)
  g.restore()
}

// --- terrain: ground runs, pits, ledges, obstacles ---------------------------------------------

const RUBBLE = ['#120a10', '#261a20', '#3e2e30', '#5e4842', '#8a6e5c'] as const
const ASHLAR = ['#14080e', '#2a141c', '#442428', '#683e38', '#9a644c'] as const

/** Paint one 64 x 32 ground tile; its top row is the walkable surface (GROUND_Y). */
function paintGround(b: Ctx, key: StageKey, v: number) {
  const rand = backdropRng(key.length * 1000 + v * 97 + 5)
  /** A row of blocks whose widths add to exactly TILE (so tiles meet seamlessly). */
  const row = (
    y: number,
    h: number,
    min: number,
    max: number,
    ramp: Ramp,
    r: number,
    shift: number,
    gap = 0.4,
    jitter = 0,
  ) => {
    const widths: number[] = []
    let sum = 0
    while (sum < TILE) {
      const w = min + rand() * (max - min)
      widths.push(w)
      sum += w
    }
    const k = TILE / sum
    let x = mod(shift, TILE)
    for (const w0 of widths) {
      const w = w0 * k
      const tone = (rand() - 0.5) * 0.7
      const dy = (rand() - 0.5) * jitter
      const dh = (rand() - 0.5) * jitter
      for (const ox of [x - TILE, x])
        block(b, ox + gap / 2, y + dy, w - gap, h + dh, ramp, r, tone)
      x += w
    }
  }
  /** Fade the depths toward ink so the walking edge reads first. */
  const depth = (from: number, alpha: number) => {
    const grad = b.createLinearGradient(0, from, 0, 32)
    grad.addColorStop(0, rgba(INK, 0))
    grad.addColorStop(1, rgba(INK, alpha))
    b.fillStyle = grad
    b.fillRect(0, from, TILE, 32 - from)
  }
  if (key === 'town') {
    const grad = b.createLinearGradient(0, 0, 0, 32)
    grad.addColorStop(0, '#22161e')
    grad.addColorStop(1, '#08050c')
    b.fillStyle = grad
    b.fillRect(0, 0, TILE, 32)
    // Rubble foundation and packed dirt under the walk.
    row(11.5, 5, 6, 12, RUBBLE, 1.8, 3 + v * 5, 1.2, 1.2)
    row(17, 5.5, 7, 13, RUBBLE, 2, 9 + v * 3, 1.4, 1.4)
    row(23, 6, 8, 15, RUBBLE, 2.2, 1 + v * 7, 1.6, 1.6)
    for (let i = 0; i < 30; i++) {
      b.fillStyle = rgba(i % 3 ? '#4a3428' : '#6a5040', 0.5)
      b.fillRect(rand() * TILE, 11 + rand() * 20, 0.6, 0.6)
    }
    depth(10, 0.85)
    // Shadow under the walk, and joist ends.
    b.fillStyle = rgba(INK, 0.85)
    b.fillRect(0, 7.6, TILE, 3.6)
    for (let x = 6; x < TILE; x += 16) {
      if (v === 2 && x === 38) continue
      b.fillStyle = WOOD[1]
      b.fillRect(x, 7.6, 3.5, 3.4)
      b.fillStyle = WOOD[3]
      b.fillRect(x, 7.6, 3.5, 0.5)
      b.fillStyle = rgba(WOOD[0], 0.9)
      b.fillRect(x + 2.8, 7.6, 0.7, 3.4)
    }
    // The walk: a moonlit top of board ends, then a front stringer.
    b.fillStyle = WOOD[3]
    b.fillRect(0, 0, TILE, 2.4)
    b.fillStyle = rgba(WOOD[4], 0.9)
    b.fillRect(0, 0, TILE, 0.6)
    for (let x = 1 + v * 2; x < TILE; x += 5 + rand() * 4) {
      b.fillStyle = rgba(WOOD[1], 0.85)
      b.fillRect(x, 0.6, 0.4, 1.8)
      b.fillStyle = rgba(WOOD[4], 0.35)
      b.fillRect(x + 0.4, 0.6, 0.3, 1.8)
    }
    let x = -((v * 7) % 16)
    let i = 0
    while (x < TILE) {
      const w = 18 + ((i + v) % 3) * 5
      for (const ox of [x, x + TILE])
        plank(b, ox, 2.4, w, 5.2, WOOD, v * 31 + i)
      for (const ox of [x, x + TILE]) {
        b.fillStyle = '#b8a890'
        b.fillRect(ox + 1.2, 3.5, 0.6, 0.6)
        b.fillRect(ox + 1.2, 5.7, 0.6, 0.6)
        b.fillStyle = INK
        b.fillRect(ox + 1.6, 3.9, 0.3, 0.3)
        b.fillRect(ox + 1.6, 6.1, 0.3, 0.3)
      }
      x += w
      i++
    }
    b.fillStyle = rgba(INK, 0.9)
    b.fillRect(0, 2.2, TILE, 0.4)
  } else if (key === 'boneyard') {
    const grad = b.createLinearGradient(0, 0, 0, 32)
    grad.addColorStop(0, '#1e1830')
    grad.addColorStop(1, '#07060e')
    b.fillStyle = grad
    b.fillRect(0, 0, TILE, 32)
    // Grave earth: grit, roots, and old bones half buried.
    for (let i = 0; i < 40; i++) {
      b.fillStyle = rgba(i % 2 ? '#3a3050' : '#14101e', 0.7)
      b.fillRect(rand() * TILE, 12 + rand() * 20, 0.5 + rand(), 0.5)
    }
    const bone = (x: number, y: number, len: number, a: number) => {
      b.save()
      b.translate(x, y)
      b.rotate(a)
      b.fillStyle = BONE[1]
      b.fillRect(-len / 2, -0.5, len, 1)
      for (const e of [-len / 2, len / 2]) {
        b.beginPath()
        b.arc(e, -0.55, 0.7, 0, Math.PI * 2)
        b.arc(e, 0.55, 0.7, 0, Math.PI * 2)
        b.fill()
      }
      b.fillStyle = rgba(BONE[3], 0.8)
      b.fillRect(-len / 2, -0.5, len, 0.35)
      b.restore()
    }
    const skull = (x: number, y: number) => {
      b.fillStyle = BONE[1]
      b.beginPath()
      b.arc(x, y, 1.8, Math.PI, 0)
      b.lineTo(x + 1.5, y + 1.4)
      b.lineTo(x - 1.5, y + 1.4)
      b.fill()
      b.fillStyle = rgba(BONE[3], 0.8)
      b.fillRect(x - 1.2, y - 1.5, 1.4, 0.4)
      b.fillStyle = INK
      b.fillRect(x - 1.1, y - 0.3, 0.8, 0.8)
      b.fillRect(x + 0.3, y - 0.3, 0.8, 0.8)
    }
    for (let i = 0; i < 3; i++)
      bone(
        6 + rand() * 52,
        16 + rand() * 10,
        3 + rand() * 3,
        (rand() - 0.5) * 2,
      )
    if (v !== 1) skull(14 + v * 20, 21)
    depth(12, 0.7)
    // Two courses of cobbles make the crust.
    row(0, 6.5, 6, 11, SLATE, 2.4, v * 3, 0.5, 0.6)
    row(6, 5.5, 5, 9, SLATE, 2, 4 + v, 0.6, 0.8)
    b.fillStyle = rgba(INK, 0.5)
    b.fillRect(0, 11.6, TILE, 1)
    // Moss along the top, a few strands hanging over the face.
    for (let x = 0; x < TILE; x += 2 + rand() * 6) {
      if (rand() < 0.45) continue
      const w = 2 + rand() * 5
      b.fillStyle = '#2e4a3c'
      b.fillRect(x, 0, w, 1.1)
      b.fillStyle = '#5a8a6a'
      b.fillRect(x + 0.4, 0, w * 0.6, 0.45)
      if (rand() < 0.5) {
        b.fillStyle = '#2e4a3c'
        b.fillRect(x + w * 0.5, 1.1, 0.5, 1.5 + rand() * 2.5)
      }
    }
  } else if (key === 'waterhole') {
    const grad = b.createLinearGradient(0, 0, 0, 32)
    grad.addColorStop(0, MUD[3])
    grad.addColorStop(0.3, MUD[2])
    grad.addColorStop(1, MUD[0])
    b.fillStyle = grad
    b.fillRect(0, 0, TILE, 32)
    // Strata, a few stones, roots.
    for (let i = 0; i < 5; i++) {
      b.strokeStyle = rgba(i % 2 ? MUD[4] : MUD[1], 0.45)
      b.lineWidth = 0.5
      const y = 6 + i * 5 + rand() * 2
      b.beginPath()
      b.moveTo(0, y)
      b.bezierCurveTo(20, y + rand() * 2 - 1, 44, y + rand() * 2 - 1, TILE, y)
      b.stroke()
    }
    for (let i = 0; i < 5; i++) {
      const px = rand() * TILE
      const py = 9 + rand() * 18
      const r = 0.8 + rand() * 1.6
      b.fillStyle = mix(MUD[2], '#3a4040', 0.5)
      b.beginPath()
      b.ellipse(px, py, r * 1.4, r, 0, 0, Math.PI * 2)
      b.fill()
      b.fillStyle = rgba('#a8c8c0', 0.25)
      b.fillRect(px - r * 0.7, py - r * 0.7, r, 0.4)
    }
    b.strokeStyle = rgba('#120c06', 0.9)
    b.lineWidth = 0.55
    for (let i = 0; i < 3; i++) {
      const rx = rand() * TILE
      b.beginPath()
      b.moveTo(rx, 3)
      b.bezierCurveTo(rx + 3, 8, rx - 2, 12, rx + 4, 16 + rand() * 6)
      b.stroke()
    }
    for (let i = 0; i < 6; i++) {
      b.fillStyle = rgba('#8ff0e0', 0.16)
      b.fillRect(rand() * TILE, 5 + rand() * 18, 2 + rand() * 3, 0.4)
    }
    depth(10, 0.65)
    // The grassy lip.
    b.fillStyle = '#16301e'
    b.fillRect(0, 0, TILE, 3)
    b.fillStyle = '#25482c'
    b.fillRect(0, 0, TILE, 1.4)
    b.fillStyle = '#6aa874'
    b.fillRect(0, 0, TILE, 0.5)
    for (let x = 0; x < TILE; x += 0.9 + rand() * 1.4) {
      const h = 1.5 + rand() * 2.5
      b.fillStyle = rand() < 0.5 ? '#2f5a36' : '#3e7444'
      b.fillRect(x, 1.6, 0.5, h)
    }
    b.fillStyle = rgba(INK, 0.4)
    b.fillRect(0, 3.5, TILE, 0.8)
  } else {
    const grad = b.createLinearGradient(0, 0, 0, 32)
    grad.addColorStop(0, '#24121a')
    grad.addColorStop(1, '#08040a')
    b.fillStyle = grad
    b.fillRect(0, 0, TILE, 32)
    // Old ashlar courses, uneven and worn.
    row(6.4, 7, 9, 20, ASHLAR, 1, 2 + v * 3, 0.9, 0.8)
    row(13.6, 7, 11, 22, ASHLAR, 1, 9 + v * 7, 0.9, 0.8)
    row(20.8, 7, 9, 20, ASHLAR, 1.2, 5 + v * 11, 1, 1)
    row(28, 7, 11, 22, ASHLAR, 1.2, 1 + v * 5, 1, 1)
    // Cracks, a missing block glowing faintly from within.
    b.strokeStyle = rgba(ASHLAR[0], 0.95)
    b.lineWidth = 0.4
    for (let i = 0; i < 4; i++) {
      const cx = rand() * TILE
      const cy = 7 + rand() * 18
      b.beginPath()
      b.moveTo(cx, cy)
      b.lineTo(cx + 2, cy + 2)
      b.lineTo(cx + 1, cy + 4)
      b.lineTo(cx + 3, cy + 6)
      b.stroke()
    }
    if (v === 1) {
      b.fillStyle = rgba(INK, 0.95)
      b.fillRect(30, 14, 12, 6.4)
      b.fillStyle = rgba('#ff4a2a', 0.3)
      b.fillRect(31, 18.4, 10, 2)
    }
    b.fillStyle = rgba(INK, 0.28)
    b.fillRect(0, 6, TILE, 26)
    depth(8, 0.85)
    // Coping slabs, the walking surface.
    row(0, 6, 18, 30, MASONRY, 1, v * 5, 0.6)
    b.fillStyle = rgba(MASONRY[4], 0.85)
    b.fillRect(0, 0, TILE, 0.6)
    b.fillStyle = rgba(INK, 0.7)
    b.fillRect(0, 6, TILE, 0.8)
  }
}

/** A run end's cut face: points (dx inward from the end, y) from the lip down to the bottom. */
function edgeProfile(seed: number): Array<[number, number]> {
  const rand = backdropRng(seed)
  const pts: Array<[number, number]> = [[0, GROUND_Y]]
  let d = 0
  for (let y = GROUND_Y + 3; y < H; y += 3 + rand() * 3) {
    d = Math.min(9, Math.max(0, d + (rand() - 0.25) * 3))
    pts.push([d, y])
  }
  pts.push([d + 1, H])
  return pts
}

function runPath(
  g: Ctx,
  a: number,
  b: number,
  leftOpen: boolean,
  rightOpen: boolean,
) {
  g.beginPath()
  g.moveTo(a, GROUND_Y)
  g.lineTo(b, GROUND_Y)
  if (rightOpen)
    for (const [d, y] of edgeProfile(Math.floor(b) * 7 + 1)) g.lineTo(b - d, y)
  else g.lineTo(b, H)
  const left = leftOpen
    ? edgeProfile(Math.floor(a) * 7 + 2)
    : [[0, GROUND_Y] as [number, number], [0, H] as [number, number]]
  for (let i = left.length - 1; i >= 0; i--) {
    const p = left[i]!
    g.lineTo(a + p[0], p[1])
  }
  g.closePath()
}

function drawRun(
  g: Ctx,
  key: StageKey,
  a: number,
  b: number,
  x0: number,
  x1: number,
  leftOpen: boolean,
  rightOpen: boolean,
) {
  const from = Math.max(a, x0)
  const to = Math.min(b, x1)
  if (to <= from) return
  g.save()
  runPath(g, a, b, leftOpen, rightOpen)
  g.clip()
  for (let tx = Math.floor(from / TILE) * TILE; tx < to; tx += TILE) {
    const v = Math.floor(hash(tx / TILE + key.length * 101) * 3)
    drawBaked(
      g,
      `gt-stage-ground-${key}-${v}`,
      tx,
      GROUND_Y,
      TILE,
      H - GROUND_Y,
      (bb) => paintGround(bb, key, v),
    )
  }
  g.restore()
  // The cut faces at pit edges: an ink rim, a lit lip and a crumbling corner.
  const look = LOOKS[key]
  const edge = (x: number, dir: 1 | -1, seed: number) => {
    if (x < x0 - 12 || x > x1 + 12) return
    const pts = edgeProfile(seed)
    g.strokeStyle = rgba(INK, 0.95)
    g.lineWidth = 1
    g.beginPath()
    for (const [d, y] of pts) g.lineTo(x + dir * d, y)
    g.stroke()
    g.strokeStyle = rgba(key === 'waterhole' ? '#8ff0e0' : look.nearRim, 0.55)
    g.lineWidth = 0.5
    g.beginPath()
    for (const [d, y] of pts) g.lineTo(x + dir * (d + 0.8), y)
    g.stroke()
    // Darken the face as it falls away.
    const grad = g.createLinearGradient(0, GROUND_Y + 4, 0, H)
    grad.addColorStop(0, rgba(INK, 0))
    grad.addColorStop(1, rgba(INK, 0.6))
    g.fillStyle = grad
    g.fillRect(dir > 0 ? x : x - 12, GROUND_Y + 4, 12, H - GROUND_Y - 4)
    // The lip catches the moon.
    g.fillStyle = rgba('#fff4dc', 0.55)
    g.fillRect(dir > 0 ? x : x - 3, GROUND_Y, 3, 0.6)
  }
  if (leftOpen) edge(a, 1, Math.floor(a) * 7 + 2)
  if (rightOpen) edge(b, -1, Math.floor(b) * 7 + 1)
}

/** The gap between two runs: an abyss (or, at the waterhole, deep water). */
function drawPit(g: Ctx, key: StageKey, a: number, b: number, tick: number) {
  const look = LOOKS[key]
  // Reach under the runs' cut-away faces too; the runs draw over the rest.
  const x = a - 12
  const w = b - a + 24
  if (key === 'waterhole') {
    // Dark bank shadow down to the waterline, then water.
    g.fillStyle = rgba(INK, 0.55)
    g.fillRect(x, GROUND_Y, w, 8)
    const water = g.createLinearGradient(0, GROUND_Y + 8, 0, H)
    water.addColorStop(0, '#16606a')
    water.addColorStop(0.25, '#0c3c48')
    water.addColorStop(1, '#03141c')
    g.fillStyle = water
    g.fillRect(x, GROUND_Y + 8, w, H - GROUND_Y - 8)
    // A wavy, shimmering surface.
    g.fillStyle = rgba('#5fd0cc', 0.8)
    for (let sx = a; sx < b; sx += 2) {
      const y = GROUND_Y + 8 + Math.sin(sx / 9 + tick / 14) * 0.6
      g.fillRect(sx, y - 0.4, 2, 0.8)
    }
    g.fillStyle = rgba('#d4fff6', 0.8)
    for (let sx = a + 4; sx < b - 4; sx += 12) {
      const drift = mod(tick / 8 + sx, 6)
      g.fillRect(sx + drift, GROUND_Y + 10, 4, 0.6)
      g.fillRect(sx + 6 - drift * 0.5, GROUND_Y + 15 + (sx % 3), 2.5, 0.5)
    }
    // Moonlight on the water and a cold under-glow.
    g.fillStyle = rgba(look.moon.color, 0.12)
    for (let i = 0; i < 4; i++)
      g.fillRect(
        a + w * 0.3 + Math.sin(tick / 20 + i) * 2,
        GROUND_Y + 12 + i * 5,
        w * 0.3 - i * 2,
        0.8,
      )
    g.fillStyle = rgba('#7df3ff', 0.08 + 0.04 * Math.sin(tick / 30))
    g.fillRect(x, GROUND_Y + 8, w, 6)
    return
  }
  const abyss = g.createLinearGradient(0, GROUND_Y - 2, 0, H)
  abyss.addColorStop(0, rgba('#05030c', 0.55))
  abyss.addColorStop(0.35, rgba('#05030c', 0.9))
  abyss.addColorStop(1, '#020106')
  g.fillStyle = abyss
  g.fillRect(x, GROUND_Y, w, H - GROUND_Y)
  g.save()
  g.beginPath()
  g.rect(x, GROUND_Y, w, H - GROUND_Y)
  g.clip()
  if (key === 'belltower') {
    // Embers glowing far below.
    const fl = flicker(tick, a)
    glow(g, (a + b) / 2, H + 6, Math.min(40, w * 0.7) * fl, CRIMSON, 0.4)
    for (let i = 0; i < 5; i++) {
      const ex = a + mod(i * 13 + Math.sin(tick / 30 + i) * 4, Math.max(1, w))
      const ey = H - mod(tick * 0.4 + i * 9, 30)
      g.fillStyle = rgba('#ff8a4a', 0.6 * (1 - (H - ey) / 30))
      g.fillRect(ex, ey, 0.8, 0.8)
    }
  } else {
    // Mist curling in the chasm.
    const mist = key === 'boneyard' ? '#8fd6c8' : look.mist
    for (let i = 0; i < 4; i++) {
      const mx = a + mod(i * w * 0.31 + tick * (0.1 + i * 0.03), w + 30) - 15
      const my = GROUND_Y + 14 + i * 4
      const grad = g.createRadialGradient(mx, my, 0, mx, my, 14)
      grad.addColorStop(0, rgba(mist, 0.22))
      grad.addColorStop(1, rgba(mist, 0))
      g.fillStyle = grad
      g.fillRect(mx - 14, my - 14, 28, 28)
    }
  }
  g.restore()
}

/** Where a boardwalk's posts stand (world x of each post's left side). */
function postsOf(bw: { x: number; w: number }): number[] {
  const out = [bw.x + 3, bw.x + bw.w - 7]
  if (bw.w > 100) out.splice(1, 0, bw.x + Math.round(bw.w / 2) - 2)
  return out
}

/** Paint a boardwalk, local origin at (x - 4, y): deck exactly from 4 to w + 4. */
function paintBoardwalk(
  b: Ctx,
  key: StageKey,
  w: number,
  h: number,
  seed: number,
) {
  const rand = backdropRng(seed)
  const L = 4
  const posts = postsOf({ x: 0, w }).map((p) => p + L)
  const postRamp: Ramp =
    key === 'town'
      ? WOOD
      : key === 'waterhole'
        ? DOCK
        : key === 'boneyard'
          ? GREYWOOD
          : WOOD
  const deckDepth = key === 'belltower' ? 8 : key === 'boneyard' ? 7 : 6
  // Posts down to the ground.
  for (const px of posts) {
    if (key === 'waterhole') {
      roundRect(b, px - 0.5, deckDepth - 1, 4.5, h - deckDepth + 1, 1.6)
      b.fillStyle = postRamp[2]
      b.fill()
      b.fillStyle = postRamp[3]
      b.fillRect(px, deckDepth, 1.2, h - deckDepth)
      b.fillStyle = postRamp[1]
      b.fillRect(px + 2.8, deckDepth, 1.2, h - deckDepth)
      b.strokeStyle = postRamp[0]
      b.lineWidth = 0.5
      roundRect(b, px - 0.5, deckDepth - 1, 4.5, h - deckDepth + 1, 1.6)
      b.stroke()
      // Rope lashings and weed at the foot.
      for (const ry of [deckDepth + 2, deckDepth + 4]) {
        b.fillStyle = '#a89060'
        b.fillRect(px - 0.6, ry, 4.7, 0.9)
        b.fillStyle = '#5a4a30'
        b.fillRect(px - 0.6, ry + 0.9, 4.7, 0.3)
      }
      b.fillStyle = '#2f5a3a'
      b.fillRect(px - 0.5, h - 6, 4.5, 6)
      b.fillStyle = '#4f8a5a'
      for (let k = 0; k < 4; k++) b.fillRect(px + k, h - 8 + (k % 2), 0.5, 3)
    } else {
      post(b, px, deckDepth, 4, h - deckDepth, postRamp)
      if (key === 'belltower' || key === 'town') {
        // Stone footing.
        block(
          b,
          px - 1.5,
          h - 3,
          7,
          3,
          key === 'town' ? SANDSTONE : MASONRY,
          0.8,
        )
      }
    }
  }
  // Cross braces between posts.
  for (let i = 0; i < posts.length - 1; i++) {
    const p0 = posts[i]! + 4
    const p1 = posts[i + 1]!
    const top = deckDepth + 4
    const bottom = h - 8
    if (bottom - top < 8) continue
    if (key === 'boneyard') {
      // Chains swagged between the scaffold posts.
      chain(b, p0, top, p1, top, 6)
      chain(b, p0, top + 14, p1, top + 14, 4)
    } else {
      brace(b, p0, top, p1, bottom, postRamp, 1.8)
      brace(b, p1, top, p0, bottom, postRamp, 1.8)
    }
  }
  // Beam under the deck.
  if (key !== 'belltower') plank(b, L, deckDepth, w, 3, postRamp, seed + 3)
  // The deck itself.
  if (key === 'town') {
    b.fillStyle = WOOD[3]
    b.fillRect(L, 0, w, 2)
    b.fillStyle = rgba(WOOD[4], 0.9)
    b.fillRect(L, 0, w, 0.6)
    let x = L
    let i = 0
    while (x < L + w) {
      const pw = Math.min(L + w - x, 12 + (i % 3) * 4)
      plank(b, x, 2, pw, 4, WOOD, seed + i)
      b.fillStyle = '#c8b8a0'
      b.fillRect(x + 1, 3, 0.6, 0.6)
      b.fillRect(x + 1, 4.6, 0.6, 0.6)
      x += pw
      i++
    }
    // Ragged board ends hanging off.
    b.fillStyle = WOOD[2]
    b.fillRect(L + w * 0.3, 6, 2, 3 + rand() * 2)
    b.fillRect(L + w * 0.7, 6, 1.5, 2 + rand() * 2)
  } else if (key === 'boneyard') {
    // A slab ledge on the scaffold, moss creeping over.
    let x = L
    while (x < L + w - 0.1) {
      const sw = Math.min(L + w - x, 9 + rand() * 8)
      block(b, x + 0.2, 0, sw - 0.4, 4.5, SLATE, 1.2, (rand() - 0.5) * 0.5)
      x += sw
    }
    x = L
    while (x < L + w - 0.1) {
      const sw = Math.min(L + w - x, 4 + rand() * 6)
      block(b, x + 0.3, 4.3, sw - 0.6, 2.7, SLATE, 1, -0.3)
      x += sw
    }
    for (let k = 0; k < w / 8; k++) {
      const mx = L + rand() * (w - 4)
      b.fillStyle = '#2e4a3c'
      b.fillRect(mx, 0, 2 + rand() * 4, 1)
      b.fillStyle = '#4f7a5e'
      b.fillRect(mx, 1, 0.5, 2 + rand() * 4)
    }
  } else if (key === 'waterhole') {
    let x = L
    let i = 0
    while (x < L + w) {
      const pw = Math.min(L + w - x, 10 + (i % 2) * 6)
      plank(b, x, 0, pw, 4, DOCK, seed + i)
      x += pw
      i++
    }
    b.fillStyle = rgba(DOCK[4], 0.8)
    b.fillRect(L, 0, w, 0.6)
    // Moss and drips on the edge.
    for (let k = 0; k < w / 10; k++) {
      const mx = L + rand() * (w - 3)
      b.fillStyle = '#2f5a3a'
      b.fillRect(mx, 4, 3, 1)
      b.fillRect(mx + 1, 5, 0.6, 1 + rand() * 3)
    }
  } else {
    // Corbelled masonry: a coping course over brackets.
    let x = L
    while (x < L + w - 0.1) {
      const sw = Math.min(L + w - x, 14 + rand() * 10)
      block(b, x + 0.25, 0, sw - 0.5, 4.5, MASONRY, 0.8, (rand() - 0.5) * 0.4)
      x += sw
    }
    x = L
    while (x < L + w - 0.1) {
      const sw = Math.min(L + w - x, 8 + rand() * 6)
      block(b, x + 0.3, 4.4, sw - 0.6, 3.6, MASONRY, 0.6, -0.35)
      x += sw
    }
    b.fillStyle = rgba(MASONRY[4], 0.85)
    b.fillRect(L, 0, w, 0.6)
    for (const px of posts) {
      block(b, px - 2, 8, 8, 3, MASONRY, 0.6, -0.2)
      block(b, px - 0.5, 11, 5, 2.5, MASONRY, 0.6, -0.4)
    }
  }
  b.fillStyle = rgba(INK, 0.9)
  b.fillRect(L, deckDepth - 0.2, w, 0.5)
}

/** Lantern (or bell) hangers under a boardwalk, world space. */
function boardwalkFixtures(
  key: StageKey,
  bw: { x: number; y: number; w: number },
): Array<{ x: number; y: number; kind: 'lantern' | 'bell' }> {
  const out: Array<{ x: number; y: number; kind: 'lantern' | 'bell' }> = []
  const r = hash(bw.x * 3 + bw.y)
  const depth = key === 'belltower' ? 8 : key === 'boneyard' ? 7 : 6
  if (key === 'belltower') {
    out.push({
      x: bw.x + Math.round(bw.w * (0.3 + r * 0.4)),
      y: bw.y + depth + 6,
      kind: 'bell',
    })
  } else if (r < 0.75) {
    out.push({
      x: bw.x + (r < 0.4 ? 14 : bw.w - 14),
      y: bw.y + depth + 3 + Math.round(r * 4),
      kind: 'lantern',
    })
  }
  return out
}

function drawBoardwalk(
  g: Ctx,
  key: StageKey,
  bw: { x: number; y: number; w: number },
  tick: number,
  onGround: (x: number) => boolean,
) {
  const h = Math.max(8, GROUND_Y - bw.y)
  drawBaked(
    g,
    `gt-stage-walk-${key}-${bw.w}-${h}-${bw.x}`,
    bw.x - 4,
    bw.y,
    bw.w + 8,
    h,
    (b) => paintBoardwalk(b, key, bw.w, h, bw.x),
  )
  // A post over a pit runs on down into the dark.
  for (const px of postsOf(bw)) {
    if (onGround(px + 2)) continue
    const ramp: Ramp =
      key === 'waterhole' ? DOCK : key === 'boneyard' ? GREYWOOD : WOOD
    post(g, px, GROUND_Y, 4, H - GROUND_Y, ramp)
  }
  for (const f of boardwalkFixtures(key, bw)) {
    const top = bw.y + (key === 'belltower' ? 8 : key === 'boneyard' ? 7 : 6)
    if (f.kind === 'bell') {
      dropChain(g, f.x, top, f.y)
      const swing = Math.sin(tick / 32 + bw.x) * 0.18
      g.save()
      g.translate(f.x, f.y)
      g.rotate(swing)
      bellShape(g, 0, 0, 9)
      g.restore()
    } else {
      dropChain(g, f.x, top, f.y)
      const sway = Math.sin(tick / 45 + bw.x) * 0.5
      lantern(g, f.x + sway, f.y)
      const fl = flicker(tick, bw.x)
      glow(g, f.x + sway, f.y + 4.5, 20 * fl, AMBER, 0.42)
      glow(g, f.x + sway, f.y + 4.5, 7 * fl, '#fff0b0', 0.35)
    }
  }
}

/** Paint an obstacle in a 16 x 18 box; the solid 12 x 16 block spans x 2..14, y 2..18. */
function paintObstacle(b: Ctx, key: StageKey, v: number) {
  const rand = backdropRng(key.length * 300 + v)
  const X = 2
  const Y = 2
  if (key === 'town' || key === 'boneyard') {
    const ramp = key === 'town' ? SANDSTONE : SLATE
    // Headstone with rounded shoulders, a carved cross, a base slab.
    b.beginPath()
    b.moveTo(X, Y + 16)
    b.lineTo(X, Y + 4)
    b.quadraticCurveTo(X, Y, X + 4, Y)
    b.lineTo(X + 8, Y)
    b.quadraticCurveTo(X + 12, Y, X + 12, Y + 4)
    b.lineTo(X + 12, Y + 16)
    b.closePath()
    const grad = b.createLinearGradient(X, 0, X + 12, 0)
    grad.addColorStop(0, ramp[3])
    grad.addColorStop(0.4, ramp[2])
    grad.addColorStop(1, ramp[1])
    b.fillStyle = grad
    b.fill()
    b.strokeStyle = INK
    b.lineWidth = 0.6
    b.stroke()
    b.fillStyle = rgba(ramp[4], 0.8)
    b.fillRect(X + 2, Y + 0.5, 6, 0.6)
    b.fillRect(X + 0.6, Y + 3, 0.6, 9)
    // The cross.
    b.fillStyle = ramp[1]
    b.fillRect(X + 5.2, Y + 2.5, 1.8, 8)
    b.fillRect(X + 3, Y + 4.6, 6.2, 1.6)
    b.fillStyle = rgba(ramp[4], 0.6)
    b.fillRect(X + 5.2, Y + 2.5, 0.5, 8)
    b.fillRect(X + 3, Y + 4.6, 6.2, 0.4)
    // Cracks and lichen.
    b.strokeStyle = rgba(INK, 0.8)
    b.lineWidth = 0.35
    b.beginPath()
    b.moveTo(X + 10 - v * 3, Y + 1)
    b.lineTo(X + 9 - v * 3, Y + 4)
    b.lineTo(X + 10 - v * 3, Y + 6)
    b.stroke()
    b.fillStyle =
      key === 'town' ? 'rgba(170, 150, 90, 0.5)' : 'rgba(80, 140, 110, 0.6)'
    for (let i = 0; i < 4; i++)
      b.fillRect(X + rand() * 10, Y + 8 + rand() * 6, 1.2, 0.8)
    block(b, X - 1, Y + 13.5, 14, 2.5, ramp, 0.6, -0.3)
    if (key === 'boneyard' && v === 0) {
      // A skull at its foot.
      b.fillStyle = BONE[3]
      b.beginPath()
      b.arc(X + 2, Y + 12.4, 1.7, Math.PI, 0)
      b.fill()
      b.fillRect(X + 0.6, Y + 12.3, 2.8, 1.2)
      b.fillStyle = INK
      b.fillRect(X + 1, Y + 12, 0.7, 0.7)
      b.fillRect(X + 2.3, Y + 12, 0.7, 0.7)
    }
  } else if (key === 'waterhole') {
    // A mossy boulder, flat enough on top to stand on.
    b.beginPath()
    b.moveTo(X - 1, Y + 16)
    b.quadraticCurveTo(X - 1.5, Y + 6, X + 2, Y + 1.5)
    b.quadraticCurveTo(X + 6, Y - 0.4, X + 10, Y + 0.8)
    b.quadraticCurveTo(X + 13.5, Y + 4, X + 13, Y + 16)
    b.closePath()
    const grad = b.createRadialGradient(X + 3, Y + 3, 1, X + 6, Y + 8, 12)
    grad.addColorStop(0, '#8a8a84')
    grad.addColorStop(0.5, '#56564e')
    grad.addColorStop(1, '#22231e')
    b.fillStyle = grad
    b.fill()
    b.strokeStyle = INK
    b.lineWidth = 0.6
    b.stroke()
    b.strokeStyle = rgba('#14140e', 0.8)
    b.lineWidth = 0.4
    b.beginPath()
    b.moveTo(X + 4, Y + 6)
    b.lineTo(X + 6, Y + 10)
    b.lineTo(X + 5, Y + 14)
    b.stroke()
    // Moss cap.
    b.fillStyle = '#2f5a2a'
    b.beginPath()
    b.moveTo(X + 1, Y + 3.5)
    b.quadraticCurveTo(X + 6, Y - 1, X + 11.5, Y + 2.5)
    b.lineTo(X + 10, Y + 4.5)
    b.lineTo(X + 8, Y + 3.6)
    b.lineTo(X + 6, Y + 5)
    b.lineTo(X + 3.5, Y + 3.8)
    b.closePath()
    b.fill()
    b.fillStyle = '#6aa04a'
    b.fillRect(X + 3, Y + 1.2, 5, 0.5)
    for (let i = 0; i < 4; i++)
      b.fillRect(X + 3 + i * 2, Y + 3.5 + (i % 2), 0.5, 1.5 + v)
    b.fillStyle = rgba('#c8f0e8', 0.35)
    b.fillRect(X + 1.5, Y + 6, 1, 3)
  } else {
    // Tumbled masonry: two blocks, a chipped corner.
    block(b, X, Y + 8, 12, 8, MASONRY, 0.8, -0.1)
    block(b, X + 0.5, Y, 11, 8.2, MASONRY, 0.8, 0.15)
    b.fillStyle = rgba(INK, 0.95)
    b.beginPath()
    b.moveTo(X + 11.5, Y + 8.2)
    b.lineTo(X + 12, Y + 12)
    b.lineTo(X + 9.5, Y + 9)
    b.fill()
    b.strokeStyle = rgba(MASONRY[0], 0.9)
    b.lineWidth = 0.4
    b.beginPath()
    b.moveTo(X + 4 + v * 3, Y + 1)
    b.lineTo(X + 5 + v * 3, Y + 4)
    b.lineTo(X + 4 + v * 3, Y + 7)
    b.stroke()
    // A carved cross on the face, and rubble.
    b.fillStyle = MASONRY[1]
    b.fillRect(X + 5.4, Y + 9.5, 1.2, 5)
    b.fillRect(X + 4, Y + 11, 4, 1.1)
    block(b, X - 1.5, Y + 14, 3, 2, MASONRY, 0.5, -0.2)
    block(b, X + 11, Y + 14.5, 2.5, 1.5, MASONRY, 0.5, 0)
  }
}

/**
 * The stage's walkable surfaces in world space (the caller has translated by -camX): pits, ground
 * runs, boardwalk ledges and obstacle blocks, each silhouette exactly its collision. Only the
 * visible span is drawn.
 */
export function drawTerrain(
  g: Ctx,
  stage: TerrainStage,
  camX: number,
  tick: number,
): void {
  const key: StageKey = LOOKS[stage.key] ? stage.key : 'town'
  const x0 = camX - 24
  const x1 = camX + W + 24
  const runs = stage.ground
  const onGround = (x: number) => runs.some(([a, b]) => x >= a && x <= b)
  g.save()
  // Pits first, so the run edges cut over them.
  for (let i = 0; i < runs.length - 1; i++) {
    const a = runs[i]![1]
    const b = runs[i + 1]![0]
    if (b < x0 || a > x1 || b <= a) continue
    drawPit(g, key, a, b, tick)
  }
  const first = runs[0]
  if (first && first[0] > x0)
    drawPit(g, key, Math.min(x0, first[0] - 1), first[0], tick)
  for (let i = 0; i < runs.length; i++) {
    const [a, b] = runs[i]!
    if (b < x0 || a > x1) continue
    drawRun(g, key, a, b, x0, x1, i > 0 || a > 0, i < runs.length - 1)
  }
  for (const bw of stage.boardwalks) {
    if (bw.x + bw.w < x0 || bw.x > x1) continue
    drawBoardwalk(g, key, bw, tick, onGround)
  }
  for (const t of stage.tombstones) {
    if (t < x0 || t > x1) continue
    const v = Math.floor(hash(t) * 2)
    drawBaked(
      g,
      `gt-stage-stone-${key}-${v}`,
      t - 8,
      GROUND_Y - 18,
      16,
      18,
      (b) => paintObstacle(b, key, v),
    )
  }
  g.restore()
}

// --- gate, checkpoint, crate, secret -----------------------------------------------------------

const GATE_L = 8
const GATE_T = 108

/** The end gate, local origin at (x - 8, GROUND_Y - 108): posts at 8..20 and 68..80. */
function paintGate(b: Ctx, key: StageKey, barred: boolean) {
  const gy = GATE_T // local y of GROUND_Y
  const L = GATE_L
  const stoneRamp: Ramp =
    key === 'town'
      ? WOOD
      : key === 'boneyard'
        ? SLATE
        : key === 'waterhole'
          ? DOCK
          : MASONRY
  if (barred) {
    // Iron bars with spear tips and a cross rail, behind the posts.
    for (let x = L + 14; x < L + 60; x += 7) {
      b.fillStyle = IRON[1]
      b.fillRect(x, gy - 68, 3, 68)
      b.fillStyle = IRON[3]
      b.fillRect(x, gy - 68, 0.8, 68)
      b.fillStyle = IRON[1]
      b.beginPath()
      b.moveTo(x - 0.8, gy - 68)
      b.lineTo(x + 1.5, gy - 73)
      b.lineTo(x + 3.8, gy - 68)
      b.fill()
    }
    for (const ry of [gy - 40, gy - 62, gy - 12]) {
      b.fillStyle = IRON[1]
      b.fillRect(L + 12, ry, 48, 3)
      b.fillStyle = IRON[3]
      b.fillRect(L + 12, ry, 48, 0.7)
    }
    // A padlock.
    b.fillStyle = BRONZE[2]
    roundRect(b, L + 32, gy - 38, 8, 7, 1.5)
    b.fill()
    b.strokeStyle = INK
    b.lineWidth = 0.5
    b.stroke()
    b.strokeStyle = IRON[3]
    b.lineWidth = 1
    b.beginPath()
    b.arc(L + 36, gy - 38, 2.6, Math.PI, 0)
    b.stroke()
    b.fillStyle = INK
    b.fillRect(L + 35.5, gy - 36, 1, 2.5)
  } else {
    // Open: the gate leaves swung back, the dark of the mission beyond.
    b.fillStyle = rgba(INK, 0.55)
    b.fillRect(L + 12, gy - 68, 48, 68)
    for (const sx of [L + 13, L + 54]) {
      b.fillStyle = IRON[1]
      b.fillRect(sx, gy - 66, 5, 66)
      b.fillStyle = IRON[3]
      b.fillRect(sx, gy - 66, 0.7, 66)
    }
  }
  if (key === 'town' || key === 'waterhole') {
    // Heavy timber posts and lintel.
    for (const px of [L, L + 60]) {
      post(b, px, gy - 70, 12, 70, stoneRamp)
      b.fillStyle = IRON[1]
      for (const yy of [gy - 60, gy - 30]) b.fillRect(px, yy, 12, 2)
      b.fillStyle = IRON[3]
      for (const yy of [gy - 60, gy - 30]) b.fillRect(px, yy, 12, 0.5)
    }
    plank(b, L - 4, gy - 82, 80, 14, stoneRamp, 9)
    plank(b, L - 2, gy - 85, 76, 3, stoneRamp, 13)
    brace(b, L + 12, gy - 54, L + 26, gy - 68, stoneRamp, 2.4)
    brace(b, L + 60, gy - 54, L + 46, gy - 68, stoneRamp, 2.4)
    if (key === 'town') {
      // A longhorn skull mounted over the lintel.
      const cx = L + 36
      b.strokeStyle = BONE[2]
      b.lineWidth = 2
      b.beginPath()
      b.moveTo(cx - 3, gy - 92)
      b.quadraticCurveTo(cx - 12, gy - 94, cx - 16, gy - 100)
      b.moveTo(cx + 3, gy - 92)
      b.quadraticCurveTo(cx + 12, gy - 94, cx + 16, gy - 100)
      b.stroke()
      b.fillStyle = BONE[3]
      b.beginPath()
      b.moveTo(cx - 4, gy - 96)
      b.lineTo(cx + 4, gy - 96)
      b.lineTo(cx + 2.5, gy - 86)
      b.lineTo(cx - 2.5, gy - 86)
      b.closePath()
      b.fill()
      b.strokeStyle = INK
      b.lineWidth = 0.5
      b.stroke()
      b.fillStyle = INK
      b.fillRect(cx - 2.6, gy - 93.5, 1.6, 1.6)
      b.fillRect(cx + 1, gy - 93.5, 1.6, 1.6)
    } else {
      // A sluice wheel hub and a lantern.
      b.fillStyle = BRONZE[2]
      b.beginPath()
      b.arc(L + 36, gy - 92, 7, Math.PI, 0)
      b.fill()
      b.strokeStyle = INK
      b.lineWidth = 0.5
      b.stroke()
      for (let i = 0; i < 5; i++) {
        const a = Math.PI + (i * Math.PI) / 4
        b.beginPath()
        b.moveTo(L + 36, gy - 92)
        b.lineTo(L + 36 + Math.cos(a) * 7, gy - 92 + Math.sin(a) * 7)
        b.stroke()
      }
    }
  } else {
    // Stone pillars and an arch lintel.
    for (const px of [L, L + 60]) {
      for (let yy = gy - 70; yy < gy; yy += 7)
        block(b, px, yy, 12, 7, stoneRamp, 0.6, ((yy / 7) % 2) * 0.2 - 0.1)
      block(b, px - 1.5, gy - 72, 15, 3, stoneRamp, 0.6, 0.3)
    }
    for (let i = 0; i < 6; i++)
      block(
        b,
        L - 4 + i * 13.33,
        gy - 82,
        13.33,
        7,
        stoneRamp,
        0.6,
        (i % 2) * 0.2,
      )
    for (let i = 0; i < 8; i++)
      block(
        b,
        L - 4 + i * 10,
        gy - 75,
        10,
        7,
        stoneRamp,
        0.6,
        -0.2 + (i % 2) * 0.15,
      )
    if (key === 'boneyard') {
      // A pediment with a cross.
      b.beginPath()
      b.moveTo(L + 18, gy - 82)
      b.lineTo(L + 36, gy - 92)
      b.lineTo(L + 54, gy - 82)
      b.closePath()
      b.fillStyle = stoneRamp[2]
      b.fill()
      b.strokeStyle = INK
      b.lineWidth = 0.5
      b.stroke()
      b.fillStyle = stoneRamp[3]
      cross(b, L + 36, gy - 92, 14, stoneRamp[3], 2)
      b.fillStyle = stoneRamp[4]
      b.fillRect(L + 35, gy - 106, 0.6, 14)
    } else {
      // A little campanile over the arch (its bell swings live).
      b.fillStyle = stoneRamp[1]
      b.fillRect(L + 25, gy - 100, 22, 18)
      b.fillStyle = rgba(INK, 0.9)
      b.beginPath()
      b.arc(L + 36, gy - 95, 7, Math.PI, 0)
      b.fillRect(L + 29, gy - 95, 14, 13)
      b.fill()
      for (const px of [L + 24, L + 43])
        block(b, px, gy - 100, 5, 18, stoneRamp, 0.5, 0.1)
      block(b, L + 22, gy - 103, 28, 3.5, stoneRamp, 0.6, 0.3)
      cross(b, L + 36, gy - 103, 5, stoneRamp[3], 1.2)
    }
  }
  // Moss and soot.
  b.fillStyle = rgba(INK, 0.3)
  b.fillRect(L - 4, gy - 4, 80, 4)
}

/**
 * The barred gate at the trail's end, world space: `x` is STAGE_END, the left post's left edge;
 * posts span x..x+12 and x+60..x+72, the lintel x-4..x+76 at GROUND_Y-82, its crest up to about
 * GROUND_Y-104. While `barred` the iron bars close x+14..x+60.
 */
export function drawGate(
  g: Ctx,
  stage: StageKey,
  x: number,
  tick: number,
  barred = true,
): void {
  const key: StageKey = LOOKS[stage] ? stage : 'town'
  drawBaked(
    g,
    `gt-stage-gate-${key}-${barred ? 1 : 0}`,
    x - GATE_L,
    GROUND_Y - GATE_T,
    88,
    GATE_T,
    (b) => paintGate(b, key, barred),
  )
  const fl = flicker(tick, x)
  if (key === 'belltower') {
    const swing = Math.sin(tick / 22) * 0.25
    g.save()
    g.translate(x + 36, GROUND_Y - 97)
    g.rotate(swing)
    bellShape(g, 0, 0, 8)
    g.restore()
    for (const bx of [x - 2, x + 74]) {
      // Iron cups on the pillar caps hold the heretic's fire.
      g.fillStyle = IRON[1]
      g.beginPath()
      g.moveTo(bx - 4, GROUND_Y - 74)
      g.lineTo(bx + 4, GROUND_Y - 74)
      g.lineTo(bx + 2, GROUND_Y - 71)
      g.lineTo(bx - 2, GROUND_Y - 71)
      g.fill()
      g.fillStyle = IRON[3]
      g.fillRect(bx - 4, GROUND_Y - 74, 8, 0.6)
    }
    flame(g, x - 2, GROUND_Y - 73.5, 1.1, tick, CRIMSON)
    flame(g, x + 74, GROUND_Y - 73.5, 1.1, tick + 9, CRIMSON)
    glow(g, x - 2, GROUND_Y - 74, 18 * fl, CRIMSON, 0.35)
    glow(g, x + 74, GROUND_Y - 74, 18 * fl, CRIMSON, 0.35)
  } else {
    // Lanterns hung from the lintel ends.
    for (const lx of [x - 1, x + 73]) {
      dropChain(g, lx, GROUND_Y - 68, GROUND_Y - 62)
      lantern(g, lx, GROUND_Y - 62)
      glow(
        g,
        lx,
        GROUND_Y - 57.5,
        22 * fl,
        key === 'boneyard' ? CYAN : AMBER,
        0.4,
      )
    }
  }
  if (barred) {
    // A faint ward glow on the lock while the boss lives.
    glow(
      g,
      x + 36,
      GROUND_Y - 34,
      10 + 2 * Math.sin(tick / 12),
      key === 'belltower' ? CRIMSON : CYAN,
      0.25,
    )
  }
}

/**
 * The checkpoint lantern post, world space: `x` is the post's left edge (CHECKPOINT_X), the post
 * x..x+3 up to GROUND_Y-40 and the lantern x-3..x+6 above it; it burns once `lit`.
 */
export function drawCheckpoint(
  g: Ctx,
  stage: StageKey,
  x: number,
  lit: boolean,
  tick: number,
): void {
  drawBaked(
    g,
    `gt-stage-checkpost-${stage}`,
    x - 6,
    GROUND_Y - 48,
    16,
    48,
    (b) => {
      post(b, 6, 8, 3, 40, stage === 'waterhole' ? DOCK : WOOD)
      b.fillStyle = IRON[1]
      b.fillRect(4, 7, 9, 1.4)
      block(b, 4, 44, 7, 4, SANDSTONE, 0.6)
    },
  )
  g.save()
  g.translate(x + 1.5, GROUND_Y - 47)
  g.scale(1.6, 1.2)
  lantern(g, 0, 0, lit)
  g.restore()
  if (lit) {
    const fl = flicker(tick, x)
    glow(g, x + 1.5, GROUND_Y - 41, 26 * fl, AMBER, 0.45)
    glow(g, x + 1.5, GROUND_Y - 41, 8 * fl, '#fff0b0', 0.4)
  }
}

/** A breakable crate, world space: 16 x 16 with its bottom centre at (x, groundY). */
export function drawCrate(g: Ctx, x: number, groundY: number): void {
  drawBaked(g, 'gt-stage-crate', x - 8, groundY - 16, 16, 16, (b) => {
    // Frame boards round a planked face, an X brace and iron corners.
    for (let i = 0; i < 3; i++) plank(b, 0.5, 0.5 + i * 5, 15, 5, WOOD, 70 + i)
    b.fillStyle = rgba(INK, 0.35)
    b.fillRect(2, 2, 12, 12)
    brace(b, 3, 3.5, 13, 12.5, WOOD, 2)
    for (const [fx, fy, fw, fh] of [
      [0, 0, 16, 2.5],
      [0, 13.5, 16, 2.5],
      [0, 0, 2.5, 16],
      [13.5, 0, 2.5, 16],
    ] as const)
      plank(b, fx, fy, fw, fh, WOOD, 90 + fx + fy)
    b.fillStyle = IRON[2]
    for (const [cx, cy] of [
      [0, 0],
      [12.5, 0],
      [0, 12.5],
      [12.5, 12.5],
    ] as const) {
      b.fillRect(cx, cy, 3.5, 3.5)
      b.fillStyle = IRON[4]
      b.fillRect(cx + 1.4, cy + 1.4, 0.8, 0.8)
      b.fillStyle = IRON[2]
    }
    b.strokeStyle = INK
    b.lineWidth = 0.7
    b.strokeRect(0.35, 0.35, 15.3, 15.3)
    b.fillStyle = rgba(WOOD[4], 0.8)
    b.fillRect(2.5, 0.4, 10, 0.5)
  })
}

/** The hidden relic, world space: a glowing bell sigil centred on (x, y), about 12 px across. */
export function drawSecret(g: Ctx, x: number, y: number, tick: number): void {
  const pulse = (Math.sin(tick / 15) + 1) / 2
  glow(g, x, y, 14 + pulse * 5, CYAN, 0.35 + pulse * 0.2)
  const bob = Math.sin(tick / 22) * 1
  drawBaked(g, 'gt-stage-relic', x - 7, y - 7 + bob, 14, 14, (b) => {
    // A diamond medallion in an old gold frame, a bell engraved on it.
    b.save()
    b.translate(7, 7)
    b.rotate(Math.PI / 4)
    b.fillStyle = BRONZE[1]
    b.fillRect(-4.6, -4.6, 9.2, 9.2)
    b.strokeStyle = INK
    b.lineWidth = 0.6
    b.strokeRect(-4.6, -4.6, 9.2, 9.2)
    const grad = b.createLinearGradient(-4, -4, 4, 4)
    grad.addColorStop(0, '#e6fdff')
    grad.addColorStop(0.45, '#7df3ff')
    grad.addColorStop(1, '#1a6a8a')
    b.fillStyle = grad
    b.fillRect(-3.4, -3.4, 6.8, 6.8)
    b.fillStyle = BRONZE[4]
    b.fillRect(-4.6, -4.6, 9.2, 0.6)
    b.fillRect(-4.6, -4.6, 0.6, 9.2)
    b.restore()
    bellShape(b, 7, 4.2, 4.6, [
      '#0a2a3a',
      '#124a5a',
      '#1e6a7a',
      '#7ad8e8',
      '#ffffff',
    ])
  })
  // Two motes circling it.
  for (let i = 0; i < 2; i++) {
    const a = tick / 18 + i * Math.PI
    const sx = x + Math.cos(a) * 8
    const sy = y + bob + Math.sin(a) * 4
    g.fillStyle = rgba('#e6fdff', 0.6 + 0.4 * Math.sin(tick / 6 + i))
    g.fillRect(sx - 0.5, sy - 0.5, 1, 1)
  }
  if (pulse > 0.8) {
    g.fillStyle = rgba('#ffffff', (pulse - 0.8) * 4)
    g.fillRect(x - 0.4, y - 9 + bob, 0.8, 4)
    g.fillRect(x - 2, y - 7.4 + bob, 4, 0.8)
  }
}

// --- foreground --------------------------------------------------------------------------------

const FG_PAR = 1.25
const FG_PERIOD = 400
const FG_TOP = 227

type FgProp = {
  x: number
  w: number
  kind: 'fence' | 'cross' | 'stone' | 'reeds' | 'column' | 'spikes'
}

const FG_LAYOUT: Record<StageKey, FgProp[]> = {
  town: [
    { x: 0, w: 26, kind: 'fence' },
    { x: 26, w: 26, kind: 'fence' },
    { x: 60, w: 8, kind: 'cross' },
    { x: 110, w: 26, kind: 'fence' },
    { x: 150, w: 10, kind: 'stone' },
    { x: 200, w: 8, kind: 'cross' },
    { x: 214, w: 8, kind: 'cross' },
    { x: 260, w: 26, kind: 'fence' },
    { x: 286, w: 26, kind: 'fence' },
    { x: 340, w: 8, kind: 'cross' },
  ],
  boneyard: [
    { x: 0, w: 30, kind: 'spikes' },
    { x: 30, w: 30, kind: 'spikes' },
    { x: 66, w: 8, kind: 'cross' },
    { x: 120, w: 10, kind: 'stone' },
    { x: 150, w: 30, kind: 'spikes' },
    { x: 210, w: 8, kind: 'cross' },
    { x: 250, w: 30, kind: 'spikes' },
    { x: 280, w: 30, kind: 'spikes' },
    { x: 330, w: 10, kind: 'stone' },
    { x: 360, w: 8, kind: 'cross' },
  ],
  waterhole: [
    { x: 0, w: 22, kind: 'reeds' },
    { x: 40, w: 26, kind: 'fence' },
    { x: 100, w: 22, kind: 'reeds' },
    { x: 122, w: 22, kind: 'reeds' },
    { x: 190, w: 10, kind: 'stone' },
    { x: 240, w: 22, kind: 'reeds' },
    { x: 300, w: 26, kind: 'fence' },
    { x: 350, w: 22, kind: 'reeds' },
  ],
  belltower: [
    { x: 0, w: 30, kind: 'spikes' },
    { x: 40, w: 10, kind: 'column' },
    { x: 80, w: 8, kind: 'cross' },
    { x: 130, w: 30, kind: 'spikes' },
    { x: 160, w: 30, kind: 'spikes' },
    { x: 220, w: 10, kind: 'column' },
    { x: 270, w: 8, kind: 'cross' },
    { x: 320, w: 30, kind: 'spikes' },
  ],
}

function paintFgProp(b: Ctx, kind: FgProp['kind'], w: number) {
  const h = H - FG_TOP
  const f = '#05030a'
  const rim = 'rgba(120, 100, 170, 0.5)'
  b.fillStyle = f
  if (kind === 'fence') {
    // Weathered pickets on two rails.
    for (let x = 1; x < w; x += 4.3) {
      const ph = h - 1 - ((x * 7) % 3)
      b.fillRect(x, h - ph, 2.4, ph)
      b.beginPath()
      b.moveTo(x, h - ph)
      b.lineTo(x + 1.2, h - ph - 1.2)
      b.lineTo(x + 2.4, h - ph)
      b.fill()
    }
    b.fillRect(0, h - 9, w, 1.5)
    b.fillRect(0, h - 4, w, 1.5)
  } else if (kind === 'spikes') {
    for (let x = 1; x < w; x += 3.75) {
      b.fillRect(x, 2, 1, h - 2)
      b.beginPath()
      b.moveTo(x - 0.8, 2.4)
      b.lineTo(x + 0.5, 0)
      b.lineTo(x + 1.8, 2.4)
      b.fill()
    }
    b.fillRect(0, 4, w, 1.2)
    b.fillRect(0, h - 3, w, 1.2)
  } else if (kind === 'cross') {
    b.fillRect(w / 2 - 1, 0.5, 2, h)
    b.fillRect(0.5, 3.5, w - 1, 2)
  } else if (kind === 'stone') {
    roundRect(b, 0.5, 3, w - 1, h, 3.5)
    b.fill()
  } else if (kind === 'column') {
    b.fillRect(1, 3, w - 2, h)
    b.beginPath()
    b.moveTo(0.5, 3)
    b.lineTo(3, 1)
    b.lineTo(6, 2.5)
    b.lineTo(w - 0.5, 0.8)
    b.lineTo(w - 0.5, 3)
    b.fill()
  } else {
    b.strokeStyle = f
    b.lineWidth = 1
    for (let i = 0; i < 9; i++) {
      const rx = 1 + i * 2.3
      const rh = h - 2 - ((i * 5) % 6)
      b.beginPath()
      b.moveTo(rx, h)
      b.quadraticCurveTo(rx + 1, h - rh / 2, rx + ((i % 3) - 1) * 2, h - rh)
      b.stroke()
    }
    b.fillRect(5, 3, 1.6, 4)
    b.fillRect(13, 4.5, 1.6, 4)
  }
  // A faint moonlit rim along the tops.
  b.globalCompositeOperation = 'source-atop'
  b.fillStyle = rim
  b.fillRect(0, 0, w, 1.6)
  b.globalCompositeOperation = 'source-over'
}

/**
 * A low, dark silhouette strip along the bottom of the screen (screen space), drawn after the
 * actors: fences, crosses, reeds. Its tops stay at or below y = 227 and it is semi-transparent.
 * Pass the stage's ground runs and it fades out over pits, so a gap is never hidden.
 */
export function drawForeground(
  g: Ctx,
  stage: StageKey,
  camX: number,
  tick: number,
  ground?: ReadonlyArray<readonly [number, number]>,
): void {
  const key: StageKey = LOOKS[stage] ? stage : 'town'
  const layout = FG_LAYOUT[key]
  const shift = camX * FG_PAR
  const h = H - FG_TOP
  const sway = key === 'waterhole' ? Math.sin(tick / 40) * 0.4 : 0
  const pitFade = (sx: number, w: number) => {
    if (!ground) return 1
    // Fade by the distance from the prop to the nearest pit (in the world it sits over).
    const wx0 = camX + sx - 6
    const wx1 = camX + sx + w + 6
    let best = 1
    for (let i = 0; i < ground.length - 1; i++) {
      const a = ground[i]![1]
      const b = ground[i + 1]![0]
      if (wx1 < a - 10 || wx0 > b + 10) continue
      const d = wx1 < a ? a - wx1 : wx0 > b ? wx0 - b : 0
      best = Math.min(best, d / 10)
    }
    return best
  }
  for (
    let rep = Math.floor(shift / FG_PERIOD) - 1;
    rep <= Math.floor((shift + W) / FG_PERIOD) + 1;
    rep++
  ) {
    for (const p of layout) {
      const sx = Math.round(rep * FG_PERIOD + p.x - shift)
      if (sx + p.w < 0 || sx > W) continue
      const alpha = 0.82 * pitFade(sx, p.w)
      if (alpha <= 0.02) continue
      drawBaked(
        g,
        `gt-stage-fg-${p.kind}-${p.w}`,
        sx + sway,
        FG_TOP,
        p.w,
        h,
        (b) => paintFgProp(b, p.kind, p.w),
        { alpha },
      )
    }
  }
}
