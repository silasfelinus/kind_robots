// /server/api/art/collection/[id].patch.ts
import { defineEventHandler, createError, readBody } from 'h3'
import type { Prisma } from '~/prisma/generated/prisma/client'
import prisma from '../../../utils/prisma'
import { errorHandler } from '../../../utils/error'
import { validateApiKey } from '../../../utils/validateKey'

const artImageListSelect = {
  id: true,
  createdAt: true,
  updatedAt: true,
  userId: true,
  fileName: true,
  fileType: true,
  imagePath: true,
  path: true,
  promptString: true,
  negativePrompt: true,
  checkpoint: true,
  checkpointResourceId: true,
  sampler: true,
  seed: true,
  steps: true,
  cfg: true,
  cfgHalf: true,
  designer: true,
  genres: true,
  isPublic: true,
  isMature: true,
  isActive: true,
  promptId: true,
  serverId: true,
  serverName: true,
  serverUrl: true,
} as const

type PatchCollectionBody = {
  label?: unknown
  description?: unknown
  isPublic?: unknown
  isMature?: unknown
  artImageIds?: unknown
  addArtImageIds?: unknown
  removeArtImageIds?: unknown
  mode?: unknown
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

async function assertArtImageIdsExist(
  artImageIds: number[],
  fieldName: string,
) {
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
      message: `Missing art image IDs in ${fieldName}: ${missing.join(', ')}`,
    })
  }
}

function mergeArtImageRelationUpdate(
  updateData: Prisma.ArtCollectionUpdateInput,
  nextUpdate: Prisma.ArtImageUpdateManyWithoutArtCollectionsNestedInput,
): void {
  const existingUpdate =
    updateData.ArtImages && typeof updateData.ArtImages === 'object'
      ? updateData.ArtImages
      : {}

  updateData.ArtImages = {
    ...existingUpdate,
    ...nextUpdate,
  }
}

export default defineEventHandler(async (event) => {
  let collectionId = 0

  try {
    collectionId = Number(event.context.params?.id)

    if (!Number.isInteger(collectionId) || collectionId <= 0) {
      throw createError({
        statusCode: 400,
        message: 'Invalid collection ID.',
      })
    }

    const { isValid, user } = await validateApiKey(event)

    if (!isValid || !user) {
      throw createError({
        statusCode: 401,
        message: 'Invalid or expired token.',
      })
    }

    const collection = await prisma.artCollection.findUnique({
      where: {
        id: collectionId,
      },
      select: {
        id: true,
        userId: true,
      },
    })

    if (!collection) {
      throw createError({
        statusCode: 404,
        message: 'Collection not found.',
      })
    }

    if (collection.userId !== user.id) {
      throw createError({
        statusCode: 403,
        message: 'Not authorized to update this collection.',
      })
    }

    const body = await readBody<PatchCollectionBody>(event)
    const updateData: Prisma.ArtCollectionUpdateInput = {}

    if (typeof body.label === 'string') {
      updateData.label = body.label.trim()
    }

    if (typeof body.description === 'string') {
      updateData.description = body.description.trim()
    }

    if (typeof body.isPublic === 'boolean') {
      updateData.isPublic = body.isPublic
    }

    if (typeof body.isMature === 'boolean') {
      updateData.isMature = body.isMature
    }

    const artImageIds = normalizeIdArray(body.artImageIds, 'artImageIds')
    const addArtImageIds = normalizeIdArray(
      body.addArtImageIds,
      'addArtImageIds',
    )
    const removeArtImageIds = normalizeIdArray(
      body.removeArtImageIds,
      'removeArtImageIds',
    )

    const mode = typeof body.mode === 'string' ? body.mode : 'replace'

    if (artImageIds.length && mode === 'add') {
      await assertArtImageIdsExist(artImageIds, 'artImageIds')

      mergeArtImageRelationUpdate(updateData, {
        connect: artImageIds.map((id) => ({ id })),
      })
    } else if (artImageIds.length) {
      await assertArtImageIdsExist(artImageIds, 'artImageIds')

      mergeArtImageRelationUpdate(updateData, {
        set: artImageIds.map((id) => ({ id })),
      })
    }

    if (addArtImageIds.length) {
      await assertArtImageIdsExist(addArtImageIds, 'addArtImageIds')

      mergeArtImageRelationUpdate(updateData, {
        connect: addArtImageIds.map((id) => ({ id })),
      })
    }

    if (removeArtImageIds.length) {
      await assertArtImageIdsExist(removeArtImageIds, 'removeArtImageIds')

      mergeArtImageRelationUpdate(updateData, {
        disconnect: removeArtImageIds.map((id) => ({ id })),
      })
    }

    if (!Object.keys(updateData).length) {
      throw createError({
        statusCode: 400,
        message: 'No valid collection updates were provided.',
      })
    }

    const updated = await prisma.artCollection.update({
      where: {
        id: collectionId,
      },
      data: updateData,
      select: {
        id: true,
        createdAt: true,
        updatedAt: true,
        userId: true,
        label: true,
        isMature: true,
        isPublic: true,
        isActive: true,
        artPrompt: true,
        description: true,
        username: true,
        ArtImages: {
          orderBy: {
            id: 'desc',
          },
          select: artImageListSelect,
        },
        _count: {
          select: {
            ArtImages: true,
          },
        },
      },
    })

    return {
      success: true,
      message: 'Collection updated.',
      data: updated,
    }
  } catch (error: unknown) {
    const handledError = errorHandler(error)
    event.node.res.statusCode = handledError.statusCode || 500

    return {
      success: false,
      message:
        handledError.message || `Failed to update collection ${collectionId}.`,
    }
  }
})
