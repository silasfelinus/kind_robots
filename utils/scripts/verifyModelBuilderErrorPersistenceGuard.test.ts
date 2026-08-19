// /utils/scripts/verifyModelBuilderErrorPersistenceGuard.test.ts
//
// Regression test for checkErrorPersistenceGuard() in
// verifyModelBuilderErrorPersistenceGuard.ts (model-builder/t-029;
// draftText added to TARGET_FUNCTIONS in model-builder/t-045). Exercises the
// real check against synthetic store-shaped fixtures covering: the pre-fix
// shape (item.error set locally in all five target functions but never
// pushed to the server), the fixed shape (each function pushes it somewhere
// -- mirroring the real store's mix of a dedicated
// `pushItem(item, { error: ... })` call and one piggybacked onto an
// existing success-path payload alongside other keys), a partially-fixed
// shape (only some functions fixed), and all five target functions absent.
import assert from 'node:assert/strict'

import { checkErrorPersistenceGuard } from './verifyModelBuilderErrorPersistenceGuard.js'

const BUGGY_FIXTURE = `
  async function generateItemAsset(itemId: string): Promise<boolean> {
    const item = findItem(itemId)
    if (!item || !state.run) return false
    try {
      const result = await artStore.generateCurrentArt({})
      pushItem(item, { stageStatuses: item.stages, artImageId: item.artImageId })
      return true
    } catch (error) {
      item.error = error instanceof Error ? error.message : 'Generation failed.'
      finishGenerateAssets(item, { status: 'ready', note: item.error })
      return false
    }
  }

  async function pollAsyncArtJob(item, jobId, generateData, output, prompt, dims, runId): Promise<void> {
    const result = await artStore.finalizeQueuedArtImage(job, generateData)
    if (!result.success || !result.data) {
      item.error = result.message || 'Art job did not complete.'
      finishGenerateAssets(item, { status: 'ready', note: item.error })
      return
    }
    pushItem(item, { stageStatuses: item.stages, artImageId: item.artImageId })
  }

  async function generateItemAssetAsync(itemId: string): Promise<boolean> {
    const item = findItem(itemId)
    try {
      item.artJobId = enqueued.jobId
      return true
    } catch (error) {
      item.error = error instanceof Error ? error.message : 'Failed to queue generation.'
      finishGenerateAssets(item, { status: 'ready', note: item.error })
      return false
    }
  }

  async function commitItem(itemId: string): Promise<boolean> {
    const item = findItem(itemId)
    try {
      const response = await performFetch('/commit', {})
      finishCommit(item, { status: 'approved' })
      return true
    } catch (error) {
      item.error = error instanceof Error ? error.message : 'Commit failed.'
      finishCommit(item, { status: 'ready', note: item.error })
      return false
    }
  }

  async function draftText(itemId: string, field: DraftField): Promise<boolean> {
    const item = findItem(itemId)
    try {
      const result = await performFetch('/api/suggest', {})
      updatePitch(itemId, result.data.value)
      return true
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Draft request failed.'
      item.error = message
      setStatusForRun(runId, 'error', message)
      return false
    }
  }
`

const FIXED_FIXTURE = `
  async function generateItemAsset(itemId: string): Promise<boolean> {
    const item = findItem(itemId)
    if (!item || !state.run) return false
    try {
      const result = await artStore.generateCurrentArt({})
      pushItem(item, {
        stageStatuses: item.stages,
        artImageId: item.artImageId,
        error: null,
      })
      return true
    } catch (error) {
      item.error = error instanceof Error ? error.message : 'Generation failed.'
      finishGenerateAssets(item, { status: 'ready', note: item.error })
      pushItem(item, { error: item.error })
      return false
    }
  }

  async function pollAsyncArtJob(item, jobId, generateData, output, prompt, dims, runId): Promise<void> {
    const result = await artStore.finalizeQueuedArtImage(job, generateData)
    if (!result.success || !result.data) {
      item.error = result.message || 'Art job did not complete.'
      finishGenerateAssets(item, { status: 'ready', note: item.error })
      pushItem(item, { error: item.error })
      return
    }
    pushItem(item, {
      stageStatuses: item.stages,
      artImageId: item.artImageId,
      error: null,
    })
  }

  async function generateItemAssetAsync(itemId: string): Promise<boolean> {
    const item = findItem(itemId)
    try {
      item.artJobId = enqueued.jobId
      return true
    } catch (error) {
      item.error = error instanceof Error ? error.message : 'Failed to queue generation.'
      finishGenerateAssets(item, { status: 'ready', note: item.error })
      pushItem(item, { error: item.error })
      return false
    }
  }

  async function commitItem(itemId: string): Promise<boolean> {
    const item = findItem(itemId)
    try {
      const response = await performFetch('/commit', {})
      finishCommit(item, { status: 'approved' })
      pushItem(item, { error: null })
      return true
    } catch (error) {
      item.error = error instanceof Error ? error.message : 'Commit failed.'
      finishCommit(item, { status: 'ready', note: item.error })
      pushItem(item, { error: item.error })
      return false
    }
  }

  async function draftText(itemId: string, field: DraftField): Promise<boolean> {
    const item = findItem(itemId)
    try {
      const result = await performFetch('/api/suggest', {})
      updatePitch(itemId, result.data.value)
      return true
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Draft request failed.'
      item.error = message
      setStatusForRun(runId, 'error', message)
      pushItem(item, { error: item.error })
      return false
    }
  }
`

const PARTIALLY_FIXED_FIXTURE = `
  async function generateItemAsset(itemId: string): Promise<boolean> {
    try {
      pushItem(item, { stageStatuses: item.stages, error: null })
      return true
    } catch (error) {
      item.error = error instanceof Error ? error.message : 'Generation failed.'
      return false
    }
  }

  async function pollAsyncArtJob(item, jobId): Promise<void> {
    item.error = 'Art job did not complete.'
  }

  async function generateItemAssetAsync(itemId: string): Promise<boolean> {
    try {
      return true
    } catch (error) {
      item.error = 'Failed to queue generation.'
      return false
    }
  }

  async function commitItem(itemId: string): Promise<boolean> {
    try {
      pushItem(item, { error: null })
      return true
    } catch (error) {
      item.error = 'Commit failed.'
      pushItem(item, { error: item.error })
      return false
    }
  }

  async function draftText(itemId: string, field: DraftField): Promise<boolean> {
    try {
      updatePitch(itemId, 'value')
      return true
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Draft request failed.'
      item.error = message
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

const buggyErrors = checkErrorPersistenceGuard(BUGGY_FIXTURE)
assert.equal(
  buggyErrors.length,
  5,
  'expected the pre-fix shape (item.error set but never pushed, in all ' +
    `five functions) to raise 5 errors, got ${buggyErrors.length}: ` +
    JSON.stringify(buggyErrors),
)

const fixedErrors = checkErrorPersistenceGuard(FIXED_FIXTURE)
assert.equal(
  fixedErrors.length,
  0,
  `expected the fixed shape to raise no errors, got: ${JSON.stringify(fixedErrors)}`,
)

const partialErrors = checkErrorPersistenceGuard(PARTIALLY_FIXED_FIXTURE)
assert.equal(
  partialErrors.length,
  3,
  'expected pollAsyncArtJob (never pushes), generateItemAssetAsync (never ' +
    `pushes), and draftText (never pushes) to be flagged, got ${partialErrors.length}: ` +
    JSON.stringify(partialErrors),
)
assert.ok(partialErrors.some((e) => e.includes('pollAsyncArtJob')))
assert.ok(partialErrors.some((e) => e.includes('generateItemAssetAsync')))
assert.ok(partialErrors.some((e) => e.includes('draftText')))

const missingErrors = checkErrorPersistenceGuard(MISSING_FIXTURE)
assert.equal(
  missingErrors.length,
  5,
  'expected 5 "function not found" violations when all target functions are absent',
)
for (const name of [
  'generateItemAsset',
  'generateItemAssetAsync',
  'pollAsyncArtJob',
  'commitItem',
  'draftText',
]) {
  assert.ok(
    missingErrors.some((e) => e.includes(name)),
    `expected a violation naming ${name}`,
  )
}

console.log(
  'Model Builder item.error persistence guard checker verified: flags ' +
    'item.error set-but-never-pushed in each of the five target ' +
    'functions independently, clears the fixed shape, and flags all five ' +
    'target functions being absent.',
)
