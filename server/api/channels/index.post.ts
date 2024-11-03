import { defineEventHandler, readBody } from 'h3'
import type { Channel } from '@prisma/client'
import { errorHandler } from '../utils/error'
import prisma from '../utils/prisma'
import { Prisma } from '@prisma/client'

export default defineEventHandler(async (event) => {
  try {
    const channelData: Partial<Channel> = await readBody(event)

    // Log the incoming channel data for debugging purposes
    console.log('Parsed channel data:', channelData)

    // Check authorization header
    const authHeader = event.req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      event.node.res.statusCode = 401 // Unauthorized
      return {
        success: false,
        message:
          'Authorization token is required in the format "Bearer <token>".',
        statusCode: 401,
      }
    }

    const token = authHeader.split(' ')[1]
    const user = await prisma.user.findFirst({
      where: { apiKey: token },
      select: { id: true },
    })

    if (!user) {
      event.node.res.statusCode = 401 // Unauthorized
      return {
        success: false,
        message: 'Invalid or expired token.',
        statusCode: 401,
      }
    }

    // Verify user ID matches the authenticated user
    if (channelData.userId && channelData.userId !== user.id) {
      event.node.res.statusCode = 403 // Forbidden
      return {
        success: false,
        message: 'User ID does not match the provided authorization token.',
        statusCode: 403,
      }
    }

    // Validate required fields
    if (!channelData.userId || !channelData.label || !channelData.title) {
      event.node.res.statusCode = 400 // Bad Request
      return {
        success: false,
        message: 'Missing required fields: userId, label, or title.',
        statusCode: 400,
      }
    }

    // Create the channel
    const newChannel = await createChannel(channelData)
    event.node.res.statusCode = 201 // Created
    return { success: true, newChannel, statusCode: 201 }
  } catch (error: unknown) {
    // Handle Prisma-specific errors for unique constraints
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (
        error.code === 'P2002' &&
        (error.meta as { target: string[] }).target.includes('label')
      ) {
        event.node.res.statusCode = 409 // Conflict
        return {
          success: false,
          message:
            'Channel label already exists. Please choose a different label.',
          statusCode: 409,
        }
      }
    }

    // Log and return a generic error
    console.error('Error creating channel:', error)
    const { message, statusCode } = errorHandler(error)
    return {
      success: false,
      message: 'Failed to create a new channel',
      error: message,
      statusCode: statusCode || 500,
    }
  }
})

// Helper function to create a new channel
export async function createChannel(
  channel: Partial<Channel>,
): Promise<Channel> {
  return prisma.channel.create({
    data: {
      userId: channel.userId ?? 0, // Ensure userId has a default
      label: channel.label ?? 'default-label', // Provide default label if missing
      description: channel.description ?? null, // Set description to null if not provided
      title: channel.title ?? 'Untitled Channel', // Set a default title if missing
    },
  })
}
