import { drawRainbowStageStrip, type RainbowStageStrip } from './rainbowGameArt'

// Reuse each Act's reviewed painted coral in quieter, more distant depths.
// Distinct scroll speeds preserve real parallax without adding network assets or combat RNG.
export const RAINBOW_DISTANT_PAINTED_PLANES = [
  { height: 98, speed: 0.12, alpha: 0.13 },
  { height: 72, speed: 0.29, alpha: 0.26 },
] as const

export function rainbowDistantParallaxLayers(
  frame: number,
  drift: number,
  viewportHeight = 270,
) {
  return RAINBOW_DISTANT_PAINTED_PLANES.map((plane) => ({
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
    drawRainbowStageStrip(
      g,
      stage,
      plane.scroll,
      plane.y,
      plane.height,
      viewportWidth,
    )
    g.restore()
  }
}
