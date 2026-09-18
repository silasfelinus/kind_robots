// Pure curation-action appliers for the Butterfly Gallery pile (butterfly-
// gallery/t-007). Each function mutates a ButterflyPileEntry's local fields
// to reflect one first-class action -- mark processed/unprocessed, set a 1-5
// rating, trash/restore, and add/remove collection membership. These are
// deliberately plain functions with no Pinia/adapter dependency so they can
// be unit-tested directly (see utils/scripts/verifyButterflyGalleryActions.test.ts)
// and reused by both the sorting-bin drop path and any future first-class
// action UI (quick-action drawer, keyboard shortcuts) without duplicating
// the field-level rules.
import type {
  ButterflyBinConfig,
  ButterflyGalleryActionAdapter,
  ButterflyGalleryGenerationClient,
  ButterflyGenerationAction,
  ButterflyPileEntry,
} from '@/types/butterflyGallery'
import { buildButterflyGenerationRequest } from '@/stores/helpers/butterflyGalleryGenerationRequest'

export function applyProcessedAction(
  entry: ButterflyPileEntry,
  processed: boolean,
): void {
  entry.processed = processed
}

/** Ratings are clamped to the 1-5 contract; null explicitly clears a rating. */
export function applyRatingAction(
  entry: ButterflyPileEntry,
  rating: number | null,
): void {
  if (rating === null) {
    entry.rating = null
    return
  }
  entry.rating = Math.min(5, Math.max(1, Math.round(rating)))
}

/** Trash is reversible: it only flips the local flag, never drops the entry
 * from the pile, so applyRestoreAction can always undo it. */
export function applyTrashAction(entry: ButterflyPileEntry): void {
  entry.trashed = true
}

export function applyRestoreAction(entry: ButterflyPileEntry): void {
  entry.trashed = false
}

export function applyAddToCollectionAction(
  entry: ButterflyPileEntry,
  collection: string,
): void {
  if (!collection || entry.collections.includes(collection)) return
  entry.collections = [...entry.collections, collection]
}

export function applyRemoveFromCollectionAction(
  entry: ButterflyPileEntry,
  collection: string,
): void {
  if (!entry.collections.includes(collection)) return
  entry.collections = entry.collections.filter((c) => c !== collection)
}

/** Applies a sorting-bin drop's configured outcome by composing the same
 * first-class appliers above -- a preset bin is just several of these fired
 * together, not a separate code path. */
export function applyBinOutcome(
  entry: ButterflyPileEntry,
  bin: ButterflyBinConfig,
): void {
  switch (bin.kind) {
    case 'processed':
      applyProcessedAction(entry, true)
      break
    case 'unprocessed':
      applyProcessedAction(entry, false)
      break
    case 'trash':
      applyTrashAction(entry)
      break
    case 'needs-review':
      entry.matchState = 'unmatched'
      break
    case 'collection': {
      const collection =
        typeof bin.payload.collection === 'string'
          ? bin.payload.collection
          : null
      if (collection) applyAddToCollectionAction(entry, collection)
      break
    }
    case 'rating': {
      const rating =
        typeof bin.payload.rating === 'number' ? bin.payload.rating : null
      if (rating !== null) applyRatingAction(entry, rating)
      break
    }
    case 'preset': {
      const rating =
        typeof bin.payload.rating === 'number' ? bin.payload.rating : null
      const collection =
        typeof bin.payload.collection === 'string'
          ? bin.payload.collection
          : null
      const folder =
        typeof bin.payload.folder === 'string' ? bin.payload.folder : null
      const processed =
        typeof bin.payload.processed === 'boolean'
          ? bin.payload.processed
          : null

      if (rating !== null) applyRatingAction(entry, rating)
      if (collection) applyAddToCollectionAction(entry, collection)
      if (folder) entry.folder = folder
      if (processed !== null) applyProcessedAction(entry, processed)
      break
    }
    default:
      break
  }
}

/** Fires whichever adapter calls a sorting-bin drop implies, mirroring
 * applyBinOutcome's own switch so persistence and local mutation always
 * agree on what a bin does. Awaited before the caller mutates local state,
 * so a real (future) adapter's failure never leaves the pile showing an
 * outcome that was never actually saved. */
export async function persistBinOutcome(
  adapter: ButterflyGalleryActionAdapter,
  entryId: number,
  bin: ButterflyBinConfig,
): Promise<void> {
  switch (bin.kind) {
    case 'processed':
      await adapter.setProcessed(entryId, true)
      break
    case 'unprocessed':
      await adapter.setProcessed(entryId, false)
      break
    case 'trash':
      await adapter.trash(entryId)
      break
    case 'needs-review':
      break
    case 'collection': {
      const collection =
        typeof bin.payload.collection === 'string'
          ? bin.payload.collection
          : null
      if (collection) await adapter.addToCollection(entryId, collection)
      break
    }
    case 'rating': {
      const rating =
        typeof bin.payload.rating === 'number' ? bin.payload.rating : null
      if (rating !== null) await adapter.setRating(entryId, rating)
      break
    }
    case 'preset': {
      const rating =
        typeof bin.payload.rating === 'number' ? bin.payload.rating : null
      const collection =
        typeof bin.payload.collection === 'string'
          ? bin.payload.collection
          : null
      const processed =
        typeof bin.payload.processed === 'boolean'
          ? bin.payload.processed
          : null

      if (rating !== null) await adapter.setRating(entryId, rating)
      if (collection) await adapter.addToCollection(entryId, collection)
      if (processed !== null) await adapter.setProcessed(entryId, processed)
      break
    }
    default:
      break
  }
}

/** Submits any generation actions a preset bin carries (butterfly-
 * gallery/t-018/t-019) as one ArtJob through the existing durable queue --
 * Butterfly Gallery is a controller, not a second render queue, so this is
 * the only place a bin drop ever reaches the render backend. A bin with no
 * `actions` (every built-in default bin) is a no-op, matching every other
 * preset behavior unaffected by this task. Returns the submitted job ids
 * for the caller to record; throws (without touching the entry) if
 * submission fails, so a failed request never destroys the entry's current
 * image -- the caller decides what happens next, if anything. */
export async function persistBinGenerationActions(
  client: ButterflyGalleryGenerationClient,
  entry: ButterflyPileEntry,
  bin: ButterflyBinConfig & { actions?: ButterflyGenerationAction[] },
): Promise<number[]> {
  const actions = bin.actions ?? []
  if (!actions.length) return []
  const request = buildButterflyGenerationRequest(entry, actions)
  const { jobId } = await client.submit(request)
  return [jobId]
}

/** Records newly submitted generation job ids on the entry -- pure local
 * mutation, mirrors applyBinOutcome's split from persistBinOutcome. A no-op
 * for the common case (no generation actions on the bin), so callers can
 * always call it unconditionally. */
export function applyPendingGenerationJobIds(
  entry: ButterflyPileEntry,
  jobIds: number[],
): void {
  if (!jobIds.length) return
  entry.pendingGenerationJobIds = [...entry.pendingGenerationJobIds, ...jobIds]
}
