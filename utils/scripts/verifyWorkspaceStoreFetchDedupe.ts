import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const sheetSource = readFileSync('stores/sheetStore.ts', 'utf8')
assert.ok(
  sheetSource.includes('const fetchSheetsPromise = ref<Promise<SheetWithDream[]> | null>(null)'),
  'sheetStore must dedupe list fetches.',
)
assert.ok(
  sheetSource.includes('fetchSheetPromises.value[id]'),
  'sheetStore must dedupe detail fetches by Sheet ID.',
)
assert.ok(
  sheetSource.includes('fetchSheetByDreamPromises.value[dreamId]'),
  'sheetStore must dedupe Dream-scoped detail fetches.',
)
assert.ok(
  sheetSource.includes('ensureSheetPromises.value[dreamId]'),
  'sheetStore must dedupe ensure/create commands by Dream ID.',
)

const todoSource = readFileSync('stores/todoStore.ts', 'utf8')
assert.ok(
  todoSource.includes("runFetch(`dream:${dreamId}`"),
  'todoStore must dedupe Dream-scoped fetches.',
)
assert.ok(
  todoSource.includes("runFetch(`project:${projectId}`"),
  'todoStore must dedupe Project-scoped fetches.',
)
assert.ok(
  todoSource.includes("runFetch(`all:${includeArchived ? 1 : 0}`"),
  'todoStore must dedupe full-list fetches by archive mode.',
)
assert.ok(
  todoSource.includes('activeFetches.value += 1') &&
    todoSource.includes('loading.value = activeFetches.value > 0'),
  'todoStore loading must remain true until overlapping fetches settle.',
)

console.log('Workspace store fetch dedupe contract passed.')
