// /utils/scripts/verifyModelBuilderSourceEmptyStateGuard.test.ts
//
// Regression test for checkSourceEmptyStateGuard() in
// verifyModelBuilderSourceEmptyStateGuard.ts (model-builder/t-029,
// cycle 68). Exercises the check against synthetic component-shaped
// fixtures covering: the fixed shape (empty-state branch present and
// correctly ordered), the pre-fix shape (branch missing entirely), and a
// mis-ordered regression (branch present but placed after the gallery
// branch, where it would never win).
import assert from 'node:assert/strict'

import { checkSourceEmptyStateGuard } from './verifyModelBuilderSourceEmptyStateGuard.js'

const FIXED = `
<template>
  <div v-else-if="store.sourcesError">Error state</div>
  <div v-else-if="!store.sources.length">No records yet.</div>
  <div v-else-if="viewMode === 'gallery'">Gallery</div>
</template>
`

const MISSING = `
<template>
  <div v-else-if="store.sourcesError">Error state</div>
  <div v-else-if="viewMode === 'gallery'">Gallery</div>
</template>
`

const MISORDERED = `
<template>
  <div v-else-if="store.sourcesError">Error state</div>
  <div v-else-if="viewMode === 'gallery'">Gallery</div>
  <div v-else-if="!store.sources.length">No records yet.</div>
</template>
`

const NO_ERROR_BLOCK = `
<template>
  <div v-else-if="!store.sources.length">No records yet.</div>
  <div v-else-if="viewMode === 'gallery'">Gallery</div>
</template>
`

function run(): void {
  // Fixed fixture passes.
  const fixedErrors = checkSourceEmptyStateGuard(FIXED)
  assert.deepEqual(
    fixedErrors,
    [],
    `expected the fixed fixture to pass, got: ${JSON.stringify(fixedErrors)}`,
  )

  // Branch missing entirely fails with a single "no longer has" error.
  const missingErrors = checkSourceEmptyStateGuard(MISSING)
  assert.equal(missingErrors.length, 1)
  assert.ok(missingErrors.some((e) => /no longer has/.test(e)))

  // Branch present but after the gallery branch fails the ordering check.
  const misorderedErrors = checkSourceEmptyStateGuard(MISORDERED)
  assert.equal(misorderedErrors.length, 1)
  assert.ok(misorderedErrors.some((e) => /out of order/.test(e)))

  // Missing sourcesError anchor fails with a single "could not find" error.
  const noErrorBlockErrors = checkSourceEmptyStateGuard(NO_ERROR_BLOCK)
  assert.equal(noErrorBlockErrors.length, 1)
  assert.ok(noErrorBlockErrors.some((e) => /Could not find the/.test(e)))

  console.log(
    'Model Builder source empty-state guard self-test passed: the fixed ' +
      'fixture passes, a missing branch fails clearly, a mis-ordered ' +
      'branch fails the ordering check, and a missing anchor fails ' +
      'clearly.',
  )
}

run()
