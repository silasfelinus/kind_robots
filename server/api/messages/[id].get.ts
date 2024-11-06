// /server/api/messages/[id].get.ts
import { defineEventHandler, createError, setResponseStatus } from 'h3'
import { errorHandler } from '../utils/error'
import prisma from '../utils/prisma'

interface MessageResponse {
  success: boolean
  message: string
}

export default defineEventHandler(async (event): Promise<MessageResponse> => {
  let response: MessageResponse
  let id: number | undefined // Initialize id as possibly undefined

  try {
    // Validate and parse the Message ID
    id = Number(event.context.params?.id)
    if (isNaN(id) || id <= 0) {
      throw createError({
        statusCode: 400,
        message: 'Invalid Message ID. It must be a positive integer.',
      })
    }

    // Extract and verify the authorization token
    const authorizationHeader = event.node.req.headers['authorization']
    if (!authorizationHeader || !authorizationHeader.startsWith('Bearer ')) {
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
      throw createError({
        statusCode: 401,
        message: 'Invalid or expired token.',
      })
    }

    const userId = user.id

    // Verify the message exists and check ownership
    const message = await prisma.message.findUnique({
      where: { id },
      select: { userId: true },
    })

    if (!message) {
      throw createError({
        statusCode: 404,
        message: `Message with ID ${id} does not exist.`,
      })
    }

    if (message.userId !== userId) {
      throw createError({
        statusCode: 403,
        message: 'You do not have permission to delete this message.',
      })
    }

    // Perform the delete operation
    await prisma.message.delete({ where: { id } })

    // Successful deletion response
    response = {
      success: true,
      message: `Message with ID ${id} successfully deleted.`,
    }
    setResponseStatus(event, 200)
  } catch (error: unknown) {
    const handledError = errorHandler(error)
    console.error('Error deleting message:', handledError)

    // Set the response and status code based on the handled error
    setResponseStatus(event, handledError.statusCode || 500)
    response = {
      success: false,
      message:
        handledError.message ||
        `Failed to delete message with ID ${id ?? 'unknown'}.`,
    }
  }

  return response
})
