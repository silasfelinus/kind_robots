// /utils/scripts/verifyModelBuilderApprovedAssetGuard.test.ts
//
// Regression test for checkApprovedAssetGuard() in
// verifyModelBuilderApprovedAssetGuard.ts (model-builder/t-029). Exercises
// the real check against synthetic store-shaped fixtures covering: the
// pre-fix shape (no `GENERATE_ASSETS.status === 'approved'` guard before the
// artImageId write -- the exact bug found by manual read-through), and the
// fixed shape (the guard checked and returned on between the result branch
// and the write).
import assert from 'node:assert/strict'

import { checkApprovedAssetGuard } from './verifyModelBuilderApprovedAssetGuard.js'

const BUGGY_FIXTURE = `
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
        finishGenerateAssets(item, { status: 'ready', note: item.error })
        setStatus('error', item.error)
        return
      }

      const image = result.data as { id: number; imagePath?: string | null }
      item.artImageId = image.id
      item.imagePath = image.imagePath ?? null
      finishGenerateAssets(item, { status: 'ready' })

      await recordArtifact(item, image, output, prompt, dims)
      pushItem(item, { stageStatuses: item.stages, artImageId: item.artImageId })
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
        finishGenerateAssets(item, { status: 'ready', note: item.error })
        setStatus('error', item.error)
        return
      }

      if (item.stages.GENERATE_ASSETS.status === 'approved') {
        setStatus('error', 'discarded to avoid silently replacing it')
        return
      }

      const image = result.data as { id: number; imagePath?: string | null }
      item.artImageId = image.id
      item.imagePath = image.imagePath ?? null
      finishGenerateAssets(item, { status: 'ready' })

      await recordArtifact(item, image, output, prompt, dims)
      pushItem(item, { stageStatuses: item.stages, artImageId: item.artImageId })
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

const buggyErrors = checkApprovedAssetGuard(BUGGY_FIXTURE)
assert.equal(
  buggyErrors.length,
  1,
  `expected the pre-fix shape (missing approved-stage guard) to raise 1 ` +
    `error, got ${buggyErrors.length}: ${JSON.stringify(buggyErrors)}`,
)
assert.ok(
  buggyErrors[0]!.includes("GENERATE_ASSETS.status === 'approved'"),
  'expected a violation naming the missing approved-stage guard',
)

const fixedErrors = checkApprovedAssetGuard(FIXED_FIXTURE)
assert.equal(
  fixedErrors.length,
  0,
  `expected the fixed shape to raise no errors, got: ${JSON.stringify(fixedErrors)}`,
)

const missingFnErrors = checkApprovedAssetGuard(MISSING_FIXTURE)
assert.equal(
  missingFnErrors.length,
  1,
  'expected a single "function not found" violation when pollAsyncArtJob is absent',
)
assert.ok(missingFnErrors[0]!.includes('pollAsyncArtJob'))

console.log(
  'Model Builder approved-asset guard checker verified: flags the pre-fix ' +
    'shape (missing approved-stage guard before the artImageId write), ' +
    'clears the fixed shape, and flags pollAsyncArtJob being absent entirely.',
)
