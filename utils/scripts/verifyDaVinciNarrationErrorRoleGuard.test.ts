// /utils/scripts/verifyDaVinciNarrationErrorRoleGuard.test.ts
//
// Regression test for checkNarrationErrorRoleGuard() in
// verifyDaVinciNarrationErrorRoleGuard.ts (davinci/t-021 slice 8). Exercises
// the real check against synthetic component-shaped fixtures covering: the
// fixed shape (role="alert" present), the pre-fix shape (no role attribute
// at all), and a missing-block regression (the narration-error callout
// removed entirely).
import assert from 'node:assert/strict'

import { checkNarrationErrorRoleGuard } from './verifyDaVinciNarrationErrorRoleGuard.js'

function fixture(openingTagExtra: string): string {
  return `
<template>
  <div
    v-else-if="narrationError"
    ${openingTagExtra}
    class="flex flex-col items-center gap-3 rounded-2xl border border-warning/40 bg-warning/10 p-6 text-center"
  >
    <Icon name="kind-icon:warning" class="size-8 text-warning/70" />
    <p class="text-sm text-base-content/70">
      The narrator is having trouble with this chapter.
    </p>
  </div>
</template>
`
}

const FIXED = fixture('role="alert"')

// Pre-fix shape: no role attribute at all.
const BUGGY = fixture('')

// The narration-error block itself no longer exists.
const BLOCK_REMOVED = `
<template>
  <div v-else class="flex flex-col items-center gap-3">
    <p>Something went wrong.</p>
  </div>
</template>
`

function run(): void {
  const fixedErrors = checkNarrationErrorRoleGuard(FIXED)
  assert.deepEqual(
    fixedErrors,
    [],
    `expected the fixed fixture to pass, got: ${JSON.stringify(fixedErrors)}`,
  )

  const buggyErrors = checkNarrationErrorRoleGuard(BUGGY)
  assert.equal(
    buggyErrors.length,
    1,
    `expected the missing-role fixture to fail exactly one check, got: ${JSON.stringify(buggyErrors)}`,
  )
  assert.ok(buggyErrors.some((e) => /no longer carries role="alert"/.test(e)))

  const blockRemovedErrors = checkNarrationErrorRoleGuard(BLOCK_REMOVED)
  assert.equal(blockRemovedErrors.length, 1)
  assert.ok(blockRemovedErrors.some((e) => /Could not find a/.test(e)))

  console.log(
    'Da Vinci narration-error role guard self-test passed: buggy fixture ' +
      'fails, fixed fixture passes, missing-block regression fails.',
  )
}

run()
