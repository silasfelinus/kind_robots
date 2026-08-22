// /utils/scripts/verifyModelBuilderStaleStatusClearGuard.test.ts
//
// Regression test for checkStaleStatusClearGuard() in
// verifyModelBuilderStaleStatusClearGuard.ts (model-builder/t-029, cycle 42).
// Exercises the real check against synthetic store-shaped fixtures covering:
// the pre-fix shape (none of the eight target functions call clearStatus()),
// the fixed shape (every function does), a partially-fixed shape (some
// fixed, some not), and all eight target functions absent.
import assert from 'node:assert/strict'

import { checkStaleStatusClearGuard } from './verifyModelBuilderStaleStatusClearGuard.js'

const BUGGY_FIXTURE = `
  function approveStage(itemId: string, stageKey: BuildStageKey): void {
    const item = findItem(itemId)
    if (!item) return
    const previousStages = { ...item.stages }
    item.stages[stageKey] = { status: 'approved' }
    pushItem(item, { stageStatuses: item.stages }, { stage: stageKey }, () => {
      item.stages = previousStages
    })
  }

  function rejectStage(itemId: string, stageKey: BuildStageKey, note?: string): void {
    const item = findItem(itemId)
    if (!item) return
    const previousStages = { ...item.stages }
    item.stages[stageKey] = { status: 'rejected', note }
    markDownstreamStale(item, stageKey)
    pushItem(item, { stageStatuses: item.stages }, { stage: stageKey }, () => {
      item.stages = previousStages
    })
  }

  function reopenStage(itemId: string, stageKey: BuildStageKey): void {
    const item = findItem(itemId)
    if (!item) return
    const previousStages = { ...item.stages }
    item.stages[stageKey] = { status: 'ready' }
    markDownstreamStale(item, stageKey)
    pushItem(item, { stageStatuses: item.stages }, { stage: stageKey }, () => {
      item.stages = previousStages
    })
  }

  function updatePitch(itemId: string, value: string): void {
    const item = findItem(itemId)
    if (!item) return
    item.pitch = value
    pushItem(item, { pitch: item.pitch }, { stage: 'PITCH' }, () => {})
  }

  function updateFields(itemId: string, value: string): void {
    const item = findItem(itemId)
    if (!item) return
    item.fieldsDraft = value
    pushItem(item, { fieldsDraft: item.fieldsDraft }, {}, () => {})
  }

  function updatePrompt(itemId: string, value: string): void {
    const item = findItem(itemId)
    if (!item) return
    item.promptDraft = value
    pushItem(item, { promptDraft: item.promptDraft }, {}, () => {})
  }

  async function batchSetField(outputKey: string, fieldKey: string, value: string): Promise<void> {
    const entries = []
    batchingOutputSingleton.claim(outputKey)
    try {
      const { ok, failedIds } = await batchPushItems(entries)
    } finally {
      batchingOutputSingleton.release(outputKey)
    }
  }

  async function batchApproveStage(outputKey: string, stageKey: BuildStageKey): Promise<void> {
    const entries = []
    batchingOutputSingleton.claim(outputKey)
    try {
      const { ok, failedIds } = await batchPushItems(entries)
    } finally {
      batchingOutputSingleton.release(outputKey)
    }
  }
`

const FIXED_FIXTURE = `
  function approveStage(itemId: string, stageKey: BuildStageKey): void {
    const item = findItem(itemId)
    if (!item) return
    const previousStages = { ...item.stages }
    item.stages[stageKey] = { status: 'approved' }
    clearStatus()
    pushItem(item, { stageStatuses: item.stages }, { stage: stageKey }, () => {
      item.stages = previousStages
    })
  }

  function rejectStage(itemId: string, stageKey: BuildStageKey, note?: string): void {
    const item = findItem(itemId)
    if (!item) return
    const previousStages = { ...item.stages }
    item.stages[stageKey] = { status: 'rejected', note }
    markDownstreamStale(item, stageKey)
    clearStatus()
    pushItem(item, { stageStatuses: item.stages }, { stage: stageKey }, () => {
      item.stages = previousStages
    })
  }

  function reopenStage(itemId: string, stageKey: BuildStageKey): void {
    const item = findItem(itemId)
    if (!item) return
    const previousStages = { ...item.stages }
    item.stages[stageKey] = { status: 'ready' }
    markDownstreamStale(item, stageKey)
    clearStatus()
    pushItem(item, { stageStatuses: item.stages }, { stage: stageKey }, () => {
      item.stages = previousStages
    })
  }

  function updatePitch(itemId: string, value: string): void {
    const item = findItem(itemId)
    if (!item) return
    item.pitch = value
    clearStatus()
    pushItem(item, { pitch: item.pitch }, { stage: 'PITCH' }, () => {})
  }

  function updateFields(itemId: string, value: string): void {
    const item = findItem(itemId)
    if (!item) return
    item.fieldsDraft = value
    clearStatus()
    pushItem(item, { fieldsDraft: item.fieldsDraft }, {}, () => {})
  }

  function updatePrompt(itemId: string, value: string): void {
    const item = findItem(itemId)
    if (!item) return
    item.promptDraft = value
    clearStatus()
    pushItem(item, { promptDraft: item.promptDraft }, {}, () => {})
  }

  async function batchSetField(outputKey: string, fieldKey: string, value: string): Promise<void> {
    const entries = []
    batchingOutputSingleton.claim(outputKey)
    clearStatus()
    try {
      const { ok, failedIds } = await batchPushItems(entries)
    } finally {
      batchingOutputSingleton.release(outputKey)
    }
  }

  async function batchApproveStage(outputKey: string, stageKey: BuildStageKey): Promise<void> {
    const entries = []
    batchingOutputSingleton.claim(outputKey)
    clearStatus()
    try {
      const { ok, failedIds } = await batchPushItems(entries)
    } finally {
      batchingOutputSingleton.release(outputKey)
    }
  }
`

const PARTIALLY_FIXED_FIXTURE = `
  function approveStage(itemId: string, stageKey: BuildStageKey): void {
    const item = findItem(itemId)
    if (!item) return
    item.stages[stageKey] = { status: 'approved' }
    clearStatus()
    pushItem(item, { stageStatuses: item.stages }, { stage: stageKey }, () => {})
  }

  function rejectStage(itemId: string, stageKey: BuildStageKey, note?: string): void {
    const item = findItem(itemId)
    if (!item) return
    item.stages[stageKey] = { status: 'rejected', note }
    pushItem(item, { stageStatuses: item.stages }, { stage: stageKey }, () => {})
  }

  function reopenStage(itemId: string, stageKey: BuildStageKey): void {
    const item = findItem(itemId)
    if (!item) return
    item.stages[stageKey] = { status: 'ready' }
    clearStatus()
    pushItem(item, { stageStatuses: item.stages }, { stage: stageKey }, () => {})
  }

  function updatePitch(itemId: string, value: string): void {
    const item = findItem(itemId)
    if (!item) return
    item.pitch = value
    clearStatus()
    pushItem(item, { pitch: item.pitch }, { stage: 'PITCH' }, () => {})
  }

  function updateFields(itemId: string, value: string): void {
    const item = findItem(itemId)
    if (!item) return
    item.fieldsDraft = value
    clearStatus()
    pushItem(item, { fieldsDraft: item.fieldsDraft }, {}, () => {})
  }

  function updatePrompt(itemId: string, value: string): void {
    const item = findItem(itemId)
    if (!item) return
    item.promptDraft = value
    clearStatus()
    pushItem(item, { promptDraft: item.promptDraft }, {}, () => {})
  }

  async function batchSetField(outputKey: string, fieldKey: string, value: string): Promise<void> {
    const entries = []
    batchingOutputSingleton.claim(outputKey)
    clearStatus()
    try {
      const { ok, failedIds } = await batchPushItems(entries)
    } finally {
      batchingOutputSingleton.release(outputKey)
    }
  }

  async function batchApproveStage(outputKey: string, stageKey: BuildStageKey): Promise<void> {
    const entries = []
    batchingOutputSingleton.claim(outputKey)
    try {
      const { ok, failedIds } = await batchPushItems(entries)
    } finally {
      batchingOutputSingleton.release(outputKey)
    }
  }
`

const MISSING_FIXTURE = `
  function unrelatedHelper(itemId: string): void {
    const item = findItem(itemId)
  }
`

const buggyErrors = checkStaleStatusClearGuard(BUGGY_FIXTURE)
assert.equal(
  buggyErrors.length,
  8,
  `expected all 8 target functions to be flagged in the pre-fix shape, got ${buggyErrors.length}: ` +
    JSON.stringify(buggyErrors),
)

const fixedErrors = checkStaleStatusClearGuard(FIXED_FIXTURE)
assert.equal(
  fixedErrors.length,
  0,
  `expected the fixed shape to raise no errors, got: ${JSON.stringify(fixedErrors)}`,
)

const partialErrors = checkStaleStatusClearGuard(PARTIALLY_FIXED_FIXTURE)
assert.equal(
  partialErrors.length,
  2,
  `expected rejectStage and batchApproveStage (missing clearStatus()) to be flagged = 2, got ${partialErrors.length}: ` +
    JSON.stringify(partialErrors),
)
assert.ok(partialErrors.some((e) => e.includes('rejectStage')))
assert.ok(partialErrors.some((e) => e.includes('batchApproveStage')))
assert.ok(
  !partialErrors.some((e) => e.includes('approveStage(')),
  'approveStage is fixed in this fixture and should not be flagged',
)
assert.ok(
  !partialErrors.some((e) => e.includes('updateFields')),
  'updateFields is fixed in this fixture and should not be flagged',
)
assert.ok(
  !partialErrors.some((e) => e.includes('batchSetField')),
  'batchSetField is fixed in this fixture and should not be flagged',
)

const missingErrors = checkStaleStatusClearGuard(MISSING_FIXTURE)
assert.equal(
  missingErrors.length,
  8,
  'expected 8 "function not found" violations when all target functions are absent',
)
for (const name of [
  'approveStage',
  'rejectStage',
  'reopenStage',
  'updatePitch',
  'updateFields',
  'updatePrompt',
  'batchSetField',
  'batchApproveStage',
]) {
  assert.ok(
    missingErrors.some((e) => e.includes(name)),
    `expected a violation naming ${name}`,
  )
}

console.log(
  'Model Builder stale status-banner clear guard checker verified: flags ' +
    'clearStatus() never being called in each target function ' +
    'independently, clears the fixed shape, and flags all eight target ' +
    'functions being absent.',
)
