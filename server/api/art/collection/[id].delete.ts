// server/api/art/collection/[id].delete.ts
import { defineEventHandler, createError } from 'h3'
import { errorHandler } from '../../../utils/error'
import prisma from '../../../utils/prisma'
import { requireApiUser } from '../../../utils/authGuard'

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

    const collection = await prisma.artCollection.findUnique({
      where: { id: collectionId },
      select: { userId: true },
    })

    if (!collection) {
      throw createError({
        statusCode: 404,
        message: `Collection with ID ${collectionId} does not exist.`,
      })
    }

    if (!isAdmin && collection.userId !== user.id) {
      throw createError({
        statusCode: 403,
        message: 'You do not have permission to delete this collection.',
      })
    }

    await prisma.artCollection.delete({ where: { id: collectionId } })

    event.node.res.statusCode = 200
    response = {
      success: true,
      message: isAdmin
        ? `Art Collection with ID ${collectionId} deleted successfully by admin.`
        : `Collection with ID ${collectionId} deleted successfully.`,
      data: null,
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
