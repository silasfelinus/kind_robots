// /utils/scripts/verifyDaVinciChapterFocusGuard.test.ts
//
// Regression test for checkChapterFocusGuard() in
// verifyDaVinciChapterFocusGuard.ts (davinci/t-021 slice 9). Exercises the
// real check against synthetic component-shaped fixtures covering: the
// fixed shape (wrapper + ref/watch all present), several individually-
// regressed pre-fix shapes (missing wrapper ref, missing tabindex, missing
// script-side ref declaration, missing activeElement guard, missing the
// focus() call), and a missing-block regression (the chapter region
// restructured away entirely).
import assert from 'node:assert/strict'

import { checkChapterFocusGuard } from './verifyDaVinciChapterFocusGuard.js'

function templateFixture(wrapperOpenTag: string): string {
  return `
<template>
  ${wrapperOpenTag}
    <div
      v-if="narrating"
      role="status"
      aria-live="polite"
    >
      narrating…
    </div>
    <div v-else-if="narrationError" role="alert">error</div>
    <div v-else-if="currentChapter">chapter</div>
  </div>
</template>
`
}

const SCRIPT_FIXED = `
<script setup lang="ts">
const chapterRegion = ref<HTMLElement | null>(null)

watch(
  () => [narrating.value, narrationError.value, Boolean(currentChapter.value)] as const,
  () => {
    if (!chapterRegion.value?.contains(document.activeElement)) return
    void nextTick(() => {
      chapterRegion.value?.focus()
    })
  },
)
</script>
`

const FIXED_TEMPLATE = templateFixture(
  '<div ref="chapterRegion" tabindex="-1" aria-label="Current chapter">',
)
const FIXED = FIXED_TEMPLATE + SCRIPT_FIXED

// Pre-fix shape: the wrapper div exists but carries neither ref nor
// tabindex (a plain grouping div, the state before this slice).
const NO_WRAPPER_ATTRS_TEMPLATE = templateFixture('<div>')
const NO_WRAPPER_ATTRS = NO_WRAPPER_ATTRS_TEMPLATE + SCRIPT_FIXED

// Regression: ref present but tabindex dropped (not focusable).
const MISSING_TABINDEX_TEMPLATE = templateFixture(
  '<div ref="chapterRegion" aria-label="Current chapter">',
)
const MISSING_TABINDEX = MISSING_TABINDEX_TEMPLATE + SCRIPT_FIXED

// Regression: template wrapper correct, but the script-side ref declaration
// was removed.
const MISSING_SCRIPT_REF =
  FIXED_TEMPLATE +
  `
<script setup lang="ts">
watch(
  () => [narrating.value, narrationError.value, Boolean(currentChapter.value)] as const,
  () => {
    if (!chapterRegion.value?.contains(document.activeElement)) return
    void nextTick(() => {
      chapterRegion.value?.focus()
    })
  },
)
</script>
`

// Regression: the activeElement guard was dropped, so the watch would
// steal focus unconditionally.
const MISSING_GUARD_SCRIPT = `
<script setup lang="ts">
const chapterRegion = ref<HTMLElement | null>(null)

watch(
  () => [narrating.value, narrationError.value, Boolean(currentChapter.value)] as const,
  () => {
    void nextTick(() => {
      chapterRegion.value?.focus()
    })
  },
)
</script>
`
const MISSING_GUARD = FIXED_TEMPLATE + MISSING_GUARD_SCRIPT

// Regression: the guard check survives but the actual focus() call was
// dropped -- the region exists, is checked, but focus never moves.
const MISSING_FOCUS_CALL_SCRIPT = `
<script setup lang="ts">
const chapterRegion = ref<HTMLElement | null>(null)

watch(
  () => [narrating.value, narrationError.value, Boolean(currentChapter.value)] as const,
  () => {
    if (!chapterRegion.value?.contains(document.activeElement)) return
    void nextTick(() => {})
  },
)
</script>
`
const MISSING_FOCUS_CALL = FIXED_TEMPLATE + MISSING_FOCUS_CALL_SCRIPT

// The narrating block itself no longer exists -- the guard's anchor marker
// is gone.
const BLOCK_REMOVED =
  `
<template>
  <div class="playing">
    <p>Something else entirely.</p>
  </div>
</template>
` + SCRIPT_FIXED

function run(): void {
  const fixedErrors = checkChapterFocusGuard(FIXED)
  assert.deepEqual(
    fixedErrors,
    [],
    `expected the fixed fixture to pass, got: ${JSON.stringify(fixedErrors)}`,
  )

  const noWrapperAttrsErrors = checkChapterFocusGuard(NO_WRAPPER_ATTRS)
  assert.equal(noWrapperAttrsErrors.length, 2)
  assert.ok(
    noWrapperAttrsErrors.some((e) =>
      /no longer has a ref="chapterRegion"/.test(e),
    ),
  )
  assert.ok(
    noWrapperAttrsErrors.some((e) => /no longer carries tabindex="-1"/.test(e)),
  )

  const missingTabindexErrors = checkChapterFocusGuard(MISSING_TABINDEX)
  assert.equal(missingTabindexErrors.length, 1)
  assert.ok(
    missingTabindexErrors.some((e) =>
      /no longer carries tabindex="-1"/.test(e),
    ),
  )

  const missingScriptRefErrors = checkChapterFocusGuard(MISSING_SCRIPT_REF)
  assert.equal(missingScriptRefErrors.length, 1)
  assert.ok(
    missingScriptRefErrors.some((e) =>
      /template ref declaration is missing/.test(e),
    ),
  )

  const missingGuardErrors = checkChapterFocusGuard(MISSING_GUARD)
  assert.equal(missingGuardErrors.length, 1)
  assert.ok(missingGuardErrors.some((e) => /no longer checks/.test(e)))

  const missingFocusCallErrors = checkChapterFocusGuard(MISSING_FOCUS_CALL)
  assert.equal(missingFocusCallErrors.length, 1)
  assert.ok(
    missingFocusCallErrors.some((e) =>
      /focus\(\)` -- the region exists/.test(e),
    ),
  )

  const blockRemovedErrors = checkChapterFocusGuard(BLOCK_REMOVED)
  assert.equal(blockRemovedErrors.length, 1)
  assert.ok(
    blockRemovedErrors.some((e) => /Could not find the wrapper/.test(e)),
  )

  console.log(
    'Da Vinci chapter-focus guard self-test passed: missing-ref, missing-' +
      'tabindex, missing-script-ref, missing-guard, missing-focus-call, and ' +
      'missing-block regressions all fail individually; the fixed fixture ' +
      'passes.',
  )
}

run()
