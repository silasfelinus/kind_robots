// /server/api/chats/index.post.ts
import { defineEventHandler, readBody, createError } from 'h3'
import prisma from '../../utils/prisma'
import { errorHandler } from '../../utils/error'
import { validateApiKey } from '../../utils/validateKey'
import type { Prisma, Communication } from '@prisma/client'

type CommunicationResponse = {
  success: boolean
  message?: string
  data?: Communication
  statusCode?: number
}

export default defineEventHandler(async (event): Promise<CommunicationResponse> => {
  let response: CommunicationResponse

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
    const communicationData = await readBody(event)

    // Check for required fields
    const requiredFields = ['type', 'sender', 'content']
    const missingFields = requiredFields.filter(
      (field) => !communicationData[field as keyof typeof communicationData]
    )
    if (missingFields.length > 0) {
      throw createError({
        statusCode: 400,
        message: `Missing required fields: ${missingFields.join(', ')}.`,
      })
    }

    // Prepare input data for creating a new communication entry
    const communicationInput: Prisma.CommunicationCreateInput = {
      type: communicationData.type,
      sender: communicationData.sender,
      recipient: communicationData.recipient || null,
      content: communicationData.content,
      title: communicationData.title || null,
      label: communicationData.label || null,
      isPublic: communicationData.isPublic ?? false,
      isFavorite: communicationData.isFavorite ?? false,
      previousEntryId: communicationData.previousEntryId || null,
      imagePath: communicationData.imagePath || null,
      User: { connect: { id: userId } },
      ...(communicationData.botId && { Bot: { connect: { id: communicationData.botId } } }),
      ...(communicationData.channelId && { Channel: { connect: { id: communicationData.channelId } } }),
      ...(communicationData.promptId && { Prompt: { connect: { id: communicationData.promptId } } }),
      ...(communicationData.artImageId && { ArtImage: { connect: { id: communicationData.artImageId } } }),
    }

    // Create the communication entry
    const newCommunication = await prisma.communication.create({ data: communicationInput })

    // Successful creation response
    response = {
      success: true,
      data: newCommunication,
      message: 'Communication created successfully.',
      statusCode: 201,
    }
  } catch (error) {
    const handledError = errorHandler(error)
    response = {
      success: false,
      message: handledError.message || 'Failed to create communication entry.',
      data: undefined, // Ensure `data` is undefined in case of error
      statusCode: handledError.statusCode || 500,
    }
  }

  // Set the status code in the response object
  event.node.res.statusCode = response.statusCode || 500
  return response
})
