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
  // Section labels, not marketing copy. The old 'Lay out your story' /
  // 'Choose a narrator voice' / 'Choose the shape of the tale' headings came
  // with a 34rem hero wash and a centred 5xl headline above the first input;
  // Silas cut that on 2026-09-09 ("why do we even have the top section so
  // large"). What this guard actually protects is that all four groups still
  // coexist on one surface, so it now pins the surviving group labels.
  'The spark',
  'Narrator voice',
  'Shape of the tale',
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

/*
 * Narrator voice and structure are enum settings, not entities with art, and
 * the only "art" they ever had was borrowed: getTutorialHeroPath() returns the
 * tutorial channel banners, which carry STORIES / CHARACTERS / LOCATIONS /
 * BOTS / REWARDS in large type across the image. That labelled "Cinematic"
 * with a picture reading STORIES and put generated typography on screen
 * (Silas, 2026-09-09: "we aren't supposed to be using text, and this looks
 * like flux rather than krea"). The art-first rule in AGENTS.md is about
 * entities that HAVE art -- the ingredient pickers below still render full
 * art cards, and those are guarded separately.
 */
// Checked as an import, not a mention: the component's own header comment
// names the old helper while explaining why it is gone, and a bare substring
// test would fail a file for documenting its own compliance.
assert.ok(
  !setup.includes('helpers/tutorialCards'),
  'Storybook setup must not dress enum choices in tutorial channel banner art',
)

/*
 * The setup mounts inside storybook-library-page.vue's bounded
 * `min-h-0 flex-1 overflow-hidden` host. Without an explicit height the
 * section sizes to its own content, overflow-y-auto has nothing to scroll
 * against, and the host clips everything past the fold -- the page could not
 * be scrolled at all (Silas, 2026-09-09: "and I can't even scroll!!!!!").
 */
assert.match(
  setup,
  /class="relative h-full min-h-0 overflow-y-auto/,
  'Storybook setup must own a bounded scroll region, or the host clips it',
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
