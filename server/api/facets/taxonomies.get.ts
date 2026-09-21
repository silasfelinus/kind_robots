// GET /api/facets/taxonomies
//
// The index a taxonomy-first Facet gallery opens on: one row per taxonomy with
// how many Facets are in it and one image to put on the tile.
//
// Silas, 2026-09-21: "when we get facets, wouldn't it be better to be getting
// the types first, then loading the appropriate collection when a user selects
// to move down a level?"
//
// Yes, and the index is the part that has to be cheap or the question answers
// itself the wrong way. The gallery previously derived its 26 headings and
// their counts from the whole loaded catalog -- 1,736 rows downloaded to render
// 26 numbers -- so drilling down would have saved the rendering and none of the
// transfer. This does the counting in the database and returns roughly a
// hundredth of the bytes.
//
// Visibility is the SAME predicate loadFacetCatalogEntries applies, deliberately
// duplicated rather than approximated: an index that counts Facets the drill-
// down then refuses to show is worse than no count at all.
import { defineEventHandler, getQuery } from 'h3'
import type { Prisma } from '~/prisma/generated/prisma/client'
import prisma from '~/server/utils/prisma'
import { errorHandler } from '~/server/utils/error'
import { getOptionalApiUser } from '~/server/utils/authGuard'
import {
  viewerShowsMature,
  viewablePackIds,
} from '~/server/utils/contentAccess'
import { FACET_TAXONOMIES } from '~/server/utils/facetCatalog'

function normalizeTaxonomy(value: string | null | undefined): string {
  const normalized = String(value ?? 'OTHER')
    .trim()
    .toUpperCase()
  return (FACET_TAXONOMIES as readonly string[]).includes(normalized)
    ? normalized
    : 'OTHER'
}

function truthy(value: unknown): boolean {
  return value === true || value === 'true' || value === '1'
}

export type FacetTaxonomySummary = {
  taxonomy: string
  count: number
  /** A representative image for the tile, or null when the taxonomy has none. */
  imagePath: string | null
}

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event)
    const auth = await getOptionalApiUser(event)
    const userId = auth?.user.id ?? null
    const isAdmin = auth?.isAdmin ?? false
    const includeInactive = isAdmin && truthy(query.includeInactive)
    const includeMature = viewerShowsMature(
      auth?.user,
      typeof query.includeMature === 'undefined'
        ? undefined
        : truthy(query.includeMature),
    )
    const packIds = userId && !isAdmin ? await viewablePackIds(userId) : []

    const facetWhere: Prisma.FacetWhereInput = {
      ...(includeInactive ? {} : { isActive: true }),
      ...(includeMature ? {} : { isMature: false }),
      ...(isAdmin
        ? {}
        : {
            OR: [
              { isPublic: true },
              ...(userId ? [{ userId }] : []),
              ...(packIds.length ? [{ packId: { in: packIds } }] : []),
            ],
          }),
    }

    /*
     * Two queries, not one per taxonomy. FacetProfile carries the taxonomy and
     * Facet carries visibility and the art, so the join happens here: the
     * visible ids first, then group those.
     */
    const visible = await prisma.facet.findMany({
      where: facetWhere,
      select: { id: true, imagePath: true },
    })
    if (!visible.length) return { success: true, data: [], statusCode: 200 }

    const artById = new Map(visible.map((row) => [row.id, row.imagePath]))
    const profiles = await prisma.facetProfile.findMany({
      where: { facetId: { in: [...artById.keys()] } },
      orderBy: [{ taxonomy: 'asc' }, { sortOrder: 'asc' }],
      select: { facetId: true, taxonomy: true },
    })

    const counts = new Map<string, number>()
    const art = new Map<string, string>()
    for (const profile of profiles) {
      /*
       * Normalized the same way loadFacetCatalogEntries normalizes it: an
       * unrecognized taxonomy becomes OTHER rather than its raw value. Counting
       * the raw value instead would drop those Facets out of the index
       * entirely, since the index only lists known taxonomies -- an undercount
       * that hides rows the drill-down would happily show.
       */
      const taxonomy = normalizeTaxonomy(profile.taxonomy)
      counts.set(taxonomy, (counts.get(taxonomy) ?? 0) + 1)
      // First illustrated Facet in sortOrder wins the tile, so the index looks
      // the same on every load rather than shuffling with the query planner.
      if (!art.has(taxonomy)) {
        const imagePath = (artById.get(profile.facetId) || '').trim()
        if (imagePath) art.set(taxonomy, imagePath)
      }
    }

    // FACET_TAXONOMIES order, so the index reads the same as the drill-down.
    const data: FacetTaxonomySummary[] = FACET_TAXONOMIES.filter((taxonomy) =>
      counts.has(taxonomy),
    ).map((taxonomy) => ({
      taxonomy,
      count: counts.get(taxonomy) ?? 0,
      imagePath: art.get(taxonomy) ?? null,
    }))

    return {
      success: true,
      message: `${data.length} Facet taxonomies.`,
      data,
      statusCode: 200,
    }
  } catch (error: unknown) {
    const handled = errorHandler(error)
    const statusCode = handled.statusCode || 500
    event.node.res.statusCode = statusCode
    return {
      success: false,
      message: handled.message || 'Failed to load Facet taxonomies.',
      data: null,
      statusCode,
    }
  }
})
