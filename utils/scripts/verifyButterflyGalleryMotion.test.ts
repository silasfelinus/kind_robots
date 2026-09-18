// Regression test for the Butterfly Gallery funnel-drop transition geometry
// (butterfly-gallery/t-017, stores/helpers/butterflyGalleryMotion.ts).
// Exercises the pure keyframe-plan builder directly against plain rects --
// no DOM/Web Animations dependency needed.
import assert from 'node:assert/strict'

import { computeButterflyFunnelDropPlan } from '../../stores/helpers/butterflyGalleryMotion'
import type { ButterflyMotionRect } from '../../stores/helpers/butterflyGalleryMotion'

const funnelRect: ButterflyMotionRect = {
  left: 400,
  top: 0,
  width: 200,
  height: 120,
}

const frameRect: ButterflyMotionRect = {
  left: 300,
  top: 200,
  width: 400,
  height: 300,
}

// -- happy path: a valid plan carries the beats in order -------------------

{
  const plan = computeButterflyFunnelDropPlan(funnelRect, frameRect)
  assert.ok(plan, 'expected a plan for two valid rects')

  assert.equal(plan!.keyframes.length, 5)
  assert.deepEqual(
    plan!.keyframes.map((k) => k.offset),
    [0, 0.18, 0.58, 0.82, 1],
  )
  assert.ok(
    plan!.durationMs >= 420 && plan!.durationMs <= 560,
    "duration should land in the storyboard's 420-560ms target window",
  )
  assert.equal(plan!.transformOrigin, '50% 0%')
}

// -- offset 0 (Emerge): roughly normal proportions, smaller than destination

{
  const plan = computeButterflyFunnelDropPlan(funnelRect, frameRect)!
  const emerge = plan.keyframes[0]!
  assert.match(emerge.transform, /scale\(0\.860, 0\.860\)/)

  // Funnel center (500) minus frame center (500) = 0 horizontally in this
  // fixture, so use an off-center funnel to prove translate math directly.
  const offCenterFunnel: ButterflyMotionRect = { ...funnelRect, left: 100 }
  const offCenterPlan = computeButterflyFunnelDropPlan(
    offCenterFunnel,
    frameRect,
  )!
  const offCenterEmerge = offCenterPlan.keyframes[0]!
  // funnelCenterX = 100 + 100 = 200; frameCenterX = 300 + 200 = 500
  // dx = 200 - 500 = -300, full travel (1) at offset 0.
  assert.match(offCenterEmerge.transform, /translate\(-300\.00px/)
}

// -- offset 1 (Settle): always the true destination, true aspect ratio -----

{
  const plan = computeButterflyFunnelDropPlan(funnelRect, frameRect)!
  const settle = plan.keyframes[plan.keyframes.length - 1]!
  assert.equal(
    settle.transform,
    'translate(0.00px, 0.00px) scale(1.000, 1.000)',
  )
}

// -- Stretch beat is vertically exaggerated, horizontally compressed -------

{
  const plan = computeButterflyFunnelDropPlan(funnelRect, frameRect)!
  const stretch = plan.keyframes[2]!
  assert.match(stretch.transform, /scale\(0\.900, 1\.950\)/)
}

// -- Snap beat recoils past neutral the opposite way ------------------------

{
  const plan = computeButterflyFunnelDropPlan(funnelRect, frameRect)!
  const snap = plan.keyframes[3]!
  assert.match(snap.transform, /scale\(1\.050, 0\.900\)/)
  assert.match(snap.transform, /translate\(0\.00px, 0\.00px\)/)
}

// -- unusable rects (storyboard: "skip directly to the final selected image")

{
  const zeroWidthFunnel: ButterflyMotionRect = { ...funnelRect, width: 0 }
  assert.equal(computeButterflyFunnelDropPlan(zeroWidthFunnel, frameRect), null)

  const negativeHeightFrame: ButterflyMotionRect = {
    ...frameRect,
    height: -10,
  }
  assert.equal(
    computeButterflyFunnelDropPlan(funnelRect, negativeHeightFrame),
    null,
  )
}

console.log('verifyButterflyGalleryMotion: all checks passed')
