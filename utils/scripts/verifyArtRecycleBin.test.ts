// /utils/scripts/verifyArtRecycleBin.test.ts
//
// Contract for the Gallery's Recycle Bin, the ArtJob queue's maturity filter
// and the art feed's date windows. The pure helpers run for real; the
// database-backed routes are checked for the invariants that make deletion
// recoverable: DELETE only bins, purge only accepts what is already binned,
// and binned folders leave every collection listing.
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { recycleGalleryImages } from '../../utils/artGalleryBulkRecycle'
import {
  readRecycleBinRequest,
  runRecycleBinRequest,
} from '../../server/utils/recycleBinRequest'
import {
  MATURE_PAYLOAD_MARKER,
  buildArtJobMaturityWhere,
} from '../../server/utils/artJobMaturityFilter'
import {
  ART_FEED_RANGES,
  DEFAULT_ART_FEED_RANGE,
  artFeedRangeDays,
  isArtFeedRange,
} from '../../utils/artFeedRange'

const read = (file: string) => readFileSync(file, 'utf8')

async function testRequestParsing() {
  assert.deepEqual(readRecycleBinRequest({ imageIds: [3, '3', 4] }), {
    imageIds: [3, 4],
    collectionIds: [],
  })
  assert.throws(() => readRecycleBinRequest({}), /at least one/)
  assert.throws(() => readRecycleBinRequest({ imageIds: [0] }), /positive/)
  assert.throws(() => readRecycleBinRequest({ imageIds: 5 }), /array/)
  assert.throws(
    () =>
      readRecycleBinRequest({
        imageIds: Array.from({ length: 201 }, (_, i) => i + 1),
      }),
    /At most/,
  )

  const results = await runRecycleBinRequest(
    { imageIds: [1, 2], collectionIds: [9] },
    { id: 1, isAdmin: false },
    {
      image: async (id) => {
        if (id === 2) {
          throw Object.assign(new Error('not yours'), { statusCode: 403 })
        }
        return { id, message: `image ${id}` }
      },
      collection: async (id) => ({ id, message: `collection ${id}` }),
    },
  )
  assert.deepEqual(
    results.map((result) => [result.kind, result.id, result.success]),
    [
      ['collection', 9, true],
      ['image', 1, true],
      ['image', 2, false],
    ],
    'one refused id must not fail the rest of the batch',
  )
  console.log('verifyArtRecycleBin: bin requests validate ids and run per item')
}

function testQueueMaturityFilter() {
  assert.equal(
    MATURE_PAYLOAD_MARKER,
    JSON.stringify({ isMature: true }).slice(1, -1),
  )
  assert.deepEqual(buildArtJobMaturityWhere('all'), {})
  assert.deepEqual(buildArtJobMaturityWhere('mature'), {
    payload: { contains: '"isMature":true' },
  })
  assert.deepEqual(buildArtJobMaturityWhere('safe'), {
    NOT: { payload: { contains: '"isMature":true' } },
  })

  const route = read('server/api/art/queue/index.get.ts')
  assert.ok(route.includes('buildArtJobMaturityWhere('))
  const store = read('stores/artJobStore.ts')
  assert.ok(store.includes("params.set('maturity', state.jobMaturityFilter)"))
  const browser = read('components/art/artjob-queue-browser.vue')
  assert.ok(browser.includes('<maturity-filter-toggle'))
  const slideshowStore = read('stores/artSlideshowStore.ts')
  assert.ok(
    slideshowStore.includes("params.set('maturity', state.settings.maturity)"),
  )
  const slideshow = read('components/art/artjob-slideshow.vue')
  assert.ok(slideshow.includes('<maturity-filter-toggle'))
  assert.ok(
    slideshow.includes('!userStore.isMaturityRestricted'),
    'choosing Mature must never reveal mature art to a restricted account',
  )
  console.log(
    'verifyArtRecycleBin: queue and slideshow filter Both / Mature / Not mature in the query',
  )
}

function testFeedRanges() {
  assert.equal(DEFAULT_ART_FEED_RANGE, 'recent')
  assert.equal(artFeedRangeDays('recent'), 7)
  assert.equal(artFeedRangeDays('all'), null)
  assert.equal(artFeedRangeDays('bogus'), null)
  assert.ok(isArtFeedRange('year'))
  assert.ok(!isArtFeedRange('forever'))
  const windows = ART_FEED_RANGES.map((option) => option.days).filter(
    (days): days is number => days !== null,
  )
  assert.ok(
    windows.some((days) => days > 7),
    'the feed must offer windows longer than seven days',
  )
  console.log(
    'verifyArtRecycleBin: the art feed offers 24h through all-time windows',
  )
}

function testRecycleBinInvariants() {
  const imageDelete = read('server/api/art/image/[id].delete.ts')
  assert.ok(imageDelete.includes('recycleArtImage('))
  assert.ok(!imageDelete.includes('prisma.artImage.delete('))

  const collectionDelete = read('server/api/art/collection/[id].delete.ts')
  assert.ok(collectionDelete.includes('recycleArtCollection('))
  assert.ok(!collectionDelete.includes('prisma.artCollection.delete('))

  const service = read('server/utils/artRecycleBin.ts')
  for (const token of [
    'data: { isActive: false }',
    'data: { isActive: true }',
    'quarantineArchiveEntry(archiveEntry)',
    'restoreArchiveEntry(archiveEntry)',
    'purgeQuarantinedArchiveFile(',
    'statusCode: 409',
  ]) {
    assert.ok(service.includes(token), `artRecycleBin.ts must keep: ${token}`)
  }
  const purgeImage = service.slice(
    service.indexOf('export async function purgeArtImage'),
    service.indexOf('export async function recycleArtCollection'),
  )
  assert.ok(
    purgeImage.indexOf('if (image.isActive)') <
      purgeImage.indexOf('prisma.artImage.delete('),
    'purge must refuse an image that is not in the bin before deleting it',
  )

  const access = read('server/utils/artImageAccess.ts')
  assert.ok(
    access.includes('return { AND: [{ isActive: true }, privacy, mature] }'),
    'binned folders must leave every collection listing',
  )

  const thumbnail = read('server/api/art/image/[id]/thumbnail.get.ts')
  assert.ok(thumbnail.includes('verifyRecycledThumbnail('))

  const gallery = read('components/art/art-gallery.vue')
  for (const token of [
    "const RECYCLE_BIN_KEY = 'collection-recycle-bin'",
    '<art-recycle-bin',
    'recycleBinStore.fetchBin(',
  ]) {
    assert.ok(gallery.includes(token), `art-gallery.vue must keep: ${token}`)
  }
  assert.ok(!gallery.includes('This cannot be undone.'))

  const bin = read('components/art/art-recycle-bin.vue')
  assert.ok(bin.includes('binStore.restore('))
  assert.ok(bin.includes('binStore.purge('))
  assert.ok(bin.includes('window.confirm('))
  console.log(
    'verifyArtRecycleBin: delete bins, restore returns, purge only empties the bin',
  )
}

async function testBulkGalleryRecycle() {
  const attempted: number[] = []
  const result = await recycleGalleryImages(
    [1, 2, 2, 3, 4],
    async (id) => {
      attempted.push(id)
      if (id === 2) throw new Error('Image not owned')
      return id !== 4
    },
    2,
  )
  assert.deepEqual([...attempted].sort(), [1, 2, 3, 4])
  assert.deepEqual([...result.recycledIds].sort(), [1, 3])
  assert.deepEqual([...result.failedIds].sort(), [2, 4])

  const gallery = read('components/art/art-gallery.vue')
  const feed = read('components/art/art-feed.vue')
  const manager = read('components/art/art-manager.vue')
  const studio = read('components/art/art-studio.vue')
  assert.ok(manager.includes('<art-feed'))
  assert.ok(manager.includes('<art-gallery'))
  assert.ok(studio.includes("browseStore.setGalleryPrivacyFilter('private')"))
  for (const component of [gallery, feed]) {
    assert.ok(component.includes('recycleGalleryImages('))
    assert.ok(component.includes('selectedImageIds'))
    assert.ok(component.includes('Move to Recycle Bin'))
    assert.ok(component.includes('window.confirm('))
    assert.ok(component.includes('canModifyImage('))
  }
  assert.ok(gallery.includes('!showHeader && activeGroup'))
  assert.ok(feed.includes('Select all loaded'))
  assert.ok(feed.includes('bulkSelectEnabled ? toggleImageSelection(image) : openImage(image)'))
  console.log('verifyArtRecycleBin: gallery and collection views support recoverable multi-select')
}

async function run() {
  await testRequestParsing()
  await testBulkGalleryRecycle()
  testQueueMaturityFilter()
  testFeedRanges()
  testRecycleBinInvariants()
  console.log('verifyArtRecycleBin: all assertions passed')
}

run().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
