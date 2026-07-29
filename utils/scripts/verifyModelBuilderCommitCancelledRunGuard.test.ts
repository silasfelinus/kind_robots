// /utils/scripts/verifyModelBuilderCommitCancelledRunGuard.test.ts
//
// Regression test for checkCommitCancelledRunGuard() in
// verifyModelBuilderCommitCancelledRunGuard.ts (model-builder/t-029).
// Exercises the real check against synthetic store-shaped fixtures covering:
// the pre-fix shape (no `runId` capture, no cancelledRunIds check between the
// commit POST resolving and its target read -- the exact bug found by manual
// read-through), and the fixed shape.
import assert from 'node:assert/strict'

import { checkCommitCancelledRunGuard } from './verifyModelBuilderCommitCancelledRunGuard.js'

const BUGGY_FIXTURE = `
  async function commitItem(itemId: string): Promise<boolean> {
    const item = findItem(itemId)
    if (!item) return false

    committingItemSingleton.claim(item.id)
    item.error = null
    item.stages.COMMIT = { status: 'in-progress' }
    clearStatus()

    try {
      const response = await performFetch(
        \`/api/model-builder/items/\${item.id}/commit\`,
        { method: 'POST' },
        1,
        60_000,
      )

      if (!response.success) {
        throw new Error(response.message || 'Commit failed.')
      }

      const target = response.data?.target ?? null
      finishCommit(item, { status: 'approved', note: 'Committed.' })
      if (target) {
        item.targetType = target.type
        item.targetId = target.id
      }
      setStatus('success', 'committed.')
      return true
    } catch (error) {
      handleError(error, 'committing build item')
      return false
    } finally {
      committingItemSingleton.release(item.id)
    }
  }
`

const FIXED_FIXTURE = `
  async function commitItem(itemId: string): Promise<boolean> {
    const item = findItem(itemId)
    if (!item || !state.run) return false
    const runId = state.run.id

    committingItemSingleton.claim(item.id)
    item.error = null
    item.stages.COMMIT = { status: 'in-progress' }
    clearStatus()

    try {
      const response = await performFetch(
        \`/api/model-builder/items/\${item.id}/commit\`,
        { method: 'POST' },
        1,
        60_000,
      )

      if (!response.success) {
        throw new Error(response.message || 'Commit failed.')
      }

      if (cancelledRunIds.has(runId)) return false

      const target = response.data?.target ?? null
      finishCommit(item, { status: 'approved', note: 'Committed.' })
      if (target) {
        item.targetType = target.type
        item.targetId = target.id
      }
      setStatus('success', 'committed.')
      return true
    } catch (error) {
      if (cancelledRunIds.has(runId)) return false

      handleError(error, 'committing build item')
      return false
    } finally {
      committingItemSingleton.release(item.id)
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

const buggyErrors = checkCommitCancelledRunGuard(BUGGY_FIXTURE)
assert.equal(
  buggyErrors.length,
  2,
  `expected the pre-fix shape (missing runId capture AND missing ` +
    `cancelledRunIds check) to raise 2 errors, got ${buggyErrors.length}: ` +
    `${JSON.stringify(buggyErrors)}`,
)
assert.ok(
  buggyErrors.some((e) => e.includes('runId = state.run.id')),
  'expected a violation for the missing runId capture',
)
assert.ok(
  buggyErrors.some((e) => e.includes('cancelledRunIds')),
  'expected a violation for the missing cancelledRunIds check',
)

const fixedErrors = checkCommitCancelledRunGuard(FIXED_FIXTURE)
assert.equal(
  fixedErrors.length,
  0,
  `expected the fixed shape to raise no errors, got: ${JSON.stringify(fixedErrors)}`,
)

const missingFnErrors = checkCommitCancelledRunGuard(MISSING_FIXTURE)
assert.equal(
  missingFnErrors.length,
  1,
  'expected a single "function not found" violation when commitItem is absent',
)
assert.ok(missingFnErrors[0]!.includes('commitItem'))

console.log(
  'Model Builder commit cancelled-run guard checker verified: flags the ' +
    'pre-fix shape (missing runId capture and missing post-commit ' +
    'cancelledRunIds check), clears the fixed shape, and flags commitItem ' +
    'being absent entirely.',
)
