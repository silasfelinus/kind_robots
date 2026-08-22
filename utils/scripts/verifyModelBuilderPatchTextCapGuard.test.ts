// /utils/scripts/verifyModelBuilderPatchTextCapGuard.test.ts
//
// Regression test for verifyModelBuilderPatchTextCapGuard.ts
// (model-builder/t-029, cycle 45). Exercises the real checks against
// synthetic schema/route fixtures covering: the pre-fix buggy shape (no
// maxLength option at all), the fixed shape (matching maxLength), and a
// drifted maxLength that no longer matches the schema's declared width.
import assert from 'node:assert/strict'

import {
  extractCallSiteMaxLength,
  extractVarCharWidth,
  findPatchTextCapProblems,
} from './verifyModelBuilderPatchTextCapGuard.js'

const SCHEMA_FIXTURE = `
model ModelBuildRun {
  id          Int     @id @default(autoincrement())
  sourceLabel String? @db.VarChar(255)
}

model ModelBuildItem {
  id          Int     @id @default(autoincrement())
  staleReason String? @db.VarChar(255)
  targetType  String? @db.VarChar(64)
}
`

const RUNS_INDEX_FIXED = `
  if (body.staleReason !== undefined)
    data.staleReason = normalizeText(body.staleReason, {
      maxLength: 255,
      field: 'Stale reason',
    })
  if (body.targetType !== undefined)
    data.targetType = normalizeText(body.targetType, {
      maxLength: 64,
      field: 'Target type',
    })
`

const RUNS_INDEX_PRE_FIX = `
  if (body.staleReason !== undefined)
    data.staleReason = normalizeText(body.staleReason)
  if (body.targetType !== undefined)
    data.targetType = normalizeText(body.targetType)
`

const RUNS_INDEX_DRIFTED = `
  if (body.staleReason !== undefined)
    data.staleReason = normalizeText(body.staleReason, { maxLength: 128 })
  if (body.targetType !== undefined)
    data.targetType = normalizeText(body.targetType, { maxLength: 64 })
`

const RUN_PATCH_FIXED = `
    if (body.sourceLabel !== undefined)
      data.sourceLabel = normalizeText(body.sourceLabel, {
        maxLength: 255,
        field: 'Source label',
      })
`

const RUN_PATCH_PRE_FIX = `
    if (body.sourceLabel !== undefined)
      data.sourceLabel = normalizeText(body.sourceLabel)
`

// --- extractVarCharWidth -----------------------------------------------------

assert.equal(
  extractVarCharWidth(SCHEMA_FIXTURE, 'ModelBuildRun', 'sourceLabel'),
  255,
  'sourceLabel should resolve to its declared VarChar(255) width',
)
assert.equal(
  extractVarCharWidth(SCHEMA_FIXTURE, 'ModelBuildItem', 'targetType'),
  64,
  'targetType should resolve to its declared VarChar(64) width',
)
assert.equal(
  extractVarCharWidth(SCHEMA_FIXTURE, 'ModelBuildItem', 'notAField'),
  undefined,
  'a field not present on the model should resolve to undefined',
)

// --- extractCallSiteMaxLength ------------------------------------------------

assert.equal(
  extractCallSiteMaxLength(RUNS_INDEX_FIXED, 'staleReason'),
  255,
  'the fixed staleReason call site should report its maxLength',
)
assert.equal(
  extractCallSiteMaxLength(RUNS_INDEX_PRE_FIX, 'staleReason'),
  null,
  'the pre-fix staleReason call site (no options object) should report null',
)
assert.equal(
  extractCallSiteMaxLength(RUNS_INDEX_FIXED, 'notCalled'),
  undefined,
  'a field with no call site at all should report undefined',
)

// --- findPatchTextCapProblems: fixed shape reports nothing -----------------

assert.deepEqual(
  findPatchTextCapProblems(SCHEMA_FIXTURE, RUNS_INDEX_FIXED, RUN_PATCH_FIXED),
  [],
  'the fixed shape (every guarded field capped at its real schema width) should report no problems',
)

// --- findPatchTextCapProblems: pre-fix shape (no cap at all) is caught -----

const preFixProblems = findPatchTextCapProblems(
  SCHEMA_FIXTURE,
  RUNS_INDEX_PRE_FIX,
  RUN_PATCH_PRE_FIX,
)
assert.equal(
  preFixProblems.length,
  3,
  'the pre-fix shape should report all three guarded fields as uncapped',
)
for (const problem of preFixProblems) {
  assert.equal(
    problem.callSiteMaxLength,
    null,
    `${problem.model}.${problem.field} should report no maxLength option`,
  )
}

// --- findPatchTextCapProblems: a drifted cap that no longer matches --------

const driftedProblems = findPatchTextCapProblems(
  SCHEMA_FIXTURE,
  RUNS_INDEX_DRIFTED,
  RUN_PATCH_FIXED,
)
assert.equal(
  driftedProblems.length,
  1,
  'a maxLength that no longer matches the schema width should be reported',
)
assert.equal(driftedProblems[0]!.field, 'staleReason')
assert.equal(driftedProblems[0]!.schemaWidth, 255)
assert.equal(driftedProblems[0]!.callSiteMaxLength, 128)

console.log(
  'verifyModelBuilderPatchTextCapGuard.test.ts: all assertions passed.',
)
