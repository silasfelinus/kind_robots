// /utils/scripts/verifyModelBuilderBatchEditorKeyGuard.test.ts
//
// Regression test for checkBatchEditorKeyGuard() in
// verifyModelBuilderBatchEditorKeyGuard.ts (model-builder/t-029). Exercises
// the real check against synthetic template-shaped fixtures covering: the
// pre-fix shape (<model-builder-batch-editor> with no `:key` -- the exact
// bug found by manual read-through), the fixed shape, and the tag being
// absent entirely.
import assert from 'node:assert/strict'

import { checkBatchEditorKeyGuard } from './verifyModelBuilderBatchEditorKeyGuard.js'

const BUGGY_FIXTURE = `
<template>
  <model-builder-batch-editor
    v-if="selectedItem && showBatch"
    :output-key="selectedItem.outputKey"
    @select-item="selectedItemId = $event"
  />

  <model-builder-item-panel
    v-if="selectedItem"
    :key="selectedItem.id"
    :item-id="selectedItem.id"
  />
</template>
`

const FIXED_FIXTURE = `
<template>
  <model-builder-batch-editor
    v-if="selectedItem && showBatch"
    :key="selectedItem.outputKey"
    :output-key="selectedItem.outputKey"
    @select-item="selectedItemId = $event"
  />

  <model-builder-item-panel
    v-if="selectedItem"
    :key="selectedItem.id"
    :item-id="selectedItem.id"
  />
</template>
`

const MISSING_FIXTURE = `
<template>
  <model-builder-item-panel
    v-if="selectedItem"
    :key="selectedItem.id"
    :item-id="selectedItem.id"
  />
</template>
`

const buggyErrors = checkBatchEditorKeyGuard(BUGGY_FIXTURE)
assert.equal(
  buggyErrors.length,
  1,
  `expected the pre-fix shape to raise 1 error, got ${buggyErrors.length}: ` +
    `${JSON.stringify(buggyErrors)}`,
)
assert.ok(buggyErrors[0]!.includes(':key="selectedItem.outputKey"'))

const fixedErrors = checkBatchEditorKeyGuard(FIXED_FIXTURE)
assert.equal(
  fixedErrors.length,
  0,
  `expected the fixed shape to raise no errors, got: ${JSON.stringify(fixedErrors)}`,
)

const missingErrors = checkBatchEditorKeyGuard(MISSING_FIXTURE)
assert.equal(
  missingErrors.length,
  1,
  'expected a single "not found" violation when the batch-editor tag is ' +
    `absent entirely, got ${missingErrors.length}: ${JSON.stringify(missingErrors)}`,
)
assert.ok(missingErrors[0]!.includes('Could not find'))

console.log(
  'Model Builder batch-editor key guard checker verified: flags the ' +
    'pre-fix shape (no :key on <model-builder-batch-editor>), clears the ' +
    'fixed shape, and flags the tag being absent entirely.',
)
