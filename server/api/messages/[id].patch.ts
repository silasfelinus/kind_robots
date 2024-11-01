// server/api/messages/[id].patch.ts
import { defineEventHandler, createError, readBody } from 'h3'
import type { Message } from '@prisma/client'
import prisma from '../utils/prisma'
import { errorHandler } from '../utils/error'
import { verifyJwtToken } from '../auth'

export default defineEventHandler(async (event) => {
  let id: number | null = null

  try {
    // Parse and validate the message ID from the URL params
    id = Number(event.context.params?.id)
    if (isNaN(id) || id <= 0) {
      throw createError({
        statusCode: 400,
        message: 'Invalid or missing message ID.',
      })
    }

    // Extract and validate the JWT token
    const authorizationHeader = event.node.req.headers['authorization']
    if (!authorizationHeader || !authorizationHeader.startsWith('Bearer ')) {
      throw createError({
        statusCode: 401,
        message:
          'Authorization token is required in the format "Bearer <token>".',
      })
    }

    const token = authorizationHeader.split(' ')[1]
    const verificationResult = await verifyJwtToken(token)
    if (!verificationResult || !verificationResult.userId) {
      throw createError({
        statusCode: 401,
        message: 'Invalid or expired token.',
      })
    }

    // Fetch the existing message to verify ownership
    const existingMessage = await prisma.message.findUnique({
      where: { id },
    })

    if (!existingMessage) {
      throw createError({
        statusCode: 404,
        message: 'Message not found.',
      })
    }

    // Verify ownership of the message
    if (existingMessage.userId !== verificationResult.userId) {
      throw createError({
        statusCode: 403,
        message: 'You do not have permission to update this message.',
      })
    }

    // Parse the incoming request body as partial message data
    const updatedMessageData: Partial<Message> = await readBody(event)

    // Ensure that the request body contains valid fields
    if (!updatedMessageData || Object.keys(updatedMessageData).length === 0) {
      throw createError({
        statusCode: 400,
        message: 'No data provided for update.',
      })
    }

    // Update the message in the database
    const updatedMessage = await updateMessage(id, updatedMessageData)

    // Return the updated message
    return {
      success: true,
      updatedMessage,
      statusCode: 200,
    }
  } catch (error: unknown) {
    const handledError = errorHandler(error)
    return {
      success: false,
      message:
        handledError.message || `Failed to update message with ID ${id}.`,
      statusCode: handledError.statusCode || 500,
    }
  }
})

// Function to update an existing Message by ID
export async function updateMessage(
  id: number,
  updatedMessage: Partial<Message>,
): Promise<Message | null> {
  try {
    return await prisma.message.update({
      where: { id },
      data: updatedMessage,
    })
  } catch (error: unknown) {
    throw errorHandler(error)
  }
}
