import { drawRainbowStagePlane, type RainbowStageStrip } from './rainbowGameArt'

// Distinct silhouette bands from reviewed stage artwork provide proper depth
// until the matching source-backed far/mid Kontext renders pass visual review.
export const RAINBOW_DISTANT_PAINTED_PLANES = [
  { depth: 'far', height: 104, speed: 0.1, alpha: 0.16 },
  { depth: 'mid', height: 80, speed: 0.27, alpha: 0.3 },
] as const

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
  stage: RainbowStageStrip,
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
