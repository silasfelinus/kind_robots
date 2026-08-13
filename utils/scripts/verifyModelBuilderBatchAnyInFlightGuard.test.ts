// /utils/scripts/verifyModelBuilderBatchAnyInFlightGuard.test.ts
//
// Regression test for checkBatchAnyInFlightGuard() in
// verifyModelBuilderBatchAnyInFlightGuard.ts (model-builder/t-029).
// Exercises the real check against synthetic script-block-shaped fixtures
// covering: the pre-fix shape (every button gates on the narrow per-group
// `batching` -- the exact bug found by manual read-through), the fixed
// shape, a partial fix (anyBatching defined but one button still left on
// the narrow `batching`), and the anyBatching computed being absent
// entirely.
import assert from 'node:assert/strict'

import { checkBatchAnyInFlightGuard } from './verifyModelBuilderBatchAnyInFlightGuard.js'

const BUGGY_FIXTURE = `
<template>
  <button :disabled="batching" @click="draftAll('pitch')">Draft pitches</button>
  <button :disabled="batching" @click="draftAll('fields')">Draft fields</button>
  <button :disabled="batching" @click="store.batchApproveStage(group.outputKey, 'FIELDS_AND_PROMPTS')">Approve fields</button>
  <button :disabled="batching" @click="store.batchAutoBuild(group.outputKey)">Auto-build group</button>
  <button :disabled="batching || !batchValues[field.key]" @click="applyField(field.key)">Apply</button>
</template>
<script setup lang="ts">
const batching = computed(() => store.batchingOutputKey === props.outputKey)
</script>
`

const FIXED_FIXTURE = `
<template>
  <button :disabled="anyBatching" @click="draftAll('pitch')">Draft pitches</button>
  <button :disabled="anyBatching" @click="draftAll('fields')">Draft fields</button>
  <button :disabled="anyBatching" @click="store.batchApproveStage(group.outputKey, 'FIELDS_AND_PROMPTS')">Approve fields</button>
  <button :disabled="anyBatching" @click="store.batchAutoBuild(group.outputKey)">Auto-build group</button>
  <button :disabled="anyBatching || !batchValues[field.key]" @click="applyField(field.key)">Apply</button>
</template>
<script setup lang="ts">
const batching = computed(() => store.batchingOutputKey === props.outputKey)
const anyBatching = computed(() => store.batchingOutputKey !== null)
</script>
`

const PARTIAL_FIX_FIXTURE = `
<template>
  <button :disabled="anyBatching" @click="draftAll('pitch')">Draft pitches</button>
  <button :disabled="anyBatching" @click="draftAll('fields')">Draft fields</button>
  <button :disabled="anyBatching" @click="store.batchApproveStage(group.outputKey, 'FIELDS_AND_PROMPTS')">Approve fields</button>
  <button :disabled="anyBatching" @click="store.batchAutoBuild(group.outputKey)">Auto-build group</button>
  <button :disabled="batching || !batchValues[field.key]" @click="applyField(field.key)">Apply</button>
</template>
<script setup lang="ts">
const batching = computed(() => store.batchingOutputKey === props.outputKey)
const anyBatching = computed(() => store.batchingOutputKey !== null)
</script>
`

const MISSING_FIXTURE = `
<template>
  <button :disabled="batching" @click="draftAll('pitch')">Draft pitches</button>
</template>
<script setup lang="ts">
const batching = computed(() => store.batchingOutputKey === props.outputKey)
</script>
`

const buggyErrors = checkBatchAnyInFlightGuard(BUGGY_FIXTURE)
assert.equal(
  buggyErrors.length,
  6,
  'expected the pre-fix shape to raise 1 "missing anyBatching" error plus ' +
    `5 per-button violations (one per :disabled="...batching..." ` +
    `attribute), got ${buggyErrors.length}: ${JSON.stringify(buggyErrors)}`,
)
assert.ok(buggyErrors[0]!.includes(ANY_BATCHING_MISSING_SNIPPET()))

const fixedErrors = checkBatchAnyInFlightGuard(FIXED_FIXTURE)
assert.equal(
  fixedErrors.length,
  0,
  `expected the fixed shape to raise no errors, got: ${JSON.stringify(fixedErrors)}`,
)

const partialErrors = checkBatchAnyInFlightGuard(PARTIAL_FIX_FIXTURE)
assert.equal(
  partialErrors.length,
  1,
  'expected the partial-fix shape (Apply button left on the narrow ' +
    `batching) to raise exactly 1 error, got ${partialErrors.length}: ` +
    `${JSON.stringify(partialErrors)}`,
)
assert.ok(partialErrors[0]!.includes('batching || !batchValues[field.key]'))

const missingErrors = checkBatchAnyInFlightGuard(MISSING_FIXTURE)
assert.equal(
  missingErrors.length,
  2,
  'expected the anyBatching-computed-absent shape to raise the ' +
    `"missing anyBatching" error plus 1 per-button violation, got ` +
    `${missingErrors.length}: ${JSON.stringify(missingErrors)}`,
)

function ANY_BATCHING_MISSING_SNIPPET(): string {
  return 'Could not find `const anyBatching = computed(() => store.batchingOutputKey !== null)`'
}

console.log(
  'Model Builder batch any-in-flight guard checker verified: flags the ' +
    'pre-fix shape (every button gates on the narrow per-group `batching`), ' +
    'clears the fixed shape, flags a partial fix that leaves one button ' +
    'behind, and flags the anyBatching computed being absent entirely.',
)
