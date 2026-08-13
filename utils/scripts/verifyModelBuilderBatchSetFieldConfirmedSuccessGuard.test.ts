// /utils/scripts/verifyModelBuilderBatchSetFieldConfirmedSuccessGuard.test.ts
//
// Regression test for checkBatchSetFieldConfirmedSuccessGuard() in
// verifyModelBuilderBatchSetFieldConfirmedSuccessGuard.ts
// (model-builder/t-029). Exercises the real check against synthetic
// store-shaped fixtures covering: the pre-fix shape (sync function, fires
// batchPushItems(entries) without awaiting it, unconditional success toast
// right after) and the fixed shape (async function, awaits the real result,
// success toast gated on it).
import assert from 'node:assert/strict'

import { checkBatchSetFieldConfirmedSuccessGuard } from './verifyModelBuilderBatchSetFieldConfirmedSuccessGuard.js'

function fixture(opts: { async: boolean; body: string }): string {
  return `
  ${opts.async ? 'async ' : ''}function batchSetField(
    outputKey: string,
    fieldKey: string,
    value: string,
  ): ${opts.async ? 'Promise<void>' : 'void'} {
    const items = groupItems(outputKey)
    const entries: Array<{
      item: BuildItem
      payload: Record<string, unknown>
      meta?: { stage?: string; reason?: string }
    }> = []
    for (const item of items) {
      if (!isStageEditable(item, 'FIELDS_AND_PROMPTS')) continue
      const next = setFieldLine(item.fieldsDraft, fieldKey, value)
      if (next === item.fieldsDraft) continue
      item.fieldsDraft = next
      markDownstreamStale(item, 'FIELDS_AND_PROMPTS')
      entries.push({
        item,
        payload: { stageStatuses: item.stages, fieldsDraft: item.fieldsDraft },
        meta: { stage: 'FIELDS_AND_PROMPTS', reason: 'edited fields' },
      })
    }
    ${opts.body}
  }
`
}

const BUGGY = fixture({
  async: false,
  body: `batchPushItems(entries)
    setStatus(
      'success',
      \`Set \${fieldKey} on \${entries.length}/\${items.length} items.\`,
    )`,
})

const FIXED = fixture({
  async: true,
  body: `batchingOutputSingleton.claim(outputKey)
    try {
      const ok = await batchPushItems(entries)
      if (ok) {
        setStatus(
          'success',
          \`Set \${fieldKey} on \${entries.length}/\${items.length} items.\`,
        )
      }
    } finally {
      batchingOutputSingleton.release(outputKey)
    }`,
})

// Regressed: the function is async and does await batchPushItems elsewhere
// (satisfying that check), but the success toast still fires unconditionally
// right after a *second*, un-awaited fire-and-forget call -- e.g. a bad
// merge that left both an awaited call (for a different purpose) and the old
// un-awaited-plus-unconditional-toast shape in place.
const PARTIALLY_REGRESSED = fixture({
  async: true,
  body: `if (items.length > entries.length) {
      await batchPushItems(entries)
    }
    batchPushItems(entries)
    setStatus(
      'success',
      \`Set \${fieldKey} on \${entries.length}/\${items.length} items.\`,
    )`,
})

function run(): void {
  const buggyErrors = checkBatchSetFieldConfirmedSuccessGuard(BUGGY)
  assert.equal(
    buggyErrors.length,
    3,
    'expected the pre-fix fixture (sync, unawaited call, unconditional ' +
      `success) to fail three times, got: ${JSON.stringify(buggyErrors)}`,
  )
  assert.ok(buggyErrors.some((e) => /declared `async`/.test(e)))
  assert.ok(buggyErrors.some((e) => /no longer awaits/.test(e)))
  assert.ok(
    buggyErrors.some((e) => /without awaiting it and unconditionally/.test(e)),
  )

  const fixedErrors = checkBatchSetFieldConfirmedSuccessGuard(FIXED)
  assert.deepEqual(
    fixedErrors,
    [],
    `expected the fixed fixture to pass, got: ${JSON.stringify(fixedErrors)}`,
  )

  const regressedErrors =
    checkBatchSetFieldConfirmedSuccessGuard(PARTIALLY_REGRESSED)
  assert.equal(
    regressedErrors.length,
    1,
    'expected a fixture that awaits a call but still fires an unawaited ' +
      `fire-and-forget call with an unconditional toast to fail once, got: ${JSON.stringify(regressedErrors)}`,
  )
  assert.ok(/without awaiting it and unconditionally/.test(regressedErrors[0]!))

  const missingFnErrors = checkBatchSetFieldConfirmedSuccessGuard(
    'function someOtherFunction(): void {}',
  )
  assert.equal(missingFnErrors.length, 1)
  assert.ok(/Could not find a function named/.test(missingFnErrors[0]!))

  console.log(
    'Model Builder batchSetField confirmed-success guard self-test passed: ' +
      'buggy fixture fails, fixed fixture passes, a partially-regressed ' +
      'fixture fails, missing-function fixture fails clearly.',
  )
}

run()
