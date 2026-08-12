// /stores/helpers/brainstormSourceAdapterKit.ts
//
// conductor brainstorm/t-012: the store-agnostic half of the source-object
// adapter contract -- types plus the resolve/search dispatch and fallback
// logic. Deliberately has NO imports of Pinia stores (characterStore,
// dreamStore, ...), so it can be unit-tested with plain `tsx`/node, outside
// a Nuxt/Vite runtime. Per-entity adapters (which DO need live stores) live
// in brainstormSourceAdapters.ts and import this kit rather than the other
// way around.
import type { BrainstormSourceRef } from '@/types/brainstorm'

/** A lightweight row for a source picker's search results. */
export interface BrainstormSourceOption {
  modelType: string
  id: number
  title: string
  subtitle?: string
}

/** The resolved, display-ready shape of a selected source object. */
export interface BrainstormSourceDisplay extends BrainstormSourceOption {
  thumbnailUrl: string | null
}

export interface BrainstormSourceAdapter {
  /** Canonical modelType key. Matches BrainstormSourceRef.modelType (case-insensitive). */
  modelType: string
  /** Human label for the picker UI ("Character", "Dream"). */
  label: string
  /** Resolve a ref into a display-ready summary, or null if it can't be found. */
  resolve: (ref: BrainstormSourceRef) => Promise<BrainstormSourceDisplay | null>
  /** Search this entity type for the picker. An empty query returns known/recent rows. */
  search: (query: string) => Promise<BrainstormSourceOption[]>
}

export type BrainstormSourceAdapterRegistry = Record<
  string,
  BrainstormSourceAdapter
>

/** Case-insensitive matching helper shared by every adapter's search(). */
export function matchesQuery(
  haystack: Array<string | null | undefined>,
  query: string,
): boolean {
  const needle = query.trim().toLowerCase()
  if (!needle) return true
  return haystack.some((part) => (part || '').toLowerCase().includes(needle))
}

/**
 * Return rows only when the caller can prove the fetch just completed
 * successfully. Some entity stores intentionally fall back to cached rows when
 * their remote fetch fails; source pickers must not reuse that offline behavior
 * because cached private rows may predate an auth transition.
 */
export async function fetchFreshSourceRows<T>(
  fetchRows: () => Promise<T[]>,
  didFetchFail: () => boolean,
): Promise<T[]> {
  const rows = await fetchRows()
  return didFetchFail() ? [] : rows
}

export function getBrainstormSourceAdapter(
  modelType: string | null | undefined,
  registry: BrainstormSourceAdapterRegistry,
): BrainstormSourceAdapter | null {
  if (!modelType) return null
  return registry[modelType.toLowerCase()] || null
}

/**
 * Resolve a BrainstormSourceRef into a display-ready summary.
 *
 * Falls back to a generic display built from the ref itself (never null for
 * a non-null ref) when the modelType has no registered adapter yet, or when
 * a registered adapter's lookup misses -- e.g. the row was deleted since the
 * ref was captured. The UI can always show *something* and let the user
 * remove it, rather than the source silently vanishing without explanation.
 */
export async function resolveBrainstormSource(
  ref: BrainstormSourceRef | null | undefined,
  registry: BrainstormSourceAdapterRegistry,
): Promise<BrainstormSourceDisplay | null> {
  if (!ref) return null

  const adapter = getBrainstormSourceAdapter(ref.modelType, registry)
  if (adapter) {
    try {
      const resolved = await adapter.resolve(ref)
      if (resolved) return resolved
    } catch {
      // Fall through to the generic fallback below -- a lookup error should
      // not make the selected source disappear from the UI.
    }
  }

  return {
    modelType: ref.modelType,
    id: ref.id ?? 0,
    title: ref.slug || `${ref.modelType} #${ref.id ?? '?'}`,
    subtitle: adapter
      ? 'No longer available'
      : `Unsupported source type "${ref.modelType}"`,
    thumbnailUrl: null,
  }
}

/** Search a registered entity type for the source picker. Empty array for an unregistered modelType. */
export async function searchBrainstormSources(
  modelType: string,
  query: string,
  registry: BrainstormSourceAdapterRegistry,
): Promise<BrainstormSourceOption[]> {
  const adapter = getBrainstormSourceAdapter(modelType, registry)
  if (!adapter) return []
  return adapter.search(query)
}
