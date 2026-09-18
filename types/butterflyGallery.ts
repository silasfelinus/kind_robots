// Shared types for the Butterfly Gallery curation surface (butterfly-gallery/t-003).
// Fixture/private ArtImage data drives this until art-archive/t-004 exposes the
// real read contract -- see stores/helpers/butterflyGalleryFixtures.ts.

export type ButterflyGalleryStatus =
  | 'loading'
  | 'intro'
  | 'ready'
  | 'dragging'
  | 'dropping'
  | 'saving'
  | 'rescanning'
  | 'error'

export type ButterflyMatchState = 'matched' | 'unmatched' | 'missing'

export type ButterflyPileEntry = {
  id: number
  thumbnailPath: string
  displayPath: string
  isMature: boolean
  isPublic: boolean
  processed: boolean
  trashed: boolean
  rating: number | null
  folder: string | null
  collections: string[]
  prompt: string | null
  checkpoint: string | null
  matchState: ButterflyMatchState
}

export type ButterflyBinSide = 'left' | 'right'

export type ButterflyBinKind =
  | 'processed'
  | 'unprocessed'
  | 'rating'
  | 'trash'
  | 'collection'
  | 'needs-review'
  | 'move'
  | 'preset'

export type ButterflyBinConfig = {
  id: string
  label: string
  side: ButterflyBinSide
  icon: string
  kind: ButterflyBinKind
  payload: Record<string, unknown>
  sortOrder: number
  enabled: boolean
}

export type ButterflyGalleryFilters = {
  processed: 'all' | 'processed' | 'unprocessed'
  rating: number | null
  matchState: ButterflyMatchState | 'all'
  folder: string | null
  collection: string | null
  search: string
}

export function defaultButterflyGalleryFilters(): ButterflyGalleryFilters {
  return {
    processed: 'all',
    rating: null,
    matchState: 'all',
    folder: null,
    collection: null,
    search: '',
  }
}

export type ButterflyDropOutcome = {
  entryId: number
  binId: string
  kind: ButterflyBinKind
}
