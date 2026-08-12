// /utils/scripts/verifyModelBuilderPushItemErrorScopeGuard.test.ts
//
// Regression test for checkPushItemErrorScopeGuard() in
// verifyModelBuilderPushItemErrorScopeGuard.ts (model-builder/t-041).
// Exercises the real check against synthetic store-shaped fixtures covering:
// the pre-fix shape (`.catch((error) => handleError(...))`, unconditional),
// and the fixed shape (catch block gated on `if (runId)`, routed through
// setStatusForRun instead of handleError).
import assert from 'node:assert/strict'

import { checkPushItemErrorScopeGuard } from './verifyModelBuilderPushItemErrorScopeGuard.js'

function fixture(catchBody: string): string {
  return `
  function pushItem(
    item: BuildItem,
    payload: Record<string, unknown>,
    meta?: { stage?: string; reason?: string },
  ): void {
    const runId = state.run?.id
    performFetch(\`/api/model-builder/items/\${item.id}\`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...payload, ...meta }),
    })
      .then((response) => {
        if (!response.success && runId) {
          setStatusForRun(
            runId,
            'error',
            response.message || 'Failed to save changes.',
          )
        }
      })
      ${catchBody}
  }

  function batchPushItems(
    entries: Array<{
      item: BuildItem
      payload: Record<string, unknown>
      meta?: { stage?: string; reason?: string }
    }>,
  ): void {
    if (!entries.length) return
    const runId = state.run?.id
    performFetch('/api/model-builder/items/batch', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        items: entries.map(({ item, payload, meta }) => ({
          id: item.id,
          ...payload,
          ...meta,
        })),
      }),
    })
      .then((response) => {
        if (!response.success && runId) {
          setStatusForRun(
            runId,
            'error',
            response.message || 'Failed to save changes.',
          )
        }
      })
      ${catchBody}
  }
`
}

const BUGGY_CATCH = ".catch((error) => handleError(error, 'saving build item'))"

const FIXED_CATCH = `.catch((error) => {
        if (runId) {
          setStatusForRun(
            runId,
            'error',
            error instanceof Error
              ? error.message
              : 'Failed to save changes.',
          )
        }
      })`

const REGRESSED_CATCH = `.catch((error) => {
        if (runId) {
          setStatusForRun(runId, 'error', 'Failed to save changes.')
        }
        handleError(error, 'saving build item')
      })`

const UNGATED_CATCH = `.catch((error) => {
        setStatusForRun(runId, 'error', 'Failed to save changes.')
      })`

function run(): void {
  const buggyErrors = checkPushItemErrorScopeGuard(fixture(BUGGY_CATCH))
  assert.equal(
    buggyErrors.length,
    2,
    'expected the buggy fixture (single-expression catch calling ' +
      'handleError unconditionally, no block for either function) to fail ' +
      `once per function, got: ${JSON.stringify(buggyErrors)}`,
  )
  assert.ok(buggyErrors.every((e) => /no longer has a/.test(e)))

  const fixedErrors = checkPushItemErrorScopeGuard(fixture(FIXED_CATCH))
  assert.deepEqual(
    fixedErrors,
    [],
    `expected the fixed fixture to pass, got: ${JSON.stringify(fixedErrors)}`,
  )

  const regressedErrors = checkPushItemErrorScopeGuard(fixture(REGRESSED_CATCH))
  assert.equal(
    regressedErrors.length,
    2,
    'expected a fixture that gates setStatusForRun but ALSO still calls ' +
      `handleError() unconditionally to fail once per function, got: ${JSON.stringify(regressedErrors)}`,
  )
  assert.ok(regressedErrors.every((e) => /handleError\(\) again/.test(e)))

  const ungatedErrors = checkPushItemErrorScopeGuard(fixture(UNGATED_CATCH))
  assert.equal(
    ungatedErrors.length,
    2,
    'expected a fixture that drops the `if (runId)` gate to fail once per ' +
      `function, got: ${JSON.stringify(ungatedErrors)}`,
  )
  assert.ok(ungatedErrors.every((e) => /gates on `if \(runId\)`/.test(e)))

  const missingFnErrors = checkPushItemErrorScopeGuard(
    'function someOtherFunction(): void {}',
  )
  assert.equal(
    missingFnErrors.length,
    2,
    'expected a fixture with neither pushItem() nor batchPushItems() to ' +
      'fail with two "could not find" errors',
  )
  assert.ok(
    missingFnErrors.every((e) => /Could not find a function named/.test(e)),
  )

  console.log(
    'Model Builder pushItem/batchPushItems error-scope guard self-test ' +
      'passed: buggy fixture fails, fixed fixture passes, a regressed ' +
      '(handleError re-added) fixture fails, an ungated fixture fails, ' +
      'missing-function fixture fails clearly.',
  )
}

run()
