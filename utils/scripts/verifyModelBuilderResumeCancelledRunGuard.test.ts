// /utils/scripts/verifyModelBuilderResumeCancelledRunGuard.test.ts
//
// Regression test for checkResumeCancelledRunGuard() in
// verifyModelBuilderResumeCancelledRunGuard.ts (model-builder/t-029).
// Exercises the real check against synthetic store-shaped fixtures covering:
// the pre-fix shape (remembered-id branch accepts any successful response,
// no status check, no forgetting -- the exact bug found by manual
// read-through), and the fixed shape (status checked, cancelled id forgotten
// via safeRemove).
import assert from 'node:assert/strict'

import { checkResumeCancelledRunGuard } from './verifyModelBuilderResumeCancelledRunGuard.js'

const BUGGY_FIXTURE = `
  async function resumeRun(): Promise<void> {
    try {
      const remembered = safeGet(runIdKey)
      let data: ServerRun | undefined

      if (remembered) {
        const response = await performFetch<ServerRun>(
          \`/api/model-builder/runs/\${remembered}\`,
        )
        if (response.success && response.data) data = response.data
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

const MISSING_FIXTURE = `
  function approveStage(itemId: string, stageKey: BuildStageKey): void {
    const item = findItem(itemId)
    if (!item) return
    item.stages[stageKey] = { status: 'approved' }
  }
`

const buggyErrors = checkResumeCancelledRunGuard(BUGGY_FIXTURE)
assert.equal(
  buggyErrors.length,
  2,
  `expected the pre-fix shape (missing status check AND missing ` +
    `safeRemove call) to raise 2 errors, got ${buggyErrors.length}: ` +
    `${JSON.stringify(buggyErrors)}`,
)
assert.ok(
  buggyErrors.some((e) => e.includes("status !== 'CANCELLED'")),
  'expected a violation for the missing status check',
)
assert.ok(
  buggyErrors.some((e) => e.includes('safeRemove(runIdKey)')),
  'expected a violation for the missing safeRemove call',
)

const fixedErrors = checkResumeCancelledRunGuard(FIXED_FIXTURE)
assert.equal(
  fixedErrors.length,
  0,
  `expected the fixed shape to raise no errors, got: ${JSON.stringify(fixedErrors)}`,
)

const missingFnErrors = checkResumeCancelledRunGuard(MISSING_FIXTURE)
assert.equal(
  missingFnErrors.length,
  1,
  'expected a single "function not found" violation when resumeRun is absent',
)
assert.ok(missingFnErrors[0]!.includes('resumeRun'))

console.log(
  'Model Builder resume-cancelled-run guard checker verified: flags the ' +
    'pre-fix shape (missing status check and missing safeRemove-on-cancelled ' +
    'call), clears the fixed shape, and flags resumeRun being absent entirely.',
)
