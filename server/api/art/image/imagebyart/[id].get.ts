// /server/api/art/image/imagebyart/[id].get.ts
import { defineEventHandler, createError } from 'h3'
import prisma from '~/server/utils/prisma'
import { errorHandler } from '~/server/utils/error'
import {
  buildArtImageWhere,
  getArtImageAccessContext,
} from '~/server/utils/artImageAccess'

export default defineEventHandler(async (event) => {
  const artImageId = Number(event.context.params?.id)

  try {
    if (!Number.isInteger(artImageId) || artImageId <= 0) {
      throw createError({
        statusCode: 400,
        message: 'Invalid art image ID provided.',
      })
    }

    /*
     * Was a bare findUnique: any ArtImage by id, private and mature alike, to
     * any caller -- and an ArtImage id is a small integer. The same filter the
     * art listings use, applied as an AND on the lookup so an image the viewer
     * may not see simply isn't found. Withholding the bytes while confirming
     * the row exists is not privacy.
     */
    const access = await getArtImageAccessContext(event)

    const data = await prisma.artImage.findFirst({
      where: {
        AND: [{ id: artImageId }, buildArtImageWhere(access)],
      },
    })

    if (!data) {
      throw createError({
        statusCode: 404,
        message: `ArtImage with ID ${artImageId} not found.`,
      })
    }

    return {
      success: true,
      data,
      message: 'ArtImage fetched successfully.',
    }
  } catch (error: unknown) {
    const handled = errorHandler(error)
    event.node.res.statusCode = handled.statusCode || 500

    return {
      success: false,
      data: null,
      message:
        handled.message || `Failed to fetch ArtImage with ID ${artImageId}.`,
    }
  }
})
