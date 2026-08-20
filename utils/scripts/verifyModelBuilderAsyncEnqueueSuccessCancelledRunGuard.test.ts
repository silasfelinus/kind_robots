// /utils/scripts/verifyModelBuilderAsyncEnqueueSuccessCancelledRunGuard.test.ts
//
// Regression test for checkAsyncEnqueueSuccessCancelledRunGuard() in
// verifyModelBuilderAsyncEnqueueSuccessCancelledRunGuard.ts (model-builder/
// t-029 cycle 29). Exercises the real check against synthetic store-shaped
// fixtures covering: the pre-fix shape (no cancelledRunIds check before the
// success path's `item.artJobId = enqueued.jobId` poll-arming assignment --
// the exact gap found by manual read-through, comparing
// generateItemAssetAsync's success path against its own catch block and its
// synchronous sibling generateItemAsset), and the fixed shape.
import assert from 'node:assert/strict'

import { checkAsyncEnqueueSuccessCancelledRunGuard } from './verifyModelBuilderAsyncEnqueueSuccessCancelledRunGuard.js'

const BUGGY_FIXTURE = `
  async function generateItemAssetAsync(itemId: string): Promise<boolean> {
    const item = findItem(itemId)
    if (!item || !state.run) return false
    const runId = state.run.id

    item.error = null
    item.queueState = 'queued'
    item.stages.GENERATE_ASSETS = { status: 'in-progress', note: 'queued' }
    clearStatus()

    try {
      await artStore.prepareArtGenerator()

      const enqueued = await artStore.enqueueCurrentArt({ promptString: prompt })

      if (!enqueued.success || !enqueued.jobId || !enqueued.data) {
        throw new Error(enqueued.message || 'Failed to queue generation.')
      }

      item.artJobId = enqueued.jobId
      void pollAsyncArtJob(item, enqueued.jobId, enqueued.data, output, prompt, dims, runId)
      return true
    } catch (error) {
      if (cancelledRunIds.has(runId)) return false

      handleError(error, 'queueing model builder asset')
      item.error = error instanceof Error ? error.message : 'Failed to queue generation.'
      finishGenerateAssets(item, { status: 'ready', note: item.error })
      item.queueState = null
      item.artJobId = null
      setStatusForRun(runId, 'error', item.error)
      return false
    }
  }
`

const FIXED_FIXTURE = `
  async function generateItemAssetAsync(itemId: string): Promise<boolean> {
    const item = findItem(itemId)
    if (!item || !state.run) return false
    const runId = state.run.id

    item.error = null
    item.queueState = 'queued'
    item.stages.GENERATE_ASSETS = { status: 'in-progress', note: 'queued' }
    clearStatus()

    try {
      await artStore.prepareArtGenerator()

      const enqueued = await artStore.enqueueCurrentArt({ promptString: prompt })

      if (!enqueued.success || !enqueued.jobId || !enqueued.data) {
        throw new Error(enqueued.message || 'Failed to queue generation.')
      }

      if (cancelledRunIds.has(runId)) return false

      item.artJobId = enqueued.jobId
      void pollAsyncArtJob(item, enqueued.jobId, enqueued.data, output, prompt, dims, runId)
      return true
    } catch (error) {
      if (cancelledRunIds.has(runId)) return false

      handleError(error, 'queueing model builder asset')
      item.error = error instanceof Error ? error.message : 'Failed to queue generation.'
      finishGenerateAssets(item, { status: 'ready', note: item.error })
      item.queueState = null
      item.artJobId = null
      setStatusForRun(runId, 'error', item.error)
      return false
    }
  }
`

const MISSING_FIXTURE = `
  function approveStage(itemId: string, stageKey: BuildStageKey): void {
    const item = findItem(itemId)
    if (!item) return
    item.stages[stageKey] = { status: 'approved' }
  }
`

const buggyErrors = checkAsyncEnqueueSuccessCancelledRunGuard(BUGGY_FIXTURE)
assert.equal(
  buggyErrors.length,
  1,
  `expected the pre-fix shape (missing cancelledRunIds check before the ` +
    `poll-arming assignment) to raise 1 error, got ${buggyErrors.length}: ` +
    `${JSON.stringify(buggyErrors)}`,
)
assert.ok(
  buggyErrors[0]!.includes('cancelledRunIds'),
  'expected a violation naming the missing cancelledRunIds check',
)

const fixedErrors = checkAsyncEnqueueSuccessCancelledRunGuard(FIXED_FIXTURE)
assert.equal(
  fixedErrors.length,
  0,
  `expected the fixed shape to raise no errors, got: ${JSON.stringify(fixedErrors)}`,
)

const missingFnErrors =
  checkAsyncEnqueueSuccessCancelledRunGuard(MISSING_FIXTURE)
assert.equal(
  missingFnErrors.length,
  1,
  'expected a single "function not found" violation when ' +
    'generateItemAssetAsync is absent',
)
assert.ok(missingFnErrors[0]!.includes('generateItemAssetAsync'))

console.log(
  'Model Builder async-enqueue success cancelled-run guard checker ' +
    'verified: flags the pre-fix shape (missing cancelledRunIds check ' +
    'before the poll-arming assignment), clears the fixed shape, and flags ' +
    'generateItemAssetAsync being absent entirely.',
)
