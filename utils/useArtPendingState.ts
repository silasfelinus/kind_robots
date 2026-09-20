// @/utils/useArtPendingState.ts
import { computed, type ComputedRef, type Ref } from 'vue'
import { useArtRequestStore } from '@/stores/artRequestStore'

export interface ArtPendingState {
  /** Queued through the art-request fallback and not rendered yet. */
  pending: ComputedRef<boolean>
  /** A request for this src is actively in flight right now. */
  requesting: ComputedRef<boolean>
  /** Last error trying to queue this src, if any. */
  error: ComputedRef<string>
}

/**
 * Read-only view of whether ONE image src's art has been queued through the
 * shared art-request fallback (stores/artRequestStore.ts) and is not yet
 * rendered.
 *
 * A card hands this whatever src it just tried (and failed) to load and gets
 * back a calm "on its way" signal it can show instead of a bare broken image
 * -- see components/art/art-pending-placeholder.vue for the shared visual
 * every surface renders that signal with. This is genuinely cross-domain
 * stateless code (AGENTS.md), not a store of its own -- the actual state
 * lives in stores/artRequestStore.ts, so this lives in utils/ rather than a
 * root composables/ directory, which this repo's architecture forbids (see
 * utils/scripts/verify-project-architecture.mjs).
 */
export function useArtPendingState(
  src: Ref<string> | ComputedRef<string> | (() => string),
): ArtPendingState {
  const store = useArtRequestStore()
  const resolve = (): string => (typeof src === 'function' ? src() : src.value)

  return {
    pending: computed(() => store.isPending(resolve())),
    requesting: computed(() => store.isRequesting(resolve())),
    error: computed(() => store.errorFor(resolve())),
  }
}
