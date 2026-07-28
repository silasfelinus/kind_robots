// /utils/scripts/verifyStorymakerStudio.mjs
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

const pagePath = 'components/conductor/storymaker-page.vue'
const storePath = 'stores/storymakerStore.ts'
const page = source(pagePath)
const store = source(storePath)

includesAll(pagePath, [
  '<NarrativeIngredientMultiPicker',
  '<NarrativeIngredientPicker',
  '<NarrativeTranscript',
  '<NarrativeResponseComposer',
  'Story bible',
  'store.beginStory',
  'characterStore.initialize',
  "dreamStore.fetchDreams({ dreamType: 'LOCATION'",
])

assert.ok(
  !page.includes('<ProjectFrontPage'),
  'Storymaker must be a dedicated studio rather than a project landing card',
)
assert.ok(
  !page.includes("navigateTo('/stories"),
  'Storymaker must not forward its primary flow to the generic Stories studio',
)
assert.ok(
  !page.includes('useTaskmasterStore'),
  'Storymaker must not import Taskmaster state',
)

includesAll(storePath, [
  "defineStore('storymakerStore'",
  "const STORAGE_KEY = 'storymaker-session'",
  "const DRAFT_STORAGE_KEY = 'storymaker-setup-draft'",
  'StorymakerSetupDraft',
  'StorymakerBible',
  'beginStory',
  'answerCurrentBeat',
  'finishStory',
  'chatStore.generateText',
])

assert.ok(
  !store.includes('useTaskmasterStore'),
  'Storymaker store must not depend on Taskmaster',
)
assert.ok(
  !store.includes('useTodoStore'),
  'Storymaker store must not inherit task write-back behavior',
)
assert.ok(
  !store.includes('useConductorStore'),
  'Storymaker store must not treat roadmap tasks as story state',
)

includesAll('components/narrative/narrative-ingredient-multi-picker.vue', [
  '<NarrativeIngredientCard',
  'maxSelections',
  "emit('update:modelValue'",
])

console.log(
  'Storymaker studio contract passed: dedicated progressive setup, reusable ' +
    'creative entities, story-bible review, persistent independent sessions, ' +
    'shared narrative presentation, and no Taskmaster/task-write boundary leak.',
)
