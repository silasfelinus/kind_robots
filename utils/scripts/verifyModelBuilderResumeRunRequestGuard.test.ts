// /utils/scripts/verifyModelBuilderResumeRunRequestGuard.test.ts
//
// Regression test for checkResumeRunRequestGuard() in
// verifyModelBuilderResumeRunRequestGuard.ts (model-builder/t-029, cycle
// 59). Exercises the real check against synthetic store-shaped fixtures
// covering: the pre-fix shape (no request ticket at all -- the exact gap
// found by manual read-through), the fixed shape (a monotonic ticket
// captured up front and gating both sequential performFetch calls), a
// partially-fixed shape (ticket declared and captured, but only the first
// performFetch call checks it -- the fallback fetch can still apply a stale
// response), and resumeRun being absent entirely.
import assert from 'node:assert/strict'

import { checkResumeRunRequestGuard } from './verifyModelBuilderResumeRunRequestGuard.js'

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
        if (
          response.success &&
          Array.isArray(response.data) &&
          response.data.length
        ) {
          data = response.data[0]
        }
      }

      if (data) {
        if (state.run?.id === String(data.id)) {
          state.step = 'run'
          setActiveRunId(data.id)
        } else {
          state.generatingItemId = null
          state.committingItemId = null
          state.autoBuilding = false
          state.autoBuildingItemId = null
          state.batchingOutputKey = null
          draftingField.value = null
          state.run = adaptRun(data)
          state.sourceType = data.sourceType as SourceTypeKey
          state.recipeKey = data.recipeKey as RecipeKey
          state.selectedSource = null
          state.selections = {}
          state.step = 'run'
          setActiveRunId(data.id)
        }
      }
    } catch {
      // Not signed in, or no runs yet — start fresh at the source picker.
    }
  }
`

const FIXED_FIXTURE = `
  let resumeRunRequestId = 0

  async function resumeRun(): Promise<void> {
    const requestId = ++resumeRunRequestId
    try {
      const remembered = safeGet(runIdKey)
      let data: ServerRun | undefined

      if (remembered) {
        const response = await performFetch<ServerRun>(
          \`/api/model-builder/runs/\${remembered}\`,
        )
        if (resumeRunRequestId !== requestId) return
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
        if (resumeRunRequestId !== requestId) return
        if (
          response.success &&
          Array.isArray(response.data) &&
          response.data.length
        ) {
          data = response.data[0]
        }
      }

      if (data) {
        if (state.run?.id === String(data.id)) {
          state.step = 'run'
          setActiveRunId(data.id)
        } else {
          state.generatingItemId = null
          state.committingItemId = null
          state.autoBuilding = false
          state.autoBuildingItemId = null
          state.batchingOutputKey = null
          draftingField.value = null
          state.run = adaptRun(data)
          state.sourceType = data.sourceType as SourceTypeKey
          state.recipeKey = data.recipeKey as RecipeKey
          state.selectedSource = null
          state.selections = {}
          state.step = 'run'
          setActiveRunId(data.id)
        }
      }
    } catch {
      // Not signed in, or no runs yet — start fresh at the source picker.
    }
  }
`

const PARTIAL_FIXTURE = `
  let resumeRunRequestId = 0

  async function resumeRun(): Promise<void> {
    const requestId = ++resumeRunRequestId
    try {
      const remembered = safeGet(runIdKey)
      let data: ServerRun | undefined

      if (remembered) {
        const response = await performFetch<ServerRun>(
          \`/api/model-builder/runs/\${remembered}\`,
        )
        if (resumeRunRequestId !== requestId) return
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
        if (
          response.success &&
          Array.isArray(response.data) &&
          response.data.length
        ) {
          data = response.data[0]
        }
      }

      if (data) {
        state.run = adaptRun(data)
        state.step = 'run'
        setActiveRunId(data.id)
      }
    } catch {
      // Not signed in, or no runs yet — start fresh at the source picker.
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

const buggyErrors = checkResumeRunRequestGuard(BUGGY_FIXTURE)
assert.ok(
  buggyErrors.some((e) => e.includes('resumeRunRequestId = 0')),
  `expected the pre-fix shape to flag the missing request ticket, got: ${JSON.stringify(buggyErrors)}`,
)
assert.ok(
  buggyErrors.some((e) =>
    e.includes('checks `resumeRunRequestId !== requestId` only 0 time(s)'),
  ),
  `expected the pre-fix shape to flag zero stale-response checks, got: ${JSON.stringify(buggyErrors)}`,
)
assert.ok(
  buggyErrors.some((e) => e.includes('does not capture')),
  `expected the pre-fix shape to flag the missing ticket capture, got: ${JSON.stringify(buggyErrors)}`,
)

const fixedErrors = checkResumeRunRequestGuard(FIXED_FIXTURE)
assert.equal(
  fixedErrors.length,
  0,
  `expected the fixed shape to raise no errors, got: ${JSON.stringify(fixedErrors)}`,
)

const partialErrors = checkResumeRunRequestGuard(PARTIAL_FIXTURE)
assert.ok(
  partialErrors.some((e) => e.includes('only 1 time(s)')),
  `expected the partial fix (fallback fetch not scoped) to flag only 1 stale-response check, got: ${JSON.stringify(partialErrors)}`,
)

const missingFnErrors = checkResumeRunRequestGuard(MISSING_FIXTURE)
assert.ok(
  missingFnErrors.some((e) => e.includes('resumeRun')),
  'expected a "function not found" violation when resumeRun is absent',
)

console.log(
  'Model Builder resumeRun request guard checker verified: flags the ' +
    'pre-fix shape (no request ticket), clears the fixed shape (ticket ' +
    'captured up front and gating both sequential performFetch calls), ' +
    'flags a partial fix (fallback fetch not scoped), and flags resumeRun ' +
    'being absent entirely.',
)
