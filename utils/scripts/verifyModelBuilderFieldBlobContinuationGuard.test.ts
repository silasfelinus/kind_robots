// /utils/scripts/verifyModelBuilderFieldBlobContinuationGuard.test.ts
//
// Self-test for verifyModelBuilderFieldBlobContinuationGuard.ts
// (model-builder/t-029). Two halves, matching the guard's own split:
//
// 1. checkFieldBlobContinuation() is behavioral -- it imports and directly
//    exercises the real parseFieldLines/readFieldLine/setFieldLine from
//    stores/helpers/modelBuilderFields.ts, so this half of the self-test
//    just asserts it currently passes clean against the real, fixed
//    implementation (there is no separate "buggy fixture" to run it
//    against -- the function under test *is* the fix).
// 2. checkCommitDelegatesToSharedSplitter() is textual, so it's exercised
//    against synthetic buggy/fixed source fixtures the same way every
//    sibling Model Builder guard's self-test does.
import assert from 'node:assert/strict'

import {
  checkCommitDelegatesToSharedSplitter,
  checkFieldBlobContinuation,
} from './verifyModelBuilderFieldBlobContinuationGuard.js'

const FIXED_FIXTURE = `
import {
  CREATE_TARGETS,
  fieldSpecFor,
  parseFieldLines as splitFieldBlob,
} from '~/stores/helpers/modelBuilderFields'

function parseFieldLines(raw, modelType) {
  const map = {}
  for (const { key, value } of splitFieldBlob(raw, modelType)) {
    map[key.toLowerCase()] = value
  }
  return map
}
`

const BUGGY_FIXTURE_NO_IMPORT = `
import { CREATE_TARGETS, fieldSpecFor } from '~/stores/helpers/modelBuilderFields'

function parseFieldLines(raw) {
  const map = {}
  for (const line of raw.split('\\n')) {
    const idx = line.indexOf(':')
    if (idx === -1) continue
    map[line.slice(0, idx).trim().toLowerCase()] = line.slice(idx + 1).trim()
  }
  return map
}
`

const BUGGY_FIXTURE_UNUSED_IMPORT = `
import {
  CREATE_TARGETS,
  fieldSpecFor,
  parseFieldLines as splitFieldBlob,
} from '~/stores/helpers/modelBuilderFields'

function parseFieldLines(raw) {
  const map = {}
  for (const line of raw.split('\\n')) {
    const idx = line.indexOf(':')
    if (idx === -1) continue
    map[line.slice(0, idx).trim().toLowerCase()] = line.slice(idx + 1).trim()
  }
  return map
}
`

function run(): void {
  const behaviorErrors = checkFieldBlobContinuation()
  assert.deepEqual(
    behaviorErrors,
    [],
    'expected the real parseFieldLines/readFieldLine/setFieldLine to pass ' +
      `the multi-line continuation checks, got: ${JSON.stringify(behaviorErrors)}`,
  )

  const fixedErrors = checkCommitDelegatesToSharedSplitter(FIXED_FIXTURE)
  assert.deepEqual(
    fixedErrors,
    [],
    `expected the fixed fixture to pass, got: ${JSON.stringify(fixedErrors)}`,
  )

  const noImportErrors = checkCommitDelegatesToSharedSplitter(
    BUGGY_FIXTURE_NO_IMPORT,
  )
  assert.equal(
    noImportErrors.length,
    2,
    'expected the fixture with no splitFieldBlob import (a reintroduced ' +
      `hand-rolled parser) to fail twice, got: ${JSON.stringify(noImportErrors)}`,
  )

  const unusedImportErrors = checkCommitDelegatesToSharedSplitter(
    BUGGY_FIXTURE_UNUSED_IMPORT,
  )
  assert.equal(
    unusedImportErrors.length,
    1,
    'expected the fixture that imports but never calls splitFieldBlob to ' +
      `fail once, got: ${JSON.stringify(unusedImportErrors)}`,
  )
  assert.match(unusedImportErrors[0]!, /never calls it/)

  console.log(
    'Model Builder field-blob continuation guard self-test passed: real ' +
      'parseFieldLines/readFieldLine/setFieldLine preserve multi-line ' +
      'prose, and the delegation checker correctly flags a reintroduced ' +
      'hand-rolled parser or an unused splitFieldBlob import.',
  )
}

run()
