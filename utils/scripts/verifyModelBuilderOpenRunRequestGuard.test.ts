// /utils/scripts/verifyModelBuilderOpenRunRequestGuard.test.ts
//
// Regression test for checkOpenRunRequestGuard() in
// verifyModelBuilderOpenRunRequestGuard.ts (model-builder/t-029). Exercises
// the real check against synthetic store-shaped fixtures covering: the
// pre-fix shape (no request ticket at all -- the exact gap found by manual
// read-through), the fixed shape (a monotonic ticket captured up front and
// gating both the success and catch branches), a partially-fixed shape
// (ticket declared and captured, but only the success branch checks it -- the
// catch branch can still apply a stale error), and openRun being absent
// entirely.
import assert from 'node:assert/strict'

import { checkOpenRunRequestGuard } from './verifyModelBuilderOpenRunRequestGuard.js'

const BUGGY_FIXTURE = `
  async function openRun(runId: string): Promise<void> {
    if (state.run?.id === runId) {
      state.step = 'run'
      return
    }

    const cached = state.runs.find((entry) => entry.id === runId)
    if (cached) {
      state.run = cached
      state.sourceType = cached.sourceType
      state.recipeKey = cached.recipeKey
      state.step = 'run'
      setActiveRunId(Number(runId))
      return
    }

    try {
      const response = await performFetch<ServerRun>(
        \`/api/model-builder/runs/\${runId}\`,
      )
      if (response.success && response.data) {
        state.run = adaptRun(response.data)
        state.sourceType = state.run.sourceType
        state.recipeKey = state.run.recipeKey
        state.step = 'run'
        setActiveRunId(response.data.id)
      } else if (!response.success) {
        setStatus('error', response.message || 'Failed to open run.')
      }
    } catch (error) {
      handleError(error, 'opening build run')
    }
  }
`

const FIXED_FIXTURE = `
  let openRunRequestId = 0

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

const PARTIAL_FIXTURE = `
  let openRunRequestId = 0

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
        state.step = 'run'
        setActiveRunId(response.data.id)
      } else if (!response.success) {
        setStatus('error', response.message || 'Failed to open run.')
      }
    } catch (error) {
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

const buggyErrors = checkOpenRunRequestGuard(BUGGY_FIXTURE)
assert.ok(
  buggyErrors.some((e) => e.includes('openRunRequestId = 0')),
  `expected the pre-fix shape to flag the missing request ticket, got: ${JSON.stringify(buggyErrors)}`,
)
assert.ok(
  buggyErrors.some((e) =>
    e.includes('checks `openRunRequestId !== requestId` only 0 time(s)'),
  ),
  `expected the pre-fix shape to flag zero stale-response checks, got: ${JSON.stringify(buggyErrors)}`,
)
assert.ok(
  buggyErrors.some((e) => e.includes('does not capture')),
  `expected the pre-fix shape to flag the missing ticket capture, got: ${JSON.stringify(buggyErrors)}`,
)

const fixedErrors = checkOpenRunRequestGuard(FIXED_FIXTURE)
assert.equal(
  fixedErrors.length,
  0,
  `expected the fixed shape to raise no errors, got: ${JSON.stringify(fixedErrors)}`,
)

const partialErrors = checkOpenRunRequestGuard(PARTIAL_FIXTURE)
assert.ok(
  partialErrors.some((e) => e.includes('only 1 time(s)')),
  `expected the partial fix (catch branch not scoped) to flag only 1 stale-response check, got: ${JSON.stringify(partialErrors)}`,
)

const missingFnErrors = checkOpenRunRequestGuard(MISSING_FIXTURE)
assert.ok(
  missingFnErrors.some((e) => e.includes('openRun')),
  'expected a "function not found" violation when openRun is absent',
)

console.log(
  'Model Builder openRun request guard checker verified: flags the pre-fix ' +
    'shape (no request ticket), clears the fixed shape (ticket captured up ' +
    'front and gating success/catch), flags a partial fix (catch branch not ' +
    'scoped), and flags openRun being absent entirely.',
)
