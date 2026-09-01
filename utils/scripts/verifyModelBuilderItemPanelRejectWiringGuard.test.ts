// /utils/scripts/verifyModelBuilderItemPanelRejectWiringGuard.test.ts
//
// Regression test for checkItemPanelRejectWiringGuard() in
// verifyModelBuilderItemPanelRejectWiringGuard.ts (model-builder/t-029,
// cycle 78). Exercises the real check against synthetic file-shaped
// fixtures covering: the pre-fix shape (no reject() wrapper, no Reject
// buttons at all -- store.rejectStage has no caller), the fixed shape (all
// three stages wired), a partial fix (wrapper defined but one stage's
// button missing), and the wrapper defined with a differently-shaped body
// (should still be flagged, since the guard checks the exact call shape).
import assert from 'node:assert/strict'

import { checkItemPanelRejectWiringGuard } from './verifyModelBuilderItemPanelRejectWiringGuard.js'

const BUGGY_FIXTURE = `
<template>
  <button type="button" :disabled="isLocked('PITCH') || !pitch.trim()" @click="approve('PITCH')">
    Approve pitch
  </button>
</template>
<script setup lang="ts">
function approve(stage: BuildStageKey): void {
  store.approveStage(props.itemId, stage)
}
</script>
`

const FIXED_FIXTURE = `
<template>
  <button
    type="button"
    :disabled="isLocked('PITCH') || isAnyDraftInFlight"
    @click="reject('PITCH')"
  >
    Reject
  </button>
  <button
    type="button"
    :disabled="isLocked('FIELDS_AND_PROMPTS') || isAnyDraftInFlight"
    @click="reject('FIELDS_AND_PROMPTS')"
  >
    Reject
  </button>
  <button
    type="button"
    :disabled="isLocked('GENERATE_ASSETS') || isGenerating || isQueued"
    @click="reject('GENERATE_ASSETS')"
  >
    Reject
  </button>
</template>
<script setup lang="ts">
function approve(stage: BuildStageKey): void {
  store.approveStage(props.itemId, stage)
}

function reject(stage: BuildStageKey): void {
  store.rejectStage(props.itemId, stage)
}
</script>
`

const PARTIAL_FIX_FIXTURE = `
<template>
  <button
    type="button"
    :disabled="isLocked('PITCH') || isAnyDraftInFlight"
    @click="reject('PITCH')"
  >
    Reject
  </button>
  <button
    type="button"
    :disabled="isLocked('FIELDS_AND_PROMPTS') || isAnyDraftInFlight"
    @click="reject('FIELDS_AND_PROMPTS')"
  >
    Reject
  </button>
</template>
<script setup lang="ts">
function reject(stage: BuildStageKey): void {
  store.rejectStage(props.itemId, stage)
}
</script>
`

const WRONG_BODY_FIXTURE = `
<template>
  <button
    type="button"
    :disabled="isLocked('PITCH') || isAnyDraftInFlight"
    @click="reject('PITCH')"
  >
    Reject
  </button>
  <button
    type="button"
    :disabled="isLocked('FIELDS_AND_PROMPTS') || isAnyDraftInFlight"
    @click="reject('FIELDS_AND_PROMPTS')"
  >
    Reject
  </button>
  <button
    type="button"
    :disabled="isLocked('GENERATE_ASSETS') || isGenerating || isQueued"
    @click="reject('GENERATE_ASSETS')"
  >
    Reject
  </button>
</template>
<script setup lang="ts">
function reject(stage: BuildStageKey): void {
  console.log('rejecting', stage)
}
</script>
`

const buggyErrors = checkItemPanelRejectWiringGuard(BUGGY_FIXTURE)
assert.equal(
  buggyErrors.length,
  4,
  'expected the pre-fix shape (no reject() wrapper, no Reject buttons) to ' +
    `raise 4 errors (wrapper + 3 stages), got ${buggyErrors.length}: ` +
    `${JSON.stringify(buggyErrors)}`,
)
assert.ok(buggyErrors[0]!.includes('reject(stage: BuildStageKey)` wrapper'))

const fixedErrors = checkItemPanelRejectWiringGuard(FIXED_FIXTURE)
assert.equal(
  fixedErrors.length,
  0,
  `expected the fixed shape to raise no errors, got: ${JSON.stringify(fixedErrors)}`,
)

const partialErrors = checkItemPanelRejectWiringGuard(PARTIAL_FIX_FIXTURE)
assert.equal(
  partialErrors.length,
  1,
  'expected the partial-fix shape (GENERATE_ASSETS button missing) to ' +
    `raise exactly 1 error, got ${partialErrors.length}: ` +
    `${JSON.stringify(partialErrors)}`,
)
assert.ok(partialErrors[0]!.includes('GENERATE_ASSETS stage'))

const wrongBodyErrors = checkItemPanelRejectWiringGuard(WRONG_BODY_FIXTURE)
assert.equal(
  wrongBodyErrors.length,
  1,
  'expected the wrong-body shape (reject() defined but not calling ' +
    `store.rejectStage) to raise exactly 1 error, got ` +
    `${wrongBodyErrors.length}: ${JSON.stringify(wrongBodyErrors)}`,
)
assert.ok(wrongBodyErrors[0]!.includes('reject(stage: BuildStageKey)` wrapper'))

console.log(
  'Model Builder item-panel Reject wiring guard checker verified: flags ' +
    'the pre-fix shape (no reject() wrapper, no Reject buttons at all), ' +
    "clears the fixed shape, flags a partial fix missing one stage's " +
    "button, and flags reject() being redefined with a body that doesn't " +
    'actually call store.rejectStage.',
)
