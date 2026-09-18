// Pure, DOM-free intro orchestration timing/geometry for butterfly-gallery/t-015.
// Mirrors MOTION-STORYBOARD.md's first-visit intro beat contract: room already
// usable, trapdoor cue, picture tumble, settle, then a hard handoff timeout
// that always wins regardless of individual animation completion. Kept
// deterministic (no Math.random()) so the beat plan is directly
// unit-testable, matching this project's established pure-logic-extraction
// convention (butterflyGalleryMotion.ts, butterflyGalleryFilters.ts, etc.).
// The Vue component (pages/butterfly-gallery.vue) owns timers, DOM refs, and
// calling gallery.completeIntro() -- this module only computes what to show
// and when.

export const INTRO_TRAPDOOR_START_MS = 150
export const INTRO_TRAPDOOR_DURATION_MS = 400
export const INTRO_TUMBLE_START_MS = 500
export const INTRO_TUMBLE_END_MS = 1650
export const INTRO_SETTLE_START_MS = 1650
export const INTRO_SETTLE_DURATION_MS = 600
// Storyboard: "regardless of animation events, the intro must self-complete
// by 3.2 seconds. animationend is an optimization, not the only escape
// hatch." This is the one timer the Vue orchestration must always honor.
export const INTRO_HARD_TIMEOUT_MS = 3200

export type ButterflyIntroTumbleFrame = {
  id: number
  /** Horizontal start position as a percent of the stage width. */
  leftPercent: number
  /** Delay before this frame's fall begins, relative to intro start. */
  delayMs: number
  durationMs: number
  rotationDeg: number
  /** Small horizontal drift during the fall, as a percent of stage width. */
  driftPercent: number
}

/**
 * Deterministic tumble-frame trajectories for the picture-tumble beat
 * (MOTION-STORYBOARD.md Beat 2: "Three to five decorative frame proxies fall
 * toward the foreground pile on slightly staggered paths... Keep
 * trajectories deterministic and bounded inside the stage. Use modest
 * rotation and stagger, not physics simulation.").
 *
 * `count` is clamped to the storyboard's 3-5 range. No randomness --
 * index-derived math keeps this reproducible and testable, the same
 * convention pileStyle() already uses in pages/butterfly-gallery.vue.
 */
export function computeButterflyIntroTumblePlan(
  count = 4,
): ButterflyIntroTumbleFrame[] {
  const clampedCount = Math.min(Math.max(Math.round(count), 3), 5)
  const span = INTRO_TUMBLE_END_MS - INTRO_TUMBLE_START_MS
  const rotations = [-14, 9, -6, 12, -10]
  const drifts = [-6, 4, -3, 7, -5]
  const durations = [780, 860, 730, 900, 810]

  return Array.from({ length: clampedCount }, (_, index) => {
    const t = clampedCount === 1 ? 0 : index / (clampedCount - 1)
    return {
      id: index,
      leftPercent: 18 + t * 64,
      // Staggered across the first 60% of the tumble window, so every frame
      // still has time to finish falling before the settle beat starts.
      delayMs: Math.round(INTRO_TUMBLE_START_MS + t * span * 0.6),
      durationMs: durations[index % durations.length] ?? 800,
      rotationDeg: rotations[index % rotations.length] ?? 0,
      driftPercent: drifts[index % drifts.length] ?? 0,
    }
  })
}

export type ButterflyIntroPhase = 'trapdoor' | 'tumble' | 'settle' | 'handoff'

/**
 * Which beat a given elapsed time (ms since intro start) falls into. Used
 * only for diagnostics/tests -- the Vue orchestration schedules its own
 * timers against the constants above rather than polling this on a raf loop.
 */
export function butterflyIntroPhaseAt(elapsedMs: number): ButterflyIntroPhase {
  if (elapsedMs >= INTRO_HARD_TIMEOUT_MS) return 'handoff'
  if (elapsedMs >= INTRO_SETTLE_START_MS) return 'settle'
  if (elapsedMs >= INTRO_TUMBLE_START_MS) return 'tumble'
  return 'trapdoor'
}
