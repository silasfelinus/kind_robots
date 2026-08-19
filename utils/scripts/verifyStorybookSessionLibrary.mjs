// /utils/scripts/verifyStorybookSessionLibrary.mjs
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

function source(path) { return readFileSync(resolve(process.cwd(), path), 'utf8') }
function includesAll(path, values) {
  const contents = source(path)
  for (const value of values) assert.ok(contents.includes(value), `${path} must include ${value}`)
}

const helperPath = 'stores/helpers/storybookLibraryHelper.ts'
const shellPath = 'components/pages/storybook-library-page.vue'
const contentPath = 'content/storybook.md'
const storePath = 'stores/storybookStore.ts'

const helper = source(helperPath)
const shell = source(shellPath)
const store = source(storePath)

includesAll(helperPath, [
  "const LIBRARY_STORAGE_KEY = 'storybook-session-library-v1'",
  'const MAX_LIBRARY_SESSIONS = 20',
  'bridge.authenticatedUserId()',
  'function openStory(',
  'function duplicateStory(',
  'async function restartStory(',
  'function buildExport(',
  "format: 'markdown' | 'json'",
  'archiveCurrent',
])
includesAll(helperPath, [
  'const sessionId = makeId()',
  'const beatIds = new Map<string, string>()',
  'const beatId = makeId()',
  "dedupeKey: [beat.art.product, sessionId, beatId, beat.art.moment].join(':')",
  // storybook/t-010 (verifyStorybookDuplicateArtCarryoverGuard): a duplicate
  // used to carry forward only a `status === 'done'` illustration, silently
  // and permanently dropping any queued/rendering/failed one instead. The
  // fixed shape carries every status except the unresolved 'queueing' gap
  // forward, clearing `jobId` only once an illustration is actually done.
  "jobId: beat.art.status === 'done' ? undefined : beat.art.jobId",
  "beat.art && beat.art.status !== 'queueing'",
  'branchHistory: duplicate.branchHistory.map',
  'consequences: duplicate.consequences.map',
  'inventory: duplicate.inventory.map',
])
assert.ok(!helper.includes("beat.art?.status === 'queued'") && !helper.includes("beat.art?.status === 'rendering'"))
assert.ok(helper.indexOf('upsert(source)') < helper.indexOf('bridge.beginStory('))
assert.ok(!helper.includes('useTaskmasterStore') && !helper.includes('useTodoStore') && !helper.includes('useConductorStore'))

includesAll(storePath, [
  "defineStore('storybookStore'",
  'createStorybookLibraryController',
  'initializeLibrary',
  'recentStories',
  'openStory',
  'duplicateStory',
  'restartStory',
  'buildExport',
  "const STORYBOOK_MODE_STORAGE_KEY = 'storybookMode'",
  'function setMode(',
])
includesAll(shellPath, [
  '<StorybookPage />',
  'Story library',
  'Recent stories',
  'storyStore.openStory(',
  'storyStore.duplicateStory(',
  'storyStore.restartStory(',
  'storyStore.buildExport(',
  'storyStore.archiveCurrent()',
])
assert.ok(!shell.includes('useStorybookLibrary'))
includesAll(contentPath, [':storybook-library-page'])
assert.ok(!source(contentPath).includes(':storybook-page\n'))

console.log('Storybook session-library contract passed: library and reading-mode state are owned by storybookStore, with helper-only implementation machinery.')
