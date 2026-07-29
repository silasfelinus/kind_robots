// /utils/scripts/verifyModelBuilderCancelledRunGuard.test.ts
//
// Regression test for checkCancelledRunGuard() in
// verifyModelBuilderCancelledRunGuard.ts (model-builder/t-029). Exercises
// the real check against synthetic store-shaped fixtures covering: the
// pre-fix shape (no `runId` param, no cancelledRunIds check -- the exact bug
// found by manual read-through), and the fixed shape (runId threaded
// through, cancelledRunIds checked between finalizeQueuedArtImage resolving
// and its result branch).
import assert from 'node:assert/strict'

import { checkCancelledRunGuard } from './verifyModelBuilderCancelledRunGuard.js'

const BUGGY_FIXTURE = `
  async function pollAsyncArtJob(
    item: BuildItem,
    jobId: number,
    generateData: GenerateArtData,
    output: BuildOutputConfig | undefined,
    prompt: string,
    dims: { width: number; height: number },
  ): Promise<void> {
    const artStore = useArtStore()

    while (item.artJobId === jobId) {
      const job = await artStore.getArtJobStatus(jobId)
      if (item.artJobId !== jobId) return

      if (!job || job.status === 'PENDING') {
        await new Promise((resolve) => setTimeout(resolve, 5000))
        continue
      }

      item.artJobId = null
      item.queueState = null

      const result = await artStore.finalizeQueuedArtImage(job, generateData)

      if (!result.success || !result.data) {
        item.error = result.message || 'failed'
        setStatus('error', item.error)
        return
      }

      item.artImageId = result.data.id
      await recordArtifact(item, result.data, output, prompt, dims)
      pushItem(item, { artImageId: item.artImageId })
      setStatus('success', 'Generated a candidate.')
      return
    }
  }
`

const FIXED_FIXTURE = `
  async function pollAsyncArtJob(
    item: BuildItem,
    jobId: number,
    generateData: GenerateArtData,
    output: BuildOutputConfig | undefined,
    prompt: string,
    dims: { width: number; height: number },
    runId: string,
  ): Promise<void> {
    const artStore = useArtStore()

    while (item.artJobId === jobId) {
      const job = await artStore.getArtJobStatus(jobId)
      if (item.artJobId !== jobId) return

      if (!job || job.status === 'PENDING') {
        await new Promise((resolve) => setTimeout(resolve, 5000))
        continue
      }

      item.artJobId = null
      item.queueState = null

      const result = await artStore.finalizeQueuedArtImage(job, generateData)

      if (cancelledRunIds.has(runId)) return

      if (!result.success || !result.data) {
        item.error = result.message || 'failed'
        setStatus('error', item.error)
        return
      }

      item.artImageId = result.data.id
      await recordArtifact(item, result.data, output, prompt, dims)
      pushItem(item, { artImageId: item.artImageId })
      setStatus('success', 'Generated a candidate.')
      return
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

const buggyErrors = checkCancelledRunGuard(BUGGY_FIXTURE)
assert.equal(
  buggyErrors.length,
  2,
  `expected the pre-fix shape (missing runId param AND missing cancelledRunIds ` +
    `check) to raise 2 errors, got ${buggyErrors.length}: ${JSON.stringify(buggyErrors)}`,
)
assert.ok(
  buggyErrors.some((e) => e.includes('runId: string')),
  'expected a violation for the missing runId parameter',
)
assert.ok(
  buggyErrors.some((e) => e.includes('cancelledRunIds')),
  'expected a violation for the missing cancelledRunIds check',
)

const fixedErrors = checkCancelledRunGuard(FIXED_FIXTURE)
assert.equal(
  fixedErrors.length,
  0,
  `expected the fixed shape to raise no errors, got: ${JSON.stringify(fixedErrors)}`,
)

const missingFnErrors = checkCancelledRunGuard(MISSING_FIXTURE)
assert.equal(
  missingFnErrors.length,
  1,
  'expected a single "function not found" violation when pollAsyncArtJob is absent',
)
assert.ok(missingFnErrors[0]!.includes('pollAsyncArtJob'))

console.log(
  'Model Builder cancelled-run guard checker verified: flags the pre-fix ' +
    'shape (missing runId param and missing post-finalize cancelledRunIds ' +
    'check), clears the fixed shape, and flags pollAsyncArtJob being ' +
    'absent entirely.',
)
