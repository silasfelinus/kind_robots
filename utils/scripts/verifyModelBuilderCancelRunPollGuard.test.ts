// /utils/scripts/verifyModelBuilderCancelRunPollGuard.test.ts
//
// Regression test for checkCancelRunPollGuard() in
// verifyModelBuilderCancelRunPollGuard.ts (model-builder/t-029). Exercises
// the real check against synthetic store-shaped fixtures covering: the
// pre-fix shape (`??` picks at most one of the state.runs / state.run
// copies of the cancelled run before nulling artJobId/queueState -- the
// exact bug found by an Explore-agent code trace), and the fixed shape
// (both copies are looked up independently and cleared).
import assert from 'node:assert/strict'

import { checkCancelRunPollGuard } from './verifyModelBuilderCancelRunPollGuard.js'

const BUGGY_FIXTURE = `
  async function cancelRun(runId: string): Promise<void> {
    try {
      const response = await performFetch(
        \`/api/model-builder/runs/\${runId}\`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'CANCELLED' }),
        },
      )
      if (!response.success) {
        setStatus('error', response.message || 'Failed to cancel run.')
        return
      }
      cancelledRunIds.add(runId)
      const cancelledRun =
        state.runs.find((entry) => entry.id === runId) ??
        (state.run?.id === runId ? state.run : null)
      cancelledRun?.items.forEach((item) => {
        item.artJobId = null
        item.queueState = null
      })
      state.runs = state.runs.filter((entry) => entry.id !== runId)
      if (state.run?.id === runId) resetRun()
      setStatus('success', 'Run cancelled.')
    } catch (error) {
      handleError(error, 'cancelling build run')
    }
  }
`

const FIXED_FIXTURE = `
  async function cancelRun(runId: string): Promise<void> {
    try {
      const response = await performFetch(
        \`/api/model-builder/runs/\${runId}\`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'CANCELLED' }),
        },
      )
      if (!response.success) {
        setStatus('error', response.message || 'Failed to cancel run.')
        return
      }
      cancelledRunIds.add(runId)
      const cancelledRuns = [
        state.runs.find((entry) => entry.id === runId),
        state.run?.id === runId ? state.run : null,
      ].filter((entry): entry is BuildRun => entry != null)
      cancelledRuns.forEach((run) => {
        run.items.forEach((item) => {
          item.artJobId = null
          item.queueState = null
        })
      })
      state.runs = state.runs.filter((entry) => entry.id !== runId)
      if (state.run?.id === runId) resetRun()
      setStatus('success', 'Run cancelled.')
    } catch (error) {
      handleError(error, 'cancelling build run')
    }
  }
`

function run(): void {
  const buggyErrors = checkCancelRunPollGuard(BUGGY_FIXTURE)
  assert.equal(
    buggyErrors.length,
    1,
    'expected the buggy fixture (?? picking a single copy) to fail exactly ' +
      `once, got: ${JSON.stringify(buggyErrors)}`,
  )
  assert.match(buggyErrors[0]!, /picks at most one/)

  const fixedErrors = checkCancelRunPollGuard(FIXED_FIXTURE)
  assert.deepEqual(
    fixedErrors,
    [],
    `expected the fixed fixture to pass, got: ${JSON.stringify(fixedErrors)}`,
  )

  const missingFnErrors = checkCancelRunPollGuard(
    'async function someOtherFunction(): Promise<void> {}',
  )
  assert.equal(
    missingFnErrors.length,
    1,
    'expected a fixture with no cancelRun() to fail with a "could not find" error',
  )
  assert.match(
    missingFnErrors[0]!,
    /Could not find an async function named cancelRun/,
  )

  console.log(
    'Model Builder cancel-run poll guard self-test passed: buggy fixture ' +
      'fails, fixed fixture passes, missing-function fixture fails clearly.',
  )
}

run()
