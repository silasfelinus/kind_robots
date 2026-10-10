// /utils/arcade/snes.ts
//
// The arcade's 16-bit style kit (conductor kr-arcade m6). Silas, 2026-10-10: "Right now they all
// look like they could have come from an atari, and I want Super nes." The early cabinets draw with
// flat single-colour rectangles; this kit is the shared vocabulary that lifts a cabinet to the
// Super NES bar, so each upgrade is a render pass, not a new engine:
//
//   - colour ramps: five steps from shadow to highlight, hue-shifted (cool shadows, warm lights)
//     the way 16-bit sprite artists shaded, in the Kind Robots palette;
//   - banded gradients: skies and water in stepped HDMA-style bands, not a smooth CSS fade;
//   - pixel sprites: art written as rows of palette letters, outlined automatically, baked once to
//     an offscreen canvas and always drawn with nearest filtering, so they stay crisp in HD too;
//   - shaded orbs and bevelled blocks: the banded sphere and the lit-tile look;
//   - parallax ridges, clouds and twinkling stars for layered backdrops;
//   - additive glows and sparkle bursts (the SNES colour-math look);
//   - framed HUD panels and gauges, and outlined lettering (font.ts `outline`).
//
// Everything draws in the game's logical units under the cabinet's transform and is safe headless
// (no document: sprites fall back to fillRect runs), so the engine test still runs every game.

// --- colour -------------------------------------------------------------------------------------

/** A five-step ramp: [deep shadow, shadow, base, light, highlight]. */
export type Ramp = readonly [string, string, string, string, string]

export const RAMPS = {
  teal: ['#0b3a4a', '#0f6b73', '#14a3a0', '#5eead4', '#d1fff5'],
  pink: ['#5b1446', '#9d2a6e', '#ec4899', '#f9a8d4', '#fff0f7'],
  purple: ['#24124f', '#4c2a99', '#7c5cf0', '#b9a5ff', '#f0ebff'],
  gold: ['#5a2a0c', '#a65f12', '#f2b52b', '#fde68a', '#fffbe6'],
  sky: ['#16245e', '#1f4fa8', '#3b8fe6', '#8fd3ff', '#e6f7ff'],
  leaf: ['#123d2a', '#1d6b3a', '#3fa34d', '#9be36b', '#efffd6'],
  earth: ['#2e1a14', '#5c3424', '#8f5a3a', '#c9926a', '#f2d5b8'],
  steel: ['#1c2338', '#3b4763', '#6b7a99', '#b4c0d8', '#ffffff'],
  cream: ['#6b4a3a', '#b08968', '#e8cfb0', '#fbf0de', '#ffffff'],
  rust: ['#3a1408', '#7a2c10', '#c2541b', '#f59e5b', '#ffe0c2'],
  night: ['#07061a', '#120f33', '#1f1a52', '#322a7a', '#4d42a8'],
  water: ['#0a2a4a', '#13568a', '#2a8fc9', '#7cd3f2', '#e0fbff'],
  ember: ['#4a0d1a', '#a3172f', '#ef4444', '#fb923c', '#fef08a'],
} as const satisfies Record<string, Ramp>

export type RampName = keyof typeof RAMPS

/** The outline 16-bit sprites wear: a deep ink, never pure black. */
export const INK = '#140a26'

function channels(hex: string): [number, number, number] {
  const h = hex.replace('#', '')
  const full =
    h.length === 3
      ? h
          .split('')
          .map((c) => c + c)
          .join('')
      : h
  const n = parseInt(full.slice(0, 6), 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

function toHex(r: number, g: number, b: number): string {
  const c = (v: number) =>
    Math.max(0, Math.min(255, Math.round(v)))
      .toString(16)
      .padStart(2, '0')
  return `#${c(r)}${c(g)}${c(b)}`
}

/** `a` blended toward `b` by t (0..1), snapped to the SNES's 15-bit colour (5 bits a channel). */
export function mix(a: string, b: string, t: number): string {
  const [ar, ag, ab] = channels(a)
  const [br, bg, bb] = channels(b)
  const snap = (v: number) => Math.round(v / 8) * 8
  return toHex(
    snap(ar + (br - ar) * t),
    snap(ag + (bg - ag) * t),
    snap(ab + (bb - ab) * t),
  )
}

/** A hex colour as rgba() with alpha `a`, for gradients that fade to clear. */
export function rgba(hex: string, a: number): string {
  const [r, g, b] = channels(hex)
  return `rgba(${r}, ${g}, ${b}, ${a})`
}

/**
 * Fill a rectangle with horizontal colour bands stepping through `stops` top to bottom: the
 * HDMA sky. `band` is each band's height in logical pixels.
 */
export function bandedGradient(
  g: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  stops: readonly string[],
  band = 4,
) {
  const count = Math.max(1, Math.ceil(h / band))
  for (let i = 0; i < count; i++) {
    const t = count === 1 ? 0 : i / (count - 1)
    const at = t * (stops.length - 1)
    const lo = Math.min(stops.length - 2, Math.floor(at))
    g.fillStyle =
      stops.length === 1 ? stops[0]! : mix(stops[lo]!, stops[lo + 1]!, at - lo)
    const top = y + i * band
    g.fillRect(x, top, w, Math.min(band, y + h - top))
  }
}

// --- pixel sprites ------------------------------------------------------------------------------

export type PixelSprite = {
  readonly width: number
  readonly height: number
  /** Colour per pixel, row-major, null where clear; the outline is already included. */
  readonly pixels: readonly (string | null)[]
  baked?: HTMLCanvasElement | null
}

/**
 * A sprite from rows of palette letters: '.' or ' ' is clear, every other character looks up
 * `palette`. With `outline` (the default is INK; pass null for none) every clear pixel touching
 * the art on a side becomes the outline, so the sprite grows by one pixel each way.
 */
export function pixelSprite(
  rows: readonly string[],
  palette: Record<string, string>,
  options: { outline?: string | null } = {},
): PixelSprite {
  const outline = options.outline === undefined ? INK : options.outline
  const pad = outline ? 1 : 0
  const srcW = Math.max(...rows.map((r) => r.length))
  const srcH = rows.length
  const width = srcW + pad * 2
  const height = srcH + pad * 2
  const pixels: (string | null)[] = new Array(width * height).fill(null)
  const at = (x: number, y: number) => {
    const ch = rows[y]?.[x]
    if (!ch || ch === '.' || ch === ' ') return null
    const colour = palette[ch]
    if (!colour) throw new Error(`pixelSprite: no colour for "${ch}"`)
    return colour
  }
  for (let y = 0; y < srcH; y++) {
    for (let x = 0; x < srcW; x++) {
      const colour = at(x, y)
      if (colour) pixels[(y + pad) * width + x + pad] = colour
    }
  }
  if (outline) {
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        if (pixels[y * width + x]) continue
        const sx = x - pad
        const sy = y - pad
        if (
          at(sx - 1, sy) ||
          at(sx + 1, sy) ||
          at(sx, sy - 1) ||
          at(sx, sy + 1)
        )
          pixels[y * width + x] = outline
      }
    }
  }
  return { width, height, pixels }
}

/** The sprite with its columns mirrored (cheaper than a flipped draw for a sprite used a lot). */
export function mirrorSprite(sprite: PixelSprite): PixelSprite {
  const { width, height } = sprite
  const pixels: (string | null)[] = new Array(width * height)
  for (let y = 0; y < height; y++)
    for (let x = 0; x < width; x++)
      pixels[y * width + x] = sprite.pixels[y * width + (width - 1 - x)]!
  return { width, height, pixels }
}

function paintPixels(
  g: CanvasRenderingContext2D,
  sprite: PixelSprite,
  x: number,
  y: number,
) {
  const { width, height, pixels } = sprite
  for (let row = 0; row < height; row++) {
    let col = 0
    while (col < width) {
      const colour = pixels[row * width + col]
      if (!colour) {
        col++
        continue
      }
      let run = 1
      while (col + run < width && pixels[row * width + col + run] === colour)
        run++
      g.fillStyle = colour
      g.fillRect(x + col, y + row, run, 1)
      col += run
    }
  }
}

function bake(sprite: PixelSprite): HTMLCanvasElement | null {
  if (sprite.baked !== undefined) return sprite.baked
  if (typeof document === 'undefined') return (sprite.baked = null)
  const canvas = document.createElement('canvas')
  canvas.width = sprite.width
  canvas.height = sprite.height
  const g = canvas.getContext('2d')
  if (!g) return (sprite.baked = null)
  paintPixels(g, sprite, 0, 0)
  return (sprite.baked = canvas)
}

export type SpriteDrawOptions = {
  /** Where (x, y) sits on the sprite: its centre (the default), top-left, or bottom-centre (feet). */
  anchor?: 'center' | 'topleft' | 'feet'
  flipX?: boolean
  flipY?: boolean
  /** Whole-number magnification in logical pixels. */
  scale?: number
  alpha?: number
}

/** Draw a pixel sprite, always with nearest filtering so it stays crisp in the HD style. */
export function drawSprite(
  g: CanvasRenderingContext2D,
  sprite: PixelSprite,
  x: number,
  y: number,
  options: SpriteDrawOptions = {},
) {
  const scale = options.scale ?? 1
  const w = sprite.width * scale
  const h = sprite.height * scale
  const anchor = options.anchor ?? 'center'
  const left = Math.round(anchor === 'topleft' ? x : x - w / 2)
  const top = Math.round(
    anchor === 'topleft' ? y : anchor === 'feet' ? y - h : y - h / 2,
  )
  g.save()
  if (options.alpha !== undefined) g.globalAlpha *= options.alpha
  g.imageSmoothingEnabled = false
  g.translate(left + (options.flipX ? w : 0), top + (options.flipY ? h : 0))
  g.scale(options.flipX ? -scale : scale, options.flipY ? -scale : scale)
  const baked = bake(sprite)
  if (baked) g.drawImage(baked, 0, 0)
  else paintPixels(g, sprite, 0, 0)
  g.restore()
}

// --- shading ------------------------------------------------------------------------------------

/**
 * A sphere shaded in bands: the ramp's darkest disc first, each lighter disc smaller and pulled
 * toward the light (upper left), then a specular glint. With `outline`, an ink ring first.
 */
export function shadedOrb(
  g: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
  ramp: Ramp,
  options: { outline?: string | null; glint?: boolean } = {},
) {
  const outline = options.outline === undefined ? INK : options.outline
  if (outline) {
    g.fillStyle = outline
    g.beginPath()
    g.arc(x, y, r + 1, 0, Math.PI * 2)
    g.fill()
  }
  const steps: [number, number, number][] = [
    [0, 0, 1],
    [-0.08, -0.1, 0.86],
    [-0.18, -0.22, 0.64],
    [-0.3, -0.34, 0.36],
  ]
  steps.forEach(([dx, dy, k], i) => {
    g.fillStyle = ramp[i + 1]!
    g.beginPath()
    g.arc(x + dx * r, y + dy * r, r * k, 0, Math.PI * 2)
    g.fill()
  })
  if (options.glint !== false && r >= 3) {
    g.fillStyle = '#ffffff'
    const s = Math.max(1, Math.round(r / 5))
    g.fillRect(Math.round(x - r * 0.42), Math.round(y - r * 0.48), s, s)
  }
}

/**
 * A lit block: `ramp[2]` face, a highlight on the top and left edges and a shadow on the bottom
 * and right, `depth` pixels thick, with an ink outline unless `outline` is null.
 */
export function bevel(
  g: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  ramp: Ramp,
  options: { depth?: number; outline?: string | null } = {},
) {
  const d = options.depth ?? 2
  const outline = options.outline === undefined ? INK : options.outline
  if (outline) {
    g.fillStyle = outline
    g.fillRect(x - 1, y - 1, w + 2, h + 2)
  }
  g.fillStyle = ramp[1]
  g.fillRect(x, y, w, h)
  g.fillStyle = ramp[3]
  g.fillRect(x, y, w - d, h - d)
  g.fillStyle = ramp[2]
  g.fillRect(x + d, y + d, w - d * 2, h - d * 2)
  g.fillStyle = ramp[4]
  g.fillRect(x, y, Math.max(1, Math.min(d, w)), 1)
  g.fillRect(x, y, 1, Math.max(1, Math.min(d, h)))
}

/** A soft oval shadow on the ground under a sprite. */
export function dropShadow(
  g: CanvasRenderingContext2D,
  x: number,
  y: number,
  rx: number,
  ry: number,
  alpha = 0.35,
) {
  g.save()
  g.globalAlpha *= alpha
  g.fillStyle = INK
  g.beginPath()
  g.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2)
  g.fill()
  g.restore()
}

/** An additive glow (colour math): light that brightens what is under it. */
export function glow(
  g: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
  colour: string,
  alpha = 0.6,
) {
  if (r <= 0) return
  g.save()
  g.globalCompositeOperation = 'lighter'
  const grad = g.createRadialGradient(x, y, 0, x, y, r)
  grad.addColorStop(0, rgba(colour, alpha))
  grad.addColorStop(1, rgba(colour, 0))
  g.fillStyle = grad
  g.beginPath()
  g.arc(x, y, r, 0, Math.PI * 2)
  g.fill()
  g.restore()
}

/** Darken the screen's edges a touch, so the play area reads as lit and the corners recede. */
export function vignette(
  g: CanvasRenderingContext2D,
  w: number,
  h: number,
  strength = 0.35,
) {
  const grad = g.createRadialGradient(
    w / 2,
    h / 2,
    Math.min(w, h) * 0.35,
    w / 2,
    h / 2,
    Math.hypot(w, h) / 2,
  )
  grad.addColorStop(0, rgba(INK, 0))
  grad.addColorStop(1, rgba(INK, strength))
  g.fillStyle = grad
  g.fillRect(0, 0, w, h)
}

// --- backdrops ----------------------------------------------------------------------------------

/** A deterministic generator for backdrop layout (never the game's rng, so play stays seeded). */
export function backdropRng(seed: number): () => number {
  let s = seed >>> 0 || 1
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0
    return s / 4294967296
  }
}

/** A ridge line for a parallax layer: heights above `base`, one per `step` pixels, wrapping. */
export function ridge(
  seed: number,
  width: number,
  amplitude: number,
  step = 4,
): number[] {
  const rand = backdropRng(seed)
  const n = Math.ceil(width / step)
  const phases = [rand() * 6.28, rand() * 6.28, rand() * 6.28]
  const out: number[] = []
  for (let i = 0; i < n; i++) {
    const t = (i / n) * Math.PI * 2
    const v =
      0.55 * Math.sin(t * 2 + phases[0]!) +
      0.3 * Math.sin(t * 5 + phases[1]!) +
      0.15 * Math.sin(t * 11 + phases[2]!)
    out.push(Math.round(((v + 1) / 2) * amplitude))
  }
  return out
}

/**
 * One parallax layer: the ridge filled down to `bottom`, scrolled by `offset`, with a lighter rim
 * along its top edge. The ridge wraps, so any offset tiles seamlessly.
 */
export function drawRidge(
  g: CanvasRenderingContext2D,
  heights: readonly number[],
  options: {
    base: number
    bottom: number
    width: number
    offset?: number
    step?: number
    fill: string
    rim?: string
  },
) {
  const step = options.step ?? 4
  const n = heights.length
  const offset = (((options.offset ?? 0) % (n * step)) + n * step) % (n * step)
  const first = Math.floor(offset / step)
  const shift = offset - first * step
  for (let i = 0; i * step - shift < options.width; i++) {
    const h = heights[(first + i) % n]!
    const x = Math.floor(i * step - shift)
    const top = options.base - h
    g.fillStyle = options.fill
    g.fillRect(x, top, step, options.bottom - top)
    if (options.rim) {
      g.fillStyle = options.rim
      g.fillRect(x, top, step, 1)
    }
  }
}

/** A puffy cloud of shaded orbs, lit from above. */
export function drawCloud(
  g: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  ramp: Ramp = RAMPS.cream,
) {
  const puffs: [number, number, number][] = [
    [-1.1, 0.25, 0.55],
    [-0.45, -0.15, 0.75],
    [0.35, -0.3, 0.85],
    [1.05, 0.15, 0.6],
    [0, 0.35, 0.7],
  ]
  for (const pass of [0, 1, 2] as const) {
    for (const [dx, dy, k] of puffs) {
      const r = size * k
      g.fillStyle = pass === 0 ? ramp[1] : pass === 1 ? ramp[3] : ramp[4]
      const ox = pass === 2 ? -r * 0.18 : 0
      const oy = pass === 0 ? r * 0.12 : pass === 2 ? -r * 0.22 : 0
      const rr = pass === 2 ? r * 0.55 : pass === 1 ? r * 0.92 : r
      g.beginPath()
      g.arc(x + dx * size + ox, y + dy * size + oy, rr, 0, Math.PI * 2)
      g.fill()
    }
  }
}

export type Star = { x: number; y: number; phase: number; size: 1 | 2 }

export function starField(
  seed: number,
  count: number,
  w: number,
  h: number,
): Star[] {
  const rand = backdropRng(seed)
  return Array.from({ length: count }, () => ({
    x: Math.floor(rand() * w),
    y: Math.floor(rand() * h),
    phase: rand() * Math.PI * 2,
    size: rand() < 0.15 ? 2 : 1,
  }))
}

/** Twinkling stars; the big ones flare into a four-point cross at their peak. */
export function drawStars(
  g: CanvasRenderingContext2D,
  stars: readonly Star[],
  tick: number,
  ramp: Ramp = RAMPS.purple,
) {
  for (const s of stars) {
    const twinkle = Math.sin(tick / 24 + s.phase)
    g.fillStyle = twinkle > 0.6 ? ramp[4] : twinkle > -0.2 ? ramp[3] : ramp[2]
    g.fillRect(s.x, s.y, 1, 1)
    if (s.size === 2 && twinkle > 0.75) {
      g.fillStyle = ramp[3]
      g.fillRect(s.x - 1, s.y, 3, 1)
      g.fillRect(s.x, s.y - 1, 1, 3)
    }
  }
}

// --- particles ----------------------------------------------------------------------------------

type Spark = {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  max: number
  colour: string
}

/**
 * Four-point sparkle bursts drawn additively: the 16-bit "something good happened". Owns no rng;
 * pass the game's, so a seeded game stays seeded.
 */
export class Sparkles {
  private sparks: Spark[] = []

  burst(
    x: number,
    y: number,
    rng: () => number,
    options: {
      count?: number
      colours?: readonly string[]
      speed?: number
    } = {},
  ) {
    const colours = options.colours ?? [
      RAMPS.gold[4],
      RAMPS.pink[3],
      RAMPS.teal[3],
    ]
    const speed = options.speed ?? 1.6
    for (let i = 0; i < (options.count ?? 8); i++) {
      const a = rng() * Math.PI * 2
      const v = speed * (0.4 + rng() * 0.8)
      const max = 18 + Math.floor(rng() * 14)
      this.sparks.push({
        x,
        y,
        vx: Math.cos(a) * v,
        vy: Math.sin(a) * v,
        life: max,
        max,
        colour: colours[Math.floor(rng() * colours.length)]!,
      })
    }
  }

  update() {
    for (const s of this.sparks) {
      s.x += s.vx
      s.y += s.vy
      s.vx *= 0.92
      s.vy = s.vy * 0.92 + 0.03
      s.life--
    }
    this.sparks = this.sparks.filter((s) => s.life > 0)
  }

  get count() {
    return this.sparks.length
  }

  render(g: CanvasRenderingContext2D) {
    g.save()
    g.globalCompositeOperation = 'lighter'
    for (const s of this.sparks) {
      const t = s.life / s.max
      const arm = t > 0.6 ? 2 : t > 0.25 ? 1 : 0
      const x = Math.round(s.x)
      const y = Math.round(s.y)
      g.globalAlpha = Math.min(1, t * 1.5)
      g.fillStyle = s.colour
      g.fillRect(x - arm, y, arm * 2 + 1, 1)
      g.fillRect(x, y - arm, 1, arm * 2 + 1)
      g.fillStyle = '#ffffff'
      g.fillRect(x, y, 1, 1)
    }
    g.restore()
  }
}

// --- HUD ----------------------------------------------------------------------------------------

/**
 * A framed HUD panel: ink border, a lit rim, a banded fill from `ramp[1]` to `ramp[0]`, and
 * clipped corners, the boxed status bar of a 16-bit game.
 */
export function hudPanel(
  g: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  ramp: Ramp = RAMPS.purple,
) {
  g.fillStyle = INK
  g.fillRect(x + 1, y - 1, w - 2, h + 2)
  g.fillRect(x - 1, y + 1, w + 2, h - 2)
  g.fillRect(x, y, w, h)
  bandedGradient(g, x + 1, y + 1, w - 2, h - 2, [ramp[2], ramp[1], ramp[0]], 2)
  g.fillStyle = ramp[3]
  g.fillRect(x + 2, y + 1, w - 4, 1)
  g.fillStyle = ramp[0]
  g.fillRect(x + 2, y + h - 2, w - 4, 1)
}

/** A gauge: a recessed trough with a shiny fill `amount` (0..1) of the way across. */
export function gauge(
  g: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  amount: number,
  ramp: Ramp,
) {
  g.fillStyle = INK
  g.fillRect(x - 1, y - 1, w + 2, h + 2)
  g.fillStyle = RAMPS.night[1]
  g.fillRect(x, y, w, h)
  g.fillStyle = RAMPS.night[0]
  g.fillRect(x, y, w, 1)
  const fill = Math.round(w * Math.max(0, Math.min(1, amount)))
  if (fill <= 0) return
  bandedGradient(g, x, y, fill, h, [ramp[4], ramp[3], ramp[2], ramp[1]], 1)
  g.fillStyle = 'rgba(255, 255, 255, 0.55)'
  g.fillRect(x + 1, y + 1, Math.max(0, fill - 2), 1)
}

// --- cached layers ------------------------------------------------------------------------------

const layers = new Map<string, HTMLCanvasElement | null>()

/**
 * A static layer (a tiled wall, a far backdrop) painted once at logical size, then copied each
 * frame with nearest filtering. Headless (no document) it paints straight onto `g` every time.
 * `key` names the layer; change it when what the layer shows changes.
 */
export function cachedLayer(
  g: CanvasRenderingContext2D,
  key: string,
  w: number,
  h: number,
  paint: (layer: CanvasRenderingContext2D) => void,
) {
  let canvas = layers.get(key)
  if (canvas === undefined) {
    canvas = null
    if (typeof document !== 'undefined') {
      const made = document.createElement('canvas')
      made.width = w
      made.height = h
      const lg = made.getContext('2d')
      if (lg) {
        paint(lg)
        canvas = made
      }
    }
    layers.set(key, canvas)
  }
  if (!canvas) {
    paint(g)
    return
  }
  g.save()
  g.imageSmoothingEnabled = false
  g.drawImage(canvas, 0, 0)
  g.restore()
}
