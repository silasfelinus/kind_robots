// /utils/scripts/verifyStorymakerBranchState.mjs
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

const storePath = 'stores/storymakerStore.ts'
const pagePath = 'components/conductor/storymaker-page.vue'
const panelPath = 'components/storymaker/storymaker-state-panel.vue'
const transcriptPath = 'components/narrative/narrative-transcript.vue'
const store = source(storePath)
const page = source(pagePath)

includesAll(storePath, [
  'StorymakerBranchChoice',
  'StorymakerConsequence',
  'StorymakerInventoryItem',
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
  'Storymaker state must remain independent from Taskmaster',
)
assert.ok(
  !store.includes('useTodoStore'),
  'Storymaker inventory and consequences must remain fictional',
)
assert.ok(
  !store.includes("performFetch('/api/conductor"),
  'Storymaker choices must not write to Conductor',
)

includesAll(pagePath, [
  'useRewardStore',
  'store.setupDraft.rewardSlugs',
  'Possible story Rewards',
  'rewardStore.initialize({ fetchRemote: true })',
  '<StorymakerStatePanel',
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
  'Storymaker state UI must not expose Taskmaster write-back controls',
)

console.log(
  'Storymaker branch-state contract passed: reader choices, constrained ' +
    'fictional consequences, selected Reward inventory, saved-session migration, ' +
    'hidden state metadata, and the Taskmaster/write-back boundary are present.',
)
