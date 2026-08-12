// /utils/scripts/verifyModelBuilderDraftTextareaGuard.test.ts
//
// Regression test for checkDraftTextareaGuard() in
// verifyModelBuilderDraftTextareaGuard.ts (model-builder/t-029). Exercises
// the real check against synthetic component-shaped fixtures covering: the
// original pre-fix shape (textareas disabled only on `!isEditable(...)`,
// with no drafting check at all), the narrower `isDrafting(field)`-only
// shape (the first fix -- now itself insufficient, since a draft on a
// sibling field or a different item silently steals the shared
// `draftingField` slot and re-enables this textarea while its own request
// is still in flight), the current fixed shape (`isAnyDraftInFlight`), and
// one textarea missing entirely.
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

// The first fix's shape -- gates each textarea on its own field's
// isDrafting(field) only. Passed the original guard, but is insufficient:
// draftingField is one shared slot, so a draft started on a sibling field
// (or a different item) silently steals it, and this textarea re-enables
// while its own request is still pending.
const NARROW_FIXTURE = `
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

const FIXED_FIXTURE = `
<template>
  <textarea
    v-model="pitch"
    rows="2"
    placeholder="Why this output exists…"
    :disabled="!isEditable('PITCH') || isAnyDraftInFlight"
    @change="store.updatePitch(item.id, pitch)"
  />
  <textarea
    v-model="fields"
    rows="2"
    placeholder="Schema fields…"
    :disabled="!isEditable('FIELDS_AND_PROMPTS') || isAnyDraftInFlight"
    @change="store.updateFields(item.id, fields)"
  />
  <textarea
    v-model="prompt"
    rows="2"
    placeholder="The prompt used…"
    :disabled="!isEditable('FIELDS_AND_PROMPTS') || isAnyDraftInFlight"
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
  `expected the pre-fix shape (no drafting checks) to raise 3 errors, ` +
    `got ${buggyErrors.length}: ${JSON.stringify(buggyErrors)}`,
)
for (const error of buggyErrors) {
  assert.ok(error.includes('isAnyDraftInFlight'))
}

const narrowErrors = checkDraftTextareaGuard(NARROW_FIXTURE)
assert.equal(
  narrowErrors.length,
  3,
  'expected the narrower isDrafting(field)-only shape (the superseded ' +
    `first fix) to still raise 3 errors, got ${narrowErrors.length}: ` +
    `${JSON.stringify(narrowErrors)}`,
)
for (const error of narrowErrors) {
  assert.ok(error.includes('isAnyDraftInFlight'))
}

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
    'shape (no drafting check) and the superseded narrower ' +
    'isDrafting(field)-only shape, clears the current isAnyDraftInFlight ' +
    'shape, and flags each textarea being absent entirely.',
)
