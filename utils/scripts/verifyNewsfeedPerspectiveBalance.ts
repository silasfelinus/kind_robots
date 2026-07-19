// /utils/scripts/verifyNewsfeedPerspectiveBalance.ts
//
// Regression test for the perspective-balance ranking layer (conductor
// projects/newsfeed t-011, per BIAS-CONTROLS.md): stores/helpers/newsfeed.ts's
// applyPerspectiveBalance() and PERSPECTIVE_MODE_PRESETS. No network/Vue
// dependency -- pure functions over fixture NewsFeedItem objects.
import assert from 'node:assert/strict'

import {
  DEFAULT_PERSPECTIVE_WEIGHTS,
  PERSPECTIVE_MODE_PRESETS,
  applyPerspectiveBalance,
  type NewsFeedItem,
  type PerspectiveLabel,
  type PerspectiveWeights,
} from '../../stores/helpers/newsfeed'

function item(overrides: Partial<NewsFeedItem>): NewsFeedItem {
  return {
    id: overrides.id ?? 'fixture-id',
    title: overrides.title ?? 'Fixture title',
    summary: overrides.summary ?? '',
    source: overrides.source ?? 'Fixture Source',
    sourceId: overrides.sourceId ?? 'fixture-source',
    url: overrides.url ?? 'https://example.com',
    publishedAt: overrides.publishedAt ?? '2026-01-01T00:00:00.000Z',
    category: overrides.category ?? [],
    ...overrides,
  }
}

function politicalItem(id: string, label?: PerspectiveLabel): NewsFeedItem {
  return item({
    id,
    topicPolitical: true,
    perspective: label ? { label, source: 'Fixture Rater' } : undefined,
  })
}

// --- non-political items are never touched ---------------------------------

const nonPolitical = [
  item({ id: 'tech-1' }),
  item({ id: 'tech-2' }),
  item({ id: 'tech-3' }),
]
assert.deepEqual(
  applyPerspectiveBalance(nonPolitical, DEFAULT_PERSPECTIVE_WEIGHTS).map(
    (i) => i.id,
  ),
  ['tech-1', 'tech-2', 'tech-3'],
  'items with no topicPolitical flag must keep their exact original order',
)

// --- fewer than two political items is a pass-through -----------------------

const singlePolitical = [item({ id: 'a' }), politicalItem('b', 'left')]
assert.deepEqual(
  applyPerspectiveBalance(singlePolitical, DEFAULT_PERSPECTIVE_WEIGHTS).map(
    (i) => i.id,
  ),
  ['a', 'b'],
  'a single political item has nothing to balance against -- pass through unchanged',
)

// --- non-political items pinned at their original index ---------------------

const mixed = [
  item({ id: 'tech-a' }),
  politicalItem('left-1', 'left'),
  politicalItem('right-1', 'right'),
  item({ id: 'tech-b' }),
  politicalItem('left-2', 'left'),
  politicalItem('right-2', 'right'),
]
const mixedBalanced = applyPerspectiveBalance(mixed, DEFAULT_PERSPECTIVE_WEIGHTS)
assert.equal(mixedBalanced[0]?.id, 'tech-a', 'non-political item must stay at index 0')
assert.equal(mixedBalanced[3]?.id, 'tech-b', 'non-political item must stay at index 3')
assert.deepEqual(
  mixedBalanced.map((i) => i.id).filter((id) => id.startsWith('tech-')),
  ['tech-a', 'tech-b'],
  'non-political items must never move relative to each other or the whole list',
)

// --- equal weights interleave buckets rather than grouping them -------------

const evenLeft = [
  politicalItem('left-1', 'left'),
  politicalItem('left-2', 'left'),
  politicalItem('left-3', 'left'),
]
const evenRight = [
  politicalItem('right-1', 'right'),
  politicalItem('right-2', 'right'),
  politicalItem('right-3', 'right'),
]
const evenMerged = applyPerspectiveBalance(
  [...evenLeft, ...evenRight],
  DEFAULT_PERSPECTIVE_WEIGHTS,
).map((i) => i.id)
assert.notDeepEqual(
  evenMerged,
  ['left-1', 'left-2', 'left-3', 'right-1', 'right-2', 'right-3'],
  'equal weights must interleave left/right rather than leaving them grouped by input order',
)
// Every bucket's own internal order is preserved regardless of interleaving.
assert.deepEqual(
  evenMerged.filter((id) => id.startsWith('left-')),
  ['left-1', 'left-2', 'left-3'],
)
assert.deepEqual(
  evenMerged.filter((id) => id.startsWith('right-')),
  ['right-1', 'right-2', 'right-3'],
)

// --- weighting toward one bucket surfaces it earlier ------------------------

const skewWeights: PerspectiveWeights = {
  left: 5,
  centerLeft: 1,
  center: 1,
  centerRight: 1,
  right: 0.2,
}
const skewed = applyPerspectiveBalance(
  [...evenLeft, ...evenRight],
  skewWeights,
).map((i) => i.id)
assert.ok(
  skewed.indexOf('left-1') < skewed.indexOf('right-1'),
  'a heavily left-weighted balance must surface the first left item before the first right item',
)

// --- unrated political items form their own bucket, never excluded ---------

const withUnrated = [
  politicalItem('left-1', 'left'),
  politicalItem('unrated-1'),
  politicalItem('right-1', 'right'),
  politicalItem('unrated-2'),
]
const unratedResult = applyPerspectiveBalance(
  withUnrated,
  DEFAULT_PERSPECTIVE_WEIGHTS,
).map((i) => i.id)
assert.deepEqual(
  [...unratedResult].sort(),
  [...withUnrated.map((i) => i.id)].sort(),
  'unrated political items must remain present -- never dropped',
)

// --- all-zero custom weights degrades to a no-op rather than looping -------

const zeroWeights: PerspectiveWeights = {
  left: 0,
  centerLeft: 0,
  center: 0,
  centerRight: 0,
  right: 0,
}
const zeroResult = applyPerspectiveBalance(
  [politicalItem('a', 'left'), politicalItem('b', 'right')],
  zeroWeights,
).map((i) => i.id)
assert.deepEqual(
  zeroResult,
  ['a', 'b'],
  'all-zero weights must fall back to original order, not hang or throw',
)

// --- mode presets: every bucket stays above zero (never fully excludes) ----

for (const [mode, weights] of Object.entries(PERSPECTIVE_MODE_PRESETS)) {
  for (const [bucket, value] of Object.entries(weights)) {
    assert.ok(
      value > 0,
      `${mode} preset's ${bucket} weight must stay above zero -- no viewpoint fully excluded`,
    )
  }
}
assert.deepEqual(
  PERSPECTIVE_MODE_PRESETS.balanced,
  DEFAULT_PERSPECTIVE_WEIGHTS,
  'balanced preset must match the neutral default weights',
)

console.log(
  'newsfeed perspective balance verified: non-political pass-through, ' +
    'weighted interleaving, unrated-bucket inclusion, zero-weight safety, ' +
    'and mode preset shape.',
)
