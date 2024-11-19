// /server/api/art/[id].delete.ts
import { defineEventHandler, createError } from 'h3'
import { errorHandler } from '../utils/error'
import { validateApiKey } from '../utils/validateKey'
import prisma from '../utils/prisma'

export default defineEventHandler(async (event) => {
  const artId = Number(event.context.params?.id)

  try {
    // Validate the Art ID
    if (isNaN(artId) || artId <= 0) {
      throw createError({
        statusCode: 400,
        message: 'Invalid Art ID. It must be a positive integer.',
      })
    }

    // Authenticate API Key
    const { isValid, user } = await validateApiKey(event)
    if (!isValid || !user) {
      throw createError({
        statusCode: 401,
        message:
          'Authorization token is required in the format "Bearer <token>".',
      })
    }


        


    const userId = user.id

    // Fetch the art entry and verify ownership
    const artEntry = await prisma.art.findUnique({
      where: { id: artId },
      select: { userId: true },
    })

    if (!artEntry) {
      throw createError({
        statusCode: 404,
        message: `Art entry with ID ${artId} does not exist.`,
      })
    }

// Check if user is an admin
    if (user.Role === 'ADMIN') {
      // Admin bypass: Delete the art entry directly
      await prisma.art.delete({ where: { id: artId } })
      return {
        success: true,
        message: `Art entry with ID ${artId} deleted successfully by admin.`,
      }
    }

if (user.Role !== 'ADMIN') {
   console.log("user is not admin", user)
    }

    if (artEntry.userId !== userId) {
      throw createError({
        statusCode: 403,
        message: 'You do not have permission to delete this art entry.',
      })
    }

    // Attempt to delete the art entry
    await prisma.art.delete({ where: { id: artId } })

    // Successful deletion response
    event.node.res.setHeader('Content-Type', 'application/json')
    event.node.res.statusCode = 200
    return {
      success: true,
      message: `Art entry with ID ${artId} deleted successfully.`,
    }
  } catch (error: unknown) {
    const handledError = errorHandler(error)
    console.error('Error deleting art entry:', handledError)

    // Set the status code based on the handled error
    event.node.res.setHeader('Content-Type', 'application/json')
    event.node.res.statusCode = handledError.statusCode || 500
    return {
      success: false,
      message: handledError.message || 'Failed to delete art entry.',
    }
  }
})
