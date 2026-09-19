// Structural shape-parity contract between the fixture-backed feed
// (butterflyGalleryFixtures.ts, t-004) and the real art-archive-backed feed's
// row mapping (butterflyGalleryArtArchiveMapping.ts, t-022). Both promise the
// same ButterflyGalleryFeedProvider contract to the store; if one drifts to
// carry a shape the other doesn't (a field renamed, dropped, or added on only
// one side), this fails before it becomes a Butterfly Gallery UI bug that
// quietly works with fixtures and silently loses data against the real
// provider (or vice versa). Kaizen from t-003 (kind_robots#2830).
import assert from 'node:assert/strict'

import { createButterflyGalleryFixtureEntries } from '../../stores/helpers/butterflyGalleryFixtures'
import { toButterflyPileEntry } from '../../stores/helpers/butterflyGalleryArtArchiveMapping'

type Row = Parameters<typeof toButterflyPileEntry>[0]

function makeArchiveRow(overrides: Partial<Row> = {}): Row {
  return {
    id: 1,
    parentFolder: 'inbox',
    processState: 'IMPORTED',
    matchState: 'CONFIRMED',
    rating: 4,
    isActive: true,
    imagePath: '/archive/entry-1.webp',
    thumbnailPath: '/archive/entry-1-thumb.webp',
    isMature: false,
    isPublic: true,
    prompt: 'a lighthouse at dawn',
    negativePrompt: 'blurry',
    checkpoint: 'sdxl-base',
    generationMetadata: { sampler: 'Euler a', steps: 24, seed: 1 },
    folderCollection: { id: 5, slug: 'favorites', label: 'Favorites' },
    ...overrides,
  }
}

/** Sorted own-key list -- the "shape" this contract cares about. */
function shapeOf(value: Record<string, unknown>): string[] {
  return Object.keys(value).sort()
}

const FIXTURE_ENTRY_SHAPE = shapeOf(
  createButterflyGalleryFixtureEntries()[0] as unknown as Record<
    string,
    unknown
  >,
)
const REAL_ENTRY_SHAPE = shapeOf(
  toButterflyPileEntry(makeArchiveRow()) as unknown as Record<string, unknown>,
)

function testTopLevelShapeParity(): void {
  assert.deepEqual(
    REAL_ENTRY_SHAPE,
    FIXTURE_ENTRY_SHAPE,
    'the real art-archive-backed provider must emit exactly the same ' +
      'top-level ButterflyPileEntry fields as the fixture provider -- a ' +
      'field added to one and not the other means the store/UI works with ' +
      'one provider and silently loses data with the other',
  )
}

function testResourceShapeParity(): void {
  const fixtureResource = createButterflyGalleryFixtureEntries()[0]!.resource
  const realResource = toButterflyPileEntry(makeArchiveRow()).resource
  assert.deepEqual(
    shapeOf(realResource as unknown as Record<string, unknown>),
    shapeOf(fixtureResource as unknown as Record<string, unknown>),
    'ButterflyResourceProvenance (resource.checkpoint/resource.loras) must ' +
      'match shape across providers',
  )
}

function testEveryFixtureEntrySharesTheContractShape(): void {
  for (const entry of createButterflyGalleryFixtureEntries()) {
    assert.deepEqual(
      shapeOf(entry as unknown as Record<string, unknown>),
      FIXTURE_ENTRY_SHAPE,
      `fixture entry ${entry.id} must share the same shape as every other fixture entry`,
    )
  }
}

function testEveryRealMappingVariantSharesTheContractShape(): void {
  const variants: Row[] = [
    makeArchiveRow(),
    makeArchiveRow({ processState: 'MISSING' }),
    makeArchiveRow({ isActive: false, rating: null }),
    makeArchiveRow({
      thumbnailPath: null,
      imagePath: null,
      folderCollection: null,
    }),
    makeArchiveRow({
      generationMetadata: null,
      negativePrompt: null,
      prompt: null,
      checkpoint: null,
    }),
  ]
  for (const row of variants) {
    assert.deepEqual(
      shapeOf(toButterflyPileEntry(row) as unknown as Record<string, unknown>),
      REAL_ENTRY_SHAPE,
      `mapped entry for archive row overrides must share the real provider's contract shape`,
    )
  }
}

testTopLevelShapeParity()
testResourceShapeParity()
testEveryFixtureEntrySharesTheContractShape()
testEveryRealMappingVariantSharesTheContractShape()

console.log(
  'Butterfly Gallery fixture/art-archive provider shape parity verified: ' +
    'both emit structurally identical ButterflyPileEntry records (including ' +
    'the nested resource shape) across representative field-presence variants.',
)
