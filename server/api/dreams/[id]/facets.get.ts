// GET /api/dreams/:id/facets
import { createError, defineEventHandler } from 'h3'
import prisma from '~/server/utils/prisma'
import { errorHandler } from '~/server/utils/error'
import { getOptionalApiUser } from '~/server/utils/authGuard'
import { loadFacetSummaries } from '~/server/utils/facetAssignments'
import { existsActiveGrant } from '~/server/utils/contentAccess'
import { assertDreamAccess } from '~/server/api/dreams/index'

export default defineEventHandler(async (event) => {
  try {
    const id = Number(event.context.params?.id)
    if (!Number.isInteger(id) || id <= 0) {
      throw createError({ statusCode: 400, message: 'Invalid Dream ID.' })
    }

    const [dream, auth] = await Promise.all([
      prisma.dream.findUnique({
        where: { id },
        select: { id: true, userId: true, isPublic: true, packId: true },
      }),
      getOptionalApiUser(event),
    ])

    if (!dream) {
      throw createError({ statusCode: 404, message: 'Dream not found.' })
    }

    try {
      assertDreamAccess({
        dream,
        userId: auth?.user.id,
        userRole: auth?.user.Role,
        action: 'view',
      })
    } catch (accessError) {
      // Same PACK-Grant fallback as dreams/[id].get.ts (digital-storefront/t-004).
      const packGranted =
        dream.packId != null &&
        auth?.user.id != null &&
        (await existsActiveGrant(auth.user.id, 'PACK', dream.packId))
      if (!packGranted) throw accessError
    }

    const links = await prisma.dreamFacet.findMany({
      where: { dreamId: id },
      select: { facetId: true },
    })

    return {
      success: true,
      data: await loadFacetSummaries(links.map((link) => link.facetId)),
    }
  } catch (error) {
    return errorHandler(error)
  }
})
