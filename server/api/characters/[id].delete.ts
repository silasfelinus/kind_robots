import { defineEventHandler, createError } from 'h3'
import { errorHandler } from '../utils/error'
import { validateApiKey } from '../utils/validateKey'
import prisma from '../utils/prisma'

export default defineEventHandler(async (event) => {
  let response
  let id

  try {
    // Validate and parse the character ID
    id = Number(event.context.params?.id)
    if (isNaN(id) || id <= 0) {
      throw createError({
        statusCode: 400,
        message: 'Invalid Character ID. It must be a positive integer.',
      })
    }

    console.log(`Attempting to delete Character with ID: ${id}`)

    // Use validateApiKey to authenticate
    const { isValid, user } = await validateApiKey(event)
    if (!isValid || !user) {
      throw createError({
        statusCode: 401,
        message: 'Invalid or expired token.',
      })
    }

    const userId = user.id

    // Fetch the character entry and verify ownership
    const character = await prisma.character.findUnique({
      where: { id },
      select: { userId: true },
    })

    if (!character) {
      throw createError({
        statusCode: 404,
        message: `Character with ID ${id} does not exist.`,
      })
    }

    // Check if user is an admin
    if (user.Role === 'ADMIN') {
      // Admin bypass: Delete the character entry directly
      await prisma.character.delete({ where: { id } })
      return {
        success: true,
        message: `Character with ID ${id} deleted successfully by admin.`,
      }
    }

    // Verify if the user is the owner of the character
    if (character.userId !== userId) {
      throw createError({
        statusCode: 403,
        message: 'You are not authorized to delete this character.',
      })
    }

    // Proceed to delete the character
    await prisma.character.delete({ where: { id } })

    console.log(`Character with ID ${id} successfully deleted`)
    response = {
      success: true,
      message: `Character with ID ${id} successfully deleted.`,
      statusCode: 200,
    }
    event.node.res.statusCode = 200
  } catch (error: unknown) {
    const handledError = errorHandler(error)
    console.error('Error while deleting Character:', handledError)

    // Set the status code and response message based on the handled error
    event.node.res.statusCode = handledError.statusCode || 500
    response = {
      success: false,
      message: handledError.message || `Failed to delete Character with ID ${id}.`,
      statusCode: event.node.res.statusCode,
    }
  }

  return response
})
