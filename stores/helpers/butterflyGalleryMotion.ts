// Pure geometry/keyframe math for the Butterfly Gallery selected-image
// funnel-drop transition (butterfly-gallery/t-017, implementing the
// "Selected-image funnel transition" contract in
// projects/butterfly-gallery/MOTION-STORYBOARD.md on the conductor repo).
// Deliberately has no DOM/Web Animations dependency so the keyframe math can
// be unit-tested directly (see
// utils/scripts/verifyButterflyGalleryMotion.test.ts) the same way the
// filter predicate and action appliers are -- the caller supplies plain
// rects (from getBoundingClientRect()) and applies the returned keyframes
// via element.animate().

export interface ButterflyMotionRect {
  left: number
  top: number
  width: number
  height: number
}

export interface ButterflyFunnelDropKeyframe {
  offset: number
  transform: string
}

export interface ButterflyFunnelDropPlan {
  /** Total keyframe-animation duration in ms (storyboard target: 420-560ms). */
  durationMs: number
  /** Transform-origin to apply to the proxy element for the whole run. */
  transformOrigin: string
  keyframes: ButterflyFunnelDropKeyframe[]
}

const DURATION_MS = 500

/** Slightly smaller than destination width at the funnel, per the
 * storyboard's Emerge beat ("roughly normal proportions, slightly smaller
 * than destination width"). */
const EMERGE_SCALE = 0.86

/**
 * Builds the fixed-position proxy's Emerge -> Stretch -> Snap -> Settle
 * keyframes for animating a selected-image entry from the drop-funnel mouth
 * to the central frame, matching MOTION-STORYBOARD.md's beat percentages and
 * scale ranges. The proxy element is assumed to be laid out (position,
 * width, height) to exactly match `frameRect` at rest -- these keyframes
 * describe a `transform` (translate + scale) applied on top of that resting
 * box, so `translate(...)` at offset 1 is always `(0, 0)` and `scale(...)`
 * is always `(1, 1)` there (true destination, true aspect ratio).
 *
 * Returns null when either rect is unusable (zero/negative dimensions),
 * matching the storyboard's "skip directly to the final selected image"
 * fallback -- callers should treat a null return as "do not animate."
 */
export function computeButterflyFunnelDropPlan(
  funnelRect: ButterflyMotionRect,
  frameRect: ButterflyMotionRect,
): ButterflyFunnelDropPlan | null {
  if (
    funnelRect.width <= 0 ||
    funnelRect.height <= 0 ||
    frameRect.width <= 0 ||
    frameRect.height <= 0
  ) {
    return null
  }

  const funnelCenterX = funnelRect.left + funnelRect.width / 2
  const funnelStartY = funnelRect.top + funnelRect.height
  const frameCenterX = frameRect.left + frameRect.width / 2
  const frameCenterY = frameRect.top + frameRect.height / 2

  // Fixed pixel offset (unscaled, since translate is applied after scale in
  // the transform function list) carrying the proxy from the funnel mouth
  // to its resting position at the frame.
  const dx = funnelCenterX - frameCenterX
  const dy = funnelStartY - frameCenterY

  const beat = (
    offset: number,
    travel: number,
    scaleX: number,
    scaleY: number,
  ): ButterflyFunnelDropKeyframe => ({
    offset,
    transform: `translate(${(dx * travel).toFixed(2)}px, ${(dy * travel).toFixed(2)}px) scale(${scaleX.toFixed(3)}, ${scaleY.toFixed(3)})`,
  })

  return {
    durationMs: DURATION_MS,
    transformOrigin: '50% 0%',
    keyframes: [
      // Emerge (0-18%): at the funnel, roughly normal proportions.
      beat(0, 1, EMERGE_SCALE, EMERGE_SCALE),
      beat(0.18, 0.78, 0.93, 1.15),
      // Stretch (18-58%): travels down, exaggerated vertical stretch.
      beat(0.58, 0.08, 0.9, 1.95),
      // Snap (58-82%): arrives, recoils past neutral the other way.
      beat(0.82, 0, 1.05, 0.9),
      // Settle (82-100%): true destination, true aspect ratio.
      beat(1, 0, 1, 1),
    ],
  }
}
