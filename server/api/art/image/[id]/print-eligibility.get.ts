// GET /api/art/image/:id/print-eligibility
import { createError, defineEventHandler } from 'h3'
import prisma from '~/server/utils/prisma'
import { errorHandler } from '~/server/utils/error'
import { getOptionalApiUser } from '~/server/utils/authGuard'
import { checkPrintEligibility } from '../../utils/printEligibility'
import { viewerShowsMature } from '~/server/utils/contentAccess'

export default defineEventHandler(async (event) => {
  try {
    const id = Number(event.context.params?.id)
    if (!Number.isInteger(id) || id <= 0) {
      throw createError({ statusCode: 400, message: 'Invalid ArtImage ID.' })
    }

    const [image, auth] = await Promise.all([
      prisma.artImage.findUnique({
        where: { id },
        select: {
          id: true,
          userId: true,
          isPublic: true,
          isMature: true,
          isActive: true,
          checkpointResourceId: true,
          CheckpointResource: { select: { commercialSafe: true } },
        },
      }),
      getOptionalApiUser(event),
    ])

    if (!image) {
      throw createError({ statusCode: 404, message: 'ArtImage not found.' })
    }

    // Same gap as facets.get.ts: the owner and admin branches jumped the
    // `!image.isMature` clause. Maturity is decided by role, not privilege.
    const canView =
      !(image.isMature && !viewerShowsMature(auth?.user)) &&
      (auth?.isAdmin ||
        (Boolean(auth?.user.id) && image.userId === auth?.user.id) ||
        (image.isPublic && !image.isMature))

    if (!canView) {
      throw createError({
        statusCode: auth ? 403 : 404,
        message: auth
          ? 'You do not have permission to view this ArtImage.'
          : 'ArtImage not found.',
      })
    }

    const result = checkPrintEligibility(image, image.CheckpointResource, {
      userId: auth?.user.id ?? null,
      isAdmin: auth?.isAdmin,
    })

    return { success: true, data: result }
  } catch (error) {
    const handled = errorHandler(error)
    event.node.res.statusCode = handled.statusCode ?? 500
    return { ...handled, statusCode: event.node.res.statusCode }
  }
})
