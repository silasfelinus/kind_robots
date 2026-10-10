// /utils/arcade/ghostTrail/hudArt.ts
//
// Zuzu: Ghost Trail's HUD, banners and boss bar (conductor kr-arcade t-013/t-014), drawn to the
// accepted mockups: a top strip no taller than 30 logical px with "1P" and a gold-framed portrait,
// hearts and relic bells over the score, a gold-framed weapon box (icon, cadence meter, name and
// in-flight pips), a centre "TRAIL n" plate with scroll flourishes over the stage name (its gold
// rule doubles as the trail-progress bar), TIME in big amber digits, and skulls for lives; a
// framed, ornate boss bar along the bottom; and a framed ribbon banner for the big centre calls.
//
// All of it is screen space in the 320x240 logical frame. Every word is drawn with font.ts's
// bitmap font (never image text). In HD the HUD lettering drops to a finer scale that still lands
// on whole device pixels (3 device px a font pixel at 4x), which is what lets the mockups' layout
// fit across 320 px; the Pixel style (1x) keeps scale 1 and a tighter layout. Frames are baked
// once per density with drawBaked; HUD strings are cached in a small LRU so the outline passes
// are paid once per distinct string, not every frame. Headless (no document) everything draws
// straight onto the context and never throws.

import { drawBaked, densityOf } from './bake'
import {
  drawText,
  FONT_HEIGHT,
  measureText,
  setTextStyle,
  textStyleOf,
} from '../font'
import { INK, rgba } from '../snes'

const W = 320

/** The tallest the top HUD strip gets, in logical px (the blueprint's ceiling). */
export const HUD_HEIGHT = 30
/** Hits Zuzu can take at full health: the poncho, then the tunic. */
export const HEART_SLOTS = 2
/** Skull slots before extra lives show as "+n". */
const SKULL_SLOTS = 3

// --- palette ------------------------------------------------------------------------------------

const GOLD_HI = '#fff3c4'
const GOLD_LIGHT = '#fbd56b'
const GOLD = '#e0a032'
const GOLD_DARK = '#8a4a12'
const BONE = '#f1e6c8'
const BONE_DIM = '#cdbb98'
const AMBER: readonly [string, string] = ['#fff2b0', '#f6a723']
const SHADOW = '#2a0f2e'
const PANEL_TOP = '#241740'
const PANEL_BOTTOM = '#100a22'
const CRIMSON = '#e11d48'

// --- state --------------------------------------------------------------------------------------

/** What the HUD shows, all plain values the game already tracks. */
export type HudState = {
  /** Current score (game `score`), shown as 7 digits under the hearts. */
  score: number
  /** Best score to show as HI: pass Math.max(hiScore, score). */
  hiScore: number
  /**
   * Lives including the one in play (game `lives`, START_LIVES = 3): each is a filled skull, the
   * three slots fill from the left, lost ones show hollow, and lives beyond three read "+n".
   */
  lives: number
  /**
   * Hits Zuzu can still take, lit hearts out of HEART_SLOTS: 2 with the poncho on, 1 in the
   * tunic (the next hit is fatal), 0 while he is down or the game is over. hitsFor() maps it.
   */
  hits: number
  /** Invulnerability ticks left (game `invuln`): the lit hearts blink while it is above 0. */
  invuln: number
  /** The weapon key handed to the weaponIcon callback (game `weapon`, e.g. 'kunai'). */
  weapon: string
  /** The weapon's name in the box (WEAPONS[weapon].label, e.g. 'KUNAI', 'IAI CUT'). */
  weaponLabel: string
  /** The weapon's in-flight cap (WEAPONS[weapon].max): one pip each under the name. */
  shotsMax: number
  /** Shots of this weapon in the air now; the pips they use show spent. */
  shotsOut: number
  /** Throw cadence 0..1: 1 - throwCooldown / WEAPONS[weapon].cooldown (1 = ready), the meter. */
  cadence: number
  /** Trail number (game `level`) for "TRAIL n". */
  trail: number
  /** Stage name (stage.name, e.g. 'GHOST TOWN') under the TRAIL plate. */
  stageName: string
  /** Seconds left, Math.ceil(timer / 60); 20 or under blinks crimson. */
  seconds: number
  /** Progress along the trail 0..1 (x / STAGE_END): the plate's gold rule fills and a gem marks it. */
  progress: number
  /** Relics found (foundSecrets.size): lit bells after the hearts. */
  relics: number
  /** Relics in all (STAGES.length): bell slots (above 6 they read as "n/m"). */
  relicsMax: number
  /** The boss while it fights (null otherwise, or while it dies): the bottom bar. */
  boss: { name: string; hp: number; maxHp: number; flash: number } | null
  /** Frame counter (game `tick`) for blinks. */
  tick: number
}

/** The game's hit rule as hearts: 2 with the poncho, 1 in the tunic, 0 while down. */
export function hitsFor(poncho: boolean, down: boolean): number {
  if (down) return 0
  return poncho ? 2 : 1
}

// --- text ---------------------------------------------------------------------------------------

type Fill = string | readonly [string, string]
type TextSpec = {
  scale: number
  color: Fill
  align?: 'left' | 'center' | 'right'
  /** Ink outline one font pixel thick (default INK); null for none. */
  outline?: string | null
  /** A drop of the outlined shape one font pixel down (default SHADOW); null for none. */
  shadow?: string | null
}

const OFFSETS = [
  [-1, 0],
  [1, 0],
  [0, -1],
  [0, 1],
  [-1, -1],
  [1, -1],
  [-1, 1],
  [1, 1],
] as const

const textCache = new Map<string, HTMLCanvasElement | null>()
const TEXT_CACHE_MAX = 96

function snap(v: number, d: number) {
  return Math.round(v * d) / d
}

function paintString(
  c: CanvasRenderingContext2D,
  text: string,
  scale: number,
  color: Fill,
  outline: string | null,
  shadow: string | null,
  canvasFor: (() => HTMLCanvasElement | null) | null,
) {
  // Drawn with its glyph box's top-left at (0, 0).
  const o = outline ? scale : 0
  if (shadow) {
    for (const [dx, dy] of OFFSETS)
      drawText(c, text, dx * o, dy * o + scale, { scale, color: shadow })
    drawText(c, text, 0, scale, { scale, color: shadow })
  }
  if (outline)
    for (const [dx, dy] of OFFSETS)
      drawText(c, text, dx * o, dy * o, { scale, color: outline })
  if (typeof color === 'string') {
    drawText(c, text, 0, 0, { scale, color })
    return
  }
  // A two-tone fill (top to bottom), the lettering's lit look: painted alone, gradient laid on
  // source-in, then composited.
  const tmp = canvasFor ? canvasFor() : null
  const t = tmp ? tmp.getContext('2d') : null
  if (!tmp || !t) {
    drawText(c, text, 0, 0, { scale, color: color[1] })
    return
  }
  t.setTransform(c.getTransform())
  setTextStyle(t, textStyleOf(c))
  drawText(t, text, 0, 0, { scale, color: '#ffffff' })
  t.globalCompositeOperation = 'source-in'
  const h = FONT_HEIGHT * scale
  const grad = t.createLinearGradient(0, 0, 0, h)
  grad.addColorStop(0, color[0])
  grad.addColorStop(0.45, color[0])
  grad.addColorStop(0.55, color[1])
  grad.addColorStop(1, color[1])
  t.fillStyle = grad
  t.fillRect(
    -scale,
    -scale,
    measureText(text, scale) + 2 * scale,
    h + 2 * scale,
  )
  c.save()
  c.setTransform(1, 0, 0, 1, 0, 0)
  c.drawImage(tmp, 0, 0)
  c.restore()
}

/**
 * Draw `text` with the bitmap font, ink-outlined and dropped, its glyph box's top at `y`. Cached
 * as a bitmap per (string, look, density) in a small LRU. Returns the glyphs' width.
 */
export function hudText(
  g: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  spec: TextSpec,
): number {
  const scale = spec.scale
  const outline = spec.outline === undefined ? INK : spec.outline
  const shadow = spec.shadow === undefined ? SHADOW : spec.shadow
  const width = measureText(text, scale)
  if (!text) return 0
  const d = densityOf(g, 8)
  const left = snap(
    spec.align === 'center'
      ? x - width / 2
      : spec.align === 'right'
        ? x - width
        : x,
    d,
  )
  const top = snap(y, d)
  const o = outline ? scale : 0
  const padTop = o
  const padBottom = o + (shadow ? scale : 0)
  if (typeof document === 'undefined') {
    g.save()
    g.translate(left, top)
    paintString(g, text, scale, spec.color, outline, shadow, null)
    g.restore()
    return width
  }
  const style = textStyleOf(g)
  const color =
    typeof spec.color === 'string' ? spec.color : spec.color.join('>')
  const key = `${text}|${scale}|${color}|${outline}|${shadow}|${d}|${style}`
  let canvas = textCache.get(key)
  if (canvas === undefined) {
    canvas = null
    const cw = Math.max(1, Math.ceil((width + 2 * o) * d))
    const ch = Math.max(
      1,
      Math.ceil((FONT_HEIGHT * scale + padTop + padBottom) * d),
    )
    const made = document.createElement('canvas')
    made.width = cw
    made.height = ch
    const c = made.getContext('2d')
    if (c) {
      setTextStyle(c, style)
      c.setTransform(d, 0, 0, d, o * d, padTop * d)
      paintString(c, text, scale, spec.color, outline, shadow, () => {
        const tmp = document.createElement('canvas')
        tmp.width = cw
        tmp.height = ch
        return tmp
      })
      canvas = made
    }
    if (textCache.size >= TEXT_CACHE_MAX) {
      const oldest = textCache.keys().next().value
      if (oldest !== undefined) textCache.delete(oldest)
    }
  } else textCache.delete(key)
  textCache.set(key, canvas)
  if (canvas)
    g.drawImage(
      canvas,
      left - o,
      top - padTop,
      canvas.width / d,
      canvas.height / d,
    )
  else {
    g.save()
    g.translate(left, top)
    paintString(g, text, scale, spec.color, outline, shadow, null)
    g.restore()
  }
  return width
}

/** The HUD's lettering scales for this context: finer in HD, whole pixels in Pixel. */
function scalesFor(g: CanvasRenderingContext2D) {
  const d = densityOf(g, 8)
  if (d < 3) return { d, fine: false, sm: 1, xs: 1, big: 1 }
  return {
    d,
    fine: true,
    /** Labels and names: 3 device px a font pixel at 4x. */
    sm: Math.round(0.75 * d) / d,
    /** A long stage name's fallback. */
    xs: Math.round(0.55 * d) / d,
    /** TIME's digits. */
    big: Math.round(1.25 * d) / d,
  }
}

// --- shapes -------------------------------------------------------------------------------------

function rrect(
  b: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  const k = Math.max(0, Math.min(r, w / 2, h / 2))
  b.moveTo(x + k, y)
  b.lineTo(x + w - k, y)
  b.quadraticCurveTo(x + w, y, x + w, y + k)
  b.lineTo(x + w, y + h - k)
  b.quadraticCurveTo(x + w, y + h, x + w - k, y + h)
  b.lineTo(x + k, y + h)
  b.quadraticCurveTo(x, y + h, x, y + h - k)
  b.lineTo(x, y + k)
  b.quadraticCurveTo(x, y, x + k, y)
  b.closePath()
}

export function goldGradient(
  b: CanvasRenderingContext2D,
  y0: number,
  y1: number,
): CanvasGradient {
  const grad = b.createLinearGradient(0, y0, 0, y1)
  grad.addColorStop(0, GOLD_HI)
  grad.addColorStop(0.3, GOLD_LIGHT)
  grad.addColorStop(0.65, GOLD)
  grad.addColorStop(1, GOLD_DARK)
  return grad
}

function diamond(
  b: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
  fill: string | CanvasGradient,
) {
  b.beginPath()
  b.moveTo(cx, cy - r - 0.6)
  b.lineTo(cx + r + 0.6, cy)
  b.lineTo(cx, cy + r + 0.6)
  b.lineTo(cx - r - 0.6, cy)
  b.closePath()
  b.fillStyle = INK
  b.fill()
  b.beginPath()
  b.moveTo(cx, cy - r)
  b.lineTo(cx + r, cy)
  b.lineTo(cx, cy + r)
  b.lineTo(cx - r, cy)
  b.closePath()
  b.fillStyle = fill
  b.fill()
  b.fillStyle = rgba(GOLD_HI, 0.9)
  b.beginPath()
  b.moveTo(cx, cy - r)
  b.lineTo(cx + r * 0.35, cy - r * 0.35)
  b.lineTo(cx, cy)
  b.lineTo(cx - r * 0.5, cy - r * 0.5)
  b.closePath()
  b.fill()
}

/** A small scroll curl, gold over ink: the frames' corner flourish, curling around (cx, cy). */
export function curl(
  b: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
  start: number,
  sweep: number,
) {
  const trace = () => {
    b.beginPath()
    const steps = 14
    for (let i = 0; i <= steps; i++) {
      const t = i / steps
      const a = start + sweep * t
      const rr = r * (1 - 0.55 * t)
      const px = cx + Math.cos(a) * rr
      const py = cy + Math.sin(a) * rr
      if (i === 0) b.moveTo(px, py)
      else b.lineTo(px, py)
    }
  }
  b.lineCap = 'round'
  b.lineJoin = 'round'
  trace()
  b.strokeStyle = INK
  b.lineWidth = 1.5
  b.stroke()
  trace()
  b.strokeStyle = GOLD
  b.lineWidth = 0.75
  b.stroke()
}

/**
 * A gold frame's ring around the box (0, 0, w, h): an ink edge outside, a 1 px bevelled gold band,
 * an inner ink hairline (HD), and ornaments; the centre stays clear. Content sits in (1, 1, w-2, h-2).
 */
export function paintRing(
  b: CanvasRenderingContext2D,
  w: number,
  h: number,
  d: number,
  ornate: boolean,
) {
  b.beginPath()
  rrect(b, -1, -1, w + 2, h + 2, 1.5)
  b.rect(1, 1, w - 2, h - 2)
  b.fillStyle = INK
  b.fill('evenodd')
  b.beginPath()
  rrect(b, 0, 0, w, h, 0.8)
  b.rect(1, 1, w - 2, h - 2)
  b.fillStyle = goldGradient(b, 0, h)
  b.fill('evenodd')
  if (d >= 2) {
    // The bevel: a lit top-left edge and a dark lower-right one, then an ink hairline inside.
    b.fillStyle = rgba(GOLD_HI, 0.85)
    b.fillRect(1, 0.15, w - 2, 0.3)
    b.fillRect(0.15, 1, 0.3, h - 2)
    b.fillStyle = rgba(GOLD_DARK, 0.9)
    b.fillRect(1, h - 0.4, w - 2, 0.3)
    b.fillRect(w - 0.4, 1, 0.3, h - 2)
    b.fillStyle = rgba(INK, 0.85)
    b.fillRect(1, 1, w - 2, 0.5)
    b.fillRect(1, h - 1.5, w - 2, 0.5)
    b.fillRect(1, 1, 0.5, h - 2)
    b.fillRect(w - 1.5, 1, 0.5, h - 2)
  }
  if (ornate) {
    curl(b, -1.6, h - 1.2, 1.9, -Math.PI * 0.1, Math.PI * 1.6)
    curl(b, w + 1.6, h - 1.2, 1.9, Math.PI * 1.1, -Math.PI * 1.6)
    curl(b, -1.6, 1.2, 1.9, Math.PI * 0.1, -Math.PI * 1.6)
    curl(b, w + 1.6, 1.2, 1.9, Math.PI * 0.9, Math.PI * 1.6)
  }
  const gem = goldGradient(b, -1, 2)
  const r = ornate ? 1.1 : 1.3
  diamond(b, 0.5, 0.5, r, gem)
  diamond(b, w - 0.5, 0.5, r, gem)
  diamond(b, 0.5, h - 0.5, r, gem)
  diamond(b, w - 0.5, h - 0.5, r, gem)
}

const RING_M = 4

/** A gold-framed box: panel fill, then `content`, then the ring over it (clipped to the inside). */
function framedBox(
  g: CanvasRenderingContext2D,
  key: string,
  x: number,
  y: number,
  w: number,
  h: number,
  ornate: boolean,
  content: (() => void) | null,
) {
  const d = densityOf(g)
  drawBaked(g, `gt-hud-panel-${w}x${h}`, x, y, w, h, (b) => {
    const grad = b.createLinearGradient(0, 0, 0, h)
    grad.addColorStop(0, rgba(PANEL_TOP, 0.92))
    grad.addColorStop(1, rgba(PANEL_BOTTOM, 0.92))
    b.fillStyle = grad
    b.fillRect(1, 1, w - 2, h - 2)
    // A faint inner glow along the top, lamplight on lacquer.
    b.fillStyle = rgba('#6d4c9a', 0.25)
    b.fillRect(1, 1, w - 2, Math.min(3, h / 4))
  })
  if (content) {
    g.save()
    g.beginPath()
    g.rect(x + 1, y + 1, w - 2, h - 2)
    g.clip()
    content()
    g.restore()
  }
  drawBaked(
    g,
    `gt-hud-ring-${key}-${w}x${h}-${ornate ? 'o' : 'p'}`,
    x - RING_M,
    y - RING_M,
    w + 2 * RING_M,
    h + 2 * RING_M,
    (b) => {
      b.translate(RING_M, RING_M)
      paintRing(b, w, h, d, ornate)
    },
  )
}

function heartPath(
  b: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
) {
  b.beginPath()
  b.moveTo(x + w / 2, y + h * 0.3)
  b.bezierCurveTo(
    x + w * 0.42,
    y + h * 0.02,
    x + w * 0.06,
    y - h * 0.02,
    x + w * 0.03,
    y + h * 0.32,
  )
  b.bezierCurveTo(x, y + h * 0.58, x + w * 0.3, y + h * 0.76, x + w / 2, y + h)
  b.bezierCurveTo(
    x + w * 0.7,
    y + h * 0.76,
    x + w,
    y + h * 0.58,
    x + w * 0.97,
    y + h * 0.32,
  )
  b.bezierCurveTo(
    x + w * 0.94,
    y - h * 0.02,
    x + w * 0.58,
    y + h * 0.02,
    x + w / 2,
    y + h * 0.3,
  )
  b.closePath()
}

type HeartLook = 'full' | 'empty' | 'flash'

function drawHeart(
  g: CanvasRenderingContext2D,
  x: number,
  y: number,
  look: HeartLook,
) {
  drawBaked(g, `gt-hud-heart-${look}`, x - 1, y - 1, 10, 9, (b) => {
    const hx = 1
    const hy = 0.9
    const hw = 8
    const hh = 7
    heartPath(b, hx, hy, hw, hh)
    b.lineJoin = 'round'
    b.strokeStyle = INK
    b.lineWidth = 1.5
    b.stroke()
    heartPath(b, hx, hy, hw, hh)
    if (look === 'empty') {
      b.fillStyle = rgba('#2b1433', 0.85)
      b.fill()
      heartPath(b, hx + 0.6, hy + 0.6, hw - 1.2, hh - 1.2)
      b.strokeStyle = '#d98a52'
      b.lineWidth = 0.6
      b.stroke()
      return
    }
    const grad = b.createLinearGradient(hx, hy, hx + hw * 0.6, hy + hh)
    if (look === 'flash') {
      grad.addColorStop(0, '#ffffff')
      grad.addColorStop(1, '#fda4af')
    } else {
      grad.addColorStop(0, '#ff9aa6')
      grad.addColorStop(0.35, '#f43f5e')
      grad.addColorStop(0.75, '#be123c')
      grad.addColorStop(1, '#6b0f24')
    }
    b.fillStyle = grad
    b.fill()
    b.fillStyle = 'rgba(255, 255, 255, 0.9)'
    b.beginPath()
    b.ellipse(hx + 2.2, hy + 2, 1.05, 0.75, -0.6, 0, Math.PI * 2)
    b.fill()
    b.fillStyle = 'rgba(255, 255, 255, 0.55)'
    b.fillRect(hx + 4.9, hy + 1.3, 0.6, 0.6)
  })
}

function drawSkull(
  g: CanvasRenderingContext2D,
  x: number,
  y: number,
  filled: boolean,
) {
  drawBaked(g, `gt-hud-skull-${filled ? 1 : 0}`, x - 1, y - 1, 10, 10, (b) => {
    const cx = 5
    const shape = () => {
      b.beginPath()
      b.arc(cx, 4.3, 3.6, Math.PI * 0.82, Math.PI * 2.18)
      b.lineTo(cx + 2.4, 7.2)
      b.lineTo(cx + 2.1, 9)
      b.lineTo(cx - 2.1, 9)
      b.lineTo(cx - 2.4, 7.2)
      b.closePath()
    }
    shape()
    b.lineJoin = 'round'
    b.strokeStyle = INK
    b.lineWidth = 1.4
    b.stroke()
    shape()
    if (filled) {
      const grad = b.createLinearGradient(2, 1, 7, 9)
      grad.addColorStop(0, '#fbf6ea')
      grad.addColorStop(0.5, '#d9d2e6')
      grad.addColorStop(1, '#8c84a8')
      b.fillStyle = grad
      b.fill()
    } else {
      b.fillStyle = rgba('#1b1533', 0.7)
      b.fill()
      b.strokeStyle = '#6f6890'
      b.lineWidth = 0.6
      b.stroke()
    }
    // Sockets, nose, teeth.
    b.fillStyle = filled ? INK : rgba('#6f6890', 0.8)
    b.beginPath()
    b.ellipse(cx - 1.45, 4.7, 1.05, 1.2, 0.2, 0, Math.PI * 2)
    b.ellipse(cx + 1.45, 4.7, 1.05, 1.2, -0.2, 0, Math.PI * 2)
    b.fill()
    b.beginPath()
    b.moveTo(cx, 6.1)
    b.lineTo(cx + 0.55, 7.1)
    b.lineTo(cx - 0.55, 7.1)
    b.closePath()
    b.fill()
    if (filled) {
      b.fillRect(cx - 1.1, 7.8, 0.4, 1.2)
      b.fillRect(cx - 0.2, 7.8, 0.4, 1.2)
      b.fillRect(cx + 0.7, 7.8, 0.4, 1.2)
      b.fillStyle = 'rgba(255, 255, 255, 0.85)'
      b.fillRect(cx - 2.2, 1.6, 1.2, 0.6)
    }
  })
}

/** A small mission bell: a relic slot, glowing spectral cyan once found. */
function drawRelic(
  g: CanvasRenderingContext2D,
  x: number,
  y: number,
  found: boolean,
) {
  drawBaked(g, `gt-hud-relic-${found ? 1 : 0}`, x - 2, y - 2, 9, 11, (b) => {
    b.translate(2, 2)
    if (found) {
      const glow = b.createRadialGradient(2.5, 3.5, 0, 2.5, 3.5, 4.5)
      glow.addColorStop(0, 'rgba(103, 232, 249, 0.55)')
      glow.addColorStop(1, 'rgba(103, 232, 249, 0)')
      b.fillStyle = glow
      b.fillRect(-2, -2, 9, 11)
    }
    const bell = () => {
      b.beginPath()
      b.moveTo(2.5, 0.6)
      b.bezierCurveTo(4.1, 0.6, 4.2, 2.4, 4.3, 4.2)
      b.quadraticCurveTo(4.4, 5.2, 5.1, 5.6)
      b.lineTo(-0.1, 5.6)
      b.quadraticCurveTo(0.6, 5.2, 0.7, 4.2)
      b.bezierCurveTo(0.8, 2.4, 0.9, 0.6, 2.5, 0.6)
      b.closePath()
    }
    bell()
    b.lineJoin = 'round'
    b.strokeStyle = INK
    b.lineWidth = 1.3
    b.stroke()
    bell()
    if (found) {
      const grad = b.createLinearGradient(0, 0, 4, 6)
      grad.addColorStop(0, '#ecfeff')
      grad.addColorStop(0.45, '#67e8f9')
      grad.addColorStop(1, '#0e7490')
      b.fillStyle = grad
    } else b.fillStyle = '#3a3262'
    b.fill()
    if (!found) {
      b.strokeStyle = '#7a70a8'
      b.lineWidth = 0.5
      b.stroke()
    }
    b.fillStyle = found ? '#a5f3fc' : '#7a70a8'
    b.beginPath()
    b.arc(2.5, 6.3, 0.75, 0, Math.PI * 2)
    b.fill()
    if (found) {
      b.fillStyle = 'rgba(255, 255, 255, 0.9)'
      b.fillRect(1.4, 1.6, 0.5, 2)
    }
  })
}

/** An in-flight pip: a little upright bar, lit amber when that throw is ready. */
function drawPip(
  g: CanvasRenderingContext2D,
  x: number,
  y: number,
  on: boolean,
) {
  drawBaked(g, `gt-hud-pip-${on ? 1 : 0}`, x, y, 4, 6, (b) => {
    b.fillStyle = INK
    b.fillRect(0, 0, 4, 6)
    if (on) {
      const grad = b.createLinearGradient(0, 1, 0, 5)
      grad.addColorStop(0, '#fff2b0')
      grad.addColorStop(0.5, '#f6a723')
      grad.addColorStop(1, '#b4530a')
      b.fillStyle = grad
    } else b.fillStyle = '#2c2346'
    b.fillRect(1, 1, 2, 4)
    if (on) {
      b.fillStyle = 'rgba(255, 255, 255, 0.8)'
      b.fillRect(1, 1, 0.75, 1.5)
    }
  })
}

/** The TRAIL plate's scroll flourish (left-hand; mirrored for the right). 16 x 10. */
function paintFlourish(b: CanvasRenderingContext2D) {
  const trace = () => {
    b.beginPath()
    b.moveTo(15.6, 8.4)
    b.bezierCurveTo(12, 8.6, 10.6, 3, 7, 2.6)
    b.bezierCurveTo(3.6, 2.3, 2.2, 6.4, 4.4, 7.6)
    b.bezierCurveTo(6.2, 8.5, 7.4, 6, 5.8, 5.1)
    b.moveTo(10.6, 5.2)
    b.quadraticCurveTo(11.4, 2.2, 13.8, 1.6)
  }
  b.lineCap = 'round'
  b.lineJoin = 'round'
  trace()
  b.strokeStyle = INK
  b.lineWidth = 1.8
  b.stroke()
  trace()
  b.strokeStyle = goldGradient(b, 1, 9)
  b.lineWidth = 0.9
  b.stroke()
  diamond(b, 14.4, 1.4, 0.8, GOLD_LIGHT)
  b.fillStyle = INK
  b.beginPath()
  b.arc(1.6, 5.2, 1.2, 0, Math.PI * 2)
  b.fill()
  b.fillStyle = GOLD_LIGHT
  b.beginPath()
  b.arc(1.6, 5.2, 0.65, 0, Math.PI * 2)
  b.fill()
}

/** The top strip's backing: a dusk shade so lettering reads over any plate. */
function drawShade(g: CanvasRenderingContext2D) {
  drawBaked(g, 'gt-hud-shade', 0, 0, W, HUD_HEIGHT + 2, (b) => {
    const grad = b.createLinearGradient(0, 0, 0, HUD_HEIGHT + 2)
    grad.addColorStop(0, rgba('#07051a', 0.82))
    grad.addColorStop(0.55, rgba('#0b0824', 0.5))
    grad.addColorStop(1, rgba('#0b0824', 0))
    b.fillStyle = grad
    b.fillRect(0, 0, W, HUD_HEIGHT + 2)
  })
}

function glowDot(
  g: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
  colour: string,
  alpha: number,
) {
  g.save()
  g.globalCompositeOperation = 'lighter'
  const grad = g.createRadialGradient(x, y, 0, x, y, r)
  grad.addColorStop(0, rgba(colour, alpha))
  grad.addColorStop(1, rgba(colour, 0))
  g.fillStyle = grad
  g.fillRect(x - r, y - r, r * 2, r * 2)
  g.restore()
}

// --- HUD ----------------------------------------------------------------------------------------

/** Portrait painter: fill the box (x, y, w, h), screen space; it is clipped to the frame. */
export type PortraitPainter = (
  g: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
) => void
/** Weapon icon painter: draw `weapon` centred on (x, y), fitting a `size` x `size` square. */
export type WeaponIconPainter = (
  g: CanvasRenderingContext2D,
  weapon: string,
  x: number,
  y: number,
  size: number,
) => void

const LONGEST_LABEL = 'SHURIKEN'

/**
 * The whole HUD in screen space: the top strip (y 0..30) and, while `s.boss` is set, the boss bar
 * along the bottom. `portrait` paints Zuzu's face into the framed box; `weaponIcon` paints the gear
 * in the weapon box.
 */
export function drawHud(
  g: CanvasRenderingContext2D,
  s: HudState,
  portrait: PortraitPainter,
  weaponIcon: WeaponIconPainter,
) {
  const k = scalesFor(g)
  drawShade(g)

  // 1P and the portrait.
  hudText(g, '1P', 3, 5, { scale: 1, color: ['#ff9363', '#e8381c'] })
  const px = 17
  const py = 2
  const pw = 25
  const ph = 20
  framedBox(g, 'portrait', px, py, pw, ph, false, () =>
    portrait(g, px + 1, py + 1, pw - 2, ph - 2),
  )

  // Hearts and relic bells, the score beneath, HI under that.
  const col = 45
  const blink = s.invuln > 0 && Math.floor(s.tick / 4) % 2 === 0
  for (let i = 0; i < HEART_SLOTS; i++) {
    const lit = i < s.hits
    drawHeart(g, col + i * 9, 3, lit ? (blink ? 'flash' : 'full') : 'empty')
  }
  let rowA = col + HEART_SLOTS * 9 + 3
  const relicMax = Math.max(0, Math.floor(s.relicsMax))
  if (relicMax > 0 && relicMax <= 6) {
    for (let i = 0; i < relicMax; i++)
      drawRelic(g, rowA + i * 6, 3.5, i < s.relics)
    rowA += relicMax * 6
  } else if (relicMax > 6) {
    drawRelic(g, rowA, 3.5, s.relics > 0)
    rowA +=
      7 +
      hudText(g, `${s.relics}/${relicMax}`, rowA + 7, 4, {
        scale: k.sm,
        color: '#a5f3fc',
      })
  }
  const digits = String(Math.max(0, Math.floor(s.score))).padStart(7, '0')
  let rowB = col
  if (k.fine) {
    rowB += hudText(g, 'SCORE', col, 13.5, { scale: k.sm, color: BONE_DIM })
    rowB += measureText(' ', k.sm) + k.sm
  }
  rowB += hudText(g, digits, rowB, 13.5, { scale: k.sm, color: BONE })
  const hi = String(Math.max(0, Math.floor(s.hiScore))).padStart(7, '0')
  hudText(g, `HI ${hi}`, col, 22.5, {
    scale: k.sm,
    color: ['#f7c6c6', '#d98aa0'],
  })

  // The weapon box: icon, cadence meter, name, in-flight pips.
  const bx = Math.ceil(Math.max(rowA, rowB)) + 4
  const by = 2
  const bh = 20
  const nameW = Math.max(
    measureText(LONGEST_LABEL, k.sm),
    measureText(s.weaponLabel, k.sm),
  )
  const bw = Math.ceil(21 + nameW + 4)
  framedBox(g, 'weapon', bx, by, bw, bh, true, () => {
    weaponIcon(g, s.weapon, bx + 8.5, by + bh / 2, 12)
  })
  const cadence = Math.max(0, Math.min(1, s.cadence))
  const mx = bx + 16
  const my = by + 4
  const mh = 12
  g.fillStyle = INK
  g.fillRect(mx - 1, my - 1, 4, mh + 2)
  g.fillStyle = '#1d1533'
  g.fillRect(mx, my, 2, mh)
  const fillH = Math.round(mh * cadence * k.d) / k.d
  if (fillH > 0) {
    g.fillStyle = cadence >= 1 ? '#fde68a' : '#f08a24'
    g.fillRect(mx, my + mh - fillH, 2, fillH)
    if (k.d >= 2) {
      g.fillStyle = rgba('#ffffff', cadence >= 1 ? 0.7 : 0.35)
      g.fillRect(mx, my + mh - fillH, 0.5, fillH)
    }
  }
  if (k.d >= 2) {
    g.fillStyle = rgba(INK, 0.8)
    for (let yy = my + 2; yy < my + mh; yy += 2) g.fillRect(mx, yy, 2, 0.5)
  }
  const ncx = bx + 21 + nameW / 2
  hudText(g, s.weaponLabel, ncx, k.fine ? 5 : 4, {
    scale: k.sm,
    color: BONE,
    align: 'center',
  })
  const pips = Math.max(0, Math.min(8, Math.floor(s.shotsMax)))
  const ready = pips - Math.max(0, Math.floor(s.shotsOut))
  const pipX = Math.round(ncx - (pips * 5 - 1) / 2)
  for (let i = 0; i < pips; i++) drawPip(g, pipX + i * 5, 13.5, i < ready)

  // Skulls for lives, right edge; "+n" beneath when there are more than three.
  const lives = Math.max(0, Math.floor(s.lives))
  const skullX = W - 1 - SKULL_SLOTS * 9 + 1
  for (let i = 0; i < SKULL_SLOTS; i++)
    drawSkull(g, skullX + i * 9, 3, i < lives)
  if (lives > SKULL_SLOTS)
    hudText(g, `+${lives - SKULL_SLOTS}`, W - 2, 13.5, {
      scale: k.sm,
      color: BONE,
      align: 'right',
    })

  // TIME: label over big amber digits, blinking crimson in the last 20 seconds.
  const seconds = Math.max(0, Math.ceil(s.seconds))
  const time = String(seconds).padStart(3, '0')
  const timeRight = skullX - 4
  const timeW = Math.max(measureText('TIME', k.sm), measureText(time, k.big))
  const tx0 = Math.floor(timeRight - timeW)
  const tcx = tx0 + timeW / 2
  hudText(g, 'TIME', tcx, 3, {
    scale: k.sm,
    color: BONE,
    align: 'center',
  })
  const warn = seconds <= 20 && Math.floor(s.tick / 10) % 2 === 1
  hudText(g, time, tcx, k.fine ? 10.5 : 12, {
    scale: k.big,
    color: warn ? ['#ffd0d0', '#ef4444'] : AMBER,
    shadow: null,
    align: 'center',
  })

  // The TRAIL plate between the weapon box and TIME.
  const l = bx + bw + 4
  const r = tx0 - 3
  const cx = Math.round((l + r) / 2)
  drawTrailPlate(g, s, l, r, cx, k)

  if (s.boss) drawBossBar(g, s.boss.name, s.boss.hp, s.boss.maxHp, s.boss.flash)
}

function drawTrailPlate(
  g: CanvasRenderingContext2D,
  s: HudState,
  l: number,
  r: number,
  cx: number,
  k: ReturnType<typeof scalesFor>,
) {
  const title = `STAGE ${Math.max(1, Math.floor(s.trail))}`
  const tw = hudText(g, title, cx, 3, {
    scale: 1,
    color: ['#ffffff', '#b9d4ff'],
    shadow: '#1d2a6b',
    align: 'center',
  })
  const fy = 1
  drawBaked(
    g,
    'gt-hud-flourish',
    Math.round(cx - tw / 2) - 19,
    fy,
    16,
    10,
    paintFlourish,
  )
  drawBaked(
    g,
    'gt-hud-flourish',
    Math.round(cx + tw / 2) + 3,
    fy,
    16,
    10,
    paintFlourish,
    { flipX: true },
  )

  // The gold rule, which fills with the trail's progress; a lantern gem marks Zuzu.
  const ly = 11
  const x0 = l + 2
  const len = Math.max(4, r - l - 4)
  const p = Math.max(0, Math.min(1, s.progress))
  g.fillStyle = rgba(INK, 0.9)
  g.fillRect(x0, ly - 0.5, len, 2)
  g.fillStyle = '#6a4220'
  g.fillRect(x0, ly, len, 1)
  const fill = Math.round(len * p * k.d) / k.d
  if (fill > 0) {
    g.fillStyle = GOLD
    g.fillRect(x0, ly, fill, 1)
    if (k.d >= 2) {
      g.fillStyle = GOLD_HI
      g.fillRect(x0, ly, fill, 0.4)
    }
  }
  g.fillStyle = GOLD_LIGHT
  g.fillRect(x0 - 1, ly - 0.5, 1, 2)
  g.fillRect(x0 + len, ly - 0.5, 1, 2)
  const gx = x0 + fill
  glowDot(g, gx, ly + 0.5, 4, '#f59e0b', 0.55)
  g.fillStyle = INK
  g.beginPath()
  g.moveTo(gx, ly - 2.2)
  g.lineTo(gx + 2.2, ly + 0.5)
  g.lineTo(gx, ly + 3.2)
  g.lineTo(gx - 2.2, ly + 0.5)
  g.closePath()
  g.fill()
  g.fillStyle = '#ffe9a8'
  g.beginPath()
  g.moveTo(gx, ly - 1.2)
  g.lineTo(gx + 1.2, ly + 0.5)
  g.lineTo(gx, ly + 2.2)
  g.lineTo(gx - 1.2, ly + 0.5)
  g.closePath()
  g.fill()

  // The stage name under the rule; a name too long for the plate takes a finer scale (HD) or the
  // row below the strip (Pixel).
  const room = r - l
  const name = s.stageName
  const look = { color: BONE, align: 'center' as const }
  if (measureText(name, k.sm) <= room)
    hudText(g, name, cx, k.fine ? 14 : 13.5, { ...look, scale: k.sm })
  else if (k.fine && measureText(name, k.xs) <= room)
    hudText(g, name, cx, 14.5, { ...look, scale: k.xs })
  else {
    const w = measureText(name, k.sm)
    const at = Math.max(w / 2 + 2, Math.min(W - w / 2 - 2, cx))
    hudText(g, name, at, k.fine ? 14 : 22, { ...look, scale: k.sm })
  }
}

// --- boss bar -----------------------------------------------------------------------------------

const BAR_X = 48
const BAR_W = W - 2 * BAR_X
const BAR_Y = 226
const BAR_H = 6

/** The boss bar's end flourish (left end; mirrored for the right). 18 x 13. */
function paintBarEnd(b: CanvasRenderingContext2D) {
  const trace = () => {
    b.beginPath()
    b.moveTo(17.5, 6.5)
    b.lineTo(10, 6.5)
    b.bezierCurveTo(7, 6.5, 6.4, 2, 3.8, 2.6)
    b.bezierCurveTo(1.4, 3.2, 1.6, 6.4, 3.6, 6.4)
    b.moveTo(10, 6.5)
    b.bezierCurveTo(7, 6.5, 6.4, 11, 3.8, 10.4)
    b.bezierCurveTo(1.4, 9.8, 1.6, 6.6, 3.6, 6.6)
  }
  b.lineCap = 'round'
  b.lineJoin = 'round'
  trace()
  b.strokeStyle = INK
  b.lineWidth = 1.9
  b.stroke()
  trace()
  b.strokeStyle = goldGradient(b, 2, 11)
  b.lineWidth = 0.95
  b.stroke()
  diamond(b, 11.5, 6.5, 1.6, goldGradient(b, 4.5, 8.5))
}

/**
 * The boss's health along the bottom (screen space): its name on a gold plate over a long ornate
 * bar. `hp` of `maxHp` fills it crimson; `flash` > 0 (the boss was just struck) blanches the fill.
 */
export function drawBossBar(
  g: CanvasRenderingContext2D,
  name: string,
  hp: number,
  maxHp: number,
  flash: number,
) {
  const k = scalesFor(g)
  const amount = maxHp > 0 ? Math.max(0, Math.min(1, hp / maxHp)) : 0
  // Frame: ink, gold band, trough.
  drawBaked(
    g,
    `gt-hud-bossbar-${BAR_W}`,
    BAR_X - 2,
    BAR_Y - 2,
    BAR_W + 4,
    BAR_H + 4,
    (b) => {
      b.fillStyle = INK
      b.beginPath()
      rrect(b, 0, 0, BAR_W + 4, BAR_H + 4, 1.5)
      b.fill()
      b.beginPath()
      b.rect(0.6, 0.6, BAR_W + 2.8, BAR_H + 2.8)
      b.rect(1.6, 1.6, BAR_W + 0.8, BAR_H + 0.8)
      b.fillStyle = goldGradient(b, 0, BAR_H + 4)
      b.fill('evenodd')
      const trough = b.createLinearGradient(0, 2, 0, BAR_H + 2)
      trough.addColorStop(0, '#0b0614')
      trough.addColorStop(1, '#2a1426')
      b.fillStyle = trough
      b.fillRect(2, 2, BAR_W, BAR_H)
    },
  )
  const fill = Math.round(BAR_W * amount * k.d) / k.d
  if (fill > 0) {
    const grad = g.createLinearGradient(0, BAR_Y, 0, BAR_Y + BAR_H)
    if (flash > 0) {
      grad.addColorStop(0, '#ffffff')
      grad.addColorStop(1, '#fecdd3')
    } else {
      grad.addColorStop(0, '#fda4af')
      grad.addColorStop(0.3, '#f43f5e')
      grad.addColorStop(0.7, '#be123c')
      grad.addColorStop(1, '#6b0f24')
    }
    g.fillStyle = grad
    g.fillRect(BAR_X, BAR_Y, fill, BAR_H)
    g.fillStyle = 'rgba(255, 255, 255, 0.45)'
    g.fillRect(BAR_X, BAR_Y + (k.d >= 2 ? 0.5 : 0), fill, k.d >= 2 ? 0.5 : 1)
    // The bleeding edge glows.
    if (amount < 1) glowDot(g, BAR_X + fill, BAR_Y + BAR_H / 2, 4, CRIMSON, 0.5)
  }
  // Tenths, so a hit reads as a step.
  if (k.d >= 2) {
    g.fillStyle = rgba(INK, 0.55)
    for (let i = 1; i < 10; i++)
      g.fillRect(BAR_X + Math.round((BAR_W * i) / 10), BAR_Y, 0.5, BAR_H)
  }
  drawBaked(g, 'gt-hud-barend', BAR_X - 18, BAR_Y - 4, 18, 13, paintBarEnd)
  drawBaked(g, 'gt-hud-barend', BAR_X + BAR_W, BAR_Y - 4, 18, 13, paintBarEnd, {
    flipX: true,
  })

  // The name plate, a pointed gold cartouche sitting on the bar.
  const scale = k.sm
  const tw = measureText(name, scale)
  const pw = Math.ceil(tw + 20)
  const ph = k.fine ? 10 : 12
  const px = Math.round(W / 2 - pw / 2)
  const py = BAR_Y - 2 - ph + 1
  drawBaked(
    g,
    `gt-hud-bossplate-${pw}x${ph}`,
    px - 1,
    py - 1,
    pw + 2,
    ph + 2,
    (b) => {
      b.translate(1, 1)
      const shape = (inset: number) => {
        b.beginPath()
        b.moveTo(inset, ph / 2)
        b.lineTo(4 + inset * 0.6, inset)
        b.lineTo(pw - 4 - inset * 0.6, inset)
        b.lineTo(pw - inset, ph / 2)
        b.lineTo(pw - 4 - inset * 0.6, ph - inset)
        b.lineTo(4 + inset * 0.6, ph - inset)
        b.closePath()
      }
      shape(-1)
      b.fillStyle = INK
      b.fill()
      shape(0)
      b.fillStyle = goldGradient(b, 0, ph)
      b.fill()
      shape(1.2)
      b.fillStyle = INK
      b.fill()
      shape(1.7)
      const grad = b.createLinearGradient(0, 0, 0, ph)
      grad.addColorStop(0, '#3a1430')
      grad.addColorStop(1, '#150818')
      b.fillStyle = grad
      b.fill()
      diamond(b, 3.2, ph / 2, 0.9, GOLD_LIGHT)
      diamond(b, pw - 3.2, ph / 2, 0.9, GOLD_LIGHT)
    },
  )
  hudText(g, name, W / 2, py + (ph - FONT_HEIGHT * scale) / 2, {
    scale,
    color: ['#fff2c0', '#f2b84b'],
    shadow: null,
    align: 'center',
  })
}

// --- banners ------------------------------------------------------------------------------------

export type BannerTone = 'amber' | 'crimson' | 'cyan'

const TONES: Record<
  BannerTone,
  {
    top: string
    bottom: string
    ribbon: string
    ribbonDark: string
    title: readonly [string, string]
    sub: string
    glow: string
  }
> = {
  amber: {
    top: '#2c1a4a',
    bottom: '#120a26',
    ribbon: '#a8401a',
    ribbonDark: '#5a1a0c',
    title: ['#fffbe8', '#f8b733'],
    sub: '#fde68a',
    glow: '#f59e0b',
  },
  crimson: {
    top: '#3a0f26',
    bottom: '#14061a',
    ribbon: '#9f1239',
    ribbonDark: '#4c0519',
    title: ['#fff1f2', '#f43f5e'],
    sub: '#fecdd3',
    glow: '#e11d48',
  },
  cyan: {
    top: '#122a4a',
    bottom: '#0a0f28',
    ribbon: '#0e7490',
    ribbonDark: '#083344',
    title: ['#f0feff', '#3fd8f0'],
    sub: '#cffafe',
    glow: '#22d3ee',
  },
}

/** The tone a banner wears by what it says: crimson for dread and defeat, cyan for relics. */
export function bannerTone(title: string, sub?: string): BannerTone {
  const t = title.toUpperCase()
  const u = (sub ?? '').toUpperCase()
  if (t.includes('RELIC')) return 'cyan'
  if (
    t.includes('GAME OVER') ||
    u.includes('THIN PLACES') ||
    u.includes('BACK TO THE CHECKPOINT')
  )
    return 'crimson'
  return 'amber'
}

/**
 * A framed ornate banner across the screen's centre (screen space, about y 56..100): `title` big,
 * `sub` beneath. `t` is ticks since the banner appeared: it unfurls from the centre over the first
 * ~12 ticks and the lettering fades in after; pass a large value to draw it settled. `tone`
 * defaults to bannerTone(title, sub).
 */
export function drawBanner(
  g: CanvasRenderingContext2D,
  title: string,
  sub: string | undefined,
  t: number,
  tone: BannerTone = bannerTone(title, sub),
) {
  const look = TONES[tone]
  const tw = measureText(title, 2)
  const sw = sub ? measureText(sub, 1) : 0
  const w = Math.round(Math.min(W - 36, Math.max(132, Math.max(tw, sw) + 36)))
  const h = sub ? 38 : 28
  const x = Math.round(W / 2 - w / 2)
  const y = sub ? 58 : 62
  const d = densityOf(g)
  const unfurl = Math.max(0, Math.min(1, t / 12))
  const eased = 1 - Math.pow(1 - unfurl, 3)
  const M = 14
  const bw = w + 2 * M
  const bh = h + 8
  g.save()
  if (eased < 1) {
    const half = (bw / 2) * Math.max(0.08, eased)
    g.beginPath()
    g.rect(W / 2 - half, y - 6, half * 2, bh + 8)
    g.clip()
  }
  drawBaked(g, `gt-hud-banner-${w}x${h}-${tone}`, x - M, y - 4, bw, bh, (b) => {
    b.translate(M, 4)
    // Swallowtail ribbons behind the plate.
    for (const side of [-1, 1] as const) {
      const ex = side < 0 ? -M + 1 : w + M - 1
      const ix = side < 0 ? 8 : w - 8
      const rib = () => {
        b.beginPath()
        b.moveTo(ix, 6)
        b.lineTo(ex, 6)
        b.lineTo(ex - side * 5, h / 2)
        b.lineTo(ex, h - 6)
        b.lineTo(ix, h - 6)
        b.closePath()
      }
      rib()
      b.fillStyle = INK
      b.lineJoin = 'round'
      b.strokeStyle = INK
      b.lineWidth = 2
      b.stroke()
      rib()
      const grad = b.createLinearGradient(0, 6, 0, h - 6)
      grad.addColorStop(0, look.ribbon)
      grad.addColorStop(1, look.ribbonDark)
      b.fillStyle = grad
      b.fill()
      b.fillStyle = rgba('#ffffff', 0.18)
      b.fillRect(Math.min(ix, ex), 7, Math.abs(ex - ix), 0.75)
      b.fillStyle = rgba(INK, 0.6)
      b.fillRect(side < 0 ? 4 : w - 5, 6, 1, h - 12)
    }
    // The plate.
    b.beginPath()
    rrect(b, 0, 0, w, h, 2)
    const grad = b.createLinearGradient(0, 0, 0, h)
    grad.addColorStop(0, look.top)
    grad.addColorStop(1, look.bottom)
    b.fillStyle = grad
    b.fill()
    const glow = b.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2)
    glow.addColorStop(0, rgba(look.glow, 0.22))
    glow.addColorStop(1, rgba(look.glow, 0))
    b.fillStyle = glow
    b.fillRect(0, 0, w, h)
    paintRing(b, w, h, d, true)
    // An inner hairline frame, gold, inset.
    b.strokeStyle = rgba(GOLD, 0.75)
    b.lineWidth = d >= 2 ? 0.5 : 1
    b.strokeRect(3.5, 3.5, w - 7, h - 7)
    // Crest gems top and bottom centre, with little scrolls either side.
    for (const cy of [0.5, h - 0.5]) {
      curl(b, w / 2 - 5, cy, 1.8, 0, Math.PI * 1.5)
      curl(b, w / 2 + 5, cy, 1.8, Math.PI, -Math.PI * 1.5)
      diamond(b, w / 2, cy, 2, goldGradient(b, cy - 2, cy + 2))
    }
  })
  const fade = Math.max(0, Math.min(1, (t - 6) / 8))
  if (fade > 0) {
    g.globalAlpha *= fade
    hudText(g, title, W / 2, y + (sub ? 6 : 7), {
      scale: 2,
      color: look.title,
      align: 'center',
    })
    if (sub)
      hudText(g, sub, W / 2, y + 25, {
        scale: 1,
        color: look.sub,
        align: 'center',
      })
  }
  g.restore()
}

/** The boss bar's top edge (its name plate included), for callers keeping clear of it. */
export const BOSS_BAR_TOP = BAR_Y - 15
