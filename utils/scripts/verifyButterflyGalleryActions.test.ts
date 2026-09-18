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
  applyPendingGenerationJobIds,
  applyProcessedAction,
  applyRatingAction,
  applyRemoveFromCollectionAction,
  applyRestoreAction,
  applyTrashAction,
  persistBinGenerationActions,
  persistBinOutcome,
} from '../../stores/helpers/butterflyGalleryActions'
import { createFixtureButterflyGalleryActionAdapter } from '../../stores/helpers/butterflyGalleryActionAdapter'
import { createFixtureButterflyGalleryGenerationClient } from '../../stores/helpers/butterflyGalleryGenerationClient'
import { buildButterflyGenerationRequest } from '../../stores/helpers/butterflyGalleryGenerationRequest'
import type {
  ButterflyBinConfig,
  ButterflyGenerationAction,
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
    pendingGenerationJobIds: [],
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

// -- fixture-backed generation client issues unique, resolving job ids ---

{
  const client = createFixtureButterflyGalleryGenerationClient()
  const request = buildButterflyGenerationRequest(makeEntry(), [
    { kind: 'add-variant' },
  ])
  const first = await client.submit(request)
  const second = await client.submit(request)
  assert.notEqual(
    first.jobId,
    second.jobId,
    'the fixture generation client should never reuse a job id',
  )
}

// -- buildButterflyGenerationRequest (butterfly-gallery/t-019) -----------

{
  const entry = makeEntry({
    prompt: 'a butterfly over a rooftop',
    negativePrompt: 'blurry',
    resource: { checkpoint: 'krea2-base', loras: ['starter-lora'] },
  })
  const actions: ButterflyGenerationAction[] = [
    { kind: 'add-lora', resource: 'wings-lora', weight: 0.6 },
    { kind: 'switch-checkpoint', resource: 'krea2-refined' },
    { kind: 'append-prompt', text: 'golden hour' },
    { kind: 'set-generation', values: { steps: 32, cfg: 4.5 } },
    { kind: 'add-variant' },
  ]

  const request = buildButterflyGenerationRequest(entry, actions)
  assert.equal(request.engine, 'krea2', 'request should use the krea2 engine')
  assert.equal(
    request.checkpoint,
    'krea2-refined',
    'switch-checkpoint should override the entry checkpoint',
  )
  assert.deepEqual(
    request.loras,
    [{ name: 'starter-lora' }, { name: 'wings-lora', strength: 0.6 }],
    'add-lora should append to the entry loras without dropping the existing one',
  )
  assert.equal(
    request.promptString,
    'a butterfly over a rooftop, golden hour',
    'append-prompt should extend the entry prompt',
  )
  assert.deepEqual(
    request.generation,
    { steps: 32, cfg: 4.5 },
    'set-generation should collect its values verbatim',
  )
  assert.equal(
    request.projectSlug,
    'butterfly-gallery',
    'request should be tagged with the butterfly-gallery project slug',
  )
}

{
  const entry = makeEntry({
    prompt: 'a butterfly over a rooftop',
    resource: { checkpoint: null, loras: ['old-lora'] },
  })
  const request = buildButterflyGenerationRequest(entry, [
    { kind: 'replace-lora', from: 'old-lora', to: 'new-lora', weight: 0.8 },
    { kind: 'replace-prompt', text: 'a fresh composition entirely' },
  ])
  assert.deepEqual(
    request.loras,
    [{ name: 'new-lora', strength: 0.8 }],
    'replace-lora should swap the matching lora by name',
  )
  assert.equal(
    request.promptString,
    'a fresh composition entirely',
    'replace-prompt should discard the original prompt entirely',
  )
}

// -- persistBinGenerationActions / applyPendingGenerationJobIds ----------

{
  const client = createFixtureButterflyGalleryGenerationClient()
  const entry = makeEntry()
  const binWithNoActions: ButterflyBinConfig = {
    id: 'preset-five',
    label: '5★ + Featured Collection',
    side: 'left',
    icon: 'kind-icon:star',
    kind: 'preset',
    payload: { rating: 5 },
    sortOrder: 0,
    enabled: true,
  }

  const jobIds = await persistBinGenerationActions(
    client,
    entry,
    binWithNoActions,
  )
  assert.deepEqual(
    jobIds,
    [],
    'a bin with no actions should submit nothing and return no job ids',
  )
  applyPendingGenerationJobIds(entry, jobIds)
  assert.deepEqual(
    entry.pendingGenerationJobIds,
    [],
    'no-op job ids should never touch the entry',
  )
}

{
  const client = createFixtureButterflyGalleryGenerationClient()
  const entry = makeEntry({ pendingGenerationJobIds: [1] })
  const binWithActions: ButterflyBinConfig & {
    actions: ButterflyGenerationAction[]
  } = {
    id: 'preset-variant',
    label: 'Try a Variant',
    side: 'left',
    icon: 'kind-icon:sparkles',
    kind: 'preset',
    payload: {},
    sortOrder: 5,
    enabled: true,
    actions: [{ kind: 'add-variant' }],
  }

  const jobIds = await persistBinGenerationActions(
    client,
    entry,
    binWithActions,
  )
  assert.equal(jobIds.length, 1, 'a bin with actions should submit one job')
  applyPendingGenerationJobIds(entry, jobIds)
  assert.deepEqual(
    entry.pendingGenerationJobIds,
    [1, ...jobIds],
    'applyPendingGenerationJobIds should append without dropping prior ids',
  )
  assert.equal(
    entry.displayPath,
    '/display.webp',
    'submitting a generation request must never touch the entry image itself',
  )
}

{
  const failingClient = {
    async submit(): Promise<{ jobId: number }> {
      throw new Error('render backend unavailable')
    },
  }
  const entry = makeEntry()
  const binWithActions: ButterflyBinConfig & {
    actions: ButterflyGenerationAction[]
  } = {
    id: 'preset-replacement',
    label: 'Request Replacement',
    side: 'left',
    icon: 'kind-icon:refresh',
    kind: 'preset',
    payload: {},
    sortOrder: 6,
    enabled: true,
    actions: [{ kind: 'request-replacement' }],
  }

  await assert.rejects(
    persistBinGenerationActions(failingClient, entry, binWithActions),
    /render backend unavailable/,
    'a failed submission should surface the client error',
  )
  assert.equal(
    entry.displayPath,
    '/display.webp',
    'a failed replacement request must never destroy the current source image',
  )
  assert.deepEqual(
    entry.pendingGenerationJobIds,
    [],
    'a failed submission must never record a job id',
  )
}

console.log(
  'Butterfly Gallery action appliers verified: processed/unprocessed, ' +
    '1-5 rating clamping and clearing, reversible trash/restore, collection ' +
    'add/remove dedup, preset-bin composition, adapter call composition, ' +
    'the fixture adapter, generation-request building from add/replace-lora, ' +
    'switch-checkpoint, append/replace-prompt, and set-generation actions, ' +
    'and generation-job submission/recording (including the failure path ' +
    'never touching the entry) all behave as expected.',
)
