// /server/api/sheets/by-dream/[dreamId].get.ts
import { defineEventHandler, createError } from 'h3'
import prisma from '@/server/utils/prisma'
import { errorHandler } from '@/server/utils/error'
import { validateApiKey } from '@/server/utils/validateKey'

export default defineEventHandler(async (event) => {
  let dreamId = 0

  try {
    dreamId = Number(event.context.params?.dreamId)
    if (Number.isNaN(dreamId) || dreamId <= 0) {
      throw createError({ statusCode: 400, message: 'Invalid Dream ID. Must be a positive integer.' })
    }

    const { isValid, user } = await validateApiKey(event)
    const data = await prisma.pitchSheet.findUnique({
      where: { dreamId },
      include: {
        Dream: true,
        Project: true,
        ArtImage: {
          select: {
            id: true,
            imagePath: true,
            thumbnailData: true,
            fileName: true,
            fileType: true,
          },
        },
      },
    })

    if (!data) {
      throw createError({ statusCode: 404, message: `PitchSheet for Dream ${dreamId} not found.` })
    }

    const isOwner =
      data.userId === user?.id ||
      data.Dream?.userId === user?.id ||
      data.Project?.userId === user?.id
    const canView =
      data.isPublic &&
      (data.Dream?.isPublic ?? data.Project?.isPublic ?? false)
    if (!canView && (!isValid || !user || (user.Role !== 'ADMIN' && !isOwner))) {
      throw createError({ statusCode: 403, message: 'You are not authorized to view this PitchSheet.' })
    }

    event.node.res.statusCode = 200
    return {
      success: true,
      message: 'PitchSheet fetched successfully.',
      data,
      statusCode: 200,
    }
  } catch (error) {
    const handled = errorHandler(error)
    event.node.res.statusCode = handled.statusCode || 500
    return {
      success: false,
      message: handled.message || `Failed to fetch PitchSheet for Dream ${dreamId}.`,
      data: null,
      statusCode: event.node.res.statusCode,
    }
  }
})
