// /utils/scripts/verifyModelBuilderErrorPersistenceGuard.test.ts
//
// Regression test for checkErrorPersistenceGuard() in
// verifyModelBuilderErrorPersistenceGuard.ts (model-builder/t-029).
// Exercises the real check against synthetic store-shaped fixtures covering:
// the pre-fix shape (item.error set locally in all four target functions
// but never pushed to the server), the fixed shape (each function pushes it
// somewhere -- mirroring the real store's mix of a dedicated
// `pushItem(item, { error: ... })` call and one piggybacked onto an
// existing success-path payload alongside other keys), a partially-fixed
// shape (only some functions fixed), and all four target functions absent.
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
  4,
  'expected the pre-fix shape (item.error set but never pushed, in all ' +
    `four functions) to raise 4 errors, got ${buggyErrors.length}: ` +
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
  2,
  'expected pollAsyncArtJob (never pushes) and generateItemAssetAsync ' +
    `(never pushes) to be flagged, got ${partialErrors.length}: ` +
    JSON.stringify(partialErrors),
)
assert.ok(partialErrors.some((e) => e.includes('pollAsyncArtJob')))
assert.ok(partialErrors.some((e) => e.includes('generateItemAssetAsync')))

const missingErrors = checkErrorPersistenceGuard(MISSING_FIXTURE)
assert.equal(
  missingErrors.length,
  4,
  'expected 4 "function not found" violations when all target functions are absent',
)
for (const name of [
  'generateItemAsset',
  'generateItemAssetAsync',
  'pollAsyncArtJob',
  'commitItem',
]) {
  assert.ok(
    missingErrors.some((e) => e.includes(name)),
    `expected a violation naming ${name}`,
  )
}

console.log(
  'Model Builder item.error persistence guard checker verified: flags ' +
    'item.error set-but-never-pushed in each of the four target ' +
    'functions independently, clears the fixed shape, and flags all four ' +
    'target functions being absent.',
)
