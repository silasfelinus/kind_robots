// /utils/arcade/font.ts
//
// A 5x7 bitmap font drawn with fillRect, so every cabinet shares one crisp
// arcade typeface with no web-font download. Generated art never carries
// lettering; all titles, scores and initials are drawn here.

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
}

/** Width in logical pixels of `text` at `scale` (one column gap per glyph). */
export function measureText(text: string, scale = 1): number {
  if (!text.length) return 0
  return (text.length * (COLS + 1) - 1) * scale
}

export const FONT_HEIGHT = ROWS

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
  if (options.shadow) {
    g.fillStyle = options.shadow
    paint(g, text, left + scale, y + scale, scale)
  }
  g.fillStyle = options.color ?? '#ffffff'
  paint(g, text, left, y, scale)
}
