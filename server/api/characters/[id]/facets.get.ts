// GET /api/characters/:id/facets
import { createError, defineEventHandler } from 'h3'
import prisma from '~/server/utils/prisma'
import { errorHandler } from '~/server/utils/error'
import { getOptionalApiUser } from '~/server/utils/authGuard'
import { loadCharacterFacetCatalog } from '~/server/utils/facetCatalog'

export default defineEventHandler(async (event) => {
  try {
    const id = Number(event.context.params?.id)
    if (!Number.isInteger(id) || id <= 0) {
      throw createError({ statusCode: 400, message: 'Invalid Character ID.' })
    }

    const [character, auth] = await Promise.all([
      prisma.character.findUnique({
        where: { id },
        select: { id: true, userId: true, isPublic: true },
      }),
      getOptionalApiUser(event),
    ])

    if (!character) {
      throw createError({ statusCode: 404, message: 'Character not found.' })
    }

    const canView =
      character.isPublic ||
      auth?.isAdmin ||
      (auth?.user.id != null && character.userId === auth.user.id)

    if (!canView) {
      throw createError({ statusCode: 403, message: 'Character is private.' })
    }

    return {
      success: true,
      message: 'Character Facets loaded.',
      data: await loadCharacterFacetCatalog(id),
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
