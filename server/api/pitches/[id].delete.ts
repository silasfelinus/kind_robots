// /server/api/pitches/[id].delete.ts
import { defineEventHandler, createError } from 'h3'
import { errorHandler } from '../utils/error'
import { validateApiKey } from '../utils/validateKey'
import prisma from '../utils/prisma'

export default defineEventHandler(async (event) => {
  let response
  let id

  try {
    // Validate and parse the pitch ID
    id = Number(event.context.params?.id)
    if (isNaN(id) || id <= 0) {
      throw createError({
        statusCode: 400,
        message: 'Invalid Pitch ID. It must be a positive integer.',
      })
    }

    console.log(`Attempting to delete Pitch with ID: ${id}`)

    // Use validateApiKey to authenticate
    const { isValid, user } = await validateApiKey(event)
    if (!isValid || !user) {
      throw createError({
        statusCode: 401,
        message: 'Invalid or expired token.',
      })
    }

    const userId = user.id

    // Fetch the pitch entry and verify ownership
    const pitch = await prisma.pitch.findUnique({
      where: { id },
      select: { userId: true },
    })

    if (!pitch) {
      throw createError({
        statusCode: 404,
        message: `Pitch with ID ${id} does not exist.`,
      })
    }

// Check if user is an admin
    if (user.Role === 'ADMIN') {
      // Admin bypass: Delete the pitch entry directly
      await prisma.pitch.delete({ where: { id } })
      return {
        success: true,
        message: `Pitch entry with ID ${id} deleted successfully by admin.`,
      }
    }

    if (pitch.userId !== userId) {
      throw createError({
        statusCode: 403,
        message: 'You are not authorized to delete this pitch.',
      })
    }

    // Proceed to delete the pitch
    await prisma.pitch.delete({ where: { id } })

    console.log(`Pitch with ID ${id} successfully deleted`)
    response = {
      success: true,
      message: `Pitch with ID ${id} successfully deleted.`,
      statusCode: 200,
    }
    event.node.res.statusCode = 200
  } catch (error: unknown) {
    const handledError = errorHandler(error)
    console.error('Error while deleting Pitch:', handledError)

    // Set the status code and response message based on the handled error
    event.node.res.statusCode = handledError.statusCode || 500
    response = {
      success: false,
      message: handledError.message || `Failed to delete Pitch with ID ${id}.`,
      statusCode: event.node.res.statusCode,
    }
  }

  return response
})
