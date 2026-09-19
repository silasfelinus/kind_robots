// The fixture-backed ButterflyGalleryActionAdapter (butterfly-gallery/t-007).
// Implements the same write contract the real, partially art-archive-backed
// adapter (butterflyGalleryArtArchiveActionAdapter.ts, t-022) uses: callers
// invoke setProcessed/setRating/trash/restore/addToCollection/
// removeFromCollection and never see the difference. A fixture adapter
// resolves immediately with no external persistence. This module stays free
// of the real adapter's own imports (which need the Nuxt runtime) so it
// keeps working under plain-node contract tests; a client plugin
// (plugins/butterfly-gallery-art-archive-provider.client.ts) installs the
// real adapter at app startup via setButterflyGalleryActionAdapter().
import type { ButterflyGalleryActionAdapter } from '@/types/butterflyGallery'

export function createFixtureButterflyGalleryActionAdapter(): ButterflyGalleryActionAdapter {
  return {
    async setProcessed(): Promise<void> {},
    async setRating(): Promise<void> {},
    async trash(): Promise<void> {},
    async restore(): Promise<void> {},
    async addToCollection(): Promise<void> {},
    async removeFromCollection(): Promise<void> {},
    async markNeedsReview(): Promise<void> {},
  }
}

let activeAdapter: ButterflyGalleryActionAdapter =
  createFixtureButterflyGalleryActionAdapter()

/** The adapter the store persists through today. A client plugin swaps in
 * the real (partially art-archive-backed) adapter at app startup (see this
 * file's header comment); resetButterflyGalleryActionAdapter() restores
 * fixtures for tests. */
export function defaultButterflyGalleryActionAdapter(): ButterflyGalleryActionAdapter {
  return activeAdapter
}

export function setButterflyGalleryActionAdapter(
  adapter: ButterflyGalleryActionAdapter,
): void {
  activeAdapter = adapter
}

export function resetButterflyGalleryActionAdapter(): void {
  activeAdapter = createFixtureButterflyGalleryActionAdapter()
}
