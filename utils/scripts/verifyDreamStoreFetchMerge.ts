import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  mergeDefinedRecord,
  mergeRecordsById,
} from '../../stores/helpers/recordMerge'

type ExampleRecord = {
  id: number
  title: string
  detail?: string
  relation?: string[] | null
}

const rich: ExampleRecord = {
  id: 1,
  title: 'Rich row',
  detail: 'loaded detail',
  relation: ['one'],
}

const leanWithUndefined: ExampleRecord = {
  id: 1,
  title: 'Fresh title',
  detail: undefined,
  relation: undefined,
}

const merged = mergeDefinedRecord(rich, leanWithUndefined)
assert.equal(merged.title, 'Fresh title')
assert.equal(merged.detail, 'loaded detail')
assert.deepEqual(merged.relation, ['one'])

const explicitlyCleared = mergeDefinedRecord(merged, {
  id: 1,
  title: 'Fresh title',
  relation: [],
})
assert.deepEqual(explicitlyCleared.relation, [])

const rows = mergeRecordsById(
  [rich, { id: 2, title: 'Unrelated cached row', detail: 'keep me' }],
  [leanWithUndefined, { id: 3, title: 'New filtered row' }],
)

assert.equal(rows.length, 3)
assert.equal(rows.find((row) => row.id === 1)?.detail, 'loaded detail')
assert.equal(rows.find((row) => row.id === 2)?.detail, 'keep me')
assert.equal(rows.find((row) => row.id === 3)?.title, 'New filtered row')

const dreamStoreSource = readFileSync('stores/dreamStore.ts', 'utf8')
assert.ok(
  dreamStoreSource.includes('mergeRecordsById(dreams.value, normalizedIncoming)'),
  'dreamStore must merge filtered fetch rows into the existing cache.',
)
assert.ok(
  dreamStoreSource.includes('fetchPromises.value[url]'),
  'dreamStore must dedupe in-flight requests by URL.',
)
assert.ok(
  !dreamStoreSource.includes('dreams.value = res.data.map(normalizeDream)'),
  'dreamStore must not replace its entire cache with a filtered response.',
)

console.log('Dream store fetch merge contract passed.')
