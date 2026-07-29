// /utils/scripts/verifyModelBuilderDraftApprovalGuard.test.ts
//
// Regression test for checkDraftApprovalGuard() in
// verifyModelBuilderDraftApprovalGuard.ts (model-builder/t-029). Exercises
// the real check against synthetic store-shaped fixtures covering: the
// pre-fix shape (no isStageEditable check between the /api/suggest response
// landing and the draft being applied via updatePitch/updateFields/
// updatePrompt -- the exact bug found by manual read-through), and the fixed
// shape.
import assert from 'node:assert/strict'

import { checkDraftApprovalGuard } from './verifyModelBuilderDraftApprovalGuard.js'

const BUGGY_FIXTURE = `
  async function draftText(
    itemId: string,
    field: DraftField,
    instruction?: string,
  ): Promise<boolean> {
    const item = findItem(itemId)
    if (!item || !state.run) return false

    const current =
      field === 'pitch' ? item.pitch : field === 'fields' ? item.fieldsDraft : item.promptDraft

    draftingFieldSingleton.claim({ itemId, field })
    clearStatus()

    try {
      const result = await performFetch('/api/suggest', { method: 'POST' }, 2, 60_000)

      if (!result.success || !result.data?.value) {
        throw new Error(result.message || 'The model returned nothing useful.')
      }

      const value = result.data.value.trim()

      const liveValue =
        field === 'pitch' ? item.pitch : field === 'fields' ? item.fieldsDraft : item.promptDraft
      if (liveValue !== current) {
        setStatus('error', 'edited while drafting')
        return false
      }

      if (field === 'pitch') updatePitch(itemId, value)
      else if (field === 'fields') updateFields(itemId, value)
      else updatePrompt(itemId, value)

      setStatus('success', 'drafted')
      return true
    } catch (error) {
      handleError(error, 'drafting model builder text')
      return false
    } finally {
      draftingFieldSingleton.release({ itemId, field })
    }
  }
`

const FIXED_FIXTURE = `
  async function draftText(
    itemId: string,
    field: DraftField,
    instruction?: string,
  ): Promise<boolean> {
    const item = findItem(itemId)
    if (!item || !state.run) return false

    const current =
      field === 'pitch' ? item.pitch : field === 'fields' ? item.fieldsDraft : item.promptDraft

    draftingFieldSingleton.claim({ itemId, field })
    clearStatus()

    try {
      const result = await performFetch('/api/suggest', { method: 'POST' }, 2, 60_000)

      if (!result.success || !result.data?.value) {
        throw new Error(result.message || 'The model returned nothing useful.')
      }

      const value = result.data.value.trim()

      const liveValue =
        field === 'pitch' ? item.pitch : field === 'fields' ? item.fieldsDraft : item.promptDraft
      if (liveValue !== current) {
        setStatus('error', 'edited while drafting')
        return false
      }

      if (!isStageEditable(item, stageForDraftField(field))) {
        setStatus('error', 'approved while drafting')
        return false
      }

      if (field === 'pitch') updatePitch(itemId, value)
      else if (field === 'fields') updateFields(itemId, value)
      else updatePrompt(itemId, value)

      setStatus('success', 'drafted')
      return true
    } catch (error) {
      handleError(error, 'drafting model builder text')
      return false
    } finally {
      draftingFieldSingleton.release({ itemId, field })
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

const buggyErrors = checkDraftApprovalGuard(BUGGY_FIXTURE)
assert.equal(
  buggyErrors.length,
  1,
  `expected the pre-fix shape (missing isStageEditable check) to raise 1 ` +
    `error, got ${buggyErrors.length}: ${JSON.stringify(buggyErrors)}`,
)
assert.ok(
  buggyErrors[0]!.includes('isStageEditable'),
  'expected a violation naming the missing isStageEditable guard',
)

const fixedErrors = checkDraftApprovalGuard(FIXED_FIXTURE)
assert.equal(
  fixedErrors.length,
  0,
  `expected the fixed shape to raise no errors, got: ${JSON.stringify(fixedErrors)}`,
)

const missingFnErrors = checkDraftApprovalGuard(MISSING_FIXTURE)
assert.equal(
  missingFnErrors.length,
  1,
  'expected a single "function not found" violation when draftText is absent',
)
assert.ok(missingFnErrors[0]!.includes('draftText'))

console.log(
  'Model Builder draft approval guard checker verified: flags the pre-fix ' +
    'shape (missing post-response isStageEditable check), clears the fixed ' +
    'shape, and flags draftText being absent entirely.',
)
