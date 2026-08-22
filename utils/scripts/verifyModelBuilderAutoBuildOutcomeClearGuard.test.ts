// /utils/scripts/verifyModelBuilderAutoBuildOutcomeClearGuard.test.ts
//
// Regression test for checkAutoBuildOutcomeClearGuard() in
// verifyModelBuilderAutoBuildOutcomeClearGuard.ts (model-builder/t-029,
// cycle 41). Exercises the real check against synthetic store-shaped
// fixtures covering: the pre-fix shape (item.error cleared/reverted in all
// six target functions but item.lastAutoBuildOutcome never touched), the
// fixed shape (every function also clears -- and the three setters also
// snapshot/restore -- lastAutoBuildOutcome), a partially-fixed shape (only
// some functions fixed, and one setter clears but forgets the revert half),
// and all six target functions absent.
import assert from 'node:assert/strict'

import { checkAutoBuildOutcomeClearGuard } from './verifyModelBuilderAutoBuildOutcomeClearGuard.js'

const BUGGY_FIXTURE = `
  function updatePitch(itemId: string, value: string): void {
    const item = findItem(itemId)
    if (!item) return
    const previousPitch = item.pitch
    const previousError = item.error
    const previousStages = { ...item.stages }
    item.pitch = value
    item.error = null
    markDownstreamStale(item, 'PITCH')
    pushItem(
      item,
      { stageStatuses: item.stages, pitch: item.pitch, error: null },
      { stage: 'PITCH' },
      () => {
        item.pitch = previousPitch
        item.error = previousError
        item.stages = previousStages
      },
    )
  }

  function updateFields(itemId: string, value: string): void {
    const item = findItem(itemId)
    if (!item) return
    const previousFieldsDraft = item.fieldsDraft
    const previousError = item.error
    const previousStages = { ...item.stages }
    item.fieldsDraft = value
    item.error = null
    pushItem(item, { fieldsDraft: item.fieldsDraft, error: null }, {}, () => {
      item.fieldsDraft = previousFieldsDraft
      item.error = previousError
      item.stages = previousStages
    })
  }

  function updatePrompt(itemId: string, value: string): void {
    const item = findItem(itemId)
    if (!item) return
    const previousPromptDraft = item.promptDraft
    const previousError = item.error
    item.promptDraft = value
    item.error = null
    pushItem(item, { promptDraft: item.promptDraft, error: null }, {}, () => {
      item.promptDraft = previousPromptDraft
      item.error = previousError
    })
  }

  async function generateItemAsset(itemId: string): Promise<boolean> {
    const item = findItem(itemId)
    generatingItemSingleton.claim(item.id)
    item.error = null
    item.stages.GENERATE_ASSETS = { status: 'in-progress' }
    return true
  }

  async function generateItemAssetAsync(itemId: string): Promise<boolean> {
    const item = findItem(itemId)
    item.error = null
    item.queueState = 'queued'
    return true
  }

  async function commitItem(itemId: string): Promise<boolean> {
    const item = findItem(itemId)
    committingItemSingleton.claim(item.id)
    item.error = null
    item.stages.COMMIT = { status: 'in-progress' }
    return true
  }
`

const FIXED_FIXTURE = `
  function updatePitch(itemId: string, value: string): void {
    const item = findItem(itemId)
    if (!item) return
    const previousPitch = item.pitch
    const previousError = item.error
    const previousLastAutoBuildOutcome = item.lastAutoBuildOutcome
    const previousStages = { ...item.stages }
    item.pitch = value
    item.error = null
    item.lastAutoBuildOutcome = null
    markDownstreamStale(item, 'PITCH')
    pushItem(
      item,
      { stageStatuses: item.stages, pitch: item.pitch, error: null },
      { stage: 'PITCH' },
      () => {
        item.pitch = previousPitch
        item.error = previousError
        item.lastAutoBuildOutcome = previousLastAutoBuildOutcome
        item.stages = previousStages
      },
    )
  }

  function updateFields(itemId: string, value: string): void {
    const item = findItem(itemId)
    if (!item) return
    const previousFieldsDraft = item.fieldsDraft
    const previousError = item.error
    const previousLastAutoBuildOutcome = item.lastAutoBuildOutcome
    item.fieldsDraft = value
    item.error = null
    item.lastAutoBuildOutcome = null
    pushItem(item, { fieldsDraft: item.fieldsDraft, error: null }, {}, () => {
      item.fieldsDraft = previousFieldsDraft
      item.error = previousError
      item.lastAutoBuildOutcome = previousLastAutoBuildOutcome
    })
  }

  function updatePrompt(itemId: string, value: string): void {
    const item = findItem(itemId)
    if (!item) return
    const previousPromptDraft = item.promptDraft
    const previousError = item.error
    const previousLastAutoBuildOutcome = item.lastAutoBuildOutcome
    item.promptDraft = value
    item.error = null
    item.lastAutoBuildOutcome = null
    pushItem(item, { promptDraft: item.promptDraft, error: null }, {}, () => {
      item.promptDraft = previousPromptDraft
      item.error = previousError
      item.lastAutoBuildOutcome = previousLastAutoBuildOutcome
    })
  }

  async function generateItemAsset(itemId: string): Promise<boolean> {
    const item = findItem(itemId)
    generatingItemSingleton.claim(item.id)
    item.error = null
    item.lastAutoBuildOutcome = null
    item.stages.GENERATE_ASSETS = { status: 'in-progress' }
    return true
  }

  async function generateItemAssetAsync(itemId: string): Promise<boolean> {
    const item = findItem(itemId)
    item.error = null
    item.lastAutoBuildOutcome = null
    item.queueState = 'queued'
    return true
  }

  async function commitItem(itemId: string): Promise<boolean> {
    const item = findItem(itemId)
    committingItemSingleton.claim(item.id)
    item.error = null
    item.lastAutoBuildOutcome = null
    item.stages.COMMIT = { status: 'in-progress' }
    return true
  }
`

const PARTIALLY_FIXED_FIXTURE = `
  function updatePitch(itemId: string, value: string): void {
    const item = findItem(itemId)
    const previousError = item.error
    item.error = null
    item.lastAutoBuildOutcome = null
    pushItem(item, { error: null }, {}, () => {
      item.error = previousError
    })
  }

  function updateFields(itemId: string, value: string): void {
    const item = findItem(itemId)
    const previousError = item.error
    const previousLastAutoBuildOutcome = item.lastAutoBuildOutcome
    item.error = null
    item.lastAutoBuildOutcome = null
    pushItem(item, { error: null }, {}, () => {
      item.error = previousError
      item.lastAutoBuildOutcome = previousLastAutoBuildOutcome
    })
  }

  function updatePrompt(itemId: string, value: string): void {
    const item = findItem(itemId)
    item.error = null
  }

  async function generateItemAsset(itemId: string): Promise<boolean> {
    const item = findItem(itemId)
    item.error = null
    item.lastAutoBuildOutcome = null
    return true
  }

  async function generateItemAssetAsync(itemId: string): Promise<boolean> {
    const item = findItem(itemId)
    item.error = null
    return true
  }

  async function commitItem(itemId: string): Promise<boolean> {
    const item = findItem(itemId)
    item.error = null
    item.lastAutoBuildOutcome = null
    return true
  }
`

const MISSING_FIXTURE = `
  function approveStage(itemId: string, stageKey: BuildStageKey): void {
    const item = findItem(itemId)
    if (!item) return
    item.stages[stageKey] = { status: 'approved' }
  }
`

const buggyErrors = checkAutoBuildOutcomeClearGuard(BUGGY_FIXTURE)
assert.equal(
  buggyErrors.length,
  9,
  'expected the pre-fix shape to raise 2 violations each for the three ' +
    'setters (never clears, never snapshots/restores) plus 1 each for the ' +
    `three retry functions (never clears) = 9, got ${buggyErrors.length}: ` +
    JSON.stringify(buggyErrors),
)

const fixedErrors = checkAutoBuildOutcomeClearGuard(FIXED_FIXTURE)
assert.equal(
  fixedErrors.length,
  0,
  `expected the fixed shape to raise no errors, got: ${JSON.stringify(fixedErrors)}`,
)

const partialErrors = checkAutoBuildOutcomeClearGuard(PARTIALLY_FIXED_FIXTURE)
assert.equal(
  partialErrors.length,
  4,
  'expected updatePitch (clears but never snapshots/restores) to raise 1, ' +
    'updatePrompt (never touches lastAutoBuildOutcome at all) to raise 2 ' +
    '(never-clears + never-snapshots/restores), and generateItemAssetAsync ' +
    `(never clears) to raise 1 = 4 total, got ${partialErrors.length}: ` +
    JSON.stringify(partialErrors),
)
assert.ok(
  partialErrors.some(
    (e) => e.includes('updatePitch') && e.includes('snapshot and restore'),
  ),
)
assert.ok(
  !partialErrors.some(
    (e) => e.includes('updatePitch') && e.includes('never clears'),
  ),
  'updatePitch does clear lastAutoBuildOutcome in this fixture -- only the snapshot/restore half should be flagged',
)
assert.ok(
  partialErrors.some(
    (e) => e.includes('updatePrompt') && e.includes('never clears'),
  ),
)
assert.ok(
  partialErrors.some(
    (e) => e.includes('updatePrompt') && e.includes('snapshot and restore'),
  ),
)
assert.ok(
  partialErrors.some(
    (e) => e.includes('generateItemAssetAsync') && e.includes('never clears'),
  ),
)
assert.ok(
  !partialErrors.some((e) => e.includes('updateFields')),
  'updateFields is fully fixed in this fixture and should not be flagged',
)
assert.ok(
  !partialErrors.some(
    (e) =>
      e.includes('generateItemAsset(') && !e.includes('generateItemAssetAsync'),
  ),
  'generateItemAsset is fully fixed in this fixture and should not be flagged',
)
assert.ok(
  !partialErrors.some((e) => e.includes('commitItem')),
  'commitItem is fully fixed in this fixture and should not be flagged',
)

const missingErrors = checkAutoBuildOutcomeClearGuard(MISSING_FIXTURE)
assert.equal(
  missingErrors.length,
  6,
  'expected 6 "function not found" violations when all target functions are absent',
)
for (const name of [
  'updatePitch',
  'updateFields',
  'updatePrompt',
  'generateItemAsset',
  'generateItemAssetAsync',
  'commitItem',
]) {
  assert.ok(
    missingErrors.some((e) => e.includes(name)),
    `expected a violation naming ${name}`,
  )
}

console.log(
  'Model Builder auto-build outcome-clear guard checker verified: flags ' +
    'item.lastAutoBuildOutcome never being cleared (and, for the three ' +
    'setters, never being snapshotted/restored) in each target function ' +
    'independently, clears the fixed shape, and flags all six target ' +
    'functions being absent.',
)
