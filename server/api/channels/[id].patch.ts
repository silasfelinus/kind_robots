// /server/api/channels/[id].patch.ts
import { defineEventHandler, createError, readBody } from 'h3'
import prisma from '../utils/prisma'
import { errorHandler } from '../utils/error'

export default defineEventHandler(async (event) => {
  let response
  let id: number | null = null

  try {
    // Validate channel ID
    id = Number(event.context.params?.id)
    if (isNaN(id) || id <= 0) {
      throw createError({
        statusCode: 400,
        message: 'Invalid channel ID.',
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

    // Fetch the channel to ensure it exists and belongs to the user
    const channel = await prisma.channel.findUnique({
      where: { id },
    })
    if (!channel) {
      throw createError({
        statusCode: 404,
        message: `Channel with ID ${id} not found.`,
      })
    }

    if (channel.userId !== userId) {
      throw createError({
        statusCode: 403,
        message: 'You do not have permission to update this channel.',
      })
    }

    // Read and validate the request body
    const updatedChannelData = await readBody(event)
    if (!updatedChannelData || Object.keys(updatedChannelData).length === 0) {
      throw createError({
        statusCode: 400,
        message: 'No data provided for update.',
      })
    }

    // Update the channel with validated data
    const updatedChannel = await prisma.channel.update({
      where: { id },
      data: updatedChannelData,
    })

    response = {
      success: true,
      data: { updatedChannel },
      message: `Channel with ID ${id} updated successfully.`,
      statusCode: 200,
    }
    event.node.res.statusCode = 200
  } catch (error: unknown) {
    const handledError = errorHandler(error)
    console.error(
      `Failed to update channel with ID "${id}": ${
        error instanceof Error ? error.message : 'Unknown error'
      }`,
    )

    // Set the appropriate status code based on the error
    event.node.res.statusCode = handledError.statusCode || 500
    response = {
      success: false,
      message: handledError.message || `Failed to update channel with ID ${id}.`,
      statusCode: event.node.res.statusCode,
    }
  }

  return response
})
