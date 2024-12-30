// /server/api/chats/[id].patch.ts
import { defineEventHandler, readBody } from 'h3'
import prisma from '../utils/prisma'
import { errorHandler } from '../utils/error'
import { validateApiKey } from '../utils/validateKey'

export default defineEventHandler(async (event) => {
  let response
  const id = Number(event.context.params?.id)

  if (isNaN(id) || id <= 0) {
    return errorHandler({
      error: new Error('Invalid Chat ID. It must be a positive integer.'),
      context: 'Update Chat',
      statusCode: 400,
    })
  }

  try {
    // Use the utility function to validate the API key
    const { isValid, user } = await validateApiKey(event)
    if (!isValid || !user) {
      return errorHandler({
        error: new Error('Invalid or expired token.'),
        context: 'Update Chat',
        statusCode: 401,
      })
    }

    const userId = user.id

    // Fetch the chat to verify ownership
    const chat = await prisma.chat.findUnique({ where: { id } })
    if (!chat) {
      return errorHandler({
        error: new Error(`Chat with ID ${id} not found.`),
        context: 'Update Chat',
        statusCode: 404,
      })
    }

    if (chat.userId !== userId) {
      return errorHandler({
        error: new Error('You do not have permission to update this chat.'),
        context: 'Update Chat',
        statusCode: 403,
      })
    }

    // Parse and validate the request body
    const updatedChatData = await readBody(event)
    if (!updatedChatData || Object.keys(updatedChatData).length === 0) {
      return errorHandler({
        error: new Error('No data provided for update.'),
        context: 'Update Chat',
        statusCode: 400,
      })
    }

    // Update the chat
    const data = await prisma.chat.update({
      where: { id },
      data: updatedChatData,
    })

console.log("updated chat with: ", data)

    response = {
      success: true,
      message: `Chat with ID ${id} updated successfully.`,
      data,
      statusCode: 200,
    }
    event.node.res.statusCode = 200
  } catch (error: unknown) {
    const handledError = errorHandler({
      error,
      context: 'Update Chat',
    })

    // Explicitly set the status code based on the handled error
    event.node.res.statusCode = handledError.statusCode || 500
    response = {
      success: false,
      message: handledError.message || `Failed to update chat with ID ${id}.`,
      statusCode: event.node.res.statusCode,
    }
  }

  return response
})
