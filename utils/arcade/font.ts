// /utils/arcade/font.ts
//
// A 5x7 bitmap font drawn with fillRect, so every cabinet shares one crisp
// arcade typeface with no web-font download. Generated art never carries
// lettering; all titles, scores and initials are drawn here.
//
// A context switched to vector text (setTextStyle, for the HD render style in
// utils/arcade/display.ts) draws the same strings with a smooth system font in
// the same boxes: caps the glyphs' height, no wider than measureText, so
// layouts hold in either style.

const ROWS = 7
const COLS = 5

// Each glyph is seven rows of five bits, most significant bit on the left.
const GLYPHS: Record<string, number[]> = {
  A: [14, 17, 17, 31, 17, 17, 17],
  B: [30, 17, 17, 30, 17, 17, 30],
  C: [14, 17, 16, 16, 16, 17, 14],
  D: [28, 18, 17, 17, 17, 18, 28],
  E: [31, 16, 16, 30, 16, 16, 31],
  F: [31, 16, 16, 30, 16, 16, 16],
  G: [14, 17, 16, 23, 17, 17, 15],
  H: [17, 17, 17, 31, 17, 17, 17],
  I: [14, 4, 4, 4, 4, 4, 14],
  J: [7, 2, 2, 2, 2, 18, 12],
  K: [17, 18, 20, 24, 20, 18, 17],
  L: [16, 16, 16, 16, 16, 16, 31],
  M: [17, 27, 21, 21, 17, 17, 17],
  N: [17, 17, 25, 21, 19, 17, 17],
  O: [14, 17, 17, 17, 17, 17, 14],
  P: [30, 17, 17, 30, 16, 16, 16],
  Q: [14, 17, 17, 17, 21, 18, 13],
  R: [30, 17, 17, 30, 20, 18, 17],
  S: [15, 16, 16, 14, 1, 1, 30],
  T: [31, 4, 4, 4, 4, 4, 4],
  U: [17, 17, 17, 17, 17, 17, 14],
  V: [17, 17, 17, 17, 17, 10, 4],
  W: [17, 17, 17, 21, 21, 21, 10],
  X: [17, 17, 10, 4, 10, 17, 17],
  Y: [17, 17, 17, 10, 4, 4, 4],
  Z: [31, 1, 2, 4, 8, 16, 31],
  '0': [14, 17, 19, 21, 25, 17, 14],
  '1': [4, 12, 4, 4, 4, 4, 14],
  '2': [14, 17, 1, 2, 4, 8, 31],
  '3': [31, 2, 4, 2, 1, 17, 14],
  '4': [2, 6, 10, 18, 31, 2, 2],
  '5': [31, 16, 30, 1, 1, 17, 14],
  '6': [6, 8, 16, 30, 17, 17, 14],
  '7': [31, 1, 2, 4, 8, 8, 8],
  '8': [14, 17, 17, 14, 17, 17, 14],
  '9': [14, 17, 17, 15, 1, 2, 12],
  ' ': [0, 0, 0, 0, 0, 0, 0],
  '.': [0, 0, 0, 0, 0, 12, 12],
  ',': [0, 0, 0, 0, 12, 4, 8],
  '!': [4, 4, 4, 4, 4, 0, 4],
  '?': [14, 17, 1, 2, 4, 0, 4],
  '-': [0, 0, 0, 31, 0, 0, 0],
  '+': [0, 4, 4, 31, 4, 4, 0],
  '=': [0, 0, 31, 0, 31, 0, 0],
  ':': [0, 12, 12, 0, 12, 12, 0],
  "'": [12, 4, 8, 0, 0, 0, 0],
  '/': [0, 1, 2, 4, 8, 16, 0],
  '(': [2, 4, 8, 8, 8, 4, 2],
  ')': [8, 4, 2, 2, 2, 4, 8],
  '<': [2, 4, 8, 16, 8, 4, 2],
  '>': [8, 4, 2, 1, 2, 4, 8],
  '#': [10, 10, 31, 10, 31, 10, 10],
  '%': [24, 25, 2, 4, 8, 19, 3],
  _: [0, 0, 0, 0, 0, 0, 31],
  // A heart, for lives and "kind" moments.
  '*': [0, 10, 31, 31, 14, 4, 0],
}

export function glyphFor(char: string): number[] {
  return GLYPHS[char.toUpperCase()] ?? GLYPHS['?']!
}

export type TextOptions = {
  scale?: number
  color?: string
  align?: 'left' | 'center' | 'right'
  /** Drop-shadow colour, drawn one pixel down and right at the same scale. */
  shadow?: string
  /** Outline colour, a pixel out on every side: the 16-bit lettering look (utils/arcade/snes.ts). */
  outline?: string
}

/** Width in logical pixels of `text` at `scale` (one column gap per glyph). */
export function measureText(text: string, scale = 1): number {
  if (!text.length) return 0
  return (text.length * (COLS + 1) - 1) * scale
}

export const FONT_HEIGHT = ROWS

/** Smallest gap between stacked scale-2 lines that still leaves daylight. */
export const MIN_LINE_STEP = 18

/**
 * Vertical step for `count` scale-2 lines stacked from `top` on a screen
 * `height` tall: the preferred step, squeezed so the last line still fits.
 */
export function lineStep(
  count: number,
  height: number,
  top: number,
  preferred = 30,
): number {
  if (count <= 1) return preferred
  const room = height - top - FONT_HEIGHT * 2 - 4
  return Math.min(preferred, Math.floor(room / (count - 1)))
}

function paint(
  g: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  scale: number,
) {
  let cursor = x
  for (const char of text) {
    const rows = glyphFor(char)
    for (let row = 0; row < ROWS; row++) {
      const bits = rows[row] ?? 0
      if (!bits) continue
      for (let col = 0; col < COLS; col++) {
        if (bits & (1 << (COLS - 1 - col))) {
          g.fillRect(cursor + col * scale, y + row * scale, scale, scale)
        }
      }
    }
    cursor += (COLS + 1) * scale
  }
}

export type TextStyle = 'pixel' | 'vector'

const vectorContexts = new WeakSet<object>()

/** Draw text on `g` with the bitmap font (the default) or the smooth vector font. */
export function setTextStyle(g: CanvasRenderingContext2D, style: TextStyle) {
  if (style === 'vector') vectorContexts.add(g)
  else vectorContexts.delete(g)
}

export function textStyleOf(g: CanvasRenderingContext2D): TextStyle {
  return vectorContexts.has(g) ? 'vector' : 'pixel'
}

/** The vector font: a heavy sans with cap height about 0.72 em, so 7 rows of caps need 9.7 px a row. */
export const VECTOR_FONT = '"Arial Black", "Helvetica Neue", Arial, sans-serif'
const CAP_HEIGHT_EM = 0.72

/** The string as the vector font draws it: capitals, as the bitmap font has, and its heart. */
export function vectorText(text: string): string {
  return text.toUpperCase().replace(/\*/g, '\u2665')
}

function paintVector(
  g: CanvasRenderingContext2D,
  text: string,
  left: number,
  y: number,
  scale: number,
) {
  g.save()
  g.font = `${((ROWS * scale) / CAP_HEIGHT_EM).toFixed(2)}px ${VECTOR_FONT}`
  g.textAlign = 'left'
  g.textBaseline = 'alphabetic'
  g.fillText(
    vectorText(text),
    left,
    y + ROWS * scale,
    Math.max(1, measureText(text, scale)),
  )
  g.restore()
}

const OUTLINE_OFFSETS = [
  [-1, 0],
  [1, 0],
  [0, -1],
  [0, 1],
  [-1, -1],
  [1, -1],
  [-1, 1],
  [1, 1],
] as const

export function drawText(
  g: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  options: TextOptions = {},
) {
  const scale = options.scale ?? 1
  const width = measureText(text, scale)
  const left =
    options.align === 'center'
      ? Math.round(x - width / 2)
      : options.align === 'right'
        ? x - width
        : x
  const draw = vectorContexts.has(g) ? paintVector : paint
  if (options.outline) {
    g.fillStyle = options.outline
    for (const [dx, dy] of OUTLINE_OFFSETS)
      draw(g, text, left + dx, y + dy, scale)
  }
  if (options.shadow) {
    g.fillStyle = options.shadow
    draw(g, text, left + scale, y + scale, scale)
  }
  g.fillStyle = options.color ?? '#ffffff'
  draw(g, text, left, y, scale)
}
