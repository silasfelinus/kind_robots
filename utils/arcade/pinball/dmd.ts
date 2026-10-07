// /utils/arcade/pinball/dmd.ts
//
// A dot-matrix display for the pinball tables (conductor kind-pinball/t-003):
// a 128x32 grid of amber dots with four brightness levels, like the plasma
// displays on early-'90s Williams machines. Scenes draw into the framebuffer
// with the arcade's 5x7 font and simple shapes; render() paints the dots.

import { glyphFor } from '../font'

export const DMD_COLS = 128
export const DMD_ROWS = 32

/** Dot colours from off to full brightness. */
const DOT_COLORS = ['#2a1406', '#7c2d12', '#ea580c', '#fed7aa'] as const

export type DmdLevel = 0 | 1 | 2 | 3

export type DmdTextOptions = {
  scale?: number
  level?: DmdLevel
  align?: 'left' | 'center' | 'right'
  /** Thicken strokes by repeating each glyph one dot to the right. */
  bold?: boolean
  /** Only the first `reveal` characters are drawn (for type-on wipes). */
  reveal?: number
}

/** Width in dots of `text` at `scale` (one-dot gap between glyphs). */
export function dmdTextWidth(text: string, scale = 1, bold = false): number {
  if (!text.length) return 0
  return (text.length * 6 - 1) * scale + (bold ? 1 : 0)
}

export class Dmd {
  readonly cols = DMD_COLS
  readonly rows = DMD_ROWS
  readonly buf = new Uint8Array(DMD_COLS * DMD_ROWS)

  clear(level: DmdLevel = 0) {
    this.buf.fill(level)
  }

  dot(x: number, y: number, level: DmdLevel = 3) {
    const cx = Math.round(x)
    const cy = Math.round(y)
    if (cx < 0 || cy < 0 || cx >= this.cols || cy >= this.rows) return
    this.buf[cy * this.cols + cx] = level
  }

  get(x: number, y: number): number {
    if (x < 0 || y < 0 || x >= this.cols || y >= this.rows) return 0
    return this.buf[y * this.cols + x]!
  }

  rect(x: number, y: number, w: number, h: number, level: DmdLevel = 3) {
    for (let j = 0; j < h; j++)
      for (let i = 0; i < w; i++) this.dot(x + i, y + j, level)
  }

  frame(x: number, y: number, w: number, h: number, level: DmdLevel = 3) {
    for (let i = 0; i < w; i++) {
      this.dot(x + i, y, level)
      this.dot(x + i, y + h - 1, level)
    }
    for (let j = 0; j < h; j++) {
      this.dot(x, y + j, level)
      this.dot(x + w - 1, y + j, level)
    }
  }

  text(text: string, x: number, y: number, options: DmdTextOptions = {}) {
    const scale = options.scale ?? 1
    const level = options.level ?? 3
    const bold = options.bold ?? false
    const width = dmdTextWidth(text, scale, bold)
    let left =
      options.align === 'center'
        ? Math.round(x - width / 2)
        : options.align === 'right'
          ? x - width
          : x
    const shown = Math.min(text.length, options.reveal ?? text.length)
    for (let c = 0; c < shown; c++) {
      const rows = glyphFor(text[c]!)
      for (let row = 0; row < 7; row++) {
        const bits = rows[row] ?? 0
        if (!bits) continue
        for (let col = 0; col < 5; col++) {
          if (!(bits & (1 << (4 - col)))) continue
          const px = left + col * scale
          const py = y + row * scale
          this.rect(px, py, scale + (bold ? 1 : 0), scale, level)
        }
      }
      left += 6 * scale
    }
  }

  /** Swap lit and unlit dots (the classic jackpot flash). */
  invert() {
    for (let i = 0; i < this.buf.length; i++) this.buf[i] = 3 - this.buf[i]!
  }

  /** Paint the dots: one path per brightness level keeps it to four fills. */
  render(g: CanvasRenderingContext2D, x: number, y: number, pitch: number) {
    const size = pitch * 0.78
    for (let level = 0; level < DOT_COLORS.length; level++) {
      g.fillStyle = DOT_COLORS[level]!
      g.beginPath()
      for (let j = 0; j < this.rows; j++) {
        for (let i = 0; i < this.cols; i++) {
          if (this.buf[j * this.cols + i] !== level) continue
          g.rect(x + i * pitch, y + j * pitch, size, size)
        }
      }
      g.fill()
    }
  }
}
