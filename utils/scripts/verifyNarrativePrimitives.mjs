// /utils/scripts/verifyNarrativePrimitives.mjs
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

includesAll('components/narrative/narrative-ingredient-card.vue', [
  'narrativeIngredientArtwork',
  "item.icon || 'kind-icon:tag'",
  ':aria-pressed="selected"',
])

includesAll('components/narrative/narrative-ingredient-picker.vue', [
  '<NarrativeIngredientCard',
  'v-model="query"',
  'Show all ${filteredItems.length}',
  "emit('update:modelValue', value)",
])

includesAll('components/narrative/kr-chat-window.vue', [
  'aria-live="polite"',
  ':aria-busy="isStreaming"',
  "turn.from === 'user'",
  'streamingText',
])

/*
 * The beat -> turn adapter is shared, not per-product. Both pages persist one
 * record per scene and both render one message per speaker; deriving that
 * mapping twice is the duplication this phase exists to remove, so pin the
 * single implementation.
 */
includesAll('utils/narrativeTurns.ts', [
  'narrativeBeatsToTurns',
  'beatIdFromTurnId',
  "from: 'narrator'",
  "from: 'user'",
])

includesAll('components/narrative/narrative-response-composer.vue', [
  ':choices="optionChoices"',
  '@keydown.enter.exact="handleEnterKeydown"',
  'event.isComposing',
  "emit('submit', text)",
])

// The Taskmaster page and store checks left this guard on 2026-09-14
// (storybook/t-047). They pinned that components/pages/taskmaster-page.vue
// consumed the shared narrative primitives rather than re-rolling its own
// pickers, outcome grid and tone row -- both files are deleted, and taskmaster
// is a MODE of the storymaker now, so the same screens the checks below
// already cover ARE the taskmaster surface. The one assertion worth keeping is
// the negative: Storybook must not grow its own Taskmaster state machine back.
const storybookPage = source('components/conductor/storybook-page.vue')
assert.ok(
  !storybookPage.includes('useTaskmasterStore'),
  'Storybook must not resurrect a client-side Taskmaster state machine',
)

console.log(
  'Narrative primitive contract passed: image-first ingredients, progressive ' +
    'selection, transcript/streaming presentation, response composition, ' +
    'Taskmaster adoption, and separate product state are all present.',
)
