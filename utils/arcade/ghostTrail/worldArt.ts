// /utils/arcade/ghostTrail/worldArt.ts
//
// Zuzu: Ghost Trail's campaign pieces that the slice's art modules don't draw yet (conductor kr-arcade
// t-015): solid blocks of any size, moving platforms, ground hazards, updraft columns, the tide, the
// hostile bolts, the act title cards and story pages, and the credits; the River Croc (a ferry mover)
// and the abbey's hanging cage. Also the stand-in bodies for
// foes and bosses whose dedicated art has not landed: each still reads its state (its tell glows) so
// the game is playable while the roster's portraits are painted.
//
// Pure drawing from the arguments; deterministic; headless-safe (plain canvas calls only).

import { drawBaked, densityOf } from './bake'
import { curl, drawBanner, goldGradient, hudText, paintRing } from './hudArt'
import { FONT_HEIGHT, drawText, measureText } from '../font'
import { INK, glow, mix, rgba } from '../snes'
import { drawClod } from './foeArt'
import type { Bolt } from './foes'
import type { Block, Hazard, Mover, StageTheme, Updraft } from './world'

type G = CanvasRenderingContext2D
type Ramp = readonly [string, string, string, string, string]

const W = 320
const H = 240

// --- materials ------------------------------------------------------------------------------------

/** Five-step ramps [ink, shadow, base, light, highlight], matched to stageArt's surfaces. */
const SANDSTONE: Ramp = ['#1c1218', '#3a2a30', '#5e4a48', '#8a7266', '#b8a08a']
const SLATE: Ramp = ['#120e1e', '#252038', '#3c3456', '#5c527a', '#8c82aa']
const RIVERSTONE: Ramp = ['#0e1414', '#1e2c2a', '#3a4a44', '#5e7268', '#94aa9c']
const GRANITE: Ramp = ['#0c0c1e', '#1c2038', '#30365a', '#4c5680', '#8490ba']
const MASONRY: Ramp = ['#1c0e16', '#3a2028', '#5c3838', '#8a5a4c', '#bc8c6c']
const CRYPT: Ramp = ['#0c0610', '#1c1022', '#30203a', '#4c3656', '#7c6080']
const WOOD: Ramp = ['#1e120c', '#3e2616', '#6a4226', '#9a6a3e', '#d0a068']
const GREYWOOD: Ramp = ['#16121c', '#2e2832', '#4a4248', '#726666', '#a89c90']
const DOCK: Ramp = ['#14140e', '#2c2a1c', '#4a442e', '#6e6644', '#9e9468']
const STORMWOOD: Ramp = ['#120e14', '#2a2228', '#4a3c3a', '#6e5c50', '#a48c74']
const CRYPTWOOD: Ramp = ['#0e080c', '#22141a', '#3a2626', '#5a3e36', '#8a6450']
const IRON: Ramp = ['#06060c', '#14141e', '#26263a', '#3e3e58', '#6a6a8a']
const BRONZE: Ramp = ['#1e1008', '#4a2c12', '#7a5222', '#b08440', '#f0d08a']
const BONE = '#d8ccb0'
const ROPE = '#a08a5c'
const ROPE_DARK = '#4e4030'
const VIOLET = '#c46cff'
const RITUAL = '#ff3a5c'
const EMBER = '#ff7a2a'

type Material = {
  stone: Ramp
  wood: Ramp
  /** Growth on the stone (moss, lichen), or none. */
  moss: [string, string] | null
  /** The light catching the edges: moon, storm or candle. */
  rim: string
  /** Hangers: chains, or rope in the pass. */
  rope: boolean
}

const MATERIALS: Record<StageTheme, Material> = {
  town: {
    stone: SANDSTONE,
    wood: WOOD,
    moss: null,
    rim: '#fff4dc',
    rope: false,
  },
  boneyard: {
    stone: SLATE,
    wood: GREYWOOD,
    moss: ['#2e4a3c', '#5a8a6a'],
    rim: '#c8f0e8',
    rope: false,
  },
  waterhole: {
    stone: RIVERSTONE,
    wood: DOCK,
    moss: ['#2f5a2a', '#6aa04a'],
    rim: '#c8f0e8',
    rope: true,
  },
  stormpass: {
    stone: GRANITE,
    wood: STORMWOOD,
    moss: ['#3a4a48', '#7a948a'],
    rim: '#c8d0ff',
    rope: true,
  },
  belltower: {
    stone: MASONRY,
    wood: WOOD,
    moss: null,
    rim: '#ffd8b0',
    rope: false,
  },
  abbey: {
    stone: CRYPT,
    wood: CRYPTWOOD,
    moss: null,
    rim: '#e0b0ff',
    rope: false,
  },
}

function materialFor(theme: StageTheme): Material {
  return MATERIALS[theme] ?? MATERIALS.town
}

/** A deterministic generator for cosmetic layout (never the game's rng). */
function seeded(seed: number): () => number {
  let s = seed >>> 0 || 1
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0
    return s / 4294967296
  }
}

/** A stable 0..1 hash of an integer (never the game's rng). */
function hash(n: number): number {
  let h = Math.imul((n | 0) ^ 0x9e3779b9, 0x85ebca6b)
  h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35)
  h ^= h >>> 16
  return (h >>> 0) / 4294967296
}

function roundRect(
  b: G,
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

/** One dressed stone, lit from the upper left, ink-edged. */
function stone(
  b: G,
  x: number,
  y: number,
  w: number,
  h: number,
  ramp: Ramp,
  r = 1,
  tone = 0,
) {
  if (w <= 0 || h <= 0) return
  const base =
    tone === 0
      ? ramp[2]
      : mix(ramp[2], tone > 0 ? ramp[3] : ramp[1], Math.min(1, Math.abs(tone)))
  roundRect(b, x, y, w, h, r)
  b.fillStyle = base
  b.fill()
  b.save()
  b.clip()
  b.fillStyle = ramp[1]
  b.fillRect(x + w * 0.3, y + h - Math.min(1.4, h * 0.3), w, h)
  b.fillRect(x + w - Math.min(1.2, w * 0.25), y + h * 0.25, 2, h)
  b.fillStyle = ramp[3]
  b.fillRect(x, y, w, Math.min(0.9, h * 0.25))
  b.fillRect(x, y, Math.min(0.8, w * 0.2), h * 0.75)
  b.fillStyle = rgba(ramp[4], 0.6)
  b.fillRect(x + 0.6, y + 0.3, Math.min(w * 0.45, 6), 0.5)
  // Pits and grain in the face, and a chipped corner now and then.
  const k = Math.round(x * 13 + y * 7 + w * 3)
  for (let i = 0; i < Math.min(8, (w * h) / 14); i++) {
    const px = x + 0.8 + hash(k + i * 5) * (w - 1.6)
    const py = y + 0.8 + hash(k + i * 5 + 1) * (h - 1.6)
    b.fillStyle =
      hash(k + i * 5 + 2) < 0.7 ? rgba(ramp[0], 0.45) : rgba(ramp[4], 0.35)
    b.fillRect(px, py, 0.5 + hash(k + i) * 0.6, 0.45)
  }
  if (hash(k + 97) < 0.3 && w > 4 && h > 3) {
    b.fillStyle = rgba(ramp[0], 0.8)
    b.beginPath()
    b.moveTo(x + w, y)
    b.lineTo(x + w - 1.6, y)
    b.lineTo(x + w, y + 1.4)
    b.fill()
  }
  b.restore()
  roundRect(b, x, y, w, h, r)
  b.strokeStyle = rgba(ramp[0], 0.85)
  b.lineWidth = 0.45
  b.stroke()
}

/** A timber board along x, grain and a lit top. */
function board(
  b: G,
  x: number,
  y: number,
  w: number,
  h: number,
  ramp: Ramp,
  seed: number,
) {
  const rand = seeded(seed)
  b.fillStyle = ramp[2]
  b.fillRect(x, y, w, h)
  b.fillStyle = ramp[3]
  b.fillRect(x, y, w, Math.min(0.8, h * 0.3))
  b.fillStyle = ramp[1]
  b.fillRect(x, y + h - Math.min(0.8, h * 0.3), w, Math.min(0.8, h * 0.3))
  b.strokeStyle = rgba(ramp[1], 0.75)
  b.lineWidth = 0.3
  for (let i = 0; i < Math.max(1, h / 1.6); i++) {
    const gy = y + 0.8 + rand() * Math.max(0.1, h - 1.6)
    const gx = x + rand() * w * 0.5
    b.beginPath()
    b.moveTo(gx, gy)
    b.lineTo(gx + w * (0.3 + rand() * 0.5), gy + (rand() - 0.5) * 0.5)
    b.stroke()
  }
  b.strokeStyle = rgba(ramp[0], 0.9)
  b.lineWidth = 0.45
  b.strokeRect(x + 0.2, y + 0.2, w - 0.4, h - 0.4)
}

/** A chain of links from (x1, y1) to (x2, y2), live or baked. */
function chainLine(
  b: G,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  ramp: Ramp = IRON,
) {
  const len = Math.hypot(x2 - x1, y2 - y1)
  const n = Math.max(1, Math.round(len / 1.7))
  const a = Math.atan2(y2 - y1, x2 - x1)
  for (let i = 0; i <= n; i++) {
    const t = i / n
    b.save()
    b.translate(x1 + (x2 - x1) * t, y1 + (y2 - y1) * t)
    b.rotate(a)
    b.strokeStyle = ramp[0]
    b.lineWidth = 0.8
    b.beginPath()
    if (i % 2) b.ellipse(0, 0, 1, 0.45, 0, 0, Math.PI * 2)
    else b.ellipse(0, 0, 1, 0.75, 0, 0, Math.PI * 2)
    b.stroke()
    b.strokeStyle = ramp[3]
    b.lineWidth = 0.3
    b.stroke()
    b.restore()
  }
}

/** A rope from (x1, y1) to (x2, y2): a dark core, a lit twist. */
function ropeLine(
  b: G,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  sag = 0,
) {
  const mx = (x1 + x2) / 2
  const my = (y1 + y2) / 2 + sag
  b.lineCap = 'round'
  b.strokeStyle = ROPE_DARK
  b.lineWidth = 1.1
  b.beginPath()
  b.moveTo(x1, y1)
  b.quadraticCurveTo(mx, my, x2, y2)
  b.stroke()
  b.strokeStyle = ROPE
  b.lineWidth = 0.55
  b.stroke()
  b.lineCap = 'butt'
}

/** A small licking flame with its base at (x, y), `s` about 1 for 7 px tall. */
function flame(
  g: G,
  x: number,
  y: number,
  s: number,
  tick: number,
  hot: string,
  core = '#fff6c8',
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
        ? rgba(mix(hot, '#2a0010', 0.35), 0.8)
        : i === 1
          ? rgba(hot, 0.9)
          : rgba(core, 0.95)
    g.beginPath()
    g.moveTo(x - w, y)
    g.quadraticCurveTo(x - w * 0.9, y - h * 0.5, x + sway, y - h)
    g.quadraticCurveTo(x + w * 0.9, y - h * 0.5, x + w, y)
    g.closePath()
    g.fill()
  }
  g.restore()
}

/**
 * A row of fire tongues from x0 to x1 on `base`, about `height` tall, painted outer to core in
 * three passes so the tongues merge into one burning shape (not an additive white-out).
 */
function fireRow(
  g: G,
  x0: number,
  x1: number,
  base: number,
  height: number,
  tick: number,
  colours: readonly [string, string, string, string],
) {
  const span = Math.max(1, x1 - x0)
  const n = Math.max(2, Math.round(span / 4.5))
  const step = span / n
  g.save()
  for (let pass = 0; pass < 3; pass++) {
    g.fillStyle = colours[pass]!
    g.beginPath()
    for (let i = 0; i <= n; i++) {
      const fx = x0 + i * step
      const k =
        Math.sin(tick / 5 + i * 2.3) * 0.5 +
        Math.sin(tick / 3.1 + i * 1.1) * 0.3
      const hh = height * (0.65 + 0.3 * k + (i % 2) * 0.15) * (1 - pass * 0.3)
      const ww = step * (0.75 - pass * 0.18)
      const sway = Math.sin(tick / 7 + i) * 1.2
      g.moveTo(fx - ww, base)
      g.quadraticCurveTo(fx - ww * 0.8, base - hh * 0.55, fx + sway, base - hh)
      g.quadraticCurveTo(fx + ww * 0.8, base - hh * 0.55, fx + ww, base)
      g.closePath()
    }
    g.fill()
  }
  // White-hot flecks at the roots.
  g.fillStyle = colours[3]
  for (let i = 0; i < n; i++)
    g.fillRect(
      x0 + (i + 0.5) * step - 0.6,
      base - 1.6 - ((tick + i * 3) % 4) * 0.3,
      1.2,
      1.2,
    )
  g.restore()
}

// --- blocks -----------------------------------------------------------------------------------------

/** Moss or lichen over a block's top and down its face (inside its box). */
function growth(b: G, w: number, h: number, m: Material, rand: () => number) {
  if (!m.moss) return
  const [dark, light] = m.moss
  for (let x = 0; x < w; x += 2 + rand() * 5) {
    if (rand() < 0.4) continue
    const mw = Math.min(w - x, 2 + rand() * 5)
    b.fillStyle = dark
    b.fillRect(x, 0, mw, 1.2)
    b.fillStyle = light
    b.fillRect(x + 0.4, 0, mw * 0.6, 0.45)
    if (rand() < 0.5) {
      b.fillStyle = dark
      b.fillRect(x + mw * 0.5, 1.2, 0.6, Math.min(h - 1.5, 1.5 + rand() * 4))
    }
  }
  for (let i = 0; i < (w * h) / 60; i++) {
    b.fillStyle = rgba(light, 0.35)
    b.fillRect(rand() * w, 2 + rand() * (h - 3), 1 + rand(), 0.6)
  }
}

/** Each world's weathering on a block face (inside its box). */
function weather(
  b: G,
  w: number,
  h: number,
  theme: StageTheme,
  m: Material,
  floating: boolean,
  rand: () => number,
) {
  if (theme === 'waterhole') {
    // Damp from the tide line down, algae drips.
    const damp = b.createLinearGradient(0, h * 0.4, 0, h)
    damp.addColorStop(0, rgba('#0a2a2a', 0))
    damp.addColorStop(1, rgba('#0a2a2a', 0.45))
    b.fillStyle = damp
    b.fillRect(0, 0, w, h)
    b.fillStyle = rgba('#2f6a4a', 0.5)
    for (let i = 0; i < w / 6; i++)
      b.fillRect(rand() * w, h * 0.5, 0.6, h * (0.2 + rand() * 0.4))
  } else if (theme === 'stormpass') {
    // Lichen, a quartz vein, and the lightning's edge on the windward side.
    b.fillStyle = rgba('#8aa49a', 0.4)
    for (let i = 0; i < (w * h) / 40; i++)
      b.fillRect(rand() * w, rand() * h, 0.8 + rand(), 0.6)
    b.strokeStyle = rgba('#c0c8f0', 0.3)
    b.lineWidth = 0.4
    b.beginPath()
    b.moveTo(0, h * (0.3 + rand() * 0.4))
    b.lineTo(w * 0.5, h * (0.4 + rand() * 0.3))
    b.lineTo(w, h * (0.5 + rand() * 0.4))
    b.stroke()
    b.fillStyle = rgba(m.rim, 0.45)
    b.fillRect(0, 0, 0.6, h)
  } else if (theme === 'town') {
    // Sand drifted against its foot, wind-pitted faces.
    if (!floating) {
      const sand = b.createLinearGradient(0, h - 4, 0, h)
      sand.addColorStop(0, rgba('#8a6a4a', 0))
      sand.addColorStop(1, rgba('#8a6a4a', 0.5))
      b.fillStyle = sand
      b.fillRect(0, h - 4, w, 4)
    }
    b.fillStyle = rgba(SANDSTONE[0], 0.5)
    for (let i = 0; i < (w * h) / 50; i++)
      b.fillRect(rand() * w, rand() * h, 0.5, 0.5)
  } else if (theme === 'belltower') {
    // Soot climbing from below, and a crack that glows with the heretic's fire.
    const soot = b.createLinearGradient(0, 0, 0, h)
    soot.addColorStop(0, rgba(INK, 0))
    soot.addColorStop(1, rgba(INK, 0.35))
    b.fillStyle = soot
    b.fillRect(0, 0, w, h)
    if (w > 14 && h > 12) {
      const cx = w * (0.3 + rand() * 0.4)
      b.strokeStyle = rgba(INK, 0.95)
      b.lineWidth = 0.6
      b.beginPath()
      b.moveTo(cx, h * 0.2)
      b.lineTo(cx + 2, h * 0.45)
      b.lineTo(cx - 1, h * 0.7)
      b.stroke()
      b.strokeStyle = rgba('#ff5a2a', 0.45)
      b.lineWidth = 0.3
      b.stroke()
    }
  } else if (theme === 'abbey') {
    // Wax run down from the top, a sigil cut into a large face.
    for (let i = 0; i < w / 10; i++) {
      const wx = 1 + rand() * (w - 3)
      b.fillStyle = rgba('#d8c8b0', 0.75)
      b.fillRect(wx, 0, 1.6, 0.7)
      b.fillRect(wx + 0.3, 0.7, 0.6, 1 + rand() * 3)
    }
    if (w >= 18 && h >= 16) {
      const cx = w / 2
      const cy = h / 2 + 1
      const r = Math.min(w, h) * 0.26
      b.strokeStyle = rgba(INK, 0.85)
      b.lineWidth = 0.9
      b.beginPath()
      b.arc(cx, cy, r, 0, Math.PI * 2)
      b.stroke()
      b.strokeStyle = rgba(VIOLET, 0.5)
      b.lineWidth = 0.4
      b.beginPath()
      b.arc(cx, cy, r, 0, Math.PI * 2)
      for (let i = 0; i <= 5; i++) {
        const a = -Math.PI / 2 + (i * 4 * Math.PI) / 5
        const px = cx + Math.cos(a) * r * 0.85
        const py = cy + Math.sin(a) * r * 0.85
        if (i) b.lineTo(px, py)
        else b.moveTo(px, py)
      }
      b.stroke()
    }
  }
  if (floating) {
    // The underside in shadow, roots or drips hanging (all inside the box).
    const under = b.createLinearGradient(0, h - 3, 0, h)
    under.addColorStop(0, rgba(INK, 0))
    under.addColorStop(1, rgba(INK, 0.55))
    b.fillStyle = under
    b.fillRect(0, h - 3, w, 3)
  }
}

/** Dressed stone in a running bond, course by course. */
function paintAshlar(b: G, w: number, h: number, m: Material, seed: number) {
  const rand = seeded(seed)
  b.fillStyle = m.stone[0]
  b.fillRect(0, 0, w, h)
  const rows = Math.max(1, Math.round(h / 8))
  const course = h / rows
  for (let row = 0; row < rows; row++) {
    const yy = row * course
    let xx = row % 2 ? -(3 + rand() * 6) : 0
    while (xx < w - 0.2) {
      const bw = Math.max(5, 8 + rand() * 12)
      const x0 = Math.max(0, xx)
      const x1 = Math.min(w, xx + bw)
      if (w - x1 < 3) {
        stone(
          b,
          x0 + 0.25,
          yy + 0.25,
          w - x0 - 0.5,
          course - 0.5,
          m.stone,
          0.8,
          (rand() - 0.5) * 0.5 + (row === 0 ? 0.3 : 0),
        )
        break
      }
      stone(
        b,
        x0 + 0.25,
        yy + 0.25,
        x1 - x0 - 0.5,
        course - 0.5,
        m.stone,
        0.8,
        (rand() - 0.5) * 0.5 + (row === 0 ? 0.3 : 0),
      )
      xx += bw
    }
  }
}

/** A grave in any size: a tomb chest when wide, a headstone slab when tall. */
function paintGrave(
  b: G,
  w: number,
  h: number,
  theme: StageTheme,
  m: Material,
  seed: number,
) {
  const rand = seeded(seed)
  const r = m.stone
  b.fillStyle = r[0]
  b.fillRect(0, 0, w, h)
  const plinth = Math.min(3, h * 0.2)
  stone(b, 0, h - plinth, w, plinth, r, 0.5, -0.25)
  if (w > h * 1.3) {
    // A tomb chest: lid slab, panelled body, plinth.
    const lid = Math.min(3.5, h * 0.25)
    stone(b, 0, 0, w, lid, r, 0.6, 0.35)
    stone(b, 0.4, lid, w - 0.8, h - lid - plinth, r, 0.4, 0)
    const panels = Math.max(1, Math.round(w / 16))
    const pw = (w - 4) / panels
    for (let i = 0; i < panels; i++) {
      const px = 2 + i * pw
      b.fillStyle = r[1]
      b.fillRect(px + 1, lid + 2, pw - 2, h - lid - plinth - 4)
      b.fillStyle = rgba(r[3], 0.6)
      b.fillRect(px + 1, h - plinth - 2.4, pw - 2, 0.4)
      b.fillRect(px + pw - 1.4, lid + 2, 0.4, h - lid - plinth - 4)
    }
    emblem(
      b,
      w / 2,
      lid + (h - lid - plinth) / 2,
      Math.min(5, (h - lid - plinth) * 0.3),
      theme,
      r,
    )
  } else {
    // A headstone: its slab with bevelled shoulders (inside the box), an emblem, an epitaph.
    stone(b, 0, 0, w, h - plinth + 0.5, r, 1.2, 0.1)
    b.fillStyle = rgba(r[4], 0.55)
    b.fillRect(1, 0.6, w - 2, 0.5)
    emblem(b, w / 2, Math.min(h * 0.32, 7), Math.min(w * 0.3, 5), theme, r)
    b.fillStyle = rgba(r[0], 0.7)
    for (let i = 0; i < Math.min(3, (h - plinth - 12) / 2.6); i++) {
      const lw = w * (0.5 - i * 0.08)
      b.fillRect(w / 2 - lw / 2, h * 0.55 + i * 2.6, lw, 0.6)
    }
  }
  growth(b, w, h, m, rand)
  b.strokeStyle = rgba(INK, 0.9)
  b.lineWidth = 0.6
  b.strokeRect(0.3, 0.3, w - 0.6, h - 0.6)
}

/** The carving on a grave: a cross, the pass's crow, the abbey's skull. */
function emblem(
  b: G,
  cx: number,
  cy: number,
  s: number,
  theme: StageTheme,
  r: Ramp,
) {
  if (theme === 'abbey') {
    b.fillStyle = r[1]
    b.beginPath()
    b.arc(cx, cy, s * 0.6, Math.PI, 0)
    b.lineTo(cx + s * 0.45, cy + s * 0.75)
    b.lineTo(cx - s * 0.45, cy + s * 0.75)
    b.closePath()
    b.fill()
    b.fillStyle = INK
    b.fillRect(cx - s * 0.38, cy - s * 0.05, s * 0.28, s * 0.28)
    b.fillRect(cx + s * 0.1, cy - s * 0.05, s * 0.28, s * 0.28)
  } else if (theme === 'stormpass') {
    b.fillStyle = r[1]
    b.beginPath()
    b.moveTo(cx - s * 0.8, cy + s * 0.3)
    b.quadraticCurveTo(cx - s * 0.2, cy - s * 0.6, cx + s * 0.3, cy - s * 0.4)
    b.lineTo(cx + s * 0.8, cy - s * 0.2)
    b.lineTo(cx + s * 0.3, cy)
    b.quadraticCurveTo(cx, cy + s * 0.4, cx - s * 0.8, cy + s * 0.3)
    b.fill()
  } else {
    b.fillStyle = r[1]
    b.fillRect(cx - s * 0.16, cy - s * 0.8, s * 0.32, s * 1.6)
    b.fillRect(cx - s * 0.55, cy - s * 0.4, s * 1.1, s * 0.3)
    b.fillStyle = rgba(r[4], 0.5)
    b.fillRect(cx - s * 0.16, cy - s * 0.8, s * 0.1, s * 1.6)
  }
}

/** Crates stacked to fill the box, roughly 16 px each. */
function paintCrates(b: G, w: number, h: number, m: Material, seed: number) {
  const cols = Math.max(1, Math.round(w / 16))
  const rows = Math.max(1, Math.round(h / 16))
  const cw = w / cols
  const ch = h / rows
  for (let row = 0; row < rows; row++)
    for (let col = 0; col < cols; col++) {
      const x = col * cw
      const y = row * ch
      const k = seed + row * 13 + col * 7
      const ramp = m.wood
      const planks = Math.max(2, Math.round(ch / 5))
      for (let i = 0; i < planks; i++)
        board(
          b,
          x + 0.4,
          y + 0.4 + (i * (ch - 0.8)) / planks,
          cw - 0.8,
          (ch - 0.8) / planks,
          ramp,
          k + i,
        )
      b.fillStyle = rgba(INK, 0.3)
      b.fillRect(x + 2, y + 2, cw - 4, ch - 4)
      // The X brace.
      b.save()
      b.beginPath()
      b.rect(x + 2, y + 2, cw - 4, ch - 4)
      b.clip()
      for (const [x1, y1, x2, y2] of [
        [x + 2, y + 2.5, x + cw - 2, y + ch - 2.5],
        [x + 2, y + ch - 2.5, x + cw - 2, y + 2.5],
      ] as const) {
        b.strokeStyle = ramp[0]
        b.lineWidth = 2.6
        b.beginPath()
        b.moveTo(x1, y1)
        b.lineTo(x2, y2)
        b.stroke()
        b.strokeStyle = ramp[2]
        b.lineWidth = 1.8
        b.stroke()
        b.strokeStyle = rgba(ramp[3], 0.8)
        b.lineWidth = 0.4
        b.stroke()
        if (hash(k) < 0.5) break
      }
      b.restore()
      // The frame boards and iron corners.
      board(b, x, y, cw, 2.2, ramp, k + 20)
      board(b, x, y + ch - 2.2, cw, 2.2, ramp, k + 21)
      board(b, x, y, 2.2, ch, ramp, k + 22)
      board(b, x + cw - 2.2, y, 2.2, ch, ramp, k + 23)
      for (const [cx, cy] of [
        [x, y],
        [x + cw - 3, y],
        [x, y + ch - 3],
        [x + cw - 3, y + ch - 3],
      ] as const) {
        b.fillStyle = IRON[2]
        b.fillRect(cx, cy, 3, 3)
        b.fillStyle = IRON[4]
        b.fillRect(cx + 1.2, cy + 1.2, 0.7, 0.7)
      }
      b.strokeStyle = INK
      b.lineWidth = 0.6
      b.strokeRect(x + 0.3, y + 0.3, cw - 0.6, ch - 0.6)
      b.fillStyle = rgba(ramp[4], 0.7)
      b.fillRect(x + 2.4, y + 0.35, cw - 4.8, 0.45)
    }
}

/** A column filling its box: cylinder-shaded fluted shaft, banded capital and base. */
function paintPillar(
  b: G,
  w: number,
  h: number,
  theme: StageTheme,
  m: Material,
  floating: boolean,
  seed: number,
) {
  const rand = seeded(seed)
  const r = m.stone
  const shaft = b.createLinearGradient(0, 0, w, 0)
  shaft.addColorStop(0, r[1])
  shaft.addColorStop(0.28, r[3])
  shaft.addColorStop(0.5, r[2])
  shaft.addColorStop(0.85, r[1])
  shaft.addColorStop(1, r[0])
  b.fillStyle = shaft
  b.fillRect(0, 0, w, h)
  // Fluting.
  for (let fx = 2; fx < w - 1.5; fx += 3) {
    b.fillStyle = rgba(r[0], 0.45)
    b.fillRect(fx, 0, 0.6, h)
    b.fillStyle = rgba(r[4], 0.18)
    b.fillRect(fx + 0.6, 0, 0.4, h)
  }
  // Drum joints.
  for (let jy = 14 + rand() * 4; jy < h - 6; jy += 12 + rand() * 4) {
    b.fillStyle = rgba(r[0], 0.8)
    b.fillRect(0, jy, w, 0.6)
    b.fillStyle = rgba(r[4], 0.3)
    b.fillRect(0, jy + 0.6, w, 0.4)
  }
  // Capital (and base): an abacus slab over a rounded echinus band.
  const band = (y: number, hh: number, top: boolean) => {
    const grad = b.createLinearGradient(0, y, 0, y + hh)
    grad.addColorStop(0, top ? r[4] : r[2])
    grad.addColorStop(0.35, r[3])
    grad.addColorStop(1, r[1])
    b.fillStyle = grad
    b.fillRect(0, y, w, hh)
    b.fillStyle = rgba(INK, 0.7)
    b.fillRect(0, top ? y + hh * 0.4 : y + hh * 0.55, w, 0.5)
    b.fillRect(0, top ? y + hh - 0.5 : y, w, 0.5)
  }
  const cap = Math.min(6, h * 0.22)
  band(0, cap, true)
  if (!floating || h > 16)
    band(h - Math.min(5, h * 0.18), Math.min(5, h * 0.18), false)
  if (theme === 'abbey') {
    // A chain wound round the shaft.
    for (let cy = cap + 4; cy < h - 8; cy += 10)
      chainLine(b, 0.5, cy, w - 0.5, cy + 5, IRON)
  } else if (theme === 'stormpass' || theme === 'waterhole') {
    // Rope lashings.
    for (let cy = cap + 6; cy < h - 8; cy += 14) {
      b.fillStyle = ROPE_DARK
      b.fillRect(0, cy, w, 2.2)
      b.fillStyle = ROPE
      for (let k = 0; k < 3; k++) b.fillRect(0, cy + k * 0.7, w, 0.35)
    }
  }
  growth(b, w, h, m, rand)
  b.strokeStyle = rgba(INK, 0.9)
  b.lineWidth = 0.6
  b.strokeRect(0.3, 0.3, w - 0.6, h - 0.6)
}

/** A boulder filling its box: faceted, its corners shaded round, a cap of moss or grit. */
function paintRock(
  b: G,
  w: number,
  h: number,
  theme: StageTheme,
  m: Material,
  seed: number,
) {
  const rand = seeded(seed)
  const r = m.stone
  b.fillStyle = r[2]
  b.fillRect(0, 0, w, h)
  // Facets: big planes, lit toward the upper left.
  const n = Math.max(3, Math.round((w * h) / 90))
  for (let i = 0; i < n; i++) {
    const cx = rand() * w
    const cy = rand() * h
    const s = 4 + rand() * Math.min(w, h) * 0.5
    const lit = (1 - cx / w) * 0.5 + (1 - cy / h) * 0.5
    b.fillStyle = mix(
      r[1],
      r[3],
      Math.max(0, Math.min(1, lit + (rand() - 0.5) * 0.4)),
    )
    b.beginPath()
    b.moveTo(cx - s * 0.5, cy - s * 0.2)
    b.lineTo(cx + s * (0.1 + rand() * 0.3), cy - s * 0.5)
    b.lineTo(cx + s * 0.5, cy + s * 0.15)
    b.lineTo(cx - s * 0.1, cy + s * 0.5)
    b.closePath()
    b.fill()
    b.strokeStyle = rgba(r[0], 0.4)
    b.lineWidth = 0.35
    b.stroke()
  }
  // Round it off: shade the corners and the lower right, so the box reads as a stone.
  const shade = b.createLinearGradient(0, 0, w, h)
  shade.addColorStop(0, rgba(r[4], 0.18))
  shade.addColorStop(0.5, rgba(INK, 0))
  shade.addColorStop(1, rgba(INK, 0.45))
  b.fillStyle = shade
  b.fillRect(0, 0, w, h)
  for (const [cx, cy] of [
    [0, h],
    [w, h],
    [w, 0],
    [0, 0],
  ] as const) {
    const cr = Math.min(w, h) * 0.4
    const grad = b.createRadialGradient(cx, cy, 0, cx, cy, cr)
    grad.addColorStop(0, rgba(r[0], 0.85))
    grad.addColorStop(1, rgba(r[0], 0))
    b.fillStyle = grad
    b.fillRect(cx - cr, cy - cr, cr * 2, cr * 2)
  }
  // Cracks.
  b.strokeStyle = rgba(r[0], 0.9)
  b.lineWidth = 0.5
  for (let i = 0; i < Math.max(1, w / 14); i++) {
    let cx = rand() * w
    let cy = 2 + rand() * h * 0.4
    b.beginPath()
    b.moveTo(cx, cy)
    for (let k = 0; k < 3; k++) {
      cx += (rand() - 0.5) * 4
      cy += 2 + rand() * 3
      b.lineTo(cx, Math.min(h, cy))
    }
    b.stroke()
  }
  // The top: a lit lip, then grit or moss.
  b.fillStyle = r[3]
  b.fillRect(0, 0, w, 1.2)
  b.fillStyle = rgba(r[4], 0.8)
  b.fillRect(1, 0, w - 2, 0.45)
  if (theme === 'boneyard') {
    b.fillStyle = BONE
    b.fillRect(w * 0.6, h * 0.55, 3, 0.8)
    b.beginPath()
    b.arc(w * 0.6, h * 0.55 + 0.4, 0.7, 0, Math.PI * 2)
    b.arc(w * 0.6 + 3, h * 0.55 + 0.4, 0.7, 0, Math.PI * 2)
    b.fill()
  }
  growth(b, w, h, m, rand)
  b.strokeStyle = rgba(INK, 0.85)
  b.lineWidth = 0.55
  b.strokeRect(0.3, 0.3, w - 0.6, h - 0.6)
}

function paintBlock(
  b: G,
  look: NonNullable<Block['look']>,
  w: number,
  h: number,
  theme: StageTheme,
  floating: boolean,
  seed: number,
) {
  const m = materialFor(theme)
  const rand = seeded(seed + 99)
  if (look === 'crate') paintCrates(b, w, h, m, seed)
  else if (look === 'pillar') paintPillar(b, w, h, theme, m, floating, seed)
  else if (look === 'rock') paintRock(b, w, h, theme, m, seed)
  else if (look === 'grave') paintGrave(b, w, h, theme, m, seed)
  else {
    paintAshlar(b, w, h, m, seed)
    growth(b, w, h, m, rand)
    b.strokeStyle = rgba(INK, 0.9)
    b.lineWidth = 0.6
    b.strokeRect(0.3, 0.3, w - 0.6, h - 0.6)
  }
  if (look !== 'crate') weather(b, w, h, theme, m, floating, rand)
  // The walkable top always catches the light.
  b.fillStyle = rgba(m.rim, 0.5)
  b.fillRect(0.5, 0, w - 1, 0.4)
}

/**
 * A solid block (world space) of any size, painted to its look in its world's materials: dressed
 * stone, a grave (headstone or tomb chest), stacked crates, a column, or a boulder. Its silhouette
 * is exactly its collision box (x..x+w, top..top+h); a contact shadow falls on the ground beside a
 * standing block, and a floating one in the bell tower or abbey hangs from chains.
 */
export function drawBlock(g: G, b: Block, top: number, theme: StageTheme) {
  const look = b.look ?? 'stone'
  const floating = b.y !== undefined
  const w = Math.max(1, b.w)
  const h = Math.max(1, b.h)
  const v = Math.floor(hash(Math.round(b.x) * 7 + Math.round(top) * 3) * 3)
  const key = MATERIALS[theme] ? theme : 'town'
  g.save()
  if (!floating) {
    // Contact shadow on the ground, falling away from the moon.
    const sh = g.createLinearGradient(b.x + w, 0, b.x + w + 6, 0)
    sh.addColorStop(0, rgba(INK, 0.45))
    sh.addColorStop(1, rgba(INK, 0))
    g.fillStyle = sh
    g.fillRect(b.x + w, top + h - 1.5, 6, 1.5)
  } else if (key === 'abbey' || key === 'belltower') {
    for (const cx of [b.x + 2.5, b.x + w - 2.5])
      chainLine(g, cx, Math.min(0, top - 120), cx, top)
  }
  drawBaked(
    g,
    `gt-block-${key}-${look}-${w}x${h}-${floating ? 'f' : 'g'}-${v}`,
    b.x,
    top,
    w,
    h,
    (c) =>
      paintBlock(
        c,
        look,
        w,
        h,
        key,
        floating,
        Math.round(w * 31 + h * 17 + v * 101),
      ),
  )
  g.restore()
}

// --- movers -----------------------------------------------------------------------------------------

/** Each mover look's painted depth below its walkable top. */
function moverDepth(
  look: Exclude<NonNullable<Mover['look']>, 'croc'> | 'slab',
): number {
  return look === 'raft'
    ? 8
    : look === 'lift'
      ? 9
      : look === 'beam'
        ? 7
        : look === 'bell'
          ? 6
          : 7
}

function paintMover(
  b: G,
  look: Exclude<NonNullable<Mover['look']>, 'croc'> | 'slab',
  w: number,
  theme: StageTheme,
) {
  const m = materialFor(theme)
  const d = moverDepth(look)
  const rand = seeded(w * 13 + look.length * 7)
  if (look === 'raft') {
    // Log ends lashed in a row under a plank deck.
    const logs = Math.max(2, Math.round(w / 6))
    const lw = w / logs
    for (let i = 0; i < logs; i++) {
      const cx = i * lw + lw / 2
      const cy = 5.2
      const r = lw / 2 - 0.2
      b.fillStyle = DOCK[1]
      b.beginPath()
      b.ellipse(cx, cy, r, 2.8, 0, 0, Math.PI * 2)
      b.fill()
      b.fillStyle = mix(DOCK[3], '#b8a070', 0.4)
      b.beginPath()
      b.ellipse(cx - 0.2, cy - 0.2, r * 0.75, 2.1, 0, 0, Math.PI * 2)
      b.fill()
      b.strokeStyle = rgba(DOCK[1], 0.8)
      b.lineWidth = 0.3
      b.beginPath()
      b.ellipse(cx - 0.2, cy - 0.2, r * 0.4, 1.1, 0, 0, Math.PI * 2)
      b.stroke()
      b.strokeStyle = INK
      b.lineWidth = 0.45
      b.beginPath()
      b.ellipse(cx, cy, r, 2.8, 0, 0, Math.PI * 2)
      b.stroke()
    }
    let x = 0
    let i = 0
    while (x < w - 0.1) {
      const pw = Math.min(w - x, 8 + rand() * 6)
      board(b, x, 0, pw, 2.4, DOCK, 40 + i)
      x += pw
      i++
    }
    b.fillStyle = ROPE
    for (let lx = 3; lx < w - 2; lx += 10) {
      b.fillRect(lx, 0, 1.2, 7)
      b.fillStyle = ROPE_DARK
      b.fillRect(lx + 1.2, 0, 0.4, 7)
      b.fillStyle = ROPE
    }
    // Weed trailing from the logs.
    b.fillStyle = '#2f5a3a'
    for (let k = 0; k < w / 8; k++) b.fillRect(rand() * w, 6.5, 0.6, 1.5)
  } else if (look === 'lift') {
    // A planked deck in an iron frame, a hanging truss under it.
    let x = 0
    let i = 0
    while (x < w - 0.1) {
      const pw = Math.min(w - x, 6 + rand() * 5)
      board(b, x, 0, pw, 3, m.wood, 60 + i)
      x += pw
      i++
    }
    b.fillStyle = IRON[1]
    b.fillRect(0, 3, w, 1.6)
    b.fillStyle = IRON[3]
    b.fillRect(0, 3, w, 0.4)
    b.strokeStyle = IRON[1]
    b.lineWidth = 1
    b.beginPath()
    b.moveTo(1, 4.4)
    b.lineTo(w / 2, d - 0.6)
    b.lineTo(w - 1, 4.4)
    b.stroke()
    b.strokeStyle = IRON[3]
    b.lineWidth = 0.3
    b.stroke()
    b.fillStyle = IRON[2]
    b.beginPath()
    b.arc(w / 2, d - 1.2, 1.1, 0, Math.PI * 2)
    b.fill()
    for (const cx of [1.5, w - 3]) {
      b.fillStyle = IRON[2]
      b.fillRect(cx, 0, 1.6, 4.6)
      b.fillStyle = IRON[4]
      b.fillRect(cx + 0.3, 0.6, 0.5, 0.5)
    }
  } else if (look === 'beam' || look === 'bell') {
    // A heavy timber beam with iron straps.
    const bh = look === 'bell' ? 5 : 6
    board(b, 0, 0, w, bh, m.wood, 77)
    b.fillStyle = rgba(m.wood[4], 0.8)
    b.fillRect(0.5, 0, w - 1, 0.5)
    for (const sx of [2, w - 5, ...(w > 40 ? [w / 2 - 1.5] : [])]) {
      b.fillStyle = IRON[1]
      b.fillRect(sx, 0, 3, bh)
      b.fillStyle = IRON[3]
      b.fillRect(sx, 0, 3, 0.4)
      b.fillStyle = IRON[4]
      b.fillRect(sx + 1.2, bh / 2 - 0.3, 0.6, 0.6)
    }
    b.fillStyle = rgba(INK, 0.5)
    b.fillRect(0, bh, w, d - bh)
  } else {
    // A floating slab of the world's stone.
    let x = 0
    while (x < w - 0.1) {
      const sw = Math.min(w - x, 10 + rand() * 8)
      stone(
        b,
        x + 0.2,
        0,
        sw - 0.4,
        4.4,
        m.stone,
        0.8,
        (rand() - 0.5) * 0.4 + 0.2,
      )
      x += sw
    }
    x = 0
    while (x < w - 0.1) {
      const sw = Math.min(w - x, 6 + rand() * 6)
      stone(b, x + 0.3, 4.3, sw - 0.6, 2.7, m.stone, 0.6, -0.35)
      x += sw
    }
  }
  b.fillStyle = rgba(m.rim, 0.55)
  b.fillRect(0.5, 0, w - 1, 0.35)
}

/**
 * A moving platform at its current position (world space): a raft of lashed logs, a rope or chain
 * lift, a bell hung under a beam, a swinging beam, a stone slab, or the River Croc (`state` says
 * how far he has surfaced, which way he faces and whether he is swimming). Its walkable top is exactly y
 * from x to x + w; ropes and chains run up off the top of the screen.
 */
export function drawMover(
  g: G,
  m: Mover,
  x: number,
  y: number,
  theme: StageTheme,
  tick: number,
  state: MoverState = {},
) {
  if (m.look === 'croc') {
    drawCroc(g, x, y, Math.max(24, m.w), tick, state)
    return
  }
  const key = MATERIALS[theme] ? theme : 'town'
  const mat = materialFor(key)
  const look = m.look ?? 'slab'
  const w = Math.max(4, m.w)
  const d = moverDepth(look)
  g.save()
  // Hangers first, behind the platform.
  if (look === 'lift' || look === 'beam' || look === 'bell') {
    const ends =
      look === 'lift' ? [x + 2.3, x + w - 2.2] : [x + 3.5, x + w - 3.5]
    for (const hx of ends) {
      if (mat.rope) ropeLine(g, hx, y + 1, hx, -8)
      else chainLine(g, hx, y + 1, hx, -8)
    }
  }
  if (look === 'raft') {
    // The raft sits in the water: rings spread from its sides.
    for (const side of [-1, 1]) {
      const sx = side < 0 ? x : x + w
      for (let i = 0; i < 2; i++) {
        const k = (((tick / 30 + i * 0.5) % 1) + 1) % 1
        g.strokeStyle = rgba('#c8fff4', 0.5 * (1 - k))
        g.lineWidth = 0.5
        g.beginPath()
        g.ellipse(
          sx + side * k * 6,
          y + 7,
          1 + k * 5,
          0.6 + k,
          0,
          0,
          Math.PI * 2,
        )
        g.stroke()
      }
    }
  }
  drawBaked(g, `gt-mover-${key}-${look}-${w}`, x, y, w, d, (c) =>
    paintMover(c, look, w, key),
  )
  if (look === 'bell') {
    // The bell swings under the beam.
    const swing = Math.sin(tick / 22 + x * 0.01) * 0.2
    const s = Math.min(22, Math.max(12, w * 0.45))
    g.save()
    g.translate(x + w / 2, y + 5)
    g.rotate(swing)
    g.fillStyle = IRON[1]
    g.fillRect(-1.5, 0, 3, 2.5)
    bigBellLive(g, 0, 2, s)
    g.restore()
  }
  g.restore()
}

/** A bronze bell, crown at (cx, top), `s` wide, for the movers. */
function bigBellLive(g: G, cx: number, top: number, s: number) {
  const h = s * 1.05
  g.beginPath()
  g.moveTo(cx - s * 0.18, top + s * 0.08)
  g.quadraticCurveTo(cx - s * 0.36, top + h * 0.2, cx - s * 0.36, top + h * 0.6)
  g.quadraticCurveTo(cx - s * 0.4, top + h * 0.85, cx - s * 0.52, top + h)
  g.lineTo(cx + s * 0.52, top + h)
  g.quadraticCurveTo(cx + s * 0.4, top + h * 0.85, cx + s * 0.36, top + h * 0.6)
  g.quadraticCurveTo(
    cx + s * 0.36,
    top + h * 0.2,
    cx + s * 0.18,
    top + s * 0.08,
  )
  g.closePath()
  const grad = g.createLinearGradient(cx - s * 0.5, 0, cx + s * 0.5, 0)
  grad.addColorStop(0, BRONZE[2])
  grad.addColorStop(0.25, BRONZE[4])
  grad.addColorStop(0.45, BRONZE[3])
  grad.addColorStop(1, BRONZE[0])
  g.fillStyle = grad
  g.fill()
  g.strokeStyle = INK
  g.lineWidth = 0.5
  g.stroke()
  g.fillStyle = BRONZE[1]
  g.fillRect(cx - s * 0.5, top + h - s * 0.1, s, s * 0.1)
  g.fillStyle = rgba(BRONZE[0], 0.7)
  g.fillRect(cx - s * 0.36, top + h * 0.3, s * 0.72, 0.6)
  g.fillRect(cx - s * 0.4, top + h * 0.75, s * 0.8, 0.6)
  g.fillStyle = IRON[1]
  g.beginPath()
  g.arc(cx, top + h + 0.6, s * 0.08, 0, Math.PI * 2)
  g.fill()
}

// --- the River Croc (Stage 3's ferry) and the abbey cage (Stage 6's captive) ------------------------

/** A ferry's live state for drawing: how far it has surfaced, which way it faces, under way. */
export type MoverState = { rise?: number; face?: 1 | -1; swimming?: boolean }

/** The croc's hide [ink, shadow, base, light, highlight], a pale belly, and his eyes. */
const CROC: Ramp = ['#0a1410', '#1c3a1e', '#386a2e', '#64a044', '#b4dc7c']
const CROC_BELLY = '#e2d6a0'
const CROC_EYE = '#ffd23c'
/** His painted saddle: the river folk's ochre and red bands across his back. */
const CROC_PAINT = ['#d0762a', '#f0c050', '#b83a2c'] as const
/** Where the pits' water stands below the walk line (stageArt drawPit). */
const CROC_WATERLINE = 8
/** The croc bake's box: from this far above his walk line, this tall. */
const CROC_ABOVE = 12
const CROC_TALL = 30

/** The croc's back line (local y, 0 = his walk line) at u = 0 (tail tip) .. 1 (snout tip). */
function crocBack(u: number): number {
  if (u < 0.3) return 5.4 - Math.pow(u / 0.3, 0.7) * 5.2
  if (u < 0.68) return 0.2 - Math.sin(((u - 0.3) / 0.38) * Math.PI) * 0.8
  if (u < 0.78) return 0.2 - ((u - 0.68) / 0.1) * 1.4
  return -1.2 + Math.pow((u - 0.78) / 0.22, 1.4) * 3.4
}

/** His belly line above the water (local y) at u. */
function crocBelly(u: number): number {
  if (u < 0.3) return CROC_WATERLINE + 0.5
  if (u > 0.78) return 4.4 + (1 - u) * 6
  return CROC_WATERLINE + 1.2
}

/** The River Croc facing right, his walk line at local y = CROC_ABOVE (baked; see drawCroc). */
function paintCroc(b: G, w: number) {
  const top = CROC_ABOVE
  const wl = top + CROC_WATERLINE
  const at = (u: number) => u * w
  const back = (u: number) => top + crocBack(u)
  // Under the water: his bulk and his legs, seen dim through it.
  b.fillStyle = rgba(CROC[1], 0.7)
  b.beginPath()
  b.ellipse(at(0.5), wl + 2.5, w * 0.3, 5.5, 0, 0, Math.PI * 2)
  b.fill()
  for (const [u, s] of [
    [0.32, -1],
    [0.66, 1],
  ] as const) {
    b.fillStyle = rgba(CROC[1], 0.65)
    b.beginPath()
    b.moveTo(at(u) - 2.5, wl + 2)
    b.lineTo(at(u) + 2.5, wl + 2)
    b.lineTo(at(u) + s * 4 + 2, wl + 8)
    b.lineTo(at(u) + s * 4 - 2, wl + 8.6)
    b.fill()
    // Webbed toes.
    b.fillStyle = rgba(CROC[2], 0.6)
    for (let t = -1; t <= 1; t++)
      b.fillRect(at(u) + s * 4 + t * 1.4 - 0.5, wl + 8.2, 1, 1.6)
  }
  // A front leg up at the waterline, the elbow out: he is paddling.
  b.fillStyle = CROC[2]
  b.beginPath()
  b.moveTo(at(0.64), wl - 3)
  b.quadraticCurveTo(at(0.7) + 1, wl - 2, at(0.7) + 2, wl + 1.5)
  b.lineTo(at(0.66), wl + 1.5)
  b.closePath()
  b.fill()
  b.strokeStyle = rgba(CROC[0], 0.8)
  b.lineWidth = 0.5
  b.stroke()
  // The silhouette above the waterline: tail, body and head along the back line.
  const outline = () => {
    b.beginPath()
    b.moveTo(0, back(0) + 0.6)
    for (let i = 1; i <= 48; i++) b.lineTo(at(i / 48), back(i / 48))
    // The snout's round tip, then back along the jaw and belly.
    b.quadraticCurveTo(w + 0.8, back(1) + 1.6, w - 0.4, top + 4.6)
    for (let i = 48; i >= 0; i--) b.lineTo(at(i / 48), top + crocBelly(i / 48))
    b.closePath()
  }
  outline()
  const hide = b.createLinearGradient(0, top - 2, 0, wl + 1)
  hide.addColorStop(0, CROC[3])
  hide.addColorStop(0.35, CROC[2])
  hide.addColorStop(1, CROC[1])
  b.fillStyle = hide
  b.fill()
  b.save()
  outline()
  b.clip()
  // His pale belly scales along the waterline, ribbed.
  const belly = b.createLinearGradient(0, wl - 2.4, 0, wl + 1)
  belly.addColorStop(0, rgba(CROC_BELLY, 0))
  belly.addColorStop(0.5, rgba(CROC_BELLY, 0.65))
  belly.addColorStop(1, rgba(CROC_BELLY, 0.8))
  b.fillStyle = belly
  b.fillRect(at(0.26), wl - 2.4, at(0.56), 3.6)
  b.fillStyle = rgba('#7a6a40', 0.5)
  for (let u = 0.3; u < 0.8; u += 0.03) b.fillRect(at(u), wl - 1.4, 0.4, 2.6)
  // Flank scales: rows of rounded plates, each lit on top and shaded under.
  for (let row = 0; row < 3; row++) {
    for (let u = 0.03 + (row % 2) * 0.018; u < 0.8; u += 0.036) {
      const y = back(u) + 1.8 + row * 1.9
      if (y > wl - 2.6) continue
      const pw = at(0.028)
      b.fillStyle = rgba(CROC[0], 0.45)
      b.fillRect(at(u), y + 1.1, pw, 0.45)
      b.fillStyle = rgba(CROC[4], 0.28)
      b.fillRect(at(u) + 0.3, y, pw - 0.6, 0.4)
    }
  }
  // His saddle cloth: a rust blanket over the broad of his back, where a rider stands, with the
  // orange zigzag of Zuzu's own poncho woven along its hem.
  const s0 = at(0.37)
  const s1 = at(0.63)
  const hem = top + 5.2
  b.fillStyle = CROC_PAINT[0]
  b.beginPath()
  b.moveTo(s0, back(0.37) - 0.4)
  b.lineTo(s1, back(0.63) - 0.4)
  b.lineTo(s1 + 0.6, hem)
  b.lineTo(s0 - 0.6, hem)
  b.closePath()
  b.fill()
  b.fillStyle = rgba('#ffffff', 0.25)
  b.fillRect(s0, top - 1, s1 - s0, 0.6)
  b.fillStyle = CROC_PAINT[2]
  b.fillRect(s0 - 0.6, hem - 2.6, s1 - s0 + 1.2, 2.6)
  b.strokeStyle = CROC_PAINT[1]
  b.lineWidth = 0.55
  b.beginPath()
  for (let i = 0, zx = s0; zx <= s1 + 0.1; zx += 1.4, i++)
    if (i === 0) b.moveTo(zx, hem - 2.2)
    else b.lineTo(zx, i % 2 ? hem - 0.6 : hem - 2.2)
  b.stroke()
  b.fillStyle = rgba(CROC[0], 0.5)
  b.fillRect(s0 - 0.6, hem - 0.3, s1 - s0 + 1.2, 0.5)
  b.fillRect(s1 - 0.4, top - 1, 0.6, hem - top + 1)
  // Tassels at its corners.
  b.fillStyle = CROC_PAINT[1]
  for (const tx of [s0 - 0.6, s1]) b.fillRect(tx, hem, 0.7, 1.6)
  // The jaw: a long dark line from the snout back under the eye, curling up into a smile.
  b.strokeStyle = CROC[0]
  b.lineWidth = 0.7
  b.beginPath()
  b.moveTo(w - 0.8, top + 3.4)
  b.quadraticCurveTo(at(0.88), top + 4.6, at(0.8), top + 4.2)
  b.quadraticCurveTo(at(0.765), top + 3.9, at(0.77), top + 2.6)
  b.stroke()
  // A row of small white teeth peeking over the lip.
  b.fillStyle = '#fbf6e4'
  for (let u = 0.815; u < 0.985; u += 0.035) {
    const ty = top + 3.6 + (u - 0.8) * 4
    b.beginPath()
    b.moveTo(at(u), ty)
    b.lineTo(at(u) + 0.55, ty + 1.2)
    b.lineTo(at(u) + 1.1, ty)
    b.fill()
  }
  // The lit top of the head and snout, and the moon down his back.
  b.fillStyle = rgba(CROC[4], 0.7)
  for (let u = 0.8; u < 0.98; u += 0.01)
    b.fillRect(at(u), back(u) + 0.2, at(0.012), 0.6)
  b.fillStyle = rgba('#d8fff0', 0.55)
  for (let u = 0.06; u < 0.78; u += 0.01)
    b.fillRect(at(u), back(u) + 0.1, at(0.012), 0.45)
  b.restore()
  outline()
  b.strokeStyle = INK
  b.lineWidth = 0.6
  b.stroke()

  // Scutes: a double row of ridged plates down the back, a single tall crest down the tail.
  for (let u = 0.03; u < 0.74; u += 0.032) {
    const y = back(u)
    const tail = u < 0.3
    const tall = tail ? 1.8 + (u / 0.3) * 0.6 : 1.2
    for (const off of tail ? [0] : [-0.8, 1.2]) {
      const sx = at(u) + off
      b.fillStyle = CROC[1]
      b.beginPath()
      b.moveTo(sx - 1.1, y + 0.6)
      b.lineTo(sx, y - tall)
      b.lineTo(sx + 1.3, y + 0.6)
      b.fill()
      b.strokeStyle = rgba(INK, 0.8)
      b.lineWidth = 0.35
      b.stroke()
      b.fillStyle = CROC[4]
      b.fillRect(sx - 0.55, y - tall + 0.7, 0.5, tall * 0.55)
    }
  }
  // Nostrils on a knob at the snout tip.
  const nx = w - 3
  const ny = back(0.96) - 0.2
  b.fillStyle = CROC[3]
  b.beginPath()
  b.ellipse(nx, ny, 2.2, 1.4, 0, Math.PI, 0)
  b.fill()
  b.strokeStyle = INK
  b.lineWidth = 0.4
  b.stroke()
  b.fillStyle = CROC[0]
  b.fillRect(nx - 1.4, ny - 0.8, 0.8, 0.6)
  b.fillRect(nx + 0.4, ny - 0.8, 0.8, 0.6)
  // The eye: a big dome on the head, a gold iris, a soft slit, a sleepy lid. Kind, unhurried.
  const ex = at(0.76)
  const ey = top - 4.6
  b.fillStyle = CROC[2]
  b.beginPath()
  b.ellipse(ex, ey + 1.6, 4.2, 4, 0, Math.PI, 0)
  b.lineTo(ex + 4.2, top + 1)
  b.lineTo(ex - 4.2, top + 1)
  b.fill()
  b.strokeStyle = INK
  b.lineWidth = 0.55
  b.beginPath()
  b.ellipse(ex, ey + 1.6, 4.2, 4, 0, Math.PI, 0)
  b.stroke()
  b.fillStyle = '#fff6d0'
  b.beginPath()
  b.ellipse(ex + 0.6, ey + 1, 2.7, 2.3, 0, 0, Math.PI * 2)
  b.fill()
  b.fillStyle = CROC_EYE
  b.beginPath()
  b.ellipse(ex + 0.9, ey + 1.1, 2.2, 2, 0, 0, Math.PI * 2)
  b.fill()
  b.fillStyle = '#c88a1c'
  b.fillRect(ex - 0.6, ey + 2.2, 3, 0.7)
  b.fillStyle = CROC[0]
  b.fillRect(ex + 0.7, ey - 0.6, 0.9, 3.4)
  b.fillStyle = '#ffffff'
  b.fillRect(ex - 0.4, ey - 0.1, 0.9, 0.9)
  // The lid over the top of the eye.
  b.fillStyle = CROC[3]
  b.beginPath()
  b.ellipse(ex + 0.4, ey - 0.2, 3.2, 1.7, 0, Math.PI, 0)
  b.fill()
  b.strokeStyle = CROC[0]
  b.lineWidth = 0.5
  b.beginPath()
  b.moveTo(ex - 2.8, ey - 0.1)
  b.quadraticCurveTo(ex + 0.4, ey + 0.9, ex + 3.6, ey - 0.1)
  b.stroke()
  b.fillStyle = rgba(CROC[4], 0.9)
  b.fillRect(ex - 1.8, ey - 1.6, 2.6, 0.5)
  // The waterline lapping his flank.
  b.fillStyle = rgba('#5fd0cc', 0.85)
  b.fillRect(0, wl - 0.2, w, 0.8)
  b.fillStyle = rgba('#d4fff6', 0.7)
  for (let u = 0.05; u < 1; u += 0.12) b.fillRect(at(u), wl - 0.4, 2.4, 0.5)
}

/** Only his eyes and nostrils above the water: waiting, wary of the squad on the bank. */
function crocPeek(g: G, x: number, y: number, w: number, tick: number) {
  const wl = y + CROC_WATERLINE
  const ex = x + w * 0.76
  const bob = Math.sin(tick / 18) * 0.5
  // His long shadow under the water.
  g.fillStyle = rgba(CROC[0], 0.45)
  g.beginPath()
  g.ellipse(x + w * 0.5, wl + 4, w * 0.46, 3.4, 0, 0, Math.PI * 2)
  g.fill()
  // One wary eye above the water, and the knob of his nostrils.
  g.fillStyle = CROC[2]
  g.beginPath()
  g.ellipse(ex, wl + bob, 3.6, 3.2, 0, Math.PI, 0)
  g.fill()
  g.strokeStyle = INK
  g.lineWidth = 0.5
  g.stroke()
  g.fillStyle = CROC_EYE
  g.beginPath()
  g.ellipse(ex + 0.6, wl - 1 + bob, 1.9, 1.3, 0, 0, Math.PI * 2)
  g.fill()
  g.fillStyle = CROC[0]
  g.fillRect(ex + 0.5, wl - 2.2 + bob, 0.8, 2.4)
  g.fillStyle = '#ffffff'
  g.fillRect(ex - 0.6, wl - 1.8 + bob, 0.7, 0.7)
  g.fillStyle = CROC[3]
  g.beginPath()
  g.ellipse(ex + 0.3, wl - 2 + bob, 2.8, 1.2, 0, Math.PI, 0)
  g.fill()
  g.fillStyle = CROC[3]
  g.beginPath()
  g.ellipse(x + w - 3, wl + bob, 2.2, 1.3, 0, Math.PI, 0)
  g.fill()
  g.fillStyle = CROC[0]
  g.fillRect(x + w - 4, wl - 0.8 + bob, 0.7, 0.5)
  g.fillRect(x + w - 2.6, wl - 0.8 + bob, 0.7, 0.5)
  // Bubbles from under the water, and rings round his eye.
  for (let i = 0; i < 3; i++) {
    const k = (((tick / 50 + i / 3) % 1) + 1) % 1
    g.strokeStyle = rgba('#e8fffa', 0.7 * (1 - k))
    g.lineWidth = 0.45
    g.beginPath()
    g.arc(
      x + w * (0.3 + i * 0.12),
      wl + 3 - k * 3.4,
      0.6 + k * 0.5,
      0,
      Math.PI * 2,
    )
    g.stroke()
  }
  for (let i = 0; i < 2; i++) {
    const k = (((tick / 70 + i * 0.5) % 1) + 1) % 1
    g.strokeStyle = rgba('#c8fff4', 0.55 * (1 - k))
    g.lineWidth = 0.5
    g.beginPath()
    g.ellipse(ex, wl + 0.4, 4 + k * 8, 0.7 + k * 1.2, 0, 0, Math.PI * 2)
    g.stroke()
  }
}

/**
 * The River Croc (a ferry mover, Stage 3): a big, friendly, painted crocodile carrying a rider on
 * his back, his eyes up above the water and a slow bob. His walkable back is exactly y from x to
 * x + w. Before he surfaces (rise 0) only his eyes show; as he rises he lifts out of the water.
 */
function drawCroc(
  g: G,
  x: number,
  y: number,
  w: number,
  tick: number,
  s: MoverState,
) {
  const rise = s.rise ?? 1
  const face = s.face ?? 1
  if (rise <= 0) {
    crocPeek(g, x, y, w, tick)
    return
  }
  const bob = Math.sin(tick / 22 + x * 0.02) * 0.6
  const sink = (1 - rise) * (CROC_WATERLINE + 2)
  const wl = y + CROC_WATERLINE
  g.save()
  // Rings spread from his flanks; a wake behind him when he swims.
  for (const side of [-1, 1]) {
    const sx = side < 0 ? x : x + w
    for (let i = 0; i < 2; i++) {
      const k = (((tick / 34 + i * 0.5) % 1) + 1) % 1
      g.strokeStyle = rgba('#c8fff4', 0.45 * (1 - k))
      g.lineWidth = 0.5
      g.beginPath()
      g.ellipse(
        sx + side * k * 7,
        wl + 0.6,
        1 + k * 6,
        0.6 + k,
        0,
        0,
        Math.PI * 2,
      )
      g.stroke()
    }
  }
  if (s.swimming) {
    const tail = face > 0 ? x : x + w
    g.strokeStyle = rgba('#d4fff6', 0.6)
    g.lineWidth = 0.6
    for (let i = 0; i < 3; i++) {
      const k = (((tick / 16 + i / 3) % 1) + 1) % 1
      const back = -face * (4 + k * 22)
      g.globalAlpha = 1 - k
      g.beginPath()
      g.moveTo(tail + back, wl + 0.4 - k * 1.4)
      g.lineTo(tail + back - face * 3, wl + 0.4 - k * 1.4)
      g.moveTo(tail + back, wl + 1.2 + k * 1.4)
      g.lineTo(tail + back - face * 3, wl + 1.2 + k * 1.4)
      g.stroke()
    }
    g.globalAlpha = 1
    // A bow wave at his snout.
    const nose = face > 0 ? x + w : x
    g.fillStyle = rgba('#e8fffa', 0.7)
    g.fillRect(nose + (face > 0 ? 0 : -3), wl - 0.6, 3, 0.8)
  }
  if (sink > 0) {
    // Rising: only what is above the water shows.
    g.beginPath()
    g.rect(x - 4, y - 20, w + 8, CROC_WATERLINE + 20 + 6 - sink * 0.4)
    g.clip()
  }
  drawBaked(
    g,
    `gt-croc-${Math.round(w)}`,
    x,
    y - CROC_ABOVE + bob + sink,
    w,
    CROC_TALL,
    (c) => paintCroc(c, w),
    { flipX: face < 0 },
  )
  // A slow blink now and then.
  const blink = tick % 260 < 8
  if (blink && sink < 2) {
    const ex = face > 0 ? x + w * 0.775 : x + w * 0.225
    g.fillStyle = CROC[3]
    g.beginPath()
    g.ellipse(ex + face * 0.4, y - 1.8 + bob + sink, 2, 1.7, 0, 0, Math.PI * 2)
    g.fill()
    g.fillStyle = CROC[0]
    g.fillRect(ex - 1.6, y - 1.2 + bob + sink, 3.6, 0.45)
  }
  if (rise < 1) {
    // Water sheeting off him as he comes up.
    for (let i = 0; i < 8; i++) {
      const k = hash(i * 31 + Math.floor(tick / 3))
      g.fillStyle = rgba('#e8fffa', 0.8 * (1 - rise))
      g.fillRect(
        x + k * w,
        wl - 2 - hash(i * 7 + tick) * 6 * (1 - rise),
        0.7,
        1.4,
      )
    }
  }
  g.restore()
}

// --- the cage ---------------------------------------------------------------------------------------

const CAGE_W = 30
const CAGE_TALL = 42
/** The bake's width: the cage, and room on the right for its door to swing open. */
const CAGE_BOX = CAGE_W + 12

/** The captive novice's oatmeal habit [ink, shadow, base, light, highlight]. */
const HABIT: Ramp = ['#1a1418', '#5a5050', '#8e8478', '#bab0a0', '#e6dece']

/** A hooded novice kneeling, centred at cx with knees on the floor at y, `s` times life size. */
function paintNovice(b: G, cx: number, y: number, s: number) {
  b.save()
  b.translate(cx, y)
  b.scale(s, s)
  const robe = () => {
    b.beginPath()
    b.moveTo(-6.5, 0)
    b.quadraticCurveTo(-6.5, -9, -3, -12.5)
    b.lineTo(3, -12.5)
    b.quadraticCurveTo(6.5, -9, 7, 0)
    b.closePath()
  }
  // Robe: a bell of cloth, kneeling.
  robe()
  b.fillStyle = HABIT[2]
  b.fill()
  b.fillStyle = HABIT[1]
  b.fillRect(2.4, -10, 4, 10)
  b.fillStyle = HABIT[3]
  b.fillRect(-5.6, -8.5, 1.4, 8)
  b.fillStyle = HABIT[4]
  b.fillRect(-5.2, -7.5, 0.5, 5)
  // Folds.
  b.strokeStyle = rgba(HABIT[0], 0.55)
  b.lineWidth = 0.45
  for (const dx of [-2.6, 0.4, 3.2]) {
    b.beginPath()
    b.moveTo(dx, -9.5)
    b.lineTo(dx * 1.3, -0.5)
    b.stroke()
  }
  robe()
  b.strokeStyle = HABIT[0]
  b.lineWidth = 0.5
  b.stroke()
  // A rope cincture, its end hanging, and a little wooden cross.
  b.fillStyle = '#c8a868'
  b.fillRect(-5, -8, 10, 0.9)
  b.fillRect(1.6, -7.4, 0.7, 4)
  b.fillStyle = '#8a5a30'
  b.fillRect(-1.6, -7, 0.7, 2.6)
  b.fillRect(-2.3, -6.3, 2.1, 0.6)
  // The hood: a rounded cowl with a deep shadow for a face.
  b.fillStyle = HABIT[2]
  b.beginPath()
  b.ellipse(0, -15.5, 4.8, 5, 0, 0, Math.PI * 2)
  b.fill()
  b.fillStyle = HABIT[3]
  b.beginPath()
  b.ellipse(-1.6, -17.6, 2.2, 2, -0.4, 0, Math.PI * 2)
  b.fill()
  b.fillStyle = HABIT[0]
  b.beginPath()
  b.ellipse(0.8, -14.8, 2.9, 3.1, 0, 0, Math.PI * 2)
  b.fill()
  // A pale little face in the shadow, two wide eyes looking out.
  b.fillStyle = '#ecd6be'
  b.beginPath()
  b.ellipse(1.1, -14.4, 1.9, 2.2, 0, 0, Math.PI * 2)
  b.fill()
  b.fillStyle = '#2a1a24'
  b.fillRect(0.1, -15.1, 0.7, 1)
  b.fillRect(1.9, -15.1, 0.7, 1)
  b.fillStyle = '#ffffff'
  b.fillRect(0.2, -15.1, 0.3, 0.3)
  b.fillRect(2, -15.1, 0.3, 0.3)
  b.strokeStyle = HABIT[0]
  b.lineWidth = 0.5
  b.beginPath()
  b.ellipse(0, -15.5, 4.8, 5, 0, 0, Math.PI * 2)
  b.stroke()
  // Hands up on the bars.
  b.fillStyle = '#ecd6be'
  b.fillRect(5, -11.4, 1.8, 1.6)
  b.fillRect(-6.8, -11, 1.8, 1.6)
  b.restore()
}

/** A hanging iron cage, `state` locked (the novice inside), open (the lock broken) or empty. */
function paintCage(b: G, state: 'locked' | 'open' | 'empty') {
  const w = CAGE_W
  const cx = w / 2
  const top = 5
  const floor = CAGE_TALL - 3.5
  const mid = top + (floor - top) * 0.55
  const bars = 8
  const barX = (i: number) => 2 + (i * (w - 4)) / (bars - 1)
  const shut = state === 'locked'
  // The back bars, in the dark, and the dim inside.
  b.fillStyle = rgba(INK, 0.5)
  b.fillRect(2, top + 4, w - 4, floor - top - 4)
  for (let i = 0; i < bars; i++) {
    b.fillStyle = IRON[1]
    b.fillRect(barX(i) + 1.8, top + 3, 0.8, floor - top - 3)
  }
  if (state !== 'empty') {
    // A candle's warmth behind the novice, so the prisoner reads through the bars.
    const warm = b.createRadialGradient(cx, floor - 10, 0, cx, floor - 10, 14)
    warm.addColorStop(0, rgba('#ffb060', 0.55))
    warm.addColorStop(1, rgba('#ffb060', 0))
    b.fillStyle = warm
    b.fillRect(2, top + 4, w - 4, floor - top - 4)
    paintNovice(b, cx - 1, floor, 1.25)
  } else {
    // Left behind: a broken rope cincture on the floor.
    b.strokeStyle = '#c8a868'
    b.lineWidth = 0.8
    b.beginPath()
    b.moveTo(cx - 6, floor - 0.6)
    b.quadraticCurveTo(cx - 2, floor - 2.4, cx + 3, floor - 0.6)
    b.stroke()
  }
  // The dome, its ribs and its ring.
  b.fillStyle = IRON[2]
  b.beginPath()
  b.moveTo(0.6, top + 4.4)
  b.quadraticCurveTo(cx, top - 5, w - 0.6, top + 4.4)
  b.lineTo(w - 0.6, top + 6)
  b.quadraticCurveTo(cx, top - 3.2, 0.6, top + 6)
  b.closePath()
  b.fill()
  b.strokeStyle = INK
  b.lineWidth = 0.4
  b.stroke()
  for (let i = 1; i < bars - 1; i++) {
    b.strokeStyle = IRON[1]
    b.lineWidth = 0.6
    b.beginPath()
    b.moveTo(barX(i), top + 4.6)
    b.quadraticCurveTo(barX(i) + (cx - barX(i)) * 0.4, top, cx, top - 1.6)
    b.stroke()
  }
  b.strokeStyle = IRON[4]
  b.lineWidth = 0.45
  b.beginPath()
  b.moveTo(2, top + 4)
  b.quadraticCurveTo(cx - 3, top - 2.8, cx, top - 0.4)
  b.stroke()
  b.strokeStyle = IRON[0]
  b.lineWidth = 1.3
  b.beginPath()
  b.arc(cx, top - 2.6, 2.1, 0, Math.PI * 2)
  b.stroke()
  b.strokeStyle = IRON[3]
  b.lineWidth = 0.45
  b.stroke()
  // The front bars: the door is the right three, hinged on the right-hand post.
  const bar = (bx: number, y0: number, y1: number) => {
    b.fillStyle = IRON[0]
    b.fillRect(bx - 0.7, y0, 1.5, y1 - y0)
    b.fillStyle = IRON[2]
    b.fillRect(bx - 0.5, y0, 1, y1 - y0)
    b.fillStyle = IRON[4]
    b.fillRect(bx - 0.5, y0, 0.35, y1 - y0)
  }
  for (let i = 0; i < bars; i++)
    if (shut || i < 5 || i === bars - 1) bar(barX(i), top + 4, floor)
  // Bands round the cage and the floor plate.
  const band = (y0: number, x0: number, x1: number) => {
    b.fillStyle = IRON[0]
    b.fillRect(x0, y0 - 0.7, x1 - x0, 2)
    b.fillStyle = IRON[3]
    b.fillRect(x0, y0 - 0.7, x1 - x0, 0.55)
    b.fillStyle = IRON[4]
    for (let rx = x0 + 1.5; rx < x1; rx += 3.6)
      b.fillRect(rx, y0 + 0.3, 0.5, 0.5)
  }
  band(top + 4.6, 0.6, w - 0.6)
  band(mid, 0.6, shut ? w - 0.6 : barX(4) + 1)
  if (!shut) band(mid, barX(bars - 1) - 1, w - 0.6)
  b.fillStyle = IRON[1]
  b.fillRect(0, floor, w, 3.5)
  b.fillStyle = IRON[3]
  b.fillRect(0, floor, w, 0.7)
  b.fillStyle = IRON[0]
  b.fillRect(0, floor + 2.8, w, 0.7)
  b.strokeStyle = INK
  b.lineWidth = 0.4
  b.strokeRect(0, floor, w, 3.5)
  b.fillStyle = IRON[4]
  for (let rx = 1.8; rx < w; rx += 4) b.fillRect(rx, floor + 1.4, 0.6, 0.6)
  if (shut) {
    // The padlock, hung on the door's clasp.
    const lx = barX(4) + 1.6
    const ly = mid + 1.4
    b.strokeStyle = IRON[3]
    b.lineWidth = 0.9
    b.beginPath()
    b.arc(lx, ly, 1.8, Math.PI, 0)
    b.stroke()
    b.fillStyle = BRONZE[2]
    b.fillRect(lx - 2.6, ly, 5.2, 4.2)
    b.fillStyle = BRONZE[4]
    b.fillRect(lx - 2.6, ly, 5.2, 0.7)
    b.fillRect(lx - 2.6, ly, 0.6, 4.2)
    b.fillStyle = BRONZE[0]
    b.beginPath()
    b.arc(lx, ly + 1.7, 0.6, 0, Math.PI * 2)
    b.fill()
    b.fillRect(lx - 0.3, ly + 1.8, 0.6, 1.4)
    b.strokeStyle = INK
    b.lineWidth = 0.45
    b.strokeRect(lx - 2.6, ly, 5.2, 4.2)
  } else {
    // The door swung out on its hinge, seen edge-on: a foreshortened panel of three bars.
    const hx = barX(bars - 1)
    const reach = 10
    const y0 = top + 4
    const y1 = floor
    for (const k of [0.33, 0.66, 1]) {
      const px = hx + reach * k
      const pt = y0 + 2.2 * k
      const pb = y1 - 2.2 * k
      b.fillStyle = IRON[0]
      b.fillRect(px - 0.7, pt, 1.5, pb - pt)
      b.fillStyle = IRON[3]
      b.fillRect(px - 0.4, pt, 0.45, pb - pt)
    }
    for (const [ya, yb] of [
      [y0, y0 + 2.2],
      [mid, mid],
      [y1 - 1, y1 - 3.2],
    ] as const) {
      b.strokeStyle = IRON[0]
      b.lineWidth = 1.6
      b.beginPath()
      b.moveTo(hx, ya)
      b.lineTo(hx + reach, yb)
      b.stroke()
      b.strokeStyle = IRON[3]
      b.lineWidth = 0.45
      b.stroke()
    }
    // The snapped clasp, and the padlock lying on the floor plate.
    b.fillStyle = IRON[3]
    b.fillRect(barX(4) + 0.6, mid - 0.6, 1.6, 1.2)
    b.fillStyle = BRONZE[1]
    b.fillRect(barX(2), floor - 2.6, 4, 2.6)
    b.fillStyle = BRONZE[3]
    b.fillRect(barX(2), floor - 2.6, 4, 0.5)
    b.strokeStyle = IRON[3]
    b.lineWidth = 0.7
    b.beginPath()
    b.arc(barX(2) + 3.6, floor - 2.6, 1.4, Math.PI * 1.1, Math.PI * 1.9)
    b.stroke()
  }
  // Candlelight catching the left edges.
  b.fillStyle = rgba('#f4b860', 0.45)
  b.fillRect(0.6, top + 5, 0.5, floor - top - 5)
  b.fillRect(0.6, floor, w * 0.4, 0.4)
}

/**
 * The abbey's hanging cage (Stage 6's captive): an iron cage on a chain, its floor plate's bottom at
 * (x, y), a hooded novice inside while it is locked or opened (its door swung wide), empty once the
 * novice is free. It sways a little on its chain, which runs up off the top of the view (`camY` is
 * the view's top).
 */
export function drawCage(
  g: G,
  x: number,
  y: number,
  state: 'locked' | 'open' | 'empty',
  tick: number,
  camY = 0,
) {
  const pivotY = y - CAGE_TALL + 2
  const sway =
    Math.sin(tick / 47 + x * 0.01) * (state === 'empty' ? 0.05 : 0.025)
  g.save()
  chainLine(g, x, camY - 8, x, pivotY)
  g.translate(x, pivotY)
  g.rotate(sway)
  // A warm glow under a prisoner, a cold one once the cage is empty.
  glow(
    g,
    0,
    CAGE_TALL / 2,
    26,
    state === 'empty' ? '#b8a0ff' : '#ffb870',
    state === 'empty' ? 0.14 : 0.24,
  )
  drawBaked(g, `gt-cage-${state}`, -CAGE_W / 2, -2, CAGE_BOX, CAGE_TALL, (c) =>
    paintCage(c, state),
  )
  g.restore()
}

// --- hazards ---------------------------------------------------------------------------------------

/**
 * Ground that hurts (world space), spanning exactly x..x+w on the ground. `live` is burning or
 * raised; a timed hazard that is not live is cooling or retracted, and `warm` is the tell that it
 * is about to ignite: coals flare orange and spit sparks, a ritual circle's runes kindle, spikes
 * tremble at the lip, all with a pulsing warm glow.
 */
export function drawHazard(
  g: G,
  h: Hazard,
  groundY: number,
  live: boolean,
  warm: boolean,
  tick: number,
) {
  const timed = !!h.period
  const x = h.x
  const w = Math.max(2, h.w)
  const pulse = (Math.sin(tick / 3) + 1) / 2
  g.save()
  if (h.kind === 'spikes') {
    // Iron spikes in a riveted sill; timed ones sink into it and rise again.
    const ext =
      !timed || live ? 1 : warm ? 0.3 + 0.12 * Math.sin(tick * 1.3) : 0.1
    drawBaked(g, `gt-hazard-sill-${w}`, x, groundY - 2, w, 3, (b) => {
      b.fillStyle = IRON[1]
      b.fillRect(0, 0, w, 3)
      b.fillStyle = IRON[3]
      b.fillRect(0, 0, w, 0.5)
      for (let rx = 2; rx < w - 1; rx += 6) {
        b.fillStyle = IRON[4]
        b.fillRect(rx, 1.2, 0.7, 0.7)
      }
      b.strokeStyle = INK
      b.lineWidth = 0.4
      b.strokeRect(0.2, 0.2, w - 0.4, 2.6)
    })
    const n = Math.max(1, Math.round(w / 5))
    const sw = w / n
    const sh = 9 * ext
    for (let i = 0; i < n; i++) {
      const sx = x + i * sw
      const base = groundY - 2
      g.fillStyle = IRON[2]
      g.beginPath()
      g.moveTo(sx + 0.4, base)
      g.lineTo(sx + sw / 2, base - sh)
      g.lineTo(sx + sw - 0.4, base)
      g.closePath()
      g.fill()
      g.fillStyle = IRON[4]
      g.beginPath()
      g.moveTo(sx + 0.4, base)
      g.lineTo(sx + sw / 2, base - sh)
      g.lineTo(sx + sw / 2, base)
      g.closePath()
      g.fill()
      g.strokeStyle = INK
      g.lineWidth = 0.45
      g.beginPath()
      g.moveTo(sx + 0.4, base)
      g.lineTo(sx + sw / 2, base - sh)
      g.lineTo(sx + sw - 0.4, base)
      g.stroke()
      // A glint on each point (red-hot in the tell).
      g.fillStyle =
        warm && !live
          ? rgba('#ff8a4a', 0.6 + 0.4 * pulse)
          : rgba('#ffffff', 0.7)
      g.fillRect(sx + sw / 2 - 0.4, base - sh, 0.8, 0.8)
    }
    if (warm && !live)
      glow(g, x + w / 2, groundY - 3, w * 0.5 + 6, EMBER, 0.2 + pulse * 0.2)
  } else if (h.kind === 'coals') {
    const heat = !timed || live ? 1 : warm ? 0.55 + pulse * 0.35 : 0.12
    // A bed of coals in a stone kerb.
    drawBaked(g, `gt-hazard-coals-${w}`, x, groundY - 5, w, 6, (b) => {
      b.fillStyle = '#1a1212'
      b.fillRect(0, 2, w, 4)
      const rand = seeded(w * 3 + 1)
      for (let i = 0; i < w / 2.2; i++) {
        const cx = 1 + rand() * (w - 2)
        const cy = 2.5 + rand() * 2.2
        const r = 0.9 + rand() * 1.3
        b.fillStyle = ['#2a2224', '#3a3034', '#221a1c'][i % 3]!
        b.beginPath()
        b.ellipse(cx, cy, r * 1.2, r, 0, 0, Math.PI * 2)
        b.fill()
        b.fillStyle = rgba('#6a5a5a', 0.6)
        b.fillRect(cx - r * 0.6, cy - r * 0.7, r * 0.8, 0.4)
      }
      stoneRow(b, w, 4.6, 1.4, MASONRY)
    })
    // The coals' glowing cracks.
    const rand = seeded(w * 3 + 5)
    g.save()
    g.globalCompositeOperation = 'lighter'
    for (let i = 0; i < w / 3; i++) {
      const cx = x + 1 + rand() * (w - 2)
      const cy = groundY - 3 + rand() * 2
      const flick = 0.6 + 0.4 * Math.sin(tick / 4 + i * 1.7)
      g.fillStyle = rgba(
        heat > 0.5 ? '#ffb040' : '#c0301a',
        Math.min(1, heat * flick),
      )
      g.fillRect(cx, cy, 1 + rand() * 1.5, 0.5)
    }
    g.restore()
    if (heat > 0.2)
      glow(
        g,
        x + w / 2,
        groundY - 3,
        w * 0.55 + 8,
        EMBER,
        0.25 * heat + (warm && !live ? 0.15 * pulse : 0),
      )
    if (!timed || live) {
      // Flames along the bed.
      fireRow(g, x + 2, x + w - 2, groundY - 2.5, 13, tick + x, [
        '#b8281a',
        '#ff8a2a',
        '#ffd060',
        '#fff6d8',
      ])
      glow(g, x + w / 2, groundY - 8, w * 0.6 + 10, '#ff8a2a', 0.3)
    } else if (warm) {
      // The tell: little tongues licking up, sparks spitting, the air shimmering.
      for (let fx = x + 4; fx < x + w - 3; fx += 7)
        flame(g, fx, groundY - 3, 0.5 + 0.25 * pulse, tick + fx * 5, '#ff9a3a')
      for (let i = 0; i < 6; i++) {
        const sx = x + ((i * 37 + tick * 0.7) % w)
        const sy = groundY - 4 - ((tick * 0.8 + i * 9) % 16)
        g.fillStyle = rgba('#ffd27a', 0.9 - ((tick * 0.8 + i * 9) % 16) / 18)
        g.fillRect(sx, sy, 0.8, 0.8)
      }
      g.strokeStyle = rgba('#ffc890', 0.16)
      g.lineWidth = 0.4
      for (let k = 0; k < 3; k++) {
        const hy = groundY - 8 - k * 4
        g.beginPath()
        for (let sx = x; sx <= x + w; sx += 2) {
          const yy = hy + Math.sin(sx / 3 + tick / 4 + k) * 0.8
          if (sx === x) g.moveTo(sx, yy)
          else g.lineTo(sx, yy)
        }
        g.stroke()
      }
    } else {
      // Cold: a thread of smoke.
      for (let i = 0; i < 3; i++) {
        const sy = (tick * 0.3 + i * 10) % 30
        g.fillStyle = rgba('#8a8090', 0.25 * (1 - sy / 30))
        g.beginPath()
        g.arc(
          x + w * (0.25 + i * 0.25) + Math.sin(tick / 30 + i) * 2,
          groundY - 5 - sy,
          1 + sy / 12,
          0,
          Math.PI * 2,
        )
        g.fill()
      }
    }
  } else {
    // The ritual circle: a sigil cut into the floor that kindles, then roars into a fire curtain.
    const lit = !timed || live
    const cx = x + w / 2
    const cy = groundY - 1
    const rx = w / 2
    const colour = lit ? RITUAL : warm ? mix(VIOLET, '#ff7a3a', pulse) : VIOLET
    const alpha = lit ? 0.95 : warm ? 0.55 + 0.4 * pulse : 0.28
    g.save()
    g.translate(cx, cy)
    g.scale(1, 0.28)
    g.lineWidth = 1.4
    g.strokeStyle = rgba(INK, 0.8)
    g.beginPath()
    g.ellipse(0, 0, rx, rx, 0, 0, Math.PI * 2)
    g.stroke()
    g.globalCompositeOperation = 'lighter'
    g.strokeStyle = rgba(colour, alpha)
    g.lineWidth = 1
    g.beginPath()
    g.ellipse(0, 0, rx - 0.5, rx - 0.5, 0, 0, Math.PI * 2)
    g.stroke()
    g.lineWidth = 0.7
    g.beginPath()
    for (let i = 0; i <= 5; i++) {
      const a = tick / 200 - Math.PI / 2 + (i * 4 * Math.PI) / 5
      const px = Math.cos(a) * rx * 0.82
      const py = Math.sin(a) * rx * 0.82
      if (i) g.lineTo(px, py)
      else g.moveTo(px, py)
    }
    g.stroke()
    // Runes round the ring: in the tell they kindle one by one.
    const runes = Math.max(6, Math.round(w / 5))
    const kindled =
      warm && !lit ? Math.floor((tick / 4) % (runes + 4)) : lit ? runes : 0
    for (let i = 0; i < runes; i++) {
      const a = (i / runes) * Math.PI * 2
      const on = i < kindled
      g.fillStyle = rgba(on ? '#ffd0a0' : colour, on ? 0.95 : alpha * 0.7)
      g.fillRect(
        Math.cos(a) * rx * 0.92 - 0.6,
        Math.sin(a) * rx * 0.92 - 1.6,
        1.2,
        3.2,
      )
    }
    g.restore()
    if (lit) {
      // A curtain of violet-crimson fire over the circle.
      fireRow(g, x + 2, x + w - 2, groundY - 1, 18, tick + x, [
        '#6a1aa0',
        '#d02a6a',
        '#ff7aa0',
        '#ffe8f4',
      ])
      glow(g, cx, groundY - 10, w * 0.6 + 12, RITUAL, 0.3)
      glow(g, cx, groundY - 4, w * 0.4 + 6, VIOLET, 0.25)
    } else if (warm) {
      for (let i = 0; i < 5; i++) {
        const sx = x + 2 + ((i * 29 + tick * 0.5) % (w - 4))
        const rise = (tick * 0.9 + i * 11) % 20
        g.fillStyle = rgba(i % 2 ? '#ff9ab0' : '#e0a0ff', 0.9 * (1 - rise / 20))
        g.fillRect(sx, groundY - 2 - rise, 0.8, 1.6)
      }
      glow(
        g,
        cx,
        groundY - 3,
        w * 0.5 + 6,
        mix(VIOLET, EMBER, pulse),
        0.2 + 0.25 * pulse,
      )
    } else glow(g, cx, groundY - 1, w * 0.4, VIOLET, 0.12)
  }
  g.restore()
}

/** A row of small kerb stones along the bottom of a hazard bake. */
function stoneRow(b: G, w: number, y: number, h: number, ramp: Ramp) {
  let x = 0
  let i = 0
  while (x < w - 0.1) {
    const sw = Math.min(w - x, 4 + ((i * 7) % 4))
    stone(b, x + 0.15, y, sw - 0.3, h, ramp, 0.4, (i % 3) * 0.15 - 0.1)
    x += sw
    i++
  }
}

// --- wind and water ----------------------------------------------------------------------------------

/**
 * A column of rising air (world space, drawn behind the terrain): a cool shaft of light, wisps
 * spiralling up, leaves and feathers riding it, and faint chevrons climbing, so it reads as lift.
 */
export function drawUpdraft(g: G, u: Updraft, groundY: number, tick: number) {
  const x = u.x
  const w = Math.max(4, u.w)
  const top = u.top
  const span = Math.max(8, groundY - top)
  g.save()
  // The shaft: brightest in its heart and near the ground, fading out at its sides and top.
  const slices = 10
  for (let k = 0; k < slices; k++) {
    const f = (k + 0.5) / slices
    const a = 0.03 + 0.15 * f * f
    const sy = top + (k / slices) * span
    const grad = g.createLinearGradient(x, 0, x + w, 0)
    grad.addColorStop(0, rgba('#dfe6ff', 0))
    grad.addColorStop(0.5, rgba('#dfe6ff', a))
    grad.addColorStop(1, rgba('#dfe6ff', 0))
    g.fillStyle = grad
    g.fillRect(x, sy, w, span / slices + 0.5)
  }
  // Wisps spiralling up.
  g.lineCap = 'round'
  const wisps = Math.max(3, Math.round(w / 7))
  for (let i = 0; i < wisps; i++) {
    const k = ((tick * 1.6 + i * 53) % span) / span
    const y = groundY - k * span
    const sx =
      x + w * ((i + 0.5) / wisps) + Math.sin(tick / 18 + i * 2) * w * 0.12
    const a = (1 - Math.abs(k - 0.5) * 2) * 0.55
    g.strokeStyle = rgba('#eef2ff', a)
    g.lineWidth = 0.7
    g.beginPath()
    g.moveTo(sx, y + 8)
    g.bezierCurveTo(sx - 2, y + 5, sx + 2, y + 2, sx, y - 2)
    g.stroke()
  }
  // Chevrons climbing the column.
  for (let i = 0; i < 3; i++) {
    const k = ((tick * 0.9 + (i * span) / 3) % span) / span
    const y = groundY - 6 - k * (span - 10)
    const a = Math.sin(k * Math.PI) * 0.35
    g.strokeStyle = rgba('#ffffff', a)
    g.lineWidth = 0.9
    g.beginPath()
    g.moveTo(x + w / 2 - 4, y + 3)
    g.lineTo(x + w / 2, y)
    g.lineTo(x + w / 2 + 4, y + 3)
    g.stroke()
  }
  // Leaves and feathers riding it.
  for (let i = 0; i < Math.max(2, Math.round(w / 12)); i++) {
    const k = ((tick * 1.2 + i * 71) % span) / span
    const y = groundY - k * span
    const sx =
      x + w * (0.2 + 0.6 * hash(i * 7 + 3)) + Math.sin(tick / 12 + i * 3) * 4
    g.save()
    g.translate(sx, y)
    g.rotate(tick / 10 + i)
    g.fillStyle = rgba(
      i % 2 ? '#2a2a3e' : '#8a7a4a',
      0.85 * Math.sin(k * Math.PI),
    )
    g.beginPath()
    g.ellipse(0, 0, 1.8, 0.7, 0, 0, Math.PI * 2)
    g.fill()
    g.restore()
  }
  g.lineCap = 'butt'
  g.restore()
}

/**
 * The tide (world space; the caller has translated by -camX): the water from line `y` down, its
 * surface rippling, caustics below and foam on top. While `warning` (a rise is coming) the surface
 * trembles and a bright gold shimmer races along it, with bubbles boiling up: the tell to climb.
 */
export function drawWater(
  g: G,
  camX: number,
  y: number,
  warning: boolean,
  tick: number,
) {
  const top = y
  const x0 = camX - 8
  const x1 = camX + W + 8
  const pulse = (Math.sin(tick / 4) + 1) / 2
  const amp = warning ? 1.6 + pulse * 0.8 : 1
  const surf = (sx: number) =>
    top +
    Math.sin((sx + tick * 1.2) / 9) * amp * 0.6 +
    Math.sin((sx - tick * 0.7) / 5.3) * amp * 0.4
  g.save()
  if (top < H) {
    // The body of the water.
    g.beginPath()
    g.moveTo(x0, H + 2)
    for (let sx = x0; sx <= x1; sx += 3) g.lineTo(sx, surf(sx))
    g.lineTo(x1, H + 2)
    g.closePath()
    const body = g.createLinearGradient(0, top, 0, Math.max(top + 1, H))
    body.addColorStop(0, rgba('#2ab8b0', 0.46))
    body.addColorStop(0.3, rgba('#127070', 0.6))
    body.addColorStop(1, rgba('#06283a', 0.82))
    g.fillStyle = body
    g.fill()
    // Caustics drifting under the surface.
    g.save()
    g.clip()
    g.strokeStyle = rgba('#9ff8ec', 0.13)
    g.lineWidth = 0.6
    for (let row = 0; row < 4; row++) {
      const cy = top + 6 + row * 7
      g.beginPath()
      for (let sx = x0 - (x0 % 6); sx <= x1; sx += 6) {
        const yy = cy + Math.sin(sx / 7 + tick / 20 + row * 2) * 1.6
        if (sx === x0 - (x0 % 6)) g.moveTo(sx, yy)
        else g.lineTo(sx, yy)
      }
      g.stroke()
    }
    // Motes and silt.
    for (let i = 0; i < 14; i++) {
      const mx = camX + ((i * 47 + tick * 0.2) % (W + 16)) - 8
      const my = top + 4 + ((i * 23 + tick * 0.1) % Math.max(4, H - top))
      g.fillStyle = rgba('#b8fff4', 0.18)
      g.fillRect(mx, my, 0.6, 0.6)
    }
    g.restore()
    // The surface: a dark trough line, a lit crest, foam flecks.
    g.lineWidth = 0.8
    g.strokeStyle = rgba('#0a3a40', 0.6)
    g.beginPath()
    for (let sx = x0; sx <= x1; sx += 2) {
      if (sx === x0) g.moveTo(sx, surf(sx) + 1.2)
      else g.lineTo(sx, surf(sx) + 1.2)
    }
    g.stroke()
    g.strokeStyle = rgba('#c8fff4', 0.75)
    g.lineWidth = 0.6
    g.beginPath()
    for (let sx = x0; sx <= x1; sx += 2) {
      if (sx === x0) g.moveTo(sx, surf(sx))
      else g.lineTo(sx, surf(sx))
    }
    g.stroke()
    for (let sx = x0 - (x0 % 11); sx < x1; sx += 11) {
      const drift = (tick * 0.25 + sx * 3) % 11
      g.fillStyle = rgba('#ffffff', 0.55)
      g.fillRect(sx + drift, surf(sx + drift) - 0.3, 2.2, 0.6)
    }
    if (warning) {
      // The tell: a gold shimmer racing along the line, the surface glowing, bubbles boiling.
      g.save()
      g.globalCompositeOperation = 'lighter'
      const band = g.createLinearGradient(0, top - 6, 0, top + 6)
      band.addColorStop(0, rgba('#ffd27a', 0))
      band.addColorStop(0.5, rgba('#ffd27a', 0.22 + 0.3 * pulse))
      band.addColorStop(1, rgba('#ffd27a', 0))
      g.fillStyle = band
      g.fillRect(x0, top - 6, x1 - x0, 12)
      // Above it, the rise foretold: a gold haze and chevrons climbing out of the water, so the
      // tell reads even while the tide is still low at the foot of the screen.
      const reach = 44
      const haze = g.createLinearGradient(0, top - reach, 0, top)
      haze.addColorStop(0, rgba('#ffd27a', 0))
      haze.addColorStop(1, rgba('#ffd27a', 0.1 + 0.14 * pulse))
      g.fillStyle = haze
      g.fillRect(x0, top - reach, x1 - x0, reach)
      g.globalCompositeOperation = 'source-over'
      g.lineCap = 'round'
      for (let i = 0; i < 12; i++) {
        const k = ((tick * 0.55 + i * 29) % reach) / reach
        const cx = camX + ((i + 0.5) * W) / 12 + Math.sin(tick / 15 + i) * 3
        const cy = Math.min(top, H) - 3 - k * reach
        const a = Math.sin(k * Math.PI) * (0.55 + 0.35 * pulse)
        for (const [colour, lw, alpha] of [
          [INK, 2.2, a * 0.5],
          ['#ffe6a0', 1.1, a],
        ] as const) {
          g.strokeStyle = rgba(colour, alpha)
          g.lineWidth = lw
          g.beginPath()
          g.moveTo(cx - 4, cy + 3)
          g.lineTo(cx, cy)
          g.lineTo(cx + 4, cy + 3)
          g.stroke()
        }
      }
      g.lineCap = 'butt'
      g.globalCompositeOperation = 'lighter'
      // The line itself burns gold, thickening on the beat.
      g.strokeStyle = rgba('#ffe6a0', 0.45 + 0.45 * pulse)
      g.lineWidth = 0.8 + pulse * 0.9
      g.beginPath()
      for (let sx = x0; sx <= x1; sx += 2) {
        if (sx === x0) g.moveTo(sx, surf(sx))
        else g.lineTo(sx, surf(sx))
      }
      g.stroke()
      for (let i = 0; i < 40; i++) {
        const sx = camX + hash(i * 13 + Math.floor(tick / 3)) * W
        const a = hash(i * 7 + Math.floor(tick / 2))
        g.fillStyle = rgba(a > 0.5 ? '#fff6c8' : '#ffd27a', 0.5 + a * 0.5)
        g.fillRect(sx - 2, surf(sx) - 0.4, 4, 0.7)
        if (a > 0.75) g.fillRect(sx - 0.3, surf(sx) - 1.4, 0.6, 2.6)
      }
      g.restore()
      for (let i = 0; i < 12; i++) {
        const bx = camX + ((i * 31) % W) + Math.sin(tick / 6 + i) * 2
        const rise = (tick * 0.6 + i * 13) % 26
        const by = top + 26 - rise
        if (by < top) continue
        g.strokeStyle = rgba('#e8fffa', 0.7)
        g.lineWidth = 0.4
        g.beginPath()
        g.arc(bx, by, 0.6 + (i % 3) * 0.3, 0, Math.PI * 2)
        g.stroke()
      }
    }
  }
  g.restore()
}

/** A small flame tongue, base at (x, y), for embers and the pillar's crown. */
function boltFlame(
  g: G,
  x: number,
  y: number,
  w: number,
  h: number,
  lean: number,
  color: string,
) {
  g.fillStyle = color
  g.beginPath()
  g.moveTo(x - w, y)
  g.quadraticCurveTo(x - w, y - h * 0.55, x + lean, y - h)
  g.quadraticCurveTo(x + w, y - h * 0.55, x + w, y)
  g.closePath()
  g.fill()
}

/** Wave palettes: halo, crest, body, trough, foam. */
const WAVE_TINTS = {
  water: ['#5eead4', '#5eead4', '#14a3a0', '#0b3a4a', '#e6fffb'],
  crimson: ['#f87171', '#fca5a5', '#dc2626', '#450a0a', '#fff1f2'],
  violet: ['#e879f9', '#f0abfc', '#a21caf', '#2e1065', '#fdf4ff'],
} as const

/**
 * A hostile projectile (world space). Each wears a dark ink edge, a glow, or both, so it reads on
 * every backdrop from the moonlit town to the teal waterhole. A pillar shows a pulsing crimson sigil
 * and a climbing shimmer on the ground while it arms (its tell), then erupts into a column of fire.
 */
export function drawBolt(g: G, b: Bolt, tick: number) {
  const x = b.x
  const y = b.y
  const dir = Math.sign(b.vx) || 1
  const TAU = Math.PI * 2
  g.save()
  g.lineCap = 'round'
  g.lineJoin = 'round'
  switch (b.kind) {
    case 'bullet': {
      // A tracer streak, a red-hot halo, and an amber slug with a white-hot nose.
      const tail = g.createLinearGradient(x - dir * 14, 0, x, 0)
      tail.addColorStop(0, rgba('#f2b52b', 0))
      tail.addColorStop(1, rgba('#fde68a', 0.75))
      g.fillStyle = tail
      g.fillRect(Math.min(x, x - dir * 14), y - 0.7, 14, 1.4)
      glow(g, x, y, 7, '#e0263a', 0.5)
      g.beginPath()
      g.ellipse(x, y, 3.2, 1.7, 0, 0, TAU)
      g.lineWidth = 1
      g.strokeStyle = INK
      g.stroke()
      g.fillStyle = '#f2b52b'
      g.fill()
      g.fillStyle = '#fffbe6'
      g.beginPath()
      g.ellipse(x + dir * 1, y - 0.3, 1.4, 0.8, 0, 0, TAU)
      g.fill()
      break
    }
    case 'orb': {
      // A spectral orb trailing wisps, a dark rim around a swirling cyan core.
      const sp = Math.hypot(b.vx, b.vy) || 1
      for (let i = 1; i <= 3; i++) {
        const k = i * 2.6
        g.globalAlpha = 0.5 - i * 0.12
        g.fillStyle = '#6ff0e0'
        g.beginPath()
        g.arc(
          x - (b.vx / sp) * k + Math.sin(b.t / 4 + i) * 0.8,
          y - (b.vy / sp) * k + Math.cos(b.t / 4 + i) * 0.8,
          2.4 - i * 0.5,
          0,
          TAU,
        )
        g.fill()
      }
      g.globalAlpha = 1
      glow(g, x, y, 11, '#1fa3a8', 0.55)
      g.beginPath()
      g.arc(x, y, 3.6, 0, TAU)
      g.lineWidth = 1
      g.strokeStyle = '#06283a'
      g.stroke()
      const core = g.createRadialGradient(x - 1, y - 1, 0, x, y, 3.6)
      core.addColorStop(0, '#dcfffa')
      core.addColorStop(0.5, '#6ff0e0')
      core.addColorStop(1, '#1fa3a8')
      g.fillStyle = core
      g.fill()
      g.strokeStyle = rgba('#dcfffa', 0.85)
      g.lineWidth = 0.6
      g.beginPath()
      g.arc(x, y, 2.2, b.t / 5, b.t / 5 + 2.2)
      g.stroke()
      break
    }
    case 'bone': {
      // A tumbling femur: ink-edged bone, knuckled ends, a faint pale halo.
      glow(g, x, y, 7, '#e9dcbc', 0.22)
      g.translate(x, y)
      g.rotate(b.t / 4)
      const shaft = (w: number, color: string) => {
        g.beginPath()
        g.moveTo(-3.4, 0)
        g.lineTo(3.4, 0)
        g.lineWidth = w
        g.strokeStyle = color
        g.stroke()
      }
      shaft(2.6, INK)
      for (const sx of [-3.8, 3.8])
        for (const sy of [-1.1, 1.1]) {
          g.beginPath()
          g.arc(sx, sy, 1.6, 0, TAU)
          g.fillStyle = INK
          g.fill()
        }
      shaft(1.5, '#c4ad88')
      for (const sx of [-3.8, 3.8])
        for (const sy of [-1.1, 1.1]) {
          g.beginPath()
          g.arc(sx, sy, 1.05, 0, TAU)
          g.fillStyle = sy < 0 ? '#e9dcbc' : '#c4ad88'
          g.fill()
        }
      g.strokeStyle = '#fffaea'
      g.lineWidth = 0.5
      g.beginPath()
      g.moveTo(-3, -0.4)
      g.lineTo(3, -0.4)
      g.stroke()
      break
    }
    case 'feather': {
      // A storm-black quill-feather, its edge lit pale so it shows against the night.
      glow(g, x, y, 7, '#8d93c9', 0.3)
      g.translate(x, y)
      g.rotate(Math.atan2(b.vy, b.vx))
      const vane = () => {
        g.beginPath()
        g.moveTo(5, 0)
        g.quadraticCurveTo(1, -2.4, -4, -0.8)
        g.lineTo(-5.4, 0)
        g.lineTo(-4, 0.8)
        g.quadraticCurveTo(1, 2.4, 5, 0)
        g.closePath()
      }
      vane()
      g.lineWidth = 1.2
      g.strokeStyle = rgba('#c9cdf0', 0.8)
      g.stroke()
      g.fillStyle = '#231f4a'
      g.fill()
      g.fillStyle = '#3b3772'
      g.beginPath()
      g.moveTo(4.4, -0.2)
      g.quadraticCurveTo(1, -2, -3.6, -0.6)
      g.lineTo(-3.6, 0)
      g.closePath()
      g.fill()
      g.strokeStyle = '#c9cdf0'
      g.lineWidth = 0.5
      g.beginPath()
      g.moveTo(-5.8, 0)
      g.lineTo(5, 0)
      g.stroke()
      break
    }
    case 'ember': {
      if (b.hw > 4) {
        // A censer's sweep: a lingering spray of fire across its whole box, dying as it ends.
        const fade = Math.min(1, b.life / 12)
        g.globalAlpha = fade
        glow(g, x, y, b.hw * 1.6, '#fb923c', 0.55)
        const n = 5
        for (let i = 0; i < n; i++) {
          const u = (i + 0.5) / n
          const fx = x - b.hw + u * b.hw * 2
          const h =
            b.hh *
            (1.2 + Math.sin(u * Math.PI) * 0.8) *
            (0.85 + Math.sin(b.t / 2 + i * 2) * 0.15)
          const base = y + b.hh * 0.6
          const lean = Math.sin(b.t / 3 + i) * 1.2
          boltFlame(g, fx, base, 2.4, h + 1, lean, rgba(INK, 0.5))
          boltFlame(g, fx, base, 2, h, lean, '#e0263a')
          boltFlame(g, fx, base, 1.4, h * 0.7, lean, '#fb923c')
          boltFlame(g, fx, base, 0.7, h * 0.4, lean, '#fef08a')
        }
        for (let i = 0; i < 6; i++) {
          const p = ((b.t * 1.3 + i * 5) % 18) / 18
          g.fillStyle = i % 2 ? '#fef08a' : '#fb923c'
          g.globalAlpha = fade * (1 - p)
          g.fillRect(
            x - b.hw + ((i * 7) % (b.hw * 2)),
            y + b.hh * 0.4 - p * b.hh * 2.4,
            1,
            1,
          )
        }
        g.globalAlpha = 1
        break
      }
      // A spitting coal: ink rim, crimson shell, a flickering yellow heart, sparks behind.
      for (let i = 1; i <= 2; i++) {
        g.globalAlpha = 0.7 - i * 0.25
        g.fillStyle = '#fb923c'
        g.fillRect(x - b.vx * i * 2 - 0.6, y - b.vy * i * 2 - 0.6, 1.2, 1.2)
      }
      g.globalAlpha = 1
      glow(g, x, y, 8, '#fb923c', 0.6)
      g.beginPath()
      g.arc(x, y, 2.5, 0, TAU)
      g.lineWidth = 1
      g.strokeStyle = INK
      g.stroke()
      g.fillStyle = '#e0263a'
      g.fill()
      g.fillStyle = '#fb923c'
      g.beginPath()
      g.arc(x - 0.3, y - 0.3, 1.6, 0, TAU)
      g.fill()
      g.fillStyle = (tick + b.t) % 6 < 3 ? '#fef08a' : '#fffbe6'
      g.fillRect(x - 0.8, y - 0.9, 1.2, 1.2)
      break
    }
    case 'pillar': {
      const base = y + b.hh
      if (b.arm > 0) {
        // The tell: a crimson sigil burning into the ground, quickening as it arms, and a
        // shimmer climbing the column it is about to fill.
        const k = Math.max(0, Math.min(1, 1 - b.arm / 45))
        const pulse = 0.5 + 0.5 * Math.sin(tick * (0.35 + k * 0.6))
        glow(g, x, base - 2, b.hw * 2 + k * 6, '#e0263a', 0.35 + k * 0.35)
        const col = g.createLinearGradient(0, base - b.hh * 2, 0, base)
        col.addColorStop(0, rgba('#e0263a', 0))
        col.addColorStop(
          1,
          rgba('#e0263a', 0.15 + k * 0.4 * (0.5 + pulse * 0.5)),
        )
        g.fillStyle = col
        g.fillRect(x - b.hw * 0.8, base - b.hh * 2, b.hw * 1.6, b.hh * 2)
        g.beginPath()
        g.ellipse(x, base, b.hw + 2.5, 2.4, 0, 0, TAU)
        g.lineWidth = 2.2
        g.strokeStyle = rgba(INK, 0.7)
        g.stroke()
        g.fillStyle = rgba('#4a0a14', 0.55)
        g.fill()
        g.lineWidth = 1
        g.strokeStyle = rgba('#ff6a5c', 0.55 + pulse * 0.45)
        g.stroke()
        g.beginPath()
        g.ellipse(
          x,
          base,
          (b.hw + 2.5) * (0.35 + 0.6 * (1 - k)),
          1.2,
          0,
          0,
          TAU,
        )
        g.lineWidth = 0.7
        g.strokeStyle = rgba('#ffd2c4', 0.4 + pulse * 0.5)
        g.stroke()
        // Rune ticks circling the sigil.
        g.fillStyle = '#ffd2c4'
        for (let i = 0; i < 4; i++) {
          const a = tick / 9 + (i * TAU) / 4
          g.fillRect(
            x + Math.cos(a) * (b.hw + 2.5) - 0.5,
            base + Math.sin(a) * 2.4 - 0.5,
            1,
            1,
          )
        }
        // Motes rising.
        for (let i = 0; i < 4; i++) {
          const p = ((tick * (0.8 + k) + i * 9) % 30) / 30
          g.globalAlpha = (1 - p) * (0.4 + k * 0.6)
          g.fillStyle = i % 2 ? '#ff6a5c' : '#ffd2c4'
          g.fillRect(
            x - b.hw * 0.6 + ((i * 5) % (b.hw * 1.2)),
            base - 2 - p * b.hh * 1.6 * (0.4 + k),
            1,
            1.4,
          )
        }
        g.globalAlpha = 1
      } else {
        // Erupting: a column of crimson fire, white-hot down its heart, licking flames at its
        // crown and sparks boiling up inside.
        const fade = Math.min(1, b.life / 8)
        const top = y - b.hh
        const w = b.hw
        g.globalAlpha = fade
        glow(g, x, base - 4, w * 2.6, '#e0263a', 0.55)
        glow(g, x, y, w * 2, '#ff6a5c', 0.3)
        const sway = (i: number) => Math.sin(b.t / 2 + i * 1.9) * 0.6
        g.beginPath()
        g.moveTo(x - w, base)
        g.lineTo(x - w * 0.85 + sway(1), y)
        g.lineTo(x - w * 0.7 + sway(2), top + 2)
        g.lineTo(x + w * 0.7 + sway(3), top + 2)
        g.lineTo(x + w * 0.85 + sway(4), y)
        g.lineTo(x + w, base)
        g.closePath()
        g.lineWidth = 1.2
        g.strokeStyle = rgba(INK, 0.7)
        g.stroke()
        const fire = g.createLinearGradient(x - w, 0, x + w, 0)
        fire.addColorStop(0, '#9b1424')
        fire.addColorStop(0.22, '#e0263a')
        fire.addColorStop(0.36, '#ff6a5c')
        fire.addColorStop(0.46, '#fff1e8')
        fire.addColorStop(0.54, '#fff1e8')
        fire.addColorStop(0.64, '#ff6a5c')
        fire.addColorStop(0.78, '#e0263a')
        fire.addColorStop(1, '#9b1424')
        g.fillStyle = fire
        g.fill()
        for (let i = 0; i < 4; i++) {
          const fx = x - w * 0.75 + i * w * 0.5
          const h = 5 + Math.sin(b.t / 2 + i * 2.1) * 2
          const lean = Math.sin(b.t / 3 + i) * 1.4
          boltFlame(g, fx, top + 3, w * 0.34, h + 1, lean, rgba(INK, 0.5))
          boltFlame(g, fx, top + 3, w * 0.3, h, lean, '#e0263a')
          boltFlame(g, fx, top + 3, w * 0.15, h * 0.6, lean * 0.5, '#ffd2c4')
        }
        for (let i = 0; i < 5; i++) {
          const p = ((b.t * 1.6 + i * 7) % 24) / 24
          g.fillStyle = i % 2 ? '#fef08a' : '#ffd2c4'
          g.fillRect(
            x - w * 0.6 + ((i * 3.7) % (w * 1.2)),
            base - p * b.hh * 2,
            1,
            1.6,
          )
        }
        g.globalAlpha = 1
      }
      break
    }
    case 'wave': {
      // A rolling wave of water: ink edge, deep teal body shading down, a white foam crest
      // spilling forward, spray flying off it.
      const [halo, top, mid, deep, foam] = WAVE_TINTS[b.tint ?? 'water']
      const w = b.hw
      const h = b.hh
      const lip = dir * w * 0.3
      const body = () => {
        g.beginPath()
        g.moveTo(x - w, y + h)
        g.quadraticCurveTo(x - w * 0.8, y - h * 0.6, x + lip, y - h)
        g.quadraticCurveTo(
          x + dir * w * 0.85,
          y - h * 0.9,
          x + dir * w,
          y - h * 0.2,
        )
        g.lineTo(x + w, y + h)
        g.closePath()
      }
      glow(g, x, y, Math.max(w, h) * 1.5, halo, 0.3)
      body()
      g.lineWidth = 1.2
      g.strokeStyle = INK
      g.stroke()
      const sea = g.createLinearGradient(0, y - h, 0, y + h)
      sea.addColorStop(0, top)
      sea.addColorStop(0.45, mid)
      sea.addColorStop(1, deep)
      g.fillStyle = sea
      g.fill()
      // Darker trough lines inside.
      g.strokeStyle = rgba(deep, 0.8)
      g.lineWidth = 0.6
      for (let i = 0; i < 2; i++) {
        const yy = y + h * (0.1 + i * 0.4)
        g.beginPath()
        g.moveTo(x - w * 0.7, yy)
        g.quadraticCurveTo(x, yy - 1.4, x + w * 0.7, yy)
        g.stroke()
      }
      // The foam crest.
      g.beginPath()
      g.moveTo(x - w * 0.55, y - h * 0.35)
      g.quadraticCurveTo(x - w * 0.2, y - h * 1.05, x + lip, y - h)
      g.quadraticCurveTo(
        x + dir * w * 0.85,
        y - h * 0.9,
        x + dir * w,
        y - h * 0.2,
      )
      g.lineWidth = 1.6
      g.strokeStyle = foam
      g.stroke()
      g.fillStyle = foam
      for (let i = 0; i < 4; i++) {
        const p = ((b.t + i * 5) % 20) / 20
        g.globalAlpha = 1 - p
        g.fillRect(
          x + dir * (w * 0.6 + p * 6) - 0.5,
          y - h - Math.sin(p * Math.PI) * 4 + i * 0.6,
          1,
          1,
        )
      }
      g.globalAlpha = 1
      break
    }
    case 'chain': {
      // Iron links strung along its length, alternately face-on and edge-on.
      const n = Math.max(2, Math.round((b.hw * 2) / 2.6))
      const step = (b.hw * 2) / n
      for (const pass of [0, 1]) {
        for (let i = 0; i < n; i++) {
          const cx = x - b.hw + step * (i + 0.5)
          const cy = y + Math.sin(b.t / 3 + i * 0.9) * 0.4
          g.beginPath()
          if (i % 2) g.ellipse(cx, cy, step * 0.7, 0.55, 0, 0, TAU)
          else g.ellipse(cx, cy, step * 0.7, 1.5, 0, 0, TAU)
          if (pass === 0) {
            g.lineWidth = 2
            g.strokeStyle = INK
          } else {
            g.lineWidth = 0.9
            g.strokeStyle = i % 2 ? '#6b7a99' : '#b4c0d8'
          }
          g.stroke()
        }
      }
      break
    }
    case 'anchor': {
      // A ship's anchor: ring, stock, shank, and two curved arms with flukes, iron with a rust bloom.
      const top = y - b.hh
      const foot = y + b.hh
      const arms = Math.min(b.hw, 7)
      const shape = (w: number, color: string) => {
        g.lineWidth = w
        g.strokeStyle = color
        g.beginPath()
        g.arc(x, top + 1.6, 1.6, 0, TAU)
        g.moveTo(x, top + 3.2)
        g.lineTo(x, foot - 1)
        g.moveTo(x - 3.2, top + 5.6)
        g.lineTo(x + 3.2, top + 5.6)
        g.moveTo(x - arms, foot - 4.4)
        g.quadraticCurveTo(x - arms * 0.6, foot + 0.4, x, foot - 1)
        g.quadraticCurveTo(x + arms * 0.6, foot + 0.4, x + arms, foot - 4.4)
        g.stroke()
      }
      glow(g, x, y, Math.max(b.hw, b.hh) * 1.2, '#b4c0d8', 0.18)
      shape(3.2, INK)
      shape(1.8, '#57534e')
      shape(0.6, '#a8a29e')
      for (const s of [-1, 1]) {
        g.beginPath()
        g.moveTo(x + s * arms, foot - 4.4)
        g.lineTo(x + s * (arms + 1.6), foot - 5.6)
        g.lineTo(x + s * (arms - 0.4), foot - 6.4)
        g.closePath()
        g.lineWidth = 1
        g.strokeStyle = INK
        g.stroke()
        g.fillStyle = '#7a2c10'
        g.fill()
      }
      break
    }
    default:
      // A clod of grave dirt, painted like the Dust Devil's, with a dusty halo to lift it.
      glow(g, x, y, 6, '#c9a274', 0.25)
      drawClod(g, { x, y })
  }
  g.restore()
}

/** Stand-in palettes for foes whose portraits are still being painted. */
const STAND_IN: Record<string, [string, string, string]> = {
  gunslinger: ['#e7e0cf', '#7c2d12', '#ef4444'],
  monk: ['#a5f3fc', '#164e63', '#67e8f9'],
  ghoul: ['#a3a380', '#3f3f2a', '#facc15'],
  drowned: ['#5eead4', '#134e4a', '#ccfbf1'],
  leech: ['#7f1d1d', '#450a0a', '#fca5a5'],
  harpy: ['#94a3b8', '#1e293b', '#fde68a'],
  wraith: ['#c7d2fe', '#3730a3', '#e0e7ff'],
  imp: ['#fb923c', '#7c2d12', '#fde68a'],
  acolyte: ['#dc2626', '#450a0a', '#fecaca'],
  shade: ['#6b21a8', '#1e1b4b', '#e879f9'],
  sister: ['#e7e5e4', '#44403c', '#fbbf24'],
}

export type StandInFoe = {
  kind: string
  x: number
  y: number
  t: number
  phase: string
  face: number
  hw: number
  cy: number
  hh: number
}

/** A simple shaded body for a foe the slice's foeArt doesn't draw yet; glows during its tell. */
export function drawStandInFoe(g: G, f: StandInFoe, tick: number) {
  const [body, dark, eye] = STAND_IN[f.kind] ?? [
    '#d6d3d1',
    '#44403c',
    '#fde68a',
  ]
  const cx = f.x
  const cy = f.y - f.cy
  const bob = Math.sin((f.t + tick) / 8) * 1
  g.save()
  if (f.phase === 'aim') glow(g, cx, cy, f.hw * 2.4, eye, 0.45)
  g.fillStyle = rgba(INK, 0.3)
  g.fillRect(cx - f.hw, f.y - 1, f.hw * 2, 2)
  const grad = g.createLinearGradient(cx - f.hw, 0, cx + f.hw, 0)
  grad.addColorStop(0, dark)
  grad.addColorStop(0.45, body)
  grad.addColorStop(1, dark)
  g.fillStyle = grad
  g.beginPath()
  g.ellipse(cx, cy + bob, f.hw, f.hh, 0, 0, Math.PI * 2)
  g.fill()
  g.fillStyle = INK
  g.fillRect(cx + f.face * 3 - 2, cy - f.hh * 0.45 + bob, 5, 3)
  g.fillStyle = eye
  g.fillRect(cx + f.face * 4 - 1, cy - f.hh * 0.45 + bob + 1, 2, 1)
  g.restore()
}

export type StandInBoss = {
  x: number
  y: number
  hw: number
  height: number
  t: number
  flash: number
  mode: string
  face: number
  phase: number
}

/** A stand-in body for a boss whose portrait is still being painted. */
export function drawStandInBoss(
  g: G,
  b: StandInBoss,
  color: string,
  tick: number,
) {
  g.save()
  const cy = b.y - b.height / 2
  glow(g, b.x, cy, b.height, color, b.mode.startsWith('wind') ? 0.6 : 0.25)
  const grad = g.createLinearGradient(b.x - b.hw, 0, b.x + b.hw, 0)
  grad.addColorStop(0, mix(color, INK, 0.6))
  grad.addColorStop(0.5, b.flash > 0 ? '#ffffff' : color)
  grad.addColorStop(1, mix(color, INK, 0.6))
  g.fillStyle = grad
  g.beginPath()
  g.ellipse(
    b.x,
    cy + Math.sin(tick / 10) * 1.5,
    b.hw,
    b.height / 2,
    0,
    0,
    Math.PI * 2,
  )
  g.fill()
  g.fillStyle = '#fde68a'
  g.fillRect(b.x + b.face * 5 - 2, cy - b.height * 0.25, 4, 2)
  g.restore()
}

// --- cards ---------------------------------------------------------------------------------------

export type Card = {
  kind: 'title' | 'story' | 'credits'
  /** Big line (stage name), small line (act name), and the body text. */
  heading: string
  sub?: string
  lines: string[]
  /** Ticks shown so far. */
  age: number
}

/** The book page every card is lettered on (screen space). */
const PAGE = { x: 16, y: 34, w: 288, h: 182 }
const PAGE_M = 5
const INK_TEXT = '#3a1e10'
const RUBRIC = '#9a1a24'
const ULTRAMARINE = '#26307a'

/** Aged vellum with an illuminated border: crimson and ultramarine rules, gold, vines, gems. */
function paintPage(b: G, w: number, h: number, d: number) {
  b.translate(PAGE_M, PAGE_M)
  const vellum = b.createRadialGradient(
    w * 0.45,
    h * 0.42,
    10,
    w / 2,
    h / 2,
    w * 0.68,
  )
  vellum.addColorStop(0, '#f4e6c4')
  vellum.addColorStop(0.55, '#e6cf9e')
  vellum.addColorStop(1, '#bf9a64')
  b.fillStyle = vellum
  b.fillRect(0, 0, w, h)
  // Fibres, foxing and a darker, handled edge.
  const rand = seeded(7717)
  for (let i = 0; i < 420; i++) {
    b.fillStyle = rgba(i % 3 ? '#8a6a3a' : '#5a3a1a', 0.05 + rand() * 0.12)
    b.fillRect(rand() * w, rand() * h, 0.5 + rand() * 2.5, 0.35)
  }
  for (let i = 0; i < 9; i++) {
    const fx = rand() * w
    const fy = rand() * h
    const fr = 1 + rand() * 3
    const fox = b.createRadialGradient(fx, fy, 0, fx, fy, fr)
    fox.addColorStop(0, rgba('#9a6a30', 0.18))
    fox.addColorStop(1, rgba('#9a6a30', 0))
    b.fillStyle = fox
    b.fillRect(fx - fr, fy - fr, fr * 2, fr * 2)
  }
  for (const [x0, y0, x1, y1, rx, ry, rw, rh] of [
    [0, 0, 0, 10, 0, 0, w, 10],
    [0, h, 0, h - 10, 0, h - 10, w, 10],
    [0, 0, 10, 0, 0, 0, 10, h],
    [w, 0, w - 10, 0, w - 10, 0, 10, h],
  ] as const) {
    const edge = b.createLinearGradient(x0, y0, x1, y1)
    edge.addColorStop(0, rgba('#6a4218', 0.45))
    edge.addColorStop(1, rgba('#6a4218', 0))
    b.fillStyle = edge
    b.fillRect(rx, ry, rw, rh)
  }
  // The border: crimson, gold and ultramarine rules.
  b.strokeStyle = RUBRIC
  b.lineWidth = 1.4
  b.strokeRect(7, 7, w - 14, h - 14)
  b.strokeStyle = goldGradient(b, 0, h)
  b.lineWidth = 0.8
  b.strokeRect(9.2, 9.2, w - 18.4, h - 18.4)
  b.strokeStyle = ULTRAMARINE
  b.lineWidth = 0.9
  b.strokeRect(10.8, 10.8, w - 21.6, h - 21.6)
  // A ladder of tiny gold dots between the outer rules, as a scribe would rule them.
  b.fillStyle = rgba('#c08a2a', 0.8)
  for (let x = 14; x < w - 14; x += 4) {
    b.fillRect(x, 4.2, 0.7, 0.7)
    b.fillRect(x, h - 4.9, 0.7, 0.7)
  }
  for (let y = 14; y < h - 14; y += 4) {
    b.fillRect(4.2, y, 0.7, 0.7)
    b.fillRect(w - 4.9, y, 0.7, 0.7)
  }
  // Vines curling out of each corner: gold stems, green leaves, red berries.
  const vine = (cx: number, cy: number, sx: 1 | -1, sy: 1 | -1) => {
    b.save()
    b.translate(cx, cy)
    b.scale(sx, sy)
    b.lineCap = 'round'
    const stem = () => {
      b.beginPath()
      b.moveTo(0, 0)
      b.bezierCurveTo(10, 1, 18, 6, 26, 4)
      b.moveTo(0, 0)
      b.bezierCurveTo(1, 10, 6, 18, 4, 26)
      b.moveTo(9, 2)
      b.quadraticCurveTo(12, 8, 8, 10)
    }
    stem()
    b.strokeStyle = rgba(INK, 0.6)
    b.lineWidth = 1.3
    b.stroke()
    stem()
    b.strokeStyle = goldGradient(b, -2, 12)
    b.lineWidth = 0.6
    b.stroke()
    for (const [lx, ly, a] of [
      [16, 4.8, -0.5],
      [22, 5.2, 0.4],
      [4.8, 16, 1.9],
      [5.2, 22, 1.2],
    ] as const) {
      b.save()
      b.translate(lx, ly)
      b.rotate(a)
      b.fillStyle = '#3a6a3a'
      b.beginPath()
      b.ellipse(0, 0, 2.2, 1, 0, 0, Math.PI * 2)
      b.fill()
      b.fillStyle = rgba('#8ac07a', 0.8)
      b.fillRect(-1.2, -0.4, 1.6, 0.35)
      b.restore()
    }
    for (const [bx, by] of [
      [8, 10],
      [12, 8.5],
    ] as const) {
      b.fillStyle = '#b01a2a'
      b.beginPath()
      b.arc(bx, by, 0.9, 0, Math.PI * 2)
      b.fill()
      b.fillStyle = rgba('#ffd0c0', 0.8)
      b.fillRect(bx - 0.5, by - 0.6, 0.4, 0.4)
    }
    curl(b, 3.5, 3.5, 2.6, Math.PI * 0.25, Math.PI * 1.7)
    b.restore()
  }
  vine(12, 12, 1, 1)
  vine(w - 12, 12, -1, 1)
  vine(12, h - 12, 1, -1)
  vine(w - 12, h - 12, -1, -1)
  // The page's gold frame, like the HUD's.
  paintRing(b, w, h, d, true)
}

/** A small gold bell, the trail's mark, centred on (x, y). */
function bellMark(g: G, x: number, y: number, s: number) {
  g.save()
  g.translate(x, y)
  g.beginPath()
  g.moveTo(-s * 0.2, -s * 0.5)
  g.quadraticCurveTo(-s * 0.42, -s * 0.38, -s * 0.42, 0)
  g.quadraticCurveTo(-s * 0.45, s * 0.3, -s * 0.6, s * 0.45)
  g.lineTo(s * 0.6, s * 0.45)
  g.quadraticCurveTo(s * 0.45, s * 0.3, s * 0.42, 0)
  g.quadraticCurveTo(s * 0.42, -s * 0.38, s * 0.2, -s * 0.5)
  g.closePath()
  g.strokeStyle = INK
  g.lineWidth = 1.2
  g.stroke()
  g.fillStyle = goldGradient(g, -s * 0.5, s * 0.5)
  g.fill()
  g.fillStyle = rgba('#fff3c4', 0.8)
  g.fillRect(-s * 0.28, -s * 0.25, s * 0.1, s * 0.45)
  g.fillStyle = INK
  g.beginPath()
  g.arc(0, s * 0.55, s * 0.12, 0, Math.PI * 2)
  g.fill()
  g.restore()
}

/** A wax seal pressed with the bell, two ribbon tails beneath. */
function waxSeal(g: G, x: number, y: number) {
  g.save()
  for (const [dx, a] of [
    [-3, 0.35],
    [3, -0.35],
  ] as const) {
    g.save()
    g.translate(x + dx, y + 4)
    g.rotate(a)
    g.fillStyle = '#7a1420'
    g.beginPath()
    g.moveTo(-2, 0)
    g.lineTo(2, 0)
    g.lineTo(2, 10)
    g.lineTo(0, 8.5)
    g.lineTo(-2, 10)
    g.closePath()
    g.fill()
    g.restore()
  }
  g.fillStyle = '#5a0c14'
  g.beginPath()
  for (let i = 0; i <= 14; i++) {
    const a = (i / 14) * Math.PI * 2
    const r = 7.5 + (i % 2) * 0.8
    g.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r)
  }
  g.closePath()
  g.fill()
  const wax = g.createRadialGradient(x - 2, y - 2, 0, x, y, 7)
  wax.addColorStop(0, '#d0303e')
  wax.addColorStop(1, '#8a1420')
  g.fillStyle = wax
  g.beginPath()
  g.arc(x, y, 6, 0, Math.PI * 2)
  g.fill()
  g.strokeStyle = rgba('#3a0408', 0.7)
  g.lineWidth = 0.6
  g.beginPath()
  g.arc(x, y, 4.6, 0, Math.PI * 2)
  g.stroke()
  g.fillStyle = rgba('#3a0408', 0.75)
  g.beginPath()
  g.moveTo(x - 1, y - 2.6)
  g.quadraticCurveTo(x - 2.4, y - 1.6, x - 2.2, y + 0.4)
  g.lineTo(x - 3, y + 1.8)
  g.lineTo(x + 3, y + 1.8)
  g.lineTo(x + 2.2, y + 0.4)
  g.quadraticCurveTo(x + 2.4, y - 1.6, x + 1, y - 2.6)
  g.closePath()
  g.fill()
  g.fillStyle = rgba('#ffb0b0', 0.5)
  g.fillRect(x - 3.5, y - 3.6, 2.2, 0.6)
  g.restore()
}

/** An illuminated initial: the letter in gold on a crimson and ultramarine square. */
function dropCap(g: G, ch: string, x: number, y: number) {
  const s = 20
  g.save()
  g.fillStyle = INK
  g.fillRect(x - 1, y - 1, s + 2, s + 2)
  g.fillStyle = goldGradient(g, y, y + s)
  g.fillRect(x, y, s, s)
  g.fillStyle = RUBRIC
  g.fillRect(x + 1.5, y + 1.5, s - 3, s - 3)
  g.fillStyle = ULTRAMARINE
  g.beginPath()
  g.moveTo(x + 1.5, y + 1.5)
  g.lineTo(x + s - 1.5, y + 1.5)
  g.lineTo(x + 1.5, y + s - 1.5)
  g.closePath()
  g.fill()
  // White filigree in the field.
  g.strokeStyle = rgba('#f4e6c4', 0.55)
  g.lineWidth = 0.4
  for (const [cx, cy] of [
    [x + 4, y + 4],
    [x + s - 4, y + s - 4],
  ] as const) {
    g.beginPath()
    g.arc(cx, cy, 1.6, 0, Math.PI * 1.5)
    g.stroke()
  }
  g.restore()
  hudText(g, ch, x + s / 2, y + (s - FONT_HEIGHT * 2) / 2, {
    scale: 2,
    color: ['#fff3c4', '#e0a032'],
    align: 'center',
  })
}

/**
 * A full-screen card (screen space) over the dimmed scene, lettered on an illuminated book page:
 * the heading on the HUD's ornate ribbon banner, the body in scribe's ink (its first letter an
 * illuminated initial), typed out as the page is read. A story page carries a wax seal; the
 * credits roll up the page, their section heads rubricated in red.
 */
export function drawCard(g: G, card: Card) {
  const age = Math.max(0, card.age)
  const fade = Math.min(1, age / 20)
  const rise = (1 - Math.min(1, age / 16)) ** 2 * 8
  g.save()
  // Dim the scene and darken its edges, so the page is the only thing lit.
  g.fillStyle = rgba('#0b0614', 0.8 * fade)
  g.fillRect(0, 0, W, H)
  const vig = g.createRadialGradient(W / 2, H / 2, 60, W / 2, H / 2, 210)
  vig.addColorStop(0, rgba('#000000', 0))
  vig.addColorStop(1, rgba('#000000', 0.5 * fade))
  g.fillStyle = vig
  g.fillRect(0, 0, W, H)
  g.globalAlpha = fade
  g.translate(0, rise)
  // A soft shadow under the page, then the page.
  g.fillStyle = rgba('#000000', 0.45)
  g.fillRect(PAGE.x + 3, PAGE.y + 4, PAGE.w, PAGE.h)
  const d = densityOf(g)
  drawBaked(
    g,
    `gt-card-page-${PAGE.w}x${PAGE.h}`,
    PAGE.x - PAGE_M,
    PAGE.y - PAGE_M,
    PAGE.w + PAGE_M * 2,
    PAGE.h + PAGE_M * 2,
    (b) => paintPage(b, PAGE.w, PAGE.h, d),
  )
  bellMark(g, W / 2, PAGE.y + 1, 9)
  // The heading on the ribbon banner (it unfurls as the page arrives).
  drawBanner(g, card.heading, card.sub, Math.max(0, age - 6))
  const bottom = PAGE.y + PAGE.h - 11
  if (card.kind === 'credits') {
    // The roll: lines rise through a window in the page and fade at its edges.
    const win0 = card.sub ? 104 : 96
    const win1 = bottom - 6
    const y0 = win1 + 4 - age * 0.35
    g.save()
    g.beginPath()
    g.rect(PAGE.x + 12, win0 - 2, PAGE.w - 24, win1 - win0 + 4)
    g.clip()
    card.lines.forEach((line, i) => {
      const y = y0 + i * 12
      if (y < win0 - 10 || y > win1 + 2 || !line) return
      const a = Math.max(0, Math.min(1, (y - win0) / 12, (win1 - y) / 12))
      g.globalAlpha = fade * a
      const head = i === 0 || card.lines[i - 1] === ''
      drawText(g, line, W / 2, y, {
        align: 'center',
        color: head ? RUBRIC : INK_TEXT,
      })
    })
    // A tailpiece after the last line.
    const ty = y0 + card.lines.length * 12 + 8
    if (ty > win0 - 10 && ty < win1 + 10) {
      g.globalAlpha =
        fade * Math.max(0, Math.min(1, (ty - win0) / 12, (win1 - ty) / 12))
      bellMark(g, W / 2, ty, 10)
      curl(g, W / 2 - 10, ty + 1, 3, 0, Math.PI * 1.6)
      curl(g, W / 2 + 10, ty + 1, 3, Math.PI, -Math.PI * 1.6)
    }
    g.restore()
  } else {
    // The body: left-aligned in a centred block, an illuminated initial beside it.
    const lines = card.lines.slice(0, 6)
    const first = lines[0] ?? ''
    const capChar = /^[A-Z]/.test(first) ? first[0]! : ''
    const indent = capChar ? 26 : 0
    const widths = lines.map((l, i) =>
      measureText(i === 0 && capChar ? l.slice(1) : l, 1),
    )
    const blockW = indent + Math.max(0, ...widths)
    const left = Math.round(W / 2 - blockW / 2)
    const y0 = card.sub ? 112 : 106
    if (capChar) dropCap(g, capChar, left, y0 - 4)
    let budget = Math.floor(age / 2)
    lines.forEach((line, i) => {
      if (budget <= 0) return
      const text = i === 0 && capChar ? line.slice(1) : line
      const shown = text.slice(0, budget)
      budget -= text.length
      drawText(g, shown, left + indent, y0 + i * 12, { color: INK_TEXT })
    })
    // A scribe's divider under the text: a gold rule, a gem, two curls.
    const total = lines.reduce((n, l) => n + l.length, 0)
    const ready = Math.max(0, Math.min(1, (age / 2 - total + 8) / 16))
    if (ready > 0) {
      const dy = Math.min(bottom - 30, y0 + Math.max(2, lines.length) * 12 + 10)
      g.save()
      g.globalAlpha *= ready
      const half = 56
      const rule = g.createLinearGradient(W / 2 - half, 0, W / 2 + half, 0)
      rule.addColorStop(0, rgba('#c08a2a', 0))
      rule.addColorStop(0.5, rgba('#c08a2a', 0.95))
      rule.addColorStop(1, rgba('#c08a2a', 0))
      g.fillStyle = rule
      g.fillRect(W / 2 - half, dy, half * 2, 0.8)
      curl(g, W / 2 - 12, dy + 0.4, 3, 0, Math.PI * 1.6)
      curl(g, W / 2 + 12, dy + 0.4, 3, Math.PI, -Math.PI * 1.6)
      g.fillStyle = INK
      g.beginPath()
      g.moveTo(W / 2, dy - 3.4)
      g.lineTo(W / 2 + 3.4, dy + 0.4)
      g.lineTo(W / 2, dy + 4.2)
      g.lineTo(W / 2 - 3.4, dy + 0.4)
      g.fill()
      g.fillStyle = RUBRIC
      g.beginPath()
      g.moveTo(W / 2, dy - 2.4)
      g.lineTo(W / 2 + 2.4, dy + 0.4)
      g.lineTo(W / 2, dy + 3.2)
      g.lineTo(W / 2 - 2.4, dy + 0.4)
      g.fill()
      g.fillStyle = rgba('#ffd0c0', 0.8)
      g.fillRect(W / 2 - 1, dy - 1.2, 1, 1)
      g.restore()
    }
    if (card.kind === 'story') waxSeal(g, PAGE.x + PAGE.w - 52, bottom - 16)
    if (age > 40 && Math.floor(age / 20) % 2 === 0)
      drawText(g, 'PRESS A', W / 2, bottom - 14, {
        align: 'center',
        color: rgba(RUBRIC, 0.85),
      })
  }
  g.restore()
}

// --- the tower interior ---------------------------------------------------------------------------

/**
 * Inside the bell tower (screen space, over the backdrop): as the view climbs (`camY` below 0) the
 * town fades behind the tower's own stone: brick walls in two parallax planes, tall arched windows
 * that still show the night sky, hanging bell ropes and wall torches. `rise` 0..1 fades it in.
 */
export function drawTowerInterior(
  g: G,
  camX: number,
  camY: number,
  rise: number,
  tick: number,
) {
  if (rise <= 0) return
  g.save()
  g.globalAlpha = rise
  // The far wall: dark stone, warmer toward the torches below.
  const wall = g.createLinearGradient(0, 0, 0, H)
  wall.addColorStop(0, '#1a1220')
  wall.addColorStop(1, '#2a1a22')
  g.fillStyle = wall
  g.fillRect(0, 0, W, H)
  // Far brick courses, drifting slowly.
  const fx = -(camX * 0.25) % 32
  const fy = -(camY * 0.25) % 16
  g.fillStyle = rgba('#000000', 0.25)
  for (let y = fy - 16; y < H; y += 16) {
    g.fillRect(0, y, W, 1)
    const off = Math.floor((y - fy) / 16) % 2 ? 16 : 0
    for (let x = fx - 32 + off; x < W; x += 32) g.fillRect(x, y, 1, 16)
  }
  // Tall arched windows with the sky beyond, one every 120 px of far wall.
  const wx = -(camX * 0.25) % 120
  const wy = (-(camY * 0.25) % 180) - 40
  for (let x = wx - 120; x < W + 120; x += 120)
    for (let y = wy - 180; y < H + 60; y += 180) {
      const sky = g.createLinearGradient(0, y, 0, y + 90)
      sky.addColorStop(0, '#3b3a78')
      sky.addColorStop(1, '#1e1b4b')
      g.fillStyle = sky
      g.beginPath()
      g.moveTo(x + 40, y + 90)
      g.lineTo(x + 40, y + 24)
      g.arc(x + 54, y + 24, 14, Math.PI, 0)
      g.lineTo(x + 68, y + 90)
      g.closePath()
      g.fill()
      // A sill and mullion.
      g.fillStyle = '#3f2a2f'
      g.fillRect(x + 38, y + 90, 32, 3)
      g.fillRect(x + 53, y + 12, 2, 78)
      // A star or two.
      const tw = (tick / 20 + x * 0.1 + y * 0.07) % 3 < 1.5 ? 1 : 0.4
      g.fillStyle = rgba('#e0e7ff', 0.7 * tw)
      g.fillRect(x + 46, y + 30, 1, 1)
      g.fillRect(x + 61, y + 52, 1, 1)
    }
  // The near wall's piers, faster, framing the climb.
  const px = -(camX * 0.6) % 160
  for (let x = px - 160; x < W + 160; x += 160) {
    const pier = g.createLinearGradient(x, 0, x + 26, 0)
    pier.addColorStop(0, '#24161c')
    pier.addColorStop(0.4, '#4a3036')
    pier.addColorStop(1, '#1c1116')
    g.fillStyle = pier
    g.fillRect(x, 0, 26, H)
    g.fillStyle = rgba('#000000', 0.3)
    const py = -(camY * 0.6) % 24
    for (let y = py - 24; y < H; y += 24) g.fillRect(x, y, 26, 1)
    // A torch on every other pier.
    if (Math.floor((x - px) / 160) % 2 === 0) {
      const ty = (((-(camY * 0.6) % 220) + 220) % 220) + 10
      const fl = 0.8 + 0.2 * Math.sin(tick / 5 + x)
      glow(g, x + 13, ty, 34 * fl, '#f97316', 0.35)
      g.fillStyle = '#fde68a'
      g.fillRect(x + 12, ty - 3, 2, 4)
      g.fillStyle = '#3f2a2f'
      g.fillRect(x + 10, ty + 1, 6, 3)
    }
  }
  // Bell ropes hanging the height of the tower.
  const rx = -(camX * 0.45) % 210
  g.strokeStyle = rgba('#a07a45', 0.55)
  g.lineWidth = 1
  for (let x = rx + 90; x < W + 210; x += 210) {
    const sway = Math.sin(tick / 40 + x) * 1.5
    g.beginPath()
    g.moveTo(x, 0)
    g.lineTo(x + sway, H)
    g.stroke()
  }
  g.restore()
}
