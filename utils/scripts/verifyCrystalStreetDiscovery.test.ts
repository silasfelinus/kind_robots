import assert from 'node:assert/strict'
import { discoveryProgress } from '../crystalStreet/menu'
import { COMPANIONS, ENDING_KEYS, VILLAINS } from '../crystalStreet/rules'

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

assert.equal(ENDING_KEYS.length, VILLAINS.length * 4 + 4)
assert.equal(new Set(ENDING_KEYS).size, ENDING_KEYS.length)
const endingProgress = discoveryProgress(
  ENDING_KEYS.map((id) => ({ id })),
  [ENDING_KEYS[0]!, ENDING_KEYS[0]!, ENDING_KEYS.at(-1)!, 'removed:ending'],
)
assert.equal(endingProgress.discovered.length, 2)
assert.equal(endingProgress.total, ENDING_KEYS.length)
assert.equal(endingProgress.missing, ENDING_KEYS.length - 2)

console.log('Crystal Street discovery progress: passed')
