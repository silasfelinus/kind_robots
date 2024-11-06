// /server/api/channels/index.get.ts
import { defineEventHandler } from 'h3'
import type { Channel } from '@prisma/client'
import { errorHandler } from '../utils/error'
import prisma from '../utils/prisma'

export default defineEventHandler(async () => {
  let response

  try {
    const channels = await fetchAllChannels()
    response = {
      success: true,
      data: { channels },
      message: 'Channels fetched successfully.',
      statusCode: 200,
    }
  } catch (error: unknown) {
    const handledError = errorHandler(error)
    response = {
      success: false,
      message: handledError.message || 'Failed to fetch channels.',
      statusCode: handledError.statusCode || 500,
    }
  }

  return response
})

// Function to fetch all Channels
export async function fetchAllChannels(): Promise<Channel[]> {
  return await prisma.channel.findMany()
}
