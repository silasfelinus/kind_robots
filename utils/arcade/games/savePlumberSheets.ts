import { loadedImage } from '../ghostTrail/bake'
import { keyOutBackground, type KeyedSprite } from './savePlumberArt'

export type FrameBox = {
  left: number
  top: number
  right: number
  bottom: number
}

/**
 * Find the `expected` figures in a keyed sheet: label 4-connected opaque
 * shapes, keep the `expected` largest as frames, fold every smaller shape
 * (a sparkle, a detached scarf tail, a speed line) into the nearest frame,
 * and order the frames left to right. Painted figures overlap in columns
 * (a raised hand above the next head), so slicing by shape rather than by
 * empty column keeps them apart. Returns null when the sheet does not hold
 * `expected` substantial figures, for example when two of them touch.
 */
export function sliceShapes(
  alpha: (x: number, y: number) => number,
  width: number,
  height: number,
  expected: number,
): { label: Int32Array; frames: (FrameBox & { ids: number[] })[] } | null {
  const label = new Int32Array(width * height)
  const shapes: (FrameBox & { size: number; id: number })[] = []
  const queue = new Int32Array(width * height)
  for (let start = 0; start < width * height; start++) {
    if (label[start] || alpha(start % width, (start / width) | 0) <= 24)
      continue
    const id = shapes.length + 1
    const shape = {
      id,
      size: 0,
      left: width,
      top: height,
      right: -1,
      bottom: -1,
    }
    let head = 0
    let tail = 0
    queue[tail++] = start
    label[start] = id
    while (head < tail) {
      const i = queue[head++]!
      const x = i % width
      const y = (i - x) / width
      shape.size++
      if (x < shape.left) shape.left = x
      if (x > shape.right) shape.right = x
      if (y < shape.top) shape.top = y
      if (y > shape.bottom) shape.bottom = y
      const visit = (n: number, nx: number, ny: number) => {
        if (label[n] || alpha(nx, ny) <= 24) return
        label[n] = id
        queue[tail++] = n
      }
      if (x > 0) visit(i - 1, x - 1, y)
      if (x < width - 1) visit(i + 1, x + 1, y)
      if (y > 0) visit(i - width, x, y - 1)
      if (y < height - 1) visit(i + width, x, y + 1)
    }
    shapes.push(shape)
  }
  if (shapes.length < expected) return null
  shapes.sort((a, b) => b.size - a.size)
  const frames = shapes.slice(0, expected).map((f) => ({ ...f, ids: [f.id] }))
  if (frames[expected - 1]!.size < frames[0]!.size * 0.15) return null
  for (const extra of shapes.slice(expected)) {
    const cx = (extra.left + extra.right) / 2
    const cy = (extra.top + extra.bottom) / 2
    const gap = (f: FrameBox) =>
      Math.max(0, f.left - cx, cx - f.right) +
      Math.max(0, f.top - cy, cy - f.bottom)
    const target = frames.reduce((best, f) => (gap(f) < gap(best) ? f : best))
    target.ids.push(extra.id)
    target.left = Math.min(target.left, extra.left)
    target.top = Math.min(target.top, extra.top)
    target.right = Math.max(target.right, extra.right)
    target.bottom = Math.max(target.bottom, extra.bottom)
  }
  return {
    label,
    frames: frames
      .sort((a, b) => a.left - b.left)
      .map(({ left, top, right, bottom, ids }) => ({
        left,
        top,
        right,
        bottom,
        ids,
      })),
  }
}

/** The figures' bounding boxes, left to right; see sliceShapes. */
export function frameBoxes(
  alpha: (x: number, y: number) => number,
  width: number,
  height: number,
  expected: number,
): FrameBox[] | null {
  const sliced = sliceShapes(alpha, width, height, expected)
  return sliced
    ? sliced.frames.map(({ left, top, right, bottom }) => ({
        left,
        top,
        right,
        bottom,
      }))
    : null
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
  const scale = Math.min(1, 960 / img.naturalWidth)
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
  const sliced = sliceShapes(alpha, w, h, frames)
  if (!sliced) {
    sheets.set(id, null)
    return null
  }
  const boxes = sliced.frames
  const tallest = Math.max(...boxes.map((b) => b.bottom - b.top + 1))
  const result: KeyedSheet = {
    height: tallest,
    frames: boxes.map((b) => {
      const fw = b.right - b.left + 1
      const fh = b.bottom - b.top + 1
      const own = new Set(b.ids)
      const out = document.createElement('canvas')
      out.width = fw
      out.height = tallest
      const og = out.getContext('2d')
      if (og) {
        const cut = og.createImageData(fw, fh)
        for (let y = 0; y < fh; y++)
          for (let x = 0; x < fw; x++) {
            const from = (b.top + y) * w + b.left + x
            if (!own.has(sliced.label[from]!)) continue
            const to = (y * fw + x) * 4
            cut.data[to] = pixels.data[from * 4]!
            cut.data[to + 1] = pixels.data[from * 4 + 1]!
            cut.data[to + 2] = pixels.data[from * 4 + 2]!
            cut.data[to + 3] = pixels.data[from * 4 + 3]!
          }
        og.putImageData(cut, 0, tallest - fh)
      }
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
