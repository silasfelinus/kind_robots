// server/api/art/collection/[id].delete.ts
//
// "Delete" moves the folder into the Gallery's Recycle Bin with its images
// still inside it; restoring it brings the whole folder back. Erasing it for
// good is POST /api/art/recycle-bin/purge.
import { defineEventHandler, createError } from 'h3'
import { errorHandler } from '../../../utils/error'
import { requireApiUser } from '../../../utils/authGuard'
import { recycleArtCollection } from '../../../utils/artRecycleBin'

export default defineEventHandler(async (event) => {
  let response
  let collectionId: number | null = null

  try {
    collectionId = Number(event.context.params?.id)

    if (Number.isNaN(collectionId) || collectionId <= 0) {
      throw createError({
        statusCode: 400,
        message: 'Invalid Collection ID. It must be a positive integer.',
      })
    }

    const { user, isAdmin } = await requireApiUser(event)

    const result = await recycleArtCollection(collectionId, {
      id: user.id,
      isAdmin,
    })

    event.node.res.statusCode = 200
    response = {
      success: true,
      message: result.message,
      data: { id: collectionId, recycled: true },
      statusCode: 200,
    }
  } catch (error: unknown) {
    const handledError = errorHandler(error)
    event.node.res.statusCode = handledError.statusCode || 500
    response = {
      success: false,
      message:
        handledError.message ||
        `Failed to delete collection with ID ${collectionId}.`,
      data: null,
      statusCode: event.node.res.statusCode,
    }
  }

  return response
})
