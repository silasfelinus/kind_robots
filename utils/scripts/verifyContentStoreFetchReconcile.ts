import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { reconcileRecordsById } from '../../stores/helpers/recordMerge'

type ContentRow = {
  id: number
  title: string
  detail?: string | null
}

const existing: ContentRow[] = [
  { id: 1, title: 'Cached title', detail: 'rich detail' },
  { id: 2, title: 'Deleted server row', detail: 'must disappear' },
]
const incoming: ContentRow[] = [
  { id: 1, title: 'Fresh title', detail: undefined },
  { id: 3, title: 'New server row' },
]
const reconciled = reconcileRecordsById(existing, incoming)

assert.deepEqual(
  reconciled.map((row) => row.id),
  [1, 3],
)
assert.equal(reconciled[0]?.title, 'Fresh title')
assert.equal(reconciled[0]?.detail, 'rich detail')

for (const path of [
  'stores/botStore.ts',
  'stores/characterStore.ts',
  'stores/promptStore.ts',
]) {
  const source = readFileSync(path, 'utf8')
  assert.ok(
    source.includes('reconcileRecordsById('),
    `${path} must reconcile authoritative list responses by ID.`,
  )
  assert.ok(
    source.includes('mergeDefinedRecord('),
    `${path} must preserve richer fields during single-row upserts.`,
  )
}

const botSource = readFileSync('stores/botStore.ts', 'utf8')
assert.ok(
  botSource.indexOf('if (fetchBotsPromise.value)') <
    botSource.indexOf('if (!force && isLoaded.value'),
  'Bot refreshes must share an in-flight request, including force calls.',
)

const characterSource = readFileSync('stores/characterStore.ts', 'utf8')
assert.ok(
  characterSource.indexOf('if (fetchPromise.value)') <
    characterSource.indexOf('if (!force && hasLoaded.value'),
  'Character refreshes must share an in-flight request, including force calls.',
)

const promptSource = readFileSync('stores/promptStore.ts', 'utf8')
assert.ok(
  promptSource.indexOf('if (fetchPromise.value)') <
    promptSource.indexOf('if (!force && hasLoaded.value'),
  'Prompt refreshes must share an in-flight request, including force calls.',
)
assert.ok(
  !promptSource.includes('hasLoaded.value = false\n        handleError(error'),
  'A failed Prompt refresh must not invalidate an already loaded cache.',
)

console.log('Content store fetch reconciliation contract passed.')
