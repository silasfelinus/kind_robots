// /utils/scripts/verifyModelBuilderAutoBuildDraftGate.test.ts
//
// Regression test for checkAutoBuildDraftGate() in
// verifyModelBuilderAutoBuildDraftGate.ts (model-builder/t-029). Exercises
// the real check against synthetic store-shaped fixtures covering: the
// pre-fix shape (draftText's result discarded, approveStage called
// unconditionally -- the exact bug found by manual read-through), the fixed
// shape (result captured and gated), the same-item reentrancy guard, and
// autoBuildItem being absent entirely.
import assert from 'node:assert/strict'

import { checkAutoBuildDraftGate } from './verifyModelBuilderAutoBuildDraftGate.js'

const BUGGY_FIXTURE = `
  async function autoBuildItem(itemId: string): Promise<boolean> {
    const item = findItem(itemId)
    if (!item || !state.run) return false

    const isAsset = item.action === 'ASSET_ONLY'
    const wantArt = state.includeArt && item.generation === 'image'

    autoBuildingItemSingleton.claim(item.id)
    try {
      if (item.stages.PITCH.status !== 'approved') {
        if (!item.pitch.trim()) await draftText(itemId, 'pitch')
        approveStage(itemId, 'PITCH')
      }

      if (item.stages.FIELDS_AND_PROMPTS.status !== 'approved') {
        if (!isAsset) await draftText(itemId, 'fields')
        if (wantArt) await draftText(itemId, 'artPrompt')
        approveStage(itemId, 'FIELDS_AND_PROMPTS')
      }

      if (item.stages.GENERATE_ASSETS.status !== 'approved') {
        if (wantArt) {
          const generated = await generateItemAsset(itemId)
          if (!generated) return false
        }
        approveStage(itemId, 'GENERATE_ASSETS')
      }

      if (item.stages.COMMIT.status !== 'approved') {
        return await commitItem(itemId)
      }
      return true
    } finally {
      autoBuildingItemSingleton.release(item.id)
    }
  }
`

const FIXED_FIXTURE = `
  async function autoBuildItem(itemId: string): Promise<boolean> {
    const item = findItem(itemId)
    if (!item || !state.run) return false

    if (state.autoBuildingItemId === item.id) return false

    if (
      state.generatingItemId === item.id ||
      state.committingItemId === item.id ||
      draftingField.value?.itemId === item.id
    ) {
      return false
    }

    const isAsset = item.action === 'ASSET_ONLY'
    const wantArt = state.includeArt && item.generation === 'image'

    autoBuildingItemSingleton.claim(item.id)
    try {
      if (item.stages.PITCH.status !== 'approved') {
        if (!item.pitch.trim()) {
          const drafted = await draftText(itemId, 'pitch')
          if (!drafted) return false
        }
        approveStage(itemId, 'PITCH')
      }

      if (item.stages.FIELDS_AND_PROMPTS.status !== 'approved') {
        if (!isAsset) {
          const drafted = await draftText(itemId, 'fields')
          if (!drafted) return false
        }
        if (wantArt) {
          const drafted = await draftText(itemId, 'artPrompt')
          if (!drafted) return false
        }
        approveStage(itemId, 'FIELDS_AND_PROMPTS')
      }

      if (item.stages.GENERATE_ASSETS.status !== 'approved') {
        if (wantArt) {
          const generated = await generateItemAsset(itemId)
          if (!generated) return false
        }
        approveStage(itemId, 'GENERATE_ASSETS')
      }

      if (item.stages.COMMIT.status !== 'approved') {
        return await commitItem(itemId)
      }
      return true
    } finally {
      autoBuildingItemSingleton.release(item.id)
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

const buggyErrors = checkAutoBuildDraftGate(BUGGY_FIXTURE)
assert.equal(
  buggyErrors.length,
  5,
  'expected the pre-fix shape (three discarded draftText results plus the ' +
    'missing same-item reentrancy guard plus the missing manual-action-in-' +
    `flight guard) to raise 5 errors, got ${buggyErrors.length}: ` +
    JSON.stringify(buggyErrors),
)
assert.ok(
  buggyErrors.some((e) => e.includes("'pitch'") && e.includes('discarded')),
  'expected a violation for the discarded pitch draft result',
)
assert.ok(
  buggyErrors.some((e) => e.includes("'fields'") && e.includes('discarded')),
  'expected a violation for the discarded fields draft result',
)
assert.ok(
  buggyErrors.some((e) => e.includes("'artPrompt'") && e.includes('discarded')),
  'expected a violation for the discarded artPrompt draft result',
)
assert.ok(
  buggyErrors.some((e) => e.includes('autoBuildingItemId')),
  'expected a violation for the missing same-item reentrancy guard',
)
assert.ok(
  buggyErrors.some(
    (e) => e.includes('generatingItemId') && e.includes('manual'),
  ),
  'expected a violation for the missing manual-action-in-flight guard',
)

const fixedErrors = checkAutoBuildDraftGate(FIXED_FIXTURE)
assert.equal(
  fixedErrors.length,
  0,
  `expected the fixed shape to raise no errors, got: ${JSON.stringify(fixedErrors)}`,
)

const REENTRANT_FIXTURE = FIXED_FIXTURE.replace(
  '    if (state.autoBuildingItemId === item.id) return false\n\n',
  '',
)
const reentrantErrors = checkAutoBuildDraftGate(REENTRANT_FIXTURE)
assert.equal(
  reentrantErrors.length,
  1,
  'expected exactly one violation when only the same-item reentrancy guard is missing',
)
assert.ok(reentrantErrors[0]!.includes('autoBuildingItemId'))

const NO_MANUAL_GUARD_FIXTURE = FIXED_FIXTURE.replace(
  `
    if (
      state.generatingItemId === item.id ||
      state.committingItemId === item.id ||
      draftingField.value?.itemId === item.id
    ) {
      return false
    }
`,
  '',
)
const noManualGuardErrors = checkAutoBuildDraftGate(NO_MANUAL_GUARD_FIXTURE)
assert.equal(
  noManualGuardErrors.length,
  1,
  'expected exactly one violation when only the manual-action-in-flight guard is missing, got ' +
    JSON.stringify(noManualGuardErrors),
)
assert.ok(
  noManualGuardErrors[0]!.includes('generatingItemId') &&
    noManualGuardErrors[0]!.includes('manual'),
)

const missingFnErrors = checkAutoBuildDraftGate(MISSING_FIXTURE)
assert.equal(
  missingFnErrors.length,
  1,
  'expected a single "function not found" violation when autoBuildItem is absent',
)
assert.ok(missingFnErrors[0]!.includes('autoBuildItem'))

console.log(
  'Model Builder auto-build gate checker verified: flags discarded draft ' +
    'results and missing same-item reentrancy protection, clears the fixed shape, ' +
    'and flags autoBuildItem being absent entirely.',
)
