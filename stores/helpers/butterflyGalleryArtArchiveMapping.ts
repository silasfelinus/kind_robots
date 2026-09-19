// Pure row -> ButterflyPileEntry mapping for the real art-archive-backed
// feed provider (butterfly-gallery/t-022,
// butterflyGalleryArtArchiveFeedProvider.ts). Kept in its own module with no
// Nuxt-runtime imports (unlike the provider itself, which needs
// performFetch/@/stores/utils) so the mapping is verifiable under a plain
// contract test without a live database -- see
// utils/scripts/verifyButterflyGalleryArtArchiveFeedProvider.test.ts.
import type {
  ButterflyMatchState,
  ButterflyPileEntry,
} from '@/types/butterflyGallery'

export type ArchiveEntryRow = {
  id: number
  parentFolder: string | null
  processState: string
  matchState: string
  rating: number | null
  isActive: boolean
  imagePath: string | null
  thumbnailPath: string | null
  isMature: boolean
  isPublic: boolean
  prompt: string | null
  negativePrompt: string | null
  checkpoint: string | null
  generationMetadata: Record<string, unknown> | null
  folderCollection: { id: number; slug: string; label: string } | null
}

function toButterflyMatchState(
  row: Pick<ArchiveEntryRow, 'processState' | 'matchState'>,
): ButterflyMatchState {
  if (row.processState === 'MISSING') return 'missing'
  if (row.matchState === 'CONFIRMED' || row.matchState === 'MANUAL')
    return 'matched'
  return 'unmatched'
}

export function toButterflyPileEntry(row: ArchiveEntryRow): ButterflyPileEntry {
  const displayPath = row.imagePath ?? ''
  return {
    id: row.id,
    thumbnailPath: row.thumbnailPath ?? displayPath,
    displayPath,
    isMature: row.isMature,
    isPublic: row.isPublic,
    // No persisted "curated/processed" flag exists on ArchiveEntry yet
    // (see butterfly-gallery/t-022's roadmap note) -- every real entry
    // starts unprocessed until that gap is closed. setProcessed() remains a
    // fixture-backed no-op for the same reason.
    processed: false,
    trashed: !row.isActive,
    rating: row.rating,
    folder: row.parentFolder,
    collections: row.folderCollection ? [row.folderCollection.slug] : [],
    prompt: row.prompt,
    negativePrompt: row.negativePrompt,
    resource: { checkpoint: row.checkpoint, loras: [] },
    generationMetadata: row.generationMetadata,
    matchState: toButterflyMatchState(row),
    pendingGenerationJobIds: [],
  }
}
