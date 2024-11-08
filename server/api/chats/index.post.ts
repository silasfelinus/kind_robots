// /server/api/chats/index.post.ts
import { defineEventHandler, readBody, createError } from 'h3'
import prisma from '../utils/prisma'
import { errorHandler } from '../utils/error'
import { validateApiKey } from '../utils/validateKey'
import type { Prisma, Chat } from '@prisma/client'

type ChatResponse = {
  success: boolean
  message?: string
  data?: Chat
  statusCode?: number
}

export default defineEventHandler(async (event): Promise<ChatResponse> => {
  let response: ChatResponse

  try {
    // Validate the API key using the utility function
    const { isValid, user } = await validateApiKey(event)
    if (!isValid || !user) {
      throw createError({
        statusCode: 401,
        message: 'Invalid or expired token.',
      })
    }

    const userId = user.id

    // Read and validate the communication data from the request body
    const chatData = await readBody(event)

    // Check for required fields
    const requiredFields = ['type', 'sender', 'content']
    const missingFields = requiredFields.filter(
      (field) => !chatData[field as keyof typeof chatData],
    )
    if (missingFields.length > 0) {
      throw createError({
        statusCode: 400,
        message: `Missing required fields: ${missingFields.join(', ')}.`,
      })
    }

    // Prepare input data for creating a new communication entry
    const chatInput: Prisma.ChatCreateInput = {
      type: chatData.type,
      sender: chatData.sender,
      recipient: chatData.recipient || null,
      content: chatData.content,
      title: chatData.title || null,
      label: chatData.label || null,
      isPublic: chatData.isPublic ?? false,
      isFavorite: chatData.isFavorite ?? false,
      previousEntryId: chatData.previousEntryId || null,
      imagePath: chatData.imagePath || null,
      User: { connect: { id: userId } },
      ...(chatData.botId && { Bot: { connect: { id: chatData.botId } } }),
      ...(chatData.promptId && {
        Prompt: { connect: { id: chatData.promptId } },
      }),
      ...(chatData.artImageId && {
        ArtImage: { connect: { id: chatData.artImageId } },
      }),
    }

    // Create the chat entry
    const data = await prisma.chat.create({ data: chatInput })

    // Successful creation response
    response = {
      success: true,
      data,
      message: 'chat created successfully.',
      statusCode: 201,
    }
  } catch (error) {
    const handledError = errorHandler(error)
    response = {
      success: false,
      message: handledError.message || 'Failed to create chat entry.',
      data: undefined, // Ensure `data` is undefined in case of error
      statusCode: handledError.statusCode || 500,
    }
  }

  // Set the status code in the response object
  event.node.res.statusCode = response.statusCode || 500
  return response
})
