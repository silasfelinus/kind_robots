// /utils/scripts/verifyStorybookBranchState.mjs
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

const storePath = 'stores/storybookStore.ts'
const pagePath = 'components/conductor/storybook-page.vue'
const panelPath = 'components/storybook/storybook-state-panel.vue'
// The transcript is kr-chat-window now — see verifyNarrativeAccessibility.mjs.
// The hidden-state filtering asserted below moved across intact.
const transcriptPath = 'components/narrative/kr-chat-window.vue'
const store = source(storePath)
const page = source(pagePath)

includesAll(storePath, [
  'StorybookBranchChoice',
  'StorybookConsequence',
  'StorybookInventoryItem',
  'branchHistory: []',
  'consequences: []',
  'inventory: []',
  'stateVersion: 1',
  'parseGeneratedBeat',
  'applyStateDelta',
  'allowedRewards.has(slug)',
  'active.branchHistory.push',
  'normalizeRestoredSession',
])

includesAll(storePath, [
  "const STATE_OPEN = '[STORY_STATE]'",
  "const STATE_CLOSE = '[/STORY_STATE]'",
  'inventoryAdd',
  'inventoryRemove',
  'relationshipShifts',
])

assert.ok(
  !store.includes('useTaskmasterStore'),
  'Storybook state must remain independent from Taskmaster',
)
assert.ok(
  !store.includes('useTodoStore'),
  'Storybook inventory and consequences must remain fictional',
)
assert.ok(
  !store.includes("performFetch('/api/conductor"),
  'Storybook choices must not write to Conductor',
)

includesAll(pagePath, [
  'useRewardStore',
  'store.setupDraft.rewardSlugs',
  'Possible story Rewards',
  'rewardStore.initialize({ fetchRemote: true })',
  '<StorybookStatePanel',
  'rewards: selectedRewards.value.map(toIngredient)',
])

includesAll(panelPath, [
  'session.inventory',
  'session.consequences',
  'session.branchHistory',
  'Branch path',
  'Inventory',
])

includesAll(transcriptPath, [
  'visibleStreamingText',
  "const marker = '[STORY_STATE]'",
  'marker.startsWith(partialLine)',
])

assert.ok(
  !page.includes('applyWriteBack'),
  'Storybook state UI must not expose Taskmaster write-back controls',
)

console.log(
  'Storybook branch-state contract passed: reader choices, constrained ' +
    'fictional consequences, selected Reward inventory, saved-session migration, ' +
    'hidden state metadata, and the Taskmaster/write-back boundary are present.',
)
