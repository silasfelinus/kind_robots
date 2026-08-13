// /utils/scripts/verifyStorybookStudio.mjs
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

const pagePath = 'components/conductor/storybook-page.vue'
const storePath = 'stores/storybookStore.ts'
const page = source(pagePath)
const store = source(storePath)

includesAll(pagePath, [
  '<NarrativeIngredientMultiPicker',
  '<NarrativeIngredientPicker',
  '<KrChatWindow',
  '<NarrativeResponseComposer',
  'Story bible',
  'store.beginStory',
  'characterStore.initialize',
  "dreamStore.fetchDreams({ dreamType: 'LOCATION'",
])

assert.ok(
  !page.includes('<ProjectFrontPage'),
  'Storybook must be a dedicated studio rather than a project landing card',
)
assert.ok(
  !page.includes("navigateTo('/stories"),
  'Storybook must not forward its primary flow to the generic Stories studio',
)
assert.ok(
  !page.includes('useTaskmasterStore'),
  'Storybook must not import Taskmaster state',
)

includesAll(storePath, [
  "defineStore('storybookStore'",
  "const STORAGE_KEY = 'storybook-session'",
  "const DRAFT_STORAGE_KEY = 'storybook-setup-draft'",
  'StorybookSetupDraft',
  'StorybookBible',
  'beginStory',
  'answerCurrentBeat',
  'finishStory',
  'chatStore.generateText',
])

assert.ok(
  !store.includes('useTaskmasterStore'),
  'Storybook store must not depend on Taskmaster',
)
assert.ok(
  !store.includes('useTodoStore'),
  'Storybook store must not inherit task write-back behavior',
)
assert.ok(
  !store.includes('useConductorStore'),
  'Storybook store must not treat roadmap tasks as story state',
)

const beginStoryBlock = store.slice(
  store.indexOf('async function beginStory'),
  store.indexOf('async function answerCurrentBeat'),
)
includesAll(storePath, ['const openingWove = await weaveBeat'])
assert.match(
  beginStoryBlock,
  /if \(!openingWove\)[\s\S]*session\.value = null[\s\S]*persist\(\)[\s\S]*return openingWove/,
  'Storybook must roll back a failed opening beat so setup remains retryable',
)

includesAll('components/narrative/narrative-ingredient-multi-picker.vue', [
  '<NarrativeIngredientCard',
  'maxSelections',
  "emit('update:modelValue'",
])

console.log(
  'Storybook studio contract passed: dedicated progressive setup, reusable ' +
    'creative entities, story-bible review, persistent independent sessions, ' +
    'shared narrative presentation, and no Taskmaster/task-write boundary leak.',
)
