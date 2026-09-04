// /utils/scripts/verifyModelBuilderResetOpenRunGuard.test.ts
//
// Regression test for checkResetOpenRunGuard() in
// verifyModelBuilderResetOpenRunGuard.ts (model-builder/t-029, cycle 97).
// Exercises the real check against synthetic store-shaped fixtures covering:
// the pre-fix shape (neither resetRun() nor resetAll() bumps
// openRunRequestId), the fixed shape (both do), a partially-fixed shape
// (only resetRun() bumps it, resetAll() still doesn't), and both functions
// being absent entirely.
import assert from 'node:assert/strict'

import { checkResetOpenRunGuard } from './verifyModelBuilderResetOpenRunGuard.js'

const BUGGY_FIXTURE = `
  function resetRun(): void {
    state.run = null
    state.step = state.selectedSource ? 'recipe' : 'source'
    state.generatingItemId = null
    draftingField.value = null
    runEpoch++
    safeRemove(runIdKey)
    clearStatus()
  }

  function resetAll(): void {
    state.step = 'source'
    state.sourceType = null
    state.run = null
    state.generatingItemId = null
    draftingField.value = null
    runEpoch++
    safeRemove(runIdKey)
    clearStatus()
  }
`

const FIXED_FIXTURE = `
  function resetRun(): void {
    state.run = null
    state.step = state.selectedSource ? 'recipe' : 'source'
    state.generatingItemId = null
    draftingField.value = null
    runEpoch++
    openRunRequestId++
    safeRemove(runIdKey)
    clearStatus()
  }

  function resetAll(): void {
    state.step = 'source'
    state.sourceType = null
    state.run = null
    state.generatingItemId = null
    draftingField.value = null
    runEpoch++
    openRunRequestId++
    safeRemove(runIdKey)
    clearStatus()
  }
`

const PARTIAL_FIXTURE = `
  function resetRun(): void {
    state.run = null
    state.step = state.selectedSource ? 'recipe' : 'source'
    state.generatingItemId = null
    draftingField.value = null
    runEpoch++
    openRunRequestId++
    safeRemove(runIdKey)
    clearStatus()
  }

  function resetAll(): void {
    state.step = 'source'
    state.sourceType = null
    state.run = null
    state.generatingItemId = null
    draftingField.value = null
    runEpoch++
    safeRemove(runIdKey)
    clearStatus()
  }
`

const MISSING_FIXTURE = `
  function approveStage(itemId: string, stageKey: BuildStageKey): void {
    const item = findItem(itemId)
    if (!item) return
    item.stages[stageKey] = { status: 'approved' }
  }
`

const buggyErrors = checkResetOpenRunGuard(BUGGY_FIXTURE)
assert.equal(
  buggyErrors.length,
  2,
  `expected the pre-fix shape to flag both resetRun() and resetAll(), got: ${JSON.stringify(buggyErrors)}`,
)
assert.ok(
  buggyErrors.some((e) => e.includes('resetRun()')),
  `expected a resetRun() violation, got: ${JSON.stringify(buggyErrors)}`,
)
assert.ok(
  buggyErrors.some((e) => e.includes('resetAll()')),
  `expected a resetAll() violation, got: ${JSON.stringify(buggyErrors)}`,
)

const fixedErrors = checkResetOpenRunGuard(FIXED_FIXTURE)
assert.equal(
  fixedErrors.length,
  0,
  `expected the fixed shape to raise no errors, got: ${JSON.stringify(fixedErrors)}`,
)

const partialErrors = checkResetOpenRunGuard(PARTIAL_FIXTURE)
assert.equal(
  partialErrors.length,
  1,
  `expected the partial fix to flag exactly one violation, got: ${JSON.stringify(partialErrors)}`,
)
assert.ok(
  partialErrors.some((e) => e.includes('resetAll()')),
  `expected the partial fix's violation to name resetAll(), got: ${JSON.stringify(partialErrors)}`,
)

const missingErrors = checkResetOpenRunGuard(MISSING_FIXTURE)
assert.equal(
  missingErrors.length,
  2,
  `expected both functions to be flagged as missing, got: ${JSON.stringify(missingErrors)}`,
)

console.log(
  'Model Builder reset/openRun race guard checker verified: flags the ' +
    'pre-fix shape (neither function bumps openRunRequestId), clears the ' +
    'fixed shape (both do), flags a partial fix (only one does), and flags ' +
    'both functions being absent entirely.',
)
