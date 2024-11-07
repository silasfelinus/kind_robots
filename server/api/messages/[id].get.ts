// /server/api/messages/[id].get.ts
import { defineEventHandler, createError, setResponseStatus } from 'h3'
import prisma from '../utils/prisma'
import { errorHandler } from '../utils/error'
import { validateApiKey } from '../utils/validateKey'

interface MessageGetResponse {
  success: boolean
  message: string
  data?: {
    id: number
    content: string
    createdAt: Date
    updatedAt: Date | null // Allow null for compatibility
    userId: number | null
  }
}

export default defineEventHandler(
  async (event): Promise<MessageGetResponse> => {
    let response: MessageGetResponse
    const id = Number(event.context.params?.id)

    try {
      // Validate and parse the Message ID
      if (isNaN(id) || id <= 0) {
        throw createError({
          statusCode: 400,
          message: 'Invalid Message ID. It must be a positive integer.',
        })
      }

      // Use the utility function to validate the API key
      const { isValid, user } = await validateApiKey(event)
      if (!isValid || !user) {
        throw createError({
          statusCode: 401,
          message: 'Invalid or expired token.',
        })
      }

      const userId = user.id

      // Fetch the message and verify ownership
      const message = await prisma.message.findUnique({
        where: { id },
        select: {
          id: true,
          content: true,
          createdAt: true,
          updatedAt: true, // Allowing for possible null value in database schema
          userId: true,
        },
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
          message: 'You do not have permission to view this message.',
        })
      }

      // Successful retrieval response
      response = {
        success: true,
        message: 'Message retrieved successfully.',
        data: message,
      }
      setResponseStatus(event, 200)
    } catch (error: unknown) {
      const handledError = errorHandler(error)
      response = {
        success: false,
        message:
          handledError.message || `Failed to retrieve message with ID ${id}.`,
      }
      setResponseStatus(event, handledError.statusCode || 500)
    }

    return response
  },
)
