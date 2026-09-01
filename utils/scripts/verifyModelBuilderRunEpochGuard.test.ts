// /utils/scripts/verifyModelBuilderRunEpochGuard.test.ts
//
// Regression test for checkRunEpochGuard() in
// verifyModelBuilderRunEpochGuard.ts (model-builder/t-029, cycle 76).
// Exercises the real check against synthetic store-shaped fixtures covering:
// the fixed shape (runEpoch declared, every abandon site bumps it, every
// run/batch function captures and re-checks its own epoch), the pre-fix
// shape (no runEpoch at all), a partial fix that leaves one abandon site
// and one release function behind, and every target function missing.
import assert from 'node:assert/strict'

import { checkRunEpochGuard } from './verifyModelBuilderRunEpochGuard.js'

const FIXED_FIXTURE = `
  let runEpoch = 0

  async function autoBuildRun(): Promise<void> {
    const runId = state.run.id
    const epoch = runEpoch
    try {
      for (const item of items) {
        if (state.run?.id !== runId || runEpoch !== epoch) return
      }
    } finally {
      if (state.run?.id === runId && runEpoch === epoch) state.autoBuilding = false
    }
  }

  async function batchDraftField(outputKey: string): Promise<void> {
    const runId = state.run?.id
    const epoch = runEpoch
    try {
      // ...
    } finally {
      if (state.run?.id === runId && runEpoch === epoch)
        batchingOutputSingleton.release(outputKey)
    }
  }

  async function batchSetField(outputKey: string): Promise<void> {
    const runId = state.run?.id
    const epoch = runEpoch
    try {
      // ...
    } finally {
      if (state.run?.id === runId && runEpoch === epoch)
        batchingOutputSingleton.release(outputKey)
    }
  }

  async function batchApproveStage(outputKey: string): Promise<void> {
    const runId = state.run?.id
    const epoch = runEpoch
    try {
      // ...
    } finally {
      if (state.run?.id === runId && runEpoch === epoch)
        batchingOutputSingleton.release(outputKey)
    }
  }

  async function batchAutoBuild(outputKey: string): Promise<void> {
    const runId = state.run?.id
    const epoch = runEpoch
    try {
      for (const item of items) {
        if (state.run?.id !== runId || runEpoch !== epoch) return
      }
    } finally {
      if (state.run?.id === runId && runEpoch === epoch)
        batchingOutputSingleton.release(outputKey)
    }
  }

  async function openRun(runId: string): Promise<void> {
    if (cached) {
      runEpoch++
      state.run = cached
    }
    if (fetched) {
      runEpoch++
      state.run = adaptRun(response.data)
    }
  }

  async function resumeRun(): Promise<void> {
    if (differentRun) {
      runEpoch++
      state.run = adaptRun(data)
    }
  }

  function resetRun(): void {
    state.run = null
    runEpoch++
  }

  function resetAll(): void {
    state.run = null
    runEpoch++
  }
`

const BUGGY_FIXTURE = `
  async function autoBuildRun(): Promise<void> {
    const runId = state.run.id
    try {
      for (const item of items) {
        if (state.run?.id !== runId) return
      }
    } finally {
      if (state.run?.id === runId) state.autoBuilding = false
    }
  }

  async function batchDraftField(outputKey: string): Promise<void> {
    const runId = state.run?.id
    try {
      // ...
    } finally {
      if (state.run?.id === runId) batchingOutputSingleton.release(outputKey)
    }
  }

  async function batchSetField(outputKey: string): Promise<void> {
    const runId = state.run?.id
    try {
      // ...
    } finally {
      if (state.run?.id === runId) batchingOutputSingleton.release(outputKey)
    }
  }

  async function batchApproveStage(outputKey: string): Promise<void> {
    const runId = state.run?.id
    try {
      // ...
    } finally {
      if (state.run?.id === runId) batchingOutputSingleton.release(outputKey)
    }
  }

  async function batchAutoBuild(outputKey: string): Promise<void> {
    const runId = state.run?.id
    try {
      for (const item of items) {
        if (state.run?.id !== runId) return
      }
    } finally {
      if (state.run?.id === runId) batchingOutputSingleton.release(outputKey)
    }
  }

  async function openRun(runId: string): Promise<void> {
    if (cached) {
      state.run = cached
    }
    if (fetched) {
      state.run = adaptRun(response.data)
    }
  }

  async function resumeRun(): Promise<void> {
    if (differentRun) {
      state.run = adaptRun(data)
    }
  }

  function resetRun(): void {
    state.run = null
  }

  function resetAll(): void {
    state.run = null
  }
`

// Everything bumps/captures/checks runEpoch except: resetAll() never bumps
// it, and batchApproveStage()'s finally block clears without the epoch
// check.
const PARTIAL_FIX_FIXTURE = `
  let runEpoch = 0

  async function autoBuildRun(): Promise<void> {
    const runId = state.run.id
    const epoch = runEpoch
    try {
      for (const item of items) {
        if (state.run?.id !== runId || runEpoch !== epoch) return
      }
    } finally {
      if (state.run?.id === runId && runEpoch === epoch) state.autoBuilding = false
    }
  }

  async function batchDraftField(outputKey: string): Promise<void> {
    const runId = state.run?.id
    const epoch = runEpoch
    try {
      // ...
    } finally {
      if (state.run?.id === runId && runEpoch === epoch)
        batchingOutputSingleton.release(outputKey)
    }
  }

  async function batchSetField(outputKey: string): Promise<void> {
    const runId = state.run?.id
    const epoch = runEpoch
    try {
      // ...
    } finally {
      if (state.run?.id === runId && runEpoch === epoch)
        batchingOutputSingleton.release(outputKey)
    }
  }

  async function batchApproveStage(outputKey: string): Promise<void> {
    const runId = state.run?.id
    const epoch = runEpoch
    try {
      // ...
    } finally {
      if (state.run?.id === runId) batchingOutputSingleton.release(outputKey)
    }
  }

  async function batchAutoBuild(outputKey: string): Promise<void> {
    const runId = state.run?.id
    const epoch = runEpoch
    try {
      for (const item of items) {
        if (state.run?.id !== runId || runEpoch !== epoch) return
      }
    } finally {
      if (state.run?.id === runId && runEpoch === epoch)
        batchingOutputSingleton.release(outputKey)
    }
  }

  async function openRun(runId: string): Promise<void> {
    if (cached) {
      runEpoch++
      state.run = cached
    }
    if (fetched) {
      runEpoch++
      state.run = adaptRun(response.data)
    }
  }

  async function resumeRun(): Promise<void> {
    if (differentRun) {
      runEpoch++
      state.run = adaptRun(data)
    }
  }

  function resetRun(): void {
    state.run = null
    runEpoch++
  }

  function resetAll(): void {
    state.run = null
  }
`

const MISSING_FIXTURE = `
  function approveStage(itemId: string, stageKey: BuildStageKey): void {
    const item = findItem(itemId)
    if (!item) return
    item.stages[stageKey] = { status: 'approved' }
  }
`

const fixedErrors = checkRunEpochGuard(FIXED_FIXTURE)
assert.equal(
  fixedErrors.length,
  0,
  `expected the fixed shape to raise no errors, got: ${JSON.stringify(fixedErrors)}`,
)

const buggyErrors = checkRunEpochGuard(BUGGY_FIXTURE)
assert.ok(
  buggyErrors.some((e) => e.startsWith('Could not find `let runEpoch = 0`')),
  'expected a missing-declaration error when runEpoch is absent entirely',
)
for (const name of ['resetRun', 'resetAll', 'openRun', 'resumeRun']) {
  assert.ok(
    buggyErrors.some((e) => e.startsWith(`${name}() bumps runEpoch`)),
    `expected a bump-count error for ${name}()`,
  )
}
for (const name of [
  'autoBuildRun',
  'batchDraftField',
  'batchSetField',
  'batchApproveStage',
  'batchAutoBuild',
]) {
  assert.ok(
    buggyErrors.some((e) =>
      e.startsWith(`${name}() no longer captures \`const epoch = runEpoch\``),
    ),
    `expected an epoch-capture error for ${name}()`,
  )
}

const partialErrors = checkRunEpochGuard(PARTIAL_FIX_FIXTURE)
assert.equal(
  partialErrors.length,
  2,
  `expected the partial-fix shape to raise exactly 2 errors, got ` +
    `${partialErrors.length}: ${JSON.stringify(partialErrors)}`,
)
assert.ok(partialErrors.some((e) => e.startsWith('resetAll() bumps runEpoch')))
assert.ok(
  partialErrors.some((e) =>
    e.startsWith("batchApproveStage()'s finally block no longer checks"),
  ),
)

const missingErrors = checkRunEpochGuard(MISSING_FIXTURE)
// 1 declaration error + 4 abandon-function-missing + 5 release-function-missing.
assert.equal(
  missingErrors.length,
  10,
  `expected 10 violations when runEpoch and every target function are ` +
    `absent, got ${missingErrors.length}: ${JSON.stringify(missingErrors)}`,
)

console.log(
  'Model Builder run-epoch guard checker verified: flags a missing runEpoch ' +
    'declaration, missing bumps at abandon sites, missing epoch capture/' +
    'checks in the five run/batch functions, a partial fix that leaves one ' +
    'of each behind, and every target function being absent.',
)
