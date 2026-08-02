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

/*
 * The transcript IS the chat window now (interface-vision Phase 3).
 * narrative-transcript.vue and kr-chat-window.vue were the same component with
 * different markup, so the duplicate is gone and every assertion below moved to
 * the survivor. Each one is preserved or strengthened, never dropped — that is
 * the only honest way to retarget a contract at a replacement.
 */
const transcriptPath = 'components/narrative/kr-chat-window.vue'
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
  ':aria-labelledby="turnHeadingId(index)"',
  '`Scene ${narratorTurnNumber(index)}`',
  // The reader's own turn is a named heading now rather than an inline
  // "Your response: " prefix — a stronger guarantee, since a screen reader
  // can navigate to it.
  "'Your response'",
  'aria-hidden="true"',
  'statusAnnouncement',
])
/*
 * The old transcript's whole-region live-announcement bug, restated for the
 * component that replaced it. role="log" carries an implicit
 * aria-live="polite", so putting it on the scroll container would announce
 * every arriving turn twice — once verbatim and once via the sr-only status
 * region below it. The single status region is the only announcement channel.
 */
// Read the scroll container's own opening tag rather than the whole file: the
// component explains in a comment WHY it avoids role="log", and a naive
// substring search would trip over that explanation and report the bug it is
// documenting the absence of.
const scrollContainerTag = transcript.match(/<section\s[^>]*ref="scrollEl"[^>]*>/)?.[0]
assert.ok(
  scrollContainerTag,
  'The transcript must have a single identifiable scroll container',
)
assert.ok(
  !/role="log"|role="alert"|aria-live=/.test(scrollContainerTag),
  'The entire streaming transcript must not be a live region',
)
assert.ok(
  /<section\s[^>]*:aria-label="label"/.test(transcript),
  'The transcript must be a named region so assistive tech can jump to it',
)
assert.ok(
  transcript.includes('visibleStreamingText') &&
    transcript.includes("const marker = '[STORY_STATE]'"),
  'Accessibility work must retain hidden Storybook state filtering',
)

includesAll(composerPath, [
  // Suggested responses are kr-choice-list now. The named group survives —
  // role="group" + aria-label there, where this was fieldset + sr-only legend.
  'label="Suggested responses"',
  '<label :for="textareaId" class="sr-only">Your response</label>',
  ':aria-describedby="hint ? hintId : undefined"',
  ':aria-label="buttonLabel"',
  'textareaElement.value?.focus({ preventScroll: true })',
  'const wasLoading = previous?.[0] ?? false',
  'role="status" aria-live="polite" aria-atomic="true"',
])

const choiceListPath = 'components/narrative/kr-choice-list.vue'
for (const path of [
  cardPath,
  pickerPath,
  multiPickerPath,
  artStatusPath,
  // The shared choice list now renders the suggested-response row, the
  // Taskmaster outcome picker, the tone row and the narrator's quick topics.
  // It lifts on hover, so it owes readers the same reduced-motion respect.
  choiceListPath,
]) {
  includesAll(path, ['motion-reduce:transition-none'])
}

includesAll(choiceListPath, [
  'role="group"',
  ':aria-label="label"',
  ':aria-pressed="selectedKey === choice.key"',
  'focus-visible:ring-2',
])

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
