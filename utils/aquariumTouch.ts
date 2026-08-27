// /utils/aquariumTouch.ts
//
// Pure geometry helper for cthulhuquarium/t-020 (performance, responsive
// layout, and the layout contract). The tank canvas renders at a fixed
// logical resolution (STAGE_WIDTH x STAGE_HEIGHT) and is scaled to the host
// panel's actual width by CSS -- on a phone that scale factor can be well
// under 1, which silently shrinks every canvas-space hit target (motes,
// eventually anything else clickable in the tank) to something well under a
// thumb-sized tap target even though nothing about the drawn radius itself
// changed. This function is the one place that math happens, so it can be
// unit-tested without a canvas or a browser (see
// utils/scripts/verifyAquariumTouch.test.ts).

/**
 * Given a base hit radius expressed in canvas/stage units, return a radius
 * (still in stage units) that is at least large enough for the target to
 * cover `minTouchPx` CSS pixels on screen once the canvas has been scaled
 * from `stageWidth` down to `displayWidth`. Never shrinks the base radius --
 * only ever grows it to compensate for a small display scale.
 */
export function touchHitRadius(
  baseRadius: number,
  stageWidth: number,
  displayWidth: number,
  minTouchPx = 44,
): number {
  if (!Number.isFinite(displayWidth) || displayWidth <= 0) return baseRadius
  if (!Number.isFinite(stageWidth) || stageWidth <= 0) return baseRadius

  const scale = displayWidth / stageWidth
  if (scale <= 0) return baseRadius

  const minRadiusForTouch = minTouchPx / 2 / scale
  return Math.max(baseRadius, minRadiusForTouch)
}
