// /utils/scripts/verifyModelBuilderResetRunGuard.test.ts
//
// Regression test for checkResetRunGuard() in
// verifyModelBuilderResetRunGuard.ts (model-builder/t-029). Exercises the
// real check against synthetic store-shaped fixtures covering: the pre-fix
// shape (no store-wide singletons cleared -- the exact gap found by manual
// read-through), and the fixed shape (all six store-wide singletons
// cleared).
import assert from 'node:assert/strict'

import { checkResetRunGuard } from './verifyModelBuilderResetRunGuard.js'

const BUGGY_FIXTURE = `
  function resetRun(): void {
    state.run = null
    state.step = state.selectedSource ? 'recipe' : 'source'
    safeRemove(runIdKey)
    clearStatus()
  }
`

const FIXED_FIXTURE = `
  function resetRun(): void {
    state.run = null
    state.step = state.selectedSource ? 'recipe' : 'source'
    state.generatingItemId = null
    state.committingItemId = null
    state.autoBuilding = false
    state.autoBuildingItemId = null
    state.batchingOutputKey = null
    draftingField.value = null
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

const buggyErrors = checkResetRunGuard(BUGGY_FIXTURE)
assert.equal(
  buggyErrors.length,
  6,
  `expected the pre-fix shape (no singletons cleared) to raise 6 errors, ` +
    `one per still-dangling singleton, got ${buggyErrors.length}: ` +
    JSON.stringify(buggyErrors),
)
assert.ok(buggyErrors.some((e) => e.includes('generatingItemId')))
assert.ok(buggyErrors.some((e) => e.includes('committingItemId')))
assert.ok(buggyErrors.some((e) => e.includes('autoBuilding = false')))
assert.ok(buggyErrors.some((e) => e.includes('autoBuildingItemId')))
assert.ok(buggyErrors.some((e) => e.includes('batchingOutputKey')))
assert.ok(buggyErrors.some((e) => e.includes('draftingField.value')))

const fixedErrors = checkResetRunGuard(FIXED_FIXTURE)
assert.equal(
  fixedErrors.length,
  0,
  `expected the fixed shape to raise no errors, got: ${JSON.stringify(fixedErrors)}`,
)

const missingFnErrors = checkResetRunGuard(MISSING_FIXTURE)
assert.equal(
  missingFnErrors.length,
  1,
  'expected a single "function not found" violation when resetRun is absent',
)
assert.ok(missingFnErrors[0]!.includes('resetRun'))

console.log(
  'Model Builder resetRun guard checker verified: flags the pre-fix shape ' +
    '(no store-wide singletons cleared), clears the fixed shape (all six ' +
    'store-wide singletons cleared), and flags resetRun being absent ' +
    'entirely.',
)
