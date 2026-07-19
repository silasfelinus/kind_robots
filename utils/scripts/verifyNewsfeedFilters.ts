// /utils/scripts/verifyNewsfeedFilters.ts
//
// Regression test for the programmable-feed-filters declarative layer
// (conductor projects/newsfeed t-008): stores/helpers/newsfeed.ts's
// applyNewsfeedFilters() and sanitizeKeywordList(). No network/Vue
// dependency -- pure functions over fixture NewsFeedItem objects.
import assert from 'node:assert/strict'

import {
  applyNewsfeedFilters,
  sanitizeKeywordList,
  type NewsFeedItem,
  type NewsfeedFilterPreferences,
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

function basePrefs(
  overrides: Partial<NewsfeedFilterPreferences> = {},
): NewsfeedFilterPreferences {
  return {
    includeKeywords: [],
    excludeKeywords: [],
    disabledSourceIds: [],
    selectedCategories: [],
    sortMode: 'recent',
    ...overrides,
  }
}

// --- sanitizeKeywordList ----------------------------------------------------

assert.deepEqual(
  sanitizeKeywordList(['  robotics  ', 'Robotics', 'AI', '', '   ']),
  ['robotics', 'AI'],
  'must trim, drop empties, and dedupe case-insensitively while keeping first-seen casing',
)
assert.deepEqual(sanitizeKeywordList('not-an-array'), [])
assert.deepEqual(
  sanitizeKeywordList(Array.from({ length: 30 }, (_, i) => `word${i}`)).length,
  20,
  'must cap the list at MAX_KEYWORD_FILTERS',
)
assert.equal(
  sanitizeKeywordList(['a'.repeat(200)])[0]?.length,
  60,
  'must truncate an individual keyword at MAX_KEYWORD_LENGTH',
)

// --- applyNewsfeedFilters: no filters is a pass-through (sorted by recency) -

const older = item({ id: 'older', publishedAt: '2026-01-01T00:00:00.000Z' })
const newer = item({ id: 'newer', publishedAt: '2026-01-02T00:00:00.000Z' })

assert.deepEqual(
  applyNewsfeedFilters([older, newer], basePrefs()).map((i) => i.id),
  ['newer', 'older'],
  'with no active filters, items must still sort by recency descending',
)

// --- include keywords: OR match across title/summary/category --------------

const aiItem = item({ id: 'ai', title: 'New AI model released', category: [] })
const gameItem = item({
  id: 'game',
  title: 'New game footage',
  category: ['gaming'],
})
const tagOnlyItem = item({
  id: 'tag-only',
  title: 'Untitled',
  category: ['Robotics'],
})

const includeFiltered = applyNewsfeedFilters(
  [aiItem, gameItem, tagOnlyItem],
  basePrefs({ includeKeywords: ['ai', 'robotics'] }),
)
assert.deepEqual(
  includeFiltered.map((i) => i.id).sort(),
  ['ai', 'tag-only'],
  'include keywords must match any of title/summary/category, case-insensitively',
)

// --- exclude keywords: dropped even if it would match an include keyword ---

const excludeFiltered = applyNewsfeedFilters(
  [aiItem, gameItem],
  basePrefs({ includeKeywords: ['new'], excludeKeywords: ['game'] }),
)
assert.deepEqual(
  excludeFiltered.map((i) => i.id),
  ['ai'],
  'exclude keywords must win over a matching include keyword',
)

// --- source toggle -----------------------------------------------------------

const sourceA = item({ id: 'from-a', sourceId: 'source-a' })
const sourceB = item({ id: 'from-b', sourceId: 'source-b' })
const sourceFiltered = applyNewsfeedFilters(
  [sourceA, sourceB],
  basePrefs({ disabledSourceIds: ['source-a'] }),
)
assert.deepEqual(
  sourceFiltered.map((i) => i.id),
  ['from-b'],
  'a disabled source id must drop its items even though the parent feed is enabled',
)

// --- category filter -----------------------------------------------------------

const catA = item({ id: 'cat-a', category: ['ai', 'research'] })
const catB = item({ id: 'cat-b', category: ['gaming'] })
const catFiltered = applyNewsfeedFilters(
  [catA, catB],
  basePrefs({ selectedCategories: ['AI'] }),
)
assert.deepEqual(
  catFiltered.map((i) => i.id),
  ['cat-a'],
  'category selection must match case-insensitively against item.category',
)

// --- sort mode: relevance ranks by include-keyword match count -------------

const oneMatch = item({
  id: 'one-match',
  title: 'robotics',
  publishedAt: '2026-01-02T00:00:00.000Z',
})
const twoMatch = item({
  id: 'two-match',
  title: 'robotics and ai',
  publishedAt: '2026-01-01T00:00:00.000Z',
})
const relevanceSorted = applyNewsfeedFilters(
  [oneMatch, twoMatch],
  basePrefs({ includeKeywords: ['robotics', 'ai'], sortMode: 'relevance' }),
)
assert.deepEqual(
  relevanceSorted.map((i) => i.id),
  ['two-match', 'one-match'],
  'relevance sort must rank more keyword matches first even when older',
)

// relevance with no include keywords has nothing to rank by -- must not
// silently reorder away from recency.
const relevanceNoKeywords = applyNewsfeedFilters(
  [older, newer],
  basePrefs({ sortMode: 'relevance' }),
)
assert.deepEqual(
  relevanceNoKeywords.map((i) => i.id),
  ['newer', 'older'],
  'relevance sort with no include keywords must fall back to recency',
)

console.log(
  'newsfeed filters verified: keyword sanitization, include/exclude keyword ' +
    'matching, source toggles, category selection, and relevance sort mode.',
)
