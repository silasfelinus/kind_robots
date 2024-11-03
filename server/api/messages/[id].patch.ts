// /server/api/messages/[id].patch.ts
import { defineEventHandler, createError, readBody } from 'h3'
import type { Message } from '@prisma/client'
import prisma from '../utils/prisma'
import { errorHandler } from '../utils/error'

export default defineEventHandler(async (event) => {
  let response
  let id: number | null = null

  try {
    // Parse and validate the message ID from the URL params
    id = Number(event.context.params?.id)
    if (isNaN(id) || id <= 0) {
      event.node.res.statusCode = 400
      throw createError({
        statusCode: 400,
        message: 'Invalid or missing message ID.',
      })
    }

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

    // Fetch the existing message to verify ownership
    const existingMessage = await prisma.message.findUnique({
      where: { id },
    })

    if (!existingMessage) {
      event.node.res.statusCode = 404
      throw createError({
        statusCode: 404,
        message: 'Message not found.',
      })
    }

    // Verify ownership of the message
    if (existingMessage.userId !== userId) {
      event.node.res.statusCode = 403
      throw createError({
        statusCode: 403,
        message: 'You do not have permission to update this message.',
      })
    }

    // Parse the incoming request body as partial message data
    const updatedMessageData: Partial<Message> = await readBody(event)

    // Ensure that the request body contains valid fields
    if (!updatedMessageData || Object.keys(updatedMessageData).length === 0) {
      event.node.res.statusCode = 400
      throw createError({
        statusCode: 400,
        message: 'No data provided for update.',
      })
    }

    // Update the message in the database
    const updatedMessage = await prisma.message.update({
      where: { id },
      data: updatedMessageData,
    })

    response = {
      success: true,
      message: 'Message updated successfully.',
      updatedMessage,
      statusCode: 200,
    }
    event.node.res.statusCode = 200
  } catch (error: unknown) {
    const handledError = errorHandler(error)
    console.error(
      `Failed to update message with ID "${id}": ${error instanceof Error ? error.message : 'Unknown error'}`,
    )

    // Set appropriate status code based on the error
    event.node.res.statusCode = handledError.statusCode || 500
    response = {
      success: false,
      message:
        handledError.message || `Failed to update message with ID ${id}.`,
      statusCode: event.node.res.statusCode,
    }
  }

  return response
})
