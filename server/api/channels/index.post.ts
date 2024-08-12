// /server/api/channels/index.post.ts
import { defineEventHandler, readBody } from 'h3'
import type { Channel } from '@prisma/client'
import { errorHandler } from '../utils/error'
import prisma from '../utils/prisma'

export default defineEventHandler(async (event) => {
  try {
    const channelData: Partial<Channel> = await readBody(event)
    const newChannel = await createChannel(channelData)
    return { success: true, newChannel }
  }
  catch (error: unknown) {
    return errorHandler(error)
  }
})

// Function to create a new Channel
export async function createChannel(channel: Partial<Channel>): Promise<Channel> {
  try {
    return await prisma.channel.create({
      data: {
        userId: channel.userId || 0,
        label: channel.label || 'global',
        description: channel.description || null,
      },
    })
  }
  catch (error: unknown) {
    throw errorHandler(error)
  }
}
