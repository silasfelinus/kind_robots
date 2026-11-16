import assert from 'node:assert/strict'
import { discoveryProgress } from '../crystalStreet/menu'
import { COMPANIONS, VILLAINS } from '../crystalStreet/rules'

const catalog = [{ id: 'a' }, { id: 'b' }, { id: 'c' }]
assert.deepEqual(discoveryProgress(catalog, []), {
  discovered: [],
  total: 3,
  missing: 3,
})
assert.deepEqual(discoveryProgress(catalog, ['b', 'b', 'removed']), {
  discovered: [{ id: 'b' }],
  total: 3,
  missing: 2,
})
assert.deepEqual(discoveryProgress(catalog, new Set(['a', 'b', 'c'])), {
  discovered: catalog,
  total: 3,
  missing: 0,
})
assert.deepEqual(discoveryProgress([], ['removed']), {
  discovered: [],
  total: 0,
  missing: 0,
})

for (const entries of [
  VILLAINS.map(({ id }) => ({ id })),
  COMPANIONS.map(({ id }) => ({ id })),
]) {
  const known = entries.slice(0, 2).map((entry) => entry.id)
  const progress = discoveryProgress(entries, [...known, known[0]!, 'old-id'])
  assert.equal(progress.total, entries.length)
  assert.equal(progress.missing, entries.length - 2)
  assert.deepEqual(
    progress.discovered.map((entry) => entry.id),
    known,
  )
}

console.log('Crystal Street discovery progress: passed')
