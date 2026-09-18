// Shared types for the Butterfly Gallery curation surface (butterfly-gallery/t-003,
// t-004). The feed contract (ButterflyGalleryFeedProvider and friends) is the
// narrow read seam this project needs from the archive; a fixture provider
// backs it today (stores/helpers/butterflyGalleryFeedProvider.ts) and a real
// art-archive-backed provider swaps in later without touching the store's
// public API -- see the project boundary notes in
// projects/butterfly-gallery/DESIGN-BRIEF.md (conductor repo).

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

export type ButterflyResourceProvenance = {
  checkpoint: string | null
  loras: string[]
}

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
  negativePrompt: string | null
  resource: ButterflyResourceProvenance
  /** Extracted generation metadata beyond prompt/resource (sampler, steps,
   * seed, etc.) -- deliberately untyped since the archive's extraction
   * surface is still evolving; consumers narrow what they read from it. */
  generationMetadata: Record<string, unknown> | null
  matchState: ButterflyMatchState
  /** ArtJob ids submitted for this entry via a generation-action preset bin
   * (butterfly-gallery/t-019) that haven't been reconciled yet -- traceable
   * provenance only, never mutated by anything other than
   * applyPendingGenerationJobIds(); nothing here ever swaps displayPath, so
   * a failed or still-pending job can never destroy the current image. */
  pendingGenerationJobIds: number[]
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

/** Trash visibility is its own dimension from `matchState` (provenance match
 * quality) -- a trashed entry can have any matchState, so folding "show
 * trashed" into `matchState === 'missing'` (as the original t-003 scaffolding
 * did) silently hid every trashed entry whose matchState wasn't literally
 * 'missing' (butterfly-gallery/t-009). 'active' (default) hides trashed
 * entries from the working pile; 'trashed' shows only the recoverable
 * graveyard; 'all' shows both. */
export type ButterflyTrashView = 'active' | 'trashed' | 'all'

export type ButterflyGalleryFilters = {
  processed: 'all' | 'processed' | 'unprocessed'
  rating: number | null
  matchState: ButterflyMatchState | 'all'
  trashView: ButterflyTrashView
  folder: string | null
  collection: string | null
  search: string
}

export function defaultButterflyGalleryFilters(): ButterflyGalleryFilters {
  return {
    processed: 'all',
    rating: null,
    matchState: 'all',
    trashView: 'active',
    folder: null,
    collection: null,
    search: '',
  }
}

/** One folder or collection's name plus how many pile entries currently
 * carry it -- the data a browsing list/chip row renders (butterfly-
 * gallery/t-009). */
export type ButterflyGroupSummary = {
  value: string
  count: number
}

export type ButterflyDropOutcome = {
  entryId: number
  binId: string
  kind: ButterflyBinKind
}

// -- Feed contract (butterfly-gallery/t-004) ---------------------------------
//
// The narrow read seam Butterfly Gallery needs from art-archive: a page of
// ButterflyPileEntry records plus a cursor for the next page. Butterfly
// Gallery never scans the filesystem or matches provenance itself -- it only
// ever calls fetchPage() through whatever ButterflyGalleryFeedProvider is
// installed. A fixture provider satisfies this today
// (stores/helpers/butterflyGalleryFeedProvider.ts); the real provider wraps
// art-archive's own read APIs once they exist, translating its response
// shape into ButterflyPileEntry without the store or components changing.

export type ButterflyFeedCursor = string | null

export type ButterflyFeedQuery = {
  /** Opaque cursor from a prior page's nextCursor. Omitted/null fetches the first page. */
  cursor?: ButterflyFeedCursor
  /** Requested page size; a provider may return fewer. */
  limit?: number
}

export type ButterflyFeedPage = {
  entries: ButterflyPileEntry[]
  nextCursor: ButterflyFeedCursor
}

export interface ButterflyGalleryFeedProvider {
  fetchPage(query: ButterflyFeedQuery): Promise<ButterflyFeedPage>
}

// -- Action contract (butterfly-gallery/t-007) -------------------------------
//
// The narrow write seam Butterfly Gallery needs from art-archive: mark
// processed/unprocessed, set a 1-5 rating, trash (reversibly) and restore,
// and add/remove collection membership. A fixture-backed adapter satisfies
// this today (stores/helpers/butterflyGalleryActionAdapter.ts) so curation
// actions are wired end-to-end against local state; a real art-archive-backed
// adapter swaps in later (t-022) the same way the feed provider above does,
// without the store or components changing. Butterfly Gallery never recreates
// archive filesystem semantics itself -- every persistence intent flows
// through one of these methods.

export interface ButterflyGalleryActionAdapter {
  setProcessed(entryId: number, processed: boolean): Promise<void>
  setRating(entryId: number, rating: number | null): Promise<void>
  trash(entryId: number): Promise<void>
  restore(entryId: number): Promise<void>
  addToCollection(entryId: number, collection: string): Promise<void>
  removeFromCollection(entryId: number, collection: string): Promise<void>
}

// -- Generation contract (butterfly-gallery/t-019) ---------------------------
//
// The reusable generation/action intents a custom bin preset can carry
// (butterfly-gallery/t-018) and the narrow write seam Butterfly Gallery uses
// to turn them into real work: submitting an ArtJob through the existing
// durable queue (POST /api/art/enqueue). Butterfly Gallery never runs its own
// render pipeline -- every regenerate/variant/replacement intent flows
// through ButterflyGalleryGenerationClient.submit() below, and the caller
// decides what (if anything) happens to the pile entry once a job exists;
// nothing in this contract ever overwrites an entry's current image, so a
// failed or still-pending job can never destroy the source it was meant to
// improve on.

export type ButterflyGenerationAction =
  | { kind: 'add-lora'; resource: string; weight?: number }
  | { kind: 'replace-lora'; from: string; to: string; weight?: number }
  | { kind: 'switch-checkpoint'; resource: string }
  | { kind: 'append-prompt'; text: string }
  | { kind: 'replace-prompt'; text: string }
  | {
      kind: 'set-generation'
      values: Record<string, string | number | boolean>
    }
  | { kind: 'add-variant' }
  | { kind: 'request-replacement' }

export type ButterflyGenerationRequest = {
  engine: 'krea2'
  promptString: string
  negativePrompt: string
  checkpoint: string | null
  loras: Array<{ name: string; strength?: number }>
  projectSlug: 'butterfly-gallery'
  priority: number
  isPublic: boolean
  isMature: boolean
  designer: string
  /** set-generation overrides (width/height/steps/cfg/etc.), keyed to match
   * POST /api/art/enqueue's own field names -- the preset editor's
   * responsibility, not something this contract validates. */
  generation: Record<string, string | number | boolean>
}

export interface ButterflyGalleryGenerationClient {
  submit(request: ButterflyGenerationRequest): Promise<{ jobId: number }>
}
