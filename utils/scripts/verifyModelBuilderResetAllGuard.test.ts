// /utils/scripts/verifyModelBuilderResetAllGuard.test.ts
//
// Regression test for checkResetAllGuard() in
// verifyModelBuilderResetAllGuard.ts (model-builder/t-029). Exercises the
// real check against synthetic store-shaped fixtures covering: the pre-fix
// shape (only generatingItemId cleared -- the exact gap found by manual
// read-through), and the fixed shape (all five store-wide singletons
// cleared).
import assert from 'node:assert/strict'

import { checkResetAllGuard } from './verifyModelBuilderResetAllGuard.js'

const BUGGY_FIXTURE = `
  function resetAll(): void {
    state.step = 'source'
    state.sourceType = null
    state.sources = []
    state.selectedSource = null
    state.recipeKey = null
    state.selections = {}
    state.run = null
    state.generatingItemId = null
    safeRemove(runIdKey)
    clearStatus()
  }
`

const FIXED_FIXTURE = `
  function resetAll(): void {
    state.step = 'source'
    state.sourceType = null
    state.sources = []
    state.selectedSource = null
    state.recipeKey = null
    state.selections = {}
    state.run = null
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

const buggyErrors = checkResetAllGuard(BUGGY_FIXTURE)
assert.equal(
  buggyErrors.length,
  5,
  `expected the pre-fix shape (only generatingItemId cleared) to raise 5 ` +
    `errors, one per still-dangling singleton, got ${buggyErrors.length}: ` +
    JSON.stringify(buggyErrors),
)
assert.ok(buggyErrors.some((e) => e.includes('committingItemId')))
assert.ok(buggyErrors.some((e) => e.includes('autoBuilding = false')))
assert.ok(buggyErrors.some((e) => e.includes('autoBuildingItemId')))
assert.ok(buggyErrors.some((e) => e.includes('batchingOutputKey')))
assert.ok(buggyErrors.some((e) => e.includes('draftingField.value')))

const fixedErrors = checkResetAllGuard(FIXED_FIXTURE)
assert.equal(
  fixedErrors.length,
  0,
  `expected the fixed shape to raise no errors, got: ${JSON.stringify(fixedErrors)}`,
)

const missingFnErrors = checkResetAllGuard(MISSING_FIXTURE)
assert.equal(
  missingFnErrors.length,
  1,
  'expected a single "function not found" violation when resetAll is absent',
)
assert.ok(missingFnErrors[0]!.includes('resetAll'))

console.log(
  'Model Builder resetAll guard checker verified: flags the pre-fix shape ' +
    '(only generatingItemId cleared), clears the fixed shape (all five ' +
    'store-wide singletons cleared), and flags resetAll being absent ' +
    'entirely.',
)
