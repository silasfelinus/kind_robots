// /utils/scripts/verifyModelBuilderAsyncFetchStalenessCoverage.test.ts
//
// Regression test for checkAsyncFetchStalenessCoverage() in
// verifyModelBuilderAsyncFetchStalenessCoverage.ts (model-builder/t-044).
// Exercises the real check against synthetic store-shaped fixtures covering:
// an unregistered new performFetch( call site, a registered function whose
// marker has been deleted (protection silently regressed), a registered
// function that no longer exists (renamed/removed), a registered function
// whose performFetch( call is gone (should be de-registered), a 'write-only'
// entry that has started assigning `state.*` from `.data` (classification
// gone stale), and the clean/covered shape raising nothing.
import assert from 'node:assert/strict'

import {
  AUDITED_ASYNC_FETCH_FUNCTIONS,
  checkAsyncFetchStalenessCoverage,
} from './verifyModelBuilderAsyncFetchStalenessCoverage.js'

// A minimal fixture containing every currently-registered function, each
// shaped just enough to satisfy its own registry marker -- this is the
// "everything covered, nothing changed" baseline the other fixtures perturb.
const COVERED_FIXTURE = `
  async function loadSources(): Promise<void> {
    const requestedType = state.sourceType
    try {
      const response = await performFetch<SourceRecord[]>(config.endpoint)
      if (state.sourceType !== requestedType) return
      state.sources = response.data
    } catch (error) {
      if (state.sourceType !== requestedType) return
    }
  }

  async function startRun(): Promise<void> {
    if (state.startingRun) return
    state.startingRun = true
    try {
      const response = await performFetch<ServerRun>('/api/model-builder/runs', {})
      state.run = adaptRun(response.data)
    } finally {
      state.startingRun = false
    }
  }

  function pushItem(item, payload) {
    performFetch(\`/api/model-builder/items/\${item.id}\`, {}).then((response) => {
      if (!response.success) setStatusForRun(runId, 'error', response.message)
    })
  }

  function batchPushItems(entries) {
    return performFetch('/api/model-builder/items/batch', {}).then((response) => {
      if (!response.success) return false
      return true
    })
  }

  async function draftText(itemId, field) {
    const current = item.pitch
    try {
      const result = await performFetch<{ value: string }>('/api/suggest', {})
      const liveValue = item.pitch
      if (liveValue !== current) return false
      updatePitch(itemId, result.data.value)
    } catch (error) {}
  }

  async function recordArtifact(item, image) {
    const result = await performFetch(\`/api/model-builder/items/\${item.id}/artifacts\`, {})
    if (!result.success) {
      setStatusForRun(runId, 'error', result.message)
    }
  }

  async function commitItem(itemId): Promise<boolean> {
    const runId = state.run.id
    try {
      const response = await performFetch<{ target?: CommitTarget }>(\`/api/model-builder/items/\${itemId}/commit\`, {})
      if (cancelledRunIds.has(runId)) return false
      item.targetType = response.data.target.type
    } catch (error) {
      if (cancelledRunIds.has(runId)) return false
    }
  }

  async function resumeRun(): Promise<void> {
    try {
      const response = await performFetch<ServerRun>(\`/api/model-builder/runs/\${remembered}\`)
      const data = response.data
      if (state.run?.id === String(data.id)) {
        state.step = 'run'
      } else {
        state.run = adaptRun(data)
      }
    } catch {}
  }

  let fetchRunsRequestId = 0
  async function fetchRuns(): Promise<void> {
    const requestId = ++fetchRunsRequestId
    try {
      const response = await performFetch<ServerRun[]>('/api/model-builder/runs?take=50')
      if (fetchRunsRequestId !== requestId) return
      state.runs = response.data
    } catch (error) {
      if (fetchRunsRequestId !== requestId) return
    }
  }

  let openRunRequestId = 0
  async function openRun(runId: string): Promise<void> {
    const requestId = ++openRunRequestId
    try {
      const response = await performFetch<ServerRun>(\`/api/model-builder/runs/\${runId}\`)
      if (openRunRequestId !== requestId) return
      state.run = adaptRun(response.data)
    } catch (error) {
      if (openRunRequestId !== requestId) return
    }
  }

  async function cancelRun(runId: string): Promise<void> {
    const response = await performFetch(\`/api/model-builder/runs/\${runId}\`, {})
    if (!response.success) {
      setStatus('error', response.message)
      return
    }
    state.runs = state.runs.filter((entry) => entry.id !== runId)
  }
`

const covered = checkAsyncFetchStalenessCoverage(COVERED_FIXTURE)
assert.equal(
  covered.length,
  0,
  `expected the fully-covered fixture to raise no errors, got: ${JSON.stringify(covered)}`,
)

// Every registered function should actually appear in the baseline fixture --
// guards this test file itself against silently drifting from the real
// registry (e.g. a new entry added to the script but never added here).
for (const name of Object.keys(AUDITED_ASYNC_FETCH_FUNCTIONS)) {
  assert.ok(
    new RegExp(`function ${name}\\(`).test(COVERED_FIXTURE),
    `COVERED_FIXTURE is missing a fixture for registered function ${name}() -- add one so this test file stays in sync with the real registry`,
  )
}

const NEW_UNREGISTERED_FIXTURE =
  COVERED_FIXTURE +
  `
  async function loadTemplates(): Promise<void> {
    const response = await performFetch<Template[]>('/api/model-builder/templates')
    state.templates = response.data
  }
`
const newCallSiteErrors = checkAsyncFetchStalenessCoverage(
  NEW_UNREGISTERED_FIXTURE,
)
assert.ok(
  newCallSiteErrors.some(
    (e) => e.includes('loadTemplates') && e.includes('no entry in'),
  ),
  `expected a new, unregistered performFetch( call site to be flagged, got: ${JSON.stringify(newCallSiteErrors)}`,
)

const MARKER_DELETED_FIXTURE = COVERED_FIXTURE.replace(
  'if (cancelledRunIds.has(runId)) return false\n      item.targetType',
  'item.targetType',
).replace(
  '    } catch (error) {\n      if (cancelledRunIds.has(runId)) return false\n    }\n  }\n\n  async function resumeRun',
  '    } catch (error) {\n    }\n  }\n\n  async function resumeRun',
)
const markerDeletedErrors = checkAsyncFetchStalenessCoverage(
  MARKER_DELETED_FIXTURE,
)
assert.ok(
  markerDeletedErrors.some(
    (e) => e.includes('commitItem') && e.includes('no longer present'),
  ),
  `expected commitItem's deleted cancelledRunIds marker to be flagged, got: ${JSON.stringify(markerDeletedErrors)}`,
)

const RENAMED_FIXTURE = COVERED_FIXTURE.replace(
  'async function commitItem(itemId): Promise<boolean> {',
  'async function commitBuildItem(itemId): Promise<boolean> {',
)
const renamedErrors = checkAsyncFetchStalenessCoverage(RENAMED_FIXTURE)
assert.ok(
  renamedErrors.some((e) => e.includes('commitItem') && e.includes('renamed')),
  `expected a renamed registered function to be flagged as missing, got: ${JSON.stringify(renamedErrors)}`,
)

const FETCH_REMOVED_FIXTURE = COVERED_FIXTURE.replace(
  'const response = await performFetch<{ target?: CommitTarget }>(`/api/model-builder/items/${itemId}/commit`, {})\n      if (cancelledRunIds.has(runId)) return false\n      item.targetType = response.data.target.type',
  'const response = await someOtherHelper(itemId)\n      item.targetType = response.data.target.type',
)
const fetchRemovedErrors = checkAsyncFetchStalenessCoverage(
  FETCH_REMOVED_FIXTURE,
)
assert.ok(
  fetchRemovedErrors.some(
    (e) =>
      e.includes('commitItem') &&
      e.includes('no longer contains a performFetch'),
  ),
  `expected a registered function whose performFetch( call was removed to be flagged, got: ${JSON.stringify(fetchRemovedErrors)}`,
)

const WRITE_ONLY_GONE_STALE_FIXTURE = COVERED_FIXTURE.replace(
  "if (!result.success) {\n      setStatusForRun(runId, 'error', result.message)\n    }\n  }\n\n  async function commitItem",
  "if (!result.success) {\n      setStatusForRun(runId, 'error', result.message)\n    }\n    state.lastArtifactPath = result.data.path\n  }\n\n  async function commitItem",
)
const writeOnlyStaleErrors = checkAsyncFetchStalenessCoverage(
  WRITE_ONLY_GONE_STALE_FIXTURE,
)
assert.ok(
  writeOnlyStaleErrors.some(
    (e) =>
      e.includes('recordArtifact') && e.includes("classified 'write-only'"),
  ),
  `expected a 'write-only' function now assigning state from .data to be flagged, got: ${JSON.stringify(writeOnlyStaleErrors)}`,
)

console.log(
  'Model Builder async-fetch staleness coverage checker verified: passes on ' +
    'the fully-covered fixture, flags a new unregistered performFetch( call ' +
    "site, flags a registered function's marker being deleted, flags a " +
    "registered function being renamed away, flags a registered function's " +
    "performFetch( call being removed, and flags a 'write-only' function " +
    'that has started assigning state from a response body.',
)
