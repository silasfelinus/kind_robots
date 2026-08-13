// /utils/scripts/verifyDaVinciNarrationErrorToneGuard.test.ts
//
// Regression test for checkNarrationErrorToneGuard() in
// verifyDaVinciNarrationErrorToneGuard.ts (davinci/t-021 slice 2). Exercises
// the real check against synthetic component-shaped fixtures covering: the
// fixed shape (bg-warning/10), the pre-fix shape (bg-warning/5, half the
// canonical opacity), a missing-background regression, and a missing-block
// regression (the narration-error callout removed entirely).
import assert from 'node:assert/strict'

import { checkNarrationErrorToneGuard } from './verifyDaVinciNarrationErrorToneGuard.js'

function fixture(classAttr: string): string {
  return `
<template>
  <div
    v-else-if="narrationError"
    class="${classAttr}"
  >
    <Icon name="kind-icon:warning" class="size-8 text-warning/70" />
    <p class="text-sm text-base-content/70">
      The narrator is having trouble with this chapter.
    </p>
  </div>
</template>
`
}

const FIXED = fixture(
  'flex flex-col items-center gap-3 rounded-2xl border border-warning/40 bg-warning/10 p-6 text-center',
)

// Pre-fix shape: bg-warning/5 is half the documented canonical opacity.
const BUGGY = fixture(
  'flex flex-col items-center gap-3 rounded-2xl border border-warning/40 bg-warning/5 p-6 text-center',
)

// Background tint dropped entirely.
const NO_BACKGROUND = fixture(
  'flex flex-col items-center gap-3 rounded-2xl border border-warning/40 p-6 text-center',
)

// The narration-error block itself no longer exists.
const BLOCK_REMOVED = `
<template>
  <div v-else class="flex flex-col items-center gap-3">
    <p>Something went wrong.</p>
  </div>
</template>
`

function run(): void {
  const fixedErrors = checkNarrationErrorToneGuard(FIXED)
  assert.deepEqual(
    fixedErrors,
    [],
    `expected the fixed fixture to pass, got: ${JSON.stringify(fixedErrors)}`,
  )

  const buggyErrors = checkNarrationErrorToneGuard(BUGGY)
  assert.equal(
    buggyErrors.length,
    1,
    `expected the bg-warning/5 fixture to fail exactly one check, got: ${JSON.stringify(buggyErrors)}`,
  )
  assert.ok(buggyErrors.some((e) => /bg-warning\/5 instead of/.test(e)))

  const noBackgroundErrors = checkNarrationErrorToneGuard(NO_BACKGROUND)
  assert.equal(noBackgroundErrors.length, 1)
  assert.ok(
    noBackgroundErrors.some((e) => /no longer sets a bg-warning/.test(e)),
  )

  const blockRemovedErrors = checkNarrationErrorToneGuard(BLOCK_REMOVED)
  assert.equal(blockRemovedErrors.length, 1)
  assert.ok(blockRemovedErrors.some((e) => /Could not find a/.test(e)))

  console.log(
    'Da Vinci narration-error tone guard self-test passed: buggy fixture ' +
      'fails, fixed fixture passes, missing-background and missing-block ' +
      'regressions both fail.',
  )
}

run()
