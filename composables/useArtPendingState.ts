// /composables/useArtPendingState.ts
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
 * every surface renders that signal with. This is the composable other card
 * components are meant to adopt (interface-vision/t-138); the lower-level
 * store stays reusable directly for a surface that also wants to trigger a
 * request itself, not just observe one.
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
