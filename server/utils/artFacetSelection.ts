// /server/utils/artFacetSelection.ts
import { createError } from 'h3'
import { loadFacetCatalogEntries } from './facetCatalog'
import {
  composeArtPromptWithFacets,
  type ArtFacetPromptEntry,
} from '~/utils/artFacetPrompt'

export type ArtFacetSnapshot = ArtFacetPromptEntry & {
  slug: string | null
  imagePath: string | null
  cardPath: string | null
  heroPath: string | null
}

type JsonRecord = Record<string, unknown>

function asRecord(value: unknown): JsonRecord {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as JsonRecord)
    : {}
}

export function normalizeArtFacetIds(value: unknown): number[] {
  if (!Array.isArray(value)) return []
  return [
    ...new Set(
      value
        .map(Number)
        .filter((id) => Number.isInteger(id) && id > 0),
    ),
  ].slice(0, 50)
}

export function readArtFacetSnapshots(payload: unknown): ArtFacetSnapshot[] {
  const facets = asRecord(payload).facets
  if (!Array.isArray(facets)) return []
  return facets
    .map((value) => asRecord(value))
    .filter((value) => Number.isInteger(Number(value.id)) && Number(value.id) > 0)
    .map((value) => ({
      id: Number(value.id),
      title: String(value.title || '').trim(),
      slug: typeof value.slug === 'string' ? value.slug : null,
      taxonomy: String(value.taxonomy || 'OTHER'),
      canonicalValue:
        typeof value.canonicalValue === 'string' ? value.canonicalValue : null,
      artPrompt: typeof value.artPrompt === 'string' ? value.artPrompt : null,
      imagePath: typeof value.imagePath === 'string' ? value.imagePath : null,
      cardPath: typeof value.cardPath === 'string' ? value.cardPath : null,
      heroPath: typeof value.heroPath === 'string' ? value.heroPath : null,
    }))
}

export function readArtFacetIds(payload: unknown): number[] {
  return normalizeArtFacetIds(readArtFacetSnapshots(payload).map((facet) => facet.id))
}

export async function resolveArtFacetSelection(options: {
  facetIds: unknown
  userId: number
  isAdmin?: boolean
  includeMature?: boolean
}): Promise<ArtFacetSnapshot[]> {
  const facetIds = normalizeArtFacetIds(options.facetIds)
  if (!facetIds.length) return []

  const entries = await loadFacetCatalogEntries({
    facetIds,
    userId: options.userId,
    isAdmin: Boolean(options.isAdmin),
    includeMature: Boolean(options.includeMature),
    includeInactive: false,
  })
  const byId = new Map(entries.map((entry) => [entry.id, entry]))
  const missing = facetIds.filter((id) => !byId.has(id))
  if (missing.length) {
    throw createError({
      statusCode: 400,
      message: `One or more selected Facets are unavailable: ${missing.join(', ')}.`,
    })
  }

  return facetIds.map((id) => {
    const entry = byId.get(id)!
    return {
      id: entry.id,
      title: entry.title,
      slug: entry.slug,
      taxonomy: entry.taxonomy,
      canonicalValue: entry.canonicalValue,
      artPrompt: entry.artPrompt,
      imagePath: entry.imagePath,
      cardPath: entry.cardPath,
      heroPath: entry.heroPath,
    }
  })
}

export function applyArtFacetsToPayload(
  payload: Record<string, unknown>,
  basePromptString: string,
  facets: readonly ArtFacetSnapshot[],
): string {
  const basePrompt = String(basePromptString || '').replace(/\s+/g, ' ').trim()
  const promptString = composeArtPromptWithFacets(basePrompt, facets)
  payload.basePromptString = basePrompt
  payload.promptString = promptString
  payload.facets = facets.map((facet) => ({ ...facet }))
  return promptString
}

export async function updateArtJobFacetSelection(options: {
  payload: JsonRecord
  facetIds: unknown
  basePromptString: string
  userId: number
  isAdmin?: boolean
  includeMature?: boolean
}): Promise<{ facets: ArtFacetSnapshot[]; promptString: string }> {
  const facets = await resolveArtFacetSelection(options)
  const promptString = applyArtFacetsToPayload(
    options.payload,
    options.basePromptString,
    facets,
  )
  return { facets, promptString }
}
