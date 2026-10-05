// Store-level contract for the Butterfly Gallery's curation surface: the
// archive-wide folder/collection catalog behind the dropdowns, scope reloads
// that re-query the feed (so a picked folder reaches entries beyond page
// one), the art card's open/step/close, and batch edits -- rating, folder
// move, new collection, trash -- applied across a selection. Runs against
// the fixture feed and adapter, so no database or Nuxt runtime is needed.
import assert from 'node:assert/strict'
import { createPinia, setActivePinia } from 'pinia'
import { useButterflyGalleryStore } from '../../stores/butterflyGalleryStore'
import { useButterflyGalleryBatchStore } from '../../stores/butterflyGalleryBatchStore'
import { createButterflyGalleryFixtureEntries } from '../../stores/helpers/butterflyGalleryFixtures'
import {
  createFixtureButterflyGalleryFeedProvider,
  setButterflyGalleryFeedProvider,
} from '../../stores/helpers/butterflyGalleryFeedProvider'

async function settle(): Promise<void> {
  for (let i = 0; i < 5; i += 1) await new Promise((r) => setTimeout(r, 0))
}

async function run(): Promise<void> {
  setActivePinia(createPinia())
  const fetchedScopes: unknown[] = []
  const base = createFixtureButterflyGalleryFeedProvider()
  setButterflyGalleryFeedProvider({
    async fetchPage(query) {
      fetchedScopes.push(query.scope ?? null)
      return base.fetchPage(query)
    },
    fetchCatalog: () => base.fetchCatalog(),
  })

  const gallery = useButterflyGalleryStore()
  const batch = useButterflyGalleryBatchStore()
  await gallery.loadPile()
  gallery.completeIntro()
  await settle()

  const fixtures = createButterflyGalleryFixtureEntries()
  assert.equal(gallery.pile.length, fixtures.length)
  assert.deepEqual(
    gallery.folderSummaries.map((f) => f.value),
    ['inbox', 'sorted'],
    'the folder dropdown lists the catalog folders',
  )

  fetchedScopes.length = 0
  gallery.toggleFolderFilter('sorted')
  await settle()
  assert.deepEqual(
    (fetchedScopes[0] as { folder: string }).folder,
    'sorted',
    'picking a folder re-queries the feed scoped to that folder',
  )
  assert.ok(
    gallery.pile.every((entry) => entry.folder === 'sorted'),
    'the reloaded pile holds only that folder',
  )
  gallery.toggleFolderFilter('sorted')
  await settle()
  assert.equal(gallery.pile.length, fixtures.length, 'clearing restores all')

  const [first, second, third] = gallery.visiblePile
  assert.ok(first && second && third)
  gallery.openArtCard(second.id)
  assert.equal(gallery.artCardEntry?.id, second.id)
  assert.equal(gallery.selectedImageId, second.id, 'opening selects it')
  gallery.stepArtCard(1)
  assert.equal(gallery.artCardEntry?.id, third.id)
  gallery.stepArtCard(-1)
  assert.equal(gallery.artCardEntry?.id, second.id)
  gallery.closeArtCard()
  assert.equal(gallery.artCardEntry, null)

  gallery.setBatchMode(true)
  gallery.selectEntries([first.id, second.id])
  await batch.prepareEdit({ type: 'rating', rating: 4 })
  assert.equal(batch.prepared, null, 'a rating batch runs without confirmation')
  assert.equal(gallery.entryById(first.id)?.rating, 4)
  assert.equal(gallery.entryById(second.id)?.rating, 4)
  assert.equal(gallery.batchSelectedCount, 2, 'rating keeps the selection')

  await batch.prepareEdit({ type: 'new-collection', label: 'Keepers' })
  assert.ok(gallery.entryById(first.id)?.collections.includes('keepers'))
  assert.ok(gallery.entryById(second.id)?.collections.includes('keepers'))

  await batch.prepareEdit({ type: 'move', folder: 'keepers/best' })
  assert.ok(batch.prepared, 'a folder move waits for confirmation')
  assert.equal(gallery.entryById(first.id)?.folder, 'inbox')
  await batch.executePreparedBatch(true)
  assert.equal(gallery.entryById(first.id)?.folder, 'keepers/best')
  assert.equal(gallery.entryById(second.id)?.folder, 'keepers/best')
  assert.equal(batch.lastResult?.succeededIds.length, 2)
  assert.equal(gallery.batchSelectedCount, 0, 'a move clears what it moved')

  gallery.selectEntries([third.id])
  await batch.prepareEdit({ type: 'trash' })
  assert.ok(batch.prepared, 'trash waits for confirmation')
  await batch.executePreparedBatch(true)
  assert.equal(gallery.entryById(third.id)?.trashed, true)

  gallery.setBatchMode(false)
  assert.equal(gallery.batchSelectedCount, 0, 'leaving select mode clears it')

  console.log(
    'Butterfly Gallery curation verified: catalog-backed folder dropdown, ' +
      'scoped feed reloads, art card open/step/close, and batch rating, new ' +
      'collection, confirmed folder move, and confirmed trash.',
  )
}

run().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
