// /utils/scripts/verifyModelBuilderBatchItemsCapGuard.test.ts
//
// Regression test for verifyModelBuilderBatchItemsCapGuard.ts
// (model-builder/t-029, cycle 74). Exercises the real checks against
// synthetic items/batch.patch.ts fixtures covering: the pre-fix buggy shape
// (no cap at all), the fixed shape (capped against MAX_BATCH_ITEMS), and a
// shape that imports the constant but never actually checks against it.
import assert from 'node:assert/strict'

import { findBatchItemsCapProblems } from './verifyModelBuilderBatchItemsCapGuard.js'

const FIXED = `
import {
  assertContentStageEditable,
  assertRunAccess,
  assertRunWritable,
  MAX_BATCH_ITEMS,
  mergeStageStatusChanges,
  prepareItemUpdate,
  type ItemPatchBody,
} from '../runs/index'

    if (!body || !Array.isArray(body.items) || body.items.length === 0) {
      throw createError({ statusCode: 400, message: 'Request body must include a non-empty "items" array.' })
    }
    if (body.items.length > MAX_BATCH_ITEMS) {
      throw createError({ statusCode: 400, message: 'too many items' })
    }
`

const PRE_FIX = `
import {
  assertContentStageEditable,
  assertRunAccess,
  assertRunWritable,
  mergeStageStatusChanges,
  prepareItemUpdate,
  type ItemPatchBody,
} from '../runs/index'

    if (!body || !Array.isArray(body.items) || body.items.length === 0) {
      throw createError({ statusCode: 400, message: 'Request body must include a non-empty "items" array.' })
    }
`

const IMPORTED_BUT_UNUSED = `
import {
  assertContentStageEditable,
  assertRunAccess,
  assertRunWritable,
  MAX_BATCH_ITEMS,
  mergeStageStatusChanges,
  prepareItemUpdate,
  type ItemPatchBody,
} from '../runs/index'

    if (!body || !Array.isArray(body.items) || body.items.length === 0) {
      throw createError({ statusCode: 400, message: 'Request body must include a non-empty "items" array.' })
    }
`

// --- findBatchItemsCapProblems: fixed shape reports nothing -----------------

assert.deepEqual(
  findBatchItemsCapProblems(FIXED),
  [],
  'the fixed shape (imported and checked) should report no problems',
)

// --- findBatchItemsCapProblems: pre-fix shape reports both problems --------

assert.deepEqual(
  findBatchItemsCapProblems(PRE_FIX),
  [{ reason: 'missing-import' }, { reason: 'missing-length-check' }],
  'the pre-fix shape (no import, no check) should report both problems',
)

// --- findBatchItemsCapProblems: imported but never checked -----------------

assert.deepEqual(
  findBatchItemsCapProblems(IMPORTED_BUT_UNUSED),
  [{ reason: 'missing-length-check' }],
  'importing the constant without checking against it should still fail',
)

console.log(
  'verifyModelBuilderBatchItemsCapGuard.test.ts: all assertions passed.',
)
