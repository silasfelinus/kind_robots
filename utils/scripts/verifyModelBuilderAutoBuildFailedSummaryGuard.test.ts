// /utils/scripts/verifyModelBuilderAutoBuildFailedSummaryGuard.test.ts
//
// Regression test for checkAutoBuildFailedSummaryGuard() in
// verifyModelBuilderAutoBuildFailedSummaryGuard.ts (model-builder/t-029).
// Exercises the real check against synthetic store-shaped fixtures covering:
// the pre-fix shape (failed outcomes never tallied, tone always 'success'),
// the fixed shape (both functions), a shape that tallies `failed` but never
// reflects it in the tone, and both target functions being absent entirely.
import assert from 'node:assert/strict'

import { checkAutoBuildFailedSummaryGuard } from './verifyModelBuilderAutoBuildFailedSummaryGuard.js'

const BUGGY_FIXTURE = `
  async function autoBuildRun(): Promise<void> {
    const items = [...state.run.items]
    let committed = 0
    let skipped = 0
    try {
      for (const item of items) {
        const outcome = await autoBuildItem(item.id)
        if (outcome === 'committed') committed++
        else if (outcome === 'skipped') skipped++
      }
      setStatus(
        'success',
        \`Auto-build finished: \${committed}/\${items.length} committed.\`,
      )
    } finally {
      state.autoBuilding = false
    }
  }

  async function batchAutoBuild(outputKey: string): Promise<void> {
    const items = groupItems(outputKey)
    let committed = 0
    let skipped = 0
    try {
      for (const item of items) {
        const outcome = await autoBuildItem(item.id)
        if (outcome === 'committed') committed++
        else if (outcome === 'skipped') skipped++
      }
      setStatus(
        'success',
        \`Auto-built \${committed}/\${items.length} in this group.\`,
      )
    } finally {
      batchingOutputSingleton.release(outputKey)
    }
  }
`

const FIXED_FIXTURE = `
  async function autoBuildRun(): Promise<void> {
    const items = [...state.run.items]
    let committed = 0
    let skipped = 0
    let failed = 0
    try {
      for (const item of items) {
        const outcome = await autoBuildItem(item.id)
        if (outcome === 'committed') committed++
        else if (outcome === 'skipped') skipped++
        else failed++
      }
      setStatus(
        failed ? 'error' : 'success',
        \`Auto-build finished: \${committed}/\${items.length} committed.\`,
      )
    } finally {
      state.autoBuilding = false
    }
  }

  async function batchAutoBuild(outputKey: string): Promise<void> {
    const items = groupItems(outputKey)
    let committed = 0
    let skipped = 0
    let failed = 0
    try {
      for (const item of items) {
        const outcome = await autoBuildItem(item.id)
        if (outcome === 'committed') committed++
        else if (outcome === 'skipped') skipped++
        else failed++
      }
      setStatus(
        failed ? 'error' : 'success',
        \`Auto-built \${committed}/\${items.length} in this group.\`,
      )
    } finally {
      batchingOutputSingleton.release(outputKey)
    }
  }
`

const TALLIED_BUT_TONE_IGNORED_FIXTURE = `
  async function autoBuildRun(): Promise<void> {
    const items = [...state.run.items]
    let committed = 0
    let skipped = 0
    let failed = 0
    try {
      for (const item of items) {
        const outcome = await autoBuildItem(item.id)
        if (outcome === 'committed') committed++
        else if (outcome === 'skipped') skipped++
        else failed++
      }
      setStatus(
        'success',
        \`Auto-build finished: \${committed}/\${items.length} committed.\`,
      )
    } finally {
      state.autoBuilding = false
    }
  }

  async function batchAutoBuild(outputKey: string): Promise<void> {
    const items = groupItems(outputKey)
    let committed = 0
    let skipped = 0
    let failed = 0
    try {
      for (const item of items) {
        const outcome = await autoBuildItem(item.id)
        if (outcome === 'committed') committed++
        else if (outcome === 'skipped') skipped++
        else failed++
      }
      setStatus(
        'success',
        \`Auto-built \${committed}/\${items.length} in this group.\`,
      )
    } finally {
      batchingOutputSingleton.release(outputKey)
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

const buggyErrors = checkAutoBuildFailedSummaryGuard(BUGGY_FIXTURE)
assert.equal(
  buggyErrors.length,
  2,
  'expected the pre-fix shape (failed never tallied in either function) to ' +
    `raise 2 errors, got ${buggyErrors.length}: ${JSON.stringify(buggyErrors)}`,
)
assert.ok(buggyErrors.every((e) => e.includes('failed++')))

const fixedErrors = checkAutoBuildFailedSummaryGuard(FIXED_FIXTURE)
assert.equal(
  fixedErrors.length,
  0,
  `expected the fixed shape to raise no errors, got: ${JSON.stringify(fixedErrors)}`,
)

const talliedButIgnoredErrors = checkAutoBuildFailedSummaryGuard(
  TALLIED_BUT_TONE_IGNORED_FIXTURE,
)
assert.equal(
  talliedButIgnoredErrors.length,
  2,
  'expected the "tallied but tone still hardcoded success" shape to raise ' +
    `2 errors, got ${talliedButIgnoredErrors.length}: ` +
    JSON.stringify(talliedButIgnoredErrors),
)
assert.ok(
  talliedButIgnoredErrors.every((e) => e.includes('does not switch tone')),
)

const missingErrors = checkAutoBuildFailedSummaryGuard(MISSING_FIXTURE)
assert.equal(
  missingErrors.length,
  2,
  'expected 2 "function not found" violations when both target functions are absent',
)
assert.ok(missingErrors[0]!.includes('autoBuildRun'))
assert.ok(missingErrors[1]!.includes('batchAutoBuild'))

console.log(
  'Model Builder auto-build failed-summary guard checker verified: flags ' +
    'untallied failures, flags a tallied-but-ignored tone, clears the fixed ' +
    'shape, and flags both target functions being absent.',
)
