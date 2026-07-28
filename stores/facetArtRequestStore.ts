// /stores/facetArtRequestStore.ts
import { reactive } from 'vue'
import { defineStore } from 'pinia'
import { performFetch } from '@/stores/utils'
import type { FacetCatalogEntry } from '@/stores/facetCatalogStore'
import { normalizeFacetLookupKey } from '@/utils/facetAliases'

function safeSegment(value: string): string {
  return (
    normalizeFacetLookupKey(value)
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'facet'
  )
}

export function defaultFacetArtworkPath(facet: FacetCatalogEntry): string {
  return `/images/facets/${safeSegment(facet.taxonomy)}/${safeSegment(
    facet.slug || facet.canonicalValue || facet.title,
  )}.webp`
}

function facetPromptContext(facet: FacetCatalogEntry): string {
  return [
    `Facet title: ${facet.title}`,
    `Taxonomy: ${facet.taxonomy}`,
    facet.canonicalValue ? `Canonical value: ${facet.canonicalValue}` : '',
    facet.groupLabel ? `Group: ${facet.groupLabel}` : '',
    facet.description ? `Description: ${facet.description}` : '',
    facet.flavorText ? `Flavor: ${facet.flavorText}` : '',
    facet.examples ? `Examples: ${facet.examples}` : '',
  ]
    .filter(Boolean)
    .join(' · ')
}

export const useFacetArtRequestStore = defineStore('facetArtRequestStore', () => {
  const requesting = reactive<Record<number, boolean>>({})
  const requested = reactive<Record<number, string>>({})
  const errors = reactive<Record<number, string>>({})

  async function requestPrimaryArtwork(
    facet: FacetCatalogEntry,
  ): Promise<string | null> {
    if (requesting[facet.id]) return null
    requesting[facet.id] = true
    errors[facet.id] = ''
    const src = facet.imagePath || defaultFacetArtworkPath(facet)

    try {
      const response = await performFetch<{ targetPath?: string }>(
        '/api/conductor/art-request',
        {
          method: 'POST',
          body: JSON.stringify({
            src,
            pageUrl:
              typeof window !== 'undefined' ? window.location.href : '/facets',
            label: `${facet.title} ${facet.taxonomy.toLowerCase()} facet`,
            alt: `${facet.title} canonical Facet artwork`,
            variant: 'image',
            size: '1024x1024',
            prompt: facet.artPrompt || undefined,
            pageTitle: 'Facets',
            pageDescription:
              'Browse the canonical creative building blocks shared across Characters, Bots, Dreams, Scenarios, and Art.',
            nearestHeading: facet.title,
            nearbyText: facetPromptContext(facet),
          }),
        },
      )

      if (!response.success) {
        throw new Error(response.message || 'Art request could not be queued.')
      }
      requested[facet.id] = src
      return src
    } catch (error) {
      errors[facet.id] =
        error instanceof Error ? error.message : 'Art request could not be queued.'
      return null
    } finally {
      requesting[facet.id] = false
    }
  }

  return { requesting, requested, errors, requestPrimaryArtwork }
})
