import { createError, defineEventHandler, getRouterParam, readBody } from 'h3'
import prisma from '~/server/utils/prisma'
import { errorHandler } from '~/server/utils/error'
import { requireAdminApiUser } from '~/server/utils/authGuard'

type CollectionBody = {
  addCollectionIds?: number[]
  removeCollectionIds?: number[]
}

function normalizeIds(value: unknown, field: string): number[] {
  if (value === undefined) return []
  if (!Array.isArray(value)) {
    throw createError({ statusCode: 400, message: `${field} must be an array.` })
  }
  const ids = [...new Set(value.map(Number))]
  if (ids.some((id) => !Number.isInteger(id) || id <= 0)) {
    throw createError({ statusCode: 400, message: `${field} must contain positive integer IDs.` })
  }
  return ids
}

export default defineEventHandler(async (event) => {
  try {
    await requireAdminApiUser(event)
    const id = Number(getRouterParam(event, 'id'))
    if (!Number.isInteger(id) || id <= 0) {
      throw createError({ statusCode: 400, message: 'Invalid archive entry id.' })
    }

    const body = await readBody<CollectionBody>(event)
    const addCollectionIds = normalizeIds(body?.addCollectionIds, 'addCollectionIds')
    const removeCollectionIds = normalizeIds(body?.removeCollectionIds, 'removeCollectionIds')
    if (!addCollectionIds.length && !removeCollectionIds.length) {
      throw createError({ statusCode: 400, message: 'At least one collection membership change is required.' })
    }

    const overlap = addCollectionIds.filter((collectionId) => removeCollectionIds.includes(collectionId))
    if (overlap.length) {
      throw createError({ statusCode: 400, message: 'A collection cannot be added and removed in the same request.' })
    }

    const entry = await prisma.archiveEntry.findUnique({
      where: { id },
      select: { artImageId: true, folderCollectionId: true, isActive: true },
    })
    if (!entry) throw createError({ statusCode: 404, message: `Archive entry #${id} not found.` })
    if (!entry.isActive || !entry.artImageId) {
      throw createError({ statusCode: 400, message: 'Archive entry must be active and imported before editing collections.' })
    }
    if (entry.folderCollectionId && removeCollectionIds.includes(entry.folderCollectionId)) {
      throw createError({
        statusCode: 400,
        message: 'The folder-derived collection is managed by the archive path and cannot be removed manually.',
      })
    }

    const requestedIds = [...new Set([...addCollectionIds, ...removeCollectionIds])]
    const collections = await prisma.artCollection.findMany({
      where: { id: { in: requestedIds } },
      select: { id: true, isActive: true },
    })
    if (collections.length !== requestedIds.length || collections.some((collection) => !collection.isActive)) {
      throw createError({ statusCode: 400, message: 'Every requested collection must exist and be active.' })
    }

    const artImage = await prisma.artImage.update({
      where: { id: entry.artImageId },
      data: {
        ArtCollections: {
          ...(addCollectionIds.length ? { connect: addCollectionIds.map((collectionId) => ({ id: collectionId })) } : {}),
          ...(removeCollectionIds.length ? { disconnect: removeCollectionIds.map((collectionId) => ({ id: collectionId })) } : {}),
        },
      },
      select: {
        id: true,
        ArtCollections: {
          select: { id: true, slug: true, label: true, parentFolder: true, isPublic: true, isMature: true, isActive: true },
          orderBy: { label: 'asc' },
        },
      },
    })

    return {
      success: true,
      message: `Archive entry #${id} collection memberships updated.`,
      data: {
        artImageId: artImage.id,
        folderCollectionId: entry.folderCollectionId,
        collections: artImage.ArtCollections,
      },
      statusCode: 200,
    }
  } catch (error: unknown) {
    const handled = errorHandler(error)
    const statusCode = handled.statusCode || 500
    event.node.res.statusCode = statusCode
    return {
      success: false,
      message: handled.message || 'Failed to update archive collection memberships.',
      statusCode,
    }
  }
})
