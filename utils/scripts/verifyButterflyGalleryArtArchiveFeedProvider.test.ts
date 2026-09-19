// Regression test for the real art-archive-backed feed provider's row
// mapping (butterfly-gallery/t-022,
// stores/helpers/butterflyGalleryArtArchiveMapping.ts). Exercises
// toButterflyPileEntry directly against API-response-shaped rows -- no
// database or network involved -- covering match-state/missing precedence,
// the trashed/isActive inversion, mature/public passthrough, and the
// thumbnail/collections/generationMetadata fallbacks.
import assert from 'node:assert/strict'

import { toButterflyPileEntry } from '../../stores/helpers/butterflyGalleryArtArchiveMapping'

type Row = Parameters<typeof toButterflyPileEntry>[0]

function makeRow(overrides: Partial<Row> = {}): Row {
  return {
    id: 1,
    parentFolder: 'inbox',
    processState: 'IMPORTED',
    matchState: 'CONFIRMED',
    rating: null,
    isActive: true,
    imagePath: '/archive/entry-1.webp',
    thumbnailPath: '/archive/entry-1-thumb.webp',
    isMature: false,
    isPublic: true,
    prompt: 'a lighthouse at dawn',
    negativePrompt: null,
    checkpoint: 'sdxl-base',
    generationMetadata: { sampler: 'Euler a', steps: 24, seed: 1, cfg: 7 },
    folderCollection: { id: 5, slug: 'favorites', label: 'Favorites' },
    ...overrides,
  }
}

function testMatchStatePrecedence(): void {
  assert.equal(
    toButterflyPileEntry(
      makeRow({ processState: 'MISSING', matchState: 'CONFIRMED' }),
    ).matchState,
    'missing',
    'a MISSING processState should report missing regardless of matchState',
  )
  assert.equal(
    toButterflyPileEntry(
      makeRow({ processState: 'IMPORTED', matchState: 'CONFIRMED' }),
    ).matchState,
    'matched',
    'CONFIRMED should map to matched',
  )
  assert.equal(
    toButterflyPileEntry(
      makeRow({ processState: 'IMPORTED', matchState: 'MANUAL' }),
    ).matchState,
    'matched',
    'MANUAL should map to matched',
  )
  for (const state of ['UNMATCHED', 'SUGGESTED', 'AMBIGUOUS'] as const) {
    assert.equal(
      toButterflyPileEntry(
        makeRow({ processState: 'IMPORTED', matchState: state }),
      ).matchState,
      'unmatched',
      `${state} should map to unmatched`,
    )
  }
}

function testTrashedInversion(): void {
  assert.equal(toButterflyPileEntry(makeRow({ isActive: true })).trashed, false)
  assert.equal(toButterflyPileEntry(makeRow({ isActive: false })).trashed, true)
}

function testFallbacksAndPassthrough(): void {
  const noThumb = toButterflyPileEntry(
    makeRow({ thumbnailPath: null, imagePath: '/archive/entry-2.webp' }),
  )
  assert.equal(
    noThumb.thumbnailPath,
    '/archive/entry-2.webp',
    'thumbnailPath should fall back to displayPath',
  )
  assert.equal(noThumb.displayPath, '/archive/entry-2.webp')

  const noImage = toButterflyPileEntry(
    makeRow({ imagePath: null, thumbnailPath: null }),
  )
  assert.equal(noImage.displayPath, '', 'displayPath should never be null')
  assert.equal(noImage.thumbnailPath, '')

  const noCollection = toButterflyPileEntry(makeRow({ folderCollection: null }))
  assert.deepEqual(
    noCollection.collections,
    [],
    'no folderCollection should yield an empty collections list',
  )

  const withCollection = toButterflyPileEntry(makeRow())
  assert.deepEqual(
    withCollection.collections,
    ['favorites'],
    'folderCollection.slug should populate collections',
  )

  const mature = toButterflyPileEntry(
    makeRow({ isMature: true, isPublic: false }),
  )
  assert.equal(mature.isMature, true)
  assert.equal(mature.isPublic, false)

  const entry = toButterflyPileEntry(makeRow())
  assert.equal(
    entry.processed,
    false,
    'real entries have no persisted processed flag yet -- always false',
  )
  assert.deepEqual(entry.pendingGenerationJobIds, [])
  assert.deepEqual(entry.resource, { checkpoint: 'sdxl-base', loras: [] })
  assert.deepEqual(entry.generationMetadata, {
    sampler: 'Euler a',
    steps: 24,
    seed: 1,
    cfg: 7,
  })
}

testMatchStatePrecedence()
testTrashedInversion()
testFallbacksAndPassthrough()

console.log(
  'Butterfly Gallery art-archive feed provider mapping verified: match-state ' +
    'precedence (MISSING over matchState), trashed inversion, thumbnail/' +
    'displayPath fallbacks, and collections/mature/processed passthrough.',
)
