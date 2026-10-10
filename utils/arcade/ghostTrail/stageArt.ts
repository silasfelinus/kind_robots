// /utils/arcade/ghostTrail/stageArt.ts
//
// Zuzu: Ghost Trail's backdrops and terrain (conductor kr-arcade t-013/t-014), drawn to the three
// accepted mockups: a delivered far plate panned slowly behind two procedural parallax silhouette
// layers and drifting fog, then hand-built gameplay surfaces whose silhouettes are exactly the
// collision the game uses (ground runs and pits, boardwalk ledges, the 12x16 obstacle blocks,
// crates, the end gate), and a low foreground fence strip drawn over the actors.
//
// Six painted worlds: the ghost town, the bone yard, the drowned watering hole, Storm Crow Pass (a
// high canyon in a night storm: slate-indigo thunderheads, gentle far lightning, wind-bent pines,
// rope bridges, crows on snags), the mission bell tower, and the abbey beneath the bell (a ritual
// crypt in violet and crimson candlelight: vaults, ossuary niches, sigils, chains, a giant bell).
// Each world's far layer is a delivered plate when one has loaded, else a layered procedural one.
//
// Acts run from about 3000 to 9000 px: pass the act's length to drawBackdrop so the slow far pan
// spans the whole act (the old default is the slice's 3520).
//
// Everything is pure drawing from the arguments: static art is baked once per key and density
// through bake.ts, lights flicker from `tick`, and headless (no document) it all still draws
// straight onto the context without throwing.

import { drawBaked, loadedImage } from './bake'
import { INK, backdropRng, glow, mix, rgba } from '../snes'

export type StageKey =
  'town' | 'boneyard' | 'waterhole' | 'stormpass' | 'belltower' | 'abbey'

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
/** The slice's act length: the default when a caller does not pass the act's own. */
const STAGE_END = 3520
/** The camera's furthest scroll in an act `length` long (the game clamps camX to length + 80 - W). */
function camMaxFor(length: number): number {
  return Math.max(1, (Number.isFinite(length) ? length : STAGE_END) + 80 - W)
}
const TILE = 64

/** Each world's seed for its procedural layout (stable: the slice's four keep their old ones). */
const SEED: Record<StageKey, number> = {
  town: 4,
  boneyard: 8,
  waterhole: 9,
  stormpass: 17,
  belltower: 9,
  abbey: 23,
}

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
  stormpass: {
    plate: 'storm-pass-far',
    sky: ['#05061a', '#0b0f2e', '#141a44', '#20285a', '#323a72', '#474c88'],
    moon: { x: 300, y: 36, r: 12, color: '#d8dcf6', shade: '#a8aed2' },
    far: '#1c2246',
    farRim: '#5058a0',
    near: '#131a36',
    nearRim: '#3a4480',
    midA: '#0f1430',
    midARim: '#46549a',
    midB: '#070a1a',
    midBRim: '#344078',
    window: '#f0a448',
    mist: '#8c96d0',
    fog: 0.42,
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
  abbey: {
    plate: 'abbey-undercrypt-far',
    sky: ['#050208', '#0c0512', '#16081c', '#220c28', '#301030', '#401634'],
    moon: { x: 220, y: 60, r: 10, color: '#ffb488', shade: '#c87a5a' },
    far: '#1e1028',
    farRim: '#6a3466',
    near: '#140a1e',
    nearRim: '#5a2650',
    midA: '#110818',
    midARim: '#7a3060',
    midB: '#09040e',
    midBRim: '#62244a',
    window: '#ff8a3a',
    mist: '#7c4c9e',
    fog: 0.38,
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
  if (key === 'stormpass') return paintFarStorm(b)
  if (key === 'abbey') return paintFarAbbey(b)
  const look = LOOKS[key]
  const rand = backdropRng(SEED[key] * 977 + 13)
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
  mesas(SEED[key] * 31 + 1, 150, 64, mix(look.far, INK, 0.2), look.farRim)
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
  mesas(SEED[key] * 53 + 7, 196, 36, mix(look.near, INK, 0.35), look.nearRim)
}

/**
 * The delivered far plate (/images/arcade/ghost-trail/plates/<plate>.webp) once it has loaded,
 * panned across the whole act; false until then (and always headless), so the procedural far
 * layer draws instead.
 */
function drawPlate(
  g: Ctx,
  key: StageKey,
  camX: number,
  length: number,
): boolean {
  const img = loadedImage(
    `/images/arcade/ghost-trail/plates/${LOOKS[key].plate}.webp`,
  )
  if (!img) return false
  const t = Math.max(0, Math.min(1, camX / camMaxFor(length)))
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
  kind?:
    | 'wheel'
    | 'mill'
    | 'bell'
    | 'fire'
    | 'lantern'
    | 'crow'
    | 'candles'
    | 'candelabra'
    | 'censer'
    | 'sigil'
  /** Which way a perched crow looks. */
  face?: 1 | -1
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

// --- Storm Crow Pass and the abbey beneath the bell ----------------------------------------------

/** Indigo canyon granite, lit by the storm. */
const GRANITE = ['#0c0c1e', '#1c2038', '#30365a', '#4c5680', '#8490ba'] as const
/** Weathered, rain-dark timber of the pass's bridges and lifts. */
const STORMWOOD = [
  '#120e14',
  '#2a2228',
  '#4a3c3a',
  '#6e5c50',
  '#a48c74',
] as const
/** The crypt's violet-black stone. */
const CRYPT = ['#0c0610', '#1c1022', '#30203a', '#4c3656', '#7c6080'] as const
const ROPE = '#a08a5c'
const ROPE_DARK = '#4e4030'
const VIOLET = '#c46cff'
const RITUAL = '#ff3a5c'
const CANDLE = '#ffae4a'

/** The HDMA sky bands (top to bottom through `stops`), FAR_W wide. */
function skyBands(b: Ctx, stops: readonly string[], h = H) {
  const bands = 40
  for (let i = 0; i < bands; i++) {
    const t = i / (bands - 1)
    const at = t * (stops.length - 1)
    const lo = Math.min(stops.length - 2, Math.floor(at))
    b.fillStyle = mix(stops[lo]!, stops[lo + 1]!, at - lo)
    b.fillRect(0, (i * h) / bands, FAR_W, h / bands + 0.5)
  }
}

/** A soft radial light baked into a layer. */
function bakedGlow(
  b: Ctx,
  x: number,
  y: number,
  r: number,
  colour: string,
  alpha: number,
  squash = 1,
) {
  b.save()
  b.translate(x, y)
  b.scale(1, squash)
  const grad = b.createRadialGradient(0, 0, 0, 0, 0, r)
  grad.addColorStop(0, rgba(colour, alpha))
  grad.addColorStop(0.5, rgba(colour, alpha * 0.35))
  grad.addColorStop(1, rgba(colour, 0))
  b.fillStyle = grad
  b.beginPath()
  b.arc(0, 0, r, 0, Math.PI * 2)
  b.fill()
  b.restore()
}

/**
 * A shelf of storm cloud across FAR_W: a flat-topped band whose underside hangs in scalloped
 * billows of uneven size, darker above, some billows' bellies caught in `rim` (the storm lights
 * them from below).
 */
function cloudShelf(
  b: Ctx,
  seed: number,
  y: number,
  thick: number,
  rMin: number,
  rMax: number,
  body: string,
  rim: string,
) {
  const rand = backdropRng(seed)
  const scallops: Array<[number, number, number]> = []
  for (let x = FAR_W + 20; x > -20;) {
    const r = rMin + Math.pow(rand(), 1.6) * (rMax - rMin)
    scallops.push([x - r, y + (rand() - 0.3) * thick * 0.5, r])
    x -= r * (0.9 + rand() * 0.9)
  }
  const top = y - thick
  const shape = () => {
    b.beginPath()
    b.moveTo(-20, top)
    b.lineTo(FAR_W + 20, top)
    for (const [cx, cy, r] of scallops)
      b.ellipse(cx, cy, r, r * 0.75, 0, -0.1, Math.PI + 0.1)
    b.closePath()
  }
  const grad = b.createLinearGradient(0, top, 0, y + rMax)
  grad.addColorStop(0, mix(body, INK, 0.35))
  grad.addColorStop(0.65, body)
  grad.addColorStop(1, mix(body, rim, 0.3))
  shape()
  b.fillStyle = grad
  b.fill()
  b.save()
  shape()
  b.clip()
  // Folds: smaller billows nested inside, each shadowed above and lit beneath.
  for (const [cx, cy, r] of scallops) {
    const k = rand()
    const fx = cx + (rand() - 0.5) * r
    const fy = cy - r * (0.5 + k * 0.5)
    const fr = r * (0.5 + rand() * 0.4)
    if (k < 0.45) continue
    b.strokeStyle = rgba(rim, 0.1 + k * 0.12)
    b.lineWidth = 0.5
    b.beginPath()
    b.ellipse(fx, fy, fr * 1.6, fr * 0.7, 0, Math.PI * 0.15, Math.PI * 0.85)
    b.stroke()
  }
  b.restore()
  for (const [cx, cy, r] of scallops) {
    if (rand() < 0.35) continue
    const a0 = Math.PI * (0.12 + rand() * 0.2)
    const a1 = Math.PI * (0.6 + rand() * 0.28)
    b.strokeStyle = rgba(rim, 0.3 + rand() * 0.3)
    b.lineWidth = 0.6
    b.beginPath()
    b.ellipse(cx, cy, r - 0.3, r * 0.75 - 0.3, 0, a0, a1)
    b.stroke()
  }
}

/**
 * Wind-torn scud: long lens-shaped streaks dragged downwind, a few overlapping per drift, dark
 * above and lit along their bellies.
 */
function cloudDrifts(
  b: Ctx,
  seed: number,
  y0: number,
  y1: number,
  count: number,
  body: string,
  rim: string,
) {
  const rand = backdropRng(seed)
  const lens = (
    x: number,
    y: number,
    len: number,
    up: number,
    down: number,
  ) => {
    b.beginPath()
    b.moveTo(x, y)
    b.bezierCurveTo(
      x + len * 0.25,
      y - up,
      x + len * 0.6,
      y - up * 0.8,
      x + len,
      y + 0.5,
    )
    b.bezierCurveTo(x + len * 0.65, y + down, x + len * 0.3, y + down, x, y)
    b.closePath()
  }
  for (let i = 0; i < count; i++) {
    const cx = rand() * FAR_W
    const cy = y0 + rand() * (y1 - y0)
    const parts: Array<[number, number, number, number, number]> = []
    const n = 2 + Math.floor(rand() * 3)
    for (let k = 0; k < n; k++)
      parts.push([
        cx + (rand() - 0.3) * 30 + k * 10,
        cy + (rand() - 0.5) * 5,
        30 + rand() * 60,
        3 + rand() * 6,
        1 + rand() * 2,
      ])
    for (const ox of [-FAR_W, 0, FAR_W]) {
      if (cx + ox + 120 < -10 || cx + ox - 10 > FAR_W + 10) continue
      for (const [px, py, len, up, down] of parts) {
        lens(px + ox, py + 0.9, len, up, down)
        b.fillStyle = rgba(rim, 0.55)
        b.fill()
        lens(px + ox, py, len, up, down)
        const grad = b.createLinearGradient(0, py - up, 0, py + down)
        grad.addColorStop(0, mix(body, INK, 0.3))
        grad.addColorStop(1, body)
        b.fillStyle = grad
        b.fill()
      }
    }
  }
}

/** A pine, wind-bent: stacked ragged tiers on a curving trunk, leaning by `lean` (px at the tip). */
function pine(
  b: Ctx,
  x: number,
  base: number,
  h: number,
  colour: string,
  lean: number,
  seed: number,
  rim?: string,
) {
  const rand = backdropRng(seed)
  const tiers = Math.max(3, Math.round(h / 7))
  const at = (t: number) => x + lean * t * t
  b.fillStyle = colour
  // Trunk.
  const tw = Math.max(0.6, h * 0.035)
  b.beginPath()
  b.moveTo(x - tw, base)
  b.quadraticCurveTo(at(0.5) - tw * 0.6, base - h * 0.5, at(1), base - h)
  b.quadraticCurveTo(at(0.5) + tw * 0.6, base - h * 0.5, x + tw, base)
  b.fill()
  const tierShape = (i: number, grow: number) => {
    const t0 = 0.18 + (i / tiers) * 0.8
    const cy = base - h * t0
    const half = h * 0.3 * (1 - t0 * 0.85) + grow
    const drop = h * 0.11
    const cx = at(t0)
    // Branches stream downwind: longer on the lee side.
    const lee = 1 + (lean > 0 ? 0.35 : lean < 0 ? -0.35 : 0)
    const wnd = 1 - (lean > 0 ? 0.35 : lean < 0 ? -0.35 : 0)
    b.beginPath()
    b.moveTo(cx, cy - drop * 1.1 - grow)
    b.lineTo(cx + half * lee, cy + drop * 0.6 + grow)
    // A ragged lower edge.
    const n = 4
    for (let k = n; k >= 0; k--) {
      const px = cx - half * wnd + ((half * (lee + wnd)) / n) * k
      b.lineTo(px, cy + drop * (k % 2 ? 0.2 : 0.55) + grow)
    }
    b.lineTo(cx - half * wnd, cy + drop * 0.5 + grow)
    b.closePath()
  }
  for (let i = 0; i < tiers; i++) {
    tierShape(i, rand() * 0.6)
    b.fill()
  }
  if (rim) {
    // Lightning-lit needles on the windward (left) edges.
    b.save()
    b.globalCompositeOperation = 'source-atop'
    b.fillStyle = rim
    for (let i = 0; i < tiers; i++) {
      const t0 = 0.18 + (i / tiers) * 0.8
      const cy = base - h * t0
      const half = h * 0.3 * (1 - t0 * 0.85)
      b.fillRect(at(t0) - half, cy - h * 0.06, half * 0.7, 0.5)
    }
    b.restore()
  }
}

/** A crow perched at (x, y) (its feet), `s` about 1 for a 6 px bird, facing `face`. */
function perchedCrow(
  b: Ctx,
  x: number,
  y: number,
  s: number,
  colour: string,
  face: 1 | -1,
  eye?: string,
) {
  b.save()
  b.translate(x, y)
  b.scale(face * s, s)
  b.fillStyle = colour
  b.beginPath()
  // Tail, body, hunched shoulders, head and beak.
  b.moveTo(-4.6, -0.6)
  b.lineTo(-2.4, -2.4)
  b.quadraticCurveTo(-1.6, -4.6, 0.8, -4.4)
  b.quadraticCurveTo(1.6, -5.8, 2.6, -5.4)
  b.lineTo(4.4, -4.9)
  b.lineTo(2.9, -4.3)
  b.quadraticCurveTo(2.6, -2.2, 1, -1.2)
  b.lineTo(-2, -0.8)
  b.closePath()
  b.fill()
  b.fillRect(-0.3, -1.2, 0.5, 1.2)
  b.fillRect(0.6, -1.2, 0.5, 1.2)
  if (eye) {
    b.fillStyle = eye
    b.fillRect(2.1, -5.3, 0.6, 0.5)
  }
  b.restore()
}

/** A rope bridge from (x1, y1) to (x2, y2): plank deck on a sagging rope, a hand rope above. */
function ropeBridge(
  b: Ctx,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  sag: number,
  f: string,
  rim: string | null,
  plankEvery = 2.2,
) {
  const at = (t: number, s: number, lift: number) => [
    x1 + (x2 - x1) * t,
    y1 + (y2 - y1) * t + Math.sin(t * Math.PI) * s - lift,
  ]
  const rope = (s: number, lift: number, w: number, colour: string) => {
    b.strokeStyle = colour
    b.lineWidth = w
    b.beginPath()
    for (let i = 0; i <= 24; i++) {
      const [px, py] = at(i / 24, s, lift)
      if (i) b.lineTo(px!, py!)
      else b.moveTo(px!, py!)
    }
    b.stroke()
  }
  const span = Math.hypot(x2 - x1, y2 - y1)
  rope(sag, 0, 0.6, f)
  rope(sag * 0.7, 5, 0.35, f)
  b.fillStyle = f
  const n = Math.max(2, Math.floor(span / plankEvery))
  for (let i = 1; i < n; i++) {
    const t = i / n
    const [px, py] = at(t, sag, 0)
    b.fillRect(px! - 0.5, py! - 0.2, 1.1, 1.3)
    if (i % 3 === 0) {
      const hy = at(t, sag * 0.7, 5)[1]!
      b.fillRect(px! - 0.15, hy, 0.3, py! - hy)
    }
  }
  if (rim) rope(sag, 0.4, 0.25, rim)
}

/** The storm's far layer: thunderheads, a veiled moon, the canyon, the Crow Rock, a far bridge. */
function paintFarStorm(b: Ctx) {
  const look = LOOKS.stormpass
  const rand = backdropRng(9071)
  skyBands(b, look.sky)
  // The moon veiled in cloud: only its halo shows through.
  bakedGlow(b, look.moon.x, look.moon.y, 70, '#9ca6e6', 0.22)
  bakedGlow(b, look.moon.x, look.moon.y, 18, look.moon.color, 0.35)
  // A bright rent in the clouds over the pass, where the lightning lives.
  bakedGlow(b, 196, 92, 120, '#8e7ae0', 0.28, 0.45)
  bakedGlow(b, 196, 96, 54, '#c8b8ff', 0.22, 0.5)
  // Sparse stars in the rent.
  for (let i = 0; i < 18; i++) {
    b.fillStyle = rgba('#e8e4ff', 0.25 + rand() * 0.4)
    b.fillRect(130 + rand() * 140, 70 + rand() * 30, 0.5, 0.5)
  }
  // Thunderheads: a heavy ceiling, a lit middle deck, ragged scud below.
  cloudShelf(b, 31, 16, 30, 5, 16, '#080a1e', '#34387a')
  cloudShelf(b, 37, 34, 16, 4, 13, '#0e1230', '#4c4e9c')
  cloudDrifts(b, 43, 50, 66, 7, '#151a40', '#6866b6')
  cloudDrifts(b, 53, 64, 82, 6, '#1c2250', '#8a84d0')
  // Wind-torn scud streaks.
  for (let i = 0; i < 26; i++) {
    const sx = rand() * FAR_W
    const sy = 70 + rand() * 50
    const sw = 14 + rand() * 40
    b.fillStyle = rgba(i % 3 ? '#2a3068' : '#5c5ca8', 0.35 + rand() * 0.3)
    b.fillRect(sx, sy, sw, 0.6 + rand() * 0.8)
    b.fillRect(sx + sw * 0.6, sy - 0.8, sw * 0.5, 0.5)
  }
  // Rain veils hanging from the deck.
  b.strokeStyle = rgba('#8e96d8', 0.08)
  b.lineWidth = 0.5
  for (let i = 0; i < 70; i++) {
    const rx = rand() * FAR_W
    const ry = 40 + rand() * 40
    b.beginPath()
    b.moveTo(rx, ry)
    b.lineTo(rx + 8, ry + 60 + rand() * 40)
    b.stroke()
  }
  // Far peaks: jagged, their snow catching the storm light.
  const peaks = (
    seed: number,
    base: number,
    hi: number,
    step: number,
    fill: string,
    snow: string,
  ) => {
    const r = backdropRng(seed)
    const pts: Array<[number, number]> = []
    for (let x = -step; x <= FAR_W + step; x += step * (0.6 + r() * 0.8))
      pts.push([x, base - hi * (0.25 + r() * 0.75)])
    b.fillStyle = fill
    b.beginPath()
    b.moveTo(-step, H)
    for (const [x, y] of pts) b.lineTo(x, y)
    b.lineTo(FAR_W + step, H)
    b.closePath()
    b.fill()
    b.fillStyle = rgba(snow, 0.55)
    for (let i = 0; i < pts.length - 1; i++) {
      const ay = pts[i]![1]
      const by = pts[i + 1]![1]
      const [lo, hiPt] =
        ay < by ? [pts[i + 1]!, pts[i]!] : [pts[i]!, pts[i + 1]!]
      if (Math.abs(ay - by) < 2) continue
      // The windward face of each peak, dusted.
      b.beginPath()
      b.moveTo(hiPt[0], hiPt[1])
      b.lineTo(
        hiPt[0] + (lo[0] - hiPt[0]) * 0.35,
        hiPt[1] + (lo[1] - hiPt[1]) * 0.35,
      )
      b.lineTo(
        hiPt[0] + (lo[0] - hiPt[0]) * 0.18,
        hiPt[1] + (lo[1] - hiPt[1]) * 0.45,
      )
      b.closePath()
      b.fill()
    }
  }
  peaks(61, 150, 56, 22, '#262c5c', '#9ca0e0')
  // A haze between the ranges.
  const haze1 = b.createLinearGradient(0, 110, 0, 160)
  haze1.addColorStop(0, rgba(look.mist, 0))
  haze1.addColorStop(1, rgba(look.mist, 0.3))
  b.fillStyle = haze1
  b.fillRect(0, 110, FAR_W, 50)
  // The canyon: sheer walls either side of a deep V, three ranks, each nearer and darker.
  const wall = (
    seed: number,
    left: boolean,
    x0: number,
    x1: number,
    top: number,
    fill: string,
    rim: string,
  ) => {
    const r = backdropRng(seed)
    // Rim line along the top, stepping, then the sheer face toward the canyon.
    const pts: Array<[number, number]> = []
    let x = x0
    let y = top
    while (x < x1) {
      pts.push([x, y])
      x += 6 + r() * 14
      y = top + (r() - 0.5) * 10
    }
    pts.push([x1, y])
    const faceX = left ? x1 : x0
    b.fillStyle = fill
    b.beginPath()
    b.moveTo(x0, H)
    for (const [px, py] of pts) b.lineTo(px, py)
    // The sheer face falls in ledges toward the gorge.
    let fy = y
    let fx = faceX
    while (fy < H) {
      fy += 8 + r() * 12
      fx += (left ? -1 : 1) * (1 + r() * 4)
      b.lineTo(fx + (left ? 0 : 0), fy)
    }
    b.lineTo(left ? x0 : x1, H)
    b.closePath()
    b.fill()
    // Columnar jointing: each column lit on its left face, shadowed in its cleft; strata across;
    // the depths fading into the gorge's dark; a moonlit rim along the top.
    b.save()
    b.clip()
    for (let gx = x0; gx < x1 + 8;) {
      const cw = 4 + r() * 9
      const ch = 20 + r() * 70
      const cy0 = top - 2 + r() * 6
      b.fillStyle = rgba(rim, 0.1 + r() * 0.16)
      b.fillRect(gx, cy0, cw * 0.4, ch)
      b.fillStyle = rgba(INK, 0.3 + r() * 0.2)
      b.fillRect(gx + cw - 0.8, cy0 + 2, 0.8, ch + 10)
      gx += cw
    }
    b.fillStyle = rgba(INK, 0.2)
    for (let sy = top + 8; sy < H; sy += 5 + r() * 6)
      b.fillRect(x0, sy, x1 - x0, 0.6)
    const deep = b.createLinearGradient(0, top + 20, 0, H)
    deep.addColorStop(0, rgba(INK, 0))
    deep.addColorStop(1, rgba(INK, 0.45))
    b.fillStyle = deep
    b.fillRect(x0 - 10, top, x1 - x0 + 20, H - top)
    b.fillStyle = rgba(rim, 0.85)
    for (let i = 0; i < pts.length - 1; i++)
      b.fillRect(pts[i]![0], pts[i]![1], pts[i + 1]![0] - pts[i]![0], 0.7)
    b.restore()
    // Pines along the rim.
    for (let i = 0; i < pts.length - 1; i++) {
      if (r() < 0.35) continue
      const px = pts[i]![0] + r() * 6
      pine(b, px, pts[i]![1] + 0.5, 5 + r() * 6, fill, 1.2, seed + i)
    }
  }
  wall(71, true, -10, 150, 104, '#1e244c', '#5c64a8')
  wall(73, false, 246, 410, 98, '#1e244c', '#5c64a8')
  // The far rope bridge across the gorge, two lanterns on it.
  ropeBridge(b, 146, 112, 252, 108, 9, '#141838', '#6a70b0', 2.4)
  for (const lx of [176, 222]) {
    b.fillStyle = rgba(CANDLE, 0.9)
    b.fillRect(lx, 116.5, 1, 1.2)
    bakedGlow(b, lx + 0.5, 117, 5, CANDLE, 0.35)
  }
  // The Crow Rock: a crag the wind has carved into a great hunched crow, its eye a shrine
  // lamp, windows lit in the cliff beneath it.
  const cx = 58
  const cy = 98
  b.fillStyle = '#171b40'
  b.beginPath()
  b.moveTo(cx - 34, H)
  b.lineTo(cx - 30, cy + 6)
  b.lineTo(cx - 22, cy)
  b.lineTo(cx + 24, cy - 2)
  b.lineTo(cx + 30, cy + 8)
  b.lineTo(cx + 34, H)
  b.fill()
  perchedCrow(b, cx + 2, cy + 1, 7.5, '#171b40', 1)
  // Moonlit edges along its back, beak and the crag.
  b.save()
  b.globalCompositeOperation = 'source-atop'
  b.fillStyle = rgba('#6c74bc', 0.55)
  b.save()
  b.translate(cx + 2, cy + 1)
  b.scale(7.5, 7.5)
  b.beginPath()
  b.moveTo(-4.6, -0.6)
  b.lineTo(-2.4, -2.4)
  b.quadraticCurveTo(-1.6, -4.6, 0.8, -4.4)
  b.quadraticCurveTo(1.6, -5.8, 2.6, -5.4)
  b.lineTo(4.4, -4.9)
  b.lineTo(2.6, -5.0)
  b.quadraticCurveTo(1.6, -5.4, 0.8, -4.1)
  b.quadraticCurveTo(-1.4, -4.2, -2.2, -2.1)
  b.lineTo(-4.4, -0.4)
  b.closePath()
  b.fill()
  b.restore()
  b.fillRect(cx - 30, cy, 1, 30)
  b.fillStyle = rgba(INK, 0.3)
  for (let sy = cy + 6; sy < 150; sy += 5) b.fillRect(cx - 34, sy, 68, 0.6)
  b.restore()
  b.fillStyle = '#ffd27a'
  b.fillRect(cx + 2 + 2.1 * 7.5, cy + 1 - 5.3 * 7.5, 1.4, 1.2)
  bakedGlow(b, cx + 2 + 2.4 * 7.5, cy + 1 - 4.8 * 7.5, 5, '#ffb347', 0.6)
  for (const [wx, wy] of [
    [cx - 12, cy + 10],
    [cx - 2, cy + 8],
    [cx + 8, cy + 12],
    [cx + 16, cy + 9],
  ] as const) {
    b.fillStyle = rgba(look.window, 0.95)
    b.fillRect(wx, wy, 1.4, 2.2)
    bakedGlow(b, wx + 0.7, wy + 1, 6, look.window, 0.3)
  }
  // Nearer canyon walls, darker, closing the gorge.
  wall(79, true, -10, 112, 132, '#141a3a', '#48508e')
  wall(83, false, 290, 410, 128, '#141a3a', '#48508e')
  // Mist boiling up out of the gorge.
  const gorge = b.createLinearGradient(0, 140, 0, 200)
  gorge.addColorStop(0, rgba(look.mist, 0))
  gorge.addColorStop(1, rgba(look.mist, 0.42))
  b.fillStyle = gorge
  b.fillRect(0, 140, FAR_W, 60)
  for (let i = 0; i < 12; i++)
    bakedGlow(
      b,
      100 + rand() * 200,
      160 + rand() * 30,
      20 + rand() * 20,
      look.mist,
      0.18,
      0.4,
    )
  // The nearest ridge with its storm-bent pines.
  const rr = backdropRng(97)
  b.fillStyle = '#0c1028'
  b.beginPath()
  b.moveTo(0, H)
  for (let x = 0; x <= FAR_W; x += 10)
    b.lineTo(x, 192 - Math.sin(x / 37) * 6 - rr() * 3)
  b.lineTo(FAR_W, H)
  b.fill()
  for (let i = 0; i < 26; i++) {
    const px = rr() * FAR_W
    pine(
      b,
      px,
      194 - Math.sin(px / 37) * 6,
      10 + rr() * 16,
      '#0c1028',
      2 + rr() * 2,
      400 + i,
    )
  }
}

/** A pointed (gothic) arch opening, its springing at y, `w` wide, `rise` tall above that. */
function gothicArch(
  b: Ctx,
  x: number,
  y: number,
  w: number,
  rise: number,
  h: number,
) {
  b.moveTo(x, y + h)
  b.lineTo(x, y)
  b.quadraticCurveTo(x, y - rise * 0.75, x + w / 2, y - rise)
  b.quadraticCurveTo(x + w, y - rise * 0.75, x + w, y)
  b.lineTo(x + w, y + h)
  b.closePath()
}

/** A skull, about 3 px wide, at (x, y) (its crown's centre). */
function skull(
  b: Ctx,
  x: number,
  y: number,
  s: number,
  bone: string,
  ink = INK,
) {
  b.fillStyle = bone
  b.beginPath()
  b.arc(x, y + 1.2 * s, 1.5 * s, Math.PI, 0)
  b.lineTo(x + 1.2 * s, y + 2.6 * s)
  b.lineTo(x - 1.2 * s, y + 2.6 * s)
  b.closePath()
  b.fill()
  b.fillStyle = ink
  b.fillRect(x - 1 * s, y + 1.2 * s, 0.75 * s, 0.75 * s)
  b.fillRect(x + 0.25 * s, y + 1.2 * s, 0.75 * s, 0.75 * s)
  b.fillRect(x - 0.15 * s, y + 2.05 * s, 0.3 * s, 0.4 * s)
}

/** A great bronze bell (crown at (cx, top), `s` wide), shaded in the round with waist rings. */
function bigBell(b: Ctx, cx: number, top: number, s: number) {
  const h = s * 1.05
  const shape = () => {
    b.beginPath()
    b.moveTo(cx - s * 0.18, top + s * 0.08)
    b.quadraticCurveTo(
      cx - s * 0.36,
      top + h * 0.2,
      cx - s * 0.36,
      top + h * 0.6,
    )
    b.quadraticCurveTo(cx - s * 0.4, top + h * 0.85, cx - s * 0.52, top + h)
    b.lineTo(cx + s * 0.52, top + h)
    b.quadraticCurveTo(
      cx + s * 0.4,
      top + h * 0.85,
      cx + s * 0.36,
      top + h * 0.6,
    )
    b.quadraticCurveTo(
      cx + s * 0.36,
      top + h * 0.2,
      cx + s * 0.18,
      top + s * 0.08,
    )
    b.closePath()
  }
  const body = b.createLinearGradient(cx - s * 0.5, 0, cx + s * 0.5, 0)
  body.addColorStop(0, '#3a2418')
  body.addColorStop(0.2, '#8a6038')
  body.addColorStop(0.38, '#5a3a26')
  body.addColorStop(0.72, '#2e1a1a')
  body.addColorStop(1, '#140a10')
  shape()
  b.fillStyle = body
  b.fill()
  b.save()
  shape()
  b.clip()
  const shade = b.createLinearGradient(0, top, 0, top + h)
  shade.addColorStop(0, rgba(INK, 0.45))
  shade.addColorStop(0.5, rgba(INK, 0))
  b.fillStyle = shade
  b.fillRect(cx - s, top, s * 2, h)
  const hi = b.createLinearGradient(cx - s * 0.32, 0, cx - s * 0.14, 0)
  hi.addColorStop(0, rgba('#e8c08a', 0))
  hi.addColorStop(0.5, rgba('#e8c08a', 0.35))
  hi.addColorStop(1, rgba('#e8c08a', 0))
  b.fillStyle = hi
  b.fillRect(cx - s * 0.32, top + h * 0.12, s * 0.18, h * 0.8)
  for (const [ry, rw] of [
    [0.2, 1],
    [0.58, 1.4],
    [0.86, 1.8],
  ] as const) {
    b.fillStyle = rgba(INK, 0.6)
    b.fillRect(cx - s, top + h * ry, s * 2, rw)
    b.fillStyle = rgba('#c8946a', 0.35)
    b.fillRect(cx - s, top + h * ry + rw, s * 2, 0.5)
  }
  b.restore()
  shape()
  b.strokeStyle = INK
  b.lineWidth = 0.6
  b.stroke()
  // The crown's loops.
  b.fillStyle = '#2e1a1a'
  b.fillRect(cx - s * 0.1, top - s * 0.06, s * 0.2, s * 0.15)
  b.strokeStyle = '#4a2e24'
  b.lineWidth = 1.2
  b.beginPath()
  b.arc(cx, top - s * 0.06, s * 0.08, Math.PI, 0)
  b.stroke()
}

/** The abbey's far layer: vaults receding in violet haze, ossuary walls, the giant bell. */
function paintFarAbbey(b: Ctx) {
  const look = LOOKS.abbey
  const rand = backdropRng(23017)
  skyBands(b, look.sky)
  // Candle and ritual light pooling low and far: crimson at the heart, violet haze around.
  bakedGlow(b, 210, 200, 190, '#6a1a4a', 0.5, 0.55)
  bakedGlow(b, 210, 196, 90, RITUAL, 0.22, 0.5)
  bakedGlow(b, 210, 110, 150, '#4a2a7a', 0.3, 0.8)
  // The farthest rank of the vault: ribbed arches in haze.
  const rank = (
    span: number,
    pier: number,
    spring: number,
    rise: number,
    fill: string,
    rim: string,
    off: number,
  ) => {
    b.fillStyle = fill
    b.beginPath()
    b.rect(0, 0, FAR_W, H)
    for (let x = off - span; x < FAR_W + span; x += span)
      gothicArch(b, x + pier / 2, spring, span - pier, rise, H)
    b.fill('evenodd')
    // Ribs from each pier up into the dark, and a rim on each arch's left flank.
    b.strokeStyle = rgba(rim, 0.6)
    b.lineWidth = 0.6
    for (let x = off - span; x < FAR_W + span; x += span) {
      const px = x + pier / 2
      b.beginPath()
      b.moveTo(px, spring)
      b.quadraticCurveTo(
        px,
        spring - rise * 0.75,
        px + (span - pier) / 2,
        spring - rise,
      )
      b.stroke()
      b.fillStyle = rgba(rim, 0.35)
      b.fillRect(px - pier, spring, 0.6, H - spring)
      // Capitals.
      b.fillStyle = fill
      b.fillRect(px - pier - 1.5, spring - 1, pier + 3, 2.5)
      b.fillStyle = rgba(rim, 0.6)
      b.fillRect(px - pier - 1.5, spring - 1, pier + 3, 0.5)
      // The vault's diagonal ribs, springing from the capital to bosses overhead.
      const pc = px - pier / 2
      b.strokeStyle = rgba(rim, 0.32)
      b.lineWidth = 0.8
      for (const side of [-1, 1]) {
        b.beginPath()
        b.moveTo(pc, spring - 1)
        b.quadraticCurveTo(pc, spring - rise * 1.6, pc + (side * span) / 2, 30)
        b.stroke()
      }
      b.fillStyle = rgba(rim, 0.5)
      b.beginPath()
      b.arc(pc + span / 2, 30, 1.6, 0, Math.PI * 2)
      b.fill()
    }
  }
  rank(44, 6, 96, 34, '#26143a', '#7a4a9a', 18)
  // Haze over the far rank.
  const h1 = b.createLinearGradient(0, 40, 0, H)
  h1.addColorStop(0, rgba('#3a1e52', 0.35))
  h1.addColorStop(1, rgba('#5a2a5e', 0.4))
  b.fillStyle = h1
  b.fillRect(0, 0, FAR_W, H)
  // The nearer rank: wider arches whose piers are ossuaries, niches full of skulls; above its
  // moulding the vault stays open to the ranks beyond.
  const span = 92
  const pier = 18
  const spring = 118
  b.fillStyle = '#170c22'
  b.beginPath()
  b.rect(0, 50, FAR_W, H - 50)
  for (let x = -40; x < FAR_W + span; x += span)
    gothicArch(b, x + pier / 2, spring, span - pier, 50, H)
  b.fill('evenodd')
  b.fillStyle = '#1e1028'
  b.fillRect(0, 47, FAR_W, 4)
  b.fillStyle = rgba('#a06aa0', 0.5)
  b.fillRect(0, 47, FAR_W, 0.6)
  for (let x = 0; x < FAR_W; x += 5) {
    b.fillStyle = '#1e1028'
    b.beginPath()
    b.arc(x + 2.5, 47, 1.6, Math.PI, 0)
    b.fill()
  }
  // The giant bell hangs in the nave, old bronze lit from below by the ritual fires, cracked.
  const bx = 214
  const top = 14
  const s = 56
  bakedGlow(b, bx, top + s * 0.55, 70, '#7a2a6a', 0.35, 0.9)
  for (const dx of [-6, 6]) {
    b.strokeStyle = '#120a16'
    b.lineWidth = 1.6
    b.beginPath()
    b.moveTo(bx + dx * 3, 0)
    b.lineTo(bx + dx * 0.6, top + 2)
    b.stroke()
  }
  bigBell(b, bx, top, s)
  b.save()
  b.beginPath()
  b.moveTo(bx - s * 0.52, top + s * 1.05)
  b.lineTo(bx + s * 0.52, top + s * 1.05)
  b.lineTo(bx + s * 0.4, top + s * 0.62)
  b.lineTo(bx - s * 0.4, top + s * 0.62)
  b.closePath()
  b.clip()
  const lip = b.createLinearGradient(0, top + s * 0.62, 0, top + s * 1.06)
  lip.addColorStop(0, rgba(RITUAL, 0))
  lip.addColorStop(1, rgba(RITUAL, 0.6))
  b.fillStyle = lip
  b.fillRect(bx - s, top + s * 0.6, s * 2, s * 0.5)
  b.restore()
  // Its crack, a band of worn lettering, and a rim of violet light down its shoulder.
  b.strokeStyle = '#050208'
  b.lineWidth = 1.1
  b.beginPath()
  b.moveTo(bx + 6, top + 14)
  b.lineTo(bx + 2, top + 24)
  b.lineTo(bx + 8, top + 31)
  b.lineTo(bx + 4, top + 44)
  b.stroke()
  b.strokeStyle = rgba('#ff8a6a', 0.5)
  b.lineWidth = 0.4
  b.beginPath()
  b.moveTo(bx + 6.8, top + 14)
  b.lineTo(bx + 2.8, top + 24)
  b.stroke()
  b.fillStyle = rgba('#7a5234', 0.9)
  b.fillRect(bx - 20, top + 16, 40, 1.4)
  b.fillStyle = rgba('#d0a070', 0.5)
  for (let i = 0; i < 14; i++)
    b.fillRect(bx - 17 + i * 2.5, top + 16.3, 1.2, 0.8)
  b.strokeStyle = rgba('#c890ff', 0.4)
  b.lineWidth = 0.6
  b.beginPath()
  b.moveTo(bx + s * 0.18, top + s * 0.1)
  b.quadraticCurveTo(bx + s * 0.36, top + s * 0.2, bx + s * 0.36, top + s * 0.6)
  b.stroke()
  bakedGlow(b, bx, top + s * 1.1, 44, RITUAL, 0.3, 0.4)
  // Haze between us and the bell keeps it far away.
  b.fillStyle = rgba('#3a1e52', 0.22)
  b.fillRect(bx - s * 0.6, 0, s * 1.2, top + s * 1.1)
  for (let x = -40; x < FAR_W + span; x += span) {
    const px = x - pier / 2
    // Rim light on each pier's lit side, a capital, a hanging chain.
    b.fillStyle = rgba('#8a4a8a', 0.5)
    b.fillRect(px, spring, 0.7, H - spring)
    b.fillStyle = '#1e1028'
    b.fillRect(px - 2, spring - 2, pier + 4, 3)
    b.fillStyle = rgba('#a06aa0', 0.55)
    b.fillRect(px - 2, spring - 2, pier + 4, 0.6)
    // Ossuary niches up the pier: rows of small arched holes, a skull in each.
    for (let ny = spring + 8; ny < 196; ny += 9)
      for (let nx = px + 2.5; nx < px + pier - 4; nx += 5) {
        b.fillStyle = '#06030a'
        b.beginPath()
        b.arc(nx + 1.75, ny + 1.5, 1.75, Math.PI, 0)
        b.rect(nx, ny + 1.5, 3.5, 4)
        b.fill()
        if (rand() < 0.85)
          skull(b, nx + 1.75, ny + 1.6, 0.85, rgba('#b8a088', 0.55))
      }
    // A chain from the vault, and a candle shelf with its glow.
    if (Math.abs(px + pier / 2 - bx) > s * 0.7)
      dropChainRaw(b, px + pier / 2, 50, spring - 6, '#0a0610', '#3a2a40')
    b.fillStyle = '#2a1830'
    b.fillRect(px + 1, 194, pier - 2, 2)
    for (let k = 0; k < 3; k++) {
      const cx = px + 4 + k * 5
      b.fillStyle = '#d8c8b0'
      b.fillRect(cx, 190 - (k % 2) * 1.5, 1, 4 + (k % 2) * 1.5)
      b.fillStyle = '#ffe2a0'
      b.fillRect(cx + 0.2, 189 - (k % 2) * 1.5, 0.6, 1)
    }
    bakedGlow(b, px + pier / 2, 190, 16, CANDLE, 0.35)
  }
  // Sigils smouldering on the far floor: violet rings.
  for (const [sx, sy, sr] of [
    [120, 206, 16],
    [320, 210, 18],
  ] as const) {
    b.save()
    b.translate(sx, sy)
    b.scale(1, 0.3)
    b.strokeStyle = rgba(VIOLET, 0.45)
    b.lineWidth = 1.2
    b.beginPath()
    b.arc(0, 0, sr, 0, Math.PI * 2)
    b.stroke()
    b.lineWidth = 0.6
    b.beginPath()
    for (let i = 0; i <= 5; i++) {
      const a = -Math.PI / 2 + (i * 4 * Math.PI) / 5
      const px = Math.cos(a) * sr * 0.9
      const py = Math.sin(a) * sr * 0.9
      if (i) b.lineTo(px, py)
      else b.moveTo(px, py)
    }
    b.stroke()
    b.restore()
    bakedGlow(b, sx, sy, sr * 1.4, VIOLET, 0.2, 0.35)
  }
  // Incense haze in bands.
  for (let i = 0; i < 8; i++)
    bakedGlow(
      b,
      rand() * FAR_W,
      150 + rand() * 50,
      40 + rand() * 30,
      look.mist,
      0.14,
      0.25,
    )
  // A low dark floor line far off.
  const floor = b.createLinearGradient(0, 196, 0, H)
  floor.addColorStop(0, rgba('#0a040e', 0))
  floor.addColorStop(1, rgba('#0a040e', 0.85))
  b.fillStyle = floor
  b.fillRect(0, 196, FAR_W, H - 196)
}

/** A hanging chain with explicit colours (for the baked far layers). */
function dropChainRaw(
  b: Ctx,
  x: number,
  y1: number,
  y2: number,
  dark: string,
  lit: string,
) {
  for (let y = y1, i = 0; y < y2; y += 1.5, i++) {
    b.strokeStyle = dark
    b.lineWidth = 0.8
    b.beginPath()
    if (i % 2) b.ellipse(x, y, 0.45, 0.85, 0, 0, Math.PI * 2)
    else b.ellipse(x, y, 0.85, 0.45, 0, 0, Math.PI * 2)
    b.stroke()
    b.strokeStyle = lit
    b.lineWidth = 0.3
    b.stroke()
  }
}

/** Storm Crow Pass's dead snag: a fixed shape, so its crows (drawn live) know their perches. */
function snag(
  b: Ctx,
  x: number,
  gl: number,
  h: number,
  f: string,
  rim: string,
) {
  b.fillStyle = f
  b.beginPath()
  b.moveTo(x - 3, gl)
  b.quadraticCurveTo(x - 1, gl - h * 0.5, x + 1, gl - h)
  b.lineTo(x + 3, gl - h + 2)
  b.quadraticCurveTo(x + 2, gl - h * 0.5, x + 4, gl)
  b.closePath()
  b.fill()
  b.strokeStyle = f
  b.lineCap = 'round'
  for (const [x0, y0, x1, y1, w] of [
    [x, gl - h * 0.6, x - 14, gl - h * 0.74, 1.4],
    [x + 2, gl - h * 0.82, x + 16, gl - h * 0.9, 1.2],
    [x - 8, gl - h * 0.7, x - 11, gl - h * 0.82, 0.6],
    [x + 10, gl - h * 0.87, x + 12, gl - h * 0.97, 0.6],
  ] as const) {
    b.lineWidth = w
    b.beginPath()
    b.moveTo(x0, y0)
    b.lineTo(x1, y1)
    b.stroke()
  }
  b.lineCap = 'butt'
  rimLeft(b, x - 2, gl - h * 0.9, h * 0.9, rgba(rim, 0.7))
}
/** Where the snag's crows sit (relative to its foot), for a snag `h` tall. */
function snagPerches(
  x: number,
  gl: number,
  h: number,
): Array<[number, number]> {
  return [
    [x - 10, gl - h * 0.725],
    [x + 12, gl - h * 0.885],
    [x + 1.5, gl - h + 0.5],
  ]
}

/** A wind-scoured butte with a flat cap, gullied face, lit left edge and pines on top. */
function butte(
  b: Ctx,
  x: number,
  w: number,
  gl: number,
  h: number,
  f: string,
  rim: string,
  seed: number,
) {
  const rand = backdropRng(seed)
  const top = gl - h
  b.fillStyle = f
  b.beginPath()
  b.moveTo(x - 6, gl)
  b.lineTo(x - 2, gl - h * 0.4)
  b.lineTo(x + 2, top + 4)
  b.lineTo(x + 4, top)
  b.lineTo(x + w - 5, top + rand() * 2)
  b.lineTo(x + w - 2, top + 5)
  b.lineTo(x + w + 2, gl - h * 0.45)
  b.lineTo(x + w + 7, gl)
  b.closePath()
  b.fill()
  b.save()
  b.clip()
  b.fillStyle = rgba(rim, 0.5)
  b.beginPath()
  b.moveTo(x - 6, gl)
  b.lineTo(x - 2, gl - h * 0.4)
  b.lineTo(x + 2, top + 4)
  b.lineTo(x + 4, top)
  b.lineTo(x + 8, top)
  b.lineTo(x + 3, gl)
  b.fill()
  b.fillStyle = rgba(rim, 0.85)
  b.fillRect(x + 4, top, w - 9, 0.7)
  b.fillStyle = rgba(rim, 0.16)
  for (let gx = x + 6; gx < x + w; gx += 3 + rand() * 5)
    b.fillRect(gx, top + 2 + rand() * 4, 0.6, h * (0.3 + rand() * 0.6))
  b.fillStyle = rgba(INK, 0.3)
  for (let sy = top + 6; sy < gl; sy += 5 + rand() * 5)
    b.fillRect(x - 6, sy, w + 14, 0.6)
  b.restore()
  for (let px = x + 6; px < x + w - 4; px += 6 + rand() * 10)
    pine(b, px, top + 0.5, 7 + rand() * 9, f, 1.6, seed * 3 + px)
}

const STORM_SNAG_X = 150
const STORM_SNAG_H = 52
const STORM_BRIDGE = { x1: 112, y1: GL_A - 58, x2: 302, y2: GL_A - 70, sag: 16 }

function paintMidStormA(b: Ctx) {
  const look = LOOKS.stormpass
  const f = look.midA
  const rim = look.midARim
  const gl = GL_A
  const rand = backdropRng(1701)
  b.fillStyle = f
  b.fillRect(0, gl, MID_W, MID_A_H - gl)
  // A rolling foothill so nothing floats.
  b.beginPath()
  b.moveTo(0, gl + 1)
  for (let x = 0; x <= MID_W; x += 12)
    b.lineTo(x, gl - 4 - Math.sin((x / MID_W) * Math.PI * 6) * 3)
  b.lineTo(MID_W, gl + 1)
  b.fill()
  butte(b, 30, 82, gl, 58, f, rim, 11)
  butte(b, 296, 30, gl, 70, f, rim, 13)
  butte(b, 336, 22, gl, 54, f, rim, 17)
  butte(b, 506, 92, gl, 46, f, rim, 19)
  // The rope bridge between the first butte and the spire.
  const br = STORM_BRIDGE
  ropeBridge(b, br.x1, br.y1, br.x2, br.y2, br.sag, f, rgba(rim, 0.7))
  // A cave mouth in the far butte, a lamp burning inside.
  b.fillStyle = rgba(INK, 0.9)
  b.beginPath()
  b.arc(552, gl - 10, 9, Math.PI, 0)
  b.rect(543, gl - 10, 18, 10)
  b.fill()
  b.fillStyle = rgba(look.window, 0.35)
  b.beginPath()
  b.arc(552, gl - 6, 5, Math.PI, 0)
  b.rect(547, gl - 6, 10, 6)
  b.fill()
  // A rope lift strung up the spire's face.
  b.strokeStyle = rgba(rim, 0.5)
  b.lineWidth = 0.35
  b.beginPath()
  b.moveTo(318, gl - 70)
  b.lineTo(330, gl)
  b.moveTo(321, gl - 70)
  b.lineTo(333, gl)
  b.stroke()
  b.fillStyle = f
  b.fillRect(322, gl - 38, 8, 4)
  // Wind-bent pines along the foothills, all streaming the same way.
  for (let i = 0; i < 22; i++) {
    const px = rand() * MID_W
    if (px > 290 && px < 360) continue
    pine(
      b,
      px,
      gl - 3,
      14 + rand() * 22,
      f,
      3 + rand() * 3,
      900 + i,
      rgba(rim, 0.6),
    )
  }
  finishStrip(b, MID_A_H, mix(look.mist, look.midA, 0.55), look.fog * 0.45)
}

function paintMidStormB(b: Ctx) {
  const look = LOOKS.stormpass
  const f = look.midB
  const rim = look.midBRim
  const gl = GL_B
  const rand = backdropRng(1709)
  // Rock shelves and boulders.
  for (const [rx, rw, rh] of [
    [190, 30, 12],
    [216, 18, 8],
    [500, 40, 16],
    [612, 26, 10],
  ] as const) {
    b.fillStyle = f
    b.beginPath()
    b.moveTo(rx, gl)
    b.quadraticCurveTo(rx + 2, gl - rh, rx + rw * 0.4, gl - rh)
    b.quadraticCurveTo(rx + rw * 0.8, gl - rh - 1, rx + rw, gl)
    b.fill()
    b.fillStyle = rgba(rim, 0.55)
    b.fillRect(rx + 3, gl - rh + 0.6, rw * 0.35, 0.6)
  }
  // Great wind-bent pines.
  for (const [px, ph, lean] of [
    [40, 64, 7],
    [72, 46, 5],
    [252, 70, 8],
    [470, 58, 6],
    [596, 66, 7],
  ] as const)
    pine(b, px, gl, ph, f, lean, px * 7 + 3, rgba(rim, 0.75))
  // The crows' snag.
  snag(b, STORM_SNAG_X, gl, STORM_SNAG_H, f, rim)
  // A rope-lift winch on an A-frame, its basket hanging.
  const wx = 340
  b.fillStyle = f
  for (const dx of [-12, 12]) {
    b.beginPath()
    b.moveTo(wx + dx - 1, gl)
    b.lineTo(wx - 0.5, gl - 46)
    b.lineTo(wx + 0.5, gl - 46)
    b.lineTo(wx + dx + 1, gl)
    b.fill()
  }
  b.fillRect(wx - 8, gl - 24, 16, 1.4)
  b.strokeStyle = f
  b.lineWidth = 1.2
  b.beginPath()
  b.arc(wx, gl - 44, 5, 0, Math.PI * 2)
  b.stroke()
  b.lineWidth = 0.5
  for (let i = 0; i < 4; i++) {
    const a = (i * Math.PI) / 4
    b.beginPath()
    b.moveTo(wx - Math.cos(a) * 5, gl - 44 - Math.sin(a) * 5)
    b.lineTo(wx + Math.cos(a) * 5, gl - 44 + Math.sin(a) * 5)
    b.stroke()
  }
  b.strokeStyle = rgba(ROPE, 0.45)
  b.lineWidth = 0.4
  b.beginPath()
  b.moveTo(wx + 5, gl - 44)
  b.lineTo(wx + 5, gl - 20)
  b.moveTo(wx + 5, gl - 44)
  b.quadraticCurveTo(wx + 60, gl - 50, wx + 120, gl - 70)
  b.stroke()
  b.fillStyle = f
  b.fillRect(wx + 2, gl - 20, 7, 6)
  rimLeft(b, wx - 12, gl - 46, 46, rgba(rim, 0.4))
  // Prayer pennants on a line between a pine and a pole, streaming downwind.
  const p0 = [430, gl - 40] as const
  const p1 = [474, gl - 30] as const
  b.fillStyle = f
  b.fillRect(429, gl - 42, 1.4, 42)
  b.strokeStyle = f
  b.lineWidth = 0.4
  b.beginPath()
  b.moveTo(p0[0], p0[1])
  b.quadraticCurveTo((p0[0] + p1[0]) / 2, p1[1] + 4, p1[0], p1[1])
  b.stroke()
  const tones = ['#5a2a3a', '#3a3a6a', '#5a4a2a', '#2a4a4a']
  for (let i = 1; i < 8; i++) {
    const t = i / 8
    const fx = p0[0] + (p1[0] - p0[0]) * t
    const fy = p0[1] + (p1[1] - p0[1]) * t + Math.sin(t * Math.PI) * 4
    b.fillStyle = tones[i % 4]!
    b.beginPath()
    b.moveTo(fx - 1.5, fy)
    b.lineTo(fx + 1.5, fy)
    b.lineTo(fx + 3.5, fy + 3 + (i % 2))
    b.lineTo(fx + 1, fy + 2.4)
    b.lineTo(fx - 0.5, fy + 4)
    b.closePath()
    b.fill()
  }
  // A cairn shrine (its lantern burns live) and broken fence posts leaning in the wind.
  for (let k = 0; k < 4; k++) {
    b.fillStyle = f
    b.beginPath()
    b.ellipse(390, gl - 2 - k * 3.4, 7 - k * 1.4, 2, 0, 0, Math.PI * 2)
    b.fill()
  }
  b.fillRect(389.4, gl - 22, 1.2, 10)
  b.fillRect(389.4, gl - 22, 4, 1)
  for (let i = 0; i < 6; i++) {
    const fx = 548 + i * 8 + rand() * 2
    b.save()
    b.translate(fx, gl)
    b.rotate(0.12 + rand() * 0.12)
    b.fillRect(-0.7, -10 - rand() * 4, 1.4, 12)
    b.restore()
  }
  b.fillRect(548, gl - 7, 40, 0.8)
  // Grass streaming downwind along the bank.
  b.strokeStyle = f
  b.lineWidth = 0.5
  for (let i = 0; i < 140; i++) {
    const gx = rand() * MID_W
    const gh = 2 + rand() * 5
    b.beginPath()
    b.moveTo(gx, gl)
    b.quadraticCurveTo(gx + 0.5, gl - gh * 0.6, gx + gh * 0.7, gl - gh)
    b.stroke()
  }
  finishStrip(b, MID_B_H, mix(look.mist, look.midB, 0.6), look.fog * 0.35)
}

const ABBEY_SPAN = 80
const ABBEY_PIER = 16
const ABBEY_SPRING = GL_A - 54

function paintMidAbbeyA(b: Ctx) {
  const look = LOOKS.abbey
  const f = look.midA
  const rim = look.midARim
  const gl = GL_A
  const rand = backdropRng(2301)
  const S = ABBEY_SPAN
  const P = ABBEY_PIER
  // The arcade wall with its pointed openings cut through to the vaults beyond.
  b.fillStyle = f
  b.beginPath()
  b.rect(0, 8, MID_W, MID_A_H - 8)
  for (let x = 0; x < MID_W; x += S)
    gothicArch(b, x + P / 2, ABBEY_SPRING, S - P, 24, gl - ABBEY_SPRING)
  b.fill('evenodd')
  // A gallery cornice along the top with a pierced balustrade.
  b.fillRect(0, 4, MID_W, 5)
  for (let x = 2; x < MID_W; x += 6) {
    b.beginPath()
    b.arc(x + 2, 4, 2, Math.PI, 0)
    b.fill()
  }
  b.fillStyle = rgba(rim, 0.7)
  b.fillRect(0, 4, MID_W, 0.6)
  b.fillRect(0, 8.4, MID_W, 0.5)
  for (let x = 0; x < MID_W; x += S) {
    const px = x - P / 2
    const ax = x + P / 2
    // Archivolts: a lit inner moulding round each opening.
    b.strokeStyle = rgba(rim, 0.55)
    b.lineWidth = 0.6
    b.beginPath()
    b.moveTo(ax + 1, gl)
    b.lineTo(ax + 1, ABBEY_SPRING)
    b.quadraticCurveTo(
      ax + 1,
      ABBEY_SPRING - 18,
      ax + (S - P) / 2,
      ABBEY_SPRING - 23,
    )
    b.stroke()
    // Keystone skull.
    skull(
      b,
      ax + (S - P) / 2,
      ABBEY_SPRING - 31,
      1.3,
      mix(f, '#c8b090', 0.35),
      f,
    )
    // The pier: capital, an ossuary of niches, a plinth.
    b.fillStyle = mix(f, rim, 0.18)
    b.fillRect(px - 1.5, ABBEY_SPRING - 2, P + 3, 3)
    b.fillStyle = rgba(rim, 0.6)
    b.fillRect(px - 1.5, ABBEY_SPRING - 2, P + 3, 0.5)
    rimLeft(b, px, ABBEY_SPRING, gl - ABBEY_SPRING, rgba(rim, 0.7))
    for (let ny = ABBEY_SPRING + 6; ny < gl - 14; ny += 8)
      for (let nx = px + 2; nx < px + P - 3; nx += 6) {
        b.fillStyle = rgba(INK, 0.95)
        b.beginPath()
        b.arc(nx + 2, ny + 2, 2, Math.PI, 0)
        b.rect(nx, ny + 2, 4, 3.5)
        b.fill()
        if (rand() < 0.8)
          skull(b, nx + 2, ny + 1.9, 0.95, mix(f, '#d8c8a8', 0.42), f)
      }
    b.fillStyle = mix(f, rim, 0.12)
    b.fillRect(px - 2, gl - 6, P + 4, 6)
    b.fillStyle = rgba(rim, 0.5)
    b.fillRect(px - 2, gl - 6, P + 4, 0.5)
    // A chain from the arch's crown with a hanging cage (its censer glows live).
    const cx = ax + (S - P) / 2
    dropChainRaw(b, cx, ABBEY_SPRING - 22, ABBEY_SPRING + 8, f, rgba(rim, 0.6))
    b.strokeStyle = f
    b.lineWidth = 0.7
    b.beginPath()
    b.moveTo(cx - 3, ABBEY_SPRING + 10)
    b.lineTo(cx, ABBEY_SPRING + 7)
    b.lineTo(cx + 3, ABBEY_SPRING + 10)
    b.stroke()
    for (const dx of [-3, -1, 1, 3])
      b.fillRect(cx + dx - 0.25, ABBEY_SPRING + 10, 0.5, 7)
    b.fillRect(cx - 3.5, ABBEY_SPRING + 17, 7, 1)
    b.fillRect(cx - 3.5, ABBEY_SPRING + 10, 7, 0.8)
  }
  // Steps and a low wall through each opening, so the floor reads.
  b.fillStyle = f
  b.fillRect(0, gl - 3, MID_W, 3)
  b.fillStyle = rgba(rim, 0.45)
  b.fillRect(0, gl - 3, MID_W, 0.5)
  finishStrip(b, MID_A_H, mix(look.mist, look.midA, 0.55), look.fog * 0.4)
}

function paintMidAbbeyB(b: Ctx) {
  const look = LOOKS.abbey
  const f = look.midB
  const rim = look.midBRim
  const gl = GL_B
  const rand = backdropRng(2309)
  // Broken column stumps.
  for (const [cx, ch] of [
    [24, 22],
    [372, 34],
  ] as const) {
    b.fillStyle = f
    b.fillRect(cx, gl - ch, 12, ch)
    b.fillRect(cx - 2, gl - 4, 16, 4)
    b.beginPath()
    b.moveTo(cx, gl - ch)
    b.lineTo(cx + 4, gl - ch - 5)
    b.lineTo(cx + 7, gl - ch - 2)
    b.lineTo(cx + 12, gl - ch - 4)
    b.lineTo(cx + 12, gl - ch)
    b.fill()
    b.fillStyle = rgba(rim, 0.4)
    for (let k = 2; k < 12; k += 3) b.fillRect(cx + k, gl - ch, 0.4, ch - 4)
    rimLeft(b, cx, gl - ch, ch, rim)
  }
  // Sarcophagi with effigies on their lids.
  for (const sx of [110, 420]) {
    b.fillStyle = f
    b.fillRect(sx, gl - 12, 46, 12)
    b.fillRect(sx - 2, gl - 14, 50, 3)
    b.beginPath()
    b.ellipse(sx + 8, gl - 16, 3, 2.4, 0, 0, Math.PI * 2)
    b.fill()
    b.beginPath()
    b.moveTo(sx + 11, gl - 14)
    b.quadraticCurveTo(sx + 26, gl - 19, sx + 40, gl - 15)
    b.lineTo(sx + 40, gl - 14)
    b.fill()
    b.fillStyle = rgba(rim, 0.6)
    b.fillRect(sx - 2, gl - 14, 50, 0.5)
    b.fillStyle = rgba(INK, 0.5)
    for (let k = 0; k < 4; k++) b.fillRect(sx + 4 + k * 11, gl - 9, 6, 6)
  }
  // Bone heaps: skulls stacked in the corners.
  for (const [hx, n] of [
    [220, 9],
    [574, 12],
  ] as const) {
    for (let i = 0; i < n; i++) {
      const row = i < 5 ? 0 : i < 8 ? 1 : 2
      const k = row === 0 ? i : row === 1 ? i - 5 : i - 8
      const per = row === 0 ? 5 : row === 1 ? 3 : 4
      const sx = hx + (k - (per - 1) / 2) * 4.2 + row * 1.2
      skull(b, sx, gl - 3.6 - row * 3.2, 1.25, mix(f, '#bca888', 0.3), f)
    }
  }
  // Candelabra stands (their candles burn live).
  for (const cx of CANDELABRA) {
    b.fillStyle = f
    b.fillRect(cx - 0.7, gl - 34, 1.4, 34)
    b.beginPath()
    b.moveTo(cx - 5, gl)
    b.lineTo(cx, gl - 6)
    b.lineTo(cx + 5, gl)
    b.fill()
    b.strokeStyle = f
    b.lineWidth = 1
    b.beginPath()
    b.moveTo(cx - 6, gl - 40)
    b.quadraticCurveTo(cx - 6, gl - 32, cx, gl - 32)
    b.quadraticCurveTo(cx + 6, gl - 32, cx + 6, gl - 40)
    b.stroke()
    for (const dx of [-6, 0, 6]) b.fillRect(cx + dx - 1.4, gl - 41, 2.8, 1.2)
    b.fillStyle = '#c8b8a0'
    for (const dx of [-6, 0, 6])
      b.fillRect(
        cx + dx - 0.6,
        gl - 45 - (dx === 0 ? 2 : 0),
        1.2,
        4 + (dx === 0 ? 2 : 0),
      )
    rimLeft(b, cx - 0.7, gl - 34, 34, rgba(rim, 0.7))
  }
  // A tall stele bearing the ritual sigil (it smoulders live), an altar before it.
  const sx = ABBEY_STELE_X
  b.fillStyle = f
  b.fillRect(sx - 12, gl - 54, 24, 54)
  b.beginPath()
  b.moveTo(sx - 14, gl - 54)
  b.lineTo(sx, gl - 64)
  b.lineTo(sx + 14, gl - 54)
  b.fill()
  b.fillRect(sx - 18, gl - 10, 36, 10)
  b.fillRect(sx - 20, gl - 12, 40, 3)
  rimLeft(b, sx - 12, gl - 54, 44, rim)
  b.fillStyle = rgba(rim, 0.6)
  b.fillRect(sx - 20, gl - 12, 40, 0.5)
  b.strokeStyle = rgba(INK, 0.9)
  b.lineWidth = 1.2
  b.beginPath()
  b.arc(sx, gl - 36, 8, 0, Math.PI * 2)
  b.stroke()
  // An iron railing round an ossuary pit.
  b.fillStyle = f
  for (let x = 476; x < 560; x += 3.4) {
    if (x > 540 && x < 548) continue
    b.fillRect(x, gl - 14, 0.7, 14)
    b.beginPath()
    b.moveTo(x - 0.6, gl - 14)
    b.lineTo(x + 0.35, gl - 16.5)
    b.lineTo(x + 1.3, gl - 14)
    b.fill()
  }
  b.fillRect(476, gl - 12, 84, 0.8)
  b.fillRect(476, gl - 5, 84, 0.8)
  // Rubble and bones scattered on the flags.
  for (let i = 0; i < 40; i++) {
    b.fillStyle = rand() < 0.5 ? f : mix(f, '#a89070', 0.25)
    b.fillRect(rand() * MID_W, gl - 1 - rand() * 1.5, 1 + rand() * 2.5, 0.8)
  }
  finishStrip(b, MID_B_H, mix(look.mist, look.midB, 0.6), look.fog * 0.35)
}

const CANDELABRA = [64, 300, 530]
const ABBEY_STELE_X = 262

/** Storm Crow Pass's 12x16 obstacle in a 16 x 18 box: a grave cairn of flat stones with a marker. */
function paintCairn(b: Ctx, v: number) {
  const X = 2
  const Y = 2
  const rand = backdropRng(1733 + v)
  // Courses of flat slabs, widest at the foot, filling the 12x16 box exactly.
  const courses = [
    [Y + 12.5, 3.5],
    [Y + 9, 3.5],
    [Y + 5.5, 3.5],
    [Y + 2.2, 3.3],
    [Y, 2.2],
  ] as const
  courses.forEach(([cy, ch], i) => {
    let x = X
    const n = i === 4 ? 2 : 2 + (rand() < 0.5 ? 1 : 0)
    for (let k = 0; k < n; k++) {
      const w = k === n - 1 ? X + 12 - x : 12 / n + (rand() - 0.5) * 2
      block(b, x + 0.15, cy, w - 0.3, ch, GRANITE, 1.2, (rand() - 0.4) * 0.6)
      x += w
    }
  })
  // A weathered plank marker lashed into the top course, a crow feather tucked in the lashing.
  plank(b, X + 4.6, Y + 0.6, 2.8, 9, STORMWOOD, 70 + v)
  b.fillStyle = STORMWOOD[2]
  b.fillRect(X + 2.6, Y + 3, 6.8, 1.6)
  b.fillStyle = rgba(STORMWOOD[4], 0.6)
  b.fillRect(X + 2.6, Y + 3, 6.8, 0.4)
  b.fillStyle = ROPE
  b.fillRect(X + 4.4, Y + 3.2, 3.2, 0.5)
  b.fillRect(X + 4.4, Y + 4.1, 3.2, 0.4)
  b.fillStyle = '#10121e'
  b.beginPath()
  b.moveTo(X + 7.4, Y + 3.6)
  b.quadraticCurveTo(X + 10.5, Y + 1, X + 11.4, Y - 0.2)
  b.quadraticCurveTo(X + 10, Y + 2.6, X + 7.6, Y + 4.4)
  b.fill()
  // Lichen, and the storm's light on the windward stones.
  b.fillStyle = 'rgba(120, 150, 130, 0.55)'
  for (let i = 0; i < 4; i++)
    b.fillRect(X + rand() * 10, Y + 6 + rand() * 9, 1.4, 0.7)
  b.fillStyle = rgba('#b8c0ff', 0.45)
  b.fillRect(X, Y + 5.5, 0.6, 10)
}

/** The abbey's 12x16 obstacle: a reliquary plinth, a skull carved in its face, wax on its top. */
function paintReliquary(b: Ctx, v: number) {
  const X = 2
  const Y = 2
  block(b, X, Y + 2.5, 12, 13.5, CRYPT, 0.6, 0)
  block(b, X - 0.0, Y, 12, 3, CRYPT, 0.5, 0.35)
  block(b, X, Y + 13.4, 12, 2.6, CRYPT, 0.4, -0.3)
  // The recessed panel and its skull.
  b.fillStyle = CRYPT[1]
  b.fillRect(X + 2, Y + 4.6, 8, 8)
  b.fillStyle = rgba(CRYPT[3], 0.7)
  b.fillRect(X + 2, Y + 12.4, 8, 0.4)
  b.fillRect(X + 9.6, Y + 4.6, 0.4, 8)
  skull(b, X + 6, Y + 5.6, 1.6, BONE[2], CRYPT[0])
  b.fillStyle = rgba(BONE[4], 0.55)
  b.fillRect(X + 4.4, Y + 6.2, 1.6, 0.4)
  // A violet sigil line inlaid round the panel, faintly alight.
  b.strokeStyle = rgba(VIOLET, 0.55)
  b.lineWidth = 0.35
  b.strokeRect(X + 1.3, Y + 3.9, 9.4, 9.4)
  // Wax pooled and dripping from the top: flat, so the top stays the block's top.
  b.fillStyle = '#d8c8b0'
  b.fillRect(X + 1 + v * 3, Y, 4, 0.8)
  b.fillRect(X + 1.6 + v * 3, Y + 0.8, 0.6, 2.2)
  b.fillRect(X + 3.6 + v * 3, Y + 0.8, 0.5, 1.4)
  b.fillStyle = rgba('#fff4dc', 0.7)
  b.fillRect(X + 1 + v * 3, Y, 4, 0.3)
}

/** Storm Crow Pass's gate: lashed timber posts, a pine lintel and a crow-skull totem. */
function paintGateStorm(b: Ctx, gy: number, L: number) {
  for (const px of [L, L + 60]) {
    post(b, px, gy - 70, 12, 70, STORMWOOD)
    // Rope lashings.
    for (const yy of [gy - 64, gy - 40, gy - 14]) {
      b.fillStyle = ROPE_DARK
      b.fillRect(px - 0.5, yy, 13, 3)
      b.fillStyle = ROPE
      for (let k = 0; k < 3; k++) b.fillRect(px - 0.5, yy + k, 13, 0.6)
    }
    block(b, px - 2, gy - 6, 16, 6, GRANITE, 1, 0)
  }
  // A rough-hewn lintel of two logs, lashed.
  for (const [ly, lh] of [
    [gy - 84, 7],
    [gy - 77, 7],
  ] as const) {
    b.fillStyle = STORMWOOD[2]
    roundRect(b, L - 6, ly, 84, lh, 3)
    b.fill()
    b.fillStyle = STORMWOOD[3]
    b.fillRect(L - 4, ly + 0.6, 80, 1.2)
    b.fillStyle = STORMWOOD[1]
    b.fillRect(L - 4, ly + lh - 1.6, 80, 1.2)
    b.strokeStyle = STORMWOOD[0]
    b.lineWidth = 0.5
    roundRect(b, L - 6, ly, 84, lh, 3)
    b.stroke()
    // Log ends.
    for (const ex of [L - 6, L + 78]) {
      b.fillStyle = STORMWOOD[3]
      b.beginPath()
      b.ellipse(ex, ly + lh / 2, 1.6, lh / 2, 0, 0, Math.PI * 2)
      b.fill()
      b.strokeStyle = STORMWOOD[1]
      b.beginPath()
      b.ellipse(ex, ly + lh / 2, 0.8, lh / 4, 0, 0, Math.PI * 2)
      b.stroke()
    }
  }
  brace(b, L + 12, gy - 52, L + 26, gy - 70, STORMWOOD, 2.4)
  brace(b, L + 60, gy - 52, L + 46, gy - 70, STORMWOOD, 2.4)
  // The totem: a crow skull nailed over the lintel, a crow's wings spread either side of it.
  const cx = L + 36
  const cy = gy - 91
  for (const side of [-1, 1] as const) {
    for (let i = 0; i < 6; i++) {
      // Primaries fan out and down from the shoulder; the outer ones longest.
      const a = side * (0.25 + i * 0.22)
      const len = 9 + i * 1.3
      b.save()
      b.translate(cx + side * 3, cy - 1)
      b.rotate(a)
      b.beginPath()
      b.moveTo(-1.3, 0)
      b.quadraticCurveTo(-1.8, -len * 0.6, side * 0.4, -len)
      b.quadraticCurveTo(1.8, -len * 0.6, 1.3, 0)
      b.closePath()
      b.fillStyle = INK
      b.lineWidth = 0.9
      b.strokeStyle = INK
      b.stroke()
      b.fillStyle = i % 2 ? '#141830' : '#1c2242'
      b.fill()
      b.fillStyle = rgba('#7a84d0', 0.55)
      b.fillRect(-0.2, -len + 1, 0.4, len - 2)
      b.restore()
    }
  }
  // The skull: a bone dome, a long beak, a dark socket.
  b.fillStyle = '#c8bca0'
  b.beginPath()
  b.ellipse(cx - 1.5, cy, 4.2, 3.4, 0, 0, Math.PI * 2)
  b.fill()
  b.beginPath()
  b.moveTo(cx + 1.5, cy - 1.6)
  b.quadraticCurveTo(cx + 7, cy - 1, cx + 11, cy + 2.2)
  b.lineTo(cx + 1.5, cy + 2.4)
  b.closePath()
  b.fill()
  b.strokeStyle = INK
  b.lineWidth = 0.5
  b.stroke()
  b.beginPath()
  b.ellipse(cx - 1.5, cy, 4.2, 3.4, 0, 0, Math.PI * 2)
  b.stroke()
  b.strokeStyle = rgba('#6a5a44', 0.8)
  b.lineWidth = 0.35
  b.beginPath()
  b.moveTo(cx + 2, cy + 0.6)
  b.lineTo(cx + 10, cy + 2)
  b.stroke()
  b.fillStyle = INK
  b.beginPath()
  b.arc(cx, cy - 0.4, 1.3, 0, Math.PI * 2)
  b.fill()
  b.fillStyle = rgba('#fff4dc', 0.7)
  b.fillRect(cx - 4.5, cy - 2.4, 2.6, 0.5)
  // The nail.
  b.fillStyle = IRON[3]
  b.fillRect(cx - 2.6, cy + 1.2, 1, 1)
}

/** The abbey's gate: crypt pillars, a pointed arch of voussoirs, a skull keystone, sigils. */
function paintGateAbbey(b: Ctx, gy: number, L: number) {
  for (const px of [L, L + 60]) {
    for (let yy = gy - 70; yy < gy; yy += 7)
      block(b, px, yy, 12, 7, CRYPT, 0.6, ((yy / 7) % 2) * 0.2 - 0.1)
    block(b, px - 1.5, gy - 73, 15, 3.5, CRYPT, 0.6, 0.3)
    block(b, px - 1.5, gy - 4, 15, 4, CRYPT, 0.6, -0.2)
    // A carved sigil on each pillar face.
    b.strokeStyle = rgba(VIOLET, 0.6)
    b.lineWidth = 0.5
    b.beginPath()
    b.arc(px + 6, gy - 38, 3.2, 0, Math.PI * 2)
    b.moveTo(px + 6, gy - 42)
    b.lineTo(px + 6, gy - 34)
    b.moveTo(px + 2.8, gy - 38)
    b.lineTo(px + 9.2, gy - 38)
    b.stroke()
  }
  // The pointed arch, built of voussoirs between the pillar caps.
  const cx = L + 36
  const spring = gy - 70
  const curve = (x0: number, rise: number, t: number): [number, number] => {
    const u = 1 - t
    const x = u * u * x0 + 2 * u * t * x0 + t * t * cx
    const y =
      u * u * spring +
      2 * u * t * (spring - rise * 0.75) +
      t * t * (spring - rise)
    return [x, y]
  }
  const n = 5
  for (const side of [-1, 1] as const) {
    const outer = cx + side * 38
    const inner = cx + side * 24
    for (let i = 0; i < n; i++) {
      const [ax, ay] = curve(outer, 31, i / n)
      const [bx2, by2] = curve(outer, 31, (i + 1) / n)
      const [cx2, cy2] = curve(inner, 21, (i + 1) / n)
      const [dx, dy] = curve(inner, 21, i / n)
      b.beginPath()
      b.moveTo(ax, ay)
      b.lineTo(bx2, by2)
      b.lineTo(cx2, cy2)
      b.lineTo(dx, dy)
      b.closePath()
      b.fillStyle = mix(
        CRYPT[2],
        CRYPT[3],
        ((i + (side > 0 ? 1 : 0)) % 2) * 0.35,
      )
      b.fill()
      b.strokeStyle = CRYPT[0]
      b.lineWidth = 0.5
      b.stroke()
      b.fillStyle = rgba(CRYPT[4], 0.7)
      b.fillRect(Math.min(ax, bx2), Math.min(ay, by2), 1.2, 0.5)
    }
  }
  // Keystone with a skull.
  b.fillStyle = CRYPT[2]
  b.beginPath()
  b.moveTo(cx - 5, spring - 36)
  b.lineTo(cx + 5, spring - 36)
  b.lineTo(cx + 3.5, spring - 20)
  b.lineTo(cx - 3.5, spring - 20)
  b.closePath()
  b.fill()
  b.strokeStyle = CRYPT[0]
  b.lineWidth = 0.6
  b.stroke()
  b.fillStyle = rgba(CRYPT[4], 0.7)
  b.fillRect(cx - 5, spring - 36, 10, 0.6)
  skull(b, cx, spring - 32, 1.6, BONE[2], CRYPT[0])
  // Chains hung across the opening's top.
  chain(b, L + 13, spring - 2, L + 59, spring - 2, 6)
}

/** Storm foreground tuft, abbey skulls and candles: added low silhouettes. */
function paintFgExtra(
  b: Ctx,
  kind: 'grass' | 'skulls' | 'candles' | 'snag',
  w: number,
  h: number,
  f: string,
) {
  b.fillStyle = f
  b.strokeStyle = f
  if (kind === 'grass') {
    // Grass streaming downwind.
    b.lineWidth = 0.9
    for (let i = 0; i < w / 1.6; i++) {
      const gx = 0.5 + i * 1.6
      const gh = h - 2 - ((i * 7) % 5)
      b.beginPath()
      b.moveTo(gx, h)
      b.quadraticCurveTo(gx + 0.8, h - gh * 0.6, gx + gh * 0.55, h - gh)
      b.stroke()
    }
  } else if (kind === 'snag') {
    b.beginPath()
    b.moveTo(1, h)
    b.lineTo(3, 3)
    b.lineTo(4.5, 0.5)
    b.lineTo(5.5, 4)
    b.lineTo(w - 1, h)
    b.fill()
    b.lineWidth = 1
    b.beginPath()
    b.moveTo(4, 6)
    b.lineTo(w, 2)
    b.stroke()
  } else if (kind === 'skulls') {
    for (let i = 0; i < Math.floor(w / 4); i++)
      skull(b, 2 + i * 4, h - 3.4 - (i % 2) * 1.6, 1.2, f, 'rgba(0,0,0,0)')
    b.fillRect(0, h - 1, w, 1)
  } else {
    // Candle stubs on a ledge (dark against the lit floor).
    b.fillRect(0, h - 3, w, 3)
    for (let x = 1.5; x < w - 1; x += 3.2)
      b.fillRect(x, h - 3 - 3 - ((x * 5) % 4), 1.4, 6 + ((x * 5) % 4))
  }
}

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
  stormpass: {
    a: [
      { ...bridgeAt(0.3), r: 10, color: AMBER, kind: 'lantern' },
      { ...bridgeAt(0.72), r: 10, color: AMBER, kind: 'lantern' },
      { x: 552, y: GL_A - 10, r: 14, color: AMBER },
    ],
    b: [
      ...snagPerches(STORM_SNAG_X, GL_B, STORM_SNAG_H).map(
        ([x, y], i): Light => ({
          x,
          y,
          r: 0,
          color: AMBER,
          kind: 'crow',
          face: i === 1 ? -1 : 1,
        }),
      ),
      { x: 393, y: GL_B - 21, r: 12, color: AMBER, kind: 'lantern' },
    ],
  },
  abbey: {
    a: [
      ...[80, 240, 400, 560].map((x): Light => ({
        x,
        y: GL_A - 6,
        r: 12,
        color: CANDLE,
        kind: 'candles',
      })),
      ...[40, 200, 360, 520].map((x): Light => ({
        x,
        y: ABBEY_SPRING + 15,
        r: 9,
        color: VIOLET,
        kind: 'censer',
      })),
    ],
    b: [
      ...CANDELABRA.map((x): Light => ({
        x,
        y: GL_B - 45,
        r: 16,
        color: CANDLE,
        kind: 'candelabra',
      })),
      { x: ABBEY_STELE_X, y: GL_B - 36, r: 18, color: VIOLET, kind: 'sigil' },
    ],
  },
}

/** A point on the mid strip's rope bridge (a lantern hangs just under its deck). */
function bridgeAt(t: number): { x: number; y: number } {
  const br = STORM_BRIDGE
  return {
    x: Math.round(br.x1 + (br.x2 - br.x1) * t),
    y: Math.round(
      br.y1 + (br.y2 - br.y1) * t + Math.sin(t * Math.PI) * br.sag + 1,
    ),
  }
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
  if (key === 'stormpass') return paintMidStormA(b)
  if (key === 'abbey') return paintMidAbbeyA(b)
  const look = LOOKS[key]
  const f = look.midA
  const rim = look.midARim
  const gl = GL_A
  const rand = backdropRng(SEED[key] * 7 + 101)
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
  const rand = backdropRng(SEED[key] * 13 + 211)
  const flat: Ramp = [f, f, f, f, f]
  b.fillStyle = f
  // A low rolling bank everywhere so nothing floats.
  b.beginPath()
  b.moveTo(0, MID_B_H)
  for (let x = 0; x <= MID_W; x += 16)
    b.lineTo(x, gl - 2 - Math.sin((x / MID_W) * Math.PI * 6) * 2)
  b.lineTo(MID_W, MID_B_H)
  b.fill()
  if (key === 'stormpass') return paintMidStormB(b)
  if (key === 'abbey') return paintMidAbbeyB(b)
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
    } else if (l.kind === 'lantern') {
      // A lantern swinging in the wind on a short chain.
      const sway =
        Math.sin(tick / 24 + l.x) * 1.2 + Math.sin(tick / 9 + l.x) * 0.3
      g.strokeStyle = f
      g.lineWidth = 0.5
      g.beginPath()
      g.moveTo(x, y)
      g.lineTo(x + sway, y + 3)
      g.stroke()
      g.save()
      g.translate(x + sway, y + 3)
      g.scale(0.7, 0.7)
      lantern(g, 0, 0)
      g.restore()
      const fl = flicker(tick, l.x)
      glow(g, x + sway, y + 6, l.r * fl, l.color, 0.42)
    } else if (l.kind === 'crow') {
      // A crow on its perch: it shifts, and now and then it rouses its wings.
      const beat = Math.floor((tick + l.x * 13) / 26)
      const rouse = hash(beat + l.x) < 0.14
      const face = (
        hash(Math.floor((tick + l.x * 7) / 200)) < 0.3
          ? -(l.face ?? 1)
          : (l.face ?? 1)
      ) as 1 | -1
      if (rouse) {
        const up = ((tick + l.x * 13) % 26) / 26
        const a = Math.sin(up * Math.PI * 4) * 0.5 + 0.6
        g.fillStyle = f
        for (const side of [-1, 1]) {
          g.beginPath()
          g.moveTo(x - face * 0.5, y - 3)
          g.lineTo(
            x - face * 0.5 + side * 5 * Math.cos(a),
            y - 3 - 5 * Math.sin(a),
          )
          g.lineTo(x - face * 2.5, y - 2)
          g.closePath()
          g.fill()
        }
      }
      perchedCrow(g, x, y, 1, f, face, '#ffcf6a')
    } else if (l.kind === 'candles' || l.kind === 'candelabra') {
      // A few candle flames (on a plinth, or on a candelabrum's three cups).
      const spots =
        l.kind === 'candles'
          ? [
              [-4, 0, 3],
              [0, -1.5, 4.5],
              [3.5, 0, 2.5],
            ]
          : [
              [-6, 0, 0],
              [0, -2, 0],
              [6, 0, 0],
            ]
      for (const [dx, dy, ch] of spots) {
        if (ch) {
          g.fillStyle = '#d8c8b0'
          g.fillRect(x + dx! - 0.6, y + dy! - ch!, 1.2, ch!)
          g.fillStyle = rgba('#fff4dc', 0.6)
          g.fillRect(x + dx! - 0.6, y + dy! - ch!, 0.4, ch!)
        }
        flame(g, x + dx!, y + dy! - ch!, 0.42, tick + l.x + dx! * 7)
      }
      const fl = flicker(tick, l.x)
      glow(g, x, y - 4, l.r * fl, l.color, 0.38)
    } else if (l.kind === 'censer') {
      const fl = flicker(tick, l.x)
      flame(g, x, y + 1, 0.4, tick + l.x, VIOLET)
      glow(g, x, y, l.r * fl, l.color, 0.4)
    } else if (l.kind === 'sigil') {
      // The ritual sigil breathing between violet and crimson.
      const p = (Math.sin(tick / 40 + l.x) + 1) / 2
      drawSigil(g, x, y, 7.5, mix(VIOLET, RITUAL, p), 0.55 + 0.35 * p, tick)
      glow(g, x, y, l.r * (0.85 + 0.25 * p), mix(VIOLET, RITUAL, p), 0.3)
    } else {
      const fl = flicker(tick, l.x + l.y)
      glow(g, x, y + 4, l.r * fl, l.color, 0.4)
    }
  }
}

/** A ritual sigil (a ring, a five-point star, runes) centred on (x, y), radius r, live. */
function drawSigil(
  g: Ctx,
  x: number,
  y: number,
  r: number,
  colour: string,
  alpha: number,
  tick: number,
  squash = 1,
) {
  g.save()
  g.translate(x, y)
  g.scale(1, squash)
  g.globalCompositeOperation = 'lighter'
  g.strokeStyle = rgba(colour, alpha)
  g.lineWidth = 0.7
  g.beginPath()
  g.arc(0, 0, r, 0, Math.PI * 2)
  g.stroke()
  g.lineWidth = 0.4
  g.beginPath()
  g.arc(0, 0, r * 0.8, 0, Math.PI * 2)
  g.stroke()
  const spin = tick / 300
  g.beginPath()
  for (let i = 0; i <= 5; i++) {
    const a = spin - Math.PI / 2 + (i * 4 * Math.PI) / 5
    const px = Math.cos(a) * r * 0.78
    const py = Math.sin(a) * r * 0.78
    if (i) g.lineTo(px, py)
    else g.moveTo(px, py)
  }
  g.stroke()
  // Rune ticks between the rings.
  g.fillStyle = rgba(colour, alpha)
  for (let i = 0; i < 10; i++) {
    const a = -spin + (i * Math.PI) / 5
    g.fillRect(
      Math.cos(a) * r * 0.9 - 0.3,
      Math.sin(a) * r * 0.9 - 0.3,
      0.6,
      0.6,
    )
  }
  g.restore()
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
        ? rgba(
            hot === CRIMSON
              ? '#c0182a'
              : hot === VIOLET
                ? '#6a1ab0'
                : '#e2541a',
            0.85,
          )
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
      (b) => paintFog(b, look.mist, SEED[key] * 41),
      { alpha },
    )
}

/**
 * Storm Crow Pass's far lightning (screen space, over the far layer, behind the silhouettes): every
 * few seconds a bolt forks down behind the canyon and the cloud deck glows. It is cosmetic (from
 * `tick`), local and soft: a lit patch of sky that fades, never a full-screen strobe.
 */
function drawLightning(g: Ctx, tick: number) {
  const WINDOW = 330
  const k = Math.floor(tick / WINDOW)
  if (hash(k * 3 + 1) > 0.62) return
  const lt = (tick % WINDOW) - (50 + Math.floor(hash(k * 3 + 2) * 200))
  if (lt < 0 || lt > 34) return
  // Two quick pulses, then a slow fade.
  const I =
    lt < 4 ? 1 : lt < 7 ? 0.35 : lt < 11 ? 0.8 : Math.exp(-(lt - 11) / 7) * 0.8
  const bx = 40 + hash(k * 3 + 3) * 240
  const by = 34
  g.save()
  g.globalCompositeOperation = 'lighter'
  // The cloud deck lit from within around the strike.
  const wash = g.createRadialGradient(bx, by + 10, 0, bx, by + 10, 150)
  wash.addColorStop(0, rgba('#a69cf0', 0.26 * I))
  wash.addColorStop(0.5, rgba('#6c66c8', 0.1 * I))
  wash.addColorStop(1, rgba('#6c66c8', 0))
  g.fillStyle = wash
  g.fillRect(bx - 150, 0, 300, 170)
  if (I > 0.3) {
    // The bolt: a jagged main channel with a fork or two.
    const rand = backdropRng(k * 7919 + 17)
    const fork = (
      x: number,
      y: number,
      len: number,
      w: number,
      depth: number,
    ) => {
      const pts: Array<[number, number]> = [[x, y]]
      let px = x
      let py = y
      const steps = 6 + Math.floor(rand() * 4)
      for (let i = 0; i < steps; i++) {
        px += (rand() - 0.5) * 9
        py += len / steps
        pts.push([px, py])
      }
      for (const [lw, colour, a] of [
        [w * 3, '#8c84e8', 0.3],
        [w, '#f4f0ff', 0.95],
      ] as const) {
        g.strokeStyle = rgba(colour, a * I)
        g.lineWidth = lw
        g.lineJoin = 'round'
        g.beginPath()
        pts.forEach(([qx, qy], i) => (i ? g.lineTo(qx, qy) : g.moveTo(qx, qy)))
        g.stroke()
      }
      if (depth > 0)
        for (let i = 2; i < pts.length - 1; i += 3)
          if (rand() < 0.6)
            fork(pts[i]![0], pts[i]![1], len * 0.45, w * 0.6, depth - 1)
    }
    fork(bx, by, 70 + hash(k * 3 + 4) * 40, 0.7, 2)
  }
  g.restore()
}

/** Wind-driven rain in the far air (screen space, behind the silhouettes): sparse and faint. */
function drawRain(g: Ctx, camX: number, tick: number) {
  g.save()
  g.strokeStyle = rgba('#aab4f0', 0.1)
  g.lineWidth = 0.5
  g.beginPath()
  for (let i = 0; i < 26; i++) {
    const speed = 3 + (i % 3)
    const x = mod(i * 97 + tick * speed * 0.55 - camX * 0.3, W + 40) - 20
    const y = mod(i * 53 + tick * speed, 200) + 20
    g.moveTo(x, y)
    g.lineTo(x + 3, y + 7)
  }
  g.stroke()
  g.restore()
}

/** The crypt's air: dust motes and sparks drifting up through the candlelight (screen space). */
function drawMotes(g: Ctx, camX: number, tick: number) {
  for (let i = 0; i < 16; i++) {
    const rise = 0.12 + (i % 4) * 0.05
    const x =
      mod(i * 61 - camX * (0.2 + (i % 3) * 0.1), W + 20) -
      10 +
      Math.sin(tick / 50 + i) * 3
    const y = 210 - mod(tick * rise + i * 41, 180)
    const life = (210 - y) / 180
    const ember = i % 3 === 0
    g.fillStyle = rgba(
      ember ? (i % 2 ? RITUAL : '#ffb070') : '#d8c0ff',
      (ember ? 0.7 : 0.35) * Math.sin(life * Math.PI),
    )
    g.fillRect(x, y, ember ? 0.9 : 0.6, ember ? 0.9 : 0.6)
  }
}

/**
 * The stage backdrop in screen space, filling all 320x240; draw it first. The delivered plate
 * (or a procedural far layer when it is not loaded) pans slowly across the whole act, two
 * silhouette strips parallax in front of it, and fog drifts between the layers. Pass the act's
 * `length` (default: the slice's 3520) so the far pan spans the whole act, however long.
 */
export function drawBackdrop(
  g: Ctx,
  stage: StageKey,
  camX: number,
  tick: number,
  length: number = STAGE_END,
): void {
  const look = LOOKS[stage] ?? LOOKS.town
  const key: StageKey = LOOKS[stage] ? stage : 'town'
  g.save()
  g.fillStyle = look.sky[0]!
  g.fillRect(0, 0, W, H)
  const t = Math.max(0, Math.min(1, camX / camMaxFor(length)))
  const plate = drawPlate(g, key, camX, length)
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
    // Twinkling stars over the baked sky (none under the abbey, few through the storm).
    const stars = key === 'abbey' ? 0 : key === 'stormpass' ? 2 : 6
    for (let i = 0; i < stars; i++) {
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
  if (key === 'stormpass') {
    drawLightning(g, tick)
    drawRain(g, camX, tick)
  }
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
  if (key === 'abbey') drawMotes(g, camX, tick)
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
  const rand = backdropRng(SEED[key] * 1000 + v * 97 + 5)
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
  } else if (key === 'stormpass') {
    const grad = b.createLinearGradient(0, 0, 0, 32)
    grad.addColorStop(0, '#1c2038')
    grad.addColorStop(1, '#06060e')
    b.fillStyle = grad
    b.fillRect(0, 0, TILE, 32)
    // Bedded canyon granite: tilted courses, cracked, a quartz vein through them.
    row(4.6, 6, 10, 20, GRANITE, 1.6, 3 + v * 7, 0.7, 1.2)
    row(10.6, 6.5, 8, 18, GRANITE, 1.8, 11 + v * 5, 0.8, 1.4)
    row(17.1, 7, 12, 24, GRANITE, 2, 5 + v * 9, 1, 1.6)
    row(24.1, 8, 10, 22, GRANITE, 2, 2 + v * 3, 1, 1.6)
    b.strokeStyle = rgba('#b8c0ec', 0.3)
    b.lineWidth = 0.5
    b.beginPath()
    b.moveTo(-2, 8 + v * 3)
    for (let x = 6; x <= TILE + 6; x += 8)
      b.lineTo(x, 8 + v * 3 + x * 0.22 + (hash(x + v) - 0.5) * 2)
    b.stroke()
    b.strokeStyle = rgba(GRANITE[0], 0.9)
    b.lineWidth = 0.4
    for (let i = 0; i < 3; i++) {
      const cx = rand() * TILE
      const cy = 6 + rand() * 16
      b.beginPath()
      b.moveTo(cx, cy)
      b.lineTo(cx + 1.5, cy + 2.5)
      b.lineTo(cx + 0.5, cy + 5)
      b.stroke()
    }
    b.fillStyle = rgba(INK, 0.22)
    b.fillRect(0, 4.6, TILE, 28)
    depth(9, 0.85)
    // The crust: storm-washed grit and pebbles, its lip lit by the lightning.
    b.fillStyle = '#262a48'
    b.fillRect(0, 0, TILE, 4.8)
    for (let i = 0; i < 60; i++) {
      const px = rand() * TILE
      const py = 0.9 + rand() * 3.4
      const pr = 0.4 + rand() * 0.9
      b.fillStyle = [GRANITE[1], GRANITE[2], GRANITE[3], '#3a3050'][i % 4]!
      b.beginPath()
      b.ellipse(px, py, pr * 1.3, pr * 0.8, 0, 0, Math.PI * 2)
      b.fill()
      if (i % 5 === 0) {
        b.fillStyle = rgba(GRANITE[4], 0.7)
        b.fillRect(px - pr * 0.6, py - pr * 0.6, pr * 0.8, 0.35)
      }
    }
    // Wind-flattened grass along the lip, combed downwind.
    for (let x = 0; x < TILE; x += 1.5 + rand() * 4) {
      if (rand() < 0.4) continue
      const w = 2 + rand() * 4
      b.fillStyle = '#2a3a44'
      b.fillRect(x, 0, w, 1)
      b.fillStyle = '#5a6e7a'
      b.fillRect(x + 0.6, 0, w * 0.7, 0.4)
      b.fillStyle = '#2a3a44'
      b.fillRect(x + w - 0.6, 1, 0.5, 0.8 + rand() * 1.4)
    }
    b.fillStyle = rgba('#a8b2ec', 0.85)
    b.fillRect(0, 0, TILE, 0.5)
    b.fillStyle = rgba(INK, 0.65)
    b.fillRect(0, 4.6, TILE, 0.6)
  } else if (key === 'abbey') {
    const grad = b.createLinearGradient(0, 0, 0, 32)
    grad.addColorStop(0, '#1c1022')
    grad.addColorStop(1, '#060308')
    b.fillStyle = grad
    b.fillRect(0, 0, TILE, 32)
    // The ossuary course under the floor: little arched niches, a skull in each.
    b.fillStyle = CRYPT[1]
    b.fillRect(0, 6.2, TILE, 12.4)
    const off = (v * 5) % 16
    for (let nx = off - 16; nx < TILE; nx += 16) {
      b.fillStyle = '#040206'
      b.beginPath()
      b.arc(nx + 8, 10.6, 4.4, Math.PI, 0)
      b.rect(nx + 3.6, 10.6, 8.8, 7)
      b.fill()
      b.fillStyle = rgba(CRYPT[3], 0.7)
      b.fillRect(nx + 3.2, 10.6, 0.4, 7)
      b.fillStyle = rgba(INK, 0.9)
      b.fillRect(nx + 12.4, 10.6, 0.6, 7)
      const k = Math.floor(hash(nx + v * 37) * 3)
      if (k === 0) {
        skull(b, nx + 8, 11.6, 1.7, BONE[2], '#040206')
        b.fillStyle = rgba(BONE[4], 0.5)
        b.fillRect(nx + 6.6, 12, 1.2, 0.4)
      } else if (k === 1) {
        skull(b, nx + 6.2, 13.4, 1.25, BONE[1], '#040206')
        skull(b, nx + 9.8, 13.6, 1.25, BONE[2], '#040206')
      } else {
        b.fillStyle = BONE[1]
        for (let i = 0; i < 3; i++)
          b.fillRect(nx + 4.4, 15.2 - i * 1.4, 7.2, 0.9)
        skull(b, nx + 8, 9.2, 1.1, BONE[2], '#040206')
      }
    }
    b.fillStyle = rgba(INK, 0.25)
    b.fillRect(0, 6.2, TILE, 12.4)
    // Footings below, fading into the dark.
    row(18.6, 6.6, 10, 20, CRYPT, 1, 3 + v * 5, 0.9, 0.6)
    row(25.2, 7, 12, 22, CRYPT, 1, 9 + v * 3, 0.9, 0.6)
    b.fillStyle = rgba(INK, 0.3)
    b.fillRect(0, 18.6, TILE, 14)
    depth(10, 0.8)
    if (v === 2) {
      // Crimson light seeping from a cracked course.
      b.fillStyle = rgba(RITUAL, 0.35)
      b.fillRect(40, 23, 9, 1.2)
      b.fillStyle = rgba('#ffb0a0', 0.4)
      b.fillRect(42, 23.3, 4, 0.5)
    }
    // The floor: worn flagstones over a violet ritual inlay.
    row(0, 5.4, 14, 26, CRYPT, 0.8, v * 7, 0.6)
    b.fillStyle = rgba(CRYPT[4], 0.85)
    b.fillRect(0, 0, TILE, 0.55)
    b.fillStyle = rgba(INK, 0.8)
    b.fillRect(0, 5.4, TILE, 0.8)
    b.fillStyle = rgba(VIOLET, 0.45)
    b.fillRect(0, 6.2, TILE, 0.45)
    // Wax drips and a few dark stains on the flags.
    for (let i = 0; i < 3; i++) {
      b.fillStyle = rgba('#d8c8b0', 0.5)
      b.fillRect(rand() * TILE, 0.6 + rand() * 3, 1, 0.6)
      b.fillStyle = rgba('#2a0a14', 0.5)
      b.fillRect(rand() * TILE, 1 + rand() * 3, 2.5, 1)
    }
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
    const v = Math.floor(hash(tx / TILE + SEED[key] * 101) * 3)
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
    g.fillStyle = rgba(
      key === 'abbey' ? '#ffb07a' : key === 'stormpass' ? '#c8d0ff' : '#fff4dc',
      0.55,
    )
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
  } else if (key === 'abbey') {
    // A ritual glow far down the shaft, sparks rising through violet haze.
    const fl = flicker(tick, a)
    glow(g, (a + b) / 2, H + 10, Math.min(48, w * 0.8) * fl, '#9a2a8a', 0.45)
    glow(g, (a + b) / 2, H + 4, Math.min(26, w * 0.5) * fl, RITUAL, 0.3)
    for (let i = 0; i < 6; i++) {
      const ex = a + mod(i * 11 + Math.sin(tick / 26 + i) * 3, Math.max(1, w))
      const ey = H - mod(tick * 0.35 + i * 7, 32)
      g.fillStyle = rgba(
        i % 2 ? '#d080ff' : '#ff6a7a',
        0.6 * (1 - (H - ey) / 32),
      )
      g.fillRect(ex, ey, 0.8, 0.8)
    }
  } else {
    // Mist curling in the chasm.
    const mist = key === 'boneyard' ? '#8fd6c8' : look.mist
    if (key === 'stormpass') {
      // The wind howling across the gorge.
      g.fillStyle = rgba('#c8d0ff', 0.18)
      for (let i = 0; i < 5; i++) {
        const sx = a - 10 + mod(tick * (1.6 + i * 0.3) + i * 23, w + 20)
        g.fillRect(sx, GROUND_Y + 6 + i * 5, 6 + (i % 3) * 3, 0.5)
      }
    }
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

/** How deep a stage's ledge deck is, from its walking top to the beam under it. */
function deckDepthOf(key: StageKey): number {
  return key === 'belltower' || key === 'abbey' ? 8 : key === 'boneyard' ? 7 : 6
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
          : key === 'stormpass'
            ? STORMWOOD
            : key === 'abbey'
              ? CRYPT
              : WOOD
  const deckDepth = deckDepthOf(key)
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
    } else if (key === 'abbey') {
      // A slim crypt pier of stacked drums, a skull corbel at its head.
      for (let yy = deckDepth; yy < h; yy += 6)
        block(
          b,
          px - 0.5,
          yy,
          5,
          Math.min(6, h - yy),
          CRYPT,
          0.6,
          ((yy / 6) % 2) * 0.2 - 0.1,
        )
      block(b, px - 1.5, h - 3, 7, 3, CRYPT, 0.6, -0.2)
      skull(b, px + 2, deckDepth + 0.5, 1.1, BONE[1], CRYPT[0])
    } else {
      post(b, px, deckDepth, 4, h - deckDepth, postRamp)
      if (key === 'stormpass') {
        // Rope lashings, and a granite footing.
        for (const ry of [deckDepth + 1.5, deckDepth + 3.2]) {
          b.fillStyle = ROPE
          b.fillRect(px - 0.4, ry, 4.8, 0.8)
          b.fillStyle = ROPE_DARK
          b.fillRect(px - 0.4, ry + 0.8, 4.8, 0.3)
        }
        block(b, px - 1.5, h - 3, 7, 3, GRANITE, 0.8)
      }
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
    if (key === 'boneyard' || key === 'abbey') {
      // Chains swagged between the scaffold posts.
      chain(b, p0, top, p1, top, 6)
      chain(b, p0, top + 14, p1, top + 14, 4)
    } else if (key === 'stormpass') {
      // Rope cross-ties, sagging a little.
      for (const [x1, y1, x2, y2] of [
        [p0, top, p1, bottom],
        [p1, top, p0, bottom],
      ] as const) {
        for (const [colour, lw, dy] of [
          [ROPE_DARK, 1.1, 0.3],
          [ROPE, 0.6, 0],
        ] as const) {
          b.strokeStyle = colour
          b.lineWidth = lw
          b.beginPath()
          b.moveTo(x1, y1 + dy)
          b.quadraticCurveTo(
            (x1 + x2) / 2 + 2,
            (y1 + y2) / 2 + 3 + dy,
            x2,
            y2 + dy,
          )
          b.stroke()
        }
      }
    } else {
      brace(b, p0, top, p1, bottom, postRamp, 1.8)
      brace(b, p1, top, p0, bottom, postRamp, 1.8)
    }
  }
  // Beam under the deck.
  if (key !== 'belltower' && key !== 'abbey')
    plank(b, L, deckDepth, w, 3, postRamp, seed + 3)
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
  } else if (key === 'stormpass') {
    // A rope-bridge deck: plank ends lashed between two ropes, the top dead level.
    b.fillStyle = rgba(INK, 0.8)
    b.fillRect(L, 0.4, w, 4.6)
    let x = L
    let i = 0
    while (x < L + w - 0.1) {
      const pw = Math.min(L + w - x, 2.6 + rand() * 1.6)
      const ph = 3.6 + rand() * 1.4
      block(b, x + 0.15, 0, pw - 0.3, ph, STORMWOOD, 0.4, (rand() - 0.5) * 0.6)
      x += pw
      i++
    }
    void i
    for (const [ry, a] of [
      [0.6, 0.95],
      [3.4, 0.8],
    ] as const) {
      b.fillStyle = rgba(ROPE_DARK, a)
      b.fillRect(L - 1, ry, w + 2, 1)
      b.fillStyle = rgba(ROPE, a)
      b.fillRect(L - 1, ry, w + 2, 0.45)
    }
    b.fillStyle = rgba('#c8d0ff', 0.55)
    b.fillRect(L, 0, w, 0.4)
    // Frayed rope ends hanging under.
    b.strokeStyle = ROPE
    b.lineWidth = 0.4
    for (let k = 0; k < w / 14; k++) {
      const rx = L + 3 + rand() * (w - 6)
      b.beginPath()
      b.moveTo(rx, 4.2)
      b.quadraticCurveTo(rx + 1, 6, rx + 0.6, 7 + rand() * 4)
      b.stroke()
    }
  } else if (key === 'abbey') {
    // Crypt corbels: a coping course over brackets, a violet inlay between them.
    let x = L
    while (x < L + w - 0.1) {
      const sw = Math.min(L + w - x, 12 + rand() * 10)
      block(b, x + 0.25, 0, sw - 0.5, 4.5, CRYPT, 0.8, (rand() - 0.5) * 0.4)
      x += sw
    }
    x = L
    while (x < L + w - 0.1) {
      const sw = Math.min(L + w - x, 7 + rand() * 6)
      block(b, x + 0.3, 4.6, sw - 0.6, 3.4, CRYPT, 0.6, -0.35)
      x += sw
    }
    b.fillStyle = rgba(VIOLET, 0.5)
    b.fillRect(L, 4.4, w, 0.4)
    b.fillStyle = rgba(CRYPT[4], 0.85)
    b.fillRect(L, 0, w, 0.6)
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
): Array<{ x: number; y: number; kind: 'lantern' | 'bell' | 'cage' }> {
  const out: Array<{
    x: number
    y: number
    kind: 'lantern' | 'bell' | 'cage'
  }> = []
  const r = hash(bw.x * 3 + bw.y)
  const depth = deckDepthOf(key)
  if (key === 'belltower') {
    out.push({
      x: bw.x + Math.round(bw.w * (0.3 + r * 0.4)),
      y: bw.y + depth + 6,
      kind: 'bell',
    })
  } else if (key === 'abbey') {
    out.push({
      x: bw.x + Math.round(bw.w * (0.25 + r * 0.5)),
      y: bw.y + depth + 5,
      kind: 'cage',
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
      key === 'waterhole'
        ? DOCK
        : key === 'boneyard'
          ? GREYWOOD
          : key === 'stormpass'
            ? STORMWOOD
            : key === 'abbey'
              ? CRYPT
              : WOOD
    post(g, px, GROUND_Y, 4, H - GROUND_Y, ramp)
  }
  for (const f of boardwalkFixtures(key, bw)) {
    const top = bw.y + deckDepthOf(key)
    if (f.kind === 'bell') {
      dropChain(g, f.x, top, f.y)
      const swing = Math.sin(tick / 32 + bw.x) * 0.18
      g.save()
      g.translate(f.x, f.y)
      g.rotate(swing)
      bellShape(g, 0, 0, 9)
      g.restore()
    } else if (f.kind === 'cage') {
      // An iron candle cage, a violet flame inside.
      dropChain(g, f.x, top, f.y)
      const sway = Math.sin(tick / 50 + bw.x) * 0.4
      const cx = f.x + sway
      g.fillStyle = IRON[1]
      g.beginPath()
      g.moveTo(cx - 3, f.y + 2)
      g.lineTo(cx, f.y)
      g.lineTo(cx + 3, f.y + 2)
      g.fill()
      for (const dx of [-2.6, -0.9, 0.9, 2.6])
        g.fillRect(cx + dx - 0.25, f.y + 2, 0.5, 6)
      g.fillRect(cx - 3, f.y + 7.6, 6, 1)
      g.fillStyle = IRON[3]
      g.fillRect(cx - 2.6, f.y + 2, 0.4, 6)
      flame(g, cx, f.y + 7.4, 0.45, tick + bw.x, VIOLET)
      const fl = flicker(tick, bw.x)
      glow(g, cx, f.y + 5, 16 * fl, VIOLET, 0.4)
      glow(g, cx, f.y + 6, 5 * fl, '#ffd0ff', 0.35)
    } else {
      dropChain(g, f.x, top, f.y)
      const sway =
        Math.sin(tick / (key === 'stormpass' ? 22 : 45) + bw.x) *
        (key === 'stormpass' ? 1.4 : 0.5)
      lantern(g, f.x + sway, f.y)
      const fl = flicker(tick, bw.x)
      glow(g, f.x + sway, f.y + 4.5, 20 * fl, AMBER, 0.42)
      glow(g, f.x + sway, f.y + 4.5, 7 * fl, '#fff0b0', 0.35)
    }
  }
}

/** Paint an obstacle in a 16 x 18 box; the solid 12 x 16 block spans x 2..14, y 2..18. */
function paintObstacle(b: Ctx, key: StageKey, v: number) {
  if (key === 'stormpass') return paintCairn(b, v)
  if (key === 'abbey') return paintReliquary(b, v)
  const rand = backdropRng(SEED[key] * 300 + v)
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

const normalised = new WeakMap<
  ReadonlyArray<readonly [number, number]>,
  Array<[number, number]>
>()

/** Ground runs sorted by x, overlapping or touching runs merged (cached per act's array). */
function runsOf(
  ground: ReadonlyArray<readonly [number, number]>,
): Array<[number, number]> {
  let out = normalised.get(ground)
  if (!out) {
    out = []
    const sorted = ground
      .filter(([a, b]) => Number.isFinite(a) && Number.isFinite(b) && b > a)
      .map(([a, b]): [number, number] => [a, b])
      .sort((p, q) => p[0] - q[0])
    for (const run of sorted) {
      const prev = out[out.length - 1]
      if (prev && run[0] <= prev[1]) prev[1] = Math.max(prev[1], run[1])
      else out.push(run)
    }
    normalised.set(ground, out)
  }
  return out
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
  const runs = runsOf(stage.ground)
  const onGround = (x: number) => runs.some(([a, b]) => x >= a && x <= b)
  g.save()
  // Pits first, so the run edges cut over them: before the first run, between runs, and past
  // the last (an act of any length may end on a drop).
  if (!runs.length) drawPit(g, key, x0, x1, tick)
  for (let i = 0; i < runs.length - 1; i++) {
    const a = runs[i]![1]
    const b = runs[i + 1]![0]
    if (b < x0 || a > x1 || b <= a) continue
    drawPit(g, key, a, b, tick)
  }
  const first = runs[0]
  if (first && first[0] > x0)
    drawPit(g, key, Math.min(x0, first[0] - 1), first[0], tick)
  const last = runs[runs.length - 1]
  if (last && last[1] < x1)
    drawPit(g, key, last[1], Math.max(x1, last[1] + 1), tick)
  for (let i = 0; i < runs.length; i++) {
    const [a, b] = runs[i]!
    if (b < x0 || a > x1) continue
    drawRun(g, key, a, b, x0, x1, i > 0 || a > 0, true)
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
  if (key === 'stormpass') paintGateStorm(b, gy, L)
  else if (key === 'abbey') paintGateAbbey(b, gy, L)
  else if (key === 'town' || key === 'waterhole') {
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
  } else if (key === 'abbey') {
    // Ritual fire in iron cups on the pillar caps, the sigils on the pillars breathing.
    for (const bx of [x + 6, x + 66]) {
      g.fillStyle = IRON[1]
      g.beginPath()
      g.moveTo(bx - 4, GROUND_Y - 73)
      g.lineTo(bx + 4, GROUND_Y - 73)
      g.lineTo(bx + 2, GROUND_Y - 70)
      g.lineTo(bx - 2, GROUND_Y - 70)
      g.fill()
      g.fillStyle = IRON[3]
      g.fillRect(bx - 4, GROUND_Y - 73, 8, 0.6)
      flame(g, bx, GROUND_Y - 72.5, 1, tick + bx, VIOLET)
      glow(g, bx, GROUND_Y - 74, 16 * fl, VIOLET, 0.35)
      const p = (Math.sin(tick / 40 + bx) + 1) / 2
      glow(g, bx, GROUND_Y - 38, 7 + p * 3, mix(VIOLET, RITUAL, p), 0.3)
    }
  } else {
    // Lanterns hung from the lintel ends (swinging in Storm Crow Pass's wind).
    const windy = key === 'stormpass'
    const sway = windy
      ? Math.sin(tick / 20) * 1.6 + Math.sin(tick / 7) * 0.4
      : 0
    for (const lx0 of windy ? [x - 3, x + 75] : [x - 1, x + 73]) {
      const lx = lx0 + sway
      if (windy) {
        g.strokeStyle = ROPE
        g.lineWidth = 0.5
        g.beginPath()
        g.moveTo(lx0, GROUND_Y - 70)
        g.lineTo(lx, GROUND_Y - 62)
        g.stroke()
      } else dropChain(g, lx, GROUND_Y - 68, GROUND_Y - 62)
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
  if (key === 'stormpass') {
    // The crow totem's eye catches the lantern light.
    glow(g, x + 36, GROUND_Y - 91.4, 3 + fl, '#ffcf6a', 0.45)
  }
  if (barred) {
    // A faint ward glow on the lock while the boss lives.
    glow(
      g,
      x + 36,
      GROUND_Y - 34,
      10 + 2 * Math.sin(tick / 12),
      key === 'belltower' ? CRIMSON : key === 'abbey' ? VIOLET : CYAN,
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
      post(
        b,
        6,
        8,
        3,
        40,
        stage === 'waterhole'
          ? DOCK
          : stage === 'stormpass'
            ? STORMWOOD
            : stage === 'abbey'
              ? IRON
              : WOOD,
      )
      b.fillStyle = IRON[1]
      b.fillRect(4, 7, 9, 1.4)
      block(
        b,
        4,
        44,
        7,
        4,
        stage === 'stormpass' ? GRANITE : stage === 'abbey' ? CRYPT : SANDSTONE,
        0.6,
      )
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
  kind:
    | 'fence'
    | 'cross'
    | 'stone'
    | 'reeds'
    | 'column'
    | 'spikes'
    | 'grass'
    | 'skulls'
    | 'candles'
    | 'snag'
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
  stormpass: [
    { x: 0, w: 24, kind: 'grass' },
    { x: 40, w: 10, kind: 'stone' },
    { x: 70, w: 24, kind: 'grass' },
    { x: 94, w: 24, kind: 'grass' },
    { x: 150, w: 10, kind: 'snag' },
    { x: 200, w: 26, kind: 'fence' },
    { x: 250, w: 24, kind: 'grass' },
    { x: 300, w: 10, kind: 'stone' },
    { x: 330, w: 24, kind: 'grass' },
  ],
  abbey: [
    { x: 0, w: 10, kind: 'column' },
    { x: 30, w: 20, kind: 'skulls' },
    { x: 80, w: 30, kind: 'spikes' },
    { x: 110, w: 30, kind: 'spikes' },
    { x: 160, w: 16, kind: 'candles' },
    { x: 210, w: 10, kind: 'column' },
    { x: 250, w: 24, kind: 'skulls' },
    { x: 300, w: 30, kind: 'spikes' },
    { x: 350, w: 16, kind: 'candles' },
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
  if (
    kind === 'grass' ||
    kind === 'skulls' ||
    kind === 'candles' ||
    kind === 'snag'
  ) {
    paintFgExtra(b, kind, w, h, f)
  } else if (kind === 'fence') {
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
  // The gaps in the ground, including any drop before the first run or after the last.
  const runs = ground ? runsOf(ground) : null
  const gaps: Array<[number, number]> = []
  if (runs) {
    if (!runs.length) gaps.push([-Infinity, Infinity])
    else {
      gaps.push([-Infinity, runs[0]![0]])
      for (let i = 0; i < runs.length - 1; i++)
        gaps.push([runs[i]![1], runs[i + 1]![0]])
      gaps.push([runs[runs.length - 1]![1], Infinity])
    }
  }
  const pitFade = (sx: number, w: number) => {
    if (!runs) return 1
    // Fade by the distance from the prop to the nearest pit (in the world it sits over).
    const wx0 = camX + sx - 6
    const wx1 = camX + sx + w + 6
    let best = 1
    for (const [a, b] of gaps) {
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
      if (p.kind === 'candles') {
        // The candle stubs still burn.
        for (let x = 1.5; x < p.w - 1; x += 3.2) {
          const top = FG_TOP + h - 6 - ((x * 5) % 4)
          flame(g, sx + x + 0.7, top, 0.3, tick + x * 9 + rep * 31)
        }
        glow(
          g,
          sx + p.w / 2,
          FG_TOP + h - 8,
          12 * flicker(tick, sx),
          CANDLE,
          0.25 * alpha,
        )
      }
    }
  }
}
