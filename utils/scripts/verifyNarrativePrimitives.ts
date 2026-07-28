// /utils/scripts/verifyNarrativePrimitives.ts
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

function source(path: string): string {
  return readFileSync(resolve(process.cwd(), path), 'utf8')
}

function includesAll(path: string, values: string[]): void {
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

includesAll('components/narrative/narrative-transcript.vue', [
  'aria-live="polite"',
  ':aria-busy="isStreaming"',
  'beat.answer?.text',
  'streamingText',
])

includesAll('components/narrative/narrative-response-composer.vue', [
  'v-for="option in options"',
  '@keydown.enter.exact.prevent="submit()"',
  "emit('submit', text)",
])

const taskmasterPage = source('components/pages/taskmaster-page.vue')
for (const component of [
  '<NarrativeIngredientPicker',
  '<NarrativeTranscript',
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

const taskmasterStore = source('stores/taskmasterStore.ts')
const storymakerPage = source('components/conductor/storymaker-page.vue')
assert.ok(
  taskmasterStore.includes("defineStore('taskmasterStore'"),
  'Taskmaster must retain its own product store',
)
assert.ok(
  !storymakerPage.includes('useTaskmasterStore'),
  'Storymaker must not inherit the Taskmaster state machine',
)

console.log(
  'Narrative primitive contract passed: image-first ingredients, progressive ' +
    'selection, transcript/streaming presentation, response composition, ' +
    'Taskmaster adoption, and separate product state are all present.',
)
