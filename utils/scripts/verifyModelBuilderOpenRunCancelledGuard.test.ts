// /utils/scripts/verifyModelBuilderOpenRunCancelledGuard.test.ts
//
// Regression test for checkOpenRunCancelledGuard() in
// verifyModelBuilderOpenRunCancelledGuard.ts (model-builder/t-029 cycle 32).
// Exercises the real check against synthetic store-shaped fixtures covering:
// the pre-fix shape (cached branch opens any cached run regardless of
// status, fetch fallback adopts any successful response regardless of
// status -- the exact bug found by manual read-through), and the fixed
// shape (both paths check status and the fetch fallback drops a stale
// state.runs entry when the fetched run turns out CANCELLED).
import assert from 'node:assert/strict'

import { checkOpenRunCancelledGuard } from './verifyModelBuilderOpenRunCancelledGuard.js'

const BUGGY_FIXTURE = `
  async function openRun(runId: string): Promise<void> {
    const requestId = ++openRunRequestId

    if (state.run?.id === runId) {
      state.step = 'run'
      return
    }

    const cached = state.runs.find((entry) => entry.id === runId)
    if (cached) {
      state.run = cached
      state.sourceType = cached.sourceType
      state.recipeKey = cached.recipeKey
      state.selectedSource = null
      state.selections = {}
      state.step = 'run'
      setActiveRunId(Number(runId))
      return
    }

    try {
      const response = await performFetch<ServerRun>(
        \`/api/model-builder/runs/\${runId}\`,
      )
      if (openRunRequestId !== requestId) return
      if (response.success && response.data) {
        state.run = adaptRun(response.data)
        state.sourceType = state.run.sourceType
        state.recipeKey = state.run.recipeKey
        state.selectedSource = null
        state.selections = {}
        state.step = 'run'
        setActiveRunId(response.data.id)
      } else if (!response.success) {
        setStatus('error', response.message || 'Failed to open run.')
      }
    } catch (error) {
      if (openRunRequestId !== requestId) return
      handleError(error, 'opening build run')
    }
  }
`

const FIXED_FIXTURE = `
  async function openRun(runId: string): Promise<void> {
    const requestId = ++openRunRequestId

    if (state.run?.id === runId) {
      state.step = 'run'
      return
    }

    const cached = state.runs.find((entry) => entry.id === runId)
    if (cached && cached.status !== 'CANCELLED') {
      state.run = cached
      state.sourceType = cached.sourceType
      state.recipeKey = cached.recipeKey
      state.selectedSource = null
      state.selections = {}
      state.step = 'run'
      setActiveRunId(Number(runId))
      return
    }

    try {
      const response = await performFetch<ServerRun>(
        \`/api/model-builder/runs/\${runId}\`,
      )
      if (openRunRequestId !== requestId) return
      if (response.success && response.data) {
        if (response.data.status === 'CANCELLED') {
          state.runs = state.runs.filter((entry) => entry.id !== runId)
          setStatus('error', 'This run was cancelled and can no longer be opened.')
          return
        }
        state.run = adaptRun(response.data)
        state.sourceType = state.run.sourceType
        state.recipeKey = state.run.recipeKey
        state.selectedSource = null
        state.selections = {}
        state.step = 'run'
        setActiveRunId(response.data.id)
      } else if (!response.success) {
        setStatus('error', response.message || 'Failed to open run.')
      }
    } catch (error) {
      if (openRunRequestId !== requestId) return
      handleError(error, 'opening build run')
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

const buggyErrors = checkOpenRunCancelledGuard(BUGGY_FIXTURE)
assert.equal(
  buggyErrors.length,
  3,
  'expected the pre-fix shape (missing cached-status check, missing ' +
    'fetch-status check, missing stale-entry drop) to raise 3 errors, got ' +
    `${buggyErrors.length}: ${JSON.stringify(buggyErrors)}`,
)
assert.ok(
  buggyErrors.some((e) => e.includes("cached.status !== 'CANCELLED'")),
  'expected a violation for the missing cached-branch status check',
)
assert.ok(
  buggyErrors.some((e) => e.includes("response.data.status === 'CANCELLED'")),
  'expected a violation for the missing fetch-fallback status check',
)
assert.ok(
  buggyErrors.some((e) => e.includes('state.runs = state.runs.filter')),
  'expected a violation for the missing stale-entry drop',
)

const fixedErrors = checkOpenRunCancelledGuard(FIXED_FIXTURE)
assert.equal(
  fixedErrors.length,
  0,
  `expected the fixed shape to raise no errors, got: ${JSON.stringify(fixedErrors)}`,
)

const missingFnErrors = checkOpenRunCancelledGuard(MISSING_FIXTURE)
assert.equal(
  missingFnErrors.length,
  1,
  'expected a single "function not found" violation when openRun is absent',
)
assert.ok(missingFnErrors[0]!.includes('openRun'))

// A fixture where the fetch-status check exists but runs AFTER the adopt
// statement must still fail -- the check has to gate the assignment, not
// just appear somewhere in the function body.
const CHECK_TOO_LATE_FIXTURE = `
  async function openRun(runId: string): Promise<void> {
    const requestId = ++openRunRequestId

    if (state.run?.id === runId) {
      state.step = 'run'
      return
    }

    const cached = state.runs.find((entry) => entry.id === runId)
    if (cached && cached.status !== 'CANCELLED') {
      state.run = cached
      state.step = 'run'
      setActiveRunId(Number(runId))
      return
    }

    try {
      const response = await performFetch<ServerRun>(
        \`/api/model-builder/runs/\${runId}\`,
      )
      if (openRunRequestId !== requestId) return
      if (response.success && response.data) {
        state.run = adaptRun(response.data)
        if (response.data.status === 'CANCELLED') {
          state.runs = state.runs.filter((entry) => entry.id !== runId)
        }
        state.step = 'run'
        setActiveRunId(response.data.id)
      }
    } catch (error) {
      if (openRunRequestId !== requestId) return
      handleError(error, 'opening build run')
    }
  }
`
const tooLateErrors = checkOpenRunCancelledGuard(CHECK_TOO_LATE_FIXTURE)
assert.ok(
  tooLateErrors.some((e) => e.includes('AFTER already assigning')),
  `expected a violation for a status check that runs after the adopt ` +
    `statement, got: ${JSON.stringify(tooLateErrors)}`,
)

console.log(
  'Model Builder open-run-cancelled guard checker verified: flags the ' +
    'pre-fix shape (missing cached-status check, missing fetch-status ' +
    'check, missing stale-entry drop), flags a status check that runs too ' +
    'late, clears the fixed shape, and flags openRun being absent entirely.',
)
