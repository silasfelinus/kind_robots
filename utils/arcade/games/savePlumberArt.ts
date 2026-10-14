import { loadedImage } from '../ghostTrail/bake'
import { PLUMBER_WORLDS } from './savePlumberWorlds'
import {
  DEFAULT_HEROINE_SEED,
  createHeroine,
  type Heroine,
} from './savePlumberHeroine'

const ROOT = '/images/arcade/save-the-plumber'

export const PLUMBER_ART = {
  stage: (code: string, slug: string) => `${ROOT}/stages/${code}-${slug}.webp`,
  tile: (world: number) => `${ROOT}/tiles/world-${world}-ground.webp`,
  enemy: (key: string) => `${ROOT}/enemies/${key}.webp`,
  boss: (key: string, pose: 'idle' | 'tell') =>
    `${ROOT}/bosses/${key}-${pose}.webp`,
  prop: (key: string) => `${ROOT}/props/${key}.webp`,
  cast: (key: string) => `${ROOT}/cast/${key}.webp`,
  cutscene: (key: string) => `${ROOT}/cutscenes/${key}.webp`,
  anim: (key: string) => `${ROOT}/anim/${key}.webp`,
}

export function plumberStageSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/^the\s+/, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

export function plumberStageArt(code: string): string | null {
  for (const world of PLUMBER_WORLDS)
    for (const stage of world.stages)
      if (stage.code === code)
        return PLUMBER_ART.stage(code, plumberStageSlug(stage.name))
  return null
}

let activeHeroine: Heroine = createHeroine(DEFAULT_HEROINE_SEED)

/** The heroine the next run draws; the page passes the kept one in. */
export function setPlumberHeroine(heroine: Heroine): void {
  activeHeroine = heroine
}

export function plumberHeroine(): Heroine {
  return activeHeroine
}

export type KeyedSprite = {
  canvas: HTMLCanvasElement
  width: number
  height: number
}

const keyed = new Map<string, KeyedSprite | null>()

/**
 * Remove the flat background a sprite was painted on: flood-fill from every
 * border pixel through pixels close to the border colour, fade the fringe,
 * then crop to what is left. Interior whites (eyes, highlights) survive
 * because they are not connected to the border.
 */
export function keyOutBackground(
  data: Uint8ClampedArray,
  width: number,
  height: number,
  tolerance = 46,
): { left: number; top: number; right: number; bottom: number } | null {
  const at = (i: number) => i * 4
  const corners = [0, width - 1, (height - 1) * width, height * width - 1]
  let r = 0
  let g = 0
  let b = 0
  for (const c of corners) {
    r += data[at(c)]!
    g += data[at(c) + 1]!
    b += data[at(c) + 2]!
  }
  r /= 4
  g /= 4
  b /= 4
  const distance = (i: number) =>
    Math.max(
      Math.abs(data[at(i)]! - r),
      Math.abs(data[at(i) + 1]! - g),
      Math.abs(data[at(i) + 2]! - b),
    )
  const seen = new Uint8Array(width * height)
  const stack: number[] = []
  const push = (i: number) => {
    if (seen[i]) return
    seen[i] = 1
    if (distance(i) <= tolerance) stack.push(i)
  }
  for (let x = 0; x < width; x++) {
    push(x)
    push((height - 1) * width + x)
  }
  for (let y = 0; y < height; y++) {
    push(y * width)
    push(y * width + width - 1)
  }
  while (stack.length) {
    const i = stack.pop()!
    data[at(i) + 3] = 0
    const x = i % width
    const y = (i - x) / width
    if (x > 0) push(i - 1)
    if (x < width - 1) push(i + 1)
    if (y > 0) push(i - width)
    if (y < height - 1) push(i + width)
  }
  let left = width
  let top = height
  let right = -1
  let bottom = -1
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = y * width + x
      if (data[at(i) + 3] === 0) continue
      const near = distance(i)
      if (near < tolerance * 2) {
        const edge =
          (x > 0 && data[at(i - 1) + 3] === 0) ||
          (x < width - 1 && data[at(i + 1) + 3] === 0) ||
          (y > 0 && data[at(i - width) + 3] === 0) ||
          (y < height - 1 && data[at(i + width) + 3] === 0)
        if (edge)
          data[at(i) + 3] = Math.round(
            255 * Math.min(1, (near - tolerance) / tolerance + 0.35),
          )
      }
      if (x < left) left = x
      if (x > right) right = x
      if (y < top) top = y
      if (y > bottom) bottom = y
    }
  }
  return right < 0 ? null : { left, top, right, bottom }
}

/** A delivered sprite with its background keyed out, once loaded; else null. */
export function keyedSprite(src: string): KeyedSprite | null {
  const cached = keyed.get(src)
  if (cached !== undefined) return cached
  const img = loadedImage(src)
  if (!img || typeof document === 'undefined') return null
  const scale = Math.min(1, 256 / Math.max(img.naturalWidth, img.naturalHeight))
  const w = Math.max(1, Math.round(img.naturalWidth * scale))
  const h = Math.max(1, Math.round(img.naturalHeight * scale))
  const work = document.createElement('canvas')
  work.width = w
  work.height = h
  const wg = work.getContext('2d', { willReadFrequently: true })
  if (!wg) {
    keyed.set(src, null)
    return null
  }
  wg.drawImage(img, 0, 0, w, h)
  const pixels = wg.getImageData(0, 0, w, h)
  const box = keyOutBackground(pixels.data, w, h)
  if (!box) {
    keyed.set(src, null)
    return null
  }
  wg.putImageData(pixels, 0, 0)
  const out = document.createElement('canvas')
  out.width = box.right - box.left + 1
  out.height = box.bottom - box.top + 1
  out.getContext('2d')?.drawImage(work, -box.left, -box.top)
  const sprite = { canvas: out, width: out.width, height: out.height }
  keyed.set(src, sprite)
  return sprite
}

/**
 * Draw a keyed sprite standing on (x, y): scaled to `height`, centred on x,
 * optionally mirrored. Returns false when the art has not arrived, so the
 * caller draws its fallback.
 */
export function drawSprite(
  g: CanvasRenderingContext2D,
  src: string,
  x: number,
  y: number,
  height: number,
  options: { flipX?: boolean; squash?: number; alpha?: number } = {},
): boolean {
  const sprite = keyedSprite(src)
  if (!sprite) return false
  const squash = options.squash ?? 1
  const h = height * squash
  const w = (sprite.width / sprite.height) * height * (2 - squash)
  g.save()
  if (options.alpha !== undefined) g.globalAlpha *= options.alpha
  g.translate(x, y)
  if (options.flipX) g.scale(-1, 1)
  g.drawImage(sprite.canvas, -w / 2, -h, w, h)
  g.restore()
  return true
}

const patterns = new WeakMap<
  CanvasRenderingContext2D,
  Map<string, CanvasPattern | null>
>()

/** A repeating fill from a delivered tile texture, `size` logical px square. */
export function tilePattern(
  g: CanvasRenderingContext2D,
  src: string,
  size: number,
): CanvasPattern | null {
  let byCtx = patterns.get(g)
  if (!byCtx) {
    byCtx = new Map()
    patterns.set(g, byCtx)
  }
  const cached = byCtx.get(src)
  if (cached !== undefined) return cached
  const img = loadedImage(src)
  if (!img || typeof document === 'undefined') return null
  const transform =
    typeof g.getTransform === 'function' ? g.getTransform() : null
  const density = Math.max(
    1,
    Math.min(4, Math.round(Math.abs(transform?.a ?? 1))),
  )
  const tile = document.createElement('canvas')
  tile.width = tile.height = Math.max(1, Math.round(size * density))
  tile.getContext('2d')?.drawImage(img, 0, 0, tile.width, tile.height)
  const pattern = g.createPattern(tile, 'repeat')
  if (
    pattern &&
    typeof pattern.setTransform === 'function' &&
    typeof DOMMatrix !== 'undefined'
  )
    pattern.setTransform(new DOMMatrix().scale(1 / density))
  byCtx.set(src, pattern)
  return pattern
}

/** The delivered stage plate once loaded, else null. */
export function stagePlate(src: string): HTMLImageElement | null {
  return loadedImage(src)
}
