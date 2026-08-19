// /utils/scripts/verifyModelBuilderBatchPartialFailureRevertGuard.test.ts
//
// Regression test for checkBatchPartialFailureRevertGuard() in
// verifyModelBuilderBatchPartialFailureRevertGuard.ts (model-builder/t-029
// cycle 9). Exercises the real check against synthetic store-shaped
// fixtures covering: the pre-fix shape (batchPushItems returns a bare
// boolean, neither caller can tell which entries a partial failure
// rejected or revert them), the fixed shape (batchPushItems returns
// `{ ok, failedIds }`, both callers destructure it and revert the rejected
// entries), and a partially-regressed shape (only one of the two callers
// still reverts).
import assert from 'node:assert/strict'

import { checkBatchPartialFailureRevertGuard } from './verifyModelBuilderBatchPartialFailureRevertGuard.js'

function batchPushItemsFixture(returnsFailedIds: boolean): string {
  return returnsFailedIds
    ? `
  function batchPushItems(
    entries: Array<{ item: BuildItem; payload: Record<string, unknown> }>,
  ): Promise<BatchPushOutcome> {
    return performFetch('/api/model-builder/items/batch', {})
      .then((response) => {
        if (response.success) return { ok: true, failedIds: new Set() }
        const failedIds = new Set<string>()
        return { ok: false, failedIds }
      })
  }
`
    : `
  function batchPushItems(
    entries: Array<{ item: BuildItem; payload: Record<string, unknown> }>,
  ): Promise<boolean> {
    return performFetch('/api/model-builder/items/batch', {})
      .then((response) => response.success)
  }
`
}

function callerFixture(opts: { name: string; reverts: boolean }): string {
  const body = opts.reverts
    ? `const { ok, failedIds } = await batchPushItems(entries)
    if (ok) {
      setStatus('success', 'done')
    } else if (failedIds.size) {
      for (const entry of entries) {
        if (!failedIds.has(entry.item.id)) continue
        const previous = previousByItem.get(entry.item.id)
        if (previous) entry.item.stages = previous
      }
    }`
    : `const ok = await batchPushItems(entries)
    if (ok) {
      setStatus('success', 'done')
    }`
  return `
  async function ${opts.name}(outputKey: string): Promise<void> {
    const entries: Array<{ item: BuildItem; payload: Record<string, unknown> }> = []
    ${body}
  }
`
}

const BUGGY = [
  batchPushItemsFixture(false),
  callerFixture({ name: 'batchApproveStage', reverts: false }),
  callerFixture({ name: 'batchSetField', reverts: false }),
].join('\n')

const FIXED = [
  batchPushItemsFixture(true),
  callerFixture({ name: 'batchApproveStage', reverts: true }),
  callerFixture({ name: 'batchSetField', reverts: true }),
].join('\n')

// Regressed: batchPushItems still reports failedIds and batchApproveStage
// still reverts using it, but batchSetField was edited back to the old
// bare-boolean, no-revert shape (e.g. a bad merge that only carried the fix
// forward for one of the two callers).
const PARTIALLY_REGRESSED = [
  batchPushItemsFixture(true),
  callerFixture({ name: 'batchApproveStage', reverts: true }),
  callerFixture({ name: 'batchSetField', reverts: false }),
].join('\n')

function run(): void {
  const buggyErrors = checkBatchPartialFailureRevertGuard(BUGGY)
  assert.equal(
    buggyErrors.length,
    5,
    'expected the pre-fix fixture (no failedIds anywhere, neither caller ' +
      `reverts) to fail five times, got: ${JSON.stringify(buggyErrors)}`,
  )
  assert.ok(
    buggyErrors.some((e) => /no longer computes\/returns failedIds/.test(e)),
  )
  assert.ok(
    buggyErrors.filter((e) => /no longer destructures/.test(e)).length === 2,
  )
  assert.ok(
    buggyErrors.filter((e) => /no longer checks `failedIds\.has/.test(e))
      .length === 2,
  )

  const fixedErrors = checkBatchPartialFailureRevertGuard(FIXED)
  assert.deepEqual(
    fixedErrors,
    [],
    `expected the fixed fixture to pass, got: ${JSON.stringify(fixedErrors)}`,
  )

  const regressedErrors = checkBatchPartialFailureRevertGuard(
    PARTIALLY_REGRESSED,
  )
  assert.equal(
    regressedErrors.length,
    2,
    'expected a fixture where only batchSetField regressed to fail exactly ' +
      `twice (destructure + revert-check), got: ${JSON.stringify(regressedErrors)}`,
  )
  assert.ok(regressedErrors.every((e) => e.startsWith('batchSetField()')))

  const missingFnErrors = checkBatchPartialFailureRevertGuard(
    'function someOtherFunction(): void {}',
  )
  assert.equal(missingFnErrors.length, 3)
  assert.ok(
    missingFnErrors.every((e) => /Could not find a function named/.test(e)),
  )

  console.log(
    'Model Builder batch partial-failure revert guard self-test passed: ' +
      'buggy fixture fails, fixed fixture passes, a partially-regressed ' +
      'fixture fails only for the still-broken caller, missing-function ' +
      'fixture fails clearly.',
  )
}

run()
