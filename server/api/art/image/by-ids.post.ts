// /server/api/art/image/by-ids.post.ts
import { createError, defineEventHandler, readBody } from 'h3'
import prisma from '~/server/utils/prisma'
import { errorHandler } from '~/server/utils/error'
import { requireApiUser } from '~/server/utils/authGuard'

type ArtImageIdsBody = {
  ids?: unknown
}

const MAX_IDS = 100

export default defineEventHandler(async (event) => {
  try {
    const auth = await requireApiUser(event)
    const body = await readBody<ArtImageIdsBody>(event)

    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      throw createError({
        statusCode: 400,
        message: 'A JSON body is required.',
      })
    }

    const unknownFields = Object.keys(body).filter((field) => field !== 'ids')

    if (unknownFields.length) {
      throw createError({
        statusCode: 400,
        message: `Unsupported ArtImage lookup fields: ${unknownFields.join(', ')}.`,
      })
    }

    if (!Array.isArray(body.ids) || !body.ids.length) {
      throw createError({
        statusCode: 400,
        message: 'ids must be a non-empty array of positive integers.',
      })
    }

    if (body.ids.length > MAX_IDS) {
      throw createError({
        statusCode: 400,
        message: `ids may contain at most ${MAX_IDS} entries.`,
      })
    }

    const ids = [...new Set(body.ids.map((value) => Number(value)))]

    if (!ids.every((id) => Number.isInteger(id) && id > 0)) {
      throw createError({
        statusCode: 400,
        message: 'ids must contain only positive integers.',
      })
    }

    const artImages = await prisma.artImage.findMany({
      where: {
        id: { in: ids },
        isActive: true,
        ...(auth.isAdmin
          ? {}
          : {
              OR: [{ isPublic: true }, { userId: auth.user.id }],
            }),
      },
      orderBy: {
        id: 'asc',
      },
    })

    event.node.res.statusCode = 200

    return {
      success: true,
      message: 'ArtImages retrieved.',
      data: artImages,
      statusCode: 200,
    }
  } catch (error) {
    const handled = errorHandler(error)
    event.node.res.statusCode = handled.statusCode || 500

    return {
      success: false,
      message: handled.message || 'Failed to retrieve ArtImages.',
      data: null,
      statusCode: event.node.res.statusCode,
    }
  }
})
