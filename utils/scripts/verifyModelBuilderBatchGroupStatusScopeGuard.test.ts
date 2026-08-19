// /utils/scripts/verifyModelBuilderBatchGroupStatusScopeGuard.test.ts
//
// Regression test for checkBatchGroupStatusScopeGuard() in
// verifyModelBuilderBatchGroupStatusScopeGuard.ts (model-builder/t-029
// cycle 13). Exercises the real check against synthetic store-shaped
// fixtures covering: the pre-fix shape (no captured runId, a bare
// setStatus() completion toast) and the fixed shape (runId captured up
// front, routed through setStatusForRun(runId, ...)) for each of the four
// batch-group functions -- plus batchAutoBuild's own extra "wrapped in an
// explicit state.run?.id === runId guard" shape, mirroring autoBuildRun.
import assert from 'node:assert/strict'

import { checkBatchGroupStatusScopeGuard } from './verifyModelBuilderBatchGroupStatusScopeGuard.js'

function simpleFixture(name: string, buggy: boolean): string {
  const runIdLine = buggy ? '' : 'const runId = state.run?.id'
  const completion = buggy
    ? "setStatus('success', 'done')"
    : "if (runId) { setStatusForRun(runId, 'success', 'done') }"
  return `
  async function ${name}(outputKey: string): Promise<void> {
    const items = groupItems(outputKey)
    if (!items.length) return
    ${runIdLine}
    batchingOutputSingleton.claim(outputKey)
    try {
      const { ok } = await batchPushItems([])
      if (ok) {
        ${completion}
      }
    } finally {
      batchingOutputSingleton.release(outputKey)
    }
  }
`
}

function autoBuildFixture(buggy: boolean): string {
  const runIdLine = buggy ? '' : 'const runId = state.run?.id'
  const completion = buggy
    ? "setStatus('success', 'done')"
    : "if (state.run?.id === runId) {\n        setStatus('success', 'done')\n      }"
  return `
  async function batchAutoBuild(outputKey: string): Promise<void> {
    const items = groupItems(outputKey)
    if (!items.length) return
    ${runIdLine}
    batchingOutputSingleton.claim(outputKey)
    try {
      for (const item of items) {
        if (state.run?.id !== runId) return
        const outcome = await autoBuildItem(item.id)
      }
      ${completion}
    } finally {
      batchingOutputSingleton.release(outputKey)
    }
  }
`
}

const BUGGY = [
  simpleFixture('batchDraftField', true),
  simpleFixture('batchSetField', true),
  simpleFixture('batchApproveStage', true),
  autoBuildFixture(true),
].join('\n')

const FIXED = [
  simpleFixture('batchDraftField', false),
  simpleFixture('batchSetField', false),
  simpleFixture('batchApproveStage', false),
  autoBuildFixture(false),
].join('\n')

function run(): void {
  const buggyErrors = checkBatchGroupStatusScopeGuard(BUGGY)
  // Each of the 4 functions should fail twice: no runId capture, and a bare
  // unscoped setStatus().
  assert.equal(
    buggyErrors.length,
    8,
    `expected the pre-fix fixture (4 functions x 2 problems each) to fail ` +
      `8 times, got: ${JSON.stringify(buggyErrors)}`,
  )
  assert.ok(buggyErrors.some((e) => /batchDraftField.*capture/.test(e)))
  assert.ok(buggyErrors.some((e) => /batchSetField.*capture/.test(e)))
  assert.ok(buggyErrors.some((e) => /batchApproveStage.*capture/.test(e)))
  assert.ok(buggyErrors.some((e) => /batchAutoBuild.*capture/.test(e)))
  assert.ok(buggyErrors.some((e) => /batchDraftField.*1 time\(s\)/.test(e)))
  assert.ok(buggyErrors.some((e) => /batchAutoBuild.*1 time\(s\)/.test(e)))

  const fixedErrors = checkBatchGroupStatusScopeGuard(FIXED)
  assert.deepEqual(
    fixedErrors,
    [],
    `expected the fixed fixture to pass, got: ${JSON.stringify(fixedErrors)}`,
  )

  // Regressed: runId captured everywhere, but batchSetField's own
  // completion call site reverted to the bare setStatus().
  const partiallyRegressed = [
    simpleFixture('batchDraftField', false),
    simpleFixture('batchSetField', true).replace(
      // put back the runId capture that simpleFixture(name, true) omits,
      // while keeping the buggy bare setStatus() completion call.
      'const items = groupItems(outputKey)\n    if (!items.length) return\n    ',
      'const items = groupItems(outputKey)\n    if (!items.length) return\n    const runId = state.run?.id\n    ',
    ),
    simpleFixture('batchApproveStage', false),
    autoBuildFixture(false),
  ].join('\n')
  const regressedErrors = checkBatchGroupStatusScopeGuard(partiallyRegressed)
  assert.equal(
    regressedErrors.length,
    1,
    'expected only batchSetField to fail (bare setStatus, runId present) ' +
      `got: ${JSON.stringify(regressedErrors)}`,
  )
  assert.ok(/batchSetField/.test(regressedErrors[0]!))
  assert.ok(/1 time\(s\)/.test(regressedErrors[0]!))

  const missingFnErrors = checkBatchGroupStatusScopeGuard(
    'function someOtherFunction(): void {}',
  )
  assert.equal(missingFnErrors.length, 4)
  for (const error of missingFnErrors) {
    assert.ok(/Could not find a function named/.test(error))
  }

  console.log(
    'Model Builder batch-group status-scope guard self-test passed: buggy ' +
      'fixture fails for all four functions, fixed fixture passes, a ' +
      'partially-regressed fixture fails only for the regressed function, ' +
      'missing-function fixture fails clearly for all four.',
  )
}

run()
