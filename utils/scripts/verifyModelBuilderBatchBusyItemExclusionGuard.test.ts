// /utils/scripts/verifyModelBuilderBatchBusyItemExclusionGuard.test.ts
//
// Regression test for checkBatchBusyItemExclusionGuard() in
// verifyModelBuilderBatchBusyItemExclusionGuard.ts (model-builder/t-029,
// cycle 30). Exercises the real check against synthetic store-shaped
// fixtures covering: the pre-fix shape (none of the three functions skip a
// busy item), the fixed shape (all three), a partial fix that leaves one
// function behind, and all three target functions being absent entirely.
import assert from 'node:assert/strict'

import { checkBatchBusyItemExclusionGuard } from './verifyModelBuilderBatchBusyItemExclusionGuard.js'

const BUGGY_FIXTURE = `
  async function batchDraftField(
    outputKey: string,
    field: DraftField,
    opts?: { onlyEmpty?: boolean },
  ): Promise<void> {
    const items = groupItems(outputKey)
    if (!items.length) return
    if (state.autoBuilding) return
    batchingOutputSingleton.claim(outputKey)
    try {
      for (const item of items) {
        if (!isStageEditable(item, stageKey)) continue
        const ok = await draftText(item.id, field)
      }
    } finally {
      batchingOutputSingleton.release(outputKey)
    }
  }

  async function batchSetField(
    outputKey: string,
    fieldKey: string,
    value: string,
  ): Promise<void> {
    if (state.autoBuilding) return
    const items = groupItems(outputKey)
    batchingOutputSingleton.claim(outputKey)
    try {
      for (const item of items) {
        if (!isStageEditable(item, 'FIELDS_AND_PROMPTS')) continue
        entries.push({ item, payload: { stageStatuses: item.stages } })
      }
      const { ok, failedIds } = await batchPushItems(entries)
    } finally {
      batchingOutputSingleton.release(outputKey)
    }
  }

  async function batchApproveStage(
    outputKey: string,
    stageKey: BuildStageKey,
  ): Promise<void> {
    if (state.autoBuilding) return
    batchingOutputSingleton.claim(outputKey)
    try {
      for (const item of groupItems(outputKey)) {
        if (item.stages[stageKey].status === 'locked') continue
        entries.push({ item, payload: { stageStatuses: item.stages } })
      }
      const { ok, failedIds } = await batchPushItems(entries)
    } finally {
      batchingOutputSingleton.release(outputKey)
    }
  }
`

const FIXED_FIXTURE = `
  async function batchDraftField(
    outputKey: string,
    field: DraftField,
    opts?: { onlyEmpty?: boolean },
  ): Promise<void> {
    const items = groupItems(outputKey)
    if (!items.length) return
    if (state.autoBuilding) return
    batchingOutputSingleton.claim(outputKey)
    try {
      for (const item of items) {
        if (!isStageEditable(item, stageKey)) continue
        if (isItemManualActionInFlight(item.id)) continue
        const ok = await draftText(item.id, field)
      }
    } finally {
      batchingOutputSingleton.release(outputKey)
    }
  }

  async function batchSetField(
    outputKey: string,
    fieldKey: string,
    value: string,
  ): Promise<void> {
    if (state.autoBuilding) return
    const items = groupItems(outputKey)
    batchingOutputSingleton.claim(outputKey)
    try {
      for (const item of items) {
        if (!isStageEditable(item, 'FIELDS_AND_PROMPTS')) continue
        if (isItemManualActionInFlight(item.id)) continue
        entries.push({ item, payload: { stageStatuses: item.stages } })
      }
      const { ok, failedIds } = await batchPushItems(entries)
    } finally {
      batchingOutputSingleton.release(outputKey)
    }
  }

  async function batchApproveStage(
    outputKey: string,
    stageKey: BuildStageKey,
  ): Promise<void> {
    if (state.autoBuilding) return
    batchingOutputSingleton.claim(outputKey)
    try {
      for (const item of groupItems(outputKey)) {
        if (item.stages[stageKey].status === 'locked') continue
        if (isItemManualActionInFlight(item.id)) continue
        entries.push({ item, payload: { stageStatuses: item.stages } })
      }
      const { ok, failedIds } = await batchPushItems(entries)
    } finally {
      batchingOutputSingleton.release(outputKey)
    }
  }
`

const PARTIAL_FIX_FIXTURE = `
  async function batchDraftField(
    outputKey: string,
    field: DraftField,
    opts?: { onlyEmpty?: boolean },
  ): Promise<void> {
    const items = groupItems(outputKey)
    if (!items.length) return
    if (state.autoBuilding) return
    batchingOutputSingleton.claim(outputKey)
    try {
      for (const item of items) {
        if (!isStageEditable(item, stageKey)) continue
        if (isItemManualActionInFlight(item.id)) continue
        const ok = await draftText(item.id, field)
      }
    } finally {
      batchingOutputSingleton.release(outputKey)
    }
  }

  async function batchSetField(
    outputKey: string,
    fieldKey: string,
    value: string,
  ): Promise<void> {
    if (state.autoBuilding) return
    const items = groupItems(outputKey)
    batchingOutputSingleton.claim(outputKey)
    try {
      for (const item of items) {
        if (!isStageEditable(item, 'FIELDS_AND_PROMPTS')) continue
        if (isItemManualActionInFlight(item.id)) continue
        entries.push({ item, payload: { stageStatuses: item.stages } })
      }
      const { ok, failedIds } = await batchPushItems(entries)
    } finally {
      batchingOutputSingleton.release(outputKey)
    }
  }

  async function batchApproveStage(
    outputKey: string,
    stageKey: BuildStageKey,
  ): Promise<void> {
    if (state.autoBuilding) return
    batchingOutputSingleton.claim(outputKey)
    try {
      for (const item of groupItems(outputKey)) {
        if (item.stages[stageKey].status === 'locked') continue
        entries.push({ item, payload: { stageStatuses: item.stages } })
      }
      const { ok, failedIds } = await batchPushItems(entries)
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

const buggyErrors = checkBatchBusyItemExclusionGuard(BUGGY_FIXTURE)
assert.equal(
  buggyErrors.length,
  3,
  'expected the pre-fix shape to raise exactly 3 per-function violations ' +
    `(one per batch function), got ${buggyErrors.length}: ` +
    JSON.stringify(buggyErrors),
)
for (const name of ['batchDraftField', 'batchSetField', 'batchApproveStage']) {
  assert.ok(
    buggyErrors.some((e) => e.startsWith(`${name}()`)),
    `expected an error for ${name}() not skipping a busy item`,
  )
}

const fixedErrors = checkBatchBusyItemExclusionGuard(FIXED_FIXTURE)
assert.equal(
  fixedErrors.length,
  0,
  `expected the fixed shape to raise no errors, got: ${JSON.stringify(fixedErrors)}`,
)

const partialErrors = checkBatchBusyItemExclusionGuard(PARTIAL_FIX_FIXTURE)
assert.equal(
  partialErrors.length,
  1,
  'expected the partial-fix shape (batchApproveStage left behind) to ' +
    `raise exactly 1 error, got ${partialErrors.length}: ` +
    JSON.stringify(partialErrors),
)
assert.ok(partialErrors[0]!.startsWith('batchApproveStage()'))

const missingErrors = checkBatchBusyItemExclusionGuard(MISSING_FIXTURE)
assert.equal(
  missingErrors.length,
  3,
  'expected 3 "function not found" violations when all three target ' +
    `functions are absent, got ${missingErrors.length}: ${JSON.stringify(missingErrors)}`,
)

console.log(
  'Model Builder batch busy-item exclusion guard checker verified: flags ' +
    'each batch function missing its isItemManualActionInFlight skip, ' +
    'clears the fixed shape, flags a partial fix that leaves one function ' +
    'behind, and flags all three target functions being absent.',
)
