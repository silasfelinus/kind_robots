// The fixture-backed ButterflyGalleryActionAdapter (butterfly-gallery/t-007).
// Implements the same write contract a real art-archive-backed adapter will:
// callers invoke setProcessed/setRating/trash/restore/addToCollection/
// removeFromCollection and never see the difference. A fixture adapter
// resolves immediately with no external persistence, matching the
// feed provider's fixture-first precedent (butterflyGalleryFeedProvider.ts).
// Swapping in a real adapter later (t-022) is a one-line change in
// defaultButterflyGalleryActionAdapter(), not a store/component rewrite.
import type { ButterflyGalleryActionAdapter } from '@/types/butterflyGallery'

export function createFixtureButterflyGalleryActionAdapter(): ButterflyGalleryActionAdapter {
  return {
    async setProcessed(): Promise<void> {},
    async setRating(): Promise<void> {},
    async trash(): Promise<void> {},
    async restore(): Promise<void> {},
    async addToCollection(): Promise<void> {},
    async removeFromCollection(): Promise<void> {},
  }
}

let activeAdapter: ButterflyGalleryActionAdapter =
  createFixtureButterflyGalleryActionAdapter()

/** The adapter the store persists through today. Real art-archive integration
 * calls setButterflyGalleryActionAdapter() with its own implementation. */
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
