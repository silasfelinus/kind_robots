// /utils/arcade/ghostTrail/bake.ts
//
// Zuzu: Ghost Trail's art helpers (conductor kr-arcade t-013/t-014). The trail plays in a 320x240
// logical world, but the cabinet's default HD style draws it at up to 5 device pixels per logical
// pixel, and the accepted mockups are painted at that density. So the trail's sprites are drawn by
// code onto offscreen canvases at a matching density, baked once per (key, density), and placed in
// logical units: crisp, detailed art in HD, a clean 1x bake in the Pixel style.
//
// Plates and other delivered art load as images from the site; a game must draw a procedural
// fallback until an image is ready (and always headless, where there is no document).

/** Device pixels per logical pixel the context is drawing at, capped at the bake ceiling. */
export function densityOf(g: CanvasRenderingContext2D, max = 4): number {
  const t = typeof g.getTransform === 'function' ? g.getTransform() : null
  const scale = t && Number.isFinite(t.a) ? Math.abs(t.a) : 1
  return Math.max(1, Math.min(max, Math.round(scale)))
}

const bakes = new Map<string, HTMLCanvasElement | null>()

/**
 * Draw `paint`'s art, `w` x `h` logical pixels with its top-left at (x, y), from a canvas baked at
 * the context's density. `paint` draws in logical units with (0, 0) at the top-left; it runs once
 * per key and density. With `flipX` the art is mirrored about its centre. Headless (no document)
 * `paint` draws straight onto `g`.
 */
export function drawBaked(
  g: CanvasRenderingContext2D,
  key: string,
  x: number,
  y: number,
  w: number,
  h: number,
  paint: (b: CanvasRenderingContext2D) => void,
  options: { flipX?: boolean; alpha?: number } = {},
) {
  const density = densityOf(g)
  const id = `${key}@${density}`
  let canvas = bakes.get(id)
  if (canvas === undefined) {
    canvas = null
    if (typeof document !== 'undefined') {
      const made = document.createElement('canvas')
      made.width = Math.max(1, Math.ceil(w * density))
      made.height = Math.max(1, Math.ceil(h * density))
      const b = made.getContext('2d')
      if (b) {
        b.scale(density, density)
        paint(b)
        canvas = made
      }
    }
    bakes.set(id, canvas)
  }
  g.save()
  if (options.alpha !== undefined) g.globalAlpha *= options.alpha
  g.translate(options.flipX ? x + w : x, y)
  if (options.flipX) g.scale(-1, 1)
  if (canvas) {
    g.imageSmoothingEnabled = density > 1
    g.drawImage(canvas, 0, 0, w, h)
  } else {
    paint(g)
  }
  g.restore()
}

const images = new Map<string, HTMLImageElement | null>()

/**
 * The image at `src` once it has loaded, else null (and null forever headless or if it fails).
 * The first call starts the load; draw a fallback until this returns the image.
 */
export function loadedImage(src: string): HTMLImageElement | null {
  let img = images.get(src)
  if (img === undefined) {
    img = null
    if (typeof Image !== 'undefined') {
      const made = new Image()
      made.decoding = 'async'
      made.onerror = () => images.set(src, null)
      made.src = src
      img = made
    }
    images.set(src, img)
  }
  return img && img.complete && img.naturalWidth > 0 ? img : null
}
