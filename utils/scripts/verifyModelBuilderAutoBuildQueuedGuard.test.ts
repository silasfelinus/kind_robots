// /utils/scripts/verifyModelBuilderAutoBuildQueuedGuard.test.ts
//
// Regression test for checkAutoBuildQueuedGuard() in
// verifyModelBuilderAutoBuildQueuedGuard.ts (model-builder/t-029). Exercises
// the real check against synthetic store-shaped fixtures covering: the
// pre-fix shape (guard checks only the three singletons, never
// item.queueState -- the exact bug found by manual read-through), the fixed
// shape via the shared isItemManualActionInFlight() helper, a fixed shape
// that checks item.queueState inline instead, and autoBuildItem being absent
// entirely.
import assert from 'node:assert/strict'

import { checkAutoBuildQueuedGuard } from './verifyModelBuilderAutoBuildQueuedGuard.js'

const BUGGY_FIXTURE = `
  function isItemManualActionInFlight(itemId: string): boolean {
    const item = findItem(itemId)
    return (
      state.generatingItemId === itemId ||
      Boolean(item?.queueState) ||
      state.committingItemId === itemId ||
      draftingField.value?.itemId === itemId
    )
  }

  async function autoBuildItem(itemId: string): Promise<AutoBuildOutcome> {
    const item = findItem(itemId)
    if (!item || !state.run) return 'failed'

    if (state.autoBuildingItemId === item.id) return 'skipped'

    if (
      state.generatingItemId === item.id ||
      state.committingItemId === item.id ||
      draftingField.value?.itemId === item.id
    ) {
      return 'skipped'
    }

    autoBuildingItemSingleton.claim(item.id)
    try {
      return 'committed'
    } finally {
      autoBuildingItemSingleton.release(item.id)
    }
  }
`

const FIXED_FIXTURE_SHARED_HELPER = `
  function isItemManualActionInFlight(itemId: string): boolean {
    const item = findItem(itemId)
    return (
      state.generatingItemId === itemId ||
      Boolean(item?.queueState) ||
      state.committingItemId === itemId ||
      draftingField.value?.itemId === itemId
    )
  }

  async function autoBuildItem(itemId: string): Promise<AutoBuildOutcome> {
    const item = findItem(itemId)
    if (!item || !state.run) return 'failed'

    if (state.autoBuildingItemId === item.id) return 'skipped'

    if (isItemManualActionInFlight(item.id)) {
      return 'skipped'
    }

    autoBuildingItemSingleton.claim(item.id)
    try {
      return 'committed'
    } finally {
      autoBuildingItemSingleton.release(item.id)
    }
  }
`

const FIXED_FIXTURE_INLINE = `
  async function autoBuildItem(itemId: string): Promise<AutoBuildOutcome> {
    const item = findItem(itemId)
    if (!item || !state.run) return 'failed'

    if (state.autoBuildingItemId === item.id) return 'skipped'

    if (
      state.generatingItemId === item.id ||
      Boolean(item.queueState) ||
      state.committingItemId === item.id ||
      draftingField.value?.itemId === item.id
    ) {
      return 'skipped'
    }

    autoBuildingItemSingleton.claim(item.id)
    try {
      return 'committed'
    } finally {
      autoBuildingItemSingleton.release(item.id)
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

const buggyErrors = checkAutoBuildQueuedGuard(BUGGY_FIXTURE)
assert.equal(
  buggyErrors.length,
  1,
  'expected the pre-fix shape (queueState never checked inside ' +
    `autoBuildItem) to raise 1 error, got ${buggyErrors.length}: ` +
    JSON.stringify(buggyErrors),
)
assert.ok(buggyErrors[0]!.includes('item.queueState'))

const fixedSharedErrors = checkAutoBuildQueuedGuard(FIXED_FIXTURE_SHARED_HELPER)
assert.equal(
  fixedSharedErrors.length,
  0,
  'expected the shared-helper fixed shape to raise no errors, got: ' +
    JSON.stringify(fixedSharedErrors),
)

const fixedInlineErrors = checkAutoBuildQueuedGuard(FIXED_FIXTURE_INLINE)
assert.equal(
  fixedInlineErrors.length,
  0,
  'expected the inline-check fixed shape to raise no errors, got: ' +
    JSON.stringify(fixedInlineErrors),
)

const missingFnErrors = checkAutoBuildQueuedGuard(MISSING_FIXTURE)
assert.equal(
  missingFnErrors.length,
  1,
  'expected a single "function not found" violation when autoBuildItem is absent',
)
assert.ok(missingFnErrors[0]!.includes('autoBuildItem'))

console.log(
  'Model Builder auto-build queued-item guard checker verified: flags an ' +
    'in-flight bail-out that never checks item.queueState, clears both the ' +
    'shared-helper and inline-check fixed shapes, and flags autoBuildItem ' +
    'being absent entirely.',
)
