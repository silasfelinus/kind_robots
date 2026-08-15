// /utils/scripts/verifyDaVinciNarratingStatusGuard.test.ts
//
// Regression test for checkNarratingStatusGuard() in
// verifyDaVinciNarratingStatusGuard.ts (davinci/t-021 slice 4). Exercises
// the real check against synthetic component-shaped fixtures covering: the
// fixed shape (role="status" + aria-live="polite" on the wrapper,
// aria-hidden="true" on the spinner), a missing-role regression, a
// missing-aria-live regression, a missing-spinner-aria-hidden regression,
// and a missing-block regression (the narrating state removed entirely).
import assert from 'node:assert/strict'

import { checkNarratingStatusGuard } from './verifyDaVinciNarratingStatusGuard.js'

function fixture(wrapperAttrs: string, spinnerAttrs: string): string {
  return `
<template>
  <div
    v-if="narrating"
    ${wrapperAttrs}
    class="flex flex-col items-center gap-3 rounded-2xl border border-base-300 bg-base-200/40 p-8 text-center"
  >
    <span
      class="loading loading-dots loading-lg text-primary/70"
      ${spinnerAttrs}
    />
    <p class="text-xs font-semibold text-base-content/50">
      {{ narratorName || 'The narrator' }} is writing chapter
      {{ chapterIndex }}…
    </p>
  </div>

  <!-- Narration failed. Per the narration-layer spec a broken chapter
       surfaces a visible retry rather than a silently fabricated one. -->
  <div v-else-if="narrationError" class="flex flex-col items-center gap-3">
    <p>The narrator is having trouble with this chapter.</p>
  </div>
</template>
`
}

const FIXED = fixture('role="status" aria-live="polite"', 'aria-hidden="true"')

// Pre-fix shape: no accessibility attributes at all.
const BUGGY = fixture('', '')

// role="status" present but aria-live dropped.
const NO_ARIA_LIVE = fixture('role="status"', 'aria-hidden="true"')

// Both wrapper attributes present, but the spinner's aria-hidden dropped.
const NO_SPINNER_ARIA_HIDDEN = fixture('role="status" aria-live="polite"', '')

// The narrating state itself no longer exists.
const BLOCK_REMOVED = `
<template>
  <div v-if="somethingElse" class="flex flex-col items-center gap-3">
    <p>Unrelated state.</p>
  </div>
</template>
`

function run(): void {
  const fixedErrors = checkNarratingStatusGuard(FIXED)
  assert.deepEqual(
    fixedErrors,
    [],
    `expected the fixed fixture to pass, got: ${JSON.stringify(fixedErrors)}`,
  )

  const buggyErrors = checkNarratingStatusGuard(BUGGY)
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
    buggyErrors.some((e) => /spinner no longer carries aria-hidden/.test(e)),
  )

  const noAriaLiveErrors = checkNarratingStatusGuard(NO_ARIA_LIVE)
  assert.equal(noAriaLiveErrors.length, 1)
  assert.ok(
    noAriaLiveErrors.some((e) =>
      /no longer carries aria-live="polite"/.test(e),
    ),
  )

  const noSpinnerAriaHiddenErrors = checkNarratingStatusGuard(
    NO_SPINNER_ARIA_HIDDEN,
  )
  assert.equal(noSpinnerAriaHiddenErrors.length, 1)
  assert.ok(
    noSpinnerAriaHiddenErrors.some((e) =>
      /spinner no longer carries aria-hidden/.test(e),
    ),
  )

  const blockRemovedErrors = checkNarratingStatusGuard(BLOCK_REMOVED)
  assert.equal(blockRemovedErrors.length, 1)
  assert.ok(blockRemovedErrors.some((e) => /Could not find a/.test(e)))

  console.log(
    'Da Vinci narrating-status guard self-test passed: buggy fixture fails ' +
      'all three checks, fixed fixture passes, and the missing-role/' +
      'missing-aria-live/missing-spinner-aria-hidden/missing-block ' +
      'regressions all fail individually as expected.',
  )
}

run()
