// /utils/scripts/verifyModelBuilderCommitNameFieldGuard.test.ts
//
// Regression test for checkCommitNameFieldGuard() in
// verifyModelBuilderCommitNameFieldGuard.ts (model-builder/t-029). Exercises
// the real check against synthetic commit.post.ts-shaped fixtures covering:
// the pre-fix shape (name computed solely from the pitch's first line, the
// exact bug found by manual read-through), the fixed shape (fieldMap.name /
// fieldMap.title preferred ahead of the pitch fallback), and a
// missing-anchor fixture.
import assert from 'node:assert/strict'

import { checkCommitNameFieldGuard } from './verifyModelBuilderCommitNameFieldGuard.js'

const BUGGY_FIXTURE = `
    const sourceId = item.Run.sourceId
    const text = (item.pitch || item.fieldsDraft || '').trim()
    const name = (
      item.pitch?.split('\\n')[0]?.trim() ||
      item.label ||
      'Untitled'
    ).slice(0, 255)
    const fieldMap = parseFieldLines(item.fieldsDraft)
`

const FIXED_FIXTURE = `
    const sourceId = item.Run.sourceId
    const text = (item.pitch || item.fieldsDraft || '').trim()
    const fieldMap = parseFieldLines(item.fieldsDraft)
    const name = (
      fieldMap.name ||
      fieldMap.title ||
      item.pitch?.split('\\n')[0]?.trim() ||
      item.label ||
      'Untitled'
    ).slice(0, 255)
`

const PARTIAL_FIXTURE = `
    const fieldMap = parseFieldLines(item.fieldsDraft)
    const name = (
      fieldMap.name ||
      item.pitch?.split('\\n')[0]?.trim() ||
      item.label ||
      'Untitled'
    ).slice(0, 255)
`

function run(): void {
  const buggyErrors = checkCommitNameFieldGuard(BUGGY_FIXTURE)
  assert.equal(
    buggyErrors.length,
    2,
    'expected the buggy fixture (no fieldMap.name/title preference) to ' +
      `fail twice, got: ${JSON.stringify(buggyErrors)}`,
  )
  assert.match(buggyErrors[0]!, /fieldMap\.name/)
  assert.match(buggyErrors[1]!, /fieldMap\.title/)

  const fixedErrors = checkCommitNameFieldGuard(FIXED_FIXTURE)
  assert.deepEqual(
    fixedErrors,
    [],
    `expected the fixed fixture to pass, got: ${JSON.stringify(fixedErrors)}`,
  )

  const partialErrors = checkCommitNameFieldGuard(PARTIAL_FIXTURE)
  assert.equal(
    partialErrors.length,
    1,
    'expected the partial fixture (name fixed, title still missing) to ' +
      `fail exactly once, got: ${JSON.stringify(partialErrors)}`,
  )
  assert.match(partialErrors[0]!, /fieldMap\.title/)

  const missingAnchorErrors = checkCommitNameFieldGuard(
    'const somethingElse = 1',
  )
  assert.equal(
    missingAnchorErrors.length,
    1,
    'expected a fixture with no `const name = (` assignment to fail with ' +
      'a "could not find" error',
  )
  assert.match(missingAnchorErrors[0]!, /Could not find/)

  console.log(
    'Model Builder commit name/title field guard self-test passed: buggy ' +
      'fixture fails twice, fixed fixture passes, partial fixture fails ' +
      'once, missing-anchor fixture fails clearly.',
  )
}

run()
