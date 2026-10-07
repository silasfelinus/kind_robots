// /utils/arcade/display.ts
//
// The arcade's display layer (conductor kr-arcade t-012; Zuzu Showdown, zuzu-showdown t-027, is the
// first game on it). A game keeps its own small logical world (Zuzu Showdown's 480x270) and draws in
// those units; this decides the canvas it draws on and how that canvas meets the screen, per render
// style, from the box the canvas has and the device's pixel ratio:
//
//   Pixel: the canvas is the logical size and the page shows it at the largest whole number of
//     device pixels per logical pixel that fits, with nearest filtering, so every pixel is the same
//     square. A box too small for a whole multiple to fill most of it is filled instead.
//   HD: the canvas is the logical size times a whole supersample factor, the smallest that covers the
//     box in device pixels, with smooth filtering; the browser shrinks it a hair to the box. Drawing
//     at a whole scale puts every logical edge on a device pixel, so tiled fills never seam.
//
// The game draws under `setTransform(scale, 0, 0, scale, 0, 0)` and never needs to know which style
// is on. Pure, so the contract test can hold the fit at every DPR.

/** How a game meets the screen: the player's choice. Room for more (a CRT look, the DMD). */
export type RenderStyle = 'pixel' | 'hd'

export const RENDER_STYLES: readonly RenderStyle[] = ['pixel', 'hd']

export const RENDER_STYLE_NAMES: Record<RenderStyle, string> = {
  pixel: 'Pixel',
  hd: 'HD',
}

export function isRenderStyle(value: unknown): value is RenderStyle {
  return RENDER_STYLES.includes(value as RenderStyle)
}

/** Device pixel ratios above this draw as if they were this (3x phones stay crisp, 4x screens cool). */
export const MAX_DPR = 3
/** The HD supersample factor's ceiling: 2400 device pixels across a 480-wide game. */
export const MAX_HD_SCALE = 5
/** Pixel fills its box rather than leave more than this share of it empty for a whole multiple. */
export const PIXEL_MIN_FILL = 0.8

export type DisplayFit = {
  /** The canvas's backing store, in device pixels. */
  canvasWidth: number
  canvasHeight: number
  /** Canvas pixels per logical pixel: the transform the game draws under. */
  scale: number
  /** The canvas's width on the page, in CSS pixels (its height follows the aspect ratio). */
  cssWidth: number
  /** Images drawn smooth (HD) or nearest (pixel). */
  smoothing: boolean
  /** The canvas element's CSS image-rendering. */
  rendering: 'pixelated' | 'auto'
}

/**
 * Fit a `width` x `height` logical game into a box `available` CSS pixels wide on a screen with
 * device pixel ratio `dpr`, in `style`.
 */
export function fitDisplay(options: {
  width: number
  height: number
  available: number
  dpr: number
  style: RenderStyle
}): DisplayFit {
  const { width, height, style } = options
  const available = Math.max(1, options.available)
  const dpr = Math.min(
    MAX_DPR,
    Number.isFinite(options.dpr) && options.dpr > 0 ? options.dpr : 1,
  )
  const device = available * dpr
  if (style === 'hd') {
    const scale = Math.min(
      MAX_HD_SCALE,
      Math.max(1, Math.ceil(device / width - 1e-9)),
    )
    return {
      canvasWidth: width * scale,
      canvasHeight: height * scale,
      scale,
      cssWidth: available,
      smoothing: true,
      rendering: 'auto',
    }
  }
  const whole = Math.floor(device / width)
  const cssWidth =
    whole >= 1 && whole * width >= PIXEL_MIN_FILL * device
      ? (whole * width) / dpr
      : available
  return {
    canvasWidth: width,
    canvasHeight: height,
    scale: 1,
    cssWidth,
    smoothing: false,
    rendering: 'pixelated',
  }
}
