// /utils/scripts/verifyModelBuilderAutoBuildOutcomePersistenceGuard.test.ts
//
// Regression test for checkAutoBuildOutcomePersistenceGuard() in
// verifyModelBuilderAutoBuildOutcomePersistenceGuard.ts (model-builder/t-029).
// Exercises the real check against synthetic store-shaped fixtures covering:
// the pre-fix shape (outcome tallied but never mirrored onto the item,
// pre-committed items never marked either), the fixed shape (both
// functions), a shape that persists the attempted outcome but forgets the
// pre-committed branch, and both target functions being absent entirely.
import assert from 'node:assert/strict'

import { checkAutoBuildOutcomePersistenceGuard } from './verifyModelBuilderAutoBuildOutcomePersistenceGuard.js'

const BUGGY_FIXTURE = `
  async function autoBuildRun(): Promise<void> {
    const items = [...state.run.items]
    let committed = 0
    let skipped = 0
    let failed = 0
    try {
      for (const item of items) {
        if (item.stages.COMMIT.status === 'approved') {
          committed++
          continue
        }
        const outcome = await autoBuildItem(item.id)
        if (outcome === 'committed') committed++
        else if (outcome === 'skipped') skipped++
        else failed++
      }
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
        if (item.stages.COMMIT.status === 'approved') {
          committed++
          continue
        }
        const outcome = await autoBuildItem(item.id)
        if (outcome === 'committed') committed++
        else if (outcome === 'skipped') skipped++
        else failed++
      }
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
        if (item.stages.COMMIT.status === 'approved') {
          committed++
          item.lastAutoBuildOutcome = 'committed'
          continue
        }
        const outcome = await autoBuildItem(item.id)
        item.lastAutoBuildOutcome = outcome
        if (outcome === 'committed') committed++
        else if (outcome === 'skipped') skipped++
        else failed++
      }
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
        if (item.stages.COMMIT.status === 'approved') {
          committed++
          item.lastAutoBuildOutcome = 'committed'
          continue
        }
        const outcome = await autoBuildItem(item.id)
        item.lastAutoBuildOutcome = outcome
        if (outcome === 'committed') committed++
        else if (outcome === 'skipped') skipped++
        else failed++
      }
    } finally {
      batchingOutputSingleton.release(outputKey)
    }
  }
`

const MISSING_PRECOMMITTED_FIXTURE = `
  async function autoBuildRun(): Promise<void> {
    const items = [...state.run.items]
    let committed = 0
    let skipped = 0
    let failed = 0
    try {
      for (const item of items) {
        if (item.stages.COMMIT.status === 'approved') {
          committed++
          continue
        }
        const outcome = await autoBuildItem(item.id)
        item.lastAutoBuildOutcome = outcome
        if (outcome === 'committed') committed++
        else if (outcome === 'skipped') skipped++
        else failed++
      }
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
        if (item.stages.COMMIT.status === 'approved') {
          committed++
          continue
        }
        const outcome = await autoBuildItem(item.id)
        item.lastAutoBuildOutcome = outcome
        if (outcome === 'committed') committed++
        else if (outcome === 'skipped') skipped++
        else failed++
      }
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

const buggyErrors = checkAutoBuildOutcomePersistenceGuard(BUGGY_FIXTURE)
assert.equal(
  buggyErrors.length,
  4,
  'expected the pre-fix shape (neither assignment present, in either ' +
    `function) to raise 4 errors, got ${buggyErrors.length}: ` +
    JSON.stringify(buggyErrors),
)

const fixedErrors = checkAutoBuildOutcomePersistenceGuard(FIXED_FIXTURE)
assert.equal(
  fixedErrors.length,
  0,
  `expected the fixed shape to raise no errors, got: ${JSON.stringify(fixedErrors)}`,
)

const missingPrecommittedErrors = checkAutoBuildOutcomePersistenceGuard(
  MISSING_PRECOMMITTED_FIXTURE,
)
assert.equal(
  missingPrecommittedErrors.length,
  2,
  'expected the "attempted outcome persisted, pre-committed branch not" ' +
    `shape to raise 2 errors, got ${missingPrecommittedErrors.length}: ` +
    JSON.stringify(missingPrecommittedErrors),
)
assert.ok(
  missingPrecommittedErrors.every((e) => e.includes('already committed')),
)

const missingErrors = checkAutoBuildOutcomePersistenceGuard(MISSING_FIXTURE)
assert.equal(
  missingErrors.length,
  2,
  'expected 2 "function not found" violations when both target functions are absent',
)
assert.ok(missingErrors[0]!.includes('autoBuildRun'))
assert.ok(missingErrors[1]!.includes('batchAutoBuild'))

console.log(
  'Model Builder auto-build outcome-persistence guard checker verified: ' +
    'flags a non-persisted attempted outcome, flags a missing pre-committed ' +
    'branch assignment, clears the fixed shape, and flags both target ' +
    'functions being absent.',
)
