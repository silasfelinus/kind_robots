// /utils/scripts/verifyModelBuilderHistoryCloseFocusGuard.test.ts
//
// Regression test for checkHistoryCloseFocusGuard() in
// verifyModelBuilderHistoryCloseFocusGuard.ts (model-builder/t-029, cycle
// 14). Exercises the check against synthetic component-shaped fixtures
// covering: the fixed shape (ref attribute + watch + focus call all
// present), each piece of the pre-fix shape missing individually, and a
// missing-button regression (the toggle button removed entirely).
import assert from 'node:assert/strict'

import { checkHistoryCloseFocusGuard } from './verifyModelBuilderHistoryCloseFocusGuard.js'

function fixture(options: {
  refAttr?: boolean
  watchCall?: boolean
  focusCall?: boolean
  buttonPresent?: boolean
}): string {
  const {
    refAttr = true,
    watchCall = true,
    focusCall = true,
    buttonPresent = true,
  } = options

  const button = buttonPresent
    ? `
      <button
        ${refAttr ? 'ref="historyToggleButton"' : ''}
        type="button"
        aria-label="Toggle run history"
        :aria-pressed="showHistory"
        @click="showHistory = !showHistory"
      >
        History
      </button>`
    : ''

  const script = `
<script setup lang="ts">
import { ref${watchCall ? ', watch' : ''} } from 'vue'
const showHistory = ref(false)
const historyToggleButton = ref(null)
${
  watchCall
    ? `watch(showHistory, (isOpen) => {
  if (isOpen) return
  nextTick(() => {
    ${focusCall ? 'historyToggleButton.value?.focus()' : 'doNothing()'}
  })
})`
    : ''
}
</script>`

  return `
<template>
  <section>${button}</section>
</template>
${script}
`
}

const FIXED = fixture({})
const MISSING_REF = fixture({ refAttr: false })
const MISSING_WATCH = fixture({ watchCall: false })
const MISSING_FOCUS_CALL = fixture({ focusCall: false })
const BUTTON_REMOVED = fixture({ buttonPresent: false })

function run(): void {
  // Fixed fixture passes with no errors.
  const fixedErrors = checkHistoryCloseFocusGuard(FIXED)
  assert.deepEqual(
    fixedErrors,
    [],
    `expected the fixed fixture to pass, got: ${JSON.stringify(fixedErrors)}`,
  )

  // Missing `ref="historyToggleButton"` fails exactly one check.
  const missingRefErrors = checkHistoryCloseFocusGuard(MISSING_REF)
  assert.equal(
    missingRefErrors.length,
    1,
    `expected the missing-ref fixture to fail exactly one check, got: ${JSON.stringify(missingRefErrors)}`,
  )
  assert.ok(
    missingRefErrors.some((e) => /no longer carries/.test(e)),
    `expected a "no longer carries" error, got: ${JSON.stringify(missingRefErrors)}`,
  )

  // Missing the `watch(showHistory, ...)` call fails both the watch check
  // and the focus-call check -- dropping the watch block in this fixture
  // takes its inline `.focus()` call with it, same as a real regression
  // that deletes the whole watcher in one edit.
  const missingWatchErrors = checkHistoryCloseFocusGuard(MISSING_WATCH)
  assert.equal(
    missingWatchErrors.length,
    2,
    `expected the missing-watch fixture to fail both checks, got: ${JSON.stringify(missingWatchErrors)}`,
  )
  assert.ok(
    missingWatchErrors.some((e) => /no longer watches/.test(e)),
    `expected a "no longer watches" error, got: ${JSON.stringify(missingWatchErrors)}`,
  )
  assert.ok(
    missingWatchErrors.some((e) => /no longer calls/.test(e)),
    `expected a "no longer calls" error, got: ${JSON.stringify(missingWatchErrors)}`,
  )

  // Missing the actual `.focus()` call (watch present but inert) fails
  // exactly one check.
  const missingFocusErrors = checkHistoryCloseFocusGuard(MISSING_FOCUS_CALL)
  assert.equal(
    missingFocusErrors.length,
    1,
    `expected the missing-focus-call fixture to fail exactly one check, got: ${JSON.stringify(missingFocusErrors)}`,
  )
  assert.ok(
    missingFocusErrors.some((e) => /no longer calls/.test(e)),
    `expected a "no longer calls" error, got: ${JSON.stringify(missingFocusErrors)}`,
  )

  // Toggle button removed entirely fails with a "could not find" error.
  const buttonRemovedErrors = checkHistoryCloseFocusGuard(BUTTON_REMOVED)
  assert.equal(buttonRemovedErrors.length, 1)
  assert.ok(buttonRemovedErrors.some((e) => /Could not find/.test(e)))

  console.log(
    'Model Builder history-close focus guard self-test passed: the fixed ' +
      'fixture passes, each individually-broken fixture fails exactly one ' +
      'check, and a fully-removed toggle button fails with a ' +
      '"could not find" error.',
  )
}

run()
