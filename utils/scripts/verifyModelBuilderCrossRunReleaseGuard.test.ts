// /utils/scripts/verifyModelBuilderCrossRunReleaseGuard.test.ts
//
// Regression test for checkCrossRunReleaseGuard() in
// verifyModelBuilderCrossRunReleaseGuard.ts (model-builder/t-029, cycle 75).
// Exercises the real check against synthetic store-shaped fixtures covering:
// the pre-fix shape (all five functions clear/release unconditionally in
// their finally block), the fixed shape (all five guarded on
// `state.run?.id === runId`), a partial fix that leaves one function behind,
// and all five target functions being absent entirely.
import assert from 'node:assert/strict'

import { checkCrossRunReleaseGuard } from './verifyModelBuilderCrossRunReleaseGuard.js'

const BUGGY_FIXTURE = `
  async function autoBuildRun(): Promise<void> {
    if (!state.run || isRunOperationInFlight()) return
    state.autoBuilding = true
    const runId = state.run.id
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
    const runId = state.run?.id
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
    const runId = state.run?.id
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
    const runId = state.run?.id
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
    const runId = state.run?.id
    batchingOutputSingleton.claim(outputKey)
    try {
      // ...
    } finally {
      batchingOutputSingleton.release(outputKey)
    }
  }
`

const FIXED_FIXTURE = `
  async function autoBuildRun(): Promise<void> {
    if (!state.run || isRunOperationInFlight()) return
    state.autoBuilding = true
    const runId = state.run.id
    try {
      // ...
    } finally {
      if (state.run?.id === runId) state.autoBuilding = false
    }
  }

  async function batchDraftField(
    outputKey: string,
    field: DraftField,
  ): Promise<void> {
    const items = groupItems(outputKey)
    if (!items.length) return
    if (state.autoBuilding) return
    const runId = state.run?.id
    batchingOutputSingleton.claim(outputKey)
    try {
      // ...
    } finally {
      if (state.run?.id === runId) batchingOutputSingleton.release(outputKey)
    }
  }

  async function batchSetField(
    outputKey: string,
    fieldKey: string,
    value: string,
  ): Promise<void> {
    if (state.autoBuilding) return
    const runId = state.run?.id
    batchingOutputSingleton.claim(outputKey)
    try {
      // ...
    } finally {
      if (state.run?.id === runId) batchingOutputSingleton.release(outputKey)
    }
  }

  async function batchApproveStage(
    outputKey: string,
    stageKey: BuildStageKey,
  ): Promise<void> {
    if (state.autoBuilding) return
    const runId = state.run?.id
    batchingOutputSingleton.claim(outputKey)
    try {
      // ...
    } finally {
      if (state.run?.id === runId) batchingOutputSingleton.release(outputKey)
    }
  }

  async function batchAutoBuild(outputKey: string): Promise<void> {
    const items = groupItems(outputKey)
    if (!items.length) return
    if (state.autoBuilding) return
    const runId = state.run?.id
    batchingOutputSingleton.claim(outputKey)
    try {
      // ...
    } finally {
      if (state.run?.id === runId) batchingOutputSingleton.release(outputKey)
    }
  }
`

const PARTIAL_FIX_FIXTURE = `
  async function autoBuildRun(): Promise<void> {
    if (!state.run || isRunOperationInFlight()) return
    state.autoBuilding = true
    const runId = state.run.id
    try {
      // ...
    } finally {
      if (state.run?.id === runId) state.autoBuilding = false
    }
  }

  async function batchDraftField(
    outputKey: string,
    field: DraftField,
  ): Promise<void> {
    const items = groupItems(outputKey)
    if (!items.length) return
    if (state.autoBuilding) return
    const runId = state.run?.id
    batchingOutputSingleton.claim(outputKey)
    try {
      // ...
    } finally {
      if (state.run?.id === runId) batchingOutputSingleton.release(outputKey)
    }
  }

  async function batchSetField(
    outputKey: string,
    fieldKey: string,
    value: string,
  ): Promise<void> {
    if (state.autoBuilding) return
    const runId = state.run?.id
    batchingOutputSingleton.claim(outputKey)
    try {
      // ...
    } finally {
      if (state.run?.id === runId) batchingOutputSingleton.release(outputKey)
    }
  }

  async function batchApproveStage(
    outputKey: string,
    stageKey: BuildStageKey,
  ): Promise<void> {
    if (state.autoBuilding) return
    const runId = state.run?.id
    batchingOutputSingleton.claim(outputKey)
    try {
      // ...
    } finally {
      if (state.run?.id === runId) batchingOutputSingleton.release(outputKey)
    }
  }

  async function batchAutoBuild(outputKey: string): Promise<void> {
    const items = groupItems(outputKey)
    if (!items.length) return
    if (state.autoBuilding) return
    const runId = state.run?.id
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

const buggyErrors = checkCrossRunReleaseGuard(BUGGY_FIXTURE)
assert.equal(
  buggyErrors.length,
  5,
  `expected the pre-fix shape to raise exactly 5 violations (one per ` +
    `unguarded function), got ${buggyErrors.length}: ${JSON.stringify(buggyErrors)}`,
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
    `expected an error for ${name}() releasing without the runId guard`,
  )
}

const fixedErrors = checkCrossRunReleaseGuard(FIXED_FIXTURE)
assert.equal(
  fixedErrors.length,
  0,
  `expected the fixed shape to raise no errors, got: ${JSON.stringify(fixedErrors)}`,
)

const partialErrors = checkCrossRunReleaseGuard(PARTIAL_FIX_FIXTURE)
assert.equal(
  partialErrors.length,
  1,
  'expected the partial-fix shape (batchAutoBuild left unguarded) to raise ' +
    `exactly 1 error, got ${partialErrors.length}: ${JSON.stringify(partialErrors)}`,
)
assert.ok(partialErrors[0]!.startsWith('batchAutoBuild()'))

const missingErrors = checkCrossRunReleaseGuard(MISSING_FIXTURE)
assert.equal(
  missingErrors.length,
  5,
  'expected 5 "function not found" violations when all five target ' +
    `functions are absent, got ${missingErrors.length}: ${JSON.stringify(missingErrors)}`,
)

console.log(
  'Model Builder cross-run release guard checker verified: flags all five ' +
    'functions clearing/releasing their in-flight flag unconditionally, ' +
    'clears the fixed shape, flags a partial fix that leaves one function ' +
    'behind, and flags all five target functions being absent.',
)
