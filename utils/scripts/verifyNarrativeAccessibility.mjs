// /utils/scripts/verifyNarrativeAccessibility.mjs
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

function source(path) {
  return readFileSync(resolve(process.cwd(), path), 'utf8')
}

function includesAll(path, values) {
  const contents = source(path)
  for (const value of values) {
    assert.ok(contents.includes(value), `${path} must include ${value}`)
  }
}

const transcriptPath = 'components/narrative/narrative-transcript.vue'
const composerPath = 'components/narrative/narrative-response-composer.vue'
const cardPath = 'components/narrative/narrative-ingredient-card.vue'
const pickerPath = 'components/narrative/narrative-ingredient-picker.vue'
const multiPickerPath =
  'components/narrative/narrative-ingredient-multi-picker.vue'
const artStatusPath = 'components/narrative/narrative-art-status.vue'
const specPath = 'cypress/public/narrative-accessibility.cy.ts'

const transcript = source(transcriptPath)
const composer = source(composerPath)
const spec = source(specPath)

includesAll(transcriptPath, [
  ':aria-label="label"',
  ':aria-busy="isStreaming"',
  'role="status" aria-live="polite" aria-atomic="true"',
  ':aria-labelledby="sceneHeadingId(index)"',
  'Scene {{ index + 1 }}',
  '<span class="sr-only">Your response: </span>',
  'aria-hidden="true"',
  'statusAnnouncement',
])
assert.ok(
  !transcript.includes(
    '<section class="space-y-3" aria-live="polite"',
  ),
  'The entire streaming transcript must not be a live region',
)
assert.ok(
  transcript.includes('visibleStreamingText') &&
    transcript.includes("const marker = '[STORY_STATE]'"),
  'Accessibility work must retain hidden Storybook state filtering',
)

includesAll(composerPath, [
  '<fieldset v-if="options.length"',
  '<legend class="sr-only">Suggested responses</legend>',
  '<label :for="textareaId" class="sr-only">Your response</label>',
  ':aria-describedby="hint ? hintId : undefined"',
  ':aria-label="buttonLabel"',
  'textareaElement.value?.focus({ preventScroll: true })',
  'const wasLoading = previous?.[0] ?? false',
  'role="status" aria-live="polite" aria-atomic="true"',
])

for (const path of [cardPath, pickerPath, multiPickerPath, artStatusPath]) {
  includesAll(path, ['motion-reduce:transition-none'])
}

includesAll(cardPath, [
  ':aria-pressed="selected"',
  ':aria-describedby="descriptionId"',
  'alt=""',
  'focus-visible:ring-2',
])
includesAll(pickerPath, [
  'role="group"',
  ':aria-labelledby="headingId"',
  ':aria-describedby="helper ? helperId : undefined"',
  ':aria-expanded="expanded"',
  'role="alert"',
  'role="status"',
])
includesAll(multiPickerPath, [
  'role="group"',
  ':aria-labelledby="headingId"',
  ':aria-describedby="describedBy"',
  'Maximum selections reached.',
  ':aria-expanded="expanded"',
  'aria-live="polite"',
])
includesAll(artStatusPath, [
  ":role=\"isFailure ? 'alert' : 'status'\"",
  'aria-live="polite"',
  'aria-atomic="true"',
  ':aria-label="statusMessage"',
  ':aria-busy="isBusy"',
  'Retry image',
])

includesAll(specPath, [
  '/storybook',
  '/storybook?story=story-accessibility-two',
  '/taskmaster',
  '1440',
  '390',
  'storybook-session',
  'storybook-session-library-v1',
  'taskmaster-session',
  'expectAccessibleTranscript',
  'expectNoHorizontalOverflow',
  'Current action: Label the three donation boxes',
  'What happened in the real world?',
  'aria-pressed',
  'have.focus',
])

for (const forbidden of [
  'cy.request',
  'cypressSeed',
  'cypressCleanup',
  'CYPRESS_API_KEY',
  'CYPRESS_BETA_ADMIN_TOKEN',
  "method: 'POST'",
  "method: 'PATCH'",
  "method: 'DELETE'",
]) {
  assert.ok(
    !spec.includes(forbidden),
    `Narrative public acceptance crossed the read-only boundary: ${forbidden}`,
  )
}

console.log(
  'Narrative accessibility contract passed: concise live announcements, labeled controls, focus recovery, reduced motion, and read-only desktop/mobile journeys are present.',
)
