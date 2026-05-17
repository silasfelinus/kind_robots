// /server/api/art/collection/[id].patch.ts
import { defineEventHandler, createError, readBody } from 'h3'
import type { Prisma } from '~/prisma/generated/prisma/client'
import prisma from '../../../utils/prisma'
import { errorHandler } from '../../../utils/error'
import { validateApiKey } from '../../../utils/validateKey'

type PatchCollectionBody = {
  label?: unknown
  description?: unknown
  isPublic?: unknown
  isMature?: unknown
  artIds?: unknown
  addArtIds?: unknown
  removeArtIds?: unknown
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

async function assertArtIdsExist(artIds: number[], fieldName: string) {
  if (!artIds.length) return

  const validArt = await prisma.art.findMany({
    where: {
      id: {
        in: artIds,
      },
    },
    select: {
      id: true,
    },
  })

  const validIds = new Set(validArt.map((art) => art.id))
  const missing = artIds.filter((id) => !validIds.has(id))

  if (missing.length) {
    throw createError({
      statusCode: 404,
      message: `Missing art IDs in ${fieldName}: ${missing.join(', ')}`,
    })
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

    const artIds = normalizeIdArray(body.artIds, 'artIds')
    const addArtIds = normalizeIdArray(body.addArtIds, 'addArtIds')
    const removeArtIds = normalizeIdArray(body.removeArtIds, 'removeArtIds')

    const mode = typeof body.mode === 'string' ? body.mode : 'replace'

    if (artIds.length && mode === 'add') {
      await assertArtIdsExist(artIds, 'artIds')

      updateData.art = {
        connect: artIds.map((id) => ({ id })),
      }
    } else if (artIds.length) {
      await assertArtIdsExist(artIds, 'artIds')

      updateData.art = {
        set: artIds.map((id) => ({ id })),
      }
    }

    if (addArtIds.length) {
      await assertArtIdsExist(addArtIds, 'addArtIds')

      const existingArtUpdate =
        updateData.art && typeof updateData.art === 'object'
          ? updateData.art
          : {}

      updateData.art = {
        ...existingArtUpdate,
        connect: addArtIds.map((id) => ({ id })),
      }
    }

    if (removeArtIds.length) {
      await assertArtIdsExist(removeArtIds, 'removeArtIds')

      const existingArtUpdate =
        updateData.art && typeof updateData.art === 'object'
          ? updateData.art
          : {}

      updateData.art = {
        ...existingArtUpdate,
        disconnect: removeArtIds.map((id) => ({ id })),
      }
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
      include: {
        art: true,
        ArtImages: true,
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
