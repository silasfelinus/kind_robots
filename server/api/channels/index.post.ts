import { defineEventHandler, readBody } from 'h3'
import type { Channel } from '@prisma/client'
import { errorHandler } from '../utils/error'
import prisma from '../utils/prisma'
import { Prisma } from '@prisma/client'

export default defineEventHandler(async (event) => {
  try {
    const channelData: Partial<Channel> = await readBody(event)

    // Log the incoming channel data to debug
    console.log('Parsed channel data:', channelData)

    // Check if the authorization token matches the userId if provided
    const authHeader = event.req.headers.authorization
    if (
      channelData.userId &&
      !authHeader?.startsWith(`Bearer ${channelData.userId}`)
    ) {
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
        message: 'Missing required fields: userId, label, or title',
        statusCode: 400,
      }
    }

    // Create the channel
    const newChannel = await createChannel(channelData)
    event.node.res.statusCode = 201 // Created
    return { success: true, newChannel, statusCode: 201 }
  } catch (error: unknown) {
    // Check for Prisma-specific errors
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

export async function createChannel(
  channel: Partial<Channel>,
): Promise<Channel> {
  return prisma.channel.create({
    data: {
      userId: channel.userId ?? 0, // Provide a default value for userId
      label: channel.label ?? 'default-label', // Ensure label is always a string
      description: channel.description ?? null, // If description is not provided, default to null
      title: channel.title ?? 'Untitled Channel', // Ensure title is always a string
    },
  })
}
