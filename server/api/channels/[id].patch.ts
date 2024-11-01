import { defineEventHandler, createError, readBody } from 'h3'
import type { Channel } from '@prisma/client'
import prisma from '../utils/prisma'
import { errorHandler } from '../utils/error'
import { verifyJwtToken } from '../auth'

export default defineEventHandler(async (event) => {
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
    const verificationResult = await verifyJwtToken(token)
    if (!verificationResult || !verificationResult.userId) {
      throw createError({
        statusCode: 401,
        message: 'Invalid or expired token.',
      })
    }

    // Fetch the channel to ensure it exists and belongs to the user
    const channel = await prisma.channel.findUnique({ where: { id } })
    if (!channel) {
      throw createError({
        statusCode: 404,
        message: `Channel with ID ${id} not found.`,
      })
    }

    // Verify ownership of the channel
    if (channel.userId !== verificationResult.userId) {
      throw createError({
        statusCode: 403,
        message: 'You do not have permission to update this channel.',
      })
    }

    // Read and validate the body data
    const updatedChannelData: Partial<Channel> = await readBody(event)
    if (!updatedChannelData || Object.keys(updatedChannelData).length === 0) {
      throw createError({
        statusCode: 400,
        message: 'No data provided for update.',
      })
    }

    // Update the channel with validated data
    const updatedChannel = await updateChannel(id, updatedChannelData)
    return {
      success: true,
      updatedChannel,
      statusCode: 200, // Explicitly setting statusCode for Cypress testing
    }
  } catch (error: unknown) {
    const handledError = errorHandler(error)
    return {
      success: false,
      message:
        handledError.message || `Failed to update channel with ID ${id}.`,
      statusCode: handledError.statusCode || 500,
    }
  }
})

// Function to update an existing Channel by ID
export async function updateChannel(
  id: number,
  updatedChannel: Partial<Channel>,
): Promise<Channel | null> {
  try {
    return await prisma.channel.update({
      where: { id },
      data: updatedChannel,
    })
  } catch (error: unknown) {
    throw errorHandler(error)
  }
}
