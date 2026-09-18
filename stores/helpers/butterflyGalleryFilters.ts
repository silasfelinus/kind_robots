// Pure filter predicate and folder/collection summaries for the Butterfly
// Gallery pile (butterfly-gallery/t-009). Deliberately plain functions with
// no Pinia dependency so they can be unit-tested directly (see
// utils/scripts/verifyButterflyGalleryFilters.test.ts) the same way
// butterflyGalleryActions.ts's appliers are.
import type {
  ButterflyGalleryFilters,
  ButterflyGroupSummary,
  ButterflyPileEntry,
} from '@/types/butterflyGallery'

/** Whether a single pile entry passes the current filter set. Trash
 * visibility (`trashView`) is checked independently of `matchState` --
 * a trashed entry can carry any matchState, so the two must never be
 * conflated (see the ButterflyTrashView doc comment in types/butterflyGallery.ts). */
export function matchesButterflyGalleryFilters(
  entry: ButterflyPileEntry,
  filters: ButterflyGalleryFilters,
): boolean {
  if (filters.trashView === 'active' && entry.trashed) return false
  if (filters.trashView === 'trashed' && !entry.trashed) return false

  if (filters.processed === 'processed' && !entry.processed) return false
  if (filters.processed === 'unprocessed' && entry.processed) return false

  if (filters.rating !== null && entry.rating !== filters.rating) return false

  if (
    filters.matchState !== 'all' &&
    entry.matchState !== filters.matchState
  ) {
    return false
  }

  if (filters.folder && entry.folder !== filters.folder) return false

  if (filters.collection && !entry.collections.includes(filters.collection))
    return false

  if (filters.search) {
    const needle = filters.search.toLowerCase()
    if (!(entry.prompt ?? '').toLowerCase().includes(needle)) return false
  }

  return true
}

function summarize(values: string[]): ButterflyGroupSummary[] {
  const counts = new Map<string, number>()
  for (const value of values) counts.set(value, (counts.get(value) ?? 0) + 1)
  return [...counts.entries()]
    .map(([value, count]) => ({ value, count }))
    .sort((a, b) => a.value.localeCompare(b.value))
}

/** Every distinct folder across the pile, with a count of entries in it.
 * Deliberately counts the whole pile rather than the currently-filtered
 * view, so folder names never disappear from the browsing list just
 * because another filter temporarily hides every entry in them. */
export function summarizeButterflyGalleryFolders(
  entries: ButterflyPileEntry[],
): ButterflyGroupSummary[] {
  return summarize(
    entries
      .map((entry) => entry.folder)
      .filter((folder): folder is string => Boolean(folder)),
  )
}

/** Every distinct collection across the pile, with a count of entries
 * carrying it. Same whole-pile counting rationale as folders above. */
export function summarizeButterflyGalleryCollections(
  entries: ButterflyPileEntry[],
): ButterflyGroupSummary[] {
  return summarize(entries.flatMap((entry) => entry.collections))
}
