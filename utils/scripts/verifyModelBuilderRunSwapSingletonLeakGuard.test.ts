// /utils/scripts/verifyModelBuilderRunSwapSingletonLeakGuard.test.ts
//
// Regression test for checkRunSwapSingletonLeakGuard() in
// verifyModelBuilderRunSwapSingletonLeakGuard.ts (model-builder/t-029,
// cycle 57). Exercises the real check against a synthetic store-shaped
// fixture covering all four run-swap sites in both their fixed and pre-fix
// shapes.
import assert from 'node:assert/strict'

import { checkRunSwapSingletonLeakGuard } from './verifyModelBuilderRunSwapSingletonLeakGuard.js'

const CLEAR_BLOCK = `
      state.generatingItemId = null
      state.committingItemId = null
      state.autoBuilding = false
      state.autoBuildingItemId = null
      state.batchingOutputKey = null
      draftingField.value = null
`

const NOT_CLEARED = '// (nothing cleared)'

// Padding inserted between every pair of sites in the fixture below so a
// guard window anchored on one site can never bleed into a neighboring
// site's own clear block -- mirrors the real file's comment-heavy spacing
// between functions, keeping site-isolation realistic rather than an
// artifact of a synthetic fixture being unusually compact relative to the
// guard's (deliberately generous, to survive real prettier-wrapped
// comments) window sizes.
const FILLER = Array.from(
  { length: 12 },
  () =>
    '    // filler padding so guard windows never bleed across fixture sites.',
).join('\n')

function buildFixture(sites: {
  startRun?: string
  openRunCached?: string
  openRunFetched?: string
  resumeRun?: string
}): string {
  const startRun = sites.startRun ?? CLEAR_BLOCK
  const openRunCached = sites.openRunCached ?? CLEAR_BLOCK
  const openRunFetched = sites.openRunFetched ?? CLEAR_BLOCK
  const resumeRun = sites.resumeRun ?? CLEAR_BLOCK

  return `
  async function startRun(): Promise<void> {
    try {
      const response = await performFetch('/api/model-builder/runs', {})
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to start build run.')
      }
      ${startRun}
      state.run = adaptRun(response.data)
      setActiveRunId(response.data.id)
      state.step = 'run'
    } catch (error) {
      handleError(error, 'starting build run')
    }
  }

${FILLER}

  async function openRun(runId: string): Promise<void> {
    if (state.run?.id === runId) {
      state.step = 'run'
      return
    }

    const cached = state.runs.find((entry) => entry.id === runId)
    if (cached && cached.status !== 'CANCELLED') {
      ${openRunCached}
      state.run = cached
      state.step = 'run'
      setActiveRunId(Number(runId))
      return
    }

${FILLER}

    try {
      const response = await performFetch(\`/api/model-builder/runs/\${runId}\`)
      if (response.success && response.data) {
        if (response.data.status === 'CANCELLED') {
          return
        }
        // See the comment on the cached branch above.
        ${openRunFetched}
        state.run = adaptRun(response.data)
        state.step = 'run'
        setActiveRunId(response.data.id)
      } else if (!response.success) {
        setStatus('error', response.message || 'Failed to open run.')
      }
    } catch (error) {
      handleError(error, 'opening build run')
    }
  }

${FILLER}

  async function resumeRun(): Promise<void> {
    try {
      const data = await fetchSomeRun()
      if (data) {
        if (state.run?.id === String(data.id)) {
          state.step = 'run'
          setActiveRunId(data.id)
        } else {
          ${resumeRun}
          state.run = adaptRun(data)
          state.selectedSource = null
          state.selections = {}
          state.step = 'run'
          setActiveRunId(data.id)
        }
      }
    } catch {
      // Not signed in, or no runs yet.
    }
  }
`
}

const FIXED_FIXTURE = buildFixture({})
const BUGGY_FIXTURE = buildFixture({
  startRun: NOT_CLEARED,
  openRunCached: NOT_CLEARED,
  openRunFetched: NOT_CLEARED,
  resumeRun: NOT_CLEARED,
})

const fixedErrors = checkRunSwapSingletonLeakGuard(FIXED_FIXTURE)
assert.equal(
  fixedErrors.length,
  0,
  `expected the fixed shape to raise no errors, got: ${JSON.stringify(fixedErrors)}`,
)

const buggyErrors = checkRunSwapSingletonLeakGuard(BUGGY_FIXTURE)
assert.equal(
  buggyErrors.length,
  4,
  `expected all 4 swap sites to be flagged when none clear the singletons, ` +
    `got ${buggyErrors.length}: ${JSON.stringify(buggyErrors)}`,
)
for (const site of [
  "startRun()'s success path",
  "openRun()'s cached-run branch",
  "openRun()'s freshly-fetched-run branch",
  "resumeRun()'s adopt-a-different-run branch",
]) {
  assert.ok(
    buggyErrors.some((error) => error.startsWith(site)),
    `expected a violation for ${site}, got: ${JSON.stringify(buggyErrors)}`,
  )
}

// A fixture that fixes every site EXCEPT one should raise exactly one error,
// for the specific site left buggy -- confirms sites are checked
// independently rather than the guard passing/failing all-or-nothing.
const PARTIALLY_FIXED_FIXTURE = buildFixture({ openRunCached: NOT_CLEARED })
const partialErrors = checkRunSwapSingletonLeakGuard(PARTIALLY_FIXED_FIXTURE)
assert.equal(
  partialErrors.length,
  1,
  `expected exactly 1 error when only the cached-run branch regresses, got: ${JSON.stringify(partialErrors)}`,
)
assert.ok(partialErrors[0]?.startsWith("openRun()'s cached-run branch"))

// A fixture missing one specific line (rather than the whole block) should
// still be caught and named precisely.
const CLEAR_BLOCK_MISSING_BATCH_KEY = `
      state.generatingItemId = null
      state.committingItemId = null
      state.autoBuilding = false
      state.autoBuildingItemId = null
      draftingField.value = null
`
const ONE_LINE_MISSING_FIXTURE = buildFixture({
  startRun: CLEAR_BLOCK_MISSING_BATCH_KEY,
})
const oneLineErrors = checkRunSwapSingletonLeakGuard(ONE_LINE_MISSING_FIXTURE)
assert.equal(
  oneLineErrors.length,
  1,
  `expected exactly 1 error when startRun drops only batchingOutputKey, got: ${JSON.stringify(oneLineErrors)}`,
)
assert.ok(oneLineErrors[0]?.startsWith("startRun()'s success path"))
assert.ok(oneLineErrors[0]?.includes('state.batchingOutputKey = null'))

console.log(
  'Model Builder run-swap singleton-leak guard checker verified: flags each ' +
    'of the 4 run-swap sites independently when they skip clearing the ' +
    'in-flight singletons (including a single dropped line), and clears ' +
    'the fully-fixed shape.',
)
