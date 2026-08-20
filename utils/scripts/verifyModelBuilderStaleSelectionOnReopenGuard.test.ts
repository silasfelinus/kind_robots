// /utils/scripts/verifyModelBuilderStaleSelectionOnReopenGuard.test.ts
//
// Regression test for checkStaleSelectionOnReopenGuard() in
// verifyModelBuilderStaleSelectionOnReopenGuard.ts (model-builder/t-029,
// cycle 24). Exercises the real check against synthetic store-shaped
// fixtures covering: the pre-fix shape (all three adopt-a-different-run
// branches leave state.selectedSource/state.selections untouched -- the
// exact bug found by manual read-through of resumeRun()/openRun()), the
// fixed shape (all three reset both fields before `state.step = 'run'`),
// and each anchor missing entirely (function renamed/restructured).
import assert from 'node:assert/strict'

import { checkStaleSelectionOnReopenGuard } from './verifyModelBuilderStaleSelectionOnReopenGuard.js'

const BUGGY_FIXTURE = `
  async function resumeRun(): Promise<void> {
    try {
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
    } catch {}
  }

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
      }
    } catch (error) {}
  }
`

const FIXED_FIXTURE = `
  async function resumeRun(): Promise<void> {
    try {
      if (data) {
        if (state.run?.id === String(data.id)) {
          state.step = 'run'
          setActiveRunId(data.id)
        } else {
          state.run = adaptRun(data)
          state.sourceType = data.sourceType as SourceTypeKey
          state.recipeKey = data.recipeKey as RecipeKey
          state.selectedSource = null
          state.selections = {}
          state.step = 'run'
          setActiveRunId(data.id)
        }
      }
    } catch {}
  }

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
      if (response.success && response.data) {
        state.run = adaptRun(response.data)
        state.sourceType = state.run.sourceType
        state.recipeKey = state.run.recipeKey
        state.selectedSource = null
        state.selections = {}
        state.step = 'run'
        setActiveRunId(response.data.id)
      }
    } catch (error) {}
  }
`

const MISSING_FIXTURE = `
  function approveStage(itemId: string, stageKey: BuildStageKey): void {
    const item = findItem(itemId)
    if (!item) return
    item.stages[stageKey] = { status: 'approved' }
  }
`

const buggyErrors = checkStaleSelectionOnReopenGuard(BUGGY_FIXTURE)
assert.equal(
  buggyErrors.length,
  6,
  'expected the pre-fix shape to raise 2 errors (selectedSource + ' +
    `selections) for each of the 3 branches (6 total), got ${buggyErrors.length}: ` +
    `${JSON.stringify(buggyErrors)}`,
)
assert.ok(
  buggyErrors.filter((e) => e.includes('state.selectedSource = null'))
    .length === 3,
  'expected a selectedSource-reset violation for each of the 3 branches',
)
assert.ok(
  buggyErrors.filter((e) => e.includes('state.selections = {}')).length === 3,
  'expected a selections-reset violation for each of the 3 branches',
)

const fixedErrors = checkStaleSelectionOnReopenGuard(FIXED_FIXTURE)
assert.equal(
  fixedErrors.length,
  0,
  `expected the fixed shape to raise no errors, got: ${JSON.stringify(fixedErrors)}`,
)

const missingErrors = checkStaleSelectionOnReopenGuard(MISSING_FIXTURE)
assert.equal(
  missingErrors.length,
  3,
  'expected one "anchor not found" violation per branch when resumeRun/' +
    'openRun are both absent',
)
for (const error of missingErrors) {
  assert.ok(error.includes('Could not find'))
}

console.log(
  'Model Builder stale-selection-on-reopen guard checker verified: flags ' +
    'the pre-fix shape (all 3 branches leaving selectedSource/selections ' +
    'stale), clears the fixed shape, and flags all 3 anchors being absent.',
)
