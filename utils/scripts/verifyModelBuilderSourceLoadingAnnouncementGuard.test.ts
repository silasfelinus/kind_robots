// /utils/scripts/verifyModelBuilderSourceLoadingAnnouncementGuard.test.ts
//
// Regression test for checkSourceLoadingAnnouncementGuard() in
// verifyModelBuilderSourceLoadingAnnouncementGuard.ts (model-builder/t-029,
// cycle 16). Exercises the check against synthetic component-shaped
// fixtures covering: the fixed shape (all four attributes present), the
// pre-fix shape (none of the four attributes), a partially-regressed shape
// (only some attributes present), and a missing-block regression (the
// loadingSources branch removed entirely).
import assert from 'node:assert/strict'

import { checkSourceLoadingAnnouncementGuard } from './verifyModelBuilderSourceLoadingAnnouncementGuard.js'

function fixture(openingTagExtra: string, spanExtra: string): string {
  return `
<template>
  <div
    v-else-if="store.loadingSources"
    ${openingTagExtra}
    class="flex h-full min-h-32 items-center justify-center gap-2 text-sm text-base-content/60"
  >
    <span class="loading loading-dots loading-md" ${spanExtra} />
    Loading {{ activeType?.plural.toLowerCase() }}…
  </div>
</template>
`
}

const FIXED = fixture(
  'role="status" aria-live="polite" aria-busy="true"',
  'aria-hidden="true"',
)
const BUGGY = fixture('', '')
const PARTIAL = fixture('role="status"', '')
const BLOCK_REMOVED = `
<template>
  <div v-else class="flex h-full min-h-32">Nothing here.</div>
</template>
`

function run(): void {
  // Fixed fixture passes.
  const fixedErrors = checkSourceLoadingAnnouncementGuard(FIXED)
  assert.deepEqual(
    fixedErrors,
    [],
    `expected the fixed fixture to pass, got: ${JSON.stringify(fixedErrors)}`,
  )

  // Pre-fix (no attributes at all) fails all four checks.
  const buggyErrors = checkSourceLoadingAnnouncementGuard(BUGGY)
  assert.equal(
    buggyErrors.length,
    4,
    `expected the fully-buggy fixture to fail all four checks, got: ${JSON.stringify(buggyErrors)}`,
  )
  assert.ok(buggyErrors.some((e) => /role="status"/.test(e)))
  assert.ok(buggyErrors.some((e) => /aria-live="polite"/.test(e)))
  assert.ok(buggyErrors.some((e) => /aria-busy="true"/.test(e)))
  assert.ok(buggyErrors.some((e) => /spinner span/.test(e)))

  // Partial regression (role="status" present, the rest missing) fails
  // exactly the three still-missing checks.
  const partialErrors = checkSourceLoadingAnnouncementGuard(PARTIAL)
  assert.equal(
    partialErrors.length,
    3,
    `expected the partial fixture to fail three checks, got: ${JSON.stringify(partialErrors)}`,
  )
  assert.ok(
    !partialErrors.some((e) => /no longer carries role="status"/.test(e)),
  )

  // Block removed entirely fails with a single "could not find" error.
  const removedErrors = checkSourceLoadingAnnouncementGuard(BLOCK_REMOVED)
  assert.equal(removedErrors.length, 1)
  assert.ok(removedErrors.some((e) => /Could not find a/.test(e)))

  console.log(
    'Model Builder source loading announcement guard self-test passed: ' +
      'buggy fixtures fail, the fixed fixture passes, a partial ' +
      'regression fails only the still-missing checks, and a ' +
      'missing-block regression fails with a clear message.',
  )
}

run()
