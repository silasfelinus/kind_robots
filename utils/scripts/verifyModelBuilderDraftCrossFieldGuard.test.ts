// /utils/scripts/verifyModelBuilderDraftCrossFieldGuard.test.ts
//
// Regression test for checkDraftCrossFieldGuard() in
// verifyModelBuilderDraftCrossFieldGuard.ts (model-builder/t-029). Exercises
// the real check against synthetic component-shaped fixtures covering: the
// pre-fix shape (buttons/isManualActionInFlight gated only on per-field
// isDrafting(field), no isAnyDraftInFlight computed at all -- the exact bug
// found by manual read-through), the fixed shape, and buttons missing
// entirely.
import assert from 'node:assert/strict'

import { checkDraftCrossFieldGuard } from './verifyModelBuilderDraftCrossFieldGuard.js'

const BUGGY_FIXTURE = `
<template>
  <button
    type="button"
    :disabled="isAutoBuilding || isManualActionInFlight"
    @click="store.autoBuildItem(item.id)"
  >
    Auto
  </button>
  <button
    type="button"
    :disabled="isDrafting('pitch')"
    @click="draft('pitch')"
  >
    Draft with AI
  </button>
  <button
    type="button"
    :disabled="isDrafting('fields')"
    @click="draft('fields')"
  >
    Draft
  </button>
  <button
    type="button"
    :disabled="isDrafting('artPrompt')"
    @click="draft('artPrompt')"
  >
    Draft
  </button>
</template>
<script setup lang="ts">
const isManualActionInFlight = computed(
  () =>
    isGenerating.value ||
    isQueued.value ||
    isCommitting.value ||
    isDrafting('pitch') ||
    isDrafting('fields') ||
    isDrafting('artPrompt'),
)
</script>
`

const FIXED_FIXTURE = `
<template>
  <button
    type="button"
    :disabled="isAutoBuilding || isManualActionInFlight"
    @click="store.autoBuildItem(item.id)"
  >
    Auto
  </button>
  <button
    type="button"
    :disabled="isAnyDraftInFlight"
    @click="draft('pitch')"
  >
    Draft with AI
  </button>
  <button
    type="button"
    :disabled="isAnyDraftInFlight"
    @click="draft('fields')"
  >
    Draft
  </button>
  <button
    type="button"
    :disabled="isAnyDraftInFlight"
    @click="draft('artPrompt')"
  >
    Draft
  </button>
</template>
<script setup lang="ts">
const isAnyDraftInFlight = computed(() => store.draftingField !== null)

const isManualActionInFlight = computed(
  () =>
    isGenerating.value ||
    isQueued.value ||
    isCommitting.value ||
    isAnyDraftInFlight.value,
)
</script>
`

const MISSING_FIXTURE = `
<template>
  <div>no buttons here</div>
</template>
`

const buggyErrors = checkDraftCrossFieldGuard(BUGGY_FIXTURE)
// 1 (missing isAnyDraftInFlight computed) + 3 (each Draft button) + 1
// (isManualActionInFlight missing the check) = 5
assert.equal(
  buggyErrors.length,
  5,
  `expected the pre-fix shape to raise 5 errors, got ${buggyErrors.length}: ` +
    `${JSON.stringify(buggyErrors)}`,
)
assert.ok(buggyErrors.some((e) => e.includes('isAnyDraftInFlight = computed')))
assert.ok(buggyErrors.some((e) => e.includes("'pitch' Draft button")))
assert.ok(buggyErrors.some((e) => e.includes("'fields' Draft button")))
assert.ok(buggyErrors.some((e) => e.includes("'artPrompt' Draft button")))
assert.ok(
  buggyErrors.some((e) =>
    e.includes('isManualActionInFlight does not include'),
  ),
)

const fixedErrors = checkDraftCrossFieldGuard(FIXED_FIXTURE)
assert.equal(
  fixedErrors.length,
  0,
  `expected the fixed shape to raise no errors, got: ${JSON.stringify(fixedErrors)}`,
)

const missingErrors = checkDraftCrossFieldGuard(MISSING_FIXTURE)
// isAnyDraftInFlight computed missing (1) + 3 buttons not found +
// isManualActionInFlight not found (1) = 5
assert.equal(
  missingErrors.length,
  5,
  'expected a "not found" violation for the computed, each of the three ' +
    'buttons, and isManualActionInFlight when none are present, got ' +
    `${missingErrors.length}: ${JSON.stringify(missingErrors)}`,
)

console.log(
  'Model Builder draft cross-field guard checker verified: flags the ' +
    'pre-fix shape (per-field isDrafting(field) gating only, no ' +
    'isAnyDraftInFlight), clears the fixed shape, and flags the buttons/' +
    'computed being absent entirely.',
)
