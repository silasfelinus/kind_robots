// /utils/scripts/verifyModelBuilderDraftSourceSnapshotGuard.test.ts
//
// Regression test for checkDraftSourceSnapshotGuard() in
// verifyModelBuilderDraftSourceSnapshotGuard.ts (model-builder/t-029, cycle
// 56). Exercises the real check against synthetic store-shaped fixtures
// covering: the pre-fix shape (context.source reads state.selectedSource
// alone -- the exact bug found by tracing draftText()'s /api/suggest
// payload against resumeRun()/openRun()'s cycle-24 selectedSource-nulling
// fix), the fixed shape (falls back to state.run.sourceSnapshot first), and
// the anchor missing entirely (function renamed/restructured).
import assert from 'node:assert/strict'

import { checkDraftSourceSnapshotGuard } from './verifyModelBuilderDraftSourceSnapshotGuard.js'

const BUGGY_FIXTURE = `
  async function draftText(
    itemId: string,
    field: DraftField,
    instruction?: string,
  ): Promise<boolean> {
    try {
      const result = await performFetch<{ value: string }>(
        '/api/suggest',
        {
          method: 'POST',
          body: JSON.stringify({
            builder: 'model-builder',
            context: {
              sourceType: state.run.sourceType,
              targetModel,
              expectedFields: fieldsBrief(targetModel),
              pitch: item.pitch,
              fields: item.fieldsDraft,
              source: state.selectedSource ?? undefined,
            },
          }),
        },
      )
    } catch (error) {}
  }
`

const FIXED_FIXTURE = `
  async function draftText(
    itemId: string,
    field: DraftField,
    instruction?: string,
  ): Promise<boolean> {
    try {
      const result = await performFetch<{ value: string }>(
        '/api/suggest',
        {
          method: 'POST',
          body: JSON.stringify({
            builder: 'model-builder',
            context: {
              sourceType: state.run.sourceType,
              targetModel,
              expectedFields: fieldsBrief(targetModel),
              pitch: item.pitch,
              fields: item.fieldsDraft,
              source: state.run.sourceSnapshot ?? state.selectedSource ?? undefined,
            },
          }),
        },
      )
    } catch (error) {}
  }
`

// Prettier wraps the real file's long \`source:\` line onto its own
// continuation line (\`source:\n  state.run.sourceSnapshot ?? ...\`) -- this
// fixture exercises that exact real-world shape, not just the single-line
// version above.
const FIXED_WRAPPED_FIXTURE = `
  async function draftText(
    itemId: string,
    field: DraftField,
    instruction?: string,
  ): Promise<boolean> {
    try {
      const result = await performFetch<{ value: string }>(
        '/api/suggest',
        {
          method: 'POST',
          body: JSON.stringify({
            builder: 'model-builder',
            context: {
              sourceType: state.run.sourceType,
              targetModel,
              expectedFields: fieldsBrief(targetModel),
              pitch: item.pitch,
              fields: item.fieldsDraft,
              source:
                state.run.sourceSnapshot ?? state.selectedSource ?? undefined,
            },
          }),
        },
      )
    } catch (error) {}
  }
`

const MISSING_FIXTURE = `
  function approveStage(itemId: string, stageKey: BuildStageKey): void {
    const item = findItem(itemId)
    if (!item) return
    item.stages[stageKey] = { status: 'approved' }
  }
`

const buggyErrors = checkDraftSourceSnapshotGuard(BUGGY_FIXTURE)
assert.equal(
  buggyErrors.length,
  1,
  `expected the pre-fix shape to raise 1 error, got ${buggyErrors.length}: ` +
    `${JSON.stringify(buggyErrors)}`,
)
assert.ok(
  buggyErrors[0]?.includes('state.selectedSource ?? undefined` alone'),
  'expected the bare-selectedSource violation message',
)

const fixedErrors = checkDraftSourceSnapshotGuard(FIXED_FIXTURE)
assert.equal(
  fixedErrors.length,
  0,
  `expected the fixed shape to raise no errors, got: ${JSON.stringify(fixedErrors)}`,
)

const fixedWrappedErrors = checkDraftSourceSnapshotGuard(FIXED_WRAPPED_FIXTURE)
assert.equal(
  fixedWrappedErrors.length,
  0,
  'expected the prettier-wrapped fixed shape (source: on its own ' +
    `continuation line) to raise no errors, got: ${JSON.stringify(fixedWrappedErrors)}`,
)

const missingErrors = checkDraftSourceSnapshotGuard(MISSING_FIXTURE)
assert.equal(
  missingErrors.length,
  1,
  'expected one "anchor not found" violation when draftText is absent',
)
assert.ok(missingErrors[0]?.includes('Could not find'))

console.log(
  'Model Builder draft source-snapshot guard checker verified: flags the ' +
    'pre-fix bare-selectedSource shape, clears the fixed sourceSnapshot- ' +
    'fallback shape (both single-line and prettier-wrapped), and flags ' +
    'the anchor being absent.',
)
