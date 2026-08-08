// /server/api/facets/[id].get.ts
import { createError, defineEventHandler, getRouterParam } from 'h3'
import { errorHandler } from '~/server/utils/error'
import { getOptionalApiUser } from '~/server/utils/authGuard'
import { canView } from '~/server/utils/contentAccess'
import { resolveFacetAlias } from '~/server/utils/facetAliases'

export default defineEventHandler(async (event) => {
  try {
    const requested = getRouterParam(event, 'id')?.trim()

    if (!requested) {
      throw createError({
        statusCode: 400,
        message: 'Facet slug or alias is required.',
      })
    }

    const [resolved, auth] = await Promise.all([
      resolveFacetAlias(requested),
      getOptionalApiUser(event),
    ])

    if (!resolved || !resolved.facet.isActive) {
      throw createError({ statusCode: 404, message: 'Facet not found.' })
    }

    const isOwner =
      Boolean(auth?.user.id) && resolved.facet.userId === auth?.user.id
    const hasAccess = await canView(resolved.facet, null, auth?.user)
    const maturityAllowed =
      !resolved.facet.isMature || Boolean(auth?.isAdmin) || isOwner

    if (!hasAccess || !maturityAllowed) {
      throw createError({
        statusCode: auth ? 403 : 404,
        message: auth
          ? 'You do not have permission to view this Facet.'
          : 'Facet not found.',
      })
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
