// Regression test for the Butterfly Gallery queue-filter predicate and
// folder/collection summaries (butterfly-gallery/t-009,
// stores/helpers/butterflyGalleryFilters.ts). Exercises the pure filter
// predicate directly against fixture-shaped entries -- processed/
// unprocessed, rating, match state, the trashed/active/all trash view, and
// folder/collection/search -- plus the summary helpers the folder/collection
// browsing list renders from.
import assert from 'node:assert/strict'

import {
  matchesButterflyGalleryFilters,
  summarizeButterflyGalleryCollections,
  summarizeButterflyGalleryFolders,
} from '../../stores/helpers/butterflyGalleryFilters'
import { defaultButterflyGalleryFilters } from '../../types/butterflyGallery'
import type {
  ButterflyGalleryFilters,
  ButterflyPileEntry,
} from '../../types/butterflyGallery'

function makeEntry(
  overrides: Partial<ButterflyPileEntry> = {},
): ButterflyPileEntry {
  return {
    id: 1,
    thumbnailPath: '/thumb.webp',
    displayPath: '/display.webp',
    isMature: false,
    isPublic: true,
    processed: false,
    trashed: false,
    rating: null,
    folder: 'inbox',
    collections: [],
    prompt: 'test prompt',
    negativePrompt: null,
    resource: { checkpoint: null, loras: [] },
    generationMetadata: null,
    matchState: 'matched',
    ...overrides,
  }
}

function withFilters(
  overrides: Partial<ButterflyGalleryFilters> = {},
): ButterflyGalleryFilters {
  return { ...defaultButterflyGalleryFilters(), ...overrides }
}

// -- trashView is independent of matchState -------------------------------

{
  // Regression case: a trashed entry whose matchState is 'matched' (the
  // common case -- trashing doesn't touch matchState) must still be hidden
  // by default and shown by 'trashed'/'all'. The original t-003 scaffolding
  // folded trash visibility into `matchState === 'missing'`, which only
  // ever revealed a trashed entry that coincidentally also had
  // matchState: 'missing' -- true for none of the real trash bin's output.
  const trashedMatched = makeEntry({ trashed: true, matchState: 'matched' })

  assert.equal(
    matchesButterflyGalleryFilters(trashedMatched, withFilters()),
    false,
    'default trashView (active) must hide a trashed entry regardless of matchState',
  )
  assert.equal(
    matchesButterflyGalleryFilters(
      trashedMatched,
      withFilters({ trashView: 'trashed' }),
    ),
    true,
    'trashView: trashed must show a trashed entry regardless of matchState',
  )
  assert.equal(
    matchesButterflyGalleryFilters(
      trashedMatched,
      withFilters({ trashView: 'all' }),
    ),
    true,
    'trashView: all must show a trashed entry',
  )
  assert.equal(
    matchesButterflyGalleryFilters(
      makeEntry({ trashed: false }),
      withFilters({ trashView: 'trashed' }),
    ),
    false,
    'trashView: trashed must hide an active (non-trashed) entry',
  )
}

// -- processed / unprocessed -----------------------------------------------

{
  const processed = makeEntry({ processed: true })
  const unprocessed = makeEntry({ processed: false })

  assert.equal(
    matchesButterflyGalleryFilters(
      processed,
      withFilters({ processed: 'unprocessed' }),
    ),
    false,
  )
  assert.equal(
    matchesButterflyGalleryFilters(
      unprocessed,
      withFilters({ processed: 'processed' }),
    ),
    false,
  )
  assert.equal(
    matchesButterflyGalleryFilters(
      processed,
      withFilters({ processed: 'all' }),
    ),
    true,
  )
}

// -- rating -----------------------------------------------------------------

{
  const rated = makeEntry({ rating: 4 })
  assert.equal(
    matchesButterflyGalleryFilters(rated, withFilters({ rating: 4 })),
    true,
  )
  assert.equal(
    matchesButterflyGalleryFilters(rated, withFilters({ rating: 3 })),
    false,
  )
  assert.equal(
    matchesButterflyGalleryFilters(
      makeEntry({ rating: null }),
      withFilters({ rating: 4 }),
    ),
    false,
    'an unrated entry must not match a specific rating filter',
  )
}

// -- match state --------------------------------------------------------

{
  const missing = makeEntry({ matchState: 'missing' })
  assert.equal(
    matchesButterflyGalleryFilters(
      missing,
      withFilters({ matchState: 'missing' }),
    ),
    true,
  )
  assert.equal(
    matchesButterflyGalleryFilters(
      missing,
      withFilters({ matchState: 'matched' }),
    ),
    false,
  )
}

// -- folder / collection / search -----------------------------------------

{
  const entry = makeEntry({
    folder: 'sorted',
    collections: ['favorites'],
    prompt: 'a lighthouse at dawn',
  })

  assert.equal(
    matchesButterflyGalleryFilters(entry, withFilters({ folder: 'sorted' })),
    true,
  )
  assert.equal(
    matchesButterflyGalleryFilters(entry, withFilters({ folder: 'inbox' })),
    false,
  )
  assert.equal(
    matchesButterflyGalleryFilters(
      entry,
      withFilters({ collection: 'favorites' }),
    ),
    true,
  )
  assert.equal(
    matchesButterflyGalleryFilters(
      entry,
      withFilters({ collection: 'landscapes' }),
    ),
    false,
  )
  assert.equal(
    matchesButterflyGalleryFilters(entry, withFilters({ search: 'DAWN' })),
    true,
    'search must be case-insensitive',
  )
  assert.equal(
    matchesButterflyGalleryFilters(entry, withFilters({ search: 'mountain' })),
    false,
  )
}

// -- summarizeButterflyGalleryFolders / Collections ------------------------

{
  const entries = [
    makeEntry({ id: 1, folder: 'inbox', collections: ['favorites'] }),
    makeEntry({ id: 2, folder: 'inbox', collections: [] }),
    makeEntry({ id: 3, folder: 'sorted', collections: ['favorites', 'landscapes'] }),
    makeEntry({ id: 4, folder: null, collections: [] }),
  ]

  assert.deepEqual(
    summarizeButterflyGalleryFolders(entries),
    [
      { value: 'inbox', count: 2 },
      { value: 'sorted', count: 1 },
    ],
    'folder summaries should count entries per folder, sorted, excluding unfiled entries',
  )

  assert.deepEqual(
    summarizeButterflyGalleryCollections(entries),
    [
      { value: 'favorites', count: 2 },
      { value: 'landscapes', count: 1 },
    ],
    'collection summaries should count entries per collection membership, sorted',
  )
}

console.log(
  'Butterfly Gallery filter predicate and folder/collection summaries ' +
    'verified: trash view decoupled from matchState, processed/rating/' +
    'matchState/folder/collection/search filters, and summary counts.',
)
