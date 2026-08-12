// /utils/scripts/verifyModelBuilderResumeRunIdentityGuard.test.ts
//
// Regression test for checkResumeRunIdentityGuard() in
// verifyModelBuilderResumeRunIdentityGuard.ts (model-builder/t-029).
// Exercises the real check against synthetic store-shaped fixtures
// covering: the pre-fix shape (resumeRun replaces state.run
// unconditionally once it resolves `data`, even for the already-active
// run -- the exact bug found by manual read-through), and the fixed shape
// (an identity check against state.run?.id short-circuits before that
// reassignment).
import assert from 'node:assert/strict'

import { checkResumeRunIdentityGuard } from './verifyModelBuilderResumeRunIdentityGuard.js'

const BUGGY_FIXTURE = `
  async function resumeRun(): Promise<void> {
    try {
      const remembered = safeGet(runIdKey)
      let data: ServerRun | undefined

      if (remembered) {
        const response = await performFetch<ServerRun>(
          \`/api/model-builder/runs/\${remembered}\`,
        )
        if (
          response.success &&
          response.data &&
          response.data.status !== 'CANCELLED'
        ) {
          data = response.data
        } else if (response.success && response.data) {
          safeRemove(runIdKey)
        }
      }

      if (!data) {
        const response = await performFetch<ServerRun[]>(
          '/api/model-builder/runs?take=1',
        )
        if (response.success && Array.isArray(response.data) && response.data.length) {
          data = response.data[0]
        }
      }

      if (data) {
        state.run = adaptRun(data)
        state.sourceType = data.sourceType as SourceTypeKey
        state.recipeKey = data.recipeKey as RecipeKey
        state.step = 'run'
        setActiveRunId(data.id)
      }
    } catch {
      // Not signed in, or no runs yet -- start fresh at the source picker.
    }
  }
`

const FIXED_FIXTURE = `
  async function resumeRun(): Promise<void> {
    try {
      const remembered = safeGet(runIdKey)
      let data: ServerRun | undefined

      if (remembered) {
        const response = await performFetch<ServerRun>(
          \`/api/model-builder/runs/\${remembered}\`,
        )
        if (
          response.success &&
          response.data &&
          response.data.status !== 'CANCELLED'
        ) {
          data = response.data
        } else if (response.success && response.data) {
          safeRemove(runIdKey)
        }
      }

      if (!data) {
        const response = await performFetch<ServerRun[]>(
          '/api/model-builder/runs?take=1',
        )
        if (response.success && Array.isArray(response.data) && response.data.length) {
          data = response.data[0]
        }
      }

      if (data) {
        if (state.run?.id === String(data.id)) {
          state.step = 'run'
          setActiveRunId(data.id)
        } else {
          state.run = adaptRun(data)
          state.sourceType = data.sourceType as SourceTypeKey
          state.recipeKey = data.recipeKey as RecipeKey
          state.step = 'run'
          setActiveRunId(data.id)
        }
      }
    } catch {
      // Not signed in, or no runs yet -- start fresh at the source picker.
    }
  }
`

function run(): void {
  const buggyErrors = checkResumeRunIdentityGuard(BUGGY_FIXTURE)
  assert.equal(
    buggyErrors.length,
    1,
    'expected the buggy fixture (no identity guard before the adaptRun ' +
      `reassignment) to fail exactly once, got: ${JSON.stringify(buggyErrors)}`,
  )
  assert.match(buggyErrors[0]!, /state\.run\?\.id === String\(data\.id\)/)

  const fixedErrors = checkResumeRunIdentityGuard(FIXED_FIXTURE)
  assert.deepEqual(
    fixedErrors,
    [],
    `expected the fixed fixture to pass, got: ${JSON.stringify(fixedErrors)}`,
  )

  const missingFnErrors = checkResumeRunIdentityGuard(
    'async function someOtherFunction(): Promise<void> {}',
  )
  assert.equal(
    missingFnErrors.length,
    1,
    'expected a fixture with no resumeRun() to fail with a "could not find" error',
  )
  assert.match(
    missingFnErrors[0]!,
    /Could not find an async function named resumeRun/,
  )

  console.log(
    'Model Builder resume-run identity guard self-test passed: buggy ' +
      'fixture fails, fixed fixture passes, missing-function fixture fails ' +
      'clearly.',
  )
}

run()
