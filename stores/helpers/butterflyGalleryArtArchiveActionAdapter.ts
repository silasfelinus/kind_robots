// The real art-archive-backed ButterflyGalleryActionAdapter (butterfly-
// gallery/t-022), for the three actions that already have a 1:1 admin
// archive API to persist through: setRating, trash, restore. Uses the same
// performFetch() helper (stores/utils.ts) as artArchiveStore.ts's own
// quarantine/restore/rate actions -- it carries the admin bearer token
// automatically, preserving admin auth without this module doing it itself.
// The rest of the contract stays fixture-backed (no-op) because the matching
// real persistence doesn't exist yet:
//   - setProcessed: ArchiveEntry has no curated/processed flag (see
//     toButterflyPileEntry's comment in butterflyGalleryArtArchiveFeedProvider.ts).
//   - addToCollection/removeFromCollection: the real endpoint
//     (entries/[id]/collections.patch.ts) takes numeric ArtCollection ids,
//     but this contract's `collection` argument is the pile-entry-facing
//     string (currently the collection slug) with no id-resolution seam yet.
//   - markNeedsReview: no admin endpoint mutates matchState directly today.
// Each of those is a real, scoped follow-up rather than something to
// improvise here.
import { performFetch } from '@/stores/utils'
import type { ButterflyGalleryActionAdapter } from '@/types/butterflyGallery'

async function postOk(path: string): Promise<void> {
  const response = await performFetch<unknown>(path, { method: 'POST' })
  if (!response.success)
    throw new Error(response.message || `Request to ${path} failed.`)
}

/** No real persistence exists yet for these -- see this file's header
 * comment. Kept as explicit no-ops here (rather than importing the fixture
 * adapter) so this module never depends on the fixture module, avoiding a
 * cycle with butterflyGalleryActionAdapter.ts's own default-provider wiring. */
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
    markNeedsReview: notYetWired,
  }
}
