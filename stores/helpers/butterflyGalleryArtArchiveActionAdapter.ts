// The real art-archive-backed ButterflyGalleryActionAdapter (butterfly-
// gallery/t-022), for actions that have a 1:1 admin archive API to persist
// through. Uses the same performFetch() helper (stores/utils.ts) as
// artArchiveStore.ts -- it carries the admin bearer token automatically.
// The remaining contract stays fixture-backed (no-op) until matching real
// persistence exists:
//   - setProcessed: ArchiveEntry has no curated/processed flag.
//   - addToCollection/removeFromCollection: the real endpoint takes numeric
//     ArtCollection ids, while this contract currently receives a slug string.
import { performFetch } from '@/stores/utils'
import type { ButterflyGalleryActionAdapter } from '@/types/butterflyGallery'

async function postOk(path: string): Promise<void> {
  const response = await performFetch<unknown>(path, { method: 'POST' })
  if (!response.success)
    throw new Error(response.message || `Request to ${path} failed.`)
}

async function notYetWired(): Promise<void> {}

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
    addToCollection: notYetWired,
    removeFromCollection: notYetWired,
    async markNeedsReview(entryId) {
      await postOk(`/api/admin/art-archive/entries/${entryId}/needs-review`)
    },
  }
}
