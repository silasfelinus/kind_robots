// /server/api/messages/[id].delete.ts
import { defineEventHandler, createError } from 'h3'
import { errorHandler } from '../utils/error'
import prisma from '../utils/prisma'

export default defineEventHandler(async (event) => {
  let response
  let id

  try {
    // Validate and parse the message ID
    id = Number(event.context.params?.id)
    if (isNaN(id) || id <= 0) {
      event.node.res.statusCode = 400
      throw createError({
        statusCode: 400,
        message: 'Invalid Message ID. It must be a positive integer.',
      })
    }

    console.log(`Attempting to delete Message with ID: ${id}`)

    // Extract and verify the authorization token
    const authorizationHeader = event.node.req.headers['authorization']
    if (!authorizationHeader || !authorizationHeader.startsWith('Bearer ')) {
      event.node.res.statusCode = 401
      throw createError({
        statusCode: 401,
        message:
          'Authorization token is required in the format "Bearer <token>".',
      })
    }

    const token = authorizationHeader.split(' ')[1]
    const user = await prisma.user.findFirst({
      where: { apiKey: token },
      select: { id: true },
    })

    if (!user) {
      event.node.res.statusCode = 401
      throw createError({
        statusCode: 401,
        message: 'Invalid or expired token.',
      })
    }

    const userId = user.id

    // Check if the message exists and verify ownership
    const message = await prisma.message.findUnique({
      where: { id },
      select: { userId: true },
    })
    if (!message) {
      event.node.res.statusCode = 404
      throw createError({
        statusCode: 404,
        message: `Message with ID ${id} does not exist.`,
      })
    }

    if (message.userId !== userId) {
      event.node.res.statusCode = 403
      throw createError({
        statusCode: 403,
        message: 'You are not authorized to delete this message.',
      })
    }

    // Proceed to delete the message
    await prisma.message.delete({ where: { id } })

    console.log(`Message with ID ${id} successfully deleted`)
    response = {
      success: true,
      message: `Message with ID ${id} successfully deleted.`,
      statusCode: 200,
    }
    event.node.res.statusCode = 200
  } catch (error: unknown) {
    const handledError = errorHandler(error)
    console.error('Error deleting message:', handledError)

    // Explicitly set the status code based on the handled error
    event.node.res.statusCode = handledError.statusCode || 500
    response = {
      success: false,
      message:
        handledError.message || `Failed to delete message with ID ${id}.`,
      statusCode: event.node.res.statusCode,
    }
  }

  return response
})
