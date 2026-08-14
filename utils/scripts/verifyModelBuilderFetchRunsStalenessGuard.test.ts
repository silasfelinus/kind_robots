// /utils/scripts/verifyModelBuilderFetchRunsStalenessGuard.test.ts
//
// Regression test for checkFetchRunsStalenessGuard() in
// verifyModelBuilderFetchRunsStalenessGuard.ts (model-builder/t-029).
// Exercises the real check against synthetic store-shaped fixtures covering:
// the pre-fix shape (no request ticket at all -- the exact gap found by
// manual read-through), the fixed shape (a monotonic ticket gating both the
// success and catch branches, plus the `finally`), a partially-fixed shape
// (ticket declared and captured, but only the success branch checks it --
// the catch branch can still apply a stale error), and fetchRuns being
// absent entirely.
import assert from 'node:assert/strict'

import { checkFetchRunsStalenessGuard } from './verifyModelBuilderFetchRunsStalenessGuard.js'

const BUGGY_FIXTURE = `
  async function fetchRuns(): Promise<void> {
    state.loadingRuns = true
    try {
      const response = await performFetch<ServerRun[]>(
        '/api/model-builder/runs?take=50',
      )
      if (response.success && Array.isArray(response.data)) {
        state.runs = response.data.map(adaptRun)
      } else if (!response.success) {
        setStatus('error', response.message || 'Failed to load run history.')
      }
    } catch (error) {
      handleError(error, 'loading run history')
    } finally {
      state.loadingRuns = false
    }
  }
`

const FIXED_FIXTURE = `
  let fetchRunsRequestId = 0

  async function fetchRuns(): Promise<void> {
    const requestId = ++fetchRunsRequestId
    state.loadingRuns = true
    try {
      const response = await performFetch<ServerRun[]>(
        '/api/model-builder/runs?take=50',
      )
      if (fetchRunsRequestId !== requestId) return
      if (response.success && Array.isArray(response.data)) {
        state.runs = response.data.map(adaptRun)
      } else if (!response.success) {
        setStatus('error', response.message || 'Failed to load run history.')
      }
    } catch (error) {
      if (fetchRunsRequestId !== requestId) return
      handleError(error, 'loading run history')
    } finally {
      if (fetchRunsRequestId === requestId) state.loadingRuns = false
    }
  }
`

const PARTIAL_FIXTURE = `
  let fetchRunsRequestId = 0

  async function fetchRuns(): Promise<void> {
    const requestId = ++fetchRunsRequestId
    state.loadingRuns = true
    try {
      const response = await performFetch<ServerRun[]>(
        '/api/model-builder/runs?take=50',
      )
      if (fetchRunsRequestId !== requestId) return
      if (response.success && Array.isArray(response.data)) {
        state.runs = response.data.map(adaptRun)
      } else if (!response.success) {
        setStatus('error', response.message || 'Failed to load run history.')
      }
    } catch (error) {
      handleError(error, 'loading run history')
    } finally {
      if (fetchRunsRequestId === requestId) state.loadingRuns = false
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

const buggyErrors = checkFetchRunsStalenessGuard(BUGGY_FIXTURE)
assert.ok(
  buggyErrors.some((e) => e.includes('fetchRunsRequestId = 0')),
  `expected the pre-fix shape to flag the missing request ticket, got: ${JSON.stringify(buggyErrors)}`,
)
assert.ok(
  buggyErrors.some((e) =>
    e.includes('checks `fetchRunsRequestId !== requestId` only 0 time(s)'),
  ),
  `expected the pre-fix shape to flag zero stale-response checks, got: ${JSON.stringify(buggyErrors)}`,
)

const fixedErrors = checkFetchRunsStalenessGuard(FIXED_FIXTURE)
assert.equal(
  fixedErrors.length,
  0,
  `expected the fixed shape to raise no errors, got: ${JSON.stringify(fixedErrors)}`,
)

const partialErrors = checkFetchRunsStalenessGuard(PARTIAL_FIXTURE)
assert.ok(
  partialErrors.some((e) => e.includes('only 1 time(s)')),
  `expected the partial fix (catch branch not scoped) to flag only 1 stale-response check, got: ${JSON.stringify(partialErrors)}`,
)

const missingFnErrors = checkFetchRunsStalenessGuard(MISSING_FIXTURE)
assert.ok(
  missingFnErrors.some((e) => e.includes('fetchRuns')),
  'expected a "function not found" violation when fetchRuns is absent',
)

console.log(
  'Model Builder fetchRuns staleness guard checker verified: flags the ' +
    'pre-fix shape (no request ticket), clears the fixed shape (ticket ' +
    'gating success/catch/finally), flags a partial fix (catch branch not ' +
    'scoped), and flags fetchRuns being absent entirely.',
)
