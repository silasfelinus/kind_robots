// /utils/scripts/verifyModelBuilderDraftStatusScopeGuard.test.ts
//
// Regression test for checkDraftStatusScopeGuard() in
// verifyModelBuilderDraftStatusScopeGuard.ts (model-builder/t-029).
// Exercises the real check against synthetic store-shaped fixtures covering:
// the pre-fix shape (no captured runId, all four status messages routed
// through the bare, unscoped setStatus()), and the fixed shape (runId
// captured up front, every message routed through
// setStatusForRun(runId, ...)).
import assert from 'node:assert/strict'

import { checkDraftStatusScopeGuard } from './verifyModelBuilderDraftStatusScopeGuard.js'

function fixture(opts: {
  captureRunId: boolean
  editedCall: string
  approvedCall: string
  successCall: string
  catchCall: string
}): string {
  return `
  async function draftText(
    itemId: string,
    field: DraftField,
    instruction?: string,
  ): Promise<boolean> {
    const item = findItem(itemId)
    if (!item || !state.run) return false

    ${opts.captureRunId ? 'const runId = state.run.id' : ''}

    const current = field === 'pitch' ? item.pitch : item.fieldsDraft

    const draftKey = { itemId, field }
    draftingFieldSingleton.claim(draftKey)
    clearStatus()

    try {
      const result = await performFetch('/api/suggest', {}, 2, 60_000)

      if (!result.success || !result.data?.value) {
        throw new Error(result.message || 'The model returned nothing useful.')
      }

      const value = result.data.value.trim()

      const liveValue = field === 'pitch' ? item.pitch : item.fieldsDraft
      if (liveValue !== current) {
        ${opts.editedCall}
        return false
      }

      if (!isStageEditable(item, stageForDraftField(field))) {
        ${opts.approvedCall}
        return false
      }

      if (field === 'pitch') updatePitch(itemId, value)
      else if (field === 'fields') updateFields(itemId, value)
      else updatePrompt(itemId, value)

      ${opts.successCall}
      return true
    } catch (error) {
      handleError(error, 'drafting model builder text')
      const message = error instanceof Error ? error.message : 'Draft request failed.'
      ${opts.catchCall}
      return false
    } finally {
      draftingFieldSingleton.release(draftKey)
    }
  }
`
}

const BUGGY = fixture({
  captureRunId: false,
  editedCall: "setStatus('error', 'edited while drafting')",
  approvedCall: "setStatus('error', 'approved while drafting')",
  successCall: "setStatus('success', 'Drafted ' + field)",
  catchCall: "setStatus('error', message)",
})

const FIXED = fixture({
  captureRunId: true,
  editedCall: "setStatusForRun(runId, 'error', 'edited while drafting')",
  approvedCall: "setStatusForRun(runId, 'error', 'approved while drafting')",
  successCall: "setStatusForRun(runId, 'success', 'Drafted ' + field)",
  catchCall: "setStatusForRun(runId, 'error', message)",
})

// Regressed: runId is captured (so that check passes) but one call site
// (the success path) was reverted back to the bare setStatus().
const PARTIALLY_REGRESSED = fixture({
  captureRunId: true,
  editedCall: "setStatusForRun(runId, 'error', 'edited while drafting')",
  approvedCall: "setStatusForRun(runId, 'error', 'approved while drafting')",
  successCall: "setStatus('success', 'Drafted ' + field)",
  catchCall: "setStatusForRun(runId, 'error', message)",
})

function run(): void {
  const buggyErrors = checkDraftStatusScopeGuard(BUGGY)
  assert.equal(
    buggyErrors.length,
    2,
    `expected the pre-fix fixture (no runId, all four calls bare) to fail ` +
      `twice, got: ${JSON.stringify(buggyErrors)}`,
  )
  assert.ok(buggyErrors.some((e) => /capture/.test(e)))
  assert.ok(buggyErrors.some((e) => /4 time\(s\)/.test(e)))

  const fixedErrors = checkDraftStatusScopeGuard(FIXED)
  assert.deepEqual(
    fixedErrors,
    [],
    `expected the fixed fixture to pass, got: ${JSON.stringify(fixedErrors)}`,
  )

  const regressedErrors = checkDraftStatusScopeGuard(PARTIALLY_REGRESSED)
  assert.equal(
    regressedErrors.length,
    1,
    'expected a fixture with runId captured but one call site reverted to ' +
      `bare setStatus() to fail once, got: ${JSON.stringify(regressedErrors)}`,
  )
  assert.ok(/1 time\(s\)/.test(regressedErrors[0]!))

  const missingFnErrors = checkDraftStatusScopeGuard(
    'function someOtherFunction(): void {}',
  )
  assert.equal(missingFnErrors.length, 1)
  assert.ok(/Could not find a function named/.test(missingFnErrors[0]!))

  console.log(
    'Model Builder draftText status-scope guard self-test passed: buggy ' +
      'fixture fails, fixed fixture passes, a partially-regressed fixture ' +
      'fails, missing-function fixture fails clearly.',
  )
}

run()
