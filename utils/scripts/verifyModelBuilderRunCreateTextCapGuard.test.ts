// /utils/scripts/verifyModelBuilderRunCreateTextCapGuard.test.ts
//
// Regression test for verifyModelBuilderRunCreateTextCapGuard.ts
// (model-builder/t-029, cycle 46). Exercises the real checks against
// synthetic runs/index.post.ts fixtures covering: the pre-fix buggy shape (no
// cap at all), the fixed shape (capped against MAX_DRAFT_TEXT_LENGTH), and a
// shape missing one field's call site entirely.
import assert from 'node:assert/strict'

import {
  extractTextHelperBody,
  findRunCreateTextCapProblems,
} from './verifyModelBuilderRunCreateTextCapGuard.js'

const FIXED = `
import { MAX_DRAFT_TEXT_LENGTH, runInclude } from './index'

      const text = (value: unknown, index: number, field: string): string | null => {
        if (typeof value !== 'string' || !value.trim()) return null
        if (value.length > MAX_DRAFT_TEXT_LENGTH) {
          throw createError({ statusCode: 400, message: 'too long' })
        }
        return value
      }

      return {
        pitch: text(item.pitch, index, 'pitch'),
        fieldsDraft: text(item.fieldsDraft, index, 'fieldsDraft'),
        promptDraft: text(item.promptDraft, index, 'promptDraft'),
      }
`

const PRE_FIX = `
import { runInclude } from './index'

      const text = (value: unknown): string | null =>
        typeof value === 'string' && value.trim() ? value : null

      return {
        pitch: text(item.pitch),
        fieldsDraft: text(item.fieldsDraft),
        promptDraft: text(item.promptDraft),
      }
`

const MISSING_FIELD = `
import { MAX_DRAFT_TEXT_LENGTH, runInclude } from './index'

      const text = (value: unknown, index: number, field: string): string | null => {
        if (typeof value !== 'string' || !value.trim()) return null
        if (value.length > MAX_DRAFT_TEXT_LENGTH) {
          throw createError({ statusCode: 400, message: 'too long' })
        }
        return value
      }

      return {
        pitch: text(item.pitch, index, 'pitch'),
        fieldsDraft: text(item.fieldsDraft, index, 'fieldsDraft'),
      }
`

// --- extractTextHelperBody ---------------------------------------------------

assert.match(
  extractTextHelperBody(FIXED) ?? '',
  /MAX_DRAFT_TEXT_LENGTH/,
  'the fixed helper body should reference MAX_DRAFT_TEXT_LENGTH',
)
assert.equal(
  extractTextHelperBody('no helper here'),
  null,
  'a source with no text() helper should report null',
)

// --- findRunCreateTextCapProblems: fixed shape reports nothing --------------

assert.deepEqual(
  findRunCreateTextCapProblems(FIXED),
  [],
  'the fixed shape (all three fields capped against the constant) should report no problems',
)

// --- findRunCreateTextCapProblems: pre-fix shape (no cap at all) is caught ---

const preFixProblems = findRunCreateTextCapProblems(PRE_FIX)
assert.equal(
  preFixProblems.length,
  3,
  'the pre-fix shape should report all three guarded fields as uncapped',
)
for (const problem of preFixProblems) {
  assert.equal(problem.reason, 'not-capped-against-constant')
}

// --- findRunCreateTextCapProblems: a missing call site is caught ------------

const missingFieldProblems = findRunCreateTextCapProblems(MISSING_FIELD)
assert.equal(
  missingFieldProblems.length,
  1,
  'a field with no call site at all should be reported once',
)
assert.equal(missingFieldProblems[0]!.field, 'promptDraft')
assert.equal(missingFieldProblems[0]!.reason, 'missing-call-site')

console.log(
  'verifyModelBuilderRunCreateTextCapGuard.test.ts: all assertions passed.',
)
