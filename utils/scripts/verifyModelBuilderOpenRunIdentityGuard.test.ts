// /utils/scripts/verifyModelBuilderOpenRunIdentityGuard.test.ts
//
// Regression test for checkOpenRunIdentityGuard() in
// verifyModelBuilderOpenRunIdentityGuard.ts (model-builder/t-029). Exercises
// the real check against synthetic store-shaped fixtures covering: the
// pre-fix shape (openRun replaces state.run unconditionally via the cache
// lookup, even for the already-active run -- the exact bug found by manual
// read-through), and the fixed shape (an identity check against
// state.run?.id short-circuits before that lookup).
import assert from 'node:assert/strict'

import { checkOpenRunIdentityGuard } from './verifyModelBuilderOpenRunIdentityGuard.js'

const BUGGY_FIXTURE = `
  async function openRun(runId: string): Promise<void> {
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

function run(): void {
  const buggyErrors = checkOpenRunIdentityGuard(BUGGY_FIXTURE)
  assert.equal(
    buggyErrors.length,
    1,
    'expected the buggy fixture (no identity guard before the cache ' +
      `lookup) to fail exactly once, got: ${JSON.stringify(buggyErrors)}`,
  )
  assert.match(buggyErrors[0]!, /state\.run\?\.id === runId/)

  const fixedErrors = checkOpenRunIdentityGuard(FIXED_FIXTURE)
  assert.deepEqual(
    fixedErrors,
    [],
    `expected the fixed fixture to pass, got: ${JSON.stringify(fixedErrors)}`,
  )

  const missingFnErrors = checkOpenRunIdentityGuard(
    'async function someOtherFunction(): Promise<void> {}',
  )
  assert.equal(
    missingFnErrors.length,
    1,
    'expected a fixture with no openRun() to fail with a "could not find" error',
  )
  assert.match(
    missingFnErrors[0]!,
    /Could not find an async function named openRun/,
  )

  console.log(
    'Model Builder open-run identity guard self-test passed: buggy fixture ' +
      'fails, fixed fixture passes, missing-function fixture fails clearly.',
  )
}

run()
