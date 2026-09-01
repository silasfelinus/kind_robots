// /utils/scripts/verifyModelBuilderRunCreateItemsCapGuard.test.ts
//
// Regression test for verifyModelBuilderRunCreateItemsCapGuard.ts
// (model-builder/t-029, cycle 73). Exercises the real checks against
// synthetic runs/index.post.ts fixtures covering: the pre-fix buggy shape
// (no cap at all), the fixed shape (capped against MAX_BATCH_ITEMS), and a
// shape that imports the constant but never actually checks against it.
import assert from 'node:assert/strict'

import { findRunCreateItemsCapProblems } from './verifyModelBuilderRunCreateItemsCapGuard.js'

const FIXED = `
import { MAX_BATCH_ITEMS, MAX_DRAFT_TEXT_LENGTH, runInclude } from './index'

    if (!Array.isArray(body.items) || body.items.length === 0) {
      throw createError({ statusCode: 400, message: 'At least one build item is required.' })
    }
    if (body.items.length > MAX_BATCH_ITEMS) {
      throw createError({ statusCode: 400, message: 'too many items' })
    }
`

const PRE_FIX = `
import { MAX_DRAFT_TEXT_LENGTH, runInclude } from './index'

    if (!Array.isArray(body.items) || body.items.length === 0) {
      throw createError({ statusCode: 400, message: 'At least one build item is required.' })
    }
`

const IMPORTED_BUT_UNUSED = `
import { MAX_BATCH_ITEMS, MAX_DRAFT_TEXT_LENGTH, runInclude } from './index'

    if (!Array.isArray(body.items) || body.items.length === 0) {
      throw createError({ statusCode: 400, message: 'At least one build item is required.' })
    }
`

// --- findRunCreateItemsCapProblems: fixed shape reports nothing -------------

assert.deepEqual(
  findRunCreateItemsCapProblems(FIXED),
  [],
  'the fixed shape (imported and checked) should report no problems',
)

// --- findRunCreateItemsCapProblems: pre-fix shape reports both problems ----

assert.deepEqual(
  findRunCreateItemsCapProblems(PRE_FIX),
  [{ reason: 'missing-import' }, { reason: 'missing-length-check' }],
  'the pre-fix shape (no import, no check) should report both problems',
)

// --- findRunCreateItemsCapProblems: imported but never checked -------------

assert.deepEqual(
  findRunCreateItemsCapProblems(IMPORTED_BUT_UNUSED),
  [{ reason: 'missing-length-check' }],
  'importing the constant without checking against it should still fail',
)

console.log(
  'verifyModelBuilderRunCreateItemsCapGuard.test.ts: all assertions passed.',
)
