// /utils/scripts/verifyDaVinciPhaseFocusGuard.test.ts
//
// Regression test for checkPhaseFocusGuard() in
// verifyDaVinciPhaseFocusGuard.ts (davinci/t-021 slice 10). Exercises the
// real check against synthetic component-shaped fixtures covering: the
// fixed shape (wrapper + ref/watch all present), several individually-
// regressed pre-fix shapes (missing wrapper ref, missing tabindex, missing
// script-side ref declaration, missing activeElement guard, missing the
// focus() call), and a missing-block regression (the phase chain
// restructured away entirely).
import assert from 'node:assert/strict'

import { checkPhaseFocusGuard } from './verifyDaVinciPhaseFocusGuard.js'

function templateFixture(wrapperOpenTag: string): string {
  return `
<template>
  ${wrapperOpenTag}
    <div v-if="!userStore.isLoggedIn">logged out</div>
    <div v-else-if="phase === 'loading'">loading</div>
    <div v-else-if="phase === 'start'">start</div>
    <div v-else-if="phase === 'playing' && run">playing</div>
    <div v-else-if="phase === 'ending' && endingData">ending</div>
  </div>
</template>
`
}

const SCRIPT_FIXED = `
<script setup lang="ts">
const phaseRegion = ref<HTMLElement | null>(null)

watch(phase, () => {
  if (!phaseRegion.value?.contains(document.activeElement)) return
  void nextTick(() => {
    phaseRegion.value?.focus()
  })
})
</script>
`

const FIXED_TEMPLATE = templateFixture(
  '<div ref="phaseRegion" tabindex="-1" aria-label="Life status">',
)
const FIXED = FIXED_TEMPLATE + SCRIPT_FIXED

// Pre-fix shape: the wrapper div exists but carries neither ref nor
// tabindex (a plain grouping div, the state before this slice).
const NO_WRAPPER_ATTRS_TEMPLATE = templateFixture('<div>')
const NO_WRAPPER_ATTRS = NO_WRAPPER_ATTRS_TEMPLATE + SCRIPT_FIXED

// Regression: ref present but tabindex dropped (not focusable).
const MISSING_TABINDEX_TEMPLATE = templateFixture(
  '<div ref="phaseRegion" aria-label="Life status">',
)
const MISSING_TABINDEX = MISSING_TABINDEX_TEMPLATE + SCRIPT_FIXED

// Regression: template wrapper correct, but the script-side ref declaration
// was removed.
const MISSING_SCRIPT_REF =
  FIXED_TEMPLATE +
  `
<script setup lang="ts">
watch(phase, () => {
  if (!phaseRegion.value?.contains(document.activeElement)) return
  void nextTick(() => {
    phaseRegion.value?.focus()
  })
})
</script>
`

// Regression: the activeElement guard was dropped, so the watch would
// steal focus unconditionally.
const MISSING_GUARD_SCRIPT = `
<script setup lang="ts">
const phaseRegion = ref<HTMLElement | null>(null)

watch(phase, () => {
  void nextTick(() => {
    phaseRegion.value?.focus()
  })
})
</script>
`
const MISSING_GUARD = FIXED_TEMPLATE + MISSING_GUARD_SCRIPT

// Regression: the guard check survives but the actual focus() call was
// dropped -- the region exists, is checked, but focus never moves.
const MISSING_FOCUS_CALL_SCRIPT = `
<script setup lang="ts">
const phaseRegion = ref<HTMLElement | null>(null)

watch(phase, () => {
  if (!phaseRegion.value?.contains(document.activeElement)) return
  void nextTick(() => {})
})
</script>
`
const MISSING_FOCUS_CALL = FIXED_TEMPLATE + MISSING_FOCUS_CALL_SCRIPT

// The logged-out block itself no longer exists -- the guard's anchor marker
// is gone.
const BLOCK_REMOVED =
  `
<template>
  <div class="whole-page">
    <p>Something else entirely.</p>
  </div>
</template>
` + SCRIPT_FIXED

function run(): void {
  const fixedErrors = checkPhaseFocusGuard(FIXED)
  assert.deepEqual(
    fixedErrors,
    [],
    `expected the fixed fixture to pass, got: ${JSON.stringify(fixedErrors)}`,
  )

  const noWrapperAttrsErrors = checkPhaseFocusGuard(NO_WRAPPER_ATTRS)
  assert.equal(noWrapperAttrsErrors.length, 2)
  assert.ok(
    noWrapperAttrsErrors.some((e) =>
      /no longer has a ref="phaseRegion"/.test(e),
    ),
  )
  assert.ok(
    noWrapperAttrsErrors.some((e) => /no longer carries tabindex="-1"/.test(e)),
  )

  const missingTabindexErrors = checkPhaseFocusGuard(MISSING_TABINDEX)
  assert.equal(missingTabindexErrors.length, 1)
  assert.ok(
    missingTabindexErrors.some((e) =>
      /no longer carries tabindex="-1"/.test(e),
    ),
  )

  const missingScriptRefErrors = checkPhaseFocusGuard(MISSING_SCRIPT_REF)
  assert.equal(missingScriptRefErrors.length, 1)
  assert.ok(
    missingScriptRefErrors.some((e) =>
      /template ref declaration is missing/.test(e),
    ),
  )

  const missingGuardErrors = checkPhaseFocusGuard(MISSING_GUARD)
  assert.equal(missingGuardErrors.length, 1)
  assert.ok(missingGuardErrors.some((e) => /no longer checks/.test(e)))

  const missingFocusCallErrors = checkPhaseFocusGuard(MISSING_FOCUS_CALL)
  assert.equal(missingFocusCallErrors.length, 1)
  assert.ok(
    missingFocusCallErrors.some((e) =>
      /focus\(\)` -- the region exists/.test(e),
    ),
  )

  const blockRemovedErrors = checkPhaseFocusGuard(BLOCK_REMOVED)
  assert.equal(blockRemovedErrors.length, 1)
  assert.ok(
    blockRemovedErrors.some((e) => /Could not find the wrapper/.test(e)),
  )

  console.log(
    'Da Vinci phase-focus guard self-test passed: missing-ref, missing-' +
      'tabindex, missing-script-ref, missing-guard, missing-focus-call, and ' +
      'missing-block regressions all fail individually; the fixed fixture ' +
      'passes.',
  )
}

run()
