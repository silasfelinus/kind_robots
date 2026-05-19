// /server/api/art/collection/index.post.ts
import { defineEventHandler, readBody, createError } from 'h3'
import prisma from '../../../utils/prisma'
import { errorHandler } from '../../../utils/error'
import { validateApiKey } from '../../../utils/validateKey'

type CreateCollectionBody = {
  artImageIds?: unknown
  label?: unknown
  description?: unknown
  isPublic?: unknown
  isMature?: unknown
  artPrompt?: unknown
}

function normalizeIdArray(value: unknown, fieldName: string): number[] {
  if (typeof value === 'undefined') return []

  if (!Array.isArray(value)) {
    throw createError({
      statusCode: 400,
      message: `${fieldName} must be an array of integers.`,
    })
  }

  const ids = value.map((entry) => Number(entry))

  if (!ids.every((id) => Number.isInteger(id) && id > 0)) {
    throw createError({
      statusCode: 400,
      message: `All ${fieldName} values must be positive integers.`,
    })
  }

  return [...new Set(ids)]
}

async function assertArtImageIdsExist(artImageIds: number[]) {
  if (!artImageIds.length) return

  const validImages = await prisma.artImage.findMany({
    where: {
      id: {
        in: artImageIds,
      },
    },
    select: {
      id: true,
    },
  })

  const validIds = new Set(validImages.map((image) => image.id))
  const missing = artImageIds.filter((id) => !validIds.has(id))

  if (missing.length) {
    throw createError({
      statusCode: 404,
      message: `Missing art image IDs: ${missing.join(', ')}`,
    })
  }
}

export default defineEventHandler(async (event) => {
  try {
    const { isValid, user } = await validateApiKey(event)

    if (!isValid || !user) {
      throw createError({
        statusCode: 401,
        message: 'Invalid or expired token.',
      })
    }

    const body = await readBody<CreateCollectionBody>(event)

    if (!body || typeof body !== 'object') {
      throw createError({
        statusCode: 400,
        message: 'Invalid JSON body.',
      })
    }

    const artImageIds = normalizeIdArray(body.artImageIds, 'artImageIds')
    await assertArtImageIdsExist(artImageIds)

    const label =
      typeof body.label === 'string' && body.label.trim()
        ? body.label.trim()
        : 'untitled collection'

    const description =
      typeof body.description === 'string' ? body.description.trim() : undefined

    const artPrompt =
      typeof body.artPrompt === 'string' ? body.artPrompt.trim() : undefined

    const data = await prisma.artCollection.create({
      data: {
        userId: user.id,
        label,
        description,
        artPrompt,
        isPublic: typeof body.isPublic === 'boolean' ? body.isPublic : true,
        isMature: typeof body.isMature === 'boolean' ? body.isMature : false,
        ArtImages: artImageIds.length
          ? {
              connect: artImageIds.map((id) => ({ id })),
            }
          : undefined,
      },
      include: {
        ArtImages: true,
        _count: {
          select: {
            ArtImages: true,
          },
        },
      },
    })

    event.node.res.statusCode = 201

    return {
      success: true,
      data,
      message: 'Art collection created successfully.',
    }
  } catch (error: unknown) {
    const { message, statusCode } = errorHandler(error)
    event.node.res.statusCode = statusCode || 500

    return {
      success: false,
      message: message || 'Failed to create art collection.',
    }
  }
})
