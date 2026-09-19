// The real art-archive-backed ButterflyGalleryFeedProvider (butterfly-gallery/
// t-022). Reads through the existing admin-only archive browse API
// (GET /api/admin/art-archive/entries) rather than querying PRIVATE_PATH or
// any ArchiveEntry scanner logic directly, and never duplicates the
// scanner/matcher's own work -- it only maps the API's already-computed rows
// (via butterflyGalleryArtArchiveMapping.ts) onto the ButterflyPileEntry
// shape the fixture provider already produces.
// includeInactive is always requested so quarantined (trashed) entries stay
// visible to the pile -- Butterfly Gallery's own trash bin models that state
// via ButterflyPileEntry.trashed rather than having entries disappear.
import { performFetch } from '@/stores/utils'
import { toButterflyPileEntry } from '@/stores/helpers/butterflyGalleryArtArchiveMapping'
import type { ArchiveEntryRow } from '@/stores/helpers/butterflyGalleryArtArchiveMapping'
import type {
  ButterflyFeedPage,
  ButterflyFeedQuery,
  ButterflyGalleryFeedProvider,
} from '@/types/butterflyGallery'

const DEFAULT_PAGE_LIMIT = 50

type ArchiveEntriesPayload = {
  entries: ArchiveEntryRow[]
  page: number
  pageSize: number
  total: number
}

function encodeCursor(page: number): string {
  return String(page)
}

function decodeCursor(cursor: string | null | undefined): number {
  if (!cursor) return 1
  const page = Number(cursor)
  return Number.isInteger(page) && page > 0 ? page : 1
}

export function createArtArchiveButterflyGalleryFeedProvider(): ButterflyGalleryFeedProvider {
  return {
    async fetchPage(query: ButterflyFeedQuery): Promise<ButterflyFeedPage> {
      const page = decodeCursor(query.cursor)
      const pageSize =
        query.limit && query.limit > 0 ? query.limit : DEFAULT_PAGE_LIMIT
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(pageSize),
        includeInactive: 'true',
      })
      const response = await performFetch<ArchiveEntriesPayload>(
        `/api/admin/art-archive/entries?${params}`,
      )
      if (!response.success || !response.data) {
        throw new Error(
          response.message ?? 'Failed to fetch Art Archive entries.',
        )
      }
      const { entries, total } = response.data
      const fetchedThroughRow = (page - 1) * pageSize + entries.length
      return {
        entries: entries.map(toButterflyPileEntry),
        nextCursor: fetchedThroughRow < total ? encodeCursor(page + 1) : null,
      }
    },
  }
}
