// /utils/scripts/verifyModelBuilderDreamTypeChoicesGuard.test.ts
//
// Regression test for verifyModelBuilderDreamTypeChoicesGuard.ts
// (model-builder/t-029, cycle 34). Exercises findDreamTypeChoicesProblem
// against synthetic modelBuilderFields.ts fixtures covering: the pre-fix
// hand-typed literal (missing both the import and the spread assignment),
// the fixed shape (import + spread present), and two partial-drift shapes
// (import present but assignment reverted to a literal; assignment present
// but the import removed/renamed) that a careless future edit could produce.
import assert from 'node:assert/strict'

import { findDreamTypeChoicesProblem } from './verifyModelBuilderDreamTypeChoicesGuard.js'

const PRE_FIX_HARDCODED = `
const DREAM_TYPES = [
  'ART',
  'BRAINSTORM',
  'CHARACTER',
  'REWARD',
  'SCENARIO',
  'LOCATION',
  'PITCH',
  'WISH',
]
`

const preFixProblem = findDreamTypeChoicesProblem(PRE_FIX_HARDCODED)
assert.ok(
  preFixProblem,
  'expected the pre-fix hand-typed literal to be flagged',
)
assert.equal(preFixProblem!.missingImport, true)
assert.equal(preFixProblem!.missingSpreadAssignment, true)

const FIXED = `
import { CREATABLE_DREAM_TYPES } from '@/stores/helpers/dreamHelper'

const DREAM_TYPES: string[] = [...CREATABLE_DREAM_TYPES]
`

assert.equal(
  findDreamTypeChoicesProblem(FIXED),
  null,
  'expected the fixed import + spread shape to pass',
)

const MISSING_IMPORT_ONLY = `
const DREAM_TYPES: string[] = [...CREATABLE_DREAM_TYPES]
`

const missingImportProblem = findDreamTypeChoicesProblem(MISSING_IMPORT_ONLY)
assert.ok(
  missingImportProblem,
  'expected a spread assignment with no matching import to be flagged',
)
assert.equal(missingImportProblem!.missingImport, true)
assert.equal(missingImportProblem!.missingSpreadAssignment, false)

const REVERTED_ASSIGNMENT_ONLY = `
import { CREATABLE_DREAM_TYPES } from '@/stores/helpers/dreamHelper'

const DREAM_TYPES = ['ART', 'BRAINSTORM']
`

const revertedProblem = findDreamTypeChoicesProblem(REVERTED_ASSIGNMENT_ONLY)
assert.ok(
  revertedProblem,
  'expected an import with a reverted hand-typed assignment to be flagged',
)
assert.equal(revertedProblem!.missingImport, false)
assert.equal(revertedProblem!.missingSpreadAssignment, true)

console.log(
  'Model Builder Dream-type choices guard checker verified: passes the ' +
    'import + spread-from-canonical shape, flags the pre-fix hand-typed ' +
    'literal, and flags either half missing independently.',
)
