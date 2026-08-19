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

const taskmasterPage = source('components/pages/taskmaster-page.vue')
for (const component of [
  '<NarrativeIngredientPicker',
  '<KrChatWindow',
  '<NarrativeResponseComposer',
]) {
  assert.ok(
    taskmasterPage.includes(component),
    `Taskmaster must consume the shared ${component.slice(1)} primitive`,
  )
}

assert.ok(
  !taskmasterPage.includes('v-for="facet in genreFacets"'),
  'Taskmaster must not restore its former duplicated Facet button loop',
)
assert.ok(
  !taskmasterPage.includes('v-for="dream in locationDreams"'),
  'Taskmaster must not restore its former duplicated location button loop',
)
assert.ok(
  !taskmasterPage.includes('v-for="outcome in checkpointOutcomes"') &&
    !taskmasterPage.includes('v-for="tone in TASKMASTER_TONES"'),
  'Taskmaster must not restore its hand-rolled outcome or tone button grids',
)

const taskmasterStore = source('stores/taskmasterStore.ts')
const storybookPage = source('components/conductor/storybook-page.vue')
assert.ok(
  taskmasterStore.includes("defineStore('taskmasterStore'"),
  'Taskmaster must retain its own product store',
)
assert.ok(
  !storybookPage.includes('useTaskmasterStore'),
  'Storybook must not inherit the Taskmaster state machine',
)

console.log(
  'Narrative primitive contract passed: image-first ingredients, progressive ' +
    'selection, transcript/streaming presentation, response composition, ' +
    'Taskmaster adoption, and separate product state are all present.',
)
