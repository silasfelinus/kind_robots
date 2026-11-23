/** Render-time adaptation for HD Arcade canvases. Simulation ticks are unaffected. */
export const RENDER_BUDGET_WINDOW = 120
export const RENDER_SLOW_P95_MS = 12
export const RENDER_FAST_P95_MS = 5

export type RenderBudgetDecision = {
  samples: number
  medianMs: number
  p95Ms: number
  backingPixels: number
  backingBytes: number
  nextBudgetPixels: number
}

/**
 * The 95th percentile is intentionally more sensitive to intermittent expensive
 * paint frames than the average. Budgets change only after a full window of valid
 * render samples, and by one step, to avoid flickering between canvas sizes.
 */
export function evaluateRenderBudget(options: {
  renderMs: readonly number[]
  currentBudgetPixels: number
  maximumBudgetPixels: number
  minimumBudgetPixels: number
  backingPixels: number
}): RenderBudgetDecision {
  const durations = options.renderMs
    .filter((ms) => Number.isFinite(ms) && ms >= 0)
    .sort((a, b) => a - b)
  const count = durations.length
  const medianMs = count ? durations[Math.floor((count - 1) * 0.5)]! : 0
  const p95Ms = count ? durations[Math.ceil(count * 0.95) - 1]! : 0
  const maximum = Math.max(1, Math.floor(options.maximumBudgetPixels))
  const minimum = Math.min(
    maximum,
    Math.max(1, Math.ceil(options.minimumBudgetPixels)),
  )
  const current = Math.min(
    maximum,
    Math.max(minimum, Math.floor(options.currentBudgetPixels)),
  )
  let nextBudgetPixels = current

  if (count >= RENDER_BUDGET_WINDOW) {
    if (p95Ms > RENDER_SLOW_P95_MS && medianMs > 7) {
      nextBudgetPixels = Math.max(minimum, Math.floor(current * 0.75))
    } else if (p95Ms < RENDER_FAST_P95_MS && medianMs < 3) {
      nextBudgetPixels = Math.min(maximum, Math.ceil(current * 1.25))
    }
  }

  const backingPixels = Math.max(0, Math.floor(options.backingPixels))
  return {
    samples: count,
    medianMs,
    p95Ms,
    backingPixels,
    backingBytes: backingPixels * 4,
    nextBudgetPixels,
  }
}
