// The real art-archive-backed ButterflyGalleryActionAdapter (butterfly-
// gallery/t-022), for actions that have a 1:1 admin archive API to persist
// through. Uses the same performFetch() helper (stores/utils.ts) as
// artArchiveStore.ts -- it carries the admin bearer token automatically.
// The remaining contract stays fixture-backed (no-op) until matching real
// persistence exists:
//   - setProcessed: ArchiveEntry has no curated/processed flag.
//   - preset-bin collection drops carry only a slug, so addToCollection and
//     removeFromCollection persist only when the caller also supplies the
//     numeric ArtCollection id (the gallery's own collection controls do).
import { performFetch } from '@/stores/utils'
import type {
  ButterflyCollectionRef,
  ButterflyGalleryActionAdapter,
} from '@/types/butterflyGallery'

async function postOk(path: string): Promise<void> {
  const response = await performFetch<unknown>(path, { method: 'POST' })
  if (!response.success)
    throw new Error(response.message || `Request to ${path} failed.`)
}

async function notYetWired(): Promise<void> {}

async function patchCollections(
  entryId: number,
  change: { addCollectionIds?: number[]; removeCollectionIds?: number[] },
): Promise<void> {
  const response = await performFetch<unknown>(
    `/api/admin/art-archive/entries/${entryId}/collections`,
    { method: 'PATCH', body: JSON.stringify(change) },
  )
  if (!response.success)
    throw new Error(response.message || 'Failed to update collections.')
}

export function createArtArchiveButterflyGalleryActionAdapter(): ButterflyGalleryActionAdapter {
  return {
    setProcessed: notYetWired,
    async setRating(entryId, rating) {
      const response = await performFetch<{
        id: number
        rating: number | null
      }>(`/api/admin/art-archive/entries/${entryId}/rate`, {
        method: 'PATCH',
        body: JSON.stringify({ rating }),
      })
      if (!response.success)
        throw new Error(response.message || 'Failed to set rating.')
    },
    async trash(entryId) {
      await postOk(`/api/admin/art-archive/entries/${entryId}/quarantine`)
    },
    async restore(entryId) {
      await postOk(`/api/admin/art-archive/entries/${entryId}/restore`)
    },
    async addToCollection(entryId, _collection, collectionId) {
      if (collectionId === undefined) return
      await patchCollections(entryId, { addCollectionIds: [collectionId] })
    },
    async removeFromCollection(entryId, _collection, collectionId) {
      if (collectionId === undefined) return
      await patchCollections(entryId, { removeCollectionIds: [collectionId] })
    },
    async markNeedsReview(entryId) {
      await postOk(`/api/admin/art-archive/entries/${entryId}/needs-review`)
    },
    async renameCollection(collectionId, label) {
      const response = await performFetch<unknown>(
        `/api/art/collection/${collectionId}`,
        { method: 'PATCH', body: JSON.stringify({ label }) },
      )
      if (!response.success)
        throw new Error(response.message || 'Failed to rename collection.')
    },
    async createCollection(label) {
      const response = await performFetch<ButterflyCollectionRef>(
        '/api/art/collection',
        { method: 'POST', body: JSON.stringify({ label }) },
      )
      if (!response.success || !response.data)
        throw new Error(response.message || 'Failed to create collection.')
      const { id, slug, label: savedLabel } = response.data
      return { id, slug, label: savedLabel }
    },
  }
}
