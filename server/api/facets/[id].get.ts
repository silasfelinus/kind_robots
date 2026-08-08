// /server/api/facets/[id].get.ts
import { createError, defineEventHandler, getRouterParam } from 'h3'
import { errorHandler } from '~/server/utils/error'
import { getOptionalApiUser } from '~/server/utils/authGuard'
import { resolveFacetAlias } from '~/server/utils/facetAliases'
import { existsActiveGrant } from '~/server/utils/contentAccess'

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
    const baseAllowed =
      auth?.isAdmin ||
      isOwner ||
      (resolved.facet.isPublic && !resolved.facet.isMature)

    // PACK Grant fallback (digital-storefront/t-004: DLC catalog wiring).
    // Only checked once the base isPublic/own/admin formula has already
    // failed, and it deliberately does not bypass the isMature gate above --
    // a Pack unlock is not a maturity override.
    const packGranted =
      !baseAllowed &&
      resolved.facet.packId != null &&
      auth?.user.id != null &&
      (await existsActiveGrant(auth.user.id, 'PACK', resolved.facet.packId))

    if (!baseAllowed && !packGranted) {
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
