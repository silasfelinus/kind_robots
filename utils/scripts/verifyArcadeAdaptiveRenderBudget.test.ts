import assert from 'node:assert/strict'
import {
  evaluateRenderBudget,
  RENDER_BUDGET_WINDOW,
} from '../arcade/renderBudget'
import {
  MAX_HD_CANVAS_PIXELS,
  MOBILE_HD_CANVAS_PIXELS,
  fitDisplay,
} from '../arcade/display'

const WORLD = { width: 480, height: 270 } as const
const LOGICAL_PIXELS = WORLD.width * WORLD.height
const sample = (ms: number) =>
  Array.from({ length: RENDER_BUDGET_WINDOW }, () => ms)

function decide(
  renderMs: readonly number[],
  currentBudgetPixels = MOBILE_HD_CANVAS_PIXELS,
) {
  const fit = fitDisplay({
    ...WORLD,
    available: 390,
    dpr: 3,
    style: 'hd',
    maxCanvasPixels: currentBudgetPixels,
  })
  return evaluateRenderBudget({
    renderMs,
    currentBudgetPixels,
    maximumBudgetPixels: MOBILE_HD_CANVAS_PIXELS,
    minimumBudgetPixels: LOGICAL_PIXELS,
    backingPixels: fit.canvasWidth * fit.canvasHeight,
  })
}

const slow = decide(sample(20))
assert.equal(slow.samples, RENDER_BUDGET_WINDOW)
assert.equal(slow.medianMs, 20)
assert.equal(slow.p95Ms, 20)
assert.equal(slow.backingBytes, slow.backingPixels * 4)
assert.ok(slow.nextBudgetPixels < MOBILE_HD_CANVAS_PIXELS)
const slowFit = fitDisplay({
  ...WORLD,
  available: 390,
  dpr: 3,
  style: 'hd',
  maxCanvasPixels: slow.nextBudgetPixels,
})
assert.ok(
  slowFit.canvasWidth * slowFit.canvasHeight < slow.backingPixels,
  'Slow rendering reduces actual backing-store allocation',
)
assert.equal(slowFit.canvasWidth / slowFit.canvasHeight, 480 / 270)

const recovery = decide(sample(2), slow.nextBudgetPixels)
assert.ok(recovery.nextBudgetPixels > slow.nextBudgetPixels)
assert.ok(recovery.nextBudgetPixels <= MOBILE_HD_CANVAS_PIXELS)
assert.equal(
  decide(sample(2)).nextBudgetPixels,
  MOBILE_HD_CANVAS_PIXELS,
  'Recovery never exceeds a phone cap',
)
assert.equal(
  decide(sample(20).slice(0, RENDER_BUDGET_WINDOW - 1)).nextBudgetPixels,
  MOBILE_HD_CANVAS_PIXELS,
  'Incomplete windows never change quality',
)
assert.equal(
  decide(sample(9)).nextBudgetPixels,
  MOBILE_HD_CANVAS_PIXELS,
  'Marginal render time does not oscillate quality',
)
assert.equal(
  decide([...sample(2), Number.NaN, Number.POSITIVE_INFINITY]).samples,
  RENDER_BUDGET_WINDOW,
  'Non-finite samples cannot poison percentiles',
)
const tail = sample(2)
tail.splice(-8, 8, ...sample(24).slice(0, 8))
assert.equal(decide(tail).p95Ms, 24)
assert.equal(
  decide(tail).nextBudgetPixels,
  MOBILE_HD_CANVAS_PIXELS,
  'Rare spikes alone do not trigger a downgrade',
)
assert.equal(
  evaluateRenderBudget({
    renderMs: sample(40),
    currentBudgetPixels: LOGICAL_PIXELS,
    maximumBudgetPixels: MAX_HD_CANVAS_PIXELS,
    minimumBudgetPixels: LOGICAL_PIXELS,
    backingPixels: LOGICAL_PIXELS,
  }).nextBudgetPixels,
  LOGICAL_PIXELS,
  'An HD backing canvas never shrinks below the logical world',
)
const pixelFit = fitDisplay({
  ...WORLD,
  available: 390,
  dpr: 3,
  style: 'pixel',
  maxCanvasPixels: slow.nextBudgetPixels,
})
assert.equal(pixelFit.canvasWidth, WORLD.width)
assert.equal(pixelFit.canvasHeight, WORLD.height)
assert.equal(pixelFit.smoothing, false)

console.log('Arcade adaptive render budget: 10 assertions passed')
