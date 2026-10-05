// Contract test for the Butterfly Gallery multi-image view settings
// (stores/helpers/butterflyGalleryViewSettings.ts): the 1-20 clamp, the
// persistence envelope, which entries the grid shows, and the column choice.
import assert from 'node:assert/strict'

import {
  BUTTERFLY_VIEW_MAX,
  BUTTERFLY_VIEW_MIN,
  butterflyGridColumns,
  clampButterflyViewCount,
  defaultButterflyViewSettings,
  loadButterflyViewSettings,
  parseButterflyViewSettings,
  pickButterflyDisplayEntries,
  saveButterflyViewSettings,
} from '../../stores/helpers/butterflyGalleryViewSettings'

assert.equal(BUTTERFLY_VIEW_MIN, 1)
assert.equal(BUTTERFLY_VIEW_MAX, 20)

assert.deepEqual(defaultButterflyViewSettings(), {
  count: 1,
  orientation: 'landscape',
})

assert.equal(clampButterflyViewCount(0), 1, 'below range clamps to 1')
assert.equal(clampButterflyViewCount(-5), 1)
assert.equal(clampButterflyViewCount(21), 20, 'above range clamps to 20')
assert.equal(clampButterflyViewCount('7'), 7, 'numeric strings from inputs')
assert.equal(clampButterflyViewCount(6.6), 7, 'rounds to a whole count')
assert.equal(clampButterflyViewCount('abc'), 1, 'junk falls back to 1')
assert.equal(clampButterflyViewCount(undefined), 1)

assert.equal(parseButterflyViewSettings(null), null)
assert.equal(parseButterflyViewSettings('not json'), null)
assert.equal(parseButterflyViewSettings('42'), null)
assert.deepEqual(
  parseButterflyViewSettings('{"count":99,"orientation":"portrait"}'),
  { count: 20, orientation: 'portrait' },
  'stored counts are re-clamped',
)
assert.deepEqual(
  parseButterflyViewSettings('{"count":4,"orientation":"sideways"}'),
  { count: 4, orientation: 'landscape' },
  'unknown orientation falls back to landscape',
)

{
  const store = new Map<string, string>()
  const storage = {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => void store.set(key, value),
  }
  assert.equal(loadButterflyViewSettings(storage), null)
  saveButterflyViewSettings(storage, { count: 12, orientation: 'portrait' })
  assert.deepEqual(loadButterflyViewSettings(storage), {
    count: 12,
    orientation: 'portrait',
  })
}

const entries = Array.from({ length: 30 }, (_, index) => ({ id: index + 1 }))
const ids = (list: { id: number }[]) => list.map((entry) => entry.id)

assert.deepEqual(ids(pickButterflyDisplayEntries(entries, null, 3)), [1, 2, 3])
assert.deepEqual(ids(pickButterflyDisplayEntries(entries, 2, 3)), [1, 2, 3])
assert.deepEqual(
  ids(pickButterflyDisplayEntries(entries, 8, 3)),
  [6, 7, 8],
  'window slides just far enough to keep the selection visible',
)
assert.deepEqual(
  ids(pickButterflyDisplayEntries(entries.slice(0, 2), 1, 20)),
  [1, 2],
  'short queues show everything they have',
)
assert.deepEqual(ids(pickButterflyDisplayEntries([], null, 5)), [])
assert.deepEqual(
  ids(pickButterflyDisplayEntries(entries, 99, 3)),
  [1, 2, 3],
  'a selection outside the queue does not shift the window',
)

assert.equal(butterflyGridColumns(1, 'landscape', 1.5), 1)
assert.equal(butterflyGridColumns(2, 'landscape', 1.5), 2)
assert.equal(butterflyGridColumns(4, 'landscape', 1.5), 2)
for (let count = 1; count <= 20; count += 1) {
  for (const orientation of ['landscape', 'portrait'] as const) {
    const columns = butterflyGridColumns(count, orientation, 1.5)
    assert.ok(columns >= 1 && columns <= count, `${count}/${orientation}`)
  }
}
assert.ok(
  butterflyGridColumns(12, 'portrait', 1.5) >
    butterflyGridColumns(12, 'landscape', 1.5),
  'portrait tiles are narrower, so they use more columns',
)
assert.equal(
  butterflyGridColumns(6, 'landscape', Number.NaN),
  butterflyGridColumns(6, 'landscape', 1.5),
  'a bad frame ratio falls back to the default',
)

console.log(
  'Butterfly Gallery view settings verified: 1-20 clamp, persistence envelope, selection-safe display window, and orientation-aware grid columns.',
)
