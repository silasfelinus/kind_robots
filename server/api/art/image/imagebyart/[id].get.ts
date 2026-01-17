// /server/api/art/image/imagebyart/[id].get.ts
import { defineEventHandler } from 'h3'
import prisma from '~/server/utils/prisma'
import { errorHandler } from '~/server/utils/error'

export default defineEventHandler(async (event) => {
  try {
    const artId = Number(event.context.params?.id)

    if (isNaN(artId) || artId <= 0) {
      return errorHandler({
        success: false,
        message: 'Invalid art ID provided',
        statusCode: 400,
      })
    }

    const data = await prisma.artImage.findUnique({
      where: { artId },
    })

    if (!data) {
      return errorHandler({
        success: false,
        message: `ArtImage with artId ${artId} not found`,
        statusCode: 404,
      })
    }

    return { success: true, data }
  } catch (error) {
    return errorHandler({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : 'Unknown error occurred while fetching the art image',
      statusCode: 500,
    })
  }
})
