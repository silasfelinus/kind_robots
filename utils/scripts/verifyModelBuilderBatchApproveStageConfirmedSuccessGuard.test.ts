// /utils/scripts/verifyModelBuilderBatchApproveStageConfirmedSuccessGuard.test.ts
//
// Regression test for checkBatchApproveStageConfirmedSuccessGuard() in
// verifyModelBuilderBatchApproveStageConfirmedSuccessGuard.ts
// (model-builder/t-029). Exercises the real check against synthetic
// store-shaped fixtures covering: the original pre-fix shape (sync
// function, loops a bare un-awaited approveStage(...) call, unconditional
// success toast), a batchSetField-style pre-fix shape (fires
// batchPushItems(entries) without awaiting it), and the fixed shape (async
// function, collects entries, awaits the real result, success toast gated
// on it).
import assert from 'node:assert/strict'

import { checkBatchApproveStageConfirmedSuccessGuard } from './verifyModelBuilderBatchApproveStageConfirmedSuccessGuard.js'

const ORIGINAL_BUGGY = `
  function batchApproveStage(outputKey: string, stageKey: BuildStageKey): void {
    let approved = 0
    for (const item of groupItems(outputKey)) {
      if (item.stages[stageKey].status === 'locked') continue
      approveStage(item.id, stageKey)
      approved++
    }
    setStatus('success', \`Approved \${stageKey} for \${approved} items.\`)
  }
`

const UNAWAITED_BATCH_PUSH_BUGGY = `
  function batchApproveStage(
    outputKey: string,
    stageKey: BuildStageKey,
  ): void {
    const entries: Array<{
      item: BuildItem
      payload: Record<string, unknown>
      meta?: { stage?: string; reason?: string }
    }> = []
    for (const item of groupItems(outputKey)) {
      if (item.stages[stageKey].status === 'locked') continue
      item.stages[stageKey] = { status: 'approved' }
      entries.push({
        item,
        payload: { stageStatuses: item.stages },
        meta: { stage: stageKey },
      })
    }
    batchPushItems(entries)
    setStatus(
      'success',
      \`Approved \${stageKey} for \${entries.length} items.\`,
    )
  }
`

const FIXED = `
  async function batchApproveStage(
    outputKey: string,
    stageKey: BuildStageKey,
  ): Promise<void> {
    const entries: Array<{
      item: BuildItem
      payload: Record<string, unknown>
      meta?: { stage?: string; reason?: string }
    }> = []
    for (const item of groupItems(outputKey)) {
      if (item.stages[stageKey].status === 'locked') continue
      item.stages[stageKey] = { status: 'approved' }
      const next = BUILD_STAGES[stageIndex(stageKey) + 1]
      if (next && item.stages[next.key].status === 'locked') {
        item.stages[next.key] = { status: 'ready' }
      }
      entries.push({
        item,
        payload: { stageStatuses: item.stages },
        meta: { stage: stageKey },
      })
    }
    batchingOutputSingleton.claim(outputKey)
    try {
      const ok = await batchPushItems(entries)
      if (ok) {
        setStatus(
          'success',
          \`Approved \${stageKey} for \${entries.length} items.\`,
        )
      }
    } finally {
      batchingOutputSingleton.release(outputKey)
    }
  }
`

function run(): void {
  const originalBuggyErrors =
    checkBatchApproveStageConfirmedSuccessGuard(ORIGINAL_BUGGY)
  assert.equal(
    originalBuggyErrors.length,
    3,
    'expected the original pre-fix fixture (sync, looped bare ' +
      `approveStage(...), unconditional success) to fail three times, got: ${JSON.stringify(originalBuggyErrors)}`,
  )
  assert.ok(originalBuggyErrors.some((e) => /declared `async`/.test(e)))
  assert.ok(originalBuggyErrors.some((e) => /no longer awaits/.test(e)))
  assert.ok(
    originalBuggyErrors.some((e) =>
      /regressed to the original pre-fix shape/.test(e),
    ),
  )

  const unawaitedBatchPushErrors = checkBatchApproveStageConfirmedSuccessGuard(
    UNAWAITED_BATCH_PUSH_BUGGY,
  )
  assert.equal(
    unawaitedBatchPushErrors.length,
    3,
    'expected the batchSetField-style pre-fix fixture (sync, unawaited ' +
      `batchPushItems call, unconditional success) to fail three times, got: ${JSON.stringify(unawaitedBatchPushErrors)}`,
  )
  assert.ok(unawaitedBatchPushErrors.some((e) => /declared `async`/.test(e)))
  assert.ok(unawaitedBatchPushErrors.some((e) => /no longer awaits/.test(e)))
  assert.ok(
    unawaitedBatchPushErrors.some((e) =>
      /without awaiting it and unconditionally/.test(e),
    ),
  )

  const fixedErrors = checkBatchApproveStageConfirmedSuccessGuard(FIXED)
  assert.deepEqual(
    fixedErrors,
    [],
    `expected the fixed fixture to pass, got: ${JSON.stringify(fixedErrors)}`,
  )

  const missingFnErrors = checkBatchApproveStageConfirmedSuccessGuard(
    'function someOtherFunction(): void {}',
  )
  assert.equal(missingFnErrors.length, 1)
  assert.ok(/Could not find a function named/.test(missingFnErrors[0]!))

  console.log(
    'Model Builder batchApproveStage confirmed-success guard self-test ' +
      'passed: both pre-fix fixture shapes fail with the right errors, the ' +
      'fixed fixture passes, missing-function fixture fails clearly.',
  )
}

run()
