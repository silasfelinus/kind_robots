// /utils/scripts/verifyModelBuilderApprovedAssetGuard.test.ts
//
// Regression test for the store + UI halves of the approved-asset guard in
// verifyModelBuilderApprovedAssetGuard.ts (model-builder/t-029).
import assert from 'node:assert/strict'

import {
  checkApprovedAssetGuard,
  checkApprovedAssetUiGuard,
} from './verifyModelBuilderApprovedAssetGuard.js'

function pollAsyncArtJobBody(guarded: boolean): string {
  return `
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
      ${
        guarded
          ? `
      if (item.stages.GENERATE_ASSETS.status === 'approved') {
        setStatus('error', 'discarded to avoid silently replacing it')
        return
      }
      `
          : ''
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
}

function generateItemAssetBody(guarded: boolean): string {
  return `
  async function generateItemAsset(itemId: string): Promise<boolean> {
    const item = findItem(itemId)
    if (!item || !state.run) return false
    const runId = state.run.id
    const artStore = useArtStore()

    generatingItemSingleton.claim(item.id)
    try {
      const result = await artStore.generateCurrentArt({})

      if (!result.success || !result.data) {
        throw new Error(result.message || 'Generation failed.')
      }

      if (cancelledRunIds.has(runId)) return false
      ${
        guarded
          ? `
      if (item.stages.GENERATE_ASSETS.status === 'approved') {
        setStatus('error', 'discarded to avoid silently replacing it')
        return false
      }
      `
          : ''
      }
      const image = result.data as { id: number; imagePath?: string | null }
      item.artImageId = image.id
      item.imagePath = image.imagePath ?? null
      finishGenerateAssets(item, { status: 'ready' })

      setStatus('success', \`Generated a candidate for \${item.label}.\`)
      return true
    } finally {
      generatingItemSingleton.release(item.id)
    }
  }
`
}

function panelBody(guarded: boolean): string {
  return `
const canApproveAssets = computed(() => {
  if (!item.value) return false
  if (isLocked('GENERATE_ASSETS')) return false
  ${
    guarded
      ? "if (item.value.stages.GENERATE_ASSETS.status === 'in-progress') return false"
      : ''
  }
  if (isGenerating.value || isQueued.value) return false
  if (item.value.generation === 'image') return Boolean(item.value.artImageId)
  return true
})
`
}

const BUGGY_FIXTURE = pollAsyncArtJobBody(false) + generateItemAssetBody(false)
const FIXED_FIXTURE = pollAsyncArtJobBody(true) + generateItemAssetBody(true)
const PARTIALLY_FIXED_FIXTURE =
  pollAsyncArtJobBody(true) + generateItemAssetBody(false)

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
  2,
  `expected the pre-fix store shape to raise 2 errors, got ${buggyErrors.length}: ` +
    `${JSON.stringify(buggyErrors)}`,
)
assert.ok(
  buggyErrors.every((e) => e.includes("GENERATE_ASSETS.status === 'approved'")),
  'expected both store violations to name the missing approved-stage guard',
)

const partiallyFixedErrors = checkApprovedAssetGuard(PARTIALLY_FIXED_FIXTURE)
assert.equal(
  partiallyFixedErrors.length,
  1,
  `expected fixing only pollAsyncArtJob to leave 1 error, got ` +
    `${partiallyFixedErrors.length}: ${JSON.stringify(partiallyFixedErrors)}`,
)
assert.ok(partiallyFixedErrors[0]!.includes('generateItemAsset'))

const fixedErrors = checkApprovedAssetGuard(FIXED_FIXTURE)
assert.equal(
  fixedErrors.length,
  0,
  `expected the fixed store shape to raise no errors, got: ${JSON.stringify(fixedErrors)}`,
)

const missingFnErrors = checkApprovedAssetGuard(MISSING_FIXTURE)
assert.equal(
  missingFnErrors.length,
  2,
  'expected a function-not-found violation for pollAsyncArtJob and generateItemAsset',
)
assert.ok(missingFnErrors.some((e) => e.includes('pollAsyncArtJob')))
assert.ok(missingFnErrors.some((e) => e.includes('generateItemAsset')))

const buggyUiErrors = checkApprovedAssetUiGuard(panelBody(false))
assert.equal(
  buggyUiErrors.length,
  1,
  `expected the pre-fix UI shape to raise 1 error, got: ${JSON.stringify(buggyUiErrors)}`,
)
assert.ok(buggyUiErrors[0]!.includes("GENERATE_ASSETS.status === 'in-progress'"))

const fixedUiErrors = checkApprovedAssetUiGuard(panelBody(true))
assert.equal(
  fixedUiErrors.length,
  0,
  `expected the fixed UI shape to raise no errors, got: ${JSON.stringify(fixedUiErrors)}`,
)

const missingUiErrors = checkApprovedAssetUiGuard('const somethingElse = true')
assert.equal(missingUiErrors.length, 1)
assert.ok(missingUiErrors[0]!.includes('canApproveAssets'))

console.log(
  'Model Builder approved-asset guard checker verified: flags missing ' +
    'store completion guards and the UI async-finalization approval window, ' +
    'and clears both fixed shapes.',
)
