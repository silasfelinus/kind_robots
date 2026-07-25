// GET /api/facets/catalog
import { defineEventHandler, getQuery } from 'h3'
import { errorHandler } from '~/server/utils/error'
import { getOptionalApiUser } from '~/server/utils/authGuard'
import {
  FACET_TAXONOMIES,
  loadFacetCatalogEntries,
  type FacetTaxonomy,
} from '~/server/utils/facetCatalog'

function truthy(value: unknown): boolean {
  return value === true || value === 'true' || value === '1'
}

function positiveInteger(value: unknown, fallback: number): number {
  const parsed = Number(value)
  return Number.isInteger(parsed) && parsed >= 0 ? parsed : fallback
}

function parseTaxonomies(value: unknown): FacetTaxonomy[] {
  const values = Array.isArray(value) ? value : String(value ?? '').split(',')
  return Array.from(
    new Set(
      values
        .map((entry) => String(entry).trim().toUpperCase())
        .filter((entry): entry is FacetTaxonomy =>
          FACET_TAXONOMIES.includes(entry as FacetTaxonomy),
        ),
    ),
  )
}

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event)
    const auth = await getOptionalApiUser(event)

    const data = await loadFacetCatalogEntries({
      taxonomies: parseTaxonomies(query.taxonomy ?? query.taxonomies),
      includeInactive: truthy(query.includeInactive),
      includeMature: truthy(query.includeMature),
      randomizableOnly: truthy(query.randomizableOnly),
      userId: auth?.user.id,
      isAdmin: auth?.isAdmin ?? false,
      search: typeof query.search === 'string' ? query.search : undefined,
      take: positiveInteger(query.take, 500),
      skip: positiveInteger(query.skip, 0),
    })

    return {
      success: true,
      message: `Loaded ${data.length} canonical Facets.`,
      data,
      statusCode: 200,
    }
  } catch (error) {
    const handled = errorHandler(error)
    event.node.res.statusCode = handled.statusCode ?? 500
    return {
      success: false,
      message: handled.message,
      data: null,
      statusCode: event.node.res.statusCode,
    }
  }
})
