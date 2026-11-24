import {
  drawRainbowStagePlane,
  rainbowStagePlane,
  type RainbowStage,
} from './rainbowGameArt'

// Distinct silhouette bands from reviewed stage artwork provide proper depth
// until the matching source-backed far/mid Kontext renders pass visual review.
export const RAINBOW_DISTANT_PAINTED_PLANES = [
  { depth: 'far', height: 104, speed: 0.1, alpha: 0.16 },
  { depth: 'mid', height: 80, speed: 0.27, alpha: 0.3 },
] as const

/**
 * The painted sky (presentation review P-04: the top half of a stage never moved). It covers the whole field,
 * drifts slowest of every plane and shows at partial strength, so the middle of the playfield stays dark enough
 * for shots. Drawn only once a reviewed sky for the stage has shipped.
 */
export const RAINBOW_PAINTED_SKY = { speed: 0.04, alpha: 0.45 } as const

export function rainbowPaintedSkyScroll(frame: number, drift: number): number {
  return frame * drift * RAINBOW_PAINTED_SKY.speed
}

/** Draw the stage's painted sky over the code-drawn backdrop; false while none has shipped or loaded. */
export function drawRainbowPaintedSky(
  g: CanvasRenderingContext2D,
  stage: RainbowStage,
  frame: number,
  drift: number,
  viewportHeight = 270,
  viewportWidth = 480,
): boolean {
  if (!rainbowStagePlane(stage, 'sky')) return false
  g.save()
  g.globalAlpha = RAINBOW_PAINTED_SKY.alpha
  const drawn = drawRainbowStagePlane(
    g,
    stage,
    'sky',
    rainbowPaintedSkyScroll(frame, drift),
    0,
    viewportHeight,
    viewportWidth,
  )
  g.restore()
  return drawn
}

export function rainbowDistantParallaxLayers(
  frame: number,
  drift: number,
  viewportHeight = 270,
) {
  return RAINBOW_DISTANT_PAINTED_PLANES.map((plane) => ({
    depth: plane.depth,
    height: plane.height,
    alpha: plane.alpha,
    y: viewportHeight - plane.height,
    scroll: frame * drift * plane.speed,
  }))
}

export function drawRainbowDistantParallax(
  g: CanvasRenderingContext2D,
  stage: RainbowStage,
  frame: number,
  drift: number,
  viewportHeight = 270,
  viewportWidth = 480,
): void {
  for (const plane of rainbowDistantParallaxLayers(
    frame,
    drift,
    viewportHeight,
  )) {
    g.save()
    g.globalAlpha = plane.alpha
    drawRainbowStagePlane(
      g,
      stage,
      plane.depth,
      plane.scroll,
      plane.y,
      plane.height,
      viewportWidth,
    )
    g.restore()
  }
}
