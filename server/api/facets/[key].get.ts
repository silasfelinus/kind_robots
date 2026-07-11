// /server/api/facets/[key].get.ts
import { createError, defineEventHandler, getRouterParam } from 'h3'
import { errorHandler } from '~/server/utils/error'
import { resolveFacetAlias } from '~/server/utils/facetAliases'

export default defineEventHandler(async (event) => {
  try {
    const requested = getRouterParam(event, 'key')?.trim()

    if (!requested) {
      throw createError({ statusCode: 400, message: 'Facet slug or alias is required.' })
    }

    const resolved = await resolveFacetAlias(requested)

    if (!resolved) {
      throw createError({ statusCode: 404, message: 'Facet not found.' })
    }

    event.node.res.statusCode = 200

    return {
      success: true,
      message: 'Facet fetched successfully.',
      data: {
        ...resolved.facet,
        aliases: resolved.aliases.map((entry) => entry.alias),
        resolution: {
          requested,
          lookupKey: resolved.lookupKey,
          matchedAlias: resolved.matchedAlias,
          canonicalSlug: resolved.facet.slug,
          isCanonicalMatch: resolved.isCanonicalMatch,
        },
      },
      statusCode: 200,
    }
  } catch (error: unknown) {
    const handled = errorHandler(error)
    const statusCode = handled.statusCode ?? 500
    event.node.res.statusCode = statusCode

    return { ...handled, statusCode }
  }
})
