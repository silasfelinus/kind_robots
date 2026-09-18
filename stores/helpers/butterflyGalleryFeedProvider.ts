// The fixture-backed ButterflyGalleryFeedProvider (butterfly-gallery/t-004).
// Implements the same feed contract a real art-archive-backed provider will:
// callers page through fetchPage({ cursor, limit }) and never see the
// difference. Swapping this out later is a one-line change in
// defaultButterflyGalleryFeedProvider(), not a store/component rewrite.
import { createButterflyGalleryFixtureEntries } from '@/stores/helpers/butterflyGalleryFixtures'
import type {
  ButterflyFeedPage,
  ButterflyFeedQuery,
  ButterflyGalleryFeedProvider,
  ButterflyPileEntry,
} from '@/types/butterflyGallery'

const DEFAULT_PAGE_LIMIT = 20

function encodeCursor(offset: number): string {
  return String(offset)
}

function decodeCursor(cursor: string | null | undefined): number {
  if (!cursor) return 0
  const offset = Number(cursor)
  return Number.isInteger(offset) && offset >= 0 ? offset : 0
}

export function createFixtureButterflyGalleryFeedProvider(
  entries: ButterflyPileEntry[] = createButterflyGalleryFixtureEntries(),
): ButterflyGalleryFeedProvider {
  return {
    async fetchPage(query: ButterflyFeedQuery): Promise<ButterflyFeedPage> {
      const offset = decodeCursor(query.cursor)
      const limit =
        query.limit && query.limit > 0 ? query.limit : DEFAULT_PAGE_LIMIT
      const page = entries.slice(offset, offset + limit)
      const nextOffset = offset + page.length

      return {
        entries: page,
        nextCursor:
          nextOffset < entries.length ? encodeCursor(nextOffset) : null,
      }
    },
  }
}

let activeProvider: ButterflyGalleryFeedProvider =
  createFixtureButterflyGalleryFeedProvider()

/** The provider the store reads through today. Real art-archive integration
 * calls setButterflyGalleryFeedProvider() with its own implementation. */
export function defaultButterflyGalleryFeedProvider(): ButterflyGalleryFeedProvider {
  return activeProvider
}

export function setButterflyGalleryFeedProvider(
  provider: ButterflyGalleryFeedProvider,
): void {
  activeProvider = provider
}

export function resetButterflyGalleryFeedProvider(): void {
  activeProvider = createFixtureButterflyGalleryFeedProvider()
}
