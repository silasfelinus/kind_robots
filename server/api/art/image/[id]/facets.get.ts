// GET /api/art/image/:id/facets
import { createError, defineEventHandler } from 'h3'
import prisma from '~/server/utils/prisma'
import { errorHandler } from '~/server/utils/error'
import { getOptionalApiUser } from '~/server/utils/authGuard'
import { loadFacetSummaries } from '~/server/utils/facetAssignments'

export default defineEventHandler(async (event) => {
  try {
    const id = Number(event.context.params?.id)
    if (!Number.isInteger(id) || id <= 0) {
      throw createError({ statusCode: 400, message: 'Invalid ArtImage ID.' })
    }

    const [image, auth] = await Promise.all([
      prisma.artImage.findUnique({
        where: { id },
        select: { id: true, userId: true, isPublic: true, isMature: true },
      }),
      getOptionalApiUser(event),
    ])

    if (!image) {
      throw createError({ statusCode: 404, message: 'ArtImage not found.' })
    }

    const isOwner = Boolean(auth?.user.id) && image.userId === auth?.user.id
    const canView =
      auth?.isAdmin || isOwner || (image.isPublic && !image.isMature)

    if (!canView) {
      throw createError({
        statusCode: auth ? 403 : 404,
        message: auth
          ? 'You do not have permission to view this ArtImage.'
          : 'ArtImage not found.',
      })
    }

    const links = await prisma.facetArtImage.findMany({
      where: { artImageId: id },
      select: { facetId: true },
    })

    return {
      success: true,
      data: await loadFacetSummaries(links.map((link) => link.facetId)),
    }
  } catch (error) {
    const handled = errorHandler(error)
    event.node.res.statusCode = handled.statusCode ?? 500
    return { ...handled, statusCode: event.node.res.statusCode }
  }
})
