// /utils/scripts/verifyDaVinciResumingStatusGuard.test.ts
//
// Regression test for checkResumingStatusGuard() in
// verifyDaVinciResumingStatusGuard.ts (davinci/t-021 slice 5). Exercises the
// real check against synthetic component-shaped fixtures covering: the
// fixed shape (role="status" + aria-live="polite" on the wrapper, plus an
// sr-only text node), a missing-role regression, a missing-aria-live
// regression, a missing-text regression (role/aria-live present but the
// skeleton stays empty), and a missing-block regression (the resuming state
// removed entirely).
import assert from 'node:assert/strict'

import { checkResumingStatusGuard } from './verifyDaVinciResumingStatusGuard.js'

function fixture(wrapperAttrs: string, innerText: string): string {
  return `
<template>
  <div
    v-else-if="phase === 'loading'"
    ${wrapperAttrs}
    class="h-40 animate-pulse rounded-2xl border border-base-300 bg-base-200"
  >
    ${innerText}
  </div>

  <!-- Start a new life -->
  <form v-else-if="phase === 'start'" class="flex flex-col gap-3">
    <p>Seed a fresh life.</p>
  </form>
</template>
`
}

const FIXED = fixture(
  'role="status" aria-live="polite"',
  '<span class="sr-only">Resuming your life…</span>',
)

// Pre-fix shape: no accessibility attributes and no text content at all.
const BUGGY = fixture('', '')

// role="status" present but aria-live dropped.
const NO_ARIA_LIVE = fixture(
  'role="status"',
  '<span class="sr-only">Resuming your life…</span>',
)

// Both wrapper attributes present, but the skeleton stays textless.
const NO_TEXT = fixture('role="status" aria-live="polite"', '')

// The resuming state itself no longer exists.
const BLOCK_REMOVED = `
<template>
  <div v-else-if="somethingElse" class="flex flex-col items-center gap-3">
    <p>Unrelated state.</p>
  </div>

  <!-- Start a new life -->
  <form v-else-if="phase === 'start'" class="flex flex-col gap-3">
    <p>Seed a fresh life.</p>
  </form>
</template>
`

function run(): void {
  const fixedErrors = checkResumingStatusGuard(FIXED)
  assert.deepEqual(
    fixedErrors,
    [],
    `expected the fixed fixture to pass, got: ${JSON.stringify(fixedErrors)}`,
  )

  const buggyErrors = checkResumingStatusGuard(BUGGY)
  assert.equal(
    buggyErrors.length,
    3,
    `expected the buggy fixture to fail all three checks, got: ${JSON.stringify(buggyErrors)}`,
  )
  assert.ok(buggyErrors.some((e) => /no longer carries role="status"/.test(e)))
  assert.ok(
    buggyErrors.some((e) => /no longer carries aria-live="polite"/.test(e)),
  )
  assert.ok(
    buggyErrors.some((e) => /no longer contains any text content/.test(e)),
  )

  const noAriaLiveErrors = checkResumingStatusGuard(NO_ARIA_LIVE)
  assert.equal(noAriaLiveErrors.length, 1)
  assert.ok(
    noAriaLiveErrors.some((e) =>
      /no longer carries aria-live="polite"/.test(e),
    ),
  )

  const noTextErrors = checkResumingStatusGuard(NO_TEXT)
  assert.equal(noTextErrors.length, 1)
  assert.ok(
    noTextErrors.some((e) => /no longer contains any text content/.test(e)),
  )

  const blockRemovedErrors = checkResumingStatusGuard(BLOCK_REMOVED)
  assert.equal(blockRemovedErrors.length, 1)
  assert.ok(blockRemovedErrors.some((e) => /Could not find a/.test(e)))

  console.log(
    'Da Vinci resuming-status guard self-test passed: buggy fixture fails ' +
      'all three checks, fixed fixture passes, and the missing-role/' +
      'missing-aria-live/missing-text/missing-block regressions all fail ' +
      'individually as expected.',
  )
}

run()
