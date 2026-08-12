// /utils/scripts/verifyModelBuilderAutoBuildApprovalRaceGuard.test.ts
//
// Regression test for checkAutoBuildApprovalRaceGuard() in
// verifyModelBuilderAutoBuildApprovalRaceGuard.ts (model-builder/t-029).
// Exercises the real check against synthetic store-shaped fixtures covering:
// the pre-fix shape (approveStage called unconditionally after the await --
// the exact bug found by manual read-through), the fixed shape (status
// checked, non-ready branch bails), a guard present but missing its
// `else { return 'failed' }` fallback, and autoBuildItem being absent
// entirely.
import assert from 'node:assert/strict'

import { checkAutoBuildApprovalRaceGuard } from './verifyModelBuilderAutoBuildApprovalRaceGuard.js'

const BUGGY_FIXTURE = `
  async function autoBuildItem(itemId: string): Promise<AutoBuildOutcome> {
    const item = findItem(itemId)
    if (!item || !state.run) return 'failed'

    autoBuildingItemSingleton.claim(item.id)
    try {
      if (item.stages.PITCH.status !== 'approved') {
        approveStage(itemId, 'PITCH')
      }

      if (item.stages.FIELDS_AND_PROMPTS.status !== 'approved') {
        if (!isAsset) {
          const drafted = await draftText(itemId, 'fields')
          if (!drafted) return 'failed'
        }
        approveStage(itemId, 'FIELDS_AND_PROMPTS')
      }

      if (item.stages.GENERATE_ASSETS.status !== 'approved') {
        if (wantArt) {
          const generated = await generateItemAsset(itemId)
          if (!generated) return 'failed'
        }
        approveStage(itemId, 'GENERATE_ASSETS')
      }

      if (item.stages.COMMIT.status !== 'approved') {
        return (await commitItem(itemId)) ? 'committed' : 'failed'
      }
      return 'committed'
    } finally {
      autoBuildingItemSingleton.release(item.id)
    }
  }
`

const FIXED_FIXTURE = `
  async function autoBuildItem(itemId: string): Promise<AutoBuildOutcome> {
    const item = findItem(itemId)
    if (!item || !state.run) return 'failed'

    autoBuildingItemSingleton.claim(item.id)
    try {
      if (item.stages.PITCH.status !== 'approved') {
        approveStage(itemId, 'PITCH')
      }

      if (item.stages.FIELDS_AND_PROMPTS.status !== 'approved') {
        if (!isAsset) {
          const drafted = await draftText(itemId, 'fields')
          if (!drafted) return 'failed'
        }
        if (item.stages.FIELDS_AND_PROMPTS.status === 'ready') {
          approveStage(itemId, 'FIELDS_AND_PROMPTS')
        } else {
          return 'failed'
        }
      }

      if (item.stages.GENERATE_ASSETS.status !== 'approved') {
        if (wantArt) {
          const generated = await generateItemAsset(itemId)
          if (!generated) return 'failed'
        }
        if (item.stages.GENERATE_ASSETS.status === 'ready') {
          approveStage(itemId, 'GENERATE_ASSETS')
        } else {
          return 'failed'
        }
      }

      if (item.stages.COMMIT.status !== 'approved') {
        return (await commitItem(itemId)) ? 'committed' : 'failed'
      }
      return 'committed'
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

const buggyErrors = checkAutoBuildApprovalRaceGuard(BUGGY_FIXTURE)
assert.equal(
  buggyErrors.length,
  2,
  'expected the pre-fix shape (both FIELDS_AND_PROMPTS and GENERATE_ASSETS ' +
    `approveStage calls unguarded) to raise 2 errors, got ${buggyErrors.length}: ` +
    JSON.stringify(buggyErrors),
)
assert.ok(
  buggyErrors.some((e) => e.includes("'FIELDS_AND_PROMPTS'")),
  'expected a violation for the unguarded FIELDS_AND_PROMPTS approval',
)
assert.ok(
  buggyErrors.some((e) => e.includes("'GENERATE_ASSETS'")),
  'expected a violation for the unguarded GENERATE_ASSETS approval',
)

const fixedErrors = checkAutoBuildApprovalRaceGuard(FIXED_FIXTURE)
assert.equal(
  fixedErrors.length,
  0,
  `expected the fixed shape to raise no errors, got: ${JSON.stringify(fixedErrors)}`,
)

const NO_FALLBACK_FIXTURE = FIXED_FIXTURE.replace(
  `        if (item.stages.GENERATE_ASSETS.status === 'ready') {
          approveStage(itemId, 'GENERATE_ASSETS')
        } else {
          return 'failed'
        }`,
  `        if (item.stages.GENERATE_ASSETS.status === 'ready') {
          approveStage(itemId, 'GENERATE_ASSETS')
        }`,
)
const noFallbackErrors = checkAutoBuildApprovalRaceGuard(NO_FALLBACK_FIXTURE)
assert.equal(
  noFallbackErrors.length,
  1,
  'expected exactly one violation when the GENERATE_ASSETS guard is present ' +
    `but missing its else { return 'failed' } fallback, got ${noFallbackErrors.length}: ` +
    JSON.stringify(noFallbackErrors),
)
assert.ok(
  noFallbackErrors[0]!.includes("'GENERATE_ASSETS'") &&
    noFallbackErrors[0]!.includes('else'),
)

const missingFnErrors = checkAutoBuildApprovalRaceGuard(MISSING_FIXTURE)
assert.equal(
  missingFnErrors.length,
  1,
  'expected a single "function not found" violation when autoBuildItem is absent',
)
assert.ok(missingFnErrors[0]!.includes('autoBuildItem'))

console.log(
  'Model Builder auto-build approval-race guard checker verified: flags ' +
    'unconditional approveStage calls after an await, flags a status guard ' +
    "missing its else { return 'failed' } fallback, clears the fixed " +
    'shape, and flags autoBuildItem being absent entirely.',
)
