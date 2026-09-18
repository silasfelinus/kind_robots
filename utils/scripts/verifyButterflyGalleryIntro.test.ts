// Regression test for the Butterfly Gallery first-visit intro orchestration
// (butterfly-gallery/t-015, stores/helpers/butterflyGalleryIntro.ts).
// Exercises the pure tumble-plan builder and phase classifier directly --
// no DOM/timer dependency needed.
import assert from 'node:assert/strict'

import {
  INTRO_HARD_TIMEOUT_MS,
  INTRO_SETTLE_START_MS,
  INTRO_TUMBLE_END_MS,
  INTRO_TUMBLE_START_MS,
  butterflyIntroPhaseAt,
  computeButterflyIntroTumblePlan,
} from '../../stores/helpers/butterflyGalleryIntro'

// -- tumble plan: storyboard's 3-5 frame count is enforced, not trusted -----

{
  assert.equal(computeButterflyIntroTumblePlan(1).length, 3)
  assert.equal(computeButterflyIntroTumblePlan(4).length, 4)
  assert.equal(computeButterflyIntroTumblePlan(9).length, 5)
}

// -- every frame's fall completes before the settle beat starts, and stays
//    inside the bounded stage window (storyboard: "bounded inside the stage")

{
  const plan = computeButterflyIntroTumblePlan(5)
  assert.equal(plan.length, 5)

  for (const frame of plan) {
    assert.ok(
      frame.delayMs >= INTRO_TUMBLE_START_MS,
      'no frame starts before the tumble beat begins',
    )
    assert.ok(
      frame.delayMs + frame.durationMs <= INTRO_TUMBLE_END_MS + 400,
      'every frame finishes with headroom before the hard timeout',
    )
    assert.ok(
      frame.leftPercent >= 0 && frame.leftPercent <= 100,
      'frame stays within the stage horizontally',
    )
  }

  // Deterministic: same input always produces the same plan (no Math.random()).
  const replay = computeButterflyIntroTumblePlan(5)
  assert.deepEqual(plan, replay)
}

// -- ids are stable and ordered left-to-right ------------------------------

{
  const plan = computeButterflyIntroTumblePlan(5)
  assert.deepEqual(
    plan.map((frame) => frame.id),
    [0, 1, 2, 3, 4],
  )
  for (let i = 1; i < plan.length; i += 1) {
    assert.ok(
      plan[i]!.leftPercent > plan[i - 1]!.leftPercent,
      'frames are laid out left-to-right across the stage',
    )
  }
}

// -- phase classifier follows the storyboard's beat boundaries --------------

{
  assert.equal(butterflyIntroPhaseAt(0), 'trapdoor')
  assert.equal(butterflyIntroPhaseAt(INTRO_TUMBLE_START_MS - 1), 'trapdoor')
  assert.equal(butterflyIntroPhaseAt(INTRO_TUMBLE_START_MS), 'tumble')
  assert.equal(butterflyIntroPhaseAt(INTRO_SETTLE_START_MS - 1), 'tumble')
  assert.equal(butterflyIntroPhaseAt(INTRO_SETTLE_START_MS), 'settle')
  assert.equal(butterflyIntroPhaseAt(INTRO_HARD_TIMEOUT_MS - 1), 'settle')
  assert.equal(butterflyIntroPhaseAt(INTRO_HARD_TIMEOUT_MS), 'handoff')
  assert.equal(butterflyIntroPhaseAt(9999), 'handoff')
}

console.log('verifyButterflyGalleryIntro: all checks passed')
