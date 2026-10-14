import { loadedImage } from '../ghostTrail/bake'
import { keyOutBackground, type KeyedSprite } from './savePlumberArt'

export type FrameSpan = { left: number; right: number }

/**
 * Split a keyed sheet into frames along its empty columns. Gaps narrower
 * than `minGap` do not split; spans narrower than a sixth of a frame (a
 * stray sparkle or speed line) join their nearest neighbour. Returns null
 * when the sheet does not separate into exactly `expected` frames.
 */
export function frameSpans(
  alpha: (x: number, y: number) => number,
  width: number,
  height: number,
  expected: number,
  minGap = 3,
): FrameSpan[] | null {
  const filled: boolean[] = []
  for (let x = 0; x < width; x++) {
    let any = false
    for (let y = 0; y < height && !any; y++) any = alpha(x, y) > 24
    filled.push(any)
  }
  const spans: FrameSpan[] = []
  let start = -1
  let gap = 0
  for (let x = 0; x <= width; x++) {
    const on = x < width && filled[x]
    if (on) {
      if (start < 0) start = x
      gap = 0
      continue
    }
    if (start < 0) continue
    gap++
    if (gap >= minGap || x === width) {
      spans.push({ left: start, right: x - gap })
      start = -1
      gap = 0
    }
  }
  const minWidth = Math.max(4, Math.round(width / expected / 6))
  for (let i = 0; i < spans.length;) {
    const span = spans[i]!
    if (span.right - span.left + 1 >= minWidth || spans.length === 1) {
      i++
      continue
    }
    const prev = spans[i - 1]
    const next = spans[i + 1]
    const target =
      prev && (!next || span.left - prev.right <= next.left - span.right)
        ? prev
        : next!
    target.left = Math.min(target.left, span.left)
    target.right = Math.max(target.right, span.right)
    spans.splice(i, 1)
  }
  return spans.length === expected ? spans : null
}

export type KeyedSheet = {
  frames: KeyedSprite[]
  /** Shared frame height: every frame is padded to it, feet on the bottom edge. */
  height: number
}

const sheets = new Map<string, KeyedSheet | null>()

/**
 * A delivered animation sheet (one character, `frames` poses in a row on a
 * flat background) keyed out and sliced into frames that share one ground
 * line, once loaded; else null. A sheet that does not split cleanly into
 * `frames` is rejected rather than drawn with mismatched frames.
 */
export function keyedSheet(src: string, frames: number): KeyedSheet | null {
  const id = `${src}#${frames}`
  const cached = sheets.get(id)
  if (cached !== undefined) return cached
  const img = loadedImage(src)
  if (!img || typeof document === 'undefined') return null
  const scale = Math.min(1, 1600 / img.naturalWidth)
  const w = Math.max(1, Math.round(img.naturalWidth * scale))
  const h = Math.max(1, Math.round(img.naturalHeight * scale))
  const work = document.createElement('canvas')
  work.width = w
  work.height = h
  const wg = work.getContext('2d', { willReadFrequently: true })
  if (!wg) {
    sheets.set(id, null)
    return null
  }
  wg.drawImage(img, 0, 0, w, h)
  const pixels = wg.getImageData(0, 0, w, h)
  if (!keyOutBackground(pixels.data, w, h)) {
    sheets.set(id, null)
    return null
  }
  wg.putImageData(pixels, 0, 0)
  const alpha = (x: number, y: number) => pixels.data[(y * w + x) * 4 + 3]!
  const spans = frameSpans(alpha, w, h, frames)
  if (!spans) {
    sheets.set(id, null)
    return null
  }
  const boxes = spans.map((span) => {
    let top = h
    let bottom = -1
    for (let y = 0; y < h; y++)
      for (let x = span.left; x <= span.right; x++)
        if (alpha(x, y) > 24) {
          top = Math.min(top, y)
          bottom = Math.max(bottom, y)
          break
        }
    return { ...span, top, bottom }
  })
  const tallest = Math.max(...boxes.map((b) => b.bottom - b.top + 1))
  const result: KeyedSheet = {
    height: tallest,
    frames: boxes.map((b) => {
      const fw = b.right - b.left + 1
      const fh = b.bottom - b.top + 1
      const out = document.createElement('canvas')
      out.width = fw
      out.height = tallest
      out
        .getContext('2d')
        ?.drawImage(work, b.left, b.top, fw, fh, 0, tallest - fh, fw, fh)
      return { canvas: out, width: fw, height: tallest }
    }),
  }
  sheets.set(id, result)
  return result
}

/**
 * Draw frame `index` of a keyed sheet standing on (x, y), `height` px tall
 * for the sheet's tallest frame. Returns false when the sheet has not
 * arrived or did not slice, so the caller draws its fallback.
 */
export function drawSheetFrame(
  g: CanvasRenderingContext2D,
  src: string,
  frames: number,
  index: number,
  x: number,
  y: number,
  height: number,
  options: { flipX?: boolean; alpha?: number } = {},
): boolean {
  const sheet = keyedSheet(src, frames)
  const frame = sheet?.frames[((index % frames) + frames) % frames]
  if (!sheet || !frame) return false
  const k = height / sheet.height
  g.save()
  if (options.alpha !== undefined) g.globalAlpha *= options.alpha
  g.translate(x, y)
  if (options.flipX) g.scale(-1, 1)
  g.drawImage(
    frame.canvas,
    (-frame.width * k) / 2,
    -height,
    frame.width * k,
    height,
  )
  g.restore()
  return true
}
