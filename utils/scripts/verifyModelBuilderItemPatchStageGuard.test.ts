// /utils/scripts/verifyModelBuilderItemPatchStageGuard.test.ts
//
// Regression test for checkItemPatchStageGuard() in
// verifyModelBuilderItemPatchStageGuard.ts (model-builder/t-029). Exercises
// the real check against synthetic route-shaped fixtures covering: the
// pre-fix shape (no assertContentStageEditable calls -- the exact bug found
// by manual read-through), the fixed shape (a guard call ahead of each
// content-field assignment, including artImageId/GENERATE_ASSETS), a
// partially-fixed shape (only PITCH guarded), and the function being absent
// entirely.
import assert from 'node:assert/strict'

import { checkItemPatchStageGuard } from './verifyModelBuilderItemPatchStageGuard.js'

const BUGGY_FIXTURE = `
export function prepareItemUpdate(
  existing: Pick<ModelBuildItem, 'pitch' | 'fieldsDraft' | 'promptDraft' | 'stageStatuses' | 'relationshipDraft'>,
  body: ItemPatchBody,
  actor: string,
): PreparedItemUpdate {
  const data: Prisma.ModelBuildItemUncheckedUpdateInput = {}

  if (body.stageStatuses !== undefined && body.stageStatuses !== null) {
    const stageStatuses = normalizeJson(body.stageStatuses)
    if (typeof stageStatuses === 'string') data.stageStatuses = stageStatuses
  }
  if (body.pitch !== undefined) data.pitch = normalizeText(body.pitch)
  if (body.fieldsDraft !== undefined)
    data.fieldsDraft = normalizeText(body.fieldsDraft)
  if (body.promptDraft !== undefined)
    data.promptDraft = normalizeText(body.promptDraft)
  if (body.artImageId !== undefined)
    data.artImageId = normalizeNullableId(body.artImageId)

  return { data, revision: null }
}
`

const FIXED_FIXTURE = `
export function prepareItemUpdate(
  existing: Pick<ModelBuildItem, 'pitch' | 'fieldsDraft' | 'promptDraft' | 'stageStatuses' | 'relationshipDraft'>,
  body: ItemPatchBody,
  actor: string,
): PreparedItemUpdate {
  const data: Prisma.ModelBuildItemUncheckedUpdateInput = {}

  if (body.stageStatuses !== undefined && body.stageStatuses !== null) {
    const stageStatuses = normalizeJson(body.stageStatuses)
    if (typeof stageStatuses === 'string') data.stageStatuses = stageStatuses
  }
  if (body.pitch !== undefined) {
    assertContentStageEditable(existing.stageStatuses, 'PITCH', 'Pitch')
    data.pitch = normalizeText(body.pitch)
  }
  if (body.fieldsDraft !== undefined) {
    assertContentStageEditable(
      existing.stageStatuses,
      'FIELDS_AND_PROMPTS',
      'Fields',
    )
    data.fieldsDraft = normalizeText(body.fieldsDraft)
  }
  if (body.promptDraft !== undefined) {
    assertContentStageEditable(
      existing.stageStatuses,
      'FIELDS_AND_PROMPTS',
      'Prompt',
    )
    data.promptDraft = normalizeText(body.promptDraft)
  }
  if (body.artImageId !== undefined) {
    assertContentStageEditable(
      existing.stageStatuses,
      'GENERATE_ASSETS',
      'Art image',
    )
    data.artImageId = normalizeNullableId(body.artImageId)
  }

  return { data, revision: null }
}
`

const PARTIAL_FIXTURE = `
export function prepareItemUpdate(
  existing: Pick<ModelBuildItem, 'pitch' | 'fieldsDraft' | 'promptDraft' | 'stageStatuses' | 'relationshipDraft'>,
  body: ItemPatchBody,
  actor: string,
): PreparedItemUpdate {
  const data: Prisma.ModelBuildItemUncheckedUpdateInput = {}

  if (body.pitch !== undefined) {
    assertContentStageEditable(existing.stageStatuses, 'PITCH', 'Pitch')
    data.pitch = normalizeText(body.pitch)
  }
  if (body.fieldsDraft !== undefined)
    data.fieldsDraft = normalizeText(body.fieldsDraft)
  if (body.promptDraft !== undefined)
    data.promptDraft = normalizeText(body.promptDraft)
  if (body.artImageId !== undefined)
    data.artImageId = normalizeNullableId(body.artImageId)

  return { data, revision: null }
}
`

const MISSING_FIXTURE = `
export function getRunId(event: H3Event): number {
  return 1
}
`

const buggyErrors = checkItemPatchStageGuard(BUGGY_FIXTURE)
assert.equal(
  buggyErrors.length,
  4,
  `expected the pre-fix shape (no guard calls at all) to raise 4 errors ` +
    `(pitch, fieldsDraft, promptDraft, artImageId), got ${buggyErrors.length}: ` +
    JSON.stringify(buggyErrors),
)
assert.ok(buggyErrors.some((e) => e.includes("'PITCH'")))
assert.ok(buggyErrors.some((e) => e.includes('body.fieldsDraft')))
assert.ok(buggyErrors.some((e) => e.includes('body.promptDraft')))
assert.ok(buggyErrors.some((e) => e.includes('body.artImageId')))
assert.ok(buggyErrors.some((e) => e.includes("'GENERATE_ASSETS'")))

const fixedErrors = checkItemPatchStageGuard(FIXED_FIXTURE)
assert.equal(
  fixedErrors.length,
  0,
  `expected the fixed shape to raise no errors, got: ${JSON.stringify(fixedErrors)}`,
)

const partialErrors = checkItemPatchStageGuard(PARTIAL_FIXTURE)
assert.equal(
  partialErrors.length,
  3,
  `expected the partially-fixed shape (PITCH guarded, FIELDS_AND_PROMPTS ` +
    `and GENERATE_ASSETS not) to raise 3 errors, got ${partialErrors.length}: ` +
    JSON.stringify(partialErrors),
)
assert.ok(
  partialErrors.some((e) => e.includes('body.fieldsDraft')) &&
    partialErrors.some((e) => e.includes('body.promptDraft')),
)
assert.ok(partialErrors.some((e) => e.includes('body.artImageId')))
assert.ok(!partialErrors.some((e) => e.includes("'PITCH'")))

const missingFnErrors = checkItemPatchStageGuard(MISSING_FIXTURE)
assert.equal(
  missingFnErrors.length,
  1,
  'expected a single "function not found" violation when prepareItemUpdate is absent',
)
assert.ok(missingFnErrors[0]!.includes('prepareItemUpdate'))

console.log(
  'Model Builder item-patch stage guard checker verified: flags the pre-fix ' +
    'shape (no server-side stage gate on content edits), a partially-fixed ' +
    'shape (only PITCH guarded), clears the fully-fixed shape, and flags ' +
    'prepareItemUpdate being absent entirely.',
)
