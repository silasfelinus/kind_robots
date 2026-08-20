// /utils/scripts/verifyModelBuilderAutoBuildBatchExclusionGuard.test.ts
//
// Regression test for checkAutoBuildBatchExclusionGuard() in
// verifyModelBuilderAutoBuildBatchExclusionGuard.ts (model-builder/t-029,
// cycle 25). Exercises the real check against synthetic store-shaped
// fixtures covering: the pre-fix shape (isRunOperationInFlight only checks
// its own flag, autoBuildRun never calls it, no batch function checks
// state.autoBuilding), the fixed shape (all five functions), a partial fix
// that leaves one batch function behind, and all five target functions
// being absent entirely.
import assert from 'node:assert/strict'

import { checkAutoBuildBatchExclusionGuard } from './verifyModelBuilderAutoBuildBatchExclusionGuard.js'

const BUGGY_FIXTURE = `
  function isRunOperationInFlight(): boolean {
    return state.autoBuilding
  }

  async function autoBuildRun(): Promise<void> {
    if (!state.run || state.autoBuilding) return
    state.autoBuilding = true
    try {
      // ...
    } finally {
      state.autoBuilding = false
    }
  }

  async function batchDraftField(
    outputKey: string,
    field: DraftField,
  ): Promise<void> {
    const items = groupItems(outputKey)
    if (!items.length) return
    batchingOutputSingleton.claim(outputKey)
    try {
      // ...
    } finally {
      batchingOutputSingleton.release(outputKey)
    }
  }

  async function batchSetField(
    outputKey: string,
    fieldKey: string,
    value: string,
  ): Promise<void> {
    batchingOutputSingleton.claim(outputKey)
    try {
      // ...
    } finally {
      batchingOutputSingleton.release(outputKey)
    }
  }

  async function batchApproveStage(
    outputKey: string,
    stageKey: BuildStageKey,
  ): Promise<void> {
    batchingOutputSingleton.claim(outputKey)
    try {
      // ...
    } finally {
      batchingOutputSingleton.release(outputKey)
    }
  }

  async function batchAutoBuild(outputKey: string): Promise<void> {
    const items = groupItems(outputKey)
    if (!items.length) return
    batchingOutputSingleton.claim(outputKey)
    try {
      // ...
    } finally {
      batchingOutputSingleton.release(outputKey)
    }
  }
`

const FIXED_FIXTURE = `
  function isRunOperationInFlight(): boolean {
    return state.autoBuilding || state.batchingOutputKey !== null
  }

  async function autoBuildRun(): Promise<void> {
    if (!state.run || isRunOperationInFlight()) return
    state.autoBuilding = true
    try {
      // ...
    } finally {
      state.autoBuilding = false
    }
  }

  async function batchDraftField(
    outputKey: string,
    field: DraftField,
  ): Promise<void> {
    const items = groupItems(outputKey)
    if (!items.length) return
    if (state.autoBuilding) return
    batchingOutputSingleton.claim(outputKey)
    try {
      // ...
    } finally {
      batchingOutputSingleton.release(outputKey)
    }
  }

  async function batchSetField(
    outputKey: string,
    fieldKey: string,
    value: string,
  ): Promise<void> {
    if (state.autoBuilding) return
    batchingOutputSingleton.claim(outputKey)
    try {
      // ...
    } finally {
      batchingOutputSingleton.release(outputKey)
    }
  }

  async function batchApproveStage(
    outputKey: string,
    stageKey: BuildStageKey,
  ): Promise<void> {
    if (state.autoBuilding) return
    batchingOutputSingleton.claim(outputKey)
    try {
      // ...
    } finally {
      batchingOutputSingleton.release(outputKey)
    }
  }

  async function batchAutoBuild(outputKey: string): Promise<void> {
    const items = groupItems(outputKey)
    if (!items.length) return
    if (state.autoBuilding) return
    batchingOutputSingleton.claim(outputKey)
    try {
      // ...
    } finally {
      batchingOutputSingleton.release(outputKey)
    }
  }
`

const PARTIAL_FIX_FIXTURE = `
  function isRunOperationInFlight(): boolean {
    return state.autoBuilding || state.batchingOutputKey !== null
  }

  async function autoBuildRun(): Promise<void> {
    if (!state.run || isRunOperationInFlight()) return
    state.autoBuilding = true
    try {
      // ...
    } finally {
      state.autoBuilding = false
    }
  }

  async function batchDraftField(
    outputKey: string,
    field: DraftField,
  ): Promise<void> {
    const items = groupItems(outputKey)
    if (!items.length) return
    if (state.autoBuilding) return
    batchingOutputSingleton.claim(outputKey)
    try {
      // ...
    } finally {
      batchingOutputSingleton.release(outputKey)
    }
  }

  async function batchSetField(
    outputKey: string,
    fieldKey: string,
    value: string,
  ): Promise<void> {
    if (state.autoBuilding) return
    batchingOutputSingleton.claim(outputKey)
    try {
      // ...
    } finally {
      batchingOutputSingleton.release(outputKey)
    }
  }

  async function batchApproveStage(
    outputKey: string,
    stageKey: BuildStageKey,
  ): Promise<void> {
    if (state.autoBuilding) return
    batchingOutputSingleton.claim(outputKey)
    try {
      // ...
    } finally {
      batchingOutputSingleton.release(outputKey)
    }
  }

  async function batchAutoBuild(outputKey: string): Promise<void> {
    const items = groupItems(outputKey)
    if (!items.length) return
    batchingOutputSingleton.claim(outputKey)
    try {
      // ...
    } finally {
      batchingOutputSingleton.release(outputKey)
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

const buggyErrors = checkAutoBuildBatchExclusionGuard(BUGGY_FIXTURE)
assert.equal(
  buggyErrors.length,
  6,
  'expected the pre-fix shape to raise 1 "helper missing batchingOutputKey ' +
    'check" error, 1 "autoBuildRun doesn\'t call the helper" error, and 4 ' +
    `per-batch-function violations, got ${buggyErrors.length}: ` +
    JSON.stringify(buggyErrors),
)
assert.ok(
  buggyErrors.some((e) => e.includes('batchingOutputKey !== null')),
  'expected an error calling out the helper missing its ' +
    'state.batchingOutputKey !== null check',
)
assert.ok(buggyErrors.some((e) => e.startsWith('autoBuildRun()')))
for (const name of [
  'batchDraftField',
  'batchSetField',
  'batchApproveStage',
  'batchAutoBuild',
]) {
  assert.ok(
    buggyErrors.some((e) => e.startsWith(`${name}()`)),
    `expected an error for ${name}() not bailing out on state.autoBuilding`,
  )
}

const fixedErrors = checkAutoBuildBatchExclusionGuard(FIXED_FIXTURE)
assert.equal(
  fixedErrors.length,
  0,
  `expected the fixed shape to raise no errors, got: ${JSON.stringify(fixedErrors)}`,
)

const partialErrors = checkAutoBuildBatchExclusionGuard(PARTIAL_FIX_FIXTURE)
assert.equal(
  partialErrors.length,
  1,
  'expected the partial-fix shape (batchAutoBuild left behind) to raise ' +
    `exactly 1 error, got ${partialErrors.length}: ${JSON.stringify(partialErrors)}`,
)
assert.ok(partialErrors[0]!.startsWith('batchAutoBuild()'))

const missingErrors = checkAutoBuildBatchExclusionGuard(MISSING_FIXTURE)
assert.equal(
  missingErrors.length,
  6,
  'expected 6 "function not found" violations when all five target ' +
    `functions are absent, got ${missingErrors.length}: ${JSON.stringify(missingErrors)}`,
)

console.log(
  'Model Builder auto-build/batch mutual-exclusion guard checker verified: ' +
    'flags a helper that only checks its own flag, flags autoBuildRun not ' +
    'calling the helper, flags a batch function missing its ' +
    'state.autoBuilding bail-out, clears the fixed shape, flags a partial ' +
    'fix that leaves one batch function behind, and flags all five target ' +
    'functions being absent.',
)
