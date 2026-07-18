// /server/api/art/image/connections/[id].patch.ts
import { createError, defineEventHandler, readBody } from 'h3'
import type { Prisma } from '~/prisma/generated/prisma/client'
import prisma from '../../../../utils/prisma'
import { errorHandler } from '../../../../utils/error'
import { requireApiUser } from '../../../../utils/authGuard'

type ArtCollectionConnectionBody = {
  artCollectionIds?: unknown
  disconnectArtCollectionIds?: unknown
  clearArtCollections?: unknown
}

const ALLOWED_FIELDS = new Set([
  'artCollectionIds',
  'disconnectArtCollectionIds',
  'clearArtCollections',
])

const MAX_COLLECTION_IDS = 100

function parseIdList(value: unknown, fieldName: string): number[] {
  if (typeof value === 'undefined') return []

  if (!Array.isArray(value)) {
    throw createError({
      statusCode: 400,
      message: `${fieldName} must be an array of positive integers.`,
    })
  }

  if (value.length > MAX_COLLECTION_IDS) {
    throw createError({
      statusCode: 400,
      message: `${fieldName} may contain at most ${MAX_COLLECTION_IDS} IDs.`,
    })
  }

  const ids = value.map((entry) => Number(entry))

  if (!ids.every((id) => Number.isInteger(id) && id > 0)) {
    throw createError({
      statusCode: 400,
      message: `${fieldName} must contain only positive integers.`,
    })
  }

  return [...new Set(ids)]
}

function assertKnownFields(body: Record<string, unknown>): void {
  const unknownFields = Object.keys(body).filter(
    (field) => !ALLOWED_FIELDS.has(field),
  )

  if (unknownFields.length) {
    throw createError({
      statusCode: 400,
      message: `Unsupported ArtImage connection fields: ${unknownFields.join(', ')}. This endpoint manages collection membership only.`,
    })
  }
}

async function readCollections(ids: number[]) {
  if (!ids.length) return []

  const collections = await prisma.artCollection.findMany({
    where: {
      id: { in: ids },
      isActive: true,
    },
    select: {
      id: true,
      userId: true,
    },
  })

  const foundIds = new Set(collections.map((collection) => collection.id))
  const missingIds = ids.filter((id) => !foundIds.has(id))

  if (missingIds.length) {
    throw createError({
      statusCode: 404,
      message: `Art collections not found: ${missingIds.join(', ')}.`,
    })
  }

  return collections
}

export default defineEventHandler(async (event) => {
  const imageId = Number(event.context.params?.id)

  try {
    if (!Number.isInteger(imageId) || imageId <= 0) {
      throw createError({
        statusCode: 400,
        message: 'Invalid ArtImage ID. It must be a positive integer.',
      })
    }

    const auth = await requireApiUser(event)
    const image = await prisma.artImage.findUnique({
      where: { id: imageId },
      select: {
        id: true,
        userId: true,
      },
    })

    if (!image) {
      throw createError({
        statusCode: 404,
        message: `ArtImage #${imageId} not found.`,
      })
    }

    if (!auth.isAdmin && image.userId !== auth.user.id) {
      throw createError({
        statusCode: 403,
        message: 'You are not allowed to change this image’s collections.',
      })
    }

    const body = await readBody<ArtCollectionConnectionBody>(event)

    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      throw createError({
        statusCode: 400,
        message: 'A JSON object is required.',
      })
    }

    const record = body as Record<string, unknown>
    assertKnownFields(record)

    const connectIds = parseIdList(body.artCollectionIds, 'artCollectionIds')
    const disconnectIds = parseIdList(
      body.disconnectArtCollectionIds,
      'disconnectArtCollectionIds',
    )
    const clearCollections = body.clearArtCollections === true

    if (
      typeof body.clearArtCollections !== 'undefined' &&
      typeof body.clearArtCollections !== 'boolean'
    ) {
      throw createError({
        statusCode: 400,
        message: 'clearArtCollections must be a boolean.',
      })
    }

    if (!connectIds.length && !disconnectIds.length && !clearCollections) {
      throw createError({
        statusCode: 400,
        message: 'No collection connection changes were provided.',
      })
    }

    const overlappingIds = connectIds.filter((id) => disconnectIds.includes(id))

    if (overlappingIds.length) {
      throw createError({
        statusCode: 400,
        message: `Collection IDs cannot be connected and disconnected together: ${overlappingIds.join(', ')}.`,
      })
    }

    const referencedCollections = await readCollections([
      ...new Set([...connectIds, ...disconnectIds]),
    ])

    if (!auth.isAdmin && connectIds.length) {
      const connectIdSet = new Set(connectIds)
      const unauthorizedIds = referencedCollections
        .filter(
          (collection) =>
            connectIdSet.has(collection.id) &&
            collection.userId !== auth.user.id,
        )
        .map((collection) => collection.id)

      if (unauthorizedIds.length) {
        throw createError({
          statusCode: 403,
          message: `You may only add images to your own collections. Refused collection IDs: ${unauthorizedIds.join(', ')}.`,
        })
      }
    }

    const data: Prisma.ArtImageUpdateInput = {
      ArtCollections: {
        ...(clearCollections ? { set: [] } : {}),
        ...(connectIds.length
          ? { connect: connectIds.map((id) => ({ id })) }
          : {}),
        ...(disconnectIds.length
          ? { disconnect: disconnectIds.map((id) => ({ id })) }
          : {}),
      },
    }

    const updated = await prisma.artImage.update({
      where: { id: imageId },
      data,
    })

    event.node.res.statusCode = 200

    return {
      success: true,
      message: `ArtImage #${imageId} collection membership updated.`,
      data: updated,
      statusCode: 200,
    }
  } catch (error: unknown) {
    const handled = errorHandler(error)

    event.node.res.statusCode = handled.statusCode || 500

    return {
      success: false,
      message:
        handled.message ||
        `Failed to update ArtImage #${Number.isInteger(imageId) ? imageId : 'unknown'} collections.`,
      data: null,
      statusCode: event.node.res.statusCode,
    }
  }
})
