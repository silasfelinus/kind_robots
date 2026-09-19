// The fixture-backed ButterflyGalleryFeedProvider (butterfly-gallery/t-004).
// Implements the same feed contract the real art-archive-backed provider
// (butterflyGalleryArtArchiveFeedProvider.ts, t-022) uses: callers page
// through fetchPage({ cursor, limit }) and never see the difference. This
// module stays free of the real provider's own imports (which need the Nuxt
// runtime) so it keeps working under plain-node contract tests; a client
// plugin (plugins/butterfly-gallery-art-archive-provider.client.ts) installs
// the real provider at app startup via setButterflyGalleryFeedProvider().
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

/** The provider the store reads through today. A client plugin swaps in the
 * real art-archive-backed provider at app startup (see this file's header
 * comment); resetButterflyGalleryFeedProvider() restores fixtures for
 * tests. */
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
