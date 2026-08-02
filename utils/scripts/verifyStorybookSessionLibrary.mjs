// /utils/scripts/verifyStorybookSessionLibrary.mjs
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

const libraryPath = 'composables/useStorybookLibrary.ts'
const shellPath = 'components/pages/storybook-library-page.vue'
const contentPath = 'content/storybook.md'
const storePath = 'stores/storybookStore.ts'

const library = source(libraryPath)
const shell = source(shellPath)
const store = source(storePath)

includesAll(libraryPath, [
  "const LIBRARY_STORAGE_KEY = 'storybook-session-library-v1'",
  'const MAX_LIBRARY_SESSIONS = 20',
  'entry.userId === userId',
  'function openStory(',
  'function duplicateStory(',
  'async function restartStory(',
  'function buildExport(',
  "format: 'markdown' | 'json'",
  "mimeType: 'application/json'",
  "mimeType: 'text/markdown'",
  'archiveCurrent',
])

includesAll(libraryPath, [
  'const sessionId = makeId()',
  'const beatIds = new Map<string, string>()',
  'const beatId = makeId()',
  'sessionId,',
  'beatId,',
  "dedupeKey: [beat.art.product, sessionId, beatId, beat.art.moment].join(':')",
  'jobId: undefined',
  "beat.art?.status === 'done'",
  'branchHistory: duplicate.branchHistory.map',
  'consequences: duplicate.consequences.map',
  'inventory: duplicate.inventory.map',
])

assert.ok(
  !library.includes("beat.art?.status === 'queued'") &&
    !library.includes("beat.art?.status === 'rendering'"),
  'Duplicated stories must not carry resumable queued or rendering jobs from the source branch',
)
assert.ok(
  library.indexOf('upsert(source)') < library.indexOf('storyStore.beginStory('),
  'Restart must archive the source before creating a fresh opening',
)
assert.ok(
  !library.includes('useTaskmasterStore') &&
    !library.includes('useTodoStore') &&
    !library.includes('useConductorStore'),
  'Storybook lifecycle management must remain fiction-only',
)

includesAll(shellPath, [
  '<StorybookPage />',
  'Story library',
  'Recent stories',
  'library.openStory(',
  'library.duplicateStory(',
  'library.restartStory(',
  'library.buildExport(',
  "format: 'markdown' | 'json'",
  'route.query.story',
  'updateStoryQuery',
  'URL.createObjectURL',
  'library.archiveCurrent()',
])

includesAll(contentPath, [':storybook-library-page'])
assert.ok(
  !source(contentPath).includes(':storybook-page\n'),
  'The route must mount the lifecycle shell instead of bypassing it',
)

includesAll(storePath, [
  "defineStore('storybookStore'",
  'resumeNarrativeArtJobs',
  'retryBeatArt',
  'beginStory',
])
assert.ok(
  !store.includes('storybook-session-library-v1'),
  'The proven generation store must remain independent from library presentation state',
)

console.log(
  'Storybook session-library contract passed: account-scoped recent stories, direct-open, safe duplicate identities, restart, export, and generation-store separation are present.',
)
