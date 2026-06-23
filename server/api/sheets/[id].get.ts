// /server/api/sheets/[id].get.ts
import { defineEventHandler, createError } from 'h3'
import prisma from '@/server/utils/prisma'
import { errorHandler } from '@/server/utils/error'
import { validateApiKey } from '@/server/utils/validateKey'

export default defineEventHandler(async (event) => {
  let id = 0

  try {
    id = Number(event.context.params?.id)
    if (!Number.isInteger(id) || id <= 0) {
      throw createError({
        statusCode: 400,
        message: 'Invalid PitchSheet ID. Must be a positive integer.',
      })
    }

    const { isValid, user } = await validateApiKey(event)

    const data = await prisma.pitchSheet.findUnique({
      where: { id },
      include: {
        Dream: true,
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
      throw createError({
        statusCode: 404,
        message: 'PitchSheet not found.',
      })
    }

    const isOwner = Boolean(
      user && (data.userId === user.id || data.Dream.userId === user.id),
    )
    const canView = data.isPublic && data.Dream.isPublic

    if (
      !canView &&
      (!isValid || !user || (user.Role !== 'ADMIN' && !isOwner))
    ) {
      throw createError({
        statusCode: 403,
        message: 'You are not authorized to view this PitchSheet.',
      })
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
      message: handled.message || `Failed to fetch PitchSheet with ID ${id}.`,
      data: null,
      statusCode: event.node.res.statusCode,
    }
  }
})
