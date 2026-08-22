// /utils/scripts/verifyModelBuilderItemPanelAutoRunGuard.test.ts
//
// Regression test for checkItemPanelAutoRunGuard() in
// verifyModelBuilderItemPanelAutoRunGuard.ts (model-builder/t-029, cycle 51).
// Exercises the real check against synthetic script-block-shaped fixtures
// covering: the pre-fix shape (Auto button gates only on this item's own
// flags, runOperationInFlight computed absent), the fixed shape, a partial
// fix (computed defined but the button's :disabled left unchanged), and the
// Auto button markup itself being restructured beyond recognition.
import assert from 'node:assert/strict'

import { checkItemPanelAutoRunGuard } from './verifyModelBuilderItemPanelAutoRunGuard.js'

const BUGGY_FIXTURE = `
<template>
  <button
    type="button"
    :disabled="isAutoBuilding || isManualActionInFlight"
    :title="autoButtonTitle"
    @click="store.autoBuildItem(item.id)"
  >
    Auto
  </button>
</template>
<script setup lang="ts">
const isAutoBuilding = computed(() => store.autoBuildingItemId === props.itemId)
</script>
`

const FIXED_FIXTURE = `
<template>
  <button
    type="button"
    :disabled="isAutoBuilding || isManualActionInFlight || runOperationInFlight"
    :title="autoButtonTitle"
    @click="store.autoBuildItem(item.id)"
  >
    Auto
  </button>
</template>
<script setup lang="ts">
const isAutoBuilding = computed(() => store.autoBuildingItemId === props.itemId)
const runOperationInFlight = computed(
  () => store.autoBuilding || store.batchingOutputKey !== null,
)
</script>
`

const PARTIAL_FIX_FIXTURE = `
<template>
  <button
    type="button"
    :disabled="isAutoBuilding || isManualActionInFlight"
    :title="autoButtonTitle"
    @click="store.autoBuildItem(item.id)"
  >
    Auto
  </button>
</template>
<script setup lang="ts">
const isAutoBuilding = computed(() => store.autoBuildingItemId === props.itemId)
const runOperationInFlight = computed(
  () => store.autoBuilding || store.batchingOutputKey !== null,
)
</script>
`

const MISSING_BUTTON_FIXTURE = `
<template>
  <button type="button" @click="store.autoBuildItem(item.id)">Auto</button>
</template>
<script setup lang="ts">
const runOperationInFlight = computed(
  () => store.autoBuilding || store.batchingOutputKey !== null,
)
</script>
`

const buggyErrors = checkItemPanelAutoRunGuard(BUGGY_FIXTURE)
assert.equal(
  buggyErrors.length,
  2,
  'expected the pre-fix shape to raise the "missing runOperationInFlight" ' +
    `error plus the button-not-gating error, got ${buggyErrors.length}: ` +
    `${JSON.stringify(buggyErrors)}`,
)
assert.ok(buggyErrors[0]!.includes('runOperationInFlight` computed'))
assert.ok(buggyErrors[1]!.includes('not gating on'))

const fixedErrors = checkItemPanelAutoRunGuard(FIXED_FIXTURE)
assert.equal(
  fixedErrors.length,
  0,
  `expected the fixed shape to raise no errors, got: ${JSON.stringify(fixedErrors)}`,
)

const partialErrors = checkItemPanelAutoRunGuard(PARTIAL_FIX_FIXTURE)
assert.equal(
  partialErrors.length,
  1,
  'expected the partial-fix shape (computed defined, button unchanged) to ' +
    `raise exactly 1 error, got ${partialErrors.length}: ` +
    `${JSON.stringify(partialErrors)}`,
)
assert.ok(partialErrors[0]!.includes('not gating on'))

const missingButtonErrors = checkItemPanelAutoRunGuard(MISSING_BUTTON_FIXTURE)
assert.equal(
  missingButtonErrors.length,
  1,
  'expected the restructured-button shape (no :disabled/:title pair before ' +
    `the click handler) to raise exactly 1 error, got ` +
    `${missingButtonErrors.length}: ${JSON.stringify(missingButtonErrors)}`,
)
assert.ok(missingButtonErrors[0]!.includes('Could not find the Auto button'))

console.log(
  'Model Builder item-panel Auto run-in-flight guard checker verified: ' +
    'flags the pre-fix shape (Auto button ungated on run/batch state, ' +
    'runOperationInFlight absent), clears the fixed shape, flags a partial ' +
    "fix that defines the computed but leaves the button's :disabled " +
    'unchanged, and flags the button markup being restructured beyond ' +
    'recognition.',
)
