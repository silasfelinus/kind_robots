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
const shellPath = 'components/pages/storybook-library-page.vue'
const setupPath = 'components/storybook/storybook-visual-setup.vue'
const ingredientCardPath = 'components/narrative/narrative-ingredient-card.vue'
const storePath = 'stores/storybookStore.ts'
const agentsPath = 'AGENTS.md'

const page = source(pagePath)
const setup = source(setupPath)
const ingredientCard = source(ingredientCardPath)
const store = source(storePath)
const agents = source(agentsPath)

includesAll(shellPath, [
  '<StorybookVisualSetup v-if="!storyStore.session"',
  'v-show="storyStore.session"',
  '<StorybookPage />',
])

includesAll(setupPath, [
  'Lay out your story',
  'The spark',
  'Choose a narrator voice',
  'Choose the shape of the tale',
  '<NarrativeIngredientMultiPicker',
  '<NarrativeIngredientPicker',
  '<NarrativeRoleAssigner',
  'characterOptions',
  'scenarioOptions',
  'locationOptions',
  'facetOptions',
  'rewardOptions',
  'store.beginStory',
])

assert.ok(
  !setup.includes('setupStep'),
  'The primary Storybook setup must be one visual surface, not a step/tab wizard',
)
assert.ok(
  !setup.includes('setupSteps'),
  'The primary Storybook setup must not recreate the four-step progress nav',
)

includesAll(ingredientCardPath, [
  'aspect-[2/3]',
  'object-cover',
  'bg-linear-to-t from-black/90',
])
assert.ok(
  !ingredientCard.includes('w-28 shrink-0'),
  'Narrative entity art must not be reduced to the old left-thumbnail form row',
)

assert.match(
  agents,
  /Kind Robots is an \*\*art-focused website\*\*/,
  'The standing agent contract must preserve the art-first product rule',
)
assert.match(
  agents,
  /Avoid wizard\/tab proliferation/,
  'Creative setup flows must prefer open visual composition over wizard tabs',
)

includesAll(pagePath, [
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
  'Storybook studio contract passed: art-first single-screen story spread, ' +
    'image-led reusable entity choices, independent persistent sessions, ' +
    'shared narrative presentation, and no Taskmaster/task-write boundary leak.',
)
