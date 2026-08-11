// /utils/scripts/verifyModelBuilderDraftTextareaGuard.test.ts
//
// Regression test for checkDraftTextareaGuard() in
// verifyModelBuilderDraftTextareaGuard.ts (model-builder/t-029). Exercises
// the real check against synthetic component-shaped fixtures covering: the
// pre-fix shape (textareas disabled only on `!isEditable(...)`, with no
// `isDrafting(field)` check -- the exact bug found by manual read-through),
// the fixed shape, and one textarea missing entirely.
import assert from 'node:assert/strict'

import { checkDraftTextareaGuard } from './verifyModelBuilderDraftTextareaGuard.js'

const BUGGY_FIXTURE = `
<template>
  <textarea
    v-model="pitch"
    rows="2"
    placeholder="Why this output exists…"
    :disabled="!isEditable('PITCH')"
    @change="store.updatePitch(item.id, pitch)"
  />
  <textarea
    v-model="fields"
    rows="2"
    placeholder="Schema fields…"
    :disabled="!isEditable('FIELDS_AND_PROMPTS')"
    @change="store.updateFields(item.id, fields)"
  />
  <textarea
    v-model="prompt"
    rows="2"
    placeholder="The prompt used…"
    :disabled="!isEditable('FIELDS_AND_PROMPTS')"
    @change="store.updatePrompt(item.id, prompt)"
  />
</template>
`

const FIXED_FIXTURE = `
<template>
  <textarea
    v-model="pitch"
    rows="2"
    placeholder="Why this output exists…"
    :disabled="!isEditable('PITCH') || isDrafting('pitch')"
    @change="store.updatePitch(item.id, pitch)"
  />
  <textarea
    v-model="fields"
    rows="2"
    placeholder="Schema fields…"
    :disabled="!isEditable('FIELDS_AND_PROMPTS') || isDrafting('fields')"
    @change="store.updateFields(item.id, fields)"
  />
  <textarea
    v-model="prompt"
    rows="2"
    placeholder="The prompt used…"
    :disabled="!isEditable('FIELDS_AND_PROMPTS') || isDrafting('artPrompt')"
    @change="store.updatePrompt(item.id, prompt)"
  />
</template>
`

const MISSING_FIXTURE = `
<template>
  <div>no textareas here</div>
</template>
`

const buggyErrors = checkDraftTextareaGuard(BUGGY_FIXTURE)
assert.equal(
  buggyErrors.length,
  3,
  `expected the pre-fix shape (no isDrafting checks) to raise 3 errors, ` +
    `got ${buggyErrors.length}: ${JSON.stringify(buggyErrors)}`,
)
assert.ok(buggyErrors[0]!.includes("isDrafting('pitch')"))
assert.ok(buggyErrors[1]!.includes("isDrafting('fields')"))
assert.ok(buggyErrors[2]!.includes("isDrafting('artPrompt')"))

const fixedErrors = checkDraftTextareaGuard(FIXED_FIXTURE)
assert.equal(
  fixedErrors.length,
  0,
  `expected the fixed shape to raise no errors, got: ${JSON.stringify(fixedErrors)}`,
)

const missingErrors = checkDraftTextareaGuard(MISSING_FIXTURE)
assert.equal(
  missingErrors.length,
  3,
  'expected a "not found" violation for each of the three textareas when ' +
    'none are present',
)
for (const error of missingErrors) {
  assert.ok(error.includes('Could not find a textarea'))
}

console.log(
  'Model Builder draft textarea guard checker verified: flags the pre-fix ' +
    'shape (textareas missing isDrafting(field) in :disabled), clears the ' +
    'fixed shape, and flags each textarea being absent entirely.',
)
