// /stores/artRequestStore.ts
import { reactive } from 'vue'
import { defineStore } from 'pinia'
import { performFetch } from '@/stores/utils'

export interface ArtRequestParams {
  src: string
  pageUrl?: string
  alt?: string
  label?: string
  variant?: 'icon' | 'card' | 'hero' | 'image'
  size?: string
  prompt?: string
  pageTitle?: string
  pageDescription?: string
  nearestHeading?: string
  nearbyText?: string
  modelType?: string
  modelId?: number
  modelSlug?: string
  modelField?: string
}

/**
 * Generic, entity-agnostic ledger of "has this image's art been queued
 * through the /api/conductor/art-request fallback, and not rendered yet" --
 * keyed by the image SRC every art-bearing surface already carries, rather
 * than by an entity id a lot of those surfaces do not have handy.
 *
 * Generalizes the requesting/requested/errors reactive-map pattern
 * stores/facetArtRequestStore.ts already proved out for the Facets picker.
 * That store is left as-is (art-facet-selector.vue and the Facet
 * art-generation contract in utils/scripts/verifyFacetArtGeneration.ts pin
 * its exact shape) -- this is the shared version every OTHER surface reads
 * from. plugins/missing-image-reporter.client.ts, the actual fallback that
 * already fires site-wide whenever an <img> fails to load, writes into this
 * store, so a card never has to run its own request just to learn its art is
 * already on the way (interface-vision/t-138: Silas could not tell "art
 * queued" from "art broken" and guessed the art server was down).
 */
export const useArtRequestStore = defineStore('artRequestStore', () => {
  const requesting = reactive<Record<string, boolean>>({})
  const requested = reactive<Record<string, boolean>>({})
  const errors = reactive<Record<string, string>>({})

  function markRequesting(src: string): void {
    if (!src) return
    requesting[src] = true
  }

  function markRequested(src: string): void {
    if (!src) return
    requesting[src] = false
    requested[src] = true
    errors[src] = ''
  }

  function markError(src: string, message: string): void {
    if (!src) return
    requesting[src] = false
    errors[src] = message || 'Art request could not be queued.'
  }

  /** Queued or in flight -- either way, the calm "on its way" state. */
  function isPending(src: string): boolean {
    return Boolean(src && (requesting[src] || requested[src]))
  }

  function isRequesting(src: string): boolean {
    return Boolean(src && requesting[src])
  }

  function errorFor(src: string): string {
    return (src && errors[src]) || ''
  }

  /**
   * Explicitly queue art for a src. For an admin surface that wants its own
   * "Request artwork" affordance rather than relying on the automatic
   * broken-image reporter -- mirrors
   * facetArtRequestStore.requestPrimaryArtwork, generalized past Facets.
   */
  async function requestArtwork(params: ArtRequestParams): Promise<boolean> {
    const src = params.src
    if (!src || requesting[src]) return false
    markRequesting(src)
    try {
      const response = await performFetch<{ targetPath?: string }>(
        '/api/conductor/art-request',
        {
          method: 'POST',
          body: JSON.stringify(params),
        },
      )
      if (!response.success) {
        throw new Error(response.message || 'Art request could not be queued.')
      }
      markRequested(src)
      return true
    } catch (error) {
      markError(
        src,
        error instanceof Error
          ? error.message
          : 'Art request could not be queued.',
      )
      return false
    }
  }

  return {
    requesting,
    requested,
    errors,
    markRequesting,
    markRequested,
    markError,
    isPending,
    isRequesting,
    errorFor,
    requestArtwork,
  }
})
