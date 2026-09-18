// Regression test for the Butterfly Gallery curation-action appliers
// (butterfly-gallery/t-007, stores/helpers/butterflyGalleryActions.ts) and
// the fixture-backed action adapter
// (stores/helpers/butterflyGalleryActionAdapter.ts). Exercises the pure
// per-action appliers directly against fixture-shaped entries -- mark
// processed/unprocessed, set/clamp/clear a 1-5 rating, reversible trash,
// and add/remove collection membership -- plus the preset-bin composition
// path (applyBinOutcome) and the adapter-call composition path
// (persistBinOutcome), so a future adapter swap (t-022) cannot silently
// drop a call one of these still relies on.
import assert from 'node:assert/strict'

import {
  applyAddToCollectionAction,
  applyBinOutcome,
  applyProcessedAction,
  applyRatingAction,
  applyRemoveFromCollectionAction,
  applyRestoreAction,
  applyTrashAction,
  persistBinOutcome,
} from '../../stores/helpers/butterflyGalleryActions'
import { createFixtureButterflyGalleryActionAdapter } from '../../stores/helpers/butterflyGalleryActionAdapter'
import type {
  ButterflyBinConfig,
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

// -- applyProcessedAction -----------------------------------------------

{
  const entry = makeEntry({ processed: false })
  applyProcessedAction(entry, true)
  assert.equal(
    entry.processed,
    true,
    'applyProcessedAction should mark processed',
  )
  applyProcessedAction(entry, false)
  assert.equal(
    entry.processed,
    false,
    'applyProcessedAction should mark unprocessed',
  )
}

// -- applyRatingAction ----------------------------------------------------

{
  const entry = makeEntry()
  applyRatingAction(entry, 3)
  assert.equal(entry.rating, 3, 'applyRatingAction should set a plain rating')

  applyRatingAction(entry, 9)
  assert.equal(
    entry.rating,
    5,
    'applyRatingAction should clamp above 5 down to 5',
  )

  applyRatingAction(entry, -2)
  assert.equal(
    entry.rating,
    1,
    'applyRatingAction should clamp below 1 up to 1',
  )

  applyRatingAction(entry, null)
  assert.equal(
    entry.rating,
    null,
    'applyRatingAction should clear a rating with null',
  )
}

// -- applyTrashAction / applyRestoreAction (recoverable trash) ------------

{
  const entry = makeEntry({ trashed: false, rating: 4 })
  applyTrashAction(entry)
  assert.equal(entry.trashed, true, 'applyTrashAction should mark trashed')
  assert.equal(entry.rating, 4, 'trashing must not touch unrelated fields')

  applyRestoreAction(entry)
  assert.equal(
    entry.trashed,
    false,
    'applyRestoreAction should reverse a trash action',
  )
  assert.equal(entry.rating, 4, 'restoring must not touch unrelated fields')
}

// -- applyAddToCollectionAction / applyRemoveFromCollectionAction --------

{
  const entry = makeEntry({ collections: ['favorites'] })
  applyAddToCollectionAction(entry, 'featured')
  assert.deepEqual(
    entry.collections,
    ['favorites', 'featured'],
    'applyAddToCollectionAction should append a new collection',
  )

  applyAddToCollectionAction(entry, 'featured')
  assert.deepEqual(
    entry.collections,
    ['favorites', 'featured'],
    'applyAddToCollectionAction must not duplicate an existing collection',
  )

  applyRemoveFromCollectionAction(entry, 'favorites')
  assert.deepEqual(
    entry.collections,
    ['featured'],
    'applyRemoveFromCollectionAction should remove only the named collection',
  )

  applyRemoveFromCollectionAction(entry, 'not-present')
  assert.deepEqual(
    entry.collections,
    ['featured'],
    'removing an absent collection should be a no-op',
  )
}

// -- applyBinOutcome composition (preset bins) ----------------------------

{
  const presetBin: ButterflyBinConfig = {
    id: 'preset-five',
    label: '5★ + Featured Collection',
    side: 'left',
    icon: 'kind-icon:star',
    kind: 'preset',
    payload: { rating: 5, collection: 'featured', processed: true },
    sortOrder: 0,
    enabled: true,
  }

  const entry = makeEntry()
  applyBinOutcome(entry, presetBin)
  assert.equal(entry.rating, 5, 'preset bin should set the configured rating')
  assert.deepEqual(
    entry.collections,
    ['featured'],
    'preset bin should add the configured collection',
  )
  assert.equal(
    entry.processed,
    true,
    'preset bin should mark processed when configured',
  )
}

{
  const trashBin: ButterflyBinConfig = {
    id: 'trash',
    label: 'Trash',
    side: 'right',
    icon: 'kind-icon:trash',
    kind: 'trash',
    payload: {},
    sortOrder: 0,
    enabled: true,
  }

  const entry = makeEntry()
  applyBinOutcome(entry, trashBin)
  assert.equal(entry.trashed, true, 'trash bin should mark the entry trashed')
}

// -- persistBinOutcome calls the right adapter methods --------------------

{
  const calls: string[] = []
  const adapter = {
    async setProcessed(entryId: number, processed: boolean) {
      calls.push(`setProcessed(${entryId},${processed})`)
    },
    async setRating(entryId: number, rating: number | null) {
      calls.push(`setRating(${entryId},${rating})`)
    },
    async trash(entryId: number) {
      calls.push(`trash(${entryId})`)
    },
    async restore(entryId: number) {
      calls.push(`restore(${entryId})`)
    },
    async addToCollection(entryId: number, collection: string) {
      calls.push(`addToCollection(${entryId},${collection})`)
    },
    async removeFromCollection(entryId: number, collection: string) {
      calls.push(`removeFromCollection(${entryId},${collection})`)
    },
  }

  const presetBin: ButterflyBinConfig = {
    id: 'preset-five',
    label: '5★ + Featured Collection',
    side: 'left',
    icon: 'kind-icon:star',
    kind: 'preset',
    payload: { rating: 5, collection: 'featured', processed: true },
    sortOrder: 0,
    enabled: true,
  }

  await persistBinOutcome(adapter, 42, presetBin)
  assert.deepEqual(
    calls,
    [
      'setRating(42,5)',
      'addToCollection(42,featured)',
      'setProcessed(42,true)',
    ],
    'persistBinOutcome should call every adapter method a preset bin implies, in order',
  )
}

// -- fixture-backed adapter resolves for every method ---------------------

{
  const adapter = createFixtureButterflyGalleryActionAdapter()
  await assert.doesNotReject(adapter.setProcessed(1, true))
  await assert.doesNotReject(adapter.setRating(1, 3))
  await assert.doesNotReject(adapter.trash(1))
  await assert.doesNotReject(adapter.restore(1))
  await assert.doesNotReject(adapter.addToCollection(1, 'featured'))
  await assert.doesNotReject(adapter.removeFromCollection(1, 'featured'))
}

console.log(
  'Butterfly Gallery action appliers verified: processed/unprocessed, ' +
    '1-5 rating clamping and clearing, reversible trash/restore, collection ' +
    'add/remove dedup, preset-bin composition, adapter call composition, ' +
    'and the fixture adapter all behave as expected.',
)
