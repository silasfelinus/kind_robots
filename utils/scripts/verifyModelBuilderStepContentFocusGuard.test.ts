// /utils/scripts/verifyModelBuilderStepContentFocusGuard.test.ts
//
// Regression test for checkStepContentFocusGuard() in
// verifyModelBuilderStepContentFocusGuard.ts (model-builder/t-029, cycle
// 15). Exercises the check against synthetic component-shaped fixtures
// covering: the fixed shape (ref + tabindex + watch + contains-check +
// focus call all present), each piece of the pre-fix shape missing
// individually, and a missing-<main> regression (the wrapper removed
// entirely).
import assert from 'node:assert/strict'

import { checkStepContentFocusGuard } from './verifyModelBuilderStepContentFocusGuard.js'

function fixture(options: {
  refAttr?: boolean
  tabindexAttr?: boolean
  watchCall?: boolean
  containsCheck?: boolean
  focusCall?: boolean
  mainPresent?: boolean
}): string {
  const {
    refAttr = true,
    tabindexAttr = true,
    watchCall = true,
    containsCheck = true,
    focusCall = true,
    mainPresent = true,
  } = options

  const main = mainPresent
    ? `
      <main
        ${refAttr ? 'ref="mainContent"' : ''}
        ${tabindexAttr ? 'tabindex="-1"' : ''}
        aria-label="Model Builder step content"
      >
        <template v-else />
      </main>`
    : ''

  const watchBody = containsCheck
    ? `if (!mainContent.value?.contains(document.activeElement)) return
    nextTick(() => {
      ${focusCall ? 'mainContent.value?.focus()' : 'doNothing()'}
    })`
    : `nextTick(() => {
      ${focusCall ? 'mainContent.value?.focus()' : 'doNothing()'}
    })`

  const script = `
<script setup lang="ts">
import { nextTick, ref${watchCall ? ', watch' : ''} } from 'vue'
const mainContent = ref(null)
${
  watchCall
    ? `watch(
  () => store.step,
  () => {
    ${watchBody}
  },
)`
    : ''
}
</script>`

  return `
<template>
  <section>${main}</section>
</template>
${script}
`
}

const FIXED = fixture({})
const MISSING_REF = fixture({ refAttr: false })
const MISSING_TABINDEX = fixture({ tabindexAttr: false })
const MISSING_WATCH = fixture({ watchCall: false })
const MISSING_CONTAINS_CHECK = fixture({ containsCheck: false })
const MISSING_FOCUS_CALL = fixture({ focusCall: false })
const MAIN_REMOVED = fixture({ mainPresent: false })

function run(): void {
  // Fixed fixture passes with no errors.
  const fixedErrors = checkStepContentFocusGuard(FIXED)
  assert.deepEqual(
    fixedErrors,
    [],
    `expected the fixed fixture to pass, got: ${JSON.stringify(fixedErrors)}`,
  )

  // Missing `ref="mainContent"` fails exactly one check.
  const missingRefErrors = checkStepContentFocusGuard(MISSING_REF)
  assert.equal(
    missingRefErrors.length,
    1,
    `expected the missing-ref fixture to fail exactly one check, got: ${JSON.stringify(missingRefErrors)}`,
  )
  assert.ok(
    missingRefErrors.some((e) =>
      /no longer carries `ref="mainContent"`/.test(e),
    ),
    `expected a "no longer carries" ref error, got: ${JSON.stringify(missingRefErrors)}`,
  )

  // Missing `tabindex="-1"` fails exactly one check.
  const missingTabindexErrors = checkStepContentFocusGuard(MISSING_TABINDEX)
  assert.equal(
    missingTabindexErrors.length,
    1,
    `expected the missing-tabindex fixture to fail exactly one check, got: ${JSON.stringify(missingTabindexErrors)}`,
  )
  assert.ok(
    missingTabindexErrors.some((e) =>
      /no longer carries `tabindex="-1"`/.test(e),
    ),
    `expected a "no longer carries" tabindex error, got: ${JSON.stringify(missingTabindexErrors)}`,
  )

  // Missing the `watch(() => store.step, ...)` call fails every downstream
  // check too -- dropping the watch block in this fixture takes its inline
  // contains-check and .focus() call with it, same as a real regression
  // that deletes the whole watcher in one edit.
  const missingWatchErrors = checkStepContentFocusGuard(MISSING_WATCH)
  assert.equal(
    missingWatchErrors.length,
    3,
    `expected the missing-watch fixture to fail all three downstream checks, got: ${JSON.stringify(missingWatchErrors)}`,
  )
  assert.ok(
    missingWatchErrors.some((e) => /no longer watches/.test(e)),
    `expected a "no longer watches" error, got: ${JSON.stringify(missingWatchErrors)}`,
  )
  assert.ok(
    missingWatchErrors.some((e) => /no longer checks/.test(e)),
    `expected a "no longer checks" error, got: ${JSON.stringify(missingWatchErrors)}`,
  )
  assert.ok(
    missingWatchErrors.some((e) => /no longer calls/.test(e)),
    `expected a "no longer calls" error, got: ${JSON.stringify(missingWatchErrors)}`,
  )

  // Missing the `.contains(document.activeElement)` check (watch present,
  // but unconditional) fails exactly one check.
  const missingContainsErrors = checkStepContentFocusGuard(
    MISSING_CONTAINS_CHECK,
  )
  assert.equal(
    missingContainsErrors.length,
    1,
    `expected the missing-contains-check fixture to fail exactly one check, got: ${JSON.stringify(missingContainsErrors)}`,
  )
  assert.ok(
    missingContainsErrors.some((e) => /no longer checks/.test(e)),
    `expected a "no longer checks" error, got: ${JSON.stringify(missingContainsErrors)}`,
  )

  // Missing the actual `.focus()` call (watch and contains-check present
  // but inert) fails exactly one check.
  const missingFocusErrors = checkStepContentFocusGuard(MISSING_FOCUS_CALL)
  assert.equal(
    missingFocusErrors.length,
    1,
    `expected the missing-focus-call fixture to fail exactly one check, got: ${JSON.stringify(missingFocusErrors)}`,
  )
  assert.ok(
    missingFocusErrors.some((e) => /no longer calls/.test(e)),
    `expected a "no longer calls" error, got: ${JSON.stringify(missingFocusErrors)}`,
  )

  // <main> removed entirely fails with a "could not find" error.
  const mainRemovedErrors = checkStepContentFocusGuard(MAIN_REMOVED)
  assert.equal(mainRemovedErrors.length, 1)
  assert.ok(mainRemovedErrors.some((e) => /Could not find/.test(e)))

  console.log(
    'Model Builder step-content focus guard self-test passed: the fixed ' +
      'fixture passes, each individually-broken fixture fails the right ' +
      'checks, and a fully-removed <main> wrapper fails with a "could not ' +
      'find" error.',
  )
}

run()
